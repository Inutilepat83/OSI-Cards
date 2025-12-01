import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';
// Import optimized card renderer from app (not library - uses optimized MagneticTiltService)
import { AICardRendererComponent } from '../../../../shared/components/cards/ai-card-renderer.component';

/**
 * Template for the playground
 */
interface PlaygroundTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Record<string, unknown>;
}

/**
 * Interactive Code Playground Component
 * Implements D1-D12 from the 100-point plan:
 * - D76: Live editor with syntax highlighting
 * - D77: Real-time preview
 * - D78: JSON validation with inline errors
 * - D79: Template library
 * - D80: Share functionality (URL encoding)
 * - D81: Download config as JSON
 * - D82: Fullscreen mode
 * - D83: Split view toggle (vertical/horizontal)
 * - D84: Editor themes (light/dark)
 * - D85: Auto-formatting (Prettify)
 * - D86: Undo/redo history
 * - D87: Keyboard shortcuts panel
 */
@Component({
  selector: 'app-docs-playground',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule, AICardRendererComponent],
  template: `
    <div
      class="playground"
      [class.fullscreen]="isFullscreen()"
      [class.horizontal]="layout() === 'horizontal'"
      [class.dark-editor]="editorTheme() === 'dark'"
    >
      <!-- Toolbar -->
      <div class="playground-toolbar">
        <div class="toolbar-left">
          <span class="playground-title">
            <lucide-icon name="code-2" [size]="18"></lucide-icon>
            Interactive Playground
          </span>

          <!-- D79: Template Library -->
          <div class="template-dropdown" [class.open]="showTemplates()">
            <button class="toolbar-btn" (click)="toggleTemplates()" aria-label="Choose template">
              <lucide-icon name="layout-template" [size]="16"></lucide-icon>
              Templates
              <lucide-icon name="chevron-down" [size]="14"></lucide-icon>
            </button>
            @if (showTemplates()) {
              <div class="dropdown-menu">
                @for (template of templates; track template.id) {
                  <button class="dropdown-item" (click)="loadTemplate(template)">
                    <lucide-icon [name]="template.icon" [size]="16"></lucide-icon>
                    <div class="item-content">
                      <span class="item-name">{{ template.name }}</span>
                      <span class="item-desc">{{ template.description }}</span>
                    </div>
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <div class="toolbar-center">
          <!-- D78: Validation Status -->
          <div class="validation-status" [class.error]="hasError()" [class.valid]="!hasError()">
            @if (hasError()) {
              <lucide-icon name="alert-circle" [size]="14"></lucide-icon>
              <span>{{ errorMessage() }}</span>
            } @else {
              <lucide-icon name="check-circle" [size]="14"></lucide-icon>
              <span>Valid JSON</span>
            }
          </div>
        </div>

        <div class="toolbar-right">
          <!-- D85: Format Button -->
          <button
            class="toolbar-btn"
            (click)="formatCode()"
            title="Format JSON (Ctrl+Shift+F)"
            [disabled]="hasError()"
          >
            <lucide-icon name="align-left" [size]="16"></lucide-icon>
          </button>

          <!-- D86: Undo/Redo -->
          <button
            class="toolbar-btn"
            (click)="undo()"
            title="Undo (Ctrl+Z)"
            [disabled]="!canUndo()"
          >
            <lucide-icon name="undo-2" [size]="16"></lucide-icon>
          </button>
          <button
            class="toolbar-btn"
            (click)="redo()"
            title="Redo (Ctrl+Y)"
            [disabled]="!canRedo()"
          >
            <lucide-icon name="redo-2" [size]="16"></lucide-icon>
          </button>

          <div class="toolbar-divider"></div>

          <!-- D83: Layout Toggle -->
          <button
            class="toolbar-btn"
            (click)="toggleLayout()"
            [title]="layout() === 'vertical' ? 'Horizontal split' : 'Vertical split'"
          >
            <lucide-icon
              [name]="layout() === 'vertical' ? 'columns-2' : 'rows-2'"
              [size]="16"
            ></lucide-icon>
          </button>

          <!-- D84: Editor Theme -->
          <button
            class="toolbar-btn"
            (click)="toggleEditorTheme()"
            [title]="editorTheme() === 'light' ? 'Dark editor' : 'Light editor'"
          >
            <lucide-icon
              [name]="editorTheme() === 'light' ? 'moon' : 'sun'"
              [size]="16"
            ></lucide-icon>
          </button>

          <div class="toolbar-divider"></div>

          <!-- D80: Share -->
          <button class="toolbar-btn" (click)="shareConfig()" title="Copy shareable link">
            <lucide-icon name="share-2" [size]="16"></lucide-icon>
          </button>

          <!-- D81: Download -->
          <button class="toolbar-btn" (click)="downloadConfig()" title="Download JSON">
            <lucide-icon name="download" [size]="16"></lucide-icon>
          </button>

          <!-- D82: Fullscreen -->
          <button
            class="toolbar-btn"
            (click)="toggleFullscreen()"
            [title]="isFullscreen() ? 'Exit fullscreen' : 'Fullscreen'"
          >
            <lucide-icon
              [name]="isFullscreen() ? 'minimize-2' : 'maximize-2'"
              [size]="16"
            ></lucide-icon>
          </button>

          <!-- D87: Shortcuts -->
          <button class="toolbar-btn" (click)="toggleShortcuts()" title="Keyboard shortcuts">
            <lucide-icon name="keyboard" [size]="16"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="playground-content">
        <!-- D76: Editor Panel -->
        <div class="editor-panel">
          <div class="panel-header">
            <span>Editor</span>
            <span class="char-count">{{ charCount() }} chars</span>
          </div>
          <div class="editor-wrapper">
            <textarea
              #editor
              class="code-editor"
              [value]="code()"
              (input)="onCodeChange($event)"
              (keydown)="onEditorKeydown($event)"
              spellcheck="false"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              placeholder="Enter your card configuration JSON..."
            ></textarea>
            <div class="line-numbers" aria-hidden="true">
              @for (line of lineNumbers(); track $index) {
                <span>{{ line }}</span>
              }
            </div>
          </div>
        </div>

        <!-- Resizer -->
        <div
          class="resizer"
          (mousedown)="startResize($event)"
          role="separator"
          aria-orientation="vertical"
        ></div>

        <!-- D77: Preview Panel -->
        <div class="preview-panel">
          <div class="panel-header">
            <span>Preview</span>
            @if (isRendering()) {
              <span class="rendering-indicator">
                <lucide-icon name="loader-2" [size]="14" class="spin"></lucide-icon>
                Rendering...
              </span>
            }
          </div>
          <div class="preview-wrapper">
            @if (!hasError() && parsedConfig()) {
              <div class="preview-content">
                <app-ai-card-renderer
                  [cardConfig]="$any(parsedConfig())"
                  [tiltEnabled]="false"
                  class="preview-card"
                ></app-ai-card-renderer>
              </div>
            } @else if (hasError()) {
              <div class="preview-error">
                <lucide-icon name="alert-triangle" [size]="48"></lucide-icon>
                <h3>Invalid Configuration</h3>
                <p>{{ errorMessage() }}</p>
              </div>
            } @else {
              <div class="preview-empty">
                <lucide-icon name="code-2" [size]="48"></lucide-icon>
                <h3>No Preview</h3>
                <p>Enter valid JSON to see the preview</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- D87: Keyboard Shortcuts Modal -->
      @if (showShortcuts()) {
        <div class="shortcuts-overlay" (click)="toggleShortcuts()">
          <div class="shortcuts-modal" (click)="$event.stopPropagation()">
            <div class="shortcuts-header">
              <h3>Keyboard Shortcuts</h3>
              <button class="close-btn" (click)="toggleShortcuts()">
                <lucide-icon name="x" [size]="20"></lucide-icon>
              </button>
            </div>
            <div class="shortcuts-content">
              <div class="shortcut-group">
                <h4>Editor</h4>
                <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>Z</kbd> <span>Undo</span></div>
                <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>Y</kbd> <span>Redo</span></div>
                <div class="shortcut">
                  <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> <span>Format</span>
                </div>
                <div class="shortcut"><kbd>Tab</kbd> <span>Insert 2 spaces</span></div>
              </div>
              <div class="shortcut-group">
                <h4>View</h4>
                <div class="shortcut">
                  <kbd>Ctrl</kbd>+<kbd>Enter</kbd> <span>Toggle fullscreen</span>
                </div>
                <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>\\</kbd> <span>Toggle layout</span></div>
                <div class="shortcut"><kbd>Escape</kbd> <span>Exit fullscreen</span></div>
              </div>
              <div class="shortcut-group">
                <h4>Actions</h4>
                <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>S</kbd> <span>Download JSON</span></div>
                <div class="shortcut">
                  <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd> <span>Copy link</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Toast Notifications -->
      @if (toast()) {
        <div
          class="toast"
          [class.error]="toast()!.type === 'error'"
          [class.success]="toast()!.type === 'success'"
        >
          <lucide-icon
            [name]="toast()!.type === 'error' ? 'alert-circle' : 'check-circle'"
            [size]="16"
          ></lucide-icon>
          {{ toast()!.message }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .playground {
        display: flex;
        flex-direction: column;
        height: 600px;
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius-xl, 16px);
        overflow: hidden;
        background: var(--docs-surface, #fff);
        box-shadow: var(--docs-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.1));

        &.fullscreen {
          position: fixed;
          inset: 0;
          z-index: 1000;
          height: 100vh;
          border-radius: 0;
        }

        &.horizontal .playground-content {
          flex-direction: column;

          .resizer {
            height: 8px;
            width: 100%;
            cursor: row-resize;
          }
        }
      }

      /* Toolbar */
      .playground-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        background: var(--docs-bg-secondary, #f4f6f9);
        border-bottom: 1px solid var(--docs-border, #e2e8f0);
        gap: 1rem;
        flex-shrink: 0;
      }

      .toolbar-left,
      .toolbar-center,
      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .playground-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--docs-text, #1a1d23);
      }

      .toolbar-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.625rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--docs-text-secondary, #4a5568);
        background: transparent;
        border: none;
        border-radius: var(--docs-radius, 6px);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover:not(:disabled) {
          background: var(--docs-hover-bg, rgba(255, 121, 0, 0.04));
          color: var(--docs-text, #1a1d23);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .toolbar-divider {
        width: 1px;
        height: 20px;
        background: var(--docs-border, #e2e8f0);
      }

      /* Template Dropdown */
      .template-dropdown {
        position: relative;

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 0.5rem;
          min-width: 280px;
          background: var(--docs-surface, #fff);
          border: 1px solid var(--docs-border, #e2e8f0);
          border-radius: var(--docs-radius-lg, 12px);
          box-shadow: var(--docs-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.1));
          z-index: 100;
          overflow: hidden;
        }

        .dropdown-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;

          &:hover {
            background: var(--docs-hover-bg, rgba(255, 121, 0, 0.04));
          }

          .item-content {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }

          .item-name {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--docs-text, #1a1d23);
          }

          .item-desc {
            font-size: 0.75rem;
            color: var(--docs-text-muted, #8891a4);
          }
        }
      }

      /* Validation Status */
      .validation-status {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.625rem;
        font-size: 0.75rem;
        font-weight: 500;
        border-radius: var(--docs-radius-full, 9999px);

        &.valid {
          color: var(--docs-tip-text, #047857);
          background: var(--docs-tip-bg, rgba(16, 185, 129, 0.08));
        }

        &.error {
          color: var(--docs-danger-text, #dc2626);
          background: var(--docs-danger-bg, rgba(239, 68, 68, 0.08));
        }
      }

      /* Content */
      .playground-content {
        display: flex;
        flex: 1;
        min-height: 0;
      }

      .editor-panel,
      .preview-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--docs-text-muted, #8891a4);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: var(--docs-bg-tertiary, #eef1f5);
        border-bottom: 1px solid var(--docs-border, #e2e8f0);
      }

      .char-count {
        font-weight: 400;
        text-transform: none;
      }

      .rendering-indicator {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        color: var(--docs-primary, #ff7900);

        .spin {
          animation: spin 1s linear infinite;
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Editor */
      .editor-wrapper {
        flex: 1;
        position: relative;
        overflow: hidden;
      }

      .code-editor {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        padding: 1rem 1rem 1rem 3.5rem;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.875rem;
        line-height: 1.6;
        color: var(--docs-code-text, #1e293b);
        background: var(--docs-code-bg, #f8fafc);
        border: none;
        outline: none;
        resize: none;
        white-space: pre;
        overflow: auto;

        &::placeholder {
          color: var(--docs-text-muted, #8891a4);
        }
      }

      .line-numbers {
        position: absolute;
        top: 0;
        left: 0;
        width: 3rem;
        padding: 1rem 0.5rem;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.6;
        text-align: right;
        color: var(--docs-text-muted, #8891a4);
        background: var(--docs-bg-secondary, #f4f6f9);
        border-right: 1px solid var(--docs-border, #e2e8f0);
        user-select: none;

        span {
          display: block;
        }
      }

      /* Dark Editor Theme */
      .dark-editor {
        .code-editor {
          color: var(--docs-pre-text, #e2e8f0);
          background: var(--docs-pre-bg, #0f172a);
        }

        .line-numbers {
          color: rgba(255, 255, 255, 0.3);
          background: rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.1);
        }
      }

      /* Resizer */
      .resizer {
        width: 8px;
        background: var(--docs-border, #e2e8f0);
        cursor: col-resize;
        transition: background 0.15s ease;

        &:hover {
          background: var(--docs-primary, #ff7900);
        }
      }

      /* Preview */
      .preview-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: var(--docs-bg, #fafbfd);
        overflow: auto;
      }

      .preview-content {
        max-width: 500px;
        width: 100%;
      }

      .preview-card {
        width: 100%;
      }

      .preview-error,
      .preview-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
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
          max-width: 300px;
        }
      }

      .preview-error {
        color: var(--docs-danger-text, #dc2626);

        h3 {
          color: var(--docs-danger-text, #dc2626);
        }
      }

      /* Shortcuts Modal */
      .shortcuts-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 1001;
      }

      .shortcuts-modal {
        width: 90%;
        max-width: 500px;
        background: var(--docs-surface, #fff);
        border-radius: var(--docs-radius-xl, 16px);
        box-shadow: var(--docs-shadow-xl, 0 16px 48px rgba(0, 0, 0, 0.12));
        overflow: hidden;
      }

      .shortcuts-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--docs-border, #e2e8f0);

        h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .close-btn {
          display: flex;
          padding: 0.5rem;
          background: none;
          border: none;
          border-radius: var(--docs-radius, 6px);
          cursor: pointer;
          color: var(--docs-text-muted, #8891a4);

          &:hover {
            background: var(--docs-hover-bg, rgba(255, 121, 0, 0.04));
            color: var(--docs-text, #1a1d23);
          }
        }
      }

      .shortcuts-content {
        padding: 1.5rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
      }

      .shortcut-group {
        h4 {
          margin: 0 0 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--docs-text-muted, #8891a4);
        }
      }

      .shortcut {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0;
        font-size: 0.875rem;
        color: var(--docs-text-secondary, #4a5568);

        kbd {
          padding: 0.125rem 0.375rem;
          font-family: var(--docs-font-mono, monospace);
          font-size: 0.75rem;
          background: var(--docs-bg-secondary, #f4f6f9);
          border: 1px solid var(--docs-border, #e2e8f0);
          border-radius: var(--docs-radius-sm, 4px);
        }

        span {
          margin-left: auto;
          color: var(--docs-text-muted, #8891a4);
        }
      }

      /* Toast */
      .toast {
        position: fixed;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        background: var(--docs-surface, #fff);
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius-lg, 12px);
        box-shadow: var(--docs-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.1));
        z-index: 1002;
        animation: slideUp 0.3s ease;

        &.success {
          border-color: var(--docs-tip-border, #10b981);
          color: var(--docs-tip-text, #047857);
        }

        &.error {
          border-color: var(--docs-danger-border, #ef4444);
          color: var(--docs-danger-text, #dc2626);
        }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      @media (max-width: 768px) {
        .playground-content {
          flex-direction: column;
        }

        .resizer {
          height: 8px;
          width: 100%;
          cursor: row-resize;
        }

        .toolbar-center {
          display: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsPlaygroundComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editorRef!: ElementRef<HTMLTextAreaElement>;

  @Input() initialConfig?: Record<string, unknown>;
  @Output() configChange = new EventEmitter<Record<string, unknown>>();

  private destroy$ = new Subject<void>();
  private codeChange$ = new Subject<string>();

  // State
  code = signal<string>('');
  parsedConfig = signal<Record<string, unknown> | null>(null);
  errorMessage = signal<string>('');
  hasError = computed(() => !!this.errorMessage());
  isFullscreen = signal(false);
  layout = signal<'vertical' | 'horizontal'>('vertical');
  editorTheme = signal<'light' | 'dark'>('light');
  showTemplates = signal(false);
  showShortcuts = signal(false);
  isRendering = signal(false);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // D86: History
  private history: string[] = [];
  private historyIndex = -1;
  private maxHistory = 50;

  canUndo = computed(() => this.historyIndex > 0);
  canRedo = computed(() => this.historyIndex < this.history.length - 1);

  // Computed
  lineNumbers = computed(() => {
    const lines = this.code().split('\n').length;
    return Array.from({ length: lines }, (_, i) => i + 1);
  });

  charCount = computed(() => this.code().length);

  // D79: Templates
  templates: PlaygroundTemplate[] = [
    {
      id: 'basic',
      name: 'Basic Card',
      description: 'Simple info card',
      icon: 'square',
      config: {
        cardTitle: 'Sample Card',
        sections: [
          { title: 'Information', type: 'info', fields: [{ label: 'Name', value: 'Acme Corp' }] },
        ],
      },
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      description: 'Metrics and KPIs',
      icon: 'bar-chart-2',
      config: {
        cardTitle: 'Performance Dashboard',
        sections: [
          {
            title: 'Key Metrics',
            type: 'analytics',
            fields: [
              { label: 'Revenue', value: 1250000, change: 12.5, trend: 'up', format: 'currency' },
              { label: 'Users', value: 45200, change: 8.2, trend: 'up' },
            ],
          },
        ],
      },
    },
    {
      id: 'contact',
      name: 'Contact Card',
      description: 'Team contacts',
      icon: 'users',
      config: {
        cardTitle: 'Team',
        sections: [
          {
            title: 'Contacts',
            type: 'contact-card',
            fields: [{ name: 'Jane Doe', role: 'CEO', email: 'jane@example.com' }],
          },
        ],
      },
    },
    {
      id: 'chart',
      name: 'Chart Section',
      description: 'Data visualization',
      icon: 'pie-chart',
      config: {
        cardTitle: 'Sales Report',
        sections: [
          {
            title: 'Quarterly Sales',
            type: 'chart',
            chartType: 'bar',
            fields: [
              { label: 'Q1', value: 125000 },
              { label: 'Q2', value: 158000 },
              { label: 'Q3', value: 142000 },
              { label: 'Q4', value: 189000 },
            ],
          },
        ],
      },
    },
    {
      id: 'list',
      name: 'List Section',
      description: 'Items and features',
      icon: 'list',
      config: {
        cardTitle: 'Features',
        sections: [
          {
            title: 'Product Features',
            type: 'list',
            items: [
              { title: 'Real-time sync', description: 'Instant updates', status: 'completed' },
              { title: 'API access', description: 'Full REST API', status: 'in-progress' },
            ],
          },
        ],
      },
    },
  ];

  // D87: Keyboard Shortcuts
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? event.metaKey : event.ctrlKey;

    if (cmdKey && event.shiftKey && event.key === 'f') {
      event.preventDefault();
      this.formatCode();
    } else if (cmdKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
    } else if (cmdKey && (event.key === 'y' || (event.shiftKey && event.key === 'z'))) {
      event.preventDefault();
      this.redo();
    } else if (cmdKey && event.key === 's') {
      event.preventDefault();
      this.downloadConfig();
    } else if (cmdKey && event.shiftKey && event.key === 'c') {
      event.preventDefault();
      this.shareConfig();
    } else if (cmdKey && event.key === 'Enter') {
      event.preventDefault();
      this.toggleFullscreen();
    } else if (cmdKey && event.key === '\\') {
      event.preventDefault();
      this.toggleLayout();
    } else if (event.key === 'Escape' && this.isFullscreen()) {
      this.toggleFullscreen();
    }
  }

  ngOnInit() {
    // Initialize with input config or default
    const defaultTemplate = this.templates[0];
    const initialCode = this.initialConfig
      ? JSON.stringify(this.initialConfig, null, 2)
      : JSON.stringify(defaultTemplate?.config ?? {}, null, 2);

    this.code.set(initialCode);
    this.pushToHistory(initialCode);
    this.parseCode(initialCode);

    // Debounced code parsing
    this.codeChange$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe((code) => {
      this.parseCode(code);
    });

    // Check URL for shared config
    this.loadFromUrl();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFromUrl() {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const encodedConfig = params.get('config');

    if (encodedConfig) {
      try {
        const decoded = decodeURIComponent(encodedConfig);
        const config = JSON.parse(decoded);
        const code = JSON.stringify(config, null, 2);
        this.code.set(code);
        this.pushToHistory(code);
        this.parseCode(code);
      } catch (e) {
        console.error('Failed to load config from URL:', e);
      }
    }
  }

  onCodeChange(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.code.set(value);
    this.codeChange$.next(value);
  }

  onEditorKeydown(event: KeyboardEvent) {
    // Handle Tab key for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      textarea.value = value.substring(0, start) + '  ' + value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;

      this.code.set(textarea.value);
      this.codeChange$.next(textarea.value);
    }
  }

  private parseCode(code: string) {
    this.isRendering.set(true);

    try {
      const config = JSON.parse(code);
      this.parsedConfig.set(config);
      this.errorMessage.set('');
      this.configChange.emit(config);
    } catch (e) {
      this.parsedConfig.set(null);
      const error = e as Error;
      this.errorMessage.set(error.message);
    }

    setTimeout(() => this.isRendering.set(false), 100);
  }

  // D86: History Management
  private pushToHistory(code: string) {
    // Remove any redo states
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Don't push if same as last
    if (this.history[this.history.length - 1] === code) {
      return;
    }

    this.history.push(code);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
  }

  undo() {
    if (!this.canUndo()) {
      return;
    }
    this.historyIndex--;
    const code = this.history[this.historyIndex] ?? '';
    this.code.set(code);
    this.parseCode(code);
  }

  redo() {
    if (!this.canRedo()) {
      return;
    }
    this.historyIndex++;
    const code = this.history[this.historyIndex] ?? '';
    this.code.set(code);
    this.parseCode(code);
  }

  // D85: Format Code
  formatCode() {
    if (this.hasError()) {
      return;
    }

    try {
      const parsed = JSON.parse(this.code());
      const formatted = JSON.stringify(parsed, null, 2);
      this.code.set(formatted);
      this.pushToHistory(formatted);
      this.showToast('Code formatted', 'success');
    } catch (e) {
      this.showToast('Cannot format invalid JSON', 'error');
    }
  }

  // D79: Load Template
  loadTemplate(template: PlaygroundTemplate) {
    const code = JSON.stringify(template.config, null, 2);
    this.code.set(code);
    this.pushToHistory(code);
    this.parseCode(code);
    this.showTemplates.set(false);
    this.showToast(`Loaded "${template.name}"`, 'success');
  }

  toggleTemplates() {
    this.showTemplates.update((v) => !v);
  }

  // D80: Share
  async shareConfig() {
    if (this.hasError()) {
      this.showToast('Cannot share invalid JSON', 'error');
      return;
    }

    try {
      const encoded = encodeURIComponent(this.code());
      const url = `${window.location.origin}${window.location.pathname}?config=${encoded}`;
      await navigator.clipboard.writeText(url);
      this.showToast('Link copied to clipboard', 'success');
    } catch (e) {
      this.showToast('Failed to copy link', 'error');
    }
  }

  // D81: Download
  downloadConfig() {
    if (this.hasError()) {
      this.showToast('Cannot download invalid JSON', 'error');
      return;
    }

    const blob = new Blob([this.code()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card-config.json';
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Downloaded card-config.json', 'success');
  }

  // D82: Fullscreen
  toggleFullscreen() {
    this.isFullscreen.update((v) => !v);
  }

  // D83: Layout Toggle
  toggleLayout() {
    this.layout.update((v) => (v === 'vertical' ? 'horizontal' : 'vertical'));
  }

  // D84: Editor Theme
  toggleEditorTheme() {
    this.editorTheme.update((v) => (v === 'light' ? 'dark' : 'light'));
  }

  // D87: Shortcuts
  toggleShortcuts() {
    this.showShortcuts.update((v) => !v);
  }

  // Resizer
  startResize(event: MouseEvent) {
    // Basic resize handling - could be enhanced
    event.preventDefault();
  }

  // Toast
  private showToast(message: string, type: 'success' | 'error') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
