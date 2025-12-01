import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuotationSectionComponent } from './quotation-section.component';
import { FieldBuilder, SectionBuilder } from '../../../../testing/test-builders';

describe('QuotationSectionComponent', () => {
  let component: QuotationSectionComponent;
  let fixture: ComponentFixture<QuotationSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotationSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuotationSectionComponent);
    component = fixture.componentInstance;

    component.section = SectionBuilder.create()
      .withTitle('Quote')
      .withType('quotation')
      .withDescription('This is a test quotation')
      .build();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have description', () => {
    expect(component.section.description).toBe('This is a test quotation');
  });
});
