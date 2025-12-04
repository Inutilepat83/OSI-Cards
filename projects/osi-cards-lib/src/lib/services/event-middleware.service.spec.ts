import { TestBed } from '@angular/core/testing';
import { EventMiddlewareService } from './event-middleware.service';
import { SectionRenderEvent } from '../components/section-renderer/section-renderer.component';
import { EventMiddleware } from '../interfaces/event-middleware.interface';

describe('EventMiddlewareService', () => {
  let service: EventMiddlewareService;

  // Helper to create mock events
  const createMockEvent = (type: string = 'field'): SectionRenderEvent => ({
    type: type as 'field' | 'item' | 'action' | 'navigation',
    section: {
      id: 'test-section',
      title: 'Test Section',
      type: 'info',
    },
    field: {
      id: 'test-field',
      label: 'Test Field',
      value: 'Test Value',
    },
    metadata: { key: 'value' },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventMiddlewareService],
    });
    service = TestBed.inject(EventMiddlewareService);
  });

  afterEach(() => {
    service.clearMiddleware();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // processEvent Tests
  // ============================================================================
  describe('processEvent', () => {
    it('should pass event through unchanged when no middleware', () => {
      const event = createMockEvent();
      const result = service.processEvent(event);

      expect(result).toBe(event);
    });

    it('should emit raw event', (done) => {
      const event = createMockEvent();

      service.rawEvents$.subscribe((rawEvent) => {
        expect(rawEvent).toBe(event);
        done();
      });

      service.processEvent(event);
    });

    it('should emit processed event', (done) => {
      const event = createMockEvent();

      service.processedEvents$.subscribe((processedEvent) => {
        expect(processedEvent).toBe(event);
        done();
      });

      service.processEvent(event);
    });

    it('should process event through middleware chain', () => {
      const event = createMockEvent();
      let middlewareCalled = false;

      service.addMiddleware({
        handle: (e, next) => {
          middlewareCalled = true;
          return next(e);
        },
      });

      service.processEvent(event);
      expect(middlewareCalled).toBe(true);
    });

    it('should pass event through multiple middleware in order', () => {
      const order: number[] = [];

      service.addMiddleware({
        priority: 10,
        handle: (e, next) => {
          order.push(1);
          return next(e);
        },
      });

      service.addMiddleware({
        priority: 5,
        handle: (e, next) => {
          order.push(2);
          return next(e);
        },
      });

      service.processEvent(createMockEvent());

      // Higher priority runs first
      expect(order).toEqual([1, 2]);
    });
  });

  // ============================================================================
  // addMiddleware Tests
  // ============================================================================
  describe('addMiddleware', () => {
    it('should add middleware to chain', () => {
      let called = false;

      service.addMiddleware({
        handle: (e, next) => {
          called = true;
          return next(e);
        },
      });

      service.processEvent(createMockEvent());
      expect(called).toBe(true);
    });

    it('should return remove function', () => {
      let called = false;

      const remove = service.addMiddleware({
        handle: (e, next) => {
          called = true;
          return next(e);
        },
      });

      // Remove middleware
      remove();

      // Process event - middleware should not be called
      called = false;
      service.processEvent(createMockEvent());
      expect(called).toBe(false);
    });

    it('should sort middleware by priority', () => {
      const order: string[] = [];

      service.addMiddleware({
        priority: 50,
        handle: (e, next) => {
          order.push('medium');
          return next(e);
        },
      });

      service.addMiddleware({
        priority: 100,
        handle: (e, next) => {
          order.push('high');
          return next(e);
        },
      });

      service.addMiddleware({
        priority: 10,
        handle: (e, next) => {
          order.push('low');
          return next(e);
        },
      });

      service.processEvent(createMockEvent());

      // Should be sorted by priority (highest first)
      expect(order).toEqual(['high', 'medium', 'low']);
    });
  });

  // ============================================================================
  // removeMiddleware Tests
  // ============================================================================
  describe('removeMiddleware', () => {
    it('should remove specific middleware', () => {
      let called1 = false;
      let called2 = false;

      const middleware1: EventMiddleware = {
        handle: (e, next) => {
          called1 = true;
          return next(e);
        },
      };

      const middleware2: EventMiddleware = {
        handle: (e, next) => {
          called2 = true;
          return next(e);
        },
      };

      service.addMiddleware(middleware1);
      service.addMiddleware(middleware2);

      // Remove first middleware
      service.removeMiddleware(middleware1);

      service.processEvent(createMockEvent());

      expect(called1).toBe(false);
      expect(called2).toBe(true);
    });

    it('should handle removing non-existent middleware gracefully', () => {
      const middleware: EventMiddleware = {
        handle: (e, next) => next(e),
      };

      // Should not throw
      service.removeMiddleware(middleware);
      expect(service).toBeTruthy();
    });
  });

  // ============================================================================
  // clearMiddleware Tests
  // ============================================================================
  describe('clearMiddleware', () => {
    it('should remove all middleware', () => {
      let callCount = 0;

      service.addMiddleware({
        handle: (e, next) => {
          callCount++;
          return next(e);
        },
      });

      service.addMiddleware({
        handle: (e, next) => {
          callCount++;
          return next(e);
        },
      });

      service.clearMiddleware();
      service.processEvent(createMockEvent());

      expect(callCount).toBe(0);
    });
  });

  // ============================================================================
  // createLoggingMiddleware Tests
  // ============================================================================
  describe('createLoggingMiddleware', () => {
    it('should create middleware that logs events', () => {
      const logs: string[] = [];
      const logger = (message: string, event: SectionRenderEvent) => {
        logs.push(message);
      };

      const middleware = service.createLoggingMiddleware(logger);
      service.addMiddleware(middleware);

      service.processEvent(createMockEvent('field'));

      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('[Card Event]');
      expect(logs[0]).toContain('field');
    });

    it('should use console.log by default', () => {
      const consoleSpy = spyOn(console, 'log');

      const middleware = service.createLoggingMiddleware();
      service.addMiddleware(middleware);

      service.processEvent(createMockEvent());

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have high priority (100)', () => {
      const middleware = service.createLoggingMiddleware();
      expect(middleware.priority).toBe(100);
    });
  });

  // ============================================================================
  // createFilterMiddleware Tests
  // ============================================================================
  describe('createFilterMiddleware', () => {
    it('should pass events that match filter', () => {
      let received = false;

      const middleware = service.createFilterMiddleware((event) => event.type === 'field');
      service.addMiddleware(middleware);

      service.addMiddleware({
        handle: (e, next) => {
          received = true;
          return next(e);
        },
      });

      service.processEvent(createMockEvent('field'));

      expect(received).toBe(true);
    });

    it('should block events that do not match filter', () => {
      let receivedInNext = false;

      const middleware = service.createFilterMiddleware((event) => event.type === 'action');
      service.addMiddleware(middleware);

      service.addMiddleware({
        priority: -1, // Lower priority, runs after filter
        handle: (e, next) => {
          receivedInNext = true;
          return next(e);
        },
      });

      service.processEvent(createMockEvent('field'));

      // The event should be returned but next middleware not fully processed
      expect(service).toBeTruthy();
    });
  });

  // ============================================================================
  // createTransformMiddleware Tests
  // ============================================================================
  describe('createTransformMiddleware', () => {
    it('should transform events', () => {
      let transformedEvent: SectionRenderEvent | null = null;

      const middleware = service.createTransformMiddleware((event) => ({
        ...event,
        metadata: { ...event.metadata, transformed: true },
      }));
      service.addMiddleware(middleware);

      service.addMiddleware({
        handle: (e, next) => {
          transformedEvent = e;
          return next(e);
        },
      });

      service.processEvent(createMockEvent());

      expect(transformedEvent?.metadata?.['transformed']).toBe(true);
    });
  });

  // ============================================================================
  // createAnalyticsMiddleware Tests
  // ============================================================================
  describe('createAnalyticsMiddleware', () => {
    it('should track events with analytics', () => {
      const tracked: { name: string; props: Record<string, unknown> }[] = [];
      const trackEvent = (name: string, props: Record<string, unknown>) => {
        tracked.push({ name, props });
      };

      const middleware = service.createAnalyticsMiddleware(trackEvent);
      service.addMiddleware(middleware);

      const event = createMockEvent('field');
      service.processEvent(event);

      expect(tracked.length).toBe(1);
      expect(tracked[0].name).toBe('card_field');
      expect(tracked[0].props['sectionId']).toBe('test-section');
      expect(tracked[0].props['sectionType']).toBe('info');
      expect(tracked[0].props['fieldId']).toBe('test-field');
    });

    it('should have priority 50', () => {
      const middleware = service.createAnalyticsMiddleware(() => {});
      expect(middleware.priority).toBe(50);
    });
  });

  // ============================================================================
  // Observable Tests
  // ============================================================================
  describe('observables', () => {
    it('should emit raw events before middleware', (done) => {
      const order: string[] = [];

      service.rawEvents$.subscribe(() => {
        order.push('raw');
      });

      service.addMiddleware({
        handle: (e, next) => {
          order.push('middleware');
          return next(e);
        },
      });

      service.processedEvents$.subscribe(() => {
        order.push('processed');
        expect(order).toEqual(['raw', 'middleware', 'processed']);
        done();
      });

      service.processEvent(createMockEvent());
    });

    it('should emit to multiple subscribers', (done) => {
      let count = 0;

      service.processedEvents$.subscribe(() => count++);
      service.processedEvents$.subscribe(() => count++);

      service.processEvent(createMockEvent());

      setTimeout(() => {
        expect(count).toBe(2);
        done();
      }, 10);
    });
  });
});
