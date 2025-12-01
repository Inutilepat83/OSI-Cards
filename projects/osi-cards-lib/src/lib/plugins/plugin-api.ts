/**
 * Plugin API (Improvements #76-85)
 * 
 * Extensible plugin system for OSI Cards library.
 * Allows third-party developers to extend functionality.
 * 
 * @example
 * ```typescript
 * import { createPlugin, PluginRegistry } from 'osi-cards-lib/plugins';
 * 
 * // Create a custom section plugin
 * const myPlugin = createPlugin({
 *   name: 'my-custom-section',
 *   version: '1.0.0',
 *   sectionTypes: [{
 *     type: 'my-section',
 *     component: MyCustomComponent,
 *     icon: 'custom-icon'
 *   }]
 * });
 * 
 * // Register the plugin
 * PluginRegistry.register(myPlugin);
 * ```
 */

import { Type, InjectionToken, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import type { CardSection } from '../models';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Unique plugin identifier */
  name: string;
  /** Plugin version (semver) */
  version: string;
  /** Human-readable display name */
  displayName?: string;
  /** Plugin description */
  description?: string;
  /** Plugin author */
  author?: string;
  /** Plugin homepage/repository URL */
  homepage?: string;
  /** Dependencies on other plugins */
  dependencies?: string[];
  /** Minimum OSI Cards version required */
  minOsiCardsVersion?: string;
}

/**
 * Custom section type definition
 */
export interface SectionTypeDefinition {
  /** Section type identifier */
  type: string;
  /** Angular component to render this section */
  component: Type<unknown>;
  /** Icon for section (used in editor/tooling) */
  icon?: string;
  /** Section display name */
  displayName?: string;
  /** Section description */
  description?: string;
  /** Default configuration */
  defaultConfig?: Partial<CardSection>;
  /** JSON schema for validation */
  schema?: Record<string, unknown>;
  /** Preferred column span */
  preferredColumns?: 1 | 2 | 3 | 4;
}

/**
 * Custom action type definition
 */
export interface ActionTypeDefinition {
  /** Action type identifier */
  type: string;
  /** Action handler function */
  handler: (action: unknown, context: ActionContext) => void | Promise<void>;
  /** Icon for action */
  icon?: string;
  /** Action display name */
  displayName?: string;
  /** Validation function */
  validate?: (action: unknown) => boolean;
}

/**
 * Action context passed to handlers
 */
export interface ActionContext {
  cardId: string;
  sectionId?: string;
  card: unknown;
  section?: unknown;
}

/**
 * Theme extension definition
 */
export interface ThemeExtension {
  /** Theme name */
  name: string;
  /** CSS variables */
  variables: Record<string, string>;
  /** Color scheme */
  colorScheme?: 'light' | 'dark';
}

/**
 * Middleware function type
 */
export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => void | Promise<void>
) => void | Promise<void>;

/**
 * Middleware context
 */
export interface MiddlewareContext {
  type: 'render' | 'action' | 'stream' | 'layout';
  data: unknown;
  metadata: Record<string, unknown>;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycle {
  /** Called when plugin is registered */
  onRegister?: () => void | Promise<void>;
  /** Called when plugin is initialized */
  onInit?: () => void | Promise<void>;
  /** Called when plugin is destroyed */
  onDestroy?: () => void | Promise<void>;
  /** Called when card is rendered */
  onCardRender?: (card: unknown) => void;
  /** Called when section is rendered */
  onSectionRender?: (section: CardSection) => void;
  /** Called when action is triggered */
  onActionTrigger?: (action: unknown) => void;
}

/**
 * Complete plugin definition
 */
export interface PluginDefinition extends PluginMetadata {
  /** Custom section types */
  sectionTypes?: SectionTypeDefinition[];
  /** Custom action types */
  actionTypes?: ActionTypeDefinition[];
  /** Theme extensions */
  themes?: ThemeExtension[];
  /** Middleware functions */
  middleware?: MiddlewareFunction[];
  /** Lifecycle hooks */
  lifecycle?: PluginLifecycle;
  /** Angular providers */
  providers?: Type<unknown>[];
  /** Custom utilities */
  utilities?: Record<string, unknown>;
}

/**
 * Registered plugin instance
 */
export interface RegisteredPlugin extends PluginDefinition {
  /** Registration timestamp */
  registeredAt: number;
  /** Plugin status */
  status: 'registered' | 'initialized' | 'error';
  /** Error message if status is 'error' */
  error?: string;
}

// ============================================================================
// INJECTION TOKENS
// ============================================================================

/**
 * Injection token for registered plugins
 */
export const OSI_PLUGINS = new InjectionToken<PluginDefinition[]>('OSI_PLUGINS');

/**
 * Injection token for plugin registry
 */
export const OSI_PLUGIN_REGISTRY = new InjectionToken<PluginRegistry>('OSI_PLUGIN_REGISTRY');

// ============================================================================
// PLUGIN FACTORY
// ============================================================================

/**
 * Create a plugin definition with type safety
 */
export function createPlugin(definition: PluginDefinition): PluginDefinition {
  // Validate required fields
  if (!definition.name) {
    throw new Error('Plugin name is required');
  }
  if (!definition.version) {
    throw new Error('Plugin version is required');
  }
  
  // Validate version format (semver)
  const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
  if (!semverRegex.test(definition.version)) {
    console.warn(`Plugin "${definition.name}" has non-semver version: ${definition.version}`);
  }
  
  // Validate section types
  if (definition.sectionTypes) {
    for (const section of definition.sectionTypes) {
      if (!section.type) {
        throw new Error(`Section type must have a type identifier`);
      }
      if (!section.component) {
        throw new Error(`Section type "${section.type}" must have a component`);
      }
    }
  }
  
  return definition;
}

// ============================================================================
// PLUGIN REGISTRY
// ============================================================================

/**
 * Plugin registry for managing registered plugins
 */
export class PluginRegistry {
  private plugins = new Map<string, RegisteredPlugin>();
  private sectionTypes = new Map<string, SectionTypeDefinition>();
  private actionTypes = new Map<string, ActionTypeDefinition>();
  private themes = new Map<string, ThemeExtension>();
  private middleware: MiddlewareFunction[] = [];
  private initialized = false;

