# Optimized Refactoring Prompt for Prompt-Expert MCP Server

## Context & Objective

Refactor the TypeScript MCP server at `/Users/davidlewis/.claude/mcp-servers/prompt-expert` to achieve enterprise-grade code quality, maintainability, and performance.

## Executive Summary

Transform a complex prompt optimization MCP server with Queen Bee orchestrator pattern, Langfuse integration, and model-specific optimizers into a maintainable, type-safe, performant codebase following modern TypeScript best practices.

---

## 🎯 Primary Refactoring Targets

### 1. **Type Safety & Error Elimination**

**Current State:** Mixed `any` types, potential type inconsistencies

```typescript
// Current: tools/definitions.ts line 205
export const toolDefinitions: ReadonlyArray<any> = [...]

// Target: Strict typing
export const toolDefinitions: ReadonlyArray<MCPTool> = [...]
```

**Actions:**

- Replace all `any` types with strict TypeScript definitions
- Enable `strict: true` in tsconfig.json
- Add comprehensive JSDoc annotations
- Implement discriminated unions for complex state (EvaluationResult, ModelType)

### 2. **Orchestrator Simplification**

**Current State:** 4-phase Queen Bee pattern with tight coupling

```typescript
// Current: Complex 4-phase orchestration
Phase1 → Phase2 → Phase3 → Phase4 → Integration

// Target: Simplified 3-phase pipeline
Analyze → Transform → Validate
```

**Actions:**

- Reduce phases from 4 to 3 essential steps
- Eliminate unnecessary abstraction layers
- Implement dependency injection for testability
- Use composition over inheritance

### 3. **Circular Dependency Resolution**

**Risk Areas:**

- `orchestrator → handlers → orchestrator/integration.ts`
- `improvers/models → baseOptimizer → modelDetector`

**Solution Pattern:**

```typescript
// Use interfaces and dependency inversion
interface IPromptOptimizer {
  optimize(prompt: string, model: ModelType): Promise<OptimizationResult>;
}

// Inject dependencies rather than importing directly
class OrchestatorService {
  constructor(private optimizers: Map<ModelType, IPromptOptimizer>) {}
}
```

### 4. **Performance & Memory Optimization**

**Current Concerns:**

- Heavy Langfuse dependencies
- Synchronous operations blocking event loop
- Potential memory leaks in caching

**Optimizations:**

```typescript
// Lazy loading pattern for model optimizers
const lazyOptimizer = lazy(() => import("./models/claudeOptimizer.js"));

// Async/await for non-blocking operations
async function processEvaluation(prompt: string): Promise<EvaluationResult> {
  const [analysis, optimization] = await Promise.all([
    analyzePrompt(prompt),
    optimizeForModel(prompt),
  ]);
  return combineResults(analysis, optimization);
}
```

---

## 🏗️ Implementation Roadmap

### **Phase 1: Foundation (2 days)**

```yaml
day_1:
  - Fix TypeScript compilation errors
  - Replace any types with strict definitions
  - Implement Result<T, E> error handling pattern
  - Set up ESLint + Prettier configuration

day_2:
  - Add comprehensive unit tests (target: 80% coverage)
  - Implement dependency injection container
  - Create interfaces for all major components
  - Add input validation schemas
```

### **Phase 2: Architecture (2 days)**

```yaml
day_3:
  - Analyze circular dependencies with madge
  - Refactor orchestrator to 3-phase pipeline
  - Implement event-driven decoupling
  - Create clear module boundaries

day_4:
  - Consolidate duplicate code in model optimizers
  - Implement strategy pattern for optimization techniques
  - Add proper error boundaries in orchestrator
  - Optimize async operations for parallelization
```

### **Phase 3: Quality & Performance (2 days)**

```yaml
day_5:
  - Performance profiling and optimization
  - Memory leak detection and fixes
  - Dependency analysis and cleanup
  - Implement caching with TTL and memory limits

day_6:
  - Integration testing for MCP protocol compliance
  - Documentation updates with examples
  - CI/CD pipeline setup
  - Final validation and deployment testing
```

