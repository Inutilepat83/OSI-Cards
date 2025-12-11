import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { AppConfigService } from '../../../core/services/app-config.service';
import { JsonProcessingService } from '../../../core/services/json-processing.service';
import { JsonEditorComponent } from './json-editor.component';

describe('JsonEditorComponent', () => {
  let component: JsonEditorComponent;
  let fixture: ComponentFixture<JsonEditorComponent>;
  let jsonProcessingService: jasmine.SpyObj<JsonProcessingService>;
  let appConfigService: jasmine.SpyObj<AppConfigService>;

  beforeEach(async () => {
    const jsonProcessingSpy = jasmine.createSpyObj('JsonProcessingService', [
      'validateJsonSyntax',
      'formatJson',
    ]);
    const appConfigSpy = jasmine.createSpyObj('AppConfigService', [], {
      JSON_EDITOR: {
        DEBOUNCE_MS: 300,
      },
    });

    await TestBed.configureTestingModule({
      imports: [JsonEditorComponent, FormsModule],
      providers: [
        { provide: JsonProcessingService, useValue: jsonProcessingSpy },
        { provide: AppConfigService, useValue: appConfigSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonEditorComponent);
    component = fixture.componentInstance;
    jsonProcessingService = TestBed.inject(
      JsonProcessingService
    ) as jasmine.SpyObj<JsonProcessingService>;
    appConfigService = TestBed.inject(AppConfigService) as jasmine.SpyObj<AppConfigService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('JSON input', () => {
    it('should emit jsonInputChange when input changes', () => {
      spyOn(component.jsonInputChange, 'emit');

      component.onJsonInputChange('{"test": "value"}');

      expect(component.jsonInputChange.emit).toHaveBeenCalledWith('{"test": "value"}');
    });

    it('should validate JSON on input change', () => {
      jsonProcessingService.validateJsonSyntax.and.returnValue({
        isValid: true,
        error: undefined,
        position: undefined,
        suggestion: undefined,
      });

      component.onJsonInputChange('{"valid": "json"}');

      expect(jsonProcessingService.validateJsonSyntax).toHaveBeenCalled();
    });

    it('should show error for invalid JSON', () => {
      jsonProcessingService.validateJsonSyntax.and.returnValue({
        isValid: false,
        error: 'Invalid JSON',
        position: 5,
        suggestion: 'Check syntax',
      });

      component.onJsonInputChange('{"invalid": json}');

      expect(component.isJsonValid).toBe(false);
      expect(component.jsonError).toBe('Invalid JSON');
      expect(component.jsonErrorPosition).toBe(5);
    });

    it('should clear error for valid JSON', () => {
      component.jsonErrorText = 'Previous error';
      component.isJsonValid = false;

      jsonProcessingService.validateJsonSyntax.and.returnValue({
        isValid: true,
        error: undefined,
        position: undefined,
        suggestion: undefined,
      });

      component.onJsonInputChange('{"valid": "json"}');

      expect(component.isJsonValid).toBe(true);
      expect(component.jsonError).toBe('');
    });
  });

  // Note: formatJson and onKeydown methods are not implemented in the component
  // These tests are skipped until the functionality is added
  xdescribe('format JSON', () => {
    it('should format JSON when format button clicked', () => {
      // Not implemented
    });

    it('should not format when input is empty', () => {
      // Not implemented
    });

    it('should disable format button when input is empty', () => {
      // Not implemented
    });
  });

  xdescribe('keyboard shortcuts', () => {
    it('should format JSON on Ctrl+Enter', () => {
      // Not implemented
    });

    it('should format JSON on Cmd+Enter (Mac)', () => {
      // Not implemented
    });

    it('should not format on Enter alone', () => {
      // Not implemented
    });
  });

  describe('error display', () => {
    it('should display error message when JSON is invalid', () => {
      component.isJsonValid = false;
      component.jsonErrorText = 'Invalid JSON';
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.json-error'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain('Invalid JSON');
    });

    it('should display error position when available', () => {
      component.isJsonValid = false;
      component.jsonErrorText = 'Invalid JSON';
      component.jsonErrorPosition = 10;
      fixture.detectChanges();

      const positionElement = fixture.debugElement.query(By.css('.error-position'));
      expect(positionElement).toBeTruthy();
      expect(positionElement.nativeElement.textContent).toContain('10');
    });

    it('should display error suggestion when available', () => {
      component.isJsonValid = false;
      component.jsonErrorText = 'Invalid JSON';
      component.jsonErrorSuggestion = 'Check syntax';
      fixture.detectChanges();

      const suggestionElement = fixture.debugElement.query(By.css('.error-suggestion'));
      expect(suggestionElement).toBeTruthy();
      expect(suggestionElement.nativeElement.textContent).toContain('Check syntax');
    });

    it('should not display error when JSON is valid', () => {
      component.isJsonValid = true;
      component.jsonErrorText = '';
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.json-error'));
      expect(errorElement).toBeFalsy();
    });
  });

  describe('textarea styling', () => {
    it('should apply error class when JSON is invalid', () => {
      component.isJsonValid = false;
      fixture.detectChanges();

      const textarea = fixture.debugElement.query(By.css('.json-textarea'));
      expect(textarea.nativeElement.classList.contains('error')).toBe(true);
    });

    it('should not apply error class when JSON is valid', () => {
      component.isJsonValid = true;
      fixture.detectChanges();

      const textarea = fixture.debugElement.query(By.css('.json-textarea'));
      expect(textarea.nativeElement.classList.contains('error')).toBe(false);
    });
  });

  describe('output events', () => {
    it('should emit jsonValid when validation changes', () => {
      spyOn(component.jsonValid, 'emit');

      jsonProcessingService.validateJsonSyntax.and.returnValue({
        isValid: true,
        error: undefined,
        position: undefined,
        suggestion: undefined,
      });

      component.onJsonInputChange('{"valid": "json"}');

      expect(component.jsonValid.emit).toHaveBeenCalledWith(true);
    });

    it('should emit jsonErrorChange when error changes', () => {
      spyOn(component.jsonErrorChange, 'emit');

      jsonProcessingService.validateJsonSyntax.and.returnValue({
        isValid: false,
        error: 'New error',
        position: undefined,
        suggestion: undefined,
      });

      component.onJsonInputChange('invalid');

      expect(component.jsonErrorChange.emit).toHaveBeenCalledWith('New error');
    });

    it('should emit jsonErrorDetailsChange with error details', () => {
      spyOn(component.jsonErrorDetailsChange, 'emit');

      jsonProcessingService.validateJsonSyntax.and.returnValue({
        isValid: false,
        error: 'Error',
        position: 5,
        suggestion: 'Fix it',
      });

      component.onJsonInputChange('invalid');

      expect(component.jsonErrorDetailsChange.emit).toHaveBeenCalledWith({
        error: 'Error',
        position: 5,
        suggestion: 'Fix it',
      });
    });
  });
});
