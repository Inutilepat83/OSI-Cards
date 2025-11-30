# Type Aliases & Enums

Reference for all type aliases and enums in OSI Cards.

## Card Types

```typescript
type CardType = 'all' | 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event' | 'project' | 'sko';
```

## Section Types

```typescript
type SectionType = 
  | 'info' | 'analytics' | 'contact-card' | 'network-card' 
  | 'map' | 'financials' | 'event' | 'list' | 'chart' 
  | 'product' | 'solutions' | 'overview' | 'quotation' 
  | 'text-reference' | 'brand-colors' | 'news' | 'social-media' 
  | 'fallback';
```

## Type Aliases (Backwards Compatibility)

| Alias | Resolves To |
|-------|-------------|
| `metrics` | analytics |
| `stats` | analytics |
| `timeline` | event |
| `table` | list |
| `locations` | map |
| `quote` | quotation |
| `reference` | text-reference |
| `text-ref` | text-reference |
| `brands` | brand-colors |
| `colors` | brand-colors |
| `project` | info |

## Layout Priority

```typescript
type LayoutPriority = 1 | 2 | 3;
// 1 = Highest (placed first)
// 2 = Medium
// 3 = Lowest (placed last)
```

## Trend Indicators

```typescript
type Trend = 'up' | 'down' | 'stable' | 'neutral';
```

## Status Values

```typescript
type FieldStatus = 'completed' | 'in-progress' | 'pending' | 'cancelled' | 'active' | 'inactive' | 'warning';
type Priority = 'high' | 'medium' | 'low';
type Performance = 'excellent' | 'good' | 'average' | 'poor';
```

## Button Variants

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
```

## Chart Types

```typescript
type ChartType = 'bar' | 'line' | 'pie' | 'doughnut';
```
