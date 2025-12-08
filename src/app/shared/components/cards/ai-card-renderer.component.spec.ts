import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MasonryGridComponent, SectionRenderEvent } from '@osi-cards/components';
import { IconService, MagneticTiltService, SectionNormalizationService } from '@osi-cards/services';
import { Breakpoint } from '@osi-cards/types';
import { LoggingService } from '../../../core/services/logging.service';
import { CardBuilder, SectionBuilder } from '../../../testing/test-builders';
import { AICardRendererComponent } from './ai-card-renderer.component';

describe('AICardRendererComponent', () => {
  let component: AICardRendererComponent;
  let fixture: ComponentFixture<AICardRendererComponent>;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let iconService: jasmine.SpyObj<IconService>;
  let normalizationService: jasmine.SpyObj<SectionNormalizationService>;
  let tiltService: jasmine.SpyObj<MagneticTiltService>;

  beforeEach(async () => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);
    const iconSpy = jasmine.createSpyObj('IconService', ['getIcon', 'getFieldIcon']);
    const normalizationSpy = jasmine.createSpyObj('SectionNormalizationService', [
      'normalizeSection',
      'sortSections',
    ]);
    const tiltSpy = jasmine.createSpyObj('MagneticTiltService', ['calculateTilt', 'resetTilt']);

    iconSpy.getIcon.and.returnValue('sparkles');
    iconSpy.getFieldIcon.and.returnValue('sparkles');
    normalizationSpy.normalizeSection.and.callFake((section: any) => section);
    normalizationSpy.sortSections.and.callFake((sections: any[]) => sections);

    await TestBed.configureTestingModule({
      imports: [AICardRendererComponent, MasonryGridComponent],
      providers: [
        { provide: LoggingService, useValue: loggingSpy },
        { provide: IconService, useValue: iconSpy },
        { provide: SectionNormalizationService, useValue: normalizationSpy },
        { provide: MagneticTiltService, useValue: tiltSpy },
      ],
    }).compileComponents();

    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    iconService = TestBed.inject(IconService) as jasmine.SpyObj<IconService>;
    normalizationService = TestBed.inject(
      SectionNormalizationService
    ) as jasmine.SpyObj<SectionNormalizationService>;
    tiltService = TestBed.inject(MagneticTiltService) as jasmine.SpyObj<MagneticTiltService>;

    fixture = TestBed.createComponent(AICardRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.tiltEnabled).toBe(true);
    expect(component.isFullscreen).toBe(false);
    expect(component.processedSections).toEqual([]);
  });

  it('should process card config and normalize sections', () => {
    const card = CardBuilder.create()
      .withTitle('Test Card')
      .withSection(SectionBuilder.create().withTitle('Test Section').withType('info').build())
      .build();

    component.cardConfig = card;
    fixture.detectChanges();

    expect(normalizationService.normalizeSection).toHaveBeenCalled();
    expect(component.processedSections.length).toBeGreaterThan(0);
  });

  it('should handle null card config', () => {
    component.cardConfig = undefined as any;
    fixture.detectChanges();

    expect(component.processedSections).toEqual([]);
  });

  it('should handle card config without sections', () => {
    const card = CardBuilder.create().withTitle('Card Without Sections').build();

    component.cardConfig = card;
    fixture.detectChanges();

    expect(component.processedSections).toEqual([]);
  });

  it('should emit field interaction when section event is field type', () => {
    spyOn(component.fieldInteraction, 'emit');

    const section = SectionBuilder.create().withTitle('Test Section').withType('info').build();
    const event: SectionRenderEvent = {
      type: 'field',
      section: section,
      field: { label: 'Test', value: 'Value' },
      metadata: {},
    };

    component.onSectionEvent(event);

    expect(component.fieldInteraction.emit).toHaveBeenCalled();
  });

  it('should handle layout change event', () => {
    const layoutInfo = {
      breakpoint: 'lg' as Breakpoint,
      columns: 3,
      containerWidth: 1200,
    };

    expect(() => component.onLayoutChange(layoutInfo)).not.toThrow();
  });

  it('should handle mouse enter for tilt effect', () => {
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;

    tiltService.calculateTilt.and.returnValue(undefined);

    component.onMouseEnter(mockEvent);

    expect(tiltService.calculateTilt).toHaveBeenCalled();
  });

  it('should handle mouse leave and reset tilt', () => {
    component.onMouseLeave();

    expect(tiltService.resetTilt).toHaveBeenCalled();
  });

  it('should handle mouse move for tilt effect', () => {
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;

    tiltService.calculateTilt.and.returnValue(undefined);

    component.onMouseMove(mockEvent);

    expect(tiltService.calculateTilt).toHaveBeenCalled();
  });

  it('should not apply tilt when tiltEnabled is false', () => {
    component.tiltEnabled = false;
    const mockEvent = {
      clientX: 100,
      clientY: 200,
    } as any;

    component.onMouseEnter(mockEvent);

    // Tilt should not be calculated when disabled
    expect(tiltService.calculateTilt).not.toHaveBeenCalled();
  });

  it('should handle export event', () => {
    spyOn(component.export, 'emit');

    component.onExport();

    expect(component.export.emit).toHaveBeenCalled();
  });

  it('should handle fullscreen toggle', () => {
    spyOn(component.fullscreenToggle, 'emit');

    component.toggleFullscreen();

    expect(component.fullscreenToggle.emit).toHaveBeenCalled();
  });

  it('should update processed sections when card config changes', () => {
    const card1 = CardBuilder.create()
      .withTitle('Card 1')
      .withSection(SectionBuilder.create().withTitle('Section 1').withType('info').build())
      .build();

    const card2 = CardBuilder.create()
      .withTitle('Card 2')
      .withSection(SectionBuilder.create().withTitle('Section 2').withType('analytics').build())
      .build();

    component.cardConfig = card1;
    fixture.detectChanges();

    const initialSections = component.processedSections.length;

    component.cardConfig = card2;
    fixture.detectChanges();

    expect(component.processedSections.length).toBeGreaterThan(0);
  });

  it('should handle card with multiple sections', () => {
    const card = CardBuilder.create()
      .withTitle('Multi Section Card')
      .withSection(SectionBuilder.create().withTitle('Section 1').withType('info').build())
      .withSection(SectionBuilder.create().withTitle('Section 2').withType('analytics').build())
      .build();

    component.cardConfig = card;
    fixture.detectChanges();

    expect(component.processedSections.length).toBe(2);
  });

  it('should clean up on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
