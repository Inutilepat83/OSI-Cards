/**
 * Tests for Weighted Column Selector
 */

import {
  WeightedColumnSelector,
  findBestColumn,
  compareSelectionStrategies,
  createPresetSelector,
} from './weighted-column-selector.util';
import { CardSection } from '../models/card.model';

describe('WeightedColumnSelector', () => {
  let selector: WeightedColumnSelector;

  beforeEach(() => {
    selector = new WeightedColumnSelector();
  });

  describe('findBestColumn', () => {
    it('should select the shortest column for single column span', () => {
      const columnHeights = [100, 50, 75, 200];
      const result = selector.findBestColumn(columnHeights, 1, 100, [], 12);

      expect(result.column).toBe(1); // Column with height 50
      expect(result.top).toBe(50);
    });

    it('should handle multi-column spans correctly', () => {
      const columnHeights = [100, 150, 50, 75];
      const result = selector.findBestColumn(columnHeights, 2, 100, [], 12);

      // Should choose columns 2-3 (max 75) over 0-1 (max 150) or 1-2 (max 150)
      expect(result.column).toBe(2);
      expect(result.top).toBe(75);
    });

    it('should prefer balanced columns when heights are similar', () => {
      // All columns at 100, except one at 90
      const columnHeights = [100, 90, 100, 100];
      const result = selector.findBestColumn(columnHeights, 1, 50, [], 12);

      // Should choose column 1 (height 90) as it's shortest
      expect(result.column).toBe(1);
    });

    it('should avoid creating orphan columns', () => {
      const columnHeights = [0, 0, 0, 0];
      const pendingSections: CardSection[] = [
        { id: '1', type: 'info', colSpan: 2, title: 'Section 1' },
        { id: '2', type: 'info', colSpan: 2, title: 'Section 2' },
      ];

      // Placing a 2-column section
      const result = selector.findBestColumn(columnHeights, 2, 100, pendingSections, 12);

      // Should prefer column 0 or 2 (leaves 2 columns), not column 1 (leaves orphans)
      expect([0, 2]).toContain(result.column);
    });

    it('should consider variance penalty', () => {
      const columnHeights = [0, 0, 200, 200];

      // Placing on columns 0-1 would increase variance less than 2-3
      const result1 = selector.findBestColumn(columnHeights, 2, 100, [], 12);

      // Should prefer left (0-1) as it balances better with right side
      expect(result1.column).toBe(0);
    });

    it('should provide detailed score breakdown', () => {
      const columnHeights = [100, 150, 200, 250];
      const result = selector.findBestColumn(columnHeights, 1, 100, [], 12);

      expect(result.score).toBeDefined();
      expect(result.score.totalScore).toBeGreaterThan(0);
      expect(result.score.heightScore).toBe(100); // Shortest column
      expect(result.score.variancePenalty).toBeGreaterThanOrEqual(0);
      expect(result.score.explanation).toBeDefined();
    });

    it('should return alternatives for comparison', () => {
      const columnHeights = [100, 150, 200, 250];
      const result = selector.findBestColumn(columnHeights, 1, 100, [], 12);

      expect(result.alternatives).toBeDefined();
      expect(result.alternatives!.length).toBeGreaterThan(0);
      expect(result.alternatives!.length).toBeLessThanOrEqual(3);
    });
  });

  describe('gap penalty calculation', () => {
    it('should penalize placements that create unfillable gaps', () => {
      const columnHeights = [0, 0, 0];
      const pendingSections: CardSection[] = [
        { id: '1', type: 'info', colSpan: 2, title: 'Wide Section' },
      ];

      // Placing a 2-column section at column 1 would leave 1 orphan column
      // which can't fit the pending 2-column section
      const result = selector.findBestColumn(columnHeights, 2, 100, pendingSections, 12);

      // Should prefer column 0 (leaves 1 empty) over column 1 (leaves orphans on both sides)
      expect(result.column).toBe(0);
    });

    it('should not penalize when pending sections can fill gaps', () => {
      const columnHeights = [0, 0, 0, 0];
      const pendingSections: CardSection[] = [
        { id: '1', type: 'info', colSpan: 1, title: 'Narrow Section' },
        { id: '2', type: 'info', colSpan: 1, title: 'Narrow Section' },
      ];

      // Any placement is fine since we have narrow sections to fill gaps
      const result = selector.findBestColumn(columnHeights, 2, 100, pendingSections, 12);

      expect(result.column).toBeGreaterThanOrEqual(0);
      expect(result.column).toBeLessThanOrEqual(2);
    });
  });

  describe('configuration', () => {
    it('should use custom weights', () => {
      const customSelector = new WeightedColumnSelector({
        gapWeight: 10.0, // High gap penalty
        varianceWeight: 0.1, // Low variance penalty
      });

      const columnHeights = [0, 0, 100, 100];
      const pendingSections: CardSection[] = [{ id: '1', type: 'info', colSpan: 2, title: 'Wide' }];

      const result = customSelector.findBestColumn(columnHeights, 2, 100, pendingSections, 12);

      // With high gap penalty, should strongly avoid creating orphans
      expect([0, 2]).toContain(result.column);
    });

    it('should allow runtime configuration updates', () => {
      selector.configure({ gapWeight: 5.0 });
      const config = selector.getConfig();

      expect(config.gapWeight).toBe(5.0);
    });

    it('should disable lookahead when configured', () => {
      const fastSelector = new WeightedColumnSelector({
        enableLookahead: false,
      });

      const columnHeights = [0, 0, 0, 0];
      const pendingSections: CardSection[] = [{ id: '1', type: 'info', colSpan: 2, title: 'Wide' }];

      const result = fastSelector.findBestColumn(columnHeights, 2, 100, pendingSections, 12);

      // Should complete without error
      expect(result.column).toBeGreaterThanOrEqual(0);
      // Gap penalty should be 0 when lookahead is disabled
      expect(result.score.gapPenalty).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle single column grid', () => {
      const columnHeights = [100];
      const result = selector.findBestColumn(columnHeights, 1, 50, [], 12);

      expect(result.column).toBe(0);
      expect(result.top).toBe(100);
    });

    it('should handle empty columns', () => {
      const columnHeights = [0, 0, 0, 0];
      const result = selector.findBestColumn(columnHeights, 2, 100, [], 12);

      expect(result.column).toBeGreaterThanOrEqual(0);
      expect(result.top).toBe(0);
    });

    it('should handle sections that span all columns', () => {
      const columnHeights = [100, 150, 200, 250];
      const result = selector.findBestColumn(columnHeights, 4, 100, [], 12);

      expect(result.column).toBe(0);
      expect(result.top).toBe(250); // Max of all columns
    });

    it('should handle very tall columns', () => {
      const columnHeights = [10000, 0, 0, 0];
      const result = selector.findBestColumn(columnHeights, 1, 100, [], 12);

      // Should choose one of the empty columns
      expect(result.column).toBeGreaterThan(0);
      expect(result.top).toBe(0);
    });

    it('should handle no pending sections', () => {
      const columnHeights = [100, 150, 200, 250];
      const result = selector.findBestColumn(columnHeights, 2, 100, [], 12);

      // Should not crash and should return valid result
      expect(result.column).toBeGreaterThanOrEqual(0);
      expect(result.column).toBeLessThanOrEqual(2);
    });
  });

  describe('convenience functions', () => {
    it('findBestColumn should work without creating instance', () => {
      const columnHeights = [100, 50, 75, 200];
      const result = findBestColumn(columnHeights, 1, 100, [], 12);

      expect(result.column).toBe(1);
      expect(result.top).toBe(50);
    });

    it('compareSelectionStrategies should show differences', () => {
      const columnHeights = [0, 0, 100, 100];
      const pendingSections: CardSection[] = [{ id: '1', type: 'info', colSpan: 2, title: 'Wide' }];

      const comparison = compareSelectionStrategies(columnHeights, 2, 100, pendingSections, 12);

      expect(comparison.weighted).toBeDefined();
      expect(comparison.simple).toBeDefined();
      expect(comparison.difference).toBeDefined();
      expect(typeof comparison.difference).toBe('string');
    });

    it('createPresetSelector should create configured instances', () => {
      const balanced = createPresetSelector('balanced');
      const compact = createPresetSelector('compact');
      const gapAverse = createPresetSelector('gap-averse');
      const fast = createPresetSelector('fast');

      expect(balanced.getConfig().varianceWeight).toBe(1.0);
      expect(compact.getConfig().gapWeight).toBe(3.0);
      expect(gapAverse.getConfig().gapWeight).toBe(5.0);
      expect(fast.getConfig().enableLookahead).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical dashboard layout', () => {
      // Simulate a 4-column dashboard with some sections already placed
      const columnHeights = [200, 250, 180, 220];
      const pendingSections: CardSection[] = [
        { id: '1', type: 'chart', colSpan: 2, title: 'Sales Chart' },
        { id: '2', type: 'info', colSpan: 1, title: 'Metric 1' },
        { id: '3', type: 'info', colSpan: 1, title: 'Metric 2' },
        { id: '4', type: 'list', colSpan: 1, title: 'Tasks' },
      ];

      // Place a 2-column chart
      const result = selector.findBestColumn(columnHeights, 2, 250, pendingSections, 12);

      expect(result.column).toBeGreaterThanOrEqual(0);
      expect(result.column).toBeLessThanOrEqual(2);
      // Should place on shortest adjacent columns (2-3)
      expect(result.column).toBe(2);
    });

    it('should optimize for masonry grid with mixed spans', () => {
      const columnHeights = [0, 0, 0];
      const pendingSections: CardSection[] = [
        { id: '1', type: 'overview', colSpan: 3, title: 'Overview' },
        { id: '2', type: 'chart', colSpan: 2, title: 'Chart' },
        { id: '3', type: 'info', colSpan: 1, title: 'Info' },
      ];

      // Place the first section (3 columns)
      const result1 = selector.findBestColumn(columnHeights, 3, 300, pendingSections.slice(1), 12);
      expect(result1.column).toBe(0);

      // Update heights
      const updatedHeights = [300, 300, 300];

      // Place second section (2 columns)
      const result2 = selector.findBestColumn(updatedHeights, 2, 200, pendingSections.slice(2), 12);

      // Should prefer columns that leave space for the 1-column section
      expect(result2.column).toBeGreaterThanOrEqual(0);
      expect(result2.column).toBeLessThanOrEqual(1);
    });
  });

  describe('performance', () => {
    it('should complete quickly for large column counts', () => {
      const columnHeights = new Array(20).fill(0).map(() => Math.random() * 1000);
      const pendingSections: CardSection[] = new Array(50).fill(null).map((_, i) => ({
        id: `section-${i}`,
        type: 'info',
        colSpan: Math.floor(Math.random() * 3) + 1,
        title: `Section ${i}`,
      }));

      const startTime = performance.now();
      const result = selector.findBestColumn(columnHeights, 2, 200, pendingSections, 12);
      const endTime = performance.now();

      expect(result.column).toBeGreaterThanOrEqual(0);
      expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
    });

    it('should be efficient with lookahead disabled', () => {
      const fastSelector = new WeightedColumnSelector({
        enableLookahead: false,
      });

      const columnHeights = new Array(20).fill(0).map(() => Math.random() * 1000);
      const pendingSections: CardSection[] = new Array(100).fill(null).map((_, i) => ({
        id: `section-${i}`,
        type: 'info',
        colSpan: 1,
        title: `Section ${i}`,
      }));

      const startTime = performance.now();
      const result = fastSelector.findBestColumn(columnHeights, 1, 200, pendingSections, 12);
      const endTime = performance.now();

      expect(result.column).toBeGreaterThanOrEqual(0);
      expect(endTime - startTime).toBeLessThan(5); // Should be even faster
    });
  });
});
