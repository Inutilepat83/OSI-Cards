#!/usr/bin/env node

/**
 * Generate ng-doc page components from page configuration files
 * 
 * This script creates page components that extend NgDocRootPage
 * and load markdown content for ng-doc rendering.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'src', 'app', 'features', 'documentation');

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
      const pageDir = path.dirname(fullPath);
      const mdFile = path.join(pageDir, 'index.md');
      const hasMdFile = fs.existsSync(mdFile);
      
      files.push({
        fullPath,
        pageDir,
        relativePath: relativePath.replace(/\.page\.ts$/, ''),
        fileName: entry.name.replace(/\.page\.ts$/, ''),
        mdFile: hasMdFile ? path.relative(docsDir, mdFile) : null
      });
    }
  }
  
  return files;
}

/**
 * Read page config to get title and other metadata
 */
function readPageConfig(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
    const orderMatch = content.match(/order:\s*(\d+)/);
    return {
      title: titleMatch ? titleMatch[1] : 'Documentation',
      order: orderMatch ? parseInt(orderMatch[1]) : 0
    };
  } catch (error) {
    return { title: 'Documentation', order: 0 };
  }
}

/**
 * Read markdown content
 */
function readMarkdownContent(mdFilePath) {
  try {
    const fullPath = path.join(docsDir, mdFilePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    return '# Documentation\n\nContent not available.';
  }
}

/**
 * Generate page component
 */
function generatePageComponent(file) {
  const pageConfig = readPageConfig(file.fullPath);
  const mdContent = file.mdFile ? readMarkdownContent(file.mdFile) : '# ' + pageConfig.title + '\n\nContent coming soon.';
  
  // Escape markdown content for template string
  const escapedContent = mdContent
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${');
  
  const componentName = file.fileName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'PageComponent';
  
  // Import path should be relative to the page component location
  const pageFileName = path.basename(file.fullPath, '.page.ts');
  const importPath = `./${pageFileName}.page`;
  const pageComponentPath = path.join(file.pageDir, 'page.component.ts');
  
  const componentCode = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from '${importPath}';

const pageContent: string = \`${escapedContent}\`;

@Component({
  selector: 'ng-doc-page-${file.fileName}',
  template: \`<ng-doc-page></ng-doc-page>\`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: ${componentName} }
  ],
  standalone: true
})
export class ${componentName} extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default ${componentName};
`;
  
  fs.writeFileSync(pageComponentPath, componentCode, 'utf8');
  return { componentName, pageComponentPath };
}

/**
 * Generate all page components
 */
function generatePageComponents() {
  const pageFiles = findPageFiles(docsDir);
  const components = [];
  
  for (const file of pageFiles) {
    // Skip wrapper and routes files
    if (file.fileName === 'docs-wrapper' || file.fileName === 'docs' || file.fileName === 'ng-doc') {
      continue;
    }
    
    try {
      const component = generatePageComponent(file);
      components.push({ ...file, component });
      console.log(`✅ Generated page component: ${component.pageComponentPath}`);
    } catch (error) {
      console.error(`❌ Error generating component for ${file.fileName}:`, error.message);
    }
  }
  
  return components;
}

// Generate page components
try {
  const components = generatePageComponents();
  console.log(`✅ Generated ${components.length} page components`);
} catch (error) {
  console.error('❌ Error generating page components:', error);
  process.exit(1);
}

