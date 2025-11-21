/**
 * Shared utility functions
 */

/**
 * Validates if a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Creates an API response object
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string,
): { success: boolean; data?: T; error?: string; message?: string } {
  return {
    success,
    ...(data && { data }),
    ...(error && { error }),
    ...(message && { message }),
  };
}

// Re-export shareables utilities
export * from './shareables-dates';
export * from './shareables-selection';
export {
  getDayOfWeekName,
  getWeekOfYear,
  getSpecialOccasion,
  getSpecialSeason,
} from './shareables-dates';

