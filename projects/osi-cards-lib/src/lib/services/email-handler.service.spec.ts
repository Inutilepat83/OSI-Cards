import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { EmailHandlerService } from './email-handler.service';
import { MailCardAction, CardAction } from '../models';

describe('EmailHandlerService', () => {
  let service: EmailHandlerService;

  const validMailAction: MailCardAction = {
    type: 'mail',
    label: 'Send Email',
    email: {
      contact: {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Manager',
      },
      subject: 'Test Subject',
      body: 'Test Body',
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmailHandlerService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(EmailHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // buildMailtoUrl Tests
  // ============================================================================
  describe('buildMailtoUrl', () => {
    it('should build mailto URL from valid action', () => {
      const result = service.buildMailtoUrl(validMailAction);

      expect(result.success).toBe(true);
      expect(result.url).toContain('mailto:john%40example.com');
      expect(result.url).toContain('subject=Test%20Subject');
      expect(result.url).toContain('body=Test%20Body');
    });

    it('should include CC recipients', () => {
      const result = service.buildMailtoUrl(validMailAction);

      expect(result.url).toContain('cc=cc%40example.com');
    });

    it('should include BCC recipients', () => {
      const result = service.buildMailtoUrl(validMailAction);

      expect(result.url).toContain('bcc=bcc%40example.com');
    });

    it('should fail for invalid email', () => {
      const invalidAction: MailCardAction = {
        ...validMailAction,
        email: {
          ...validMailAction.email,
          contact: {
            ...validMailAction.email.contact,
            email: 'invalid-email',
          },
        },
      };

      const result = service.buildMailtoUrl(invalidAction);

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    it('should filter invalid CC emails', () => {
      const action: MailCardAction = {
        ...validMailAction,
        email: {
          ...validMailAction.email,
          cc: ['valid@example.com', 'invalid', 'also-valid@test.org'],
        },
      };

      const result = service.buildMailtoUrl(action);

      expect(result.success).toBe(true);
      expect(result.url).toContain('valid%40example.com');
      expect(result.url).toContain('also-valid%40test.org');
      expect(result.url).not.toContain('invalid');
    });

    it('should handle action without CC/BCC', () => {
      const simpleAction: MailCardAction = {
        type: 'mail',
        label: 'Email',
        email: {
          contact: {
            name: 'Jane',
            email: 'jane@example.com',
            role: 'Developer',
          },
          subject: 'Hi',
          body: 'Hello',
        },
      };

      const result = service.buildMailtoUrl(simpleAction);

      expect(result.success).toBe(true);
      expect(result.url).not.toContain('cc=');
      expect(result.url).not.toContain('bcc=');
    });
  });

  // ============================================================================
  // Placeholder Tests
  // ============================================================================
  describe('placeholders', () => {
    it('should replace placeholders in subject', () => {
      const action: MailCardAction = {
        ...validMailAction,
        email: {
          ...validMailAction.email,
          subject: 'Hello {{userName}}',
        },
      };

      const result = service.buildMailtoUrl(action, { userName: 'Alice' });

      expect(result.url).toContain('Hello%20Alice');
    });

    it('should replace placeholders in body', () => {
      const action: MailCardAction = {
        ...validMailAction,
        email: {
          ...validMailAction.email,
          body: 'Dear {{userName}}, your company {{companyName}}',
        },
      };

      const result = service.buildMailtoUrl(action, {
        userName: 'Bob',
        companyName: 'Acme Corp',
      });

      expect(result.url).toContain('Dear%20Bob');
      expect(result.url).toContain('Acme%20Corp');
    });

    it('should use default placeholders', () => {
      service.setDefaultPlaceholders({ userName: 'DefaultUser' });

      const action: MailCardAction = {
        ...validMailAction,
        email: {
          ...validMailAction.email,
          subject: 'Hello {{userName}}',
        },
      };

      const result = service.buildMailtoUrl(action);

      expect(result.url).toContain('Hello%20DefaultUser');
    });

    it('should override default placeholders', () => {
      service.setDefaultPlaceholders({ userName: 'DefaultUser' });

      const action: MailCardAction = {
        ...validMailAction,
        email: {
          ...validMailAction.email,
          subject: 'Hello {{userName}}',
        },
      };

      const result = service.buildMailtoUrl(action, { userName: 'OverrideUser' });

      expect(result.url).toContain('Hello%20OverrideUser');
    });

    it('should keep unmatched placeholders', () => {
      const result = service.replacePlaceholders('Hello {{unknown}}');
      expect(result).toBe('Hello {{unknown}}');
    });

    it('should clear placeholders', () => {
      service.setDefaultPlaceholders({ userName: 'Test' });
      service.clearPlaceholders();

      const result = service.replacePlaceholders('Hello {{userName}}');
      expect(result).toBe('Hello {{userName}}');
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================
  describe('validateMailAction', () => {
    it('should validate valid mail action', () => {
      const result = service.validateMailAction(validMailAction);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail for null action', () => {
      const result = service.validateMailAction(null as unknown as CardAction);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Action is required');
    });

    it('should fail for non-mail action', () => {
      const action: CardAction = {
        type: 'website',
        label: 'Visit',
      };

      const result = service.validateMailAction(action);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('mail'))).toBe(true);
    });

    it('should fail for missing email config', () => {
      const action = {
        type: 'mail',
        label: 'Email',
      } as CardAction;

      const result = service.validateMailAction(action);

      expect(result.valid).toBe(false);
    });

    it('should fail for invalid contact email', () => {
      const action: MailCardAction = {
        ...validMailAction,
        email: {
          ...validMailAction.email,
          contact: {
            name: 'Test',
            email: 'not-an-email',
            role: 'Tester',
          },
        },
      };

      const result = service.validateMailAction(action);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid'))).toBe(true);
    });

    it('should report invalid CC emails', () => {
      const action: MailCardAction = {
        ...validMailAction,
        email: {
          ...validMailAction.email,
          cc: ['valid@test.com', 'invalid-cc'],
        },
      };

      const result = service.validateMailAction(action);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('CC'))).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should validate valid emails', () => {
      expect(service.isValidEmail('test@example.com')).toBe(true);
      expect(service.isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(service.isValidEmail('invalid')).toBe(false);
      expect(service.isValidEmail('@test.com')).toBe(false);
      expect(service.isValidEmail('test@')).toBe(false);
    });
  });

  // ============================================================================
  // buildMailtoFromConfig Tests
  // ============================================================================
  describe('buildMailtoFromConfig', () => {
    it('should build URL from config', () => {
      const url = service.buildMailtoFromConfig({
        to: 'test@example.com',
        subject: 'Hello',
        body: 'World',
      });

      expect(url).toContain('mailto:test%40example.com');
      expect(url).toContain('subject=Hello');
      expect(url).toContain('body=World');
    });

    it('should handle multiple CC recipients', () => {
      const url = service.buildMailtoFromConfig({
        to: 'test@example.com',
        cc: ['cc1@test.com', 'cc2@test.com'],
      });

      expect(url).toContain('cc=');
      expect(url).toContain('cc1%40test.com');
      expect(url).toContain('cc2%40test.com');
    });
  });

  // ============================================================================
  // executeMailAction Tests (limited in test environment)
  // ============================================================================
  describe('executeMailAction', () => {
    it('should return false for invalid action', () => {
      const action: CardAction = {
        type: 'website',
        label: 'Not email',
      };

      const result = service.executeMailAction(action);

      expect(result).toBe(false);
    });
  });
});



