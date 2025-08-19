# Langfuse Prompt MCP Server

A Model Context Protocol (MCP) server for advanced prompt management, evaluation, and optimization integrated with Langfuse.

## Features

- **Prompt Tracking**: Record and categorize prompts with metadata
- **Multi-Criteria Evaluation**: Analyze prompts across 10 weighted dimensions
- **Intelligent Improvement**: Apply targeted enhancement techniques
- **Version Comparison**: Compare prompt versions side-by-side
- **Pattern Extraction**: Learn from high-performing prompts
- **Production Deployment**: Manage prompt versions in production

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd langfuse-prompt

# Run setup script
./setup.sh

# Or manually install dependencies
npm install
```

## Configuration

Create a `.env` file in `$HOME/.claude/`:

```env
# Required
LANGFUSE_PUBLIC_KEY=your_public_key
LANGFUSE_SECRET_KEY=your_secret_key

# Optional
LANGFUSE_HOST=http://localhost:3000  # Default: localhost:3000
MIN_IMPROVEMENT_SCORE=85              # Target score for improvements
MAX_ITERATIONS=5                       # Improvement iteration limit
PATTERN_MIN_SCORE=80                   # Threshold for pattern extraction
USE_LLM_JUDGE=true                     # Enable LLM evaluation
LLM_MODEL=claude-sonnet-4              # LLM model for evaluation
```

## Usage

### Starting the Server

```bash
npm start
```

The server runs as an MCP server and integrates with Claude Code through stdio transport.

### Available Tools

#### 1. Track Prompts

Record prompts with automatic categorization and metadata:

```json
{
  "tool": "track",
  "arguments": {
    "prompt": "Your prompt text here",
    "category": "react", // Optional: auto-detected if not provided
    "metadata": {
      "wordCount": 150,
      "complexity": "high",
      "hasCode": true,
      "frameworks": ["React", "TypeScript"]
    },
    "quickScore": 85 // Optional: 0-100
  }
}
```

#### 2. Evaluate Prompts

Get comprehensive evaluation across 10 criteria:

```json
{
  "tool": "evaluate",
  "arguments": {
    "prompt": "Your prompt to evaluate",
    "promptId": "optional-langfuse-id"
  }
}
```

Returns scores for:

- **Clarity** (1.2x weight): Unambiguous instructions
- **Structure** (1.1x): XML tags and organization
- **Examples** (1.0x): 2-3 examples with reasoning
- **Chain of Thought** (1.1x): Explicit thinking sections
- **Tech Specificity** (1.2x): Framework-specific patterns
- **Error Handling** (1.0x): Comprehensive scenarios
- **Performance** (0.9x): Optimization mentions
- **Testing** (0.9x): Test specifications
- **Output Format** (1.0x): Clear structure definition
- **Deployment** (0.8x): Production considerations

#### 3. Improve Prompts

Apply enhancement techniques based on evaluation:

```json
{
  "tool": "improve",
  "arguments": {
    "prompt": "Your prompt to improve",
    "techniques": ["chain-of-thought", "xml-structure"] // Optional: auto-selected
  }
}
```

Available techniques:

- `chain-of-thought`: Add explicit reasoning steps
- `xml-structure`: Organize with XML tags
- `rich-examples`: Add detailed examples
- `error-handling`: Include error scenarios
- `success-criteria`: Define clear success metrics

#### 4. Compare Versions

Analyze differences between two prompt versions:

```json
{
  "tool": "compare",
  "arguments": {
    "prompt1": "Original version",
    "prompt2": "Improved version",
    "promptId": "optional-id"
  }
}
```

#### 5. Extract Patterns

Learn from high-performing prompts:

```json
{
  "tool": "patterns",
  "arguments": {
    "minScore": 85, // Default: 85
    "limit": 100 // Default: 100
  }
}
```

#### 6. Deploy to Production

Manage prompt versions in production:

```json
{
  "tool": "deploy",
  "arguments": {
    "promptId": "prompt-id",
    "version": "v1.2.3",
    "label": "production" // Default: production
  }
}
```

## Architecture

### Directory Structure

```
langfuse-prompt/
├── server.js              # MCP server entry point
├── src/
│   ├── config.js          # Configuration and constants
│   ├── tools/
│   │   ├── definitions.js # Tool schemas for MCP
│   │   └── schemas.js     # Zod validation schemas
│   ├── handlers/          # Request handlers for each tool
│   │   ├── track.js
│   │   ├── evaluate.js
│   │   ├── improve.js
│   │   ├── compare.js
│   │   ├── patterns.js
│   │   └── deploy.js
│   ├── evaluators/        # Evaluation logic
│   │   ├── index.js       # Main evaluation orchestrator
│   │   ├── criteria.js    # Individual criterion evaluators
│   │   ├── llm-judge.js   # LLM-based evaluation
│   │   └── recommendations.js
│   ├── improvers/         # Improvement techniques
│   │   ├── index.js
│   │   └── techniques/
│   │       ├── chainOfThought.js
│   │       ├── xmlStructure.js
│   │       ├── examples.js
│   │       ├── errorHandling.js
│   │       └── successCriteria.js
│   └── patterns/          # Pattern extraction
│       └── extractor.js
```

### Key Design Patterns

#### 1. Handler-Based Architecture

Each tool has a dedicated handler that:

- Validates input using Zod schemas
- Processes the request
- Returns formatted MCP responses

#### 2. LLM Integration Pattern

The server uses a unique approach for LLM evaluation:

- Returns special responses with `action: 'require_claude_task'`
- Delegates to Claude Code's Task tool
- Avoids external API calls

#### 3. Weighted Scoring System

Evaluation uses weighted criteria:

- Each criterion has a base score (0-1)
- Weights adjust importance (0.8-1.2x)
- Overall score = weighted average \* 100

#### 4. Progressive Enhancement

Improvements are applied iteratively:

- Evaluate current state
- Apply targeted techniques
- Re-evaluate and compare
- Repeat until target score reached

## Integration with Claude Code

### MCP Commands

The server integrates with Claude Code's command system:

```bash
# Quick evaluation
/prompt-review "Your prompt here"

