export async function addXmlStructure(prompt) {
  // If already has good XML structure, enhance it
  if (/<task>.*<\/task>/is.test(prompt)) {
    return enhanceExistingStructure(prompt);
  }
  
  // Otherwise, wrap in XML structure
  return `<task>
<objective>${extractObjective(prompt)}</objective>

<context>
${extractContext(prompt)}
</context>

<requirements>
${extractRequirements(prompt)}
</requirements>

<implementation_details>
${extractImplementationDetails(prompt)}
</implementation_details>
</task>`;
}

function enhanceExistingStructure(prompt) {
  // Add missing sections if needed
  let enhanced = prompt;
  
  if (!/<context>/i.test(enhanced)) {
    enhanced = enhanced.replace(/<task>/i, '<task>\n<context>\n[Extract context from prompt]\n</context>\n');
  }
  
  if (!/<requirements>/i.test(enhanced)) {
    enhanced = enhanced.replace(/<\/task>/i, '\n<requirements>\n[Extract requirements]\n</requirements>\n</task>');
  }
  
  return enhanced;
}

function extractObjective(prompt) {
  // Extract the main objective from the prompt
  const lines = prompt.split('\n');
  const firstLine = lines.find(line => line.trim().length > 0);
  return firstLine || 'Define the main objective clearly';
}

function extractContext(prompt) {
  // Extract context information
  const contextPatterns = /context:|background:|tech stack:|using:/gi;
  const matches = prompt.match(contextPatterns);
  
  if (matches) {
    return '- ' + prompt.split('\n')
      .filter(line => contextPatterns.test(line))
      .join('\n- ');
  }
  
  return '- Define the technical context\n- Specify constraints\n- Mention the tech stack';
}

function extractRequirements(prompt) {
  // Extract requirements
  const requirementPatterns = /must|should|need|require/gi;
  const lines = prompt.split('\n').filter(line => requirementPatterns.test(line));
  
  if (lines.length > 0) {
    return lines.map(line => `- ${line.trim()}`).join('\n');
  }
  
  return `MUST HAVE:
- Core functionality
- Error handling
- Performance requirements

SHOULD HAVE:
- Additional features
- Optimizations`;
}

function extractImplementationDetails(prompt) {
  // Extract any implementation specifics
  const remaining = prompt
    .replace(extractObjective(prompt), '')
    .replace(extractContext(prompt), '')
    .replace(extractRequirements(prompt), '')
    .trim();
  
  return remaining || 'Provide specific implementation guidance';
}