  /**
   * Register a plugin
   */
  register(plugin: PluginDefinition): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already registered. Skipping.`);
      return;
    }
    
    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin "${plugin.name}" requires "${dep}" which is not registered`
          );
        }
      }
    }
    
    // Register the plugin
    const registeredPlugin: RegisteredPlugin = {
      ...plugin,
      registeredAt: Date.now(),
      status: 'registered'
    };
    
    this.plugins.set(plugin.name, registeredPlugin);
    
    // Register section types
    if (plugin.sectionTypes) {
      for (const sectionType of plugin.sectionTypes) {
        if (this.sectionTypes.has(sectionType.type)) {
          console.warn(
            `Section type "${sectionType.type}" from plugin "${plugin.name}" ` +
            `conflicts with existing type. Skipping.`
          );
          continue;
        }
        this.sectionTypes.set(sectionType.type, sectionType);
      }
    }
    
    // Register action types
    if (plugin.actionTypes) {
      for (const actionType of plugin.actionTypes) {
        if (this.actionTypes.has(actionType.type)) {
          console.warn(
            `Action type "${actionType.type}" from plugin "${plugin.name}" ` +
            `conflicts with existing type. Skipping.`
          );
          continue;
        }
        this.actionTypes.set(actionType.type, actionType);
      }
    }
    
    // Register themes
    if (plugin.themes) {
      for (const theme of plugin.themes) {
        if (this.themes.has(theme.name)) {
          console.warn(
            `Theme "${theme.name}" from plugin "${plugin.name}" ` +
            `conflicts with existing theme. Skipping.`
          );
          continue;
        }
        this.themes.set(theme.name, theme);
      }
    }
    
    // Register middleware
    if (plugin.middleware) {
      this.middleware.push(...plugin.middleware);
    }
    
    // Call onRegister hook
    if (plugin.lifecycle?.onRegister) {
      try {
        plugin.lifecycle.onRegister();
      } catch (error) {
        registeredPlugin.status = 'error';
        registeredPlugin.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    
    // Check if other plugins depend on this one
    for (const [otherName, otherPlugin] of this.plugins) {
      if (otherPlugin.dependencies?.includes(name)) {
        throw new Error(
          `Cannot unregister "${name}": plugin "${otherName}" depends on it`
        );
      }
    }
    
    // Call onDestroy hook
    if (plugin.lifecycle?.onDestroy) {
      try {
        plugin.lifecycle.onDestroy();
      } catch (error) {
        console.error(`Error in onDestroy hook for plugin "${name}":`, error);
      }
    }
    
    // Remove section types
    if (plugin.sectionTypes) {
      for (const sectionType of plugin.sectionTypes) {
        this.sectionTypes.delete(sectionType.type);
      }
    }
    
    // Remove action types
    if (plugin.actionTypes) {
      for (const actionType of plugin.actionTypes) {
        this.actionTypes.delete(actionType.type);
      }
    }
    
    // Remove themes
    if (plugin.themes) {
      for (const theme of plugin.themes) {
        this.themes.delete(theme.name);
      }
    }
    
    // Note: Middleware removal is not supported as order matters
    
    this.plugins.delete(name);
    return true;
  }

  /**
   * Initialize all registered plugins
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    for (const [name, plugin] of this.plugins) {
      if (plugin.status === 'error') continue;
      
      try {
        if (plugin.lifecycle?.onInit) {
          await plugin.lifecycle.onInit();
        }
        plugin.status = 'initialized';
      } catch (error) {
        plugin.status = 'error';
        plugin.error = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to initialize plugin "${name}":`, error);
      }
    }
    
    this.initialized = true;
  }

  /**
   * Get a registered plugin
   */
  getPlugin(name: string): RegisteredPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): RegisteredPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a section type definition
   */
  getSectionType(type: string): SectionTypeDefinition | undefined {
    return this.sectionTypes.get(type);
  }

  /**
   * Get all registered section types
   */
  getAllSectionTypes(): SectionTypeDefinition[] {
    return Array.from(this.sectionTypes.values());
  }

  /**
   * Get an action type definition
   */
  getActionType(type: string): ActionTypeDefinition | undefined {
    return this.actionTypes.get(type);
  }

  /**
   * Get all registered action types
   */
  getAllActionTypes(): ActionTypeDefinition[] {
    return Array.from(this.actionTypes.values());
  }

  /**
   * Get a theme extension
   */
  getTheme(name: string): ThemeExtension | undefined {
    return this.themes.get(name);
  }

  /**
   * Get all registered themes
   */
  getAllThemes(): ThemeExtension[] {
    return Array.from(this.themes.values());
  }

  /**
   * Execute middleware chain
   */
  async executeMiddleware(context: MiddlewareContext): Promise<void> {
    const execute = async (index: number): Promise<void> => {
      const middlewareFn = this.middleware[index];
      if (!middlewareFn) return;
      
      await middlewareFn(context, async () => {
        await execute(index + 1);
      });
    };
    
    await execute(0);
  }

  /**
   * Check if a section type is registered
   */
  hasSectionType(type: string): boolean {
    return this.sectionTypes.has(type);
  }

  /**
   * Check if an action type is registered
   */
  hasActionType(type: string): boolean {
    return this.actionTypes.has(type);
  }
}

