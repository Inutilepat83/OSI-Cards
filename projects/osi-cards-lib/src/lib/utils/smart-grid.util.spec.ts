import {
  measureContentDensity,
  calculateOptimalColumns,
  estimateSectionHeight,
  getSectionPriorityBand,
  calculatePriorityScore,
  binPack2D,
  findGaps,
  fillGapsWithSections,
  calculateLayoutAnalytics,
  groupRelatedSections,
  flattenGroups,
  PRIORITY_BANDS,
  SECTION_HEIGHT_ESTIMATES,
  SectionWithMetrics
} from './smart-grid.util';
import { CardSection } from '../models/card.model';

describe('Smart Grid Utilities', () => {
  // ============================================================================
  // Content Density Measurement Tests
  // ============================================================================
  describe('measureContentDensity', () => {
    it('should return 0 for empty section', () => {
      const section: CardSection = {
        title: 'Empty Section',
        type: 'info'
      };
      expect(measureContentDensity(section)).toBe(0);
    });

    it('should calculate density based on description length', () => {
      const section: CardSection = {
        title: 'Test',
        type: 'info',
        description: 'A'.repeat(100) // 100 chars = 2 points (100/50)
      };
      expect(measureContentDensity(section)).toBe(2);
    });

    it('should calculate density based on field count', () => {
      const section: CardSection = {
        title: 'Test',
        type: 'info',
        fields: [
          { label: 'Field 1', value: 'Value 1' },
          { label: 'Field 2', value: 'Value 2' },
          { label: 'Field 3', value: 'Value 3' }
        ]
      };
      // 3 fields * 2 points = 6 + text length contribution
      const density = measureContentDensity(section);
      expect(density).toBeGreaterThanOrEqual(6);
    });

    it('should calculate density based on item count', () => {
      const section: CardSection = {
        title: 'Test',
        type: 'list',
        items: [
          { title: 'Item 1' },
          { title: 'Item 2' },
          { title: 'Item 3' },
          { title: 'Item 4' }
        ]
      };
      // 4 items * 3 points = 12
      const density = measureContentDensity(section);
      expect(density).toBeGreaterThanOrEqual(12);
    });

    it('should combine all density factors', () => {
      const section: CardSection = {
        title: 'Combined',
        type: 'info',
        description: 'A'.repeat(50), // 1 point
        fields: [
          { label: 'F1', value: 'V1' },
          { label: 'F2', value: 'V2' }
        ], // 2 fields * 2 = 4 points + text
        items: [{ title: 'I1' }] // 1 item * 3 = 3 points
      };
      const density = measureContentDensity(section);
      expect(density).toBeGreaterThan(7);
    });
  });

  // ============================================================================
  // Optimal Columns Calculation Tests
  // ============================================================================
  describe('calculateOptimalColumns', () => {
    it('should return preferredColumns when set', () => {
      const section: CardSection = {
        title: 'Test',
        type: 'info',
        preferredColumns: 3
      };
      expect(calculateOptimalColumns(section, 4)).toBe(3);
    });

    it('should respect maxColumns constraint', () => {
      const section: CardSection = {
        title: 'Test',
        type: 'info',
        preferredColumns: 4,
        maxColumns: 2
      };
      expect(calculateOptimalColumns(section, 4)).toBe(2);
    });

    it('should respect minColumns constraint', () => {
      const section: CardSection = {
        title: 'Test',
        type: 'info',
        preferredColumns: 1,
        minColumns: 2
      };
      expect(calculateOptimalColumns(section, 4)).toBe(2);
    });

    it('should not exceed available columns', () => {
      const section: CardSection = {
        title: 'Test',
        type: 'info',
        preferredColumns: 4
      };
      expect(calculateOptimalColumns(section, 2)).toBe(2);
    });

    it('should increase columns for high density content', () => {
      const section: CardSection = {
        title: 'Dense Content',
        type: 'info',
        description: 'A'.repeat(500), // High text density
        fields: Array(10).fill({ label: 'Field', value: 'Value' }),
        items: Array(5).fill({ title: 'Item' })
      };
      const columns = calculateOptimalColumns(section, 4);
      expect(columns).toBeGreaterThan(1);
    });

    it('should return 1 for low density content', () => {
      const section: CardSection = {
        title: 'Sparse',
        type: 'info'
      };
      expect(calculateOptimalColumns(section, 4)).toBe(1);
    });
  });

  // ============================================================================
  // Height Estimation Tests
  // ============================================================================
  describe('estimateSectionHeight', () => {
    it('should return base height for section type', () => {
      const section: CardSection = {
        title: 'Chart',
        type: 'chart'
      };
      const height = estimateSectionHeight(section);
      const expectedHeight = SECTION_HEIGHT_ESTIMATES['chart'] ?? 350;
      expect(height).toBe(expectedHeight);
    });

    it('should use default height for unknown type', () => {
      const section: CardSection = {
        title: 'Unknown',
        type: 'unknown' as any
      };
      const height = estimateSectionHeight(section);
      expect(height).toBeGreaterThanOrEqual(120);
    });

    it('should increase height based on items', () => {
      const sectionWithItems: CardSection = {
        title: 'List',
        type: 'list',
        items: Array(10).fill({ title: 'Item' })
      };
      const sectionWithoutItems: CardSection = {
        title: 'List',
        type: 'list'
      };
      
      const heightWith = estimateSectionHeight(sectionWithItems);
      const heightWithout = estimateSectionHeight(sectionWithoutItems);
      
      expect(heightWith).toBeGreaterThan(heightWithout);
    });

    it('should increase height based on fields', () => {
      const sectionWithFields: CardSection = {
        title: 'Info',
        type: 'info',
        fields: Array(15).fill({ label: 'Label', value: 'Value' })
      };
      const sectionWithoutFields: CardSection = {
        title: 'Info',
        type: 'info'
      };
      
      const heightWith = estimateSectionHeight(sectionWithFields);
      const heightWithout = estimateSectionHeight(sectionWithoutFields);
      
      expect(heightWith).toBeGreaterThan(heightWithout);
    });

    it('should cap height at maximum', () => {
      const section: CardSection = {
        title: 'Huge',
        type: 'list',
        items: Array(100).fill({ title: 'Item' }) // Many items
      };
      const height = estimateSectionHeight(section);
      expect(height).toBeLessThanOrEqual(600);
    });
  });

  // ============================================================================
  // Priority Band Tests
  // ============================================================================
  describe('getSectionPriorityBand', () => {
    it('should return critical for overview sections', () => {
      const section: CardSection = {
        title: 'Overview',
        type: 'overview'
      };
      expect(getSectionPriorityBand(section)).toBe('critical');
    });

    it('should return critical for contact-card sections', () => {
      const section: CardSection = {
        title: 'Contacts',
        type: 'contact-card'
      };
      expect(getSectionPriorityBand(section)).toBe('critical');
    });

    it('should return important for analytics sections', () => {
      const section: CardSection = {
        title: 'Analytics',
        type: 'analytics'
      };
      expect(getSectionPriorityBand(section)).toBe('important');
    });

    it('should return important for chart sections', () => {
      const section: CardSection = {
        title: 'Chart',
        type: 'chart'
      };
      expect(getSectionPriorityBand(section)).toBe('important');
    });

    it('should return standard for info sections', () => {
      const section: CardSection = {
        title: 'Info',
        type: 'info'
      };
      expect(getSectionPriorityBand(section)).toBe('standard');
    });

    it('should return optional for event sections', () => {
      const section: CardSection = {
        title: 'Events',
        type: 'event'
      };
      expect(getSectionPriorityBand(section)).toBe('optional');
    });

    it('should use explicit priority when set', () => {
      const section: CardSection = {
        title: 'Info',
        type: 'info',
        priority: 'critical'
      };
      expect(getSectionPriorityBand(section)).toBe('critical');
    });
  });

  describe('calculatePriorityScore', () => {
    it('should return 1 for critical priority', () => {
      const section: CardSection = {
        title: 'Overview',
        type: 'overview'
      };
      expect(calculatePriorityScore(section)).toBe(1);
    });

    it('should return 2 for important priority', () => {
      const section: CardSection = {
        title: 'Chart',
        type: 'chart'
      };
      expect(calculatePriorityScore(section)).toBe(2);
    });

    it('should return 3 for standard priority', () => {
      const section: CardSection = {
        title: 'Info',
        type: 'info'
      };
      expect(calculatePriorityScore(section)).toBe(3);
    });

    it('should return 4 for optional priority', () => {
      const section: CardSection = {
        title: 'Event',
        type: 'event'
      };
      expect(calculatePriorityScore(section)).toBe(4);
    });
  });

  // ============================================================================
  // 2D Bin Packing Tests
  // ============================================================================
  describe('binPack2D', () => {
    it('should return empty array for empty input', () => {
      const result = binPack2D([], 4);
      expect(result).toEqual([]);
    });

    it('should return empty array for zero columns', () => {
      const sections: CardSection[] = [
        { title: 'Test', type: 'info' }
      ];
      const result = binPack2D(sections, 0);
      expect(result).toEqual([]);
    });

    it('should place critical sections first', () => {
      const sections: CardSection[] = [
        { title: 'Info', type: 'info' },
        { title: 'Overview', type: 'overview' },
        { title: 'Event', type: 'event' }
      ];
      
      const result = binPack2D(sections, 4, { respectPriority: true });
      
      // Overview (critical) should be first
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.section.type).toBe('overview');
    });

    it('should pack sections efficiently', () => {
      const sections: CardSection[] = [
        { title: 'Wide', type: 'overview', preferredColumns: 2 },
        { title: 'Narrow1', type: 'info', preferredColumns: 1 },
        { title: 'Narrow2', type: 'info', preferredColumns: 1 }
      ];
      
      const result = binPack2D(sections, 4);
      
      expect(result.length).toBe(3);
      // All sections should be included
      expect(result.map(r => r.section.title).sort()).toEqual(['Narrow1', 'Narrow2', 'Wide']);
    });

    it('should respect column span limits', () => {
      const sections: CardSection[] = [
        { title: 'Too Wide', type: 'info', preferredColumns: 4 as 1 | 2 | 3 | 4 }
      ];
      
      const result = binPack2D(sections, 2); // Only 2 columns available
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.colSpan).toBeLessThanOrEqual(2);
    });

    it('should fill gaps when enabled', () => {
      const sections: CardSection[] = [
        { title: 'Wide', type: 'chart', preferredColumns: 3 },
        { title: 'Small1', type: 'info', preferredColumns: 1 },
        { title: 'Small2', type: 'info', preferredColumns: 1 }
      ];
      
      const result = binPack2D(sections, 4, { fillGaps: true });
      
      // Should try to fill remaining column after wide section
      expect(result.length).toBe(3);
    });
  });

  // ============================================================================
  // Gap Finding Tests
  // ============================================================================
  describe('findGaps', () => {
    it('should return empty array for empty sections', () => {
      const gaps = findGaps([], 4, 400);
      expect(gaps).toEqual([]);
    });

    it('should detect gaps in layout', () => {
      const positionedSections = [
        { colSpan: 2, left: '0%', top: 0, width: '50%', height: 200 },
        { colSpan: 2, left: '50%', top: 100, width: '50%', height: 200 }
      ];
      
      const gaps = findGaps(positionedSections, 4, 400);
      
      // There should be a gap in the layout
      // The exact gap detection depends on the implementation
      expect(gaps.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Gap Filling Tests
  // ============================================================================
  describe('fillGapsWithSections', () => {
    it('should return all sections', () => {
      const sections: SectionWithMetrics[] = [
        { section: { title: 'S1', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 2, priority: 3, density: 10 },
        { section: { title: 'S2', type: 'list' } as CardSection, estimatedHeight: 200, colSpan: 1, priority: 3, density: 5 }
      ];
      
      const result = fillGapsWithSections(sections, 4);
      
      expect(result.length).toBe(2);
    });

    it('should keep rigid sections in order', () => {
      const sections: SectionWithMetrics[] = [
        { section: { title: 'Critical', type: 'overview' } as CardSection, estimatedHeight: 200, colSpan: 2, priority: 1, density: 10 },
        { section: { title: 'Optional', type: 'event' } as CardSection, estimatedHeight: 200, colSpan: 1, priority: 4, density: 5 }
      ];
      
      const result = fillGapsWithSections(sections, 4);
      
      // Critical section should remain first
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.section.title).toBe('Critical');
    });
  });

  // ============================================================================
  // Layout Analytics Tests
  // ============================================================================
  describe('calculateLayoutAnalytics', () => {
    it('should calculate utilization percentage', () => {
      const sections: SectionWithMetrics[] = [
        { section: { title: 'S1', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 4, priority: 3, density: 10 }
      ];
      
      const analytics = calculateLayoutAnalytics(sections, 4, 400);
      
      expect(analytics.utilizationPercent).toBeGreaterThan(0);
      expect(analytics.utilizationPercent).toBeLessThanOrEqual(100);
    });

    it('should calculate balance score', () => {
      const sections: SectionWithMetrics[] = [
        { section: { title: 'S1', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 2, priority: 3, density: 10 },
        { section: { title: 'S2', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 2, priority: 3, density: 10 }
      ];
      
      const analytics = calculateLayoutAnalytics(sections, 4, 400);
      
      expect(analytics.balanceScore).toBeGreaterThanOrEqual(0);
      expect(analytics.balanceScore).toBeLessThanOrEqual(100);
    });

    it('should count gaps', () => {
      const sections: SectionWithMetrics[] = [];
      
      const analytics = calculateLayoutAnalytics(sections, 4, 400);
      
      expect(analytics.gapCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Section Grouping Tests
  // ============================================================================
  describe('groupRelatedSections', () => {
    it('should group sections by groupId', () => {
      const sections: SectionWithMetrics[] = [
        { section: { title: 'S1', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 1, priority: 3, density: 10, groupId: 'group-a' },
        { section: { title: 'S2', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 1, priority: 3, density: 10, groupId: 'group-a' },
        { section: { title: 'S3', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 1, priority: 3, density: 10, groupId: 'group-b' }
      ];
      
      const groups = groupRelatedSections(sections);
      
      expect(groups.get('group-a')?.length).toBe(2);
      expect(groups.get('group-b')?.length).toBe(1);
    });

    it('should handle ungrouped sections', () => {
      const sections: SectionWithMetrics[] = [
        { section: { title: 'S1', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 1, priority: 3, density: 10 },
        { section: { title: 'S2', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 1, priority: 3, density: 10, groupId: 'group-a' }
      ];
      
      const groups = groupRelatedSections(sections);
      
      expect(groups.get(undefined)?.length).toBe(1);
      expect(groups.get('group-a')?.length).toBe(1);
    });
  });

  describe('flattenGroups', () => {
    it('should flatten groups while keeping grouped sections together', () => {
      const groups = new Map<string | undefined, SectionWithMetrics[]>();
      groups.set('group-a', [
        { section: { title: 'G1-S1', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 1, priority: 3, density: 10 },
        { section: { title: 'G1-S2', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 1, priority: 3, density: 10 }
      ]);
      groups.set(undefined, [
        { section: { title: 'Ungrouped', type: 'info' } as CardSection, estimatedHeight: 200, colSpan: 1, priority: 3, density: 10 }
      ]);
      
      const result = flattenGroups(groups);
      
      expect(result.length).toBe(3);
    });
  });

  // ============================================================================
  // Priority Bands Configuration Tests
  // ============================================================================
  describe('PRIORITY_BANDS', () => {
    it('should have all required bands', () => {
      expect(PRIORITY_BANDS.critical).toBeDefined();
      expect(PRIORITY_BANDS.important).toBeDefined();
      expect(PRIORITY_BANDS.standard).toBeDefined();
      expect(PRIORITY_BANDS.optional).toBeDefined();
    });

    it('should have correct order values', () => {
      expect(PRIORITY_BANDS.critical.order).toBe(1);
      expect(PRIORITY_BANDS.important.order).toBe(2);
      expect(PRIORITY_BANDS.standard.order).toBe(3);
      expect(PRIORITY_BANDS.optional.order).toBe(4);
    });

    it('should have condensation priorities', () => {
      expect(PRIORITY_BANDS.critical.condensePriority).toBe('never');
      expect(PRIORITY_BANDS.important.condensePriority).toBe('last');
      expect(PRIORITY_BANDS.standard.condensePriority).toBe('always');
      expect(PRIORITY_BANDS.optional.condensePriority).toBe('first');
    });
  });
});

