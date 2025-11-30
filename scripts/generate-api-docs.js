#!/usr/bin/env node

/**
 * Generate API Documentation
 * 
 * Creates API reference documentation from:
 * - TypeScript interfaces and models
 * - OpenAPI specification
 * - Service class documentation
 * - Component documentation
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { processFile, processDirectory, generateMarkdown } = require('./extract-jsdoc');

const ROOT_DIR = path.join(__dirname, '..');
const LIB_DIR = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib');
const DOCS_DIR = path.join(ROOT_DIR, 'src', 'app', 'features', 'documentation');
const OPENAPI_PATH = path.join(ROOT_DIR, 'docs', 'openapi.yaml');

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
 * Load OpenAPI specification
 */
function loadOpenAPI() {
  try {
    if (fs.existsSync(OPENAPI_PATH)) {
      const content = fs.readFileSync(OPENAPI_PATH, 'utf8');
      return yaml.load(content);
    }
  } catch (error) {
    log(`Warning: Could not load OpenAPI spec: ${error.message}`, colors.yellow);
  }
  return null;
}

/**
 * Generate markdown for OpenAPI endpoints
 */
function generateEndpointDocs(openapi) {
  if (!openapi || !openapi.paths) return '';
  
  let md = '# API Endpoints\n\n';
  md += `> Generated from OpenAPI spec v${openapi.info?.version || 'unknown'}\n\n`;
  
  for (const [path, methods] of Object.entries(openapi.paths)) {
    md += `## ${path}\n\n`;
    
    for (const [method, details] of Object.entries(methods)) {
      if (typeof details !== 'object') continue;
      
      md += `### ${method.toUpperCase()} ${path}\n\n`;
      
      if (details.summary) {
        md += `**Summary:** ${details.summary}\n\n`;
      }
      
      if (details.description) {
        md += `${details.description}\n\n`;
      }
      
      if (details.tags) {
        md += `**Tags:** ${details.tags.join(', ')}\n\n`;
      }
      
      // Parameters
      if (details.parameters && details.parameters.length > 0) {
        md += '**Parameters:**\n\n';
        md += '| Name | In | Type | Required | Description |\n';
        md += '|------|----|----- |----------|-------------|\n';
        for (const param of details.parameters) {
          const type = param.schema?.type || 'string';
          md += `| \`${param.name}\` | ${param.in} | ${type} | ${param.required ? 'Yes' : 'No'} | ${param.description || '-'} |\n`;
        }
        md += '\n';
      }
      
      // Request body
      if (details.requestBody) {
        md += '**Request Body:**\n\n';
        const content = details.requestBody.content?.['application/json'];
        if (content?.schema?.$ref) {
          const schemaName = content.schema.$ref.split('/').pop();
          md += `Schema: [\`${schemaName}\`](#${schemaName.toLowerCase()})\n\n`;
        }
      }
      
      // Responses
      if (details.responses) {
        md += '**Responses:**\n\n';
        md += '| Status | Description |\n';
        md += '|--------|-------------|\n';
        for (const [status, response] of Object.entries(details.responses)) {
          md += `| ${status} | ${response.description || '-'} |\n`;
        }
        md += '\n';
      }
    }
  }
  
  return md;
}

/**
 * Generate markdown for OpenAPI schemas
 */
