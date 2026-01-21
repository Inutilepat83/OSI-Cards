/**
 * Contract Testing Utilities
 * Provides utilities for testing API contracts and service interfaces
 */

/**
 * Contract definition
 */
export interface Contract<TRequest = any, TResponse = any> {
  /** Contract name */
  name: string;
  /** Contract version */
  version: string;
  /** Request schema */
  request: ContractSchema;
  /** Response schema */
  response: ContractSchema;
  /** Examples */
  examples?: ContractExample<TRequest, TResponse>[];
}

/**
 * Contract schema (simplified JSON Schema)
 */
export interface ContractSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, ContractSchema>;
  items?: ContractSchema;
  required?: string[];
  enum?: any[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
}

/**
 * Contract example
 */
export interface ContractExample<TRequest = any, TResponse = any> {
  /** Example name */
  name: string;
  /** Example request */
  request: TRequest;
  /** Expected response */
  response: TResponse;
  /** Description */
  description?: string;
}

/**
 * Contract validation result
 */
export interface ContractValidationResult {
  /** Whether contract is valid */
  valid: boolean;
  /** Validation errors */
  errors: ContractError[];
}

/**
 * Contract error
 */
export interface ContractError {
  /** Error path */
  path: string;
  /** Error message */
  message: string;
  /** Expected value */
  expected?: any;
  /** Actual value */
  actual?: any;
}

/**
 * Contract validator
 */
export class ContractValidator {
  /**
   * Validate data against schema
   */
  public static validate(data: any, schema: ContractSchema, path: string = '$'): ContractError[] {
    const errors: ContractError[] = [];

    // Type validation
    const actualType = Array.isArray(data) ? 'array' : data === null ? 'null' : typeof data;

    if (actualType !== schema.type) {
      errors.push({
        path,
        message: `Type mismatch`,
        expected: schema.type,
        actual: actualType,
      });
      return errors; // Can't continue validation with wrong type
    }

    // Object validation
    if (schema.type === 'object' && schema.properties) {
      // Check required properties
      if (schema.required) {
        schema.required.forEach((prop) => {
          if (!(prop in data)) {
            errors.push({
              path: `${path}.${prop}`,
              message: 'Required property missing',
              expected: prop,
              actual: undefined,
            });
          }
        });
      }

      // Validate properties
      Object.entries(schema.properties).forEach(([prop, propSchema]) => {
        if (prop in data) {
          const propErrors = this.validate(data[prop], propSchema, `${path}.${prop}`);
          errors.push(...propErrors);
        }
      });
    }

    // Array validation
    if (schema.type === 'array' && schema.items && Array.isArray(data)) {
      data.forEach((item, index) => {
        const itemErrors = this.validate(item, schema.items!, `${path}[${index}]`);
        errors.push(...itemErrors);
      });
    }

    // String validation
    if (schema.type === 'string' && typeof data === 'string') {
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push({
            path,
            message: 'String does not match pattern',
            expected: schema.pattern,
            actual: data,
          });
        }
      }

      if (schema.enum && !schema.enum.includes(data)) {
        errors.push({
          path,
          message: 'Value not in enum',
          expected: schema.enum,
          actual: data,
        });
      }
    }

    // Number validation
    if (schema.type === 'number' && typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push({
          path,
          message: 'Number below minimum',
          expected: `>= ${schema.minimum}`,
          actual: data,
        });
      }

      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push({
          path,
          message: 'Number above maximum',
          expected: `<= ${schema.maximum}`,
          actual: data,
        });
      }
    }

    return errors;
  }

  /**
   * Validate contract
   */
  public static validateContract<TRequest, TResponse>(
    contract: Contract<TRequest, TResponse>,
    request: TRequest,
    response: TResponse
  ): ContractValidationResult {
    const errors: ContractError[] = [];

    // Validate request
    const requestErrors = this.validate(request, contract.request, '$.request');
    errors.push(...requestErrors);

    // Validate response
    const responseErrors = this.validate(response, contract.response, '$.response');
    errors.push(...responseErrors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Test contract examples
   */
  public static testExamples<TRequest, TResponse>(
    contract: Contract<TRequest, TResponse>
  ): ContractValidationResult[] {
    if (!contract.examples || contract.examples.length === 0) {
      return [];
    }

    return contract.examples.map((example) =>
      this.validateContract(contract, example.request, example.response)
    );
  }
}

/**
 * Card service contracts
 */
export class CardServiceContracts {
  /**
   * Get card contract
   */
  public static getCard(): Contract {
    return {
      name: 'GetCard',
      version: '1.0.0',
      request: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          cardTitle: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                title: { type: 'string' },
              },
            },
          },
        },
        required: ['cardTitle', 'sections'],
      },
      examples: [
        {
          name: 'Simple card',
          request: { id: 'card-123' },
          response: {
            id: 'card-123',
            cardTitle: 'Test Card',
            sections: [
              {
                type: 'info',
                title: 'Information',
                fields: [{ label: 'Name', value: 'Test' }],
              },
            ],
          },
        },
      ],
    };
  }

  /**
   * Create card contract
   */
  public static createCard(): Contract {
    return {
      name: 'CreateCard',
      version: '1.0.0',
      request: {
        type: 'object',
        properties: {
          cardTitle: { type: 'string' },
          sections: {
            type: 'array',
            items: { type: 'object' },
          },
        },
        required: ['cardTitle', 'sections'],
      },
      response: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          cardTitle: { type: 'string' },
          sections: { type: 'array' },
        },
        required: ['id', 'cardTitle', 'sections'],
      },
    };
  }

  /**
   * Update card contract
   */
  public static updateCard(): Contract {
    return {
      name: 'UpdateCard',
      version: '1.0.0',
      request: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          updates: { type: 'object' },
        },
        required: ['id', 'updates'],
      },
      response: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          cardTitle: { type: 'string' },
        },
        required: ['id'],
      },
    };
  }
}

/**
 * Usage example
 *
 * @example
 * ```typescript
 * import { ContractValidator, CardServiceContracts } from './';
 *
 * describe('Card Service Contracts', () => {
 *   it('should satisfy GetCard contract', () => {
 *     const contract = CardServiceContracts.getCard();
 *     const request = { id: 'card-123' };
 *     const response = service.getCard(request.id);
 *
 *     const result = ContractValidator.validateContract(
 *       contract,
 *       request,
 *       response
 *     );
 *
 *     expect(result.valid).toBe(true);
 *   });
 *
 *   it('should pass all contract examples', () => {
 *     const contract = CardServiceContracts.getCard();
 *     const results = ContractValidator.testExamples(contract);
 *
 *     results.forEach((result) => {
 *       expect(result.valid).toBe(true);
 *     });
 *   });
 * });
 * ```
 */
