import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ValidationService } from '../../../core';
import { JsonProcessingService } from '../../../core/services/json-processing.service';

/**
 * Standalone JSON editor component
 * Extracted from HomePageComponent for better separation of concerns
 */
@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="json-editor-container">
      <div class="json-editor-header">
        <label for="json-textarea" class="json-editor-label">JSON Editor</label>
      </div>
      <textarea
        #jsonTextareaRef
        id="json-textarea"
        class="json-textarea"
        [class.error]="!isJsonValid"
        [(ngModel)]="jsonInput"
        (ngModelChange)="onJsonInputChange($event)"
        placeholder="Enter JSON card configuration..."
        rows="20"
        spellcheck="false"
      ></textarea>
      <div *ngIf="jsonError" class="json-error" role="alert">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <div class="error-message">{{ jsonError }}</div>
          <div *ngIf="jsonErrorSuggestion" class="error-suggestion">{{ jsonErrorSuggestion }}</div>
          <div *ngIf="jsonErrorPosition !== null" class="error-position">
            Error at position: {{ jsonErrorPosition }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .json-editor-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
      }

      .json-editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0;
        height: fit-content;
      }

      .json-editor-label {
        font-weight: 500;
        font-size: 0.75rem;
        color: var(--muted-foreground);
        letter-spacing: 0.01em;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
        display: block;
        text-rendering: optimizeLegibility;
        word-spacing: normal;
      }

      .json-textarea {
        width: 100%;
        height: 750px;
        padding: var(--padding-card-md, 1.25rem);
        background: color-mix(in srgb, var(--card-background) 95%, var(--foreground));
        border: var(--border-width-medium, 2px) solid var(--border-color-default);
        border-radius: var(--radius-card, 12px);
        color: var(--foreground);
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: var(--text-base, 0.875rem);
        line-height: var(--leading-normal, 1.6);
        resize: vertical;
        transition:
          border-color var(--osi-transition-normal, 200ms) ease,
          background var(--osi-transition-normal, 200ms) ease,
          box-shadow var(--osi-transition-normal, 200ms) ease;
        position: relative;
        overflow-y: auto;
        box-shadow: var(--shadow-rest);

        &::placeholder {
          color: color-mix(in srgb, var(--muted-foreground) 60%, transparent);
          font-style: italic;
          opacity: 0.7;
          font-size: var(--text-base, 0.875rem);
          text-rendering: optimizeLegibility;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: color-mix(in srgb, var(--card-background) 90%, var(--foreground));
        }

        /* Enhanced scrollbar visibility */
        &::-webkit-scrollbar {
          width: var(--scrollbar-width, 10px);
        }

        &::-webkit-scrollbar-track {
          background: var(--scrollbar-track);
          border-radius: var(--radius-full);
        }

        &::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
          border-radius: var(--radius-full);

          &:hover {
            background: var(--scrollbar-thumb-hover);
          }
        }
      }

      .json-textarea:hover:not(:focus) {
        border-color: color-mix(in srgb, var(--color-brand, #ff7900) 30%, transparent);
        box-shadow: var(--shadow-hover);
        background: color-mix(in srgb, var(--card-background) 97%, var(--foreground));
      }

      .json-textarea:focus {
        outline: 2px solid var(--color-brand, #ff7900);
        outline-offset: 2px;
        border-color: var(--color-brand, #ff7900);
        background: color-mix(in srgb, var(--card-background) 98%, var(--foreground));
        box-shadow:
          var(--shadow-hover),
          0 0 0 4px color-mix(in srgb, var(--color-brand, #ff7900) 20%, transparent);
        transition:
          border-color var(--osi-transition-normal, 200ms) ease,
          outline var(--osi-transition-normal, 200ms) ease,
          box-shadow var(--osi-transition-normal, 200ms) ease,
          background var(--osi-transition-normal, 200ms) ease;
      }

      .json-textarea:focus-visible {
        outline: 2px solid var(--color-brand, #ff7900);
        outline-offset: 2px;
      }

      .json-textarea.error {
        border-color: color-mix(in srgb, var(--destructive) 60%, transparent);
        background: color-mix(in srgb, var(--destructive) 5%, var(--card-background));
      }

      .json-textarea.error:hover:not(:focus) {
        border-color: color-mix(in srgb, var(--destructive) 70%, transparent);
        background: color-mix(in srgb, var(--destructive) 8%, var(--card-background));
      }

      .json-textarea.error:focus {
        outline: 2px solid var(--destructive);
        outline-offset: 2px;
        border-color: var(--destructive);
        box-shadow:
          var(--shadow-hover),
          0 0 0 4px color-mix(in srgb, var(--destructive) 20%, transparent);
      }

      /* Discrete scrollbar styling */
      .json-textarea::-webkit-scrollbar {
        width: 8px;
      }

      .json-textarea::-webkit-scrollbar-track {
        background: transparent;
      }

      .json-textarea::-webkit-scrollbar-thumb {
        background: color-mix(in srgb, var(--border) 60%, transparent);
        border-radius: 4px;
      }

      .json-textarea::-webkit-scrollbar-thumb:hover {
        background: color-mix(in srgb, var(--border) 80%, transparent);
      }

      /* Discrete resize handle */
      .json-textarea::-webkit-resizer {
        background: color-mix(in srgb, var(--border) 30%, transparent);
        border: none;
        border-radius: 0 0 12px 0;
      }

      .json-error {
        margin-top: 0.5rem;
        padding: 0.75rem;
        background: color-mix(in srgb, var(--destructive) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--destructive) 30%, transparent);
        border-radius: var(--radius);
        display: flex;
        gap: 0.5rem;
      }

      .error-icon {
        flex-shrink: 0;
        font-size: 1rem;
      }

      .error-content {
        flex: 1;
      }

      .error-message {
        color: var(--destructive);
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
      }

      .error-suggestion {
        color: var(--muted-foreground);
        font-size: 0.8125rem;
        margin-top: 0.25rem;
        line-height: 1.5;
      }

      .error-position {
        color: var(--muted-foreground);
        font-size: 0.75rem;
        margin-top: 0.25rem;
        font-family: monospace;
        padding: 0.25rem 0.5rem;
        background: color-mix(in srgb, var(--muted) 30%, transparent);
        border-radius: 4px;
        display: inline-block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonEditorComponent {
  private readonly jsonProcessingService = inject(JsonProcessingService);
  private readonly validationService: ValidationService = inject(ValidationService);

  @ViewChild('jsonTextareaRef') jsonTextareaRef?: ElementRef<HTMLTextAreaElement> | undefined;

  @Input() jsonInput = '';
  @Output() jsonInputChange = new EventEmitter<string>();
  @Output() jsonValid = new EventEmitter<boolean>();
  @Output() jsonErrorChange = new EventEmitter<string | null>();
  @Output() jsonErrorDetailsChange = new EventEmitter<{
    error: string | null;
    position: number | null;
    suggestion: string;
  }>();

  isJsonValid = true;
  jsonErrorText = '';
  jsonErrorPosition: number | null = null;
  jsonErrorSuggestion = '';

  onJsonInputChange(value: string): void {
    this.jsonInput = value;

    // First validate JSON syntax
    const syntaxValidation = this.jsonProcessingService.validateJsonSyntax(value);
    this.isJsonValid = syntaxValidation.isValid;
    this.jsonErrorText = syntaxValidation.error || '';
    this.jsonErrorPosition = syntaxValidation.position ?? null;
    this.jsonErrorSuggestion = syntaxValidation.suggestion || '';

    // If JSON syntax is valid, also validate card structure and sanitize
    if (syntaxValidation.isValid && value.trim()) {
      const cardValidation = this.validationService.validateJsonCardInput(value);
      if (!cardValidation.valid) {
        // Add card validation errors to existing errors
        this.isJsonValid = false;
        const validationErrors = cardValidation.errors?.join('; ') || 'Card validation failed';
        this.jsonErrorText = this.jsonErrorText
          ? `${this.jsonErrorText}; ${validationErrors}`
          : validationErrors;
      }
    }

    this.jsonInputChange.emit(value);
    this.jsonValid.emit(this.isJsonValid);
    this.jsonErrorChange.emit(this.jsonErrorText || null);
    this.jsonErrorDetailsChange.emit({
      error: this.jsonErrorText || null,
      position: this.jsonErrorPosition,
      suggestion: this.jsonErrorSuggestion,
    });
  }

  get jsonError(): string {
    return this.jsonErrorText;
  }
}
