import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ComingSoonComponent,
  ComingSoonConfig,
} from '../../shared/components/coming-soon/coming-soon.component';

/**
 * Pricing page component
 */
@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon [config]="config"></app-coming-soon>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingComponent {
  readonly config: ComingSoonConfig = {
    title: 'Pricing',
    subtitle: 'Plans and pricing options',
    icon: 'credit-card',
    description:
      'This page is under development. Check back soon for pricing information and plan details.',
  };
}
