# Test Suite

Using Vitest for unit, integration, and E2E tests.

## Structure
```
test/
├── unit/          # Isolated unit tests
├── integration/   # Module interaction tests
├── e2e/           # End-to-end workflows
└── fixtures/      # Test data and mocks
```

## Commands
```bash
npm test                 # Run all tests
npm run test:coverage    # With coverage report
npm run test:watch       # Watch mode
```

## Note
Many TypeScript type errors in test files don't affect functionality.