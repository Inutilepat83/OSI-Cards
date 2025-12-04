/**
 * A/B Testing Utilities
 *
 * Utilities for A/B testing and feature experiments.
 *
 * @example
 * ```typescript
 * import { ABTest, getVariant } from '@osi-cards/utils';
 *
 * const test = new ABTest('button-color', ['red', 'blue']);
 * const variant = test.getVariant();
 * test.trackConversion();
 * ```
 */

export interface ABTestConfig {
  name: string;
  variants: string[];
  weights?: number[];
  storageKey?: string;
}

export interface ABTestResult {
  variant: string;
  conversions: number;
  impressions: number;
  conversionRate: number;
}

export class ABTest {
  private storageKey: string;
  private currentVariant: string | null = null;

  constructor(private config: ABTestConfig) {
    this.storageKey = config.storageKey || `ab_test_${config.name}`;
    this.currentVariant = this.loadVariant();
  }

  getVariant(): string {
    if (this.currentVariant) {
      return this.currentVariant;
    }

    const variant = this.selectVariant();
    this.saveVariant(variant);
    this.trackImpression(variant);

    this.currentVariant = variant;
    return variant;
  }

  trackConversion(): void {
    const variant = this.getVariant();
    this.incrementConversions(variant);
  }

  getResults(): Record<string, ABTestResult> {
    const results: Record<string, ABTestResult> = {};

    this.config.variants.forEach((variant) => {
      const impressions = this.getImpressions(variant);
      const conversions = this.getConversions(variant);

      results[variant] = {
        variant,
        impressions,
        conversions,
        conversionRate: impressions > 0 ? conversions / impressions : 0,
      };
    });

    return results;
  }

  reset(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(`${this.storageKey}_stats`);
    this.currentVariant = null;
  }

  private selectVariant(): string {
    const { variants, weights } = this.config;

    if (weights && weights.length === variants.length) {
      return this.weightedRandom(variants, weights);
    }

    return variants[Math.floor(Math.random() * variants.length)];
  }

  private weightedRandom(items: string[], weights: number[]): string {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[0];
  }

  private loadVariant(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  private saveVariant(variant: string): void {
    localStorage.setItem(this.storageKey, variant);
  }

  private getStats(): Record<string, { impressions: number; conversions: number }> {
    const stats = localStorage.getItem(`${this.storageKey}_stats`);
    return stats ? JSON.parse(stats) : {};
  }

  private saveStats(stats: Record<string, { impressions: number; conversions: number }>): void {
    localStorage.setItem(`${this.storageKey}_stats`, JSON.stringify(stats));
  }

  private trackImpression(variant: string): void {
    const stats = this.getStats();
    if (!stats[variant]) {
      stats[variant] = { impressions: 0, conversions: 0 };
    }
    stats[variant].impressions++;
    this.saveStats(stats);
  }

  private incrementConversions(variant: string): void {
    const stats = this.getStats();
    if (!stats[variant]) {
      stats[variant] = { impressions: 0, conversions: 0 };
    }
    stats[variant].conversions++;
    this.saveStats(stats);
  }

  private getImpressions(variant: string): number {
    const stats = this.getStats();
    return stats[variant]?.impressions || 0;
  }

  private getConversions(variant: string): number {
    const stats = this.getStats();
    return stats[variant]?.conversions || 0;
  }
}

/**
 * Get variant for test
 */
export function getVariant(testName: string, variants: string[]): string {
  const test = new ABTest({ name: testName, variants });
  return test.getVariant();
}

/**
 * Track conversion for test
 */
export function trackConversion(testName: string, variants: string[]): void {
  const test = new ABTest({ name: testName, variants });
  test.trackConversion();
}
