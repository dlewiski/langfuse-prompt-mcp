/**
 * Phase 1: Parallel Initial Analysis
 * Handles tracking, evaluation, and context analysis
 */

import {
  mcp__langfuse_prompt__track,
  mcp__langfuse_prompt__evaluate,
} from "../../tools/mcp-tools.js";

export interface Context {
  isReact: boolean;
  hasFrontend: boolean;
  isAPI: boolean;
  hasBackend: boolean;
  complexity: "low" | "medium" | "high";
  frameworks: string[];
  projectType?: string;
}

export interface Phase1Results {
  tracking: any;
  evaluation: { score: number; details: any };
  context: Context;
}

export class Phase1Analyzer {
  async execute(prompt: string): Promise<Phase1Results> {
    console.log("🐝 Phase 1: Parallel Initial Analysis");

    // Execute all analysis tasks in parallel
    const [tracking, evaluation, context] = await Promise.all([
      this.trackPrompt({ prompt }),
      this.evaluatePrompt({ prompt }),
      this.analyzeContext(prompt),
    ]);

    return {
      tracking,
      evaluation,
      context,
    };
  }

  private async trackPrompt(params: any): Promise<any> {
    try {
      const result = await mcp__langfuse_prompt__track(params);
      return result?.success ? result : { error: "Tracking failed" };
    } catch (error) {
      console.warn("⚠️ Tracking failed:", error);
      return null;
    }
  }

  private async evaluatePrompt(params: any): Promise<any> {
    try {
      const result = await mcp__langfuse_prompt__evaluate(params);
      
      if (result?.score !== undefined) {
        return { score: result.score, details: result };
      }
      
      // Fallback to basic evaluation
      return this.simulateEvaluation(params.prompt);
    } catch (error) {
      console.warn("⚠️ Evaluation failed:", error);
      return this.simulateEvaluation(params.prompt);
    }
  }

  private async analyzeContext(prompt: string): Promise<Context> {
    const [isReact, isAPI, complexity, frameworks] = await Promise.all([
      this.detectReactContext(prompt),
      this.detectAPIContext(prompt),
      this.assessComplexity(prompt),
      this.detectFrameworks(prompt),
    ]);

    return {
      isReact,
      hasFrontend: isReact || prompt.match(/ui|frontend|component|css|html/i) !== null,
      isAPI,
      hasBackend: isAPI || prompt.match(/backend|server|database|auth/i) !== null,
      complexity,
      frameworks,
      projectType: this.inferProjectType(prompt, frameworks),
    };
  }

  private async detectReactContext(prompt: string): Promise<boolean> {
    const reactKeywords = [
      "react", "component", "jsx", "tsx", "hook", "useState",
      "useEffect", "props", "state", "redux", "next.js",
    ];
    
    return reactKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
  }

  private async detectAPIContext(prompt: string): Promise<boolean> {
    const apiKeywords = [
      "api", "endpoint", "rest", "graphql", "backend",
      "server", "route", "request", "response", "fastapi",
    ];
    
    return apiKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
  }

  private async assessComplexity(prompt: string): Promise<"low" | "medium" | "high"> {
    const wordCount = prompt.split(/\s+/).length;
    const hasMultipleRequirements = (prompt.match(/and|also|additionally|furthermore/gi) || []).length > 2;
    const hasTechnicalTerms = (prompt.match(/implement|optimize|refactor|architect|design/gi) || []).length > 1;

    if (wordCount > 100 || hasMultipleRequirements || hasTechnicalTerms) {
      return "high";
    } else if (wordCount > 50) {
      return "medium";
    }
    return "low";
  }

  private async detectFrameworks(prompt: string): Promise<string[]> {
    const frameworkPatterns = {
      "React": /react|jsx|tsx/i,
      "Vue": /vue/i,
      "Angular": /angular/i,
      "Next.js": /next\.?js/i,
      "Express": /express/i,
      "FastAPI": /fastapi/i,
      "Django": /django/i,
      "Rails": /rails|ruby/i,
    };

    const detected: string[] = [];
    for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
      if (pattern.test(prompt)) {
        detected.push(framework);
      }
    }

    return detected;
  }

  private inferProjectType(prompt: string, frameworks: string[]): string {
    if (frameworks.includes("React") || frameworks.includes("Vue")) {
      return "frontend";
    }
    if (frameworks.includes("FastAPI") || frameworks.includes("Express")) {
      return "backend";
    }
    if (prompt.includes("full-stack")) {
      return "fullstack";
    }
    return "general";
  }

  private simulateEvaluation(prompt: string): { score: number; details: any } {
    // Basic scoring based on prompt characteristics
    const baseScore = 50;
    let score = baseScore;

    if (prompt.length > 50) score += 10;
    if (prompt.includes("please") || prompt.includes("could")) score += 5;
    if (prompt.match(/\b(implement|create|build|develop)\b/i)) score += 10;
    if (prompt.match(/\b(specific|detailed|clear)\b/i)) score += 5;
    if (prompt.includes("example")) score += 10;

    return {
      score: Math.min(100, score),
      details: { simulated: true },
    };
  }
}