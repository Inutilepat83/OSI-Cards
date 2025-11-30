import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapSectionComponent } from './map-section.component';
import { SectionBuilder, FieldBuilder } from '../../../../testing/test-builders';

describe('MapSectionComponent', () => {
  let component: MapSectionComponent;
  let fixture: ComponentFixture<MapSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MapSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Locations')
      .withType('map')
      .withField(
        FieldBuilder.create()
          .withLabel('Location 1')
          .withValue('Address 1')
          .withMeta({ coordinates: { lat: 40.7128, lng: -74.0060 } })
          .build()
      )
      .build();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have fields', () => {
    expect(component.hasFields).toBe(true);
    expect(component.getFields().length).toBe(1);
  });

  it('should track fields correctly', () => {
    const field = component.getFields()[0];
    const trackBy = component.trackField(0, field);
    expect(trackBy).toBeTruthy();
  });

  it('should emit field interaction on click', () => {
    spyOn(component.fieldInteraction, 'emit');
    const field = component.getFields()[0];
    
    component.onFieldClick(field);
    
    expect(component.fieldInteraction.emit).toHaveBeenCalled();
  });
});















