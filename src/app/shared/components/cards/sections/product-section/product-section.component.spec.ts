import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductSectionComponent } from './product-section.component';
import { SectionBuilder, FieldBuilder } from '../../../../testing/test-builders';

describe('ProductSectionComponent', () => {
  let component: ProductSectionComponent;
  let fixture: ComponentFixture<ProductSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Products')
      .withType('product')
      .withField(
        FieldBuilder.create()
          .withLabel('Product Name')
          .withValue('Product A')
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


















