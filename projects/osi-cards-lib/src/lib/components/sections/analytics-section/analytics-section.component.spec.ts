/**
 * Analytics Section Component Tests
 *
 * Unit tests for AnalyticsSectionComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyticsSectionComponent } from './analytics-section.component';
import { By } from '@angular/platform-browser';
import { CardSection, CardField } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services';

describe('AnalyticsSectionComponent', () => {
  let component: AnalyticsSectionComponent;
  let fixture: ComponentFixture<AnalyticsSectionComponent>;
  let layoutService: jasmine.SpyObj<SectionLayoutPreferenceService>;

  const mockSection: CardSection = {
    id: 'analytics-1',
    type: 'analytics',
    title: 'Analytics',
    fields: [
      { label: 'Metric 1', value: 100, metadata: { goal: 120 } },
      { label: 'Metric 2', value: 80, metadata: { goal: 100 } },
    ],
  };

  beforeEach(async () => {
    const layoutServiceSpy = jasmine.createSpyObj('SectionLayoutPreferenceService', [
      'register',
      'getPreferences',
    ]);

    await TestBed.configureTestingModule({
      imports: [AnalyticsSectionComponent],
      providers: [{ provide: SectionLayoutPreferenceService, useValue: layoutServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsSectionComponent);
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

    it('should have default density value', () => {
      expect(component.density).toBe('compact');
    });

    it('should accept density input', () => {
      component.density = 'comfortable';
      expect(component.density).toBe('comfortable');
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
      expect(layoutService.register).toHaveBeenCalledWith('analytics', jasmine.any(Function));
    });
  });

  describe('Layout Preferences', () => {
    it('should calculate layout preferences for small field count', () => {
      const section: CardSection = {
        ...mockSection,
        fields: [{ label: 'Metric 1', value: 100 }],
      };
      const prefs = (component as any).calculateAnalyticsLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(1);
    });

    it('should calculate layout preferences for medium field count', () => {
      const section: CardSection = {
        ...mockSection,
        fields: Array.from({ length: 5 }, (_, i) => ({
          label: `Metric ${i + 1}`,
          value: 100,
        })),
      };
      const prefs = (component as any).calculateAnalyticsLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(2);
    });

    it('should calculate layout preferences for large field count', () => {
      const section: CardSection = {
        ...mockSection,
        fields: Array.from({ length: 10 }, (_, i) => ({
          label: `Metric ${i + 1}`,
          value: 100,
        })),
      };
      const prefs = (component as any).calculateAnalyticsLayoutPreferences(section, 4);

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

  describe('Expanded Metric', () => {
    it('should have null expandedMetricId by default', () => {
      expect(component.expandedMetricId).toBeNull();
    });

    it('should set expandedMetricId', () => {
      component.expandedMetricId = 'metric-1';
      expect(component.expandedMetricId).toBe('metric-1');
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

    it('should handle section with many metrics', () => {
      const section: CardSection = {
        ...mockSection,
        fields: Array.from({ length: 20 }, (_, i) => ({
          label: `Metric ${i + 1}`,
          value: 100,
        })),
      };
      component.section = section;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });
});
