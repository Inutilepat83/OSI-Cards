/**
 * Performance budgets utilities
 * Set and enforce performance budgets in build process
 */

export interface PerformanceBudget {
  name: string;
  maxSize: number;
  maxGzippedSize?: number;
  type: 'initial' | 'chunk' | 'asset' | 'total';
}

export interface BudgetResult {
  name: string;
  actual: number;
  budget: number;
  gzipped?: number;
  gzippedBudget?: number;
  withinBudget: boolean;
  warning?: string;
}

/**
 * Performance budget manager
 */
export class PerformanceBudgetManager {
  private budgets: PerformanceBudget[] = [];

  /**
   * Add a performance budget
   */
  addBudget(budget: PerformanceBudget): void {
    this.budgets.push(budget);
  }

  /**
   * Check budgets against actual sizes
   */
  checkBudgets(actualSizes: Map<string, { size: number; gzipped?: number }>): BudgetResult[] {
    const results: BudgetResult[] = [];

    for (const budget of this.budgets) {
      const actual = actualSizes.get(budget.name);
      if (!actual) {
        continue;
      }

      const withinBudget = actual.size <= budget.maxSize &&
        (!budget.maxGzippedSize || !actual.gzipped || actual.gzipped <= budget.maxGzippedSize);

      let warning: string | undefined;
      if (!withinBudget) {
        const overage = actual.size - budget.maxSize;
        warning = `Exceeds budget by ${formatBytes(overage)}`;
      }

      results.push({
        name: budget.name,
        actual: actual.size,
        budget: budget.maxSize,
        gzipped: actual.gzipped,
        gzippedBudget: budget.maxGzippedSize,
        withinBudget,
        warning
      });
    }

    return results;
  }

  /**
   * Get default budgets
   */
  static getDefaultBudgets(): PerformanceBudget[] {
    return [
      {
        name: 'main',
        maxSize: 500 * 1024, // 500KB
        maxGzippedSize: 150 * 1024, // 150KB gzipped
        type: 'initial'
      },
      {
        name: 'vendor',
        maxSize: 1000 * 1024, // 1MB
        maxGzippedSize: 300 * 1024, // 300KB gzipped
        type: 'chunk'
      },
      {
        name: 'total',
        maxSize: 2000 * 1024, // 2MB
        maxGzippedSize: 600 * 1024, // 600KB gzipped
        type: 'total'
      }
    ];
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}


