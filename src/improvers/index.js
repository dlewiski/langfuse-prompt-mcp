import { addChainOfThought } from './techniques/chainOfThought.js';
import { addXmlStructure } from './techniques/xmlStructure.js';
import { addExamples } from './techniques/examples.js';
import { addErrorHandling } from './techniques/errorHandling.js';
import { addSuccessCriteria } from './techniques/successCriteria.js';

const techniques = {
  'chain-of-thought': addChainOfThought,
  'xml-structure': addXmlStructure,
  'rich-examples': addExamples,
  'error-handling': addErrorHandling,
  'success-criteria': addSuccessCriteria,
};

export async function applyImprovements(prompt, evaluation, requestedTechniques = []) {
  let improvedPrompt = prompt;
  const appliedTechniques = [];
  
  // Determine which techniques to apply
  const techniquesToApply = requestedTechniques.length > 0 
    ? requestedTechniques 
    : determineTechniquesFromEvaluation(evaluation);
  
  // Apply each technique
  for (const technique of techniquesToApply) {
    if (techniques[technique]) {
      improvedPrompt = await techniques[technique](improvedPrompt);
      appliedTechniques.push(technique);
    }
  }
  
  return {
    text: improvedPrompt,
    techniquesApplied: appliedTechniques,
  };
}

function determineTechniquesFromEvaluation(evaluation) {
  const techniquesToApply = [];
  
  // Apply techniques based on low scores
  if (evaluation.scores.chainOfThought.score < 0.6) {
    techniquesToApply.push('chain-of-thought');
  }
  if (evaluation.scores.structure.score < 0.6) {
    techniquesToApply.push('xml-structure');
  }
  if (evaluation.scores.examples.score < 0.6) {
    techniquesToApply.push('rich-examples');
  }
  if (evaluation.scores.errorHandling.score < 0.6) {
    techniquesToApply.push('error-handling');
  }
  if (!evaluation.scores.successCriteria || evaluation.scores.outputFormat.score < 0.6) {
    techniquesToApply.push('success-criteria');
  }
  
  return techniquesToApply;
}