import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ComingSoonComponent,
  ComingSoonConfig,
} from '../../shared/components/coming-soon/coming-soon.component';

/**
 * Blog page component
 */
@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon [config]="config"></app-coming-soon>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent {
  readonly config: ComingSoonConfig = {
    title: 'Blog',
    subtitle: 'Latest news, updates, and insights',
    icon: 'book-open',
    description: 'This page is under development. Check back soon for blog posts and updates.',
  };
}

