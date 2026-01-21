import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  DestroyRef,
  EventEmitter,
  inject,
  Injector,
  Input,
  isDevMode,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { CardAction, CardField, CardItem, CardSection } from '../../models';
import { isValidSectionType, resolveSectionType, SectionTypeInput } from '../../models';
import { LoggerService, SectionPluginRegistry } from '../../services';
import { sendDebugLog } from '../../utils/debug-log.util';
import { sendDebugLogToFile } from '../../utils/debug-log-file.util';
import { LOG_TAGS } from '../../utils';
import { BaseSectionComponent, SectionInteraction } from '../sections/base-section.component';
import { DynamicSectionLoaderService } from './dynamic-section-loader.service';
import { LazySectionLoaderService, LazySectionType } from './lazy-section-loader.service';
import { LazySectionPlaceholderComponent } from './lazy-section-placeholder.component';

/**
 * Interface for sections with custom field interaction output
 * Used by OverviewSectionComponent
 */
interface OverviewSectionComponentLike extends BaseSectionComponent {
  overviewFieldInteraction?: Observable<{ field: CardField; sectionTitle?: string }>;
}

export interface SectionRenderEvent {
  type: 'field' | 'item' | 'action';
  section: CardSection;
  field?: CardField;
  item?: CardItem | CardField;
  action?: CardAction;
  metadata?: Record<string, unknown>;
}

/**
 * Dynamic Section Renderer Component
 *
 * This component dynamically loads and renders section components based on
 * the section type. It replaces the previous switch-statement approach with
 * a registry-based dynamic component resolution system.
 *
 * Features:
 * - Dynamic component loading via ViewContainerRef
 * - Type alias resolution (e.g., 'metrics' -> 'analytics')
 * - Plugin component support
 * - Automatic fallback for unknown types
 * - Component caching for performance
 */
