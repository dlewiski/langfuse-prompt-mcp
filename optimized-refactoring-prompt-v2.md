# Optimized Refactoring Prompt for Prompt-Expert MCP Server (v2)

## Context & Current State

Building upon significant TypeScript migration improvements completed on 2025-08-20, continue refactoring the MCP server at `/Users/davidlewis/.claude/mcp-servers/prompt-expert` to achieve final enterprise-grade quality.

## ✅ Completed Improvements (No longer needed)

- **Full TypeScript strict mode** enabled (all flags)
- **104 type errors** fixed with noImplicitAny
- **Structured Winston logging** replacing all console.\* calls
- **94.24% type coverage** achieved (target: 95%)
- **Pre-commit hooks** with husky and lint-staged
- **Performance benchmarks** for evaluation and improvement
- **JSDoc documentation** with TypeDoc generation
- **Comprehensive type interfaces** in `/src/types/common.ts`

---

## 🎯 Remaining Refactoring Targets

### 1. **Reduce Explicit 'any' Types** (Priority: HIGH)

**Current State:** 98 explicit `any` types remaining
**Target:** <20 explicit `any` types

```typescript
// Current problem areas:
// claude-code-hook.ts (17 any types)
export const handler = async (params: any): Promise<any> => {...}

// Target: Specific types
export const handler = async (params: HandlerParams): Promise<HandlerResult> => {...}
```

**Action Items:**

- [ ] Define specific types for claude-code-hook.ts handlers (17 instances)
- [ ] Create error handling types to replace `any` in catch blocks (13 instances)
- [ ] Type external library interactions properly (8 instances)
- [ ] Update tool definitions to use `MCPTool` type instead of `ReadonlyArray<any>`

### 2. **Achieve 95% Type Coverage** (Priority: HIGH)

**Current:** 94.24% (9176/9736)
**Gap:** 0.76% (~74 more typed instances needed)

**Focus Areas:**

```typescript
// Add explicit return types to async functions
async function processPrompt(prompt: string) {
  // Missing return type
  return await optimizer.optimize(prompt);
}

// Should be:
async function processPrompt(prompt: string): Promise<OptimizationResult> {
  return await optimizer.optimize(prompt);
}
```

### 3. **Simplify Queen Bee Orchestrator** (Priority: MEDIUM)

**Current State:** Complex 4-phase pattern with tight coupling
**Target:** Streamlined 3-phase pipeline

```typescript
// Current: 4 phases with integration layer
Phase1 → Phase2 → Phase3 → Phase4 → Integration

// Target: Simplified pipeline
interface Pipeline {
  analyze(prompt: string): Promise<AnalysisResult>;
  transform(analysis: AnalysisResult): Promise<TransformResult>;
  validate(result: TransformResult): Promise<ValidationResult>;
}
```

**Actions:**

- [ ] Merge Phase 3 & 4 into single validation phase
- [ ] Remove orchestrator/integration.ts layer
- [ ] Implement pipeline pattern with clear interfaces
- [ ] Use event emitter for phase communication

### 4. **Resolve Circular Dependencies** (Priority: MEDIUM)

**Risk Areas:**

- `orchestrator → handlers → orchestrator/integration.ts`
- `improvers/models → baseOptimizer → modelDetector`

**Solution Implementation:**

```typescript
// Create dependency injection container
class DIContainer {
  private services = new Map<string, () => any>();

  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }

  resolve<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) throw new Error(`Service not found: ${name}`);
    return factory();
  }
}

// Usage in server.ts
const container = new DIContainer();
container.register("langfuse", () => langfuseClient);
container.register(
  "optimizer",
  () => new PromptOptimizer(container.resolve("langfuse"))
);
```

### 5. **Performance Optimization** (Priority: LOW)

**Current Benchmarks:** Already implemented
**Target Improvements:**

- Reduce startup time from ~3s to <2s
- Implement lazy loading for model optimizers
- Add caching layer with TTL

