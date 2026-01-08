import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

/**
 * FAQ Item Interface
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Step Item Interface
 */
export interface StepItem {
  title: string;
  content: string;
  code?: string;
}

/**
 * Comparison Item Interface
 */
export interface ComparisonItem {
  feature: string;
  [key: string]: string | boolean | number;
}

/**
 * Rich Content Components for Documentation
 * Implements C19-C25 from the 100-point plan:
 * - C69: Embedded videos with lazy loading
 * - C70: Interactive diagrams (Mermaid/D2 placeholder)
 * - C71: Image zoom modal
 * - C72: Image captions with figure
 * - C73: Comparison tables
 * - C74: Step-by-step guides
 * - C75: FAQ accordions
 */

// =============================================================================
// C71: IMAGE ZOOM COMPONENT
// =============================================================================

@Component({
  selector: 'app-docs-image-zoom',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <figure class="docs-figure" [class.has-caption]="caption">
      <img
        [src]="src"
        [alt]="alt"
        class="docs-image"
        [class.zoomable]="zoomable"
        (click)="zoomable && openZoom()"
        [attr.loading]="lazy ? 'lazy' : 'eager'"
      />
      @if (caption) {
        <figcaption class="docs-caption">{{ caption }}</figcaption>
      }
    </figure>

    @if (isZoomed()) {
      <div class="zoom-overlay" (click)="closeZoom()">
        <button class="zoom-close" aria-label="Close zoom">
          <lucide-icon name="x" [size]="24"></lucide-icon>
        </button>
        <img [src]="src" [alt]="alt" class="zoom-image" (click)="$event.stopPropagation()" />
      </div>
    }
  `,
  styles: [
    `
      .docs-figure {
        margin: 1.5rem 0;

        &.has-caption {
          text-align: center;
        }
      }

      .docs-image {
        max-width: 100%;
        height: auto;
        border-radius: var(--docs-radius-lg, 12px);
        box-shadow: var(--docs-shadow, 0 2px 8px rgba(0, 0, 0, 0.06));

        &.zoomable {
          cursor: zoom-in;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;

          &:hover {
            transform: scale(1.01);
            box-shadow: var(--docs-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
          }
        }
      }

      .docs-caption {
        margin-top: 0.75rem;
        font-size: 0.875rem;
        color: var(--docs-text-muted, #8891a4);
        font-style: italic;
      }

      .zoom-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        cursor: zoom-out;
        animation: fadeIn 0.2s ease;
      }

      .zoom-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.75rem;
        color: white;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: var(--docs-radius-full, 9999px);
        cursor: pointer;
        transition: background 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      .zoom-image {
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
        border-radius: var(--docs-radius-lg, 12px);
        cursor: default;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsImageZoomComponent {
  @Input() src!: string;
  @Input() alt = '';
  @Input() caption?: string;
  @Input() zoomable = true;
  @Input() lazy = true;

  isZoomed = signal(false);

  openZoom() {
    this.isZoomed.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeZoom() {
    this.isZoomed.set(false);
    document.body.style.overflow = '';
  }
}

// =============================================================================
// C69: VIDEO EMBED COMPONENT
// =============================================================================

@Component({
  selector: 'app-docs-video',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="docs-video" [class.loaded]="isLoaded()">
      @if (!isLoaded()) {
        <div class="video-placeholder" (click)="loadVideo()">
          @if (thumbnail) {
            <img
              [src]="thumbnail"
              [alt]="title"
              class="video-thumbnail"
              (error)="onThumbnailError($event)"
            />
          }
          <div class="video-play">
            <lucide-icon name="play" [size]="48"></lucide-icon>
          </div>
          @if (title) {
            <span class="video-title">{{ title }}</span>
          }
        </div>
      } @else {
        <iframe
          [src]="sanitizedUrl()"
          [title]="title"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="video-iframe"
        ></iframe>
      }
    </div>
  `,
  styles: [
    `
      .docs-video {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        margin: 1.5rem 0;
        border-radius: var(--docs-radius-lg, 12px);
        overflow: hidden;
        background: var(--docs-bg-tertiary, #eef1f5);
      }

      .video-placeholder {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          .video-play {
            transform: scale(1.1);
            background: var(--docs-primary, #ff7900);
          }
        }
      }

      .video-thumbnail {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .video-play {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        color: white;
        background: rgba(0, 0, 0, 0.7);
        border-radius: var(--docs-radius-full, 9999px);
        transition: all 0.2s ease;
      }

      .video-title {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        right: 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }

      .video-iframe {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsVideoComponent {
  @Input() src!: string;
  @Input() title = 'Video';
  @Input() thumbnail?: string;

  isLoaded = signal(false);

  loadVideo() {
    this.isLoaded.set(true);
  }

  onThumbnailError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Hide the image when it fails to load to prevent broken image icons
    img.style.display = 'none';
  }

  sanitizedUrl(): string {
    // Convert YouTube watch URLs to embed URLs
    if (this.src.includes('youtube.com/watch')) {
      const videoId = new URL(this.src).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (this.src.includes('youtu.be/')) {
      const videoId = this.src.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return this.src;
  }
}

// =============================================================================
// C75: FAQ ACCORDION COMPONENT
// =============================================================================

@Component({
  selector: 'app-docs-faq',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="docs-faq">
      @if (title) {
        <h3 class="faq-title">{{ title }}</h3>
      }
      <div class="faq-list">
        @for (item of items; track $index; let i = $index) {
          <div class="faq-item" [class.expanded]="expandedItems().has(i)">
            <button
              class="faq-question"
              (click)="toggle(i)"
              [attr.aria-expanded]="expandedItems().has(i)"
              [attr.aria-controls]="'faq-answer-' + i"
            >
              <span>{{ item.question }}</span>
              <lucide-icon
                [name]="expandedItems().has(i) ? 'chevron-up' : 'chevron-down'"
                [size]="18"
                class="faq-icon"
              ></lucide-icon>
            </button>
            @if (expandedItems().has(i)) {
              <div [id]="'faq-answer-' + i" class="faq-answer" role="region">
                <div class="faq-answer-content" [innerHTML]="item.answer"></div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .docs-faq {
        margin: 1.5rem 0;
      }

      .faq-title {
        margin: 0 0 1rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--docs-text, #1a1d23);
      }

      .faq-list {
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius-lg, 12px);
        overflow: hidden;
      }

      .faq-item {
        border-bottom: 1px solid var(--docs-border, #e2e8f0);

        &:last-child {
          border-bottom: none;
        }

        &.expanded {
          .faq-question {
            background: var(--docs-bg-secondary, #f4f6f9);
          }
        }
      }

      .faq-question {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 1rem 1.25rem;
        font-family: inherit;
        font-size: 1rem;
        font-weight: 500;
        color: var(--docs-text, #1a1d23);
        background: transparent;
        border: none;
        text-align: left;
        cursor: pointer;
        transition: background 0.2s ease;

        &:hover {
          background: var(--docs-hover-bg, rgba(255, 121, 0, 0.04));
        }
      }

      .faq-icon {
        flex-shrink: 0;
        color: var(--docs-text-muted, #8891a4);
      }

      .faq-answer {
        animation: slideDown 0.2s ease;
      }

      .faq-answer-content {
        padding: 0 1.25rem 1rem;
        color: var(--docs-text-secondary, #4a5568);
        line-height: 1.7;
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsFAQComponent {
  @Input() items: FAQItem[] = [];
  @Input() title?: string;
  @Input() allowMultiple = false;

  expandedItems = signal<Set<number>>(new Set());

  toggle(index: number) {
    this.expandedItems.update((set) => {
      const newSet = this.allowMultiple ? new Set(set) : new Set<number>();
      if (set.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }
}

// =============================================================================
// C74: STEPS COMPONENT
// =============================================================================

@Component({
  selector: 'app-docs-steps',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="docs-steps">
      @if (title) {
        <h3 class="steps-title">{{ title }}</h3>
      }
      <div class="steps-list">
        @for (step of steps; track $index; let i = $index) {
          <div class="step" [attr.data-step]="i + 1">
            <div class="step-number">{{ i + 1 }}</div>
            <div class="step-content">
              <h4 class="step-title">{{ step.title }}</h4>
              <div class="step-description" [innerHTML]="step.content"></div>
              @if (step.code) {
                <pre class="step-code"><code>{{ step.code }}</code></pre>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .docs-steps {
        margin: 1.5rem 0;
      }

      .steps-title {
        margin: 0 0 1.5rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--docs-text, #1a1d23);
      }

      .steps-list {
        position: relative;
        padding-left: 2.5rem;

        &::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 16px;
          bottom: 16px;
          width: 2px;
          background: var(--docs-border, #e2e8f0);
        }
      }

      .step {
        position: relative;
        padding-bottom: 2rem;

        &:last-child {
          padding-bottom: 0;
        }
      }

      .step-number {
        position: absolute;
        left: -2.5rem;
        top: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 700;
        color: white;
        background: var(--docs-primary, #ff7900);
        border-radius: var(--docs-radius-full, 9999px);
        box-shadow: var(--docs-shadow, 0 2px 8px rgba(0, 0, 0, 0.06));
      }

      .step-content {
        padding-top: 0.25rem;
      }

      .step-title {
        margin: 0 0 0.5rem;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--docs-text, #1a1d23);
      }

      .step-description {
        color: var(--docs-text-secondary, #4a5568);
        line-height: 1.7;
      }

      .step-code {
        margin-top: 1rem;
        padding: 1rem;
        font-size: 0.875rem;
        background: var(--docs-pre-bg, #0f172a);
        color: var(--docs-pre-text, #e2e8f0);
        border-radius: var(--docs-radius-md, 8px);
        overflow-x: auto;

        code {
          font-family: var(--docs-font-mono, monospace);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsStepsComponent {
  @Input() steps: StepItem[] = [];
  @Input() title?: string;
}

// =============================================================================
// C73: COMPARISON TABLE COMPONENT
// =============================================================================

@Component({
  selector: 'app-docs-comparison',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="docs-comparison">
      @if (title) {
        <h3 class="comparison-title">{{ title }}</h3>
      }
      <div class="comparison-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Feature</th>
              @for (col of columns; track col) {
                <th>{{ col }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (item of items; track item.feature) {
              <tr>
                <td class="feature-name">{{ item.feature }}</td>
                @for (col of columns; track col) {
                  <td class="feature-value">
                    @if (isBooleanValue(item[col])) {
                      @if (item[col]) {
                        <lucide-icon name="check" [size]="18" class="check-icon"></lucide-icon>
                      } @else {
                        <lucide-icon name="x" [size]="18" class="x-icon"></lucide-icon>
                      }
                    } @else {
                      {{ item[col] }}
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .docs-comparison {
        margin: 1.5rem 0;
      }

      .comparison-title {
        margin: 0 0 1rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--docs-text, #1a1d23);
      }

      .comparison-wrapper {
        overflow-x: auto;
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius-lg, 12px);
      }

      .comparison-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      th,
      td {
        padding: 0.875rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--docs-border-light, #f1f5f9);
      }

      th {
        font-weight: 600;
        color: var(--docs-text, #1a1d23);
        background: var(--docs-bg-secondary, #f4f6f9);
        white-space: nowrap;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover td {
        background: var(--docs-hover-bg, rgba(255, 121, 0, 0.04));
      }

      .feature-name {
        font-weight: 500;
        color: var(--docs-text, #1a1d23);
      }

      .feature-value {
        color: var(--docs-text-secondary, #4a5568);
      }

      .check-icon {
        color: var(--docs-tip-text, #047857);
      }

      .x-icon {
        color: var(--docs-text-muted, #8891a4);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsComparisonComponent {
  @Input() items: ComparisonItem[] = [];
  @Input() columns: string[] = [];
  @Input() title?: string;

  isBooleanValue(value: unknown): boolean {
    return typeof value === 'boolean';
  }
}

// =============================================================================
// C70: DIAGRAM COMPONENT (Mermaid Placeholder)
// =============================================================================

@Component({
  selector: 'app-docs-diagram',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="docs-diagram">
      @if (title) {
        <div class="diagram-header">
          <lucide-icon name="git-branch" [size]="18"></lucide-icon>
          <span>{{ title }}</span>
        </div>
      }
      <div class="diagram-content" #diagramContainer>
        @if (!isLoaded()) {
          <div class="diagram-loading">
            <lucide-icon name="loader-2" [size]="24" class="spin"></lucide-icon>
            <span>Loading diagram...</span>
          </div>
        }
        <!-- Mermaid will render here -->
        <pre class="mermaid" [innerHTML]="code"></pre>
      </div>
      @if (caption) {
        <div class="diagram-caption">{{ caption }}</div>
      }
    </div>
  `,
  styles: [
    `
      .docs-diagram {
        margin: 1.5rem 0;
        border: 1px solid var(--docs-border, #e2e8f0);
        border-radius: var(--docs-radius-lg, 12px);
        overflow: hidden;
      }

      .diagram-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--docs-text-secondary, #4a5568);
        background: var(--docs-bg-secondary, #f4f6f9);
        border-bottom: 1px solid var(--docs-border, #e2e8f0);
      }

      .diagram-content {
        padding: 2rem;
        background: var(--docs-surface, #fff);
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .diagram-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        color: var(--docs-text-muted, #8891a4);

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

      .mermaid {
        margin: 0;
        background: transparent;
      }

      .diagram-caption {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--docs-text-muted, #8891a4);
        text-align: center;
        border-top: 1px solid var(--docs-border, #e2e8f0);
        background: var(--docs-bg-secondary, #f4f6f9);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsDiagramComponent implements AfterViewInit {
  @ViewChild('diagramContainer') containerRef!: ElementRef;

  @Input() code!: string;
  @Input() title?: string;
  @Input() caption?: string;

  isLoaded = signal(false);

  ngAfterViewInit() {
    // Load Mermaid library dynamically
    this.loadMermaid();
  }

  private async loadMermaid() {
    try {
      // Check if Mermaid is already loaded
      if (typeof (window as any).mermaid !== 'undefined') {
        (window as any).mermaid.init(
          undefined,
          this.containerRef.nativeElement.querySelectorAll('.mermaid')
        );
        this.isLoaded.set(true);
        return;
      }

      // Dynamically load Mermaid
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
      script.onload = () => {
        (window as any).mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
        (window as any).mermaid.init(
          undefined,
          this.containerRef.nativeElement.querySelectorAll('.mermaid')
        );
        this.isLoaded.set(true);
      };
      document.head.appendChild(script);
    } catch (e) {
      console.error('Failed to load Mermaid:', e);
      this.isLoaded.set(true);
    }
  }
}
