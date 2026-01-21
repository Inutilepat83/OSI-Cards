#!/bin/bash

# OSI Cards Library - Force Integration Script
# This script "forces" the installation of the library and sets up the necessary dependency overrides
# for compatibility with Angular 20 projects that have legacy dependencies.

TARGET_DIR=${1:-.}
LIB_DIR="/Users/arthurmariani/Desktop/OSI-Cards-1/dist/osi-cards-lib"
LIB_TARBALL=$(ls -t "$LIB_DIR"/osi-cards-lib-*.tgz 2>/dev/null | head -n 1)

if [ ! -f "$TARGET_DIR/package.json" ]; then
    echo "❌ Error: package.json not found in $TARGET_DIR"
    exit 1
fi

if [ ! -f "$LIB_TARBALL" ]; then
    echo "❌ Error: Library tarball not found at $LIB_TARBALL"
    echo "Please build the library first: npm run build:lib"
    exit 1
fi

echo "🚀 Forcing OSI Cards Library integration in $TARGET_DIR..."

# 1. Add overrides to package.json to force compatibility
echo "📦 Adding dependency overrides..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$TARGET_DIR/package.json', 'utf8'));

pkg.overrides = pkg.overrides || {};
const angularDeps = ['@angular/common', '@angular/core', '@angular/forms', '@angular/platform-browser', '@angular/platform-browser-dynamic', '@angular/router', '@angular/animations', 'zone.js', 'rxjs'];

const legacyPackages = [
    '@angular-slider/ngx-slider',
    '@ng-select/ng-select',
    'angular-datatables',
    'ngx-bootstrap',
    'ngx-markdown',
    'ngx-treeview-v18'
];

legacyPackages.forEach(pkgName => {
    pkg.overrides[pkgName] = pkg.overrides[pkgName] || {};
    angularDeps.forEach(dep => {
        pkg.overrides[pkgName][dep] = '$' + dep;
    });
});

fs.writeFileSync('$TARGET_DIR/package.json', JSON.stringify(pkg, null, 2));
"

# 2. Install the library
echo "📥 Installing library..."
cd "$TARGET_DIR"
npm install "$LIB_TARBALL" --legacy-peer-deps

echo "✅ Force integration complete!"
echo "You can now run 'npm start' or 'ng serve' without peer dependency conflicts."
