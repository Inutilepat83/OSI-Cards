import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { QuotationSectionComponent } from './quotation-section.component';

describe('QuotationSectionComponent', () => {
  let fixture: ComponentFixture<QuotationSectionComponent>;
  let component: QuotationSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotationSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuotationSectionComponent);
    component = fixture.componentInstance;
    component.section = {
      type: 'quotation',
      title: 'Quotes',
      fields: [
        { value: 'Quote 1', author: 'Alice' },
        { value: 'Quote 2', author: 'Bob' },
      ],
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle expandedIndex on click', () => {
    const quotes = fixture.debugElement.queryAll(By.css('.quote'));
    expect(quotes.length).toBe(2);

    quotes[0]?.nativeElement.click();
    fixture.detectChanges();
    expect(component.expandedIndex).toBe(0);

    quotes[0]?.nativeElement.click();
    fixture.detectChanges();
    expect(component.expandedIndex).toBeNull();
  });

  it('should toggle expandedIndex on Enter/Space', () => {
    const quotes = fixture.debugElement.queryAll(By.css('.quote'));
    const first = quotes[0];
    expect(first).toBeTruthy();

    first!.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(component.expandedIndex).toBe(0);

    first!.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: ' ' }));
    fixture.detectChanges();
    expect(component.expandedIndex).toBeNull();
  });
});

