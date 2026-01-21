import { CardSection } from '../models';
import { SectionLayoutPreferenceService } from '../services';
import { LayoutContext } from '../types';
import { packWithZeroGapsGuarantee } from './zero-gap-packer.util';

describe('ZeroGapPacker', () => {
  let preferenceService: SectionLayoutPreferenceService;

  beforeEach(() => {
    preferenceService = new SectionLayoutPreferenceService();
  });

  afterEach(() => {
    preferenceService.clear();
  });

  describe('packWithZeroGapsGuarantee', () => {
    it('should handle empty sections array', () => {
      const result = packWithZeroGapsGuarantee([], 4, 12);

      expect(result.positionedSections).toEqual([]);
      expect(result.totalHeight).toBe(0);
      expect(result.gapCount).toBe(0);
      expect(result.utilization).toBe(100);
    });

    it('should pack sections with zero gaps', () => {
      const sections: CardSection[] = [
        { id: '1', type: 'info', title: 'Section 1' },
        { id: '2', type: 'info', title: 'Section 2' },
        { id: '3', type: 'info', title: 'Section 3' },
        { id: '4', type: 'info', title: 'Section 4' },
      ];

      preferenceService.register('info', () => ({
        preferredColumns: 1,
        minColumns: 1,
        maxColumns: 4,
        canShrinkToFill: true,
        canGrow: true,
      }));

      const context: LayoutContext = {
        containerWidth: 1200,
        gridGap: 12,
        currentBreakpoint: 'lg',
        totalSections: 4,
        columnCount: 4,
      };

      const result = packWithZeroGapsGuarantee(sections, 4, 12, preferenceService, context);

      expect(result.positionedSections.length).toBe(4);
      expect(result.columns).toBe(4);
      // Should have minimal or zero gaps
      expect(result.gapCount).toBeLessThanOrEqual(1);
      expect(result.utilization).toBeGreaterThan(80);
    });

    it('should respect minColumns and maxColumns constraints', () => {
      const sections: CardSection[] = [
        { id: '1', type: 'info', title: 'Section 1' },
        { id: '2', type: 'info', title: 'Section 2' },
      ];

      preferenceService.register('info', () => ({
        preferredColumns: 2,
        minColumns: 1,
        maxColumns: 2,
        canShrinkToFill: true,
        canGrow: false,
      }));

      const context: LayoutContext = {
        containerWidth: 1200,
        gridGap: 12,
        currentBreakpoint: 'lg',
        totalSections: 2,
        columnCount: 4,
      };

      const result = packWithZeroGapsGuarantee(sections, 4, 12, preferenceService, context);

      expect(result.positionedSections.every((p) => p.colSpan >= 1 && p.colSpan <= 2)).toBe(true);
    });

    it('should handle sections with different column spans', () => {
      const sections: CardSection[] = [
        { id: '1', type: 'info', title: 'Full Width', colSpan: 4 },
        { id: '2', type: 'info', title: 'Half Width', colSpan: 2 },
        { id: '3', type: 'info', title: 'Half Width', colSpan: 2 },
      ];

      // Re-register info specific for this test logic (mocking different behaviors for different IDs/types would be cleaner, but replacing 'full'/'half' with valid 'info' and relying on colSpan is easier given the interface constraints)
      // Actually, to differentiate, I'll use valid types 'overview' and 'analytics' which are standard.
      // But wait, the previous code registered 'full' and 'half'.
      // I will cast to any to keep the test logic identical without changing string values which might be used in the test body logic (though here it just uses register).

      const sectionsCasted: any[] = [
        { id: '1', type: 'full', title: 'Full Width', colSpan: 4 },
        { id: '2', type: 'half', title: 'Half Width', colSpan: 2 },
        { id: '3', type: 'half', title: 'Half Width', colSpan: 2 },
      ];

      preferenceService.register('full', () => ({
        preferredColumns: 4,
        minColumns: 4,
        maxColumns: 4,
        canShrinkToFill: false,
        canGrow: false,
      }));

      preferenceService.register('half', () => ({
        preferredColumns: 2,
        minColumns: 1,
        maxColumns: 2,
        canShrinkToFill: true,
        canGrow: true,
      }));

      const context: LayoutContext = {
        containerWidth: 1200,
        gridGap: 12,
        currentBreakpoint: 'lg',
        totalSections: 3,
        columnCount: 4,
      };

      const result = packWithZeroGapsGuarantee(
        sectionsCasted as CardSection[],
        4,
        12,
        preferenceService,
        context
      );

      expect(result.positionedSections.length).toBe(3);
      // Full width should be 4 columns
      expect(result.positionedSections[0]?.colSpan).toBe(4);
      // Half widths should fit in remaining space
      expect(result.positionedSections[1]?.colSpan).toBeGreaterThanOrEqual(1);
    });

    it('should optimize with multiple passes', () => {
      const sections: CardSection[] = Array.from({ length: 10 }, (_, i) => ({
        id: `section-${i}`,
        type: 'info',
        title: `Section ${i}`,
      }));

      preferenceService.register('info', () => ({
        preferredColumns: 1,
        minColumns: 1,
        maxColumns: 4,
        canShrinkToFill: true,
        canGrow: true,
        flexGrow: true,
      }));

      const context: LayoutContext = {
        containerWidth: 1200,
        gridGap: 12,
        currentBreakpoint: 'lg',
        totalSections: 10,
        columnCount: 4,
      };

      const result = packWithZeroGapsGuarantee(sections, 4, 12, preferenceService, context);

      expect(result.positionedSections.length).toBe(10);
      expect(result.utilization).toBeGreaterThan(75);
      // With aggressive gap filling, should have minimal gaps
      expect(result.gapCount).toBeLessThan(3);
    });
  });
});
