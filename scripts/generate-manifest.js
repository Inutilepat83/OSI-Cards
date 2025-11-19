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

// Card type to directory mapping
const CARD_TYPE_MAPPING = {
  company: 'companies',
  contact: 'contacts',
  product: 'products',
  opportunity: 'opportunities',
  event: 'events',
  analytics: 'analytics',
  financials: 'financials',
  sko: 'sko'
};

/**
 * Determine card priority based on size and type
 */
function determinePriority(cardType, sizeInBytes) {
  if (sizeInBytes > 10000) {
    return 'high';
  }
  if (cardType === 'company') {
    return 'high';
  }
  if (['contact', 'product'].includes(cardType)) {
    return 'medium';
  }
  return 'low';
}

function determineComplexity(sectionCount, sizeInBytes) {
  if (sectionCount > 10 || sizeInBytes > 10000) {
    return 'enterprise';
  }
  if (sectionCount > 5 || sizeInBytes > 5000) {
    return 'enhanced';
  }
  return 'basic';
}

async function generateManifest() {
  const { decode: decodeToon } = await import('@toon-format/toon');

  const manifest = {
    version: '1.0.0',
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

    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.toon'));

    for (const file of files) {
      const cardId = file.replace(/\.toon$/, '');
      const toonFile = path.join(dirPath, `${cardId}.toon`);
      let cardData = null;
      let sizeInBytes = 0;
      let lastUpdated = new Date().toISOString();

      try {
        const stats = fs.statSync(toonFile);
        sizeInBytes = stats.size;
        lastUpdated = stats.mtime.toISOString();
        const text = fs.readFileSync(toonFile, 'utf8');
        cardData = decodeToon(text, { expandPaths: 'safe' });
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
        path: `${directory}/${cardId}.toon`,
        size: sizeInBytes,
        priority: determinePriority(cardType, sizeInBytes),
        sectionCount,
        complexity: determineComplexity(sectionCount, sizeInBytes),
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

