/**
 * Process Builder Registry
 * Auto-discovery and management of process builders
 */

import type { ProcessBuilderMetadata } from './types';

// Cache for discovered process builders
let discoveredBuilders: Map<string, ProcessBuilderMetadata> | null = null;

/**
 * Auto-discover process builders by loading from generated JSON registry
 */
export async function discoverProcessBuilders(): Promise<
  Map<string, ProcessBuilderMetadata>
> {
  if (discoveredBuilders) {
    return discoveredBuilders;
  }

  discoveredBuilders = new Map();

  try {
    // Load from generated registry JSON file
    // This file is created by the build script: scripts/discover-process-builders.ts
    const registryPath = process.env.PROCESS_BUILDERS_REGISTRY_PATH ||
      '../../../../process-builders-registry.json';

    // Try to import the registry (works at build time)
    // For runtime, we'll use a different approach
    try {
      const registryModule = await import(registryPath);
      const registry = registryModule.default || registryModule;

      for (const [id, metadata] of Object.entries(registry)) {
        discoveredBuilders.set(id, metadata as ProcessBuilderMetadata);
      }
    } catch (importError) {
      // If import fails, try reading from file system (for development)
      console.warn(
        'Could not import registry JSON, falling back to runtime discovery',
        importError,
      );
      // Runtime discovery would go here if needed
    }
  } catch (error) {
    console.warn('Failed to auto-discover process builders:', error);
    // Fallback to empty registry
  }

  return discoveredBuilders;
}

/**
 * Get a specific process builder by ID
 */
export async function getProcessBuilder(
  id: string,
): Promise<ProcessBuilderMetadata | null> {
  const builders = await discoverProcessBuilders();
  return builders.get(id) || null;
}

/**
 * Get all discovered process builders
 */
export async function getAllProcessBuilders(): Promise<
  ProcessBuilderMetadata[]
> {
  const builders = await discoverProcessBuilders();
  return Array.from(builders.values());
}

/**
 * Register a process builder (for runtime registration if needed)
 */
export function registerProcessBuilder(metadata: ProcessBuilderMetadata): void {
  if (!discoveredBuilders) {
    discoveredBuilders = new Map();
  }
  discoveredBuilders.set(metadata.id, metadata);
}

