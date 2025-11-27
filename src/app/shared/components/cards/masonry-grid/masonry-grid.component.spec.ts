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
      providers: [
        { provide: SectionTypeResolverService, useValue: typeResolverSpy }
      ]
    }).compileComponents();

    typeResolver = TestBed.inject(SectionTypeResolverService) as jasmine.SpyObj<SectionTypeResolverService>;
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
      SectionBuilder.create().withTitle('Section 2').withType('analytics').build()
    ];

    component.sections = sections;
    fixture.detectChanges();

    expect(component.sections.length).toBe(2);
  });

  it('should filter out null/undefined sections', () => {
    const sections = [
      SectionBuilder.create().withTitle('Valid Section').withType('info').build(),
      null as any,
      undefined as any
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
        { label: 'Field 2', value: 'Value 2' }
      ])
      .build();

    component.sections = [section];
    fixture.detectChanges();

    expect(component.positionedSections.length).toBe(1);
    expect(component.positionedSections[0].colSpan).toBeGreaterThan(0);
  });

  it('should respect explicit colSpan from section', () => {
    const section = SectionBuilder.create()
      .withTitle('Test Section')
      .withType('info')
      .build();
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

    const sections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build()
    ];

    component.sections = sections;
    fixture.detectChanges();

    // Trigger layout change by changing container width
    const containerElement = fixture.nativeElement.querySelector('.masonry-container');
    if (containerElement) {
      Object.defineProperty(containerElement, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
    }

    // Wait for layout to be computed
    fixture.detectChanges();

    // Layout change should be emitted
    expect(component.layoutChange.emit).toHaveBeenCalled();
  });

  it('should emit sectionEvent when section emits event', () => {
    spyOn(component.sectionEvent, 'emit');

    const sections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build()
    ];

    component.sections = sections;
    fixture.detectChanges();

    const event = {
      type: 'fieldInteraction' as const,
      field: { label: 'Test', value: 'Value' },
      metadata: {}
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
    const sections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build()
    ];

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

    const section = SectionBuilder.create()
      .withTitle('Section Without Type')
      .build();
    delete (section as any).type;

    component.sections = [section];
    fixture.detectChanges();

    expect(typeResolver.resolve).toHaveBeenCalled();
    expect(component.positionedSections.length).toBe(1);
  });

  it('should update layout on sections change', () => {
    const initialSections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build()
    ];

    component.sections = initialSections;
    fixture.detectChanges();

    const initialCount = component.positionedSections.length;

    const newSections = [
      ...initialSections,
      SectionBuilder.create().withTitle('Section 2').withType('analytics').build()
    ];

    component.sections = newSections;
    fixture.detectChanges();

    expect(component.positionedSections.length).toBeGreaterThan(initialCount);
  });

  it('should clean up observers on destroy', () => {
    const sections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build()
    ];

    component.sections = sections;
    fixture.detectChanges();

    // Component should clean up on destroy
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should handle resize observer setup', () => {
    const sections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build()
    ];

    component.sections = sections;
    fixture.detectChanges();

    // After view init, resize observer should be set up
    expect(component).toBeTruthy();
  });

  it('should calculate container height based on sections', () => {
    const sections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build(),
      SectionBuilder.create().withTitle('Section 2').withType('info').build()
    ];

    component.sections = sections;
    fixture.detectChanges();

    // Container height should be greater than 0 with sections
    expect(component.containerHeight).toBeGreaterThan(0);
  });

  it('should respect maxColumns limit', () => {
    component.maxColumns = 2;
    const sections = [
      SectionBuilder.create().withTitle('Section 1').withType('info').build()
    ];

    component.sections = sections;
    fixture.detectChanges();

    // ColSpan should not exceed maxColumns
    expect(component.positionedSections[0].colSpan).toBeLessThanOrEqual(2);
  });
});