function generateSchemaDocs(openapi) {
  if (!openapi || !openapi.components?.schemas) return '';
  
  let md = '# API Schemas\n\n';
  md += '> These schemas define the structure of data in the OSI Cards API.\n\n';
  
  for (const [name, schema] of Object.entries(openapi.components.schemas)) {
    md += `## ${name}\n\n`;
    
    if (schema.description) {
      md += `${schema.description}\n\n`;
    }
    
    if (schema.type === 'object' && schema.properties) {
      md += '| Property | Type | Required | Description |\n';
      md += '|----------|------|----------|-------------|\n';
      
      const required = schema.required || [];
      
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        let type = propDef.type || 'any';
        if (propDef.$ref) {
          type = `[${propDef.$ref.split('/').pop()}](#${propDef.$ref.split('/').pop().toLowerCase()})`;
        }
        if (propDef.enum) {
          type = propDef.enum.map(e => `\`${e}\``).join(' \\| ');
        }
        if (propDef.oneOf) {
          type = propDef.oneOf.map(o => o.$ref ? o.$ref.split('/').pop() : o.type).join(' \\| ');
        }
        if (propDef.items) {
          const itemType = propDef.items.$ref ? propDef.items.$ref.split('/').pop() : propDef.items.type;
          type = `${itemType}[]`;
        }
        
        const isRequired = required.includes(propName);
        const desc = propDef.description || '-';
        
        md += `| \`${propName}\` | ${type} | ${isRequired ? 'Yes' : 'No'} | ${desc} |\n`;
      }
      md += '\n';
    }
    
    // Example
    if (schema.example) {
      md += '**Example:**\n\n';
      md += '```json\n';
      md += JSON.stringify(schema.example, null, 2);
      md += '\n```\n\n';
    }
  }
  
  return md;
}

/**
 * Extract service documentation
 */
function extractServiceDocs() {
  const servicesDir = path.join(LIB_DIR, 'services');
  const services = [];
  
  if (!fs.existsSync(servicesDir)) {
    return services;
  }
  
  const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.service.ts') && !f.endsWith('.spec.ts'));
  
  for (const file of files) {
    const filePath = path.join(servicesDir, file);
    const result = processFile(filePath);
    
    if (result.classes.length > 0) {
      services.push({
        file,
        classes: result.classes,
        interfaces: result.interfaces,
        types: result.types
      });
    }
  }
  
  return services;
}

/**
 * Generate service documentation markdown
 */
function generateServiceDocs(services) {
  let md = '# Services Reference\n\n';
  md += '> Auto-generated from service source files\n\n';
  
  md += '## Available Services\n\n';
  md += '| Service | Description |\n';
  md += '|---------|-------------|\n';
  
  for (const service of services) {
    for (const cls of service.classes) {
      const desc = cls.jsdoc?.description?.split('\n')[0] || '-';
      md += `| [\`${cls.name}\`](#${cls.name.toLowerCase()}) | ${desc} |\n`;
    }
  }
  md += '\n---\n\n';
  
  // Detailed documentation
  for (const service of services) {
    for (const cls of service.classes) {
      md += `## ${cls.name}\n\n`;
      
      if (cls.jsdoc?.description) {
        md += `${cls.jsdoc.description}\n\n`;
      }
      
      if (cls.decorators.length > 0) {
        const injectable = cls.decorators.find(d => d.name === 'Injectable');
        if (injectable && injectable.args.includes('root')) {
          md += '> This service is provided in root and available application-wide.\n\n';
        }
      }
      
      // Examples from JSDoc
      if (cls.jsdoc?.examples?.length > 0) {
        md += '### Usage Example\n\n';
        for (const example of cls.jsdoc.examples) {
          if (example.title) {
            md += `**${example.title}**\n\n`;
          }
          md += '```typescript\n';
          md += example.code;
          md += '\n```\n\n';
        }
      }
      
      md += `**Source:** \`${service.file}\`\n\n`;
      md += '---\n\n';
    }
  }
  
  return md;
}

/**
 * Extract component documentation
 */
function extractComponentDocs() {
  const componentsDir = path.join(LIB_DIR, 'components');
  const components = [];
  
  if (!fs.existsSync(componentsDir)) {
    return components;
  }
  
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.component.ts') && !entry.name.endsWith('.spec.ts')) {
        try {
          const result = processFile(fullPath);
          if (result.classes.length > 0) {
            const relativePath = path.relative(LIB_DIR, fullPath);
            components.push({
              file: relativePath,
              ...result
            });
          }
        } catch (error) {
          log(`Warning: Could not process ${fullPath}: ${error.message}`, colors.yellow);
        }
      }
    }
  }
  
  scanDir(componentsDir);
  return components;
}

/**
 * Generate component documentation markdown
 */
