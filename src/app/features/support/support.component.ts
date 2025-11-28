import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';

/**
 * Support page component
 */
@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconsModule],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportComponent {}


