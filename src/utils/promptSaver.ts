/**
 * Prompt Saver Utility
 * Saves improved prompts to the file system
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { EvaluationResult, ImprovementTechnique } from '../types/domain.js';

export interface SavePromptOptions {
  original: {
    text: string;
    score: number;
  };
  improved: {
    text: string;
    score: number;
    techniquesApplied: ImprovementTechnique[];
  };
  targetModel?: string;
  evaluation?: EvaluationResult;
  improvedEvaluation?: EvaluationResult;
  filename?: string;
}

export interface SavePromptResult {
  success: boolean;
  filepath?: string;
  error?: string;
}

/**
 * Saves an improved prompt to a markdown file
 */
export async function saveImprovedPrompt(options: SavePromptOptions): Promise<SavePromptResult> {
  try {
    const {
      original,
      improved,
      targetModel = 'universal',
      evaluation,
      improvedEvaluation,
      filename
    } = options;

    // Use provided filename or generate one
    const filepath = filename || path.join(
      process.cwd(),
      '.prompts',
      `improved-${targetModel}-${Date.now()}.md`
    );

    // Ensure directory exists
    const dir = path.dirname(filepath);
    await fs.mkdir(dir, { recursive: true });

    // Generate markdown content
    const content = generateMarkdownContent({
      original,
      improved,
      targetModel,
      evaluation,
      improvedEvaluation
    });

    // Write to file
    await fs.writeFile(filepath, content, 'utf-8');

    return {
      success: true,
      filepath
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generates markdown content for the saved prompt
 */
function generateMarkdownContent(options: {
  original: SavePromptOptions['original'];
  improved: SavePromptOptions['improved'];
  targetModel?: string;
  evaluation?: EvaluationResult;
  improvedEvaluation?: EvaluationResult;
}): string {
  const { original, improved, targetModel, evaluation, improvedEvaluation } = options;

  const sections = [
    '# Improved Prompt',
    '',
    `**Target Model**: ${targetModel}`,
    `**Date**: ${new Date().toISOString()}`,
    '',
    '## Score Comparison',
    '',
    `- **Original**: ${original.score.toFixed(1)}`,
    `- **Improved**: ${improved.score.toFixed(1)}`,
    `- **Gain**: +${(improved.score - original.score).toFixed(1)}`,
    '',
    '## Techniques Applied',
    '',
    improved.techniquesApplied.map(t => `- ${t}`).join('\n'),
    '',
    '## Original Prompt',
    '',
    '```',
    original.text,
    '```',
    '',
    '## Improved Prompt',
    '',
    '```',
    improved.text,
    '```'
  ];

  if (evaluation) {
    sections.push(
      '',
      '## Original Evaluation',
      '',
      '### Strengths',
      evaluation.strengths.map(s => `- ${s}`).join('\n'),
      '',
      '### Weaknesses',
      evaluation.weaknesses.map(w => `- ${w}`).join('\n')
    );
  }

  if (improvedEvaluation) {
    sections.push(
      '',
      '## Improved Evaluation',
      '',
      '### Strengths',
      improvedEvaluation.strengths.map(s => `- ${s}`).join('\n'),
      '',
      '### Weaknesses',
      improvedEvaluation.weaknesses.map(w => `- ${w}`).join('\n')
    );
  }

  return sections.join('\n');
}

export default saveImprovedPrompt;