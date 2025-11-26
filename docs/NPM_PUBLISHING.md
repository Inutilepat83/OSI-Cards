# Publishing to npm

This guide explains how to publish the `osi-cards-lib` library to npm so it can be installed by anyone using `npm install osi-cards-lib`.

## Prerequisites

1. **npm account**: You need an npm account. Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **npm login**: Log in to npm from your terminal:
   ```bash
   npm login
   ```
3. **Organization setup** (if using scoped package): If you want to publish `osi-cards-lib`, you need to either:
   - Create an npm organization named `osi` and add yourself as a member, OR
   - Change the package name to an unscoped name (e.g., `osi-cards-lib`)

## Publishing Steps

### 1. Build the Library

First, build the library to ensure everything is up to date:

```bash
npm run build:lib
```

This will:
- Build the Angular library
- Generate the package.json in `dist/osi-cards-lib/`
- Copy necessary files (README.md, LICENSE, .npmignore)

### 2. Verify the Package

Before publishing, verify the package contents:

```bash
cd dist/osi-cards-lib
npm pack --dry-run
```

This will show you what files will be included in the package without actually creating a tarball.

### 3. Test the Package Locally (Optional)

You can test the package locally before publishing:

```bash
cd dist/osi-cards-lib
npm pack
```

This creates a `.tgz` file. You can install it in another project:

```bash
npm install /path/to/OSI-Cards-1/dist/osi-cards-lib/osi-cards-lib-1.0.0.tgz
```

### 4. Publish to npm

#### Dry Run First

Always do a dry run first to see what would be published:

```bash
npm run publish:lib:dry-run
```

This uses `npm pack` which creates a tarball and shows all files that will be included. You can also manually:

```bash
cd dist/osi-cards-lib
npm pack
```

This creates a `.tgz` file that you can inspect or even install locally to test:
```bash
npm install /path/to/osi-cards-lib-1.0.0.tgz
```

#### Publish

Once you're satisfied, publish:

```bash
npm run publish:lib
```

Or manually:

```bash
cd dist/osi-cards-lib
npm publish
```

### 5. Publish with Access Flag (Scoped Packages)

If you're publishing a scoped package (`osi-cards-lib`), you need to make it public:

```bash
cd dist/osi-cards-lib
npm publish --access public
```

## Version Management

### Updating the Version

Before publishing a new version, update the version number:

1. **Update version in source package.json:**
   ```bash
   # Edit projects/osi-cards-lib/package.json
   # Change "version": "1.0.0" to "1.0.1" (or use npm version)
   ```

2. **Or use npm version command:**
   ```bash
   cd projects/osi-cards-lib
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.0 -> 1.1.0
   npm version major  # 1.0.0 -> 2.0.0
   ```

3. **Rebuild and publish:**
   ```bash
   npm run build:lib
   npm run publish:lib
   ```

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0 -> 2.0.0): Breaking changes
- **MINOR** (1.0.0 -> 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 -> 1.0.1): Bug fixes, backward compatible

## Package Configuration

The package configuration is managed in:

- **Source**: `projects/osi-cards-lib/package.json` - Source package.json
- **Generated**: `dist/osi-cards-lib/package.json` - Generated during build
- **Generator**: `scripts/generate-library-package-json.js` - Script that generates the dist package.json

### Important Fields

- `name`: Package name on npm (`osi-cards-lib`)
- `version`: Package version
- `description`: Short description shown on npm
- `keywords`: Searchable keywords
- `repository`: GitHub repository URL
- `homepage`: Project homepage
- `bugs`: Issue tracker URL
- `peerDependencies`: Required dependencies (Angular 20, etc.)
- `exports`: Module entry points

## Troubleshooting

### "Package name already exists"

If the package name is taken, you can:
1. Use a different name (update `projects/osi-cards-lib/package.json`)
2. Use a scoped package with your own organization
3. Contact the owner of the existing package

### "You do not have permission to publish"

For scoped packages, ensure you:
1. Are logged in: `npm login`
2. Have access to the organization (if using `osi-cards-lib`)
3. Use `--access public` flag for public scoped packages

### "Invalid package name"

Package names must:
- Be lowercase
- Not contain spaces
- Follow npm naming conventions
- For scoped packages: `@scope/package-name`

### Files Not Included

Check `.npmignore` in `projects/osi-cards-lib/` to ensure files you want are not being excluded.

## Automated Publishing

You can set up CI/CD to automatically publish on tags:

```yaml
# Example GitHub Actions workflow
name: Publish to npm
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build:lib
      - run: cd dist/osi-cards-lib && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## After Publishing

1. **Verify on npm**: Visit `https://www.npmjs.com/package/osi-cards-lib`
2. **Update documentation**: Update README with npm installation instructions
3. **Create release notes**: Document what changed in this version
4. **Tag in git**: Create a git tag for the version:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Unpublishing (Emergency Only)

⚠️ **Warning**: Unpublishing can break projects that depend on your package. Only do this in emergencies.

```bash
npm unpublish osi-cards-lib@1.0.0
```

Or to unpublish all versions (within 72 hours of first publish):

```bash
npm unpublish osi-cards-lib --force
```

## Best Practices

1. ✅ Always test locally before publishing
2. ✅ Use semantic versioning
3. ✅ Write clear release notes
4. ✅ Keep CHANGELOG.md updated
5. ✅ Test the published package in a fresh project
6. ✅ Don't publish test files or source maps (unless needed)
7. ✅ Include comprehensive README.md
8. ✅ Set up automated testing before publishing

