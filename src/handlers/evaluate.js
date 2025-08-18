import { EvaluateSchema } from '../tools/schemas.js';
import { evaluatePrompt } from '../evaluators/index.js';
import { parseLLMEvaluation } from '../evaluators/llm-judge.js';

export async function handleEvaluate(args) {
  const { prompt, promptId } = EvaluateSchema.parse(args);
  const result = await evaluatePrompt(prompt, promptId, true); // Use LLM by default
  
  // Check if this is an LLM evaluation request
  if (result.type === 'llm_evaluation') {
    // Return a special response that signals Claude Code to use Task
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          action: 'require_claude_task',
          task: result.agentTask,
          instructions: 'Use the Task tool to execute this evaluation with the prompt-evaluation-judge agent',
          parseFunction: 'parseLLMEvaluation'
        }, null, 2)
      }]
    };
  }
  
  // Regular rule-based evaluation
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}