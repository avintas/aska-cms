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
 * Safely serialize an error object for server action responses
 * Extracts only serializable properties from error objects
 */
function serializeError(error: unknown): Record<string, unknown> | string {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      // Include any additional properties that might be useful
      ...(error.cause && { cause: serializeError(error.cause) }),
    };
  }
  if (typeof error === 'object' && error !== null) {
    try {
      // Try to serialize as JSON to ensure it's serializable
      JSON.parse(JSON.stringify(error));
      return error as Record<string, unknown>;
    } catch {
      // If not serializable, return string representation
      return String(error);
    }
  }
  return String(error);
}

/**
 * Create a ProcessBuilderError with structured information
 */
export function createError(
  code: string,
  message: string,
  taskId?: string,
  details?: unknown,
): ProcessBuilderError {
  // Safely serialize error details to ensure server action compatibility
  const serializedDetails = details !== undefined ? serializeError(details) : undefined;
  return {
    code,
    message,
    taskId,
    details: serializedDetails,
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

