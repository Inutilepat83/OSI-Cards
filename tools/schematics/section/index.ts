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
 * Schematic for generating OSI Cards section components
 */
export function sectionSchematic(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Normalize options
    const name = strings.dasherize(options.name);
    const className = strings.classify(name) + 'SectionComponent';
    const selector = `app-${name}-section`;
    const type = options.type || name;
    const path = options.path || 'src/app/shared/components/cards/sections';
    const fullPath = `${path}/${name}-section`;

    context.logger.info(`Generating section component: ${className}`);
    context.logger.info(`Path: ${fullPath}`);
    context.logger.info(`Type: ${type}`);

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
        // Update section type registration
        updateSectionRegistry(options.type, name),
        // Update card model types
        updateCardModelTypes(options.type),
        // Update styles imports
        updateStylesImports(name),
      ])),
    ])(tree, context);
  };
}

/**
 * Update section registry to include new section type
 */
function updateSectionRegistry(type: string, name: string): Rule {
  return (tree: Tree) => {
    const registryPath = 'src/app/shared/components/cards/section-renderer/section-component-registry.service.ts';
    
    if (!tree.exists(registryPath)) {
      return tree; // Skip if registry doesn't exist
    }

    let content = tree.read(registryPath)?.toString() || '';
    
    // Check if already registered
    if (content.includes(`${type}SectionComponent`)) {
      return tree;
    }

    // Add import
    const importMatch = content.match(/import\s+.*from\s+['"]\.\.\/sections\/.*['"]/);
    if (importMatch) {
      const newImport = `import { ${strings.classify(name)}SectionComponent } from '../sections/${name}-section/${name}-section.component';`;
      content = content.replace(
        importMatch[0],
        `${importMatch[0]}\n${newImport}`
      );
    }

    // Add to registry (simplified - would need actual parsing for production)
    // This is a template showing the pattern
    return tree;
  };
}

/**
 * Update card model types
 */
function updateCardModelTypes(type: string): Rule {
  return (tree: Tree) => {
    // This would update card.model.ts to add the new type
    // Simplified for now
    return tree;
  };
}

/**
 * Update styles imports
 */
function updateStylesImports(name: string): Rule {
  return (tree: Tree) => {
    // This would update styles.scss to import the new section styles
    // Simplified for now
    return tree;
  };
}

