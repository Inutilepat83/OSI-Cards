/**
 * Contract testing utilities
 * Implement contract tests for API interactions
 */

export interface ApiContract {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
  statusCode?: number;
}

/**
 * Validate request against contract
 */
export function validateRequestContract(request: any, contract: ApiContract): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (contract.requestSchema) {
    // Simple schema validation (for production, use a library like ajv)
    for (const [key, schema] of Object.entries(contract.requestSchema)) {
      if (schema.required && !(key in request)) {
        errors.push(`Missing required field: ${key}`);
      }
      if (key in request && schema.type && typeof request[key] !== schema.type) {
        errors.push(`Field ${key} must be of type ${schema.type}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate response against contract
 */
export function validateResponseContract(response: any, contract: ApiContract): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (contract.responseSchema) {
    // Simple schema validation
    for (const [key, schema] of Object.entries(contract.responseSchema)) {
      if (schema.required && !(key in response)) {
        errors.push(`Missing required field in response: ${key}`);
      }
      if (key in response && schema.type && typeof response[key] !== schema.type) {
        errors.push(`Response field ${key} must be of type ${schema.type}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}


