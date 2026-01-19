/**
 * Trend Indicator Component Tests
 *
 * Unit tests for TrendIndicatorComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrendIndicatorComponent } from './trend-indicator.component';
import { By } from '@angular/platform-browser';
import { TrendDirection } from '@osi-cards/types';

describe('TrendIndicatorComponent', () => {
  let component: TrendIndicatorComponent;
  let fixture: ComponentFixture<TrendIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendIndicatorComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render trend indicator', () => {
      fixture.detectChanges();
      const indicator = fixture.debugElement.query(By.css('.trend-indicator'));
      expect(indicator).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should have default trend', () => {
      expect(component.trend).toBe('neutral');
    });

    it('should accept trend input', () => {
      component.trend = 'up';
      expect(component.trend).toBe('up');
    });

    it('should accept value input', () => {
      component.value = 23.5;
      expect(component.value).toBe(23.5);
    });

    it('should have default showSign value', () => {
      expect(component.showSign).toBe(true);
    });

    it('should accept showSign input', () => {
      component.showSign = false;
      expect(component.showSign).toBe(false);
    });

    it('should have default showPercent value', () => {
      expect(component.showPercent).toBe(true);
    });

    it('should accept showPercent input', () => {
      component.showPercent = false;
      expect(component.showPercent).toBe(false);
    });

    it('should have default size', () => {
      expect(component.size).toBe('medium');
    });

    it('should accept size input', () => {
      component.size = 'large';
      expect(component.size).toBe('large');
    });

    it('should have default animated value', () => {
      expect(component.animated).toBe(true);
    });

    it('should accept animated input', () => {
      component.animated = false;
      expect(component.animated).toBe(false);
    });

    it('should accept icon input', () => {
      component.icon = '↑';
      expect(component.icon).toBe('↑');
    });

    it('should accept trendClass input', () => {
      component.trendClass = 'custom-class';
      expect(component.trendClass).toBe('custom-class');
    });

    it('should accept ariaLabel input', () => {
      component.ariaLabel = 'Trend indicator';
      expect(component.ariaLabel).toBe('Trend indicator');
    });
  });

  describe('formattedValue Getter', () => {
    it('should format positive value with sign and percent', () => {
      component.value = 23.5;
      component.showSign = true;
      component.showPercent = true;
      expect(component.formattedValue).toContain('+');
      expect(component.formattedValue).toContain('%');
    });

    it('should format negative value', () => {
      component.value = -12.3;
      component.showSign = true;
      component.showPercent = true;
      expect(component.formattedValue).toContain('-');
    });

    it('should format value without sign when showSign is false', () => {
      component.value = 23.5;
      component.showSign = false;
      expect(component.formattedValue).not.toContain('+');
    });

    it('should format value without percent when showPercent is false', () => {
      component.value = 23.5;
      component.showPercent = false;
      expect(component.formattedValue).not.toContain('%');
    });

    it('should return empty string for undefined value', () => {
      component.value = undefined;
      expect(component.formattedValue).toBe('');
    });

    it('should return empty string for null value', () => {
      component.value = null as unknown as number;
      expect(component.formattedValue).toBe('');
    });

    it('should format to 1 decimal place', () => {
      component.value = 23.567;
      const formatted = component.formattedValue;
      expect(formatted).toMatch(/\d+\.\d/);
    });
  });

  describe('arrowIcon Getter', () => {
    it('should return custom icon when provided', () => {
      component.icon = '↑';
      expect(component.arrowIcon).toBe('↑');
    });

    it('should return up arrow for up trend', () => {
      component.trend = 'up';
      component.icon = undefined;
      expect(component.arrowIcon).toBe('↗');
    });

    it('should return down arrow for down trend', () => {
      component.trend = 'down';
      component.icon = undefined;
      expect(component.arrowIcon).toBe('↘');
    });

    it('should return right arrow for stable trend', () => {
      component.trend = 'stable';
      component.icon = undefined;
      expect(component.arrowIcon).toBe('→');
    });

    it('should return dot for neutral trend', () => {
      component.trend = 'neutral';
      component.icon = undefined;
      expect(component.arrowIcon).toBe('•');
    });
  });

  describe('computedAriaLabel Getter', () => {
    it('should return custom ariaLabel when provided', () => {
      component.ariaLabel = 'Custom label';
      expect(component.computedAriaLabel).toBe('Custom label');
    });

    it('should generate label for up trend with value', () => {
      component.trend = 'up';
      component.value = 23.5;
      component.ariaLabel = undefined;
      const label = component.computedAriaLabel;

      expect(label).toContain('increasing');
      expect(label).toContain('23.5');
    });

    it('should generate label for down trend', () => {
      component.trend = 'down';
      component.value = -12.3;
      component.ariaLabel = undefined;
      const label = component.computedAriaLabel;

      expect(label).toContain('decreasing');
    });

    it('should generate label for stable trend', () => {
      component.trend = 'stable';
      component.ariaLabel = undefined;
      const label = component.computedAriaLabel;

      expect(label).toContain('stable');
    });

    it('should generate label for neutral trend', () => {
      component.trend = 'neutral';
      component.ariaLabel = undefined;
      const label = component.computedAriaLabel;

      expect(label).toContain('neutral');
    });

    it('should not include value when value is undefined', () => {
      component.trend = 'up';
      component.value = undefined;
      component.ariaLabel = undefined;
      const label = component.computedAriaLabel;

      expect(label).not.toContain('by');
    });
  });

  describe('classes Getter', () => {
    it('should include trend class', () => {
      component.trend = 'up';
      const classes = component.classes;

      expect(classes['trend-indicator--up']).toBe(true);
    });

    it('should include size class', () => {
      component.size = 'small';
      const classes = component.classes;

      expect(classes['trend-indicator--small']).toBe(true);
    });

    it('should include animated class when animated is true', () => {
      component.animated = true;
      const classes = component.classes;

      expect(classes['trend-indicator--animated']).toBe(true);
    });

    it('should include custom trendClass', () => {
      component.trendClass = 'custom-class';
      const classes = component.classes;

      expect(classes['custom-class']).toBe(true);
    });
  });

  describe('Trend Directions', () => {
    const trends: TrendDirection[] = ['up', 'down', 'stable', 'neutral'];

    trends.forEach((trend) => {
      it(`should support ${trend} trend`, () => {
        component.trend = trend;
        fixture.detectChanges();

        const classes = component.classes;
        expect(classes[`trend-indicator--${trend}`]).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero value', () => {
      component.value = 0;
      expect(component.formattedValue).toBeTruthy();
    });

    it('should handle very large values', () => {
      component.value = 999999.99;
      expect(component.formattedValue).toBeTruthy();
    });

    it('should handle very small values', () => {
      component.value = 0.001;
      expect(component.formattedValue).toBeTruthy();
    });
  });
});
