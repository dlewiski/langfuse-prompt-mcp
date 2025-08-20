# Comprehensive Refactoring Prompt for Prompt-Expert MCP Server

You are a senior TypeScript developer and refactoring expert tasked with comprehensively refactoring the prompt-expert MCP server project located at `/Users/davidlewis/.claude/mcp-servers/prompt-expert`.

## Current Project Analysis

Based on examination of the codebase structure, this is a complex TypeScript MCP server with:
- Multi-phase orchestrator pattern (Queen Bee architecture)
- Model-specific prompt optimization (Claude, GPT, Gemini)
- Langfuse integration for tracking and analytics
- Comprehensive evaluation framework
- Pattern extraction capabilities

## Critical Refactoring Objectives

### 1. Code Cleanup & Simplification
**Current Issues Identified:**
- Complex orchestrator pattern with 4 phases may be over-engineered
- Potential circular dependencies between handlers and orchestrator
- Multiple abstraction layers that could be simplified

**Actions:**
- Remove unnecessary complexity and abstractions
- Eliminate dead code and unused dependencies
- Simplify convoluted logic patterns in `queen-bee-orchestrator.ts`
- Reduce cognitive load of the codebase
- Consolidate duplicate functionality across improvers

### 2. TypeScript Type Safety Enhancement
**Current Issues:**
- Mixed usage of `any` types in tool definitions
- Potential type inconsistencies across model optimizers
- Complex type definitions that may not be properly constrained

**Actions:**
- Fix all existing TypeScript errors and warnings
- Replace all `any` types with proper type definitions
- Add strict type definitions for all functions and variables
- Implement proper generic types for the optimizer pattern
- Use discriminated unions for complex state management (evaluation results, model types)
- Add comprehensive JSDoc comments with type information
- Enable strict TypeScript compiler options

### 3. Error Handling & Resilience
**Current Gaps:**
- Inconsistent error handling across different handlers
- Lack of proper error boundaries in orchestrator phases
- Missing validation for external API calls (Langfuse)

**Actions:**
- Implement consistent error handling patterns throughout
- Add proper error boundaries and fallback mechanisms in `errorHandler.ts`
- Use Result/Either types for error-prone operations
- Add comprehensive input validation in all handlers
- Implement graceful degradation strategies for Langfuse failures
- Add retry mechanisms for external dependencies

### 4. Modular Architecture
**Current Structure Issues:**
- Orchestrator pattern creates tight coupling
- Handlers have mixed responsibilities
- Model optimizers share duplicate code

**Actions:**
- Break down monolithic orchestrator into focused modules
- Implement clear separation of concerns between evaluation, improvement, and tracking
- Create well-defined interfaces between components
- Use dependency injection for better testability
- Organize code into logical directory structures
- Implement proper module boundaries with clear APIs

### 5. Performance & Dependency Optimization
**Current Performance Concerns:**
- Heavy dependency on external services
- Potential memory leaks in caching system
- Synchronous operations that could be parallelized

**Actions:**
- Analyze and remove unnecessary dependencies from `package.json`
- Implement lazy loading for model optimizers
- Optimize memory usage in cache implementation
- Add performance monitoring and metrics
- Use efficient algorithms for pattern extraction
- Minimize startup time and memory footprint

### 6. Documentation Enhancement
**Current Documentation Gaps:**
- Limited examples for complex workflows
- Missing architectural decision documentation
- Incomplete API documentation

**Actions:**
- Update README with comprehensive setup and usage examples
- Document all public APIs with TypeScript examples
- Add architectural decision records (ADRs) for key design choices
- Create troubleshooting guides for common issues
- Add inline code documentation for complex algorithms
- Document configuration options and environment variables

### 7. Testing Infrastructure
**Current Testing Needs:**
- Expand unit test coverage beyond current basic tests
- Add integration tests for MCP protocol compliance
- Performance benchmarks for optimization algorithms

