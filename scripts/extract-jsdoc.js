#!/usr/bin/env node

/**
 * JSDoc/TSDoc Extractor
 * 
 * Parses TypeScript files and extracts documentation comments including:
 * - Class/interface descriptions
 * - Method signatures and descriptions
 * - Parameter documentation
 * - Example code blocks
 * - Return type documentation
 * 
 * Usage:
 *   node scripts/extract-jsdoc.js <file-or-directory>
 */

const fs = require('fs');
const path = require('path');

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
 * Extract JSDoc comments from TypeScript source
 */
function extractJSDocComments(source) {
  const comments = [];
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
  let match;

  while ((match = jsdocRegex.exec(source)) !== null) {
    const comment = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + comment.length;
    
    // Find what follows the comment (class, interface, function, property)
    const afterComment = source.slice(endIndex).trim();
    const context = extractContext(afterComment);
    
    comments.push({
      raw: comment,
      parsed: parseJSDoc(comment),
      context,
      position: startIndex
    });
  }

  return comments;
}

/**
 * Parse JSDoc comment into structured data
 */
function parseJSDoc(comment) {
  const lines = comment
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, '').trim())
    .filter(line => line.length > 0);

  const result = {
    description: '',
    params: [],
    returns: null,
    examples: [],
    tags: {},
    see: [],
    deprecated: null,
    since: null
  };

  let currentSection = 'description';
  let currentExample = null;
  let descriptionLines = [];

  for (const line of lines) {
    // Check for tags
    if (line.startsWith('@')) {
      const tagMatch = line.match(/^@(\w+)\s*(.*)?$/);
      if (tagMatch) {
        const [, tag, content] = tagMatch;
        
        switch (tag) {
          case 'param':
            const paramMatch = content?.match(/^\{([^}]+)\}\s*(\[?[\w.]+\]?)\s*-?\s*(.*)?$/);
            if (paramMatch) {
              result.params.push({
                type: paramMatch[1],
                name: paramMatch[2].replace(/[\[\]]/g, ''),
                optional: paramMatch[2].startsWith('['),
                description: paramMatch[3] || ''
              });
            } else {
              const simpleParamMatch = content?.match(/^(\[?[\w.]+\]?)\s*-?\s*(.*)?$/);
              if (simpleParamMatch) {
                result.params.push({
                  type: 'any',
                  name: simpleParamMatch[1].replace(/[\[\]]/g, ''),
                  optional: simpleParamMatch[1].startsWith('['),
                  description: simpleParamMatch[2] || ''
                });
              }
            }
            break;
            
          case 'returns':
          case 'return':
            const returnMatch = content?.match(/^\{([^}]+)\}\s*(.*)?$/);
            if (returnMatch) {
              result.returns = {
                type: returnMatch[1],
                description: returnMatch[2] || ''
              };
            } else {
              result.returns = {
                type: 'any',
                description: content || ''
              };
            }
            break;
            
          case 'example':
            currentSection = 'example';
            currentExample = { title: content || '', code: '' };
            break;
            
          case 'see':
            result.see.push(content || '');
            break;
            
          case 'deprecated':
            result.deprecated = content || true;
            break;
            
          case 'since':
            result.since = content || '';
            break;
            
          default:
            if (!result.tags[tag]) {
              result.tags[tag] = [];
            }
            result.tags[tag].push(content || '');
        }
        continue;
      }
    }

    // Handle multi-line content
    if (currentSection === 'example') {
      if (line.startsWith('```')) {
        if (currentExample.code) {
          result.examples.push(currentExample);
          currentExample = null;
          currentSection = 'description';
        }
      } else if (currentExample) {
        currentExample.code += (currentExample.code ? '\n' : '') + line;
      }
    } else {
      descriptionLines.push(line);
    }
  }

  // Finalize current example if any
  if (currentExample && currentExample.code) {
    result.examples.push(currentExample);
  }

  result.description = descriptionLines.join('\n').trim();
  
  return result;
}

/**
 * Extract context (what the JSDoc is documenting)
 */
