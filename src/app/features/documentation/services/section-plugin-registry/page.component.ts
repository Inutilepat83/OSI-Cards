import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# SectionPluginRegistryService

Register and manage custom section plugins.

## Overview

\`SectionPluginRegistryService\` allows registration of custom section type renderers.

## Import

\`\`\`typescript
import { SectionPluginRegistryService, SectionPlugin } from 'osi-cards-lib';
\`\`\`

## Methods

### registerPlugin(plugin)

Register a custom section plugin.

\`\`\`typescript
const plugin: SectionPlugin = {
  type: 'custom-section',
  component: CustomSectionComponent,
  validator: (section) => !!section.title,
  transformer: (section) => ({
    ...section,
    meta: { ...section.meta, processed: true }
  })
};

registryService.registerPlugin(plugin);
\`\`\`

### getPlugin(type)

Get plugin by section type.

### hasPlugin(type)

Check if plugin exists.

### getAllPlugins()

Get all registered plugins.

## Plugin Interface

\`\`\`typescript
interface SectionPlugin {
  type: string;
  component: Type<any>;
  validator?: (section: CardSection) => boolean;
  transformer?: (section: CardSection) => CardSection;
}
\`\`\`
`;

@Component({
  selector: 'app-section-plugin-registry-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionPluginRegistryPageComponent {
  content = pageContent;
}

export default SectionPluginRegistryPageComponent;
