#!/usr/bin/env node

/**
 * Test that improved prompts are automatically saved regardless of evaluation type
 */

import { handleImprove } from '../src/handlers/improve.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.join(__dirname, '..', '.prompts');

// Test prompt that should trigger improvements
const testPrompt = "Write a function to calculate fibonacci numbers";

console.log('\n=== Testing Automatic Prompt Saving ===\n');

async function testAutomaticSaving() {
  try {
    console.log('🔬 Test prompt:', testPrompt);
    console.log('\n📝 Requesting prompt improvement...\n');
    
    // Call the improve handler
    const result = await handleImprove({
      prompt: testPrompt,
      techniques: ['xml-structure', 'chain-of-thought', 'rich-examples'],
      targetModel: 'claude',
      enableModelOptimization: true
    });
    
    const response = JSON.parse(result.content[0].text);
    
    console.log('✅ Improvement completed:');
    console.log('   - Original score:', response.original?.score || 'N/A');
    console.log('   - Improved score:', response.improved?.score || 'N/A');
    console.log('   - Improvement:', response.improvement || 'N/A');
    console.log('   - Techniques applied:', response.improved?.techniquesApplied?.join(', ') || 'None');
    
    if (response.savedTo) {
      console.log('\n✅ File automatically saved to:', response.savedTo);
      
      // Verify the file exists
      const filepath = path.join(PROMPTS_DIR, response.savedTo);
      const fileExists = await fs.access(filepath).then(() => true).catch(() => false);
      
      if (fileExists) {
        console.log('✅ File verified to exist');
        
        // Read and check content
        const content = await fs.readFile(filepath, 'utf8');
        
        // Check for key sections
        const checks = [
          { name: 'Score comparison', present: content.includes('## Score Comparison') },
          { name: 'Original prompt', present: content.includes('## Original Prompt') },
          { name: 'Improved prompt', present: content.includes('## Improved Prompt') },
          { name: 'Techniques applied', present: content.includes('## Improvement Techniques Applied') },
        ];
        
        // Check for LLM pending marker if applicable
        if (response.pendingLLMEvaluation) {
          checks.push({
            name: 'LLM evaluation pending marker',
            present: content.includes('## LLM Evaluation Status')
          });
        }
        
        console.log('\n📋 File content verification:');
        checks.forEach(check => {
          console.log(`   ${check.present ? '✅' : '❌'} ${check.name}`);
        });
        
        // Show file size
        const stats = await fs.stat(filepath);
        console.log(`\n📊 File size: ${(stats.size / 1024).toFixed(1)} KB`);
        
        // If LLM evaluation is pending, note it
        if (response.pendingLLMEvaluation) {
          console.log('\n⏳ LLM evaluation is pending');
          console.log('   - File will be updated when LLM evaluation completes');
          console.log('   - Update filename:', response.updateFilename);
        }
        
      } else {
        console.error('❌ File was reported as saved but does not exist!');
      }
    } else {
      console.error('\n❌ No savedTo field in response - file was not saved!');
      console.log('Response:', JSON.stringify(response, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAutomaticSaving().then(() => {
  console.log('\n=== Test Complete ===\n');
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});