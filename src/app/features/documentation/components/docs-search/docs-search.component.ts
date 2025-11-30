import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, fromEvent, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

/**
 * Search result item
 */
interface SearchResult {
  id: string;
  title: string;
  path: string;
  category: string;
  categoryIcon: string;
  excerpt?: string;
  type: 'guide' | 'api' | 'component' | 'section-type' | 'example';
}

/**
 * Command Palette / Search Component
 * Implements B9-B14 from the 100-point plan:
 * - B34: Command palette modal (Cmd+K)
 * - B35: Search suggestions / auto-complete
 * - B36: Search highlighting
 * - B37: Recent searches (localStorage)
 * - B38: Search categories filter
 * - B39: No results state with suggestions
 */
@Component({
  selector: 'app-docs-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideIconsModule
  ],
  template: `
    @if (isOpen()) {
      <div class="search-overlay" (click)="close()">
        <div class="search-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Search documentation">
          <!-- Search Input -->
          <div class="search-header">
            <lucide-icon name="search" [size]="20" class="search-icon"></lucide-icon>
            <input
              #searchInput
              type="text"
              [value]="query()"
              (input)="onQueryChange($event)"
              (keydown)="onKeydown($event)"
              placeholder="Search documentation..."
              class="search-input"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
            />
            @if (query()) {
              <button class="clear-btn" (click)="clearQuery()" aria-label="Clear search">
                <lucide-icon name="x" [size]="16"></lucide-icon>
              </button>
            }
            <kbd class="search-kbd">ESC</kbd>
          </div>
          
          <!-- B38: Category Filters -->
          <div class="search-filters">
            <button 
              class="filter-btn"
              [class.active]="activeFilter() === 'all'"
              (click)="setFilter('all')"
            >
              All
            </button>
            <button 
              class="filter-btn"
              [class.active]="activeFilter() === 'guide'"
              (click)="setFilter('guide')"
            >
              <lucide-icon name="book-open" [size]="14"></lucide-icon>
              Guides
            </button>
            <button 
              class="filter-btn"
              [class.active]="activeFilter() === 'api'"
              (click)="setFilter('api')"
            >
              <lucide-icon name="code" [size]="14"></lucide-icon>
              API
            </button>
            <button 
              class="filter-btn"
              [class.active]="activeFilter() === 'component'"
              (click)="setFilter('component')"
            >
              <lucide-icon name="box" [size]="14"></lucide-icon>
              Components
            </button>
            <button 
              class="filter-btn"
              [class.active]="activeFilter() === 'section-type'"
              (click)="setFilter('section-type')"
            >
              <lucide-icon name="layout-grid" [size]="14"></lucide-icon>
              Sections
            </button>
          </div>
          
          <!-- Results -->
          <div class="search-results" role="listbox">
            @if (isLoading()) {
              <div class="search-loading">
                <lucide-icon name="loader-2" [size]="24" class="spin"></lucide-icon>
                <span>Searching...</span>
              </div>
            } @else if (!query() && recentSearches().length > 0) {
              <!-- B37: Recent Searches -->
              <div class="results-section">
                <div class="section-header">
                  <span>Recent</span>
                  <button class="clear-recent-btn" (click)="clearRecentSearches()">Clear</button>
                </div>
                @for (recent of recentSearches(); track recent) {
                  <button 
                    class="result-item recent"
                    (click)="searchRecent(recent)"
                  >
                    <lucide-icon name="clock" [size]="16" class="result-icon"></lucide-icon>
                    <span class="result-title">{{ recent }}</span>
                  </button>
                }
              </div>
              <!-- Quick Links -->
              <div class="results-section">
                <div class="section-header">Quick Links</div>
                @for (link of quickLinks; track link.path) {
                  <button 
                    class="result-item"
                    (click)="navigateTo(link.path)"
                  >
                    <lucide-icon [name]="link.icon" [size]="16" class="result-icon"></lucide-icon>
                    <span class="result-title">{{ link.title }}</span>
                    <span class="result-category">{{ link.category }}</span>
                  </button>
                }
              </div>
            } @else if (filteredResults().length > 0) {
              @for (group of groupedResults(); track group.category) {
                <div class="results-section">
                  <div class="section-header">
                    <lucide-icon [name]="group.icon" [size]="14"></lucide-icon>
                    {{ group.category }}
                    <span class="count">({{ group.items.length }})</span>
                  </div>
                  @for (result of group.items; track result.id; let i = $index) {
                    <button 
                      class="result-item"
                      [class.selected]="selectedIndex() === getGlobalIndex(group, i)"
                      [id]="'result-' + getGlobalIndex(group, i)"
                      (click)="selectResult(result)"
                      (mouseenter)="setSelectedIndex(getGlobalIndex(group, i))"
                      role="option"
                      [attr.aria-selected]="selectedIndex() === getGlobalIndex(group, i)"
                    >
                      <lucide-icon [name]="result.categoryIcon" [size]="16" class="result-icon"></lucide-icon>
                      <div class="result-content">
                        <!-- B36: Highlighted Title -->
                        <span class="result-title" [innerHTML]="highlightMatch(result.title)"></span>
                        @if (result.excerpt) {
                          <span class="result-excerpt" [innerHTML]="highlightMatch(result.excerpt)"></span>
                        }
                      </div>
                      <span class="result-path">{{ result.path }}</span>
                    </button>
                  }
                </div>
              }
            } @else if (query()) {
              <!-- B39: No Results State -->
              <div class="no-results">
                <lucide-icon name="search-x" [size]="48"></lucide-icon>
                <h3>No results found</h3>
                <p>Try searching for something else, or check out these suggestions:</p>
                <div class="suggestions">
                  <button class="suggestion-btn" (click)="searchSuggestion('getting started')">Getting Started</button>
                  <button class="suggestion-btn" (click)="searchSuggestion('section types')">Section Types</button>
                  <button class="suggestion-btn" (click)="searchSuggestion('streaming')">Streaming</button>
                  <button class="suggestion-btn" (click)="searchSuggestion('theming')">Theming</button>
                </div>
              </div>
            } @else {
              <!-- Empty State -->
              <div class="empty-state">
                <lucide-icon name="search" [size]="32"></lucide-icon>
                <p>Start typing to search the documentation</p>
              </div>
            }
          </div>
          
          <!-- Footer -->
          <div class="search-footer">
            <div class="footer-hint">
              <kbd>↑↓</kbd> to navigate
            </div>
            <div class="footer-hint">
              <kbd>↵</kbd> to select
            </div>
            <div class="footer-hint">
              <kbd>esc</kbd> to close
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .search-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10vh;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 9999;
      animation: fadeIn 0.15s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .search-modal {
      width: 90%;
      max-width: 640px;
      max-height: 70vh;
      background: var(--docs-surface, #fff);
      border: 1px solid var(--docs-border, #e2e8f0);
      border-radius: var(--docs-radius-xl, 16px);
      box-shadow: var(--docs-shadow-xl, 0 16px 48px rgba(0,0,0,0.12));
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideDown 0.2s ease;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    /* Header */
    .search-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--docs-border, #e2e8f0);
    }
    
    .search-icon {
      color: var(--docs-text-muted, #8891a4);
      flex-shrink: 0;
    }
    
    .search-input {
      flex: 1;
      padding: 0;
      font-family: inherit;
      font-size: 1.125rem;
      color: var(--docs-text, #1a1d23);
      background: transparent;
      border: none;
      outline: none;
      
      &::placeholder {
        color: var(--docs-text-muted, #8891a4);
      }
    }
    
    .clear-btn {
      display: flex;
      padding: 0.375rem;
      color: var(--docs-text-muted, #8891a4);
      background: transparent;
      border: none;
      border-radius: var(--docs-radius, 6px);
      cursor: pointer;
      
      &:hover {
        color: var(--docs-text, #1a1d23);
        background: var(--docs-hover-bg, rgba(255,121,0,0.04));
      }
    }
    
    .search-kbd {
      padding: 0.25rem 0.5rem;
      font-family: var(--docs-font-mono, monospace);
      font-size: 0.75rem;
      color: var(--docs-text-muted, #8891a4);
      background: var(--docs-bg-secondary, #f4f6f9);
      border: 1px solid var(--docs-border, #e2e8f0);
      border-radius: var(--docs-radius-sm, 4px);
    }
    
    /* Filters */
    .search-filters {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--docs-border, #e2e8f0);
      overflow-x: auto;
    }
    
    .filter-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--docs-text-secondary, #4a5568);
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--docs-radius-full, 9999px);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
      
      &:hover {
        background: var(--docs-hover-bg, rgba(255,121,0,0.04));
      }
      
      &.active {
        color: var(--docs-primary, #ff7900);
        background: var(--docs-primary-bg, rgba(255,121,0,0.06));
        border-color: var(--docs-primary, #ff7900);
      }
    }
    
    /* Results */
    .search-results {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }
    
    .results-section {
      margin-bottom: 0.5rem;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--docs-text-muted, #8891a4);
      
      .count {
        font-weight: 400;
      }
    }
    
    .clear-recent-btn {
      margin-left: auto;
      padding: 0.125rem 0.5rem;
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--docs-text-muted, #8891a4);
      background: transparent;
      border: none;
      border-radius: var(--docs-radius-sm, 4px);
      cursor: pointer;
      
      &:hover {
        color: var(--docs-danger-text, #dc2626);
        background: var(--docs-danger-bg, rgba(239,68,68,0.08));
      }
    }
    
    .result-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.625rem 0.75rem;
      text-align: left;
      background: transparent;
      border: none;
      border-radius: var(--docs-radius-md, 8px);
      cursor: pointer;
      transition: background 0.1s ease;
      
      &:hover,
      &.selected {
        background: var(--docs-hover-bg, rgba(255,121,0,0.04));
      }
      
      &.selected {
        background: var(--docs-primary-bg, rgba(255,121,0,0.06));
      }
    }
    
    .result-icon {
      color: var(--docs-text-muted, #8891a4);
      flex-shrink: 0;
    }
    
    .result-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }
    
    .result-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--docs-text, #1a1d23);
      
      :host ::ng-deep mark {
        background: rgba(255, 121, 0, 0.2);
        color: inherit;
        padding: 0 2px;
        border-radius: 2px;
      }
    }
    
    .result-excerpt {
      font-size: 0.75rem;
      color: var(--docs-text-muted, #8891a4);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .result-path {
      font-size: 0.6875rem;
      color: var(--docs-text-muted, #8891a4);
      white-space: nowrap;
    }
    
    .result-category {
      margin-left: auto;
      font-size: 0.6875rem;
      color: var(--docs-text-muted, #8891a4);
    }
    
    /* Loading */
    .search-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 3rem;
      color: var(--docs-text-muted, #8891a4);
      
      .spin {
        animation: spin 1s linear infinite;
      }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* No Results */
    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
      color: var(--docs-text-muted, #8891a4);
      
      h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--docs-text-secondary, #4a5568);
      }
      
      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }
    
    .suggestions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .suggestion-btn {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--docs-primary, #ff7900);
      background: var(--docs-primary-bg, rgba(255,121,0,0.06));
      border: 1px solid var(--docs-primary, #ff7900);
      border-radius: var(--docs-radius-full, 9999px);
      cursor: pointer;
      transition: all 0.15s ease;
      
      &:hover {
        background: var(--docs-primary, #ff7900);
        color: white;
      }
    }
    
    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 3rem;
      text-align: center;
      color: var(--docs-text-muted, #8891a4);
      
      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }
    
    /* Footer */
    .search-footer {
      display: flex;
      gap: 1.5rem;
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--docs-border, #e2e8f0);
      background: var(--docs-bg-secondary, #f4f6f9);
    }
    
    .footer-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--docs-text-muted, #8891a4);
      
      kbd {
        padding: 0.125rem 0.375rem;
        font-family: var(--docs-font-mono, monospace);
        font-size: 0.6875rem;
        background: var(--docs-surface, #fff);
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius-sm, 4px);
      }
    }
    
    @media (max-width: 640px) {
      .search-modal {
        max-height: 80vh;
        margin: 0 1rem;
      }
      
      .search-filters {
        padding: 0.5rem 1rem;
      }
      
      .footer-hint:last-child {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsSearchComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  
  @Input() isOpen = signal(false);
  @Output() closed = new EventEmitter<void>();
  @Output() resultSelected = new EventEmitter<string>();
  
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private searchIndex: SearchResult[] = [];
  
  query = signal('');
  activeFilter = signal<'all' | 'guide' | 'api' | 'component' | 'section-type' | 'example'>('all');
  selectedIndex = signal(0);
  isLoading = signal(false);
  recentSearches = signal<string[]>([]);
  
  // All results
  private allResults = signal<SearchResult[]>([]);
  
  // Filtered results
  filteredResults = computed(() => {
    const results = this.allResults();
    const filter = this.activeFilter();
    
    if (filter === 'all') return results;
    return results.filter(r => r.type === filter);
  });
  
  // Grouped results
  groupedResults = computed(() => {
    const results = this.filteredResults();
    const groups = new Map<string, { category: string; icon: string; items: SearchResult[] }>();
    
    for (const result of results) {
      if (!groups.has(result.category)) {
        groups.set(result.category, {
          category: result.category,
          icon: result.categoryIcon,
          items: []
        });
      }
      groups.get(result.category)!.items.push(result);
    }
    
    return Array.from(groups.values());
  });
  
  // Quick links for empty state
  quickLinks = [
    { path: '/docs/getting-started', title: 'Getting Started', category: 'Guide', icon: 'rocket' },
    { path: '/docs/section-types/info', title: 'Info Section', category: 'Section', icon: 'info' },
    { path: '/docs/components/ai-card-renderer', title: 'AICardRenderer', category: 'Component', icon: 'box' },
    { path: '/docs/streaming/overview', title: 'Streaming', category: 'Feature', icon: 'radio' },
  ];
  
  private RECENT_SEARCHES_KEY = 'osi-docs-recent-searches';
  private MAX_RECENT = 5;

  ngOnInit() {
    this.buildSearchIndex();
    this.loadRecentSearches();
  }

  ngAfterViewInit() {
    // Focus input when opened
    if (this.isOpen()) {
      this.focusInput();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.close();
    }
  }

  private focusInput() {
    setTimeout(() => {
      this.searchInputRef?.nativeElement?.focus();
    }, 100);
  }

  private buildSearchIndex() {
    // Build the search index from documentation structure
    this.searchIndex = [
      // Guides
      { id: 'gs-1', title: 'Getting Started', path: '/docs/getting-started', category: 'Guides', categoryIcon: 'book-open', type: 'guide', excerpt: 'Introduction to OSI Cards library' },
      { id: 'gs-2', title: 'Installation', path: '/docs/installation', category: 'Guides', categoryIcon: 'book-open', type: 'guide', excerpt: 'How to install OSI Cards' },
      { id: 'gs-3', title: 'Best Practices', path: '/docs/best-practices', category: 'Guides', categoryIcon: 'book-open', type: 'guide', excerpt: 'Recommended patterns and practices' },
      { id: 'gs-4', title: 'Library Usage', path: '/docs/library-usage', category: 'Guides', categoryIcon: 'book-open', type: 'guide' },
      { id: 'gs-5', title: 'LLM Integration', path: '/docs/llm-integration', category: 'Guides', categoryIcon: 'book-open', type: 'guide', excerpt: 'Integrating with AI/LLM systems' },
      
      // Section Types
      { id: 'st-1', title: 'Info Section', path: '/docs/section-types/info', category: 'Section Types', categoryIcon: 'layout-grid', type: 'section-type', excerpt: 'Display key-value information' },
      { id: 'st-2', title: 'Analytics Section', path: '/docs/section-types/analytics', category: 'Section Types', categoryIcon: 'layout-grid', type: 'section-type', excerpt: 'Metrics and KPIs display' },
      { id: 'st-3', title: 'Contact Card', path: '/docs/section-types/contact-card', category: 'Section Types', categoryIcon: 'layout-grid', type: 'section-type', excerpt: 'Contact information display' },
      { id: 'st-4', title: 'Network Card', path: '/docs/section-types/network-card', category: 'Section Types', categoryIcon: 'layout-grid', type: 'section-type' },
      { id: 'st-5', title: 'Map Section', path: '/docs/section-types/map', category: 'Section Types', categoryIcon: 'layout-grid', type: 'section-type', excerpt: 'Geographic data visualization' },
      { id: 'st-6', title: 'Chart Section', path: '/docs/section-types/chart', category: 'Section Types', categoryIcon: 'layout-grid', type: 'section-type', excerpt: 'Data visualization charts' },
      { id: 'st-7', title: 'List Section', path: '/docs/section-types/list', category: 'Section Types', categoryIcon: 'layout-grid', type: 'section-type', excerpt: 'Display list of items' },
      { id: 'st-8', title: 'Event Section', path: '/docs/section-types/event', category: 'Section Types', categoryIcon: 'layout-grid', type: 'section-type' },
      { id: 'st-9', title: 'Product Section', path: '/docs/section-types/product', category: 'Section Types', categoryIcon: 'layout-grid', type: 'section-type' },
      { id: 'st-10', title: 'Financials Section', path: '/docs/section-types/financials', category: 'Section Types', categoryIcon: 'layout-grid', type: 'section-type' },
      
      // Components
      { id: 'c-1', title: 'AICardRenderer', path: '/docs/components/ai-card-renderer', category: 'Components', categoryIcon: 'box', type: 'component', excerpt: 'Main card rendering component' },
      { id: 'c-2', title: 'SectionRenderer', path: '/docs/components/section-renderer', category: 'Components', categoryIcon: 'box', type: 'component' },
      { id: 'c-3', title: 'MasonryGrid', path: '/docs/components/masonry-grid', category: 'Components', categoryIcon: 'box', type: 'component', excerpt: 'Responsive masonry layout' },
      { id: 'c-4', title: 'CardSkeleton', path: '/docs/components/card-skeleton', category: 'Components', categoryIcon: 'box', type: 'component' },
      { id: 'c-5', title: 'StreamingIndicator', path: '/docs/components/card-streaming-indicator', category: 'Components', categoryIcon: 'box', type: 'component' },
      
      // API / Services
      { id: 'api-1', title: 'Streaming Service', path: '/docs/services/streaming-service', category: 'API', categoryIcon: 'code', type: 'api', excerpt: 'Real-time streaming management' },
      { id: 'api-2', title: 'Theme Service', path: '/docs/services/theme-service', category: 'API', categoryIcon: 'code', type: 'api' },
      { id: 'api-3', title: 'Event Middleware', path: '/docs/services/event-middleware-service', category: 'API', categoryIcon: 'code', type: 'api' },
      { id: 'api-4', title: 'Section Plugin Registry', path: '/docs/services/section-plugin-registry', category: 'API', categoryIcon: 'code', type: 'api' },
      { id: 'api-5', title: 'Animation Orchestrator', path: '/docs/services/animation-orchestrator', category: 'API', categoryIcon: 'code', type: 'api' },
      
      // Schemas
      { id: 'sch-1', title: 'AICardConfig', path: '/docs/schemas/ai-card-config', category: 'Schemas', categoryIcon: 'file-json', type: 'api', excerpt: 'Card configuration schema' },
      { id: 'sch-2', title: 'CardSection', path: '/docs/schemas/card-section', category: 'Schemas', categoryIcon: 'file-json', type: 'api' },
      { id: 'sch-3', title: 'CardField', path: '/docs/schemas/card-field', category: 'Schemas', categoryIcon: 'file-json', type: 'api' },
      
      // Streaming
      { id: 'str-1', title: 'Streaming Overview', path: '/docs/streaming/overview', category: 'Streaming', categoryIcon: 'radio', type: 'guide', excerpt: 'Real-time card updates' },
      { id: 'str-2', title: 'Streaming Configuration', path: '/docs/streaming/config', category: 'Streaming', categoryIcon: 'radio', type: 'api' },
      { id: 'str-3', title: 'Progressive Rendering', path: '/docs/streaming/progressive-rendering', category: 'Streaming', categoryIcon: 'radio', type: 'guide' },
      
      // Advanced
      { id: 'adv-1', title: 'Theming Overview', path: '/docs/advanced/theming-overview', category: 'Advanced', categoryIcon: 'graduation-cap', type: 'guide', excerpt: 'Customizing card appearance' },
      { id: 'adv-2', title: 'CSS Properties', path: '/docs/advanced/css-properties', category: 'Advanced', categoryIcon: 'graduation-cap', type: 'api' },
      { id: 'adv-3', title: 'Custom Sections', path: '/docs/advanced/custom-sections', category: 'Advanced', categoryIcon: 'graduation-cap', type: 'guide' },
      { id: 'adv-4', title: 'Performance', path: '/docs/advanced/performance', category: 'Advanced', categoryIcon: 'graduation-cap', type: 'guide' },
      { id: 'adv-5', title: 'Accessibility', path: '/docs/advanced/accessibility', category: 'Advanced', categoryIcon: 'graduation-cap', type: 'guide' },
    ];
  }

  onQueryChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.selectedIndex.set(0);
    this.search(value);
  }

  private search(query: string) {
    if (!query.trim()) {
      this.allResults.set([]);
      return;
    }
    
    this.isLoading.set(true);
    
    // Simulate async search
    setTimeout(() => {
      const normalizedQuery = query.toLowerCase();
      const results = this.searchIndex.filter(item => {
        const searchText = `${item.title} ${item.excerpt || ''} ${item.category}`.toLowerCase();
        return searchText.includes(normalizedQuery);
      });
      
      // Sort by relevance (title match first)
      results.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(normalizedQuery) ? 0 : 1;
        const bTitle = b.title.toLowerCase().includes(normalizedQuery) ? 0 : 1;
        return aTitle - bTitle;
      });
      
      this.allResults.set(results.slice(0, 20));
      this.isLoading.set(false);
    }, 100);
  }

  // B36: Highlight matches
  highlightMatch(text: string): string {
    const query = this.query();
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  onKeydown(event: KeyboardEvent) {
    const results = this.filteredResults();
    const totalResults = results.length;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update(i => Math.min(i + 1, totalResults - 1));
        this.scrollToSelected();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update(i => Math.max(i - 1, 0));
        this.scrollToSelected();
        break;
      case 'Enter':
        event.preventDefault();
        const selected = results[this.selectedIndex()];
        if (selected) {
          this.selectResult(selected);
        }
        break;
    }
  }

  private scrollToSelected() {
    const element = document.getElementById(`result-${this.selectedIndex()}`);
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  setSelectedIndex(index: number) {
    this.selectedIndex.set(index);
  }

  getGlobalIndex(group: { items: SearchResult[] }, localIndex: number): number {
    const groups = this.groupedResults();
    let offset = 0;
    
    for (const g of groups) {
      if (g === group) {
        return offset + localIndex;
      }
      offset += g.items.length;
    }
    
    return localIndex;
  }

  selectResult(result: SearchResult) {
    this.saveRecentSearch(this.query());
    this.router.navigate([result.path]);
    this.resultSelected.emit(result.path);
    this.close();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.resultSelected.emit(path);
    this.close();
  }

  setFilter(filter: 'all' | 'guide' | 'api' | 'component' | 'section-type' | 'example') {
    this.activeFilter.set(filter);
    this.selectedIndex.set(0);
  }

  clearQuery() {
    this.query.set('');
    this.allResults.set([]);
    this.focusInput();
  }

  searchRecent(query: string) {
    this.query.set(query);
    this.search(query);
  }

  searchSuggestion(query: string) {
    this.query.set(query);
    this.search(query);
  }

  close() {
    this.isOpen.set(false);
    this.query.set('');
    this.allResults.set([]);
    this.closed.emit();
  }

  // B37: Recent Searches
  private loadRecentSearches() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.RECENT_SEARCHES_KEY);
      if (stored) {
        this.recentSearches.set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
  }

  private saveRecentSearch(query: string) {
    if (!query.trim() || typeof localStorage === 'undefined') return;
    
    const recent = this.recentSearches();
    const filtered = recent.filter(r => r !== query);
    const updated = [query, ...filtered].slice(0, this.MAX_RECENT);
    
    this.recentSearches.set(updated);
    localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(updated));
  }

  clearRecentSearches() {
    this.recentSearches.set([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.RECENT_SEARCHES_KEY);
    }
  }
}

