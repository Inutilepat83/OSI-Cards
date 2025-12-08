import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonEditorComponent } from './json-editor.component';
import { JsonProcessingService } from '../../../core/services/json-processing.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('JsonEditorComponent', () => {
  let component: JsonEditorComponent;
  let fixture: ComponentFixture<JsonEditorComponent>;
  let jsonProcessingService: jasmine.SpyObj<JsonProcessingService>;
  let appConfigService: jasmine.SpyObj<AppConfigService>;

  beforeEach(async () => {
    const jsonProcessingSpy = jasmine.createSpyObj('JsonProcessingService', [
      'validateJson',
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
      jsonProcessingService.validateJson.and.returnValue({
        isValid: true,
        error: null,
        errorPosition: null,
        suggestion: null,
      });

      component.onJsonInputChange('{"valid": "json"}');

      expect(jsonProcessingService.validateJson).toHaveBeenCalled();
    });

    it('should show error for invalid JSON', () => {
      jsonProcessingService.validateJson.and.returnValue({
        isValid: false,
        error: 'Invalid JSON',
        errorPosition: 5,
        suggestion: 'Check syntax',
      });

      component.onJsonInputChange('{"invalid": json}');

      expect(component.isJsonValid).toBe(false);
      expect(component.jsonError).toBe('Invalid JSON');
      expect(component.jsonErrorPosition).toBe(5);
    });

    it('should clear error for valid JSON', () => {
      component.jsonError = 'Previous error';
      component.isJsonValid = false;

      jsonProcessingService.validateJson.and.returnValue({
        isValid: true,
        error: null,
        errorPosition: null,
        suggestion: null,
      });

      component.onJsonInputChange('{"valid": "json"}');

      expect(component.isJsonValid).toBe(true);
      expect(component.jsonError).toBeNull();
    });
  });

  describe('format JSON', () => {
    it('should format JSON when format button clicked', () => {
      component.jsonInput = '{"test":"value"}';
      jsonProcessingService.formatJson.and.returnValue('{\n  "test": "value"\n}');

      component.formatJson();

      expect(jsonProcessingService.formatJson).toHaveBeenCalledWith('{"test":"value"}');
      expect(component.jsonInput).toBe('{\n  "test": "value"\n}');
    });

    it('should not format when input is empty', () => {
      component.jsonInput = '';

      component.formatJson();

      expect(jsonProcessingService.formatJson).not.toHaveBeenCalled();
    });

    it('should disable format button when input is empty', () => {
      component.jsonInput = '';
      fixture.detectChanges();

      const formatButton = fixture.debugElement.query(By.css('.format-button'));
      expect(formatButton.nativeElement.disabled).toBe(true);
    });
  });

  describe('keyboard shortcuts', () => {
    it('should format JSON on Ctrl+Enter', () => {
      component.jsonInput = '{"test":"value"}';
      jsonProcessingService.formatJson.and.returnValue('{\n  "test": "value"\n}');

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
      });

      component.onKeydown(event);

      expect(jsonProcessingService.formatJson).toHaveBeenCalled();
    });

    it('should format JSON on Cmd+Enter (Mac)', () => {
      component.jsonInput = '{"test":"value"}';
      jsonProcessingService.formatJson.and.returnValue('{\n  "test": "value"\n}');

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
      });

      component.onKeydown(event);

      expect(jsonProcessingService.formatJson).toHaveBeenCalled();
    });

    it('should not format on Enter alone', () => {
      component.jsonInput = '{"test":"value"}';

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
      });

      component.onKeydown(event);

      expect(jsonProcessingService.formatJson).not.toHaveBeenCalled();
    });
  });

  describe('error display', () => {
    it('should display error message when JSON is invalid', () => {
      component.isJsonValid = false;
      component.jsonError = 'Invalid JSON';
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.json-error'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain('Invalid JSON');
    });

    it('should display error position when available', () => {
      component.isJsonValid = false;
      component.jsonError = 'Invalid JSON';
      component.jsonErrorPosition = 10;
      fixture.detectChanges();

      const positionElement = fixture.debugElement.query(By.css('.error-position'));
      expect(positionElement).toBeTruthy();
      expect(positionElement.nativeElement.textContent).toContain('10');
    });

    it('should display error suggestion when available', () => {
      component.isJsonValid = false;
      component.jsonError = 'Invalid JSON';
      component.jsonErrorSuggestion = 'Check syntax';
      fixture.detectChanges();

      const suggestionElement = fixture.debugElement.query(By.css('.error-suggestion'));
      expect(suggestionElement).toBeTruthy();
      expect(suggestionElement.nativeElement.textContent).toContain('Check syntax');
    });

    it('should not display error when JSON is valid', () => {
      component.isJsonValid = true;
      component.jsonError = null;
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

      jsonProcessingService.validateJson.and.returnValue({
        isValid: true,
        error: null,
        errorPosition: null,
        suggestion: null,
      });

      component.onJsonInputChange('{"valid": "json"}');

      expect(component.jsonValid.emit).toHaveBeenCalledWith(true);
    });

    it('should emit jsonErrorChange when error changes', () => {
      spyOn(component.jsonErrorChange, 'emit');

      jsonProcessingService.validateJson.and.returnValue({
        isValid: false,
        error: 'New error',
        errorPosition: null,
        suggestion: null,
      });

      component.onJsonInputChange('invalid');

      expect(component.jsonErrorChange.emit).toHaveBeenCalledWith('New error');
    });

    it('should emit jsonErrorDetailsChange with error details', () => {
      spyOn(component.jsonErrorDetailsChange, 'emit');

      const errorDetails = {
        isValid: false,
        error: 'Error',
        errorPosition: 5,
        suggestion: 'Fix it',
      };

      jsonProcessingService.validateJson.and.returnValue(errorDetails);

      component.onJsonInputChange('invalid');

      expect(component.jsonErrorDetailsChange.emit).toHaveBeenCalledWith(errorDetails);
    });
  });
});
