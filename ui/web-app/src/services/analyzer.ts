import type {
  AnalysisResult,
  SecurityFinding,
  FindingSeverity,
  RiskLevel
} from '../types/analysis.ts';
import { loadSettings, deepScanAvailable } from './settings.ts';

/**
 * Adapter over the shared Vector rule engine (engine/src), exposed on
 * globalThis.VectorAnalyzer by the classic scripts in index.html, plus the
 * optional deep scan (globalThis.VectorLLM). Same engine, same merge policy as
 * the extension and mobile clients - there is no mock or sample data here.
 */
export class VectorEngineAnalyzer {
  isAvailable(): boolean {
    return typeof globalThis !== 'undefined' && !!(globalThis as any).VectorAnalyzer;
  }

  /** Raw rule-engine report (not mapped). Throws for empty/out-of-scope input. */
  analyzeReport(prompt: string): any {
    const engine = (globalThis as any).VectorAnalyzer;
    if (!engine) throw new Error('The Vector rule engine failed to load.');
    const trimmed = prompt.trim();
    if (!trimmed) throw new Error('Prompt cannot be empty.');
    const report = engine.analyze(trimmed, { strictMode: false });
    if (report.outOfScope) {
      throw new Error(
        (report.feedback && report.feedback[0]) ||
          'This does not look like an AWS infrastructure prompt.'
      );
    }
    return report;
  }

  /** Map an existing engine report to the UI model. */
  resultFromReport(report: any): AnalysisResult {
    return toAnalysisResult(report);
  }

  async analyze(prompt: string): Promise<AnalysisResult> {
    return this.resultFromReport(this.analyzeReport(prompt));
  }

  /** True when an on-device model or a hosted API key is configured. */
  isDeepScanAvailable(): boolean {
    const llm = (globalThis as any).VectorLLM;
    return !!llm && deepScanAvailable(loadSettings());
  }

  /**
   * Run the LLM deep scan against an existing rule report, merge with the
   * shared policy, and return the merged UI result. Throws when unavailable.
   */
  async deepScan(
    prompt: string,
    baseReport?: any
  ): Promise<{ result: AnalysisResult; via: string }> {
    const llm = (globalThis as any).VectorLLM;
    const engine = (globalThis as any).VectorAnalyzer;
    if (!llm || !engine) throw new Error('Deep scan is not available in this client.');
    const report = baseReport || this.analyzeReport(prompt);
    const settings = loadSettings();
    const out = await llm.deepScan(report.prompt, settings, report);
    const merged = engine.mergeFindings(report, out.findings);
    return { result: this.resultFromReport(merged), via: out.via };
  }
}

function mapSeverity(value: unknown): FindingSeverity {
  const v = String(value || '').toLowerCase();
  if (v === 'critical' || v === 'high' || v === 'medium' || v === 'low') {
    return v as FindingSeverity;
  }
  return 'medium';
}

function mapFinding(f: any): SecurityFinding {
  return {
    id: String(f.id),
    label: f.label || String(f.id),
    description: f.description || f.clause || '',
    severity: mapSeverity(f.severity),
    dimension: f.dimension,
    tier: f.tier,
    clause: f.clause,
    fix: f.fix,
    source: f.source === 'ai' ? 'ai' : 'rule',
    explicitlyRisky: !!f.explicitlyRisky
  };
}

function toAnalysisResult(report: any): AnalysisResult {
  return {
    id: `vec-res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    prompt: report.prompt || '',
    riskScore: Math.round(report.riskScore || 0),
    riskLevel: (report.riskLevel || 'MINIMAL') as RiskLevel,
    coverageScore: Math.round(report.coverageScore || 0),
    confidenceScore: Math.round(report.confidenceScore || 0),
    resources: ((report.resources as any[]) || []).map((r: any) => ({
      id: r.id,
      label: r.label,
      category: r.category
    })),
    mentioned: ((report.mentioned as any[]) || []).map(mapFinding),
    missing: ((report.missing as any[]) || []).map(mapFinding),
    riskyFindings: ((report.riskyFindings as any[]) || []).map(mapFinding),
    feedback: (report.feedback as string[]) || [],
    createdAt: new Date().toISOString()
  };
}

export const defaultAnalyzer = new VectorEngineAnalyzer();
