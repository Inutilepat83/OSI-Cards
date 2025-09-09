import { Injectable, Type, Injector, ComponentRef, ViewContainerRef } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { EventBusService } from './event-bus.service';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: string[];
  
  // Lifecycle hooks
  onLoad?: () => Promise<void> | void;
  onUnload?: () => Promise<void> | void;
  onActivate?: () => Promise<void> | void;
  onDeactivate?: () => Promise<void> | void;
  
  // Plugin capabilities
  components?: PluginComponent[];
  services?: PluginService[];
  cardTypes?: CardTypeDefinition[];
  fieldTypes?: FieldTypeDefinition[];
  themes?: ThemeDefinition[];
  
  // Configuration
  config?: any;
  permissions?: string[];
  
  // Entry point
  main?: () => Promise<void> | void;
}

export interface PluginComponent {
  name: string;
  component: Type<any>;
  selector: string;
  inputs?: string[];
  outputs?: string[];
  slot?: string; // Where the component can be inserted
}

export interface PluginService {
  name: string;
  service: Type<any>;
  providedIn?: 'root' | 'platform' | 'any';
}

export interface CardTypeDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  template: any;
  defaultConfig: any;
  validator?: (config: any) => boolean;
  renderer?: Type<any>;
}

export interface FieldTypeDefinition {
  type: string;
  name: string;
  description: string;
  component: Type<any>;
  validator?: (value: any) => boolean;
  defaultValue?: any;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  colors: Record<string, string>;
  typography: any;
  spacing: any;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  
  // Requirements
  minVersion?: string; // Minimum OSI Cards version
  maxVersion?: string; // Maximum OSI Cards version
  dependencies?: Record<string, string>;
  
  // Files
  main: string; // Entry point file
  assets?: string[];
  styles?: string[];
  
  // Permissions
  permissions?: string[];
  
