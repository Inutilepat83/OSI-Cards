/**
 * OSI Cards Library Providers
 * 
 * Exports provider functions and injection tokens for configuring
 * the OSI Cards library in your Angular application.
 * 
 * @example
 * ```typescript
 * import { 
 *   provideOSICards, 
 *   OSI_STREAMING_CONFIG,
 *   OSI_ANIMATION_CONFIG 
 * } from 'osi-cards-lib';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideOSICards(),
 *     { provide: OSI_STREAMING_CONFIG, useValue: { tokensPerSecond: 100 } }
 *   ]
 * };
 * ```
 */

export * from './osi-cards.providers';
export * from './injection-tokens';
export * from './enhanced-providers';
export * from './zoneless.providers';












