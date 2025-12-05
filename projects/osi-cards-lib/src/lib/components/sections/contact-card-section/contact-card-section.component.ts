import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { BadgeComponent, EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { CardSection } from '../../../models';

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
export class ContactCardSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register(
      'contact-card',
      (section: CardSection, availableColumns: number) => {
        return this.calculateContactCardLayoutPreferences(section, availableColumns);
      }
    );
  }
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
    return `ms-outlook:${mailtoUrl}`;
  }

  /**
   * Calculate layout preferences for contact card section based on content.
   * Contact cards: 1 col default, can expand to 2
   */
  private calculateContactCardLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const fields = section.fields ?? [];
    const itemCount = items.length + fields.length;

    // Contact cards: 1 col default, can expand to 2 for multiple contacts
    let preferredColumns: 1 | 2 | 3 | 4 = 1;
    if (itemCount >= 3 && availableColumns >= 2) {
      preferredColumns = 2;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 2) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 15, // High priority for shrinking (contact cards are very flexible)
      expandOnContent: {
        itemCount: 3, // Expand to 2 columns at 3+ contacts
      },
    };
  }

  /**
   * Get layout preferences for contact card section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateContactCardLayoutPreferences(this.section, availableColumns);
  }
}
