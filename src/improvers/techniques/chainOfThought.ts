export async function addChainOfThought(prompt: string): Promise<string> {
  // Check if prompt already has chain of thought
  if (/<thinking>|Let me think|step by step/i.test(prompt)) {
    return prompt;
  }
  
  // Add chain of thought section
  const chainOfThought = `
<thinking>
Let me break down this task systematically:
1. First, I'll analyze the core requirements
2. Then, I'll identify the key components needed
3. Next, I'll plan the implementation approach
4. Finally, I'll ensure all requirements are met

This structured approach helps ensure nothing is missed and the solution is comprehensive.
</thinking>

`;
  
  // Insert after initial task description if possible
  if (/<task>/i.test(prompt)) {
    return prompt.replace(/(<task>.*?<\/task>)/is, `$1\n${chainOfThought}`);
  }
  
  // Otherwise, add at the beginning
  return chainOfThought + prompt;
}