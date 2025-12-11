/**
 * Card Header Component Tests
 *
 * Unit tests for CardHeaderComponent (current API).
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CardHeaderComponent } from './card-header.component';

describe('CardHeaderComponent', () => {
  let component: CardHeaderComponent;
  let fixture: ComponentFixture<CardHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render header when cardTitle is missing', () => {
    component.cardTitle = undefined;
    fixture.detectChanges();

    const header = fixture.debugElement.query(By.css('.card-header-container'));
    expect(header).toBeNull();
  });

  it('should render title when cardTitle is provided', () => {
    component.cardTitle = 'Test Card Title';
    fixture.detectChanges();

    const titleEl = fixture.debugElement.query(By.css('.card-header-title'));
    expect(titleEl).toBeTruthy();
    expect(titleEl.nativeElement.textContent).toContain('Test Card Title');
  });

  it('should not render export button when showExport is false', () => {
    component.cardTitle = 'Test Card Title';
    component.showExport = false;
    fixture.detectChanges();

    const exportBtn = fixture.debugElement.query(By.css('.card-header-export-btn'));
    expect(exportBtn).toBeNull();
  });

  it('should emit export when export button is clicked', () => {
    component.cardTitle = 'Test Card Title';
    component.showExport = true;
    fixture.detectChanges();

    const spy = spyOn(component.export, 'emit');
    const exportBtn = fixture.debugElement.query(By.css('.card-header-export-btn'));
    expect(exportBtn).toBeTruthy();

    exportBtn.nativeElement.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should set an accessible aria-label on export button', () => {
    component.cardTitle = 'My Card';
    component.showExport = true;
    fixture.detectChanges();

    const exportBtn = fixture.debugElement.query(By.css('.card-header-export-btn'));
    expect(exportBtn).toBeTruthy();
    expect(exportBtn.nativeElement.getAttribute('aria-label')).toContain('Export card: My Card');
  });
});
