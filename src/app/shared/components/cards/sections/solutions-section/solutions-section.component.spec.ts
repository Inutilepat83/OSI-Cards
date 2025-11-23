import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolutionsSectionComponent } from './solutions-section.component';
import { SectionBuilder, FieldBuilder } from '../../../../testing/test-builders';

describe('SolutionsSectionComponent', () => {
  let component: SolutionsSectionComponent;
  let fixture: ComponentFixture<SolutionsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolutionsSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SolutionsSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Solutions')
      .withType('solutions')
      .withField(
        FieldBuilder.create()
          .withLabel('Solution 1')
          .withValue('Description 1')
          .build()
      )
      .withField(
        FieldBuilder.create()
          .withLabel('Solution 2')
          .withValue('Description 2')
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
    
    component.onSolutionClick(field);
    
    expect(component.itemInteraction.emit).toHaveBeenCalled();
  });
});

