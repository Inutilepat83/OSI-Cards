import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorBoundaryComponent } from 'osi-cards-lib';

describe('ErrorBoundaryComponent', () => {
  let component: ErrorBoundaryComponent;
  let fixture: ComponentFixture<ErrorBoundaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBoundaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorBoundaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show content when no error', () => {
    expect(component.hasError).toBe(false);
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.error-boundary-fallback')).toBeNull();
  });

  it('should show error fallback when error occurs', () => {
    const testError = new Error('Test error');
    component.handleError(testError);
    fixture.detectChanges();

    expect(component.hasError).toBe(true);
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.error-boundary-fallback')).toBeTruthy();
  });

  it('should reset error state on retry', () => {
    component.hasError.set(true);
    component.reset();

    expect(component.hasError()).toBe(false);
    expect(component.errorDetails()).toBeNull();
  });

  it('should display error message', () => {
    component.handleError(new Error('Test error'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test error');
  });

  it('should show error details when enabled', () => {
    component.showDetails.set(true);
    component.handleError(new Error('Test error'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.error-boundary__details')).toBeTruthy();
  });
});
