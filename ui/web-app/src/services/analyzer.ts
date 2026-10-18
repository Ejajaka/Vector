import type {
  AnalysisResult,
  AnalyzerAdapter,
  SecurityFinding,
  FindingSeverity,
  RiskLevel
} from '../types/analysis.ts';

/**
 * Adapter over the shared Vector rule engine (engine/src), exposed on
 * globalThis.VectorAnalyzer by the classic scripts in index.html. This is the
 * real, deterministic offline engine used by every Vector surface - there is
 * no mock analyzer and no hardcoded/sample analysis data here.
 */
export class VectorEngineAnalyzer implements AnalyzerAdapter {
  isAvailable(): boolean {
    return typeof globalThis !== 'undefined' && !!(globalThis as any).VectorAnalyzer;
  }

  async analyze(prompt: string): Promise<AnalysisResult> {
    const engine = (globalThis as any).VectorAnalyzer;
    if (!engine) {
      throw new Error('The Vector rule engine failed to load.');
    }
    const trimmed = prompt.trim();
    if (!trimmed) {
      throw new Error('Prompt cannot be empty.');
    }
    const report = engine.analyze(trimmed, { strictMode: false });
    if (report.outOfScope) {
      throw new Error(
        (report.feedback && report.feedback[0]) ||
          'This does not look like an AWS infrastructure prompt.'
      );
    }
    return toAnalysisResult(report);
  }

  async deepScan(_prompt: string): Promise<AnalysisResult> {
    throw new Error(
      'Deep Scan requires a configured Vector semantic integration or backend model endpoint. In this client, rule-based offline diagnosis is the active engine.'
    );
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
    source: f.source === 'ai' ? 'ai' : 'rule'
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

// The single adapter instance. Every analysis the UI renders comes from the
// shared rule engine.
export const defaultAnalyzer: AnalyzerAdapter = new VectorEngineAnalyzer();
