/**
 * Progress Bar Component Tests
 *
 * Unit tests for ProgressBarComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressBarComponent, ProgressBarVariant } from './progress-bar.component';
import { By } from '@angular/platform-browser';

describe('ProgressBarComponent', () => {
  let component: ProgressBarComponent;
  let fixture: ComponentFixture<ProgressBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressBarComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render progress bar container', () => {
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('.progress-bar'));
      expect(container).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should have default value', () => {
      expect(component.value).toBe(0);
    });

    it('should accept value input', () => {
      component.value = 75;
      expect(component.value).toBe(75);
    });

    it('should have default max value', () => {
      expect(component.max).toBe(100);
    });

    it('should accept max input', () => {
      component.max = 200;
      expect(component.max).toBe(200);
    });

    it('should have default variant', () => {
      expect(component.variant).toBe('default');
    });

    it('should accept variant input', () => {
      component.variant = 'success';
      expect(component.variant).toBe('success');
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

    it('should have default striped value', () => {
      expect(component.striped).toBe(false);
    });

    it('should accept striped input', () => {
      component.striped = true;
      expect(component.striped).toBe(true);
    });

    it('should have default shimmer value', () => {
      expect(component.shimmer).toBe(false);
    });

    it('should accept shimmer input', () => {
      component.shimmer = true;
      expect(component.shimmer).toBe(true);
    });

    it('should have default showLabel value', () => {
      expect(component.showLabel).toBe(false);
    });

    it('should accept showLabel input', () => {
      component.showLabel = true;
      expect(component.showLabel).toBe(true);
    });

    it('should accept label input', () => {
      component.label = 'Custom Label';
      expect(component.label).toBe('Custom Label');
    });

    it('should accept progressClass input', () => {
      component.progressClass = 'custom-class';
      expect(component.progressClass).toBe('custom-class');
    });
  });

  describe('percentage Getter', () => {
    it('should calculate percentage correctly', () => {
      component.value = 50;
      component.max = 100;
      expect(component.percentage).toBe(50);
    });

    it('should calculate percentage with custom max', () => {
      component.value = 25;
      component.max = 50;
      expect(component.percentage).toBe(50);
    });

    it('should cap percentage at 100', () => {
      component.value = 150;
      component.max = 100;
      expect(component.percentage).toBe(100);
    });

    it('should cap percentage at 0', () => {
      component.value = -10;
      component.max = 100;
      expect(component.percentage).toBe(0);
    });

    it('should handle zero max value', () => {
      component.value = 50;
      component.max = 0;
      expect(component.percentage).toBe(100);
    });
  });

  describe('formattedLabel Getter', () => {
    it('should return custom label when provided', () => {
      component.label = 'Custom Label';
      expect(component.formattedLabel).toBe('Custom Label');
    });

    it('should return percentage when label is not provided', () => {
      component.value = 75;
      component.max = 100;
      expect(component.formattedLabel).toBe('75%');
    });

    it('should round percentage value', () => {
      component.value = 75.7;
      component.max = 100;
      expect(component.formattedLabel).toBe('76%');
    });
  });

  describe('ARIA Attributes', () => {
    it('should return correct ariaValueNow', () => {
      component.value = 75;
      expect(component.ariaValueNow).toBe(75);
    });

    it('should return 0 for ariaValueMin', () => {
      expect(component.ariaValueMin).toBe(0);
    });

    it('should return max for ariaValueMax', () => {
      component.max = 200;
      expect(component.ariaValueMax).toBe(200);
    });
  });

  describe('containerClasses Getter', () => {
    it('should include size class', () => {
      component.size = 'small';
      const classes = component.containerClasses;

      expect(classes['progress-bar--small']).toBe(true);
    });

    it('should include custom progressClass', () => {
      component.progressClass = 'custom-class';
      const classes = component.containerClasses;

      expect(classes['custom-class']).toBe(true);
    });
  });

  describe('fillClasses Getter', () => {
    it('should include variant class', () => {
      component.variant = 'success';
      const classes = component.fillClasses;

      expect(classes['progress-fill--success']).toBe(true);
    });

    it('should include animated class when animated is true', () => {
      component.animated = true;
      const classes = component.fillClasses;

      expect(classes['progress-fill--animated']).toBe(true);
    });

    it('should include striped class when striped is true', () => {
      component.striped = true;
      const classes = component.fillClasses;

      expect(classes['progress-fill--striped']).toBe(true);
    });

    it('should include shimmer class when shimmer is true', () => {
      component.shimmer = true;
      const classes = component.fillClasses;

      expect(classes['progress-fill--shimmer']).toBe(true);
    });
  });

  describe('Variant Types', () => {
    const variants: ProgressBarVariant[] = ['default', 'success', 'warning', 'error', 'info'];

    variants.forEach((variant) => {
      it(`should support ${variant} variant`, () => {
        component.variant = variant;
        fixture.detectChanges();

        const classes = component.fillClasses;
        expect(classes[`progress-fill--${variant}`]).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle value greater than max', () => {
      component.value = 150;
      component.max = 100;
      expect(component.percentage).toBe(100);
    });

    it('should handle negative value', () => {
      component.value = -10;
      component.max = 100;
      expect(component.percentage).toBe(0);
    });

    it('should handle very large values', () => {
      component.value = 1000000;
      component.max = 100;
      expect(component.percentage).toBe(100);
    });
  });
});
