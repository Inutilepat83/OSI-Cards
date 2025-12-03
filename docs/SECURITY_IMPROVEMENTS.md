# Security Improvements Implementation Guide

**Version:** 1.0.0
**Date:** December 3, 2025
**Target:** Zero Critical Vulnerabilities

## Overview

This guide covers security improvements for OSI Cards, including hardening, authentication, authorization, and monitoring.

## Current Security Status

### ✅ Already Implemented

1. **Content Security Policy (CSP)**
   - Location: `src/app/core/security/trusted-types.ts`
   - Status: Partial implementation
   - Needs: CSP violation reporting (Item #201)

2. **Trusted Types**
   - DOMPurify integration
   - Safe HTML rendering
   - Status: Implemented

3. **Input Sanitization**
   - Location: `projects/osi-cards-lib/src/lib/utils/sanitization.util.ts`
   - Status: Implemented
   - Enhancement: Runtime validation added

4. **Security Headers**
   - Location: `src/app/core/interceptors/security-headers.interceptor.ts`
   - Headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
   - Status: Implemented

5. **Rate Limiting**
   - Location: `src/app/core/interceptors/rate-limit.interceptor.ts`
   - Algorithm: Token bucket
   - Status: Implemented

6. **Circuit Breaker**
   - Location: `src/app/core/services/circuit-breaker.service.ts`
   - Status: Implemented

### 🔄 Needs Enhancement

1. **CSP Violation Reporting** (Item #201)
2. **Subresource Integrity** (Item #202)
3. **Input Validation at All Boundaries** (Item #204)
4. **Output Encoding** (Item #205)
5. **XSS Prevention** (Item #207)
6. **CSRF Token Validation** (Item #208)
7. **Dependency Vulnerability Scanning** (Item #210)

## Implementation Plan

### Phase 1: Hardening (Weeks 1-4)

#### 1. CSP Violation Reporting

**Implementation:**

```typescript
// In index.html or app initialization
if (typeof window !== 'undefined') {
  window.addEventListener('securitypolicyviolation', (event) => {
    const violation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
    };

    // Send to backend
    fetch('/api/csp-violations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(violation),
    });

    // Log in development
    if (isDevMode()) {
      console.error('[CSP Violation]', violation);
    }
  });
}
```

**File:** `projects/osi-cards-lib/src/lib/security/csp-reporting.util.ts`

#### 2. Subresource Integrity (SRI)

**Implementation:**

```typescript
// Generate SRI hashes for all external resources
// In angular.json:
{
  "configurations": {
    "production": {
      "subresourceIntegrity": true,
      "outputHashing": "all"
    }
  }
}
```

**Already enabled in:** `angular.json` (verify and document)

#### 3. Enhanced Input Validation

**File:** `projects/osi-cards-lib/src/lib/security/input-validator.ts`

```typescript
export class SecurityInputValidator {
  /**
   * Validate and sanitize user input
   */
  static validateInput(input: string, type: 'text' | 'email' | 'url'): string {
    // Remove potentially dangerous characters
    let sanitized = input.trim();

    switch (type) {
      case 'email':
        // Strict email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitized)) {
          throw new ValidationError('Invalid email format');
        }
        break;

      case 'url':
        // URL validation
        try {
          const url = new URL(sanitized);
          // Only allow http and https
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw new ValidationError('Invalid URL protocol');
          }
        } catch {
          throw new ValidationError('Invalid URL format');
        }
        break;

      case 'text':
        // Remove script tags and dangerous HTML
        sanitized = sanitized
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
        break;
    }

    return sanitized;
  }

  /**
   * Validate JSON input
   */
  static validateJSON(input: string): any {
    try {
      const parsed = JSON.parse(input);

      // Check for prototype pollution
      if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
        throw new SecurityError('Potential prototype pollution detected');
      }

      return parsed;
    } catch (error) {
      throw new ValidationError('Invalid JSON format');
    }
  }
}
```

#### 4. CSRF Protection

**Implementation:**

```typescript
// In HTTP interceptor
@Injectable()
export class CSRFInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get CSRF token from cookie or meta tag
    const token = this.getCSRFToken();

    if (token) {
      req = req.clone({
        headers: req.headers.set('X-CSRF-Token', token),
      });
    }

    return next.handle(req);
  }

  private getCSRFToken(): string | null {
    // From meta tag
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
      return meta.getAttribute('content');
    }

    // From cookie
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}
```

**File:** `src/app/core/interceptors/csrf.interceptor.ts`

### Phase 2: Authentication & Authorization (Weeks 5-8)

#### Planning for Items #211-220

**Options to Consider:**

1. **OAuth 2.0 / OIDC**
   - Providers: Auth0, Okta, Firebase Auth, AWS Cognito
   - Recommendation: Auth0 (best developer experience)

2. **JWT Token Management**
   - Storage: HttpOnly cookies (most secure)
   - Refresh tokens: Rotation strategy
   - Validation: Backend verification

3. **Permission System**
   - Model: Attribute-based (ABAC) or Role-based (RBAC)
   - Granularity: Feature-level permissions
   - Implementation: Permission service with guards

**File Structure:**

```
src/app/core/auth/
├── auth.service.ts
├── token.service.ts
├── permission.service.ts
├── auth.guard.ts
├── permission.guard.ts
└── auth.interceptor.ts
```

### Phase 3: Monitoring & Incident Response (Weeks 9-12)

#### Error Tracking (Item #225, #248)

**Implementation:**

```typescript
import * as Sentry from '@sentry/angular';

// In main.ts
Sentry.init({
  dsn: environment.sentryDSN,
  environment: environment.production ? 'production' : 'development',
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', environment.apiUrl],
    }),
  ],
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
```

#### Security Monitoring

**Metrics to Track:**
- Failed authentication attempts
- Rate limit violations
- CSP violations
- Suspicious activity patterns
- Dependency vulnerabilities

**Alerting:**
- Critical: Immediate notification
- High: Within 1 hour
- Medium: Daily digest
- Low: Weekly report

## Security Best Practices

### For Developers

1. **Never Trust User Input**
   ```typescript
   // Bad
   element.innerHTML = userInput;

   // Good
   element.textContent = userInput;
   // Or
   element.innerHTML = DOMPurify.sanitize(userInput);
   ```

2. **Use Type-Safe APIs**
   ```typescript
   // Use branded types for sensitive data
   type UserId = string & { readonly __brand: 'UserId' };
   type SessionToken = string & { readonly __brand: 'SessionToken' };
   ```

3. **Validate at Boundaries**
   ```typescript
   @Post('/api/cards')
   createCard(@Body() dto: CreateCardDto) {
     // Validate using runtime validator
     const result = validateCard(dto);
     if (!result.valid) {
       throw new BadRequestException(result.errors);
     }
     return this.cardService.create(result.data);
   }
   ```

4. **Handle Errors Securely**
   ```typescript
   // Bad - exposes internal details
   catch (error) {
     return { error: error.message };
   }

   // Good - generic message to user, log details
   catch (error) {
     logger.error('Card creation failed', { error, userId });
     return { error: 'Unable to create card. Please try again.' };
   }
   ```

5. **Use Parameterized Queries**
   ```typescript
   // If using SQL
   // Bad
   const query = `SELECT * FROM cards WHERE id = '${userId}'`;

   // Good
   const query = 'SELECT * FROM cards WHERE id = ?';
   db.execute(query, [userId]);
   ```

### For Deployment

1. **Environment Variables**
   ```bash
   # Never commit secrets to git
   # Use environment variables or secret management

   # .env (gitignored)
   API_KEY=secret-key-here
   DATABASE_URL=connection-string
   ```

2. **HTTPS Only**
   ```typescript
   // Redirect HTTP to HTTPS
   if (window.location.protocol !== 'https:' && environment.production) {
     window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
   }
   ```

3. **Security Headers**
   ```nginx
   # In nginx or other reverse proxy
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   add_header X-Frame-Options "DENY" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-XSS-Protection "1; mode=block" always;
   add_header Referrer-Policy "strict-origin-when-cross-origin" always;
   add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
   ```

## Security Checklist

### Before Each Release

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review dependency updates
- [ ] Check for hardcoded secrets
- [ ] Verify input validation
- [ ] Test authentication flows
- [ ] Verify authorization rules
- [ ] Review CSP policy
- [ ] Test error handling
- [ ] Verify logging doesn't expose sensitive data
- [ ] Check HTTPS enforcement
- [ ] Review security headers
- [ ] Run security tests
- [ ] Perform penetration testing (if major changes)

### Continuous Monitoring

```bash
# Daily
npm audit

# Weekly
node scripts/security-audit.js
npm outdated

# Monthly
Review access logs
Review error logs
Review CSP violations
Update dependencies
```

## Tools & Resources

### Security Tools

```bash
# Install security tools
npm install --save-dev \
  helmet \
  express-rate-limit \
  @nestjs/throttler \
  snyk

# Run security checks
npm audit
npx snyk test
```

### Useful Links

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Angular Security Guide](https://angular.io/guide/security)
- [TypeScript Security](https://www.typescriptlang.org/docs/handbook/security.html)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)

## Incident Response Plan

### 1. Detection
- Automated alerts
- User reports
- Monitoring systems

### 2. Assessment
- Severity classification
- Impact analysis
- Affected users

### 3. Containment
- Disable affected features
- Block malicious IPs
- Revoke compromised tokens

### 4. Remediation
- Deploy fix
- Notify users
- Document incident

### 5. Post-Mortem
- Root cause analysis
- Prevent recurrence
- Update procedures

## Contact

**Security Issues:** security@osi-cards.com
**Vulnerability Reports:** Use GitHub Security Advisories

---

**Last Updated:** December 3, 2025
**Next Review:** Weekly
**Owner:** Security Team

