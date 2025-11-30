# OSICardsComponent

Single card wrapper component.

## Overview

`OSICardsComponent` is a convenience wrapper for rendering a single card with all features.

## Selector

```html
<osi-cards></osi-cards>
```

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| `config` | AICardConfig | Card configuration |
| `theme` | string | Theme preset |
| `interactive` | boolean | Enable interactions |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `event` | CardEvent | Any card event |

## Usage

```html
<osi-cards
  [config]="cardConfig"
  [theme]="'dark'"
  (event)="handleEvent($event)">
</osi-cards>
```
