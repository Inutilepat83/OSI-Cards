import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverviewSectionComponent } from './overview-section.component';
import { FieldBuilder, SectionBuilder } from '../../../../../../testing/test-builders';
import { SectionUtilsService } from '../../../../../services/section-utils.service';

describe('OverviewSectionComponent', () => {
  let component: OverviewSectionComponent;
  let fixture: ComponentFixture<OverviewSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewSectionComponent],
      providers: [SectionUtilsService],
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewSectionComponent);
    component = fixture.componentInstance;

    // Set up test section
    component.section = SectionBuilder.create()
      .withTitle('Overview')
      .withType('overview')
      .withField(FieldBuilder.create().withLabel('Status').withValue('Active').build())
      .withField(FieldBuilder.create().withLabel('Revenue').withValue('$1M').build())
      .build();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have fields', () => {
    expect(component.hasFields).toBe(true);
    expect(component.fields.length).toBe(2);
  });

  it('should track fields by ID', () => {
    const field = FieldBuilder.create().withId('field-1').withLabel('Test').build();
    const trackBy = component.trackField(0, field);
    expect(trackBy).toBe('field-1');
  });

  it('should track fields by label when ID is missing', () => {
    const field = FieldBuilder.create().withLabel('Test Field').build();
    const trackBy = component.trackField(0, field);
    expect(trackBy).toContain('Test Field');
  });

  it('should emit field interaction on click', () => {
    spyOn(component.fieldInteraction, 'emit');
    const field = component.fields[0];

    component.onFieldClick(field);

    expect(component.fieldInteraction.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        field: field,
        metadata: jasmine.objectContaining({
          sectionId: component.section.id,
          sectionTitle: component.section.title,
        }),
      })
    );
  });

  it('should get status classes from utils service', () => {
    const field = FieldBuilder.create().withLabel('Status').withValue('active').build();
    const classes = component.getStatusClasses('active');
    expect(classes).toBeDefined();
  });

  it('should hide streaming placeholder in value', () => {
    const field = FieldBuilder.create().withLabel('Value').withValue('Streaming…').build();
    expect(component.getDisplayValue(field)).toBe('');
  });

  it('should show normal value when not streaming', () => {
    const field = FieldBuilder.create().withLabel('Value').withValue('Normal Value').build();
    expect(component.getDisplayValue(field)).toBe('Normal Value');
  });

  it('should handle null value', () => {
    const field = FieldBuilder.create()
      .withLabel('Value')
      .withValue(null as any)
      .build();
    expect(component.getDisplayValue(field)).toBe('');
  });

  it('should handle number value', () => {
    const field = FieldBuilder.create().withLabel('Count').withValue(42).build();
    expect(component.getDisplayValue(field)).toBe('42');
  });

  it('should handle empty section', () => {
    component.section = SectionBuilder.create()
      .withTitle('Empty Overview')
      .withType('overview')
      .build();

    fixture.detectChanges();

    expect(component.hasFields).toBe(false);
    expect(component.fields.length).toBe(0);
  });
});
