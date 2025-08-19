# TypeScript Issues

Remaining type errors after migration. **Server runs fine despite these.**

## Summary
- ~262 total errors (61 in src, 201 in tests)
- Mostly missing property definitions
- No runtime impact

## Main Issues

### Model Optimizers
Files: `src/improvers/models/*.ts`
```
Property 'complexity' does not exist on type '{}'
Property 'enablePrefilling' does not exist on type '{}'
```
**Fix**: Add option interfaces

### Test Files
Missing properties on mock objects.
**Fix**: Update test mocks to match interfaces

## Current Workaround
`tsconfig.json` has strict mode disabled:
```json
{
  "strict": false,
  "noImplicitAny": false
}
```

## Commands
```bash
npm run build          # Builds despite errors
npx tsc --noEmit      # Check types only
```