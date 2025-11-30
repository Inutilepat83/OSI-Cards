# CardSkeletonComponent

Loading skeleton for cards.

## Overview

`CardSkeletonComponent` displays placeholder skeletons while cards are loading.

## Selector

```html
<app-card-skeleton></app-card-skeleton>
```

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| `sections` | number | Number of skeleton sections |
| `animated` | boolean | Enable shimmer animation |
| `height` | string | Card height |

## Usage

```html
@if (isLoading) {
  <app-card-skeleton [sections]="3" [animated]="true">
  </app-card-skeleton>
} @else {
  <app-ai-card-renderer [cardConfig]="card">
  </app-ai-card-renderer>
}
```

## Styling

```css
app-card-skeleton {
  --skeleton-bg: #e0e0e0;
  --skeleton-highlight: #f0f0f0;
  --skeleton-animation-duration: 1.5s;
}
```
