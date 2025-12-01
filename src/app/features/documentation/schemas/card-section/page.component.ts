import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# CardSection

Defines a section within a card.

## Overview

\`CardSection\` represents a single section of content within a card. Each section has a type that determines how it renders.

## Interface Definition

\`\`\`typescript
interface CardSection {
  id?: string;
  title: string;
  type: SectionTypeInput;
  description?: string;
  subtitle?: string;
  columns?: number;
  colSpan?: number;
  preferredColumns?: 1 | 2 | 3 | 4;
  minColumns?: 1 | 2 | 3 | 4;
  maxColumns?: 1 | 2 | 3 | 4;
  orientation?: 'vertical' | 'horizontal' | 'auto';
  flexGrow?: boolean;
  canShrink?: boolean;
  canGrow?: boolean;
  layoutPriority?: LayoutPriority;
  priority?: 'critical' | 'important' | 'standard' | 'optional';
  sticky?: boolean;
  groupId?: string;
  columnAffinity?: number;
  collapsed?: boolean;
  emoji?: string;
  fields?: CardField[];
  items?: CardItem[];
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
  chartData?: ChartData;
  meta?: Record<string, unknown>;
}
\`\`\`

## Key Properties

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Section header title |
| \`type\` | SectionTypeInput | Section type (info, analytics, etc.) |
| \`fields\` | CardField[] | Key-value data for field-based sections |
| \`items\` | CardItem[] | List items for item-based sections |
| \`chartType\` | string | Chart type for chart sections |
| \`chartData\` | object | Data for chart rendering |

## Layout Properties

| Property | Description |
|----------|-------------|
| \`preferredColumns\` | Preferred width (1-4 columns) |
| \`minColumns\` | Minimum width constraint |
| \`maxColumns\` | Maximum width constraint |
| \`orientation\` | Content flow direction |
| \`layoutPriority\` | Priority for space-filling algorithm |

## Example

\`\`\`json
{
  "title": "Key Metrics",
  "type": "analytics",
  "description": "Performance indicators",
  "preferredColumns": 2,
  "fields": [
    { "label": "Revenue", "value": "$5M", "percentage": 75, "trend": "up" },
    { "label": "Growth", "value": "25%", "percentage": 25, "trend": "up" }
  ]
}
\`\`\`
`;

@Component({
  selector: 'app-card-section-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSectionPageComponent {
  content = pageContent;
}

export default CardSectionPageComponent;
