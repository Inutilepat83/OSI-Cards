#!/usr/bin/env node

/**
 * Generate Documentation Page Components
 * 
 * Creates page.component.ts files for all documentation pages.
 * Uses custom DocPageComponent with live demos for section type pages.
 * Supports dynamic demo config extraction from markdown examples.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'src', 'app', 'features', 'documentation');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

/**
 * Demo configs for each section type
 * Used when no example is found in the markdown
 */
const SECTION_DEMO_CONFIGS = {
  'info': {
    title: 'Company Information',
    type: 'info',
    description: 'Basic company details',
    fields: [
      { label: 'Company', value: 'Acme Corporation' },
      { label: 'Industry', value: 'Technology' },
      { label: 'Founded', value: '2010' },
      { label: 'Employees', value: '1,500+' },
      { label: 'Headquarters', value: 'San Francisco, CA' }
    ]
  },
  'analytics': {
    title: 'Key Metrics',
    type: 'analytics',
    description: 'Performance overview',
    fields: [
      { label: 'Revenue', value: 12500000, change: 15.2, trend: 'up', format: 'currency' },
      { label: 'Users', value: 45000, change: 8.5, trend: 'up' },
      { label: 'Conversion', value: 3.2, change: -0.5, trend: 'down', format: 'percentage' },
      { label: 'Avg. Order', value: 285, change: 12, trend: 'up', format: 'currency' }
    ]
  },
  'contact-card': {
    title: 'Team Contacts',
    type: 'contact-card',
    fields: [
      { name: 'Sarah Chen', role: 'CEO', email: 'sarah@example.com', phone: '+1-555-0101' },
      { name: 'Michael Park', role: 'CTO', email: 'michael@example.com', phone: '+1-555-0102' }
    ]
  },
  'network-card': {
    title: 'Organization Network',
    type: 'network-card',
    fields: [
      { name: 'Acme Corp', role: 'Parent Company', connections: 5 },
      { name: 'TechStart Inc', role: 'Subsidiary', connections: 3 },
      { name: 'Global Partners', role: 'Partner', connections: 8 }
    ]
  },
  'map': {
    title: 'Office Locations',
    type: 'map',
    fields: [
      { name: 'Headquarters', address: '123 Tech Blvd, San Francisco, CA', coordinates: { lat: 37.7749, lng: -122.4194 } },
      { name: 'East Coast Office', address: '456 Innovation Ave, New York, NY', coordinates: { lat: 40.7128, lng: -74.0060 } }
    ]
  },
  'financials': {
    title: 'Financial Summary',
    type: 'financials',
    fields: [
      { label: 'Annual Revenue', value: 52000000, format: 'currency' },
      { label: 'Operating Margin', value: 18.5, format: 'percentage' },
      { label: 'Market Cap', value: 2400000000, format: 'currency' },
      { label: 'P/E Ratio', value: 28.3 }
    ]
  },
  'event': {
    title: 'Upcoming Events',
    type: 'event',
    items: [
      { title: 'Product Launch', date: '2024-03-15', location: 'San Francisco', description: 'Annual product unveiling' },
      { title: 'Tech Conference', date: '2024-04-20', location: 'Las Vegas', description: 'Industry networking event' }
    ]
  },
  'list': {
    title: 'Product Features',
    type: 'list',
    description: 'Key features and capabilities',
    items: [
      { title: 'Real-time Analytics', description: 'Live data processing', icon: '📊', status: 'completed' },
      { title: 'AI Integration', description: 'ML-powered insights', icon: '🤖', status: 'in-progress' },
      { title: 'API Access', description: 'RESTful API', icon: '🔗', status: 'completed' },
      { title: 'Multi-language', description: '20+ languages', icon: '🌍', status: 'pending' }
    ]
  },
  'chart': {
    title: 'Sales Trend',
    type: 'chart',
    chartType: 'bar',
    fields: [
      { label: 'Q1', value: 125000 },
      { label: 'Q2', value: 158000 },
      { label: 'Q3', value: 142000 },
      { label: 'Q4', value: 189000 }
    ]
  },
  'product': {
    title: 'Products',
    type: 'product',
    fields: [
      { name: 'Enterprise Suite', price: 999, description: 'Full-featured solution', category: 'Software' },
      { name: 'Starter Pack', price: 299, description: 'For small teams', category: 'Software' }
    ]
  },
  'solutions': {
    title: 'Solutions',
    type: 'solutions',
    items: [
      { title: 'Cloud Migration', description: 'Seamless transition to cloud infrastructure', icon: '☁️' },
      { title: 'Data Analytics', description: 'Turn data into actionable insights', icon: '📈' },
      { title: 'Security', description: 'Enterprise-grade security solutions', icon: '🔒' }
    ]
  },
  'overview': {
    title: 'Company Overview',
    type: 'overview',
    description: 'Leading technology company specializing in AI-powered solutions',
    fields: [
      { label: 'Mission', value: 'Empowering businesses through innovation' },
      { label: 'Vision', value: 'A connected, intelligent future' }
    ]
  },
  'quotation': {
    title: 'Quote',
    type: 'quotation',
    fields: [
      { quote: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs', role: 'Co-founder, Apple' }
    ]
  },
  'text-reference': {
    title: 'References',
    type: 'text-reference',
    items: [
      { title: 'Getting Started Guide', url: '/docs/getting-started' },
      { title: 'API Documentation', url: '/docs/api' },
      { title: 'Best Practices', url: '/docs/best-practices' }
    ]
  },
  'brand-colors': {
    title: 'Brand Colors',
    type: 'brand-colors',
    fields: [
      { name: 'Primary', value: '#FF7900', hex: '#FF7900' },
      { name: 'Secondary', value: '#1A1A2E', hex: '#1A1A2E' },
      { name: 'Accent', value: '#00D4FF', hex: '#00D4FF' }
    ]
  },
  'news': {
    title: 'Latest News',
    type: 'news',
    items: [
      { title: 'Q4 Results Exceed Expectations', date: '2024-01-15', source: 'Press Release' },
      { title: 'New Partnership Announced', date: '2024-01-10', source: 'Company Blog' }
    ]
  },
  'social-media': {
    title: 'Social Presence',
    type: 'social-media',
    fields: [
      { platform: 'Twitter', handle: '@acmecorp', followers: 125000 },
      { platform: 'LinkedIn', handle: 'acme-corporation', followers: 85000 },
      { platform: 'GitHub', handle: 'acme', followers: 12000 }
    ]
  },
  'base': {
    title: 'Custom Section',
    type: 'base',
    description: 'Fallback for unsupported types',
    fields: [
      { label: 'Data', value: 'Custom content' }
    ]
  }
};

/**
 * Find all page files recursively
 */
function findPageFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findPageFiles(fullPath));
    } else if (entry.name.endsWith('.page.ts') && !entry.name.includes('ng-doc')) {
      const pageDir = path.dirname(fullPath);
      const mdFile = path.join(pageDir, 'index.md');
      const hasMd = fs.existsSync(mdFile);
      
      // Determine if this is a section-types page
      const isSectionType = pageDir.includes('section-types');
      const sectionTypeName = isSectionType ? path.basename(pageDir) : null;
      
      files.push({
        fullPath,
        pageDir,
        fileName: entry.name.replace('.page.ts', ''),
        hasMd,
        isSectionType,
        sectionTypeName
      });
    }
  }
  
  return files;
}

