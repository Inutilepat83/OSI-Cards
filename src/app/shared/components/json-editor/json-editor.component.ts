import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonProcessingService } from '../../../core/services/json-processing.service';
import { AppConfigService } from '../../../core/services/app-config.service';

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
        <div class="json-editor-actions">
          <button
            type="button"
            class="format-button"
            (click)="formatJson()"
            [disabled]="!jsonInput"
            title="Format JSON (Ctrl/Cmd + Enter)"
          >
            Format
          </button>
        </div>
      </div>
      <textarea
        #jsonTextareaRef
        id="json-textarea"
        class="json-textarea"
        [class.error]="!isJsonValid"
        [(ngModel)]="jsonInput"
        (ngModelChange)="onJsonInputChange($event)"
        (keydown)="onKeydown($event)"
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
  styles: [`
    .json-editor-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .json-editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .json-editor-label {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--card-text-primary, #FFFFFF);
    }

    .json-editor-actions {
      display: flex;
      gap: 0.5rem;
    }

    .format-button {
      padding: 0.375rem 0.75rem;
      background: var(--color-brand, #FF7900);
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .format-button:hover:not(:disabled) {
      opacity: 0.9;
    }

    .format-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .json-textarea {
      width: 100%;
      flex: 1;
      padding: 0.75rem;
      background: rgba(20, 30, 50, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      color: var(--card-text-primary, #FFFFFF);
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      resize: vertical;
      min-height: 200px;
    }

    .json-textarea:focus {
      outline: none;
      border-color: var(--color-brand, #FF7900);
    }

    .json-textarea.error {
      border-color: #ef4444;
    }

    .json-error {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 0.375rem;
      display: flex;
      gap: 0.5rem;
    }

    .error-icon {
      flex-shrink: 0;
    }

    .error-content {
      flex: 1;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .error-suggestion {
      color: var(--card-text-secondary, #B8C5D6);
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .error-position {
      color: var(--card-text-secondary, #B8C5D6);
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-family: monospace;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonEditorComponent {
  private readonly jsonProcessingService = inject(JsonProcessingService);
  private readonly config = inject(AppConfigService);

  @ViewChild('jsonTextareaRef') jsonTextareaRef?: ElementRef<HTMLTextAreaElement>;

  @Input() jsonInput = '';
  @Output() jsonInputChange = new EventEmitter<string>();
  @Output() jsonValid = new EventEmitter<boolean>();
  @Output() jsonErrorChange = new EventEmitter<string | null>();

  isJsonValid = true;
  jsonErrorText = '';
  jsonErrorPosition: number | null = null;
  jsonErrorSuggestion = '';

  onJsonInputChange(value: string): void {
    this.jsonInput = value;
    const validation = this.jsonProcessingService.validateJsonSyntax(value);
    
    this.isJsonValid = validation.isValid;
    this.jsonErrorText = validation.error || '';
    this.jsonErrorPosition = validation.position ?? null;
    this.jsonErrorSuggestion = validation.suggestion || '';

    this.jsonInputChange.emit(value);
    this.jsonValid.emit(this.isJsonValid);
    this.jsonErrorChange.emit(this.jsonErrorText || null);
  }

  formatJson(): void {
    try {
      const formatted = this.jsonProcessingService.formatJson(this.jsonInput);
      this.jsonInput = formatted;
      this.onJsonInputChange(formatted);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown formatting issue.';
      this.jsonErrorText = `Unable to format JSON: ${message}`;
      this.isJsonValid = false;
      this.jsonErrorChange.emit(this.jsonErrorText);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      this.formatJson();
    }
  }

  get jsonError(): string {
    return this.jsonErrorText;
  }
}

