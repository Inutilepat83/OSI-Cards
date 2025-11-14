/**
 * Utility functions for tilt and shadow calculations
 * Extracted for better performance and reusability
 */

export interface TiltCalculations {
  rotateX: number;
  rotateY: number;
  glowBlur: number;
  glowOpacity: number;
  reflectionOpacity: number;
}

export interface ShadowGlowCalculations {
  offsetX: number;
  offsetY: number;
  intensity: number;
  blur: number;
  spread: number;
  opacity: number;
}

export interface ReflectionCalculations {
  intensity: number;
  offsetX: number;
  offsetY: number;
  angle: number;
}

// Constants for tilt calculations
export const TILT_CONSTANTS = {
  SHADOW_DISTANCE: 35,
  MAX_TILT_MAGNITUDE: 8,
  GLOW_INTENSITY_MIN: 0.3,
  GLOW_INTENSITY_MAX: 1.0,
  SHADOW_BLUR_BASE: 30,
  SHADOW_BLUR_MAX: 60,
  SHADOW_SPREAD_BASE: 0,
  SHADOW_SPREAD_MAX: 15,
  SHADOW_OPACITY_BASE: 0.4,
  SHADOW_OPACITY_MAX: 0.75,
  REFLECTION_INTENSITY_MIN: 0.1,
  REFLECTION_INTENSITY_MAX: 0.4,
  REFLECTION_OFFSET_X_MULTIPLIER: 35,
  REFLECTION_OFFSET_Y_MULTIPLIER: 25,
  GLOW_OPACITY_MULTIPLIER: 0.4,
  GLOW_OPACITY_MIN: 0,
  GLOW_OPACITY_MAX: 0.35,
  GLOW_BLUR_MIN: 2,
  GLOW_BLUR_MAX: 18,
  REFLECTION_OPACITY_MIN: 0,
  REFLECTION_OPACITY_MAX: 0.45
} as const;

/**
 * Calculate shadow glow properties based on tilt calculations
 * Memoized for performance
 */
export function calculateShadowGlow(calculations: TiltCalculations): ShadowGlowCalculations {
  const shadowOffsetX = -Math.sin((calculations.rotateY * Math.PI) / 180) * TILT_CONSTANTS.SHADOW_DISTANCE;
  const shadowOffsetY = Math.sin((calculations.rotateX * Math.PI) / 180) * TILT_CONSTANTS.SHADOW_DISTANCE;
  
  const tiltMagnitude = Math.abs(calculations.rotateX) + Math.abs(calculations.rotateY);
  const glowIntensity = Math.min(
    TILT_CONSTANTS.GLOW_INTENSITY_MAX,
    Math.max(TILT_CONSTANTS.GLOW_INTENSITY_MIN, tiltMagnitude / TILT_CONSTANTS.MAX_TILT_MAGNITUDE)
  );
  
  const shadowBlur = TILT_CONSTANTS.SHADOW_BLUR_BASE + (glowIntensity * (TILT_CONSTANTS.SHADOW_BLUR_MAX - TILT_CONSTANTS.SHADOW_BLUR_BASE));
  const shadowSpread = TILT_CONSTANTS.SHADOW_SPREAD_BASE + (glowIntensity * TILT_CONSTANTS.SHADOW_SPREAD_MAX);
  const shadowOpacity = TILT_CONSTANTS.SHADOW_OPACITY_BASE + (glowIntensity * (TILT_CONSTANTS.SHADOW_OPACITY_MAX - TILT_CONSTANTS.SHADOW_OPACITY_BASE));

  return {
    offsetX: shadowOffsetX,
    offsetY: shadowOffsetY,
    intensity: glowIntensity,
    blur: shadowBlur,
    spread: shadowSpread,
    opacity: shadowOpacity
  };
}

/**
 * Calculate reflection properties based on tilt calculations
 */
export function calculateReflection(calculations: TiltCalculations): ReflectionCalculations {
  const tiltMagnitude = Math.abs(calculations.rotateX) + Math.abs(calculations.rotateY);
  const reflectionIntensity = Math.min(
    TILT_CONSTANTS.REFLECTION_INTENSITY_MAX,
    Math.max(TILT_CONSTANTS.REFLECTION_INTENSITY_MIN, tiltMagnitude / 10)
  );
  const reflectionOffsetX = Math.sin((calculations.rotateY * Math.PI) / 180) * TILT_CONSTANTS.REFLECTION_OFFSET_X_MULTIPLIER;
  const reflectionOffsetY = Math.sin((calculations.rotateX * Math.PI) / 180) * TILT_CONSTANTS.REFLECTION_OFFSET_Y_MULTIPLIER;
  const reflectionAngle = Math.atan2(calculations.rotateY, calculations.rotateX) * (180 / Math.PI);

  return {
    intensity: reflectionIntensity,
    offsetX: reflectionOffsetX,
    offsetY: reflectionOffsetY,
    angle: reflectionAngle
  };
}

/**
 * Calculate processed glow and reflection values
 */
export function calculateProcessedGlow(calculations: TiltCalculations): {
  glowOpacity: number;
  glowBlur: number;
  reflectionOpacity: number;
} {
  return {
    glowOpacity: Math.min(
      TILT_CONSTANTS.GLOW_OPACITY_MAX,
      Math.max(TILT_CONSTANTS.GLOW_OPACITY_MIN, calculations.glowOpacity * TILT_CONSTANTS.GLOW_OPACITY_MULTIPLIER)
    ),
    glowBlur: Math.min(
      TILT_CONSTANTS.GLOW_BLUR_MAX,
      Math.max(TILT_CONSTANTS.GLOW_BLUR_MIN, calculations.glowBlur)
    ),
    reflectionOpacity: Math.min(
      TILT_CONSTANTS.REFLECTION_OPACITY_MAX,
      Math.max(TILT_CONSTANTS.REFLECTION_OPACITY_MIN, calculations.reflectionOpacity)
    )
  };
}

