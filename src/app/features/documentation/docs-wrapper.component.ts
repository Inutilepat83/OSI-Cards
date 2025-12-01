import { 
  Component, 
  ChangeDetectionStrategy, 
  ViewEncapsulation,
  signal, 
  computed,
  inject, 
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject, fromEvent } from 'rxjs';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';

interface DocRoute {
  path: string;
  title: string;
  icon?: string;
  children?: DocRoute[];
}

interface SearchResult {
  title: string;
  path: string;
  category?: string;
  snippet?: string;
  icon?: string;
}

/**
 * Enhanced Documentation wrapper component
 * Implements 100-point improvement plan features:
 * - B26: Breadcrumb trail
 * - B28: Back-to-top button
 * - B29: Sidebar scroll position memory
 * - B31: Collapsible sidebar groups with animation
 * - B33: Keyboard shortcuts (/, J, K)
 * - B34: Command palette search (Cmd+K)
 * - B40: Reading progress bar
 */
@Component({
  selector: 'app-docs-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideIconsModule
  ],
  encapsulation: ViewEncapsulation.ShadowDom,
  styleUrls: ['./docs.styles.scss'],
  template: `
    <!-- B46: Skip Navigation Link -->
    <a href="#main-content" class="skip-link">Skip to content</a>
    
    <!-- B40: Reading Progress Bar -->
    <div class="reading-progress" [attr.aria-hidden]="true">
      <div class="reading-progress-bar" [style.width.%]="readingProgress()"></div>
    </div>
    
    <!-- B50: Screen Reader Announcements -->
    <div class="sr-announcements" role="status" aria-live="polite" aria-atomic="true">
      {{ announcement() }}
    </div>
    
    <div class="docs-layout" [class.sidebar-open]="sidebarOpen()">
      <!-- Mobile header -->
      <header class="docs-header" role="banner">
        <button 
          class="menu-btn" 
          (click)="toggleSidebar()" 
          [attr.aria-expanded]="sidebarOpen()"
          aria-controls="docs-sidebar"
          aria-label="Toggle navigation menu"
        >
          <lucide-icon name="menu" [size]="24"></lucide-icon>
        </button>
        <a routerLink="/docs" class="logo">
          <span class="logo-text">OSI Cards</span>
          <span class="logo-badge">Docs</span>
        </a>
        <div class="header-actions">
          <a 
            routerLink="/" 
            class="return-btn"
            aria-label="Return to OSI Cards"
            title="Return to OSI Cards"
          >
            <lucide-icon name="home" [size]="20"></lucide-icon>
          </a>
          <button 
            class="menu-btn" 
            (click)="openCommandPalette()" 
            aria-label="Search documentation (⌘K)"
            title="Search (⌘K)"
          >
            <lucide-icon name="search" [size]="20"></lucide-icon>
          </button>
          <a 
            href="https://github.com/Inutilepat83/OSI-Cards" 
            target="_blank" 
            rel="noopener noreferrer"
            class="github-link" 
            aria-label="View on GitHub"
          >
            <lucide-icon name="github" [size]="20"></lucide-icon>
          </a>
          <button 
            class="theme-btn" 
            (click)="toggleTheme()" 
            [attr.aria-label]="'Switch to ' + (isDark() ? 'light' : 'dark') + ' mode'"
            [attr.aria-pressed]="isDark()"
          >
            <lucide-icon [name]="isDark() ? 'sun' : 'moon'" [size]="20"></lucide-icon>
          </button>
        </div>
      </header>

      <!-- Sidebar -->
      <aside 
        id="docs-sidebar"
        class="docs-sidebar" 
        role="navigation" 
        aria-label="Documentation navigation"
      >
        <div class="sidebar-header">
          <a routerLink="/docs" class="sidebar-logo">
            <span>OSI Cards</span>
            <span class="version">v2.0</span>
          </a>
          <button 
            class="close-btn" 
            (click)="closeSidebar()" 
            aria-label="Close navigation"
          >
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>
        
        <!-- B34: Command Palette Search with Live Results -->
        <div class="sidebar-search" [class.has-results]="searchResults().length > 0 && searchQuery().length > 0">
          <lucide-icon name="search" [size]="16" class="search-icon"></lucide-icon>
          <input 
            type="text" 
            placeholder="Search docs..." 
            class="search-input"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            (keydown)="onSearchKeydown($event)"
            (blur)="onSearchBlur($event)"
            aria-label="Search documentation"
            autocomplete="off"
          />
          <kbd class="search-kbd">⌘K</kbd>
          
          <!-- Search Results Dropdown -->
          @if (searchQuery().length > 0 && showSearchResults()) {
            <div class="search-results">
              @if (searchResults().length > 0) {
                @for (result of searchResults(); track result.path; let i = $index) {
                  <a 
                    [routerLink]="result.path"
                    class="search-result-item"
                    [class.highlighted]="highlightedIndex() === i"
                    (click)="selectSearchResult(result)"
                    (mouseenter)="highlightedIndex.set(i)"
                  >
                    <div class="result-header">
                      <lucide-icon [name]="result.icon || 'file-text'" [size]="14"></lucide-icon>
                      <span class="result-title">{{ result.title }}</span>
                    </div>
                    @if (result.category) {
                      <span class="result-category">{{ result.category }}</span>
                    }
                    @if (result.snippet) {
                      <p class="result-snippet">{{ result.snippet }}</p>
                    }
                  </a>
                }
              } @else if (searchQuery().length > 1) {
                <div class="search-no-results">
                  <lucide-icon name="search-x" [size]="24"></lucide-icon>
                  <span>No results found for "{{ searchQuery() }}"</span>
                </div>
              }
            </div>
          }
        </div>
        
        <nav class="sidebar-nav" #sidebarNav appPrefetchContainer>
          @for (section of filteredDocSections(); track section.path) {
            <div class="nav-section">
              @if (section.children && section.children.length > 0) {
                <!-- B31: Collapsible Sidebar Groups -->
                <button 
                  class="nav-section-header" 
                  (click)="toggleSection(section.path)"
                  [class.expanded]="expandedSections().has(section.path)"
                  [attr.aria-expanded]="expandedSections().has(section.path)"
                  [attr.aria-controls]="'section-' + section.path"
                >
                  @if (section.icon) {
                    <lucide-icon [name]="section.icon" [size]="14"></lucide-icon>
                  }
                  <span>{{ section.title }}</span>
                  <lucide-icon 
                    name="chevron-right" 
                    [size]="14"
                    class="chevron">
                  </lucide-icon>
                </button>
                @if (expandedSections().has(section.path)) {
                  <div 
                    [id]="'section-' + section.path"
                    class="nav-section-items"
                    role="group"
                    [attr.aria-label]="section.title + ' pages'"
                  >
                    @for (child of section.children; track child.path; let i = $index) {
                      <a 
                        [routerLink]="['/docs', section.path, child.path]" 
                        routerLinkActive="active"
                        class="nav-item"
                        (click)="onNavItemClick(section.path, child.path)"
                        [attr.data-index]="i"
                      >
                        {{ child.title }}
                      </a>
                    }
                  </div>
                }
              } @else {
                <a 
                  [routerLink]="['/docs', section.path]" 
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="nav-item top-level"
                  (click)="onNavItemClick(section.path)"
                >
                  @if (section.icon) {
                    <lucide-icon [name]="section.icon" [size]="14"></lucide-icon>
                  }
                  {{ section.title }}
                </a>
              }
            </div>
          }
        </nav>
        
        <!-- Sidebar footer -->
        <div class="sidebar-footer">
          <a 
            routerLink="/"
            class="footer-link return-home"
          >
            <lucide-icon name="arrow-left" [size]="16"></lucide-icon>
            <span>Return to OSI Cards</span>
          </a>
        </div>
        <div class="sidebar-footer-links">
          <a 
            href="https://github.com/Inutilepat83/OSI-Cards" 
            target="_blank" 
            rel="noopener noreferrer"
            class="footer-link"
          >
            <lucide-icon name="github" [size]="16"></lucide-icon>
            <span>GitHub</span>
          </a>
          <a 
            href="https://www.npmjs.com/package/osi-cards-lib" 
            target="_blank" 
            rel="noopener noreferrer"
            class="footer-link"
          >
            <lucide-icon name="package" [size]="16"></lucide-icon>
            <span>npm</span>
          </a>
        </div>
      </aside>

      <!-- Backdrop for mobile -->
      <div 
        class="sidebar-backdrop" 
        (click)="closeSidebar()"
        [attr.aria-hidden]="true"
      ></div>

      <!-- Main content -->
      <main id="main-content" class="docs-content" role="main">
        <router-outlet></router-outlet>
      </main>
      
      <!-- B28: Back to Top Button -->
      <button 
        class="back-to-top"
        [class.visible]="showBackToTop()"
        (click)="scrollToTop()"
        aria-label="Scroll to top"
        [attr.aria-hidden]="!showBackToTop()"
      >
        <lucide-icon name="arrow-up" [size]="20"></lucide-icon>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsWrapperComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private el = inject(ElementRef);
  private destroy$ = new Subject<void>();

  // State signals
  sidebarOpen = signal(false);
  isDark = signal(false);
  searchQuery = signal('');
  showBackToTop = signal(false);
  readingProgress = signal(0);
  announcement = signal('');
  expandedSections = signal<Set<string>>(new Set(['getting-started', 'section-types', 'schemas']));
  searchResults = signal<SearchResult[]>([]);
  showSearchResults = signal(false);
  highlightedIndex = signal(0);

  // B29: Sidebar scroll position memory
  private sidebarScrollPositions = new Map<string, number>();

  private allDocSections: DocRoute[] = [
    { path: 'getting-started', title: 'Getting Started', icon: 'rocket' },
    { path: 'installation', title: 'Installation', icon: 'download' },
    { path: 'best-practices', title: 'Best Practices', icon: 'check-circle' },
    { path: 'library-usage', title: 'Library Usage', icon: 'book-open' },
    { path: 'llm-integration', title: 'LLM Integration', icon: 'brain' },
    {
      path: 'section-types',
      title: 'Section Types',
      icon: 'layout-grid',
      children: [
        { path: 'info', title: 'Info' },
        { path: 'analytics', title: 'Analytics' },
        { path: 'contact-card', title: 'Contact Card' },
        { path: 'network-card', title: 'Network Card' },
        { path: 'map', title: 'Map' },
        { path: 'financials', title: 'Financials' },
        { path: 'event', title: 'Event' },
        { path: 'list', title: 'List' },
        { path: 'chart', title: 'Chart' },
        { path: 'product', title: 'Product' },
        { path: 'solutions', title: 'Solutions' },
        { path: 'overview', title: 'Overview' },
        { path: 'quotation', title: 'Quotation' },
        { path: 'text-reference', title: 'Text Reference' },
        { path: 'brand-colors', title: 'Brand Colors' },
        { path: 'news', title: 'News' },
        { path: 'social-media', title: 'Social Media' },
        { path: 'base', title: 'Base (Fallback)' },
      ]
    },
    {
      path: 'schemas',
      title: 'Schemas',
      icon: 'file-json',
      children: [
        { path: 'ai-card-config', title: 'AICardConfig' },
        { path: 'card-section', title: 'CardSection' },
        { path: 'card-field', title: 'CardField' },
        { path: 'card-item', title: 'CardItem' },
        { path: 'card-action', title: 'CardAction' },
        { path: 'email-config', title: 'EmailConfig' },
        { path: 'type-aliases', title: 'Type Aliases' },
      ]
    },
    {
      path: 'streaming',
      title: 'Streaming',
      icon: 'radio',
      children: [
        { path: 'overview', title: 'Overview' },
        { path: 'config', title: 'Configuration' },
        { path: 'state', title: 'State Management' },
        { path: 'card-updates', title: 'Card Updates' },
        { path: 'progressive-rendering', title: 'Progressive Rendering' },
        { path: 'lifecycle', title: 'Lifecycle Hooks' },
        { path: 'error-handling', title: 'Error Handling' },
      ]
    },
    {
      path: 'services',
      title: 'Services',
      icon: 'cog',
      children: [
        { path: 'streaming-service', title: 'Streaming Service' },
        { path: 'event-middleware-service', title: 'Event Middleware' },
        { path: 'section-plugin-registry', title: 'Section Plugin Registry' },
        { path: 'theme-service', title: 'Theme Service' },
        { path: 'animation-orchestrator', title: 'Animation Orchestrator' },
        { path: 'icon-service', title: 'Icon Service' },
        { path: 'magnetic-tilt-service', title: 'Magnetic Tilt' },
        { path: 'section-normalization', title: 'Section Normalization' },
        { path: 'layout-worker-service', title: 'Layout Worker' },
        { path: 'section-utils-service', title: 'Section Utils' },
      ]
    },
    {
      path: 'components',
      title: 'Components',
      icon: 'box',
      children: [
        { path: 'ai-card-renderer', title: 'AICardRenderer' },
        { path: 'section-renderer', title: 'SectionRenderer' },
        { path: 'masonry-grid', title: 'MasonryGrid' },
        { path: 'card-skeleton', title: 'CardSkeleton' },
        { path: 'card-streaming-indicator', title: 'StreamingIndicator' },
        { path: 'card-actions', title: 'CardActions' },
        { path: 'card-header', title: 'CardHeader' },
        { path: 'card-preview', title: 'CardPreview' },
        { path: 'osi-cards', title: 'OSICards' },
        { path: 'osi-cards-container', title: 'OSICardsContainer' },
      ]
    },
    {
      path: 'integration',
      title: 'Integration',
      icon: 'plug',
      children: [
        { path: 'quick-start', title: 'Quick Start' },
        { path: 'npm-installation', title: 'npm Installation' },
        { path: 'angular-18', title: 'Angular 18' },
        { path: 'angular-20', title: 'Angular 20' },
        { path: 'standalone-components', title: 'Standalone Components' },
        { path: 'module-based', title: 'Module-based' },
        { path: 'lazy-loading', title: 'Lazy Loading' },
        { path: 'ssr', title: 'SSR' },
        { path: 'pwa', title: 'PWA' },
        { path: 'dependencies', title: 'Dependencies' },
        { path: 'llm-overview', title: 'LLM Overview' },
        { path: 'prompt-engineering', title: 'Prompt Engineering' },
        { path: 'card-generation-prompt', title: 'Card Generation' },
        { path: 'streaming-responses', title: 'Streaming Responses' },
        { path: 'websocket-integration', title: 'WebSocket' },
        { path: 'agent-systems', title: 'Agent Systems' },
        { path: 'error-recovery', title: 'Error Recovery' },
        { path: 'rate-limiting', title: 'Rate Limiting' },
        { path: 'card-validation', title: 'Card Validation' },
        { path: 'json-schema-llm', title: 'JSON Schema for LLMs' },
      ]
    },
    {
      path: 'advanced',
      title: 'Advanced Topics',
      icon: 'graduation-cap',
      children: [
        { path: 'theming-overview', title: 'Theming Overview' },
        { path: 'css-properties', title: 'CSS Properties' },
        { path: 'theme-presets', title: 'Theme Presets' },
        { path: 'custom-sections', title: 'Custom Sections' },
        { path: 'event-middleware', title: 'Event Middleware' },
        { path: 'performance', title: 'Performance' },
        { path: 'accessibility', title: 'Accessibility' },
        { path: 'i18n', title: 'Internationalization' },
        { path: 'security', title: 'Security' },
        { path: 'error-patterns', title: 'Error Patterns' },
      ]
    },
    {
      path: 'utilities',
      title: 'Utilities',
      icon: 'wrench',
      children: [
        { path: 'card-utils', title: 'Card Utils' },
        { path: 'card-type-guards', title: 'Type Guards' },
        { path: 'resolve-section-type', title: 'resolveSectionType' },
        { path: 'is-valid-section-type', title: 'isValidSectionType' },
        { path: 'ensure-card-ids', title: 'ensureCardIds' },
        { path: 'sanitize-card-config', title: 'sanitizeCardConfig' },
      ]
    },
    {
      path: 'library-docs',
      title: 'Library Reference',
      icon: 'library',
      children: [
        { path: 'agentic-flow', title: 'Agentic Flow' },
        { path: 'services', title: 'Services API' },
        { path: 'events', title: 'Events API' },
        { path: 'theming', title: 'Theming API' },
      ]
    },
  ];

  filteredDocSections = signal<DocRoute[]>(this.allDocSections);

  // B33: Keyboard Shortcuts
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // Cmd/Ctrl + K: Open search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.openCommandPalette();
      return;
    }
    
    // / : Focus search (when not in input)
    if (event.key === '/' && !this.isInputFocused()) {
      event.preventDefault();
      this.focusSearch();
      return;
    }
    
    // Escape: Close sidebar or search
    if (event.key === 'Escape') {
      if (this.sidebarOpen()) {
        this.closeSidebar();
      }
      return;
    }
  }

  ngOnInit() {
    // Check initial theme
    this.isDark.set(
      document.documentElement.classList.contains('dark') || 
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    );
    
    // B40: Setup reading progress tracking
    if (typeof window !== 'undefined') {
      fromEvent(window, 'scroll')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateReadingProgress();
          this.updateBackToTopVisibility();
        });
    }
    
    // Auto-expand section based on current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.urlAfterRedirects),
      takeUntil(this.destroy$)
    ).subscribe(url => {
      const parts = url.split('/').filter(p => p && p !== 'docs');
      const firstPart = parts[0];
      if (parts.length > 0 && firstPart) {
        this.expandedSections.update(set => {
          const newSet = new Set(set);
          newSet.add(firstPart);
          return newSet;
        });
      }
      
      // Scroll to top on navigation
      window.scrollTo({ top: 0 });
      this.readingProgress.set(0);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // B40: Update reading progress
  private updateReadingProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;
    const progress = docHeight > 0 ? (scrolled / docHeight) * 100 : 0;
    this.readingProgress.set(Math.min(100, Math.max(0, progress)));
  }

  // B28: Update back to top visibility
  private updateBackToTopVisibility() {
    this.showBackToTop.set(window.scrollY > 400);
  }

  // B28: Scroll to top
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.announce('Scrolled to top');
  }

  // B34: Command palette / search
  openCommandPalette() {
    this.focusSearch();
    this.announce('Search opened');
  }

  focusSearch() {
    const searchInput = this.el.nativeElement.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.filterDocSections(value);
    this.generateSearchResults(value);
    this.showSearchResults.set(true);
    this.highlightedIndex.set(0);
  }

  onSearchKeydown(event: KeyboardEvent) {
    const results = this.searchResults();
    
    if (event.key === 'Escape') {
      this.searchQuery.set('');
      this.filterDocSections('');
      this.searchResults.set([]);
      this.showSearchResults.set(false);
      (event.target as HTMLInputElement).blur();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.highlightedIndex() < results.length - 1) {
        this.highlightedIndex.update(i => i + 1);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.highlightedIndex() > 0) {
        this.highlightedIndex.update(i => i - 1);
      }
    } else if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault();
      const result = results[this.highlightedIndex()];
      if (result) {
        this.selectSearchResult(result);
      }
    }
  }

  onSearchBlur(event: FocusEvent) {
    // Delay hiding to allow click on results
    setTimeout(() => {
      this.showSearchResults.set(false);
    }, 200);
  }

  selectSearchResult(result: SearchResult) {
    this.router.navigate([result.path]);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showSearchResults.set(false);
    this.closeSidebar();
    this.announce(`Navigating to ${result.title}`);
  }

  private generateSearchResults(query: string) {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (normalizedQuery.length < 2) {
      this.searchResults.set([]);
      return;
    }

    const results: SearchResult[] = [];
    
    // Search through all doc sections
    for (const section of this.allDocSections) {
      // Check parent section
      if (section.title.toLowerCase().includes(normalizedQuery)) {
        const childPath = section.children?.length ? `/${section.children[0]?.path || ''}` : '';
        results.push({
          title: section.title,
          path: `/docs/${section.path}${childPath}`,
          category: 'Documentation',
          icon: section.icon
        });
      }
      
      // Check children
      if (section.children) {
        for (const child of section.children) {
          if (child.title.toLowerCase().includes(normalizedQuery)) {
            results.push({
              title: child.title,
              path: `/docs/${section.path}/${child.path}`,
              category: section.title,
              snippet: this.getSnippetForResult(child.title, normalizedQuery),
              icon: section.icon
            });
          }
        }
      }
    }
    
    // Limit results
    this.searchResults.set(results.slice(0, 10));
  }

  private getSnippetForResult(title: string, query: string): string {
    // Generate contextual snippets based on section type
    const snippets: Record<string, string> = {
      'info': 'Display key-value pairs in a clean format...',
      'analytics': 'Display metrics with visual indicators and trends...',
      'contact-card': 'Show contact information with photos and actions...',
      'chart': 'Visualize data with various chart types...',
      'list': 'Display items in organized list format...',
      'product': 'Showcase products with images and details...',
      'event': 'Display event information with dates and locations...',
      'map': 'Show location data with interactive maps...',
      'financials': 'Display financial data and metrics...',
      'news': 'Show news articles and updates...',
      'social-media': 'Display social media profiles and feeds...',
      'quotation': 'Show quotes with attribution...',
      'overview': 'Provide section summaries and highlights...',
      'solutions': 'Present solutions and features...',
      'network-card': 'Display network connections and relationships...',
      'brand-colors': 'Show brand color palettes...',
      'text-reference': 'Display referenced text content...',
      'base': 'Fallback section type for unknown types...',
    };
    
    const key = title.toLowerCase().replace(/ /g, '-');
    return snippets[key] || '';
  }

  private filterDocSections(query: string) {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      this.filteredDocSections.set(this.allDocSections);
      return;
    }

    const filtered = this.allDocSections
      .map(section => {
        const sectionMatches = section.title.toLowerCase().includes(normalizedQuery);
        const matchingChildren = section.children?.filter(child => 
          child.title.toLowerCase().includes(normalizedQuery)
        );

        if (sectionMatches || (matchingChildren && matchingChildren.length > 0)) {
          return {
            ...section,
            children: matchingChildren || section.children
          } as DocRoute;
        }
        return null;
      })
      .filter((section): section is DocRoute => section !== null);

    this.filteredDocSections.set(filtered);
    
    // Expand all matching sections
    if (normalizedQuery) {
      this.expandedSections.set(new Set(filtered.map(s => s.path)));
    }
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return activeElement?.tagName === 'INPUT' || 
           activeElement?.tagName === 'TEXTAREA' ||
           (activeElement as HTMLElement)?.isContentEditable;
  }

  // Navigation handlers
  onNavItemClick(sectionPath: string, childPath?: string) {
    this.closeSidebar();
    this.announce(`Navigating to ${childPath || sectionPath}`);
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
    this.announce(this.sidebarOpen() ? 'Navigation opened' : 'Navigation closed');
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  toggleTheme() {
    this.isDark.update(v => !v);
    
    if (this.isDark()) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    this.announce(this.isDark() ? 'Dark mode enabled' : 'Light mode enabled');
  }

  toggleSection(path: string) {
    this.expandedSections.update(set => {
      const newSet = new Set(set);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }

  // B50: Screen reader announcements
  private announce(message: string) {
    this.announcement.set(message);
    setTimeout(() => this.announcement.set(''), 1000);
  }
}
