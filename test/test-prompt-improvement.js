#!/usr/bin/env node

/**
 * Test Suite for Prompt Improvement Functionality
 * 
 * This test verifies:
 * 1. Prompt evaluation (rule-based)
 * 2. Improvement techniques application
 * 3. Markdown file generation in .prompts folder
 * 4. Score improvements and metrics
 * 
 * Run with: npm test
 */

import { evaluatePrompt } from '../src/evaluators/index.js';
import { applyImprovements } from '../src/improvers/index.js';
import { saveImprovedPrompt } from '../src/utils/promptSaver.js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables
config({ path: path.join(process.env.HOME, '.claude', '.env') });

// Test configuration
const TEST_CASES = [
  {
    name: 'Simple TypeScript Migration',
    prompt: 'Please update this nodejs project from js to typescript',
    targetModel: 'claude',
    techniques: ['xml-structure', 'chain-of-thought', 'rich-examples'],
    expectedMinImprovement: 20
  },
  {
    name: 'Complex MCP Conversion',
    prompt: 'Convert this MCP server to TypeScript with full type safety',
    targetModel: 'claude',
    techniques: ['xml-structure', 'technical-specs', 'error-handling', 'success-criteria'],
    expectedMinImprovement: 25
  }
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

/**
 * Run a single test case
 */
async function runTestCase(testCase) {
  const results = {
    name: testCase.name,
    passed: true,
    errors: [],
    metrics: {}
  };

  try {
    // Step 1: Evaluate original prompt
    const originalEval = await evaluatePrompt(testCase.prompt, null, false);
    results.metrics.originalScore = originalEval.overallScore;
    
    // Step 2: Apply improvements
    const improved = await applyImprovements(
      testCase.prompt, 
      originalEval, 
      testCase.techniques
    );
    
    // Step 3: Evaluate improved prompt
    const improvedEval = await evaluatePrompt(improved.text, null, false);
    results.metrics.improvedScore = improvedEval.overallScore;
    results.metrics.improvement = improvedEval.overallScore - originalEval.overallScore;
    
    // Step 4: Save to markdown
    const saveResult = await saveImprovedPrompt({
      original: {
        text: testCase.prompt,
        score: originalEval.overallScore
      },
      improved: {
        text: improved.text,
        score: improvedEval.overallScore,
        techniquesApplied: improved.techniquesApplied
      },
      targetModel: testCase.targetModel,
      techniques: testCase.techniques,
      enableModelOptimization: true,
      evaluation: originalEval,
      improvedEvaluation: improvedEval,
      modelOptimizationResult: null
    });
    
    // Verify save was successful
    if (!saveResult.success) {
      results.passed = false;
      results.errors.push(`Failed to save markdown: ${saveResult.error}`);
    } else {
      results.metrics.savedFile = saveResult.filename;
      
      // Verify file exists
      const filePath = path.join(ROOT_DIR, '.prompts', saveResult.filename);
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      
      if (!fileExists) {
        results.passed = false;
        results.errors.push('Saved file does not exist');
      } else {
        // Verify file content
        const content = await fs.readFile(filePath, 'utf8');
        const hasRequiredSections = [
          '## Score Comparison',
          '## Improved Prompt (Full Version)',
          '## Improvement Statistics',
          '### Detailed Criteria Scores'
        ].every(section => content.includes(section));
        
        if (!hasRequiredSections) {
          results.passed = false;
          results.errors.push('Markdown file missing required sections');
        }
      }
    }
    
    // Check improvement threshold
    if (results.metrics.improvement < testCase.expectedMinImprovement) {
      results.passed = false;
      results.errors.push(
        `Improvement ${results.metrics.improvement.toFixed(1)} below expected ${testCase.expectedMinImprovement}`
      );
    }
    
    // Verify techniques were applied
    if (improved.techniquesApplied.length === 0) {
      results.passed = false;
      results.errors.push('No improvement techniques were applied');
    }
    
  } catch (error) {
    results.passed = false;
    results.errors.push(error.message);
  }
  
  return results;
}

/**
 * Display test results
 */
function displayResults(result) {
  const status = result.passed 
    ? `${colors.green}✓ PASS${colors.reset}` 
    : `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`\n${status} ${result.name}`);
  
  if (result.metrics.originalScore !== undefined) {
    console.log(`  ${colors.gray}Original Score: ${result.metrics.originalScore.toFixed(1)}/100${colors.reset}`);
    console.log(`  ${colors.gray}Improved Score: ${result.metrics.improvedScore.toFixed(1)}/100${colors.reset}`);
    console.log(`  ${colors.blue}Improvement: +${result.metrics.improvement.toFixed(1)} points${colors.reset}`);
    
    if (result.metrics.savedFile) {
      console.log(`  ${colors.gray}Saved to: .prompts/${result.metrics.savedFile}${colors.reset}`);
    }
  }
  
  if (result.errors.length > 0) {
    result.errors.forEach(error => {
      console.log(`  ${colors.red}Error: ${error}${colors.reset}`);
    });
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Prompt Improvement Test Suite\n');
  console.log('=' .repeat(60));
  
  let totalPassed = 0;
  let totalFailed = 0;
  const results = [];
  
  // Run each test case
  for (const testCase of TEST_CASES) {
    const result = await runTestCase(testCase);
    results.push(result);
    
    if (result.passed) {
      totalPassed++;
    } else {
      totalFailed++;
    }
    
    displayResults(result);
  }
  
  // Verify .prompts folder
  console.log('\n' + '=' .repeat(60));
  console.log('📂 Verifying .prompts folder...');
  
  const promptsDir = path.join(ROOT_DIR, '.prompts');
  const folderExists = await fs.access(promptsDir).then(() => true).catch(() => false);
  
  if (folderExists) {
    const files = await fs.readdir(promptsDir);
    console.log(`${colors.green}✓${colors.reset} Folder exists with ${files.length} file(s)`);
  } else {
    console.log(`${colors.red}✗${colors.reset} .prompts folder not found`);
    totalFailed++;
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Summary\n');
  console.log(`  Total Tests: ${TEST_CASES.length}`);
  console.log(`  ${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${totalFailed}${colors.reset}`);
  
  if (totalFailed === 0) {
    console.log(`\n${colors.green}✨ All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}⚠️  Some tests failed${colors.reset}`);
    process.exit(1);
  }
  
  console.log('\n💡 To view saved prompts, check the .prompts/ folder');
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});