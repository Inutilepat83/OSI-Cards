import { 
  Component, 
  Input, 
  ChangeDetectionStrategy, 
  signal, 
  OnInit, 
  OnChanges,
  SimpleChanges,
  inject, 
  ElementRef, 
  AfterViewInit,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';
import { DocsDemoComponent } from './components/docs-demo';

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
  imports: [CommonModule, RouterModule, LucideIconsModule, DocsDemoComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <article class="doc-page">
      <div class="doc-content" [innerHTML]="renderedContent()"></div>
      
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
    </article>
  `,
  styles: [`
    /* ========================================================================
       Documentation Page Layout
       ======================================================================== */
    
    .doc-page {
      display: grid;
      grid-template-columns: 1fr 220px;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      
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
        margin: 2.5rem 0 1rem;
        padding-top: 1.5rem;
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
      
      h5, h6 {
        font-size: 1rem;
        font-weight: 600;
        margin: 1rem 0 0.5rem;
        color: var(--docs-text-secondary);
      }

      /* Anchor links */
      h1, h2, h3, h4, h5, h6 {
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
      ul, ol {
        margin: 0.75rem 0 1.25rem 0;
        padding-left: 0;
        color: var(--docs-text);
        line-height: 1.75;
      }

      ul {
        list-style: none;
        
        li {
          position: relative;
          padding-left: 1.5em;
          margin-bottom: 0.5em;
          
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
        ul, ol {
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
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .code-lang {
          font-size: 0.625rem;
          font-weight: 600;
          color: #8b949e;
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
          color: #8b949e;
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
          
          svg {
            width: 14px;
            height: 14px;
          }
        }
      }
      
      pre {
        margin: 0;
        padding: 1rem;
        overflow-x: auto;

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

      th, td {
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
    :host-context([data-theme="dark"]) .doc-page {
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocPageComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() content: string = '';
  @Input() demoConfig?: Record<string, unknown>;
  
  private el = inject(ElementRef);
  
  renderedContent = signal('');
  toc = signal<{ id: string; text: string; level: number }[]>([]);
  activeSection = signal<string>('');

  ngOnInit() {
    this.renderMarkdown();
    this.setupScrollSpy();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && !changes['content'].firstChange) {
      this.renderMarkdown();
    }
  }

  ngAfterViewInit() {
    this.setupCopyButtons();
    this.applyPrismHighlighting();
  }

  private setupScrollSpy() {
    if (typeof window === 'undefined') return;
    
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
  
  private setupCopyButtons() {
    const copyButtons = this.el.nativeElement.querySelectorAll('.copy-btn');
    copyButtons.forEach((btn: HTMLButtonElement) => {
      btn.addEventListener('click', async () => {
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
    });
  }
  
  private applyPrismHighlighting() {
    if (typeof (window as any).Prism !== 'undefined') {
      setTimeout(() => {
        (window as any).Prism.highlightAllUnder(this.el.nativeElement);
      }, 0);
    }
  }

  private renderMarkdown() {
    if (!this.content) return;

    const tocItems: { id: string; text: string; level: number }[] = [];
    
    let html = this.content;
    
    // Process callout blocks FIRST (before escaping)
    html = this.processCallouts(html);
    
    // Escape HTML (except for already processed callouts)
    html = html
      .replace(/&(?!amp;|lt;|gt;)/g, '&amp;')
      .replace(/<(?!div|\/div|span|\/span|p|\/p|strong|\/strong|svg|\/svg|path)/g, '&lt;')
      .replace(/(?<!div|span|p|strong|svg|path)>/g, '&gt;');
    
    // Code blocks with copy button
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang || 'text';
      const escapedCode = code.trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="code-lang">${language}</span>
            <button class="copy-btn" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <pre><code class="language-${language}">${escapedCode}</code></pre>
        </div>
      `;
    });
    
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
      const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      if (level <= 4) {
        tocItems.push({ id, text: cleanText, level });
      }
      
      return `<h${level} id="${id}"><a href="#${id}" class="anchor-link" aria-hidden="true">#</a>${text}</h${level}>`;
    });
    
    // Tables
    html = html.replace(/(\|[^\n]+\|\n)+/g, (match) => {
      const rows = match.trim().split('\n');
      if (rows.length < 2) return match;
      
      const headerRow = rows[0] ?? '';
      const separatorRow = rows[1] ?? '';
      const dataRows = rows.slice(2);
      
      // Check if second row is separator
      if (!/^\|[\s\-:|]+\|$/.test(separatorRow)) return match;
      
      const parseRow = (row: string) => {
        return row.split('|').slice(1, -1).map(cell => cell.trim());
      };
      
      const headers = parseRow(headerRow);
      const tableRows = dataRows.map(row => parseRow(row));
      
      let tableHtml = '<div class="table-wrapper"><table><thead><tr>';
      headers.forEach(h => {
        tableHtml += `<th>${h}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';
      tableRows.forEach(row => {
        tableHtml += '<tr>';
        row.forEach(cell => {
          tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table></div>';
      
      return tableHtml;
    });
    
    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');
    
    // Unordered lists
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    
    // Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    // Wrap list items
    html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul>$&</ul>');
    
    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    
    // Paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph if needed
    if (!html.startsWith('<h') && !html.startsWith('<pre') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<div')) {
      html = '<p>' + html + '</p>';
    }

    // Clean up
    html = html
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/<br>\s*<br>\s*<br>/g, '<br><br>');

    this.renderedContent.set(html);
    this.toc.set(tocItems);
  }
  
  /**
   * Process callout blocks (:::tip, :::warning, :::info, :::danger)
   */
  private processCallouts(content: string): string {
    const calloutRegex = /:::(tip|warning|info|danger)(?:\s+(.+?))?\n([\s\S]*?):::/g;
    
    const icons: Record<string, string> = {
      tip: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v1"></path><path d="M12 21v1"></path><path d="m4.93 4.93.7.7"></path><path d="m18.37 18.37.7.7"></path><path d="M2 12h1"></path><path d="M21 12h1"></path><path d="m4.93 19.07.7-.7"></path><path d="m18.37 5.63.7-.7"></path><circle cx="12" cy="12" r="4"></circle></svg>',
      warning: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>',
      info: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
      danger: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"></path><path d="M14.12 3.88 16 2"></path><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path><path d="M12 20v-9"></path><path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path><path d="M6 13H2"></path><path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path><path d="M22 13h-4"></path><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path></svg>'
    };
    
    return content.replace(calloutRegex, (_, type, title, body) => {
      const icon = icons[type] || icons['info'];
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocPageBaseComponent {
  pageContent: string = '';
  demoConfig?: Record<string, unknown>;
}
