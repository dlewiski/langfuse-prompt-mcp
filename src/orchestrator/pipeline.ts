/**
 * PromptPipeline - 3-Phase Implementation
 * Simplifies orchestration from 4 phases to 3 phases with event emitter pattern
 */

import { EventEmitter } from 'events';
import type { 
  IAnalyzer, 
  ITransformer, 
  IValidator, 
  PipelineResult, 
  PipelineMetadata, 
  StepMetadata, 
  TimingInfo,
  QualityMetrics,
  ValidationResult
} from '../types/refactor.js';
import { createModuleLogger } from '../utils/structuredLogger.js';

// Pipeline-specific types
export interface PipelineEvents {
  'phase-start': { phase: string; timestamp: number };
  'phase-complete': { phase: string; result: any; timestamp: number };
  'phase-error': { phase: string; error: Error; timestamp: number };
  'pipeline-start': { timestamp: number };
  'pipeline-complete': { result: PipelineResult; timestamp: number };
  'pipeline-error': { error: Error; timestamp: number };
}

export interface PromptAnalysisInput {
  prompt: string;
  metadata?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface PromptAnalysisOutput {
  evaluation: {
    score: number;
    breakdown: Record<string, number>;
    recommendations: string[];
  };
  context: {
    wordCount: number;
    complexity: 'simple' | 'moderate' | 'complex';
    hasCode: boolean;
    frameworks: string[];
    category: string;
  };
  metadata: Record<string, unknown>;
}

export interface PromptTransformInput {
  originalPrompt: string;
  originalScore: number;
  context: any;
  analysisOutput: PromptAnalysisOutput;
}

export interface PromptTransformOutput {
  improved: boolean;
  bestImprovement?: {
    prompt: string;
    method: string;
    scoreImprovement: number;
    reasoning: string;
  };
  alternativeImprovements: Array<{
    prompt: string;
    method: string;
    scoreImprovement: number;
    reasoning: string;
  }>;
  metadata: Record<string, unknown>;
}

export interface PromptValidationInput {
  originalPrompt: string;
  originalScore: number;
  transformOutput: PromptTransformOutput;
  analysisOutput: PromptAnalysisOutput;
}

export interface PromptValidationOutput {
  finalPrompt: string;
  finalScore: number;
  improvement?: number;
  patterns?: any[];
  validation: ValidationResult;
  metadata: {
    originalScore: number;
    improved: boolean;
    method?: string;
    tracking?: any;
    evaluation?: any;
    patternExtraction?: any;
  };
}

/**
 * 3-Phase Prompt Processing Pipeline
 * Phase 1: Analyze - Evaluate and understand the prompt
 * Phase 2: Transform - Improve the prompt if needed
 * Phase 3: Validate - Finalize, track, and extract patterns
 */
export class PromptPipeline extends EventEmitter {
  private logger = createModuleLogger('PromptPipeline');
  private analyzer?: IAnalyzer<PromptAnalysisInput, PromptAnalysisOutput>;
  private transformer?: ITransformer<PromptTransformInput, PromptTransformOutput>;
  private validator?: IValidator<PromptValidationInput>;

  constructor(
    analyzer?: IAnalyzer<PromptAnalysisInput, PromptAnalysisOutput>,
    transformer?: ITransformer<PromptTransformInput, PromptTransformOutput>,
    validator?: IValidator<PromptValidationInput>
  ) {
    super();
    this.analyzer = analyzer;
    this.transformer = transformer;
    this.validator = validator;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.on('phase-start', ({ phase, timestamp }) => {
      this.logger.info(`🔄 Phase ${phase} started`, { timestamp });
    });

    this.on('phase-complete', ({ phase, result, timestamp }) => {
      this.logger.info(`✅ Phase ${phase} completed`, { timestamp, resultType: typeof result });
    });

    this.on('phase-error', ({ phase, error, timestamp }) => {
      this.logger.error(`❌ Phase ${phase} failed`, { error: error.message, timestamp });
    });
  }

