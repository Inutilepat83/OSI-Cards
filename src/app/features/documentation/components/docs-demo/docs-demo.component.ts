import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

// Import card renderer from the OSI Cards library to ensure docs show actual library output
import { AICardRendererComponent } from '@osi-cards/components';

/**
 * Demo configuration for the DocsDemoComponent
 */
export interface DemoConfig {
  /** Card configuration JSON */
  config: Record<string, unknown>;
  /** Optional title for the demo */
  title?: string;
  /** Optional description */
  description?: string;
  /** Height of the preview area */
  previewHeight?: string;
  /** Whether to show only the preview without code */
  previewOnly?: boolean;
}

/**
 * Interactive demo component for documentation
 * Renders live OSI Cards components with a code viewer
 */
@Component({
  selector: 'app-docs-demo',
  standalone: true,
  imports: [CommonModule, LucideIconsModule, AICardRendererComponent],
  template: `
    <div class="demo-container" [class.preview-only]="previewOnly()">
      <!-- Demo Header -->
      <div class="demo-header">
        <div class="demo-info">
          @if (title()) {
            <span class="demo-title">{{ title() }}</span>
          } @else {
            <span class="demo-title">Live Demo</span>
          }
          @if (sectionType()) {
            <span class="demo-badge">{{ sectionType() }}</span>
          }
        </div>

        @if (!previewOnly()) {
          <div class="demo-tabs">
            <button
              class="demo-tab"
              [class.active]="activeTab() === 'preview'"
              (click)="setActiveTab('preview')"
            >
              <lucide-icon name="eye" [size]="14"></lucide-icon>
              Preview
            </button>
            <button
              class="demo-tab"
              [class.active]="activeTab() === 'code'"
              (click)="setActiveTab('code')"
            >
              <lucide-icon name="code-2" [size]="14"></lucide-icon>
              Code
            </button>
            <button
              class="demo-tab"
              [class.active]="activeTab() === 'both'"
              (click)="setActiveTab('both')"
            >
              <lucide-icon name="columns-2" [size]="14"></lucide-icon>
              Split
            </button>
          </div>
        }
      </div>

      <!-- Demo Content -->
      <div class="demo-content" [class]="'view-' + activeTab()">
        <!-- Preview Panel -->
        @if (activeTab() !== 'code') {
          <div class="demo-preview" [style.min-height]="previewHeight()">
            @if (description()) {
              <p class="demo-description">{{ description() }}</p>
            }

            <div class="preview-wrapper">
              @if (hasValidConfig()) {
                <app-ai-card-renderer
                  [cardConfig]="$any(cardConfig())"
                  [tiltEnabled]="false"
                  class="demo-card"
                ></app-ai-card-renderer>
              } @else {
                <div class="demo-placeholder">
                  <lucide-icon name="alert-circle" [size]="32"></lucide-icon>
                  <p>Invalid or missing configuration</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Code Panel -->
        @if (activeTab() !== 'preview' || previewOnly()) {
          <div class="demo-code">
            <div class="code-header">
              <span class="code-lang">JSON</span>
              <button class="copy-btn" (click)="copyCode()" [class.copied]="copied()">
                <lucide-icon [name]="copied() ? 'check' : 'copy'" [size]="14"></lucide-icon>
                {{ copied() ? 'Copied!' : 'Copy' }}
              </button>
            </div>
            <pre class="code-block"><code [innerHTML]="highlightedCode()"></code></pre>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .demo-container {
        margin: 1.5rem 0;
        border: 1px solid var(--docs-border, rgba(255, 255, 255, 0.1));
        border-radius: 12px;
        overflow: hidden;
        background: var(--docs-bg, #0a0a0a);
        width: 100%;
      }

      :host-context([data-theme='day']) .demo-container {
        border-color: #e5e7eb;
        background: #fafbfc;
      }

      .demo-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: var(--docs-bg-secondary, #111111);
        border-bottom: 1px solid var(--docs-border, rgba(255, 255, 255, 0.1));
      }

      :host-context([data-theme='day']) .demo-header {
        background: #f6f8fa;
        border-bottom-color: #e5e7eb;
      }

      .demo-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .demo-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--docs-text-muted, rgba(255, 255, 255, 0.6));
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      :host-context([data-theme='day']) .demo-title {
        color: #6b7280;
      }

      .demo-badge {
        padding: 0.125rem 0.5rem;
        font-size: 0.625rem;
        font-weight: 600;
        color: var(--docs-primary, #ff7900);
        background: var(--docs-primary-bg, rgba(255, 121, 0, 0.1));
        border-radius: 4px;
        text-transform: uppercase;
      }

      .demo-tabs {
        display: flex;
        gap: 0.25rem;
      }

      .demo-tab {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--docs-text-secondary, #6b7280);
        background: transparent;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: var(--docs-hover, rgba(0, 0, 0, 0.05));
          color: var(--docs-text, #24292f);
        }

        &.active {
          background: var(--docs-primary-bg, rgba(255, 121, 0, 0.1));
          color: var(--docs-primary, #ff7900);
        }
      }

      .demo-content {
        display: flex;
        flex-direction: column;
        min-height: 300px;
        width: 100%;

        &.view-preview {
          .demo-preview {
            flex: 1;
            width: 100%;
          }
        }

        &.view-code {
          .demo-code {
            flex: 1;
            width: 100%;
          }
        }

        &.view-both {
          flex-direction: row;

          .demo-preview,
          .demo-code {
            flex: 1;
          }

          .demo-preview {
            border-right: 1px solid var(--docs-border, #e5e7eb);
          }
        }
      }

      .demo-preview {
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        background: var(--background, #0a0a0a);
        width: 100%;

        /* Force dark theme context for card preview */
        --section-surface: #161616;
        --section-item-background: #1e1e1e;
        --section-item-background-hover: #252525;
        --ai-card-background: #111111;
        --card-text-primary: rgba(255, 255, 255, 0.95);
        --card-text-secondary: rgba(255, 255, 255, 0.7);
        --card-text-muted: rgba(255, 255, 255, 0.5);
      }

      :host-context([data-theme='day']) .demo-preview {
        background: var(--background, #ffffff);
        --section-surface: #f5f5f5;
        --section-item-background: #ffffff;
        --section-item-background-hover: #fafafa;
        --ai-card-background: #ffffff;
        --card-text-primary: #1a1a1a;
        --card-text-secondary: #4b5563;
        --card-text-muted: #9ca3af;
      }

      .demo-description {
        margin-bottom: 1rem;
        font-size: 0.875rem;
        color: var(--docs-text-secondary, #6b7280);
        text-align: center;
      }

      .preview-wrapper {
        width: 100%;
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .demo-card {
        width: 100%;
        max-width: none;
        flex: 1;
        display: block;
      }

      .demo-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem;
        color: var(--docs-text-muted, #6b7280);

        p {
          margin: 0;
          font-size: 0.875rem;
        }
      }

      .demo-code {
        display: flex;
        flex-direction: column;
        background: var(--docs-pre-bg, #161b22);
      }

      .code-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .code-lang {
        font-size: 0.625rem;
        font-weight: 600;
        color: var(--docs-text-muted, #8b949e);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .copy-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--docs-text-muted, #8b949e);
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        &.copied {
          color: #3fb950;
          background: rgba(63, 185, 80, 0.2);
        }
      }

      .code-block {
        margin: 0;
        padding: 1rem;
        overflow-x: auto;
        flex: 1;

        code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.8125rem;
          line-height: 1.6;
          color: var(--docs-pre-text, #e6edf3);
        }
      }

      /* Syntax highlighting */
      .token-key {
        color: #79c0ff;
      }
      .token-string {
        color: #a5d6ff;
      }
      .token-number {
        color: #79c0ff;
      }
      .token-boolean {
        color: #ff7b72;
      }
      .token-null {
        color: #ff7b72;
      }
      .token-punctuation {
        color: #8b949e;
      }

      /* Preview only mode */
      .preview-only {
        .demo-content {
          min-height: auto;
        }

        .demo-preview {
          padding: 1rem;
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .demo-content.view-both {
          flex-direction: column;

          .demo-preview {
            border-right: none;
            border-bottom: 1px solid var(--docs-border, #e5e7eb);
          }
        }

        .demo-tabs {
          display: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsDemoComponent implements OnInit, OnChanges {
  private cdr = inject(ChangeDetectorRef);

  /** The configuration object for the demo */
  @Input() config: Record<string, unknown> = {};

  /** Optional title for the demo */
  @Input() demoTitle?: string;

  /** Optional description */
  @Input() demoDescription?: string;

  /** Height of the preview area */
  @Input() height = '300px';

  /** Show only preview without code toggle */
  @Input() previewOnlyMode = false;

  /** Section type being demonstrated */
  @Input() type?: string;

  // Signals
  activeTab = signal<'preview' | 'code' | 'both'>('preview');
  copied = signal(false);

  // Computed signals
  title = computed(() => this.demoTitle);
  description = computed(() => this.demoDescription);
  previewHeight = computed(() => this.height);
  previewOnly = computed(() => this.previewOnlyMode);
  sectionType = computed(() => this.type);

  cardConfig = signal<Record<string, unknown>>({});

  hasValidConfig = computed(() => {
    const cfg = this.cardConfig();
    return cfg && Object.keys(cfg).length > 0;
  });

  highlightedCode = computed(() => {
    return this.syntaxHighlightJSON(JSON.stringify(this.cardConfig(), null, 2));
  });

  ngOnInit() {
    this.updateCardConfig();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.updateCardConfig();
    }
  }

  private updateCardConfig() {
    // Ensure we have a valid card config structure
    const config = this.config;
    if (config && typeof config === 'object') {
      // If config is a section config (has 'type' but no 'sections'), wrap it
      if (config.type && !config.sections) {
        this.cardConfig.set({
          title: config.title || 'Demo Card',
          sections: [config],
        });
      } else {
        this.cardConfig.set(config as Record<string, unknown>);
      }
    }
    this.cdr.markForCheck();
  }

  setActiveTab(tab: 'preview' | 'code' | 'both') {
    this.activeTab.set(tab);
  }

  async copyCode() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(this.cardConfig(), null, 2));
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  resetDemo() {
    this.updateCardConfig();
    this.activeTab.set('preview');
  }

  openInPlayground() {
    // Encode the config and open in playground
    const encoded = encodeURIComponent(JSON.stringify(this.cardConfig()));
    window.open(`/?config=${encoded}`, '_blank');
  }

  /**
   * Simple JSON syntax highlighting
   */
  private syntaxHighlightJSON(json: string): string {
    if (!json) {
      return '';
    }

    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          let cls = 'token-number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'token-key';
              match = match.replace(/:$/, '');
              return `<span class="${cls}">${match}</span>:`;
            } else {
              cls = 'token-string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'token-boolean';
          } else if (/null/.test(match)) {
            cls = 'token-null';
          }
          return `<span class="${cls}">${match}</span>`;
        }
      )
      .replace(/[{}\[\],]/g, (match) => `<span class="token-punctuation">${match}</span>`);
  }
}
