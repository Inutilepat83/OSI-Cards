/**
 * Overview Section Component Tests
 *
 * Unit tests for OverviewSectionComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverviewSectionComponent } from './overview-section.component';
import { By } from '@angular/platform-browser';
import { CardSection, CardField } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services';
import { ClipboardService } from '../../../services';
import { ChangeDetectorRef } from '@angular/core';

describe('OverviewSectionComponent', () => {
  let component: OverviewSectionComponent;
  let fixture: ComponentFixture<OverviewSectionComponent>;
  let layoutService: jasmine.SpyObj<SectionLayoutPreferenceService>;
  let clipboardService: jasmine.SpyObj<ClipboardService>;

  const mockSection: CardSection = {
    id: 'overview-1',
    type: 'overview',
    title: 'Overview',
    fields: [
      { label: 'Field 1', value: 'Value 1' },
      { label: 'Field 2', value: 'Value 2' },
    ],
  };

  beforeEach(async () => {
    const layoutServiceSpy = jasmine.createSpyObj('SectionLayoutPreferenceService', [
      'register',
      'getPreferences',
    ]);
    const clipboardServiceSpy = jasmine.createSpyObj('ClipboardService', ['copy']);

    await TestBed.configureTestingModule({
      imports: [OverviewSectionComponent],
      providers: [
        { provide: SectionLayoutPreferenceService, useValue: layoutServiceSpy },
        { provide: ClipboardService, useValue: clipboardServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewSectionComponent);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(
      SectionLayoutPreferenceService
    ) as jasmine.SpyObj<SectionLayoutPreferenceService>;
    clipboardService = TestBed.inject(ClipboardService) as jasmine.SpyObj<ClipboardService>;
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

  describe('Lifecycle Hooks', () => {
    it('should call ngOnInit', () => {
      spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should register layout preference function on init', () => {
      component.ngOnInit();
      expect(layoutService.register).toHaveBeenCalledWith('overview', jasmine.any(Function));
    });
  });

  describe('Layout Preferences', () => {
    it('should calculate layout preferences for small field count', () => {
      const section: CardSection = {
        ...mockSection,
        fields: [{ label: 'Field 1', value: 'Value 1' }],
      };
      const prefs = (component as any).calculateOverviewLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(1);
    });

    it('should calculate layout preferences for large field count', () => {
      const section: CardSection = {
        ...mockSection,
        fields: Array.from({ length: 8 }, (_, i) => ({
          label: `Field ${i + 1}`,
          value: `Value ${i + 1}`,
        })),
      };
      const prefs = (component as any).calculateOverviewLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(2);
    });

    it('should respect explicit preferredColumns', () => {
      const section: CardSection = {
        ...mockSection,
        preferredColumns: 3,
      };
      const prefs = (component as any).calculateOverviewLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(3);
    });

    it('should get layout preferences', () => {
      layoutService.getPreferences.and.returnValue(null);
      const prefs = component.getLayoutPreferences(4);

      expect(prefs).toBeDefined();
      expect(prefs.preferredColumns).toBeGreaterThanOrEqual(1);
      expect(prefs.preferredColumns).toBeLessThanOrEqual(4);
    });
  });

  describe('Field Value Formatting', () => {
    it('should format field value with newlines', () => {
      const field: CardField = {
        label: 'Description',
        value: 'Line 1\nLine 2\nLine 3',
      };
      const formatted = component.formatFieldValue(field);

      expect(formatted).toContain('<br>');
    });

    it('should handle null field value', () => {
      const field: CardField = {
        label: 'Field',
        value: null,
      };
      const formatted = component.formatFieldValue(field);

      expect(formatted).toBe('');
    });

    it('should handle undefined field value', () => {
      const field: CardField = {
        label: 'Field',
        value: undefined,
      };
      const formatted = component.formatFieldValue(field);

      expect(formatted).toBe('');
    });
  });

  describe('Input Properties', () => {
    it('should accept section input', () => {
      expect(component.section).toEqual(mockSection);
    });
  });

  describe('Edge Cases', () => {
    it('should handle section without fields', () => {
      const section: CardSection = {
        ...mockSection,
        fields: [],
      };
      component.section = section;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle section with many fields', () => {
      const section: CardSection = {
        ...mockSection,
        fields: Array.from({ length: 20 }, (_, i) => ({
          label: `Field ${i + 1}`,
          value: `Value ${i + 1}`,
        })),
      };
      component.section = section;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });
});
