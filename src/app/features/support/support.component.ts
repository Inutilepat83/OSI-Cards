import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ComingSoonComponent,
  ComingSoonConfig,
} from '../../shared/components/coming-soon/coming-soon.component';

/**
 * Support page component
 */
@Component({
  selector: 'app-support',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon [config]="config"></app-coming-soon>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportComponent {
  readonly config: ComingSoonConfig = {
    title: 'Support',
    subtitle: 'Help and documentation',
    icon: 'life-buoy',
    description: 'This page is under development. Check back soon for support resources and FAQs.',
  };
}
