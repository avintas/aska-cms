/**
 * Type Helper Utilities
 * Utility types and helper functions
 */

import type { ContentStatus } from './content';

// ========================================================================
// STATUS HELPERS
// ========================================================================

/**
 * Status values as const array (for validation)
 */
export const STATUS_VALUES = ['draft', 'unpublished', 'published', 'archived'] as const;

/**
 * Type guard: Check if value is valid status
 */
export function isValidStatus(value: unknown): value is ContentStatus {
  return STATUS_VALUES.includes(value as ContentStatus);
}

// ========================================================================
// UTILITY TYPES
// ========================================================================

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract only the fields that are not null or undefined
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

