#!/usr/bin/env node

/**
 * Test the save functionality
 */

import { handleSave } from '../src/handlers/save.js';

const testData = {
  originalPrompt: "As an expert in typescript and in converting javascript to typescript carefully convert this MCP prompt improver from javascript to typescript",
  improvedPrompt: `<task>
<objective>As an expert in typescript and in converting javascript to typescript carefully convert this MCP prompt improver from javascript to typescript</objective>

<context>
- Task: Convert JavaScript to TypeScript
- Project: MCP prompt improver
- Expertise Required: TypeScript expert
</context>

<requirements>
MUST HAVE:
- Full type safety
- Preserve all functionality
- TypeScript best practices
</requirements>
</task>`,
  originalScore: 35.98,
  improvedScore: 85.50,
  techniquesApplied: ['xml-structure', 'chain-of-thought', 'rich-examples']
};

console.log('\n=== Testing Save Functionality ===\n');

async function testSave() {
  try {
    const result = await handleSave(testData);
    const response = JSON.parse(result.content[0].text);
    
    if (response.filename) {
      console.log('✅ Save successful!');
      console.log('- Filename:', response.filename);
      console.log('- Path:', response.filepath);
      console.log('- Size:', response.size, 'bytes');
    } else {
      console.log('❌ Save failed:', response.error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSave();