/**
 * Badge Component Tests
 *
 * Unit tests for BadgeComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent, BadgeVariant, BadgeSize } from './badge.component';
import { By } from '@angular/platform-browser';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render badge element', () => {
      fixture.detectChanges();
      const badge = fixture.debugElement.query(By.css('.badge'));
      expect(badge).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should have default variant', () => {
      expect(component.variant).toBe('default');
    });

    it('should accept variant input', () => {
      component.variant = 'primary';
      expect(component.variant).toBe('primary');
    });

    it('should have default size', () => {
      expect(component.size).toBe('md');
    });

    it('should accept size input', () => {
      component.size = 'lg';
      expect(component.size).toBe('lg');
    });

    it('should have default outlined value', () => {
      expect(component.outlined).toBe(false);
    });

    it('should accept outlined input', () => {
      component.outlined = true;
      expect(component.outlined).toBe(true);
    });

    it('should have default pill value', () => {
      expect(component.pill).toBe(false);
    });

    it('should accept pill input', () => {
      component.pill = true;
      expect(component.pill).toBe(true);
    });

    it('should have default dot value', () => {
      expect(component.dot).toBe(false);
    });

    it('should accept dot input', () => {
      component.dot = true;
      expect(component.dot).toBe(true);
    });

    it('should accept badgeClass input', () => {
      component.badgeClass = 'custom-class';
      expect(component.badgeClass).toBe('custom-class');
    });

    it('should accept icon input', () => {
      component.icon = '✓';
      expect(component.icon).toBe('✓');
    });

    it('should have default interactive value', () => {
      expect(component.interactive).toBe(false);
    });

    it('should accept interactive input', () => {
      component.interactive = true;
      expect(component.interactive).toBe(true);
    });

    it('should accept ariaLabel input', () => {
      component.ariaLabel = 'Status badge';
      expect(component.ariaLabel).toBe('Status badge');
    });
  });

  describe('Classes Getter', () => {
    it('should include variant class', () => {
      component.variant = 'success';
      const classes = component.classes;

      expect(classes['badge--success']).toBe(true);
    });

    it('should include size class', () => {
      component.size = 'sm';
      const classes = component.classes;

      expect(classes['badge--sm']).toBe(true);
    });

    it('should include outlined class when outlined is true', () => {
      component.outlined = true;
      const classes = component.classes;

      expect(classes['badge--outlined']).toBe(true);
    });

    it('should include pill class when pill is true', () => {
      component.pill = true;
      const classes = component.classes;

      expect(classes['badge--pill']).toBe(true);
    });

    it('should include dot class when dot is true', () => {
      component.dot = true;
      const classes = component.classes;

      expect(classes['badge--dot']).toBe(true);
    });

    it('should include interactive class when interactive is true', () => {
      component.interactive = true;
      const classes = component.classes;

      expect(classes['badge--interactive']).toBe(true);
    });

    it('should include custom badgeClass', () => {
      component.badgeClass = 'custom-class';
      const classes = component.classes;

      expect(classes['custom-class']).toBe(true);
    });
  });

  describe('Variant Types', () => {
    const variants: BadgeVariant[] = ['default', 'primary', 'success', 'error', 'warning', 'info'];

    variants.forEach((variant) => {
      it(`should support ${variant} variant`, () => {
        component.variant = variant;
        fixture.detectChanges();

        const classes = component.classes;
        expect(classes[`badge--${variant}`]).toBe(true);
      });
    });
  });

  describe('Size Types', () => {
    const sizes: BadgeSize[] = ['sm', 'md', 'lg'];

    sizes.forEach((size) => {
      it(`should support ${size} size`, () => {
        component.size = size;
        fixture.detectChanges();

        const classes = component.classes;
        expect(classes[`badge--${size}`]).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined badgeClass', () => {
      component.badgeClass = undefined;
      const classes = component.classes;

      expect(classes).toBeDefined();
    });

    it('should handle empty badgeClass', () => {
      component.badgeClass = '';
      const classes = component.classes;

      expect(classes).toBeDefined();
    });
  });
});
