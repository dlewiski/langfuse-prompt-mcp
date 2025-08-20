export async function addSuccessCriteria(prompt: string): Promise<string> {
  // Check if prompt already has success criteria
  if (/success criteria|acceptance criteria|definition of done/i.test(prompt)) {
    return prompt;
  }
  
  // Add success criteria section
  const successSection = `
<success_criteria>
The implementation is complete when:
- All functional requirements are met
- Code passes all unit and integration tests
- Performance benchmarks are satisfied
- Security best practices are followed
- Documentation is comprehensive
- Error handling is robust
- The solution is production-ready

Measurable outcomes:
- Test coverage > 80%
- Response time < 200ms (p95)
- Zero critical security vulnerabilities
- All edge cases handled gracefully
</success_criteria>`;
  
  // Insert appropriately
  if (/<\/examples>/i.test(prompt)) {
    return prompt.replace(/<\/examples>/i, '</examples>\n' + successSection);
  } else if (/<\/task>/i.test(prompt)) {
    return prompt.replace(/<\/task>/i, successSection + '\n</task>');
  }
  
  return prompt + '\n' + successSection;
}