import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-skeleton.component.html',
  styleUrls: ['./card-skeleton.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardSkeletonComponent {
  @Input() cardTitle = '';
  @Input() sectionCount = 0;
  @Input() isFullscreen = false;
}






