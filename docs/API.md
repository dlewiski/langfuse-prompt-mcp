# API Reference

## MCP Tools

### track

Track and record prompts to Langfuse with metadata and categorization.

**Input Schema:**
```typescript
{
  prompt: string;           // Required: The prompt text to track
  category?: string;        // Optional: Category (auto-detected if not provided)
  metadata?: {
    wordCount?: number;     // Word count of the prompt
    complexity?: string;    // Complexity level: "low" | "medium" | "high"
    hasCode?: boolean;      // Whether prompt contains code
    frameworks?: string[];  // List of frameworks mentioned
  };
  quickScore?: number;      // Optional: Quick evaluation score (0-100)
}
```

**Response:**
```json
{
  "tracked": true,
  "traceId": "uuid",
  "category": "detected-category",
  "wordCount": 150
}
```

**Auto-detected Categories:**
- `react`: React, components, JSX, TSX, hooks, state
- `api`: API, endpoints, FastAPI, REST, GraphQL, routes
- `database`: Database, SQL, queries, schemas, migrations
- `question`: Questions (what, how, why, explain)
- `general`: Default category

---

### evaluate

Evaluate prompts across 10 weighted criteria for comprehensive quality assessment.

**Input Schema:**
```typescript
{
  prompt: string;          // Required: The prompt to evaluate
  promptId?: string;       // Optional: Langfuse prompt ID for tracking
}
```

**Response:**
```json
{
  "overallScore": 85.5,
  "scores": {
    "clarity": {
      "score": 0.9,
      "weighted": 1.08,
      "description": "Unambiguous instructions"
    },
    "structure": {
      "score": 0.8,
      "weighted": 0.88,
      "description": "XML tags and organization"
    },
    // ... other criteria
  },
  "recommendations": [
    "Add more specific examples",
    "Include error handling scenarios"
  ],
  "evaluationType": "rule-based" | "llm-based"
}
```

**Evaluation Criteria:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| clarity | 1.2x | Unambiguous instructions |
| structure | 1.1x | XML tags and organization |
| examples | 1.0x | 2-3 examples with reasoning |
| chainOfThought | 1.1x | Explicit thinking sections |
| techSpecificity | 1.2x | Framework-specific patterns |
| errorHandling | 1.0x | Comprehensive scenarios |
| performance | 0.9x | Optimization mentions |
| testing | 0.9x | Test specifications |
| outputFormat | 1.0x | Clear structure definition |
| deployment | 0.8x | Production considerations |

---

### improve

Generate improved versions of prompts using targeted enhancement techniques.

**Input Schema:**
```typescript
{
  prompt: string;           // Required: The prompt to improve
  promptId?: string;        // Optional: Langfuse prompt ID
  techniques?: string[];    // Optional: Specific techniques to apply
}
```

**Available Techniques:**
- `chain-of-thought`: Add explicit reasoning steps
- `xml-structure`: Organize content with XML tags
- `rich-examples`: Add detailed examples with explanations
- `error-handling`: Include comprehensive error scenarios
- `success-criteria`: Define clear success metrics

**Response:**
```json
{
  "original": {
    "text": "original prompt",
    "score": 72.3
  },
  "improved": {
    "text": "improved prompt with enhancements",
    "score": 88.7,
    "techniquesApplied": ["chain-of-thought", "xml-structure"]
  },
  "improvement": 16.4,
  "recommendations": [
    "Consider adding more examples",
    "Include edge case handling"
  ]
}
```

**Auto-technique Selection:**
- Scores < 0.6 trigger specific techniques
- Chain of thought for reasoning issues
- XML structure for organization problems
- Examples for demonstration gaps
- Error handling for robustness issues

---

### compare

Compare two prompt versions with detailed analysis.

**Input Schema:**
```typescript
{
  prompt1: string;          // Required: First prompt version
  prompt2: string;          // Required: Second prompt version
  promptId?: string;        // Optional: Langfuse prompt ID for versioning
}
```

**Response:**
```json
{
  "version1": {
    "score": 75.2,
    "strengths": [
      {
        "criterion": "clarity",
        "score": 0.85,
        "description": "Unambiguous instructions"
      }
    ],
    "weaknesses": [
      {
        "criterion": "examples",
        "score": 0.4,
        "description": "2-3 examples with reasoning"
      }
    ]
  },
  "version2": {
    "score": 82.6,
    "strengths": [...],
    "weaknesses": [...]
  },
  "recommendation": "version2",
  "improvement": 7.4,
  "detailedComparison": {
    "clarity": {
      "version1": 0.85,
      "version2": 0.90,
      "difference": 0.05,
      "improved": true
    }
    // ... other criteria
  }
}
```

---

### patterns

