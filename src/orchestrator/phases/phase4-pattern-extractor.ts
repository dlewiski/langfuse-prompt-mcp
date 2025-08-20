/**
 * Phase 4: Async Pattern Extraction
 * Handles background pattern extraction from high-scoring prompts
 */

import { mcp__langfuse_prompt__patterns } from "../../tools/mcp-tools.js";

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
    console.log("🐝 Phase 4: Async Pattern Extraction");

    // Don't start if already in progress
    if (this.extractionInProgress) {
      return;
    }

    // Check if we have enough high-scoring prompts
    const highScoringPrompts = this.promptHistory.filter(
      p => p.score >= this.config.thresholds.high_quality
    );

    if (highScoringPrompts.length < this.config.thresholds.pattern_extraction_min) {
      console.log(
        `📊 Not enough high-scoring prompts for pattern extraction (${highScoringPrompts.length}/${this.config.thresholds.pattern_extraction_min})`
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
        console.error("❌ Pattern extraction failed:", error);
      })
      .finally(() => {
        this.extractionInProgress = false;
      });
  }

  private async extractPatterns(): Promise<any> {
    try {
      console.log("🔍 Extracting patterns from high-scoring prompts...");
      
      const result = await mcp__langfuse_prompt__patterns({
        minScore: this.config.thresholds.high_quality,
        limit: 20,
      });

      if (result?.patterns) {
        console.log(`✅ Extracted ${result.patterns.length} patterns`);
        return result.patterns;
      }

      return null;
    } catch (error) {
      console.warn("⚠️ Pattern extraction failed:", error);
      return null;
    }
  }

  private applyPatterns(patterns: any): void {
    console.log("📝 Applying extracted patterns for future improvements");
    // Store patterns for use in future improvements
    // This would typically update a pattern database or configuration
    // For now, just log them
    if (Array.isArray(patterns)) {
      patterns.forEach((pattern: any) => {
        console.log(`  - ${pattern.name || pattern.description || pattern}`);
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