#!/usr/bin/env node

/**
 * Generate All Routes for ng-doc Documentation
 * 
 * Scans documentation directory and generates complete routes file.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'src', 'app', 'features', 'documentation');
const ROUTES_FILE = path.join(DOCS_DIR, 'ng-doc.routes.ts');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

/**
 * Find all categories and pages
 */
function scanDocumentation() {
  const structure = {
    rootPages: [],
    categories: []
  };
  
  const entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const dirPath = path.join(DOCS_DIR, entry.name);
    const categoryFile = path.join(dirPath, 'ng-doc.category.ts');
    const pageFile = findPageFile(dirPath);
    
    // Check if it's a category (has ng-doc.category.ts)
    if (fs.existsSync(categoryFile)) {
      // It's a category with sub-pages
      const pages = scanCategoryPages(dirPath);
      if (pages.length > 0) {
        structure.categories.push({
          name: entry.name,
          path: entry.name,
          pages
        });
      }
    } else if (pageFile) {
      // It's a root-level page
      structure.rootPages.push({
        name: entry.name,
        path: entry.name
      });
    }
  }
  
  return structure;
}

/**
 * Find page file in directory
 */
function findPageFile(dir) {
  const entries = fs.readdirSync(dir);
  return entries.find(e => e.endsWith('.page.ts') && !e.includes('ng-doc'));
}

/**
 * Scan pages in a category
 */
function scanCategoryPages(categoryDir) {
  const pages = [];
  const entries = fs.readdirSync(categoryDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const pageDir = path.join(categoryDir, entry.name);
    const hasPage = fs.readdirSync(pageDir).some(f => f.endsWith('.page.ts'));
    
    if (hasPage) {
      pages.push({
        name: entry.name,
        path: entry.name
      });
    }
  }
  
  return pages;
}

/**
 * Read category order from ng-doc.category.ts
 */
function getCategoryOrder(categoryDir, categoryName) {
  const categoryFile = path.join(categoryDir, categoryName, 'ng-doc.category.ts');
  try {
    const content = fs.readFileSync(categoryFile, 'utf8');
    const match = content.match(/order:\s*(\d+)/);
    return match ? parseInt(match[1]) : 99;
  } catch {
    return 99;
  }
}

/**
 * Generate routes file content
 */
function generateRoutesContent(structure) {
  // Sort categories by their order
  const sortedCategories = structure.categories
    .map(cat => ({
      ...cat,
      order: getCategoryOrder(DOCS_DIR, cat.name)
    }))
    .sort((a, b) => a.order - b.order);

  let routes = `import { Routes } from '@angular/router';

/**
 * Documentation routes
 * Auto-generated from page files - do not edit manually
 * Uses DocPageComponent (no NgDoc dependency for Angular 20 compatibility)
 * Generated: ${new Date().toISOString()}
 */

export const NG_DOC_ROUTING: Routes = [
  {
    path: '',
    redirectTo: 'getting-started',
    pathMatch: 'full'
  },
`;

  // Add root pages
  for (const page of structure.rootPages) {
    routes += `  {
    path: '${page.path}',
    loadComponent: () => import('./${page.path}/page.component').then(m => m.default)
  },
`;
  }

  // Add categories with sub-pages
  for (const category of sortedCategories) {
    if (category.pages.length === 0) continue;
    
    const firstPage = category.pages[0].path;
    
    routes += `  {
    path: '${category.path}',
    children: [
      {
        path: '',
        redirectTo: '${firstPage}',
        pathMatch: 'full'
      },
`;
    
    for (const page of category.pages) {
      routes += `      {
        path: '${page.path}',
        loadComponent: () => import('./${category.path}/${page.path}/page.component').then(m => m.default)
      },
`;
    }
    
    routes += `    ]
  },
`;
  }

  // Add fallback route
  routes += `  // Fallback for unknown routes
  {
    path: '**',
    redirectTo: 'getting-started'
  }
];
`;

  return routes;
}

/**
 * Main
 */
function main() {
  log('\n🛤️  Generating Documentation Routes', colors.cyan);
  log('═'.repeat(40), colors.cyan);
  
  const structure = scanDocumentation();
  
  log(`\nFound:`, colors.blue);
  log(`  - ${structure.rootPages.length} root pages`, colors.blue);
  log(`  - ${structure.categories.length} categories`, colors.blue);
  
  let totalPages = structure.rootPages.length;
  for (const cat of structure.categories) {
    log(`    • ${cat.name}: ${cat.pages.length} pages`, colors.blue);
    totalPages += cat.pages.length;
  }
  log(`  - ${totalPages} total pages`, colors.blue);
  
  const routesContent = generateRoutesContent(structure);
  fs.writeFileSync(ROUTES_FILE, routesContent, 'utf8');
  
  log(`\n✓ Routes written to: ${path.relative(ROOT_DIR, ROUTES_FILE)}`, colors.green);
  log('═'.repeat(40), colors.cyan);
  log('✅ Routes generation complete!\n', colors.green);
}

if (require.main === module) {
  main();
}

