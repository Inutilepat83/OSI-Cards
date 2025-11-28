#!/usr/bin/env node

/**
 * Generate ng-doc routes from page files
 * 
 * This script scans all .page.ts files and generates a routes.ts file
 * that ng-doc can use to render documentation pages.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'src', 'app', 'features', 'documentation');
const routesFile = path.join(docsDir, 'ng-doc.routes.ts');

/**
 * Find all page files recursively
 */
function findPageFiles(dir, basePath = '') {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findPageFiles(fullPath, relativePath));
    } else if (entry.name.endsWith('.page.ts')) {
      files.push({
        fullPath,
        relativePath: relativePath.replace(/\.page\.ts$/, ''),
        fileName: entry.name.replace(/\.page\.ts$/, '')
      });
    }
  }
  
  return files;
}

/**
 * Generate route path from file path
 * Removes duplicate directory names (e.g., 'best-practices/best-practices' -> 'best-practices')
 */
function generateRoutePath(filePath) {
  const parts = filePath
    .replace(/\\/g, '/')
    .split('/')
    .filter(p => p && p !== 'index');
  
  // Remove duplicate consecutive parts (e.g., 'best-practices/best-practices' -> 'best-practices')
  const uniqueParts = [];
  for (let i = 0; i < parts.length; i++) {
    if (i === 0 || parts[i] !== parts[i - 1]) {
      uniqueParts.push(parts[i]);
    }
  }
  
  return uniqueParts.join('/');
}

/**
 * Generate route name from file name
 */
function generateRouteName(fileName) {
  return fileName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'Page';
}

/**
 * Generate routes file
 */
function generateRoutes() {
  const pageFiles = findPageFiles(docsDir);
  
  // Group by directory structure
  const routes = [];
  const routeMap = new Map();
  
  // Process each page file
  for (const file of pageFiles) {
    const routePath = generateRoutePath(file.relativePath);
    const routeName = generateRouteName(file.fileName);
    const importPath = `./${file.relativePath.replace(/\\/g, '/')}.page`;
    
    // Skip wrapper and routes files
    if (file.fileName === 'docs-wrapper' || file.fileName === 'docs' || file.fileName === 'ng-doc') {
      continue;
    }
    
    const route = {
      path: routePath || 'getting-started',
      importPath,
      routeName,
      file: file // Keep reference to file for later use
    };
    
    // Organize by category
    const parts = routePath.split('/').filter(p => p);
    if (parts.length > 1) {
      const category = parts[0];
      if (!routeMap.has(category)) {
        routeMap.set(category, []);
      }
      // Use just the filename as the path, not the full relative path
      const childPath = parts[parts.length - 1];
      routeMap.get(category).push({
        ...route,
        path: childPath
      });
    } else {
      routes.push(route);
    }
  }
  
  // Generate TypeScript routes file
  let routesCode = `import { Routes } from '@angular/router';

/**
 * Ng-doc routes
 * Auto-generated from page files
 * This file is generated automatically - do not edit manually
 */

export const NG_DOC_ROUTING: Routes = [
`;
  
  // Add redirect for root docs path - redirect to 'getting-started' if available
  const gettingStartedRoute = routes.find(r => r.path === 'getting-started');
  const defaultRoute = gettingStartedRoute || routes[0];
  if (defaultRoute) {
    routesCode += `  {
    path: '',
    redirectTo: '${defaultRoute.path}',
    pathMatch: 'full'
  },
`;
  }
  
  // Add top-level routes (direct routes, no children)
  for (const route of routes) {
      // Fix path - remove duplicate directory names (e.g., 'best-practices/best-practices' -> 'best-practices')
      let cleanPath = route.file.relativePath.replace(/\\/g, '/');
      // Remove duplicate consecutive directory names
      const parts = cleanPath.split('/');
      const uniqueParts = [];
      for (let i = 0; i < parts.length; i++) {
        if (i === 0 || parts[i] !== parts[i - 1]) {
          uniqueParts.push(parts[i]);
        }
      }
      cleanPath = uniqueParts.join('/');
      const pageComponentPath = `./${cleanPath}/page.component`;
      routesCode += `  {
    path: '${route.path}',
    loadComponent: () => import('${pageComponentPath}').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
  },
`;
  }
  
  // Add category routes
  for (const [category, categoryRoutes] of routeMap.entries()) {
    if (categoryRoutes.length === 0) continue;
    
    routesCode += `  {
    path: '${category}',
    children: [
      {
        path: '',
        redirectTo: '${categoryRoutes[0].path}',
        pathMatch: 'full'
      },
`;
      for (const route of categoryRoutes) {
      // Fix path - remove duplicate directory names
      let cleanPath = route.file.relativePath.replace(/\\/g, '/');
      // Remove duplicate consecutive directory names
      const parts = cleanPath.split('/');
      const uniqueParts = [];
      for (let i = 0; i < parts.length; i++) {
        if (i === 0 || parts[i] !== parts[i - 1]) {
          uniqueParts.push(parts[i]);
        }
      }
      cleanPath = uniqueParts.join('/');
      // Use ./ not ../ since ng-doc.routes.ts is in the documentation directory
      const pageComponentPath = `./${cleanPath}/page.component`;
      routesCode += `      {
        path: '${route.path}',
        loadComponent: () => import('${pageComponentPath}').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
`;
    }
    routesCode += `    ]
  },
`;
  }
  
  routesCode += `];
`;
  
  // Write routes file
  fs.writeFileSync(routesFile, routesCode, 'utf8');
  console.log(`✅ Generated ng-doc routes: ${routesFile}`);
  console.log(`   Found ${pageFiles.length} page files`);
}

// Generate routes
try {
  generateRoutes();
  console.log('✅ Ng-doc routes generation complete');
} catch (error) {
  console.error('❌ Error generating ng-doc routes:', error);
  process.exit(1);
}

