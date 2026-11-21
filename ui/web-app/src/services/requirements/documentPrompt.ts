import type { AcceptanceCriterion, RequirementRecord } from '../../types/requirements.ts';
import type { RequirementAnalysisResult } from '../../types/requirementIntelligence.ts';
import { designSystemPrompt, type DesignSystem } from '../designSystems.ts';

export interface DocumentPromptInput {
  projectName: string;
  documentNames: string[];
  requirements: RequirementRecord[];
  criteria: AcceptanceCriterion[];
  designSystem: DesignSystem | null;
  analysis: RequirementAnalysisResult | null;
  referenceFiles?: Array<{ name: string; type: string }>;
}

export function buildDocumentPrompt({
  projectName,
  documentNames,
  requirements,
  criteria,
  designSystem,
  analysis,
  referenceFiles = [],
}: DocumentPromptInput): string {
  const approved = requirements.filter((requirement) => requirement.status === 'approved');
  const approvedCriteria = criteria.filter((criterion) => criterion.status === 'approved');
  const lines: string[] = [
    `PRODUCT BRIEF - ${projectName}`,
    '',
    'SOURCE DOCUMENTS',
    ...(documentNames.length
      ? documentNames.map((name) => `- ${name}`)
      : ['- No document uploaded. This prompt is based on approved project requirements.']),
    '',
    'REFERENCE FILES',
    ...(referenceFiles.length
      ? referenceFiles.map((file) => `- ${file.name} (${file.type || 'file'})`)
      : ['- None attached.']),
    '',
    'DESIGN SYSTEM',
    designSystem ? designSystemPrompt(designSystem) : '- No design system attached. Use a neutral system and state every colour explicitly.',
    '',
    'APPROVED REQUIREMENTS',
    ...(approved.length
      ? approved.map((requirement) => `- ${requirement.requirementCode}: ${requirement.originalText}`)
      : ['- No requirements have been approved yet.']),
    '',
    'ACCEPTANCE CRITERIA',
    ...(approvedCriteria.length
      ? approvedCriteria.map(
          (criterion) =>
            `- ${criterion.requirementCode}: ${criterion.given}. ${criterion.when}. ${criterion.then}.`,
        )
      : ['- No acceptance criteria have been approved yet.']),
  ];

  const reviewNotes = (analysis?.findings || [])
    .filter((finding) => finding.type === 'conflict' || finding.type === 'dependency' || finding.severity !== 'low')
    .slice(0, 12);
  if (reviewNotes.length) {
    lines.push(
      '',
      'REVIEW NOTES',
      ...reviewNotes.map(
        (finding) =>
          `- [${finding.severity}] ${finding.title}: ${finding.whyItMatters} (${finding.affectedRequirementIds.length} linked requirement${
            finding.affectedRequirementIds.length === 1 ? '' : 's'
          })`,
      ),
    );
  }

  lines.push(
    '',
    'BUILD INSTRUCTIONS',
    '- Build only the approved requirements above. Do not invent missing scope.',
    '- Use the design system tokens exactly; do not introduce new colours, radii or typefaces.',
    '- Include every approved acceptance criterion as a testable state.',
    '- Resolve or flag every review note before shipping. If a conflict remains, ask for a decision instead of guessing.',
  );

  return lines.join('\n');
}
