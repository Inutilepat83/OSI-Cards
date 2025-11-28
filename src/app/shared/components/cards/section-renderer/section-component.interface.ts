import { ComponentRef, EventEmitter } from '@angular/core';
import { CardSection, CardField, CardItem, CardAction } from '../../../../models';
import { SectionRenderEvent } from './section-renderer.component';
import { SectionInteraction } from '../sections/base-section.component';

/**
 * Base interface for all section component instances
 * 
 * All section components must implement this interface to ensure
 * consistent behavior and type safety when dynamically loading components.
 * 
 * Note: This interface uses a more flexible type to accommodate different
 * section component implementations that may have slightly different
 * event emitter signatures. The event emitters use `any` to allow for
 * component-specific interaction types while maintaining runtime compatibility.
 */
export interface SectionComponentInstance {
  /** The section data to display */
  section: CardSection;
  
  /** Optional event emitter for field interactions */
  fieldInteraction?: EventEmitter<any>;
  
  /** Optional event emitter for item interactions */
  itemInteraction?: EventEmitter<any>;
  
  /** Optional event emitter for action interactions */
  actionInteraction?: EventEmitter<any>;
  
  /** Optional event emitter for info field interactions */
  infoFieldInteraction?: EventEmitter<any>;
  
  /** Optional event emitter for general section events */
  sectionEvent?: EventEmitter<any>;
}

/**
 * Type guard to check if a component instance implements SectionComponentInstance
 */
export function isSectionComponentInstance(instance: unknown): instance is SectionComponentInstance {
  return (
    typeof instance === 'object' &&
    instance !== null &&
    'section' in instance &&
    typeof (instance as SectionComponentInstance).section === 'object'
  );
}

/**
 * Type for component references to section components
 */
export type SectionComponentRef = ComponentRef<SectionComponentInstance>;

