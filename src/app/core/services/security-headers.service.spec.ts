import { TestBed } from '@angular/core/testing';
import { SecurityHeadersService } from './security-headers.service';
import { LoggingService } from './logging.service';

describe('SecurityHeadersService', () => {
  let service: SecurityHeadersService;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);

    TestBed.configureTestingModule({
      providers: [
        SecurityHeadersService,
        { provide: LoggingService, useValue: loggingSpy }
      ]
    });

    service = TestBed.inject(SecurityHeadersService);
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default headers', () => {
    const headers = service.getSecurityHeaders();
    
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should set and get headers', () => {
    service.setHeader('Test-Header', 'test-value');
    
    expect(service.getHeader('Test-Header')).toBe('test-value');
  });

  it('should return undefined for non-existent header', () => {
    expect(service.getHeader('Non-Existent')).toBeUndefined();
  });

  it('should set CSP header', () => {
    const policy = "default-src 'self'";
    service.setCSPHeader(policy);
    
    expect(service.getCSPHeader()).toBe(policy);
  });

  it('should set HSTS header with default values', () => {
    service.setHSTSHeader();
    
    const hsts = service.getHeader('Strict-Transport-Security');
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
  });

  it('should set HSTS header with custom values', () => {
    service.setHSTSHeader(86400, false, true);
    
    const hsts = service.getHeader('Strict-Transport-Security');
    expect(hsts).toContain('max-age=86400');
    expect(hsts).not.toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });

  it('should remove header', () => {
    service.setHeader('Test-Header', 'test-value');
    expect(service.getHeader('Test-Header')).toBe('test-value');
    
    service.removeHeader('Test-Header');
    expect(service.getHeader('Test-Header')).toBeUndefined();
  });

  it('should clear all headers and reinitialize defaults', () => {
    service.setHeader('Custom-Header', 'custom-value');
    service.clearHeaders();
    
    const headers = service.getSecurityHeaders();
    expect(headers['Custom-Header']).toBeUndefined();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('should validate headers and return warnings', () => {
    const validation = service.validateHeaders();
    
    expect(validation.isValid).toBe(true);
    expect(Array.isArray(validation.warnings)).toBe(true);
    expect(Array.isArray(validation.errors)).toBe(true);
  });

  it('should warn when CSP contains unsafe directives', () => {
    service.setCSPHeader("default-src 'self' 'unsafe-inline' 'unsafe-eval'");
    
    const validation = service.validateHeaders();
    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(validation.warnings.some(w => w.includes('unsafe'))).toBe(true);
  });

  it('should get all security headers as object', () => {
    const headers = service.getSecurityHeaders();
    
    expect(typeof headers).toBe('object');
    expect(headers['X-Content-Type-Options']).toBeDefined();
  });
});









