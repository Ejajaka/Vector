// Adapter over the shared Vector rule engine (src/analyzer.js). Turns a raw
// engine report into the app's AnalysisResult model used by the screens.
// There is NO hardcoded/sample data here - every value comes from the engine.
import { severityKey } from './theme';

const VectorAnalyzer = require('./analyzer');

export const EXAMPLE_PROMPTS = [
  {
    id: 'ex1',
    title: 'Example 1 (Basic S3)',
    text: 'Create an S3 bucket for storing application documents.',
  },
  {
    id: 'ex2',
    title: 'Example 2 (Multi-tier Web App)',
    text:
      'Deploy an EC2 instance running a web application behind a load balancer, connect it to an RDS database, and store uploaded documents in S3.',
  },
  {
    id: 'ex3',
    title: 'Example 3 (High-Risk Exposed)',
    text:
      'Create a public S3 bucket for customer documents and launch an EC2 instance with SSH open to 0.0.0.0/0.',
  },
];

function normalizeLevel(level) {
  return level === 'MINIMAL' ? 'MINIMAL' : level || 'LOW';
}

function toFinding(f, type, resourceLabelById) {
  const severity = severityKey(f.severity);
  if (type === 'RISKY_STATEMENT') {
    return {
      id: String(f.id),
      title: f.label || String(f.id),
      explanation: f.description || '',
      severity,
      type,
      affectedResource: null,
      whyItMatters: f.description || '',
      recommendedFix: f.fix || '',
      securityClause: f.fix || '',
      isSelectable: true,
    };
  }
  const affected = (f.appliesTo || []).map((id) => resourceLabelById[id]).filter(Boolean);
  return {
    id: String(f.id),
    title: f.label || String(f.id),
    explanation: f.description || '',
    severity,
    type,
    affectedResource: affected.length ? affected.join(', ') : null,
    whyItMatters: f.description || '',
    recommendedFix: f.tf ? `Terraform: ${f.tf}` : f.clause || '',
    securityClause: f.clause || '',
    isSelectable: type !== 'DETECTED_CONTROL',
  };
}

export function analyzePrompt(prompt) {
  const text = String(prompt || '').trim();
  if (!text) {
    const err = new Error('Please enter an AWS infrastructure prompt or select an example.');
    err.code = 'empty';
    throw err;
  }
  const report = VectorAnalyzer.analyze(text, { strictMode: false });
  if (report.outOfScope) {
    const err = new Error((report.feedback && report.feedback[0]) || 'This does not look like an AWS infrastructure prompt.');
    err.code = 'outOfScope';
    throw err;
  }

  const resourceLabelById = {};
  (report.resources || []).forEach((r) => {
    resourceLabelById[r.id] = r.label;
  });

  const findings = [];
  (report.missing || []).forEach((m) => findings.push(toFinding(m, 'MISSING_CONTROL', resourceLabelById)));
  (report.mentioned || []).forEach((m) => findings.push(toFinding(m, 'DETECTED_CONTROL', resourceLabelById)));
  (report.riskyFindings || []).forEach((m) => findings.push(toFinding(m, 'RISKY_STATEMENT', resourceLabelById)));

  return {
    id: 'vec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    prompt: report.prompt || text,
    timestamp: Date.now(),
    riskScore: Math.round(report.riskScore || 0),
    riskLevel: normalizeLevel(report.riskLevel),
    securityCoverage: Math.round(report.coverageScore || 0),
    confidence: Math.round(report.confidenceScore || 0),
    detectedResources: (report.resources || []).map((r) => ({
      id: r.id,
      name: r.label,
      shortName: r.id,
      category: 'AWS Infrastructure',
    })),
    findings,
  };
}

export function eligibleClauseIds(analysis) {
  return analysis.findings.filter((f) => f.isSelectable).map((f) => f.id);
}

export function buildImprovedPrompt(prompt, clauses) {
  const list = (clauses || []).map((c) => String(c || '').trim()).filter(Boolean);
  const base = String(prompt || '').trim();
  if (!list.length) return base;
  const unique = Array.from(new Set(list));
  return base + '\n\nSecurity requirements:\n' + unique.map((c) => '- ' + c).join('\n');
}

export function metricsFrom(list) {
  const total = list.length;
  if (!total) return { totalAnalyses: 0, averageRiskScore: 0, averageCoverage: 0, highRiskCount: 0 };
  const sumRisk = list.reduce((a, x) => a + x.riskScore, 0);
  const sumCov = list.reduce((a, x) => a + x.securityCoverage, 0);
  const high = list.filter((x) => x.riskLevel === 'HIGH' || x.riskLevel === 'CRITICAL').length;
  return {
    totalAnalyses: total,
    averageRiskScore: Math.round(sumRisk / total),
    averageCoverage: Math.round(sumCov / total),
    highRiskCount: high,
  };
}
