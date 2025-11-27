import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DocLoaderService, DocMetadata } from '../../services/doc-loader.service';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';
import { marked } from 'marked';
import type { MarkedOptions, Tokens } from 'marked';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-bash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Modern, minimalistic documentation viewer with optimized performance
 */
@Component({
  selector: 'app-doc-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconsModule],
  templateUrl: './doc-viewer.component.html',
  styleUrls: ['./doc-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly docLoader = inject(DocLoaderService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroy$ = new Subject<void>();
  private readonly intersectionObserver?: IntersectionObserver;
  
  @ViewChild('docContent', { static: false }) docContentRef?: ElementRef<HTMLDivElement>;

  docContent = '';
  docName = '';
  docMetadata: DocMetadata | undefined;
  isLoading = true;
  error: string | null = null;
  tableOfContents: TocItem[] = [];
  previousDoc: DocMetadata | null = null;
  nextDoc: DocMetadata | null = null;
  activeHeadingId: string | null = null;

  constructor() {
    // Configure marked for better performance
    const markedOptions: MarkedOptions = {
      breaks: true,
      gfm: true
    };
    marked.setOptions(markedOptions);

    // Setup Intersection Observer for scroll tracking (better performance than scroll events)
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        { rootMargin: '-20% 0px -70% 0px' }
      );
    }
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const docName = params['docName'] as string;
        if (docName) {
          this.loadDocumentation(docName);
        } else {
          this.error = 'No documentation file specified';
          this.isLoading = false;
          this.cd.markForCheck();
        }
      });
  }

  ngAfterViewInit(): void {
    // Setup heading observers after content loads
    setTimeout(() => this.setupHeadingObservers(), 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intersectionObserver?.disconnect();
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.activeHeadingId = entry.target.id;
        this.cd.markForCheck();
        break;
      }
    }
  }

  private setupHeadingObservers(): void {
    if (!this.docContentRef || !this.intersectionObserver) return;
    
    const headings = this.docContentRef.nativeElement.querySelectorAll('h1, h2, h3');
    headings.forEach(heading => {
      this.intersectionObserver?.observe(heading);
    });
  }

  private loadDocumentation(docName: string): void {
    this.isLoading = true;
    this.error = null;
    this.docName = docName;
    this.docMetadata = this.docLoader.getDocMetadata(docName);
    this.tableOfContents = [];
    this.cd.markForCheck();

    const adjacent = this.docLoader.getAdjacentDocs(docName);
    this.previousDoc = adjacent.previous;
    this.nextDoc = adjacent.next;

    this.docLoader.loadDoc(docName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (content) => {
          this.processMarkdown(content);
          this.isLoading = false;
          this.cd.markForCheck();
          
          // Setup after render
          setTimeout(() => {
            this.setupHeadingObservers();
            this.highlightCodeBlocks();
          }, 50);
        },
        error: (err) => {
          this.error = `Failed to load documentation: ${err.message || 'Unknown error'}`;
          this.isLoading = false;
          this.cd.markForCheck();
        }
      });
  }

  private processMarkdown(markdown: string): void {
    const toc: TocItem[] = [];
    
    // Custom renderer for TOC generation
    const renderer = new marked.Renderer();
    const originalHeading = renderer.heading.bind(renderer);
    
    renderer.heading = (heading: Tokens.Heading) => {
      // Use the text property directly from the heading token
      const headingText = heading.text || '';
      
      const id = headingText.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      const level = heading.depth;
      
      if (level <= 3) {
        toc.push({ id, text: headingText, level });
      }
      
      // Call original heading with full heading token object
      const html = originalHeading(heading);
      // Add id attribute to heading
      return html.replace(/^<h(\d+)>/, `<h$1 id="${id}">`);
    };

    // Render markdown - marked v17 may return Promise<string>
    const result = marked(markdown, { renderer });
    
    // Handle both sync and async results
    if (result instanceof Promise) {
      result.then(html => {
        this.docContent = html;
        this.tableOfContents = toc;
        this.cd.markForCheck();
      });
    } else {
      this.docContent = result;
      this.tableOfContents = toc;
    }
  }

  private highlightCodeBlocks(): void {
    if (!this.docContentRef) return;

    const codeBlocks = this.docContentRef.nativeElement.querySelectorAll('pre code[class*="language-"]');
    codeBlocks.forEach((block) => {
      Prism.highlightElement(block as HTMLElement);
    });
  }

  scrollToHeading(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get sanitizedContent() {
    return this.sanitizer.sanitize(1, this.docContent) || '';
  }

  isActiveHeading(id: string): boolean {
    return this.activeHeadingId === id;
  }

  trackByTocItem(_index: number, item: TocItem): string {
    return item.id;
  }
}