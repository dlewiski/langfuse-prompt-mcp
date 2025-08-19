# Langfuse Prompt MCP Server

TypeScript MCP server for prompt management with Langfuse integration. Features parallel processing via Queen Bee Orchestrator pattern.

## Quick Start

```bash
# Setup
npm install
npm run build

# Run
npm start
```

## Configuration

Create `$HOME/.claude/.env`:

```env
LANGFUSE_PUBLIC_KEY=your_key
LANGFUSE_SECRET_KEY=your_secret
LANGFUSE_HOST=http://localhost:3000  # optional
```

## MCP Tools

| Tool | Purpose | Key Arguments |
|------|---------|---------------|
| `track` | Record prompts to Langfuse | prompt, category, metadata |
| `evaluate` | Score prompts (10 criteria) | prompt, promptId |
| `improve` | Enhance prompts | prompt, targetModel, techniques |
| `compare` | Diff two versions | prompt1, prompt2 |
| `patterns` | Extract successful patterns | minScore, limit |
| `deploy` | Production deployment | promptId, version, label |

## Evaluation Criteria

Weighted scoring across 10 dimensions:
- **Clarity** (1.2x), **Structure** (1.1x), **Chain of Thought** (1.1x), **Tech Specificity** (1.2x)
- **Examples** (1.0x), **Error Handling** (1.0x), **Output Format** (1.0x)
- **Performance** (0.9x), **Testing** (0.9x), **Deployment** (0.8x)

## Architecture

```
src/
├── orchestrator/   # Queen Bee parallel processing
├── handlers/       # Tool implementations  
├── evaluators/     # Scoring logic
├── improvers/      # Enhancement techniques
│   └── models/     # Claude/GPT/Gemini optimizers
└── patterns/       # Pattern extraction
```

## Development

```bash
npm run build       # Compile TypeScript
npm test           # Run tests
npm start          # Start server
```

## Known Issues

- Some TypeScript errors remain (non-blocking)
- See TYPESCRIPT_ISSUES.md for details

## License

See LICENSE file.