```typescript
// Implement lazy loading
const optimizers = new Map<ModelType, () => Promise<IOptimizer>>();
optimizers.set("claude", () => import("./models/claudeOptimizer"));
optimizers.set("gpt4", () => import("./models/gpt4Optimizer"));

// Load only when needed
async function getOptimizer(model: ModelType): Promise<IOptimizer> {
  const loader = optimizers.get(model);
  if (!loader) throw new Error(`Unknown model: ${model}`);
  return await loader();
}
```

---

## 🏗️ Parallel Execution Strategy

### **IMPORTANT: Execute ALL phases in parallel using separate sub-agents**

Execute this refactoring NOW with maximum parallelization. Spawn 5 sub-agents to work simultaneously on independent file groups to avoid conflicts.

### **Sub-Agent Task Distribution**

#### **Sub-Agent 1: Type System & Definitions**

**Files:** `src/types/`, `src/tools/definitions.ts`
**No conflicts with:** All other agents (isolated type definitions)

```yaml
Tasks:
  - Create new type definitions in src/types/refactor.ts
  - Define ClaudeHookParams, ClaudeHookResult interfaces
  - Create error type hierarchy (BaseError, ValidationError, etc.)
  - Update MCPTool interface
  - Define Pipeline interfaces
```

#### **Sub-Agent 2: Claude Hook & Handlers**

**Files:** `src/claude-code-hook.ts`, `src/handlers/*.ts`
**Depends on:** Sub-Agent 1 types (import only)

```yaml
Tasks:
  - Replace 17 'any' types in claude-code-hook.ts
  - Add return types to all async functions in handlers/
  - Import and use types from src/types/refactor.ts
  - Type error handling in catch blocks
```

#### **Sub-Agent 3: Orchestrator Refactoring**

**Files:** `src/orchestrator/`, except integration.ts
**No conflicts with:** Other agents (isolated directory)

```yaml
Tasks:
  - Create new pipeline.ts with 3-phase implementation
  - Merge phases 3 & 4 in phases/ directory
  - Implement event emitter pattern
  - Keep old orchestrator intact for now (rename to orchestrator-old.ts)
```

#### **Sub-Agent 4: Dependency Injection & Config**

**Files:** `src/config/`, `src/server.ts`
**No conflicts with:** Other agents until final integration

```yaml
Tasks:
  - Create src/di/container.ts with DIContainer class
  - Update server.ts to use DI container
  - Add caching configuration to config/
  - Implement lazy loading registry
```

#### **Sub-Agent 5: Performance & External Libraries**

**Files:** `src/improvers/models/`, `src/utils/`
**No conflicts with:** Other agents (isolated improvements)

```yaml
Tasks:
  - Type external library calls (node-fetch, langfuse)
  - Implement lazy loading for model optimizers
  - Add performance monitoring utilities
  - Create caching layer implementation
```

### **Conflict Avoidance Rules**

1. **No Shared File Editing**: Each sub-agent works on exclusive files
2. **Type Imports Only**: Sub-Agents 2-5 can import from Sub-Agent 1's types but not modify
3. **New Files First**: Create new implementations before modifying existing ones
4. **Preserve Working Code**: Keep old implementations with -old suffix until verified
5. **Integration Last**: Final integration only after all sub-agents complete

### **Synchronization Points**

```yaml
checkpoint_1: (After 30 minutes)
- Sub-Agent 1 completes type definitions
- Other agents can start importing types

checkpoint_2: (After 1 hour)
- All agents complete primary tasks
- Run type-coverage check
- Begin integration phase

checkpoint_3: (After 1.5 hours)
- Integration complete
- Run full test suite
- Remove -old files if tests pass
```

### **Final Integration Phase** (All agents complete)

```yaml
Integration Tasks:
  - Wire up new pipeline in server.ts
  - Replace old orchestrator imports
  - Remove integration.ts
  - Update all imports to use new types
  - Run madge to verify no circular dependencies
  - Execute full test suite with benchmarks
  - Check type coverage ≥95%
```

