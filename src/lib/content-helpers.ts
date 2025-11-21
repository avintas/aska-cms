/**
 * Extract JSON object string from a text response (e.g., AI output).
 * Handles responses that may be wrapped in markdown code blocks or conversational text.
 */
export function cleanJsonString(text: string): string {
  const jsonStartIndex = text.indexOf('{');
  const jsonEndIndex = text.lastIndexOf('}');

  if (jsonStartIndex === -1 || jsonEndIndex === -1) {
    // If we can't find a JSON object, return the original text
    // so JSON.parse can fail with a clear error.
    return text;
  }

  return text.substring(jsonStartIndex, jsonEndIndex + 1);
}


