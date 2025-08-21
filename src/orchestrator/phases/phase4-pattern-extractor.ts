/**
 * Phase 4: Async Pattern Extraction
 * Handles background pattern extraction from high-scoring prompts
 */

import { mcp__langfuse_prompt__patterns } from "../../tools/mcp-tools.js";
import { createModuleLogger } from "../../utils/structuredLogger.js";

export interface PromptHistoryItem {
  prompt: string;
  score: number;
  timestamp: number;
  context?: any;
}

export class Phase4PatternExtractor {
  private promptHistory: PromptHistoryItem[] = [];
  private config: any;
  private extractionInProgress = false;
  private logger = createModuleLogger('Phase4PatternExtractor');

  constructor(config: any) {
    this.config = config;
  }

  addToHistory(prompt: string, score: number, context?: any): void {
    this.promptHistory.push({
      prompt,
      score,
      timestamp: Date.now(),
      context,
    });

    // Keep history size manageable
    if (this.promptHistory.length > 100) {
      this.promptHistory = this.promptHistory.slice(-100);
    }
  }

  executeAsync(): void {
    this.logger.info("🐝 Phase 4: Async Pattern Extraction");

    // Don't start if already in progress
    if (this.extractionInProgress) {
      return;
    }

    // Check if we have enough high-scoring prompts
    const highScoringPrompts = this.promptHistory.filter(
      p => p.score >= this.config.thresholds.high_quality
    );

    if (highScoringPrompts.length < this.config.thresholds.pattern_extraction_min) {
      this.logger.info(
        `📊 Not enough high-scoring prompts for pattern extraction`,
        { current: highScoringPrompts.length, required: this.config.thresholds.pattern_extraction_min }
      );
      return;
    }

    // Run pattern extraction asynchronously
    this.extractionInProgress = true;
    this.extractPatterns()
      .then(patterns => {
        if (patterns) {
          this.applyPatterns(patterns);
        }
      })
      .catch(error => {
        this.logger.error("❌ Pattern extraction failed", error);
      })
      .finally(() => {
        this.extractionInProgress = false;
      });
  }

  private async extractPatterns(): Promise<any> {
    try {
      this.logger.info("🔍 Extracting patterns from high-scoring prompts...");
      
      const result = await mcp__langfuse_prompt__patterns({
        minScore: this.config.thresholds.high_quality,
        limit: 20,
      });

      if (result?.patterns) {
        this.logger.info(`✅ Extracted ${result.patterns.length} patterns`);
        return result.patterns;
      }

      return null;
    } catch (error) {
      this.logger.warn("⚠️ Pattern extraction failed", error);
      return null;
    }
  }

  private applyPatterns(patterns: any): void {
    this.logger.info("📝 Applying extracted patterns for future improvements");
    // Store patterns for use in future improvements
    // This would typically update a pattern database or configuration
    // For now, just log them
    if (Array.isArray(patterns)) {
      patterns.forEach((pattern: any) => {
        this.logger.debug(`  - ${pattern.name || pattern.description || pattern}`);
      });
    }
  }

  getHistory(): PromptHistoryItem[] {
    return [...this.promptHistory];
  }

  getHighScoringCount(): number {
    return this.promptHistory.filter(
      p => p.score >= this.config.thresholds.high_quality
    ).length;
  }
}