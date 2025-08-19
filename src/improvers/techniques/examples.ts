export async function addExamples(prompt) {
  // Check if prompt already has good examples
  const exampleCount = (prompt.match(/<example>|Example:|For example/gi) || []).length;
  
  if (exampleCount >= 2) {
    return prompt; // Already has enough examples
  }
  
  // Add example section
  const exampleSection = `
<examples>
<example>
<scenario>Common use case for this task</scenario>
<input>Sample input data or parameters</input>
<reasoning>
1. Analyze the input requirements
2. Apply the appropriate solution pattern
3. Handle edge cases and errors
4. Optimize for performance
</reasoning>
<output>Expected output or result</output>
</example>

<example>
<scenario>Edge case or complex variation</scenario>
<input>More complex input scenario</input>
<reasoning>
1. Identify the complexity factors
2. Apply advanced techniques
3. Ensure robustness
4. Validate the result
</reasoning>
<output>Expected handling of complex case</output>
</example>
</examples>`;
  
  // Insert examples section appropriately
  if (/<\/requirements>/i.test(prompt)) {
    return prompt.replace(/<\/requirements>/i, '</requirements>\n' + exampleSection);
  } else if (/<\/task>/i.test(prompt)) {
    return prompt.replace(/<\/task>/i, exampleSection + '\n</task>');
  }
  
  // Add at the end if no structure
  return prompt + '\n' + exampleSection;
}