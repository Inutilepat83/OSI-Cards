/**
 * OSI Cards Animation Constants
 * 
 * Centralized animation timing and configuration values.
 * All animation-related magic numbers should be defined here.
 * 
 * @example
 * ```typescript
 * import { ANIMATION_TIMING, STAGGER_DELAYS } from 'osi-cards-lib';
 * 
 * const delay = index * STAGGER_DELAYS.FIELD;
 * const duration = ANIMATION_TIMING.FIELD_ENTER;
 * ```
 */

// ============================================================================
// ANIMATION TIMING (in milliseconds)
// ============================================================================

/**
 * Standard animation timing values
 */
export const ANIMATION_TIMING = {
  /** Extra fast animations (micro-interactions) */
  INSTANT: 50,
  
  /** Fast transitions (hover states, small changes) */
  FAST: 150,
  
  /** Normal transitions (most UI changes) */
  NORMAL: 200,
  
  /** Slow transitions (complex animations) */
  SLOW: 300,
  
  /** Very slow transitions (dramatic effects) */
  EXTRA_SLOW: 500,
  
  /** Field enter animation duration */
  FIELD_ENTER: 300,
  
  /** Field exit animation duration */
  FIELD_EXIT: 200,
  
  /** Item enter animation duration */
  ITEM_ENTER: 350,
  
  /** Item exit animation duration */
  ITEM_EXIT: 250,
  
  /** Section enter animation duration */
  SECTION_ENTER: 400,
  
  /** Section exit animation duration */
  SECTION_EXIT: 300,
  
  /** Card enter animation duration */
  CARD_ENTER: 450,
  
  /** Card exit animation duration */
  CARD_EXIT: 350,
  
  /** Streaming pulse animation duration */
  STREAMING_PULSE: 1500,
  
  /** Loading message rotation interval */
  LOADING_MESSAGE_INTERVAL: 2500,
  
  /** Tilt effect transition duration */
  TILT_TRANSITION: 100,
  
  /** Tilt reset duration */
  TILT_RESET: 300,
} as const;

/**
 * Stagger delay values for sequential animations
 */
export const STAGGER_DELAYS = {
  /** Delay between field animations */
  FIELD: 40,
  
  /** Delay between item animations */
  ITEM: 40,
  
  /** Delay between section animations */
  SECTION: 80,
  
  /** Delay between card animations */
  CARD: 120,
  
  /** Maximum stagger index to prevent excessive delays */
  MAX_INDEX: 15,
} as const;

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * CSS easing function strings
 */
