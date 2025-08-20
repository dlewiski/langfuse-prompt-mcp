/**
 * Simple save handler for improved prompts
 * This can be called by Claude Code after improvement is complete
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { successResponse, errorResponse } from '../utils/response.js';
import { handlerLogger } from '../utils/logger.js';
import type { MCPResponseWithContent } from '../utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PROMPTS_DIR = path.join(ROOT_DIR, '.prompts');

interface SaveArgs {
  originalPrompt?: string;
  improvedPrompt?: string;
  originalScore?: number;
  improvedScore?: number;
  techniquesApplied?: string[];
  filename?: string;
}

export async function handleSave(args: SaveArgs): Promise<MCPResponseWithContent> {
  const { 
    originalPrompt = '',
    improvedPrompt = '',
    originalScore,
    improvedScore,
    techniquesApplied = [],
    filename
  } = args;

  try {
    // Ensure .prompts directory exists
    await fs.mkdir(PROMPTS_DIR, { recursive: true });
    
    // Generate filename if not provided
    const finalFilename = filename || generateFilename(originalPrompt);
    const filepath = path.join(PROMPTS_DIR, finalFilename);
    
    // Create simple markdown content
    const content = createMarkdownContent({
      originalPrompt,
      improvedPrompt,
      ...(originalScore !== undefined && { originalScore }),
      ...(improvedScore !== undefined && { improvedScore }),
      techniquesApplied
    });
    
    // Save the file
    await fs.writeFile(filepath, content, 'utf8');
    
    handlerLogger.info(`Saved improved prompt to: ${filepath}`);
    
    return successResponse({
      message: 'Improved prompt saved successfully',
      filename: finalFilename,
      filepath: filepath,
      size: content.length
    });
    
  } catch (error) {
    handlerLogger.error('Error saving prompt:', error);
    return errorResponse('Failed to save prompt', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

function generateFilename(prompt: string): string {
  // Extract a meaningful title from the prompt
  const cleanTitle = prompt
    .slice(0, 50)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
    
  const timestamp = new Date().toISOString().split('T')[0];
  return `${cleanTitle}-${timestamp}.md`;
}

interface MarkdownData {
  originalPrompt: string;
  improvedPrompt: string;
  originalScore?: number;
  improvedScore?: number;
  techniquesApplied: string[];
}

function createMarkdownContent(data: MarkdownData): string {
  const {
    originalPrompt,
    improvedPrompt,
    originalScore,
    improvedScore,
    techniquesApplied = []
  } = data;
  
  const improvement = (typeof originalScore === 'number' && typeof improvedScore === 'number')
    ? (improvedScore - originalScore).toFixed(1)
    : 'N/A';
  
  return `# Improved Prompt

## Summary
- **Date**: ${new Date().toISOString()}
- **Original Score**: ${originalScore ?? 'N/A'}
- **Improved Score**: ${improvedScore ?? 'N/A'}
- **Improvement**: ${improvement}
- **Techniques Applied**: ${techniquesApplied.join(', ') || 'None'}

## Original Prompt
\`\`\`
${originalPrompt}
\`\`\`

## Improved Prompt
\`\`\`
${improvedPrompt}
\`\`\`

## Notes
This prompt was improved using the langfuse-prompt MCP server.
`;
}