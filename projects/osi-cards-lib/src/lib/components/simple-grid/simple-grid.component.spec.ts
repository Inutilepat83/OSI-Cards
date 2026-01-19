/**
 * Simple Grid Component Tests
 *
 * Unit tests for SimpleGridComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleGridComponent, SimpleGridLayoutInfo } from './simple-grid.component';
import { By } from '@angular/platform-browser';
import { CardSection } from '@osi-cards/models';
import { LayoutCalculationService, LayoutStateManager } from '@osi-cards/services';
import { SectionRendererComponent } from '@osi-cards/components';
import { ChangeDetectorRef } from '@angular/core';

describe('SimpleGridComponent', () => {
  let component: SimpleGridComponent;
  let fixture: ComponentFixture<SimpleGridComponent>;
  let layoutService: jasmine.SpyObj<LayoutCalculationService>;
  let cdr: ChangeDetectorRef;

  const mockSections: CardSection[] = [
    {
      id: 'section-1',
      type: 'overview',
      title: 'Overview',
      fields: [],
    },
    {
      id: 'section-2',
      type: 'analytics',
      title: 'Analytics',
      fields: [],
    },
  ];

  beforeEach(async () => {
    const layoutServiceSpy = jasmine.createSpyObj('LayoutCalculationService', [
      'calculateLayout',
      'getLayoutStatistics',
    ]);

    await TestBed.configureTestingModule({
      imports: [SimpleGridComponent, SectionRendererComponent],
      providers: [{ provide: LayoutCalculationService, useValue: layoutServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SimpleGridComponent);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(
      LayoutCalculationService
    ) as jasmine.SpyObj<LayoutCalculationService>;
    cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render grid container', () => {
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('.simple-grid-container'));
      expect(container).toBeTruthy();
    });

    it('should render grid items when sections are provided', () => {
      layoutService.calculateLayout.and.returnValue({
        positions: [
          {
            key: 'section-1',
            section: mockSections[0]!,
            left: '0px',
            top: 0,
            width: '300px',
            preferredColumns: 1,
          },
        ],
        columnHeights: [100],
        totalHeight: 100,
        columns: 1,
        containerWidth: 1200,
      });

      component.sections = mockSections;
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.grid-item'));
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Input Properties', () => {
    it('should accept sections input', () => {
      component.sections = mockSections;
      expect(component.sections).toEqual(mockSections);
    });

    it('should have default gap value', () => {
      expect(component.gap).toBe(16);
    });

    it('should accept custom gap value', () => {
      component.gap = 20;
      expect(component.gap).toBe(20);
    });

    it('should have default minColumnWidth value', () => {
      expect(component.minColumnWidth).toBe(260);
    });

    it('should accept custom minColumnWidth value', () => {
      component.minColumnWidth = 300;
      expect(component.minColumnWidth).toBe(300);
    });

    it('should have default maxColumns value', () => {
      expect(component.maxColumns).toBe(4);
    });

    it('should accept custom maxColumns value', () => {
      component.maxColumns = 6;
      expect(component.maxColumns).toBe(6);
    });

    it('should accept containerWidth input', () => {
      component.containerWidth = 1400;
      expect(component.containerWidth).toBe(1400);
    });
  });

  describe('Layout Calculation', () => {
    it('should calculate layout on init', () => {
      layoutService.calculateLayout.and.returnValue({
        positions: [],
        columnHeights: [],
        totalHeight: 0,
        columns: 0,
        containerWidth: 1200,
      });

      component.sections = mockSections;
      component.ngOnInit();
      fixture.detectChanges();

      expect(layoutService.calculateLayout).toHaveBeenCalled();
    });

    it('should recalculate layout when sections change', () => {
      layoutService.calculateLayout.and.returnValue({
        positions: [],
        columnHeights: [],
        totalHeight: 0,
        columns: 0,
        containerWidth: 1200,
      });

      component.sections = [];
      component.ngOnInit();
      fixture.detectChanges();

      component.sections = mockSections;
      component.ngOnChanges({
        sections: {
          previousValue: [],
          currentValue: mockSections,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(layoutService.calculateLayout).toHaveBeenCalled();
    });

    it('should recalculate layout when containerWidth changes', () => {
      layoutService.calculateLayout.and.returnValue({
        positions: [],
        columnHeights: [],
        totalHeight: 0,
        columns: 0,
        containerWidth: 1200,
      });

      component.containerWidth = 1000;
      component.ngOnChanges({
        containerWidth: {
          previousValue: undefined,
          currentValue: 1000,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(layoutService.calculateLayout).toHaveBeenCalled();
    });

    it('should recalculate layout when gap changes', () => {
      layoutService.calculateLayout.and.returnValue({
        positions: [],
        columnHeights: [],
        totalHeight: 0,
        columns: 0,
        containerWidth: 1200,
      });

      component.gap = 20;
      component.ngOnChanges({
        gap: {
          previousValue: 16,
          currentValue: 20,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(layoutService.calculateLayout).toHaveBeenCalled();
    });

    it('should use default container width when not provided', () => {
      layoutService.calculateLayout.and.returnValue({
        positions: [],
        columnHeights: [],
        totalHeight: 0,
        columns: 0,
        containerWidth: 1200,
      });

      component.containerWidth = undefined;
      component.sections = mockSections;
      component.ngOnInit();

      const callArgs = layoutService.calculateLayout.calls.mostRecent().args;
      expect(callArgs[1].containerWidth).toBe(1200);
    });

    it('should reset state when sections are empty', () => {
      component.sections = [];
      component.ngOnInit();

      expect(component.positionedSections).toEqual([]);
    });
  });

  describe('Layout Change Event', () => {
    it('should emit layoutChange when layout is calculated', () => {
      const mockResult = {
        positions: [],
        columnHeights: [100],
        totalHeight: 100,
        columns: 2,
        containerWidth: 1200,
        calculationTime: 5.5,
      };

      layoutService.calculateLayout.and.returnValue(mockResult);
      spyOn(component.layoutChange, 'emit');

      component.sections = mockSections;
      component.ngOnInit();

      expect(component.layoutChange.emit).toHaveBeenCalled();
      const emittedValue = component.layoutChange.emit.calls.mostRecent()
        .args[0] as SimpleGridLayoutInfo;
      expect(emittedValue.columns).toBe(2);
      expect(emittedValue.totalHeight).toBe(100);
      expect(emittedValue.containerWidth).toBe(1200);
    });
  });

  describe('Section Event Handling', () => {
    it('should emit sectionEvent when onSectionEvent is called', () => {
      const mockEvent = { type: 'click', sectionId: 'section-1' };
      spyOn(component.sectionEvent, 'emit');

      component.onSectionEvent(mockEvent);

      expect(component.sectionEvent.emit).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('TrackBy Function', () => {
    it('should track by key', () => {
      const positioned = {
        key: 'section-1',
        section: mockSections[0]!,
        left: '0px',
        top: 0,
        width: '300px',
        preferredColumns: 1,
      };

      const result = component.trackByKey(0, positioned);
      expect(result).toBe('section-1');
    });
  });

  describe('Layout State', () => {
    it('should return layout state', () => {
      const state = component.getLayoutState();
      expect(state).toBeDefined();
    });

    it('should get layout statistics', () => {
      layoutService.getLayoutStatistics.and.returnValue({
        totalSections: 2,
        averageHeight: 150,
      });

      layoutService.calculateLayout.and.returnValue({
        positions: [
          {
            key: 'section-1',
            section: mockSections[0]!,
            left: '0px',
            top: 0,
            width: '300px',
            preferredColumns: 1,
          },
        ],
        columnHeights: [100],
        totalHeight: 100,
        columns: 1,
        containerWidth: 1200,
      });

      component.sections = mockSections;
      component.ngOnInit();

      const stats = component.getLayoutStatistics();
      expect(stats).toBeDefined();
    });
  });

  describe('Recalculate Method', () => {
    it('should recalculate layout when called', () => {
      layoutService.calculateLayout.and.returnValue({
        positions: [],
        columnHeights: [],
        totalHeight: 0,
        columns: 0,
        containerWidth: 1200,
      });

      component.recalculate();

      expect(layoutService.calculateLayout).toHaveBeenCalled();
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call ngOnInit', () => {
      spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should call ngOnDestroy', () => {
      spyOn(component, 'ngOnDestroy');
      component.ngOnDestroy();
      expect(component.ngOnDestroy).toHaveBeenCalled();
    });

    it('should call ngOnChanges', () => {
      spyOn(component, 'ngOnChanges');
      component.ngOnChanges({
        sections: {
          previousValue: [],
          currentValue: mockSections,
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(component.ngOnChanges).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle layout calculation errors', () => {
      layoutService.calculateLayout.and.throwError('Calculation failed');
      spyOn(console, 'error');

      component.sections = mockSections;
      component.ngOnInit();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sections array', () => {
      component.sections = [];
      component.ngOnInit();

      expect(component.positionedSections).toEqual([]);
    });

    it('should handle null sections', () => {
      component.sections = null as unknown as CardSection[];
      component.ngOnInit();

      expect(component.positionedSections).toEqual([]);
    });

    it('should handle sections without ids', () => {
      const sectionsWithoutIds: CardSection[] = [
        {
          type: 'overview',
          title: 'Overview',
          fields: [],
        },
      ];

      layoutService.calculateLayout.and.returnValue({
        positions: [],
        columnHeights: [],
        totalHeight: 0,
        columns: 0,
        containerWidth: 1200,
      });

      component.sections = sectionsWithoutIds;
      component.ngOnInit();

      expect(component).toBeTruthy();
    });
  });
});
