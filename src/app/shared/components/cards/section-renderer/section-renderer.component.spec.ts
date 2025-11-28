import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Component, Type, ViewContainerRef, ChangeDetectorRef } from '@angular/core';
import { SectionRendererComponent, SectionRenderEvent } from './section-renderer.component';
import { SectionLoaderService } from './section-loader.service';
import { SectionTypeResolverService } from './section-type-resolver.service';
import { AppConfigService } from '../../../../core/services/app-config.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { SectionBuilder, FieldBuilder, ItemBuilder } from '../../../../testing/test-builders';
import { CardSection, CardField, CardItem, CardAction } from '../../../../models';
import { SectionInteraction } from '../sections/base-section.component';
import { InfoSectionFieldInteraction } from '../sections/info-section.component';

// Test component for dynamic loading
@Component({
  selector: 'app-test-section',
  template: '<div>Test Section</div>',
  standalone: true
})
class TestSectionComponent {
  section!: CardSection;
  fieldInteraction?: any;
  itemInteraction?: any;
  infoFieldInteraction?: any;
}

// Fallback test component
@Component({
  selector: 'app-fallback-test',
  template: '<div>Fallback Section</div>',
  standalone: true
})
class FallbackTestComponent {
  section!: CardSection;
}

describe('SectionRendererComponent', () => {
  let component: SectionRendererComponent;
  let fixture: ComponentFixture<SectionRendererComponent>;
  let sectionLoaderService: jasmine.SpyObj<SectionLoaderService>;
  let typeResolverService: jasmine.SpyObj<SectionTypeResolverService>;
  let appConfigService: jasmine.SpyObj<AppConfigService>;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(async () => {
    // Create spy objects for services
    const sectionLoaderSpy = jasmine.createSpyObj('SectionLoaderService', ['getComponentType']);
    const typeResolverSpy = jasmine.createSpyObj('SectionTypeResolverService', ['resolve']);
    const appConfigSpy = jasmine.createSpyObj('AppConfigService', [], {
      LOGGING: { ENABLE_DEBUG: false }
    });
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['debug', 'warn', 'error']);

    await TestBed.configureTestingModule({
      imports: [SectionRendererComponent],
      providers: [
        { provide: SectionLoaderService, useValue: sectionLoaderSpy },
        { provide: SectionTypeResolverService, useValue: typeResolverSpy },
        { provide: AppConfigService, useValue: appConfigSpy },
        { provide: LoggingService, useValue: loggingSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SectionRendererComponent);
    component = fixture.componentInstance;
    
    // Get service instances
    sectionLoaderService = TestBed.inject(SectionLoaderService) as jasmine.SpyObj<SectionLoaderService>;
    typeResolverService = TestBed.inject(SectionTypeResolverService) as jasmine.SpyObj<SectionTypeResolverService>;
    appConfigService = TestBed.inject(AppConfigService) as jasmine.SpyObj<AppConfigService>;
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;

    // Setup default spy behaviors
    typeResolverService.resolve.and.returnValue('info');
    sectionLoaderService.getComponentType.and.returnValue(Promise.resolve(TestSectionComponent as Type<any>));
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null section', () => {
      expect(component.section).toBeNull();
    });

    it('should have sectionEvent output', () => {
      expect(component.sectionEvent).toBeDefined();
      expect(component.sectionEvent.emit).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid section', () => {
      const section = SectionBuilder.create()
        .withTitle('Test Section')
        .withType('info')
        .build();
      
      component.section = section;
      
      expect(component.section).toEqual(section);
    });

    it('should reject null section', () => {
      component.section = null;
      expect(component.section).toBeNull();
    });

    it('should reject invalid section (not an object)', () => {
      const invalidSection = 'not an object' as any;
      
      component.section = invalidSection;
      
      expect(component.section).toBeNull();
      expect(loggingService.warn).toHaveBeenCalled();
    });

    it('should reject section without title', () => {
      const invalidSection = { type: 'info' } as any;
      
      component.section = invalidSection;
      
      expect(component.section).toBeNull();
      expect(loggingService.warn).toHaveBeenCalled();
    });

    it('should reject section with non-string title', () => {
      const invalidSection = { title: 123, type: 'info' } as any;
      
      component.section = invalidSection;
      
      expect(component.section).toBeNull();
      expect(loggingService.warn).toHaveBeenCalled();
    });
  });

  describe('Section Type Resolution', () => {
    it('should resolve section type using resolver service', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('analytics')
        .build();
      
      typeResolverService.resolve.and.returnValue('analytics');
      component.section = section;
      
      expect(component.resolvedType).toBe('analytics');
      expect(typeResolverService.resolve).toHaveBeenCalledWith(section);
    });

    it('should return unknown for null section', () => {
      component.section = null;
      
      expect(component.resolvedType).toBe('unknown');
    });

    it('should return sectionTypeAttribute correctly', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      typeResolverService.resolve.and.returnValue('info');
      
      expect(component.sectionTypeAttribute).toBe('info');
    });

    it('should return unknown for sectionTypeAttribute when section is null', () => {
      component.section = null;
      
      expect(component.sectionTypeAttribute).toBe('unknown');
    });

    it('should return sectionIdAttribute correctly', () => {
      const section = SectionBuilder.create()
        .withId('section-123')
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      
      expect(component.sectionIdAttribute).toBe('section-123');
    });

    it('should return null for sectionIdAttribute when section has no id', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      
      expect(component.sectionIdAttribute).toBeNull();
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should initialize in ngOnInit', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      component.ngOnInit();
      
      expect(component).toBeTruthy();
    });

    it('should load component in ngAfterViewInit', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      expect(sectionLoaderService.getComponentType).toHaveBeenCalled();
    }));

    it('should handle section changes in ngOnChanges', fakeAsync(() => {
      const section1 = SectionBuilder.create()
        .withTitle('Section 1')
        .withType('info')
        .build();
      
      const section2 = SectionBuilder.create()
        .withTitle('Section 2')
        .withType('analytics')
        .build();
      
      component.section = section1;
      fixture.detectChanges();
      component.ngAfterViewInit();
      tick();
      flush();
      
      typeResolverService.resolve.and.returnValue('analytics');
      component.ngOnChanges({
        section: {
          currentValue: section2,
          previousValue: section1,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();
      flush();
      
      expect(sectionLoaderService.getComponentType).toHaveBeenCalled();
    }));

    it('should clear component on destroy', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      fixture.detectChanges();
      
      const clearSpy = spyOn(component['dynamicComponent'], 'clear');
      
      component.ngOnDestroy();
      
      expect(clearSpy).toHaveBeenCalled();
      expect(component['loadedComponent']).toBeNull();
    });

    it('should handle destroy when no component is loaded', () => {
      component.ngOnDestroy();
      
      expect(component['loadedComponent']).toBeNull();
    });
  });

  describe('Dynamic Component Loading', () => {
    it('should load component successfully', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      expect(sectionLoaderService.getComponentType).toHaveBeenCalledWith('info');
      expect(component['loadedComponent']).toBeTruthy();
    }));

    it('should set section on loaded component', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      const loadedComponent = component['loadedComponent'];
      expect(loadedComponent).toBeTruthy();
      if (loadedComponent) {
        expect(loadedComponent.instance.section).toEqual(section);
      }
    }));

    it('should not load component if view not initialized', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      component['viewInitialized'] = false;
      
      component['loadComponent']();
      
      expect(sectionLoaderService.getComponentType).not.toHaveBeenCalled();
    });

    it('should not load component if ViewContainerRef not available', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      component['viewInitialized'] = true;
      component['dynamicComponent'] = null as any;
      
      component['loadComponent']();
      
      expect(sectionLoaderService.getComponentType).not.toHaveBeenCalled();
    });

    it('should not load component if section is null', () => {
      component.section = null;
      component['viewInitialized'] = true;
      
      component['loadComponent']();
      
      expect(sectionLoaderService.getComponentType).not.toHaveBeenCalled();
    });

    it('should reload component when section type changes', fakeAsync(() => {
      const section1 = SectionBuilder.create()
        .withTitle('Section 1')
        .withType('info')
        .build();
      
      const section2 = SectionBuilder.create()
        .withTitle('Section 2')
        .withType('analytics')
        .build();
      
      component.section = section1;
      fixture.detectChanges();
      component.ngAfterViewInit();
      tick();
      flush();
      
      const initialCallCount = sectionLoaderService.getComponentType.calls.count();
      
      typeResolverService.resolve.and.returnValue('analytics');
      component.section = section2;
      component.ngOnChanges({
        section: {
          currentValue: section2,
          previousValue: section1,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();
      flush();
      
      expect(sectionLoaderService.getComponentType.calls.count()).toBeGreaterThan(initialCallCount);
    }));

    it('should update existing component when section type unchanged', fakeAsync(() => {
      const section1 = SectionBuilder.create()
        .withTitle('Section 1')
        .withType('info')
        .build();
      
      const section2 = SectionBuilder.create()
        .withTitle('Section 2')
        .withType('info')
        .build();
      
      component.section = section1;
      fixture.detectChanges();
      component.ngAfterViewInit();
      tick();
      flush();
      
      const initialCallCount = sectionLoaderService.getComponentType.calls.count();
      
      typeResolverService.resolve.and.returnValue('info');
      component.section = section2;
      component.ngOnChanges({
        section: {
          currentValue: section2,
          previousValue: section1,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();
      
      // Should not reload if type is the same
      expect(sectionLoaderService.getComponentType.calls.count()).toBe(initialCallCount);
    }));
  });

  describe('Error Handling', () => {
    it('should load fallback component on loading error', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      sectionLoaderService.getComponentType.and.returnValue(
        Promise.reject(new Error('Loading failed'))
      );
      
      // Mock fallback component loading
      sectionLoaderService.getComponentType.and.callFake((type: string) => {
        if (type === 'fallback') {
          return Promise.resolve(FallbackTestComponent as Type<any>);
        }
        return Promise.reject(new Error('Loading failed'));
      });
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      expect(sectionLoaderService.getComponentType).toHaveBeenCalledWith('fallback');
      expect(loggingService.error).toHaveBeenCalled();
    }));

    it('should handle fallback component loading failure', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      sectionLoaderService.getComponentType.and.returnValue(
        Promise.reject(new Error('Loading failed'))
      );
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      expect(loggingService.error).toHaveBeenCalled();
      expect(component['loadedComponent']).toBeNull();
    }));

    it('should handle null component type from loader', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      sectionLoaderService.getComponentType.and.returnValue(
        Promise.resolve(null as any)
      );
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      expect(loggingService.error).toHaveBeenCalled();
    }));

    it('should handle component creation failure', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      // Create a component that will fail to instantiate
      const FailingComponent = class {
        constructor() {
          throw new Error('Component creation failed');
        }
      } as any;
      
      sectionLoaderService.getComponentType.and.returnValue(
        Promise.resolve(FailingComponent)
      );
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      expect(loggingService.error).toHaveBeenCalled();
    }));
  });

  describe('Event Emission', () => {
    it('should emit field interaction event', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      const field = FieldBuilder.create()
        .withLabel('Test Field')
        .withValue('Test Value')
        .build();
      
      component.section = section;
      spyOn(component.sectionEvent, 'emit');
      
      component.emitFieldInteraction(field, { custom: 'metadata' });
      
      expect(component.sectionEvent.emit).toHaveBeenCalledWith({
        type: 'field',
        section,
        field,
        metadata: jasmine.objectContaining({
          sectionId: section.id,
          sectionTitle: section.title,
          custom: 'metadata'
        })
      });
    });

    it('should not emit field interaction when section is null', () => {
      component.section = null;
      spyOn(component.sectionEvent, 'emit');
      
      const field = FieldBuilder.create()
        .withLabel('Test Field')
        .withValue('Test Value')
        .build();
      
      component.emitFieldInteraction(field);
      
      expect(component.sectionEvent.emit).not.toHaveBeenCalled();
    });

    it('should emit item interaction event', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      const item = ItemBuilder.create()
        .withTitle('Test Item')
        .withDescription('Test Description')
        .build();
      
      component.section = section;
      spyOn(component.sectionEvent, 'emit');
      
      component.emitItemInteraction(item, { custom: 'metadata' });
      
      expect(component.sectionEvent.emit).toHaveBeenCalledWith({
        type: 'item',
        section,
        item,
        metadata: jasmine.objectContaining({
          sectionId: section.id,
          sectionTitle: section.title,
          custom: 'metadata'
        })
      });
    });

    it('should not emit item interaction when section is null', () => {
      component.section = null;
      spyOn(component.sectionEvent, 'emit');
      
      const item = ItemBuilder.create()
        .withTitle('Test Item')
        .build();
      
      component.emitItemInteraction(item);
      
      expect(component.sectionEvent.emit).not.toHaveBeenCalled();
    });

    it('should emit action interaction event', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      const action: CardAction = {
        label: 'Test Action',
        type: 'website',
        url: 'https://example.com'
      };
      
      component.section = section;
      spyOn(component.sectionEvent, 'emit');
      
      component.emitActionInteraction(action, { custom: 'metadata' });
      
      expect(component.sectionEvent.emit).toHaveBeenCalledWith({
        type: 'action',
        section,
        action,
        metadata: { custom: 'metadata' }
      });
    });

    it('should not emit action interaction when section is null', () => {
      component.section = null;
      spyOn(component.sectionEvent, 'emit');
      
      const action: CardAction = {
        label: 'Test Action',
        type: 'website'
      };
      
      component.emitActionInteraction(action);
      
      expect(component.sectionEvent.emit).not.toHaveBeenCalled();
    });

    it('should handle info field interaction', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      const field = FieldBuilder.create()
        .withLabel('Test Field')
        .withValue('Test Value')
        .build();
      
      const infoEvent: InfoSectionFieldInteraction = {
        field,
        sectionTitle: 'Test Section'
      };
      
      component.section = section;
      spyOn(component.sectionEvent, 'emit');
      
      component.onInfoFieldInteraction(infoEvent);
      
      expect(component.sectionEvent.emit).toHaveBeenCalledWith({
        type: 'field',
        section,
        field,
        metadata: { sectionTitle: 'Test Section' }
      });
    });

    it('should not handle info field interaction when section is null', () => {
      component.section = null;
      spyOn(component.sectionEvent, 'emit');
      
      const field = FieldBuilder.create()
        .withLabel('Test Field')
        .withValue('Test Value')
        .build();
      
      const infoEvent: InfoSectionFieldInteraction = {
        field,
        sectionTitle: 'Test Section'
      };
      
      component.onInfoFieldInteraction(infoEvent);
      
      expect(component.sectionEvent.emit).not.toHaveBeenCalled();
    });
  });

  describe('Component Event Subscriptions', () => {
    it('should subscribe to fieldInteraction events from loaded component', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      const field = FieldBuilder.create()
        .withLabel('Test Field')
        .withValue('Test Value')
        .build();
      
      // Create a test component with event emitters
      class TestComponentWithEvents {
        section!: CardSection;
        fieldInteraction = {
          subscribe: jasmine.createSpy('subscribe')
        };
        itemInteraction = {
          subscribe: jasmine.createSpy('subscribe')
        };
      }
      
      sectionLoaderService.getComponentType.and.returnValue(
        Promise.resolve(TestComponentWithEvents as Type<any>)
      );
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      // Verify subscription was set up
      const loadedComponent = component['loadedComponent'];
      if (loadedComponent && (loadedComponent.instance as any).fieldInteraction) {
        expect((loadedComponent.instance as any).fieldInteraction.subscribe).toHaveBeenCalled();
      }
    }));

    it('should subscribe to itemInteraction events from loaded component', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      // Create a test component with event emitters
      class TestComponentWithEvents {
        section!: CardSection;
        itemInteraction = {
          subscribe: jasmine.createSpy('subscribe')
        };
      }
      
      sectionLoaderService.getComponentType.and.returnValue(
        Promise.resolve(TestComponentWithEvents as Type<any>)
      );
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      // Verify subscription was set up
      const loadedComponent = component['loadedComponent'];
      if (loadedComponent && (loadedComponent.instance as any).itemInteraction) {
        expect((loadedComponent.instance as any).itemInteraction.subscribe).toHaveBeenCalled();
      }
    }));

    it('should subscribe to infoFieldInteraction events from loaded component', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      // Create a test component with event emitters
      class TestComponentWithEvents {
        section!: CardSection;
        infoFieldInteraction = {
          subscribe: jasmine.createSpy('subscribe')
        };
      }
      
      sectionLoaderService.getComponentType.and.returnValue(
        Promise.resolve(TestComponentWithEvents as Type<any>)
      );
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      // Verify subscription was set up
      const loadedComponent = component['loadedComponent'];
      if (loadedComponent && (loadedComponent.instance as any).infoFieldInteraction) {
        expect((loadedComponent.instance as any).infoFieldInteraction.subscribe).toHaveBeenCalled();
      }
    }));
  });

  describe('Edge Cases', () => {
    it('should handle section change before view initialization', () => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      component['viewInitialized'] = false;
      
      component.ngOnChanges({
        section: {
          currentValue: section,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      
      // Should not load component yet
      expect(sectionLoaderService.getComponentType).not.toHaveBeenCalled();
    });

    it('should clear component when section becomes null', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      fixture.detectChanges();
      component.ngAfterViewInit();
      tick();
      flush();
      
      expect(component['loadedComponent']).toBeTruthy();
      
      component.section = null;
      component.ngOnChanges({
        section: {
          currentValue: null,
          previousValue: section,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();
      
      expect(component['loadedComponent']).toBeNull();
    }));

    it('should handle component instance being null', fakeAsync(() => {
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      fixture.detectChanges();
      component.ngAfterViewInit();
      tick();
      flush();
      
      // Simulate component instance becoming null
      if (component['loadedComponent']) {
        (component['loadedComponent'] as any).instance = null;
      }
      
      const section2 = SectionBuilder.create()
        .withTitle('Test 2')
        .withType('info')
        .build();
      
      component.section = section2;
      component.ngOnChanges({
        section: {
          currentValue: section2,
          previousValue: section,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();
      flush();
      
      // Should reload component
      expect(sectionLoaderService.getComponentType).toHaveBeenCalled();
    }));

    it('should handle debug mode logging', fakeAsync(() => {
      appConfigService.LOGGING = { ENABLE_DEBUG: true } as any;
      
      const section = SectionBuilder.create()
        .withTitle('Test')
        .withType('info')
        .build();
      
      component.section = section;
      fixture.detectChanges();
      
      component.ngAfterViewInit();
      tick();
      flush();
      
      expect(loggingService.debug).toHaveBeenCalled();
    }));

    it('should handle multiple rapid section changes', fakeAsync(() => {
      const sections = [
        SectionBuilder.create().withTitle('Section 1').withType('info').build(),
        SectionBuilder.create().withTitle('Section 2').withType('analytics').build(),
        SectionBuilder.create().withTitle('Section 3').withType('list').build()
      ];
      
      typeResolverService.resolve.and.callFake((s: CardSection) => {
        if (s.title === 'Section 1') return 'info';
        if (s.title === 'Section 2') return 'analytics';
        return 'list';
      });
      
      component.section = sections[0];
      fixture.detectChanges();
      component.ngAfterViewInit();
      tick();
      
      component.section = sections[1];
      component.ngOnChanges({
        section: {
          currentValue: sections[1],
          previousValue: sections[0],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();
      
      component.section = sections[2];
      component.ngOnChanges({
        section: {
          currentValue: sections[2],
          previousValue: sections[1],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();
      flush();
      
      expect(sectionLoaderService.getComponentType).toHaveBeenCalled();
    }));
  });
});
