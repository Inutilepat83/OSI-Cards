#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const CONFIG_ROOT = path.join(__dirname, '..', 'src', 'assets', 'configs');
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const filters = argv.filter(arg => !arg.startsWith('--'));

/**
 * Recursively collect JSON files under the specified directory.
 */
async function collectConfigFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectConfigFiles(resolved)));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.toon'))) {
      files.push(resolved);
    }
  }

  return files;
}

/**
 * Determine whether the file should be converted based on CLI filters.
 */
function matchesFilter(filePath) {
  if (!filters.length) {
    return true;
  }
  return filters.some(filter => filePath.includes(filter));
}

async function main() {
  const { encode } = await import('@toon-format/toon');
  const files = (await collectConfigFiles(CONFIG_ROOT)).filter(file => !file.endsWith('manifest.json'));
  const selected = files.filter(matchesFilter);

  if (!selected.length) {
    console.log('No matching JSON files found for conversion.');
    console.log('Pass a directory or substring to limit the scope, e.g. `node scripts/convert-configs-to-toon.js analytics`.');
    return;
  }

  for (const file of selected) {
    const extension = path.extname(file);
    const target = extension === '.json' ? file.replace(/\.json$/, '.toon') : file;
    let data;

    try {
      const raw = await fs.readFile(file, 'utf8');
      data = JSON.parse(raw);
    } catch (error) {
      console.warn(`Skipping ${file}: not valid JSON`);
      continue;
    }

    const toon = encode(data, { indent: 2, keyFolding: 'safe' });

    if (dryRun) {
      console.log(`[dry-run] ${path.relative('.', file)} → ${path.relative('.', target)}`);
      continue;
    }

    await fs.writeFile(target, `${toon}\n`, 'utf8');
    console.log(`Converted ${path.relative(CONFIG_ROOT, file)} → ${path.relative(CONFIG_ROOT, target)}`);
  }
}

main().catch(error => {
  console.error('Conversion failed:', error);
  process.exit(1);
});