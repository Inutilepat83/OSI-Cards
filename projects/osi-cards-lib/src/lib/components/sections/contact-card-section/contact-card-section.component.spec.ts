/**
 * Contact Card Section Component Tests
 *
 * Unit tests for ContactCardSectionComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactCardSectionComponent } from './contact-card-section.component';
import { By } from '@angular/platform-browser';
import { CardSection, CardItem } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';

describe('ContactCardSectionComponent', () => {
  let component: ContactCardSectionComponent;
  let fixture: ComponentFixture<ContactCardSectionComponent>;
  let layoutService: jasmine.SpyObj<SectionLayoutPreferenceService>;

  const mockSection: CardSection = {
    id: 'contact-1',
    type: 'contact-card',
    title: 'Team',
    items: [
      {
        id: 'contact-1',
        title: 'John Doe',
        description: 'Software Engineer',
        metadata: { role: 'Engineer', email: 'john@example.com' },
      },
    ],
  };

  beforeEach(async () => {
    const layoutServiceSpy = jasmine.createSpyObj('SectionLayoutPreferenceService', [
      'register',
      'getPreferences',
    ]);

    await TestBed.configureTestingModule({
      imports: [ContactCardSectionComponent],
      providers: [{ provide: SectionLayoutPreferenceService, useValue: layoutServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactCardSectionComponent);
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
      expect(layoutService.register).toHaveBeenCalledWith('contact-card', jasmine.any(Function));
    });
  });

  describe('Contact Expansion', () => {
    it('should have null expandedId by default', () => {
      expect(component.expandedId).toBeNull();
    });

    it('should toggle expansion state', () => {
      const contact = mockSection.items![0]!;
      component.toggle(contact);

      expect(component.expandedId).toBeTruthy();
      expect(component.isExpanded(contact)).toBe(true);
    });

    it('should collapse when toggled again', () => {
      const contact = mockSection.items![0]!;
      component.toggle(contact);
      component.toggle(contact);

      expect(component.expandedId).toBeNull();
      expect(component.isExpanded(contact)).toBe(false);
    });

    it('should get contact ID', () => {
      const contact = mockSection.items![0]!;
      const id = component.getId(contact);

      expect(id).toBeTruthy();
    });
  });

  describe('Note Expansion', () => {
    it('should have null noteExpandedId by default', () => {
      expect(component.noteExpandedId).toBeNull();
    });

    it('should set noteExpandedId', () => {
      component.noteExpandedId = 'note-1';
      expect(component.noteExpandedId).toBe('note-1');
    });
  });

  describe('Layout Preferences', () => {
    it('should calculate layout preferences', () => {
      const prefs = (component as any).calculateContactCardLayoutPreferences(mockSection, 4);

      expect(prefs).toBeDefined();
      expect(prefs.preferredColumns).toBeGreaterThanOrEqual(1);
      expect(prefs.preferredColumns).toBeLessThanOrEqual(4);
    });

    it('should get layout preferences', () => {
      layoutService.getPreferences.and.returnValue(null);
      const prefs = component.getLayoutPreferences(4);

      expect(prefs).toBeDefined();
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

    it('should handle contact without id', () => {
      const contact: CardItem = {
        title: 'Contact',
        description: 'Description',
      };
      const id = component.getId(contact);

      expect(id).toBeTruthy();
    });
  });
});
