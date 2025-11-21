/**
 * Process Builder Executor
 * Executes tasks in sequence and manages context between tasks
 */

import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
  ProcessBuilderTask,
  TaskContext,
  TaskResult,
  ProcessBuilderResult,
  ValidationResult,
} from './types';
import { createTaskError } from './errors';

export class ProcessBuilderExecutor {
  private tasks: ProcessBuilderTask[] = [];
  private results: TaskResult[] = [];

  constructor(tasks: ProcessBuilderTask[]) {
    this.tasks = tasks;
  }

  /**
   * Execute all tasks in sequence
   */
  async execute(
    goal: ProcessBuilderGoal,
    rules: ProcessBuilderRules,
    options?: ProcessBuilderOptions,
  ): Promise<ProcessBuilderResult> {
    const startTime = Date.now();
    this.results = [];

    const context: TaskContext = {
      goal,
      rules,
      options,
      previousResults: [],
      metadata: {},
    };

    try {
      // Execute each task in sequence
      for (const task of this.tasks) {
        // Validate task if validator exists
        if (task.validate) {
          const validation: ValidationResult = await task.validate(context);
          if (!validation.valid) {
            throw new Error(
              `Task ${task.id} validation failed: ${validation.error}`,
            );
          }
        }

        // Execute task
        let result: TaskResult;
        try {
          result = await task.execute(context);
        } catch (error) {
          // Wrap unexpected errors
          result = {
            success: false,
            errors: [
              createTaskError(
                task.id,
                error instanceof Error ? error.message : 'Unknown error',
                error,
              ),
            ],
          };
        }

        this.results.push(result);

        // Update context with result
        context.previousResults?.push(result);
        if (result.data) {
          context.metadata = { ...context.metadata, ...result.metadata };
        }

        // Stop on error (unless partial results allowed)
        if (!result.success && !options?.allowPartialResults) {
          break;
        }
      }

      // Determine final status
      const hasErrors = this.results.some((r) => !r.success);
      const allSuccess = this.results.every((r) => r.success);

      const status = allSuccess
        ? 'success'
        : hasErrors && options?.allowPartialResults
          ? 'partial'
          : 'error';

      return {
        status,
        processId: 'unknown', // Will be set by process builder
        processName: 'unknown', // Will be set by process builder
        results: this.results,
        finalResult: this.results[this.results.length - 1]?.data,
        errors: this.results.flatMap((r) => r.errors || []),
        warnings: this.results.flatMap((r) => r.warnings || []),
        executionTime: Date.now() - startTime,
        metadata: context.metadata,
      };
    } catch (error) {
      return {
        status: 'error',
        processId: 'unknown',
        processName: 'unknown',
        results: this.results,
        errors: [
          {
            code: 'EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error,
          },
        ],
        executionTime: Date.now() - startTime,
      };
    }
  }
}

