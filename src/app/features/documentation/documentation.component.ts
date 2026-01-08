import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';
import {
  MarkdownRendererComponent,
  TocItem,
} from '../../shared/components/markdown-renderer/markdown-renderer.component';
import {
  DocCategory,
  DocItem,
  getDocumentationByCategory,
  getDocumentationById,
} from './documentation.config';

/**
 * Documentation page component
 * Displays markdown documentation with sidebar navigation and table of contents
 */
@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconsModule, MarkdownRendererComponent],
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentationPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // State
  readonly categories = signal<DocCategory[]>(getDocumentationByCategory());
  readonly activeDocId = signal<string>('');
  readonly activeDoc = signal<DocItem | null>(null);
  readonly markdownContent = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly sidebarOpen = signal<boolean>(false);

  // Table of contents
  readonly tableOfContents = signal<TocItem[]>([]);

  ngOnInit(): void {
    // Get document ID from route, default to 'readme' if no ID
    const docId = this.route.snapshot.params.id || 'readme';
    this.loadDocument(docId);

    // Also subscribe to route changes
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params: Record<string, string>) => {
        const newDocId = params.id || 'readme';
        if (newDocId !== this.activeDocId()) {
          this.loadDocument(newDocId);
        }
      });
  }

  /**
   * Load a documentation file
   */
  loadDocument(docId: string): void {
    const doc = getDocumentationById(docId);

    if (!doc) {
      this.error.set(`Document "${docId}" not found`);
      this.cdr.markForCheck();
      return;
    }

    this.activeDocId.set(docId);
    this.activeDoc.set(doc);
    this.isLoading.set(true);
    this.error.set(null);
    this.cdr.markForCheck();

    // Update URL without navigation
    this.router.navigate(['/docs', docId], { replaceUrl: true });

    // Fetch markdown file with aggressive cache-busting
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const cacheBuster = doc.path.includes('?')
      ? `&_t=${timestamp}&_r=${random}`
      : `?_t=${timestamp}&_r=${random}`;
    const url = `${doc.path}${cacheBuster}`;

    this.http
      .get(url, {
        responseType: 'text',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })
      .pipe(
        catchError((err) => {
          // Completely silent for 404s - documentation files may not exist
          if (err.status === 404) {
            this.error.set(`Documentation file not found: ${doc.title}`);
          } else {
            // Only log non-404 errors
            console.error('Error loading documentation:', err);
            this.error.set(`Failed to load "${doc.title}". File may not exist at ${doc.path}`);
          }
          this.isLoading.set(false);
          this.cdr.markForCheck();
          return of('');
        })
      )
      .subscribe((content) => {
        this.markdownContent.set(content);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      });
  }

  /**
   * Toggle sidebar (mobile)
   */
  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  /**
   * Close sidebar (mobile)
   */
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  /**
   * Navigate to a document
   */
  navigateToDoc(docId: string): void {
    this.closeSidebar();
    this.loadDocument(docId);
  }

  /**
   * Check if a document is active
   */
  isActiveDoc(docId: string): boolean {
    return this.activeDocId() === docId;
  }

  /**
   * Handle TOC changes from markdown renderer
   */
  onTocChange(toc: TocItem[]): void {
    this.tableOfContents.set(toc);
    this.cdr.markForCheck();
  }

  /**
   * Scroll to a section in the markdown content
   */
  scrollToSection(id: string): void {
    // Find the markdown renderer in the DOM
    const element = document.querySelector(`#${id}`);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    this.closeSidebar();
  }
}
