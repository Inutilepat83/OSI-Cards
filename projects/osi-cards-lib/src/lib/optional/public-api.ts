/**
 * Optional Features Entry Point
 *
 * This secondary entry point contains optional heavy components that
 * can be loaded separately to reduce initial bundle size:
 * - ChartSectionComponent (requires chart.js)
 * - MapSectionComponent (requires leaflet)
 * - NetworkCardSectionComponent
 *
 * @example
 * ```typescript
 * // Import only when needed
 * import { ChartSectionComponent } from 'osi-cards-lib/optional';
 * ```
 */

// Chart Section (heavy - uses chart.js)
export { ChartSectionComponent } from '@osi-cards/components';

// Map Section (heavy - uses leaflet)
export { MapSectionComponent } from '@osi-cards/components';

// Network Card Section (complex visualization)
export { NetworkCardSectionComponent } from '@osi-cards/components';
