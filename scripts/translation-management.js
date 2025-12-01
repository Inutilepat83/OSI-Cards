#!/usr/bin/env node

/**
 * Translation Management Script
 * 
 * Provides utilities for managing translation files, including:
 * - Extracting missing translations
 * - Validating translation files
 * - Merging translation keys
 * - Generating translation reports
 * - Detecting unused translation keys
 * 
 * Usage:
 *   node scripts/translation-management.js extract-missing
 *   node scripts/translation-management.js validate
 *   node scripts/translation-management.js merge
 *   node scripts/translation-management.js report
 *   node scripts/translation-management.js unused
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_DIR = path.join(__dirname, '../src/assets/i18n');
const DEFAULT_LOCALE = 'en';

// Supported locales
const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'de', 'pt', 'it', 'ja', 'zh', 'ko'];

/**
 * Load translation file
 */
function loadTranslationFile(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${locale}.json:`, error.message);
    return {};
  }
}

/**
 * Save translation file
 */
function saveTranslationFile(locale, translations) {
  const filePath = path.join(TRANSLATIONS_DIR, `${locale}.json`);
  const content = JSON.stringify(translations, null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Get all nested keys from a translation object
 */
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, key) {
  const keys = key.split('.');
  let value = obj;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj, key, value) {
  const keys = key.split('.');
  const lastKey = keys.pop();
  let current = obj;
  
  for (const k of keys) {
    if (!current[k] || typeof current[k] !== 'object') {
      current[k] = {};
    }
    current = current[k];
  }
  
  current[lastKey] = value;
}

/**
 * Extract missing translations
 */
function extractMissingTranslations() {
  console.log('🔍 Extracting missing translations...\n');
  
  const defaultTranslations = loadTranslationFile(DEFAULT_LOCALE);
  const defaultKeys = getAllKeys(defaultTranslations);
  
  const missing = {};
  
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    
    const translations = loadTranslationFile(locale);
    const missingKeys = defaultKeys.filter(key => {
      const value = getNestedValue(translations, key);
      return value === undefined || value === '';
    });
    
    if (missingKeys.length > 0) {
      missing[locale] = missingKeys;
      console.log(`📋 ${locale.toUpperCase()}: ${missingKeys.length} missing translation(s)`);
    } else {
      console.log(`✅ ${locale.toUpperCase()}: All translations present`);
    }
  }
  
  if (Object.keys(missing).length === 0) {
    console.log('\n✅ All translations are complete!');
    return;
  }
  
  // Generate missing translations file
  const outputPath = path.join(TRANSLATIONS_DIR, 'missing.json');
  fs.writeFileSync(outputPath, JSON.stringify(missing, null, 2) + '\n', 'utf8');
  
  console.log(`\n📄 Missing translations saved to: ${outputPath}`);
  console.log('\n💡 Tip: Use this file to track missing translations and fill them in.');
  
  return missing;
}

/**
 * Validate translation files
 */
function validateTranslations() {
  console.log('🔍 Validating translation files...\n');
  
  const defaultTranslations = loadTranslationFile(DEFAULT_LOCALE);
  const defaultKeys = getAllKeys(defaultTranslations);
  
  let hasErrors = false;
  
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    
    console.log(`Checking ${locale.toUpperCase()}...`);
    const translations = loadTranslationFile(locale);
    const translationKeys = getAllKeys(translations);
    
    // Check for missing keys
    const missing = defaultKeys.filter(key => !translationKeys.includes(key));
    if (missing.length > 0) {
      console.log(`  ⚠️  Missing ${missing.length} key(s):`);
      missing.slice(0, 5).forEach(key => console.log(`     - ${key}`));
      if (missing.length > 5) {
        console.log(`     ... and ${missing.length - 5} more`);
      }
      hasErrors = true;
    }
    
    // Check for extra keys (not in default)
    const extra = translationKeys.filter(key => !defaultKeys.includes(key));
    if (extra.length > 0) {
      console.log(`  ⚠️  Extra ${extra.length} key(s) not in default:`);
      extra.slice(0, 5).forEach(key => console.log(`     - ${key}`));
      if (extra.length > 5) {
        console.log(`     ... and ${extra.length - 5} more`);
      }
    }
    
    // Check for empty values
    const empty = translationKeys.filter(key => {
      const value = getNestedValue(translations, key);
      return value === '' || (typeof value === 'string' && value.trim() === '');
    });
    if (empty.length > 0) {
      console.log(`  ⚠️  ${empty.length} empty value(s):`);
      empty.slice(0, 5).forEach(key => console.log(`     - ${key}`));
      if (empty.length > 5) {
        console.log(`     ... and ${empty.length - 5} more`);
      }
      hasErrors = true;
    }
    
    if (!missing.length && !empty.length) {
      console.log(`  ✅ ${locale.toUpperCase()} is valid\n`);
    } else {
      console.log('');
    }
  }
  
  if (!hasErrors) {
    console.log('✅ All translation files are valid!');
  } else {
    console.log('❌ Some translation files have issues. Please fix them.');
    process.exit(1);
  }
}

/**
 * Merge translation keys
 */
function mergeTranslations() {
  console.log('🔄 Merging translation keys...\n');
  
  const defaultTranslations = loadTranslationFile(DEFAULT_LOCALE);
  const defaultKeys = getAllKeys(defaultTranslations);
  
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    
    const translations = loadTranslationFile(locale);
    let updated = false;
    
    // Add missing keys with empty values
    for (const key of defaultKeys) {
      const value = getNestedValue(translations, key);
      if (value === undefined) {
        setNestedValue(translations, key, '');
        updated = true;
      }
    }
    
    if (updated) {
      saveTranslationFile(locale, translations);
      console.log(`✅ Updated ${locale.toUpperCase()}: Added missing keys`);
    } else {
      console.log(`✅ ${locale.toUpperCase()}: Already up to date`);
    }
  }
  
  console.log('\n✅ Merge complete!');
}

/**
 * Generate translation report
 */
function generateReport() {
  console.log('📊 Generating translation report...\n');
  
  const defaultTranslations = loadTranslationFile(DEFAULT_LOCALE);
  const defaultKeys = getAllKeys(defaultTranslations);
  const totalKeys = defaultKeys.length;
  
  console.log(`Total translation keys: ${totalKeys}\n`);
  console.log('Locale Coverage:');
  console.log('────────────────');
  
  const report = [];
  
  for (const locale of SUPPORTED_LOCALES) {
    const translations = loadTranslationFile(locale);
    const translationKeys = getAllKeys(translations);
    const covered = defaultKeys.filter(key => {
      const value = getNestedValue(translations, key);
      return value !== undefined && value !== '';
    }).length;
    
    const percentage = totalKeys > 0 ? Math.round((covered / totalKeys) * 100) : 0;
    const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️ ' : '❌';
    
    console.log(`${status} ${locale.toUpperCase().padEnd(4)}: ${covered.toString().padStart(3)}/${totalKeys} (${percentage}%)`);
    
    report.push({
      locale,
      covered,
      total: totalKeys,
      percentage,
      missing: totalKeys - covered
    });
  }
  
  // Save report to file
  const reportPath = path.join(TRANSLATIONS_DIR, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    generated: new Date().toISOString(),
    totalKeys,
    locales: report
  }, null, 2) + '\n', 'utf8');
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  return report;
}

/**
 * Find unused translation keys
 */
function findUnusedKeys() {
  console.log('🔍 Finding unused translation keys...\n');
  console.log('⚠️  This requires scanning source code files...\n');
  
  // This is a basic implementation - in production, you'd want to:
  // 1. Scan TypeScript/HTML files
  // 2. Use AST parsing for more accurate detection
  // 3. Check for usage in pipes, services, etc.
  
  const defaultTranslations = loadTranslationFile(DEFAULT_LOCALE);
  const defaultKeys = getAllKeys(defaultTranslations);
  
  console.log(`Found ${defaultKeys.length} translation keys in ${DEFAULT_LOCALE}.json`);
  console.log('\n💡 Tip: To find unused keys, scan your codebase for:');
  console.log('   - Template usage: {{ "key" | translate }}');
  console.log('   - Service usage: i18n.translate("key")');
  console.log('   - Direct JSON access: translations["key"]');
  
  return defaultKeys;
}

// Main CLI
const command = process.argv[2];

switch (command) {
  case 'extract-missing':
    extractMissingTranslations();
    break;
    
  case 'validate':
    validateTranslations();
    break;
    
  case 'merge':
    mergeTranslations();
    break;
    
  case 'report':
    generateReport();
    break;
    
  case 'unused':
    findUnusedKeys();
    break;
    
  default:
    console.log('Translation Management Tool\n');
    console.log('Usage: node scripts/translation-management.js <command>\n');
    console.log('Commands:');
    console.log('  extract-missing  Extract missing translations from all locales');
    console.log('  validate         Validate all translation files');
    console.log('  merge            Merge missing keys from default locale');
    console.log('  report           Generate translation coverage report');
    console.log('  unused           Find potentially unused translation keys');
    console.log('\nExamples:');
    console.log('  node scripts/translation-management.js validate');
    console.log('  node scripts/translation-management.js extract-missing');
    console.log('  node scripts/translation-management.js report');
    process.exit(1);
}










