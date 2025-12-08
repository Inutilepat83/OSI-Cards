import { TestBed } from '@angular/core/testing';
import { CardTemplatesService } from './card-templates.service';
import { CardDataService } from '../../core/services/card-data/card-data.service';
import { LoggingService } from '../../core/services/logging.service';
import { CardBuilder, SectionBuilder } from '../../testing/test-builders';
import { AICardConfig, CardType } from '../../models';
import { of, throwError } from 'rxjs';

describe('CardTemplatesService', () => {
  let service: CardTemplatesService;
  let cardDataService: jasmine.SpyObj<CardDataService>;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const cardDataSpy = jasmine.createSpyObj('CardDataService', ['getCardsByType']);
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['debug', 'warn', 'error']);

    TestBed.configureTestingModule({
      providers: [
        CardTemplatesService,
        { provide: CardDataService, useValue: cardDataSpy },
        { provide: LoggingService, useValue: loggingSpy },
      ],
    });

    service = TestBed.inject(CardTemplatesService);
    cardDataService = TestBed.inject(CardDataService) as jasmine.SpyObj<CardDataService>;
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadTemplate', () => {
    it('should load template from CardDataService', (done) => {
      const template = CardBuilder.create()
        .withTitle('Company Template')
        .withType('company')
        .withSection(SectionBuilder.create().withTitle('Section').build())
        .build();

      cardDataService.getCardsByType.and.returnValue(of([template]));

      service.loadTemplate('company', 1).subscribe((result) => {
        expect(result).toBeTruthy();
        expect(result?.cardTitle).toBe('Company Template');
        expect(cardDataService.getCardsByType).toHaveBeenCalledWith('company');
        done();
      });
    });

    it('should cache loaded templates', (done) => {
      const template = CardBuilder.create()
        .withTitle('Cached Template')
        .withType('company')
        .build();

      cardDataService.getCardsByType.and.returnValue(of([template]));

      service.loadTemplate('company', 1).subscribe(() => {
        // Load again - should use cache
        service.loadTemplate('company', 1).subscribe((cached) => {
          expect(cached).toBeTruthy();
          expect(cached?.cardTitle).toBe('Cached Template');
          // Should only call CardDataService once
          expect(cardDataService.getCardsByType).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should select correct variant', (done) => {
      const template1 = CardBuilder.create().withTitle('Variant 1').withType('company').build();
      const template2 = CardBuilder.create().withTitle('Variant 2').withType('company').build();
      const template3 = CardBuilder.create().withTitle('Variant 3').withType('company').build();

      cardDataService.getCardsByType.and.returnValue(of([template1, template2, template3]));

      service.loadTemplate('company', 2).subscribe((result) => {
        expect(result?.cardTitle).toBe('Variant 2');
        done();
      });
    });

    it('should fallback to built-in template when no file templates', (done) => {
      cardDataService.getCardsByType.and.returnValue(of([]));

      service.loadTemplate('company', 1).subscribe((result) => {
        expect(result).toBeTruthy();
        expect(result?.cardTitle).toBeDefined();
        done();
      });
    });

    it('should handle errors gracefully', (done) => {
      cardDataService.getCardsByType.and.returnValue(throwError(() => new Error('Network error')));

      service.loadTemplate('company', 1).subscribe((result) => {
        // Should fallback to built-in template
        expect(result).toBeTruthy();
        expect(loggingService.error).toHaveBeenCalled();
        done();
      });
    });

    it('should sanitize templates (ensure IDs)', (done) => {
      const template = CardBuilder.create()
        .withTitle('Test Template')
        .withType('company')
        .withSection(SectionBuilder.create().withTitle('Section').build())
        .build();

      // Remove IDs to test sanitization
      delete template.id;
      if (template.sections?.[0]) {
        delete template.sections[0].id;
      }

      cardDataService.getCardsByType.and.returnValue(of([template]));

      service.loadTemplate('company', 1).subscribe((result) => {
        expect(result?.id).toBeDefined();
        expect(result?.sections?.[0]?.id).toBeDefined();
        done();
      });
    });
  });

  describe('getCachedTemplate', () => {
    it('should return cached template', (done) => {
      const template = CardBuilder.create().withTitle('Cached').withType('company').build();

      cardDataService.getCardsByType.and.returnValue(of([template]));

      service.loadTemplate('company', 1).subscribe(() => {
        const cached = service.getCachedTemplate('company', 1);
        expect(cached).toBeTruthy();
        expect(cached?.cardTitle).toBe('Cached');
        done();
      });
    });

    it('should return null for uncached template', () => {
      const cached = service.getCachedTemplate('company', 1);
      expect(cached).toBeNull();
    });
  });

  describe('getAvailableVariants', () => {
    it('should return number of available variants', (done) => {
      const template1 = CardBuilder.create().withTitle('V1').withType('company').build();
      const template2 = CardBuilder.create().withTitle('V2').withType('company').build();

      cardDataService.getCardsByType.and.returnValue(of([template1, template2]));

      service.getAvailableVariants('company').subscribe((count) => {
        expect(count).toBe(2);
        done();
      });
    });

    it('should return 3 for built-in templates when no file templates', (done) => {
      cardDataService.getCardsByType.and.returnValue(of([]));

      service.getAvailableVariants('company').subscribe((count) => {
        expect(count).toBe(3); // Built-in templates have 3 variants
        done();
      });
    });
  });

  describe('clearCache', () => {
    it('should clear all cached templates', (done) => {
      const template = CardBuilder.create().withTitle('To Clear').withType('company').build();

      cardDataService.getCardsByType.and.returnValue(of([template]));

      service.loadTemplate('company', 1).subscribe(() => {
        expect(service.getCachedTemplate('company', 1)).toBeTruthy();

        service.clearCache();

        expect(service.getCachedTemplate('company', 1)).toBeNull();
        done();
      });
    });
  });

  describe('clearCacheByType', () => {
    it('should clear cache for specific type only', (done) => {
      const companyTemplate = CardBuilder.create().withTitle('Company').withType('company').build();
      const productTemplate = CardBuilder.create().withTitle('Product').withType('product').build();

      cardDataService.getCardsByType.and.returnValue(of([companyTemplate]));

      service.loadTemplate('company', 1).subscribe(() => {
        cardDataService.getCardsByType.and.returnValue(of([productTemplate]));

        service.loadTemplate('product', 1).subscribe(() => {
          expect(service.getCachedTemplate('company', 1)).toBeTruthy();
          expect(service.getCachedTemplate('product', 1)).toBeTruthy();

          service.clearCacheByType('company');

          expect(service.getCachedTemplate('company', 1)).toBeNull();
          expect(service.getCachedTemplate('product', 1)).toBeTruthy();
          done();
        });
      });
    });
  });
});



