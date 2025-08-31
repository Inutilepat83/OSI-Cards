import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface CSRFConfig {
  tokenEndpoint: string;
  headerName: string;
  cookieName: string;
}

export interface SecurityAuditLog {
  timestamp: Date;
  action: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
}

@Injectable({
  providedIn: 'root',
})
export class AdvancedSecurityService {
  private rateLimitConfigs: Map<string, RateLimitConfig> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private blockedKeys: Map<string, number> = new Map();
  private csrfToken$ = new BehaviorSubject<string | null>(null);
  private auditLogs$ = new BehaviorSubject<SecurityAuditLog[]>([]);

  constructor(private http: HttpClient) {
    this.initializeDefaultRateLimits();
    this.loadCsrfToken();
  }

  /**
   * Initialize default rate limiting configurations
   */
  private initializeDefaultRateLimits(): void {
    this.rateLimitConfigs.set('api', {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    });

    this.rateLimitConfigs.set('auth', {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    });

    this.rateLimitConfigs.set('search', {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes
    });

    this.rateLimitConfigs.set('assets', {
      maxRequests: 1000,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 60 * 1000, // 1 minute
    });
  }

  /**
   * Check if request is within rate limits
   */
  isWithinRateLimit(key: string, category: string = 'api'): boolean {
    const config = this.rateLimitConfigs.get(category);
    if (!config) return true;

    const now = Date.now();
    const blockExpiry = this.blockedKeys.get(key);

    // Check if key is currently blocked
    if (blockExpiry && now < blockExpiry) {
      return false;
    }

    // Remove expired blocks
    if (blockExpiry && now >= blockExpiry) {
      this.blockedKeys.delete(key);
    }

    const requestData = this.requestCounts.get(key);

    if (!requestData || now > requestData.resetTime) {
      // Reset counter
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (requestData.count >= config.maxRequests) {
      // Block the key
      this.blockedKeys.set(key, now + config.blockDurationMs);
      this.logSecurityEvent('rate_limit_exceeded', { key, category });
      return false;
    }

    // Increment counter
    requestData.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemainingRequests(key: string, category: string = 'api'): number {
    const config = this.rateLimitConfigs.get(category);
    if (!config) return -1;

    const requestData = this.requestCounts.get(key);
    if (!requestData) return config.maxRequests;

    return Math.max(0, config.maxRequests - requestData.count);
  }

  /**
   * Load CSRF token from server
   */
  private loadCsrfToken(): void {
    // Generate client-side token for now (no server endpoint available)
    const token = this.generateSecureToken();
    this.csrfToken$.next(token);
    sessionStorage.setItem('csrf-token', token);
    
    // TODO: Implement server-side CSRF endpoint when backend is available
    /*
    this.http
      .get<{ token: string }>('/api/csrf-token')
      .pipe(
        map(response => response.token),
        catchError(() => {
          // Generate client-side token as fallback
          const token = this.generateSecureToken();
          sessionStorage.setItem('csrf-token', token);
          return [token];
        })
      )
      .subscribe(token => {
        this.csrfToken$.next(token);
        sessionStorage.setItem('csrf-token', token);
      });
    */
  }

  /**
   * Get current CSRF token
   */
  getCsrfToken(): string | null {
    return this.csrfToken$.value || sessionStorage.getItem('csrf-token');
  }

  /**
   * Refresh CSRF token
   */
  refreshCsrfToken(): Observable<string> {
    return this.http.post<{ token: string }>('/api/csrf-token/refresh', {}).pipe(
      map(response => {
        this.csrfToken$.next(response.token);
        sessionStorage.setItem('csrf-token', response.token);
        return response.token;
      })
    );
  }

  /**
   * Validate CSRF token
   */
  validateCsrfToken(token: string): boolean {
    const currentToken = this.getCsrfToken();
    return currentToken === token;
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string, key?: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const cryptoKey = key
      ? await crypto.subtle.importKey('raw', encoder.encode(key), 'AES-GCM', false, ['encrypt'])
      : await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, dataBuffer);

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(c => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), 'AES-GCM', false, [
      'decrypt',
    ]);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encrypted);

    return decoder.decode(decrypted);
  }

  /**
   * Log security events
   */
  logSecurityEvent(action: string, details: any, userId?: string): void {
    const auditLog: SecurityAuditLog = {
      timestamp: new Date(),
      action,
      userId,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      details,
    };

    const currentLogs = this.auditLogs$.value;
    this.auditLogs$.next([...currentLogs, auditLog]);

    // Store locally only for now (no server endpoint available)
    const localLogs = JSON.parse(localStorage.getItem('security-audit') || '[]');
    localLogs.push(auditLog);
    localStorage.setItem('security-audit', JSON.stringify(localLogs.slice(-100))); // Keep last 100 entries
    
    // TODO: Implement server-side audit endpoint when backend is available
    // this.http.post('/api/security/audit', auditLog).subscribe();
  }

  /**
   * Get security audit logs
   */
  getAuditLogs(): Observable<SecurityAuditLog[]> {
    return this.auditLogs$.asObservable();
  }

  /**
   * Get client IP (best effort)
   */
  private getClientIP(): string {
    // This is a simplified implementation
    // In production, you'd get this from the server
    return 'unknown';
  }

  /**
   * Configure rate limiting
   */
  configureRateLimit(category: string, config: RateLimitConfig): void {
    this.rateLimitConfigs.set(category, config);
  }

  /**
   * Clear rate limit data for a key
   */
  clearRateLimitData(key: string): void {
    this.requestCounts.delete(key);
    this.blockedKeys.delete(key);
  }

  /**
   * Check if a key is currently blocked
   */
  isBlocked(key: string): boolean {
    const blockExpiry = this.blockedKeys.get(key);
    if (!blockExpiry) return false;

    const now = Date.now();
    if (now >= blockExpiry) {
      this.blockedKeys.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get block expiry time for a key
   */
  getBlockExpiry(key: string): number | null {
    return this.blockedKeys.get(key) || null;
  }
}