---

## 📋 Quality Gates & Success Metrics

### **Updated Requirements**

- [x] Zero TypeScript errors with `strict: true` ✅
- [ ] Explicit 'any' types <20 (currently 98)
- [ ] Type coverage ≥95% (currently 94.24%)
- [x] Structured logging implemented ✅
- [x] Pre-commit hooks configured ✅
- [ ] No circular dependencies (validate with madge)
- [ ] Startup time <2 seconds
- [x] Performance benchmarks established ✅

### **Code Quality Targets**

- [ ] Cyclomatic complexity <10 per function
- [ ] Orchestrator reduced to 3 phases
- [ ] All async functions have explicit return types
- [ ] Dependency injection implemented
- [ ] 100% of error handlers properly typed

---

## 🔧 Specific Implementation Tasks

### Task 1: Type the claude-code-hook.ts

```typescript
// Define specific types
interface ClaudeHookParams {
  action: "evaluate" | "improve" | "track";
  prompt: string;
  metadata?: Record<string, unknown>;
  config?: Partial<EvaluationConfig>;
}

interface ClaudeHookResult {
  success: boolean;
  data?: EvaluationResult | ImprovementResult | TrackingResult;
  error?: ErrorDetails;
}

// Replace current implementation
export const handler = async (
  params: ClaudeHookParams
): Promise<ClaudeHookResult> => {
  // Implementation
};
```

### Task 2: Create Error Type System

```typescript
// Define error hierarchy
abstract class BaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
  }
}

class ValidationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", context);
  }
}

class LangfuseError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "LANGFUSE_ERROR", context);
  }
}
```

### Task 3: Simplify Orchestrator

```typescript
// New pipeline implementation
class PromptPipeline {
  constructor(
    private analyzer: IAnalyzer,
    private transformer: ITransformer,
    private validator: IValidator
  ) {}

  async process(prompt: string): Promise<PipelineResult> {
    const analysis = await this.analyzer.analyze(prompt);
    const transformed = await this.transformer.transform(analysis);
    const validated = await this.validator.validate(transformed);

    return {
      original: prompt,
      analysis,
      transformed,
      validated,
      score: this.calculateScore(validated),
    };
  }
}
```

---

## 📚 Files Requiring Updates

### **High Priority (Phase 1)**

1. `src/claude-code-hook.ts` - Replace 17 `any` types
2. `src/tools/definitions.ts` - Type tool definitions array
3. `src/utils/errorHandler.ts` - Implement typed error system
4. `src/handlers/*.ts` - Add return types to async functions

### **Medium Priority (Phase 2)**

5. `src/orchestrator/queen-bee-orchestrator.ts` - Simplify to pipeline
6. `src/orchestrator/phases/*.ts` - Consolidate to 3 phases
7. `src/orchestrator/integration.ts` - Remove this layer
8. `src/server.ts` - Implement DI container

### **Low Priority (Phase 3)**

9. `src/improvers/models/*.ts` - Lazy loading implementation
10. `src/config/index.ts` - Add caching configuration

---

## 🚀 Expected Outcomes

### **Technical Improvements**

- **78% reduction** in explicit `any` types (98 → 20)
- **0.76% increase** in type coverage (94.24% → 95%+)
- **25% reduction** in orchestrator complexity
- **33% faster** startup time (3s → 2s)
- **Zero** circular dependencies

### **Code Quality Benefits**

- Type-safe error handling throughout
- Clear dependency injection pattern
- Simplified 3-phase orchestration
- Lazy-loaded model optimizers
- Comprehensive type definitions

### **Developer Experience**

- Better IDE autocomplete with proper types
- Clearer error messages with typed errors
- Simpler contribution with DI pattern
- Faster development with proper types
- Maintained backward compatibility

This focused refactoring builds upon the excellent TypeScript migration work already completed, addressing the specific remaining gaps to achieve a fully production-ready, type-safe MCP server implementation.
