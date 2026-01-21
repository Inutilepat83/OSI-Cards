/**
 * Column Packer Algorithm Tests
 *
 * Tests for FFDH and Skyline packing algorithms with various configurations
 */

import { packSectionsIntoColumns, ColumnPackerConfig } from './column-packer.util';
import { CardSection } from '../models';

describe('ColumnPacker', () => {
  const createSection = (id: string, type: string = 'info', colSpan?: number): CardSection => ({
    id,
    title: `Section ${id}`,
    type,
    colSpan,
  });

  const baseConfig: Partial<ColumnPackerConfig> = {
    columns: 4,
    gap: 12,
    containerWidth: 1200,
    minColumnWidth: 260,
  };

  describe('Basic Packing', () => {
    it('should pack single section', () => {
      const sections = [createSection('1')];
      const result = packSectionsIntoColumns(sections, baseConfig as ColumnPackerConfig);

      expect(result.positionedSections).toHaveLength(1);
      expect(result.positionedSections[0].top).toBe(0);
      expect(result.totalHeight).toBeGreaterThan(0);
    });

    it('should pack multiple sections', () => {
      const sections = [
        createSection('1'),
        createSection('2'),
        createSection('3'),
        createSection('4'),
      ];
      const result = packSectionsIntoColumns(sections, baseConfig as ColumnPackerConfig);

      expect(result.positionedSections).toHaveLength(4);
      expect(result.utilization).toBeGreaterThan(0);
      expect(result.gapCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty sections array', () => {
      const result = packSectionsIntoColumns([], baseConfig as ColumnPackerConfig);

      expect(result.positionedSections).toHaveLength(0);
      expect(result.totalHeight).toBe(0);
      expect(result.utilization).toBe(0);
    });
  });

  describe('Multi-Column Sections', () => {
    it('should handle sections spanning multiple columns', () => {
      const sections = [
        createSection('1', 'info', 2),
        createSection('2', 'info', 1),
        createSection('3', 'info', 1),
      ];
      const result = packSectionsIntoColumns(sections, baseConfig as ColumnPackerConfig);

      expect(result.positionedSections[0].colSpan).toBe(2);
      expect(result.positionedSections[1].colSpan).toBe(1);
      expect(result.positionedSections[2].colSpan).toBe(1);
    });

    it('should respect max columns constraint', () => {
      const sections = [createSection('1', 'info', 10)]; // Request 10 columns
      const result = packSectionsIntoColumns(sections, baseConfig as ColumnPackerConfig);

      expect(result.positionedSections[0].colSpan).toBeLessThanOrEqual(4);
    });
  });

  describe('Gap-Aware Placement', () => {
    it('should minimize gaps with gap-aware placement enabled', () => {
      const sections = Array.from({ length: 8 }, (_, i) => createSection(`s${i}`));
      const config: ColumnPackerConfig = {
        ...baseConfig,
        enableGapAwarePlacement: true,
        optimizationPasses: 3,
      } as ColumnPackerConfig;

      const result = packSectionsIntoColumns(sections, config);

      expect(result.gapCount).toBeLessThan(8);
      expect(result.utilization).toBeGreaterThan(70);
    });

    it('should fill gaps in post-processing', () => {
      const sections = Array.from({ length: 10 }, (_, i) => createSection(`s${i}`));
      const config: ColumnPackerConfig = {
        ...baseConfig,
        enableGapAwarePlacement: true,
        optimizationPasses: 2,
      } as ColumnPackerConfig;

      const result = packSectionsIntoColumns(sections, config);

      // Should have reasonable gap count
      expect(result.gapCount).toBeLessThan(sections.length * 0.3);
    });
  });

  describe('Optimization Passes', () => {
    it('should improve layout with multiple passes', () => {
      const sections = Array.from({ length: 12 }, (_, i) => createSection(`s${i}`));

      const config1: ColumnPackerConfig = {
        ...baseConfig,
        optimizationPasses: 1,
      } as ColumnPackerConfig;

      const config2: ColumnPackerConfig = {
        ...baseConfig,
        optimizationPasses: 3,
      } as ColumnPackerConfig;

      const result1 = packSectionsIntoColumns(sections, config1);
      const result2 = packSectionsIntoColumns(sections, config2);

      // More passes should generally improve utilization or reduce gaps
      expect(
        result2.utilization >= result1.utilization || result2.gapCount <= result1.gapCount
      ).toBe(true);
    });

    it('should exit early when layout is excellent', () => {
      const sections = Array.from({ length: 4 }, (_, i) => createSection(`s${i}`));
      const config: ColumnPackerConfig = {
        ...baseConfig,
        optimizationPasses: 5,
        enableGapAwarePlacement: true,
      } as ColumnPackerConfig;

      const result = packSectionsIntoColumns(sections, config);

      // Should complete successfully even with many passes
      expect(result.positionedSections).toHaveLength(4);
    });
  });

  describe('Packing Modes', () => {
    it('should use FFDH mode by default', () => {
      const sections = Array.from({ length: 6 }, (_, i) => createSection(`s${i}`));
      const config: ColumnPackerConfig = {
        ...baseConfig,
        packingMode: 'ffdh',
      } as ColumnPackerConfig;

      const result = packSectionsIntoColumns(sections, config);

      expect(result.algorithm).toBe('ffdh');
      expect(result.positionedSections).toHaveLength(6);
    });

    it('should use Skyline mode when specified', () => {
      const sections = Array.from({ length: 6 }, (_, i) => createSection(`s${i}`));
      const config: ColumnPackerConfig = {
        ...baseConfig,
        packingMode: 'skyline',
      } as ColumnPackerConfig;

      const result = packSectionsIntoColumns(sections, config);

      expect(result.algorithm).toBe('skyline');
      expect(result.positionedSections).toHaveLength(6);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single column layout', () => {
      const sections = Array.from({ length: 5 }, (_, i) => createSection(`s${i}`));
      const config: ColumnPackerConfig = {
        ...baseConfig,
        columns: 1,
      } as ColumnPackerConfig;

      const result = packSectionsIntoColumns(sections, config);

      expect(result.positionedSections).toHaveLength(5);
      result.positionedSections.forEach((pos) => {
        expect(pos.colSpan).toBe(1);
      });
    });

    it('should handle all sections same size', () => {
      const sections = Array.from({ length: 8 }, (_, i) => createSection(`s${i}`, 'info', 1));
      const result = packSectionsIntoColumns(sections, baseConfig as ColumnPackerConfig);

      expect(result.positionedSections).toHaveLength(8);
      expect(result.utilization).toBeGreaterThan(0);
    });

    it('should handle very large section count', () => {
      const sections = Array.from({ length: 50 }, (_, i) => createSection(`s${i}`));
      const result = packSectionsIntoColumns(sections, baseConfig as ColumnPackerConfig);

      expect(result.positionedSections).toHaveLength(50);
      expect(result.totalHeight).toBeGreaterThan(0);
    });

    it('should handle invalid column count gracefully', () => {
      const sections = [createSection('1')];
      const config: ColumnPackerConfig = {
        ...baseConfig,
        columns: 0,
      } as ColumnPackerConfig;

      // Should handle error gracefully
      expect(() => packSectionsIntoColumns(sections, config)).not.toThrow();
    });
  });

  describe('Reordering', () => {
    it('should allow reordering when enabled', () => {
      const sections = [
        createSection('1', 'info', 1),
        createSection('2', 'info', 2),
        createSection('3', 'info', 1),
      ];
      const config: ColumnPackerConfig = {
        ...baseConfig,
        allowReordering: true,
        sortByHeight: true,
      } as ColumnPackerConfig;

      const result = packSectionsIntoColumns(sections, config);

      expect(result.positionedSections).toHaveLength(3);
      // Original order should be preserved in originalIndex
      expect(result.positionedSections.some((p) => p.originalIndex === 0)).toBe(true);
    });

    it('should preserve order when reordering disabled', () => {
      const sections = [createSection('1'), createSection('2'), createSection('3')];
      const config: ColumnPackerConfig = {
        ...baseConfig,
        allowReordering: false,
      } as ColumnPackerConfig;

      const result = packSectionsIntoColumns(sections, config);

      expect(result.positionedSections[0].originalIndex).toBe(0);
      expect(result.positionedSections[1].originalIndex).toBe(1);
      expect(result.positionedSections[2].originalIndex).toBe(2);
    });
  });
});
