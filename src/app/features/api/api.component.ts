import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ComingSoonComponent,
  ComingSoonConfig,
} from '../../shared/components/coming-soon/coming-soon.component';

/**
 * API page component
 */
@Component({
  selector: 'app-api',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon [config]="config"></app-coming-soon>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiComponent {
  readonly config: ComingSoonConfig = {
    title: 'API',
    subtitle: 'API documentation and reference',
    icon: 'code',
    description:
      'This page is under development. Check back soon for API documentation and integration guides.',
  };
}

