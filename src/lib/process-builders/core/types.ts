/**
 * Process Builder Core Types
 * Base interfaces that ALL process builders implement
 */

/**
 * Goal defines what the process builder should accomplish
 */
export interface ProcessBuilderGoal {
  text: string;
  metadata?: Record<string, unknown>;
}

/**
 * Rule defines a constraint or parameter for the process
 */
export interface ProcessBuilderRule {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

/**
 * Collection of rules that guide the process execution
 */
export interface ProcessBuilderRules {
  [key: string]: ProcessBuilderRule;
}

/**
 * A task is a single step in the process builder workflow
 */
export interface ProcessBuilderTask {
  id: string;
  name: string;
  description: string;
  execute: (context: TaskContext) => Promise<TaskResult>;
  validate?: (context: TaskContext) => Promise<ValidationResult>;
}

/**
 * Context passed between tasks during execution
 */
export interface TaskContext {
  goal: ProcessBuilderGoal;
  rules: ProcessBuilderRules;
  options?: ProcessBuilderOptions;
  previousResults?: TaskResult[];
  metadata?: Record<string, unknown>;
}

/**
 * Result of a task execution
 */
export interface TaskResult {
  success: boolean;
  data?: unknown;
  errors?: ProcessBuilderError[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Options that modify process builder behavior
 */
export interface ProcessBuilderOptions {
  allowPartialResults?: boolean;
  useCache?: boolean;
  dryRun?: boolean;
  [key: string]: unknown;
}

/**
 * Final result of process builder execution
 */
export interface ProcessBuilderResult {
  status: 'success' | 'error' | 'partial';
  processId: string;
  processName: string;
  results: TaskResult[];
  finalResult?: unknown;
  errors?: ProcessBuilderError[];
  warnings?: string[];
  executionTime: number;
  metadata?: Record<string, unknown>;
}

/**
 * Structured error information
 */
export interface ProcessBuilderError {
  code: string;
  message: string;
  taskId?: string;
  details?: unknown;
}

/**
 * Metadata that describes a process builder
 */
export interface ProcessBuilderMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  tasks: string[]; // Task IDs
  requiredRules: string[];
  optionalRules: string[];
  defaults?: Record<string, unknown>;
  limits?: Record<string, { min?: number; max?: number }>;
}

/**
 * Result of validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: unknown;
}

