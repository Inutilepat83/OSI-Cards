import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

@Component({
  selector: 'app-json-preview',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="json-preview-container">
      <div class="json-preview-header">
        <span class="preview-label">Underlying API payload for this profile</span>
      </div>

      <!-- Mode toggle -->
      <div class="mode-toggle">
        <button class="toggle-btn" [class.active]="mode === 'business'" (click)="mode = 'business'">
          Business view
        </button>
        <button
          class="toggle-btn"
          [class.active]="mode === 'technical'"
          (click)="mode = 'technical'"
        >
          Technical view
        </button>
      </div>

      <!-- Business view: compact preview -->
      <div class="json-preview" *ngIf="mode === 'business'">
        <div class="code-pill" (click)="showFullModal = true">
          <lucide-icon name="code-2" [size]="12"></lucide-icon>
          <span class="preview-text">{{ getPreviewText() }}</span>
          <lucide-icon name="external-link" [size]="12"></lucide-icon>
        </div>
      </div>

      <!-- Technical view: full preview -->
      <div class="json-preview-full" *ngIf="mode === 'technical'">
        <div class="code-block">
          <pre class="code-content">{{ getHighlightedJson() }}</pre>
          <button class="copy-btn" (click)="copyJson()" title="Copy JSON">
            <lucide-icon name="copy" [size]="14"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="json-actions">
        <button class="action-btn" (click)="showFullModal = true">
          <lucide-icon name="external-link" [size]="14"></lucide-icon>
          View full payload
        </button>
        <button class="action-btn" (click)="downloadJson()">
          <lucide-icon name="download" [size]="14"></lucide-icon>
          Download JSON
        </button>
      </div>
    </div>

    <!-- Full payload modal -->
    <div class="modal-overlay" *ngIf="showFullModal" (click)="showFullModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Full API Payload</h3>
          <button class="modal-close" (click)="showFullModal = false">
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>
        <div class="modal-body">
          <div class="code-block-full">
            <pre class="code-content-full">{{ getHighlightedJson() }}</pre>
            <button class="copy-btn-full" (click)="copyJson()" title="Copy JSON">
              <lucide-icon name="copy" [size]="16"></lucide-icon>
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="downloadJson()">
            <lucide-icon name="download" [size]="16"></lucide-icon>
            Download
          </button>
          <button class="btn-secondary" (click)="showFullModal = false">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .json-preview-container {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        font-size: 0.875rem;
      }

      .json-preview-header {
        margin-bottom: 0.75rem;
      }

      .preview-label {
        font-size: 0.6875rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .mode-toggle {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
        background: #f8fafc;
        padding: 0.25rem;
        border-radius: 6px;
      }

      .toggle-btn {
        flex: 1;
        padding: 0.375rem 0.75rem;
        background: transparent;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
      }

      .toggle-btn.active {
        background: white;
        color: #1a1d23;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .json-preview {
        margin-bottom: 0.75rem;
      }

      .code-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.75rem;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s;
        max-width: 100%;
        overflow: hidden;
      }

      .code-pill:hover {
        background: #f1f5f9;
        border-color: #ff7900;
      }

      .preview-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 400px;
      }

      .json-preview-full {
        margin-bottom: 0.75rem;
      }

      .code-block {
        position: relative;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
      }

      .code-content {
        margin: 0;
        padding: 1rem;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.8125rem;
        line-height: 1.6;
        color: #1a1d23;
        overflow-x: auto;
        white-space: pre;
        max-height: 300px;
        overflow-y: auto;
      }

      .copy-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
      }

      .copy-btn:hover {
        background: #f8fafc;
        color: #1a1d23;
        border-color: #cbd5e1;
      }

      .json-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.75rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        color: #1a1d23;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: #f8fafc;
        border-color: #ff7900;
        color: #ff7900;
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
      }

      .modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 900px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1a1d23;
      }

      .modal-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
      }

      .modal-close:hover {
        background: #f8fafc;
        color: #1a1d23;
      }

      .modal-body {
        flex: 1;
        overflow: auto;
        padding: 1.5rem;
      }

      .code-block-full {
        position: relative;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
      }

      .code-content-full {
        margin: 0;
        padding: 1.5rem;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.8125rem;
        line-height: 1.6;
        color: #1a1d23;
        overflow-x: auto;
        white-space: pre;
      }

      .copy-btn-full {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
      }

      .copy-btn-full:hover {
        background: #f8fafc;
        color: #1a1d23;
        border-color: #cbd5e1;
      }

      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid #e2e8f0;
      }

      .btn-secondary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: white;
        color: #1a1d23;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      /* Highlight critical keys */
      .code-content :global(.key-critical) {
        color: #ff7900;
        font-weight: 600;
      }
    `,
  ],
})
export class JsonPreviewComponent {
  @Input() jsonData: any = {};
  @Input() previewLines: number = 10;

  mode: 'business' | 'technical' = 'business';
  showFullModal = false;

  getPreviewText(): string {
    try {
      const jsonStr = JSON.stringify(this.jsonData, null, 2);
      const lines = jsonStr.split('\n');
      const preview = lines.slice(0, this.previewLines).join('\n');
      return preview + (lines.length > this.previewLines ? '...' : '');
    } catch {
      return 'Invalid JSON';
    }
  }

  getHighlightedJson(): string {
    try {
      const jsonStr = JSON.stringify(this.jsonData, null, 2);
      // Simple highlighting for critical keys
      return jsonStr.replace(
        /"((?:id|segment|risk|score)")/g,
        '<span class="key-critical">$1</span>'
      );
    } catch {
      return 'Invalid JSON';
    }
  }

  async copyJson(): Promise<void> {
    try {
      const jsonStr = JSON.stringify(this.jsonData, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      // Could show a toast notification here
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  }

  downloadJson(): void {
    try {
      const jsonStr = JSON.stringify(this.jsonData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'profile-payload.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download JSON:', err);
    }
  }
}

