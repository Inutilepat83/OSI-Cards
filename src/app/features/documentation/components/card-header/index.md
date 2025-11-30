# CardHeaderComponent

Card title and header section.

## Overview

`CardHeaderComponent` renders the card header with title, subtitle, and optional actions.

## Selector

```html
<app-card-header></app-card-header>
```

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| `title` | string | Card title |
| `subtitle` | string | Optional subtitle |
| `icon` | string | Header icon |
| `collapsible` | boolean | Enable collapse |
| `collapsed` | boolean | Collapsed state |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `toggleCollapse` | boolean | Collapse toggled |
| `headerClick` | void | Header clicked |

## Usage

```html
<app-card-header
  [title]="card.cardTitle"
  [subtitle]="card.description"
  [collapsible]="true"
  (toggleCollapse)="onToggle($event)">
</app-card-header>
```
