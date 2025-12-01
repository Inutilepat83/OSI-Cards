# OpenAPI/Swagger Documentation

This document describes the OpenAPI/Swagger specification for the OSI Cards Library.

## Overview

The OSI Cards Library uses OpenAPI 3.1.0 specification to document:

- Card configuration schemas
- Component APIs and interfaces
- Service interfaces
- Event schemas

## Specification Location

The OpenAPI specification is located at:

- **YAML Format**: `docs/openapi.yaml`
- **JSON Format**: `docs/openapi.json` (generated)

## Viewing the Documentation

### Online Viewers

1. **Swagger Editor**:
   - Open https://editor.swagger.io/
   - Import the `docs/openapi.yaml` file

2. **Swagger UI**:
   - Use any Swagger UI instance
   - Point it to `docs/openapi.yaml`

3. **Redoc**:
   - Use Redoc to generate beautiful documentation
   - `npx @redocly/cli preview-docs docs/openapi.yaml`

### Local Development

Generate and serve the documentation:

```bash
# Validate OpenAPI spec
npm run docs:openapi:validate

# Generate documentation
npm run docs:openapi

# Serve with Swagger UI (if installed)
npx swagger-ui-serve docs/openapi.yaml
```

## API Structure

### Card Configuration API

The main API is the card configuration schema (`AICardConfig`), which defines:

- Card metadata (title, subtitle, type)
- Sections array (required)
- Actions array (optional)
- Layout configuration

### Section Types

All supported section types are documented:

- `info` - Key-value pairs
- `list` - Item lists
- `chart` - Data visualization
- `analytics` - Metrics and KPIs
- `contact-card` - Contact information
- `network-card` - Network connections
- `map` - Geographic data
- `financials` - Financial information
- And more...

### Service Interfaces

Service interfaces are documented as TypeScript interfaces:

- `CardDataProvider` - Abstract provider interface
- `CardDataService` - Main data service
- `ValidationService` - Card validation
- And other core services

## Endpoints

The OpenAPI spec documents conceptual endpoints for:

- `/cards` - Get all cards, create card
- `/cards/{id}` - Get card by ID
- `/cards/validate` - Validate card configuration

**Note**: These are conceptual endpoints representing the programmatic API.
In practice, OSI Cards is a frontend library that works with JSON configurations
rather than REST endpoints.

## Schema Definitions

### AICardConfig

The root schema representing a complete card configuration.

**Required Fields:**

- `cardTitle` (string) - Main title
- `sections` (array) - Array of CardSection objects

**Optional Fields:**

- `id` - Unique identifier
- `cardSubtitle` - Subtitle
- `cardType` - Type categorization
- `columns` - Layout columns (1, 2, or 3)
- `actions` - Action buttons
- `meta` - Additional metadata

### CardSection

Represents a section within a card.

**Required Fields:**

- `title` (string) - Section title
- `type` (string) - Section type identifier

**Optional Fields:**

- `fields` - Array of CardField objects
- `items` - Array of CardItem objects
- `description` - Section description
- `chartType` - For chart sections
- `chartData` - Chart data configuration

### CardField

Represents a field within a section.

**Common Properties:**

- `label` - Field label
- `value` - Field value (string, number, boolean, or null)
- `format` - Value format (currency, percentage, number, text)
- `trend` - Trend indicator (up, down, stable, neutral)
- `change` - Change percentage

### CardAction

Represents an action button on a card.

**Types:**

- `mail` - Email action (requires EmailConfig)
- `website` - URL navigation (requires url)
- `agent` - Agent action (triggers agentAction event)
- `question` - Question action (triggers questionAction event)

## Validation

### Card Configuration Validation

Cards can be validated using the ValidationService or the `/cards/validate` endpoint:

```typescript
import { ValidationService } from 'osi-cards-lib';

const validationService = inject(ValidationService);
const result = validationService.validateCard(cardConfig);

if (result.isValid) {
  console.log('Card is valid');
} else {
  console.error('Validation errors:', result.errors);
}
```

### Schema Validation

The OpenAPI schema can be used with validation tools:

- JSON Schema validators
- Ajv (Another JSON Schema Validator)
- Zod (TypeScript-first schema validation)

## Examples

### Example Card Configuration

```yaml
cardTitle: 'Company Overview'
cardSubtitle: 'Q4 2024'
cardType: 'company'
columns: 2
sections:
  - type: 'info'
    title: 'Company Information'
    fields:
      - label: 'Industry'
        value: 'Technology'
      - label: 'Founded'
        value: '2010'
  - type: 'analytics'
    title: 'Key Metrics'
    fields:
      - label: 'Revenue'
        value: 1250000
        format: 'currency'
        trend: 'up'
        change: 15.5
actions:
  - label: 'Contact'
    type: 'mail'
    email:
      contact:
        name: 'Support'
        email: 'support@example.com'
        role: 'Support Team'
      subject: 'Inquiry'
      body: 'Hello, I would like to inquire about...'
```

## Integration

### Using with Code Generators

The OpenAPI specification can be used to generate:

- TypeScript types
- Client SDKs
- API documentation
- Mock servers

### Tools

- **OpenAPI Generator**: Generate clients in various languages
- **Swagger Codegen**: Legacy code generation tool
- **TypeScript OpenAPI Generator**: TypeScript-specific generators

## Versioning

The OpenAPI specification version matches the library version:

- Current version: 1.2.2
- OpenAPI version: 3.1.0

## Contributing

When adding new features:

1. Update `docs/openapi.yaml` with new schemas
2. Add examples for new section types
3. Update this documentation
4. Run validation: `npm run docs:openapi:validate`

## Resources

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)
- [Swagger Editor](https://editor.swagger.io/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [JSON Schema](https://json-schema.org/)