**Actions:**
- Implement comprehensive unit test coverage (>80%) for all handlers
- Add integration tests for critical paths (track → improve workflow)
- Set up test fixtures and mocks for Langfuse integration
- Implement property-based testing for prompt transformation
- Add performance benchmarks for evaluation algorithms
- Create end-to-end test scenarios for MCP client interactions

### 8. Circular Dependencies Resolution
**Potential Circular Dependencies:**
- Orchestrator → Handlers → Orchestrator integration
- Model optimizers → Base optimizer → Model detector

**Actions:**
- Analyze and map all circular dependencies using dependency graph tools
- Refactor code to eliminate circular imports
- Implement proper dependency inversion with interfaces
- Use event-driven patterns to decouple orchestrator components
- Create clear dependency graphs and enforce them with linting

### 9. Orchestrator Pattern Simplification
**Current Complexity:**
- 4-phase orchestrator may be over-engineered
- Queen Bee pattern adds unnecessary abstraction
- Phase dependencies are tightly coupled

**Actions:**
- Simplify orchestration to essential phases (analyze → improve → validate)
- Remove unnecessary abstraction layers in queen-bee pattern
- Implement clear state management with immutable state
- Use composition over inheritance for phase coordination
- Create predictable execution flows with clear error paths

### 10. Maintainability Improvements
**Current Maintainability Issues:**
- Inconsistent coding styles across modules
- Missing development tooling configuration
- Lack of automated quality checks

**Actions:**
- Add comprehensive linting and formatting configuration (ESLint + Prettier)
- Implement consistent coding standards across all files
- Add pre-commit hooks for quality checks
- Create clear contribution guidelines
- Set up continuous integration with GitHub Actions
- Add code quality metrics and monitoring

## Implementation Strategy

### Phase 1: Foundation (Days 1-2)
1. Fix all TypeScript compilation errors
2. Add comprehensive type definitions
3. Implement consistent error handling
4. Set up testing infrastructure

### Phase 2: Architecture (Days 3-4)
1. Resolve circular dependencies
2. Simplify orchestrator pattern
3. Refactor module boundaries
4. Implement dependency injection

### Phase 3: Optimization (Days 5-6)
1. Performance analysis and optimization
2. Dependency cleanup
3. Memory usage optimization
4. Code simplification

### Phase 4: Quality (Days 7-8)
1. Comprehensive testing
2. Documentation updates
3. Code quality improvements
4. Final validation

## Success Criteria

**Technical Metrics:**
- ✅ Zero TypeScript compilation errors
- ✅ All tests passing with >80% coverage
- ✅ No circular dependencies detected
- ✅ Performance improvements (startup time, memory usage)
- ✅ Reduced complexity scores (cyclomatic complexity <10 per function)

**Code Quality:**
- ✅ Clear, documented architecture
- ✅ Consistent error handling patterns
- ✅ Comprehensive type safety
- ✅ Modular, testable code structure

**Developer Experience:**
- ✅ Enhanced developer experience with better tooling
- ✅ Clear documentation and examples
- ✅ Simplified contribution process
- ✅ Robust CI/CD pipeline

## Implementation Guidelines

- Use modern TypeScript features (4.5+) and best practices
- Follow SOLID principles and clean code practices
- Ensure backward compatibility for MCP protocol compliance
- Prioritize readability and maintainability over cleverness
- Document all breaking changes and provide migration paths
- Use established patterns from the MCP ecosystem
- Test thoroughly before considering changes complete
- Maintain the core functionality while improving the architecture

## Files Requiring Immediate Attention

1. `src/orchestrator/queen-bee-orchestrator.ts` - Simplify orchestration logic
2. `src/types/index.ts` - Fix type definitions and remove `any` types
3. `src/utils/errorHandler.ts` - Implement consistent error handling
4. `src/tools/definitions.ts` - Replace `any` with proper types
5. `src/config/index.ts` - Improve configuration management
6. `src/handlers/*.ts` - Refactor for better separation of concerns
7. `test/` directory - Expand test coverage significantly

This refactoring will transform the prompt-expert MCP server into a maintainable, type-safe, and performant codebase that follows modern TypeScript best practices while preserving its core functionality.