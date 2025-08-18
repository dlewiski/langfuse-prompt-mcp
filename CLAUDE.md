# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that integrates with Langfuse for prompt management, evaluation, and improvement. The server provides tools for tracking, analyzing, and optimizing prompts through both rule-based and LLM-based evaluation methods.

## Development Commands

### Running the Server
```bash
# Start the MCP server
npm start

# Setup script for initial configuration
./setup.sh
```

### Dependencies
```bash
# Install dependencies
npm install
```

## Architecture

### Core Structure
The server follows a modular handler-based architecture:

1. **Entry Point**: `server.js` - MCP server setup and request routing
2. **Tool Definitions**: `src/tools/definitions.js` - MCP tool schemas 
3. **Request Handlers**: `src/handlers/` - Individual tool implementations
4. **Business Logic Modules**:
   - `src/evaluators/` - Prompt evaluation logic (rule-based and LLM-based)
   - `src/improvers/` - Prompt improvement techniques
   - `src/patterns/` - Pattern extraction from high-scoring prompts

### Key Integration Points

#### Claude Code Task Tool Integration
The server uses a special pattern to delegate LLM evaluation to Claude Code's Task tool:
- Returns `action: 'require_claude_task'` responses
- Specifies agent types: `prompt-evaluation-judge`, `claude4-opus-prompt-optimizer`
- Avoids external API calls by leveraging Claude Code's built-in capabilities

#### Environment Configuration
- Expects `.env` file at `$HOME/.claude/.env`
- Required variables: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`
- Optional: `LANGFUSE_HOST` (defaults to localhost:3000)

### Available MCP Tools

1. **track**: Records prompts to Langfuse with metadata
2. **evaluate**: Analyzes prompts on 10 weighted criteria
3. **improve**: Applies improvement techniques based on evaluation
4. **compare**: Compares two prompt versions
5. **patterns**: Extracts patterns from high-scoring prompts
6. **deploy**: Deploys prompt versions to production

### Evaluation Criteria
Weighted scoring system in `src/config.js`:
- clarity (1.2x)
- structure (1.1x)
- examples (1.0x)
- chainOfThought (1.1x)
- techSpecificity (1.2x)
- errorHandling (1.0x)
- performance (0.9x)
- testing (0.9x)
- outputFormat (1.0x)
- deployment (0.8x)

### Improvement Techniques
Located in `src/improvers/techniques/`:
- Chain of thought structuring
- XML structure organization
- Rich example generation
- Error handling scenarios
- Success criteria definition

## Important Implementation Details

### LLM Evaluation Flow
1. Handler receives evaluation request
2. Returns special response format for Claude Code
3. Claude Code uses Task tool with specified agent
4. Results parsed via `parseLLMEvaluation()`

### Rule-Based Fallback
When LLM evaluation unavailable:
- Uses criterion evaluator functions in `src/evaluators/criteria.js`
- Generates recommendations via `src/evaluators/recommendations.js`
- Tracks scores to Langfuse if promptId provided

### Configuration Constants
From `src/config.js`:
- `MIN_IMPROVEMENT_SCORE`: 85 (target score for improvements)
- `MAX_ITERATIONS`: 5 (improvement iteration limit)
- `PATTERN_MIN_SCORE`: 80 (threshold for pattern extraction)
- `USE_LLM_JUDGE`: true by default
- `LLM_MODEL`: claude-sonnet-4 default