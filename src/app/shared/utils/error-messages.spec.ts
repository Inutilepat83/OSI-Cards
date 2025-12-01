import { ErrorMessages } from './error-messages';

describe('ErrorMessages', () => {
  describe('get', () => {
    it('should return error message for valid key', () => {
      const error = ErrorMessages.get('NETWORK_ERROR');
      
      expect(error).toBeDefined();
      expect(error.code).toBe('NET-001');
      expect(error.message).toContain('network error');
      expect(error.suggestions).toBeDefined();
      expect(Array.isArray(error.suggestions)).toBe(true);
    });

    it('should return UNKNOWN_ERROR for invalid key', () => {
      const error = ErrorMessages.get('INVALID_KEY' as any);
      
      expect(error).toBeDefined();
      expect(error.code).toBe('GEN-001');
      expect(error.message).toContain('unexpected error');
    });

    it('should return UNKNOWN_ERROR for non-existent key', () => {
      const error = ErrorMessages.get('NON_EXISTENT' as any);
      
      expect(error).toBeDefined();
      expect(error.code).toBe('GEN-001');
    });
  });

  describe('error messages', () => {
    it('should have NETWORK_ERROR with correct structure', () => {
      const error = ErrorMessages.NETWORK_ERROR;
      
      expect(error.code).toBe('NET-001');
      expect(error.message).toBeTruthy();
      expect(error.suggestions).toBeTruthy();
      expect(error.suggestions.length).toBeGreaterThan(0);
    });

    it('should have API_UNAVAILABLE with correct structure', () => {
      const error = ErrorMessages.API_UNAVAILABLE;
      
      expect(error.code).toBe('API-001');
      expect(error.message).toBeTruthy();
      expect(error.suggestions).toBeTruthy();
    });

    it('should have VALIDATION_FAILED with correct structure', () => {
      const error = ErrorMessages.VALIDATION_FAILED;
      
      expect(error.code).toBe('VAL-001');
      expect(error.message).toBeTruthy();
      expect(error.suggestions).toBeTruthy();
    });

    it('should have UNAUTHORIZED_ACCESS with correct structure', () => {
      const error = ErrorMessages.UNAUTHORIZED_ACCESS;
      
      expect(error.code).toBe('AUTH-001');
      expect(error.message).toBeTruthy();
      expect(error.suggestions).toBeTruthy();
    });

    it('should have CARD_LOAD_FAILED with correct structure', () => {
      const error = ErrorMessages.CARD_LOAD_FAILED;
      
      expect(error.code).toBe('CARD-001');
      expect(error.message).toBeTruthy();
      expect(error.suggestions).toBeTruthy();
    });

    it('should have UNKNOWN_ERROR with correct structure', () => {
      const error = ErrorMessages.UNKNOWN_ERROR;
      
      expect(error.code).toBe('GEN-001');
      expect(error.message).toBeTruthy();
      expect(error.suggestions).toBeTruthy();
    });
  });
});