export const EASING = {
  /** Standard easing for most animations */
  DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  /** Ease in - starts slow */
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  
  /** Ease out - ends slow */
  EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
  
  /** Ease in out - slow start and end */
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  /** Linear - constant speed */
  LINEAR: 'linear',
  
  /** Bounce effect */
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  /** Elastic effect */
  ELASTIC: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  
  /** Sharp - quick acceleration */
  SHARP: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

// ============================================================================
// TRANSFORM VALUES
// ============================================================================

/**
 * CSS transform values for animations
 */
export const TRANSFORM = {
  /** No transform */
  NONE: 'none',
  
  /** Slight scale up for hover effects */
  SCALE_UP_SUBTLE: 'scale(1.02)',
  
  /** Medium scale up */
  SCALE_UP_MEDIUM: 'scale(1.05)',
  
  /** Scale down for pressed state */
  SCALE_DOWN: 'scale(0.98)',
  
  /** Translate up for entry animations */
  TRANSLATE_UP_ENTRY: 'translateY(-10px)',
  
  /** Translate down for entry animations */
  TRANSLATE_DOWN_ENTRY: 'translateY(10px)',
  
  /** Translate left for entry animations */
  TRANSLATE_LEFT_ENTRY: 'translateX(-10px)',
  
  /** Translate right for entry animations */
  TRANSLATE_RIGHT_ENTRY: 'translateX(10px)',
} as const;

// ============================================================================
// OPACITY VALUES
// ============================================================================

/**
 * Standard opacity values
 */
export const OPACITY = {
  /** Fully transparent */
  TRANSPARENT: 0,
  
  /** Very subtle */
  HINT: 0.1,
  
  /** Subtle visibility */
  SUBTLE: 0.3,
  
  /** Half visible */
  HALF: 0.5,
  
  /** Mostly visible */
  MOST: 0.8,
  
  /** Fully visible */
  OPAQUE: 1,
  
  /** Disabled state opacity */
  DISABLED: 0.5,
  
  /** Hover overlay opacity */
  HOVER_OVERLAY: 0.05,
  
  /** Focus ring opacity */
  FOCUS_RING: 0.3,
} as const;

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

/**
 * Pre-defined animation configurations
 */
export const ANIMATION_PRESETS = {
  /** Fade in animation config */
  FADE_IN: {
    opacity: [OPACITY.TRANSPARENT, OPACITY.OPAQUE],
    duration: ANIMATION_TIMING.NORMAL,
    easing: EASING.EASE_OUT,
  },
  
  /** Fade out animation config */
  FADE_OUT: {
    opacity: [OPACITY.OPAQUE, OPACITY.TRANSPARENT],
    duration: ANIMATION_TIMING.FAST,
    easing: EASING.EASE_IN,
  },
  
  /** Slide up animation config */
  SLIDE_UP: {
    transform: [TRANSFORM.TRANSLATE_DOWN_ENTRY, TRANSFORM.NONE],
    opacity: [OPACITY.TRANSPARENT, OPACITY.OPAQUE],
    duration: ANIMATION_TIMING.NORMAL,
    easing: EASING.EASE_OUT,
  },
  
  /** Scale in animation config */
  SCALE_IN: {
    transform: ['scale(0.95)', 'scale(1)'],
    opacity: [OPACITY.TRANSPARENT, OPACITY.OPAQUE],
    duration: ANIMATION_TIMING.NORMAL,
    easing: EASING.EASE_OUT,
  },
  
  /** Streaming field animation config */
  FIELD_STREAMING: {
    transform: [TRANSFORM.TRANSLATE_UP_ENTRY, TRANSFORM.NONE],
    opacity: [OPACITY.TRANSPARENT, OPACITY.OPAQUE],
    duration: ANIMATION_TIMING.FIELD_ENTER,
    easing: EASING.EASE_OUT,
  },
  
  /** Streaming item animation config */
  ITEM_STREAMING: {
    transform: [TRANSFORM.TRANSLATE_DOWN_ENTRY, TRANSFORM.NONE],
    opacity: [OPACITY.TRANSPARENT, OPACITY.OPAQUE],
    duration: ANIMATION_TIMING.ITEM_ENTER,
    easing: EASING.EASE_OUT,
  },
} as const;

// ============================================================================
// TILT EFFECT CONFIGURATION
// ============================================================================

/**
 * Magnetic tilt effect configuration
 */
export const TILT_CONFIG = {
  /** Maximum tilt angle in degrees */
  MAX_ANGLE: 10,
  
  /** Tilt sensitivity multiplier */
  SENSITIVITY: 0.5,
  
  /** Glow effect intensity */
  GLOW_INTENSITY: 0.4,
  
  /** Maximum glow blur in pixels */
  MAX_GLOW_BLUR: 40,
  
  /** Reflection opacity multiplier */
  REFLECTION_MULTIPLIER: 0.3,
  
  /** Distance threshold for activation */
  ACTIVATION_DISTANCE: 300,
} as const;

// ============================================================================
// REDUCED MOTION
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation timing based on reduced motion preference
 */
export function getAnimationTiming(baseTiming: number): number {
  return prefersReducedMotion() ? 0 : baseTiming;
}

/**
 * Get easing based on reduced motion preference
 */
export function getEasing(baseEasing: string): string {
  return prefersReducedMotion() ? EASING.LINEAR : baseEasing;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AnimationTimingKey = keyof typeof ANIMATION_TIMING;
export type StaggerDelayKey = keyof typeof STAGGER_DELAYS;
export type EasingKey = keyof typeof EASING;
export type TransformKey = keyof typeof TRANSFORM;
export type OpacityKey = keyof typeof OPACITY;
export type AnimationPresetKey = keyof typeof ANIMATION_PRESETS;




