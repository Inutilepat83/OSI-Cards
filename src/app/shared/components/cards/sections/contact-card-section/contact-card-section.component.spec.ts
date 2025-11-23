import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactCardSectionComponent } from './contact-card-section.component';
import { SectionBuilder, FieldBuilder } from '../../../../../testing/test-builders';

describe('ContactCardSectionComponent', () => {
  let component: ContactCardSectionComponent;
  let fixture: ComponentFixture<ContactCardSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactCardSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactCardSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Contact Information')
      .withType('contact-card')
      .withField(
        FieldBuilder.create()
          .withLabel('Name')
          .withValue('John Doe')
          .build()
      )
      .withField(
        FieldBuilder.create()
          .withLabel('Email')
          .withValue('john@example.com')
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
    expect(component.getFields().length).toBe(2);
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