---

## 📋 Quality Gates & Success Metrics

### **Mandatory Requirements**

- [ ] Zero TypeScript errors with `strict: true`
- [ ] Test coverage ≥80% (unit + integration)
- [ ] No circular dependencies (validated with madge)
- [ ] Memory usage <50MB baseline, <100MB under load
- [ ] Startup time <2 seconds
- [ ] All MCP protocol compliance tests passing

### **Code Quality Metrics**

- [ ] Cyclomatic complexity <10 per function
- [ ] Function length <30 lines average
- [ ] File length <300 lines average
- [ ] Dependency count reduced by 20%
- [ ] ESLint violations = 0

### **Architecture Validation**

- [ ] Clear separation of concerns (handlers, services, models)
- [ ] Proper error handling with Result types
- [ ] Immutable state management
- [ ] Interface-based dependency injection
- [ ] Event-driven component communication

---

## 🔧 Technical Implementation Details

### **Error Handling Pattern**

```typescript
// Implement Result<T, E> pattern for robust error handling
type Result<T, E = Error> = Success<T> | Failure<E>;

interface Success<T> {
  readonly type: "success";
  readonly data: T;
}

interface Failure<E> {
  readonly type: "error";
  readonly error: E;
}

// Usage in handlers
async function trackPrompt(
  prompt: string
): Promise<Result<TrackingResult, TrackingError>> {
  try {
    const result = await langfuseClient.track(prompt);
    return { type: "success", data: result };
  } catch (error) {
    return { type: "error", error: new TrackingError(error.message) };
  }
}
```

### **Dependency Injection Container**

```typescript
// Create IoC container for better testability
class Container {
  private dependencies = new Map<string, any>();

  register<T>(token: string, factory: () => T): void {
    this.dependencies.set(token, factory);
  }

  resolve<T>(token: string): T {
    const factory = this.dependencies.get(token);
    if (!factory) throw new Error(`Dependency not found: ${token}`);
    return factory();
  }
}

// Usage
container.register("langfuseClient", () => new LangfuseClient(config));
container.register(
  "promptOptimizer",
  () => new PromptOptimizer(container.resolve("langfuseClient"))
);
```

### **Performance Monitoring**

```typescript
// Add performance monitoring and metrics
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.recordMetric(operation, performance.now() - start);
      return result;
    } catch (error) {
      this.recordError(operation, error);
      throw error;
    }
  }

  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}
```

---

## 📚 Critical Files for Refactoring

### **High Priority**

1. `src/orchestrator/queen-bee-orchestrator.ts` - Core orchestration logic
2. `src/types/index.ts` - Type definitions and interfaces
3. `src/tools/definitions.ts` - Remove `any` types
4. `src/utils/errorHandler.ts` - Implement Result pattern
5. `src/config/index.ts` - Configuration management

### **Medium Priority**

6. `src/handlers/*.ts` - Separation of concerns refactor
7. `src/improvers/models/*.ts` - Consolidate duplicate code
8. `src/orchestrator/phases/*.ts` - Simplify to 3 phases
9. `package.json` - Dependency cleanup
10. `test/` directory - Expand coverage to 80%

---

## 🚀 Expected Outcomes

### **Technical Benefits**

- **50% reduction** in complexity scores
- **40% improvement** in startup time
- **60% reduction** in memory usage
- **Zero** runtime type errors
- **80%+** test coverage

### **Developer Experience**

- Clear, intuitive API design
- Comprehensive documentation with examples
- Simplified contribution process
- Robust error messages and debugging
- Fast, reliable development workflow

### **Maintainability**

- Modular architecture with clear boundaries
- Consistent coding patterns throughout
- Automated quality checks and CI/CD
- Comprehensive test suite for regression prevention
- Clear upgrade and migration paths

This refactoring will establish the prompt-expert MCP server as a reference implementation for enterprise-grade TypeScript MCP servers while maintaining full backward compatibility and enhancing its core prompt optimization capabilities.
