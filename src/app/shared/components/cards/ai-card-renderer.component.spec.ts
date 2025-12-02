import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MagneticTiltService } from '@osi-cards/services';
import { LoggingService } from '../../../../core/services/logging.service';
import { CardBuilder, SectionBuilder } from '../../../../testing/test-builders';
import { IconService } from '../../services/icon.service';
import { SectionNormalizationService } from '../../services/section-normalization.service';
import { AICardRendererComponent } from './ai-card-renderer.component';
import { MasonryGridComponent } from './masonry-grid/masonry-grid.component';

describe('AICardRendererComponent', () => {
  let component: AICardRendererComponent;
  let fixture: ComponentFixture<AICardRendererComponent>;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let iconService: jasmine.SpyObj<IconService>;
  let normalizationService: jasmine.SpyObj<SectionNormalizationService>;
  let tiltService: jasmine.SpyObj<MagneticTiltService>;

  beforeEach(async () => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);
    const iconSpy = jasmine.createSpyObj('IconService', ['getIcon']);
    const normalizationSpy = jasmine.createSpyObj('SectionNormalizationService', ['normalize']);
    const tiltSpy = jasmine.createSpyObj('MagneticTiltService', ['calculateTilt', 'reset']);

    iconSpy.getIcon.and.returnValue('sparkles');
    normalizationSpy.normalize.and.returnValue([]);

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

    normalizationService.normalize.and.returnValue([
      SectionBuilder.create().withTitle('Test Section').withType('info').build(),
    ]);

    component.cardConfig = card;
    fixture.detectChanges();

    expect(normalizationService.normalize).toHaveBeenCalled();
    expect(component.processedSections.length).toBeGreaterThan(0);
  });

  it('should handle null card config', () => {
    component.cardConfig = undefined as any;
    fixture.detectChanges();

    expect(component.processedSections).toEqual([]);
  });

  it('should handle card config without sections', () => {
    const card = CardBuilder.create().withTitle('Card Without Sections').build();

    normalizationService.normalize.and.returnValue([]);

    component.cardConfig = card;
    fixture.detectChanges();

    expect(component.processedSections).toEqual([]);
  });

  it('should emit section event', () => {
    spyOn(component.sectionEvent, 'emit');

    const event = {
      type: 'fieldInteraction' as const,
      field: { label: 'Test', value: 'Value' },
      metadata: {},
    };

    component.onSectionEvent(event);

    expect(component.sectionEvent.emit).toHaveBeenCalledWith(event);
  });

  it('should emit layout change event', () => {
    spyOn(component.layoutChange, 'emit');

    const layoutInfo = {
      breakpoint: 'desktop' as const,
      columns: 3,
      containerWidth: 1200,
    };

    component.onLayoutChange(layoutInfo);

    expect(component.layoutChange.emit).toHaveBeenCalledWith(layoutInfo);
  });

  it('should handle mouse enter for tilt effect', () => {
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;

    tiltService.calculateTilt.and.returnValue({
      rotateY: 10,
      glowBlur: 8,
      glowOpacity: 0.225,
      reflectionOpacity: 0,
    });

    component.onMouseEnter(mockEvent);

    expect(tiltService.calculateTilt).toHaveBeenCalled();
  });

  it('should handle mouse leave and reset tilt', () => {
    component.onMouseLeave();

    expect(tiltService.reset).toHaveBeenCalled();
  });

  it('should handle mouse move for tilt effect', () => {
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;

    tiltService.calculateTilt.and.returnValue({
      rotateY: 7,
      glowBlur: 8,
      glowOpacity: 0.225,
      reflectionOpacity: 0,
    });

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

    component.onFullscreenToggle(true);

    expect(component.fullscreenToggle.emit).toHaveBeenCalledWith(true);
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

    normalizationService.normalize.and.returnValue([
      SectionBuilder.create().withTitle('Section 1').withType('info').build(),
    ]);

    component.cardConfig = card1;
    fixture.detectChanges();

    const initialSections = component.processedSections.length;

    normalizationService.normalize.and.returnValue([
      SectionBuilder.create().withTitle('Section 2').withType('analytics').build(),
    ]);

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

    normalizationService.normalize.and.returnValue([
      SectionBuilder.create().withTitle('Section 1').withType('info').build(),
      SectionBuilder.create().withTitle('Section 2').withType('analytics').build(),
    ]);

    component.cardConfig = card;
    fixture.detectChanges();

    expect(component.processedSections.length).toBe(2);
  });

  it('should clean up on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
