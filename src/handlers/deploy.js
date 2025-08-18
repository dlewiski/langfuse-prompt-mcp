import { DeploySchema } from '../tools/schemas.js';
import { langfuse } from '../config.js';

export async function handleDeploy(args) {
  const { promptId, version, label } = DeploySchema.parse(args);
  
  try {
    // Update prompt label in Langfuse
    await langfuse.updatePrompt({
      promptId,
      version,
      labels: [label],
    });
    
    const deployment = {
      promptId,
      version,
      label,
      status: 'deployed',
      timestamp: new Date().toISOString(),
    };
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(deployment, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'Deployment failed',
          message: error.message,
          promptId,
          version,
        }, null, 2)
      }]
    };
  }
}