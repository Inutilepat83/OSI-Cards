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
    component.hasError = true;
    component.reset();

    expect(component.hasError).toBe(false);
    expect(component.errorDetails).toBe('');
  });

  it('should use custom error title', () => {
    component.errorTitle = 'Custom Error';
    component.handleError(new Error('Test'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Custom Error');
  });

  it('should use custom error message', () => {
    component.errorMessage = 'Custom message';
    component.handleError(new Error('Test'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Custom message');
  });
});



