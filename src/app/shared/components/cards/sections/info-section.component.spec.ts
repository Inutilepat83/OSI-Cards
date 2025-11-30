import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoSectionComponent } from './info-section.component';
import { SectionBuilder, FieldBuilder } from '../../../../testing/test-builders';
import { CardSection } from '../../../../models';

describe('InfoSectionComponent', () => {
  let component: InfoSectionComponent;
  let fixture: ComponentFixture<InfoSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InfoSectionComponent);
    component = fixture.componentInstance;
    
    // Set up test section
    component.section = SectionBuilder.create()
      .withTitle('Company Info')
      .withType('info')
      .withField(FieldBuilder.create().withLabel('Industry').withValue('Technology').build())
      .withField(FieldBuilder.create().withLabel('Employees').withValue('1000+').build())
      .build();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have fields', () => {
    expect(component.hasFields).toBe(true);
    expect(component.getFields().length).toBe(2);
  });

  it('should track fields by ID', () => {
    const field = FieldBuilder.create().withId('test-id').withLabel('Test').build();
    const trackBy = component.trackField(0, field);
    expect(trackBy).toBe('test-id');
  });

  it('should emit field interaction on click', () => {
    spyOn(component.fieldInteraction, 'emit');
    const field = component.getFields()[0];
    
    component.onFieldClick(field);
    
    expect(component.fieldInteraction.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        field: field,
        metadata: jasmine.objectContaining({
          sectionId: component.section.id,
          sectionTitle: component.section.title
        })
      })
    );
  });

  it('should handle empty section', () => {
    component.section = SectionBuilder.create()
      .withTitle('Empty')
      .withType('info')
      .build();
    
    fixture.detectChanges();
    
    expect(component.hasFields).toBe(false);
    expect(component.getFields().length).toBe(0);
  });
});