// ============================================================================
// GLOBAL REGISTRY INSTANCE
// ============================================================================

let globalRegistry: PluginRegistry | null = null;

/**
 * Get the global plugin registry
 */
export function getPluginRegistry(): PluginRegistry {
  if (!globalRegistry) {
    globalRegistry = new PluginRegistry();
  }
  return globalRegistry;
}

// ============================================================================
// ANGULAR PROVIDERS
// ============================================================================

/**
 * Provide plugins to Angular application
 */
export function provideOsiCardsPlugins(
  plugins: PluginDefinition[]
): EnvironmentProviders {
  const registry = getPluginRegistry();
  
  // Register all plugins
  for (const plugin of plugins) {
    registry.register(plugin);
  }
  
  // Collect all plugin providers
  const pluginProviders = plugins
    .filter(p => p.providers)
    .flatMap(p => p.providers ?? []);
  
  return makeEnvironmentProviders([
    { provide: OSI_PLUGIN_REGISTRY, useValue: registry },
    { provide: OSI_PLUGINS, useValue: plugins },
    ...pluginProviders
  ]);
}

// ============================================================================
// PLUGIN UTILITIES
// ============================================================================

/**
 * Create a section type definition helper
 */
export function defineSectionType(
  type: string,
  component: Type<unknown>,
  options: Omit<SectionTypeDefinition, 'type' | 'component'> = {}
): SectionTypeDefinition {
  return {
    type,
    component,
    ...options
  };
}

/**
 * Create an action type definition helper
 */
export function defineActionType(
  type: string,
  handler: ActionTypeDefinition['handler'],
  options: Omit<ActionTypeDefinition, 'type' | 'handler'> = {}
): ActionTypeDefinition {
  return {
    type,
    handler,
    ...options
  };
}

/**
 * Create a theme extension helper
 */
export function defineTheme(
  name: string,
  variables: Record<string, string>,
  colorScheme?: 'light' | 'dark'
): ThemeExtension {
  return {
    name,
    variables,
    colorScheme
  };
}

/**
 * Create middleware helper
 */
export function defineMiddleware(
  type: MiddlewareContext['type'],
  handler: (data: unknown, next: () => void) => void
): MiddlewareFunction {
  return (context, next) => {
    if (context.type === type) {
      handler(context.data, next);
    } else {
      next();
    }
  };
}

