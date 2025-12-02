/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:from-registry
 */

import { Type } from '@angular/core';
import { BaseSectionComponent } from '../sections/base-section.component';
import { SectionType } from '../../models/generated-section-types';

import { AnalyticsSectionComponent } from '../sections/analytics-section/analytics-section.component';
import { BrandColorsSectionComponent } from '../sections/brand-colors-section/brand-colors-section.component';
import { ChartSectionComponent } from '../sections/chart-section/chart-section.component';
import { ContactCardSectionComponent } from '../sections/contact-card-section/contact-card-section.component';
import { EventSectionComponent } from '../sections/event-section/event-section.component';
import { FallbackSectionComponent } from '../sections/fallback-section/fallback-section.component';
import { FaqSectionComponent } from '../sections/faq-section/faq-section.component';
import { FinancialsSectionComponent } from '../sections/financials-section/financials-section.component';
import { GallerySectionComponent } from '../sections/gallery-section/gallery-section.component';
import { InfoSectionComponent } from '../sections/info-section/info-section.component';
import { ListSectionComponent } from '../sections/list-section/list-section.component';
import { MapSectionComponent } from '../sections/map-section/map-section.component';
import { NetworkCardSectionComponent } from '../sections/network-card-section/network-card-section.component';
import { NewsSectionComponent } from '../sections/news-section/news-section.component';
import { OverviewSectionComponent } from '../sections/overview-section/overview-section.component';
import { ProductSectionComponent } from '../sections/product-section/product-section.component';
import { QuotationSectionComponent } from '../sections/quotation-section/quotation-section.component';
import { SocialMediaSectionComponent } from '../sections/social-media-section/social-media-section.component';
import { SolutionsSectionComponent } from '../sections/solutions-section/solutions-section.component';
import { TextReferenceSectionComponent } from '../sections/text-reference-section/text-reference-section.component';
import { TimelineSectionComponent } from '../sections/timeline-section/timeline-section.component';
import { VideoSectionComponent } from '../sections/video-section/video-section.component';

/**
 * Map of section types to their component classes
 * Used for dynamic component resolution
 * Note: Using `any` for field type to allow specialized section field types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SECTION_COMPONENT_MAP: Record<SectionType, Type<BaseSectionComponent<any>>> = {
  'analytics': AnalyticsSectionComponent,
  'brand-colors': BrandColorsSectionComponent,
  'chart': ChartSectionComponent,
  'contact-card': ContactCardSectionComponent,
  'event': EventSectionComponent,
  'fallback': FallbackSectionComponent,
  'faq': FaqSectionComponent,
  'financials': FinancialsSectionComponent,
  'gallery': GallerySectionComponent,
  'info': InfoSectionComponent,
  'list': ListSectionComponent,
  'map': MapSectionComponent,
  'network-card': NetworkCardSectionComponent,
  'news': NewsSectionComponent,
  'overview': OverviewSectionComponent,
  'product': ProductSectionComponent,
  'quotation': QuotationSectionComponent,
  'social-media': SocialMediaSectionComponent,
  'solutions': SolutionsSectionComponent,
  'text-reference': TextReferenceSectionComponent,
  'timeline': TimelineSectionComponent,
  'video': VideoSectionComponent
};

/**
 * Get the component class for a section type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSectionComponent(type: SectionType): Type<BaseSectionComponent<any>> {
  return SECTION_COMPONENT_MAP[type];
}
