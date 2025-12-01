import { TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { SectionPluginRegistry } from './section-plugin-registry.service';
import { BaseSectionComponent } from '../components/sections/base-section.component';
import { SectionPlugin } from '../interfaces/section-plugin.interface';
import { CardSection } from '../models';

// Mock plugin component
@Component({
  selector: 'app-mock-section',
  template: '<div>Mock Section</div>',
  standalone: true
})
class MockSectionComponent extends BaseSectionComponent implements SectionPlugin {
  @Input() override section!: CardSection;

  getPluginType(): string {
    return 'mock-section';
  }

  canHandle(section: CardSection): boolean {
    return section.type === 'mock-section';
  }
}

// Another mock for testing multiple registrations
@Component({
  selector: 'app-another-mock-section',
  template: '<div>Another Mock Section</div>',
  standalone: true
})
class AnotherMockSectionComponent extends BaseSectionComponent implements SectionPlugin {
  @Input() override section!: CardSection;

  getPluginType(): string {
    return 'another-mock';
  }

  canHandle(section: CardSection): boolean {
    return section.type === 'another-mock';
  }
}

describe('SectionPluginRegistry', () => {
  let registry: SectionPluginRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SectionPluginRegistry]
    });
    registry = TestBed.inject(SectionPluginRegistry);
  });

  afterEach(() => {
    registry.clear();
  });

  it('should be created', () => {
    expect(registry).toBeTruthy();
  });

  // ============================================================================
  // register Tests
  // ============================================================================
  describe('register', () => {
    it('should register a plugin', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent
      });

      expect(registry.hasPlugin('mock-section')).toBe(true);
    });

    it('should register plugin with description', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        description: 'A test mock section',
        component: MockSectionComponent
      });

      const metadata = registry.getPluginMetadata('mock-section');
      expect(metadata?.description).toBe('A test mock section');
    });

    it('should register plugin with config options', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent,
        config: {
          priority: 10,
          override: false
        }
      });

      const metadata = registry.getPluginMetadata('mock-section');
      expect(metadata?.priority).toBe(10);
    });

    it('should register plugin with metadata', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent,
        metadata: {
          version: '1.0.0',
          author: 'Test Author'
        }
      });

      const metadata = registry.getPluginMetadata('mock-section');
      expect(metadata?.version).toBe('1.0.0');
      expect(metadata?.author).toBe('Test Author');
    });

    it('should throw error when registering duplicate type without override', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent
      });

      expect(() => {
        registry.register({
          type: 'mock-section',
          name: 'Duplicate Mock',
          component: MockSectionComponent
        });
      }).toThrowError(/already registered/);
    });

    it('should allow override when config.override is true', () => {
      registry.register({
        type: 'mock-section',
        name: 'Original',
        component: MockSectionComponent
      });

      registry.register({
        type: 'mock-section',
        name: 'Override',
        component: AnotherMockSectionComponent,
        config: { override: true }
      });

      const metadata = registry.getPluginMetadata('mock-section');
      expect(metadata?.name).toBe('Override');
    });
  });

  // ============================================================================
  // unregister Tests
  // ============================================================================
  describe('unregister', () => {
    it('should unregister a plugin', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent
      });

      const result = registry.unregister('mock-section');

      expect(result).toBe(true);
      expect(registry.hasPlugin('mock-section')).toBe(false);
    });

    it('should return false when unregistering non-existent plugin', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // getComponent Tests
  // ============================================================================
  describe('getComponent', () => {
    it('should return component for registered type', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent
      });

      const component = registry.getComponent('mock-section');
      expect(component).toBe(MockSectionComponent);
    });

    it('should return null for unregistered type', () => {
      const component = registry.getComponent('non-existent');
      expect(component).toBeNull();
    });
  });

  // ============================================================================
  // getComponentForSection Tests
  // ============================================================================
  describe('getComponentForSection', () => {
    it('should return component for section with registered type', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent
      });

      const section: CardSection = {
        id: 'test',
        title: 'Test',
        type: 'mock-section'
      };

      const component = registry.getComponentForSection(section);
      expect(component).toBe(MockSectionComponent);
    });

    it('should return null for section with unregistered type', () => {
      const section: CardSection = {
        id: 'test',
        title: 'Test',
        type: 'info'
      };

      const component = registry.getComponentForSection(section);
      expect(component).toBeNull();
    });

    it('should return null for section without type', () => {
      const section: CardSection = {
        id: 'test',
        title: 'Test',
        type: '' as never
      };

      const component = registry.getComponentForSection(section);
      expect(component).toBeNull();
    });

    it('should handle case-insensitive type lookup', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent
      });

      const section: CardSection = {
        id: 'test',
        title: 'Test',
        type: 'MOCK-SECTION' as never
      };

      const component = registry.getComponentForSection(section);
      expect(component).toBe(MockSectionComponent);
    });
  });

  // ============================================================================
  // hasPlugin Tests
  // ============================================================================
  describe('hasPlugin', () => {
    it('should return true for registered plugin', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent
      });

      expect(registry.hasPlugin('mock-section')).toBe(true);
    });

    it('should return false for unregistered plugin', () => {
      expect(registry.hasPlugin('non-existent')).toBe(false);
    });
  });

  // ============================================================================
  // getPlugins Tests
  // ============================================================================
  describe('getPlugins', () => {
    it('should return empty array when no plugins registered', () => {
      const plugins = registry.getPlugins();
      expect(plugins).toEqual([]);
    });

    it('should return all registered plugins', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent
      });

      registry.register({
        type: 'another-mock',
        name: 'Another Mock',
        component: AnotherMockSectionComponent
      });

      const plugins = registry.getPlugins();
      expect(plugins.length).toBe(2);
    });

    it('should sort plugins by priority (highest first)', () => {
      registry.register({
        type: 'low-priority',
        name: 'Low',
        component: MockSectionComponent,
        config: { priority: 5 }
      });

      registry.register({
        type: 'high-priority',
        name: 'High',
        component: AnotherMockSectionComponent,
        config: { priority: 20 }
      });

      const plugins = registry.getPlugins();
      expect(plugins[0].type).toBe('high-priority');
      expect(plugins[1].type).toBe('low-priority');
    });
  });

  // ============================================================================
  // getPluginMetadata Tests
  // ============================================================================
  describe('getPluginMetadata', () => {
    it('should return metadata for registered plugin', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        description: 'Test description',
        component: MockSectionComponent,
        config: { priority: 15 },
        metadata: { version: '2.0.0' }
      });

      const metadata = registry.getPluginMetadata('mock-section');

      expect(metadata).toBeTruthy();
      expect(metadata?.type).toBe('mock-section');
      expect(metadata?.name).toBe('Mock Section');
      expect(metadata?.description).toBe('Test description');
      expect(metadata?.priority).toBe(15);
      expect(metadata?.version).toBe('2.0.0');
    });

    it('should return null for unregistered plugin', () => {
      const metadata = registry.getPluginMetadata('non-existent');
      expect(metadata).toBeNull();
    });
  });

  // ============================================================================
  // clear Tests
  // ============================================================================
  describe('clear', () => {
    it('should remove all plugins', () => {
      registry.register({
        type: 'mock-section',
        name: 'Mock Section',
        component: MockSectionComponent
      });

      registry.register({
        type: 'another-mock',
        name: 'Another Mock',
        component: AnotherMockSectionComponent
      });

      registry.clear();

      expect(registry.getPlugins()).toEqual([]);
      expect(registry.hasPlugin('mock-section')).toBe(false);
      expect(registry.hasPlugin('another-mock')).toBe(false);
    });
  });

  // ============================================================================
  // registerAll Tests
  // ============================================================================
  describe('registerAll', () => {
    it('should register multiple plugins at once', () => {
      registry.registerAll([
        {
          type: 'mock-section',
          name: 'Mock Section',
          component: MockSectionComponent
        },
        {
          type: 'another-mock',
          name: 'Another Mock',
          component: AnotherMockSectionComponent
        }
      ]);

      expect(registry.hasPlugin('mock-section')).toBe(true);
      expect(registry.hasPlugin('another-mock')).toBe(true);
    });

    it('should continue registering after error', () => {
      // Register first to cause conflict
      registry.register({
        type: 'mock-section',
        name: 'Existing',
        component: MockSectionComponent
      });

      const consoleSpy = spyOn(console, 'error');

      registry.registerAll([
        {
          type: 'mock-section', // Will fail (duplicate)
          name: 'Duplicate',
          component: MockSectionComponent
        },
        {
          type: 'another-mock', // Should succeed
          name: 'Another',
          component: AnotherMockSectionComponent
        }
      ]);

      expect(consoleSpy).toHaveBeenCalled();
      expect(registry.hasPlugin('another-mock')).toBe(true);
    });
  });
});




