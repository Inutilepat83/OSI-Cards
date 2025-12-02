/**
 * Animation Utilities
 *
 * Consolidated animation utilities for OSI Cards.
 * Includes FLIP, Web Animations API, and optimization.
 */

// Consolidated utilities (recommended)
export * from './animations.consolidated';

// Quick access namespace
export { AnimationUtil, slideIn } from './animations.consolidated';

// Individual utilities (backwards compatibility)
export * from '../animation-optimization.util';
export * from '../flip-animation.util';
export * from '../web-animations.util';

