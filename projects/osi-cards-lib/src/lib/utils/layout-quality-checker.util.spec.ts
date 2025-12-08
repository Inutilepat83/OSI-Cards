/**
 * Layout Quality Checker Tests
 */

import {
  validateLayoutQuality,
  isLayoutQualityAcceptable,
  getLayoutQualitySummary,
  LayoutMetrics,
} from './layout-quality-checker.util';
import { CardSection } from '../models/card.model';

describe('LayoutQualityChecker', () => {
  const createSections = (count: number): CardSection[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `s${i}`,
      type: 'info',
      title: `Section ${i}`,
    }));

  describe('validateLayoutQuality', () => {
    it('should return excellent quality for perfect layout', () => {
      const metrics: LayoutMetrics = {
        utilization: 95,
        gapCount: 0,
        gapArea: 0,
        heightVariance: 10,
        sectionCount: 10,
      };

      const result = validateLayoutQuality(metrics);

      expect(result.quality).toBe('excellent');
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.issues).toHaveLength(0);
    });

    it('should return good quality for acceptable layout', () => {
      const metrics: LayoutMetrics = {
        utilization: 80,
        gapCount: 1,
        gapArea: 500,
        heightVariance: 50,
        sectionCount: 10,
      };

      const result = validateLayoutQuality(metrics);

      expect(result.quality).toBe('good');
      expect(result.score).toBeGreaterThanOrEqual(75);
    });

    it('should return fair quality for moderate issues', () => {
      const metrics: LayoutMetrics = {
        utilization: 70,
        gapCount: 3,
        gapArea: 2000,
        heightVariance: 150,
        sectionCount: 10,
      };

      const result = validateLayoutQuality(metrics);

      expect(result.quality).toBe('fair');
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should return poor quality for bad layout', () => {
      const metrics: LayoutMetrics = {
        utilization: 50,
        gapCount: 8,
        gapArea: 10000,
        heightVariance: 300,
        sectionCount: 10,
      };

      const result = validateLayoutQuality(metrics);

      expect(result.quality).toBe('poor');
      expect(result.score).toBeLessThan(60);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify low utilization issues', () => {
      const metrics: LayoutMetrics = {
        utilization: 60,
        gapCount: 0,
        sectionCount: 10,
      };

      const result = validateLayoutQuality(metrics);

      expect(result.issues.some((i) => i.includes('utilization'))).toBe(true);
      expect(result.recommendations.some((r) => r.includes('expansion'))).toBe(true);
    });

    it('should identify gap issues', () => {
      const metrics: LayoutMetrics = {
        utilization: 80,
        gapCount: 5,
        sectionCount: 10,
      };

      const result = validateLayoutQuality(metrics);

      expect(result.issues.some((i) => i.includes('gap'))).toBe(true);
      expect(result.recommendations.some((r) => r.includes('gap'))).toBe(true);
    });

    it('should identify height variance issues', () => {
      const metrics: LayoutMetrics = {
        utilization: 80,
        gapCount: 0,
        heightVariance: 250,
        sectionCount: 10,
      };

      const result = validateLayoutQuality(metrics);

      expect(result.issues.some((i) => i.includes('variance'))).toBe(true);
    });
  });

  describe('isLayoutQualityAcceptable', () => {
    it('should accept excellent and good layouts with normal strictness', () => {
      const excellent: LayoutMetrics = {
        utilization: 95,
        gapCount: 0,
        sectionCount: 10,
      };
      const good: LayoutMetrics = {
        utilization: 80,
        gapCount: 1,
        sectionCount: 10,
      };

      expect(isLayoutQualityAcceptable(excellent)).toBe(true);
      expect(isLayoutQualityAcceptable(good)).toBe(true);
    });

    it('should accept fair layouts with normal strictness', () => {
      const fair: LayoutMetrics = {
        utilization: 70,
        gapCount: 3,
        sectionCount: 10,
      };

      expect(isLayoutQualityAcceptable(fair, 'normal')).toBe(true);
    });

    it('should reject poor layouts with normal strictness', () => {
      const poor: LayoutMetrics = {
        utilization: 50,
        gapCount: 8,
        sectionCount: 10,
      };

      expect(isLayoutQualityAcceptable(poor, 'normal')).toBe(false);
    });

    it('should be strict with strict mode', () => {
      const fair: LayoutMetrics = {
        utilization: 75,
        gapCount: 2,
        sectionCount: 10,
      };

      expect(isLayoutQualityAcceptable(fair, 'strict')).toBe(false);
    });

    it('should be lenient with lenient mode', () => {
      const poor: LayoutMetrics = {
        utilization: 60,
        gapCount: 5,
        sectionCount: 10,
      };

      expect(isLayoutQualityAcceptable(poor, 'lenient')).toBe(true);
    });
  });

  describe('getLayoutQualitySummary', () => {
    it('should generate summary string', () => {
      const metrics: LayoutMetrics = {
        utilization: 85,
        gapCount: 1,
        sectionCount: 10,
      };

      const result = validateLayoutQuality(metrics);
      const summary = getLayoutQualitySummary(result);

      expect(summary).toContain('Layout Quality');
      expect(summary).toContain('Utilization');
      expect(summary).toContain('Gaps');
    });

    it('should include issues in summary', () => {
      const metrics: LayoutMetrics = {
        utilization: 60,
        gapCount: 5,
        sectionCount: 10,
      };

      const result = validateLayoutQuality(metrics);
      const summary = getLayoutQualitySummary(result);

      expect(summary).toContain('Issues');
    });

    it('should include recommendations in summary', () => {
      const metrics: LayoutMetrics = {
        utilization: 65,
        gapCount: 4,
        sectionCount: 10,
      };

      const result = validateLayoutQuality(metrics);
      const summary = getLayoutQualitySummary(result);

      expect(summary).toContain('Recommendations');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sections', () => {
      const metrics: LayoutMetrics = {
        utilization: 0,
        gapCount: 0,
        sectionCount: 0,
      };

      const result = validateLayoutQuality(metrics);

      expect(result.quality).toBeDefined();
      expect(result.score).toBeDefined();
    });

    it('should handle missing optional metrics', () => {
      const metrics: LayoutMetrics = {
        utilization: 80,
        gapCount: 2,
        sectionCount: 10,
        // gapArea and heightVariance are optional
      };

      const result = validateLayoutQuality(metrics);

      expect(result.quality).toBeDefined();
      expect(result.metrics.gapArea).toBe(0);
      expect(result.metrics.heightVariance).toBe(0);
    });
  });
});



