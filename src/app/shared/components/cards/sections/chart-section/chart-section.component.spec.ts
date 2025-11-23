import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartSectionComponent } from './chart-section.component';
import { SectionBuilder, FieldBuilder } from '../../../../testing/test-builders';

describe('ChartSectionComponent', () => {
  let component: ChartSectionComponent;
  let fixture: ComponentFixture<ChartSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ChartSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Chart')
      .withType('chart')
      .withMeta({
        chartType: 'bar',
        chartData: {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [{
            label: 'Sales',
            data: [10, 20, 30]
          }]
        }
      })
      .build();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have chart data', () => {
    expect(component.section.chartData).toBeDefined();
  });
});

