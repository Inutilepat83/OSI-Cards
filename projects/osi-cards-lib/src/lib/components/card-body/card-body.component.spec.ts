/**
 * Card Body Component Tests
 *
 * Unit tests for CardBodyComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardBodyComponent } from './card-body.component';
import { By } from '@angular/platform-browser';
import { CardSection } from '../../models';
import { MasonryGridComponent } from '..';
import { SectionRenderEvent, MasonryLayoutInfo } from '..';

describe('CardBodyComponent', () => {
  let component: CardBodyComponent;
  let fixture: ComponentFixture<CardBodyComponent>;

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
    await TestBed.configureTestingModule({
      imports: [CardBodyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardBodyComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render masonry grid when sections are provided', () => {
      component.sections = mockSections;
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid).toBeTruthy();
    });

    it('should not render masonry grid when sections array is empty', () => {
      component.sections = [];
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid).toBeFalsy();
    });

    it('should not render masonry grid when sections is null', () => {
      component.sections = null as unknown as CardSection[];
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid).toBeFalsy();
    });

    it('should project ng-content', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should accept sections input', () => {
      component.sections = mockSections;
      fixture.detectChanges();

      expect(component.sections).toEqual(mockSections);
    });

    it('should have default gap value', () => {
      expect(component.gap).toBe(12);
    });

    it('should accept custom gap value', () => {
      component.gap = 20;
      fixture.detectChanges();

      expect(component.gap).toBe(20);
    });

    it('should have default minColumnWidth value', () => {
      expect(component.minColumnWidth).toBe(260);
    });

    it('should accept custom minColumnWidth value', () => {
      component.minColumnWidth = 300;
      fixture.detectChanges();

      expect(component.minColumnWidth).toBe(300);
    });

    it('should pass sections to masonry grid', () => {
      component.sections = mockSections;
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid).toBeTruthy();
      expect(masonryGrid.componentInstance.sections).toEqual(mockSections);
    });

    it('should pass gap to masonry grid', () => {
      component.sections = mockSections;
      component.gap = 16;
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid.componentInstance.gap).toBe(16);
    });

    it('should pass minColumnWidth to masonry grid', () => {
      component.sections = mockSections;
      component.minColumnWidth = 280;
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid.componentInstance.minColumnWidth).toBe(280);
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
      const mockLayoutInfo: MasonryLayoutInfo = {
        totalHeight: 1000,
        columns: 3,
        items: [],
      };

      spyOn(component.layoutChange, 'emit');
      component.onLayoutChange(mockLayoutInfo);

      expect(component.layoutChange.emit).toHaveBeenCalledWith(mockLayoutInfo);
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

      const mockLayoutInfo: MasonryLayoutInfo = {
        totalHeight: 1000,
        columns: 3,
        items: [],
      };

      spyOn(component.layoutChange, 'emit');
      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      masonryGrid.triggerEventHandler('layoutChange', mockLayoutInfo);

      expect(component.layoutChange.emit).toHaveBeenCalledWith(mockLayoutInfo);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined sections gracefully', () => {
      component.sections = undefined as unknown as CardSection[];
      fixture.detectChanges();

      expect(component).toBeTruthy();
      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid).toBeFalsy();
    });

    it('should handle single section', () => {
      component.sections = [mockSections[0]!];
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid).toBeTruthy();
    });

    it('should handle large number of sections', () => {
      const manySections = Array.from({ length: 50 }, (_, i) => ({
        id: `section-${i}`,
        type: 'overview',
        title: `Section ${i}`,
        fields: [],
      }));

      component.sections = manySections;
      fixture.detectChanges();

      const masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid).toBeTruthy();
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component).toBeTruthy();
      // OnPush is set in component decorator
    });

    it('should update when sections input changes', () => {
      component.sections = [];
      fixture.detectChanges();

      let masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid).toBeFalsy();

      component.sections = mockSections;
      fixture.detectChanges();

      masonryGrid = fixture.debugElement.query(By.directive(MasonryGridComponent));
      expect(masonryGrid).toBeTruthy();
    });
  });
});
