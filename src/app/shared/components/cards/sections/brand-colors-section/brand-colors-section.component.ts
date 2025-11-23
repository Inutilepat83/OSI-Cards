import { ChangeDetectionStrategy, Component, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';
import { LoggingService } from '../../../../../core/services/logging.service';

interface BrandColor {
  id: string;
  label: string;
  hex: string;
  rgb?: string;
  copied?: boolean;
}

@Component({
  selector: 'app-brand-colors-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './brand-colors-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandColorsSectionComponent extends BaseSectionComponent<CardField> {
  private readonly logger = inject(LoggingService);
  brandColors: BrandColor[] = [];
  copiedColorId: string | null = null;

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['section']) {
      this.extractBrandColors();
    }
  }

  private extractBrandColors(): void {
    const fields = this.getFields();
    const colors: BrandColor[] = [];

    fields.forEach((field, index) => {
      if (field.value && typeof field.value === 'string') {
        // Check if it's a hex color
        if (this.isHexColor(field.value)) {
          colors.push({
            id: field.id || `color-${index}`,
            label: field.label || field.title || `Color ${index + 1}`,
            hex: field.value.toUpperCase(),
            rgb: this.hexToRgb(field.value),
            copied: false
          });
        }
      }
    });

    this.brandColors = colors;
  }

  private isHexColor(value: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return '';
  }

  async copyToClipboard(color: BrandColor): Promise<void> {
    try {
      await navigator.clipboard.writeText(color.hex);
      this.copiedColorId = color.id;
      
      // Reset after 2 seconds
      setTimeout(() => {
        this.copiedColorId = null;
        this.cdr.markForCheck();
      }, 2000);
      
      this.cdr.markForCheck();
    } catch (err) {
      this.logger.error('Failed to copy to clipboard', 'BrandColorsSectionComponent', err);
    }
  }

  get hasColors(): boolean {
    return this.brandColors.length > 0;
  }

  get fields(): CardField[] {
    return this.getFields();
  }

  override get hasFields(): boolean {
    return this.hasColors;
  }

  onColorClick(color: BrandColor): void {
    this.copyToClipboard(color);
  }

  trackColor(index: number, color: BrandColor): string {
    return color.id;
  }
}
