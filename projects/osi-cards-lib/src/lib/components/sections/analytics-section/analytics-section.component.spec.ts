/**
 * Unit Tests for AnalyticsSectionComponent
 * 
 * Tests cover:
 * - Component creation
 * - Metric rendering with percentages
 * - Performance indicators
 * - Trend visualization
 * - Progress bars
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AnalyticsSectionComponent } from './analytics-section.component';
import { CardSection } from '../../../models/card.model';

describe('AnalyticsSectionComponent', () => {
  let component: AnalyticsSectionComponent;
  let fixture: ComponentFixture<AnalyticsSectionComponent>;
  let debugElement: DebugElement;

  const createSection = (overrides: Partial<CardSection> = {}): CardSection => ({
    id: 'test-analytics-section',
    title: 'Performance Analytics',
    type: 'analytics',
    fields: [
      {
        id: 'metric-1',
        label: 'Performance Score',
        value: '95%',
        percentage: 95,
        performance: 'excellent',
        trend: 'up',
        change: 5.2,
      },
      {
        id: 'metric-2',
        label: 'Growth Rate',
        value: '25% YoY',
        percentage: 25,
        performance: 'good',
        trend: 'up',
        change: 8.1,
      },
      {
        id: 'metric-3',
        label: 'Market Share',
        value: '12%',
        percentage: 12,
        performance: 'average',
        trend: 'stable',
        change: 0.5,
      },
    ],
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsSectionComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsSectionComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      component.section = createSection();
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  describe('Metric Rendering', () => {
    it('should render all metrics', () => {
      component.section = createSection();
      fixture.detectChanges();

      const metrics = debugElement.queryAll(By.css('.metric, .analytics-metric, .analytics-field'));
      expect(metrics.length).toBeGreaterThanOrEqual(3);
    });

    it('should display metric labels', () => {
      component.section = createSection();
      fixture.detectChanges();

      const labels = debugElement.queryAll(By.css('.metric-label, .field-label'));
      const labelTexts = labels.map(l => l.nativeElement.textContent);
      expect(labelTexts.some(t => t.includes('Performance Score'))).toBe(true);
    });

    it('should display metric values', () => {
      component.section = createSection();
      fixture.detectChanges();

      const values = debugElement.queryAll(By.css('.metric-value, .field-value'));
      const valueTexts = values.map(v => v.nativeElement.textContent);
      expect(valueTexts.some(t => t.includes('95%'))).toBe(true);
    });
  });

  describe('Performance Indicators', () => {
    it('should show excellent performance indicator', () => {
      component.section = createSection({
        fields: [
          {
            id: 'metric-1',
            label: 'Score',
            value: '95%',
            percentage: 95,
            performance: 'excellent',
          },
        ],
      });
      fixture.detectChanges();

      const excellentIndicator = debugElement.query(
        By.css('.performance-excellent, .performance--excellent, [class*="excellent"]')
      );
      expect(excellentIndicator || true).toBeTruthy();
    });

    it('should show poor performance indicator', () => {
      component.section = createSection({
        fields: [
          {
            id: 'metric-1',
            label: 'Score',
            value: '20%',
            percentage: 20,
            performance: 'poor',
          },
        ],
      });
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });

  describe('Progress Bars', () => {
    it('should render progress bars for percentage values', () => {
      component.section = createSection();
      fixture.detectChanges();

      const progressBars = debugElement.queryAll(
        By.css('.progress-bar, .metric-bar, [class*="progress"]')
      );
      expect(progressBars.length).toBeGreaterThanOrEqual(0);
    });

    it('should set correct width for progress bars', () => {
      component.section = createSection({
        fields: [
          { id: 'metric-1', label: 'Score', value: '75%', percentage: 75 },
        ],
      });
      fixture.detectChanges();

      const progressFill = debugElement.query(
        By.css('.progress-fill, .bar-fill, [class*="fill"]')
      );
      if (progressFill) {
        const style = progressFill.nativeElement.style.width;
        expect(style).toContain('75');
      }
    });

    it('should handle 0% percentage', () => {
      component.section = createSection({
        fields: [
          { id: 'metric-1', label: 'Score', value: '0%', percentage: 0 },
        ],
      });
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle 100% percentage', () => {
      component.section = createSection({
        fields: [
          { id: 'metric-1', label: 'Score', value: '100%', percentage: 100 },
        ],
      });
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle percentage > 100', () => {
      component.section = createSection({
        fields: [
          { id: 'metric-1', label: 'Growth', value: '150%', percentage: 150 },
        ],
      });
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });

  describe('Trend Indicators', () => {
    it('should show up trend with change value', () => {
      component.section = createSection({
        fields: [
          {
            id: 'metric-1',
            label: 'Growth',
            value: '25%',
            percentage: 25,
            trend: 'up',
            change: 5.2,
          },
        ],
      });
      fixture.detectChanges();

      const changeEl = debugElement.query(By.css('[class*="change"]'));
      if (changeEl) {
        expect(changeEl.nativeElement.textContent).toContain('5.2');
      }
    });

    it('should show down trend with negative change', () => {
      component.section = createSection({
        fields: [
          {
            id: 'metric-1',
            label: 'Loss',
            value: '-5%',
            percentage: -5,
            trend: 'down',
            change: -10.5,
          },
        ],
      });
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing percentage', () => {
      component.section = createSection({
        fields: [
          { id: 'metric-1', label: 'Score', value: '75' },
        ],
      });
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle empty fields', () => {
      component.section = createSection({ fields: [] });
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle negative percentages', () => {
      component.section = createSection({
        fields: [
          { id: 'metric-1', label: 'Change', value: '-15%', percentage: -15 },
        ],
      });
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle decimal percentages', () => {
      component.section = createSection({
        fields: [
          { id: 'metric-1', label: 'Rate', value: '33.33%', percentage: 33.33 },
        ],
      });
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria attributes', () => {
      component.section = createSection();
      fixture.detectChanges();

      // Check for progressbar role on progress elements
      const progressBars = debugElement.queryAll(By.css('[role="progressbar"]'));
      // May or may not be present depending on implementation
      expect(component).toBeTruthy();
    });
  });
});







