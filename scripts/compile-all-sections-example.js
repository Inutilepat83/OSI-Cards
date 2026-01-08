#!/usr/bin/env node

/**
 * Compile All Sections Example
 *
 * Combines all individual section example files into a single
 * "All Sections Demo" card JSON.
 *
 * This card demonstrates all available section types in one place.
 *
 * Usage:
 *   node scripts/compile-all-sections-example.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SECTIONS_DIR = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'components', 'sections');
const GENERATED_OUTPUT_PATH = path.join(ROOT_DIR, 'src', 'assets', 'configs', 'generated', 'all-sections-complete.json');
const ALL_COMPONENTS_PATH = path.join(ROOT_DIR, 'src', 'assets', 'configs', 'all', 'all-components.json');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

/**
 * Check if section is internal (should be excluded from demo)
 */
function isInternalSection(sectionType, registry) {
  if (!registry || !registry.sections) {
    return false;
  }
  return registry.sections[sectionType]?.isInternal === true;
}

/**
 * Load section registry to check for internal sections
 */
function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    log(`  ⚠️  Could not load registry: ${error.message}`, colors.yellow);
  }
  return null;
}

/**
 * Main compilation process
 */
function main() {
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Compile All Sections Example', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);

  if (!fs.existsSync(SECTIONS_DIR)) {
    log(`❌ Sections directory not found: ${SECTIONS_DIR}`, colors.red);
    process.exit(1);
  }

  const registry = loadRegistry();
  const sections = [];

  const sectionFolders = fs.readdirSync(SECTIONS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let loaded = 0;
  let skipped = 0;
  let errors = 0;
  const loadedTypes = [];
  const skippedTypes = [];

  for (const folder of sectionFolders) {
    const sectionType = folder.replace('-section', '');
    // Handle special case: contact-card-section folder has contact-card.definition.json
    const definitionFileName = sectionType === 'contact' ? 'contact-card.definition.json' : `${sectionType}.definition.json`;
    const definitionPath = path.join(SECTIONS_DIR, folder, definitionFileName);

    // Check if internal
    if (isInternalSection(sectionType, registry)) {
      log(`  ⏭️  Skipping internal section: ${sectionType}`, colors.yellow);
      skipped++;
      skippedTypes.push(sectionType);
      continue;
    }

    if (!fs.existsSync(definitionPath)) {
      log(`  ⚠️  Definition file not found: ${definitionPath}`, colors.yellow);
      skipped++;
      continue;
    }

    try {
      const content = fs.readFileSync(definitionPath, 'utf8');
      const definition = JSON.parse(content);

      // Get example from examples (try multiple keys in priority order)
      // Priority: example > demo > complete > doc > first available
      const example =
        definition.examples?.example ||
        definition.examples?.demo ||
        definition.examples?.complete ||
        definition.examples?.doc ||
        (definition.examples && Object.values(definition.examples)[0]);

      if (!example) {
        log(`  ⚠️  No example found in ${sectionType} definition`, colors.yellow);
        skipped++;
        skippedTypes.push(sectionType);
        continue;
      }

      // Ensure type is set
      if (!example.type) {
        example.type = sectionType;
      }

      sections.push(example);
      loaded++;
      loadedTypes.push(sectionType);
      log(`  ✓ Loaded ${sectionType}`, colors.green);
    } catch (error) {
      log(`  ❌ Error loading ${definitionPath}: ${error.message}`, colors.red);
      errors++;
    }
  }

  // Sort sections by priority (1 first, then 2, then 3, then undefined)
  sections.sort((a, b) => {
    const priorityA = a.priority ?? 4;
    const priorityB = b.priority ?? 4;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // Secondary sort by type name
    return (a.type || '').localeCompare(b.type || '');
  });

  // Create the complete card
  const allSectionsCard = {
    cardTitle: 'All Sections Demo',
    cardType: 'company',
    description: 'This card demonstrates all available section types in the OSI Cards library',
    sections: sections,
    actions: [
      {
        label: 'Generate Presentation',
        type: 'agent',
        variant: 'primary',
        icon: '📊',
        agentId: 'ppt-generation'
      },
      {
        label: 'Write Email',
        type: 'mail',
        variant: 'primary',
        icon: '✉️',
        email: {
          subject: 'Nexus Technologies - All Sections Demo',
          body: 'Hello,\n\nI wanted to share this comprehensive overview of Nexus Technologies with you.\n\nThis card demonstrates all available section types in our OSI Cards library, including:\n- Analytics and KPIs\n- Brand identity and design tokens\n- Revenue and growth charts\n- Executive leadership team\n- Key events and milestones\n- Financial summaries\n- Product information\n- And much more...\n\nPlease let me know if you have any questions or would like to schedule a demo.\n\nBest regards',
          contact: {
            name: 'Nexus Technologies',
            email: 'info@nexustech.io',
            role: 'Sales Team'
          }
        }
      },
      {
        label: 'Learn More',
        type: 'website',
        variant: 'primary',
        icon: '🌐',
        url: 'https://example.com'
      }
    ]
  };

  // Ensure output directories exist
  const generatedOutputDir = path.dirname(GENERATED_OUTPUT_PATH);
  const allComponentsOutputDir = path.dirname(ALL_COMPONENTS_PATH);
  if (!fs.existsSync(generatedOutputDir)) {
    fs.mkdirSync(generatedOutputDir, { recursive: true });
  }
  if (!fs.existsSync(allComponentsOutputDir)) {
    fs.mkdirSync(allComponentsOutputDir, { recursive: true });
  }

  // Write the compiled card to generated folder (primary output)
  const cardJson = JSON.stringify(allSectionsCard, null, 2) + '\n';
  try {
    fs.writeFileSync(GENERATED_OUTPUT_PATH, cardJson, 'utf8');
    log(`\n  ✓ Written to ${GENERATED_OUTPUT_PATH}`, colors.green);
  } catch (error) {
    log(`  ❌ Error writing ${GENERATED_OUTPUT_PATH}: ${error.message}`, colors.red);
    process.exit(1);
  }

  // Also copy to all/all-components.json for backward compatibility with manifest
  try {
    fs.writeFileSync(ALL_COMPONENTS_PATH, cardJson, 'utf8');
    log(`  ✓ Copied to ${ALL_COMPONENTS_PATH}`, colors.green);
  } catch (error) {
    log(`  ⚠️  Error copying to ${ALL_COMPONENTS_PATH}: ${error.message}`, colors.yellow);
    // Don't exit on copy error, as the primary output was successful
  }

  // Also update registry if it exists
  if (fs.existsSync(REGISTRY_PATH)) {
    try {
      const registryContent = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
      registryContent.allSectionsExample = allSectionsCard;
      fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registryContent, null, 2) + '\n', 'utf8');
      log(`  ✓ Updated registry with allSectionsExample`, colors.green);
    } catch (error) {
      log(`  ⚠️  Could not update registry: ${error.message}`, colors.yellow);
    }
  }

  log('\n' + '═'.repeat(70), colors.cyan);
  log(`  Summary:`, colors.cyan);
  log(`    ✓ Loaded: ${loaded} sections`, colors.green);
  if (loadedTypes.length > 0) {
    log(`    Loaded types: ${loadedTypes.join(', ')}`, colors.dim || '');
  }
  log(`    ⏭️  Skipped: ${skipped} sections`, colors.yellow);
  if (skippedTypes.length > 0) {
    log(`    Skipped types: ${skippedTypes.join(', ')}`, colors.dim || '');
  }
  log(`    ❌ Errors: ${errors}`, colors.red);
  log(`    📄 Primary Output: ${GENERATED_OUTPUT_PATH}`, colors.blue);
  log(`    📄 Copied to: ${ALL_COMPONENTS_PATH}`, colors.blue);
  log('═'.repeat(70) + '\n', colors.cyan);

  // Return the card for potential use in registry
  return allSectionsCard;
}

function compileAllSectionsExample() {
  return main();
}

if (require.main === module) {
  compileAllSectionsExample();
} else {
  module.exports = { compileAllSectionsExample };
}

