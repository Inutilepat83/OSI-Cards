/**
 * Empty State Component Tests
 *
 * Unit tests for EmptyStateComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';
import { By } from '@angular/platform-browser';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render empty state message', () => {
      fixture.detectChanges();
      const message = fixture.debugElement.query(By.css('.empty-text'));
      expect(message).toBeTruthy();
    });

    it('should display default message', () => {
      fixture.detectChanges();
      const message = fixture.debugElement.query(By.css('.empty-text'));
      expect(message.nativeElement.textContent.trim()).toContain('No data available');
    });
  });

  describe('Input Properties', () => {
    it('should have default message', () => {
      expect(component.message).toBe('No data available');
    });

    it('should accept custom message', () => {
      component.message = 'Custom empty message';
      expect(component.message).toBe('Custom empty message');
    });

    it('should accept icon input', () => {
      component.icon = '📭';
      expect(component.icon).toBe('📭');
    });

    it('should accept actionLabel input', () => {
      component.actionLabel = 'Add Item';
      expect(component.actionLabel).toBe('Add Item');
    });

    it('should have default variant', () => {
      expect(component.variant).toBe('default');
    });

    it('should accept variant input', () => {
      component.variant = 'minimal';
      expect(component.variant).toBe('minimal');
    });

    it('should have default size', () => {
      expect(component.size).toBe('medium');
    });

    it('should accept size input', () => {
      component.size = 'large';
      expect(component.size).toBe('large');
    });

    it('should accept containerClass input', () => {
      component.containerClass = 'custom-container';
      expect(component.containerClass).toBe('custom-container');
    });
  });

  describe('Action Button', () => {
    it('should render action button when actionLabel is provided', () => {
      component.actionLabel = 'Add Item';
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
      expect(button.nativeElement.textContent.trim()).toContain('Add Item');
    });

    it('should not render action button when actionLabel is not provided', () => {
      component.actionLabel = undefined;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeFalsy();
    });

    it('should emit action event when button is clicked', () => {
      component.actionLabel = 'Add Item';
      fixture.detectChanges();

      spyOn(component.action, 'emit');
      const button = fixture.debugElement.query(By.css('button'));
      button.nativeElement.click();

      expect(component.action.emit).toHaveBeenCalled();
    });

    it('should emit action event when onActionClick is called', () => {
      spyOn(component.action, 'emit');
      component.onActionClick();

      expect(component.action.emit).toHaveBeenCalled();
    });
  });

  describe('getClassArray Method', () => {
    it('should return array with variant and size', () => {
      component.variant = 'minimal';
      component.size = 'small';
      const classes = component.getClassArray();

      expect(classes).toContain('minimal');
      expect(classes).toContain('small');
    });

    it('should include containerClass when provided', () => {
      component.containerClass = 'custom-class';
      const classes = component.getClassArray();

      expect(classes).toContain('custom-class');
    });

    it('should filter out undefined values', () => {
      component.containerClass = undefined;
      const classes = component.getClassArray();

      expect(classes.every((cls) => cls !== undefined)).toBe(true);
    });

    it('should filter out null values', () => {
      component.containerClass = null as unknown as string;
      const classes = component.getClassArray();

      expect(classes.every((cls) => cls !== null)).toBe(true);
    });
  });

  describe('Variant Types', () => {
    const variants = ['default', 'minimal', 'centered', 'compact'] as const;

    variants.forEach((variant) => {
      it(`should support ${variant} variant`, () => {
        component.variant = variant;
        fixture.detectChanges();

        expect(component.variant).toBe(variant);
      });
    });
  });

  describe('Size Types', () => {
    const sizes = ['small', 'medium', 'large'] as const;

    sizes.forEach((size) => {
      it(`should support ${size} size`, () => {
        component.size = size;
        fixture.detectChanges();

        expect(component.size).toBe(size);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      component.message = '';
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle very long message', () => {
      component.message = 'A'.repeat(500);
      fixture.detectChanges();

      expect(component.message.length).toBe(500);
    });
  });
});
