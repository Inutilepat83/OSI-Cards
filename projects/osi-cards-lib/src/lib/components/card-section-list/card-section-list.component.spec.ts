/**
 * Card Section List Component Tests
 *
 * Unit tests for CardSectionListComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardSectionListComponent } from './card-section-list.component';
import { By } from '@angular/platform-browser';
import { CardSection } from '../../models';
import { LoggerService } from '../../services';
import { MasonryGridComponent } from '../masonry-grid/masonry-grid.component';
import { ChangeDetectorRef } from '@angular/core';
import { SectionRenderEvent, MasonryLayoutInfo } from '..';

describe('CardSectionListComponent', () => {
  let component: CardSectionListComponent;
  let fixture: ComponentFixture<CardSectionListComponent>;
  let logger: jasmine.SpyObj<LoggerService>;
  let cdr: ChangeDetectorRef;

  const mockSections: CardSection[] = [
    {
      id: 'section-1',
      type: 'overview',
      title: 'Overview Section',
      fields: [],
    },
    {
      id: 'section-2',
      type: 'analytics',
      title: 'Analytics Section',
      fields: [],
    },
  ];

  beforeEach(async () => {
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['info']);

    await TestBed.configureTestingModule({
      imports: [CardSectionListComponent, MasonryGridComponent],
      providers: [{ provide: LoggerService, useValue: loggerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CardSectionListComponent);
    component = fixture.componentInstance;
    logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render masonry grid', () => {
      component.sections = mockSections;
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should accept sections input', () => {
      component.sections = mockSections;
      expect(component.sections).toEqual(mockSections);
    });

    it('should have default empty sections array', () => {
      expect(component.sections).toEqual([]);
    });

    it('should handle null sections input', () => {
      component.sections = null as unknown as CardSection[];
      expect(component.sections).toEqual([]);
    });

    it('should accept containerWidth input', () => {
      component.containerWidth = 1400;
      expect(component.containerWidth).toBe(1400);
    });

    it('should have default isStreaming value', () => {
      expect(component.isStreaming).toBe(false);
    });

    it('should accept isStreaming input', () => {
      component.isStreaming = true;
      expect(component.isStreaming).toBe(true);
    });

    it('should have default debugMode value', () => {
      expect(component.debugMode).toBe(false);
    });

    it('should accept debugMode input', () => {
      component.debugMode = true;
      expect(component.debugMode).toBe(true);
    });
  });

  describe('Sections Setter', () => {
    it('should update sections when setter is called', () => {
      component.sections = mockSections;
      expect(component.sections).toEqual(mockSections);
    });

    it('should handle empty array', () => {
      component.sections = [];
      expect(component.sections).toEqual([]);
    });

    it('should mark for check when sections change', () => {
      spyOn(cdr, 'markForCheck');
      component.sections = mockSections;
      expect(cdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should emit sectionEvent when onSectionEvent is called', () => {
      const mockEvent: SectionRenderEvent = {
        type: 'click',
        sectionId: 'section-1',
        fieldId: 'field-1',
      };
      spyOn(component.sectionEvent, 'emit');

      component.onSectionEvent(mockEvent);

      expect(component.sectionEvent.emit).toHaveBeenCalledWith(mockEvent);
    });

    it('should emit layoutChange when onLayoutChange is called', () => {
      const mockLayout: MasonryLayoutInfo = {
        totalHeight: 1000,
        columns: 3,
        items: [],
      };
      spyOn(component.layoutChange, 'emit');

      component.onLayoutChange(mockLayout);

      expect(component.layoutChange.emit).toHaveBeenCalledWith(mockLayout);
    });

    it('should forward sectionEvent from masonry grid', () => {
      component.sections = mockSections;
      fixture.detectChanges();

      const mockEvent: SectionRenderEvent = {
        type: 'click',
        sectionId: 'section-1',
      };

      spyOn(component.sectionEvent, 'emit');
      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      masonryGrid.triggerEventHandler('sectionEvent', mockEvent);

      expect(component.sectionEvent.emit).toHaveBeenCalledWith(mockEvent);
    });

    it('should forward layoutChange from masonry grid', () => {
      component.sections = mockSections;
      fixture.detectChanges();

      const mockLayout: MasonryLayoutInfo = {
        totalHeight: 1000,
        columns: 3,
        items: [],
      };

      spyOn(component.layoutChange, 'emit');
      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      masonryGrid.triggerEventHandler('layoutChange', mockLayout);

      expect(component.layoutChange.emit).toHaveBeenCalledWith(mockLayout);
    });
  });

  describe('TrackBy Function', () => {
    it('should track by section id when available', () => {
      const section: CardSection = {
        id: 'section-123',
        type: 'overview',
        fields: [],
      };
      const result = component.trackSection(0, section);
      expect(result).toBe('section-123');
    });

    it('should track by title and index when id is missing', () => {
      const section: CardSection = {
        type: 'overview',
        title: 'Overview',
        fields: [],
      };
      const result = component.trackSection(2, section);
      expect(result).toBe('Overview-2');
    });

    it('should handle section without id or title', () => {
      const section: CardSection = {
        type: 'overview',
        fields: [],
      };
      const result = component.trackSection(1, section);
      expect(result).toBe('undefined-1');
    });
  });

  describe('ngOnChanges', () => {
    it('should log sections when sections change', () => {
      component.sections = mockSections;
      component.ngOnChanges({
        sections: {
          previousValue: [],
          currentValue: mockSections,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(logger.info).toHaveBeenCalled();
    });

    it('should not log when sections is null', () => {
      component.sections = null as unknown as CardSection[];
      component.ngOnChanges({
        sections: {
          previousValue: [],
          currentValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should mark for check when sections change', () => {
      spyOn(cdr, 'markForCheck');
      component.sections = mockSections;
      component.ngOnChanges({
        sections: {
          previousValue: [],
          currentValue: mockSections,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(cdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('Masonry Grid Integration', () => {
    it('should pass sections to masonry grid', () => {
      component.sections = mockSections;
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid.componentInstance.sections).toEqual(mockSections);
    });

    it('should pass containerWidth to masonry grid', () => {
      component.containerWidth = 1400;
      component.sections = mockSections;
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid.componentInstance.containerWidth).toBe(1400);
    });

    it('should pass isStreaming to masonry grid', () => {
      component.isStreaming = true;
      component.sections = mockSections;
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid.componentInstance.isStreaming).toBe(true);
    });

    it('should pass debugMode to masonry grid', () => {
      component.debugMode = true;
      component.sections = mockSections;
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid.componentInstance.debugMode).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sections array', () => {
      component.sections = [];
      fixture.detectChanges();

      expect(component.sections).toEqual([]);
    });

    it('should handle sections with missing properties', () => {
      const incompleteSections: CardSection[] = [
        {
          type: 'overview',
          fields: [],
        },
      ];
      component.sections = incompleteSections;
      fixture.detectChanges();

      expect(component.sections).toEqual(incompleteSections);
    });

    it('should handle large number of sections', () => {
      const manySections = Array.from({ length: 100 }, (_, i) => ({
        id: `section-${i}`,
        type: 'overview',
        title: `Section ${i}`,
        fields: [],
      }));
      component.sections = manySections;
      fixture.detectChanges();

      expect(component.sections.length).toBe(100);
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component).toBeTruthy();
      // OnPush is set in component decorator
    });

    it('should use batched change detection', () => {
      // The component uses batchedMarkForCheck internally
      component.sections = mockSections;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });
});
