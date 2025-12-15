import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ComingSoonComponent,
  ComingSoonConfig,
} from '../../shared/components/coming-soon/coming-soon.component';

/**
 * Contact page component
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon [config]="config"></app-coming-soon>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  readonly config: ComingSoonConfig = {
    title: 'Contact',
    subtitle: 'Get in touch with us',
    icon: 'mail',
    description:
      'This page is under development. Check back soon for contact information and support options.',
  };
}

