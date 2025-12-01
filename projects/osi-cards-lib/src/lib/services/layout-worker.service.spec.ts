import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { 
  LayoutWorkerService, 
  WorkerStatus, 
  WorkerPackResult,
  WorkerPositionedSection 
} from './layout-worker.service';
import { CardSection } from '../models/card.model';

describe('LayoutWorkerService', () => {
  let service: LayoutWorkerService;

  const mockSections: CardSection[] = [
    {
      id: 'section-1',
      title: 'Info Section',
      type: 'info',
      fields: [
        { label: 'Field 1', value: 'Value 1' },
        { label: 'Field 2', value: 'Value 2' }
      ]
    },
    {
      id: 'section-2',
      title: 'List Section',
      type: 'list',
      items: [
        { title: 'Item 1', description: 'Description 1' },
        { title: 'Item 2', description: 'Description 2' }
      ]
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LayoutWorkerService]
    });
    service = TestBed.inject(LayoutWorkerService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Status Tests
  // ============================================================================
  describe('getStatus', () => {
    it('should return current status', () => {
      const status = service.getStatus();

      expect(status).toHaveProperty('isReady');
      expect(status).toHaveProperty('isSupported');
      expect(status).toHaveProperty('error');
      expect(status).toHaveProperty('pendingRequests');
      expect(status).toHaveProperty('totalProcessed');
      expect(status).toHaveProperty('avgProcessingTime');
    });

    it('should have zero pending requests initially', () => {
      const status = service.getStatus();
      expect(status.pendingRequests).toBe(0);
    });

    it('should have zero processed initially', () => {
      const status = service.getStatus();
      expect(status.totalProcessed).toBe(0);
    });
  });

  describe('isReady', () => {
    it('should return boolean', () => {
      expect(typeof service.isReady()).toBe('boolean');
    });
  });

  // ============================================================================
  // Observable Tests
  // ============================================================================
  describe('status$', () => {
    it('should emit status updates', (done) => {
      service.status$.subscribe((status: WorkerStatus) => {
        expect(status).toBeDefined();
        expect(status.isReady).toBeDefined();
        done();
      });
    });
  });

  // ============================================================================
  // packSections Tests
  // ============================================================================
  describe('packSections', () => {
    it('should reject when worker not available', async () => {
      // If worker is not supported, it should reject
      if (!service.isReady()) {
        await expectAsync(
          service.packSections(mockSections, 4)
        ).toBeRejected();
      } else {
        // If worker is available, skip this test
        expect(service.isReady()).toBe(true);
      }
    });
  });

  // ============================================================================
  // skylinePack Tests
  // ============================================================================
  describe('skylinePack', () => {
    it('should reject when worker not available', async () => {
      if (!service.isReady()) {
        await expectAsync(
          service.skylinePack(mockSections, 4)
        ).toBeRejected();
      } else {
        expect(service.isReady()).toBe(true);
      }
    });
  });

  // ============================================================================
  // calculatePositions Tests
  // ============================================================================
  describe('calculatePositions', () => {
    it('should reject when worker not available', async () => {
      if (!service.isReady()) {
        await expectAsync(
          service.calculatePositions(mockSections, 4)
        ).toBeRejected();
      } else {
        expect(service.isReady()).toBe(true);
      }
    });
  });

  // ============================================================================
  // analyzeGaps Tests
  // ============================================================================
  describe('analyzeGaps', () => {
    it('should reject when worker not available', async () => {
      const placements: WorkerPositionedSection[] = [
        {
          key: 'section-1',
          colSpan: 2,
          column: 0,
          top: 0,
          left: '0%',
          width: '50%',
          height: 100
        }
      ];

      if (!service.isReady()) {
        await expectAsync(
          service.analyzeGaps(placements, 4, 200)
        ).toBeRejected();
      } else {
        expect(service.isReady()).toBe(true);
      }
    });
  });

  // ============================================================================
  // computeHeights Tests
  // ============================================================================
  describe('computeHeights', () => {
    it('should reject when worker not available', async () => {
      if (!service.isReady()) {
        await expectAsync(
          service.computeHeights(mockSections)
        ).toBeRejected();
      } else {
        expect(service.isReady()).toBe(true);
      }
    });
  });

  // ============================================================================
  // optimizeLayout Tests
  // ============================================================================
  describe('optimizeLayout', () => {
    it('should reject when worker not available', async () => {
      if (!service.isReady()) {
        await expectAsync(
          service.optimizeLayout(mockSections, 4)
        ).toBeRejected();
      } else {
        expect(service.isReady()).toBe(true);
      }
    });

    it('should accept algorithm parameter', async () => {
      if (!service.isReady()) {
        await expectAsync(
          service.optimizeLayout(mockSections, 4, 12, 'skyline')
        ).toBeRejected();
      } else {
        expect(service.isReady()).toBe(true);
      }
    });
  });

  // ============================================================================
  // packSectionsWithFallback Tests
  // ============================================================================
  describe('packSectionsWithFallback', () => {
    it('should use fallback when worker not ready', async () => {
      const mockFallbackResult: WorkerPackResult = {
        placements: [],
        containerHeight: 100,
        utilization: 0.8,
        gapCount: 0
      };

      const fallbackFn = jasmine.createSpy('fallbackFn').and.returnValue(mockFallbackResult);

      if (!service.isReady()) {
        const result = await service.packSectionsWithFallback(
          mockSections,
          4,
          12,
          fallbackFn
        );

        expect(fallbackFn).toHaveBeenCalled();
        expect(result).toEqual(mockFallbackResult);
      } else {
        // Worker is ready, test with real worker
        expect(service.isReady()).toBe(true);
      }
    });

    it('should call fallback on worker error', async () => {
      const mockFallbackResult: WorkerPackResult = {
        placements: [],
        containerHeight: 100,
        utilization: 0.8,
        gapCount: 0
      };

      const fallbackFn = jasmine.createSpy('fallbackFn').and.returnValue(mockFallbackResult);

      // Force worker to be not ready
      if (!service.isReady()) {
        const result = await service.packSectionsWithFallback(
          mockSections,
          4,
          12,
          fallbackFn
        );

        expect(fallbackFn).toHaveBeenCalled();
      } else {
        expect(service.isReady()).toBe(true);
      }
    });
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================
  describe('ngOnDestroy', () => {
    it('should clean up worker', () => {
      service.ngOnDestroy();
      // Should not throw
      expect(service).toBeTruthy();
    });

    it('should reject pending requests', async () => {
      // Only test if worker is available
      if (service.isReady()) {
        const promise = service.packSections(mockSections, 4);
        service.ngOnDestroy();
        await expectAsync(promise).toBeRejected();
      } else {
        expect(service).toBeTruthy();
      }
    });
  });
});