  /**
   * Execute the complete 3-phase pipeline
   */
  async execute(prompt: string, metadata?: Record<string, unknown>): Promise<PipelineResult<PromptValidationOutput>> {
    const startTime = Date.now();
    const executionId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const steps: StepMetadata[] = [];

    this.emit('pipeline-start', { timestamp: startTime });
    this.logger.info('🚀 Starting 3-phase prompt pipeline', { executionId, promptLength: prompt.length });

    try {
      // Phase 1: Analyze
      const analysisInput: PromptAnalysisInput = { prompt, metadata };
      const analysisResult = await this.executePhase(
        'analyze',
        'Phase 1: Analysis',
        () => this.analyze(analysisInput),
        steps
      );

      // Phase 2: Transform
      const transformInput: PromptTransformInput = {
        originalPrompt: prompt,
        originalScore: analysisResult.evaluation.score,
        context: analysisResult.context,
        analysisOutput: analysisResult
      };
      const transformResult = await this.executePhase(
        'transform',
        'Phase 2: Transform',
        () => this.transform(transformInput),
        steps
      );

      // Phase 3: Validate
      const validationInput: PromptValidationInput = {
        originalPrompt: prompt,
        originalScore: analysisResult.evaluation.score,
        transformOutput: transformResult,
        analysisOutput: analysisResult
      };
      const validationResult = await this.executePhase(
        'validate',
        'Phase 3: Validate',
        () => this.validate(validationInput),
        steps
      );

      const endTime = Date.now();
      const timing: TimingInfo = {
        startTime,
        endTime,
        duration: endTime - startTime,
        breakdown: this.calculateBreakdown(steps)
      };

      const pipelineMetadata: PipelineMetadata = {
        pipelineId: 'prompt-pipeline',
        executionId,
        version: '3.0.0',
        steps,
        totalSteps: 3,
        completedSteps: steps.filter(s => s.status === 'completed').length,
        configuration: { metadata }
      };

      const qualityMetrics: QualityMetrics = {
        score: validationResult.finalScore,
        metrics: {
          originalScore: analysisResult.evaluation.score,
          improvement: validationResult.improvement || 0,
          validationScore: validationResult.validation.isValid ? 100 : 0
        },
        assessment: this.assessQuality(validationResult.finalScore),
        recommendations: analysisResult.evaluation.recommendations
      };

      const result: PipelineResult<PromptValidationOutput> = {
        success: true,
        data: validationResult,
        metadata: pipelineMetadata,
        timing,
        quality: qualityMetrics
      };

      this.emit('pipeline-complete', { result, timestamp: endTime });
      this.logger.info('🎉 Pipeline completed successfully', { 
        duration: timing.duration,
        finalScore: validationResult.finalScore,
        improved: validationResult.metadata.improved
      });

      return result;
    } catch (error) {
      const endTime = Date.now();
      this.emit('pipeline-error', { error: error as Error, timestamp: endTime });
      this.logger.error('💥 Pipeline execution failed', error);

      return {
        success: false,
        error: {
          name: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'PIPELINE_EXECUTION_ERROR',
          context: { executionId, prompt: prompt.substring(0, 100) },
          timestamp: new Date().toISOString(),
          severity: 'high' as const,
          stack: error instanceof Error ? error.stack : undefined
        },
        metadata: {
          pipelineId: 'prompt-pipeline',
          executionId,
          version: '3.0.0',
          steps,
          totalSteps: 3,
          completedSteps: steps.filter(s => s.status === 'completed').length,
          configuration: { metadata }
        },
        timing: {
          startTime,
          endTime,
          duration: endTime - startTime
        }
      };
    }
  }

  /**
   * Phase 1: Analyze the prompt
   */
  private async analyze(input: PromptAnalysisInput): Promise<PromptAnalysisOutput> {
    if (!this.analyzer) {
      throw new Error('Analyzer not configured');
    }
    return await this.analyzer.analyze(input);
  }

  /**
   * Phase 2: Transform/improve the prompt
   */
  private async transform(input: PromptTransformInput): Promise<PromptTransformOutput> {
    if (!this.transformer) {
      throw new Error('Transformer not configured');
    }
    return await this.transformer.transform(input);
  }

