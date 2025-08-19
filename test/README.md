# Prompt Improvement Test Suite

This test suite verifies the core functionality of the prompt improvement system.

## Running Tests

```bash
# Run all tests
npm test

# Run tests with clean .prompts folder
npm run test:clean
```

## What's Tested

1. **Prompt Evaluation** - Rule-based scoring across 10 criteria
2. **Improvement Application** - XML structure, chain-of-thought, examples
3. **File Generation** - Markdown reports saved to `.prompts/` folder
4. **Score Verification** - Ensures meaningful improvements (20+ points)
5. **Content Validation** - Verifies all required sections in saved files

## Test Cases

- **Simple TypeScript Migration** - Basic prompt improvement
- **Complex MCP Conversion** - Advanced prompt with technical requirements

## Expected Output

✅ All tests should pass with:
- Original scores around 30-40/100
- Improved scores above 60/100
- Markdown files saved to `.prompts/`
- All required sections present in files

## Troubleshooting

If tests fail:

1. Check environment variables in `~/.claude/.env`
2. Ensure MCP server dependencies are installed: `npm install`
3. Verify write permissions for `.prompts/` folder
4. Check that Langfuse connection is configured (optional)