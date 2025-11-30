import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# CardField

Defines a field within a section.

## Overview

\`CardField\` represents a single data point within a section. Fields typically display key-value pairs with optional metadata.

## Interface Definition

\`\`\`typescript
interface CardField {
  id?: string;
  label?: string;
  title?: string;
  value?: string | number | boolean | null;
  icon?: string;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  percentage?: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable' | 'neutral';
  performance?: string;
  description?: string;
  status?: 'completed' | 'in-progress' | 'pending' | 'cancelled' | 'active' | 'inactive' | 'warning';
  priority?: 'high' | 'medium' | 'low';
  email?: string;
  phone?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  meta?: Record<string, unknown>;
}
\`\`\`

## Common Properties

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Field label/key |
| \`value\` | mixed | Field value |
| \`icon\` | string | Icon (emoji or icon name) |
| \`trend\` | string | Trend indicator |
| \`percentage\` | number | Value for progress bars |
| \`format\` | string | Value formatting hint |

## Examples by Section Type

### Info Section
\`\`\`json
{ "label": "Industry", "value": "Technology", "icon": "🏢" }
\`\`\`

### Analytics Section
\`\`\`json
{ "label": "Growth", "value": "25%", "percentage": 25, "trend": "up", "change": 5.2 }
\`\`\`

### Contact Section
\`\`\`json
{ "title": "John Doe", "role": "CEO", "email": "john@example.com", "phone": "+1-555-0100" }
\`\`\`
`;

@Component({
  selector: 'app-card-field-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardFieldPageComponent {
  content = pageContent;
}

export default CardFieldPageComponent;
