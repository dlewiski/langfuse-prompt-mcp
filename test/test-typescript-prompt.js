#!/usr/bin/env node

/**
 * Test improving the TypeScript conversion prompt
 */

import { handleImprove } from '../src/handlers/improve.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.join(__dirname, '..', '.prompts');

// The TypeScript conversion prompt
const testPrompt = "As an expert in typescript and in converting javascript to typescript carefully convert this MCP prompt improver from javascript to typescript";

console.log('\n=== Testing TypeScript Conversion Prompt Improvement ===\n');

async function testPromptImprovement() {
  try {
    console.log('📝 Original prompt:');
    console.log('   "' + testPrompt + '"');
    console.log('\n🔧 Applying improvements with all techniques...\n');
    
    // Call the improve handler with all techniques
    const result = await handleImprove({
      prompt: testPrompt,
      techniques: ['xml-structure', 'chain-of-thought', 'technical-specs', 'error-handling', 'success-criteria', 'rich-examples'],
      targetModel: 'claude',
      enableModelOptimization: true
    });
    
    const response = JSON.parse(result.content[0].text);
    
    console.log('✅ Improvement completed:');
    console.log('   - Original score:', response.original?.score || 'N/A');
    console.log('   - Improved score:', response.improved?.score || 'N/A');
    console.log('   - Improvement:', response.improvement ? `+${response.improvement.toFixed(1)} points` : 'N/A');
    console.log('   - Techniques applied:', response.improved?.techniquesApplied?.join(', ') || 'None');
    
    if (response.savedTo) {
      console.log('\n💾 File automatically saved to:', response.savedTo);
      
      // Verify and display file info
      const filepath = path.join(PROMPTS_DIR, response.savedTo);
      const fileExists = await fs.access(filepath).then(() => true).catch(() => false);
      
      if (fileExists) {
        const stats = await fs.stat(filepath);
        console.log('   - File size:', (stats.size / 1024).toFixed(1), 'KB');
        
        // Read and show a preview of the improved prompt
        const content = await fs.readFile(filepath, 'utf8');
        
        // Extract the improved prompt section
        const improvedMatch = content.match(/## Improved Prompt \(Full Version\)\n\n```xml\n([\s\S]*?)\n```/);
        if (improvedMatch) {
          const improvedPrompt = improvedMatch[1];
          console.log('\n📄 Improved Prompt Preview (first 500 chars):');
          console.log('---');
          console.log(improvedPrompt.substring(0, 500) + '...');
          console.log('---');
        }
        
        // Check for specific TypeScript-related improvements
        console.log('\n🔍 TypeScript-specific improvements:');
        const checks = [
          { name: 'Type definitions mentioned', present: content.toLowerCase().includes('type') },
          { name: 'Interface specifications', present: content.toLowerCase().includes('interface') },
          { name: 'TypeScript configuration', present: content.toLowerCase().includes('tsconfig') },
          { name: 'Migration strategy', present: content.toLowerCase().includes('migration') || content.toLowerCase().includes('convert') },
          { name: 'Error handling for type issues', present: content.includes('error') && content.includes('type') },
        ];
        
        checks.forEach(check => {
          console.log(`   ${check.present ? '✅' : '❌'} ${check.name}`);
        });
        
        // Show if LLM evaluation is pending
        if (response.pendingLLMEvaluation) {
          console.log('\n⏳ Note: LLM evaluation is pending');
          console.log('   - Initial scores are rule-based');
          console.log('   - File will be updated with LLM scores when available');
        }
        
      } else {
        console.error('❌ File was reported as saved but does not exist!');
      }
    } else {
      console.error('\n❌ No savedTo field in response - file was not saved!');
    }
    
    // Show recommendations if any
    if (response.recommendations && response.recommendations.length > 0) {
      console.log('\n💡 Recommendations for further improvement:');
      response.recommendations.slice(0, 3).forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec.criterion}: ${rec.suggestion}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPromptImprovement().then(() => {
  console.log('\n=== Test Complete ===\n');
  console.log('📚 Full improved prompt saved to .prompts/ directory');
  console.log('   Use `cat .prompts/as-an-expert-in-typescript*.md` to view the full report');
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});