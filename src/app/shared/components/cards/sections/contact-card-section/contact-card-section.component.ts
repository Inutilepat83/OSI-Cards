import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

interface ContactField extends CardField {
  name?: string;
  role?: string;
  avatar?: string;
  department?: string;
  location?: string;
  email?: string;
  phone?: string;
  contact?: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
}

interface ContactInteraction {
  field: ContactField;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-contact-card-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './contact-card-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactCardSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<ContactInteraction>();

  get contacts(): ContactField[] {
    return (this.section.fields as ContactField[]) ?? [];
  }

  get hasContacts(): boolean {
    return this.contacts.length > 0;
  }

  trackContact = (_index: number, contact: ContactField): string =>
    contact.id ?? this.getContactEmail(contact) ?? this.getContactName(contact) ?? `contact-${_index}`;

  onContactClick(field: ContactField): void {
    this.fieldInteraction.emit({
      field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title
      }
    });
  }

  getContactName(contact: ContactField): string {
    return (
      contact.contact?.name ??
      contact.name ??
      contact.title ??
      contact.label ??
      contact.contact?.email ??
      contact.email ??
      'Unnamed contact'
    );
  }

  getContactRole(contact: ContactField): string | undefined {
    return contact.contact?.role ?? contact.role ?? undefined;
  }

  getContactEmail(contact: ContactField): string | undefined {
    return contact.contact?.email ?? contact.email ?? undefined;
  }

  getContactPhone(contact: ContactField): string | undefined {
    return contact.contact?.phone ?? contact.phone ?? undefined;
  }

  getContactAvatar(contact: ContactField): string | undefined {
    return contact.contact?.avatar ?? contact.avatar ?? undefined;
  }

  getInitials(name?: string): string {
    if (!name) {
      return 'NA';
    }
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
