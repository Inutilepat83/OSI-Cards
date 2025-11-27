import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  HostListener,
  ElementRef,
  ViewChild,
  OnDestroy,
  TrackByFunction
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocLoaderService, DocMetadata } from '../../services/doc-loader.service';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

/**
 * Modern minimalistic documentation layout with optimized performance
 */
@Component({
  selector: 'app-docs-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideIconsModule],
  templateUrl: './docs-layout.component.html',
  styleUrls: ['./docs-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsLayoutComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly docLoader = inject(DocLoaderService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  docsByCategory: Record<string, DocMetadata[]> = {};
  currentDocId: string | null = null;
  isMobileMenuOpen = false;
  searchQuery = '';
  collapsedCategories: Set<string> = new Set();

  ngOnInit(): void {
    this.docsByCategory = this.docLoader.getDocsByCategory();
    this.updateCurrentDoc();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateCurrentDoc();
        this.isMobileMenuOpen = false;
        this.cd.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (window.innerWidth >= 1024) {
      this.isMobileMenuOpen = false;
      this.cd.markForCheck();
    }
  }

  private updateCurrentDoc(): void {
    const url = this.router.url;
    if (url === '/docs' || url.startsWith('/docs/')) {
      const match = url.match(/\/docs\/([^\/]+)/);
      this.currentDocId = match && match[1] ? match[1] : null;
    } else {
      this.currentDocId = null;
    }
    
    if (this.currentDocId) {
      const allDocs = this.docLoader.getAllDocsMetadata();
      const currentDoc = allDocs.find(doc => doc.id === this.currentDocId);
      if (currentDoc?.category) {
        this.collapsedCategories.delete(currentDoc.category);
      }
    }
    
    this.cd.markForCheck();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.cd.markForCheck();
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.cd.markForCheck();
  }

  toggleCategory(category: string): void {
    if (this.collapsedCategories.has(category)) {
      this.collapsedCategories.delete(category);
    } else {
      this.collapsedCategories.add(category);
    }
    this.cd.markForCheck();
  }

  isCategoryCollapsed(category: string): boolean {
    return this.collapsedCategories.has(category);
  }

  isActive(docId: string): boolean {
    return this.currentDocId === docId;
  }

  hasActiveDoc(category: string): boolean {
    const docs = this.docsByCategory[category] || [];
    return docs.some(doc => this.isActive(doc.id));
  }

  getCategories(): string[] {
    return Object.keys(this.docsByCategory).sort();
  }

  getFilteredDocs(): Record<string, DocMetadata[]> {
    if (!this.searchQuery.trim()) {
      return this.docsByCategory;
    }

    const query = this.searchQuery.toLowerCase();
    const filtered: Record<string, DocMetadata[]> = {};

    Object.keys(this.docsByCategory).forEach(category => {
      const docs = this.docsByCategory[category] || [];
      const matchingDocs = docs.filter(
        doc =>
          doc.title.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.id.toLowerCase().includes(query)
      );

      if (matchingDocs.length > 0) {
        filtered[category] = matchingDocs;
      }
    });

    return filtered;
  }

  getFilteredDocsKeys(): string[] {
    return Object.keys(this.getFilteredDocs());
  }

  hasNoResults(): boolean {
    return this.getFilteredDocsKeys().length === 0 && !!this.searchQuery.trim();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    if (query.trim()) {
      this.collapsedCategories.clear();
    }
    this.cd.markForCheck();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.cd.markForCheck();
  }

  focusSearch(): void {
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }

  trackByCategory(_index: number, category: string): string {
    return category;
  }

  trackByDoc(_index: number, doc: DocMetadata): string {
    return doc.id;
  }
}