#!/usr/bin/env node

/**
 * Copy section-registry.json to assets for runtime access
 * This allows the LLM prompt service to load the registry at runtime
 */

const fs = require('fs');
const path = require('path');

const REGISTRY_SOURCE = path.join(__dirname, '../projects/osi-cards-lib/section-registry.json');
const REGISTRY_DEST = path.join(__dirname, '../src/assets/section-registry.json');

// Ensure assets directory exists
const assetsDir = path.dirname(REGISTRY_DEST);
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Copy registry file
if (fs.existsSync(REGISTRY_SOURCE)) {
  fs.copyFileSync(REGISTRY_SOURCE, REGISTRY_DEST);
  console.log(`✅ Copied section-registry.json to ${REGISTRY_DEST}`);
} else {
  console.error(`❌ Source file not found: ${REGISTRY_SOURCE}`);
  process.exit(1);
}

