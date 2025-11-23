#!/usr/bin/env node

/**
 * Generate package.json for the built library
 * This script creates a package.json file in dist/osi-cards/ with proper metadata
 */

const fs = require('fs');
const path = require('path');

const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const distPath = path.join(__dirname, '..', 'dist', 'osi-cards');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

const libraryPackageJson = {
  name: '@osi-cards/core',
  version: rootPackageJson.version || '0.0.1',
  description: 'OSI Cards - Angular component library for rendering AI-generated card interfaces',
  keywords: [
    'angular',
    'cards',
    'ui',
    'components',
    'ngrx',
    'ai'
  ],
  author: rootPackageJson.author || '',
  license: rootPackageJson.license || 'MIT',
  repository: rootPackageJson.repository || {},
  bugs: rootPackageJson.bugs || {},
  homepage: rootPackageJson.homepage || '',
  peerDependencies: {
    '@angular/core': '^17.0.0',
    '@angular/common': '^17.0.0',
    '@angular/forms': '^17.0.0',
    '@angular/router': '^17.0.0',
    '@angular/platform-browser': '^17.0.0',
    '@ngrx/store': '^17.0.0',
    '@ngrx/effects': '^17.0.0',
    '@ngrx/entity': '^17.0.0',
    'rxjs': '~7.8.0',
    'zone.js': '~0.14.0'
  },
  dependencies: {
    'lucide-angular': '^0.548.0',
    'lucide': '^0.548.0'
  },
  optionalDependencies: {
    'chart.js': '^4.4.0',
    'leaflet': '^1.9.4',
    'primeng': '^17.0.0'
  },
  main: './public-api.js',
  typings: './public-api.d.ts',
  sideEffects: false
};

fs.writeFileSync(
  path.join(distPath, 'package.json'),
  JSON.stringify(libraryPackageJson, null, 2),
  'utf8'
);

console.log('✅ Generated library package.json');



