import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# WebSocket Integration

Documentation for WebSocket Integration.

## Overview

This section covers websocket integration.

## Details

Content coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-websocket-integration-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsocketIntegrationPageComponent {
  content = pageContent;
}

export default WebsocketIntegrationPageComponent;
