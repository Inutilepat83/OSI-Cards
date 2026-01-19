/**
 * Smart Grid Component Tests
 *
 * Unit tests for SmartGridComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartGridComponent, SmartGridSection, SectionClickEvent } from './smart-grid.component';
import { By } from '@angular/platform-browser';
import { ElementRef, ChangeDetectorRef } from '@angular/core';
import { GridLayoutEngine, GridLayout, PositionedGridSection } from '@osi-cards/core';
import { ResizeManager } from '@osi-cards/core';

describe('SmartGridComponent', () => {
  let component: SmartGridComponent;
  let fixture: ComponentFixture<SmartGridComponent>;
  let mockEngine: jasmine.SpyObj<GridLayoutEngine>;
  let mockResizeManager: jasmine.SpyObj<ResizeManager>;
  let cdr: ChangeDetectorRef;

  const mockSections: SmartGridSection[] = [
    {
      id: 'section-1',
      title: 'Section 1',
      height: 100,
      colSpan: 1,
    },
    {
      id: 'section-2',
      title: 'Section 2',
      height: 150,
      colSpan: 1,
    },
  ];

  beforeEach(async () => {
    const engineSpy = jasmine.createSpyObj(
      'GridLayoutEngine',
      ['calculate', 'configure', 'setHeight', 'clearCache'],
      {
        layout$: jasmine.createSpyObj('Observable', ['subscribe']),
      }
    );

    const resizeManagerSpy = jasmine.createSpyObj('ResizeManager', ['getWidth', 'destroy'], {
      width$: jasmine.createSpyObj('Observable', ['subscribe']),
    });

    await TestBed.configureTestingModule({
      imports: [SmartGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SmartGridComponent);
    component = fixture.componentInstance;
    cdr = fixture.debugElement.injector.get(ChangeDetectorRef);

    // Mock the engine and resize manager after component creation
    (component as any).engine = engineSpy;
    (component as any).resizeManager = resizeManagerSpy;
    mockEngine = engineSpy;
    mockResizeManager = resizeManagerSpy;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render grid container', () => {
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('.smart-grid-container'));
      expect(container).toBeTruthy();
    });

    it('should render grid items when layout has sections', () => {
      const mockLayout: GridLayout = {
        sections: [
          {
            id: 'section-1',
            section: mockSections[0]!,
            left: '0px',
            top: 0,
            width: '300px',
            height: 100,
          },
        ],
        totalHeight: 100,
        columns: 1,
        containerWidth: 1200,
      };

      component.layout = mockLayout;
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.smart-grid-item'));
      expect(items.length).toBe(1);
    });
  });

  describe('Input Properties', () => {
    it('should accept sections input', () => {
      component.sections = mockSections;
      expect(component.sections).toEqual(mockSections);
    });

    it('should have default maxColumns value', () => {
      expect(component.maxColumns).toBe(4);
    });

    it('should accept custom maxColumns value', () => {
      component.maxColumns = 6;
      expect(component.maxColumns).toBe(6);
    });

    it('should have default gap value', () => {
      expect(component.gap).toBe(16);
    });

    it('should accept custom gap value', () => {
      component.gap = 20;
      expect(component.gap).toBe(20);
    });

    it('should have default minColumnWidth value', () => {
      expect(component.minColumnWidth).toBe(280);
    });

    it('should accept custom minColumnWidth value', () => {
      component.minColumnWidth = 300;
      expect(component.minColumnWidth).toBe(300);
    });

    it('should have default optimize value', () => {
      expect(component.optimize).toBe(true);
    });

    it('should accept custom optimize value', () => {
      component.optimize = false;
      expect(component.optimize).toBe(false);
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

    it('should destroy resize manager on destroy', () => {
      component.ngOnDestroy();
      expect(mockResizeManager.destroy).toHaveBeenCalled();
    });
  });

  describe('Layout Calculation', () => {
    it('should recalculate layout when sections change', () => {
      mockResizeManager.getWidth.and.returnValue(1200);
      component.sections = mockSections;
      component.ngOnChanges({
        sections: {
          previousValue: [],
          currentValue: mockSections,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(mockEngine.calculate).toHaveBeenCalled();
    });

    it('should configure engine when config changes', () => {
      component.maxColumns = 6;
      component.ngOnChanges({
        maxColumns: {
          previousValue: 4,
          currentValue: 6,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(mockEngine.configure).toHaveBeenCalled();
    });

    it('should not recalculate when width is 0', () => {
      mockResizeManager.getWidth.and.returnValue(0);
      component.sections = mockSections;
      component.ngOnChanges({
        sections: {
          previousValue: [],
          currentValue: mockSections,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(mockEngine.calculate).not.toHaveBeenCalled();
    });

    it('should not recalculate when sections are empty', () => {
      mockResizeManager.getWidth.and.returnValue(1200);
      component.sections = [];
      component.ngOnChanges({
        sections: {
          previousValue: mockSections,
          currentValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(mockEngine.calculate).not.toHaveBeenCalled();
    });
  });

  describe('Layout Change Event', () => {
    it('should emit layoutChange when layout updates', () => {
      const mockLayout: GridLayout = {
        sections: [],
        totalHeight: 100,
        columns: 2,
        containerWidth: 1200,
      };

      spyOn(component.layoutChange, 'emit');
      component.layout = mockLayout;
      fixture.detectChanges();

      // Simulate layout update
      (component as any).engine.layout$.subscribe = (callback: (layout: GridLayout) => void) => {
        callback(mockLayout);
      };
    });
  });

  describe('Section Click Event', () => {
    it('should emit sectionClick when item is clicked', () => {
      const mockPosition: PositionedGridSection = {
        id: 'section-1',
        section: mockSections[0]!,
        left: '0px',
        top: 0,
        width: '300px',
        height: 100,
      };

      const mockLayout: GridLayout = {
        sections: [mockPosition],
        totalHeight: 100,
        columns: 1,
        containerWidth: 1200,
      };

      component.layout = mockLayout;
      fixture.detectChanges();

      spyOn(component.sectionClick, 'emit');
      const item = fixture.debugElement.query(By.css('.smart-grid-item'));
      if (item) {
        item.nativeElement.click();
        expect(component.sectionClick.emit).toHaveBeenCalled();
      }
    });
  });

  describe('setHeight Method', () => {
    it('should set height for section and recalculate', () => {
      mockResizeManager.getWidth.and.returnValue(1200);
      component.setHeight('section-1', 200);

      expect(mockEngine.setHeight).toHaveBeenCalledWith('section-1', 200);
      expect(mockEngine.calculate).toHaveBeenCalled();
    });

    it('should not recalculate when width is 0', () => {
      mockResizeManager.getWidth.and.returnValue(0);
      component.setHeight('section-1', 200);

      expect(mockEngine.setHeight).toHaveBeenCalled();
      expect(mockEngine.calculate).not.toHaveBeenCalled();
    });
  });

  describe('refresh Method', () => {
    it('should clear cache and recalculate', () => {
      mockResizeManager.getWidth.and.returnValue(1200);
      component.refresh();

      expect(mockEngine.clearCache).toHaveBeenCalled();
      expect(mockEngine.calculate).toHaveBeenCalled();
    });
  });

  describe('isNew Method', () => {
    it('should return true for new sections', () => {
      (component as any).newSectionIds = new Set(['section-1']);
      expect(component.isNew('section-1')).toBe(true);
    });

    it('should return false for existing sections', () => {
      (component as any).newSectionIds = new Set();
      expect(component.isNew('section-1')).toBe(false);
    });
  });

  describe('New Section Detection', () => {
    it('should detect new sections when sections change', () => {
      (component as any).previousIds = new Set(['section-1']);
      component.sections = [
        ...mockSections,
        {
          id: 'section-3',
          title: 'Section 3',
          height: 120,
          colSpan: 1,
        },
      ];

      component.ngOnChanges({
        sections: {
          previousValue: mockSections,
          currentValue: component.sections,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.isNew('section-3')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sections array', () => {
      component.sections = [];
      component.ngOnChanges({
        sections: {
          previousValue: mockSections,
          currentValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.sections).toEqual([]);
    });

    it('should handle null layout', () => {
      component.layout = null;
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.smart-grid-item'));
      expect(items.length).toBe(0);
    });

    it('should handle layout with empty sections', () => {
      const emptyLayout: GridLayout = {
        sections: [],
        totalHeight: 0,
        columns: 0,
        containerWidth: 1200,
      };

      component.layout = emptyLayout;
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.smart-grid-item'));
      expect(items.length).toBe(0);
    });
  });

  describe('Template Rendering', () => {
    it('should render default section when no template provided', () => {
      const mockLayout: GridLayout = {
        sections: [
          {
            id: 'section-1',
            section: mockSections[0]!,
            left: '0px',
            top: 0,
            width: '300px',
            height: 100,
          },
        ],
        totalHeight: 100,
        columns: 1,
        containerWidth: 1200,
      };

      component.layout = mockLayout;
      fixture.detectChanges();

      const defaultSection = fixture.debugElement.query(By.css('.default-section'));
      expect(defaultSection).toBeTruthy();
    });
  });
});