/**
 * Read page config to extract title
 */
function readPageTitle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/title:\s*['"]([^'"]+)['"]/);
    return match ? match[1] : 'Documentation';
  } catch {
    return 'Documentation';
  }
}

/**
 * Read markdown content
 */
function readMarkdown(mdPath) {
  try {
    return fs.readFileSync(mdPath, 'utf8');
  } catch {
    return '# Documentation\n\nContent coming soon.';
  }
}

/**
 * Extract JSON demo config from markdown
 */
function extractDemoConfig(markdown, sectionType) {
  // Try to find the "Complete Example" section
  const completeExampleMatch = markdown.match(/## Complete Example[\s\S]*?```json\s*([\s\S]*?)```/);
  
  if (completeExampleMatch) {
    try {
      return JSON.parse(completeExampleMatch[1].trim());
    } catch (e) {
      log(`  ⚠ Failed to parse Complete Example JSON for ${sectionType}`, colors.yellow);
    }
  }
  
  // Try to find any JSON block with the section type
  const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?"type":\s*"[^"]*"[\s\S]*?)```/);
  
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch (e) {
      // Silent fail, use default
    }
  }
  
  // Fall back to predefined demo config
  return SECTION_DEMO_CONFIGS[sectionType] || SECTION_DEMO_CONFIGS['base'];
}

/**
 * Calculate import depth for DocPageComponent
 */
function getImportPath(pageDir) {
  const relativePath = path.relative(pageDir, DOCS_DIR);
  const depth = relativePath.split(path.sep).filter(p => p === '..').length;
  return '../'.repeat(depth) + 'doc-page.component';
}

/**
 * Calculate import depth for components
 */
function getComponentsImportPath(pageDir) {
  const relativePath = path.relative(pageDir, DOCS_DIR);
  const depth = relativePath.split(path.sep).filter(p => p === '..').length;
  return '../'.repeat(depth) + 'components';
}

