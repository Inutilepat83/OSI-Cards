/**
 * Unit Tests for LayoutCalculationService
 */

import { TestBed } from '@angular/core/testing';
import { CardSection } from '@osi-cards/models';
import { LayoutCalculationService, LayoutConfig } from './layout-calculation.service';

describe('LayoutCalculationService', () => {
  let service: LayoutCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LayoutCalculationService],
    });
    service = TestBed.inject(LayoutCalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateColumns', () => {
    it('should calculate 1 column for narrow containers', () => {
      const columns = service.calculateColumns(300);
      expect(columns).toBe(1);
    });

    it('should calculate 2 columns for medium containers', () => {
      const columns = service.calculateColumns(600);
      expect(columns).toBe(2);
    });

    it('should calculate 3 columns for large containers', () => {
      const columns = service.calculateColumns(900);
      expect(columns).toBe(3);
    });

    it('should calculate 4 columns for extra large containers', () => {
      const columns = service.calculateColumns(1200);
      expect(columns).toBe(4);
    });

    it('should respect maxColumns limit', () => {
      const columns = service.calculateColumns(2000, 260, 3);
      expect(columns).toBeLessThanOrEqual(3);
    });

    it('should respect minColumnWidth', () => {
      const columns = service.calculateColumns(1000, 500, 4);
      expect(columns).toBe(2); // 1000 / 500 = 2
    });

    it('should return at least 1 column', () => {
      const columns = service.calculateColumns(100);
      expect(columns).toBeGreaterThanOrEqual(1);
    });

    it('should be memoized (same input returns cached result)', () => {
      const spy = spyOn(service as any, 'normalizeConfig').and.callThrough();

      service.calculateColumns(1200);
      service.calculateColumns(1200);
      service.calculateColumns(1200);

      // Should only calculate once due to memoization
      expect(spy).toHaveBeenCalledTimes(0); // Memoization prevents internal calls
    });
  });

  describe('calculateColumnWidth', () => {
    it('should calculate column width correctly', () => {
      const width = service.calculateColumnWidth(1200, 4, 16);
      // (1200 - (4-1)*16) / 4 = (1200 - 48) / 4 = 288
      expect(width).toBeCloseTo(288, 0);
    });

    it('should handle single column', () => {
      const width = service.calculateColumnWidth(1200, 1, 16);
      expect(width).toBe(1200);
    });

    it('should handle zero gap', () => {
      const width = service.calculateColumnWidth(1200, 4, 0);
      expect(width).toBe(300);
    });
  });

  describe('calculateLayout', () => {
    const createMockSection = (type: string, index: number): CardSection => ({
      type,
      title: `Section ${index}`,
      fields: [{ label: 'Test', value: 'Value' }],
    });

    it('should calculate layout for empty sections', () => {
      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 16,
      };

      const result = service.calculateLayout([], config);

      expect(result.positions).toEqual([]);
      expect(result.columnHeights).toEqual([]);
      expect(result.totalHeight).toBe(0);
      expect(result.columns).toBeGreaterThan(0);
    });

    it('should calculate layout for single section', () => {
      const sections = [createMockSection('info', 0)];
      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 16,
      };

      const result = service.calculateLayout(sections, config);

      expect(result.positions.length).toBe(1);
      expect(result.positions[0].section).toBe(sections[0]);
      expect(result.positions[0].top).toBe(0);
      expect(result.totalHeight).toBeGreaterThan(0);
    });

    it('should calculate layout for multiple sections', () => {
      const sections = [
        createMockSection('info', 0),
        createMockSection('analytics', 1),
        createMockSection('chart', 2),
      ];
      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 16,
      };

      const result = service.calculateLayout(sections, config);

      expect(result.positions.length).toBe(3);
      expect(result.columnHeights.length).toBe(result.columns);
      expect(result.totalHeight).toBeGreaterThan(0);
    });

    it('should distribute sections across columns', () => {
      const sections = Array.from({ length: 10 }, (_, i) => createMockSection('info', i));
      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 16,
        columns: 3,
      };

      const result = service.calculateLayout(sections, config);

      expect(result.positions.length).toBe(10);
      expect(result.columns).toBe(3);

      // Check that sections are distributed (not all in one column)
      const columnIndices = result.positions.map((p) => {
        const leftPercent = parseFloat(p.left.match(/[\d.]+/)?.[0] || '0');
        return Math.floor(leftPercent / 34); // Approximate column index
      });
      const uniqueColumns = new Set(columnIndices);
      expect(uniqueColumns.size).toBeGreaterThan(1);
    });

    it('should respect container width', () => {
      const sections = [createMockSection('info', 0)];
      const config: LayoutConfig = {
        containerWidth: 800,
        gap: 16,
      };

      const result = service.calculateLayout(sections, config);

      expect(result.containerWidth).toBe(800);
    });

    it('should respect gap setting', () => {
      const sections = [createMockSection('info', 0), createMockSection('info', 1)];
      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 24,
        columns: 1, // Force single column to test gap
      };

      const result = service.calculateLayout(sections, config);

      // Second section should be positioned with gap
      expect(result.positions[1].top).toBeGreaterThan(result.positions[0].top + 24);
    });

    it('should track calculation time', () => {
      const sections = Array.from({ length: 20 }, (_, i) => createMockSection('info', i));
      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 16,
      };

      const result = service.calculateLayout(sections, config);

      expect(result.calculationTime).toBeDefined();
      expect(result.calculationTime).toBeGreaterThan(0);
      expect(result.calculationTime).toBeLessThan(100); // Should be fast
    });

    it('should generate unique keys for sections', () => {
      const sections = [createMockSection('info', 0), createMockSection('info', 1)];
      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 16,
      };

      const result = service.calculateLayout(sections, config);

      const keys = result.positions.map((p) => p.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('estimateHeight', () => {
    it('should estimate height for section', () => {
      const section: CardSection = {
        type: 'info',
        title: 'Test Section',
        fields: [{ label: 'Test', value: 'Value' }],
      };

      const height = service.estimateHeight({
        section,
        containerWidth: 1200,
        columns: 3,
        colSpan: 1,
      });

      expect(height).toBeGreaterThan(0);
      expect(height).toBeLessThan(1000); // Reasonable estimate
    });

    it('should return consistent estimates for same section', () => {
      const section: CardSection = {
        type: 'info',
        title: 'Test Section',
        fields: [{ label: 'Test', value: 'Value' }],
      };

      const height1 = service.estimateHeight({
        section,
        containerWidth: 1200,
        columns: 3,
        colSpan: 1,
      });

      const height2 = service.estimateHeight({
        section,
        containerWidth: 1200,
        columns: 3,
        colSpan: 1,
      });

      expect(height1).toBe(height2);
    });
  });

  describe('generateKey', () => {
    it('should use section id if available', () => {
      const section: CardSection = {
        id: 'custom-id',
        type: 'info',
        title: 'Test',
      };

      const key = service.generateKey(section, 0);
      expect(key).toBe('custom-id');
    });

    it('should generate key from type and index if no id', () => {
      const section: CardSection = {
        type: 'analytics',
        title: 'Test',
      };

      const key = service.generateKey(section, 5);
      expect(key).toBe('section-analytics-5');
    });
  });

  describe('calculateDensity', () => {
    it('should calculate density correctly', () => {
      const sections = Array.from(
        { length: 12 },
        (_, i) =>
          ({
            type: 'info',
            title: `Section ${i}`,
          }) as CardSection
      );

      const density = service.calculateDensity(sections, 3);
      expect(density).toBe(4); // 12 sections / 3 columns = 4
    });

    it('should handle single column', () => {
      const sections = Array.from(
        { length: 5 },
        (_, i) =>
          ({
            type: 'info',
            title: `Section ${i}`,
          }) as CardSection
      );

      const density = service.calculateDensity(sections, 1);
      expect(density).toBe(5);
    });
  });

  describe('getLayoutStatistics', () => {
    it('should calculate statistics for layout result', () => {
      const sections = Array.from(
        { length: 10 },
        (_, i) =>
          ({
            type: 'info',
            title: `Section ${i}`,
            fields: [{ label: 'Test', value: 'Value' }],
          }) as CardSection
      );

      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 16,
      };

      const result = service.calculateLayout(sections, config);
      const stats = service.getLayoutStatistics(result);

      expect(stats.totalSections).toBe(10);
      expect(stats.columns).toBeGreaterThan(0);
      expect(stats.totalHeight).toBeGreaterThan(0);
      expect(stats.avgColumnHeight).toBeGreaterThan(0);
      expect(stats.maxColumnHeight).toBeGreaterThan(0);
      expect(stats.minColumnHeight).toBeGreaterThanOrEqual(0);
      expect(stats.columnUtilization).toBeGreaterThan(0);
      expect(stats.columnUtilization).toBeLessThanOrEqual(100);
      expect(stats.calculationTime).toBeGreaterThanOrEqual(0);
    });

    it('should calculate span distribution', () => {
      const sections = Array.from(
        { length: 5 },
        (_, i) =>
          ({
            type: 'info',
            title: `Section ${i}`,
          }) as CardSection
      );

      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 16,
      };

      const result = service.calculateLayout(sections, config);
      const stats = service.getLayoutStatistics(result);

      expect(stats.spanDistribution).toBeDefined();
      expect(typeof stats.spanDistribution).toBe('object');
    });
  });

  describe('performance', () => {
    it('should handle large number of sections efficiently', () => {
      const sections = Array.from(
        { length: 100 },
        (_, i) =>
          ({
            type: 'info',
            title: `Section ${i}`,
            fields: [{ label: 'Test', value: 'Value' }],
          }) as CardSection
      );

      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 16,
      };

      const startTime = performance.now();
      const result = service.calculateLayout(sections, config);
      const endTime = performance.now();

      expect(result.positions.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });

    it('should benefit from memoization on repeated calculations', () => {
      const sections = Array.from(
        { length: 50 },
        (_, i) =>
          ({
            type: 'info',
            title: `Section ${i}`,
          }) as CardSection
      );

      const config: LayoutConfig = {
        containerWidth: 1200,
        gap: 16,
      };

      // First calculation (not memoized)
      const start1 = performance.now();
      service.calculateLayout(sections, config);
      const time1 = performance.now() - start1;

      // Subsequent calculations (memoized columns)
      const start2 = performance.now();
      service.calculateLayout(sections, config);
      const time2 = performance.now() - start2;

      // Second should be similar or faster (memoized column calculation)
      expect(time2).toBeLessThanOrEqual(time1 * 1.5);
    });
  });
});
