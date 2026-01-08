# Services Documentation

OSI Cards provides a comprehensive set of services for managing cards, themes, events, and more.

## **Service Categories**

OSI Cards has 30+ services organized into clear categories:

### **1. Core Services**
- **CardFacadeService** - Unified API for all card operations
- **OSICardsStreamingService** - Real-time streaming updates
- **ThemeService** - Theme management and switching

### **2. Layout Services**
- **LayoutCalculationService** - Layout calculations and positioning
- **LayoutStateManager** - Layout state management

### **3. Rendering Services**
- **SectionRendererService** - Section rendering logic
- **SectionNormalizationService** - Section data normalization
- **IconService** - Icon management and rendering

### **4. Utility Services**
- **I18nService** - Internationalization
- **LoggerService** - Logging utilities
- **AccessibilityService** - Accessibility features
- **KeyboardShortcutsService** - Keyboard navigation

### **5. Infrastructure Services**
- **EventBusService** - Event bus for component communication
- **EventMiddlewareService** - Event middleware processing
- **LayoutWorkerService** - Web Worker for layout calculations

## **Core Services**

### **CardFacadeService**

Unified API for all card operations.

```typescript
import { CardFacadeService } from 'osi-cards-lib';

const cardFacade = inject(CardFacadeService);

// Create a card
const card = await cardFacade.createCard({
  title: 'My Card',
  sections: [/* ... */]
});

// Update a card
await cardFacade.updateCard(cardId, updates);

// Delete a card
await cardFacade.deleteCard(cardId);
```

### **ThemeService**

Theme management and switching.

```typescript
import { ThemeService } from 'osi-cards-lib';

const themeService = inject(ThemeService);

// Set theme
themeService.setTheme('night');

// Get current theme
const currentTheme = themeService.currentTheme$;

// Set custom properties
themeService.setCustomProperties({
  '--primary': '#FF7900'
});
```

### **EventMiddlewareService**

Event processing with middleware chain support.

```typescript
import { EventMiddlewareService } from 'osi-cards-lib';

const eventService = inject(EventMiddlewareService);

// Add middleware
const middleware = eventService.createLoggingMiddleware();
eventService.addMiddleware(middleware);

// Subscribe to events
eventService.processedEvents$.subscribe(event => {
  console.log('Event:', event);
});
```

## **Layout Services**

### **LayoutCalculationService**

Handles layout calculations and positioning.

```typescript
import { LayoutCalculationService } from 'osi-cards-lib';

const layoutService = inject(LayoutCalculationService);

// Calculate layout
const layout = layoutService.calculateLayout(sections);
```

### **LayoutStateManager**

Manages layout state.

```typescript
import { LayoutStateManager } from 'osi-cards-lib';

const layoutState = inject(LayoutStateManager);

// Get layout state
const state = layoutState.getState();

// Update layout state
layoutState.updateState(newState);
```

## **Rendering Services**

### **SectionRendererService**

Handles section rendering logic.

```typescript
import { SectionRendererService } from 'osi-cards-lib';

const renderer = inject(SectionRendererService);

// Render section
const rendered = renderer.render(sectionConfig);
```

### **IconService**

Icon management and rendering.

```typescript
import { IconService } from 'osi-cards-lib';

const iconService = inject(IconService);

// Get icon
const icon = iconService.getIcon('user');

// Register custom icon
iconService.registerIcon('custom', iconData);
```

## **Utility Services**

### **I18nService**

Internationalization support.

```typescript
import { I18nService } from 'osi-cards-lib';

const i18n = inject(I18nService);

// Translate
const text = i18n.translate('key');

// Set locale
i18n.setLocale('fr');
```

### **LoggerService**

Logging utilities.

```typescript
import { LoggerService } from 'osi-cards-lib';

const logger = inject(LoggerService);

// Log messages
logger.info('Message');
logger.warn('Warning');
logger.error('Error');
```

## **Additional Resources**

For detailed API documentation, see:
- [Architecture Services Documentation](../../docs/architecture/ARCHITECTURE_SERVICES.md)
- [Service API Reference](../docs/services/)
