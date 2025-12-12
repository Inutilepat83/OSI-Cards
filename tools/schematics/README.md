# OSI Cards Schematics

This directory contains Angular schematics for generating OSI Cards components and templates.

## Available Schematics

### Section Component Generator

Generate a new OSI Cards section component with all necessary files and boilerplate.

```bash
npm run generate:section <name> -- --type <section-type>
```

**Options:**

- `name` (required): The name of the section component
- `--type` (required): The section type identifier (e.g., 'info', 'list', 'chart')
- `--path` (optional): Custom path for the component (default: `src/app/shared/components/cards/sections`)
- `--usesFields` (optional): Whether the section uses fields (default: `true`)
- `--usesItems` (optional): Whether the section uses items (default: `false`)

**Examples:**

```bash
# Generate a simple field-based section
npm run generate:section my-section -- --type my-type

# Generate a section that uses items
npm run generate:section list-section -- --type list --usesItems

# Generate a section with both fields and items
npm run generate:section complex-section -- --type complex --usesFields --usesItems
```

**Generated Files:**

- `<name>-section.component.ts` - Component class
- `<name>-section.component.html` - Template
- `<name>-section.component.scss` - Styles
- `<name>-section.component.spec.ts` - Unit tests

### Card Template Generator

Generate a new OSI Cards template configuration JSON file.

```bash
npm run generate:template <name> -- --cardType <type>
```

**Options:**

- `name` (required): The name of the template
- `--cardType` (required): The card type (e.g., 'company', 'product', 'contact')
- `--path` (optional): Custom path for the template (default: `src/assets/configs`)
- `--sectionCount` (optional): Number of sections to include (default: `3`)

**Examples:**

```bash
# Generate a company card template
npm run generate:template company-basic -- --cardType company

# Generate a product card template with 5 sections
npm run generate:template product-detailed -- --cardType product --sectionCount 5
```

**Generated Files:**

- `<name>.json` - Card template configuration

## Installation & Setup

The schematics are configured in `package.json`. To use them, ensure you have the necessary dependencies:

```bash
npm install --save-dev @angular-devkit/schematics @angular-devkit/core
```

## Manual Usage

You can also use the schematics directly with the Angular CLI:

```bash
# If schematics are published as a package
ng generate @osi-cards/schematics:section my-section --type my-type

# Or using schematics directly
schematics tools/schematics:section --name my-section --type my-type
```

## What Gets Generated

### Section Component

The section component generator creates:

1. **Component Class** (`*.component.ts`)
   - Extends `BaseSectionComponent`
   - Implements OnPush change detection
   - Includes trackBy functions
   - Implements event handlers

2. **Template** (`*.component.html`)
   - Semantic HTML structure
   - ARIA attributes for accessibility
   - Keyboard navigation support
   - Empty state handling

3. **Styles** (`*.component.scss`)
   - Uses OSI Cards design tokens
   - Includes SCSS mixins
   - Responsive grid layout
   - Follows component composition standards

4. **Tests** (`*.component.spec.ts`)
   - Basic component tests
   - Field/item display tests
   - Empty state tests

### Card Template

The template generator creates:

1. **JSON Configuration**
   - Proper card structure
   - Section definitions
   - Action buttons
   - Metadata

## Next Steps After Generation

### For Section Components

1. **Register the section type** in:
   - `src/app/models/card.model.ts` - Add to `CardSection['type']` union
   - `src/app/shared/components/cards/section-renderer/section-component-registry.service.ts` - Register component
   - `src/app/shared/services/section-normalization.service.ts` - Add to supported types

2. **Import styles** in:
   - `src/styles.scss` - Add import for new section styles

3. **Add examples** in:
   - `src/assets/configs/` - Create example card configurations

### For Card Templates

1. **Customize the template** - Edit the generated JSON file
2. **Add to manifest** - Update `src/assets/configs/manifest.json`
3. **Test the template** - Load it in the application

## Customization

You can customize the generated files by editing the templates in:

- `tools/schematics/section/files/`
- `tools/schematics/card-template/files/`

## Troubleshooting

### Schematic not found

If you get "Schematic not found", ensure:

1. The schematics are properly configured in `collection.json`
2. Dependencies are installed
3. You're using the correct command syntax

### Generated files have errors

The generated files follow OSI Cards patterns, but you may need to:

1. Add additional imports
2. Implement custom logic
3. Update type definitions
4. Register the component properly

## Contributing

To add new schematics:

1. Create a new directory in `tools/schematics/`
2. Add `schema.json`, `schema.ts`, and `index.ts`
3. Create template files in `files/` directory
4. Update `collection.json` to register the new schematic
















