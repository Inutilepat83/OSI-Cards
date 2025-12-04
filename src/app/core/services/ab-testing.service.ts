/**
 * A/B Testing Service
 *
 * Manages A/B test experiments and variant assignment.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private abTesting = inject(ABTestingService);
 *
 *   ngOnInit() {
 *     const variant = this.abTesting.getVariant('new-layout-test');
 *     if (variant === 'B') {
 *       // Show new layout
 *     }
 *   }
 * }
 * ```
 */

import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  variants: string[]; // ['A', 'B', 'C']
  weights?: number[]; // [0.5, 0.5] - must sum to 1.0
  enabled: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface ABTestAssignment {
  testId: string;
  variant: string;
  assignedAt: number;
  userId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ABTestingService {
  private router = inject(Router);
  private tests = new BehaviorSubject<Map<string, ABTest>>(new Map());
  private assignments = new BehaviorSubject<Map<string, ABTestAssignment>>(new Map());

  tests$: Observable<Map<string, ABTest>> = this.tests.asObservable();
  assignments$: Observable<Map<string, ABTestAssignment>> = this.assignments.asObservable();

  constructor() {
    this.loadTests();
    this.loadAssignments();
    this.setupPageTracking();
  }

  /**
   * Register A/B test
   */
  registerTest(test: ABTest): void {
    // Validate weights
    if (test.weights) {
      const sum = test.weights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.001) {
        console.warn('[ABTesting] Weights must sum to 1.0, got:', sum);
        return;
      }
    }

    const tests = this.tests.value;
    tests.set(test.id, test);
    this.tests.next(tests);
    this.saveTests();
  }

  /**
   * Get variant for user
   */
  getVariant(testId: string, userId?: string): string | null {
    const test = this.tests.value.get(testId);

    if (!test || !test.enabled) {
      return null;
    }

    // Check if test is active
    if (!this.isTestActive(test)) {
      return null;
    }

    // Check existing assignment
    const assignments = this.assignments.value;
    const existing = assignments.get(testId);

    if (existing) {
      return existing.variant;
    }

    // Assign variant
    const variant = this.assignVariant(test, userId);

    // Store assignment
    const assignment: ABTestAssignment = {
      testId,
      variant,
      assignedAt: Date.now(),
      userId,
    };

    assignments.set(testId, assignment);
    this.assignments.next(assignments);
    this.saveAssignments();

    return variant;
  }

  /**
   * Check if user is in variant
   */
  isVariant(testId: string, variant: string, userId?: string): boolean {
    const assignedVariant = this.getVariant(testId, userId);
    return assignedVariant === variant;
  }

  /**
   * Track conversion (goal achieved)
   */
  trackConversion(testId: string, metric: string, value?: number): void {
    const variant = this.getVariant(testId);

    if (variant) {
      // Track conversion event
      this.trackTestEvent(testId, 'conversion', {
        variant,
        metric,
        value,
      });
    }
  }

  /**
   * Get test details
   */
  getTest(testId: string): ABTest | undefined {
    return this.tests.value.get(testId);
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTest[] {
    return Array.from(this.tests.value.values()).filter((t) => t.enabled && this.isTestActive(t));
  }

  /**
   * End test (stop accepting new assignments)
   */
  endTest(testId: string): void {
    const tests = this.tests.value;
    const test = tests.get(testId);

    if (test) {
      test.enabled = false;
      test.endDate = new Date();
      this.tests.next(tests);
      this.saveTests();
    }
  }

  /**
   * Get test results summary
   */
  getTestResults(testId: string): {
    testId: string;
    variants: Record<string, number>;
    totalAssignments: number;
  } {
    const test = this.tests.value.get(testId);
    const assignments = Array.from(this.assignments.value.values()).filter(
      (a) => a.testId === testId
    );

    const variants: Record<string, number> = {};

    if (test) {
      test.variants.forEach((v) => {
        variants[v] = assignments.filter((a) => a.variant === v).length;
      });
    }

    return {
      testId,
      variants,
      totalAssignments: assignments.length,
    };
  }

  /**
   * Assign variant based on weights
   */
  private assignVariant(test: ABTest, userId?: string): string {
    const weights = test.weights || test.variants.map(() => 1 / test.variants.length);

    // Use deterministic assignment based on userId
    let random: number;
    if (userId) {
      random = this.hashUserId(userId, test.id) / 100;
    } else {
      random = Math.random();
    }

    let cumulative = 0;
    for (let i = 0; i < test.variants.length; i++) {
      cumulative += weights[i] || 0;
      if (random < cumulative) {
        const variant = test.variants[i];
        return variant !== undefined ? variant : test.variants[0] || 'A';
      }
    }

    return test.variants[0] || 'A'; // Fallback
  }

  /**
   * Check if test is currently active
   */
  private isTestActive(test: ABTest): boolean {
    const now = new Date();

    if (test.startDate && now < test.startDate) {
      return false;
    }

    if (test.endDate && now > test.endDate) {
      return false;
    }

    return test.enabled;
  }

  /**
   * Hash user ID for deterministic assignment
   */
  private hashUserId(userId: string, testId: string): number {
    const str = `${userId}:${testId}`;
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash) % 100;
  }

  /**
   * Track test-related event
   */
  private trackTestEvent(
    testId: string,
    eventType: string,
    properties?: Record<string, any>
  ): void {
    // Would integrate with analytics service
    console.log('[ABTesting] Event:', { testId, eventType, properties });
  }

  /**
   * Setup automatic page tracking
   */
  private setupPageTracking(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Track page views for active tests
        this.getActiveTests().forEach((test) => {
          const variant = this.getVariant(test.id);
          if (variant) {
            this.trackTestEvent(test.id, 'page_view', {
              variant,
              path: event.urlAfterRedirects,
            });
          }
        });
      });
  }

  /**
   * Load tests from storage
   */
  private loadTests(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const stored = localStorage.getItem('ab-tests');
    if (stored) {
      try {
        const tests = JSON.parse(stored);
        const testMap = new Map<string, ABTest>(Object.entries(tests));
        this.tests.next(testMap);
      } catch (error) {
        console.error('[ABTesting] Failed to load tests:', error);
      }
    }
  }

  /**
   * Save tests to storage
   */
  private saveTests(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const tests = Object.fromEntries(this.tests.value);
    localStorage.setItem('ab-tests', JSON.stringify(tests));
  }

  /**
   * Load assignments from storage
   */
  private loadAssignments(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const stored = localStorage.getItem('ab-assignments');
    if (stored) {
      try {
        const assignments = JSON.parse(stored);
        const assignmentMap = new Map<string, ABTestAssignment>(Object.entries(assignments));
        this.assignments.next(assignmentMap);
      } catch (error) {
        console.error('[ABTesting] Failed to load assignments:', error);
      }
    }
  }

  /**
   * Save assignments to storage
   */
  private saveAssignments(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const assignments = Object.fromEntries(this.assignments.value);
    localStorage.setItem('ab-assignments', JSON.stringify(assignments));
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
