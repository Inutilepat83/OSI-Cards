import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AICardConfig } from '../../../models';
import { JsonFileStorageService } from '../../../core/services/json-file-storage.service';
import { BatchConversionUtil } from '../../utils/batch-conversion.util';
import { CardValidationService } from '../../services/card-validation.service';

/**
 * Import/Export component for managing JSON card files
 * Supports single and batch import/export operations
 */
@Component({
  selector: 'app-card-import-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="import-export-container">
      <div class="tabs">
        <button
          class="tab-button"
          [class.active]="activeTab === 'import'"
          (click)="activeTab = 'import'"
        >
          Import Cards
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab === 'export'"
          (click)="activeTab = 'export'"
        >
          Export Cards
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab === 'analyze'"
          (click)="activeTab = 'analyze'"
        >
          Analyze
        </button>
      </div>

      <!-- Import Tab -->
      <div *ngIf="activeTab === 'import'" class="tab-content">
        <h3>Import JSON Cards</h3>

        <div class="import-section">
          <div class="file-input-wrapper">
            <label>Select JSON File(s)</label>
            <input
              type="file"
              #fileInput
              (change)="onFileSelected($event)"
              accept=".json"
              multiple
              class="file-input"
            />
            <button (click)="fileInput.click()" class="btn btn-primary">Choose Files</button>
          </div>

          <div *ngIf="selectedFiles.length > 0" class="selected-files">
            <h4>Selected Files: {{ selectedFiles.length }}</h4>
            <ul>
              <li *ngFor="let file of selectedFiles">
                {{ file.name }} ({{ (file.size / 1024).toFixed(2) }} KB)
              </li>
            </ul>
          </div>

          <div class="import-actions">
            <button
              (click)="importFiles()"
              [disabled]="selectedFiles.length === 0"
              class="btn btn-success"
            >
              Import Cards
            </button>
            <button (click)="clearSelectedFiles()" class="btn btn-secondary">
              Clear Selection
            </button>
          </div>

          <div *ngIf="importResult" class="result-message" [class.error]="!importResult.success">
            <strong>{{ importResult.success ? 'Success' : 'Error' }}:</strong>
            {{ importResult.message }}
            <div *ngIf="importResult.details" class="details">
              {{ importResult.details }}
            </div>
          </div>
        </div>

        <div *ngIf="importStats" class="stats-section">
          <h4>Import Statistics</h4>
          <dl>
            <dt>Valid Cards:</dt>
            <dd>{{ importStats.valid }}</dd>
            <dt>Invalid Cards:</dt>
            <dd>{{ importStats.invalid }}</dd>
            <dt>Success Rate:</dt>
            <dd>{{ importStats.successRate.toFixed(1) }}%</dd>
          </dl>
        </div>
      </div>

      <!-- Export Tab -->
      <div *ngIf="activeTab === 'export'" class="tab-content">
        <h3>Export JSON Cards</h3>

        <div class="export-section">
          <div class="export-options">
            <label>
              <input type="radio" name="exportMode" value="all" [(ngModel)]="exportMode" />
              Export All Stored Cards
            </label>
            <label>
              <input type="radio" name="exportMode" value="single" [(ngModel)]="exportMode" />
              Export Single Card
            </label>
            <label>
              <input type="radio" name="exportMode" value="filtered" [(ngModel)]="exportMode" />
              Export by Type
            </label>
          </div>

          <div *ngIf="exportMode === 'single'" class="export-options-detail">
            <label>Select Card:</label>
            <select [(ngModel)]="selectedCardId" class="form-control">
              <option value="">-- Choose a card --</option>
              <option *ngFor="let card of storedCards" [value]="card.id">
                {{ card.cardTitle }}
              </option>
            </select>
          </div>

          <div *ngIf="exportMode === 'filtered'" class="export-options-detail">
            <label>Filter by Type:</label>
            <select [(ngModel)]="selectedType" class="form-control">
              <option value="">-- All Types --</option>
              <option *ngFor="let type of cardTypes" [value]="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div class="export-format-options">
            <label>Export Format:</label>
            <label>
              <input type="radio" name="format" value="json" [(ngModel)]="exportFormat" />
              JSON (single file)
            </label>
            <label>
              <input type="radio" name="format" value="individual" [(ngModel)]="exportFormat" />
              Individual JSON Files
            </label>
          </div>

          <div class="export-actions">
            <button (click)="exportCards()" [disabled]="!canExport()" class="btn btn-success">
              Export Cards
            </button>
          </div>

          <div *ngIf="exportResult" class="result-message" [class.error]="!exportResult.success">
            <strong>{{ exportResult.success ? 'Success' : 'Error' }}:</strong>
            {{ exportResult.message }}
          </div>
        </div>
      </div>

      <!-- Analyze Tab -->
      <div *ngIf="activeTab === 'analyze'" class="tab-content">
        <h3>Analyze Stored Cards</h3>

        <div class="analyze-section">
          <button (click)="analyzeCards()" class="btn btn-primary">Analyze Collection</button>

          <div *ngIf="analysisResult" class="analysis-results">
            <h4>Collection Statistics</h4>
            <dl>
              <dt>Total Cards:</dt>
              <dd>{{ analysisResult.stats.totalCards }}</dd>
              <dt>Total Sections:</dt>
              <dd>{{ analysisResult.stats.totalSections }}</dd>
              <dt>Avg Sections/Card:</dt>
              <dd>{{ analysisResult.stats.avgSectionsPerCard.toFixed(2) }}</dd>
              <dt>Cards with Actions:</dt>
              <dd>{{ analysisResult.stats.cardsWithActions }}</dd>
            </dl>

            <h4>Cards by Type</h4>
            <dl>
              <template *ngFor="let entry of typeEntries">
                <dt>{{ entry.key }}:</dt>
                <dd>{{ entry.value }}</dd>
              </template>
            </dl>

            <div *ngIf="analysisResult.duplicates.length > 0" class="warnings">
              <h4>⚠️ Duplicate Titles Found</h4>
              <ul>
                <li *ngFor="let dup of analysisResult.duplicates">
                  "{{ dup.title }}" appears {{ dup.count }} times
                </li>
              </ul>
            </div>

            <div *ngIf="analysisResult.issues.length > 0" class="issues">
              <h4>Issues Found</h4>
              <ul>
                <li *ngFor="let issue of analysisResult.issues">{{ issue }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Messages -->
      <div *ngIf="globalError" class="error-banner">
        <strong>Error:</strong> {{ globalError }}
        <button (click)="clearError()" class="close-btn">×</button>
      </div>
    </div>
  `,
  styles: [
    `
      .import-export-container {
        padding: 20px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        max-width: 1000px;
        margin: 0 auto;
      }

      .tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 2px solid #e0e0e0;
      }

      .tab-button {
        padding: 10px 20px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: #666;
        border-bottom: 3px solid transparent;
        transition: all 0.3s;

        &.active {
          color: #1976d2;
          border-bottom-color: #1976d2;
        }

        &:hover:not(.active) {
          color: #333;
        }
      }

      .tab-content {
        padding: 20px;
        background: #f9f9f9;
        border-radius: 4px;
      }

      .file-input-wrapper {
        margin-bottom: 20px;
      }

      .file-input {
        display: none;
      }

      .selected-files {
        margin: 15px 0;
        padding: 10px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .selected-files ul {
        margin: 10px 0;
        padding-left: 20px;
      }

      .import-actions,
      .export-actions {
        display: flex;
        gap: 10px;
        margin: 15px 0;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-primary {
        background: #1976d2;
        color: white;

        &:hover:not(:disabled) {
          background: #1565c0;
        }
      }

      .btn-success {
        background: #388e3c;
        color: white;

        &:hover:not(:disabled) {
          background: #2e7d32;
        }
      }

      .btn-secondary {
        background: #757575;
        color: white;

        &:hover {
          background: #616161;
        }
      }

      .form-control {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }

      .export-options {
        margin-bottom: 15px;
      }

      .export-options label {
        display: block;
        margin: 8px 0;
        cursor: pointer;
      }

      .export-options-detail {
        margin: 15px 0;
        padding: 10px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .export-format-options {
        margin: 15px 0;
        padding: 10px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .export-format-options label {
        display: inline-block;
        margin-right: 20px;
        cursor: pointer;
      }

      .result-message {
        margin: 15px 0;
        padding: 12px;
        border-radius: 4px;
        background: #c8e6c9;
        border: 1px solid #4caf50;
        color: #2e7d32;

        &.error {
          background: #ffcdd2;
          border-color: #f44336;
          color: #c62828;
        }
      }

      .stats-section {
        margin-top: 20px;
        padding: 15px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .analysis-results {
        margin-top: 20px;
        padding: 15px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .analysis-results dl {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 10px;
        margin-bottom: 15px;
      }

      .analysis-results dt {
        font-weight: 600;
        color: #333;
      }

      .analysis-results dd {
        color: #666;
        margin: 0;
      }

      .warnings,
      .issues {
        margin-top: 15px;
        padding: 12px;
        border-radius: 4px;
        background: #fff3cd;
        border: 1px solid #ffc107;
      }

      .warnings h4,
      .issues h4 {
        margin-top: 0;
        color: #856404;
      }

      .warnings ul,
      .issues ul {
        margin: 10px 0;
        padding-left: 20px;
      }

      .error-banner {
        margin-top: 20px;
        padding: 12px;
        background: #ffcdd2;
        border: 1px solid #f44336;
        border-radius: 4px;
        color: #c62828;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .close-btn {
        background: none;
        border: none;
        color: #c62828;
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        width: 24px;
        height: 24px;
      }

      .details {
        margin-top: 8px;
        font-size: 12px;
        opacity: 0.9;
      }
    `,
  ],
})
export class CardImportExportComponent implements OnInit, OnDestroy {
  activeTab: 'import' | 'export' | 'analyze' = 'import';
  selectedFiles: File[] = [];
  storedCards: AICardConfig[] = [];
  cardTypes: string[] = [];

  // Import state
  importResult: { success: boolean; message: string; details?: string } | null = null;
  importStats: { valid: number; invalid: number; successRate: number } | null = null;

  // Export state
  exportMode: 'all' | 'single' | 'filtered' = 'all';
  selectedCardId = '';
  selectedType = '';
  exportFormat: 'json' | 'individual' = 'json';
  exportResult: { success: boolean; message: string } | null = null;

  // Analysis state
  analysisResult: any = null;
  typeEntries: { key: string; value: number }[] = [];

  globalError: string | null = null;
  private destroy$ = new Subject<void>();
  private readonly storageService = inject(JsonFileStorageService);
  private readonly validationService = inject(CardValidationService);

  ngOnInit(): void {
    this.loadStoredCards();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStoredCards(): void {
    this.storageService
      .loadAllCards()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cards: AICardConfig[]) => {
          this.storedCards = cards;
          const types = cards
            .map((c) => c.cardType as string)
            .filter((type) => type !== undefined && type !== null);
          this.cardTypes = [...new Set(types)].sort();
        },
        error: (error: any) => {
          this.globalError = `Failed to load stored cards: ${error}`;
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = Array.from(input.files || []);
  }

  clearSelectedFiles(): void {
    this.selectedFiles = [];
    this.importResult = null;
    this.importStats = null;
  }

  importFiles(): void {
    if (this.selectedFiles.length === 0) {
      return;
    }

    const readers: Promise<string>[] = this.selectedFiles.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        })
    );

    Promise.all(readers)
      .then((contents) => {
        const result = BatchConversionUtil.validateMultipleCards(contents, this.validationService);

        // Save valid cards
        result.valid.forEach((card: AICardConfig) => {
          this.storageService
            .saveCard(card)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              error: (error: any) => {
                this.globalError = `Failed to save card: ${error}`;
              },
            });
        });

        this.importStats = {
          valid: result.valid.length,
          invalid: result.invalid.length,
          successRate: result.successRate,
        };

        const importResultBase = {
          success: result.invalid.length === 0,
          message: `Imported ${result.valid.length} cards${result.invalid.length > 0 ? ` (${result.invalid.length} failed)` : ''}`,
        };
        this.importResult =
          result.invalid.length > 0
            ? {
                ...importResultBase,
                details: `Failed cards: ${result.invalid.map((i: any) => `#${i.index + 1}`).join(', ')}`,
              }
            : importResultBase;

        this.loadStoredCards();
        this.clearSelectedFiles();
      })
      .catch((error: any) => {
        this.globalError = `Failed to read files: ${error}`;
      });
  }

  canExport(): boolean {
    if (this.storedCards.length === 0) {
      return false;
    }
    if (this.exportMode === 'single' && !this.selectedCardId) {
      return false;
    }
    return true;
  }

  exportCards(): void {
    let cardsToExport: AICardConfig[] = [];

    if (this.exportMode === 'all') {
      cardsToExport = this.storedCards;
    } else if (this.exportMode === 'single') {
      const card = this.storedCards.find((c) => c.id === this.selectedCardId);
      if (card) {
        cardsToExport = [card];
      }
    } else if (this.exportMode === 'filtered') {
      cardsToExport = this.selectedType
        ? this.storedCards.filter((c) => c.cardType === this.selectedType)
        : this.storedCards;
    }

    if (cardsToExport.length === 0) {
      this.exportResult = { success: false, message: 'No cards to export' };
      return;
    }

    try {
      if (this.exportFormat === 'json') {
        const jsonString = BatchConversionUtil.exportAsJsonArray(cardsToExport);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cards-export-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        cardsToExport.forEach((card) => {
          this.storageService.exportCard(card, `${card.id}.json`);
        });
      }

      this.exportResult = {
        success: true,
        message: `Exported ${cardsToExport.length} card(s) successfully`,
      };
    } catch (error) {
      this.exportResult = { success: false, message: `Export failed: ${error}` };
    }
  }

  analyzeCards(): void {
    const jsonStrings = this.storedCards.map((card) => JSON.stringify(card));
    this.analysisResult = BatchConversionUtil.analyzeCollection(
      jsonStrings,
      this.validationService
    );

    this.typeEntries = Object.entries(this.analysisResult.stats.byType).map(([key, value]) => ({
      key,
      value: value as number,
    }));
  }

  clearError(): void {
    this.globalError = null;
  }
}
