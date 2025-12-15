import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { BadgeComponent, EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

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

  /**
   * Track which contact card is currently expanded
   */
  expandedId: string | null = null;

  /**
   * Track which note is currently expanded
   */
  noteExpandedId: string | null = null;

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
   * Get unique ID for a contact (for expand state tracking)
   */
  getId(contact: any): string {
    return contact.id || `${this.getContactName(contact)}-${this.getContactRole(contact)}`;
  }

  /**
   * Toggle expand/collapse state for a contact
   */
  toggle(contact: any): void {
    const id = this.getId(contact);
    this.expandedId = this.expandedId === id ? null : id;
  }

  /**
   * Check if a contact is currently expanded
   */
  isExpanded(contact: any): boolean {
    return this.expandedId === this.getId(contact);
  }

  /**
   * Get primary meta information (role OR department, not both)
   * Returns a single short line for compact display
   */
  getPrimaryMeta(contact: any): string {
    // Prefer role, fallback to department
    return this.getContactRole(contact) || contact.department || '';
  }

  /**
   * Get secondary meta information (e.g., tenure, company)
   * Returns empty string if not available
   */
  getSecondaryMeta(contact: any): string {
    // Check for other fields like tenure, company, etc.
    return contact.tenure || contact.company || '';
  }

  /**
   * Check if contact has more details beyond primary actions
   */
  hasMoreDetails(contact: any): boolean {
    const secondaryActions = this.getSecondaryActions(contact);
    const hasExtraFields = !!(contact.tenure || contact.company);
    return secondaryActions.length > 0 || hasExtraFields;
  }

  /**
   * Get all contact actions (email, phone, LinkedIn, etc.)
   */
  getContactActions(contact: any): Array<{ type: string; value: string; label: string }> {
    const actions: Array<{ type: string; value: string; label: string }> = [];
    if (contact.email) {
      actions.push({ type: 'email', value: contact.email, label: 'Email' });
    }
    if (contact.salesforce) {
      actions.push({ type: 'salesforce', value: contact.salesforce, label: 'Salesforce CRM' });
    }
    if (contact.linkedIn) {
      actions.push({ type: 'linkedin', value: contact.linkedIn, label: 'LinkedIn' });
    }
    return actions;
  }

  /**
   * Get primary contact methods (email + salesforce, max 2)
   * These are shown in collapsed state
   */
  getPrimaryActions(contact: any): Array<{ type: string; value: string; label: string }> {
    const allActions = this.getContactActions(contact);
    // Prefer email + salesforce, keep LinkedIn under "more"
    return allActions.filter((a) => a.type !== 'linkedin').slice(0, 2);
  }

  /**
   * Get secondary contact methods (everything else, typically LinkedIn)
   * These are shown in expanded state or under "more" button
   */
  getSecondaryActions(contact: any): Array<{ type: string; value: string; label: string }> {
    const allActions = this.getContactActions(contact);
    const primaryActions = this.getPrimaryActions(contact);
    const primaryTypes = new Set(primaryActions.map((a) => a.type));
    return allActions.filter((a) => !primaryTypes.has(a.type));
  }

  /**
   * Get action URL based on type
   */
  getActionUrl(action: { type: string; value: string }): string {
    switch (action.type) {
      case 'email':
        return this.getOutlookEmailUrl(action.value);
      case 'salesforce':
        return action.value; // Salesforce CRM URL
      case 'linkedin':
        return action.value;
      default:
        return '#';
    }
  }

  /**
   * Get action icon/emoji based on type
   */
  getActionIcon(action: { type: string }): string {
    switch (action.type) {
      case 'email':
        return '📧';
      case 'salesforce':
        return '☁️'; // Salesforce cloud icon
      case 'linkedin':
        return '💼';
      default:
        return '🔗';
    }
  }

  /**
   * Get note text from contact
   */
  getNote(contact: any): string | null {
    return contact.note || null;
  }

  /**
   * Check if contact has a note
   */
  hasNote(contact: any): boolean {
    return !!this.getNote(contact);
  }

  /**
   * Toggle note expand/collapse state
   */
  toggleNote(contact: any, event: Event): void {
    event.stopPropagation(); // Prevent card toggle
    const id = this.getId(contact);
    this.noteExpandedId = this.noteExpandedId === id ? null : id;
  }

  /**
   * Check if note is currently expanded
   */
  isNoteExpanded(contact: any): boolean {
    return this.noteExpandedId === this.getId(contact);
  }

  /**
   * Check if note text is long enough to need expansion
   */
  shouldShowExpandButton(contact: any): boolean {
    const note = this.getNote(contact);
    if (!note) return false;
    // Show expand button if note is longer than ~100 characters
    return note.length > 100;
  }

  /**
   * Check if contact is a target (should be highlighted)
   */
  isTarget(contact: any): boolean {
    return contact.target === true || contact.target === 'true';
  }

  /**
   * Get friendly/influencer score (1-10)
   */
  getScore(contact: any): number | null {
    const score = contact.friendly || contact.influencer || contact.score;
    if (score === null || score === undefined) return null;
    const numScore = typeof score === 'number' ? score : parseInt(score, 10);
    if (isNaN(numScore) || numScore < 1 || numScore > 10) return null;
    return numScore;
  }

  /**
   * Get score type label (friendly/influencer/score)
   */
  getScoreType(contact: any): string | null {
    if (contact.friendly !== null && contact.friendly !== undefined) return 'Friendly';
    if (contact.influencer !== null && contact.influencer !== undefined) return 'Influencer';
    if (contact.score !== null && contact.score !== undefined) return 'Score';
    return null;
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
    return mailtoUrl;
  }

  /**
   * Calculate layout preferences for contact card section based on content.
   * Contact cards: 2 columns default, takes right side of layout
   */
  private calculateContactCardLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const fields = section.fields ?? [];
    const itemCount = items.length + fields.length;

    // Contact cards: 2 columns default to take right side
    let preferredColumns: 1 | 2 | 3 | 4 = 2;

    // Can expand to 3 if many contacts and space available
    if (itemCount >= 6 && availableColumns >= 3) {
      preferredColumns = 3;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 2) as 1 | 2 | 3 | 4, // Minimum 2 columns
      maxColumns: Math.min((section.maxColumns ?? 3) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: false, // Don't shrink below 2 columns
      shrinkPriority: 10, // Lower priority (don't shrink as aggressively)
      expandOnContent: {
        itemCount: 6, // Expand to 3 columns at 6+ contacts
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
