#!/usr/bin/env node

/**
 * Generate package.json for the built library
 * This script creates a package.json file in dist/osi-cards-lib/ with proper metadata
 */

const fs = require('fs');
const path = require('path');

const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const distPath = path.join(__dirname, '..', 'dist', 'osi-cards-lib');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Read the source library package.json to get the correct name and metadata
const libPackageJsonPath = path.join(__dirname, '..', 'projects', 'osi-cards-lib', 'package.json');
const libPackageJson = JSON.parse(fs.readFileSync(libPackageJsonPath, 'utf8'));

const libraryPackageJson = {
  name: libPackageJson.name || 'osi-cards-lib',
  version: libPackageJson.version || rootPackageJson.version || '1.0.0',
  description: libPackageJson.description || 'Standalone OSI Cards library for Angular applications',
  keywords: libPackageJson.keywords || [
    'angular',
    'cards',
    'ui',
    'components',
    'angular-20'
  ],
  author: libPackageJson.author || rootPackageJson.author || '',
  license: libPackageJson.license || rootPackageJson.license || 'MIT',
  repository: libPackageJson.repository || {
    type: 'git',
    url: 'git+https://github.com/Inutilepat83/OSI-Cards.git'
  },
  bugs: libPackageJson.bugs || {
    url: 'https://github.com/Inutilepat83/OSI-Cards/issues'
  },
  homepage: libPackageJson.homepage || 'https://github.com/Inutilepat83/OSI-Cards#readme',
  peerDependencies: {
    '@angular/core': '^18.0.0 || ^20.0.0',
    '@angular/common': '^18.0.0 || ^20.0.0',
    '@angular/forms': '^18.0.0 || ^20.0.0',
    '@angular/router': '^18.0.0 || ^20.0.0',
    '@angular/platform-browser': '^18.0.0 || ^20.0.0',
    '@ngrx/store': '^17.0.0 || ^18.0.0',
    '@ngrx/effects': '^17.0.0 || ^18.0.0',
    '@ngrx/entity': '^17.0.0 || ^18.0.0',
    'rxjs': '~7.8.0',
    'zone.js': '~0.14.0 || ~0.15.0'
  },
  dependencies: {
    'lucide-angular': '^0.548.0',
    'lucide': '^0.548.0',
    'tslib': '^2.3.0'
  },
  optionalDependencies: libPackageJson.optionalDependencies || {
    'chart.js': '^4.4.0',
    'leaflet': '^1.9.4'
  },
  exports: libPackageJson.exports || {
    './package.json': {
      default: './package.json'
    },
    '.': {
      types: './index.d.ts',
      esm2022: './esm2022/osi-cards-lib.mjs',
      esm: './esm2022/osi-cards-lib.mjs',
      default: './fesm2022/osi-cards-lib.mjs'
    },
    './styles/_styles': {
      default: './styles/_styles.scss'
    },
    './styles/_styles.scss': {
      default: './styles/_styles.scss'
    }
  },
  main: './fesm2022/osi-cards-lib.mjs',
  module: './fesm2022/osi-cards-lib.mjs',
  typings: './index.d.ts',
  sideEffects: false
};

fs.writeFileSync(
  path.join(distPath, 'package.json'),
  JSON.stringify(libraryPackageJson, null, 2),
  'utf8'
);

console.log('✅ Generated library package.json');






