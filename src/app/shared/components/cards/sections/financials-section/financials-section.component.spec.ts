import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinancialsSectionComponent } from './financials-section.component';
import { SectionBuilder, FieldBuilder } from '../../../../testing/test-builders';

describe('FinancialsSectionComponent', () => {
  let component: FinancialsSectionComponent;
  let fixture: ComponentFixture<FinancialsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialsSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialsSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Financials')
      .withType('financials')
      .withField(
        FieldBuilder.create()
          .withLabel('Revenue')
          .withValue('$1M')
          .build()
      )
      .withField(
        FieldBuilder.create()
          .withLabel('Profit')
          .withValue('$500K')
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


















