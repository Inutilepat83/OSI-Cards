import { Injectable, inject } from '@angular/core';
import { CardSection } from '../../../../models';
import { ISectionTypeResolver } from './section-type-resolver.interface';
import { DefaultSectionTypeResolver } from './section-type-resolver.strategies';

/**
 * Section Type Resolver Service
 * Uses strategy pattern to resolve section types
 * Allows different resolution strategies to be used
 */
@Injectable({
  providedIn: 'root'
})
export class SectionTypeResolverService {
  private resolver: ISectionTypeResolver = inject(DefaultSectionTypeResolver);

  /**
   * Resolve section type using current strategy
   */
  resolve(section: CardSection): string {
    return this.resolver.resolve(section);
  }

  /**
   * Set custom resolver strategy
   */
  setResolver(resolver: ISectionTypeResolver): void {
    this.resolver = resolver;
  }

  /**
   * Get current resolver
   */
  getResolver(): ISectionTypeResolver {
    return this.resolver;
  }
}


