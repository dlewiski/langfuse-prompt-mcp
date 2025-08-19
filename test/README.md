# Test Suite Documentation

## Overview

Comprehensive test suite for the Langfuse Prompt MCP Server using Vitest, achieving 80%+ code coverage across unit, integration, and E2E tests.

## Test Structure

```
test/
├── unit/                  # Isolated unit tests
│   ├── handlers/          # Handler function tests
│   ├── evaluators/        # Evaluation logic tests
│   └── improvers/         # Improvement technique tests
├── integration/           # Module interaction tests
│   └── mcp-workflows.test.ts
├── e2e/                   # End-to-end workflow tests
│   └── prompt-improvement-pipeline.test.ts
├── fixtures/              # Test data and mocks
├── setup.ts               # Global test configuration
└── README.md              # This file
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Watch mode for development
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- test/unit/handlers/evaluate.test.ts

# Run tests matching pattern
npm test -- --grep "should evaluate"

# Run with UI
npm run test:ui
```

### Coverage Reporting

```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/index.html

# Check coverage thresholds
npx vitest run --coverage --coverage.thresholdAutoUpdate=false
```

Current coverage thresholds:
- **Statements**: ≥80%
- **Branches**: ≥75%
- **Functions**: ≥80%
- **Lines**: ≥80%

## Test Layers

### 1. Unit Tests (60% of tests)

**Purpose**: Test individual functions in isolation

**Coverage Areas**:
- Handler functions (evaluate, improve, track, etc.)
- Evaluation criteria
- Improvement techniques
- Utility functions
- Model-specific optimizers

### 2. Integration Tests (30% of tests)

**Purpose**: Test module interactions and data flow

**Coverage Areas**:
- MCP tool workflows
- Multi-step operations
- Error propagation
- Concurrent operations
- Model-specific pipelines

### 3. E2E Tests (10% of tests)

**Purpose**: Test complete user workflows

**Coverage Areas**:
- Full improvement pipelines
- File system operations
- Performance benchmarks
- Quality validation
- Error recovery

## CI/CD Integration

The test suite runs automatically on:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

**Test Matrix**:
- Node.js versions: 18.x, 20.x, 22.x
- Operating systems: Ubuntu, macOS, Windows

## Success Metrics

✅ **Unit test coverage**: >80% for all critical paths  
✅ **Integration tests**: Cover all MCP tool workflows  
✅ **E2E tests**: Validate complete improvement pipeline  
✅ **Performance**: All tests run in <30 seconds locally  
✅ **CI/CD**: Tests run on every PR  
✅ **Cross-platform**: Tests pass on Linux, macOS, Windows  
✅ **Documentation**: Comprehensive and up-to-date  
✅ **Zero flaky tests**: Reliable test execution