@Component({
  selector: 'app-section-renderer',
  standalone: true,
  imports: [CommonModule, LazySectionPlaceholderComponent],
  template: `
    <!-- Lazy loading placeholder -->
    @if (isLazyLoading) {
      <app-lazy-section-placeholder
        [sectionType]="lazyType"
        [isLoading]="true"
        [error]="lazyLoadError"
        (retry)="retryLazyLoad()"
      >
      </app-lazy-section-placeholder>
    }

    <!-- Dynamic component container -->
    <ng-container #container></ng-container>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SectionRendererComponent implements OnInit, AfterViewInit, OnChanges {
  @Input({ required: true }) section!: CardSection;
  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();

  // Use static: false for *ngFor-created components - container is only reliably available in ngAfterViewInit
  @ViewChild('container', { read: ViewContainerRef, static: false })
  private container!: ViewContainerRef;

  // Retry mechanism for component loading if container isn't ready initially
  private loadRetryAttempts = 0;
  private readonly MAX_RETRY_ATTEMPTS = 3;

  private readonly loader = inject(DynamicSectionLoaderService);
  private readonly lazySectionLoader = inject(LazySectionLoaderService);
  private readonly pluginRegistry = inject(SectionPluginRegistry);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = inject(LoggerService, { optional: true });
  private readonly injector = inject(Injector);

  // Throttle console fallback to prevent excessive logging
  private static consoleFallbackThrottle = new Map<
    string,
    { count: number; lastReset: number; skipped: number }
  >();
  private static readonly CONSOLE_FALLBACK_THROTTLE_WINDOW_MS = 1000;
  private static readonly CONSOLE_FALLBACK_MAX_LOGS_PER_WINDOW = 10; // Max 10 logs per second for fallback

  /**
   * Check if console fallback logging should be allowed (throttled)
   */
  private static shouldLogToConsoleFallback(level: string): boolean {
    // Never throttle errors
    if (level === 'error') {
      return true;
    }

    const now = Date.now();
    const throttle = this.consoleFallbackThrottle.get(level) || {
      count: 0,
      lastReset: now,
      skipped: 0,
    };

    // Reset counter if window expired
    if (now - throttle.lastReset >= this.CONSOLE_FALLBACK_THROTTLE_WINDOW_MS) {
      // Log warning if we skipped many logs
      if (throttle.skipped > 0) {
        console.warn(
          `[SectionRenderer] Throttled ${throttle.skipped} ${level} logs in the last ${this.CONSOLE_FALLBACK_THROTTLE_WINDOW_MS}ms to prevent console flooding`
        );
      }
      throttle.count = 0;
      throttle.lastReset = now;
      throttle.skipped = 0;
    }

    // Check if we've exceeded the limit
    if (throttle.count >= this.CONSOLE_FALLBACK_MAX_LOGS_PER_WINDOW) {
      throttle.skipped++;
      this.consoleFallbackThrottle.set(level, throttle);
      return false; // Throttled
    }

    // Allow logging and increment counter
    throttle.count++;
    this.consoleFallbackThrottle.set(level, throttle);
    return true;
  }

  /**
   * Safe logger helper - handles cases where logger might not be available
   * (e.g., when injection context is not available)
   * CRITICAL FIX: Added throttling and deduplication to prevent 100k+ logs and repeated messages
   */
  private safeLog(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any,
    tags?: string[]
  ): void {
    // Static deduplication map shared across ALL SectionRendererComponent instances
    // This prevents the same message from being logged multiple times across different component instances
    if (!(SectionRendererComponent as any).__messageDedupMap) {
      (SectionRendererComponent as any).__messageDedupMap = new Map<
        string,
        { lastLogged: number; count: number }
      >();
    }
    const dedupMap = (SectionRendererComponent as any).__messageDedupMap;

    const messageKey = `${level}|SectionRenderer|${message}`;
    const now = Date.now();
    const DEDUP_WINDOW_MS = 5000; // 5 seconds - same message only once per 5 seconds

    const entry = dedupMap.get(messageKey);

    if (!entry) {
      // First time seeing this message - allow it
      dedupMap.set(messageKey, { lastLogged: now, count: 0 });
    } else {
      const timeSinceLastLog = now - entry.lastLogged;

      if (timeSinceLastLog < DEDUP_WINDOW_MS) {
        // Message was logged recently - suppress it and increment count
        entry.count++;
        entry.lastLogged = now; // Update last seen time
        return; // Suppress duplicate
      } else {
        // Enough time has passed - allow logging again, show suppressed count if any
        if (entry.count > 0) {
          // Message was suppressed before - add count to message
          message = `${message} (${entry.count} similar messages suppressed)`;
        }
        dedupMap.set(messageKey, { lastLogged: now, count: 0 });
      }
    }

    // Clean up old entries periodically to prevent memory leaks
    if (dedupMap.size > 200) {
      for (const [key, entry] of dedupMap.entries()) {
        if (now - entry.lastLogged > DEDUP_WINDOW_MS * 2) {
          dedupMap.delete(key);
        }
      }
    }

    if (this.logger) {
      switch (level) {
        case 'debug':
          this.logger.debug(message, data, tags);
          break;
        case 'info':
          this.logger.info(message, data, tags);
          break;
        case 'warn':
          this.logger.warn(message, data, tags);
          break;
        case 'error':
          // error() method signature: error(message: string, context?: Record<string, any>, error?: Error, tags?: string[])
          // Extract Error from data if present, otherwise use data as context
          const error = data instanceof Error ? data : undefined;
          const context = data instanceof Error ? undefined : data;
          this.logger.error(message, context, error, tags);
          break;
      }
    } else {
      // Fallback to console if logger is not available - BUT THROTTLED to prevent 100k+ logs
      if (!SectionRendererComponent.shouldLogToConsoleFallback(level)) {
        return; // Skip if throttled
      }
      const logMethod =
        level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      logMethod(`[SectionRenderer] ${message}`, data || '');
    }
  }

  private currentComponentRef: ComponentRef<BaseSectionComponent> | null = null;
  private currentType: string | null = null;
  private hasInitialized = false;
  private isLoadingComponent = false; // Guard to prevent concurrent loadComponent() calls

  /** Lazy loading state */
  protected isLazyLoading = false;
  protected lazyLoadError: Error | null = null;
  protected lazyType: LazySectionType = 'chart';

  // Note: Theme is handled via CSS (data-theme attribute on host element)
  // Section components receive theme styling through Shadow DOM selectors
  // This input is kept for backward compatibility but is not used
  @Input() theme?: string;

  /**
   * Retry loading a failed lazy section
   */
  public retryLazyLoad(): void {
    if (this.lazyType) {
      this.lazyLoadError = null;
      const loadPromise = this.lazySectionLoader.retryLoad(this.lazyType);
      this.startLazyLoad(this.lazyType, loadPromise);
    }
  }

  ngOnInit(): void {
    try {
      // Input validation: validate section structure
      this.validateSectionInput();

      // With static: false, container is NOT available in ngOnInit for *ngFor-created components
      // We must wait for ngAfterViewInit. Just prepare for initialization.
      // With static: false, container won't be available here
      // Just verify we have a section - ngAfterViewInit will handle loading
      if (!this.section && isDevMode()) {
        // Use console.warn directly instead of safeLog to avoid potential injection context issues
        console.warn('[SectionRenderer] No section available in ngOnInit');
      }
    } catch (error: any) {
      // Handle NG0203 or other injection context errors gracefully
      // NG0203 errors can occur when injection context is not available in child components
      if (error?.code === 'NG0203' || error?.code === -203 || error?.message?.includes('NG0203')) {
        // Silently handle - this is expected in some contexts (e.g., *ngFor-created components)
        // ngAfterViewInit will handle initialization properly
        if (isDevMode()) {
          console.debug(
            '[SectionRenderer] Injection context not available in ngOnInit, will retry in ngAfterViewInit'
          );
        }
        // Don't re-throw - continue execution
        return;
      } else {
        // Re-throw other errors only in development
        if (isDevMode()) {
          console.error('[SectionRenderer] Error in ngOnInit:', error);
        }
        // In production, silently continue - ngAfterViewInit will handle initialization
      }
    }
  }

  /**
   * Validate section input
   * Ensures section has required properties and valid structure
   */
  private validateSectionInput(): void {
    if (!this.section) {
      if (isDevMode()) {
        console.warn('[SectionRenderer] Section input is required but was not provided');
      }
      return;
    }

    // Validate section is an object
    if (typeof this.section !== 'object' || Array.isArray(this.section)) {
      if (isDevMode()) {
        console.warn(
          '[SectionRenderer] Invalid section: must be an object, received:',
          typeof this.section
        );
      }
      return;
    }

    // Validate section has type
    if (!this.section.type || typeof this.section.type !== 'string') {
      if (isDevMode()) {
        console.warn('[SectionRenderer] Invalid section: missing or invalid type property');
      }
    }

    // Validate sections array if present
    if (this.section.fields && !Array.isArray(this.section.fields)) {
      if (isDevMode()) {
        console.warn('[SectionRenderer] Invalid section: fields must be an array');
      }
    }

    if (this.section.items && !Array.isArray(this.section.items)) {
      if (isDevMode()) {
        console.warn('[SectionRenderer] Invalid section: items must be an array');
      }
    }
  }

  ngAfterViewInit(): void {
    // PRIMARY INITIALIZATION POINT: Container is guaranteed to be available here
    // This is especially important for components created via *ngFor where
    // static: true ViewChild might not be ready in ngOnInit

    // Reset retry counter on ngAfterViewInit
    this.loadRetryAttempts = 0;

    // CRITICAL: Always attempt to load if we have section and container but no component yet
    // Verify container is actually functional, not just defined
    if (this.section) {
      if (this.container && this.isContainerReady()) {
        if (!this.currentComponentRef && !this.isLoadingComponent) {
          this.safeLog('info', 'Loading component in ngAfterViewInit (container ready)');
          this.loadComponent();
          this.hasInitialized = true;
          // Force change detection after loading
          this.cdr.markForCheck();
          // Also trigger detectChanges to ensure immediate update
          this.cdr.detectChanges();
        } else if (this.currentComponentRef) {
          this.safeLog('info', 'Component already exists in ngAfterViewInit');
          // Still ensure inputs are updated
          this.updateComponentInput();
          this.cdr.markForCheck();
        } else if (this.isLoadingComponent) {
          this.safeLog('info', 'Component is already loading, waiting...');
        }
      } else {
        // Container not ready - use retry mechanism
        if (isDevMode()) {
          console.warn(
            '[SectionRenderer] Container not ready in ngAfterViewInit, scheduling retry',
            {
              hasContainer: !!this.container,
              isContainerReady: this.container ? this.isContainerReady() : false,
            }
          );
        }
        this.scheduleLoadRetry();
      }
    } else {
      if (isDevMode()) {
        console.warn('[SectionRenderer] Section not available in ngAfterViewInit');
      }
    }
  }

  /**
   * Check if container is actually ready to create components
   * Simplified check - if container exists and has injector, assume it's ready
   * The actual createComponent call will handle any real errors
   */
  private isContainerReady(): boolean {
    if (!this.container) {
      return false;
    }

    // Simple check: if container has injector, it's ready
    // ViewContainerRef should always have injector when properly initialized
    try {
      const isReady = !!this.container.injector;
      if (!isReady && isDevMode()) {
        console.warn('[SectionRenderer] Container lacks injector, may not be ready');
      }
      return isReady;
    } catch (error) {
      if (isDevMode()) {
        console.warn('[SectionRenderer] Error checking container readiness, assuming ready', error);
      }
      // Optimistic: if check fails, assume ready and let createComponent handle any errors
      return true;
    }
  }

  /**
   * Schedule a retry of component loading if container wasn't ready
   */
  private scheduleLoadRetry(): void {
    if (this.loadRetryAttempts >= this.MAX_RETRY_ATTEMPTS) {
      console.error('[SectionRenderer] Max retry attempts reached, giving up', {
        sectionType: this.section?.type,
        sectionTitle: this.section?.title,
      });
      return;
    }

    this.loadRetryAttempts++;
    const delay = 50 * this.loadRetryAttempts; // Exponential backoff: 50ms, 100ms, 150ms

    console.log('[SectionRenderer] Scheduling load retry', {
      attempt: this.loadRetryAttempts,
      maxAttempts: this.MAX_RETRY_ATTEMPTS,
      delay,
      sectionType: this.section?.type,
    });

    setTimeout(() => {
      if (
        this.section &&
        this.container &&
        this.isContainerReady() &&
        !this.currentComponentRef &&
        !this.isLoadingComponent
      ) {
        console.log('[SectionRenderer] Retrying loadComponent after delay', {
          attempt: this.loadRetryAttempts,
          hasContainer: !!this.container,
          isContainerReady: this.isContainerReady(),
        });
        this.loadComponent();
        this.hasInitialized = true;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      } else if (this.loadRetryAttempts < this.MAX_RETRY_ATTEMPTS) {
        // Retry again if container still not ready
        console.log('[SectionRenderer] Container still not ready, scheduling another retry');
        this.scheduleLoadRetry();
      }
    }, delay);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section'] && this.section) {
      const sectionChange = changes['section'];
      const isFirstChange = sectionChange.isFirstChange();

      this.safeLog(
        'debug',
        'SectionRenderer: Section changed',
        {
          sectionType: this.section?.type,
          sectionTitle: this.section?.title,
          hasFields: !!this.section?.fields?.length,
          hasItems: !!this.section?.items?.length,
          fieldsCount: this.section?.fields?.length || 0,
          itemsCount: this.section?.items?.length || 0,
          sectionId: this.section?.id,
          isFirstChange,
          hasInitialized: this.hasInitialized,
          hasContainer: !!this.container,
          hasCurrentComponent: !!this.currentComponentRef,
        },
        [LOG_TAGS.SECTION_RENDERER, LOG_TAGS.RENDERING]
      );

      // With static: false, container won't be available in ngOnChanges if it fires before ngAfterViewInit
      // For first change: just mark that we've received the section, ngAfterViewInit will load
      // For subsequent changes: reload if container is available and component exists
      if (isFirstChange) {
        // Don't try to load here with static: false - container won't be ready
        // ngAfterViewInit will handle it
      } else {
        // Subsequent changes: reload to update the component
        if (this.container && this.isContainerReady() && !this.isLoadingComponent) {
          console.log(
            '[SectionRenderer] Reloading component in ngOnChanges (section changed, container ready)'
          );
          this.loadComponent();
          this.cdr.markForCheck();
        } else if (!this.container) {
          if (isDevMode()) {
            console.warn(
              '[SectionRenderer] ngOnChanges: Section changed but container not available yet',
              {
                sectionType: this.section?.type,
                note: 'This should not happen after ngAfterViewInit - container should be available',
              }
            );
          }
        }
      }
    }
  }

  /**
   * Load the appropriate component for the current section
   * Handles both sync and lazy-loaded components
   */
  private loadComponent(): void {
    // Guard: Prevent concurrent calls to loadComponent() from multiple lifecycle hooks
    if (this.isLoadingComponent) {
      this.safeLog('debug', 'loadComponent: Already loading, skipping duplicate call', undefined, [
        LOG_TAGS.SECTION_RENDERER,
        LOG_TAGS.RENDERING,
      ]);
      return;
    }

    if (!this.section) {
      if (isDevMode()) {
        console.warn('[SectionRenderer] loadComponent: No section provided');
      }
      this.safeLog('warn', 'No section provided, clearing component', undefined, [
        LOG_TAGS.SECTION_RENDERER,
        LOG_TAGS.RENDERING,
      ]);
      this.clearComponent();
      return; // Guard was never set, so no need to reset
    }

    // CRITICAL: Verify container is actually available and ready
    if (!this.container) {
      console.error('[SectionRenderer] loadComponent: Container not available!', {
        sectionType: this.section.type,
        sectionTitle: this.section.title,
      });
      this.safeLog(
        'error',
        'loadComponent: Container not available',
        {
          sectionType: this.section.type,
        },
        [LOG_TAGS.SECTION_RENDERER, LOG_TAGS.RENDERING]
      );
      return; // Can't proceed without container
    }

    // Verify container is functional
    if (!this.isContainerReady()) {
      if (isDevMode()) {
        console.warn('[SectionRenderer] loadComponent: Container not ready, will retry', {
          sectionType: this.section.type,
          hasContainer: !!this.container,
        });
      }
      // Don't set loading flag - allow retry
      this.scheduleLoadRetry();
      return;
    }

    this.isLoadingComponent = true;

    try {
      const sectionType = this.section.type?.toLowerCase() || 'overview';
      const resolvedType = this.loader.resolveType(sectionType);

      this.safeLog(
        'debug',
        'loadComponent',
        {
          sectionType,
          resolvedType,
          currentType: this.currentType,
          hasCurrentComponent: !!this.currentComponentRef,
          containerLength: this.container.length,
        },
        [LOG_TAGS.SECTION_RENDERER, LOG_TAGS.RENDERING]
      );

      // Recreate component if type changed OR if component doesn't exist
      // This handles cases where component creation failed previously
      if (this.currentType !== resolvedType || !this.currentComponentRef) {
        if (this.currentType !== resolvedType) {
          this.clearComponent();
        }

        // Check if this is a lazy-loaded section
        const resolution = this.loader.resolveComponent(this.section);

        this.safeLog('debug', 'Component resolution', {
          isLazy: resolution.isLazy,
          hasComponent: !!resolution.component,
          hasLoadPromise: !!resolution.loadPromise,
          currentType: this.currentType,
          resolvedType,
          hasCurrentComponent: !!this.currentComponentRef,
        });

        if (resolution.isLazy && !resolution.component && resolution.loadPromise) {
          // Start lazy loading (async - will complete later)
          this.safeLog('info', 'Starting lazy load', { resolvedType }, [
            LOG_TAGS.SECTION_RENDERER,
            LOG_TAGS.RENDERING,
          ]);
          // Don't reset isLoadingComponent here - it's async, will be reset when done
          // The finally block will reset it, but that's okay since lazy loading uses isLazyLoading flag
          this.startLazyLoad(resolvedType as LazySectionType, resolution.loadPromise);
          this.currentType = resolvedType; // Set type before exiting
          return; // Exit early - lazy loading will complete asynchronously
        } else if (resolution.component) {
          // Sync component available - create immediately
          this.safeLog('debug', 'Creating sync component', {
            componentName: resolution.component.name || 'Unknown',
          });
          this.createComponentFromClass(resolution.component);
        } else {
          // CRITICAL: Always render a component instead of leaving empty
          if (isDevMode()) {
            console.warn(
              '[SectionRenderer] No component found for section type, trying fallbacks',
              {
                resolvedType,
                sectionType: this.section?.type,
                sectionTitle: this.section?.title,
              }
            );
          }
          this.safeLog(
            'warn',
            'No component found for section type, using list section',
            {
              resolvedType,
              sectionType: this.section?.type,
              sectionTitle: this.section?.title,
            },
            [LOG_TAGS.SECTION_RENDERER, LOG_TAGS.RENDERING]
          );

          // Try multiple fallback strategies
          const fallbackTypes = ['list', 'overview', 'text'];
          let fallbackCreated = false;

          for (const fallbackType of fallbackTypes) {
            const fallbackResolution = this.loader.resolveComponent({
              ...this.section,
              type: fallbackType,
            } as CardSection);

            if (fallbackResolution.component) {
              console.log('[SectionRenderer] Using fallback component type', {
                fallbackType,
                originalType: resolvedType,
              });
              this.createComponentFromClass(fallbackResolution.component);
              fallbackCreated = true;
              break;
            }
          }

          if (!fallbackCreated) {
            // Last resort: log error but ensure loading flag is reset for retry
            console.error(
              '[SectionRenderer] CRITICAL: No component available, all fallbacks failed',
              {
                resolvedType,
                sectionType: this.section?.type,
                sectionTitle: this.section?.title,
                triedFallbacks: fallbackTypes,
              }
            );
            this.safeLog('error', 'Even fallback components not available', {
              resolvedType,
              fallbackTypes,
            });
            // Reset loading flag so retry can happen
            this.isLoadingComponent = false;
            // Don't set currentType if we couldn't create anything
            return; // Exit early, flag already reset
          }
        }

        this.currentType = resolvedType;
      } else if (this.currentComponentRef) {
        // Just update the section input (type unchanged and component exists)
        this.safeLog('debug', 'Updating existing component input', undefined, [
          LOG_TAGS.SECTION_RENDERER,
          LOG_TAGS.RENDERING,
        ]);
        this.updateComponentInput();
      } else {
        if (isDevMode()) {
          console.warn(
            '[SectionRenderer] loadComponent: Component type unchanged but no component ref exists',
            {
              resolvedType,
              currentType: this.currentType,
            }
          );
        }
      }
    } catch (error) {
      // Catch any unexpected errors in loadComponent
      console.error('[SectionRenderer] ERROR in loadComponent', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sectionType: this.section?.type,
        sectionTitle: this.section?.title,
      });
      this.safeLog(
        'error',
        'Error in loadComponent',
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          sectionType: this.section?.type,
          sectionTitle: this.section?.title,
        },
        [LOG_TAGS.SECTION_RENDERER, LOG_TAGS.RENDERING]
      );
    } finally {
      // Always reset loading flag, even if there were errors
      // This allows retry mechanisms to work
      if (!this.isLazyLoading) {
        // Only reset if not lazy loading (lazy loading manages its own state)
        this.isLoadingComponent = false;
      }
    }
  }

  /**
   * Start lazy loading a section component
   * @internal
   */
  protected async startLazyLoad(
    type: LazySectionType,
    loadPromise: Promise<Type<BaseSectionComponent>>
  ): Promise<void> {
    this.isLazyLoading = true;
    this.lazyLoadError = null;
    this.lazyType = type;
    this.cdr.markForCheck();

    try {
      const componentClass = await loadPromise;

      // Check if section type still matches (user might have changed it during load)
      if (
        this.section?.type?.toLowerCase() === type ||
        this.loader.resolveType(this.section?.type ?? '') === type
      ) {
        // #region agent log
        sendDebugLog(
          {
            location: 'section-renderer.component.ts:startLazyLoad',
            message: 'Lazy load completed successfully',
            data: {
              type,
              sectionType: this.section?.type,
              sectionTitle: this.section?.title,
              componentName: (componentClass as any)?.name || 'Unknown',
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'initial',
            hypothesisId: 'D',
          },
          'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc'
        );
        // #endregion
        this.isLazyLoading = false;
        this.createComponentFromClass(componentClass as Type<BaseSectionComponent>);
        this.cdr.markForCheck();
      }
    } catch (error) {
      // #region agent log
      sendDebugLog(
        {
          location: 'section-renderer.component.ts:startLazyLoad',
          message: 'Lazy load ERROR',
          data: {
            type,
            sectionType: this.section?.type,
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'D',
        },
        'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc'
      );
      // #endregion
      this.isLazyLoading = false;
      this.lazyLoadError = error instanceof Error ? error : new Error(String(error));
      this.cdr.markForCheck();
    }
  }

  /**
   * Create the dynamic component
   * @internal Reserved for future use
   */
  private _createComponent(resolvedType: string): void {
    const componentClass = this.loader.getComponentForSection(this.section);

    if (!componentClass) {
      this.safeLog('warn', 'No component found for section type', { resolvedType }, [
        LOG_TAGS.SECTION_RENDERER,
        LOG_TAGS.RENDERING,
      ]);
      return;
    }

    this.createComponentFromClass(componentClass);
  }

  /**
   * Create a component from a component class
   */
  private createComponentFromClass(componentClass: unknown): void {
    const createStart = performance.now();
    if (!componentClass) {
      this.safeLog(
        'warn',
        'createComponentFromClass: componentClass is null/undefined',
        undefined,
        [LOG_TAGS.SECTION_RENDERER, LOG_TAGS.RENDERING]
      );
      return;
    }

    try {
      // #region agent log - write to file
      sendDebugLogToFile({
        location: 'section-renderer.component.ts:createComponentFromClass',
        message: 'Component creation started',
        data: {
          componentName: (componentClass as any)?.name || 'Unknown',
          sectionType: this.section?.type,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'perf-debug',
        hypothesisId: 'I',
      });
      // #endregion

      // CRITICAL: Clear container first to prevent multiple components from being created
      // This prevents triple-rendering when multiple lifecycle hooks call loadComponent()
      if (this.container.length > 0) {
        console.log('[SectionRenderer] Clearing container, length:', this.container.length);
        this.container.clear();
      }

      // Destroy existing component ref if it exists
      if (this.currentComponentRef) {
        console.log('[SectionRenderer] Destroying existing component ref');
        this.currentComponentRef.destroy();
        this.currentComponentRef = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Pass injector to ensure child component has access to injection context
      this.currentComponentRef = this.container.createComponent(componentClass as any, {
        injector: this.injector,
      });
      const instance = this.currentComponentRef.instance;
      const hostElement = this.currentComponentRef.location.nativeElement;

      this.safeLog(
        'info',
        'SectionRenderer: Component created successfully',
        {
          source: 'SectionRendererComponent',
          componentName: (componentClass as any).name || 'Unknown',
          hasInstance: !!instance,
          sectionType: this.section?.type,
          sectionTitle: this.section?.title,
          sectionId: this.section?.id,
          hostElementExists: !!hostElement,
          fieldsCount: this.section?.fields?.length || 0,
          itemsCount: this.section?.items?.length || 0,
        },
        [LOG_TAGS.SECTION_RENDERER, LOG_TAGS.RENDERING]
      );

      // #region agent log
      sendDebugLog(
        {
          location: 'section-renderer.component.ts:createComponentFromClass',
          message: 'Component created successfully',
          data: {
            componentName: (componentClass as any).name || 'Unknown',
            sectionType: this.section?.type,
            sectionTitle: this.section?.title,
            sectionId: this.section?.id,
            hasInstance: !!instance,
            hostElementExists: !!hostElement,
            hostElementHeight: hostElement?.offsetHeight || 0,
            fieldsCount: this.section?.fields?.length || 0,
            itemsCount: this.section?.items?.length || 0,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'A',
        },
        'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc'
      );
      // #endregion

      this.updateComponentInput();
      this.subscribeToComponentEvents();

      // Force change detection on both parent and child to ensure rendering
      this.cdr.markForCheck();

      // Safely access child component's ChangeDetectorRef
      // Wrap in try-catch to handle NG0203 errors (injection context not available)
      try {
        if (this.currentComponentRef?.injector) {
          const childCdr = this.currentComponentRef.injector.get(ChangeDetectorRef, null);
          if (childCdr) {
            childCdr.markForCheck();
            childCdr.detectChanges();
          } else {
            // Fallback: use instance's ChangeDetectorRef if available
            if (instance && (instance as any).cdr) {
              (instance as any).cdr.markForCheck();
            }
          }
        }
      } catch (error) {
        // Handle NG0203 or other injection errors gracefully
        // Component will still render, just without forced change detection
        // NG0203 errors are expected when injection context is not available - suppress logging
        // Silently continue - component will still render via normal change detection
      }

      const createDuration = performance.now() - createStart;
      // #region agent log - write to file, only log slow creations
      if (createDuration > 10) {
        sendDebugLogToFile({
          location: 'section-renderer.component.ts:createComponentFromClass',
          message: 'Component creation completed',
          data: {
            componentName: (componentClass as any)?.name || 'Unknown',
            sectionType: this.section?.type,
            duration: createDuration,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'perf-debug',
          hypothesisId: 'I',
        });
      }
      // #endregion
      // Verify component is actually rendered
      setTimeout(() => {
        const finalHeight = hostElement?.offsetHeight || 0;
        const finalWidth = hostElement?.offsetWidth || 0;
        this.safeLog('info', 'Component creation verification (after timeout)', {
          componentName: (componentClass as any)?.name || 'Unknown',
          sectionType: this.section?.type,
          finalHeight,
          finalWidth,
          hasContent: finalHeight > 0 || finalWidth > 0,
          instanceSectionType: (instance as any)?.section?.type,
          instanceSectionTitle: (instance as any)?.section?.title,
        });

        // If component has no height/width after a delay, it might not be rendering
        if (finalHeight === 0 && finalWidth === 0 && isDevMode()) {
          this.safeLog(
            'warn',
            'WARNING: Created component has no dimensions - may not be rendering',
            {
              componentName: (componentClass as any)?.name || 'Unknown',
              sectionType: this.section?.type,
            }
          );
        }
      }, 100);

      this.safeLog('info', 'Component creation completed successfully', {
        componentName: (componentClass as any)?.name || 'Unknown',
        sectionType: this.section?.type,
        initialHeight: hostElement?.offsetHeight || 0,
      });

      // Reset loading flag after successful creation
      this.isLoadingComponent = false;
    } catch (error) {
      console.error('[SectionRenderer] ERROR creating component', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        componentName: (componentClass as any)?.name || 'Unknown',
        sectionType: this.section?.type,
        sectionTitle: this.section?.title,
      });

      // #region agent log
      sendDebugLog(
        {
          location: 'section-renderer.component.ts:createComponentFromClass',
          message: 'ERROR creating component',
          data: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            componentName: (componentClass as any)?.name || 'Unknown',
            sectionType: this.section?.type,
            sectionTitle: this.section?.title,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'A',
        },
        'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc'
      );
      // #endregion
      this.safeLog(
        'error',
        'Error creating component',
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        [LOG_TAGS.SECTION_RENDERER, LOG_TAGS.RENDERING]
      );
      this.currentComponentRef = null;
      // Reset loading flag on error
      this.isLoadingComponent = false;
    }
  }

  /**
   * Update the section input on the component
   */
  private updateComponentInput(): void {
    if (this.currentComponentRef) {
      const instance = this.currentComponentRef.instance;
      const hostElement = this.currentComponentRef.location.nativeElement;

      this.safeLog(
        'info',
        'SectionRenderer: Updating component inputs',
        {
          source: 'SectionRendererComponent',
          sectionType: this.section?.type,
          sectionTitle: this.section?.title,
          sectionId: this.section?.id,
          hasSection: !!this.section,
          colSpan: this.section?._assignedColSpan,
          orientation: this.section?._assignedOrientation,
          fieldsCount: this.section?.fields?.length || 0,
          itemsCount: this.section?.items?.length || 0,
        },
        [LOG_TAGS.SECTION_RENDERER, LOG_TAGS.RENDERING]
      );

      // #region agent log
      if (
        typeof window !== 'undefined' &&
        localStorage.getItem('__DISABLE_DEBUG_LOGGING') !== 'true' &&
        !(window as any).__DISABLE_DEBUG_LOGGING
      ) {
        sendDebugLog({
          location: 'section-renderer.component.ts:887',
          message: 'updateComponentInput: Before setting section',
          data: {
            sectionType: this.section?.type,
            sectionTitle: this.section?.title,
            fieldsCount: this.section?.fields?.length || 0,
            itemsCount: this.section?.items?.length || 0,
            fields: this.section?.fields,
            componentName: instance?.constructor?.name || 'Unknown',
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H1',
        });
      }
      // #endregion

      this.currentComponentRef.setInput('section', this.section);

      // Pass colSpan if component supports it (from section._assignedColSpan)
      // setInput() is safe to call even if input doesn't exist - Angular handles it gracefully
      if (this.section._assignedColSpan !== undefined) {
        this.currentComponentRef.setInput('colSpan', this.section._assignedColSpan);
      }

      // Pass orientation if component supports it (from section._assignedOrientation)
      if (this.section._assignedOrientation) {
        this.currentComponentRef.setInput('orientation', this.section._assignedOrientation);
      }

      // Verify the input was set
      const instanceSection = (instance as any)?.section;

      // #region agent log
      if (
        typeof window !== 'undefined' &&
        localStorage.getItem('__DISABLE_DEBUG_LOGGING') !== 'true' &&
        !(window as any).__DISABLE_DEBUG_LOGGING
      ) {
        sendDebugLog({
          location: 'section-renderer.component.ts:937',
          message: 'updateComponentInput: After setInput',
          data: {
            sectionType: instanceSection?.type,
            sectionTitle: instanceSection?.title,
            fieldsCount: instanceSection?.fields?.length || 0,
            itemsCount: instanceSection?.items?.length || 0,
            fields: instanceSection?.fields,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H4',
        });
      }
      // #endregion

      // Note: Theme is handled via CSS (data-theme attribute), not as a component input
      // Section components receive theme styling through the Shadow DOM's :host([data-theme]) selectors

      // CRITICAL: Manually trigger change detection on the dynamically created component
      // setInput() should trigger change detection, but for OnPush components created dynamically,
      // we need to explicitly detect changes to ensure the view updates
      // Safely access child component's ChangeDetectorRef with error handling
      let childCdr: ChangeDetectorRef | null = null;
      try {
        if (this.currentComponentRef?.injector) {
          childCdr = this.currentComponentRef.injector.get(ChangeDetectorRef, null);
        }
      } catch (error) {
        // Handle NG0203 or other injection errors gracefully
        // NG0203 errors are expected when injection context is not available - suppress logging
        childCdr = null;
      }

      // #region agent log
      const beforeHeight = hostElement?.offsetHeight || 0;
      sendDebugLog(
        {
          location: 'section-renderer.component.ts:updateComponentInput',
          message: 'Before change detection',
          data: {
            sectionType: this.section?.type,
            sectionTitle: this.section?.title,
            beforeHeight,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'B',
        },
        'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc'
      );
      // #endregion

      // Only call detectChanges if we successfully got the ChangeDetectorRef
      if (childCdr) {
        childCdr.detectChanges();
      } else {
        // Fallback: use instance's ChangeDetectorRef if available
        const instance = this.currentComponentRef?.instance;
        if (instance && (instance as any).cdr) {
          (instance as any).cdr.markForCheck();
        }
      }

      // Also mark this component for check to ensure the section renderer updates
      this.cdr.markForCheck();

      // After change detection, check again
      setTimeout(() => {
        // #region agent log
        const afterHeight = hostElement?.offsetHeight || 0;
        sendDebugLog(
          {
            location: 'section-renderer.component.ts:updateComponentInput',
            message: 'After change detection (setTimeout)',
            data: {
              sectionType: this.section?.type,
              sectionTitle: this.section?.title,
              beforeHeight,
              afterHeight,
              heightChanged: afterHeight !== beforeHeight,
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'initial',
            hypothesisId: 'B',
          },
          'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc'
        );
        // #endregion
        if (hostElement) {
          const afterCheck = {
            hostElementHeight: hostElement.offsetHeight,
            hostElementWidth: hostElement.offsetWidth,
            hostElementDisplay: window.getComputedStyle(hostElement).display,
            hostElementOpacity: window.getComputedStyle(hostElement).opacity,
            hostElementVisibility: window.getComputedStyle(hostElement).visibility,
            hostElementChildren: hostElement.children.length,
            instanceSectionFieldsCount: instance.section?.fields?.length || 0,
          };
          this.safeLog('debug', 'After change detection', afterCheck, [
            LOG_TAGS.SECTION_RENDERER,
            LOG_TAGS.RENDERING,
          ]);
        }
      }, 100);
    } else {
      this.safeLog('warn', 'updateComponentInput: currentComponentRef is null', undefined, [
        LOG_TAGS.SECTION_RENDERER,
        LOG_TAGS.RENDERING,
      ]);
    }
  }

  /**
   * Subscribe to component output events
   */
  private subscribeToComponentEvents(): void {
    if (!this.currentComponentRef) return;

    const instance = this.currentComponentRef.instance;

    // Subscribe to fieldInteraction
    if (instance.fieldInteraction) {
      instance.fieldInteraction
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event: SectionInteraction) => {
          this.emitFieldInteraction(event.field as CardField, event.metadata);
        });
    }

    // Subscribe to itemInteraction
    if (instance.itemInteraction) {
      instance.itemInteraction
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event: SectionInteraction) => {
          this.emitItemInteraction(event.item as CardItem, event.metadata);
        });
    }

    // Handle OverviewSectionComponent's custom output
    const overviewInstance = instance as OverviewSectionComponentLike;
    if (overviewInstance.overviewFieldInteraction) {
      overviewInstance.overviewFieldInteraction
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event: { field: CardField; sectionTitle?: string }) => {
          this.emitFieldInteraction(event.field, { sectionTitle: event.sectionTitle });
        });
    }
  }

  /**
   * Clear the current component
   * @param resetLoadingGuard - If true, also resets the loading guard (used when clearing due to error)
   */
  private clearComponent(resetLoadingGuard = false): void {
    if (this.currentComponentRef) {
      this.currentComponentRef.destroy();
      this.currentComponentRef = null;
    }
    this.container?.clear();
    this.currentType = null;
    this.isLazyLoading = false;
    this.lazyLoadError = null;
    if (resetLoadingGuard) {
      this.isLoadingComponent = false; // Only reset guard when explicitly requested (e.g., on error)
    }
  }

  /**
   * Get the section type attribute for debugging/styling
   */
  get sectionTypeAttribute(): string {
    if (!this.section) return 'unknown';

    try {
      const typeLabel = (this.section.type ?? '').trim().toLowerCase();
      if (isValidSectionType(typeLabel as SectionTypeInput)) {
        return resolveSectionType(typeLabel as SectionTypeInput);
      }
      return typeLabel || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get the section ID attribute
   */
  get sectionIdAttribute(): string | null {
    return this.section?.id ? String(this.section.id) : null;
  }

  /**
   * Check if current section uses a plugin
   */
  get usesPlugin(): boolean {
    if (!this.section?.type) return false;
    return this.pluginRegistry.hasPlugin(this.section.type.toLowerCase());
  }

  /**
   * Get the resolved canonical type
   */
  get resolvedType(): string {
    if (!this.section?.type) return 'overview';
    return this.loader.resolveType(this.section.type);
  }

  // Event emission methods

  emitFieldInteraction(field: CardField | undefined, metadata?: Record<string, unknown>): void {
    if (!field) return;
    this.sectionEvent.emit({
      type: 'field',
      section: this.section,
      field,
      metadata: {
        sectionId: this.section?.id,
        sectionTitle: this.section?.title,
        ...metadata,
      },
    });
  }

  emitItemInteraction(
    item: CardItem | CardField | undefined,
    metadata?: Record<string, unknown>
  ): void {
    if (!item) return;
    this.sectionEvent.emit({
      type: 'item',
      section: this.section,
      item,
      metadata: {
        sectionId: this.section?.id,
        sectionTitle: this.section?.title,
        ...metadata,
      },
    });
  }

  emitActionInteraction(action: CardAction, metadata?: Record<string, unknown>): void {
    this.sectionEvent.emit({
      type: 'action',
      section: this.section,
      action,
      metadata: metadata ?? {},
    });
  }

  /**
   * Handle events from plugin components
   */
  onPluginSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
  }
}
