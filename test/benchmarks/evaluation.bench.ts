/**
 * Performance benchmarks for evaluation system
 */

import { bench, describe } from 'vitest';
import { evaluatePrompt } from '../../src/evaluators/index.js';
import { 
  evaluateClarity,
  evaluateStructure,
  evaluateExamples,
  evaluateChainOfThought,
  evaluateTechSpecificity,
  evaluateErrorHandling,
  evaluatePerformance,
  evaluateTesting,
  evaluateOutputFormat,
  evaluateDeployment
} from '../../src/evaluators/criteria.js';

const samplePrompts = {
  simple: 'Write a function to add two numbers',
  moderate: `Create a REST API endpoint that:
    - Accepts JSON data
    - Validates input
    - Returns formatted response
    - Handles errors gracefully`,
  complex: `<task>
    <objective>Build a comprehensive authentication system</objective>
    <requirements>
      - JWT token generation and validation
      - Role-based access control
      - Password hashing with bcrypt
      - Rate limiting
      - Session management
    </requirements>
    <examples>
      <example>
        <input>{ "email": "user@example.com", "password": "secure123" }</input>
        <output>{ "token": "jwt...", "user": { ... } }</output>
      </example>
    </examples>
    <error_handling>
      Handle invalid credentials, expired tokens, rate limits
    </error_handling>
  </task>`
};

describe('Evaluation Criteria Performance', () => {
  bench('evaluateClarity - simple prompt', () => {
    evaluateClarity(samplePrompts.simple);
  });

  bench('evaluateClarity - complex prompt', () => {
    evaluateClarity(samplePrompts.complex);
  });

  bench('evaluateStructure - simple prompt', () => {
    evaluateStructure(samplePrompts.simple);
  });

  bench('evaluateStructure - complex prompt', () => {
    evaluateStructure(samplePrompts.complex);
  });

  bench('evaluateExamples - with examples', () => {
    evaluateExamples(samplePrompts.complex);
  });

  bench('evaluateChainOfThought - complex prompt', () => {
    evaluateChainOfThought(samplePrompts.complex);
  });

  bench('all criteria - simple prompt', () => {
    evaluateClarity(samplePrompts.simple);
    evaluateStructure(samplePrompts.simple);
    evaluateExamples(samplePrompts.simple);
    evaluateChainOfThought(samplePrompts.simple);
    evaluateTechSpecificity(samplePrompts.simple);
    evaluateErrorHandling(samplePrompts.simple);
    evaluatePerformance(samplePrompts.simple);
    evaluateTesting(samplePrompts.simple);
    evaluateOutputFormat(samplePrompts.simple);
    evaluateDeployment(samplePrompts.simple);
  });

  bench('all criteria - complex prompt', () => {
    evaluateClarity(samplePrompts.complex);
    evaluateStructure(samplePrompts.complex);
    evaluateExamples(samplePrompts.complex);
    evaluateChainOfThought(samplePrompts.complex);
    evaluateTechSpecificity(samplePrompts.complex);
    evaluateErrorHandling(samplePrompts.complex);
    evaluatePerformance(samplePrompts.complex);
    evaluateTesting(samplePrompts.complex);
    evaluateOutputFormat(samplePrompts.complex);
    evaluateDeployment(samplePrompts.complex);
  });
});

describe('Full Evaluation Pipeline', () => {
  bench('evaluatePrompt - simple', async () => {
    await evaluatePrompt(samplePrompts.simple);
  });

  bench('evaluatePrompt - moderate', async () => {
    await evaluatePrompt(samplePrompts.moderate);
  });

  bench('evaluatePrompt - complex', async () => {
    await evaluatePrompt(samplePrompts.complex);
  });

  bench('evaluatePrompt - batch of 10 simple', async () => {
    const promises = Array(10).fill(null).map(() => 
      evaluatePrompt(samplePrompts.simple)
    );
    await Promise.all(promises);
  });

  bench('evaluatePrompt - batch of 10 complex', async () => {
    const promises = Array(10).fill(null).map(() => 
      evaluatePrompt(samplePrompts.complex)
    );
    await Promise.all(promises);
  });
});