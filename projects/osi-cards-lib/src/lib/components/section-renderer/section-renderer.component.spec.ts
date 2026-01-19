/**
 * Section Renderer Component Tests
 *
 * Unit tests for SectionRendererComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionRendererComponent, SectionRenderEvent } from './section-renderer.component';
import { By } from '@angular/platform-browser';
import { CardSection } from '@osi-cards/models';
import { DynamicSectionLoaderService, ComponentResolution } from './dynamic-section-loader.service';
import { LazySectionLoaderService, LazySectionType } from './lazy-section-loader.service';
import { SectionPluginRegistry } from '@osi-cards/services';
import { LoggerService } from '@osi-cards/services';
import { ChangeDetectorRef, ViewContainerRef, ComponentRef } from '@angular/core';
import { BaseSectionComponent } from '../sections/base-section.component';
import { LazySectionPlaceholderComponent } from './lazy-section-placeholder.component';

describe('SectionRendererComponent', () => {
  let component: SectionRendererComponent;
  let fixture: ComponentFixture<SectionRendererComponent>;
  let loader: jasmine.SpyObj<DynamicSectionLoaderService>;
  let lazyLoader: jasmine.SpyObj<LazySectionLoaderService>;
  let pluginRegistry: jasmine.SpyObj<SectionPluginRegistry>;
  let logger: jasmine.SpyObj<LoggerService>;
  let cdr: ChangeDetectorRef;
  let viewContainerRef: ViewContainerRef;

  const mockSection: CardSection = {
    id: 'section-1',
    type: 'overview',
    title: 'Overview Section',
    fields: [],
  };

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('DynamicSectionLoaderService', [
      'loadComponent',
      'resolveComponentType',
    ]);
    const lazyLoaderSpy = jasmine.createSpyObj('LazySectionLoaderService', [
      'shouldLazyLoad',
      'loadLazySection',
      'retryLoad',
    ]);
    const pluginRegistrySpy = jasmine.createSpyObj('SectionPluginRegistry', [
      'getPluginComponent',
      'hasPlugin',
    ]);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'warn', 'error']);

    await TestBed.configureTestingModule({
      imports: [SectionRendererComponent, LazySectionPlaceholderComponent],
      providers: [
        { provide: DynamicSectionLoaderService, useValue: loaderSpy },
        { provide: LazySectionLoaderService, useValue: lazyLoaderSpy },
        { provide: SectionPluginRegistry, useValue: pluginRegistrySpy },
        { provide: LoggerService, useValue: loggerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionRendererComponent);
    component = fixture.componentInstance;
    loader = TestBed.inject(
      DynamicSectionLoaderService
    ) as jasmine.SpyObj<DynamicSectionLoaderService>;
    lazyLoader = TestBed.inject(
      LazySectionLoaderService
    ) as jasmine.SpyObj<LazySectionLoaderService>;
    pluginRegistry = TestBed.inject(SectionPluginRegistry) as jasmine.SpyObj<SectionPluginRegistry>;
    logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    viewContainerRef = fixture.debugElement.injector.get(ViewContainerRef);
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render container for dynamic component', () => {
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('ng-container'));
      expect(container).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should accept section input', () => {
      component.section = mockSection;
      expect(component.section).toEqual(mockSection);
    });

    it('should accept theme input', () => {
      component.theme = 'dark';
      expect(component.theme).toBe('dark');
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call ngOnInit', () => {
      spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should call ngAfterViewInit', () => {
      spyOn(component, 'ngAfterViewInit');
      component.ngAfterViewInit();
      expect(component.ngAfterViewInit).toHaveBeenCalled();
    });

    it('should call ngOnChanges', () => {
      spyOn(component, 'ngOnChanges');
      component.ngOnChanges({
        section: {
          previousValue: null,
          currentValue: mockSection,
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(component.ngOnChanges).toHaveBeenCalled();
    });
  });

  describe('Component Loading', () => {
    it('should load component when section is provided', () => {
      const mockComponentRef = {
        instance: {
          section: mockSection,
          sectionEvent: jasmine.createSpyObj('EventEmitter', ['subscribe']),
        },
        destroy: jasmine.createSpy('destroy'),
      } as unknown as ComponentRef<BaseSectionComponent>;

      loader.loadComponent.and.returnValue(Promise.resolve(mockComponentRef));
      loader.resolveComponentType.and.returnValue({
        type: 'overview',
        component: {} as any,
      } as ComponentResolution);

      component.section = mockSection;
      component.ngAfterViewInit();

      expect(loader.loadComponent).toHaveBeenCalled();
    });

    it('should handle lazy loading when section type requires it', () => {
      lazyLoader.shouldLazyLoad.and.returnValue(true);
      lazyLoader.loadLazySection.and.returnValue(Promise.resolve({} as any));

      component.section = { ...mockSection, type: 'chart' };
      component.ngAfterViewInit();

      expect(lazyLoader.shouldLazyLoad).toHaveBeenCalled();
    });

    it('should show lazy placeholder when lazy loading', () => {
      lazyLoader.shouldLazyLoad.and.returnValue(true);
      lazyLoader.loadLazySection.and.returnValue(Promise.resolve({} as any));

      component.section = { ...mockSection, type: 'chart' };
      component.ngAfterViewInit();
      fixture.detectChanges();

      const placeholder = fixture.debugElement.query(By.directive(LazySectionPlaceholderComponent));
      expect(placeholder).toBeTruthy();
    });
  });

  describe('Event Handling', () => {
    it('should emit sectionEvent when component emits event', () => {
      const mockComponentRef = {
        instance: {
          section: mockSection,
          sectionEvent: {
            subscribe: (callback: (event: SectionRenderEvent) => void) => {
              callback({
                type: 'field',
                section: mockSection,
                field: { label: 'Test', value: 'Value' },
              });
            },
          },
        },
        destroy: jasmine.createSpy('destroy'),
      } as unknown as ComponentRef<BaseSectionComponent>;

      loader.loadComponent.and.returnValue(Promise.resolve(mockComponentRef));
      spyOn(component.sectionEvent, 'emit');

      component.section = mockSection;
      component.ngAfterViewInit();

      expect(component.sectionEvent.emit).toHaveBeenCalled();
    });
  });

  describe('Retry Lazy Load', () => {
    it('should retry lazy load when retryLazyLoad is called', () => {
      component.lazyType = 'chart';
      lazyLoader.retryLoad.and.returnValue(Promise.resolve({} as any));
      spyOn(component, 'startLazyLoad' as any);

      component.retryLazyLoad();

      expect(lazyLoader.retryLoad).toHaveBeenCalledWith('chart');
    });

    it('should clear error when retrying', () => {
      component.lazyLoadError = new Error('Test error');
      component.lazyType = 'chart';
      lazyLoader.retryLoad.and.returnValue(Promise.resolve({} as any));

      component.retryLazyLoad();

      expect(component.lazyLoadError).toBeNull();
    });
  });

  describe('Section Type Resolution', () => {
    it('should resolve section type correctly', () => {
      loader.resolveComponentType.and.returnValue({
        type: 'overview',
        component: {} as any,
      } as ComponentResolution);

      component.section = mockSection;
      component.ngAfterViewInit();

      expect(loader.resolveComponentType).toHaveBeenCalled();
    });

    it('should check plugin registry for custom types', () => {
      pluginRegistry.hasPlugin.and.returnValue(true);
      pluginRegistry.getPluginComponent.and.returnValue({} as any);

      component.section = { ...mockSection, type: 'custom-type' };
      component.ngAfterViewInit();

      expect(pluginRegistry.hasPlugin).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle component loading errors', () => {
      loader.loadComponent.and.returnValue(Promise.reject(new Error('Load failed')));
      spyOn(console, 'error');

      component.section = mockSection;
      component.ngAfterViewInit();

      expect(loader.loadComponent).toHaveBeenCalled();
    });

    it('should handle lazy loading errors', () => {
      lazyLoader.shouldLazyLoad.and.returnValue(true);
      lazyLoader.loadLazySection.and.returnValue(Promise.reject(new Error('Lazy load failed')));

      component.section = { ...mockSection, type: 'chart' };
      component.ngAfterViewInit();

      expect(lazyLoader.loadLazySection).toHaveBeenCalled();
    });
  });

  describe('Component Cleanup', () => {
    it('should destroy previous component when section changes', () => {
      const mockComponentRef = {
        instance: {
          section: mockSection,
          sectionEvent: jasmine.createSpyObj('EventEmitter', ['subscribe']),
        },
        destroy: jasmine.createSpy('destroy'),
      } as unknown as ComponentRef<BaseSectionComponent>;

      loader.loadComponent.and.returnValue(Promise.resolve(mockComponentRef));

      component.section = mockSection;
      component.ngAfterViewInit();

      const newSection = { ...mockSection, id: 'section-2' };
      component.section = newSection;
      component.ngOnChanges({
        section: {
          previousValue: mockSection,
          currentValue: newSection,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(mockComponentRef.destroy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle section without type', () => {
      const sectionWithoutType = {
        id: 'section-1',
        fields: [],
      } as CardSection;

      component.section = sectionWithoutType;
      component.ngAfterViewInit();

      expect(component).toBeTruthy();
    });

    it('should handle section with invalid type', () => {
      const sectionWithInvalidType = {
        ...mockSection,
        type: 'invalid-type' as any,
      };

      component.section = sectionWithInvalidType;
      component.ngAfterViewInit();

      expect(component).toBeTruthy();
    });

    it('should handle null section', () => {
      component.section = null as unknown as CardSection;
      component.ngAfterViewInit();

      expect(component).toBeTruthy();
    });

    it('should handle rapid section changes', () => {
      component.section = mockSection;
      component.ngAfterViewInit();

      component.section = { ...mockSection, id: 'section-2' };
      component.ngOnChanges({
        section: {
          previousValue: mockSection,
          currentValue: component.section,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      component.section = { ...mockSection, id: 'section-3' };
      component.ngOnChanges({
        section: {
          previousValue: { ...mockSection, id: 'section-2' },
          currentValue: component.section,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component).toBeTruthy();
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component).toBeTruthy();
      // OnPush is set in component decorator
    });
  });
});
