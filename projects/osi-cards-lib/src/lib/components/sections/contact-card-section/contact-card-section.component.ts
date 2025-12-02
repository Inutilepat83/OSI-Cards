import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BadgeComponent, EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Contact Card Section Component
 *
 * Displays contact information with avatars, roles, and contact details.
 * Perfect for team members, leadership profiles, and stakeholder directories.
 */
@Component({
  selector: 'lib-contact-card-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './contact-card-section.component.html',
  styleUrl: './contact-card-section.scss',
})
export class ContactCardSectionComponent extends BaseSectionComponent {
  /**
   * Get contact name from field
   */
  getContactName(field: any): string {
    return field.title || field.label || 'No Name';
  }

  /**
   * Get contact role from field
   */
  getContactRole(field: any): string {
    return field.value || field.role || '';
  }

  /**
   * Get contact avatar with fallback
   */
  getAvatar(field: any): string | null {
    return field.avatar || null;
  }

  /**
   * Get initials from name for fallback avatar
   */
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name
      .trim()
      .split(' ')
      .filter((p) => p);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] || '';
      const last = parts[parts.length - 1]?.[0] || '';
      if (first && last) {
        return (first + last).toUpperCase();
      }
    }
    return name[0]?.toUpperCase() || '?';
  }
}
