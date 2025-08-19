#!/usr/bin/env node

/**
 * Test the simple improvement flow without saving
 */

import { handleImprove } from '../src/handlers/improve.js';

const testPrompt = "As an expert in typescript and in converting javascript to typescript carefully convert this MCP prompt improver from javascript to typescript";

console.log('\n=== Testing Simple Improvement Flow ===\n');
console.log('Original prompt:', testPrompt);
console.log('\n---\n');

async function testSimpleImprovement() {
  try {
    const result = await handleImprove({
      prompt: testPrompt,
      techniques: ['xml-structure', 'chain-of-thought', 'rich-examples'],
      targetModel: 'claude',
      enableModelOptimization: true
    });
    
    const response = JSON.parse(result.content[0].text);
    
    console.log('Response type:', response.action ? 'LLM Task Request' : 'Direct Improvement');
    
    if (response.action === 'require_claude_task') {
      console.log('\n⚠️  LLM evaluation requested');
      console.log('Agent:', response.task?.agent);
      console.log('\nThis means the server wants Claude Code to evaluate the prompt.');
    } else {
      console.log('\n✅ Direct improvement returned:');
      console.log('Original score:', response.original?.score);
      console.log('Improved score:', response.improved?.score);
      console.log('Improvement:', response.improvement);
      console.log('Techniques applied:', response.improved?.techniquesApplied?.join(', '));
      
      if (response.improved?.text) {
        console.log('\n📝 Improved prompt preview (first 500 chars):');
        console.log('---');
        console.log(response.improved.text.substring(0, 500) + '...');
        console.log('---');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSimpleImprovement();