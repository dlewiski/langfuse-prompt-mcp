export async function addErrorHandling(prompt) {
  // Check if prompt already mentions error handling
  if (/error|exception|failure|edge case/i.test(prompt)) {
    return enhanceExistingErrorHandling(prompt);
  }
  
  // Add error handling section
  const errorSection = `
<error_handling>
Consider and handle these scenarios:
- Invalid input data or parameters
- Network failures and timeouts
- Database connection issues
- Concurrent access conflicts
- Resource exhaustion (memory, disk)
- Authentication/authorization failures
- Third-party service unavailability

For each error:
1. Catch and identify the specific error type
2. Log with appropriate context and correlation ID
3. Return user-friendly error messages
4. Implement retry logic where appropriate
5. Ensure graceful degradation
</error_handling>`;
  
  // Insert appropriately
  if (/<\/requirements>/i.test(prompt)) {
    return prompt.replace(/<\/requirements>/i, '</requirements>\n' + errorSection);
  } else if (/<\/task>/i.test(prompt)) {
    return prompt.replace(/<\/task>/i, errorSection + '\n</task>');
  }
  
  return prompt + '\n' + errorSection;
}

function enhanceExistingErrorHandling(prompt) {
  // If error handling is mentioned but not comprehensive
  const enhancement = `
Additional error considerations:
- Implement proper error boundaries
- Use structured error responses
- Include correlation IDs for debugging
- Define fallback behaviors
- Monitor and alert on critical errors`;
  
  // Find where to insert enhancement
  if (/error|exception/i.test(prompt)) {
    return prompt.replace(/(error[^.]*\.)/i, '$1' + enhancement);
  }
  
  return prompt + enhancement;
}