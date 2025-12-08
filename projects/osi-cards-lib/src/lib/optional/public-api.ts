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
export { ChartSectionComponent } from '../components/sections/chart-section/chart-section.component';

// Map Section (heavy - uses leaflet)
export { MapSectionComponent } from '../components/sections/map-section/map-section.component';

// Network Card Section (complex visualization)
export { NetworkCardSectionComponent } from '../components/sections/network-card-section/network-card-section.component';



