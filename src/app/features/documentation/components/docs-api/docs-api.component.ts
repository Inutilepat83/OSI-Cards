import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

/**
 * API Property Definition
 */
export interface APIProp {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  description: string;
  deprecated?: boolean;
  since?: string;
}

/**
 * API Method Definition
 */
export interface APIMethod {
  name: string;
  signature: string;
  returns: string;
  description: string;
  parameters?: { name: string; type: string; description: string }[];
  example?: string;
  deprecated?: boolean;
  since?: string;
}

/**
 * Type Definition
 */
export interface TypeDefinition {
  name: string;
  type: 'interface' | 'type' | 'enum' | 'class';
  definition: string;
  description?: string;
  properties?: APIProp[];
}

/**
 * Related Link
 */
export interface RelatedLink {
  title: string;
  path: string;
  description?: string;
}

/**
 * API Reference Components
 * Implements C11-C18 from the 100-point plan:
 * - C61: API reference cards
 * - C62: Props tables (sortable, filterable)
 * - C63: Type definitions (expandable)
 * - C64: Usage examples (multiple variants)
 * - C65: Related docs links
 * - C66: Changelog integration
 * - C67: Deprecation notices
 * - C68: Import statements
 */

// =============================================================================
// C61: API REFERENCE CARD
// =============================================================================

