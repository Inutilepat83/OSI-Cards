# Core Module

This directory contains core functionality that is used across the entire application.

## Structure

```
core/
├── guards/          # Route guards for navigation protection
├── interceptors/    # HTTP interceptors for requests/responses
├── resolvers/       # Route resolvers for data preloading
├── services/        # Core services (data, performance, etc.)
├── strategies/      # Strategy patterns (preloading, etc.)
└── tokens/          # Dependency injection tokens
```

## Services

### Card Data Service
- **Interface**: `ICardDataService`
- **Implementation**: `CardDataService`
- **Purpose**: Manages card data operations and provider switching
- **Token**: `CARD_DATA_PROVIDER` (for providers), `CARD_DATA_SERVICE` (for service)

### Performance Service
- **Interface**: `IPerformanceService`
- **Implementation**: `PerformanceService`
- **Purpose**: Tracks and monitors application performance metrics
- **Token**: `PERFORMANCE_SERVICE`

## Guards

### cardExistsGuard
- **Purpose**: Ensures a card exists before navigating to its detail page
- **Usage**: `canActivate: [cardExistsGuard]`
- **Redirects**: To home if card not found

## Resolvers

### cardResolver
- **Purpose**: Preloads card data before route activation
- **Usage**: `resolve: { card: cardResolver }`
- **Returns**: `Observable<AICardConfig | null>`

## Interceptors

### HttpCacheInterceptor
- **Purpose**: Caches HTTP responses for card configs
- **TTL**: 5 minutes
- **Scope**: Only `/assets/configs/` requests

### ErrorInterceptor
- **Purpose**: Handles HTTP errors globally
- **Features**: Error logging, user notifications

## Best Practices

1. **Use Interfaces**: Always use service interfaces for better testability
2. **Injection Tokens**: Use tokens for services that might be swapped
3. **Guards**: Use guards to protect routes and ensure data availability
4. **Resolvers**: Use resolvers to preload data before component initialization
5. **Interceptors**: Keep interceptors focused on single responsibilities

