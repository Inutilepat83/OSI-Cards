/**
 * Chart Section Component Tests
 *
 * Unit tests for ChartSectionComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartSectionComponent } from './chart-section.component';
import { By } from '@angular/platform-browser';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services';
import { ChangeDetectorRef } from '@angular/core';

describe('ChartSectionComponent', () => {
  let component: ChartSectionComponent;
  let fixture: ComponentFixture<ChartSectionComponent>;
  let layoutService: jasmine.SpyObj<SectionLayoutPreferenceService>;

  const mockSection: CardSection = {
    id: 'chart-1',
    type: 'chart',
    title: 'Chart',
    fields: [
      { label: 'Data Point 1', value: 10 },
      { label: 'Data Point 2', value: 20 },
    ],
  };

  beforeEach(async () => {
    const layoutServiceSpy = jasmine.createSpyObj('SectionLayoutPreferenceService', [
      'register',
      'getPreferences',
    ]);

    await TestBed.configureTestingModule({
      imports: [ChartSectionComponent],
      providers: [{ provide: SectionLayoutPreferenceService, useValue: layoutServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartSectionComponent);
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

    it('should call ngAfterViewInit', () => {
      spyOn(component, 'ngAfterViewInit');
      component.ngAfterViewInit();
      expect(component.ngAfterViewInit).toHaveBeenCalled();
    });

    it('should call ngOnDestroy', () => {
      spyOn(component, 'ngOnDestroy');
      component.ngOnDestroy();
      expect(component.ngOnDestroy).toHaveBeenCalled();
    });

    it('should register layout preference function on init', () => {
      component.ngOnInit();
      expect(layoutService.register).toHaveBeenCalledWith('chart', jasmine.any(Function));
    });
  });

  describe('Chart Configuration', () => {
    it('should have chartData initialized', () => {
      expect(component.chartData).toBeDefined();
      expect(component.chartData.labels).toBeDefined();
      expect(component.chartData.datasets).toBeDefined();
    });

    it('should have chartOptions initialized', () => {
      expect(component.chartOptions).toBeDefined();
    });

    it('should have chartJsType initialized', () => {
      expect(component.chartJsType).toBeDefined();
    });
  });

  describe('Chart Loading State', () => {
    it('should have chartLoading initialized', () => {
      expect(component.chartLoading).toBe(true);
    });

    it('should have chartInitFailed initialized', () => {
      expect(component.chartInitFailed).toBe(false);
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

    it('should handle section with invalid chart data', () => {
      const section: CardSection = {
        ...mockSection,
        fields: [{ label: 'Invalid', value: null }],
      };
      component.section = section;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });
});
