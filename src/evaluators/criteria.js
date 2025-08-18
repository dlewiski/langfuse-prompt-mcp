// Individual criterion evaluators

export function evaluateClarity(prompt) {
  let score = 0.5; // Base score
  
  if (prompt.includes('MUST') || prompt.includes('REQUIRED')) score += 0.2;
  if (prompt.includes('specifically') || prompt.includes('exactly')) score += 0.1;
  if (prompt.length > 100 && prompt.length < 2000) score += 0.1;
  if (!/\?{2,}/.test(prompt)) score += 0.1; // No multiple question marks
  
  return Math.min(score, 1.0);
}

export function evaluateStructure(prompt) {
  let score = 0.3;
  
  if (/<\w+>.*<\/\w+>/s.test(prompt)) score += 0.3; // XML tags
  if (/#{1,3}\s+.+/m.test(prompt)) score += 0.2; // Markdown headers
  if (/^\d+\.\s+.+/m.test(prompt)) score += 0.1; // Numbered lists
  if (/^[-*]\s+.+/m.test(prompt)) score += 0.1; // Bullet points
  
  return Math.min(score, 1.0);
}

export function evaluateExamples(prompt) {
  const exampleMatches = prompt.match(/<example>|Example:|For example|e\.g\./gi);
  const count = exampleMatches ? exampleMatches.length : 0;
  
  if (count === 0) return 0.2;
  if (count === 1) return 0.6;
  if (count === 2 || count === 3) return 1.0;
  return 0.8; // Too many examples
}

export function evaluateChainOfThought(prompt) {
  let score = 0.2;
  
  if (/<thinking>|Let me think|step by step/i.test(prompt)) score += 0.4;
  if (/First,.*Then,.*Finally,/is.test(prompt)) score += 0.2;
  if (/reasoning|approach|consider/i.test(prompt)) score += 0.2;
  
  return Math.min(score, 1.0);
}

export function evaluateTechSpecificity(prompt) {
  let score = 0.3;
  const techTerms = /React|FastAPI|TypeScript|Python|API|component|endpoint|database/gi;
  const matches = prompt.match(techTerms);
  
  if (matches && matches.length > 3) score += 0.4;
  if (/version|v\d+|\d+\.\d+/i.test(prompt)) score += 0.1;
  if (/framework|library|package/i.test(prompt)) score += 0.2;
  
  return Math.min(score, 1.0);
}

export function evaluateErrorHandling(prompt) {
  let score = 0.2;
  
  if (/error|exception|failure|edge case/i.test(prompt)) score += 0.4;
  if (/try|catch|handle|recover/i.test(prompt)) score += 0.2;
  if (/validation|sanitize|verify/i.test(prompt)) score += 0.2;
  
  return Math.min(score, 1.0);
}

export function evaluatePerformance(prompt) {
  let score = 0.5;
  
  if (/performance|optimize|efficient|fast/i.test(prompt)) score += 0.3;
  if (/cache|lazy|async|concurrent/i.test(prompt)) score += 0.2;
  
  return Math.min(score, 1.0);
}

export function evaluateTesting(prompt) {
  let score = 0.3;
  
  if (/test|testing|unit test|integration/i.test(prompt)) score += 0.4;
  if (/coverage|assertion|mock/i.test(prompt)) score += 0.3;
  
  return Math.min(score, 1.0);
}

export function evaluateOutputFormat(prompt) {
  let score = 0.4;
  
  if (/format|structure|output|return/i.test(prompt)) score += 0.3;
  if (/JSON|XML|markdown|code/i.test(prompt)) score += 0.2;
  if (/<output>|```/g.test(prompt)) score += 0.1;
  
  return Math.min(score, 1.0);
}

export function evaluateDeployment(prompt) {
  let score = 0.5;
  
  if (/deploy|production|environment|docker/i.test(prompt)) score += 0.3;
  if (/security|authentication|authorization/i.test(prompt)) score += 0.2;
  
  return Math.min(score, 1.0);
}