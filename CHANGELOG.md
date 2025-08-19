# Changelog

## [2.0.0] - 2024-12-19

### Complete TypeScript Migration

- **Migrated**: All 36 JavaScript files to TypeScript
- **Added**: Queen Bee Orchestrator for parallel processing
- **Added**: Model-specific optimizers (Claude, GPT, Gemini)
- **Fixed**: Circular dependency in config module
- **Removed**: 17 duplicate JavaScript files

### Breaking Changes
- Source files now in `src/*.ts` (was `src/*.js`)
- Requires build step: `npm run build`

## [1.0.0] - 2024-12-01

### Initial Release

- 6 MCP tools: track, evaluate, improve, compare, patterns, deploy
- 10 weighted evaluation criteria
- 5 improvement techniques
- Langfuse integration
- Claude Code Task tool delegation