/**
 * Extract and clean JSON object string from a text response (e.g., AI output).
 * Handles responses that may be wrapped in markdown code blocks or conversational text.
 * Attempts to repair common JSON syntax errors.
 */
export function cleanJsonString(text: string): string {
  // Step 1: Extract JSON object (between first { and last })
  const jsonStartIndex = text.indexOf('{');
  const jsonEndIndex = text.lastIndexOf('}');

  if (jsonStartIndex === -1 || jsonEndIndex === -1) {
    // If we can't find a JSON object, return the original text
    // so JSON.parse can fail with a clear error.
    return text;
  }

  let json = text.substring(jsonStartIndex, jsonEndIndex + 1);

  // Step 2: Try to repair common JSON issues (conservative approach)
  try {
    // Remove markdown code block markers if present
    json = json.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    // Fix trailing commas before closing brackets/braces (most common issue)
    // Match: comma followed by whitespace and closing bracket/brace
    json = json.replace(/,(\s*[}\]])/g, '$1');

    // Remove any control characters that could break JSON (but keep \n, \r, \t)
    json = json.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    return json.trim();
  } catch {
    // If repair attempts fail, return the extracted JSON as-is
    return json.trim();
  }
}

/**
 * Parse JSON with multiple repair attempts and better error messages
 */
export function parseJsonWithRepair(jsonString: string): { success: true; data: unknown } | { success: false; error: string } {
  // First attempt: parse as-is
  try {
    const parsed = JSON.parse(jsonString);
    return { success: true, data: parsed };
  } catch (error) {
    const parseError = error as SyntaxError;
    const errorMessage = parseError.message || 'Unknown JSON parse error';
    const errorPosition = parseError.message.match(/position (\d+)/)?.[1];

    // Second attempt: try cleaning the string
    try {
      const cleaned = cleanJsonString(jsonString);
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed };
    } catch {
      // Third attempt: try to extract just the items array if it's a structure issue
      try {
        // Look for items array pattern
        const itemsMatch = jsonString.match(/"items"\s*:\s*\[([\s\S]*?)\]/);
        if (itemsMatch) {
          const itemsJson = `{"items": [${itemsMatch[1]}]}`;
          const parsed = JSON.parse(itemsJson);
          return { success: true, data: parsed };
        }
      } catch {
        // All attempts failed
      }

      // Provide helpful error message
      let helpfulError = `JSON parse error: ${errorMessage}`;
      if (errorPosition) {
        const pos = parseInt(errorPosition, 10);
        const start = Math.max(0, pos - 50);
        const end = Math.min(jsonString.length, pos + 50);
        const snippet = jsonString.substring(start, end);
        helpfulError += `\n\nContext around error (position ${pos}):\n${snippet}\n${' '.repeat(Math.min(50, pos - start))}^`;
      }

      return { success: false, error: helpfulError };
    }
  }
}


