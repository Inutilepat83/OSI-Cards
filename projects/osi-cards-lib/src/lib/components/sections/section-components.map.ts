/**
 * Section Component Map
 * 
 * Single source of truth mapping section type -> component class.
 * The layout registry reads layoutConfig directly from these component classes.
 * 
 * TO ADD A NEW SECTION:
 * 1. Create your component with `static layoutConfig: SectionLayoutConfig = {...}`
 * 2. Add one import and one map entry below
 * 
 * That's it - no other files to update!
 */

import { Type } from '@angular/core';
import { BaseSectionComponent, SectionLayoutConfig } from './base-section.component';

// Section component imports
import { OverviewSectionComponent } from './overview-section/overview-section.component';
import { AnalyticsSectionComponent } from './analytics-section/analytics-section.component';
import { FinancialsSectionComponent } from './financials-section/financials-section.component';
import { ChartSectionComponent } from './chart-section/chart-section.component';
import { MapSectionComponent } from './map-section/map-section.component';
import { SolutionsSectionComponent } from './solutions-section/solutions-section.component';
import { ProductSectionComponent } from './product-section/product-section.component';
import { NewsSectionComponent } from './news-section/news-section.component';
import { ContactCardSectionComponent } from './contact-card-section/contact-card-section.component';
import { NetworkCardSectionComponent } from './network-card-section/network-card-section.component';
import { InfoSectionComponent } from './info-section.component';
import { ListSectionComponent } from './list-section/list-section.component';
import { EventSectionComponent } from './event-section/event-section.component';
import { QuotationSectionComponent } from './quotation-section/quotation-section.component';
import { TextReferenceSectionComponent } from './text-reference-section/text-reference-section.component';
import { BrandColorsSectionComponent } from './brand-colors-section/brand-colors-section.component';
import { SocialMediaSectionComponent } from './social-media-section/social-media-section.component';
import { FallbackSectionComponent } from './fallback-section/fallback-section.component';

/**
 * Component class with static layoutConfig
 * Uses `any` generic to allow section components with specific field types
 * (e.g., AnalyticsSectionComponent extends BaseSectionComponent<AnalyticsField>)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SectionComponentClass extends Type<BaseSectionComponent<any>> {
  layoutConfig?: SectionLayoutConfig;
}

/**
 * Map of section type -> component class
 * 
 * The registry uses this to look up layoutConfig from each component.
 * Keys should be lowercase section type names.
 */
export const SECTION_COMPONENT_MAP: Record<string, SectionComponentClass> = {
  // Full width (4 columns)
  'overview': OverviewSectionComponent,
  
  // Wide sections (3 columns)
  'solutions': SolutionsSectionComponent,
  
  // Medium sections (2 columns)
  'analytics': AnalyticsSectionComponent,
  'financials': FinancialsSectionComponent,
  'chart': ChartSectionComponent,
  'map': MapSectionComponent,
  'product': ProductSectionComponent,
  'news': NewsSectionComponent,
  'brand-colors': BrandColorsSectionComponent,
  'social-media': SocialMediaSectionComponent,
  
  // Compact sections (1 column)
  'contact-card': ContactCardSectionComponent,
  'network-card': NetworkCardSectionComponent,
  'info': InfoSectionComponent,
  'list': ListSectionComponent,
  'event': EventSectionComponent,
  'quotation': QuotationSectionComponent,
  'text-reference': TextReferenceSectionComponent,
  
  // Fallback
  'fallback': FallbackSectionComponent,
};

/**
 * Get the component class for a section type
 */
export function getSectionComponent(type: string): SectionComponentClass | undefined {
  return SECTION_COMPONENT_MAP[type.toLowerCase()];
}

/**
 * Get all registered section types
 */
export function getRegisteredTypes(): string[] {
  return Object.keys(SECTION_COMPONENT_MAP);
}