  /**
   * Phase 3: Validate and finalize
   */
  private async validate(input: PromptValidationInput): Promise<PromptValidationOutput> {
    if (!this.validator) {
      throw new Error('Validator not configured');
    }

    // Perform validation
    const validationResult = await this.validator.validate(input);

    // Determine final prompt and score
    const finalPrompt = input.transformOutput.improved && input.transformOutput.bestImprovement
      ? input.transformOutput.bestImprovement.prompt
      : input.originalPrompt;

    const finalScore = input.transformOutput.improved && input.transformOutput.bestImprovement
      ? input.originalScore + input.transformOutput.bestImprovement.scoreImprovement
      : input.originalScore;

    const improvement = finalScore - input.originalScore;

    return {
      finalPrompt,
      finalScore,
      improvement: improvement > 0 ? improvement : undefined,
      validation: validationResult,
      metadata: {
        originalScore: input.originalScore,
        improved: input.transformOutput.improved,
        method: input.transformOutput.bestImprovement?.method,
        tracking: null, // Will be populated by specific validator implementations
        evaluation: null, // Will be populated by specific validator implementations
        patternExtraction: null // Will be populated by specific validator implementations
      }
    };
  }

  /**
   * Execute a single phase with error handling and timing
   */
  private async executePhase<T>(
    phaseId: string,
    phaseName: string,
    execution: () => Promise<T>,
    steps: StepMetadata[]
  ): Promise<T> {
    const stepStartTime = Date.now();
    
    const stepMetadata: StepMetadata = {
      name: phaseName,
      status: 'running',
      startTime: stepStartTime
    };
    steps.push(stepMetadata);

    this.emit('phase-start', { phase: phaseId, timestamp: stepStartTime });

    try {
      const result = await execution();
      
      const stepEndTime = Date.now();
      stepMetadata.status = 'completed';
      stepMetadata.endTime = stepEndTime;
      stepMetadata.duration = stepEndTime - stepStartTime;
      stepMetadata.output = result;

      this.emit('phase-complete', { phase: phaseId, result, timestamp: stepEndTime });
      return result;
    } catch (error) {
      const stepEndTime = Date.now();
      stepMetadata.status = 'failed';
      stepMetadata.endTime = stepEndTime;
      stepMetadata.duration = stepEndTime - stepStartTime;
      stepMetadata.error = {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'PHASE_EXECUTION_ERROR',
        timestamp: new Date().toISOString(),
        severity: 'high' as const,
        stack: error instanceof Error ? error.stack : undefined
      };

      this.emit('phase-error', { phase: phaseId, error: error as Error, timestamp: stepEndTime });
      throw error;
    }
  }

  /**
   * Calculate timing breakdown from steps
   */
  private calculateBreakdown(steps: StepMetadata[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    steps.forEach(step => {
      if (step.duration !== undefined) {
        breakdown[step.name] = step.duration;
      }
    });
    return breakdown;
  }

  /**
   * Assess quality based on score
   */
  private assessQuality(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Set analyzer component
   */
  setAnalyzer(analyzer: IAnalyzer<PromptAnalysisInput, PromptAnalysisOutput>): void {
    this.analyzer = analyzer;
  }

  /**
   * Set transformer component
   */
  setTransformer(transformer: ITransformer<PromptTransformInput, PromptTransformOutput>): void {
    this.transformer = transformer;
  }

  /**
   * Set validator component
   */
  setValidator(validator: IValidator<PromptValidationInput>): void {
    this.validator = validator;
  }

  /**
   * Get pipeline configuration
   */
  getConfiguration(): {
    hasAnalyzer: boolean;
    hasTransformer: boolean;
    hasValidator: boolean;
    phases: string[];
  } {
    return {
      hasAnalyzer: !!this.analyzer,
      hasTransformer: !!this.transformer,
      hasValidator: !!this.validator,
      phases: ['analyze', 'transform', 'validate']
    };
  }
}