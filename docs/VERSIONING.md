# Versioning Guide

This project uses **Semantic Versioning** (SemVer) for managing releases. The versioning system is automated through scripts and integrated into the build process.

## Version Format

Versions follow the format: `MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]`

- **MAJOR**: Breaking changes that are not backwards compatible
- **MINOR**: New features that are backwards compatible
- **PATCH**: Bug fixes that are backwards compatible
- **PRERELEASE**: Optional pre-release identifier (e.g., `rc.0`, `beta.1`)
- **BUILD**: Optional build metadata

Examples:
- `1.0.0` - Initial stable release
- `1.1.0` - New features added
- `1.1.1` - Bug fix
- `1.2.0-rc.0` - Release candidate
- `2.0.0` - Major breaking change

## Version Management

### Current Version

Check the current version:
```bash
npm run version:show
```

This displays:
- Root package.json version
- Library package.json version
- Sync status

### Bumping Versions

#### Patch Version (Bug Fixes)
```bash
npm run version:patch
```
Example: `1.0.0` → `1.0.1`

#### Minor Version (New Features)
```bash
npm run version:minor
```
Example: `1.0.0` → `1.1.0`

#### Major Version (Breaking Changes)
```bash
npm run version:major
```
Example: `1.0.0` → `2.0.0`

#### Prerelease Version
```bash
npm run version:prerelease
```
Example: `1.0.0` → `1.0.1-rc.0`, then `1.0.1-rc.1`, etc.

### Synchronizing Versions

If versions get out of sync between root and library:
```bash
npm run version:sync
```

This synchronizes both `package.json` files to use the same version (library version takes precedence).

## What Happens When You Bump a Version

When you run a version bump command:

1. **Version Updated**: Both `package.json` files are updated
2. **Version File Generated**: `src/version.ts` is regenerated with new version
3. **CHANGELOG.md Updated**: New version section is added
4. **Git Tag Created**: A git tag is created (you can push it later)

### After Bumping

1. **Review CHANGELOG.md**: Update the changelog with actual changes
2. **Commit Changes**:
   ```bash
   git add -A
   git commit -m "chore: bump version to X.Y.Z"
   ```
3. **Create and Push Tag**:
   ```bash
   git tag -a vX.Y.Z -m "Release X.Y.Z"
   git push && git push --tags
   ```

## Version in Build Output

Version information is automatically included in builds:

- **Runtime Access**: Import `VERSION_INFO` from `src/version.ts`
- **Build Metadata**: Includes version, build date, git hash, and branch
- **Console Logging**: Version is logged to console in development mode

### Using Version in Code

```typescript
import { VERSION_INFO, getVersionString } from './version';

// Get full version info
console.log(VERSION_INFO.version);        // "1.0.0"
console.log(VERSION_INFO.buildHash);     // "abc1234"
console.log(VERSION_INFO.buildBranch);   // "main"
console.log(VERSION_INFO.buildDate);      // "2025-11-27T12:00:00.000Z"

// Get formatted string
console.log(getVersionString());         // "1.0.0 (main@abc1234)"
```

## Version in CI/CD

The versioning system integrates with CI/CD:

- **Build Process**: Version is generated automatically during build
- **Git Tags**: Tags are created for releases
- **Release Workflow**: GitHub releases can be triggered from tags

### CI/CD Integration

The build process automatically:
1. Generates `version.ts` before building
2. Includes version in manifest.json
3. Embeds version in build artifacts

## Version Strategy

### Development Workflow

1. **Feature Development**: Work on `develop` branch
2. **Release Preparation**: 
   - Update CHANGELOG.md
   - Run appropriate version bump command
   - Review and commit changes
3. **Release**:
   - Merge to `main`
   - Create git tag
   - Push tag to trigger release workflow

### Version Numbering Rules

- **Start at 0.0.1**: Initial development version
- **0.x.x**: Pre-1.0 releases (may have breaking changes)
- **1.x.x**: Stable API, backwards compatible changes only
- **x.0.0**: Major version bumps for breaking changes

### Breaking Changes

When making breaking changes:
1. Bump major version
2. Clearly document breaking changes in CHANGELOG.md
3. Provide migration guide in `docs/` directory
4. Mark breaking changes with `[BREAKING]` prefix

## Troubleshooting

### Versions Out of Sync

If you see a warning about versions being out of sync:
```bash
npm run version:sync
```

### Version File Not Generated

If `src/version.ts` is missing:
```bash
npm run version:generate
```

### Git Tag Issues

If git tag creation fails:
- Check you're in a git repository
- Ensure you have commit access
- Manually create tag: `git tag -a vX.Y.Z -m "Release X.Y.Z"`

## Best Practices

1. **Always bump version before release**: Don't release without versioning
2. **Update CHANGELOG.md**: Document what changed in each version
3. **Use semantic versioning**: Follow SemVer rules strictly
4. **Tag releases**: Always create git tags for releases
5. **Sync versions**: Keep root and library versions in sync
6. **Test after bumping**: Ensure build works with new version

## Related Documentation

- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [Semantic Versioning](https://semver.org/) - Official SemVer specification
- [Keep a Changelog](https://keepachangelog.com/) - Changelog format guide

