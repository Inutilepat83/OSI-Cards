# SectionUtilsService

Utility functions for section manipulation.

## Overview

`SectionUtilsService` provides helper functions for working with sections.

## Import

```typescript
import { SectionUtilsService } from 'osi-cards-lib';
```

## Methods

### getSectionIcon(section)

Get appropriate icon for section type.

```typescript
const icon = utils.getSectionIcon(section);
// Returns emoji or icon name based on type
```

### getSectionColor(section)

Get theme color for section type.

### getFieldCount(section)

Count fields in section.

### getItemCount(section)

Count items in section.

### isCollapsible(section)

Check if section supports collapsing.

### isEmpty(section)

Check if section has no content.

```typescript
if (utils.isEmpty(section)) {
  // Hide or show placeholder
}
```

### mergeSections(sections)

Merge multiple sections of same type.

### sortByPriority(sections)

Sort sections by priority.

```typescript
const sorted = utils.sortByPriority(sections);
// critical > important > standard > optional
```

## Type Helpers

```typescript
// Check section type
utils.isFieldBased(section);  // info, analytics, etc.
utils.isItemBased(section);   // list, news, etc.
utils.isChartBased(section);  // chart
utils.isMapBased(section);    // map
```
