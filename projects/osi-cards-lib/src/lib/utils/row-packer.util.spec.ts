/**
 * Unit Tests for Row-First Space-Filling Packing Algorithm
 *
 * Tests the row-packer utility which prioritizes filling rows completely
 * over strictly respecting section preferred widths.
 */

import {
  packSectionsIntoRows,
  prepareSections,
  packingResultToPositions,
  mapPriorityToNumber,
  analyzeSections,
  validatePackingResult,
  RowPackerConfig,
  PlannedSection,
  PackedRow,
  RowPackingResult,
} from './row-packer.util';
import { CardSection } from '../models/card.model';

describe('Row Packer Utility', () => {
  // Default configuration for tests
  const defaultConfig: RowPackerConfig = {
    totalColumns: 4,
    gap: 12,
    prioritizeSpaceFilling: true,
    allowShrinking: true,
    allowGrowing: true,
    maxOptimizationPasses: 3,
  };

  // Helper to create mock sections
  function createSection(overrides: Partial<CardSection> = {}): CardSection {
    return {
      title: 'Test Section',
      type: 'info',
      ...overrides,
    };
  }

  describe('mapPriorityToNumber', () => {
    it('should return explicit layoutPriority if provided', () => {
      expect(mapPriorityToNumber('optional', 1)).toBe(1);
      expect(mapPriorityToNumber('critical', 3)).toBe(3);
    });

    it('should map critical to 1', () => {
      expect(mapPriorityToNumber('critical')).toBe(1);
    });

    it('should map important to 1', () => {
      expect(mapPriorityToNumber('important')).toBe(1);
    });

    it('should map standard to 2', () => {
      expect(mapPriorityToNumber('standard')).toBe(2);
    });

    it('should map optional to 3', () => {
      expect(mapPriorityToNumber('optional')).toBe(3);
    });

    it('should default to 2 for undefined priority', () => {
      expect(mapPriorityToNumber(undefined)).toBe(2);
    });
  });

  describe('prepareSections', () => {
    it('should calculate preferred width based on section type', () => {
      const sections: CardSection[] = [
        createSection({ type: 'overview' }), // Should prefer 4 columns
        createSection({ type: 'chart' }), // Should prefer 2 columns
        createSection({ type: 'info' }), // Should prefer 1 column
      ];

      const prepared = prepareSections(sections, defaultConfig);

      expect(prepared[0]?.preferredWidth).toBe(4);
      expect(prepared[1]?.preferredWidth).toBe(2);
      expect(prepared[2]?.preferredWidth).toBe(1);
    });

    it('should respect explicit preferredColumns on section', () => {
      const sections: CardSection[] = [createSection({ type: 'info', preferredColumns: 3 })];

      const prepared = prepareSections(sections, defaultConfig);

      expect(prepared[0]?.preferredWidth).toBe(3);
    });

    it('should respect explicit colSpan (hard override)', () => {
      const sections: CardSection[] = [createSection({ type: 'overview', colSpan: 2 })];

      const prepared = prepareSections(sections, defaultConfig);

      // colSpan takes precedence over type-based default
      expect(prepared[0]?.preferredWidth).toBe(2);
    });

    it('should calculate priority from section priority band', () => {
      const sections: CardSection[] = [
        createSection({ priority: 'critical' }),
        createSection({ priority: 'standard' }),
        createSection({ priority: 'optional' }),
      ];

      const prepared = prepareSections(sections, defaultConfig);

      expect(prepared[0]?.priority).toBe(1);
      expect(prepared[1]?.priority).toBe(2);
      expect(prepared[2]?.priority).toBe(3);
    });

    it('should use explicit layoutPriority if provided', () => {
      const sections: CardSection[] = [createSection({ priority: 'optional', layoutPriority: 1 })];

      const prepared = prepareSections(sections, defaultConfig);

      expect(prepared[0]?.priority).toBe(1);
    });

    it('should set flexibility based on canShrink/canGrow', () => {
      const sections: CardSection[] = [
        createSection({ canShrink: false, canGrow: false }),
        createSection({ canShrink: true, canGrow: true }),
        createSection({}), // Default should be flexible
      ];

      const prepared = prepareSections(sections, defaultConfig);

      expect(prepared[0]?.isFlexible).toBe(false);
      expect(prepared[1]?.isFlexible).toBe(true);
      expect(prepared[2]?.isFlexible).toBe(true);
    });

    it('should respect config allowShrinking/allowGrowing', () => {
      const restrictiveConfig: RowPackerConfig = {
        ...defaultConfig,
        allowShrinking: false,
        allowGrowing: false,
      };

      const sections: CardSection[] = [createSection({ canShrink: true, canGrow: true })];

      const prepared = prepareSections(sections, restrictiveConfig);

      expect(prepared[0]?.canShrink).toBe(false);
      expect(prepared[0]?.canGrow).toBe(false);
      expect(prepared[0]?.isFlexible).toBe(false);
    });
  });

  describe('packSectionsIntoRows', () => {
    it('should return empty result for empty sections', () => {
      const result = packSectionsIntoRows([], defaultConfig);

      expect(result.rows).toHaveLength(0);
      expect(result.totalHeight).toBe(0);
      expect(result.utilizationPercent).toBe(100);
    });

    it('should pack single section into one row', () => {
      const sections: CardSection[] = [createSection({ preferredColumns: 2 })];

      const result = packSectionsIntoRows(sections, defaultConfig);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.sections).toHaveLength(1);
    });

    it('should fill row completely when possible', () => {
      // 4 columns available, 4 sections each preferring 1 column
      const sections: CardSection[] = [
        createSection({ preferredColumns: 1 }),
        createSection({ preferredColumns: 1 }),
        createSection({ preferredColumns: 1 }),
        createSection({ preferredColumns: 1 }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.totalWidth).toBe(4);
      expect(result.rows[0]?.remainingCapacity).toBe(0);
    });

    it('should expand sections to fill gaps when allowed', () => {
      // 4 columns, 2 sections preferring 1 column each
      // With allowGrowing=true, they should expand to fill the row
      const sections: CardSection[] = [
        createSection({ preferredColumns: 1, canGrow: true }),
        createSection({ preferredColumns: 1, canGrow: true }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.remainingCapacity).toBe(0);
      expect(result.grownCount).toBeGreaterThan(0);
    });

    it('should shrink sections to fit in row when allowed', () => {
      // 4 columns, first section prefers 3, second prefers 2
      // Total 5, so one must shrink
      const sections: CardSection[] = [
        createSection({ preferredColumns: 3, canShrink: true, priority: 'critical' }),
        createSection({ preferredColumns: 2, canShrink: true, priority: 'optional' }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // Should fit in one row with some shrinking
      expect(result.rows[0]?.totalWidth).toBeLessThanOrEqual(4);
    });

    it('should respect section priority order', () => {
      const sections: CardSection[] = [
        createSection({ title: 'Low', priority: 'optional' }),
        createSection({ title: 'High', priority: 'critical' }),
        createSection({ title: 'Medium', priority: 'standard' }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // High priority (critical) should be placed first
      const firstSection = result.rows[0]?.sections[0];
      expect(firstSection?.section.title).toBe('High');
    });

    it('should create multiple rows when sections exceed capacity', () => {
      // 4 columns, 3 sections each preferring 2 columns = 6 columns needed
      const sections: CardSection[] = [
        createSection({ preferredColumns: 2 }),
        createSection({ preferredColumns: 2 }),
        createSection({ preferredColumns: 2 }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      expect(result.rows.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle sections wider than grid gracefully', () => {
      const sections: CardSection[] = [
        createSection({ preferredColumns: 4, colSpan: 6 }), // Wider than grid
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // Should clamp to max columns
      expect(result.rows[0]?.sections[0]?.finalWidth).toBeLessThanOrEqual(4);
    });

    it('should not shrink sections when allowShrinking is false', () => {
      const noShrinkConfig: RowPackerConfig = {
        ...defaultConfig,
        allowShrinking: false,
        allowGrowing: true,
      };

      const sections: CardSection[] = [
        createSection({ preferredColumns: 3 }),
        createSection({ preferredColumns: 3 }),
      ];

      const result = packSectionsIntoRows(sections, noShrinkConfig);

      // Should NOT shrink to fit both in one row
      expect(result.rows.length).toBeGreaterThanOrEqual(2);
    });

    it('should not grow sections when allowGrowing is false', () => {
      const noGrowConfig: RowPackerConfig = {
        ...defaultConfig,
        allowShrinking: true,
        allowGrowing: false,
      };

      const sections: CardSection[] = [
        createSection({ preferredColumns: 1 }),
        createSection({ preferredColumns: 1 }),
      ];

      const result = packSectionsIntoRows(sections, noGrowConfig);

      // Should have gaps since sections can't grow
      expect(result.rows[0]?.remainingCapacity).toBeGreaterThan(0);
      expect(result.grownCount).toBe(0);
    });

    it('should achieve high utilization with space-filling enabled', () => {
      const sections: CardSection[] = [
        createSection({ preferredColumns: 2, priority: 'critical' }),
        createSection({ preferredColumns: 1, priority: 'important' }),
        createSection({ preferredColumns: 3, priority: 'standard' }),
        createSection({ preferredColumns: 1, priority: 'optional' }),
        createSection({ preferredColumns: 2, priority: 'standard' }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // With space-filling, should have high utilization
      expect(result.utilizationPercent).toBeGreaterThan(80);
    });
  });

  describe('packingResultToPositions', () => {
    it('should convert packing result to positioned sections', () => {
      const sections: CardSection[] = [
        createSection({ id: 'section-1', preferredColumns: 2 }),
        createSection({ id: 'section-2', preferredColumns: 2 }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);
      const positions = packingResultToPositions(result, {
        totalColumns: 4,
        gap: 12,
      });

      expect(positions).toHaveLength(2);

      // First section should start at left: 0
      expect(positions[0]?.left).toBe('0px');

      // Each position should have CSS expressions for width
      expect(positions[0]?.width).toContain('calc');
    });

    it('should include wasShrunk/wasGrown flags', () => {
      const sections: CardSection[] = [
        createSection({ preferredColumns: 1, canGrow: true }),
        createSection({ preferredColumns: 1, canGrow: true }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);
      const positions = packingResultToPositions(result, {
        totalColumns: 4,
        gap: 12,
      });

      // Sections should have been grown to fill the row
      const grownSections = positions.filter((p) => p.wasGrown);
      expect(grownSections.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeSections', () => {
    it('should analyze sections and provide suggestions', () => {
      const sections: CardSection[] = [
        createSection({ preferredColumns: 2, priority: 'critical' }),
        createSection({ preferredColumns: 1, priority: 'standard' }),
        createSection({ preferredColumns: 1, priority: 'optional' }),
      ];

      const analysis = analyzeSections(sections);

      expect(analysis.totalPreferredWidth).toBe(4);
      expect(analysis.hasMixedPriorities).toBe(true);
      expect(analysis.suggestedColumns).toBeGreaterThanOrEqual(2);
    });
  });

  describe('validatePackingResult', () => {
    it('should return no warnings for good packing', () => {
      const sections: CardSection[] = [
        createSection({ preferredColumns: 2 }),
        createSection({ preferredColumns: 2 }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);
      const warnings = validatePackingResult(result);

      expect(warnings).toHaveLength(0);
    });

    it('should warn about low utilization', () => {
      const noGrowConfig: RowPackerConfig = {
        ...defaultConfig,
        allowGrowing: false,
      };

      const sections: CardSection[] = [createSection({ preferredColumns: 1 })];

      const result = packSectionsIntoRows(sections, noGrowConfig);
      const warnings = validatePackingResult(result);

      // Should warn about low utilization (1/4 columns = 25%)
      expect(warnings.some((w) => w.includes('utilization'))).toBe(true);
    });

    it('should warn about rows with gaps', () => {
      const noGrowConfig: RowPackerConfig = {
        ...defaultConfig,
        allowGrowing: false,
      };

      const sections: CardSection[] = [
        createSection({ preferredColumns: 1 }),
        createSection({ preferredColumns: 1 }),
      ];

      const result = packSectionsIntoRows(sections, noGrowConfig);
      const warnings = validatePackingResult(result);

      // Should warn about gaps if there are any
      if (result.rowsWithGaps > 0) {
        expect(warnings.some((w) => w.includes('gap'))).toBe(true);
      }
    });
  });

  describe('Type-Aware Expansion', () => {
    it('should not expand contact-card beyond type limit', () => {
      // Contact cards have a max expansion of 2
      const sections: CardSection[] = [
        createSection({
          type: 'contact-card',
          preferredColumns: 1,
          canGrow: true,
          fields: [{ label: 'Name', value: 'Test' }],
        }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // Contact card should not expand beyond 2 even though 4 columns available
      expect(result.rows[0]?.sections[0]?.finalWidth).toBeLessThanOrEqual(2);
    });

    it('should allow chart to expand to full width', () => {
      // Charts have a max expansion of 4
      const sections: CardSection[] = [
        createSection({
          type: 'chart',
          preferredColumns: 2,
          canGrow: true,
          fields: Array(10).fill({ label: 'Data', value: '100' }), // Dense content
        }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // Chart can expand to fill 4 columns
      expect(result.rows[0]?.sections[0]?.finalWidth).toBeLessThanOrEqual(4);
    });

    it('should respect type limits during Phase 2 expansion', () => {
      // Two contact cards - even with gaps, shouldn't exceed type limit
      const sections: CardSection[] = [
        createSection({
          type: 'contact-card',
          preferredColumns: 1,
          canGrow: true,
          fields: [{ label: 'Name', value: 'Test' }],
        }),
        createSection({
          type: 'contact-card',
          preferredColumns: 1,
          canGrow: true,
          fields: [{ label: 'Name', value: 'Test' }],
        }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // Each contact card should be at most 2 columns
      for (const section of result.rows[0]?.sections ?? []) {
        expect(section.finalWidth).toBeLessThanOrEqual(2);
      }
    });

    it('should respect type limits during Phase 4 distribution', () => {
      // Single project section - should stay at 1 column
      const sections: CardSection[] = [
        createSection({
          type: 'project',
          preferredColumns: 1,
          canGrow: true,
        }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // Project sections have max expansion of 1
      expect(result.rows[0]?.sections[0]?.finalWidth).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single column grid', () => {
      const singleColConfig: RowPackerConfig = {
        ...defaultConfig,
        totalColumns: 1,
      };

      const sections: CardSection[] = [
        createSection({ preferredColumns: 2 }),
        createSection({ preferredColumns: 3 }),
      ];

      const result = packSectionsIntoRows(sections, singleColConfig);

      // All sections should be clamped to 1 column
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.sections[0]?.finalWidth).toBe(1);
    });

    it('should handle sections with minColumns constraint', () => {
      const sections: CardSection[] = [createSection({ preferredColumns: 3, minColumns: 2 })];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // Should respect minColumns
      expect(result.rows[0]?.sections[0]?.finalWidth).toBeGreaterThanOrEqual(2);
    });

    it('should handle sections with maxColumns constraint', () => {
      const sections: CardSection[] = [
        createSection({ preferredColumns: 2, maxColumns: 2, canGrow: true }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // Should not exceed maxColumns even with growing
      expect(result.rows[0]?.sections[0]?.finalWidth).toBeLessThanOrEqual(2);
    });

    it('should maintain original order within same priority', () => {
      const sections: CardSection[] = [
        createSection({ title: 'First', priority: 'standard' }),
        createSection({ title: 'Second', priority: 'standard' }),
        createSection({ title: 'Third', priority: 'standard' }),
      ];

      const result = packSectionsIntoRows(sections, defaultConfig);

      // All same priority, should maintain original order
      const titles = result.rows.flatMap((r) => r.sections.map((s) => s.section.title));
      expect(titles).toEqual(['First', 'Second', 'Third']);
    });
  });
});