function generateComponentDocs(components) {
  let md = '# Components Reference\n\n';
  md += '> Auto-generated from component source files\n\n';
  
  md += '## Available Components\n\n';
  md += '| Component | Selector | Description |\n';
  md += '|-----------|----------|-------------|\n';
  
  for (const comp of components) {
    for (const cls of comp.classes) {
      const selector = extractSelector(cls);
      const desc = cls.jsdoc?.description?.split('\n')[0] || '-';
      md += `| [\`${cls.name}\`](#${cls.name.toLowerCase()}) | \`${selector}\` | ${desc} |\n`;
    }
  }
  md += '\n---\n\n';
  
  // Detailed documentation
  for (const comp of components) {
    for (const cls of comp.classes) {
      md += `## ${cls.name}\n\n`;
      
      if (cls.jsdoc?.description) {
        md += `${cls.jsdoc.description}\n\n`;
      }
      
      const selector = extractSelector(cls);
      if (selector) {
        md += `**Selector:** \`${selector}\`\n\n`;
      }
      
      // Inputs/Outputs from decorators would go here
      // For now, show basic info
      
      if (cls.jsdoc?.examples?.length > 0) {
        md += '### Usage Example\n\n';
        for (const example of cls.jsdoc.examples) {
          md += '```typescript\n';
          md += example.code;
          md += '\n```\n\n';
        }
      }
      
      md += `**Source:** \`${comp.file}\`\n\n`;
      md += '---\n\n';
    }
  }
  
  return md;
}

/**
 * Extract selector from component decorator
 */
function extractSelector(cls) {
  const componentDecorator = cls.decorators?.find(d => d.name === 'Component');
  if (componentDecorator) {
    const selectorMatch = componentDecorator.args.match(/selector:\s*['"]([^'"]+)['"]/);
    if (selectorMatch) {
      return selectorMatch[1];
    }
  }
  return '';
}

/**
 * Generate model documentation from card.model.ts
 */
function generateModelDocs() {
  const modelPath = path.join(LIB_DIR, 'models', 'card.model.ts');
  
  if (!fs.existsSync(modelPath)) {
    return '';
  }
  
  const result = processFile(modelPath);
  
  let md = '# Data Models Reference\n\n';
  md += '> Auto-generated from card.model.ts\n\n';
  md += 'These models define the structure of cards and their components.\n\n';
  
  // Interfaces
  if (result.interfaces.length > 0) {
    md += '## Interfaces\n\n';
    md += '| Interface | Description |\n';
    md += '|-----------|-------------|\n';
    
    for (const iface of result.interfaces) {
      const desc = iface.jsdoc?.description?.split('\n')[0] || '-';
      md += `| [\`${iface.name}\`](#${iface.name.toLowerCase()}) | ${desc} |\n`;
    }
    md += '\n---\n\n';
    
    for (const iface of result.interfaces) {
      md += `### ${iface.name}\n\n`;
      
      if (iface.jsdoc?.description) {
        md += `${iface.jsdoc.description}\n\n`;
      }
      
      if (iface.extends.length > 0) {
        md += `**Extends:** ${iface.extends.join(', ')}\n\n`;
      }
      
      if (iface.properties.length > 0) {
        md += '| Property | Type | Optional | Description |\n';
        md += '|----------|------|----------|-------------|\n';
        
        for (const prop of iface.properties) {
          const desc = prop.jsdoc?.description || '-';
          md += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.optional ? 'Yes' : 'No'} | ${desc} |\n`;
        }
        md += '\n';
      }
    }
  }
  
  // Type aliases
  if (result.types.length > 0) {
    md += '## Type Aliases\n\n';
    
    for (const type of result.types) {
      md += `### ${type.name}\n\n`;
      
      if (type.jsdoc?.description) {
        md += `${type.jsdoc.description}\n\n`;
      }
      
      md += '```typescript\n';
      md += `type ${type.name}${type.generics ? `<${type.generics}>` : ''} = ${type.definition};\n`;
      md += '```\n\n';
    }
  }
  
  // Classes (CardUtils, CardTypeGuards)
  if (result.classes.length > 0) {
    md += '## Utility Classes\n\n';
    
    for (const cls of result.classes) {
      md += `### ${cls.name}\n\n`;
      
      if (cls.jsdoc?.description) {
        md += `${cls.jsdoc.description}\n\n`;
      }
    }
  }
  
  return md;
}

/**
 * Write ng-doc page files
 */
function writeNgDocPage(category, name, content, order = 1) {
  const pageDir = path.join(DOCS_DIR, category, name);
  
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }
  
  const titleCase = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const varName = name.split('-').map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Page';
  
  // Page config
  const pageTs = `import { NgDocPage } from '@ng-doc/core';

const ${varName}: NgDocPage = {
  title: '${titleCase}',
  mdFile: './index.md',
  order: ${order}
};

export default ${varName};
`;
  
  fs.writeFileSync(path.join(pageDir, `${name}.page.ts`), pageTs, 'utf8');
  fs.writeFileSync(path.join(pageDir, 'index.md'), content, 'utf8');
  
  return { pageDir, varName };
}