# Full improvement pipeline
/prompt-auto-improve "Your prompt here"

# Pattern discovery
/prompt-discover-patterns

# Test specific techniques
/prompt-test-improvement "Your prompt" --techniques chain-of-thought

# Compare versions
/prompt-compare-versions "v1" "v2"
```

### Task Tool Integration

For LLM evaluation, the server returns:

```json
{
  "action": "require_claude_task",
  "task": {
    "agent": "prompt-evaluation-judge",
    "description": "Evaluate prompt quality",
    "prompt": "..."
  }
}
```

Claude Code then uses its Task tool with specialized agents:

- `prompt-evaluation-judge`: For evaluation
- `claude4-opus-prompt-optimizer`: For improvement

## Best Practices

### Prompt Categories

The server auto-detects categories:

- **react**: React/component/JSX/hooks
- **api**: API/endpoint/REST/GraphQL
- **database**: SQL/query/schema
- **question**: Questions and explanations
- **general**: Everything else

### Evaluation Thresholds

- **Excellent**: 90+ overall score
- **Good**: 80-89
- **Needs Improvement**: 70-79
- **Poor**: Below 70

### Improvement Strategy

1. Start with evaluation to identify weaknesses
2. Apply targeted techniques for low-scoring areas
3. Use comparison to verify improvements
4. Extract patterns from successful prompts
5. Deploy tested versions to production

## Troubleshooting

### Common Issues

1. **Connection Failed**

   - Check Langfuse credentials in `.env`
   - Verify Langfuse host is accessible

2. **Evaluation Returns Low Scores**

   - Review individual criterion scores
   - Apply recommended techniques
   - Use LLM evaluation for better accuracy

3. **Improvements Not Effective**
   - Try different technique combinations
   - Increase iteration limit
   - Review patterns from high-scoring prompts

## Development

### Running Tests

```bash
npm test  # If tests are available
```

### Adding New Techniques

1. Create technique file in `src/improvers/techniques/`
2. Export improvement function
3. Register in `src/improvers/index.js`

### Adding New Criteria

1. Add evaluator in `src/evaluators/criteria.js`
2. Register in `EVALUATION_CRITERIA` config
3. Update recommendations logic

## License

See LICENSE file for details.
