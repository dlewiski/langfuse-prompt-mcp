#!/usr/bin/env node

/**
 * Test updating a saved prompt file with LLM evaluation scores
 */

import { updateImprovedPromptWithLLMScores } from '../src/utils/promptUpdater.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.join(__dirname, '..', '.prompts');

console.log('\n=== Testing LLM Score Update ===\n');

async function testLLMUpdate() {
  try {
    // Find the most recent saved prompt file
    const files = await fs.readdir(PROMPTS_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    if (mdFiles.length === 0) {
      console.log('❌ No saved prompt files found to test with');
      return;
    }
    
    // Sort by modification time and get the most recent
    const fileStats = await Promise.all(
      mdFiles.map(async (filename) => {
        const filepath = path.join(PROMPTS_DIR, filename);
        const stats = await fs.stat(filepath);
        return { filename, mtime: stats.mtime };
      })
    );
    
    fileStats.sort((a, b) => b.mtime - a.mtime);
    const targetFile = fileStats[0].filename;
    
    console.log('📄 Testing with file:', targetFile);
    
    // Read the current content
    const originalContent = await fs.readFile(path.join(PROMPTS_DIR, targetFile), 'utf8');
    
    // Check if it has a pending marker
    if (originalContent.includes('## LLM Evaluation Status')) {
      console.log('✅ File has pending LLM evaluation marker');
    }
    
    // Simulate LLM evaluation results
    const mockLLMEvaluation = {
      overallScore: 45,  // Original score from LLM
      scores: {
        clarity: { score: 0.5 },
        structure: { score: 0.4 },
        examples: { score: 0.3 }
      }
    };
    
    const mockImprovedLLMEvaluation = {
      overallScore: 92,  // Improved score from LLM
      scores: {
        clarity: { score: 0.9 },
        structure: { score: 0.95 },
        examples: { score: 0.9 }
      }
    };
    
    console.log('\n📊 Simulating LLM evaluation results:');
    console.log('   - Original LLM score: 45/100');
    console.log('   - Improved LLM score: 92/100');
    
    // Update the file with LLM scores
    const updateResult = await updateImprovedPromptWithLLMScores({
      filename: targetFile,
      llmEvaluation: mockLLMEvaluation,
      improvedLLMEvaluation: mockImprovedLLMEvaluation
    });
    
    if (updateResult.success) {
      console.log('\n✅ File updated with LLM scores');
      
      // Read the updated content
      const updatedContent = await fs.readFile(path.join(PROMPTS_DIR, targetFile), 'utf8');
      
      // Check for LLM update section
      if (updatedContent.includes('## LLM Evaluation Update')) {
        console.log('✅ LLM evaluation section added/updated');
        
        // Extract and show the LLM section
        const llmSectionMatch = updatedContent.match(/## LLM Evaluation Update[\s\S]*?(?=\n##|\n\*Report generated at:|$)/);
        if (llmSectionMatch) {
          console.log('\n📝 LLM Evaluation Section:');
          console.log('---');
          console.log(llmSectionMatch[0]);
          console.log('---');
        }
      }
      
      // Check if scores were updated
      const scoreMatch = updatedContent.match(/\| \*\*Overall Score\*\* \| ([\d.]+)\/100 \| ([\d.]+)\/100/);
      if (scoreMatch) {
        console.log('\n📈 Updated scores in comparison table:');
        console.log(`   - Original: ${scoreMatch[1]}/100`);
        console.log(`   - Improved: ${scoreMatch[2]}/100`);
      }
      
    } else {
      console.error('❌ Failed to update file:', updateResult.error);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLLMUpdate().then(() => {
  console.log('\n=== Test Complete ===\n');
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});