/**
 * Generate page component file
 */
function generatePageComponent(pageFile, forceRegenerate = false) {
  const { pageDir, fileName, hasMd, fullPath, isSectionType, sectionTypeName } = pageFile;
  const componentPath = path.join(pageDir, 'page.component.ts');
  
  // Check if component already exists
  if (fs.existsSync(componentPath) && !forceRegenerate) {
    const existingContent = fs.readFileSync(componentPath, 'utf8');
    // Only skip if it already has our enhanced format with demos
    if (existingContent.includes('DocsDemoComponent') || 
        (existingContent.includes('DocPageComponent') && !isSectionType)) {
      return null;
    }
  }
  
  const title = readPageTitle(fullPath);
  const mdPath = path.join(pageDir, 'index.md');
  const mdContent = hasMd ? readMarkdown(mdPath) : `# ${title}\n\nContent coming soon.`;
  
  // Extract demo config for section type pages
  let demoConfig = null;
  if (isSectionType && sectionTypeName) {
    demoConfig = extractDemoConfig(mdContent, sectionTypeName);
  }
  
  // Escape content for template literal
  const escapedContent = mdContent
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${');
  
  // Generate component class name
  const componentName = fileName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') + 'PageComponent';
  
  // Get correct import paths
  const importPath = getImportPath(pageDir);
  const componentsImportPath = getComponentsImportPath(pageDir);
  
  let componentCode;
  
  if (isSectionType && demoConfig) {
    // Generate component with live demo for section types
    const demoConfigStr = JSON.stringify(demoConfig, null, 2)
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`');
    
    componentCode = `import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '${importPath}';
import { DocsDemoComponent } from '${componentsImportPath}';

const pageContent = \`${escapedContent}\`;

const demoConfig = ${demoConfigStr};

/**
 * ${title} documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-${fileName}-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: \`
    <div class="section-docs">
      <app-docs-demo 
        [config]="demo" 
        [type]="'${sectionTypeName}'"
        demoTitle="Live Preview"
        height="350px"
      ></app-docs-demo>
      <app-doc-page [content]="content"></app-doc-page>
    </div>
  \`,
  styles: [\`
    .section-docs {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ${componentName} {
  content = pageContent;
  demo = demoConfig;
}

export default ${componentName};
`;
  } else {
    // Generate standard component without demo
    componentCode = `import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '${importPath}';

const pageContent = \`${escapedContent}\`;

/**
 * ${title} documentation page
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-${fileName}-page',
  standalone: true,
  imports: [DocPageComponent],
  template: \`<app-doc-page [content]="content"></app-doc-page>\`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ${componentName} {
  content = pageContent;
}

export default ${componentName};
`;
  }
  
  fs.writeFileSync(componentPath, componentCode, 'utf8');
  return { path: componentPath, hasDemo: !!demoConfig };
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  const forceRegenerate = args.includes('--force') || args.includes('-f');
  
  log('\n📄 Generating Documentation Page Components', colors.cyan);
  log('═'.repeat(50), colors.cyan);
  
  if (forceRegenerate) {
    log('  Force regeneration enabled', colors.yellow);
  }
  
  const pageFiles = findPageFiles(DOCS_DIR);
  log(`\nFound ${pageFiles.length} page files`, colors.blue);
  
  const sectionTypePages = pageFiles.filter(p => p.isSectionType).length;
  log(`  - ${sectionTypePages} section type pages (with live demos)`, colors.blue);
  log(`  - ${pageFiles.length - sectionTypePages} standard pages`, colors.blue);
  
  let generated = 0;
  let withDemos = 0;
  let skipped = 0;
  
  for (const pageFile of pageFiles) {
    const result = generatePageComponent(pageFile, forceRegenerate);
    if (result) {
      const relPath = path.relative(DOCS_DIR, result.path);
      const demoIndicator = result.hasDemo ? ' (with demo)' : '';
      log(`  ✓ ${relPath}${demoIndicator}`, colors.green);
      generated++;
      if (result.hasDemo) withDemos++;
    } else {
      skipped++;
    }
  }
  
  log('\n' + '═'.repeat(50), colors.cyan);
  log(`✅ Generated: ${generated} (${withDemos} with demos)`, colors.green);
  log(`⏭  Skipped: ${skipped} (already up-to-date)`, colors.yellow);
  
  if (generated > 0) {
    log('\n💡 Tip: Use --force to regenerate all pages', colors.blue);
  }
}

module.exports = { 
  findPageFiles, 
  generatePageComponent,
  extractDemoConfig,
  SECTION_DEMO_CONFIGS
};

if (require.main === module) {
  main();
}
