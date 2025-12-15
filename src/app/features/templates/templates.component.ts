import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ComingSoonComponent,
  ComingSoonConfig,
} from '../../shared/components/coming-soon/coming-soon.component';

/**
 * Templates page component
 */
@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon [config]="config"></app-coming-soon>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesComponent {
  readonly config: ComingSoonConfig = {
    title: 'Templates',
    subtitle: 'Ready-to-use card templates',
    icon: 'layout-template',
    description:
      'This page is under development. Check back soon for pre-built card templates and examples.',
  };
}

