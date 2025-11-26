import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AICardConfig, CardType } from '../../../models';
import { CardTemplatesService } from '../../services/card-templates.service';
import { SearchFilterService } from '../../services/search-filter.service';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { CardPreviewComponent } from '../cards/card-preview/card-preview.component';

/**
 * Card Templates Gallery Component
 * Provides UI for browsing, searching, and customizing card templates
 */
@Component({
  selector: 'app-card-templates-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule, CardPreviewComponent],
  template: `
    <div class="templates-gallery">
      <!-- Header -->
      <div class="gallery-header">
        <h2 class="gallery-title">Card Templates</h2>
        <button
          type="button"
          class="close-button"
          (click)="close.emit()"
          aria-label="Close gallery">
          <lucide-icon name="x" [size]="20"></lucide-icon>
        </button>
      </div>

      <!-- Search and Filters -->
      <div class="gallery-filters">
        <div class="search-bar">
          <lucide-icon name="search" [size]="18"></lucide-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Search templates..."
            class="search-input"
            aria-label="Search templates">
        </div>

        <div class="filter-group">
          <label class="filter-label">Card Type:</label>
          <select
            [(ngModel)]="selectedCardType"
            (ngModelChange)="onFilterChange()"
            class="filter-select"
            aria-label="Filter by card type">
            <option value="">All Types</option>
            <option *ngFor="let type of cardTypes" [value]="type">
              {{ type | titlecase }}
            </option>
          </select>
        </div>
      </div>

      <!-- Templates Grid -->
      <div class="templates-grid" *ngIf="filteredTemplates.length > 0; else noResults">
        <div
          *ngFor="let template of filteredTemplates; trackBy: trackByTemplateId"
          class="template-card"
          (click)="onTemplateSelect(template)">
          <div class="template-preview">
            <app-card-preview
              [generatedCard]="template"
              [isGenerating]="false"
              [isInitialized]="true">
            </app-card-preview>
          </div>
          <div class="template-info">
            <h3 class="template-title">{{ template.cardTitle }}</h3>
            <p class="template-type">{{ template.cardType | titlecase }}</p>
            <div class="template-stats">
              <span class="stat">
                <lucide-icon name="layers" [size]="14"></lucide-icon>
                {{ (template.sections?.length || 0) }} sections
              </span>
            </div>
          </div>
          <button
            type="button"
            class="use-template-button"
            (click)="onTemplateSelect(template); $event.stopPropagation()"
            aria-label="Use template">
            Use Template
          </button>
        </div>
      </div>

      <ng-template #noResults>
        <div class="no-results">
          <lucide-icon name="search-x" [size]="48"></lucide-icon>
          <p>No templates found matching your criteria</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .templates-gallery {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--card-background, rgba(20, 30, 50, 0.95));
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .gallery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .gallery-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--card-text-primary, #FFFFFF);
      margin: 0;
    }

    .close-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: transparent;
      border: none;
      color: var(--card-text-secondary, #B8C5D6);
      cursor: pointer;
      border-radius: 0.375rem;
      transition: all 0.2s;
    }

    .close-button:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--card-text-primary, #FFFFFF);
    }

    .gallery-filters {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .search-bar {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.375rem;
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--card-text-primary, #FFFFFF);
      font-size: 0.875rem;
      outline: none;
    }

    .search-input::placeholder {
      color: var(--card-text-secondary, #B8C5D6);
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.875rem;
      color: var(--card-text-secondary, #B8C5D6);
      white-space: nowrap;
    }

    .filter-select {
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.375rem;
      color: var(--card-text-primary, #FFFFFF);
      font-size: 0.875rem;
      cursor: pointer;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .template-card {
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
    }

    .template-card:hover {
      border-color: var(--color-brand, #FF7900);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .template-preview {
      height: 200px;
      overflow: hidden;
      background: var(--card-background, rgba(20, 30, 50, 0.6));
    }

    .template-info {
      padding: 1rem;
    }

    .template-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--card-text-primary, #FFFFFF);
      margin: 0 0 0.25rem 0;
    }

    .template-type {
      font-size: 0.75rem;
      color: var(--card-text-secondary, #B8C5D6);
      margin: 0 0 0.5rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .template-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--card-text-secondary, #B8C5D6);
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .use-template-button {
      margin: 0 1rem 1rem 1rem;
      padding: 0.5rem 1rem;
      background: var(--color-brand, #FF7900);
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .use-template-button:hover {
      opacity: 0.9;
      transform: scale(1.02);
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: var(--card-text-secondary, #B8C5D6);
      text-align: center;
    }

    .no-results p {
      margin-top: 1rem;
      font-size: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardTemplatesGalleryComponent implements OnInit {
  private readonly templatesService = inject(CardTemplatesService);
  private readonly searchFilterService = inject(SearchFilterService);

  @Input() selectedCardType: CardType | '' = '';
  @Output() templateSelected = new EventEmitter<AICardConfig>();
  @Output() close = new EventEmitter<void>();

  cardTypes: CardType[] = ['company', 'contact', 'opportunity', 'product', 'analytics', 'event', 'sko'];
  searchQuery = '';
  allTemplates: AICardConfig[] = [];
  filteredTemplates: AICardConfig[] = [];

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    if (this.selectedCardType) {
      this.allTemplates = this.templatesService.getTemplatesByType(this.selectedCardType);
    } else {
      this.allTemplates = this.templatesService.getAllTemplates();
    }
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.loadTemplates();
  }

  applyFilters(): void {
    let filtered = this.allTemplates;

    if (this.searchQuery) {
      filtered = this.searchFilterService.searchCards(filtered, {
        query: this.searchQuery,
        caseSensitive: false
      });
    }

    this.filteredTemplates = filtered;
  }

  onTemplateSelect(template: AICardConfig): void {
    this.templateSelected.emit(template);
  }

  trackByTemplateId(index: number, template: AICardConfig): string {
    return template.id || index.toString();
  }
}

