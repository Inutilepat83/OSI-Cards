import { Injectable } from '@angular/core';
import { CardSection } from '../../../../models';
import { ISectionTypeResolver } from './section-type-resolver.interface';

/**
 * Default section type resolver strategy
 * Resolves type based on section.type and section.title
 */
@Injectable()
export class DefaultSectionTypeResolver implements ISectionTypeResolver {
  resolve(section: CardSection): string {
    if (!section) {
      return 'unknown';
    }

    try {
      const type = (section.type ?? '').toLowerCase();
      const title = (section.title ?? '').toLowerCase();

      // Type-based resolution
      if (type === 'info' && title.includes('overview')) {
        return 'overview';
      }
      if (type === 'timeline') {
        return 'event';
      }
      if (type === 'metrics' || type === 'stats') {
        return 'analytics';
      }
      if (type === 'table') {
        return 'list';
      }
      if (type === 'project') {
        return 'info';
      }
      if (type === 'locations') {
        return 'map';
      }
      if (type === 'quotation' || type === 'quote') {
        return 'quotation';
      }
      if (type === 'text-reference' || type === 'reference' || type === 'text-ref') {
        return 'text-reference';
      }
      if (type === 'brand-colors' || type === 'brands' || type === 'colors') {
        return 'brand-colors';
      }

      // Title-based fallback
      if (!type) {
        if (title.includes('overview')) {
          return 'overview';
        }
        return 'fallback';
      }

      return type;
    } catch {
      return 'unknown';
    }
  }
}

/**
 * Title-based section type resolver strategy
 * Primarily uses section title to determine type
 */
@Injectable()
export class TitleBasedSectionTypeResolver implements ISectionTypeResolver {
  resolve(section: CardSection): string {
    if (!section?.title) {
      return 'fallback';
    }

    const title = section.title.toLowerCase();

    // Title keywords mapping
    const titleMappings: Record<string, string> = {
      'overview': 'overview',
      'summary': 'overview',
      'analytics': 'analytics',
      'metrics': 'analytics',
      'statistics': 'analytics',
      'financial': 'financials',
      'revenue': 'financials',
      'pricing': 'financials',
      'products': 'product',
      'features': 'product',
      'solutions': 'solutions',
      'services': 'solutions',
      'contacts': 'contact-card',
      'team': 'contact-card',
      'people': 'contact-card',
      'network': 'network-card',
      'connections': 'network-card',
      'map': 'map',
      'location': 'map',
      'locations': 'map',
      'chart': 'chart',
      'graph': 'chart',
      'quote': 'quotation',
      'testimonial': 'quotation',
      'news': 'news',
      'announcement': 'news',
      'social': 'social-media',
      'timeline': 'event',
      'events': 'event',
      'schedule': 'event'
    };

    for (const [keyword, resolvedType] of Object.entries(titleMappings)) {
      if (title.includes(keyword)) {
        return resolvedType;
      }
    }

    return 'fallback';
  }
}

/**
 * Type-first section type resolver strategy
 * Uses section.type as primary source, falls back to title
 */
@Injectable()
export class TypeFirstSectionTypeResolver implements ISectionTypeResolver {
  resolve(section: CardSection): string {
    if (!section) {
      return 'unknown';
    }

    const type = (section.type ?? '').toLowerCase().trim();
    
    if (type) {
      return type;
    }

    // Fallback to title-based resolution
    const titleResolver = new TitleBasedSectionTypeResolver();
    return titleResolver.resolve(section);
  }
}


