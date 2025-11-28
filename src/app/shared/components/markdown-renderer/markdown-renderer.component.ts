import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  SecurityContext
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import * as Prism from 'prismjs';

// Import Prism.js languages
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-shell-session';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-yaml';

/**
 * Table of contents item interface
 */
export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Markdown renderer component
 * Renders markdown content with syntax highlighting using marked and Prism.js
 */
@Component({
  selector: 'app-markdown-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './markdown-renderer.component.html',
  styleUrls: ['./markdown-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkdownRendererComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() markdown: string = '';
  @Input() baseUrl?: string;

  @Output() tocChange = new EventEmitter<TocItem[]>();

  @ViewChild('contentContainer', { static: false }) contentContainer?: ElementRef<HTMLDivElement>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  renderedHtml: SafeHtml = '';
  tableOfContents: TocItem[] = [];

  ngOnInit(): void {
    this.configureMarked();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['markdown'] && this.markdown) {
      this.renderMarkdown();
    }
  }

  ngAfterViewInit(): void {
    if (this.renderedHtml) {
      this.highlightCode();
    }
  }

  /**
   * Configure marked with custom renderer options
   */
  private configureMarked(): void {
    // Configure marked with options for v17 API
    marked.use({
      breaks: true,
      gfm: true
    });
  }

  /**
   * Render markdown to HTML
   */
  private renderMarkdown(): void {
    if (!this.markdown) {
      this.renderedHtml = '';
      this.tableOfContents = [];
      this.cdr.markForCheck();
      return;
    }

    try {
      this.tableOfContents = [];
      let html = marked.parse(this.markdown) as string;
      
      // Post-process HTML to add IDs to headings and extract TOC
      html = this.postProcessHtml(html);
      
      // Sanitize HTML for security and convert to SafeHtml
      const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, html);
      this.renderedHtml = sanitized ? this.sanitizer.bypassSecurityTrustHtml(sanitized) : '';
      
      // Emit TOC after rendering
      this.tocChange.emit([...this.tableOfContents]);
      
      this.cdr.markForCheck();

      // Highlight code and setup anchor links after view update
      setTimeout(() => {
        this.highlightCode();
        this.setupAnchorLinks();
      }, 0);
    } catch (error) {
      console.error('Error rendering markdown:', error);
      const errorHtml = '<p class="markdown-error">Error rendering markdown content.</p>';
      const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, errorHtml);
      this.renderedHtml = sanitized ? this.sanitizer.bypassSecurityTrustHtml(sanitized) : '';
      this.cdr.markForCheck();
    }
  }

  /**
   * Post-process HTML to add IDs to headings and extract TOC
   */
  private postProcessHtml(html: string): string {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Process headings
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading) => {
      const text = heading.textContent || '';
      const id = this.slugify(text);
      const level = parseInt(heading.tagName.substring(1));
      
      heading.id = id;
      heading.className = `markdown-heading markdown-heading-${level}`;
      
      // Add to TOC if not already present
      if (!this.tableOfContents.find(item => item.id === id)) {
        this.tableOfContents.push({ id, text: text.trim(), level });
      }
    });

    // Process links
    const links = tempDiv.querySelectorAll('a');
    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const isExternal = href.startsWith('http') || href.startsWith('//');
      const isAnchor = href.startsWith('#');
      
      if (isExternal) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
      
      if (isAnchor) {
        link.classList.add('markdown-anchor-link');
        link.setAttribute('data-anchor', href.substring(1));
      }
      
      link.classList.add('markdown-link');
    });

    // Process tables - wrap in div
    const tables = tempDiv.querySelectorAll('table');
    tables.forEach((table) => {
      // Check if already wrapped
      if (table.parentElement?.classList.contains('markdown-table-wrapper')) {
        return;
      }
      
      const wrapper = document.createElement('div');
      wrapper.className = 'markdown-table-wrapper';
      const parent = table.parentNode;
      if (parent) {
        parent.insertBefore(wrapper, table);
        wrapper.appendChild(table);
        table.classList.add('markdown-table');
      }
    });

    // Process code blocks - ensure they have language classes
    const codeBlocks = tempDiv.querySelectorAll('pre code');
    codeBlocks.forEach((code) => {
      const pre = code.parentElement;
      if (pre && pre.tagName === 'PRE') {
        // Extract language from class if present
        const classes = Array.from(code.classList);
        const langClass = classes.find(c => c.startsWith('language-'));
        if (langClass) {
          pre.className = langClass;
        } else {
          // Default to text if no language
          pre.className = 'language-text';
          code.className = 'language-text';
        }
      }
    });

    return tempDiv.innerHTML;
  }

  /**
   * Highlight code blocks using Prism.js
   */
  private highlightCode(): void {
    if (!this.contentContainer?.nativeElement) {
      return;
    }

    const codeBlocks = this.contentContainer.nativeElement.querySelectorAll('pre code');
    codeBlocks.forEach((block) => {
      // Only highlight if not already highlighted
      if (!block.classList.contains('language-')) {
        try {
          Prism.highlightElement(block as HTMLElement);
        } catch (error) {
          console.warn('Error highlighting code block:', error);
        }
      }
    });
  }

  /**
   * Convert text to URL-friendly slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Strip markdown syntax from text
   */
  private stripMarkdown(text: string): string {
    // Remove markdown links but keep text
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // Remove markdown code
    text = text.replace(/`([^`]+)`/g, '$1');
    // Remove markdown bold/italic
    text = text.replace(/\*\*([^\*]+)\*\*/g, '$1');
    text = text.replace(/\*([^\*]+)\*/g, '$1');
    return text.trim();
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Setup anchor link click handlers
   */
  private setupAnchorLinks(): void {
    if (!this.contentContainer?.nativeElement) {
      return;
    }

    const anchorLinks = this.contentContainer.nativeElement.querySelectorAll('a.markdown-anchor-link');
    anchorLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const anchorId = link.getAttribute('data-anchor');
        if (anchorId) {
          this.scrollToSection(anchorId);
        } else {
          // Fallback to href
          const href = link.getAttribute('href');
          if (href && href.startsWith('#')) {
            const id = href.substring(1);
            this.scrollToSection(id);
          }
        }
      });
    });
  }

  /**
   * Scroll to a section by ID
   */
  scrollToSection(id: string): void {
    const element = this.contentContainer?.nativeElement?.querySelector(`#${id}`);
    if (element) {
      const headerOffset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}

