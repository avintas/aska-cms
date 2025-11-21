/**
 * Process Builder Error Handling
 * Utilities for creating and managing process builder errors
 */

import type { ProcessBuilderError } from './types';

/**
 * Common error codes used across process builders
 */
export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  TASK_EXECUTION_FAILED: 'TASK_EXECUTION_FAILED',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Create a ProcessBuilderError with structured information
 */
export function createError(
  code: string,
  message: string,
  taskId?: string,
  details?: unknown,
): ProcessBuilderError {
  return {
    code,
    message,
    taskId,
    details,
  };
}

/**
 * Create a validation error
 */
export function createValidationError(
  message: string,
  details?: unknown,
): ProcessBuilderError {
  return createError(ERROR_CODES.VALIDATION_FAILED, message, undefined, details);
}

/**
 * Create a task execution error
 */
export function createTaskError(
  taskId: string,
  message: string,
  details?: unknown,
): ProcessBuilderError {
  return createError(ERROR_CODES.TASK_EXECUTION_FAILED, message, taskId, details);
}

/**
 * Create a database error
 */
export function createDatabaseError(
  message: string,
  details?: unknown,
): ProcessBuilderError {
  return createError(ERROR_CODES.DATABASE_ERROR, message, undefined, details);
}

/**
 * Format error for display to user
 */
export function formatErrorForDisplay(error: ProcessBuilderError): string {
  if (error.taskId) {
    return `[${error.taskId}] ${error.message}`;
  }
  return error.message;
}

