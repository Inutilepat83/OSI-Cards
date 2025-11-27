# OSI Cards Integration Checklist

Use this checklist to ensure proper integration of OSI Cards into your Angular project.

## Pre-Integration

- [ ] Angular version 17.0.0 or higher
- [ ] Node.js 18+ installed
- [ ] OSI Cards library built (`npm run build:lib`)

## Installation

- [ ] Library installed via npm/local path/npm link
- [ ] Package appears in `node_modules/osi-cards` or linked correctly
- [ ] No installation errors

## Configuration

- [ ] `provideOSICards()` added to `app.config.ts` providers
- [ ] `provideHttpClient()` configured
- [ ] `provideStore()` configured with OSI Cards reducers
- [ ] `provideEffects()` configured with OSI Cards effects
- [ ] `provideAnimations()` configured
- [ ] Styles imported in `angular.json` or `styles.scss`

## Code Integration

- [ ] Components imported (e.g., `AICardRendererComponent`)
- [ ] Services injected where needed
- [ ] Store selectors used correctly
- [ ] Actions dispatched properly
- [ ] Types imported (`AICardConfig`, etc.)

## Testing

- [ ] Application compiles without errors
- [ ] Components render correctly
- [ ] Services work as expected
- [ ] Store state updates properly
- [ ] Styles apply correctly
- [ ] No console errors

## Verification Steps

1. **Build Test:**
   ```bash
   npm run build
   ```
   - [ ] Build succeeds
   - [ ] No TypeScript errors
   - [ ] No missing dependency errors

2. **Runtime Test:**
   ```bash
   npm start
   ```
   - [ ] Application starts
   - [ ] No runtime errors
   - [ ] Components visible

3. **Component Test:**
   - [ ] Create a simple component using `AICardRendererComponent`
   - [ ] Verify card renders
   - [ ] Check interactions work

4. **Service Test:**
   - [ ] Inject `CardDataService`
   - [ ] Call `getAllCards()`
   - [ ] Verify data loads

5. **Store Test:**
   - [ ] Dispatch `loadCards()` action
   - [ ] Use `selectCards` selector
   - [ ] Verify state updates

## Common Issues & Solutions

### Issue: Module not found
- [ ] Verify library is built: `npm run build:lib`
- [ ] Check installation path
- [ ] Verify `package.json` in dist folder

### Issue: Styles not loading
- [ ] Check `angular.json` styles array
- [ ] Verify styles file exists in node_modules
- [ ] Check for CSS import errors

### Issue: NgRx errors
- [ ] Verify reducers imported correctly
- [ ] Check effects are provided
- [ ] Ensure store is configured

### Issue: Components not rendering
- [ ] Verify component is imported
- [ ] Check all providers are configured
- [ ] Verify inputs are provided

## Post-Integration

- [ ] Documentation reviewed
- [ ] Examples tested
- [ ] Team trained on usage
- [ ] Integration documented in project README

## Support Resources

- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Integration Example](./INTEGRATION_EXAMPLE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Examples](./EXAMPLES.md)







