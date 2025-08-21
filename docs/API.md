# API Reference

## MCP Tools

### track
Records prompts to Langfuse.
```typescript
{ prompt: string, category?: string, metadata?: object, quickScore?: number }
```

### evaluate
Scores prompts across 10 criteria.
```typescript
{ prompt: string, promptId?: string }
```
Returns: scores object with weighted criteria (0-100 overall).

### improve
Enhances prompts using techniques.
```typescript
{ prompt: string, targetModel?: string, techniques?: string[] }
```
Techniques: `chain-of-thought`, `xml-structure`, `rich-examples`, `error-handling`, `success-criteria`

### compare
Compares two prompt versions.
```typescript
{ prompt1: string, prompt2: string, promptId?: string }
```

### patterns
Extracts patterns from high-scoring prompts.
```typescript
{ minScore?: number, limit?: number }
```

### deploy
Deploys prompt version to production.
```typescript
{ promptId: string, version: string, label?: string }
```

## Queen Bee Orchestrator

Parallel processing system with 4 phases:

1. **Initial Analysis** (parallel): Track, Evaluate, Context
2. **Conditional Improvement** (parallel): Model-specific optimizers
3. **Finalization**: Save results and update history
4. **Async Pattern Extraction**: Learn from high-scoring prompts

Auto-activates based on context and complexity.