  // Configuration schema
  configSchema?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PluginArchitectureService {
  private plugins = new Map<string, Plugin>();
  private loadedPlugins = new Set<string>();
  private activePlugins = new Set<string>();
  private pluginComponents = new Map<string, ComponentRef<any>>();
  
  // Plugin registry
  private availablePlugins$ = new BehaviorSubject<PluginManifest[]>([]);
  private pluginStatus$ = new BehaviorSubject<Record<string, 'available' | 'loading' | 'loaded' | 'active' | 'error'>>({});
  
  // Events
  private pluginEvents$ = new Subject<{ type: string; pluginId: string; data?: any }>();

  constructor(
    private injector: Injector,
    private eventBus: EventBusService
  ) {
    this.initializeCore();
  }

  // Plugin Management
  async loadPlugin(manifest: PluginManifest): Promise<void> {
    try {
      this.updatePluginStatus(manifest.id, 'loading');
      
      // Validate dependencies
      await this.validateDependencies(manifest);
      
      // Load plugin module
      const pluginModule = await this.loadPluginModule(manifest);
      const plugin = await this.createPluginInstance(pluginModule, manifest);
      
      // Register plugin
      this.plugins.set(manifest.id, plugin);
      this.loadedPlugins.add(manifest.id);
      
      // Execute onLoad lifecycle
      if (plugin.onLoad) {
        await plugin.onLoad();
      }
      
      this.updatePluginStatus(manifest.id, 'loaded');
      this.emitPluginEvent('loaded', manifest.id);
      
      console.log(`Plugin ${manifest.name} loaded successfully`);
    } catch (error) {
      this.updatePluginStatus(manifest.id, 'error');
      console.error(`Failed to load plugin ${manifest.name}:`, error);
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // Deactivate if active
      if (this.activePlugins.has(pluginId)) {
        await this.deactivatePlugin(pluginId);
      }
      
      // Execute onUnload lifecycle
      if (plugin.onUnload) {
        await plugin.onUnload();
      }
      
      // Clean up components
      this.cleanupPluginComponents(pluginId);
      
      // Remove from registry
      this.plugins.delete(pluginId);
      this.loadedPlugins.delete(pluginId);
      
      this.updatePluginStatus(pluginId, 'available');
      this.emitPluginEvent('unloaded', pluginId);
      
      console.log(`Plugin ${plugin.name} unloaded successfully`);
    } catch (error) {
      console.error(`Failed to unload plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not loaded`);
    }

    if (this.activePlugins.has(pluginId)) {
      return; // Already active
    }

    try {
      // Execute onActivate lifecycle
      if (plugin.onActivate) {
        await plugin.onActivate();
      }
      
      // Register components
      this.registerPluginComponents(plugin);
      
      // Register services
      this.registerPluginServices(plugin);
      
      // Register card types
      this.registerCardTypes(plugin);
      
      // Register field types
      this.registerFieldTypes(plugin);
      
      this.activePlugins.add(pluginId);
      this.updatePluginStatus(pluginId, 'active');
      this.emitPluginEvent('activated', pluginId);
      
      console.log(`Plugin ${plugin.name} activated successfully`);
    } catch (error) {
      console.error(`Failed to activate plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!this.activePlugins.has(pluginId)) {
      return; // Not active
    }

    try {
      // Execute onDeactivate lifecycle
      if (plugin.onDeactivate) {
        await plugin.onDeactivate();
      }
      
      // Unregister components
      this.unregisterPluginComponents(plugin);
      
      // Clean up
      this.cleanupPluginComponents(pluginId);
      
      this.activePlugins.delete(pluginId);
      this.updatePluginStatus(pluginId, 'loaded');
      this.emitPluginEvent('deactivated', pluginId);
      
      console.log(`Plugin ${plugin.name} deactivated successfully`);
    } catch (error) {
      console.error(`Failed to deactivate plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  // Plugin Discovery
  async discoverPlugins(): Promise<PluginManifest[]> {
    // In a real implementation, this would scan for plugin manifests
    // For now, return a predefined list
    const manifests: PluginManifest[] = [
      {
        id: 'enhanced-analytics',
        name: 'Enhanced Analytics',
        version: '1.0.0',
        description: 'Advanced analytics and reporting for cards',
        author: 'OSI Cards Team',
        main: './plugins/enhanced-analytics/index.js',
        permissions: ['analytics.read', 'analytics.write']
      },
      {
        id: 'custom-themes',
        name: 'Custom Themes',
        version: '1.0.0',
        description: 'Additional themes and customization options',
        author: 'OSI Cards Team',
        main: './plugins/custom-themes/index.js',
        permissions: ['themes.read', 'themes.write']
      }
    ];
    
    this.availablePlugins$.next(manifests);
    return manifests;
  }

  // Component Integration
  renderPluginComponent(componentName: string, container: ViewContainerRef, inputs?: any): ComponentRef<any> | null {
    const component = this.findPluginComponent(componentName);
    if (!component) {
      console.warn(`Plugin component ${componentName} not found`);
      return null;
    }

    const componentRef = container.createComponent(component.component, {
      injector: this.injector
    });

    // Set inputs
    if (inputs && component.inputs) {
      component.inputs.forEach(inputName => {
        if (inputs[inputName] !== undefined) {
          componentRef.setInput(inputName, inputs[inputName]);
        }
      });
    }

    // Store reference for cleanup
    this.pluginComponents.set(`${componentName}-${Date.now()}`, componentRef);

    return componentRef;
  }

  // Card Type Extensions
  getAvailableCardTypes(): CardTypeDefinition[] {
    const cardTypes: CardTypeDefinition[] = [];
    
    for (const plugin of this.plugins.values()) {
      if (plugin.cardTypes) {
        cardTypes.push(...plugin.cardTypes);
      }
    }
    
    return cardTypes;
  }

  getCardTypeDefinition(type: string): CardTypeDefinition | null {
    for (const plugin of this.plugins.values()) {
      if (plugin.cardTypes) {
        const cardType = plugin.cardTypes.find(ct => ct.type === type);
        if (cardType) return cardType;
      }
    }
    return null;
  }

  // Field Type Extensions
  getAvailableFieldTypes(): FieldTypeDefinition[] {
    const fieldTypes: FieldTypeDefinition[] = [];
    
    for (const plugin of this.plugins.values()) {
      if (plugin.fieldTypes) {
        fieldTypes.push(...plugin.fieldTypes);
      }
    }
    
    return fieldTypes;
  }

  // Theme Extensions
  getAvailableThemes(): ThemeDefinition[] {
    const themes: ThemeDefinition[] = [];
    
    for (const plugin of this.plugins.values()) {
      if (plugin.themes) {
        themes.push(...plugin.themes);
      }
    }
    
    return themes;
  }

  // Plugin State
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(plugin => 
      this.activePlugins.has(plugin.id)
    );
  }

  getPluginStatus(): Observable<Record<string, string>> {
    return this.pluginStatus$.asObservable();
  }

  getPluginEvents(): Observable<any> {
    return this.pluginEvents$.asObservable();
  }

  // Private methods
  private async initializeCore(): Promise<void> {
    // Initialize core plugin system
    await this.discoverPlugins();
    
    // Auto-load core plugins if configured
    // This would be configurable in a real implementation
  }

  private async validateDependencies(manifest: PluginManifest): Promise<void> {
    if (!manifest.dependencies) return;
    
    for (const [depId, version] of Object.entries(manifest.dependencies)) {
      if (!this.loadedPlugins.has(depId)) {
        throw new Error(`Missing dependency: ${depId}@${version}`);
      }
    }
  }

  private async loadPluginModule(manifest: PluginManifest): Promise<any> {
    // In a real implementation, this would dynamically import the plugin module
    // For now, return a mock module
    return {
      default: class MockPlugin implements Plugin {
        id = manifest.id;
        name = manifest.name;
        version = manifest.version;
        description = manifest.description;
        author = manifest.author;
        
        async onLoad() {
          console.log(`${this.name} plugin loaded`);
        }
        
        async onActivate() {
          console.log(`${this.name} plugin activated`);
        }
      }
    };
  }

  private async createPluginInstance(pluginModule: any, manifest: PluginManifest): Promise<Plugin> {
    const PluginClass = pluginModule.default || pluginModule;
    return new PluginClass();
  }

  private registerPluginComponents(plugin: Plugin): void {
    if (!plugin.components) return;
    
    // Register components for later use
    plugin.components.forEach(component => {
      console.log(`Registered component: ${component.name}`);
    });
  }

  private registerPluginServices(plugin: Plugin): void {
    if (!plugin.services) return;
    
    // Register services with the injector
    plugin.services.forEach(service => {
      console.log(`Registered service: ${service.name}`);
    });
  }

  private registerCardTypes(plugin: Plugin): void {
    if (!plugin.cardTypes) return;
    
    plugin.cardTypes.forEach(cardType => {
      console.log(`Registered card type: ${cardType.type}`);
    });
  }

  private registerFieldTypes(plugin: Plugin): void {
    if (!plugin.fieldTypes) return;
    
    plugin.fieldTypes.forEach(fieldType => {
      console.log(`Registered field type: ${fieldType.type}`);
    });
  }

  private unregisterPluginComponents(plugin: Plugin): void {
    if (!plugin.components) return;
    
    plugin.components.forEach(component => {
      console.log(`Unregistered component: ${component.name}`);
    });
  }

  private cleanupPluginComponents(pluginId: string): void {
    for (const [key, componentRef] of this.pluginComponents.entries()) {
      if (key.startsWith(pluginId)) {
        componentRef.destroy();
        this.pluginComponents.delete(key);
      }
    }
  }

  private findPluginComponent(componentName: string): PluginComponent | null {
    for (const plugin of this.plugins.values()) {
      if (plugin.components) {
        const component = plugin.components.find(c => c.name === componentName);
        if (component) return component;
      }
    }
    return null;
  }

  private updatePluginStatus(pluginId: string, status: string): void {
    const currentStatus = this.pluginStatus$.value;
    this.pluginStatus$.next({
      ...currentStatus,
      [pluginId]: status as any
    });
  }

  private emitPluginEvent(type: string, pluginId: string, data?: any): void {
    this.pluginEvents$.next({ type, pluginId, data });
    this.eventBus.emit({
      type: `plugin.${type}`,
      payload: { pluginId, data },
      source: 'plugin-system'
    });
  }
}
