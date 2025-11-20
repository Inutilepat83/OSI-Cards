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
  // Large enterprise cards get high priority
  if (sizeInBytes > 10000) {
    return 'high';
  }
  // Company cards are typically shown first
  if (cardType === 'company') {
    return 'high';
  }
  // Contact and product cards are medium priority
  if (['contact', 'product'].includes(cardType)) {
    return 'medium';
  }
  return 'low';
}

/**
 * Determine complexity based on section count and size
 */
function determineComplexity(sectionCount, sizeInBytes) {
  if (sectionCount > 10 || sizeInBytes > 10000) {
    return 'enterprise';
  }
  if (sectionCount > 5 || sizeInBytes > 5000) {
    return 'enhanced';
  }
  return 'basic';
}

/**
 * Generate manifest from config files
 */
function generateManifest() {
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    cards: [],
    types: {}
  };

  // Initialize type arrays
  Object.keys(CARD_TYPE_MAPPING).forEach(type => {
    manifest.types[type] = [];
  });

  // Scan each card type directory
  Object.entries(CARD_TYPE_MAPPING).forEach(([cardType, directory]) => {
    const dirPath = path.join(CONFIGS_DIR, directory);
    
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found: ${dirPath}`);
      return;
    }

    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      const sizeInBytes = stats.size;
      
      try {
        const cardData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const cardId = path.basename(file, '.json');
        const sectionCount = cardData.sections?.length || 0;
        
        const cardEntry = {
          id: cardId,
          type: cardType,
          path: `${directory}/${file}`,
          size: sizeInBytes,
          priority: determinePriority(cardType, sizeInBytes),
          sectionCount,
          complexity: determineComplexity(sectionCount, sizeInBytes),
          title: cardData.cardTitle || cardId,
          metadata: {
            subtitle: cardData.cardSubtitle || null,
            description: cardData.description || null,
            lastUpdated: stats.mtime.toISOString(),
            hasActions: !!(cardData.actions && cardData.actions.length > 0)
          }
        };

        manifest.cards.push(cardEntry);
        manifest.types[cardType].push(cardId);
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    });
  });

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
  try {
    generateManifest();
  } catch (error) {
    console.error('Error generating manifest:', error);
    process.exit(1);
  }
}

module.exports = { generateManifest };

