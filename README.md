# OSI Cards

A modern, interactive card management and visualization system built with Angular 17+.

## 🎯 Overview

OSI Cards is a sophisticated Angular application that empowers users to create, customize, and display dynamic interactive cards with rich content sections. Built with modern web technologies and best practices, it offers a seamless experience for card-based data visualization and presentation.

### ✨ Key Features

- **Interactive Card Creation**: JSON-based configuration system for flexible card design
- **Rich Content Types**: Support for multiple section types:
  - 📊 Information sections with key-value pairs
  - 📈 Charts and analytics with Chart.js integration
  - 🗺️ Maps with Leaflet integration
  - 👥 Contact information
  - 📅 Events and scheduling
  - 🛍️ Products and solutions
  - 🌐 Network visualization
- **Real-time Preview**: Live preview with interactive 3D tilt effects
- **Accessibility**: Full ARIA support and keyboard navigation
- **Performance Optimized**: OnPush change detection and TrackBy functions
- **Type Safety**: Comprehensive TypeScript interfaces with runtime validation
- **Responsive Design**: Mobile-first responsive layout

## 🚀 Technology Stack

- **Framework**: Angular 17+ with standalone components
- **State Management**: NgRx for predictable state management
- **UI Components**: Angular Material & PrimeNG
- **Visualization**: Chart.js for charts, Leaflet for maps
- **Styling**: Tailwind CSS with custom design system
- **Language**: TypeScript with strict mode
- **Testing**: Jasmine & Karma for unit testing
- **Build**: Angular CLI with Webpack

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18.13+ or v20.9+)
- npm (v9+)
- Angular CLI (v17+)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd osi-cards

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200/`

### Available Scripts

```bash
# Development
npm start              # Start dev server with hot reload
npm run build          # Build for production
npm run watch          # Build and watch for changes

# Testing
npm test               # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate test coverage report

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors automatically
```

## 🏗️ Project Architecture

```
src/
├── app/
│   ├── core/                 # Core services and utilities
│   │   └── services/         # Application-wide services
│   ├── features/             # Feature modules
│   │   ├── cards/           # Card management feature
│   │   └── home/            # Home page feature
│   ├── models/              # TypeScript interfaces and types
│   ├── shared/              # Shared components and utilities
│   │   ├── components/      # Reusable components
│   │   └── services/        # Shared services
│   └── store/               # NgRx state management
│       └── cards/           # Cards state slice
├── assets/                  # Static assets
│   └── examples/           # Example card configurations
└── environments/           # Environment configurations
```

### Key Components

- **AICardRenderer**: Main card display component with 3D effects
- **HomePageComponent**: Card editor and preview interface
- **CardSections**: Specialized components for different content types
- **TiltWrapper**: 3D tilt effect implementation

## 📖 Usage Guide

### Creating a Card

1. **Select Card Type**: Choose from company, contact, opportunity, product, analytics, or event
2. **Choose Variant**: Pick from 3 pre-configured variants per type
3. **Edit JSON**: Customize the card configuration in real-time
4. **Preview**: See live updates with interactive effects

### Card Configuration Schema

```typescript
interface AICardConfig {
  cardTitle: string;
  cardType: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event';
  sections: CardSection[];
  actions?: CardAction[];
}
```

### Section Types

- **Info**: Key-value pairs with icons and styling
- **Chart**: Data visualization with Chart.js
- **Map**: Interactive maps with Leaflet
- **List**: Structured list items
- **Analytics**: Metrics and KPIs
- **Contact**: Contact information
- **Product**: Product showcase
- **Event**: Event details and scheduling

## 🔧 Development

### Code Quality Standards

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Enforced coding standards and best practices
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: OnPush change detection and optimized rendering
- **Testing**: Unit tests for all components and services

### State Management

The application uses NgRx for predictable state management:

- **Actions**: Defined in `store/cards/cards.actions.ts`
- **Reducers**: Card state management in `store/cards/cards.reducer.ts`
- **Selectors**: Optimized state selection
- **Effects**: Side effect management for async operations

### Adding New Section Types

1. Create section component in `features/cards/components/sections/`
2. Add section type to `CardSection` interface
3. Update `AICardRenderer` to handle new type
4. Add example configurations

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Component and service testing
- **Type Guards**: Runtime type validation testing
- **Utility Functions**: Helper function testing
- **Integration Tests**: Feature workflow testing

## 🚀 Deployment

### Production Build

```bash
npm run build
```

Builds the app for production to the `dist/` folder with optimizations:
- Tree shaking for smaller bundle sizes
- Dead code elimination
- Minification and compression
- Source maps for debugging

### Performance Optimizations

- OnPush change detection strategy
- TrackBy functions for ngFor loops
- Lazy loading for feature modules
- Image optimization and caching
- Bundle splitting and code splitting

## 📝 Migration Notes

This project was migrated from React/Vite to Angular. See `migration-plan.md` for detailed migration information, including:

- Architecture decisions
- Component mapping
- State management transition
- Performance improvements
- Breaking changes and adaptations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Angular style guide
- Write comprehensive tests
- Maintain accessibility standards
- Document complex functionality
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation
- Review example configurations in `/assets/examples/`
- Open an issue for bugs or feature requests
- Refer to the migration plan for architectural decisions
