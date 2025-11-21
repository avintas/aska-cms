/**
 * Shared Gemini API Error Handler
 * Provides consistent error handling and user-friendly messages for Gemini API errors
 */

/**
 * Parse and format Gemini API errors
 * Handles 429 rate limit errors with user-friendly messages
 */
export function handleGeminiError(error: unknown): {
  success: false;
  error: string;
  errorCode?: string;
  retryable?: boolean;
} {
  // eslint-disable-next-line no-console
  console.error('Gemini API error:', error);

  let errorMessage = 'Unknown error occurred';
  let errorCode: string | undefined;
  const retryable = false;

  if (error instanceof Error) {
    errorMessage = error.message;

    // Try to parse error message if it contains JSON
    try {
      const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedError = JSON.parse(jsonMatch[0]);
        if (parsedError.error) {
          errorCode = parsedError.error.code?.toString();
          const status = parsedError.error.status;

          // Handle 429 Resource Exhausted errors
          if (errorCode === '429' || status === 'RESOURCE_EXHAUSTED') {
            return {
              success: false,
              error:
                'Gemini API rate limit exceeded. The service is temporarily unavailable due to high demand. Please wait and try again.',
              errorCode: '429',
              retryable: true,
            };
          }

          if (parsedError.error.message) {
            errorMessage = parsedError.error.message;
          }
        }
      }
    } catch {
      // ignore parsing errors; fall back to the original message
    }
  }

  return {
    success: false,
    error: errorMessage,
    errorCode,
    retryable,
  };
}


