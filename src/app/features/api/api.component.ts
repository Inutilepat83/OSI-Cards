import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';

/**
 * API documentation page component
 */
@Component({
  selector: 'app-api',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconsModule],
  templateUrl: './api.component.html',
  styleUrls: ['./api.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApiComponent {}











