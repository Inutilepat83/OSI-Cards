import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';

/**
 * Blog page component
 */
@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconsModule],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogComponent {}











