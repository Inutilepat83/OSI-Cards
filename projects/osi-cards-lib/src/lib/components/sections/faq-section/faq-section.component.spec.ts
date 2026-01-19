/**
 * FAQ Section Component Tests
 *
 * Unit tests for FaqSectionComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaqSectionComponent } from './faq-section.component';
import { By } from '@angular/platform-browser';
import { CardSection, CardItem } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';

describe('FaqSectionComponent', () => {
  let component: FaqSectionComponent;
  let fixture: ComponentFixture<FaqSectionComponent>;
  let layoutService: jasmine.SpyObj<SectionLayoutPreferenceService>;

  const mockSection: CardSection = {
    id: 'faq-1',
    type: 'faq',
    title: 'FAQ',
    items: [
      {
        id: 'faq-1',
        title: 'Question 1?',
        description: 'Answer 1',
      },
      {
        id: 'faq-2',
        title: 'Question 2?',
        description: 'Answer 2',
      },
    ],
  };

  beforeEach(async () => {
    const layoutServiceSpy = jasmine.createSpyObj('SectionLayoutPreferenceService', [
      'register',
      'getPreferences',
    ]);

    await TestBed.configureTestingModule({
      imports: [FaqSectionComponent],
      providers: [{ provide: SectionLayoutPreferenceService, useValue: layoutServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(FaqSectionComponent);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(
      SectionLayoutPreferenceService
    ) as jasmine.SpyObj<SectionLayoutPreferenceService>;
    component.section = mockSection;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render section header', () => {
      fixture.detectChanges();
      const header = fixture.debugElement.query(By.css('lib-section-header'));
      expect(header).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should accept section input', () => {
      expect(component.section).toEqual(mockSection);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call ngOnInit', () => {
      spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should register layout preference function on init', () => {
      component.ngOnInit();
      expect(layoutService.register).toHaveBeenCalledWith('faq', jasmine.any(Function));
    });
  });

  describe('Layout Preferences', () => {
    it('should calculate layout preferences for small item count', () => {
      const section: CardSection = {
        ...mockSection,
        items: [{ title: 'Question?', description: 'Answer' }],
      };
      const prefs = (component as any).calculateFaqLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(1);
    });

    it('should calculate layout preferences for large item count', () => {
      const section: CardSection = {
        ...mockSection,
        items: Array.from({ length: 5 }, (_, i) => ({
          title: `Question ${i + 1}?`,
          description: `Answer ${i + 1}`,
        })),
      };
      const prefs = (component as any).calculateFaqLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(2);
    });

    it('should respect explicit preferredColumns', () => {
      const section: CardSection = {
        ...mockSection,
        preferredColumns: 2,
      };
      const prefs = (component as any).calculateFaqLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(2);
    });

    it('should get layout preferences', () => {
      layoutService.getPreferences.and.returnValue(null);
      const prefs = component.getLayoutPreferences(4);

      expect(prefs).toBeDefined();
      expect(prefs.preferredColumns).toBeGreaterThanOrEqual(1);
      expect(prefs.preferredColumns).toBeLessThanOrEqual(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle section without items', () => {
      const section: CardSection = {
        ...mockSection,
        items: [],
      };
      component.section = section;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle section with many FAQs', () => {
      const section: CardSection = {
        ...mockSection,
        items: Array.from({ length: 20 }, (_, i) => ({
          title: `Question ${i + 1}?`,
          description: `Answer ${i + 1}`,
        })),
      };
      component.section = section;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });
});
