import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';

/**
 * Features page component
 */
@Component({
  selector: 'app-features-page',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconsModule],
  templateUrl: './features-page.component.html',
  styleUrls: ['./features-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturesPageComponent {}











