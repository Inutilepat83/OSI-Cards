#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist', 'osi-cards');
const MAX_INITIAL_BYTES = 650 * 1024; // 650 KB

function getFileSize(p) {
  try { return fs.statSync(p).size; } catch { return 0; }
}

function main() {
  const mainJs = fs.readdirSync(distDir).find(f => /^main\..*\.js$/.test(f));
  const stylesCss = fs.readdirSync(distDir).find(f => /^styles\..*\.css$/.test(f));
  const polyfillsJs = fs.readdirSync(distDir).find(f => /^polyfills\..*\.js$/.test(f));
  const runtimeJs = fs.readdirSync(distDir).find(f => /^runtime\..*\.js$/.test(f));

  const total = [mainJs, stylesCss, polyfillsJs, runtimeJs]
    .filter(Boolean)
    .map(f => getFileSize(path.join(distDir, f)))
    .reduce((a, b) => a + b, 0);

  const kb = (total / 1024).toFixed(2);
  console.log(`Initial bundle size: ${kb} KB (limit ${MAX_INITIAL_BYTES/1024} KB)`);
  if (total > MAX_INITIAL_BYTES) {
    console.error('Bundle size gate failed.');
    process.exit(1);
  }
}

main();


