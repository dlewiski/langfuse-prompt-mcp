# How to Use the Langfuse Prompt MCP Server in Claude Code

## Quick Start

The Langfuse Prompt MCP server helps you improve prompts using best practices and model-specific optimizations.

## Available Tools

### 1. `improve` - Improve a Prompt
```javascript
mcp__langfuse-prompt__improve({
  prompt: "Your prompt here",
  techniques: ["xml-structure", "chain-of-thought", "rich-examples"],
  targetModel: "claude"
})
```

This will either:
- Return an improved prompt directly (with rule-based scoring)
- Request LLM evaluation via Claude Task

### 2. `save` - Save an Improved Prompt
After improving a prompt, you can save it:

```javascript
mcp__langfuse-prompt__save({
  originalPrompt: "The original prompt text",
  improvedPrompt: "The improved version",
  originalScore: 35.98,
  improvedScore: 85.50,
  techniquesApplied: ["xml-structure", "chain-of-thought"]
})
```

The prompt will be saved to `.prompts/` directory as a markdown file.

### 3. `evaluate` - Evaluate a Prompt
```javascript
mcp__langfuse-prompt__evaluate({
  prompt: "Your prompt to evaluate"
})
```

Returns a score and recommendations for improvement.

## Workflow Example

### Step 1: Improve a Prompt
When you call `improve`, the server will:
1. Apply improvement techniques (xml-structure, examples, etc.)
2. Return the improved prompt
3. Request LLM evaluation if configured

### Step 2: Save the Result
After improvement, save the prompt:

```javascript
// After getting improvement results
mcp__langfuse-prompt__save({
  originalPrompt: originalText,
  improvedPrompt: improvedText,
  originalScore: 40,
  improvedScore: 90,
  techniquesApplied: ["xml-structure", "chain-of-thought", "rich-examples"]
})
```

## Important Notes

1. **The improvement techniques currently add generic templates** - The actual prompt content is preserved in the `<objective>` tag, but the supporting content is generic.

2. **Scores can be:**
   - Rule-based (immediate, less accurate)
   - LLM-based (requires Claude Task, more accurate)

3. **Saved files are in `.prompts/` directory** with format:
   ```
   {prompt-title}-{date}.md
   ```

## Example Usage in Claude Code

```javascript
// 1. Improve a TypeScript conversion prompt
const result = await mcp__langfuse-prompt__improve({
  prompt: "Convert this JavaScript code to TypeScript with full type safety",
  techniques: ["xml-structure", "chain-of-thought", "technical-specs"],
  targetModel: "claude"
});

// 2. If you get the improved prompt back, save it
if (result.improved) {
  await mcp__langfuse-prompt__save({
    originalPrompt: result.original.text,
    improvedPrompt: result.improved.text,
    originalScore: result.original.score,
    improvedScore: result.improved.score,
    techniquesApplied: result.improved.techniquesApplied
  });
}
```

## Available Improvement Techniques

- `xml-structure` - Adds XML organization
- `chain-of-thought` - Adds step-by-step thinking
- `rich-examples` / `examples` - Adds example scenarios
- `error-handling` - Adds error handling guidance
- `success-criteria` - Adds measurable success criteria
- `technical-specs` - Adds technical specifications

## File Structure

Saved prompts will have this structure:
```markdown
# Improved Prompt

## Summary
- Date, scores, improvement metrics

## Original Prompt
The original text

## Improved Prompt
The enhanced version with techniques applied

## Notes
Additional context
```