Extract patterns from high-performing prompts in Langfuse.

**Input Schema:**
```typescript
{
  minScore?: number;        // Default: 85 - Minimum score threshold
  limit?: number;           // Default: 100 - Number of prompts to analyze
}
```

**Response:**
```json
{
  "patterns": [
    {
      "pattern": "XML structure usage",
      "frequency": 0.92,
      "averageScore": 89.3,
      "examples": [
        "Example prompt using this pattern..."
      ]
    },
    {
      "pattern": "Chain of thought sections",
      "frequency": 0.85,
      "averageScore": 87.6,
      "examples": [...]
    }
  ],
  "recommendations": [
    "Use XML tags for structure",
    "Include explicit thinking sections",
    "Add 2-3 concrete examples"
  ],
  "stats": {
    "totalAnalyzed": 100,
    "averageScore": 88.2,
    "topCategories": ["react", "api"]
  }
}
```

---

### deploy

Deploy prompt versions to production environments.

**Input Schema:**
```typescript
{
  promptId: string;         // Required: Prompt ID to deploy
  version: string;          // Required: Version identifier
  label?: string;           // Default: "production" - Deployment label
}
```

**Response:**
```json
{
  "deployed": true,
  "promptId": "prompt-123",
  "version": "v1.2.3",
  "label": "production",
  "timestamp": "2024-01-15T10:30:00Z",
  "previousVersion": "v1.2.2"
}
```

**Deployment Labels:**
- `production`: Main production environment
- `staging`: Staging/testing environment
- `development`: Development environment
- Custom labels supported

---

## Error Handling

All tools return errors in a consistent format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `INVALID_PARAMS`: Invalid input parameters
- `LANGFUSE_ERROR`: Langfuse connection/API error
- `EVALUATION_ERROR`: Evaluation process failed
- `IMPROVEMENT_ERROR`: Improvement process failed
- `NOT_FOUND`: Resource not found

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LANGFUSE_PUBLIC_KEY` | Required | Langfuse public API key |
| `LANGFUSE_SECRET_KEY` | Required | Langfuse secret API key |
| `LANGFUSE_HOST` | `http://localhost:3000` | Langfuse server URL |
| `MIN_IMPROVEMENT_SCORE` | `85` | Target score for improvements |
| `MAX_ITERATIONS` | `5` | Maximum improvement iterations |
| `PATTERN_MIN_SCORE` | `80` | Minimum score for pattern extraction |
| `PATTERN_MIN_OCCURRENCES` | `3` | Minimum pattern occurrences |
| `USE_LLM_JUDGE` | `true` | Enable LLM-based evaluation |
| `LLM_MODEL` | `claude-sonnet-4` | LLM model for evaluation |

---

## Integration

### Claude Code Task Tool

For LLM-based operations, the server returns special responses:

```json
{
  "action": "require_claude_task",
  "task": {
    "agent": "prompt-evaluation-judge",
    "description": "Evaluate prompt quality",
    "prompt": "..."
  },
  "instructions": "Use the Task tool to execute this evaluation",
  "parseFunction": "parseLLMEvaluation"
}
```

**Supported Agents:**
- `prompt-evaluation-judge`: LLM-based prompt evaluation
- `claude4-opus-prompt-optimizer`: Advanced prompt optimization

### MCP Protocol

The server implements the Model Context Protocol with:
- **Transport**: stdio (standard input/output)
- **Version**: 1.0.0
- **Capabilities**: Tools only (no resources or prompts)

---

## Scoring System

### Score Ranges

| Score | Grade | Description |
|-------|-------|-------------|
| 90-100 | Excellent | Production-ready, well-optimized |
| 80-89 | Good | Minor improvements needed |
| 70-79 | Fair | Several areas need improvement |
| 60-69 | Poor | Significant improvements required |
| <60 | Failing | Major rewrite recommended |

### Weighted Scoring Formula

```
Overall Score = Σ(criterion_score × criterion_weight) / Σ(criterion_weights) × 100
```

---

## Examples

### Basic Evaluation
```javascript
// Evaluate a simple prompt
const result = await mcp.call('evaluate', {
  prompt: 'Write a React component for a button'
});
```

### Improvement Pipeline
```javascript
// Full improvement workflow
const evaluation = await mcp.call('evaluate', { prompt });
const improved = await mcp.call('improve', { 
  prompt,
  techniques: ['chain-of-thought', 'xml-structure']
});
const comparison = await mcp.call('compare', {
  prompt1: prompt,
  prompt2: improved.improved.text
});
```

### Pattern Learning
```javascript
// Extract patterns from high performers
const patterns = await mcp.call('patterns', {
  minScore: 90,
  limit: 50
});
// Apply learned patterns to new prompts
```