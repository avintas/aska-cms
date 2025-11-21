/**
 * Content selection utilities for shareables calendarization
 * Handles item selection with frequency control for even distribution
 */

import type { ContentUsageTracker } from '../types/shareables';

/**
 * Creates a new content usage tracker
 * 
 * @param totalItems - Total number of items available
 * @param totalSlots - Total number of slots to fill (days × items_per_day)
 * @returns ContentUsageTracker instance
 */
export function createUsageTracker(
  totalItems: number,
  totalSlots: number
): ContentUsageTracker {
  const maxAppearances = Math.ceil(totalSlots / totalItems);
  
  return {
    usage: new Map<number, number>(),
    max_appearances: maxAppearances,
    total_slots: totalSlots,
    total_items: totalItems,
  };
}

/**
 * Selects items with frequency control for even distribution
 * Ensures no item exceeds max_appearances
 * Prefers items with lower usage counts
 * 
 * @param availableItems - Array of available items (with id field)
 * @param count - Number of items to select
 * @param tracker - ContentUsageTracker tracking usage
 * @returns Array of selected items with display_order assigned
 */
export function selectItemsWithFrequencyControl<T extends { id: number }>(
  availableItems: T[],
  count: number,
  tracker: ContentUsageTracker
): T[] {
  if (availableItems.length === 0 || count <= 0) {
    return [];
  }

  // Filter out items that have reached max appearances
  const available = availableItems.filter((item) => {
    const usageCount = tracker.usage.get(item.id) || 0;
    return usageCount < tracker.max_appearances;
  });

  // If not enough available items, use all available
  if (available.length < count) {
    console.warn(
      `Not enough items available (${available.length}) for requested count (${count}). Using all available items.`
    );
  }

  // Sort by usage count (prefer less-used items)
  const sorted = [...available].sort((a, b) => {
    const usageA = tracker.usage.get(a.id) || 0;
    const usageB = tracker.usage.get(b.id) || 0;
    return usageA - usageB;
  });

  // Select items (shuffle within same usage level for variety)
  const selected: T[] = [];
  const selectedIds = new Set<number>();

  // Group by usage level
  const usageGroups = new Map<number, T[]>();
  sorted.forEach((item) => {
    const usage = tracker.usage.get(item.id) || 0;
    if (!usageGroups.has(usage)) {
      usageGroups.set(usage, []);
    }
    usageGroups.get(usage)!.push(item);
  });

  // Select items, prioritizing lower usage levels
  const usageLevels = Array.from(usageGroups.keys()).sort((a, b) => a - b);

  for (const level of usageLevels) {
    if (selected.length >= count) break;

    const itemsAtLevel = usageGroups.get(level)!;
    // Shuffle for variety within same usage level
    const shuffled = shuffleArray([...itemsAtLevel]);

    for (const item of shuffled) {
      if (selected.length >= count) break;
      if (!selectedIds.has(item.id)) {
        selected.push(item);
        selectedIds.add(item.id);
      }
    }
  }

  // Update tracker with selected items
  selected.forEach((item) => {
    const currentUsage = tracker.usage.get(item.id) || 0;
    tracker.usage.set(item.id, currentUsage + 1);
  });

  // Assign display_order (1-based)
  return selected.map((item, index) => ({
    ...item,
    display_order: index + 1,
  })) as T[];
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * 
 * @param array - Array to shuffle
 * @returns New shuffled array (does not mutate original)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Resets usage tracker (clears all usage counts)
 * 
 * @param tracker - ContentUsageTracker to reset
 */
export function resetUsageTracker(tracker: ContentUsageTracker): void {
  tracker.usage.clear();
}

/**
 * Gets usage statistics from tracker
 * 
 * @param tracker - ContentUsageTracker to analyze
 * @returns Statistics object
 */
export function getUsageStats(tracker: ContentUsageTracker): {
  minUsage: number;
  maxUsage: number;
  avgUsage: number;
  unusedItems: number;
  overusedItems: number;
} {
  if (tracker.usage.size === 0) {
    return {
      minUsage: 0,
      maxUsage: 0,
      avgUsage: 0,
      unusedItems: tracker.total_items,
      overusedItems: 0,
    };
  }

  const usageValues = Array.from(tracker.usage.values());
  const minUsage = Math.min(...usageValues);
  const maxUsage = Math.max(...usageValues);
  const avgUsage = usageValues.reduce((a, b) => a + b, 0) / usageValues.length;
  const unusedItems = tracker.total_items - tracker.usage.size;
  const overusedItems = usageValues.filter((v) => v > tracker.max_appearances).length;

  return {
    minUsage,
    maxUsage,
    avgUsage,
    unusedItems,
    overusedItems,
  };
}

