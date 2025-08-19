/**
 * Handler Module Index
 * Central export point for all MCP tool handlers
 */

import { handleTrack } from './track.js';
import { handleEvaluate } from './evaluate.js';
import { handleImprove } from './improve.js';
import { handleCompare } from './compare.js';
import { handlePatterns } from './patterns.js';
import { handleDeploy } from './deploy.js';

export { handleTrack, trackHandlerMetadata } from './track.js';
export { handleEvaluate, evaluateHandlerMetadata } from './evaluate.js';
export { handleImprove, improveHandlerMetadata } from './improve.js';
export { handleCompare, compareHandlerMetadata } from './compare.js';
export { handlePatterns, patternsHandlerMetadata } from './patterns.js';
export { handleDeploy, deployHandlerMetadata } from './deploy.js';

// Re-export types if needed
export type { TrackInput } from '../tools/schemas.js';
export type { EvaluateInput } from '../tools/schemas.js';
export type { ImproveInput } from '../tools/schemas.js';
export type { CompareInput } from '../tools/schemas.js';
export type { PatternsInput } from '../tools/schemas.js';
export type { DeployInput } from '../tools/schemas.js';

/**
 * Handler registry for dynamic routing
 */
export const HandlerRegistry = {
  track: handleTrack,
  evaluate: handleEvaluate,
  improve: handleImprove,
  compare: handleCompare,
  patterns: handlePatterns,
  deploy: handleDeploy,
} as const;

export type HandlerName = keyof typeof HandlerRegistry;