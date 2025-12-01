import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

export interface SystemStats {
  totalFiles?: number;
  totalCards?: number;
  totalSections?: number;
  [key: string]: number | undefined;
}

/**
 * System Stats Component
 * Extracted from HomePageComponent for better separation of concerns
 * Displays system statistics and metrics
 */
@Component({
  selector: 'app-system-stats',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="system-stats" *ngIf="stats">
      <div class="stats-item" *ngIf="stats.totalFiles !== undefined">
        <lucide-icon name="file-text" [size]="16"></lucide-icon>
        <span class="stats-label">Files:</span>
        <span class="stats-value">{{ stats.totalFiles }}</span>
      </div>
      <div class="stats-item" *ngIf="stats.totalCards !== undefined">
        <lucide-icon name="layers" [size]="16"></lucide-icon>
        <span class="stats-label">Cards:</span>
        <span class="stats-value">{{ stats.totalCards }}</span>
      </div>
      <div class="stats-item" *ngIf="stats.totalSections !== undefined">
        <lucide-icon name="grid" [size]="16"></lucide-icon>
        <span class="stats-label">Sections:</span>
        <span class="stats-value">{{ stats.totalSections }}</span>
      </div>
    </div>
  `,
  styles: [`
    .system-stats {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 0.5rem;
      background: rgba(20, 30, 50, 0.4);
      border-radius: 0.375rem;
    }

    .stats-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: var(--card-text-secondary, #B8C5D6);
    }

    .stats-label {
      font-weight: 500;
    }

    .stats-value {
      font-weight: 600;
      color: var(--card-text-primary, #FFFFFF);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SystemStatsComponent {
  @Input() stats: SystemStats | null = null;
}


















