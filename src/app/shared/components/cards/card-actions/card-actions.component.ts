import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../../icons/lucide-icons.module';
import { CardAction } from '../../../../models';
import { IconService } from '../../../services/icon.service';

/**
 * Card Actions Component
 *
 * Renders card-level action buttons (CTAs).
 * Extracted from AICardRendererComponent for better separation of concerns.
 */
@Component({
  selector: 'app-card-actions',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './card-actions.component.html',
  styleUrls: ['./card-actions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardActionsComponent {
  private readonly iconService = inject(IconService);

  @Input() actions: CardAction[] = [];
  @Output() actionClick = new EventEmitter<CardAction>();

  onActionClick(action: CardAction): void {
    this.actionClick.emit(action);
  }

  getActionIconName(action: CardAction): string {
    // If icon is explicitly provided, use it
    if (action.icon) {
      return this.iconService.getFieldIcon(action.icon);
    }

    // If type is specified and it's a button behavior type (not legacy styling), use default icons
    if (action.type && ['mail', 'website', 'agent', 'question'].includes(action.type)) {
      switch (action.type) {
        case 'mail':
          return 'mail';
        case 'website':
          return 'external-link';
        case 'agent':
          return 'user';
        case 'question':
          return 'message-circle';
        default:
          break;
      }
    }

    // Fallback to deriving icon from label
    return this.iconService.getFieldIcon(action.label);
  }

  getDefaultIconForButtonType(buttonType?: string): string | null {
    if (!buttonType || !['mail', 'website', 'agent', 'question'].includes(buttonType)) {
      return null;
    }

    switch (buttonType) {
      case 'mail':
        return 'mail';
      case 'website':
        return 'external-link';
      case 'agent':
        return 'user';
      case 'question':
        return 'message-circle';
      default:
        return null;
    }
  }

  getActionIconNameForDisplay(action: CardAction): string | null {
    // If explicit icon is provided and it's a URL, return null (will be handled as image)
    if (action.icon && action.icon.startsWith('http')) {
      return null;
    }

    // If explicit icon is provided and it's a lucide icon name, use it
    if (action.icon && !action.icon.startsWith('http')) {
      // Check if it's a lucide icon name (simple string like 'mail', 'user', etc.)
      if (/^[a-z-]+$/i.test(action.icon)) {
        return this.getActionIconName(action);
      }
      // Otherwise it's a text icon, return null (will be handled as text)
      return null;
    }

    // If no explicit icon, check if type is a button behavior type with default icon
    if (action.type && ['mail', 'website', 'agent', 'question'].includes(action.type)) {
      return this.getDefaultIconForButtonType(action.type);
    }

    // Fallback: try to derive icon from label
    const derivedIcon = this.getActionIconName(action);
    // Only use if it's a valid lucide icon name (simple string)
    if (derivedIcon && /^[a-z-]+$/i.test(derivedIcon)) {
      return derivedIcon;
    }

    return null;
  }

  hasTextIcon(action: CardAction): boolean {
    return !!(action.icon && !action.icon.startsWith('http') && !/^[a-z-]+$/i.test(action.icon));
  }

  hasImageIcon(action: CardAction): boolean {
    return !!(action.icon && action.icon.startsWith('http'));
  }

  /**
   * Get comprehensive ARIA label for action button
   */
  getActionAriaLabel(action: CardAction): string {
    let label = action.label;

    if (action.type === 'website' && action.url) {
      label += `: Opens ${action.url} in new window`;
    } else if (action.type === 'mail') {
      const email = action.email?.to || action.email?.contact?.email || 'email';
      label += `: Opens email to ${email}`;
    } else if (action.type === 'agent') {
      label += ': Triggers agent action';
    } else if (action.type === 'question') {
      label += ': Opens chat question';
    }

    return label;
  }

  getActionButtonClasses(action: CardAction): string {
    const primaryClasses =
      'bg-[var(--color-brand)] text-white font-semibold border-0 hover:bg-[var(--color-brand)]/90 hover:shadow-lg hover:shadow-[var(--color-brand)]/40 active:scale-95';
    const outlineClasses =
      'text-[var(--color-brand)] border border-[var(--color-brand)] bg-transparent font-semibold hover:bg-[var(--color-brand)]/10 active:scale-95';
    const ghostClasses =
      'text-[var(--color-brand)] bg-transparent border-0 font-semibold hover:bg-[var(--color-brand)]/10 active:scale-95';

    // Use variant field if present, otherwise check legacy type field for styling
    const styleVariant =
      action.variant ||
      (action.type === 'primary' || action.type === 'secondary' ? action.type : 'primary');

    switch (styleVariant) {
      case 'secondary':
      case 'outline':
        return outlineClasses;
      case 'ghost':
        return ghostClasses;
      default:
        return primaryClasses;
    }
  }

  trackAction = (_index: number, action: CardAction): string =>
    action.id ?? `${action.label}-${_index}`;
}
