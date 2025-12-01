import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';
// Import optimized card renderer from app (not library - uses optimized MagneticTiltService)
import { AICardRendererComponent } from '../../../../shared/components/cards/ai-card-renderer.component';

/**
 * Section type definition for gallery
 */
interface SectionTypeDemo {
  type: string;
  name: string;
  description: string;
  icon: string;
  config: Record<string, unknown>;
  variants?: { name: string; config: Record<string, unknown> }[];
}

/**
 * Component Demo Features
 * Implements D13-D20 from the 100-point plan:
 * - D88: Section type gallery
 * - D89: Variant switcher
 * - D90: Props inspector
 * - D91: Responsive preview
 * - D92: State simulation (loading/error/empty)
 * - D93: Animation controls
 * - D94: Theme switcher
 * - D95: Export to Figma (design tokens)
 */
@Component({
  selector: 'app-docs-component-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule, AICardRendererComponent],
  template: `
    <div class="component-demo" [class.dark-preview]="previewTheme() === 'dark'">
      <!-- Toolbar -->
      <div class="demo-toolbar">
        <div class="toolbar-left">
          <span class="demo-title">{{ title || 'Component Demo' }}</span>
          @if (description) {
            <span class="demo-desc">{{ description }}</span>
          }
        </div>

        <div class="toolbar-right">
          <!-- D89: Variant Switcher -->
          @if (variants.length > 1) {
            <select
              class="variant-select"
              [value]="activeVariant()"
              (change)="onVariantChange($event)"
            >
              @for (variant of variants; track variant.name; let i = $index) {
                <option [value]="i">{{ variant.name }}</option>
              }
            </select>
          }

          <!-- D92: State Simulation -->
          <div class="state-buttons">
            <button
              class="state-btn"
              [class.active]="previewState() === 'normal'"
              (click)="setPreviewState('normal')"
              title="Normal state"
            >
              <lucide-icon name="check" [size]="14"></lucide-icon>
            </button>
            <button
              class="state-btn"
              [class.active]="previewState() === 'loading'"
              (click)="setPreviewState('loading')"
              title="Loading state"
            >
              <lucide-icon name="loader-2" [size]="14"></lucide-icon>
            </button>
            <button
              class="state-btn"
              [class.active]="previewState() === 'error'"
              (click)="setPreviewState('error')"
              title="Error state"
            >
              <lucide-icon name="alert-circle" [size]="14"></lucide-icon>
            </button>
            <button
              class="state-btn"
              [class.active]="previewState() === 'empty'"
              (click)="setPreviewState('empty')"
              title="Empty state"
            >
              <lucide-icon name="inbox" [size]="14"></lucide-icon>
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- D91: Responsive Preview -->
          <div class="viewport-buttons">
            <button
              class="viewport-btn"
              [class.active]="viewport() === 'mobile'"
              (click)="setViewport('mobile')"
              title="Mobile view (375px)"
            >
              <lucide-icon name="smartphone" [size]="16"></lucide-icon>
            </button>
            <button
              class="viewport-btn"
              [class.active]="viewport() === 'tablet'"
              (click)="setViewport('tablet')"
              title="Tablet view (768px)"
            >
              <lucide-icon name="tablet" [size]="16"></lucide-icon>
            </button>
            <button
              class="viewport-btn"
              [class.active]="viewport() === 'desktop'"
              (click)="setViewport('desktop')"
              title="Desktop view (100%)"
            >
              <lucide-icon name="monitor" [size]="16"></lucide-icon>
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- D94: Theme Switcher -->
          <button
            class="theme-toggle"
            (click)="togglePreviewTheme()"
            [title]="previewTheme() === 'light' ? 'Dark preview' : 'Light preview'"
          >
            <lucide-icon
              [name]="previewTheme() === 'light' ? 'moon' : 'sun'"
              [size]="16"
            ></lucide-icon>
          </button>

          <!-- D93: Animation Controls -->
          <button
            class="animation-toggle"
            (click)="toggleAnimations()"
            [title]="animationsEnabled() ? 'Disable animations' : 'Enable animations'"
          >
            <lucide-icon [name]="animationsEnabled() ? 'pause' : 'play'" [size]="16"></lucide-icon>
          </button>

          <!-- D95: Export -->
          <button class="export-btn" (click)="exportDesignTokens()" title="Export design tokens">
            <lucide-icon name="download" [size]="16"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Preview Area -->
      <div class="demo-preview" [class.theme-dark]="previewTheme() === 'dark'">
        <div
          class="preview-frame"
          [style.maxWidth]="viewportWidth()"
          [class.no-animations]="!animationsEnabled()"
        >
          @switch (previewState()) {
            @case ('loading') {
              <div class="state-overlay loading">
                <div class="skeleton-card">
                  <div class="skeleton-header"></div>
                  <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line"></div>
                  </div>
                </div>
              </div>
            }
            @case ('error') {
              <div class="state-overlay error">
                <lucide-icon name="alert-triangle" [size]="48"></lucide-icon>
                <h3>Error Loading Component</h3>
                <p>Something went wrong while loading this component.</p>
                <button class="retry-btn" (click)="setPreviewState('normal')">Try Again</button>
              </div>
            }
            @case ('empty') {
              <div class="state-overlay empty">
                <lucide-icon name="inbox" [size]="48"></lucide-icon>
                <h3>No Data</h3>
                <p>This component has no data to display.</p>
              </div>
            }
            @default {
              @if (currentConfig()) {
                <app-ai-card-renderer
                  [cardConfig]="$any(currentConfig())"
                  [tiltEnabled]="false"
                  class="demo-card"
                ></app-ai-card-renderer>
              }
            }
          }
        </div>
      </div>

      <!-- D90: Props Inspector -->
      @if (showPropsInspector()) {
        <div class="props-inspector">
          <div class="inspector-header">
            <lucide-icon name="settings-2" [size]="16"></lucide-icon>
            <span>Props Inspector</span>
            <button class="close-inspector" (click)="togglePropsInspector()">
              <lucide-icon name="x" [size]="16"></lucide-icon>
            </button>
          </div>
          <div class="inspector-content">
            @for (prop of inspectorProps(); track prop.key) {
              <div class="prop-row">
                <label class="prop-label">{{ prop.key }}</label>
                @switch (prop.type) {
                  @case ('string') {
                    <input
                      type="text"
                      class="prop-input"
                      [value]="prop.value"
                      (input)="onPropChange(prop.key, $event)"
                    />
                  }
                  @case ('number') {
                    <input
                      type="number"
                      class="prop-input"
                      [value]="prop.value"
                      (input)="onPropChange(prop.key, $event)"
                    />
                  }
                  @case ('boolean') {
                    <label class="prop-toggle">
                      <input
                        type="checkbox"
                        [checked]="prop.value"
                        (change)="onPropChange(prop.key, $event)"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  }
                  @default {
                    <span class="prop-value">{{ prop.value | json }}</span>
                  }
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Footer Actions -->
      <div class="demo-footer">
        <button class="footer-btn" (click)="togglePropsInspector()">
          <lucide-icon name="settings-2" [size]="14"></lucide-icon>
          {{ showPropsInspector() ? 'Hide' : 'Show' }} Props
        </button>
        <button class="footer-btn" (click)="copyConfig()">
          <lucide-icon name="copy" [size]="14"></lucide-icon>
          Copy Config
        </button>
        <button class="footer-btn primary" (click)="openInPlayground()">
          <lucide-icon name="code-2" [size]="14"></lucide-icon>
          Open in Playground
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .component-demo {
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius-xl, 16px);
        overflow: hidden;
        background: var(--docs-surface, #fff);
        box-shadow: var(--docs-shadow, 0 2px 8px rgba(0, 0, 0, 0.06));
      }

      /* Toolbar */
      .demo-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: var(--docs-bg-secondary, #f4f6f9);
        border-bottom: 1px solid var(--docs-border, #e2e8f0);
        gap: 1rem;
        flex-wrap: wrap;
      }

      .toolbar-left {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .demo-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--docs-text, #1a1d23);
      }

      .demo-desc {
        font-size: 0.75rem;
        color: var(--docs-text-muted, #8891a4);
      }

      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .toolbar-divider {
        width: 1px;
        height: 24px;
        background: var(--docs-border, #e2e8f0);
      }

      .variant-select {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        color: var(--docs-text, #1a1d23);
        background: var(--docs-surface, #fff);
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius, 6px);
        cursor: pointer;
      }

      .state-buttons,
      .viewport-buttons {
        display: flex;
        background: var(--docs-surface, #fff);
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius, 6px);
        overflow: hidden;
      }

      .state-btn,
      .viewport-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.375rem 0.5rem;
        color: var(--docs-text-muted, #8891a4);
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          color: var(--docs-text, #1a1d23);
          background: var(--docs-hover-bg, rgba(255, 121, 0, 0.04));
        }

        &.active {
          color: var(--docs-primary, #ff7900);
          background: var(--docs-primary-bg, rgba(255, 121, 0, 0.06));
        }

        &:not(:last-child) {
          border-right: 1px solid var(--docs-border, #e2e8f0);
        }
      }

      .theme-toggle,
      .animation-toggle,
      .export-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.375rem;
        color: var(--docs-text-muted, #8891a4);
        background: var(--docs-surface, #fff);
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius, 6px);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          color: var(--docs-text, #1a1d23);
          border-color: var(--docs-primary, #ff7900);
        }
      }

      /* Preview */
      .demo-preview {
        padding: 2rem;
        background: var(--docs-bg, #fafbfd);
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.theme-dark {
          background: #0d1117;
        }
      }

      .preview-frame {
        width: 100%;
        max-width: 100%;
        transition: max-width 0.3s ease;

        &.no-animations * {
          animation: none !important;
          transition: none !important;
        }
      }

      .demo-card {
        width: 100%;
      }

      /* State Overlays */
      .state-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 3rem;
        text-align: center;
        width: 100%;
        max-width: 400px;

        h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--docs-text, #1a1d23);
        }

        p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--docs-text-muted, #8891a4);
        }

        &.loading {
          color: var(--docs-text-muted, #8891a4);
        }

        &.error {
          color: var(--docs-danger-text, #dc2626);

          h3 {
            color: var(--docs-danger-text, #dc2626);
          }
        }

        &.empty {
          color: var(--docs-text-muted, #8891a4);
        }
      }

      .skeleton-card {
        width: 100%;
        max-width: 400px;
        background: var(--docs-surface, #fff);
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius-lg, 12px);
        overflow: hidden;
      }

      .skeleton-header {
        height: 48px;
        background: linear-gradient(
          90deg,
          var(--docs-bg-secondary) 0%,
          var(--docs-bg-tertiary) 50%,
          var(--docs-bg-secondary) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      .skeleton-content {
        padding: 1rem;
      }

      .skeleton-line {
        height: 16px;
        margin-bottom: 0.75rem;
        background: linear-gradient(
          90deg,
          var(--docs-bg-secondary) 0%,
          var(--docs-bg-tertiary) 50%,
          var(--docs-bg-secondary) 100%
        );
        background-size: 200% 100%;
        border-radius: var(--docs-radius-sm, 4px);
        animation: shimmer 1.5s infinite;

        &.short {
          width: 60%;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }

      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      .retry-btn {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: white;
        background: var(--docs-danger-text, #dc2626);
        border: none;
        border-radius: var(--docs-radius, 6px);
        cursor: pointer;
        transition: background 0.15s ease;

        &:hover {
          background: #b91c1c;
        }
      }

      /* Props Inspector */
      .props-inspector {
        border-top: 1px solid var(--docs-border, #e2e8f0);
        background: var(--docs-surface, #fff);
      }

      .inspector-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--docs-text-secondary, #4a5568);
        background: var(--docs-bg-secondary, #f4f6f9);
        border-bottom: 1px solid var(--docs-border, #e2e8f0);
      }

      .close-inspector {
        margin-left: auto;
        display: flex;
        padding: 0.25rem;
        color: var(--docs-text-muted, #8891a4);
        background: transparent;
        border: none;
        border-radius: var(--docs-radius-sm, 4px);
        cursor: pointer;

        &:hover {
          color: var(--docs-text, #1a1d23);
          background: var(--docs-hover-bg, rgba(255, 121, 0, 0.04));
        }
      }

      .inspector-content {
        padding: 1rem;
        max-height: 300px;
        overflow-y: auto;
      }

      .prop-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--docs-border-light, #f1f5f9);

        &:last-child {
          border-bottom: none;
        }
      }

      .prop-label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--docs-text, #1a1d23);
        font-family: var(--docs-font-mono, monospace);
      }

      .prop-input {
        width: 200px;
        padding: 0.375rem 0.5rem;
        font-size: 0.8125rem;
        color: var(--docs-text, #1a1d23);
        background: var(--docs-bg-secondary, #f4f6f9);
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius-sm, 4px);

        &:focus {
          outline: none;
          border-color: var(--docs-primary, #ff7900);
        }
      }

      .prop-toggle {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 22px;

        input {
          opacity: 0;
          width: 0;
          height: 0;

          &:checked + .toggle-slider {
            background: var(--docs-primary, #ff7900);

            &::before {
              transform: translateX(18px);
            }
          }
        }
      }

      .toggle-slider {
        position: absolute;
        inset: 0;
        background: var(--docs-border, #e2e8f0);
        border-radius: 22px;
        cursor: pointer;
        transition: background 0.2s ease;

        &::before {
          content: '';
          position: absolute;
          left: 2px;
          top: 2px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }
      }

      .prop-value {
        font-size: 0.75rem;
        color: var(--docs-text-muted, #8891a4);
        font-family: var(--docs-font-mono, monospace);
      }

      /* Footer */
      .demo-footer {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: var(--docs-bg-secondary, #f4f6f9);
        border-top: 1px solid var(--docs-border, #e2e8f0);
      }

      .footer-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--docs-text-secondary, #4a5568);
        background: var(--docs-surface, #fff);
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius, 6px);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          border-color: var(--docs-primary, #ff7900);
          color: var(--docs-primary, #ff7900);
        }

        &.primary {
          color: white;
          background: var(--docs-primary, #ff7900);
          border-color: var(--docs-primary, #ff7900);
          margin-left: auto;

          &:hover {
            background: var(--docs-primary-dark, #e56d00);
          }
        }
      }

      @media (max-width: 768px) {
        .toolbar-right {
          flex-wrap: wrap;
        }

        .demo-preview {
          padding: 1rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsComponentDemoComponent implements OnInit {
  @Input() config?: Record<string, unknown>;
  @Input() title?: string;
  @Input() description?: string;
  @Input() variants: { name: string; config: Record<string, unknown> }[] = [];

  @Output() configChanged = new EventEmitter<Record<string, unknown>>();
  @Output() openPlayground = new EventEmitter<Record<string, unknown>>();

  // State
  activeVariant = signal(0);
  previewState = signal<'normal' | 'loading' | 'error' | 'empty'>('normal');
  viewport = signal<'mobile' | 'tablet' | 'desktop'>('desktop');
  previewTheme = signal<'light' | 'dark'>('light');
  animationsEnabled = signal(true);
  showPropsInspector = signal(false);

  // Computed
  currentConfig = computed(() => {
    if (this.variants.length > 0) {
      return this.variants[this.activeVariant()]?.config || this.config;
    }
    return this.config;
  });

  viewportWidth = computed(() => {
    switch (this.viewport()) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  });

  inspectorProps = computed(() => {
    const config = this.currentConfig();
    if (!config) {
      return [];
    }

    return Object.entries(config).map(([key, value]) => ({
      key,
      value,
      type: this.getValueType(value),
    }));
  });

  ngOnInit() {
    // If no variants provided, create a default one from config
    if (this.variants.length === 0 && this.config) {
      this.variants = [{ name: 'Default', config: this.config }];
    }
  }

  private getValueType(value: unknown): string {
    if (typeof value === 'string') {
      return 'string';
    }
    if (typeof value === 'number') {
      return 'number';
    }
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    if (Array.isArray(value)) {
      return 'array';
    }
    if (value && typeof value === 'object') {
      return 'object';
    }
    return 'unknown';
  }

  onVariantChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.activeVariant.set(parseInt(select.value, 10));
  }

  setPreviewState(state: 'normal' | 'loading' | 'error' | 'empty') {
    this.previewState.set(state);
  }

  setViewport(viewport: 'mobile' | 'tablet' | 'desktop') {
    this.viewport.set(viewport);
  }

  togglePreviewTheme() {
    this.previewTheme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  toggleAnimations() {
    this.animationsEnabled.update((v) => !v);
  }

  togglePropsInspector() {
    this.showPropsInspector.update((v) => !v);
  }

  onPropChange(key: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const currentConfig = this.currentConfig();
    if (!currentConfig) {
      return;
    }

    const newConfig = { ...currentConfig };

    if (target.type === 'checkbox') {
      (newConfig as Record<string, unknown>)[key] = target.checked;
    } else if (target.type === 'number') {
      (newConfig as Record<string, unknown>)[key] = parseFloat(target.value);
    } else {
      (newConfig as Record<string, unknown>)[key] = target.value;
    }

    // Update the variant config
    const currentVariant = this.variants[this.activeVariant()];
    if (this.variants.length > 0 && currentVariant) {
      currentVariant.config = newConfig;
    }

    this.configChanged.emit(newConfig);
  }

  async copyConfig() {
    const config = this.currentConfig();
    if (!config) {
      return;
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      // Could show a toast here
    } catch (e) {
      console.error('Failed to copy config:', e);
    }
  }

  openInPlayground() {
    const config = this.currentConfig();
    if (config) {
      this.openPlayground.emit(config);
    }
  }

  exportDesignTokens() {
    // Export CSS variables and design tokens
    const tokens = {
      colors: {
        primary: '#ff7900',
        primaryLight: '#ff9433',
        primaryDark: '#e56d00',
        text: '#1a1d23',
        textSecondary: '#4a5568',
        textMuted: '#8891a4',
        background: '#fafbfd',
        surface: '#ffffff',
        border: '#e2e8f0',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontMono: 'JetBrains Mono, monospace',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
    };

    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-tokens.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}