/**
 * Main function
 */
function main() {
  log('\n📚 Generating API Documentation', colors.cyan);
  log('═'.repeat(50), colors.cyan);
  
  // Load OpenAPI
  log('\n📄 Loading OpenAPI specification...', colors.blue);
  const openapi = loadOpenAPI();
  if (openapi) {
    log(`   ✓ Loaded OpenAPI v${openapi.info?.version}`, colors.green);
  }
  
  // Extract service documentation
  log('\n🔧 Extracting service documentation...', colors.blue);
  const services = extractServiceDocs();
  log(`   ✓ Found ${services.length} services`, colors.green);
  
  // Extract component documentation
  log('\n🧩 Extracting component documentation...', colors.blue);
  const components = extractComponentDocs();
  log(`   ✓ Found ${components.length} components`, colors.green);
  
  // Generate documentation files
  log('\n📝 Generating documentation files...', colors.blue);
  
  // API endpoints
  if (openapi) {
    const endpointDocs = generateEndpointDocs(openapi);
    const schemaDocs = generateSchemaDocs(openapi);
    
    writeNgDocPage('api-reference', 'endpoints', endpointDocs, 1);
    log('   ✓ Generated API endpoints documentation', colors.green);
    
    writeNgDocPage('api-reference', 'schemas', schemaDocs, 2);
    log('   ✓ Generated API schemas documentation', colors.green);
  }
  
  // Services
  const serviceDocs = generateServiceDocs(services);
  writeNgDocPage('api-reference', 'services', serviceDocs, 3);
  log('   ✓ Generated services documentation', colors.green);
  
  // Components
  const componentDocs = generateComponentDocs(components);
  writeNgDocPage('api-reference', 'components', componentDocs, 4);
  log('   ✓ Generated components documentation', colors.green);
  
  // Models
  const modelDocs = generateModelDocs();
  writeNgDocPage('api-reference', 'models', modelDocs, 5);
  log('   ✓ Generated models documentation', colors.green);
  
  // Create category file
  const categoryDir = path.join(DOCS_DIR, 'api-reference');
  const categoryTs = `import { NgDocCategory } from '@ng-doc/core';

const ApiReferenceCategory: NgDocCategory = {
  title: 'API Reference',
  order: 5,
  expandable: true
};

export default ApiReferenceCategory;
`;
  fs.writeFileSync(path.join(categoryDir, 'ng-doc.category.ts'), categoryTs, 'utf8');
  
  log('\n═'.repeat(50), colors.cyan);
  log('✅ API documentation generation complete!\n', colors.green);
}

module.exports = {
  loadOpenAPI,
  generateEndpointDocs,
  generateSchemaDocs,
  extractServiceDocs,
  generateServiceDocs,
  extractComponentDocs,
  generateComponentDocs,
  generateModelDocs,
  writeNgDocPage
};

if (require.main === module) {
  main();
}

