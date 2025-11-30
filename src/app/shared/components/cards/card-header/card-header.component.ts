import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../../icons/lucide-icons.module';

/**
 * Card Header Component
 * 
 * Displays the card title and export button.
 * Extracted from AICardRendererComponent for better separation of concerns.
 */
@Component({
  selector: 'app-card-header',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './card-header.component.html',
  styleUrls: ['./card-header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardHeaderComponent {
  @Input() cardTitle?: string;
  @Input() showExport = false;
  @Output() export = new EventEmitter<void>();

  onExport(): void {
    this.export.emit();
  }
}







