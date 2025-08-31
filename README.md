# OSI Cards

A card management and visualization system built with Angular.

## Overview

OSI Cards is a modern Angular application that allows users to create, customize, and display interactive cards with various sections including:

- Information sections
- Charts and analytics
- Maps and geolocation data
- Contact information
- Events
- Products and solutions
- Network information

## Features

- Interactive card creation and editing
- JSON-based configuration system
- Real-time preview with 3D tilt effects
- Various card section types (Info, Chart, Map, etc.)
- Export functionality for saving card designs
- Responsive layout and design

## Technology Stack

- Angular 17+
- TypeScript
- Angular Material & PrimeNG UI components
- ChartJS for data visualization
- Leaflet for map integration
- RxJS for reactive programming

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)
- Angular CLI

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at http://localhost:4200/

## Project Structure

- `/angular-migration/src/app/components` - Angular components
- `/angular-migration/src/app/models` - TypeScript interfaces and models
- `/angular-migration/src/app/services` - Angular services
- `/angular-migration/src/app/styles` - Global CSS styles

## Development

This project uses Angular's standard development workflow:

```bash
# Run development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Migration

This project has been migrated from a React/Vite application to Angular. The migration plan and details can be found in the `migration-plan.md` file.
