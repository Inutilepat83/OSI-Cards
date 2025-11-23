import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyticsSectionComponent } from './analytics-section.component';
import { SectionBuilder, FieldBuilder } from '../../../../../testing/test-builders';

describe('AnalyticsSectionComponent', () => {
  let component: AnalyticsSectionComponent;
  let fixture: ComponentFixture<AnalyticsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Key Metrics')
      .withType('analytics')
      .withField(
        FieldBuilder.create()
          .withLabel('Growth')
          .withValue('85%')
          .withTrend('up')
          .withChange(12)
          .build()
      )
      .withField(
        FieldBuilder.create()
          .withLabel('ROI')
          .withValue('120%')
          .withTrend('up')
          .withChange(8)
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

  it('should emit field interaction', () => {
    spyOn(component.fieldInteraction, 'emit');
    const field = component.getFields()[0];
    
    component.onFieldClick(field);
    
    expect(component.fieldInteraction.emit).toHaveBeenCalled();
  });
});

