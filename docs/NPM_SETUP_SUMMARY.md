# npm Package Setup Summary

The `osi-cards-lib` library is now configured to be published as an npm package. Here's what was set up:

## ✅ Completed Setup

### 1. Package Configuration
- ✅ Updated `projects/osi-cards-lib/package.json` with npm publishing metadata:
  - Repository URL: `https://github.com/Inutilepat83/OSI-Cards.git`
  - Homepage: GitHub README
  - Bugs: GitHub Issues
- ✅ Fixed package.json generator script to output to correct directory (`dist/osi-cards-lib`)
- ✅ Generator now reads from source package.json to maintain consistency

### 2. Build Scripts
- ✅ Added `npm run build:lib` - Builds library and generates package.json
- ✅ Added `npm run publish:lib` - Publishes to npm
- ✅ Added `npm run publish:lib:dry-run` - Test publish without actually publishing
- ✅ Added `prepublishOnly` hook - Automatically builds before publishing

### 3. File Management
- ✅ Created `.npmignore` in `projects/osi-cards-lib/` to exclude unnecessary files
- ✅ Created `scripts/copy-library-files.js` to copy README.md, LICENSE, and .npmignore to dist
- ✅ Build process now automatically copies necessary files

### 4. Documentation
- ✅ Updated main README.md with npm installation as Option 1 (recommended)
- ✅ Updated library README.md with npm installation instructions
- ✅ Created `docs/NPM_PUBLISHING.md` with complete publishing guide

## 📦 How to Publish

### First Time Setup

1. **Create npm account** (if you don't have one):
   - Go to [npmjs.com](https://www.npmjs.com/signup)
   - Create an account

2. **Login to npm**:
   ```bash
   npm login
   ```

3. **Set up organization** (for scoped package `osi-cards-lib`):
   - Option A: Create npm organization "osi" at [npmjs.com/org/create](https://www.npmjs.com/org/create)
   - Option B: Change package name to unscoped (e.g., `osi-cards-lib`) in `projects/osi-cards-lib/package.json`

### Publishing

1. **Build the library**:
   ```bash
   npm run build:lib
   ```

2. **Test the package** (dry run):
   ```bash
   npm run publish:lib:dry-run
   ```

3. **Publish to npm**:
   ```bash
   npm run publish:lib
   ```
   
   For scoped packages, use:
   ```bash
   cd dist/osi-cards-lib
   npm publish --access public
   ```

## 📝 Package Details

- **Package Name**: `osi-cards-lib`
- **Current Version**: `1.0.0`
- **License**: MIT
- **Angular Version**: 20.0.0+
- **Repository**: https://github.com/Inutilepat83/OSI-Cards.git

## 🔄 Version Management

To update the version before publishing:

```bash
cd projects/osi-cards-lib
npm version patch  # 1.0.0 -> 1.0.1
# or
npm version minor  # 1.0.0 -> 1.1.0
# or
npm version major  # 1.0.0 -> 2.0.0
```

Then rebuild and publish:
```bash
npm run build:lib
npm run publish:lib
```

## 📚 Installation for Users

Once published, users can install with:

```bash
npm install osi-cards-lib
```

No need to clone the repository or build anything - it's ready to use!

## 🎯 Next Steps

1. **Test the build locally**:
   ```bash
   npm run build:lib
   cd dist/osi-cards-lib
   npm pack --dry-run  # See what will be included
   ```

2. **Verify package.json** in `dist/osi-cards-lib/package.json`:
   - Check all fields are correct
   - Verify exports are correct
   - Ensure peer dependencies are correct

3. **Publish when ready**:
   ```bash
   npm run publish:lib:dry-run  # Test first
   npm run publish:lib           # Actually publish
   ```

4. **Update documentation** after first publish:
   - Update README with actual npm package link
   - Add installation examples
   - Create release notes

## 📖 Additional Resources

- See `docs/NPM_PUBLISHING.md` for detailed publishing guide
- npm documentation: https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry
- Semantic Versioning: https://semver.org/