@Component({
  selector: 'app-docs-api-card',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="api-card" [class.deprecated]="deprecated">
      <div class="api-card-header">
        <div class="api-card-title">
          <lucide-icon [name]="icon" [size]="18"></lucide-icon>
          <code class="api-name">{{ name }}</code>
          @if (badge) {
            <span class="api-badge" [class]="badgeClass">{{ badge }}</span>
          }
          @if (deprecated) {
            <span class="api-badge deprecated">Deprecated</span>
          }
        </div>
        @if (since) {
          <span class="api-since">Since {{ since }}</span>
        }
      </div>
      @if (description) {
        <p class="api-description">{{ description }}</p>
      }
      <div class="api-card-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .api-card {
      margin: 1.5rem 0;
      border: 1px solid var(--docs-border, #e2e8f0);
      border-radius: var(--docs-radius-lg, 12px);
      overflow: hidden;
      background: var(--docs-surface, #fff);
      
      &.deprecated {
        border-color: var(--docs-warning-border, #f59e0b);
        background: var(--docs-warning-bg, rgba(245,158,11,0.08));
      }
    }
    
    .api-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      background: var(--docs-bg-secondary, #f4f6f9);
      border-bottom: 1px solid var(--docs-border, #e2e8f0);
    }
    
    .api-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .api-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--docs-text, #1a1d23);
      background: transparent;
      padding: 0;
    }
    
    .api-badge {
      padding: 0.125rem 0.5rem;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: var(--docs-radius-full, 9999px);
      
      &.new {
        background: var(--docs-tip-bg, rgba(16,185,129,0.08));
        color: var(--docs-tip-text, #047857);
      }
      
      &.beta {
        background: var(--docs-info-bg, rgba(59,130,246,0.08));
        color: var(--docs-info-text, #1d4ed8);
      }
      
      &.deprecated {
        background: var(--docs-warning-bg, rgba(245,158,11,0.08));
        color: var(--docs-warning-text, #b45309);
      }
      
      &.required {
        background: var(--docs-danger-bg, rgba(239,68,68,0.08));
        color: var(--docs-danger-text, #dc2626);
      }
    }
    
    .api-since {
      font-size: 0.75rem;
      color: var(--docs-text-muted, #8891a4);
    }
    
    .api-description {
      margin: 0;
      padding: 1rem;
      font-size: 0.875rem;
      color: var(--docs-text-secondary, #4a5568);
      line-height: 1.6;
      border-bottom: 1px solid var(--docs-border-light, #f1f5f9);
    }
    
    .api-card-content {
      padding: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsAPICardComponent {
  @Input() name!: string;
  @Input() icon = 'code';
  @Input() description?: string;
  @Input() badge?: string;
  @Input() badgeClass = 'new';
  @Input() deprecated = false;
  @Input() since?: string;
}

// =============================================================================
// C62: PROPS TABLE
// =============================================================================

@Component({
  selector: 'app-docs-props-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule],
  template: `
    <div class="props-table-container">
      <!-- Header -->
      <div class="props-header">
        <h4 class="props-title">
          <lucide-icon name="settings-2" [size]="16"></lucide-icon>
          {{ title || 'Properties' }}
        </h4>
        <div class="props-controls">
          <!-- Filter -->
          <div class="props-filter">
            <lucide-icon name="search" [size]="14"></lucide-icon>
            <input 
              type="text" 
              placeholder="Filter props..."
              [value]="filter()"
              (input)="onFilterChange($event)"
            />
          </div>
          <!-- Show Required Only -->
          <label class="props-checkbox">
            <input 
              type="checkbox"
              [checked]="showRequiredOnly()"
              (change)="toggleRequiredOnly()"
            />
            <span>Required only</span>
          </label>
        </div>
      </div>
      
      <!-- Table -->
      <div class="props-table-wrapper">
        <table class="props-table">
          <thead>
            <tr>
              <th 
                class="sortable"
                (click)="sort('name')"
                [class.sorted]="sortBy() === 'name'"
              >
                Name
                <lucide-icon 
                  [name]="sortBy() === 'name' && sortDir() === 'desc' ? 'chevron-down' : 'chevron-up'" 
                  [size]="12"
                ></lucide-icon>
              </th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            @for (prop of filteredProps(); track prop.name) {
              <tr [class.deprecated]="prop.deprecated" [class.required]="prop.required">
                <td class="prop-name">
                  <code>{{ prop.name }}</code>
                  @if (prop.required) {
                    <span class="required-badge">*</span>
                  }
                  @if (prop.deprecated) {
                    <span class="deprecated-badge">Deprecated</span>
                  }
                </td>
                <td class="prop-type">
                  <code>{{ prop.type }}</code>
                </td>
                <td class="prop-default">
                  @if (prop.default) {
                    <code>{{ prop.default }}</code>
                  } @else {
                    <span class="no-default">-</span>
                  }
                </td>
                <td class="prop-description">
                  {{ prop.description }}
                  @if (prop.since) {
                    <span class="since-badge">v{{ prop.since }}</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
        
        @if (filteredProps().length === 0) {
          <div class="no-results">
            <lucide-icon name="search-x" [size]="24"></lucide-icon>
            <span>No matching properties found</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .props-table-container {
      margin: 1.5rem 0;
      border: 1px solid var(--docs-border, #e2e8f0);
      border-radius: var(--docs-radius-lg, 12px);
      overflow: hidden;
      background: var(--docs-surface, #fff);
    }
    
    .props-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: var(--docs-bg-secondary, #f4f6f9);
      border-bottom: 1px solid var(--docs-border, #e2e8f0);
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    
    .props-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--docs-text, #1a1d23);
    }
    
    .props-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .props-filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: var(--docs-surface, #fff);
      border: 1px solid var(--docs-border, #e2e8f0);
      border-radius: var(--docs-radius, 6px);
      
      input {
        border: none;
        background: transparent;
        font-size: 0.8125rem;
        color: var(--docs-text, #1a1d23);
        outline: none;
        width: 120px;
        
        &::placeholder {
          color: var(--docs-text-muted, #8891a4);
        }
      }
    }
    
    .props-checkbox {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--docs-text-secondary, #4a5568);
      cursor: pointer;
      
      input {
        accent-color: var(--docs-primary, #ff7900);
      }
    }
    
    .props-table-wrapper {
      overflow-x: auto;
    }
    
    .props-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--docs-border-light, #f1f5f9);
    }
    
    th {
      font-weight: 600;
      color: var(--docs-text-secondary, #4a5568);
      background: var(--docs-bg-tertiary, #eef1f5);
      white-space: nowrap;
      
      &.sortable {
        cursor: pointer;
        user-select: none;
        
        &:hover {
          color: var(--docs-primary, #ff7900);
        }
        
        &.sorted {
          color: var(--docs-primary, #ff7900);
        }
      }
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    tr:hover td {
      background: var(--docs-hover-bg, rgba(255,121,0,0.04));
    }
    
    tr.deprecated td {
      opacity: 0.6;
    }
    
    tr.required .prop-name code {
      color: var(--docs-primary, #ff7900);
    }
    
    .prop-name {
      font-weight: 500;
      
      code {
        font-family: var(--docs-font-mono, monospace);
        color: var(--docs-text, #1a1d23);
        background: transparent;
        padding: 0;
      }
    }
    
    .required-badge {
      color: var(--docs-danger-text, #dc2626);
      font-weight: 700;
    }
    
    .deprecated-badge {
      margin-left: 0.5rem;
      padding: 0.125rem 0.375rem;
      font-size: 0.625rem;
      font-weight: 600;
      color: var(--docs-warning-text, #b45309);
      background: var(--docs-warning-bg, rgba(245,158,11,0.08));
      border-radius: var(--docs-radius-sm, 4px);
    }
    
    .since-badge {
      margin-left: 0.5rem;
      padding: 0.125rem 0.375rem;
      font-size: 0.625rem;
      color: var(--docs-text-muted, #8891a4);
      background: var(--docs-bg-secondary, #f4f6f9);
      border-radius: var(--docs-radius-sm, 4px);
    }
    
    .prop-type code {
      font-family: var(--docs-font-mono, monospace);
      font-size: 0.75rem;
      color: var(--docs-code-keyword, #be185d);
      background: var(--docs-code-bg, #f8fafc);
      padding: 0.125rem 0.375rem;
      border-radius: var(--docs-radius-sm, 4px);
    }
    
    .prop-default {
      code {
        font-family: var(--docs-font-mono, monospace);
        font-size: 0.75rem;
        color: var(--docs-code-string, #059669);
        background: var(--docs-code-bg, #f8fafc);
        padding: 0.125rem 0.375rem;
        border-radius: var(--docs-radius-sm, 4px);
      }
      
      .no-default {
        color: var(--docs-text-muted, #8891a4);
      }
    }
    
    .prop-description {
      color: var(--docs-text-secondary, #4a5568);
      line-height: 1.5;
    }
    
    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 2rem;
      color: var(--docs-text-muted, #8891a4);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsPropsTableComponent {
  @Input() props: APIProp[] = [];
  @Input() title?: string;
  
  filter = signal('');
  showRequiredOnly = signal(false);
  sortBy = signal<'name' | 'type'>('name');
  sortDir = signal<'asc' | 'desc'>('asc');
  
  filteredProps = computed(() => {
    let result = [...this.props];
    
    // Filter by search
    const filterText = this.filter().toLowerCase();
    if (filterText) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(filterText) ||
        p.type.toLowerCase().includes(filterText) ||
        p.description.toLowerCase().includes(filterText)
      );
    }
    
    // Filter required only
    if (this.showRequiredOnly()) {
      result = result.filter(p => p.required);
    }
    
    // Sort
    result.sort((a, b) => {
      const aVal = a[this.sortBy()] || '';
      const bVal = b[this.sortBy()] || '';
      const cmp = aVal.toString().localeCompare(bVal.toString());
      return this.sortDir() === 'asc' ? cmp : -cmp;
    });
    
    return result;
  });
  
  onFilterChange(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }
  
  toggleRequiredOnly() {
    this.showRequiredOnly.update(v => !v);
  }
  
  sort(by: 'name' | 'type') {
    if (this.sortBy() === by) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(by);
      this.sortDir.set('asc');
    }
  }
}

// =============================================================================
// C63: TYPE DEFINITION
// =============================================================================

@Component({
  selector: 'app-docs-type-definition',
  standalone: true,
  imports: [CommonModule, LucideIconsModule, DocsPropsTableComponent],
  template: `
    <div class="type-definition" [class.expanded]="isExpanded()">
      <button class="type-header" (click)="toggle()">
        <div class="type-info">
          <span class="type-kind">{{ definition.type }}</span>
          <code class="type-name">{{ definition.name }}</code>
        </div>
        @if (definition.description) {
          <span class="type-desc">{{ definition.description }}</span>
        }
        <lucide-icon 
          [name]="isExpanded() ? 'chevron-up' : 'chevron-down'" 
          [size]="16"
          class="type-chevron"
        ></lucide-icon>
      </button>
      
      @if (isExpanded()) {
        <div class="type-content">
          <pre class="type-code"><code>{{ definition.definition }}</code></pre>
          @if (definition.properties && definition.properties.length > 0) {
            <app-docs-props-table 
              [props]="definition.properties"
              title="Properties"
            ></app-docs-props-table>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .type-definition {
      margin: 1rem 0;
      border: 1px solid var(--docs-border, #e2e8f0);
      border-radius: var(--docs-radius-md, 8px);
      overflow: hidden;
      background: var(--docs-surface, #fff);
    }
    
    .type-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
      
      &:hover {
        background: var(--docs-hover-bg, rgba(255,121,0,0.04));
      }
    }
    
    .type-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .type-kind {
      padding: 0.125rem 0.5rem;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--docs-primary, #ff7900);
      background: var(--docs-primary-bg, rgba(255,121,0,0.06));
      border-radius: var(--docs-radius-sm, 4px);
    }
    
    .type-name {
      font-family: var(--docs-font-mono, monospace);
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--docs-text, #1a1d23);
      background: transparent;
      padding: 0;
    }
    
    .type-desc {
      flex: 1;
      font-size: 0.8125rem;
      color: var(--docs-text-muted, #8891a4);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .type-chevron {
      flex-shrink: 0;
      color: var(--docs-text-muted, #8891a4);
    }
    
    .type-content {
      border-top: 1px solid var(--docs-border, #e2e8f0);
      animation: slideDown 0.2s ease;
    }
    
    .type-code {
      margin: 0;
      padding: 1rem;
      font-size: 0.8125rem;
      background: var(--docs-pre-bg, #0f172a);
      color: var(--docs-pre-text, #e2e8f0);
      overflow-x: auto;
      
      code {
        font-family: var(--docs-font-mono, monospace);
      }
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsTypeDefinitionComponent {
  @Input() definition!: TypeDefinition;
  @Input() expanded = false;
  
  isExpanded = signal(false);
  
  ngOnInit() {
    this.isExpanded.set(this.expanded);
  }
  
  toggle() {
    this.isExpanded.update(v => !v);
  }
}

// =============================================================================
// C68: IMPORT STATEMENT
// =============================================================================

@Component({
  selector: 'app-docs-import',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="import-statement">
      <code class="import-code">{{ importStatement }}</code>
      <button class="copy-btn" (click)="copy()" [title]="copied() ? 'Copied!' : 'Copy import'">
        <lucide-icon [name]="copied() ? 'check' : 'copy'" [size]="14"></lucide-icon>
      </button>
    </div>
  `,
  styles: [`
    .import-statement {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 1rem 0;
      padding: 0.75rem 1rem;
      background: var(--docs-pre-bg, #0f172a);
      border-radius: var(--docs-radius-md, 8px);
    }
    
    .import-code {
      font-family: var(--docs-font-mono, monospace);
      font-size: 0.875rem;
      color: var(--docs-pre-text, #e2e8f0);
      background: transparent;
      padding: 0;
    }
    
    .copy-btn {
      display: flex;
      padding: 0.375rem;
      color: var(--docs-text-muted, #8891a4);
      background: transparent;
      border: none;
      border-radius: var(--docs-radius-sm, 4px);
      cursor: pointer;
      transition: all 0.15s ease;
      
      &:hover {
        color: white;
        background: rgba(255,255,255,0.1);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsImportComponent {
  @Input() importStatement!: string;
  
  copied = signal(false);
  
  async copy() {
    try {
      await navigator.clipboard.writeText(this.importStatement);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }
}

// =============================================================================
// C65: RELATED LINKS
// =============================================================================

@Component({
  selector: 'app-docs-related-links',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="related-links">
      <h4 class="related-title">
        <lucide-icon name="link" [size]="16"></lucide-icon>
        {{ title || 'Related' }}
      </h4>
      <div class="related-list">
        @for (link of links; track link.path) {
          <a [href]="link.path" class="related-link">
            <lucide-icon name="file-text" [size]="16"></lucide-icon>
            <div class="link-content">
              <span class="link-title">{{ link.title }}</span>
              @if (link.description) {
                <span class="link-desc">{{ link.description }}</span>
              }
            </div>
            <lucide-icon name="arrow-right" [size]="14" class="link-arrow"></lucide-icon>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .related-links {
      margin: 1.5rem 0;
      padding: 1rem;
      background: var(--docs-bg-secondary, #f4f6f9);
      border-radius: var(--docs-radius-lg, 12px);
    }
    
    .related-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--docs-text-secondary, #4a5568);
    }
    
    .related-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .related-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--docs-surface, #fff);
      border: 1px solid var(--docs-border, #e2e8f0);
      border-radius: var(--docs-radius-md, 8px);
      text-decoration: none;
      transition: all 0.15s ease;
      
      &:hover {
        border-color: var(--docs-primary, #ff7900);
        transform: translateX(4px);
        
        .link-arrow {
          opacity: 1;
          transform: translateX(0);
        }
      }
    }
    
    .link-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }
    
    .link-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--docs-text, #1a1d23);
    }
    
    .link-desc {
      font-size: 0.75rem;
      color: var(--docs-text-muted, #8891a4);
    }
    
    .link-arrow {
      opacity: 0;
      transform: translateX(-4px);
      color: var(--docs-primary, #ff7900);
      transition: all 0.15s ease;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsRelatedLinksComponent {
  @Input() links: RelatedLink[] = [];
  @Input() title?: string;
}

// =============================================================================
// C67: DEPRECATION NOTICE
// =============================================================================

@Component({
  selector: 'app-docs-deprecation',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="deprecation-notice">
      <div class="deprecation-header">
        <lucide-icon name="alert-triangle" [size]="20"></lucide-icon>
        <span>Deprecated</span>
        @if (since) {
          <span class="since">since v{{ since }}</span>
        }
      </div>
      <div class="deprecation-content">
        <ng-content></ng-content>
        @if (replacement) {
          <p class="replacement">Use <code>{{ replacement }}</code> instead.</p>
        }
        @if (removeIn) {
          <p class="removal">Will be removed in v{{ removeIn }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .deprecation-notice {
      margin: 1rem 0;
      border: 1px solid var(--docs-warning-border, #f59e0b);
      border-radius: var(--docs-radius-md, 8px);
      overflow: hidden;
      background: var(--docs-warning-bg, rgba(245,158,11,0.08));
    }
    
    .deprecation-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: var(--docs-warning-text, #b45309);
      background: rgba(245,158,11,0.1);
    }
    
    .since {
      margin-left: auto;
      font-size: 0.75rem;
      font-weight: 400;
      opacity: 0.8;
    }
    
    .deprecation-content {
      padding: 1rem;
      font-size: 0.875rem;
      color: var(--docs-warning-text, #b45309);
      line-height: 1.6;
      
      p {
        margin: 0;
        
        & + p {
          margin-top: 0.5rem;
        }
      }
      
      code {
        padding: 0.125rem 0.375rem;
        background: rgba(255,255,255,0.5);
        border-radius: var(--docs-radius-sm, 4px);
      }
    }
    
    .replacement code {
      font-weight: 600;
    }
    
    .removal {
      font-style: italic;
      opacity: 0.8;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsDeprecationComponent {
  @Input() since?: string;
  @Input() replacement?: string;
  @Input() removeIn?: string;
}

