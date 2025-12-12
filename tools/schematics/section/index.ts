import {
  Rule,
  Tree,
  SchematicContext,
  chain,
  apply,
  url,
  template,
  move,
  mergeWith,
  branchAndMerge,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import { Schema } from './schema';

/**
 * Enhanced Schematic for generating OSI Cards section components
 * 
 * This schematic now automatically:
 * 1. Creates the section component files
 * 2. Adds the section to section-registry.json
 * 3. Creates the section style file
 * 4. Triggers regeneration of all derived files
 */
export function sectionSchematic(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Normalize options
    const name = strings.dasherize(options.name);
    const className = strings.classify(name) + 'SectionComponent';
    const selector = `app-${name}-section`;
    const type = options.type || name;
    const path = options.path || 'projects/osi-cards-lib/src/lib/components/sections';
    const fullPath = `${path}/${name}-section`;

    context.logger.info(`\n🔧 Generating section component: ${className}`);
    context.logger.info(`   Path: ${fullPath}`);
    context.logger.info(`   Type: ${type}`);
    context.logger.info(`   Selector: ${selector}`);

    // Determine data type
    let dataType = 'CardField';
    if (options.usesItems && !options.usesFields) {
      dataType = 'CardItem';
    } else if (options.usesItems && options.usesFields) {
      dataType = 'CardField | CardItem';
    }

    // Template variables
    const templateOptions = {
      ...strings,
      ...options,
      name,
      className,
      selector,
      type,
      dataType,
      usesFields: options.usesFields ?? true,
      usesItems: options.usesItems ?? false,
    };

    // Create files
    const templateSource = apply(url('./files'), [
      template(templateOptions),
      move(fullPath),
    ]);

    return chain([
      branchAndMerge(chain([
        mergeWith(templateSource),
        // Update section registry
        updateSectionRegistry(options, name, className, selector),
        // Create style file
        createStyleFile(name),
        // Log completion
        logCompletion(name, type),
      ])),
    ])(tree, context);
  };
}

/**
 * Update section-registry.json with the new section
 */
function updateSectionRegistry(options: Schema, name: string, className: string, selector: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const registryPath = 'projects/osi-cards-lib/section-registry.json';
    
    if (!tree.exists(registryPath)) {
      context.logger.warn(`Registry not found at ${registryPath}. Skipping registry update.`);
      return tree;
    }

    const content = tree.read(registryPath);
    if (!content) {
      return tree;
    }

    try {
      const registry = JSON.parse(content.toString());
      const type = options.type || name;

      // Check if type already exists
      if (registry.sections[type]) {
        context.logger.warn(`Section type '${type}' already exists in registry. Skipping.`);
        return tree;
      }

      // Add new section to registry
      registry.sections[type] = {
        name: `${strings.classify(name)} Section`,
        description: options.description || `${strings.classify(name)} section for displaying ${name} data.`,
        componentPath: `./lib/components/sections/${name}-section/${name}-section.component`,
        stylePath: `./lib/styles/components/sections/_${name}.scss`,
        selector: selector,
        useCases: [
          `${strings.classify(name)} display`,
          `${strings.classify(name)} visualization`
        ],
        bestPractices: [
          `Use for ${name} data display`,
          'Keep content organized and scannable'
        ],
        rendering: {
          usesFields: options.usesFields ?? true,
          usesItems: options.usesItems ?? false,
          defaultColumns: options.defaultColumns ?? 1,
          supportsCollapse: true,
          supportsEmoji: true
        },
        testFixtures: {
          complete: {
            title: `${strings.classify(name)} Example`,
            type: type,
            description: `Complete ${name} section example`,
            [options.usesItems ? 'items' : 'fields']: options.usesItems 
              ? [{ title: 'Example Item', description: 'Item description' }]
              : [{ label: 'Example Label', value: 'Example Value' }]
          },
          minimal: {
            title: strings.classify(name),
            type: type,
            [options.usesItems ? 'items' : 'fields']: options.usesItems 
              ? [{ title: 'Item' }]
              : [{ label: 'Key', value: 'Value' }]
          },
          edgeCases: {
            title: `${strings.classify(name)} Edge Cases`,
            type: type
          }
        }
      };

      // Write updated registry
      tree.overwrite(registryPath, JSON.stringify(registry, null, 2));
      context.logger.info(`   ✓ Added '${type}' to section-registry.json`);
      
    } catch (error) {
      context.logger.error(`Failed to update registry: ${error}`);
    }

    return tree;
  };
}

/**
 * Create the style file for the section
 */
function createStyleFile(name: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const stylePath = `projects/osi-cards-lib/src/lib/styles/components/sections/_${name}.scss`;
    
    if (tree.exists(stylePath)) {
      context.logger.info(`   ⚠ Style file already exists: ${stylePath}`);
      return tree;
    }

    const styleContent = `// ${strings.classify(name)} Section Styles
// Auto-generated by section schematic

.osi-cards-container,
.osi-cards {
  .section-${name} {
    // Section container styles
    
    .${name}-content {
      // Content area styles
    }
    
    .${name}-item {
      // Item styles
    }
    
    .${name}-field {
      // Field styles
    }
  }
}
`;

    tree.create(stylePath, styleContent);
    context.logger.info(`   ✓ Created style file: ${stylePath}`);
    
    return tree;
  };
}

/**
 * Log completion and next steps
 */
function logCompletion(name: string, type: string): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    context.logger.info(`
   ✅ Section '${name}' created successfully!
   
   Next steps:
   1. Run 'npm run generate:all' to regenerate derived files
   2. Implement the component logic in ${name}-section.component.ts
   3. Add styles to _${name}.scss
   4. Add test cases in the test fixtures
   
   The section '${type}' is now registered and ready to use.
`);
    return _tree;
  };
}






