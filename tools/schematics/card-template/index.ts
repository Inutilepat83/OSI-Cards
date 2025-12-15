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
 * Schematic for generating OSI Cards template configurations
 */
export function cardTemplateSchematic(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Normalize options
    const name = strings.dasherize(options.name);
    const cardType = options.cardType || 'custom';
    const path = options.path || 'src/assets/configs';
    const sectionCount = options.sectionCount || 3;
    const fileName = `${name}.json`;

    context.logger.info(`Generating card template: ${name}`);
    context.logger.info(`Path: ${path}/${fileName}`);
    context.logger.info(`Card type: ${cardType}`);
    context.logger.info(`Sections: ${sectionCount}`);

    // Template variables
    const templateOptions = {
      ...strings,
      ...options,
      name,
      fileName,
      cardType,
      sectionCount,
      date: new Date().toISOString().split('T')[0],
    };

    // Create template file
    const templateSource = apply(url('./files'), [
      template(templateOptions),
      move(path),
    ]);

    return chain([
      branchAndMerge(chain([
        mergeWith(templateSource),
      ])),
    ])(tree, context);
  };
}





