function extractContext(afterComment) {
  const context = {
    type: 'unknown',
    name: '',
    signature: '',
    modifiers: []
  };

  // Check for export
  const hasExport = afterComment.startsWith('export');
  if (hasExport) {
    context.modifiers.push('export');
  }

  // Interface
  const interfaceMatch = afterComment.match(/^(?:export\s+)?interface\s+(\w+)(?:<[^>]+>)?(?:\s+extends\s+[^{]+)?\s*\{/);
  if (interfaceMatch) {
    context.type = 'interface';
    context.name = interfaceMatch[1];
    context.signature = afterComment.split('{')[0].trim();
    return context;
  }

  // Type alias
  const typeMatch = afterComment.match(/^(?:export\s+)?type\s+(\w+)(?:<[^>]+>)?\s*=/);
  if (typeMatch) {
    context.type = 'type';
    context.name = typeMatch[1];
    const endIndex = afterComment.indexOf(';');
    context.signature = afterComment.slice(0, endIndex > 0 ? endIndex + 1 : 100).trim();
    return context;
  }

  // Class
  const classMatch = afterComment.match(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:<[^>]+>)?(?:\s+(?:extends|implements)\s+[^{]+)?\s*\{/);
  if (classMatch) {
    context.type = 'class';
    context.name = classMatch[1];
    context.signature = afterComment.split('{')[0].trim();
    if (afterComment.includes('abstract')) {
      context.modifiers.push('abstract');
    }
    return context;
  }

  // Function
  const funcMatch = afterComment.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)(?:<[^>]+>)?\s*\(/);
  if (funcMatch) {
    context.type = 'function';
    context.name = funcMatch[1];
    const parenEnd = findMatchingParen(afterComment, afterComment.indexOf('('));
    context.signature = afterComment.slice(0, parenEnd + 1).trim();
    if (afterComment.includes('async')) {
      context.modifiers.push('async');
    }
    return context;
  }

  // Const/Let/Var (often arrow functions or objects)
  const varMatch = afterComment.match(/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*[^=]+)?\s*=/);
  if (varMatch) {
    context.type = 'variable';
    context.name = varMatch[1];
    const equalIndex = afterComment.indexOf('=');
    context.signature = afterComment.slice(0, equalIndex).trim();
    return context;
  }

  // Property or method in class/interface
  const propMatch = afterComment.match(/^(?:readonly\s+)?(?:public|private|protected)?\s*(?:static\s+)?(?:readonly\s+)?(\w+)(?:\?)?(?:\s*:\s*|\s*\()/);
  if (propMatch) {
    const isMethod = afterComment.includes('(');
    context.type = isMethod ? 'method' : 'property';
    context.name = propMatch[1];
    if (isMethod) {
      const parenEnd = findMatchingParen(afterComment, afterComment.indexOf('('));
      context.signature = afterComment.slice(0, parenEnd + 1).trim();
    } else {
      const colonIndex = afterComment.indexOf(':');
      const semicolonIndex = afterComment.indexOf(';');
      context.signature = afterComment.slice(0, semicolonIndex > 0 ? semicolonIndex : colonIndex + 20).trim();
    }
    return context;
  }

  // Decorator
  const decoratorMatch = afterComment.match(/^@(\w+)\s*\(/);
  if (decoratorMatch) {
    context.type = 'decorator';
    context.name = decoratorMatch[1];
    return context;
  }

  return context;
}

/**
 * Find matching closing parenthesis
 */
function findMatchingParen(str, startIndex) {
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '(') depth++;
    if (str[i] === ')') depth--;
    if (depth === 0) return i;
  }
  return str.length - 1;
}

/**
 * Extract interfaces from TypeScript file
 */
function extractInterfaces(source) {
  const interfaces = [];
  const interfaceRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?(?:export\s+)?interface\s+(\w+)(?:<([^>]+)>)?(?:\s+extends\s+([^{]+))?\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  
  let match;
  while ((match = interfaceRegex.exec(source)) !== null) {
    const [fullMatch, name, generics, extendsClause, body] = match;
    
    // Extract JSDoc if present
    const jsdocMatch = fullMatch.match(/^\/\*\*([\s\S]*?)\*\//);
    const jsdoc = jsdocMatch ? parseJSDoc(jsdocMatch[0]) : null;
    
    // Parse properties
    const properties = parseInterfaceProperties(body);
    
    interfaces.push({
      name,
      generics: generics || null,
      extends: extendsClause ? extendsClause.trim().split(',').map(s => s.trim()) : [],
      properties,
      jsdoc
    });
  }
  
  return interfaces;
}

/**
 * Parse interface properties
 */
function parseInterfaceProperties(body) {
  const properties = [];
  const lines = body.split('\n');
  let currentJsdoc = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Capture JSDoc comment
    if (trimmed.startsWith('/**')) {
      const endIndex = trimmed.indexOf('*/');
      if (endIndex > 0) {
        currentJsdoc = parseJSDoc(trimmed.slice(0, endIndex + 2));
      }
      continue;
    }
    
    // Parse property
    const propMatch = trimmed.match(/^(?:readonly\s+)?(\w+)(\?)?:\s*(.+?);?$/);
    if (propMatch) {
      properties.push({
        name: propMatch[1],
        optional: !!propMatch[2],
        type: propMatch[3].replace(/;$/, ''),
        jsdoc: currentJsdoc
      });
      currentJsdoc = null;
    }
  }
  
  return properties;
}

/**
 * Extract classes from TypeScript file
 */
function extractClasses(source) {
  const classes = [];
  
  // Simple class detection
  const classRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?(?:@\w+\([^)]*\)\s*)*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:<[^>]+>)?(?:\s+(?:extends|implements)\s+[^{]+)?\s*\{/g;
  
  let match;
  while ((match = classRegex.exec(source)) !== null) {
    const startIndex = match.index;
    const className = match[1];
    
    // Find class body end
    let braceDepth = 0;
    let inString = false;
    let stringChar = '';
    let bodyStart = source.indexOf('{', startIndex);
    let bodyEnd = bodyStart;
    
    for (let i = bodyStart; i < source.length; i++) {
      const char = source[i];
      
      if (inString) {
        if (char === stringChar && source[i - 1] !== '\\') {
          inString = false;
        }
        continue;
      }
      
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
        continue;
      }
      
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
      
      if (braceDepth === 0) {
        bodyEnd = i;
        break;
      }
    }
    
    const fullClass = source.slice(startIndex, bodyEnd + 1);
    
    // Extract JSDoc
    const jsdocMatch = fullClass.match(/^\/\*\*([\s\S]*?)\*\//);
    const jsdoc = jsdocMatch ? parseJSDoc(jsdocMatch[0]) : null;
    
    // Extract decorators
    const decorators = [];
    const decoratorRegex = /@(\w+)\s*\(\s*(\{[\s\S]*?\}|\[[^\]]*\]|[^)]*)\s*\)/g;
    let decMatch;
    while ((decMatch = decoratorRegex.exec(fullClass)) !== null) {
      if (decMatch.index < fullClass.indexOf('class ')) {
        decorators.push({
          name: decMatch[1],
          args: decMatch[2]
        });
      }
    }
    
    classes.push({
      name: className,
      jsdoc,
      decorators,
      isAbstract: fullClass.includes('abstract class'),
      source: fullClass
    });
  }
  
  return classes;
}

/**
 * Extract type aliases from TypeScript file
 */
function extractTypeAliases(source) {
  const types = [];
  const typeRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?(?:export\s+)?type\s+(\w+)(?:<([^>]+)>)?\s*=\s*([^;]+);/g;
  
  let match;
  while ((match = typeRegex.exec(source)) !== null) {
    const [fullMatch, name, generics, definition] = match;
    
    const jsdocMatch = fullMatch.match(/^\/\*\*([\s\S]*?)\*\//);
    const jsdoc = jsdocMatch ? parseJSDoc(jsdocMatch[0]) : null;
    
    types.push({
      name,
      generics: generics || null,
      definition: definition.trim(),
      jsdoc
    });
  }
  
  return types;
}

/**
 * Extract functions from TypeScript file
 */
function extractFunctions(source) {
  const functions = [];
  const funcRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?(?:export\s+)?(?:async\s+)?function\s+(\w+)(?:<[^>]+>)?\s*\(([^)]*)\)(?:\s*:\s*([^{;]+))?\s*[{;]/g;
  
  let match;
  while ((match = funcRegex.exec(source)) !== null) {
    const [fullMatch, name, params, returnType] = match;
    
    const jsdocMatch = fullMatch.match(/^\/\*\*([\s\S]*?)\*\//);
    const jsdoc = jsdocMatch ? parseJSDoc(jsdocMatch[0]) : null;
    
    functions.push({
      name,
      params: params.trim(),
      returnType: returnType ? returnType.trim() : 'void',
      isAsync: fullMatch.includes('async '),
      jsdoc
    });
  }
  
  return functions;
}

/**
 * Process a single TypeScript file
 */
function processFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  
  return {
    file: filePath,
    comments: extractJSDocComments(source),
    interfaces: extractInterfaces(source),
    classes: extractClasses(source),
    types: extractTypeAliases(source),
    functions: extractFunctions(source)
  };
}

/**
 * Process directory recursively
 */
function processDirectory(dirPath, results = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
      processDirectory(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      try {
        const result = processFile(fullPath);
        if (result.interfaces.length > 0 || result.classes.length > 0 || 
            result.types.length > 0 || result.functions.length > 0) {
          results.push(result);
        }
      } catch (error) {
        log(`Warning: Could not process ${fullPath}: ${error.message}`, colors.yellow);
      }
    }
  }
  
  return results;
}

/**
 * Generate markdown documentation from extracted data
 */
function generateMarkdown(data) {
  let md = '';
  
  // Interfaces
  if (data.interfaces.length > 0) {
    md += '## Interfaces\n\n';
    for (const iface of data.interfaces) {
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
  
  // Classes
  if (data.classes.length > 0) {
    md += '## Classes\n\n';
    for (const cls of data.classes) {
      md += `### ${cls.name}\n\n`;
      if (cls.jsdoc?.description) {
        md += `${cls.jsdoc.description}\n\n`;
      }
      if (cls.decorators.length > 0) {
        md += '**Decorators:** ' + cls.decorators.map(d => `@${d.name}`).join(', ') + '\n\n';
      }
    }
  }
  
  // Types
  if (data.types.length > 0) {
    md += '## Type Aliases\n\n';
    for (const type of data.types) {
      md += `### ${type.name}\n\n`;
      if (type.jsdoc?.description) {
        md += `${type.jsdoc.description}\n\n`;
      }
      md += '```typescript\n';
      md += `type ${type.name}${type.generics ? `<${type.generics}>` : ''} = ${type.definition};\n`;
      md += '```\n\n';
    }
  }
  
  // Functions
  if (data.functions.length > 0) {
    md += '## Functions\n\n';
    for (const func of data.functions) {
      md += `### ${func.name}\n\n`;
      if (func.jsdoc?.description) {
        md += `${func.jsdoc.description}\n\n`;
      }
      md += '```typescript\n';
      md += `${func.isAsync ? 'async ' : ''}function ${func.name}(${func.params}): ${func.returnType}\n`;
      md += '```\n\n';
      if (func.jsdoc?.params.length > 0) {
        md += '**Parameters:**\n\n';
        for (const param of func.jsdoc.params) {
          md += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
        }
        md += '\n';
      }
      if (func.jsdoc?.returns) {
        md += `**Returns:** ${func.jsdoc.returns.type} - ${func.jsdoc.returns.description}\n\n`;
      }
    }
  }
  
  return md;
}

// Export functions for use in other scripts
module.exports = {
  extractJSDocComments,
  parseJSDoc,
  extractContext,
  extractInterfaces,
  extractClasses,
  extractTypeAliases,
  extractFunctions,
  processFile,
  processDirectory,
  generateMarkdown
};

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('Usage: node extract-jsdoc.js <file-or-directory> [--json] [--output <file>]', colors.yellow);
    process.exit(1);
  }
  
  const targetPath = args[0];
  const outputJson = args.includes('--json');
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex > -1 ? args[outputIndex + 1] : null;
  
  if (!fs.existsSync(targetPath)) {
    log(`Error: Path not found: ${targetPath}`, colors.red);
    process.exit(1);
  }
  
  log(`\n📚 Extracting JSDoc from: ${targetPath}`, colors.cyan);
  
  let results;
  const stat = fs.statSync(targetPath);
  
  if (stat.isDirectory()) {
    results = processDirectory(targetPath);
  } else {
    results = [processFile(targetPath)];
  }
  
  log(`\n✅ Processed ${results.length} file(s)`, colors.green);
  
  let totalInterfaces = 0;
  let totalClasses = 0;
  let totalTypes = 0;
  let totalFunctions = 0;
  
  for (const result of results) {
    totalInterfaces += result.interfaces.length;
    totalClasses += result.classes.length;
    totalTypes += result.types.length;
    totalFunctions += result.functions.length;
  }
  
  log(`   - Interfaces: ${totalInterfaces}`, colors.blue);
  log(`   - Classes: ${totalClasses}`, colors.blue);
  log(`   - Type aliases: ${totalTypes}`, colors.blue);
  log(`   - Functions: ${totalFunctions}`, colors.blue);
  
  if (outputFile) {
    const output = outputJson ? JSON.stringify(results, null, 2) : results.map(generateMarkdown).join('\n---\n\n');
    fs.writeFileSync(outputFile, output, 'utf8');
    log(`\n📄 Output written to: ${outputFile}`, colors.green);
  } else if (outputJson) {
    console.log(JSON.stringify(results, null, 2));
  }
}

