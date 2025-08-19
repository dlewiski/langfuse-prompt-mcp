#!/usr/bin/env node

/**
 * Test improvement with forced rule-based evaluation
 */

import { evaluatePrompt } from '../src/evaluators/index.js';
import { applyImprovements } from '../src/improvers/index.js';

const testPrompt = "As an expert in typescript and in converting javascript to typescript carefully convert this MCP prompt improver from javascript to typescript";

console.log('\n=== Testing Rule-Based Improvement ===\n');
console.log('Original prompt:', testPrompt);
console.log('\n---\n');

async function testRuleBasedImprovement() {
  try {
    // Force rule-based evaluation
    const evaluation = await evaluatePrompt(testPrompt, null, false); // false = no LLM
    console.log('Original evaluation:');
    console.log('- Score:', evaluation.overallScore);
    console.log('- Scores:', Object.entries(evaluation.scores || {}).map(([k, v]) => `${k}: ${v.score}`).join(', '));
    
    // Apply improvements
    const improved = await applyImprovements(testPrompt, evaluation, ['xml-structure', 'chain-of-thought', 'rich-examples']);
    console.log('\nTechniques applied:', improved.techniquesApplied.join(', '));
    
    console.log('\n📝 Improved prompt:');
    console.log('---');
    console.log(improved.text);
    console.log('---');
    
    // Check if it's actually improved or just generic
    const hasOriginalContent = improved.text.toLowerCase().includes('typescript');
    const hasConversionContext = improved.text.toLowerCase().includes('convert');
    const hasMCPContext = improved.text.toLowerCase().includes('mcp');
    
    console.log('\n🔍 Content preservation check:');
    console.log('- Contains "typescript":', hasOriginalContent);
    console.log('- Contains "convert":', hasConversionContext);
    console.log('- Contains "MCP":', hasMCPContext);
    
    if (!hasOriginalContent || !hasConversionContext) {
      console.log('\n❌ WARNING: The improved prompt lost the original context!');
      console.log('The improvement techniques are adding generic templates instead of enhancing the actual prompt.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRuleBasedImprovement();