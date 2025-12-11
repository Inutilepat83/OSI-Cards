/**
 * Field Renderer Component
 *
 * Unified component for rendering fields across all section types.
 * Consolidates field rendering logic from multiple section components.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

export interface FieldData {
  label: string;
  value: string | number | boolean | null | undefined;
  type?:
    | 'text'
    | 'number'
    | 'date'
    | 'currency'
    | 'percentage'
    | 'url'
    | 'email'
    | 'phone'
    | 'boolean';
  icon?: string;
  copyable?: boolean;
  href?: string;
}

export interface FieldClickEvent {
  field: FieldData;
  index: number;
}

@Component({
  selector: 'osi-field-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="field"
      [class.field--clickable]="clickable"
      [class.field--copyable]="field.copyable"
      [attr.role]="clickable ? 'button' : null"
      [attr.tabindex]="clickable ? 0 : null"
    >
      @if (field.icon) {
        <span class="field__icon" [innerHTML]="field.icon"></span>
      }

      <span class="field__label">{{ field.label }}</span>

      <span class="field__value" [ngSwitch]="field.type">
        @switch (field.type) {
          @case ('url') {
            <a [href]="field.href || stringValue" target="_blank" rel="noopener">
              {{ displayValue }}
            </a>
          }
          @case ('email') {
            <a [href]="getOutlookEmailUrl(stringValue)">{{ displayValue }}</a>
          }
          @case ('phone') {
            <a [href]="'tel:' + stringValue">{{ displayValue }}</a>
          }
          @case ('boolean') {
            <span
              [class.field__value--true]="field.value === true"
              [class.field__value--false]="field.value === false"
            >
              {{ field.value ? '✓' : '✗' }}
            </span>
          }
          @default {
            {{ displayValue }}
          }
        }
      </span>

      @if (field.copyable) {
        <button class="field__copy" (click)="onCopy($event)" aria-label="Copy to clipboard">
          📋
        </button>
      }
    </div>
  `,
  styles: [
    `
      .field {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        padding: 0.25rem 0;
      }

      .field.field--clickable {
        cursor: pointer;
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        margin: 0 -0.5rem;
        transition: background-color 0.15s ease;
      }

      .field.field--clickable:hover {
        background-color: var(--osi-field-hover-bg, rgba(0, 0, 0, 0.05));
      }

      .field.field--clickable:focus-visible {
        outline: 2px solid var(--osi-focus-ring, #4f46e5);
        outline-offset: 2px;
      }

      .field__label {
        color: var(--osi-field-label-color, #64748b);
        font-size: 0.875rem;
        flex-shrink: 0;
      }

      .field__label::after {
        content: ':';
      }

      .field__value {
        color: var(--osi-field-value-color, #1e293b);
        font-weight: 500;
      }

      .field__value a {
        color: var(--osi-link-color, #3b82f6);
        text-decoration: none;
      }

      .field__value a:hover {
        text-decoration: underline;
      }

      .field__value--true {
        color: var(--osi-success-color, #22c55e);
      }

      .field__value--false {
        color: var(--osi-error-color, #ef4444);
      }

      .field__icon {
        font-size: 1rem;
        flex-shrink: 0;
      }

      .field__copy {
        background: none;
        border: none;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s ease;
        padding: 0.125rem;
        font-size: 0.75rem;
      }

      .field:hover .field__copy {
        opacity: 0.7;
      }

      .field__copy:hover {
        opacity: 1 !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldRendererComponent {
  @Input({ required: true }) field!: FieldData;
  @Input() index = 0;
  @Input() clickable = false;

  @Output() fieldClick = new EventEmitter<FieldClickEvent>();
  @Output() copied = new EventEmitter<string>();

  @HostListener('click')
  @HostListener('keydown.enter')
  onClick(): void {
    if (this.clickable) {
      this.fieldClick.emit({ field: this.field, index: this.index });
    }
  }

  get stringValue(): string {
    return String(this.field.value ?? '');
  }

  get displayValue(): string {
    const val = this.field.value;
    if (val == null) return '-';

    switch (this.field.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          Number(val)
        );
      case 'percentage':
        return `${val}%`;
      case 'date':
        return new Date(String(val)).toLocaleDateString();
      case 'number':
        return new Intl.NumberFormat().format(Number(val));
      default:
        return String(val);
    }
  }

  onCopy(event: Event): void {
    event.stopPropagation();
    navigator.clipboard.writeText(this.stringValue);
    this.copied.emit(this.stringValue);
  }

  /**
   * Convert email address to Outlook URL scheme
   * Platform-specific: Windows uses mailto: (New Outlook compatibility), Mac uses ms-outlook:
   *
   * @param email - Email address
   * @returns Outlook URL scheme or mailto fallback
   */
  getOutlookEmailUrl(email: string): string {
    const mailtoUrl = `mailto:${email}`;

    // Check if we're on Windows
    if (typeof navigator !== 'undefined') {
      const isWindows = /Win/i.test(navigator.platform) || /Windows/i.test(navigator.userAgent);

      if (isWindows) {
        // Windows: Use mailto: (New Outlook doesn't support custom schemes)
        // Will open Outlook if set as default email client
        return mailtoUrl;
      }
    }

    // Mac: Use ms-outlook: scheme (works with Outlook desktop app)
    return mailtoUrl;
  }
}
