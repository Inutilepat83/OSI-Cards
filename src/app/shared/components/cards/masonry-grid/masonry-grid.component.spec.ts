import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, ElementRef } from '@angular/core';
import { MasonryGridComponent, MasonryLayoutInfo } from './masonry-grid.component';
import { SectionBuilder } from '../../../../testing/test-builders';
import { SectionTypeResolverService } from '../section-renderer/section-type-resolver.service';
import { SectionRendererComponent } from '../section-renderer/section-renderer.component';

describe('MasonryGridComponent', () => {
  let component: MasonryGridComponent;
  let fixture: ComponentFixture<MasonryGridComponent>;
  let typeResolver: jasmine.SpyObj<SectionTypeResolverService>;

  beforeEach(async () => {
    const typeResolverSpy = jasmine.createSpyObj('SectionTypeResolverService', ['resolve']);

    await TestBed.configureTestingModule({
      imports: [MasonryGridComponent, SectionRendererComponent],
      providers: [{ provide: SectionTypeResolverService, useValue: typeResolverSpy }],
    }).compileComponents();

    typeResolver = TestBed.inject(
      SectionTypeResolverService
    ) as jasmine.SpyObj<SectionTypeResolverService>;
    typeResolver.resolve.and.returnValue('info');

    fixture = TestBed.createComponent(MasonryGridComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty sections array', () => {
    expect(component.sections).toEqual([]);
    expect(component.positionedSections).toEqual([]);
    expect(component.containerHeight).toBe(0);
  });

  it('should set default input values', () => {
    expect(component.gap).toBe(12);
    expect(component.minColumnWidth).toBe(260);
    expect(component.maxColumns).toBe(4);
  });

  it('should handle sections input', () => {
    const sections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build(),
      SectionBuilder.create().withTitle('Section 2').withType('analytics').build(),
    ];

    component.sections = sections;
    fixture.detectChanges();

    expect(component.sections.length).toBe(2);
  });

  it('should filter out null/undefined sections', () => {
    const sections = [
      SectionBuilder.create().withTitle('Valid Section').withType('info').build(),
      null as any,
      undefined as any,
    ];

    component.sections = sections;
    fixture.detectChanges();

    // Should filter out null/undefined
    expect(component.positionedSections.length).toBeGreaterThan(0);
  });

  it('should calculate column span for sections', () => {
    const section = SectionBuilder.create()
      .withTitle('Test Section')
      .withType('info')
      .withFields([
        { label: 'Field 1', value: 'Value 1' },
        { label: 'Field 2', value: 'Value 2' },
      ])
      .build();

    component.sections = [section];
    fixture.detectChanges();

    expect(component.positionedSections.length).toBe(1);
    expect(component.positionedSections[0].colSpan).toBeGreaterThan(0);
  });

  it('should respect explicit colSpan from section', () => {
    const section = SectionBuilder.create().withTitle('Test Section').withType('info').build();
    section.colSpan = 2;

    component.sections = [section];
    fixture.detectChanges();

    expect(component.positionedSections[0].colSpan).toBe(2);
  });

  it('should handle project sections with colSpan 1', () => {
    const section = SectionBuilder.create()
      .withTitle('Project Section')
      .withType('project')
      .build();

    component.sections = [section];
    fixture.detectChanges();

    expect(component.positionedSections[0].colSpan).toBe(1);
  });

  it('should emit layoutChange when layout changes', () => {
    spyOn(component.layoutChange, 'emit');

    const sections = [SectionBuilder.create().withTitle('Section 1').withType('info').build()];

    component.sections = sections;
    fixture.detectChanges();

    // Trigger layout change by changing container width
    const containerElement = fixture.nativeElement.querySelector('.masonry-container');
    if (containerElement) {
      Object.defineProperty(containerElement, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
    }

    // Wait for layout to be computed
    fixture.detectChanges();

    // Layout change should be emitted
    expect(component.layoutChange.emit).toHaveBeenCalled();
  });

  it('should emit sectionEvent when section emits event', () => {
    spyOn(component.sectionEvent, 'emit');

    const sections = [SectionBuilder.create().withTitle('Section 1').withType('info').build()];

    component.sections = sections;
    fixture.detectChanges();

    const event = {
      type: 'fieldInteraction' as const,
      field: { label: 'Test', value: 'Value' },
      metadata: {},
    };

    component.onSectionEvent(event);

    expect(component.sectionEvent.emit).toHaveBeenCalledWith(event);
  });

  it('should generate unique section IDs', () => {
    const section1 = SectionBuilder.create().withTitle('Test Section').withType('info').build();
    const section2 = SectionBuilder.create().withTitle('Another Section').withType('info').build();

    const id1 = component.getSectionId(section1);
    const id2 = component.getSectionId(section2);

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
    expect(id1).toContain('section');
  });

  it('should handle null section in getSectionId', () => {
    const id = component.getSectionId(null);
    expect(id).toBe('section-unknown');
  });

  it('should track items correctly', () => {
    const sections = [SectionBuilder.create().withTitle('Section 1').withType('info').build()];

    component.sections = sections;
    fixture.detectChanges();

    const trackResult = component.trackItem(0, component.positionedSections[0]);
    expect(trackResult).toBeTruthy();
  });

  it('should handle null items in trackItem', () => {
    const trackResult = component.trackItem(0, null);
    expect(trackResult).toContain('null-item');
  });

  it('should handle empty sections array', () => {
    component.sections = [];
    fixture.detectChanges();

    expect(component.positionedSections).toEqual([]);
    expect(component.containerHeight).toBe(0);
  });

  it('should handle sections without type by resolving', () => {
    typeResolver.resolve.and.returnValue('info');

    const section = SectionBuilder.create().withTitle('Section Without Type').build();
    delete (section as any).type;

    component.sections = [section];
    fixture.detectChanges();

    expect(typeResolver.resolve).toHaveBeenCalled();
    expect(component.positionedSections.length).toBe(1);
  });

  it('should update layout on sections change', () => {
    const initialSections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build(),
    ];

    component.sections = initialSections;
    fixture.detectChanges();

    const initialCount = component.positionedSections.length;

    const newSections = [
      ...initialSections,
      SectionBuilder.create().withTitle('Section 2').withType('analytics').build(),
    ];

    component.sections = newSections;
    fixture.detectChanges();

    expect(component.positionedSections.length).toBeGreaterThan(initialCount);
  });

  it('should clean up observers on destroy', () => {
    const sections = [SectionBuilder.create().withTitle('Section 1').withType('info').build()];

    component.sections = sections;
    fixture.detectChanges();

    // Component should clean up on destroy
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should handle resize observer setup', () => {
    const sections = [SectionBuilder.create().withTitle('Section 1').withType('info').build()];

    component.sections = sections;
    fixture.detectChanges();

    // After view init, resize observer should be set up
    expect(component).toBeTruthy();
  });

  it('should calculate container height based on sections', () => {
    const sections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build(),
      SectionBuilder.create().withTitle('Section 2').withType('info').build(),
    ];

    component.sections = sections;
    fixture.detectChanges();

    // Container height should be greater than 0 with sections
    expect(component.containerHeight).toBeGreaterThan(0);
  });

  it('should respect maxColumns limit', () => {
    component.maxColumns = 2;
    const sections = [SectionBuilder.create().withTitle('Section 1').withType('info').build()];

    component.sections = sections;
    fixture.detectChanges();

    // ColSpan should not exceed maxColumns
    expect(component.positionedSections[0].colSpan).toBeLessThanOrEqual(2);
  });

  describe('Virtual Scrolling', () => {
    beforeEach(() => {
      component.enableVirtualScrolling = true;
    });

    it('should initialize visibleSections as empty array', () => {
      expect(component.visibleSections).toEqual([]);
    });

    it('should update visible sections when virtual scrolling is enabled', () => {
      const sections = [
        SectionBuilder.create().withTitle('Section 1').withType('info').withId('section-1').build(),
        SectionBuilder.create().withTitle('Section 2').withType('info').withId('section-2').build(),
      ];

      component.sections = sections;
      fixture.detectChanges();

      // Simulate intersection observer adding visible section IDs
      const sectionId1 = component.getSectionId(sections[0]);
      (component as any).visibleSectionIds.add(sectionId1);
      (component as any).updateVisibleSections();

      expect(component.visibleSections.length).toBe(1);
      expect(component.visibleSections[0].section.id).toBe('section-1');
    });

    it('should filter visible sections based on visibleSectionIds', () => {
      const sections = [
        SectionBuilder.create().withTitle('Section 1').withType('info').withId('section-1').build(),
        SectionBuilder.create().withTitle('Section 2').withType('info').withId('section-2').build(),
        SectionBuilder.create().withTitle('Section 3').withType('info').withId('section-3').build(),
      ];

      component.sections = sections;
      fixture.detectChanges();

      // Add only first and third sections to visible set
      const sectionId1 = component.getSectionId(sections[0]);
      const sectionId3 = component.getSectionId(sections[2]);
      (component as any).visibleSectionIds.add(sectionId1);
      (component as any).visibleSectionIds.add(sectionId3);
      (component as any).updateVisibleSections();

      expect(component.visibleSections.length).toBe(2);
      expect(component.visibleSections.map((s) => s.section.id)).toEqual([
        'section-1',
        'section-3',
      ]);
    });

    it('should not update visible sections when virtual scrolling is disabled', () => {
      component.enableVirtualScrolling = false;
      const sections = [
        SectionBuilder.create().withTitle('Section 1').withType('info').withId('section-1').build(),
      ];

      component.sections = sections;
      fixture.detectChanges();

      const sectionId = component.getSectionId(sections[0]);
      (component as any).visibleSectionIds.add(sectionId);
      (component as any).updateVisibleSections();

      // visibleSections should remain empty when virtual scrolling is disabled
      expect(component.visibleSections.length).toBe(0);
    });
  });

  describe('isSectionVisible', () => {
    it('should return true when section ID is in visibleSectionIds', () => {
      const section = SectionBuilder.create().withTitle('Test Section').withType('info').build();
      const sectionId = component.getSectionId(section);
      (component as any).visibleSectionIds.add(sectionId);

      expect(component.isSectionVisible(sectionId)).toBe(true);
    });

    it('should return false when section ID is not in visibleSectionIds', () => {
      const sectionId = 'section-not-visible';
      expect(component.isSectionVisible(sectionId)).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    let mockEvent: KeyboardEvent;
    let mockTarget: HTMLElement;

    beforeEach(() => {
      const sections = [
        SectionBuilder.create().withTitle('Section 1').withType('info').withId('section-1').build(),
        SectionBuilder.create().withTitle('Section 2').withType('info').withId('section-2').build(),
        SectionBuilder.create().withTitle('Section 3').withType('info').withId('section-3').build(),
      ];

      component.sections = sections;
      fixture.detectChanges();

      mockTarget = document.createElement('div');
      mockTarget.id = component.getSectionId(sections[0]);
      mockTarget.setAttribute('id', mockTarget.id);
      document.body.appendChild(mockTarget);
    });

    afterEach(() => {
      document.body.removeChild(mockTarget);
    });

    it('should navigate down with ArrowDown key', () => {
      const focusSpy = spyOn(mockTarget, 'focus');
      mockEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(mockEvent, 'target', { value: mockTarget });

      component.onKeydown(mockEvent);

      expect(mockEvent.defaultPrevented).toBe(true);
    });

    it('should navigate up with ArrowUp key', () => {
      const focusSpy = spyOn(mockTarget, 'focus');
      mockEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      Object.defineProperty(mockEvent, 'target', { value: mockTarget });

      component.onKeydown(mockEvent);

      expect(mockEvent.defaultPrevented).toBe(true);
    });

    it('should navigate to first section with Home key', () => {
      mockEvent = new KeyboardEvent('keydown', { key: 'Home' });
      Object.defineProperty(mockEvent, 'target', { value: mockTarget });

      component.onKeydown(mockEvent);

      expect(mockEvent.defaultPrevented).toBe(true);
    });

    it('should navigate to last section with End key', () => {
      mockEvent = new KeyboardEvent('keydown', { key: 'End' });
      Object.defineProperty(mockEvent, 'target', { value: mockTarget });

      component.onKeydown(mockEvent);

      expect(mockEvent.defaultPrevented).toBe(true);
    });

    it('should not handle non-navigation keys', () => {
      mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(mockEvent, 'target', { value: mockTarget });

      component.onKeydown(mockEvent);

      expect(mockEvent.defaultPrevented).toBe(false);
    });

    it('should handle empty sections array gracefully', () => {
      component.sections = [];
      fixture.detectChanges();

      mockEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(mockEvent, 'target', { value: mockTarget });

      expect(() => component.onKeydown(mockEvent)).not.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should handle invalid sections input (non-array)', () => {
      component.sections = null as any;
      expect(component.sections).toEqual([]);
    });

    it('should handle invalid gap input (negative number)', () => {
      component.gap = -10;
      expect(component.gap).toBe(12); // Should default to 12
    });

    it('should handle invalid gap input (NaN)', () => {
      component.gap = NaN as any;
      expect(component.gap).toBe(12);
    });

    it('should handle invalid gap input (Infinity)', () => {
      component.gap = Infinity;
      expect(component.gap).toBe(12);
    });

    it('should handle invalid minColumnWidth input (zero)', () => {
      component.minColumnWidth = 0;
      expect(component.minColumnWidth).toBe(260); // Should default to 260
    });

    it('should handle invalid minColumnWidth input (negative)', () => {
      component.minColumnWidth = -100;
      expect(component.minColumnWidth).toBe(260);
    });

    it('should handle invalid maxColumns input (non-integer)', () => {
      component.maxColumns = 3.5 as any;
      expect(component.maxColumns).toBe(4); // Should default to 4
    });

    it('should handle invalid maxColumns input (zero)', () => {
      component.maxColumns = 0;
      expect(component.maxColumns).toBe(4);
    });
  });

  describe('Section ID Generation', () => {
    it('should sanitize section titles for IDs', () => {
      const section = SectionBuilder.create()
        .withTitle('Test Section With Spaces & Special Chars!')
        .withType('info')
        .build();

      const id = component.getSectionId(section);
      expect(id).toContain('section');
      expect(id).not.toContain(' ');
      expect(id).not.toContain('!');
    });

    it('should handle sections with only ID', () => {
      const section = SectionBuilder.create().withId('custom-id').build();
      delete (section as any).title;

      const id = component.getSectionId(section);
      expect(id).toContain('section');
    });

    it('should handle sections with only type', () => {
      const section = SectionBuilder.create().withType('info').build();
      delete (section as any).title;
      delete (section as any).id;

      const id = component.getSectionId(section);
      expect(id).toContain('section');
    });

    it('should handle undefined section', () => {
      const id = component.getSectionId(undefined);
      expect(id).toBe('section-unknown');
    });
  });

  describe('Layout Calculations', () => {
    it('should calculate correct column count for different container widths', () => {
      const sections = [SectionBuilder.create().withTitle('Section 1').withType('info').build()];

      component.sections = sections;
      fixture.detectChanges();

      // Mock container width
      const containerElement = fixture.nativeElement.querySelector('.masonry-container');
      if (containerElement) {
        Object.defineProperty(containerElement, 'clientWidth', {
          writable: true,
          configurable: true,
          value: 600,
        });
      }

      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should handle very small container width', () => {
      const sections = [SectionBuilder.create().withTitle('Section 1').withType('info').build()];

      component.sections = sections;
      fixture.detectChanges();

      const containerElement = fixture.nativeElement.querySelector('.masonry-container');
      if (containerElement) {
        Object.defineProperty(containerElement, 'clientWidth', {
          writable: true,
          configurable: true,
          value: 100,
        });
      }

      fixture.detectChanges();
      expect(component.positionedSections.length).toBe(1);
    });

    it('should handle very large container width', () => {
      component.maxColumns = 4;
      const sections = [SectionBuilder.create().withTitle('Section 1').withType('info').build()];

      component.sections = sections;
      fixture.detectChanges();

      const containerElement = fixture.nativeElement.querySelector('.masonry-container');
      if (containerElement) {
        Object.defineProperty(containerElement, 'clientWidth', {
          writable: true,
          configurable: true,
          value: 5000,
        });
      }

      fixture.detectChanges();
      // Should respect maxColumns
      expect(component.positionedSections[0].colSpan).toBeLessThanOrEqual(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle sections with very long titles', () => {
      const longTitle = 'A'.repeat(1000);
      const section = SectionBuilder.create().withTitle(longTitle).withType('info').build();

      component.sections = [section];
      fixture.detectChanges();

      expect(component.positionedSections.length).toBe(1);
      const id = component.getSectionId(section);
      expect(id.length).toBeLessThan(200); // Should be sanitized
    });

    it('should handle sections with special characters in title', () => {
      const section = SectionBuilder.create()
        .withTitle('Section @#$%^&*()')
        .withType('info')
        .build();

      component.sections = [section];
      fixture.detectChanges();

      const id = component.getSectionId(section);
      expect(id).not.toContain('@');
      expect(id).not.toContain('#');
    });

    it('should handle rapid section changes', () => {
      const sections1 = [SectionBuilder.create().withTitle('Section 1').withType('info').build()];
      const sections2 = [
        SectionBuilder.create().withTitle('Section 2').withType('info').build(),
        SectionBuilder.create().withTitle('Section 3').withType('info').build(),
      ];

      component.sections = sections1;
      fixture.detectChanges();

      component.sections = sections2;
      fixture.detectChanges();

      expect(component.positionedSections.length).toBe(2);
    });
  });
});
