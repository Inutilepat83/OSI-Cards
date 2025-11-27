#!/usr/bin/env node

/**
 * Manifest Generator Script
 * Scans src/assets/configs and generates manifest.json with card metadata
 * for priority-based loading and streaming support
 */

const fs = require('fs');
const path = require('path');

const CONFIGS_DIR = path.join(__dirname, '../src/assets/configs');
const MANIFEST_PATH = path.join(CONFIGS_DIR, 'manifest.json');
const PACKAGE_JSON = path.join(__dirname, '..', 'package.json');

// Card type to directory mapping
const CARD_TYPE_MAPPING = {
  company: 'companies',
  contact: 'contacts',
  product: 'products',
  opportunity: 'opportunities',
  event: 'events',
  analytics: 'analytics',
  financials: 'financials',
  sko: 'sko',
  all: 'all'
};

/**
 * Determine card priority based on size and type
 */
function determinePriority(cardType, sizeInBytes) {
  if (sizeInBytes > 10000) {
    return 'high';
  }
  if (cardType === 'company' || cardType === 'all') {
    return 'high';
  }
  if (['contact', 'product'].includes(cardType)) {
    return 'medium';
  }
  return 'low';
}


async function generateManifest() {
  // Read version from package.json
  let version = '1.0.0';
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    version = packageJson.version || version;
  } catch (error) {
    console.warn('Could not read package.json version, using default:', error.message);
  }

  const manifest = {
    version: version,
    generatedAt: new Date().toISOString(),
    cards: [],
    types: {}
  };

  Object.keys(CARD_TYPE_MAPPING).forEach(type => {
    manifest.types[type] = [];
  });

  for (const [cardType, directory] of Object.entries(CARD_TYPE_MAPPING)) {
    const dirPath = path.join(CONFIGS_DIR, directory);
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found: ${dirPath}`);
      continue;
    }

    // Process JSON files only
    const jsonFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));
    
    // Process JSON files
    for (const file of jsonFiles) {
      const cardId = file.replace(/\.json$/, '');
      const jsonFile = path.join(dirPath, `${cardId}.json`);
      let cardData = null;
      let sizeInBytes = 0;
      let lastUpdated = new Date().toISOString();

      try {
        const stats = fs.statSync(jsonFile);
        sizeInBytes = stats.size;
        lastUpdated = stats.mtime.toISOString();
        const text = fs.readFileSync(jsonFile, 'utf8');
        cardData = JSON.parse(text);
      } catch (error) {
        console.error(`Error processing ${cardId} in ${directory}:`, error);
      }

      if (!cardData) {
        continue;
      }

      const sectionCount = cardData.sections?.length || 0;
      const cardEntry = {
        id: cardId,
        type: cardType,
        path: `${directory}/${cardId}.json`,
        format: 'json',
        size: sizeInBytes,
        priority: determinePriority(cardType, sizeInBytes),
        sectionCount,
        title: cardData.cardTitle || cardId,
        metadata: {
          subtitle: cardData.cardSubtitle || null,
          description: cardData.description || null,
          lastUpdated,
          hasActions: !!(cardData.actions && cardData.actions.length > 0)
        }
      };

      manifest.cards.push(cardEntry);
      manifest.types[cardType].push(cardId);
    }
  }

  // Sort cards by priority (high first), then by size (larger first)
  manifest.cards.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return b.size - a.size;
  });

  // Sort types arrays
  Object.keys(manifest.types).forEach(type => {
    manifest.types[type].sort();
  });

  // Write manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  
  console.log(`✓ Generated manifest with ${manifest.cards.length} cards`);
  console.log(`  - High priority: ${manifest.cards.filter(c => c.priority === 'high').length}`);
  console.log(`  - Medium priority: ${manifest.cards.filter(c => c.priority === 'medium').length}`);
  console.log(`  - Low priority: ${manifest.cards.filter(c => c.priority === 'low').length}`);
  console.log(`  - Total size: ${(manifest.cards.reduce((sum, c) => sum + c.size, 0) / 1024).toFixed(2)} KB`);
  
  return manifest;
}

// Run generator
if (require.main === module) {
  generateManifest().catch(error => {
    console.error('Error generating manifest:', error);
    process.exit(1);
  });
}

module.exports = { generateManifest };

