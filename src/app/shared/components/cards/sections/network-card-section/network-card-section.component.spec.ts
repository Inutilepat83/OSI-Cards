import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NetworkCardSectionComponent } from './network-card-section.component';
import { FieldBuilder, SectionBuilder } from '../../../../testing/test-builders';

describe('NetworkCardSectionComponent', () => {
  let component: NetworkCardSectionComponent;
  let fixture: ComponentFixture<NetworkCardSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkCardSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NetworkCardSectionComponent);
    component = fixture.componentInstance;

    component.section = SectionBuilder.create()
      .withTitle('Network')
      .withType('network-card')
      .withField(FieldBuilder.create().withLabel('Contact 1').withValue('John Doe').build())
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
