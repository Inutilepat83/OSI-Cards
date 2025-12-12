import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ComingSoonComponent,
  ComingSoonConfig,
} from '../../shared/components/coming-soon/coming-soon.component';

/**
 * About page component
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon [config]="config"></app-coming-soon>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  readonly config: ComingSoonConfig = {
    title: 'About',
    subtitle: 'Learn more about OSI Cards',
    icon: 'info',
    description:
      'This page is under development. Check back soon for information about our mission and team.',
  };
}

