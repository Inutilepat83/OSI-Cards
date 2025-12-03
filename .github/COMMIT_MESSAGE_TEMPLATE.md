# <type>(<scope>): <subject>

## Type
# Must be one of the following:
# - feat: A new feature
# - fix: A bug fix
# - docs: Documentation only changes
# - style: Changes that do not affect the meaning of the code (white-space, formatting, etc)
# - refactor: A code change that neither fixes a bug nor adds a feature
# - perf: A code change that improves performance
# - test: Adding missing tests or correcting existing tests
# - build: Changes that affect the build system or external dependencies
# - ci: Changes to our CI configuration files and scripts
# - chore: Other changes that don't modify src or test files
# - revert: Reverts a previous commit

## Scope (optional)
# The scope should be the name of the affected component/module:
# - core
# - lib
# - components
# - services
# - utils
# - sections
# - tests
# - docs
# - build

## Subject
# The subject contains a succinct description of the change:
# - use the imperative, present tense: "change" not "changed" nor "changes"
# - don't capitalize the first letter
# - no dot (.) at the end

## Body (optional)
# Explain the motivation for the change and contrast with previous behavior

## Footer (optional)
# Reference issues and PRs
# Breaking Changes should start with BREAKING CHANGE:
# Closes #123

# Examples:
# feat(sections): add kanban board section type
# fix(masonry-grid): prevent layout shift during streaming
# perf(layout): optimize column calculation with memoization
# docs(api): add JSDoc comments to CardFacade service
# test(sections): increase test coverage for analytics section
# refactor(core): extract layout logic into separate service
# chore(deps): update Angular to v20.1.0

