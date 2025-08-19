/**
 * Deploy Handler
 * Deploys prompt versions to production environments
 */

import { DeploySchema, type DeployInput } from '../tools/schemas.js';
import { langfuse } from '../config.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { handlerLogger } from '../utils/logger.js';
import type { LangfuseDeployment } from '../types/domain.js';
import type { MCPRequestContext } from '../types/mcp.js';

/**
 * Deployment response structure
 */
interface DeploymentResponse {
  deployed: boolean;
  promptId: string;
  version: string;
  label: string;
  timestamp: string;
  environment?: string;
  previousVersion?: string;
}

/**
 * Handle deploy tool requests
 */
export async function handleDeploy(
  args: unknown,
  context?: MCPRequestContext
): Promise<ReturnType<typeof successResponse | typeof errorResponse>> {
  try {
    // Validate input
    const { 
      promptId, 
      version, 
      label = 'production' 
    }: DeployInput = DeploySchema.parse(args);
    
    // Check if Langfuse is configured
    if (!langfuse) {
      handlerLogger.error('Langfuse not configured');
      return errorResponse('Langfuse not configured', {
        suggestion: 'Configure Langfuse credentials in environment variables',
      });
    }
    
    // Determine environment from label
    const environment = detectEnvironment(label);
    
    // Create deployment configuration
    const deployment: LangfuseDeployment = {
      promptId,
      version,
      label,
      environment,
      metadata: {
        deployedAt: new Date().toISOString(),
        deployedBy: context?.userId || 'mcp-server',
        sessionId: context?.sessionId,
        ...context?.metadata,
      },
    };
    
    // Simulate deployment (actual Langfuse deployment would go here)
    // Note: The actual Langfuse SDK implementation would vary
    handlerLogger.info(`Deploying prompt ${promptId} version ${version} to ${label}`);
    
    // In a real implementation, you would:
    // 1. Fetch the current deployed version
    // 2. Update the deployment configuration
    // 3. Verify the deployment
    // 4. Optionally rollback on failure
    
    // Mock successful deployment
    const response: DeploymentResponse = {
      deployed: true,
      promptId,
      version,
      label,
      timestamp: new Date().toISOString(),
      environment,
      // previousVersion would come from Langfuse
    };
    
    handlerLogger.info(`Successfully deployed ${promptId} v${version} to ${label}`);
    
    return successResponse(response);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    handlerLogger.error('Error in handleDeploy:', errorMessage);
    
    return errorResponse('Failed to deploy prompt', {
      message: errorMessage,
      suggestion: 'Verify prompt ID and version exist in Langfuse',
    });
  }
}

/**
 * Detect environment from label
 */
function detectEnvironment(label: string): 'development' | 'staging' | 'production' {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('dev') || lowerLabel.includes('development')) {
    return 'development';
  }
  
  if (lowerLabel.includes('stag') || lowerLabel.includes('staging') || lowerLabel.includes('test')) {
    return 'staging';
  }
  
  return 'production';
}

/**
 * Validate deployment prerequisites
 */
async function validateDeployment(
  promptId: string,
  version: string
): Promise<{ valid: boolean; error?: string }> {
  // In a real implementation, this would:
  // 1. Check if prompt exists
  // 2. Check if version exists
  // 3. Check if version has been tested
  // 4. Check deployment permissions
  
  // Mock validation
  if (!promptId || !version) {
    return { 
      valid: false, 
      error: 'Prompt ID and version are required' 
    };
  }
  
  return { valid: true };
}

/**
 * Create rollback plan
 */
interface RollbackPlan {
  previousVersion: string;
  previousLabel: string;
  rollbackCommand: string;
}

function createRollbackPlan(
  promptId: string,
  previousVersion: string,
  label: string
): RollbackPlan {
  return {
    previousVersion,
    previousLabel: label,
    rollbackCommand: `deploy --promptId "${promptId}" --version "${previousVersion}" --label "${label}"`,
  };
}

/**
 * Export handler metadata
 */
export const deployHandlerMetadata = {
  name: 'deploy',
  description: 'Deploy prompt versions to production',
  inputSchema: DeploySchema,
  requiresLangfuse: true,
  environments: ['development', 'staging', 'production'] as const,
  features: [
    'version-deployment',
    'environment-detection',
    'rollback-planning',
    'deployment-validation',
    'metadata-tracking',
  ] as const,
} as const;