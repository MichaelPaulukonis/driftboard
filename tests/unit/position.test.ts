import { describe, it, expect } from 'vitest';
import {
  calculatePositionBetween,
  calculateNextPosition,
  isValidPosition,
  normalizePositions,
  shouldNormalizePositions,
  calculateReorderUpdates,
  type ReorderOperation
} from '../../src/backend/utils/position.js';

describe('Position Utilities', () => {
  describe('calculatePositionBetween', () => {
    it('should return 1000 when no positions provided', () => {
      expect(calculatePositionBetween()).toBe(1000);
    });

    it('should calculate position at beginning when only after provided', () => {
      expect(calculatePositionBetween(undefined, 2000)).toBe(1000);
    });

    it('should calculate position at end when only before provided', () => {
      expect(calculatePositionBetween(1000)).toBe(2000);
    });

    it('should calculate position between two values', () => {
      expect(calculatePositionBetween(1000, 2000)).toBe(1500);
    });

    it('should handle close positions', () => {
      expect(calculatePositionBetween(1000, 1001)).toBe(1000.5);
    });

    it('should handle decimal positions', () => {
      expect(calculatePositionBetween(1000.5, 1001.5)).toBe(1001);
    });
  });

  describe('calculateNextPosition', () => {
    it('should return 1000 when no max position provided', () => {
      expect(calculateNextPosition()).toBe(1000);
    });

    it('should return 1000 when max position is 0', () => {
      expect(calculateNextPosition(0)).toBe(1000);
    });

    it('should add 1000 to max position', () => {
      expect(calculateNextPosition(2000)).toBe(3000);
    });

    it('should handle decimal max positions', () => {
      expect(calculateNextPosition(1500.5)).toBe(2500.5);
    });
  });

  describe('isValidPosition', () => {
    it('should return true for positive numbers', () => {
      expect(isValidPosition(1000)).toBe(true);
      expect(isValidPosition(0)).toBe(true);
      expect(isValidPosition(1.5)).toBe(true);
    });

    it('should return false for negative numbers', () => {
      expect(isValidPosition(-1)).toBe(false);
      expect(isValidPosition(-1000)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(isValidPosition(NaN)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isValidPosition('1000' as any)).toBe(false);
      expect(isValidPosition(null as any)).toBe(false);
      expect(isValidPosition(undefined as any)).toBe(false);
    });
  });

  describe('normalizePositions', () => {
    it('should normalize empty array', () => {
      expect(normalizePositions([])).toEqual([]);
    });

    it('should normalize single item', () => {
      const items = [{ id: '1', position: 500 }];
      const result = normalizePositions(items);
      
      expect(result).toEqual([{ id: '1', position: 1000 }]);
    });

    it('should normalize multiple items in order', () => {
      const items = [
        { id: '1', position: 500 },
        { id: '2', position: 1500 },
        { id: '3', position: 750 }
      ];
      const result = normalizePositions(items);
      
      expect(result).toEqual([
        { id: '1', position: 1000 },
        { id: '3', position: 2000 },
        { id: '2', position: 3000 }
      ]);
    });

    it('should handle items with same position', () => {
      const items = [
        { id: '1', position: 1000 },
        { id: '2', position: 1000 },
        { id: '3', position: 2000 }
      ];
      const result = normalizePositions(items);
      
      expect(result).toEqual([
        { id: '1', position: 1000 },
        { id: '2', position: 2000 },
        { id: '3', position: 3000 }
      ]);
    });

    it('should preserve other properties', () => {
      const items = [
        { id: '1', position: 500, name: 'Item 1', active: true },
        { id: '2', position: 1500, name: 'Item 2', active: false }
      ];
      const result = normalizePositions(items);
      
      expect(result).toEqual([
        { id: '1', position: 1000, name: 'Item 1', active: true },
        { id: '2', position: 2000, name: 'Item 2', active: false }
      ]);
    });
  });

  describe('shouldNormalizePositions', () => {
    it('should return false for empty array', () => {
      expect(shouldNormalizePositions([])).toBe(false);
    });

    it('should return false for single position', () => {
      expect(shouldNormalizePositions([1000])).toBe(false);
    });

    it('should return false for well-spaced positions', () => {
      expect(shouldNormalizePositions([1000, 2000, 3000])).toBe(false);
    });

    it('should return true for positions too close together', () => {
      expect(shouldNormalizePositions([1000, 1000.5, 2000])).toBe(true);
    });

    it('should return true for identical positions', () => {
      expect(shouldNormalizePositions([1000, 1000, 2000])).toBe(true);
    });

    it('should handle unsorted positions', () => {
      expect(shouldNormalizePositions([3000, 1000, 1000.5])).toBe(true);
    });
  });

  describe('calculateReorderUpdates', () => {
    it('should calculate increment range when moving up', () => {
      const operation: ReorderOperation = {
        type: 'move_up',
        oldPosition: 3000,
        newPosition: 1500
      };
      
      const result = calculateReorderUpdates(operation);
      
      expect(result).toEqual({
        increment: { min: 1500, max: 2999 },
        decrement: null
      });
    });

    it('should calculate decrement range when moving down', () => {
      const operation: ReorderOperation = {
        type: 'move_down',
        oldPosition: 1000,
        newPosition: 2500
      };
      
      const result = calculateReorderUpdates(operation);
      
      expect(result).toEqual({
        increment: null,
        decrement: { min: 1001, max: 2500 }
      });
    });

    it('should return null ranges when position unchanged', () => {
      const operation: ReorderOperation = {
        type: 'move_up',
        oldPosition: 2000,
        newPosition: 2000
      };
      
      const result = calculateReorderUpdates(operation);
      
      expect(result).toEqual({
        increment: null,
        decrement: null
      });
    });

    it('should handle edge case with adjacent positions', () => {
      const operation: ReorderOperation = {
        type: 'move_up',
        oldPosition: 2000,
        newPosition: 1999
      };
      
      const result = calculateReorderUpdates(operation);
      
      expect(result).toEqual({
        increment: { min: 1999, max: 1999 },
        decrement: null
      });
    });
  });
});
