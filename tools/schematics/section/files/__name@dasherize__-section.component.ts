import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField<% if (usesItems) { %>, CardItem<% } %> } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';

<% if (usesFields && !usesItems) { %>
interface <%= className.replace('Component', 'Field') %> extends CardField {
  // Add custom field properties here
}
<% } else if (usesItems && !usesFields) { %>
interface <%= className.replace('Component', 'Item') %> extends CardItem {
  // Add custom item properties here
}
<% } %>

/**
 * <%= className %>
 * 
 * <%= name %> section component for OSI Cards.
 * <% if (usesFields) { %>Displays fields with key-value pairs.<% } %>
 * <% if (usesItems) { %>Displays a list of items.<% } %>
 * 
 * Features:
 * - Section type: '<%= type %>'
 * <% if (usesFields) { %>- Field-based data display<% } %>
 * <% if (usesItems) { %>- Item-based list display<% } %>
 * - OnPush change detection for performance
 * - Accessibility support
 * 
 * @example
 * ```html
 * <<%= selector %> [section]="mySection"></<%= selector %>>
 * ```
 */
@Component({
  selector: '<%= selector %>',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './<%= name %>-section.component.html',
  styleUrls: ['./<%= name %>-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <%= className %> extends BaseSectionComponent<<% if (usesFields && !usesItems) { %><%= className.replace('Component', 'Field') %><% } else if (usesItems && !usesFields) { %><%= className.replace('Component', 'Item') %><% } else { %>CardField<% } %>> {
  
  <% if (usesFields) { %>
  get fields(): <% if (usesFields && !usesItems) { %><%= className.replace('Component', 'Field') %>[]<% } else { %>CardField[]<% } %> {
    return super.getFields() as <% if (usesFields && !usesItems) { %><%= className.replace('Component', 'Field') %>[]<% } else { %>CardField[]<% } %>;
  }

  override get hasFields(): boolean {
    return super.hasFields;
  }
  <% } %>

  <% if (usesItems) { %>
  get items(): <% if (usesItems && !usesFields) { %><%= className.replace('Component', 'Item') %>[]<% } else { %>CardItem[]<% } %> {
    return super.getItems() as <% if (usesItems && !usesFields) { %><%= className.replace('Component', 'Item') %>[]<% } else { %>CardItem[]<% } %>;
  }

  override get hasItems(): boolean {
    return super.hasItems;
  }
  <% } %>

  <% if (usesFields) { %>
  trackByField = (_index: number, field: CardField): string =>
    field.id ?? `${field.label}-${_index}`;
  <% } %>

  <% if (usesItems) { %>
  trackByItem = (_index: number, item: CardItem): string =>
    item.id ?? `${item.title}-${_index}`;
  <% } %>

  <% if (usesFields) { %>
  onFieldClick(field: CardField): void {
    this.emitFieldInteraction(field, {
      sectionTitle: this.section.title
    });
  }
  <% } %>

  <% if (usesItems) { %>
  onItemClick(item: CardItem): void {
    this.emitItemInteraction(item, {
      sectionTitle: this.section.title
    });
  }
  <% } %>
}




























