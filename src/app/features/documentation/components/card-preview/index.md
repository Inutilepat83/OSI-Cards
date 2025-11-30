# CardPreviewComponent

Compact card preview.

## Overview

`CardPreviewComponent` shows a compact preview of a card for lists or thumbnails.

## Selector

```html
<app-card-preview></app-card-preview>
```

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| `card` | AICardConfig | Card to preview |
| `showSections` | number | Sections to show |
| `maxHeight` | string | Maximum height |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `select` | AICardConfig | Card selected |

## Usage

```html
<app-card-preview
  [card]="card"
  [showSections]="2"
  (select)="openCard($event)">
</app-card-preview>
```
