/**
 * Performance benchmarks for improvement system
 */

import { bench, describe } from 'vitest';
import { improvePrompt } from '../../src/improvers/index.js';
import { addChainOfThought } from '../../src/improvers/techniques/chainOfThought.js';
import { addErrorHandling } from '../../src/improvers/techniques/errorHandling.js';
import { addExamples } from '../../src/improvers/techniques/examples.js';
import { addSuccessCriteria } from '../../src/improvers/techniques/successCriteria.js';
import { addXmlStructure } from '../../src/improvers/techniques/xmlStructure.js';

const prompts = {
  simple: 'Write a function to validate email addresses',
  moderate: `Create a user authentication system with:
    - Login/logout functionality
    - Password reset
    - Session management`,
  complex: `Build a comprehensive e-commerce platform with:
    - Product catalog management
    - Shopping cart functionality
    - Order processing workflow
    - Payment integration
    - Inventory management
    - User reviews and ratings
    - Admin dashboard
    - Email notifications
    - Analytics and reporting`,
  withStructure: `<task>
    <objective>Create a REST API</objective>
    <requirements>CRUD operations for users</requirements>
  </task>`
};

describe('Improvement Techniques Performance', () => {
  bench('addChainOfThought - simple', async () => {
    await addChainOfThought(prompts.simple);
  });

  bench('addChainOfThought - complex', async () => {
    await addChainOfThought(prompts.complex);
  });

  bench('addErrorHandling - simple', async () => {
    await addErrorHandling(prompts.simple);
  });

  bench('addErrorHandling - complex', async () => {
    await addErrorHandling(prompts.complex);
  });

  bench('addExamples - simple', async () => {
    await addExamples(prompts.simple);
  });

  bench('addExamples - complex', async () => {
    await addExamples(prompts.complex);
  });

  bench('addSuccessCriteria - moderate', async () => {
    await addSuccessCriteria(prompts.moderate);
  });

  bench('addXmlStructure - simple', async () => {
    await addXmlStructure(prompts.simple);
  });

  bench('addXmlStructure - already structured', async () => {
    await addXmlStructure(prompts.withStructure);
  });

  bench('all techniques - simple', async () => {
    let prompt = prompts.simple;
    prompt = await addXmlStructure(prompt);
    prompt = await addChainOfThought(prompt);
    prompt = await addErrorHandling(prompt);
    prompt = await addExamples(prompt);
    prompt = await addSuccessCriteria(prompt);
    return prompt;
  });

  bench('all techniques - complex', async () => {
    let prompt = prompts.complex;
    prompt = await addXmlStructure(prompt);
    prompt = await addChainOfThought(prompt);
    prompt = await addErrorHandling(prompt);
    prompt = await addExamples(prompt);
    prompt = await addSuccessCriteria(prompt);
    return prompt;
  });
});

describe('Full Improvement Pipeline', () => {
  bench('improvePrompt - simple', async () => {
    await improvePrompt(prompts.simple);
  });

  bench('improvePrompt - moderate', async () => {
    await improvePrompt(prompts.moderate);
  });

  bench('improvePrompt - complex', async () => {
    await improvePrompt(prompts.complex);
  });

  bench('improvePrompt - with target model (claude)', async () => {
    await improvePrompt(prompts.moderate, { targetModel: 'claude' });
  });

  bench('improvePrompt - with target model (gpt)', async () => {
    await improvePrompt(prompts.moderate, { targetModel: 'gpt' });
  });

  bench('improvePrompt - with target model (gemini)', async () => {
    await improvePrompt(prompts.moderate, { targetModel: 'gemini' });
  });

  bench('improvePrompt - batch of 5 simple', async () => {
    const promises = Array(5).fill(null).map(() => 
      improvePrompt(prompts.simple)
    );
    await Promise.all(promises);
  });

  bench('improvePrompt - batch of 5 complex', async () => {
    const promises = Array(5).fill(null).map(() => 
      improvePrompt(prompts.complex)
    );
    await Promise.all(promises);
  });
});

describe('Model-Specific Optimization', () => {
  bench('Claude optimization - moderate', async () => {
    await improvePrompt(prompts.moderate, { 
      targetModel: 'claude',
      enableModelOptimization: true 
    });
  });

  bench('GPT optimization - moderate', async () => {
    await improvePrompt(prompts.moderate, { 
      targetModel: 'gpt',
      enableModelOptimization: true 
    });
  });

  bench('Gemini optimization - moderate', async () => {
    await improvePrompt(prompts.moderate, { 
      targetModel: 'gemini',
      enableModelOptimization: true 
    });
  });

  bench('Universal optimization - moderate', async () => {
    await improvePrompt(prompts.moderate, { 
      enableModelOptimization: false 
    });
  });
});