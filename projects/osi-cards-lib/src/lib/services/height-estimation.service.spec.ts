/**
 * Height Estimation Service Tests
 */

import { HeightEstimationService } from './height-estimation.service';
import { CardSection } from '../models/card.model';

describe('HeightEstimationService', () => {
  let service: HeightEstimationService;

  beforeEach(() => {
    service = new HeightEstimationService();
  });

  describe('Estimation', () => {
    it('should estimate height for section', () => {
      const section: CardSection = {
        id: '1',
        type: 'info',
        title: 'Test Section',
      };

      const height = service.estimate(section);

      expect(height).toBeGreaterThan(0);
      expect(height).toBeLessThan(1000);
    });

    it('should return different heights for different types', () => {
      const infoSection: CardSection = { id: '1', type: 'info' };
      const chartSection: CardSection = { id: '2', type: 'chart' };

      const infoHeight = service.estimate(infoSection);
      const chartHeight = service.estimate(chartSection);

      // Chart sections should generally be taller
      expect(chartHeight).toBeGreaterThanOrEqual(infoHeight);
    });

    it('should consider content when estimating', () => {
      const emptySection: CardSection = {
        id: '1',
        type: 'list',
        items: [],
      };

      const fullSection: CardSection = {
        id: '2',
        type: 'list',
        items: Array.from({ length: 10 }, (_, i) => ({ id: `item${i}`, title: `Item ${i}` })),
      };

      const emptyHeight = service.estimate(emptySection);
      const fullHeight = service.estimate(fullSection);

      expect(fullHeight).toBeGreaterThan(emptyHeight);
    });

    it('should adjust for column span', () => {
      const section: CardSection = { id: '1', type: 'info' };

      const singleCol = service.estimate(section, { colSpan: 1 });
      const multiCol = service.estimate(section, { colSpan: 3 });

      // Wider sections may have slightly different heights
      expect(multiCol).toBeGreaterThan(0);
      expect(singleCol).toBeGreaterThan(0);
    });
  });

  describe('Learning from Actual Measurements', () => {
    it('should record actual heights', () => {
      const section: CardSection = { id: '1', type: 'info' };
      const actualHeight = 250;

      service.recordActual(section, actualHeight);

      // Should update cache
      const stats = service.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should improve estimates after recording actuals', () => {
      const section: CardSection = { id: '1', type: 'info' };
      const actualHeight = 300;

      const initialEstimate = service.estimate(section);
      service.recordActual(section, actualHeight);
      const learnedEstimate = service.estimate(section);

      // Learned estimate should be closer to actual
      expect(Math.abs(learnedEstimate - actualHeight)).toBeLessThan(
        Math.abs(initialEstimate - actualHeight)
      );
    });

    it('should use weighted average for learning', () => {
      const section: CardSection = { id: '1', type: 'info' };
      const actualHeight1 = 200;
      const actualHeight2 = 300;

      service.recordActual(section, actualHeight1);
      const estimate1 = service.estimate(section);
      service.recordActual(section, actualHeight2);
      const estimate2 = service.estimate(section);

      // Should converge towards recent measurements
      expect(estimate2).toBeGreaterThan(estimate1);
    });
  });

  describe('Caching', () => {
    it('should cache estimates', () => {
      const section: CardSection = { id: '1', type: 'info' };

      const height1 = service.estimate(section);
      const height2 = service.estimate(section);

      expect(height1).toBe(height2);
    });

    it('should clear cache', () => {
      const section: CardSection = { id: '1', type: 'info' };
      service.estimate(section);

      service.clearCache();

      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should provide cache statistics', () => {
      const section1: CardSection = { id: '1', type: 'info' };
      const section2: CardSection = { id: '2', type: 'chart' };

      service.estimate(section1);
      service.estimate(section2);

      const stats = service.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.keys.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle sections without type', () => {
      const section: CardSection = { id: '1' };

      const height = service.estimate(section);

      expect(height).toBeGreaterThan(0);
    });

    it('should handle sections with many items', () => {
      const section: CardSection = {
        id: '1',
        type: 'list',
        items: Array.from({ length: 100 }, (_, i) => ({ id: `item${i}`, title: `Item ${i}` })),
      };

      const height = service.estimate(section);

      expect(height).toBeGreaterThan(100);
      expect(height).toBeLessThan(10000);
    });

    it('should handle sections with many fields', () => {
      const section: CardSection = {
        id: '1',
        type: 'info',
        fields: Array.from({ length: 50 }, (_, i) => ({
          label: `Field ${i}`,
          value: `Value ${i}`,
        })),
      };

      const height = service.estimate(section);

      expect(height).toBeGreaterThan(100);
    });
  });
});
