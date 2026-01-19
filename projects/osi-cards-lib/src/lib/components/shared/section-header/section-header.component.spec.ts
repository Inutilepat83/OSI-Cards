/**
 * Section Header Component Tests
 *
 * Unit tests for SectionHeaderComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionHeaderComponent } from './section-header.component';
import { By } from '@angular/platform-browser';

describe('SectionHeaderComponent', () => {
  let component: SectionHeaderComponent;
  let fixture: ComponentFixture<SectionHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionHeaderComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render title when provided', () => {
      component.title = 'Section Title';
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('h3'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Section Title');
    });

    it('should render description when provided', () => {
      component.title = 'Section Title';
      component.description = 'Section description';
      fixture.detectChanges();

      const description = fixture.debugElement.query(By.css('.section-description'));
      expect(description).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should accept title input', () => {
      component.title = 'Test Title';
      expect(component.title).toBe('Test Title');
    });

    it('should accept description input', () => {
      component.description = 'Test Description';
      expect(component.description).toBe('Test Description');
    });

    it('should have default level', () => {
      expect(component.level).toBe(3);
    });

    it('should accept level input', () => {
      component.level = 2;
      expect(component.level).toBe(2);
    });

    it('should accept headerClass input', () => {
      component.headerClass = 'custom-header';
      expect(component.headerClass).toBe('custom-header');
    });

    it('should accept titleClass input', () => {
      component.titleClass = 'custom-title';
      expect(component.titleClass).toBe('custom-title');
    });

    it('should accept descriptionClass input', () => {
      component.descriptionClass = 'custom-description';
      expect(component.descriptionClass).toBe('custom-description');
    });
  });

  describe('headingTag Getter', () => {
    it('should return h3 for level 3', () => {
      component.level = 3;
      expect(component.headingTag).toBe('h3');
    });

    it('should return h1 for level 1', () => {
      component.level = 1;
      expect(component.headingTag).toBe('h1');
    });

    it('should return h6 for level 6', () => {
      component.level = 6;
      expect(component.headingTag).toBe('h6');
    });
  });

  describe('Description Expansion', () => {
    it('should have isDescriptionExpanded initialized to false', () => {
      expect(component.isDescriptionExpanded).toBe(false);
    });

    it('should toggle description expansion', () => {
      component.toggleDescriptionExpanded();
      expect(component.isDescriptionExpanded).toBe(true);

      component.toggleDescriptionExpanded();
      expect(component.isDescriptionExpanded).toBe(false);
    });

    it('should show expand button for long descriptions', () => {
      component.description = 'A'.repeat(200);
      expect(component.shouldShowExpandButton()).toBe(true);
    });

    it('should not show expand button for short descriptions', () => {
      component.description = 'Short description';
      expect(component.shouldShowExpandButton()).toBe(false);
    });

    it('should not show expand button when description is null', () => {
      component.description = undefined;
      expect(component.shouldShowExpandButton()).toBe(false);
    });

    it('should not show expand button when description is exactly 150 characters', () => {
      component.description = 'A'.repeat(150);
      expect(component.shouldShowExpandButton()).toBe(false);
    });
  });

  describe('Heading Levels', () => {
    const levels = [1, 2, 3, 4, 5, 6] as const;

    levels.forEach((level) => {
      it(`should support level ${level}`, () => {
        component.level = level;
        component.title = 'Title';
        fixture.detectChanges();

        const heading = fixture.debugElement.query(By.css(`h${level}`));
        expect(heading).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing title', () => {
      component.title = undefined;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle missing description', () => {
      component.title = 'Title';
      component.description = undefined;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle very long title', () => {
      component.title = 'A'.repeat(500);
      fixture.detectChanges();

      expect(component.title.length).toBe(500);
    });

    it('should handle very long description', () => {
      component.title = 'Title';
      component.description = 'A'.repeat(1000);
      fixture.detectChanges();

      expect(component.description.length).toBe(1000);
    });
  });
});
