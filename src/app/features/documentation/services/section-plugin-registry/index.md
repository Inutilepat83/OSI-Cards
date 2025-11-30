# SectionPluginRegistryService

Register and manage custom section plugins.

## Overview

`SectionPluginRegistryService` allows registration of custom section type renderers.

## Import

```typescript
import { SectionPluginRegistryService, SectionPlugin } from 'osi-cards-lib';
```

## Methods

### registerPlugin(plugin)

Register a custom section plugin.

```typescript
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
```

### getPlugin(type)

Get plugin by section type.

### hasPlugin(type)

Check if plugin exists.

### getAllPlugins()

Get all registered plugins.

## Plugin Interface

```typescript
interface SectionPlugin {
  type: string;
  component: Type<any>;
  validator?: (section: CardSection) => boolean;
  transformer?: (section: CardSection) => CardSection;
}
```
