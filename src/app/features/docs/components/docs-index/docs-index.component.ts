import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, TrackByFunction } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocLoaderService, DocMetadata } from '../../services/doc-loader.service';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

/**
 * Minimalistic documentation index page
 */
@Component({
  selector: 'app-docs-index',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconsModule],
  templateUrl: './docs-index.component.html',
  styleUrls: ['./docs-index.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsIndexComponent implements OnInit {
  private readonly docLoader = inject(DocLoaderService);
  private readonly cd = inject(ChangeDetectorRef);

  docsByCategory: Record<string, DocMetadata[]> = {};
  totalDocs = 0;
  totalCategories = 0;

  ngOnInit(): void {
    this.docsByCategory = this.docLoader.getDocsByCategory();
    this.calculateStatistics();
    this.cd.markForCheck();
  }

  private calculateStatistics(): void {
    this.totalCategories = Object.keys(this.docsByCategory).length;
    this.totalDocs = Object.values(this.docsByCategory)
      .reduce((sum, docs) => sum + docs.length, 0);
  }

  getCategories(): string[] {
    return Object.keys(this.docsByCategory).sort();
  }

  getDocsByCategory(): Record<string, DocMetadata[]> {
    return this.docsByCategory;
  }

  trackByCategory(_index: number, category: string): string {
    return category;
  }

  trackByDoc(_index: number, doc: DocMetadata): string {
    return doc.id;
  }
}