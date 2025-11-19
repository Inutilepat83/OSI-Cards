import { Injectable, inject, isDevMode } from '@angular/core';
import { PerformanceService } from './performance.service';

/**
 * Performance budgets configuration
 * Based on angular.json budgets and runtime thresholds
 */
export interface PerformanceBudget {
  name: string;
  type: 'duration' | 'size' | 'count';
  threshold: number;
  warning: number;
  error: number;
}

/**
 * Performance budgets monitoring service
 * Tracks runtime performance metrics against defined budgets
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceBudgetService {
  private readonly budgets: PerformanceBudget[] = [
    // Loading performance budgets
    { name: 'loadCards', type: 'duration', threshold: 500, warning: 1000, error: 2000 },
    { name: 'loadTemplate', type: 'duration', threshold: 300, warning: 600, error: 1200 },
    { name: 'searchCards', type: 'duration', threshold: 100, warning: 300, error: 500 },
    
    // Rendering performance budgets
    { name: 'cardRender', type: 'duration', threshold: 50, warning: 100, error: 200 },
    { name: 'sectionRender', type: 'duration', threshold: 20, warning: 50, error: 100 },
    { name: 'layoutCalculation', type: 'duration', threshold: 100, warning: 200, error: 400 },
    
    // Size budgets
    { name: 'cardSize', type: 'size', threshold: 5000, warning: 10000, error: 20000 },
    { name: 'totalCardSize', type: 'size', threshold: 50000, warning: 100000, error: 200000 },
    
    // Count budgets
    { name: 'cardCount', type: 'count', threshold: 20, warning: 50, error: 100 },
    { name: 'sectionCount', type: 'count', threshold: 10, warning: 20, error: 50 }
  ];

  private violations: {
    budget: string;
    actual: number;
    threshold: number;
    severity: 'warning' | 'error';
    timestamp: number;
  }[] = [];

  private readonly performanceService = inject(PerformanceService);

  constructor() {
    // Subscribe to performance metrics and check against budgets
    this.setupBudgetMonitoring();
  }

  /**
   * Setup automatic budget monitoring
   */
  private setupBudgetMonitoring(): void {
    // Check budgets periodically in development
    if (isDevMode()) {
      setInterval(() => {
        this.checkBudgets();
      }, 5000); // Check every 5 seconds in dev mode
    }
  }

  /**
   * Check performance metrics against budgets
   */
  checkBudgets(): void {
    const metrics = this.performanceService.getMetrics();
    
    // Group metrics by name
    const metricsByName = new Map<string, number[]>();
    metrics.forEach(metric => {
      if (!metricsByName.has(metric.name)) {
        metricsByName.set(metric.name, []);
      }
      metricsByName.get(metric.name)!.push(metric.duration);
    });

    // Check each budget
    this.budgets.forEach(budget => {
      const metricValues = metricsByName.get(budget.name) || [];
      
      if (metricValues.length === 0) {
        return; // No metrics yet
      }

      let value: number;
      
      if (budget.type === 'duration') {
        // Use average duration for duration budgets
        value = metricValues.reduce((sum, v) => sum + v, 0) / metricValues.length;
      } else {
        // For size/count, use latest value
        value = metricValues[metricValues.length - 1];
      }

      // Check against thresholds
      if (value > budget.error) {
        this.recordViolation(budget.name, value, budget.error, 'error');
      } else if (value > budget.warning) {
        this.recordViolation(budget.name, value, budget.warning, 'warning');
      }
    });
  }

  /**
   * Record a budget violation
   */
  private recordViolation(budgetName: string, actual: number, threshold: number, severity: 'warning' | 'error'): void {
    // Avoid duplicate violations for the same metric
    const recentViolation = this.violations.find(
      v => v.budget === budgetName && 
           Date.now() - v.timestamp < 60000 // Within last minute
    );

    if (recentViolation) {
      return; // Already reported
    }

    const violation = {
      budget: budgetName,
      actual,
      threshold,
      severity,
      timestamp: Date.now()
    };

    this.violations.push(violation);

    // Log violation
    const message = `Performance budget violation: ${budgetName} ${severity.toUpperCase()}. ` +
                   `Actual: ${actual.toFixed(2)}ms, Threshold: ${threshold}ms`;
    
    if (severity === 'error') {
      console.error(message);
    } else {
      console.warn(message);
    }

    // Keep only recent violations (last 100)
    if (this.violations.length > 100) {
      this.violations = this.violations.slice(-100);
    }
  }

  /**
   * Get budget violations
   */
  getViolations(): {
    budget: string;
    actual: number;
    threshold: number;
    severity: 'warning' | 'error';
    timestamp: number;
  }[] {
    return [...this.violations];
  }

  /**
   * Get recent violations (last N minutes)
   */
  getRecentViolations(minutes = 5): typeof this.violations {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.violations.filter(v => v.timestamp > cutoff);
  }

  /**
   * Clear all violations
   */
  clearViolations(): void {
    this.violations = [];
  }

  /**
   * Get budget configuration
   */
  getBudgets(): PerformanceBudget[] {
    return [...this.budgets];
  }

  /**
   * Add a custom budget
   */
  addBudget(budget: PerformanceBudget): void {
    this.budgets.push(budget);
  }

  /**
   * Check a specific metric against its budget
   */
  checkMetric(name: string, value: number, metadata?: Record<string, unknown>): 'ok' | 'warning' | 'error' {
    const budget = this.budgets.find(b => b.name === name);
    if (!budget) {
      return 'ok'; // No budget defined
    }

    if (metadata && isDevMode()) {
      console.debug(`Budget metadata for ${name}:`, metadata);
    }

    if (value > budget.error) {
      this.recordViolation(name, value, budget.error, 'error');
      return 'error';
    } else if (value > budget.warning) {
      this.recordViolation(name, value, budget.warning, 'warning');
      return 'warning';
    }

    return 'ok';
  }

  /**
   * Get performance summary with budget status
   */
  getSummary(): {
    totalMetrics: number;
    averageDuration: number;
    slowestOperations: { name: string; duration: number }[];
    violations: {
      total: number;
      warnings: number;
      errors: number;
      recent: number;
    };
  } {
    const summary = this.performanceService.getSummary();
    const recentViolations = this.getRecentViolations(5);

    return {
      ...summary,
      violations: {
        total: this.violations.length,
        warnings: this.violations.filter(v => v.severity === 'warning').length,
        errors: this.violations.filter(v => v.severity === 'error').length,
        recent: recentViolations.length
      }
    };
  }
}

