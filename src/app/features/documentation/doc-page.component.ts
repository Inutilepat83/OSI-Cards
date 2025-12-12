import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  createComponent,
  ElementRef,
  EnvironmentInjector,
  inject,
  Input,
  isDevMode,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';
// Import card renderer from the OSI Cards library to ensure docs show actual library output
import { AICardRendererComponent } from '@osi-cards/components';
import { of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { DocCacheService } from './services/doc-cache.service';

// Content cache for faster re-renders (production only)
// Version bumped when rendering logic changes to invalidate stale cache
const CACHE_VERSION = 2;
const contentCache = new Map<
  string,
  {
    html: string;
    toc: { id: string; text: string; level: number }[];
    configs: Map<string, unknown>;
  }
>();

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface PageLink {
  label: string;
  path: string;
}

/**
 * Pre-rendered page data structure (from JSON files)
 */
interface PrerenderedPage {
  pageId: string;
  title: string;
  html: string;
  toc: { id: string; text: string; level: number }[];
  contentHash: string;
  generatedAt: string;
  demoConfigs: Record<string, unknown>;
}

/**
 * Enhanced documentation page component
 * Renders markdown content with:
 * - Callout boxes (tip, warning, info, danger)
 * - Copy button for code blocks
 * - Syntax highlighting
 * - Anchor links on headings
 * - Table of contents
 * - Live demos support
 */
@Component({
  selector: 'app-doc-page',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <article class="doc-page">
      @if (isLoading()) {
        <!-- Skeleton Loading State -->
        <div class="doc-content doc-skeleton">
          <div class="skeleton-title"></div>
          <div class="skeleton-subtitle"></div>
          <div class="skeleton-paragraph"></div>
          <div class="skeleton-paragraph short"></div>
          <div class="skeleton-code"></div>
          <div class="skeleton-heading"></div>
          <div class="skeleton-paragraph"></div>
          <div class="skeleton-paragraph medium"></div>
          <div class="skeleton-table"></div>
        </div>
        <aside class="doc-toc doc-skeleton">
          <div class="skeleton-toc-title"></div>
          <div class="skeleton-toc-item"></div>
          <div class="skeleton-toc-item short"></div>
          <div class="skeleton-toc-item"></div>
          <div class="skeleton-toc-item medium"></div>
        </aside>
      } @else {
        <!-- Breadcrumb Navigation -->
        @if (breadcrumbs.length > 0) {
          <nav class="doc-breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li>
                <a routerLink="/">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <span>Home</span>
                </a>
              </li>
              @for (crumb of breadcrumbs; track crumb.path; let last = $last) {
                <li>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="separator"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  @if (last) {
                    <span class="current">{{ crumb.label }}</span>
                  } @else {
                    <a [routerLink]="crumb.path">{{ crumb.label }}</a>
                  }
                </li>
              }
            </ol>
          </nav>
        }

        <div class="doc-content" [innerHTML]="renderedContent()"></div>

        <!-- Edit on GitHub Link -->
        @if (githubEditUrl) {
          <div class="doc-edit-github">
            <a [href]="githubEditUrl" target="_blank" rel="noopener noreferrer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit this page on GitHub
            </a>
          </div>
        }

        <!-- Previous / Next Navigation -->
        @if (prevPage || nextPage) {
          <nav class="doc-page-nav" aria-label="Page navigation">
            @if (prevPage) {
              <a [routerLink]="prevPage.path" class="nav-link prev">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <div class="nav-content">
                  <span class="nav-label">Previous</span>
                  <span class="nav-title">{{ prevPage.label }}</span>
                </div>
              </a>
            } @else {
              <div class="nav-link-placeholder"></div>
            }
            @if (nextPage) {
              <a [routerLink]="nextPage.path" class="nav-link next">
                <div class="nav-content">
                  <span class="nav-label">Next</span>
                  <span class="nav-title">{{ nextPage.label }}</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </a>
            } @else {
              <div class="nav-link-placeholder"></div>
            }
          </nav>
        }

        @if (toc().length > 0) {
          <aside class="doc-toc">
            <h4>On this page</h4>
            <nav>
              @for (item of toc(); track item.id) {
                <a
                  [href]="'#' + item.id"
                  [class.level-2]="item.level === 2"
                  [class.level-3]="item.level === 3"
                  [class.level-4]="item.level === 4"
                  [class.active]="activeSection() === item.id"
                  (click)="scrollToSection($event, item.id)"
                >
                  {{ item.text }}
                </a>
              }
            </nav>
          </aside>
        }
      }
    </article>
  `,
  styles: [
    `
      /* ========================================================================
       Skeleton Loading Animation
       ======================================================================== */

      @keyframes skeleton-pulse {
        0%,
        100% {
          opacity: 0.4;
        }
        50% {
          opacity: 0.7;
        }
      }

      .doc-skeleton {
        .skeleton-title,
        .skeleton-subtitle,
        .skeleton-heading,
        .skeleton-paragraph,
        .skeleton-code,
        .skeleton-table,
        .skeleton-toc-title,
        .skeleton-toc-item {
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
          border-radius: 4px;
        }

        .skeleton-title {
          height: 48px;
          width: 60%;
          margin-bottom: 1rem;
        }

        .skeleton-subtitle {
          height: 60px;
          width: 4px;
          margin-bottom: 2rem;
          background: linear-gradient(90deg, #ff7900, #ffab5c);
          animation: none;
        }

        .skeleton-heading {
          height: 28px;
          width: 40%;
          margin: 2rem 0 1rem;
        }

        .skeleton-paragraph {
          height: 20px;
          width: 100%;
          margin-bottom: 0.75rem;

          &.short {
            width: 75%;
          }
          &.medium {
            width: 85%;
          }
        }

        .skeleton-code {
          height: 150px;
          width: 100%;
          margin: 1.5rem 0;
          border-radius: 12px;
        }

        .skeleton-table {
          height: 200px;
          width: 100%;
          margin: 1.5rem 0;
          border-radius: 12px;
        }

        .skeleton-toc-title {
          height: 14px;
          width: 80px;
          margin-bottom: 1rem;
        }

        .skeleton-toc-item {
          height: 16px;
          width: 100%;
          margin-bottom: 0.5rem;

          &.short {
            width: 60%;
          }
          &.medium {
            width: 80%;
          }
        }
      }

      /* Dark mode skeleton */
      :host-context(.dark) .doc-skeleton,
      :host-context([data-theme='dark']) .doc-skeleton {
        .skeleton-title,
        .skeleton-subtitle,
        .skeleton-heading,
        .skeleton-paragraph,
        .skeleton-code,
        .skeleton-table,
        .skeleton-toc-title,
        .skeleton-toc-item {
          background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
          background-size: 200% 100%;
        }
      }

      /* ========================================================================
       Edit on GitHub Link
       ======================================================================== */

      .doc-edit-github {
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--docs-border, #e5e7eb);

        a {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--docs-text-secondary, #6b7280);
          text-decoration: none;
          transition: color 0.15s ease;

          &:hover {
            color: var(--docs-primary, #ff7900);
          }

          svg {
            flex-shrink: 0;
          }
        }
      }

      /* ========================================================================
       Page Navigation (Previous / Next)
       ======================================================================== */

      .doc-page-nav {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--docs-border, #e5e7eb);
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        background: var(--docs-bg-secondary, #f9fafb);
        border: 1px solid var(--docs-border, #e5e7eb);
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.2s ease;

        &:hover {
          background: var(--docs-bg-tertiary, #f3f4f6);
          border-color: var(--docs-primary, #ff7900);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

          svg {
            color: var(--docs-primary, #ff7900);
          }
        }

        svg {
          flex-shrink: 0;
          color: var(--docs-text-muted, #9ca3af);
          transition: color 0.2s ease;
        }

        &.prev {
          justify-content: flex-start;
        }

        &.next {
          justify-content: flex-end;
          text-align: right;
        }
      }

      .nav-link-placeholder {
        min-height: 1px;
      }

      .nav-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .nav-label {
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--docs-text-muted, #9ca3af);
      }

      .nav-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--docs-text, #374151);
      }

      @media (max-width: 640px) {
        .doc-page-nav {
          grid-template-columns: 1fr;
        }
      }

      /* ========================================================================
       Breadcrumb Navigation
       ======================================================================== */

      .doc-breadcrumbs {
        margin-bottom: 1.5rem;

        ol {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.25rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        li {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
        }

        a {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--docs-text-secondary, #6b7280);
          text-decoration: none;
          transition: color 0.15s ease;

          &:hover {
            color: var(--docs-primary, #ff7900);
          }

          svg {
            flex-shrink: 0;
          }
        }

        .separator {
          color: var(--docs-text-muted, #9ca3af);
          margin: 0 0.25rem;
        }

        .current {
          color: var(--docs-text, #374151);
          font-weight: 500;
        }
      }

      /* ========================================================================
       Documentation Page Layout
       ======================================================================== */

      .doc-page {
        display: grid;
        grid-template-columns: 1fr minmax(240px, 320px);
        gap: 2rem;
        width: 100%;

        /* Content should be in column 1, TOC in column 2 */
        .doc-breadcrumbs,
        .doc-content,
        .doc-edit-github,
        .doc-page-nav,
        .doc-skeleton:first-child {
          grid-column: 1;
        }

        .doc-toc {
          grid-column: 2;
          grid-row: 1 / -1;
        }

        /* CSS Variables */
        --docs-heading: #1a1a2e;
        --docs-text: #374151;
        --docs-text-secondary: #6b7280;
        --docs-text-muted: #9ca3af;
        --docs-border: #e5e7eb;
        --docs-border-light: #f3f4f6;
        --docs-primary: #ff7900;
        --docs-primary-bg: rgba(255, 121, 0, 0.08);
        --docs-code-bg: #f6f8fa;
        --docs-code-text: #d63384;
        --docs-pre-bg: #161b22;
        --docs-pre-text: #e6edf3;
        --docs-blockquote-bg: rgba(255, 121, 0, 0.06);
        --docs-th-bg: #f9fafb;
        --docs-link: #ff7900;
        --docs-link-hover: #e56d00;

        /* Callout colors */
        --docs-tip-bg: rgba(46, 160, 67, 0.08);
        --docs-tip-border: #2da44e;
        --docs-tip-text: #1a7f37;
        --docs-warning-bg: rgba(210, 153, 34, 0.08);
        --docs-warning-border: #d29922;
        --docs-warning-text: #9a6700;
        --docs-info-bg: rgba(47, 129, 247, 0.08);
        --docs-info-border: #2f81f7;
        --docs-info-text: #0969da;
        --docs-danger-bg: rgba(248, 81, 73, 0.08);
        --docs-danger-border: #f85149;
        --docs-danger-text: #cf222e;
      }

      /* ========================================================================
       Content Area Typography
       ======================================================================== */

      .doc-content {
        min-width: 0;
        width: 100%;

        /* Prose content should be readable width, but code/tables can expand */
        > p,
        > ul:not(.toc-list),
        > ol {
          max-width: 72ch;
        }

        /* Code blocks and tables use full available width */
        .code-block-wrapper,
        .table-wrapper,
        pre {
          max-width: 100%;
        }

        /* Headings */
        h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          color: var(--docs-heading);
          line-height: 1.2;
          letter-spacing: -0.02em;

          &::after {
            content: '';
            display: block;
            width: 60px;
            height: 4px;
            background: linear-gradient(90deg, var(--docs-primary), #ffab5c);
            margin-top: 1rem;
            border-radius: 2px;
          }
        }

        h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 1.25rem 0 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--docs-border-light);
          color: var(--docs-heading);
          letter-spacing: -0.01em;
          position: relative;

          &:first-child {
            margin-top: 0;
            padding-top: 0;
            border-top: none;
          }
        }

        h3 {
          font-size: 1.375rem;
          font-weight: 600;
          margin: 2rem 0 0.75rem;
          color: var(--docs-heading);
          position: relative;
        }

        h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem;
          color: var(--docs-heading);
        }

        h5,
        h6 {
          font-size: 1rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
          color: var(--docs-text-secondary);
        }

        /* Anchor links */
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          scroll-margin-top: 80px;

          .anchor-link {
            position: absolute;
            left: -1.5em;
            top: 50%;
            transform: translateY(-50%);
            opacity: 0;
            color: var(--docs-text-muted);
            text-decoration: none;
            font-weight: normal;
            transition: opacity 0.2s;

            &:hover {
              color: var(--docs-primary);
            }
          }

          &:hover .anchor-link {
            opacity: 1;
          }
        }

        /* Paragraphs */
        p {
          margin-bottom: 1rem;
          line-height: 1.75;
          color: var(--docs-text);
        }

        strong {
          font-weight: 600;
          color: var(--docs-heading);
        }

        em {
          font-style: italic;
        }

        /* Lists */
        ul,
        ol {
          margin: 0.5rem 0 0.75rem 0;
          padding-left: 0;
          color: var(--docs-text);
          line-height: 1.6;
        }

        /* Collapse margin between consecutive lists (when each bullet is its own ul) */
        ul + ul,
        ol + ol,
        ul + ol,
        ol + ul,
        ul + br + ul,
        ol + br + ol {
          margin-top: -0.75rem;
        }

        ul {
          list-style: none;

          li {
            position: relative;
            padding-left: 1.5em;
            margin-bottom: 0.25em;

            &::before {
              content: '';
              position: absolute;
              left: 0;
              top: 0.65em;
              width: 6px;
              height: 6px;
              background: var(--docs-primary);
              border-radius: 50%;
            }
          }
        }

        ol {
          list-style: none;
          counter-reset: list-counter;

          li {
            position: relative;
            padding-left: 2em;
            margin-bottom: 0.5em;
            counter-increment: list-counter;

            &::before {
              content: counter(list-counter);
              position: absolute;
              left: 0;
              top: 0;
              width: 1.5em;
              height: 1.5em;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.75em;
              font-weight: 600;
              color: var(--docs-primary);
              background: var(--docs-primary-bg);
              border-radius: 4px;
            }
          }
        }

        /* Nested lists */
        li {
          ul,
          ol {
            margin-top: 0.5rem;
            margin-bottom: 0;
          }
        }

        /* Links */
        a {
          color: var(--docs-link);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.15s;

          &:hover {
            color: var(--docs-link-hover);
            text-decoration: underline;
          }
        }

        /* Inline code */
        code {
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
          font-size: 0.875em;
          padding: 0.125em 0.375em;
          background: var(--docs-code-bg);
          border-radius: 4px;
          color: var(--docs-code-text);
          font-weight: 500;
        }

        /* Code blocks */
        .code-block-wrapper {
          position: relative;
          margin: 1.25rem 0;
          border-radius: 12px;
          overflow: hidden;
          background: var(--docs-pre-bg);

          .code-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.35rem 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            min-height: auto;
            height: auto;
          }

          .code-lang {
            font-size: 0.625rem;
            font-weight: 600;
            color: #8b949e;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            line-height: 1;
          }

          .code-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .copy-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            font-weight: 500;
            color: #8b949e;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s;
            line-height: 1;

            &:hover {
              background: rgba(255, 255, 255, 0.2);
              color: #fff;
            }

            &.copied {
              color: #3fb950;
              background: rgba(63, 185, 80, 0.2);
            }

            svg {
              width: 14px;
              height: 14px;
              flex-shrink: 0;
            }
          }

          .live-demo-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: #fff;
            background: linear-gradient(135deg, #ff7900 0%, #ff5722 100%);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s;
            line-height: 1;

            &:hover {
              background: linear-gradient(135deg, #ff8c1a 0%, #ff6b3d 100%);
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(255, 121, 0, 0.3);
            }

            svg {
              width: 14px;
              height: 14px;
              flex-shrink: 0;
            }
          }
        }

        /* Live Demo Container */
        .live-demo-container {
          max-height: 0;
          overflow: hidden;
          transition:
            max-height 0.3s ease,
            padding 0.3s ease,
            margin 0.3s ease;
          background: var(--docs-blockquote-bg, rgba(255, 121, 0, 0.06));
          border-radius: 0 0 12px 12px;
          margin-top: 0;
          margin-bottom: 1rem;

          &.expanded {
            max-height: 2000px; /* Large enough for most cards, allows smooth transition */
            min-height: 200px;
            padding: 1rem;
            overflow: visible;
          }

          .live-demo-preview {
            border: 1px solid var(--docs-border, #e5e7eb);
            border-radius: 8px;
            background: var(--docs-surface, #fff);
            overflow: visible;
            width: 100%;
            display: flex;
            flex-direction: column;

            .demo-header {
              padding: 0.5rem 1rem;
              background: var(--docs-bg-secondary, #f6f8fa);
              border-bottom: 1px solid var(--docs-border-light, #f3f4f6);
              flex-shrink: 0;
            }

            .demo-label {
              font-size: 0.75rem;
              font-weight: 600;
              color: var(--docs-primary, #ff7900);
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }

            .demo-content {
              padding: 1.5rem;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              align-items: stretch;
              background: linear-gradient(135deg, #f8f9fa 0%, #fff 50%, #f8f9fa 100%);
              min-height: 200px;
              width: 100%;
              box-sizing: border-box;
              position: relative;
              overflow: visible;

              app-ai-card-renderer {
                max-width: 100%;
                width: 100%;
                min-width: 0;
                display: block;
                flex: 1 1 auto;
                padding: 0 !important;
                margin: 0 !important;
                height: auto;
                min-height: 0;
              }
            }
          }

          .demo-error {
            padding: 1rem;
            color: var(--docs-danger-text, #cf222e);
            background: var(--docs-danger-bg, rgba(248, 81, 73, 0.08));
            border-radius: 8px;
            text-align: center;
          }
        }

        pre {
          margin: 0;
          padding: 0.75rem 1rem;
          overflow-x: auto;

          /* Discrete scrollbar */
          &::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }

          &::-webkit-scrollbar-track {
            background: transparent;
          }

          &::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 2px;

            &:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          }

          code {
            display: block;
            padding: 0;
            background: none;
            color: var(--docs-pre-text);
            font-size: 0.8125rem;
            line-height: 1.7;
            font-weight: normal;
          }
        }

        /* Blockquotes */
        blockquote {
          margin: 1.25rem 0;
          padding: 1rem 1.25rem;
          border-left: 4px solid var(--docs-primary);
          background: var(--docs-blockquote-bg);
          border-radius: 0 8px 8px 0;

          p {
            margin: 0;
            color: var(--docs-heading);
            font-style: italic;
          }
        }

        /* Tables */
        .table-wrapper {
          overflow-x: auto;
          margin: 1.25rem 0;
          border-radius: 12px;
          border: 1px solid var(--docs-border);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        th,
        td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--docs-border-light);
        }

        th {
          font-weight: 600;
          color: var(--docs-heading);
          background: var(--docs-th-bg);
          white-space: nowrap;
        }

        td {
          color: var(--docs-text);
        }

        tr:last-child td {
          border-bottom: none;
        }

        tbody tr:hover td {
          background: rgba(255, 121, 0, 0.04);
        }

        /* Horizontal rule */
        hr {
          margin: 2.5rem 0;
          border: none;
          border-top: 1px solid var(--docs-border);
        }

        /* Images */
        img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1rem 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        /* ====================================================================
         Callout Boxes
         ==================================================================== */

        .callout {
          margin: 1.25rem 0;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          border-left: 4px solid;
          display: flex;
          gap: 0.75rem;

          .callout-icon {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            margin-top: 2px;
          }

          .callout-content {
            flex: 1;
            min-width: 0;

            p {
              margin: 0;
              color: inherit;
            }

            p + p {
              margin-top: 0.5em;
            }

            strong {
              color: inherit;
            }

            code {
              background: rgba(255, 255, 255, 0.2);
            }
          }

          .callout-title {
            font-weight: 600;
            margin-bottom: 0.25em;
            display: block;
          }

          &.tip {
            background: var(--docs-tip-bg);
            border-color: var(--docs-tip-border);
            color: var(--docs-tip-text);
          }

          &.warning {
            background: var(--docs-warning-bg);
            border-color: var(--docs-warning-border);
            color: var(--docs-warning-text);
          }

          &.info {
            background: var(--docs-info-bg);
            border-color: var(--docs-info-border);
            color: var(--docs-info-text);
          }

          &.danger {
            background: var(--docs-danger-bg);
            border-color: var(--docs-danger-border);
            color: var(--docs-danger-text);
          }
        }
      }

      /* ========================================================================
       Table of Contents
       ======================================================================== */

      .doc-toc {
        position: sticky;
        top: 2rem;
        height: fit-content;
        padding-left: 1rem;
        border-left: 1px solid var(--docs-border, #e5e7eb);
        min-width: 180px;

        h4 {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--docs-text-muted, #9ca3af);
          margin-bottom: 0.75rem;
        }

        nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        a {
          font-size: 0.8125rem;
          color: var(--docs-text-secondary, #6b7280);
          text-decoration: none;
          padding: 0.25rem 0;
          transition: all 0.15s;
          display: block;
          word-wrap: break-word;
          overflow-wrap: break-word;
          line-height: 1.4;

          &:hover {
            color: var(--docs-primary, #ff7900);
          }

          &.active {
            color: var(--docs-primary, #ff7900);
            font-weight: 500;
          }

          &.level-3 {
            padding-left: 0.75rem;
            font-size: 0.75rem;
          }

          &.level-4 {
            padding-left: 1.5rem;
            font-size: 0.75rem;
            color: var(--docs-text-muted, #9ca3af);
          }
        }
      }

      /* ========================================================================
       Dark Mode
       ======================================================================== */

      :host-context(.dark) .doc-page,
      :host-context([data-theme='dark']) .doc-page {
        --docs-heading: #e5e7eb;
        --docs-text: #9ca3af;
        --docs-text-secondary: #6b7280;
        --docs-text-muted: #4b5563;
        --docs-border: #374151;
        --docs-border-light: #1f2937;
        --docs-code-bg: #1f2937;
        --docs-code-text: #f472b6;
        --docs-pre-bg: #0d1117;
        --docs-pre-text: #e6edf3;
        --docs-blockquote-bg: rgba(255, 121, 0, 0.1);
        --docs-th-bg: #1f2937;
        --docs-link: #ff9433;
        --docs-link-hover: #ffab5c;
        --docs-primary-bg: rgba(255, 148, 51, 0.15);

        --docs-tip-bg: rgba(63, 185, 80, 0.12);
        --docs-tip-border: #3fb950;
        --docs-tip-text: #56d364;
        --docs-warning-bg: rgba(210, 153, 34, 0.12);
        --docs-warning-border: #d29922;
        --docs-warning-text: #e3b341;
        --docs-info-bg: rgba(88, 166, 255, 0.12);
        --docs-info-border: #58a6ff;
        --docs-info-text: #79c0ff;
        --docs-danger-bg: rgba(248, 81, 73, 0.12);
        --docs-danger-border: #f85149;
        --docs-danger-text: #ff7b72;
      }

      /* ========================================================================
       Responsive
       ======================================================================== */

      @media (max-width: 1024px) {
        .doc-page {
          grid-template-columns: 1fr;
        }

        .doc-toc {
          display: none;
        }

        /* Live Demo Container - Tablet */
        .live-demo-container {
          &.expanded {
            padding: 0.875rem;
          }

          .live-demo-preview {
            .demo-content {
              padding: 1.25rem;
            }
          }
        }
      }

      @media (max-width: 768px) {
        .doc-content {
          padding: 1.5rem 1rem;
        }

        h1 {
          font-size: 1.75rem !important;
        }

        h2 {
          font-size: 1.5rem !important;
        }

        h3 {
          font-size: 1.25rem !important;
        }

        .code-block-wrapper {
          margin: 1rem -1rem;
          border-radius: 0;

          .code-header {
            padding: 0.35rem 0.75rem;
          }

          pre {
            padding: 0.75rem;
          }
        }

        .table-wrapper {
          margin: 1rem -1rem;
          border-radius: 0;
          border-left: none;
          border-right: none;
        }

        .callout {
          margin: 1rem -1rem;
          border-radius: 0;
        }

        .doc-page-nav {
          flex-direction: column;
          gap: 0.75rem;
        }

        /* Live Demo Container - Mobile */
        .live-demo-container {
          &.expanded {
            padding: 0.75rem;
            margin-bottom: 0.75rem;
          }

          .live-demo-preview {
            .demo-header {
              padding: 0.5rem 0.75rem;
            }

            .demo-content {
              padding: 1rem;
              min-height: 150px;
            }
          }
        }
      }

      @media (max-width: 480px) {
        .doc-content {
          padding: 1rem 0.75rem;
        }

        h1 {
          font-size: 1.5rem !important;
        }

        h2 {
          font-size: 1.25rem !important;
          margin: 1rem 0 0.75rem !important;
        }

        h3 {
          font-size: 1.125rem !important;
        }

        .code-header .code-lang {
          font-size: 0.5rem;
        }

        .copy-btn {
          font-size: 0.625rem;
          padding: 0.2rem 0.4rem;
        }

        pre code {
          font-size: 0.75rem;
        }

        ul li,
        ol li {
          padding-left: 1.25em;
        }

        /* Live Demo Container - Small Mobile */
        .live-demo-container {
          &.expanded {
            padding: 0.5rem;
            margin-bottom: 0.5rem;
          }

          .live-demo-preview {
            border-radius: 6px;

            .demo-header {
              padding: 0.375rem 0.5rem;
            }

            .demo-content {
              padding: 0.75rem;
              min-height: 120px;
            }
          }
        }
      }

      /* ========================================================================
       LLM Prompt - Standalone Copy Button
       ======================================================================== */

      .llm-copy-standalone {
        display: flex;
        justify-content: center;
        margin: 2rem 0 1rem 0;
      }

      .llm-copy-btn {
        background: linear-gradient(135deg, #ff7900 0%, #e06800 100%);
        color: #fff;
        font-family: inherit;
        font-weight: 800;
        font-size: 1.25rem;
        padding: 1rem 3rem;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        box-shadow: 0 4px 20px rgba(255, 121, 0, 0.4);
        transition: all 0.2s;
        user-select: none;
      }

      .llm-copy-btn:hover {
        background: linear-gradient(135deg, #ff8c1a 0%, #ff7900 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 28px rgba(255, 121, 0, 0.5);
      }

      .llm-copy-btn:active {
        transform: translateY(0);
      }

      .llm-copy-btn.copied {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      }

      /* ========================================================================
       LLM Prompt Block - Code block styling
       ======================================================================== */

      .code-block-wrapper:has(.language-llm) {
        border: 5px solid var(--docs-primary, #ff7900) !important;
        border-radius: 16px !important;
        box-shadow:
          0 4px 24px rgba(255, 121, 0, 0.15),
          0 8px 32px rgba(0, 0, 0, 0.2) !important;
        margin: 0.5rem 0 2rem 0 !important;
        overflow: hidden !important;

        .code-header {
          display: none !important;
        }

        pre {
          max-height: 500px !important;
          padding: 1.5rem !important;
          background: #0a0a0a !important;
          border-radius: 11px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          margin: 0 !important;

          /* Discrete scrollbar - thin and subtle */
          &::-webkit-scrollbar {
            width: 4px;
          }

          &::-webkit-scrollbar-track {
            background: transparent;
          }

          &::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 2px;

            &:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          }

          code {
            font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace !important;
            font-size: 0.8125rem !important;
            line-height: 1.7 !important;
            color: #fff !important;
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            word-break: break-word !important;

            /* Override any nested element styling */
            * {
              color: #fff !important;
              font-family: inherit !important;
              font-size: inherit !important;
              line-height: inherit !important;
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            p,
            br,
            ol,
            ul,
            li,
            h1,
            h2,
            h3,
            h4,
            h5,
            h6,
            a,
            strong,
            em,
            span {
              display: inline !important;
              color: #fff !important;
              font-weight: normal !important;
              font-style: normal !important;
              text-decoration: none !important;
            }

            br {
              display: block !important;
            }
          }
        }
      }

      /* ========================================================================
       Syntax Highlighting (Prism.js compatible)
       ======================================================================== */

      .token.comment,
      .token.prolog,
      .token.doctype,
      .token.cdata {
        color: #8b949e;
      }

      .token.punctuation {
        color: #e6edf3;
      }

      .token.property,
      .token.tag,
      .token.boolean,
      .token.number,
      .token.constant,
      .token.symbol,
      .token.deleted {
        color: #79c0ff;
      }

      .token.selector,
      .token.attr-name,
      .token.string,
      .token.char,
      .token.builtin,
      .token.inserted {
        color: #a5d6ff;
      }

      .token.operator,
      .token.entity,
      .token.url {
        color: #e6edf3;
      }

      .token.atrule,
      .token.attr-value,
      .token.keyword {
        color: #ff7b72;
      }

      .token.function,
      .token.class-name {
        color: #d2a8ff;
      }

      .token.regex,
      .token.important,
      .token.variable {
        color: #ffa657;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocPageComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() content = '';
  @Input() demoConfig?: Record<string, unknown> | undefined;
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() pageTitle = '';
  @Input() prevPage?: PageLink;
  @Input() nextPage?: PageLink;
  @Input() githubEditUrl?: string;
  @Input() pageId?: string; // Page identifier for caching

  private el = inject(ElementRef);
  private environmentInjector = inject(EnvironmentInjector);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private docCache = inject(DocCacheService);
  private http = inject(HttpClient);

  renderedContent = signal('');
  toc = signal<{ id: string; text: string; level: number }[]>([]);
  activeSection = signal<string>('');
  activeDemos = signal<Map<string, ComponentRef<AICardRendererComponent>>>(new Map());
  demoConfigs = signal<Map<string, unknown>>(new Map());
  isLoading = signal(true);

  ngOnInit() {
    this.isLoading.set(true);

    // In development mode, skip caching for faster iteration
    if (isDevMode()) {
      requestAnimationFrame(() => {
        this.renderMarkdown();
        this.setupScrollSpy();
        this.isLoading.set(false);
        // Setup interactive elements after a short delay to ensure DOM is ready
        setTimeout(() => {
          this.setupCopyButtons();
          this.setupLiveDemoButtons();
          this.applyPrismHighlighting();
        }, 50);
      });
      return;
    }

    // Production: Try to load pre-rendered content first
    const pageId = this.pageId || this.generatePageId();

    this.loadPrerenderedContent(pageId)
      .pipe(take(1))
      .subscribe({
        next: (prerendered) => {
          if (prerendered) {
            // Use pre-rendered content - instant load!
            this.renderedContent.set(prerendered.html);
            this.toc.set(prerendered.toc);
            this.demoConfigs.set(new Map(Object.entries(prerendered.demoConfigs)));
            this.isLoading.set(false);
            this.setupScrollSpy();

            // Setup interactive elements after DOM is updated
            setTimeout(() => {
              this.setupCopyButtons();
              this.setupLiveDemoButtons();
              this.applyPrismHighlighting();
            }, 50);
          } else {
            // Fall back to IndexedDB cache or runtime rendering
            this.loadFromCacheOrRender(pageId);
          }
        },
        error: () => {
          // Pre-rendered content not available, fall back
          this.loadFromCacheOrRender(pageId);
        },
      });
  }

  /**
   * Load pre-rendered content from JSON file
   */
  private loadPrerenderedContent(pageId: string) {
    // Convert pageId to filename (e.g., 'docs/getting-started' -> 'getting-started.json')
    // Remove 'docs/' prefix if present since JSON files don't have it
    const cleanPageId = pageId.replace(/^docs\//, '');
    const filename = cleanPageId.replace(/\//g, '-') + '.json';
    const url = `/assets/docs/rendered/${filename}`;

    return this.http.get<PrerenderedPage>(url).pipe(catchError(() => of(null)));
  }

  /**
   * Load from IndexedDB cache or render at runtime
   */
  private loadFromCacheOrRender(pageId: string) {
    const contentHash = this.docCache.hashContent(this.content);

    this.docCache
      .get(pageId, contentHash)
      .pipe(take(1))
      .subscribe((cached) => {
        if (cached) {
          // Use cached content
          this.renderedContent.set(cached.html);
          this.toc.set(cached.toc);
          if (cached.demoConfigs) {
            this.demoConfigs.set(new Map(Object.entries(cached.demoConfigs)));
          }
          this.isLoading.set(false);
          this.setupScrollSpy();

          setTimeout(() => {
            this.setupCopyButtons();
            this.setupLiveDemoButtons();
            this.applyPrismHighlighting();
          }, 50);
        } else {
          // Render at runtime
          requestAnimationFrame(() => {
            this.renderMarkdown();
            this.setupScrollSpy();
            this.isLoading.set(false);
            setTimeout(() => {
              this.setupCopyButtons();
              this.setupLiveDemoButtons();
              this.applyPrismHighlighting();
            }, 50);
          });
        }
      });
  }

  /**
   * Generate page ID from current route
   */
  private generatePageId(): string {
    const urlSegments = this.route.snapshot.pathFromRoot
      .map((segment) => segment.url.map((s) => s.path).join('/'))
      .filter((s) => s)
      .join('/');
    return urlSegments || 'docs/unknown';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.content && !changes.content.firstChange) {
      this.renderMarkdown();
    }
  }

  ngAfterViewInit() {
    this.setupCopyButtons();
    this.setupLiveDemoButtons();
    this.setupInternalLinks();
    this.applyPrismHighlighting();
  }

  private setupScrollSpy() {
    if (typeof window === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.activeSection.set(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    // Observe headings after render
    setTimeout(() => {
      const headings = this.el.nativeElement.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');
      headings.forEach((heading: HTMLElement) => observer.observe(heading));
    }, 100);
  }

  private copyButtonsSetup = false;

  private setupCopyButtons() {
    // Only set up once to prevent multiple listeners
    if (this.copyButtonsSetup) {
      return;
    }
    this.copyButtonsSetup = true;

    // Use event delegation for better reliability
    this.el.nativeElement.addEventListener('click', async (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Handle LLM standalone copy button
      const llmBtn = target.closest('.llm-copy-btn') as HTMLButtonElement;
      if (llmBtn) {
        event.preventDefault();
        event.stopPropagation();
        const codeEl = this.el.nativeElement.querySelector('.language-llm');
        const code = codeEl?.textContent || '';
        if (!code) {
          console.error('No LLM prompt content found');
          return;
        }
        try {
          await navigator.clipboard.writeText(code);
          llmBtn.classList.add('copied');
          llmBtn.textContent = 'COPIED!';
          setTimeout(() => {
            llmBtn.classList.remove('copied');
            llmBtn.textContent = 'COPY PROMPT';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = code;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          llmBtn.classList.add('copied');
          llmBtn.textContent = 'COPIED!';
          setTimeout(() => {
            llmBtn.classList.remove('copied');
            llmBtn.textContent = 'COPY PROMPT';
          }, 2000);
        }
        return;
      }

      // Handle regular copy buttons
      const btn = target.closest('.copy-btn') as HTMLButtonElement;
      if (!btn) {
        return;
      }

      const code = btn.closest('.code-block-wrapper')?.querySelector('code')?.textContent || '';
      try {
        await navigator.clipboard.writeText(code);
        btn.classList.add('copied');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied!`;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = originalHTML;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  }

  /**
   * Setup internal link handling for Angular router navigation
   */
  private setupInternalLinks() {
    this.el.nativeElement.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a') as HTMLAnchorElement;
      if (!link) {
        return;
      }

      const href = link.getAttribute('href');
      if (!href) {
        return;
      }

      // Handle internal links (starting with / or #)
      if (href.startsWith('/')) {
        event.preventDefault();
        this.router.navigateByUrl(href);
      } else if (href.startsWith('#')) {
        event.preventDefault();
        const id = href.slice(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Update URL hash without navigation
          history.pushState(null, '', href);
        }
      }
    });
  }

  /**
   * Setup live demo buttons for JSON code blocks
   */
  private setupLiveDemoButtons() {
    const liveDemoButtons = this.el.nativeElement.querySelectorAll('.live-demo-btn');
    liveDemoButtons.forEach((btn: HTMLButtonElement) => {
      btn.addEventListener('click', () => {
        const demoId = btn.dataset.demoId;
        if (demoId) {
          this.toggleDemo(demoId, btn);
        }
      });
    });

    // Auto-expand all live demos after setup
    this.autoExpandDemos();
  }

  /**
   * Auto-expand all live demos to show card previews immediately
   */
  private autoExpandDemos() {
    const liveDemoButtons = this.el.nativeElement.querySelectorAll('.live-demo-btn');
    liveDemoButtons.forEach((btn: HTMLButtonElement) => {
      const demoId = btn.dataset.demoId;
      if (demoId) {
        // Simulate click to expand the demo
        this.toggleDemo(demoId, btn);
      }
    });
  }

  /**
   * Toggle live demo visibility
   */
  toggleDemo(demoId: string, btn: HTMLButtonElement) {
    const demoContainer = this.el.nativeElement.querySelector(`#demo-container-${demoId}`);
    if (!demoContainer) {
      return;
    }

    const configs = this.demoConfigs();
    const config = configs.get(demoId);
    if (!config) {
      return;
    }

    const isExpanded = demoContainer.classList.contains('expanded');

    if (isExpanded) {
      // Collapse demo
      demoContainer.classList.remove('expanded');
      demoContainer.innerHTML = '';
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>Live Demo`;

      // Destroy component if exists
      const demos = this.activeDemos();
      const existingDemo = demos.get(demoId);
      if (existingDemo) {
        existingDemo.destroy();
        demos.delete(demoId);
        this.activeDemos.set(new Map(demos));
      }
    } else {
      // Expand and render demo
      demoContainer.classList.add('expanded');
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>Close Demo`;

      // Create the demo component dynamically
      try {
        // Wrap section config in a card config if needed
        let cardConfig = config as Record<string, unknown>;
        if (cardConfig.type && !cardConfig.sections) {
          cardConfig = {
            cardTitle: cardConfig.title || 'Live Demo',
            sections: [cardConfig],
          };
        }

        // Create a wrapper element for the demo
        const demoWrapper = document.createElement('div');
        demoWrapper.className = 'live-demo-preview';
        demoWrapper.innerHTML = `
          <div class="demo-header">
            <span class="demo-label">Live Preview</span>
          </div>
          <div class="demo-content" id="demo-render-${demoId}"></div>
        `;
        demoContainer.appendChild(demoWrapper);

        // Create component dynamically
        const componentRef = createComponent(AICardRendererComponent, {
          environmentInjector: this.environmentInjector,
          hostElement: demoWrapper.querySelector(`#demo-render-${demoId}`) as HTMLElement,
        });

        // Set inputs
        componentRef.setInput('cardConfig', cardConfig);
        componentRef.setInput('tiltEnabled', false);

        // Detect changes
        componentRef.changeDetectorRef.detectChanges();

        // Store reference
        const demos = this.activeDemos();
        demos.set(demoId, componentRef);
        this.activeDemos.set(new Map(demos));
      } catch (err) {
        console.error('Failed to render live demo:', err);
        demoContainer.innerHTML = '<div class="demo-error">Failed to render demo</div>';
      }
    }
  }

  private applyPrismHighlighting() {
    if (typeof (window as any).Prism !== 'undefined') {
      setTimeout(() => {
        (window as any).Prism.highlightAllUnder(this.el.nativeElement);
      }, 0);
    }
  }

  private renderMarkdown() {
    if (!this.content) {
      return;
    }

    // Check cache first (production only - disabled in dev for faster iteration)
    const cacheKey = `v${CACHE_VERSION}:${this.content.substring(0, 100)}`;
    if (!isDevMode()) {
      const cached = contentCache.get(cacheKey);
      if (cached) {
        this.renderedContent.set(cached.html);
        this.toc.set(cached.toc);
        this.demoConfigs.set(cached.configs);
        return;
      }
    }

    const tocItems: { id: string; text: string; level: number }[] = [];

    let html = this.content;

    // Process callout blocks FIRST (before escaping)
    html = this.processCallouts(html);

    // Escape HTML (except for already processed callouts and allowed elements)
    // Allow: div, span, p, strong, svg, path, button, pre (with attributes)
    const allowedTags = ['div', 'span', 'p', 'strong', 'svg', 'path', 'button', 'pre'];
    const tagPattern = allowedTags.map((t) => `${t}(?:\\s[^>]*)?|\\/${t}`).join('|');
    html = html
      .replace(/&(?!amp;|lt;|gt;)/g, '&amp;')
      .replace(new RegExp(`<(?!(?:${tagPattern})>)`, 'gi'), '&lt;');

    // Code blocks with copy button and live demo for JSON
    let demoCounter = 0;
    const demoConfigsMap = new Map<string, unknown>();

    html = html.replace(/```(\w*)\s*\n?([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang || 'text';
      const trimmedCode = code.trim();
      const escapedCode = trimmedCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Check if this is a JSON block that looks like a card/section config
      let liveDemoButton = '';
      let demoContainer = '';
      if (language === 'json') {
        try {
          const parsed = JSON.parse(trimmedCode);
          // Check if it looks like a card or section config
          if (parsed.type || parsed.sections || parsed.cardTitle) {
            const demoId = `demo-${demoCounter++}`;
            demoConfigsMap.set(demoId, parsed);
            liveDemoButton = `<button class="live-demo-btn" type="button" data-demo-id="${demoId}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>Live Demo</button>`;
            demoContainer = `<div id="demo-container-${demoId}" class="live-demo-container"></div>`;
          }
        } catch {
          // Not valid JSON or not a card config, ignore
        }
      }

      // Special handling for LLM prompt blocks - add standalone copy button above
      if (language === 'llm') {
        return `<div class="llm-copy-standalone"><div class="llm-copy-btn" role="button" tabindex="0">COPY PROMPT</div></div><div class="code-block-wrapper llm-block"><div class="code-header"><span class="code-lang">${language}</span></div><pre><code class="language-${language}">${escapedCode}</code></pre></div>`;
      }

      return `<div class="code-block-wrapper"><div class="code-header"><span class="code-lang">${language}</span><div class="code-actions">${liveDemoButton}<button class="copy-btn" type="button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy</button></div></div><pre><code class="language-${language}">${escapedCode}</code></pre></div>${demoContainer}`;
    });

    // Store demo configs
    this.demoConfigs.set(demoConfigsMap);

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Headers with anchor links
    html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
      const level = hashes.length;
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      const id = cleanText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (level <= 4) {
        tocItems.push({ id, text: cleanText, level });
      }

      return `<h${level} id="${id}"><a href="#${id}" class="anchor-link" aria-hidden="true">#</a>${text}</h${level}>`;
    });

    // Tables
    html = html.replace(/(\|[^\n]+\|\n)+/g, (match) => {
      const rows = match.trim().split('\n');
      if (rows.length < 2) {
        return match;
      }

      const headerRow = rows[0] ?? '';
      const separatorRow = rows[1] ?? '';
      const dataRows = rows.slice(2);

      // Check if second row is separator
      if (!/^\|[\s\-:|]+\|$/.test(separatorRow)) {
        return match;
      }

      const parseRow = (row: string) => {
        return row
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim());
      };

      const headers = parseRow(headerRow);
      const tableRows = dataRows.map((row) => parseRow(row));

      let tableHtml = '<div class="table-wrapper"><table><thead><tr>';
      headers.forEach((h) => {
        tableHtml += `<th>${h}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';
      tableRows.forEach((row) => {
        tableHtml += '<tr>';
        row.forEach((cell) => {
          tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table></div>';

      return tableHtml;
    });

    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

    // Process lists - find consecutive list items and wrap them together
    html = html.replace(/(^[-*]\s+.+$\n?)+/gm, (match) => {
      const items = match
        .trim()
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => `<li>${line.replace(/^[-*]\s+/, '')}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    });

    // Process ordered lists
    html = html.replace(/(^\d+\.\s+.+$\n?)+/gm, (match) => {
      const items = match
        .trim()
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => `<li>${line.replace(/^\d+\.\s+/, '')}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    });

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Paragraphs - double newlines become paragraph breaks
    html = html.replace(/\n\n+/g, '</p><p>');

    // Single line breaks - only convert to <br> if not inside a list or other block element
    html = html.replace(/(?<![>\n])\n(?![<\n])/g, '<br>');

    // Wrap in paragraph if needed
    if (
      !html.startsWith('<h') &&
      !html.startsWith('<pre') &&
      !html.startsWith('<ul') &&
      !html.startsWith('<ol') &&
      !html.startsWith('<div')
    ) {
      html = '<p>' + html + '</p>';
    }

    // Clean up
    html = html
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/<br>\s*<br>\s*<br>/g, '<br><br>')
      .replace(/<\/ul>\s*(?:<br>\s*)*<ul>/g, '')
      .replace(/<\/ol>\s*(?:<br>\s*)*<ol>/g, '');

    this.renderedContent.set(html);
    this.toc.set(tocItems);

    // Cache the rendered content for faster re-renders (production only)
    if (!isDevMode()) {
      contentCache.set(cacheKey, { html, toc: tocItems, configs: demoConfigsMap });

      // Limit cache size to prevent memory issues
      if (contentCache.size > 50) {
        const firstKey = contentCache.keys().next().value;
        if (firstKey) {
          contentCache.delete(firstKey);
        }
      }
    }

    // Save to persistent IndexedDB cache for return visits (production only)
    if (!isDevMode()) {
      const pageId = this.pageId || this.generatePageId();
      const contentHash = this.docCache.hashContent(this.content);
      const demoConfigsObj: Record<string, unknown> = {};
      demoConfigsMap.forEach((value, key) => {
        demoConfigsObj[key] = value;
      });

      this.docCache
        .set(
          pageId,
          {
            html,
            toc: tocItems,
            demoConfigs: demoConfigsObj,
          },
          contentHash
        )
        .pipe(take(1))
        .subscribe();
    }
  }

  /**
   * Process callout blocks (:::tip, :::warning, :::info, :::danger)
   */
  private processCallouts(content: string): string {
    const calloutRegex = /:::(tip|warning|info|danger)(?:\s+(.+?))?\n([\s\S]*?):::/g;

    const icons: Record<string, string> = {
      tip: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v1"></path><path d="M12 21v1"></path><path d="m4.93 4.93.7.7"></path><path d="m18.37 18.37.7.7"></path><path d="M2 12h1"></path><path d="M21 12h1"></path><path d="m4.93 19.07.7-.7"></path><path d="m18.37 5.63.7-.7"></path><circle cx="12" cy="12" r="4"></circle></svg>',
      warning:
        '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>',
      info: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
      danger:
        '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"></path><path d="M14.12 3.88 16 2"></path><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path><path d="M12 20v-9"></path><path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path><path d="M6 13H2"></path><path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path><path d="M22 13h-4"></path><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path></svg>',
    };

    return content.replace(calloutRegex, (_, type, title, body) => {
      const icon = icons[type as keyof typeof icons] || icons.info;
      const titleHtml = title ? `<span class="callout-title">${title}</span>` : '';
      return `<div class="callout ${type}">${icon}<div class="callout-content">${titleHtml}<p>${body.trim()}</p></div></div>`;
    });
  }

  scrollToSection(event: Event, id: string) {
    event.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      this.activeSection.set(id);
    }
  }
}

/**
 * Base class for generated documentation pages
 */
@Component({
  selector: 'app-doc-page-base',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="pageContent" [demoConfig]="demoConfig"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocPageBaseComponent {
  pageContent = '';
  demoConfig?: Record<string, unknown>;
}
