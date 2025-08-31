import { Type } from '@angular/core';

/**
 * Dynamic import utilities for optimized bundle splitting
 */
export class DynamicImportUtils {
  /**
   * Lazy load a feature module with named chunks
   */
  static loadFeatureModule<T>(importPath: string, moduleName: string): Promise<Type<T>> {
    return import(/* webpackChunkName: "[request]" */ `${importPath}`).then(
      module => module[moduleName]
    );
  }

  /**
   * Preload a module on user interaction
   */
  static preloadModule(importPath: string): void {
    import(/* webpackPreload: true */ `${importPath}`);
  }

  /**
   * Load module with prefetch hint
   */
  static prefetchModule(importPath: string): void {
    import(/* webpackPrefetch: true */ `${importPath}`);
  }

  /**
   * Load module with specific chunk name for better caching
   */
  static loadNamedChunk<T>(
    importPath: string,
    chunkName: string,
    moduleName: string
  ): Promise<Type<T>> {
    return import(
      /* webpackChunkName: "[request]" */
      `${importPath}`
    ).then(module => module[moduleName]);
  }
}

/**
 * Feature module loaders with optimized chunk names
 */
export const FeatureLoaders = {
  home: () =>
    DynamicImportUtils.loadNamedChunk('./features/home/home.module', 'home', 'HomeModule'),

  cards: () =>
    DynamicImportUtils.loadNamedChunk('./features/cards/cards.module', 'cards', 'CardsModule'),

  // Add more feature loaders as needed
  admin: () =>
    DynamicImportUtils.loadNamedChunk('./features/admin/admin.module', 'admin', 'AdminModule'),
};
