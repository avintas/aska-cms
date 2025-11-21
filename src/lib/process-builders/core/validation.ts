/**
 * Process Builder Validation Utilities
 * Functions for validating rules against process builder metadata
 */

import type {
  ProcessBuilderMetadata,
  ProcessBuilderRules,
  ValidationResult,
} from './types';

/**
 * Validate rules against process builder metadata
 */
export function validateRules(
  metadata: ProcessBuilderMetadata,
  rules: ProcessBuilderRules,
): ValidationResult {
  // Check required rules
  const requiredCheck = validateRequiredRules(metadata, rules);
  if (!requiredCheck.valid) {
    return requiredCheck;
  }

  // Check rule types
  const typeCheck = validateRuleTypes(metadata, rules);
  if (!typeCheck.valid) {
    return typeCheck;
  }

  // Check limits
  const limitCheck = validateLimits(metadata, rules);
  if (!limitCheck.valid) {
    return limitCheck;
  }

  return { valid: true };
}

/**
 * Validate that all required rules are present
 */
export function validateRequiredRules(
  metadata: ProcessBuilderMetadata,
  rules: ProcessBuilderRules,
): ValidationResult {
  const missing: string[] = [];

  for (const requiredRule of metadata.requiredRules) {
    if (!rules[requiredRule]) {
      missing.push(requiredRule);
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required rules: ${missing.join(', ')}`,
      details: { missing },
    };
  }

  return { valid: true };
}

/**
 * Validate that rule types match expected types
 */
export function validateRuleTypes(
  metadata: ProcessBuilderMetadata,
  rules: ProcessBuilderRules,
): ValidationResult {
  const typeErrors: string[] = [];

  for (const [key, rule] of Object.entries(rules)) {
    // Check if rule type matches the value type
    const actualType = getValueType(rule.value);
    if (rule.type !== actualType) {
      typeErrors.push(
        `Rule '${key}': expected ${rule.type}, got ${actualType}`,
      );
    }
  }

  if (typeErrors.length > 0) {
    return {
      valid: false,
      error: `Type mismatches: ${typeErrors.join('; ')}`,
      details: { typeErrors },
    };
  }

  return { valid: true };
}

/**
 * Validate numeric limits (min/max)
 */
export function validateLimits(
  metadata: ProcessBuilderMetadata,
  rules: ProcessBuilderRules,
): ValidationResult {
  if (!metadata.limits) {
    return { valid: true };
  }

  const limitErrors: string[] = [];

  for (const [key, limit] of Object.entries(metadata.limits)) {
    const rule = rules[key];
    if (!rule) {
      continue; // Optional rule, skip
    }

    if (rule.type !== 'number') {
      continue; // Only validate numeric rules
    }

    const value = rule.value as number;

    if (limit.min !== undefined && value < limit.min) {
      limitErrors.push(
        `Rule '${key}': value ${value} is below minimum ${limit.min}`,
      );
    }

    if (limit.max !== undefined && value > limit.max) {
      limitErrors.push(
        `Rule '${key}': value ${value} is above maximum ${limit.max}`,
      );
    }
  }

  if (limitErrors.length > 0) {
    return {
      valid: false,
      error: `Limit violations: ${limitErrors.join('; ')}`,
      details: { limitErrors },
    };
  }

  return { valid: true };
}

/**
 * Get the type of a value
 */
function getValueType(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

