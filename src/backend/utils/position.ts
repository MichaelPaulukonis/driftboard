/**
 * Position calculation utilities for kanban board elements
 */

/**
 * Calculate position for inserting an item between two positions
 * @param before - Position of item before (or undefined if at start)
 * @param after - Position of item after (or undefined if at end)
 * @returns New position value
 */
export function calculatePositionBetween(before?: number, after?: number): number {
  if (!before && !after) {
    return 1000; // First item
  }
  
  if (!before) {
    return after! / 2; // Insert at beginning
  }
  
  if (!after) {
    return before + 1000; // Insert at end
  }
  
  return (before + after) / 2; // Insert between
}

/**
 * Calculate the next available position after all existing items
 * @param maxPosition - The highest existing position (or undefined if no items)
 * @returns New position value
 */
export function calculateNextPosition(maxPosition?: number): number {
  return (maxPosition || 0) + 1000;
}

/**
 * Validate that a position value is valid (positive number)
 * @param position - Position to validate
 * @returns true if valid, false otherwise
 */
export function isValidPosition(position: number): boolean {
  return typeof position === 'number' && position >= 0 && !isNaN(position);
}

/**
 * Normalize positions to prevent precision issues with decimal positions
 * @param items - Array of items with position property
 * @returns Array of items with normalized positions (starting from 1000, incrementing by 1000)
 */
export function normalizePositions<T extends { position: number }>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => a.position - b.position);
  
  return sorted.map((item, index) => ({
    ...item,
    position: 1000 + (index * 1000)
  }));
}

/**
 * Check if positions need normalization (when they get too close or have precision issues)
 * @param positions - Array of position values
 * @returns true if normalization is recommended
 */
export function shouldNormalizePositions(positions: number[]): boolean {
  if (positions.length < 2) return false;
  
  const sorted = [...positions].sort((a, b) => a - b);
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];
    
    if (current === undefined || previous === undefined) continue;
    
    const diff = current - previous;
    if (diff < 1) {
      return true; // Positions too close
    }
  }
  
  return false;
}

/**
 * Reorder operation types for position updates
 */
export interface ReorderOperation {
  type: 'move_up' | 'move_down';
  oldPosition: number;
  newPosition: number;
  boardId?: string;
  listId?: string;
}

/**
 * Calculate which items need position updates during a reorder operation
 * @param operation - The reorder operation details
 * @returns Object with items to increment and decrement
 */
export function calculateReorderUpdates(operation: ReorderOperation): {
  increment: { min: number; max: number } | null;
  decrement: { min: number; max: number } | null;
} {
  const { oldPosition, newPosition } = operation;
  
  if (newPosition < oldPosition) {
    // Moving up - increment positions of items between new and old position
    return {
      increment: { min: newPosition, max: oldPosition - 1 },
      decrement: null
    };
  } else if (newPosition > oldPosition) {
    // Moving down - decrement positions of items between old and new position
    return {
      increment: null,
      decrement: { min: oldPosition + 1, max: newPosition }
    };
  }
  
  // No position change
  return { increment: null, decrement: null };
}
