import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';

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

@Component({
  selector: 'app-contact-card-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './contact-card-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactCardSectionComponent extends BaseSectionComponent<ContactField> {
  get contacts(): ContactField[] {
    return super.getFields() as ContactField[];
  }

  get hasContacts(): boolean {
    return super.hasFields;
  }

  trackContact = (_index: number, contact: ContactField): string =>
    contact.id ??
    this.getContactEmail(contact) ??
    this.getContactName(contact) ??
    `contact-${_index}`;

  onContactClick(field: ContactField): void {
    this.emitFieldInteraction(field);
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
    // Prioritize title field as it often contains the role description
    if (contact.title) {
      const role = contact.contact?.role ?? contact.role;
      // Combine title and role if both exist
      return role ? `${contact.title} ${role}` : contact.title;
    }
    return contact.contact?.role ?? contact.role ?? undefined;
  }

  getContactTitle(contact: ContactField): string | undefined {
    return contact.title ?? contact.contact?.role ?? contact.role ?? undefined;
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
