#!/usr/bin/env node

/**
 * Test script to verify the improve functionality
 */

import { handleImprove } from './src/handlers/improve.js';

const testPrompt = `I am concerned that I am not seeing any prompt data in my local langfuse running on docker. Here are the most recent logs:
  
  redis-1            | 1:M 18 Aug 2025 18:16:49.167 * Background saving terminated with success
  langfuse-worker-1  | 2025-08-18T18:20:00.070Z info     Executing Blob Storage Integration Job`;

async function testImprovement() {
  console.log('Testing prompt improvement functionality...\n');
  console.log('Original prompt:');
  console.log('================');
  console.log(testPrompt);
  console.log('\n');
  
  try {
    // Test with Claude optimization
    console.log('Testing with Claude optimization...');
    const result = await handleImprove({
      prompt: testPrompt,
      targetModel: 'claude',
      enableModelOptimization: true
    });
    
    const response = JSON.parse(result.content[0].text);
    
    console.log('\nImproved prompt:');
    console.log('===============');
    console.log(response.improved?.text || 'No improved text found');
    console.log('\n');
    
    console.log('Techniques applied:', response.improved?.techniquesApplied || []);
    console.log('Score improvement:', response.improvement || 0);
    
    // Test without model optimization
    console.log('\n\nTesting without model optimization...');
    const result2 = await handleImprove({
      prompt: testPrompt,
      enableModelOptimization: false,
      techniques: ['xml-structure', 'chain-of-thought']
    });
    
    const response2 = JSON.parse(result2.content[0].text);
    console.log('Techniques applied:', response2.improved?.techniquesApplied || []);
    
  } catch (error) {
    console.error('Error during testing:', error);
    console.error('Stack:', error.stack);
  }
}

testImprovement().catch(console.error);