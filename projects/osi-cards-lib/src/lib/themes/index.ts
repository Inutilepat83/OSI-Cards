/**
 * Theme System
 *
 * Exports theme service, presets, utilities, composition tools, and providers
 */

// Core Theme Service
export * from './theme.service';

// Theme Configuration Provider
export * from './theme-config.provider';

// Theme Composition Utilities (mergeThemes comes from here)
export * from './theme-composer.util';

// Theme Builder Utilities (excluding mergeThemes to avoid duplicate)
export {
  buildThemeFromBase,
  createPartialTheme,
  validateCSSVariableNames,
  generateThemeFromPalette,
} from './theme-builder.util';

// Theme Presets
export * from './presets';

// Design Token Constants
export * from './tokens.constants';

