import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# SectionRendererComponent

Dynamic section type renderer.

## Overview

\`SectionRendererComponent\` renders individual sections based on their type. It uses a strategy pattern to select the appropriate section component.

## Selector

\`\`\`html
<app-section-renderer></app-section-renderer>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`section\` | CardSection | Section to render |
| \`cardTitle\` | string | Parent card title |
| \`columns\` | number | Column count |
| \`isStreaming\` | boolean | Streaming mode |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`sectionEvent\` | SectionRenderEvent | Section events |

## Usage

\`\`\`html
<app-section-renderer
  [section]="section"
  [columns]="2"
  (sectionEvent)="onEvent($event)">
</app-section-renderer>
\`\`\`

## Section Type Resolution

The component resolves section types and renders:

| Type | Component |
|------|-----------|
| \`analytics\` | AnalyticsSectionComponent |
| \`list\` | ListSectionComponent |
| \`chart\` | ChartSectionComponent |
| (unknown) | OverviewSectionComponent |
`;

@Component({
  selector: 'app-section-renderer-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionRendererPageComponent {
  content = pageContent;
}

export default SectionRendererPageComponent;
