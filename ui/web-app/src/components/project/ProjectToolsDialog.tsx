import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileText,
  GitBranch,
  Layers,
  Palette,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { compileRequirements } from '../../services/requirements/compiler.ts';
import { analyzeRequirements } from '../../services/requirements/intelligence.ts';
import { generateAcceptanceCriteria } from '../../services/requirements/acceptance.ts';
import { classifyRequirementPriority } from '../../services/requirements/priority.ts';
import { buildGraphModel } from '../../services/requirements/graphLayout.ts';
import { auditElements, auditQuality, compilePromptScreens, roughRisk } from '../../services/promptCompiler.ts';
import { getActiveDesignSystem } from '../../services/designSystems.ts';
import { readProjectSetup } from '../../services/projectSeed.ts';
import type { RequirementDraft, RequirementPriority, RequirementRecord } from '../../types/requirements.ts';

export type ProjectToolId =
  | 'requirements'
  | 'graph'
  | 'review'
  | 'prompt'
  | 'build'
  | 'design'
  | 'analyser';

export interface ProjectToolSource {
  id: string;
  label: string;
  detail: string;
  text: string;
  kind: 'prompt' | 'file';
}

interface ProjectToolsDialogProps {
  open: boolean;
  tool: ProjectToolId;
  project: { id: string; name: string };
  sources: ProjectToolSource[];
  onToolChange: (tool: ProjectToolId) => void;
  onClose: () => void;
  onOpenFull: (tool: ProjectToolId) => void;
}

const TOOLS: Array<{ id: ProjectToolId; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }> = [
  { id: 'requirements', label: 'Requirements', icon: FileText, hint: 'What the source asks for' },
  { id: 'graph', label: 'Requirement graph', icon: GitBranch, hint: 'How the pieces relate' },
  { id: 'review', label: 'Review & acceptance', icon: ClipboardCheck, hint: 'Gaps and testable criteria' },
  { id: 'prompt', label: 'Prompt studio', icon: Sparkles, hint: 'The six-section brief' },
  { id: 'build', label: 'Build workspace', icon: Rocket, hint: 'Base44, embedded' },
  { id: 'design', label: 'Design systems', icon: Palette, hint: 'Tokens this project uses' },
  { id: 'analyser', label: 'Prompt analyser', icon: BarChart3, hint: 'Risk and readiness' },
];

const PRIORITY_TONE: Record<RequirementPriority, string> = {
  critical: '#F27D6E',
  high: '#E0B15C',
  medium: '#9BA0A8',
  low: '#6E727A',
};

const SEVERITY_TONE: Record<string, string> = {
  critical: '#F27D6E',
  high: '#EE927F',
  medium: '#E0B15C',
  low: '#7C8CFF',
};

const CHIP_TONE: Record<string, string> = {
  screen: '#7C8CFF',
  component: '#E0B15C',
  role: '#5FA8D3',
  interaction: '#F27D6E',
};

const DEFAULT_TOKENS = {
  primary: '#7170FF',
  accent: '#8C8CFF',
  surface: '#08090A',
  ink: '#F7F8F8',
  font: 'Inter',
  radius: '8px',
  spacing: '4 / 8 / 12 / 16 / 24',
};

function pagesFromPrompt(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  const parts = cleaned
    .split(/\n(?=\s*(?:\d{2}\s*\/\s*[A-Z]|#{1,3}\s+\S))/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : [cleaned];
}

const PROMPT_COMPONENTS = [
  'navigation', 'sidebar', 'kpi', 'card', 'chart', 'table', 'selector', 'search',
  'filter', 'export', 'button', 'input', 'form', 'modal', 'dialog', 'dropdown',
  'toast', 'banner', 'tab', 'menu', 'footer', 'header', 'toggle', 'badge', 'slider',
];

const PROMPT_BEHAVIOURS = [
  'add', 'allow', 'apply', 'approve', 'authenticate', 'build', 'change', 'close',
  'collapse', 'create', 'delete', 'disable', 'display', 'download', 'edit', 'enable',
  'ensure', 'export', 'fetch', 'filter', 'handle', 'include', 'keep', 'launch', 'log',
  'navigate', 'notify', 'open', 'prevent', 'provide', 'redirect', 'render', 'require',
  'restrict', 'retry', 'save', 'search', 'select', 'send', 'show', 'sort', 'stack',
  'store', 'submit', 'support', 'update', 'upload', 'validate',
];

const NON_FUNCTIONAL_PROMPT_RE =
  /\b(responsive|mobile|tablet|accessib|performance|latency|security|privacy|audit|empty|loading|error state|retry|fallback|contrast|screen reader|keyboard|international|localization|seo)\b/i;

function promptSections(text: string): Array<{ index: number; title: string; lines: string[] }> {
  const sections: Array<{ index: number; title: string; lines: string[] }> = [];
  let current = { index: 0, title: 'Brief', lines: [] as string[] };
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d{2})\s*\/\s*([A-Za-z][A-Za-z0-9 /&-]+?)\s*$/);
    if (match) {
      if (current.lines.some((entry) => entry.trim())) sections.push(current);
      current = { index: Number(match[1]), title: match[2].trim(), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  if (current.lines.some((entry) => entry.trim())) sections.push(current);
  return sections;
}

function promptStatements(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const cleanedLine = line.replace(/^([-*•]|\d+[.)])\s+/, '').trim();
    if (!cleanedLine) continue;
    for (const part of cleanedLine.split(/(?<=[.!?])\s+/)) {
      for (const clause of part.split(/;\s+/)) {
        const text = clause.trim().replace(/\s+/g, ' ');
        if (text.length < 16) continue;
        if (/^[#\d\s.,/px%-]+$/i.test(text)) continue;
        out.push(text);
      }
    }
  }
  return out;
}

function metadataForPrompt(text: string) {
  const screens: string[] = [];
  const dashboard = text.match(/\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+dashboard\b/i);
  if (dashboard) screens.push(dashboard[0].replace(/\b\w/g, (letter) => letter.toUpperCase()));
  else if (/\bdashboard\b/i.test(text)) screens.push('Dashboard');
  else if (/\bpage\b/i.test(text)) screens.push('Page');

  const roles = [
    ...text.matchAll(/\b(ops leads?|finance admins?|admins?|administrators?|managers?|employees?|customers?|users?|guests?|owners?|reviewers?|operators?)\b/gi),
  ].map((match) => match[0].toLowerCase());

  const components = PROMPT_COMPONENTS.filter((component) =>
    new RegExp(`\\b${component}s?\\b`, 'i').test(text),
  );
  const behaviours = PROMPT_BEHAVIOURS.filter((verb) =>
    new RegExp(`\\b${verb}(?:s|ed|ing)?\\b`, 'i').test(text),
  );
  return {
    screens: [...new Set(screens)].slice(0, 4),
    components: [...new Set(components)].slice(0, 8),
    roles: [...new Set(roles)].slice(0, 5),
    behaviours: [...new Set(behaviours)].slice(0, 8),
  };
}

function promptDrafts(text: string): RequirementDraft[] {
  const drafts: RequirementDraft[] = [];
  const seen = new Set<string>();
  let offset = 0;
  for (const section of promptSections(text)) {
    let paragraph = 0;
    for (const statement of promptStatements(section.lines)) {
      paragraph += 1;
      const normalized = statement.replace(/\s+/g, ' ').trim();
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      drafts.push({
        requirementCode: `REQ-${String(drafts.length + 1).padStart(3, '0')}`,
        originalText: statement,
        normalizedText: normalized,
        kind: NON_FUNCTIONAL_PROMPT_RE.test(normalized) ? 'non_functional' : 'functional',
        sourcePage: section.index || null,
        sourceParagraph: paragraph,
        sourceCharStart: offset,
        sourceCharEnd: offset + statement.length,
        metadata: metadataForPrompt(normalized),
      });
      offset += statement.length + 1;
    }
  }
  return drafts;
}

function useCopied(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => setCopied(false));
  };
  return [copied, copy];
}

const Empty: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="grid h-full min-h-[240px] place-items-center rounded-lg border border-dashed border-[var(--v-line)] p-6 text-center">
    <div>
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-[var(--v-surface-2)] text-[var(--v-faint)]">
        <Layers className="h-5 w-5" />
      </span>
      <p className="mt-2.5 text-[12px] font-semibold text-[var(--v-ink)]">{title}</p>
      <p className="mx-auto mt-1 max-w-[360px] text-[10px] leading-relaxed text-[var(--v-muted)]">{body}</p>
    </div>
  </div>
);

const SectionHeading: React.FC<{ title: string; meta?: string }> = ({ title, meta }) => (
  <div className="mb-2 flex items-baseline justify-between gap-2">
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--v-faint)]">{title}</p>
    {meta && <p className="text-[9.5px] text-[var(--v-faint)]">{meta}</p>}
  </div>
);

const RequirementsView: React.FC<{
  requirements: RequirementRecord[];
  sourceLabel: string;
  sourceKind: 'prompt' | 'file';
}> = ({ requirements, sourceLabel, sourceKind }) => {
  const functional = requirements.filter((item) => item.kind === 'functional').length;
  if (!requirements.length) {
    return (
      <Empty
        title="No requirement-shaped sentences in this source"
        body={`“${sourceLabel}” reads more like a layout description than a brief. Add sentences with must, shall, needs to, or an action on a named component.`}
      />
    );
  }
  return (
    <div className="space-y-3">
      <SectionHeading
        title="Extracted requirements"
        meta={`${requirements.length} total · ${functional} functional · ${requirements.length - functional} non-functional`}
      />
      <div className="space-y-1.5">
        {requirements.slice(0, 80).map((requirement) => (
          <div key={requirement.id} className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded border border-[var(--v-line)] px-1.5 py-0.5 font-mono text-[8.5px] font-semibold text-[var(--v-muted)]">
                {requirement.requirementCode}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider"
                style={{ color: PRIORITY_TONE[requirement.priority], background: `${PRIORITY_TONE[requirement.priority]}14` }}
              >
                {requirement.priority}
              </span>
              <span className="text-[8.5px] text-[var(--v-faint)]">
                {requirement.kind === 'functional' ? 'Functional' : 'Non-functional'}
                {requirement.sourcePage
                  ? ` · ${sourceKind === 'prompt' ? 'section' : 'page'} ${requirement.sourcePage}`
                  : ''}
              </span>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-[var(--v-ink)]">{requirement.originalText}</p>
            {(requirement.metadata.screens.length > 0 || requirement.metadata.components.length > 0) && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {requirement.metadata.screens.map((item) => (
                  <span key={`s-${item}`} className="rounded bg-[#7C8CFF]/10 px-1.5 py-0.5 text-[8px] text-[#A6B0FF]">
                    {item}
                  </span>
                ))}
                {requirement.metadata.components.map((item) => (
                  <span key={`c-${item}`} className="rounded bg-[#E0B15C]/10 px-1.5 py-0.5 text-[8px] text-[#E0B15C]">
                    {item}
                  </span>
                ))}
                {requirement.metadata.roles.slice(0, 3).map((item) => (
                  <span key={`r-${item}`} className="rounded bg-[#5FA8D3]/10 px-1.5 py-0.5 text-[8px] text-[#5FA8D3]">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {requirements.length > 80 && (
        <p className="text-[9px] text-[var(--v-faint)]">
          Showing the first 80 of {requirements.length}. Open the full view for the rest.
        </p>
      )}
    </div>
  );
};

const GraphView: React.FC<{ analysis: ReturnType<typeof analyzeRequirements> }> = ({ analysis }) => {
  const model = useMemo(() => buildGraphModel(analysis), [analysis]);
  const counts = useMemo(() => {
    const tally = new Map<string, number>();
    analysis.graph.nodes.forEach((node) => tally.set(node.kind, (tally.get(node.kind) || 0) + 1));
    return tally;
  }, [analysis]);
  if (!model.cards.length) return <Empty title="Nothing to graph yet" body="This source produced no requirements, so there are no nodes or relations to show." />;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {([
          ['requirement', 'requirements'],
          ['screen', 'screens'],
          ['component', 'components'],
          ['role', 'roles'],
          ['interaction', 'interactions'],
        ] as const).map(([kind, label]) => {
          const value = counts.get(kind) || 0;
          const text = value === 1 ? label.replace(/s$/, '') : label;
          return (
            <span key={kind} className="rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] px-2 py-1 text-[9px] text-[var(--v-muted)]">
              <span className="font-semibold text-[var(--v-ink)]">{value}</span> {text}
            </span>
          );
        })}
        <span className="rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] px-2 py-1 text-[9px] text-[var(--v-muted)]">
          <span className="font-semibold text-[var(--v-ink)]">{analysis.graph.edges.length}</span> relations
        </span>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {model.cards.slice(0, 40).map((card) => (
          <div key={card.id} className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[9px] font-semibold text-[var(--v-violet)]">{card.code}</span>
              {card.conflicts > 0 && (
                <span className="rounded bg-[#F27D6E]/10 px-1.5 py-0.5 text-[8px] font-semibold text-[#F27D6E]">
                  {card.conflicts} conflict{card.conflicts === 1 ? '' : 's'}
                </span>
              )}
              {card.dependencies > 0 && (
                <span className="rounded bg-[#7C8CFF]/10 px-1.5 py-0.5 text-[8px] font-semibold text-[#A6B0FF]">
                  {card.dependencies} need{card.dependencies === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-[var(--v-ink)]">{card.text}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {card.chips.flatMap((group) =>
                group.items.slice(0, 2).map((item) => (
                  <span
                    key={`${card.id}-${group.kind}-${item}`}
                    className="rounded px-1.5 py-0.5 text-[8px]"
                    style={{ color: CHIP_TONE[group.kind] || '#9BA0A8', background: `${CHIP_TONE[group.kind] || '#9BA0A8'}14` }}
                  >
                    {item}
                  </span>
                )),
              )}
            </div>
            {card.dependsOn.length > 0 && (
              <p className="mt-1.5 text-[8.5px] text-[var(--v-faint)]">Needs {card.dependsOn.join(', ')}</p>
            )}
          </div>
        ))}
      </div>
      {model.cards.length > 40 && (
        <p className="text-[9px] text-[var(--v-faint)]">Showing 40 of {model.cards.length} requirement cards.</p>
      )}
    </div>
  );
};

const ReviewView: React.FC<{
  analysis: ReturnType<typeof analyzeRequirements>;
  criteria: ReturnType<typeof generateAcceptanceCriteria>;
}> = ({ analysis, criteria }) => {
  const findings = analysis.findings;
  if (!findings.length && !criteria.length) {
    return <Empty title="No gaps found" body="This source produced no findings and no acceptance criteria. Add more explicit behaviour to review." />;
  }
  return (
    <div className="space-y-4">
      <div>
        <SectionHeading title="Findings" meta={`${findings.length} open`} />
        {findings.length ? (
          <div className="space-y-1.5">
            {findings.slice(0, 40).map((finding) => (
              <div key={finding.id} className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider"
                    style={{ color: SEVERITY_TONE[finding.severity], background: `${SEVERITY_TONE[finding.severity]}14` }}
                  >
                    {finding.severity}
                  </span>
                  <span className="text-[8.5px] uppercase tracking-wider text-[var(--v-faint)]">{finding.type}</span>
                </div>
                <p className="mt-1.5 text-[10.5px] font-semibold text-[var(--v-ink)]">{finding.title}</p>
                <p className="mt-0.5 text-[9.5px] leading-relaxed text-[var(--v-muted)]">{finding.detail}</p>
                {finding.evidence[0] && (
                  <p className="mt-1.5 rounded bg-[var(--v-surface)] px-2 py-1 text-[9px] text-[var(--v-faint)]">
                    {finding.evidence[0].requirementCode}: {finding.evidence[0].text}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] px-3 py-2 text-[10px] text-[var(--v-muted)]">
            No ambiguities, conflicts or dependency problems detected.
          </p>
        )}
        {findings.length > 40 && (
          <p className="mt-1.5 text-[9px] text-[var(--v-faint)]">Showing 40 of {findings.length} findings.</p>
        )}
      </div>

      <div>
        <SectionHeading title="Acceptance criteria" meta={`${criteria.length} generated`} />
        {criteria.length ? (
          <div className="space-y-1.5">
            {criteria.slice(0, 40).map((criterion) => (
              <div key={criterion.id} className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[8.5px] font-semibold text-[var(--v-muted)]">{criterion.requirementCode}</span>
                  <span className="rounded bg-[var(--v-violet)]/10 px-1.5 py-0.5 text-[8px] text-[var(--v-violet)]">{criterion.source}</span>
                </div>
                <div className="mt-1.5 space-y-0.5 text-[9.5px] leading-relaxed">
                  <p><span className="font-semibold text-[var(--v-muted)]">Given</span> <span className="text-[var(--v-ink)]">{criterion.given.replace(/^given\s+/i, '')}</span></p>
                  <p><span className="font-semibold text-[var(--v-muted)]">When</span> <span className="text-[var(--v-ink)]">{criterion.when.replace(/^when\s+/i, '')}</span></p>
                  <p><span className="font-semibold text-[var(--v-muted)]">Then</span> <span className="text-[var(--v-ink)]">{criterion.then.replace(/^then\s+/i, '')}</span></p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] px-3 py-2 text-[10px] text-[var(--v-muted)]">
            No acceptance criteria could be generated from this source.
          </p>
        )}
      </div>
    </div>
  );
};

const PromptView: React.FC<{ text: string; sourceLabel: string }> = ({ text, sourceLabel }) => {
  const [copied, copy] = useCopied();
  const blocks = useMemo(() => {
    return text
      .split(/\n(?=\s*\d{2}\s*\/\s*)/)
      .map((block) => {
        const lines = block.split('\n');
        const match = lines[0]?.match(/^\s*(\d{2})\s*\/\s*(.+)$/);
        if (!match) return { number: '', title: '', body: block.trim() };
        return { number: match[1], title: match[2].trim(), body: lines.slice(1).join('\n').trim() };
      })
      .filter((block) => block.body || block.title);
  }, [text]);

  if (!text.trim()) return <Empty title="No prompt in this source" body="Pick another source, or create a canvas first." />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <SectionHeading title="Six-section brief" meta={sourceLabel} />
        <button type="button" onClick={() => copy(text)} className="v-btn v-btn-ghost h-7 px-2 text-[9.5px]">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div key={`${block.number}-${index}`} className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
            {block.title && (
              <div className="mb-1 flex items-center gap-1.5">
                {block.number && <span className="font-mono text-[9px] font-semibold text-[var(--v-violet)]">{block.number}</span>}
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--v-muted)]">{block.title}</p>
              </div>
            )}
            <pre className="whitespace-pre-wrap text-[9.5px] leading-relaxed text-[var(--v-ink)]">{block.body}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

const BuildView: React.FC<{ text: string }> = ({ text }) => {
  const [copied, copy] = useCopied();
  const [key, setKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="flex h-full min-h-[420px] flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold text-[var(--v-ink)]">Base44 builder</p>
          <p className="text-[9px] text-[var(--v-faint)]">Sign in inside the frame, then paste the prompt into a new app.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoaded(false);
            setKey((value) => value + 1);
          }}
          className="v-btn v-btn-ghost h-7 px-2 text-[9.5px]"
        >
          <RefreshCw className="h-3 w-3" /> Reload
        </button>
        <a href="https://app.base44.com" target="_blank" rel="noreferrer" className="v-btn v-btn-ghost h-7 px-2 text-[9.5px]">
          <ExternalLink className="h-3 w-3" /> New tab
        </a>
        <button type="button" onClick={() => copy(text)} disabled={!text.trim()} className="v-btn v-btn-primary h-7 px-2 text-[9.5px] disabled:opacity-40">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? 'Copied' : 'Copy prompt'}
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)]">
        {!loaded && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[var(--v-surface-2)]">
            <div className="text-center">
              <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#7C5CFF]" />
              <p className="mt-2 text-[10px] text-[var(--v-muted)]">Loading Base44…</p>
            </div>
          </div>
        )}
        <iframe
          key={key}
          src="https://app.base44.com"
          title="Base44 builder"
          className="h-full min-h-[400px] w-full flex-1 border-0 bg-white"
          allow="clipboard-read; clipboard-write"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </div>
      <p className="text-[8.5px] leading-relaxed text-[var(--v-faint)]">
        No API key is used. Base44 keeps its own sign-in. If the frame stays blank, the host is blocking embedding — use New tab.
      </p>
    </div>
  );
};

const DesignView: React.FC<{ projectId: string }> = ({ projectId }) => {
  const system = useMemo(() => getActiveDesignSystem(), []);
  const setup = useMemo(() => readProjectSetup(projectId), [projectId]);
  const tokens = system?.tokens;
  const colours = tokens
    ? [
        { label: 'Primary', value: tokens.primary },
        { label: 'Accent', value: tokens.accent },
        { label: 'Surface', value: tokens.surface },
        { label: 'Ink', value: tokens.ink },
      ]
    : [
        { label: 'Primary', value: DEFAULT_TOKENS.primary },
        { label: 'Accent', value: DEFAULT_TOKENS.accent },
        { label: 'Surface', value: DEFAULT_TOKENS.surface },
        { label: 'Ink', value: DEFAULT_TOKENS.ink },
      ];

  const purposes = Array.isArray(setup?.purposes) ? (setup?.purposes as string[]) : [];
  const features = Array.isArray(setup?.features) ? (setup?.features as string[]) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--v-violet)]/10 text-[var(--v-violet)]">
          <Palette className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[var(--v-ink)]">{system?.name || 'Workspace default'}</p>
          <p className="text-[9px] text-[var(--v-faint)]">
            {system ? `Updated ${new Date(system.updatedAt).toLocaleDateString()}` : 'No design system is active for this workspace.'}
          </p>
        </div>
        <span className="rounded-full border border-[var(--v-line)] px-2 py-0.5 text-[8px] uppercase tracking-wider text-[var(--v-faint)]">
          Read-only
        </span>
      </div>

      <div>
        <SectionHeading title="Colour" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {colours.map((colour) => (
            <div key={colour.label} className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2">
              <span className="block h-10 w-full rounded-md border border-white/10" style={{ background: colour.value }} />
              <p className="mt-1.5 text-[9px] font-semibold text-[var(--v-ink)]">{colour.label}</p>
              <p className="font-mono text-[8.5px] text-[var(--v-faint)]">{colour.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
          <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--v-faint)]">Typography</p>
          <p className="mt-1 text-[13px] font-semibold text-[var(--v-ink)]">{tokens?.font || DEFAULT_TOKENS.font}</p>
          <p className="text-[9px] text-[var(--v-muted)]">Display 40 · H1 28 · Body 14 · Mono 9</p>
        </div>
        <div className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
          <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--v-faint)]">Radius</p>
          <p className="mt-1 text-[13px] font-semibold text-[var(--v-ink)]">{tokens?.radius ? `${tokens.radius}px` : DEFAULT_TOKENS.radius}</p>
          <p className="text-[9px] text-[var(--v-muted)]">Controls 6 · Cards 8 · Panels 12</p>
        </div>
        <div className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
          <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--v-faint)]">Spacing</p>
          <p className="mt-1 text-[13px] font-semibold text-[var(--v-ink)]">{tokens?.spacing ?? DEFAULT_TOKENS.spacing}</p>
          <p className="text-[9px] text-[var(--v-muted)]">4 px base scale</p>
        </div>
      </div>

      {(purposes.length > 0 || features.length > 0) && (
        <div>
          <SectionHeading title="Project context" />
          <div className="flex flex-wrap gap-1">
            {purposes.map((purpose) => (
              <span key={purpose} className="rounded bg-[var(--v-violet)]/10 px-2 py-0.5 text-[9px] text-[var(--v-violet)]">
                {purpose}
              </span>
            ))}
            {features.map((feature) => (
              <span key={feature} className="rounded border border-[var(--v-line)] bg-[var(--v-surface-2)] px-2 py-0.5 text-[9px] text-[var(--v-muted)]">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AnalyserView: React.FC<{
  risk: number;
  requirements: RequirementRecord[];
  findings: ReturnType<typeof analyzeRequirements>['findings'];
  criteria: ReturnType<typeof generateAcceptanceCriteria>;
  questions: number;
  issues: number;
}> = ({ risk, requirements, findings, criteria, questions, issues }) => {
  const tone = risk >= 60 ? '#F27D6E' : risk >= 35 ? '#E0B15C' : '#8C8CFF';
  const label = risk >= 60 ? 'High risk' : risk >= 35 ? 'Medium risk' : 'Low risk';
  const severe = findings.filter((finding) => finding.severity === 'high' || finding.severity === 'critical').length;
  const readiness = Math.max(0, Math.min(100, Math.round(100 - questions * 6 - issues * 4)));
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[1.1fr_1fr]">
        <div className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-[var(--v-faint)]">Risk score</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="v-display text-[34px] leading-none" style={{ color: tone }}>{risk}</p>
            <span className="pb-1 text-[10px] text-[var(--v-muted)]">/ 100 · {label}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--v-surface)]">
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, risk)}%`, background: tone }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Requirements', value: requirements.length },
            { label: 'Criteria', value: criteria.length },
            { label: 'Findings', value: findings.length },
            { label: 'High severity', value: severe },
            { label: 'Open questions', value: questions },
            { label: 'Quality issues', value: issues },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] px-2.5 py-2">
              <p className="text-[15px] font-semibold text-[var(--v-ink)]">{stat.value}</p>
              <p className="text-[8.5px] text-[var(--v-faint)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionHeading title="Readiness" meta={`${readiness}%`} />
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--v-surface-2)]">
          <div className="h-full rounded-full bg-[var(--v-violet)]" style={{ width: `${Math.max(2, readiness)}%` }} />
        </div>
        <p className="mt-1.5 text-[9px] leading-relaxed text-[var(--v-muted)]">
          Readiness drops with each unresolved question and quality issue. It is a signal, not an approval.
        </p>
      </div>

      <div>
        <SectionHeading title="Fix first" />
        {findings.filter((finding) => finding.severity === 'high' || finding.severity === 'critical').slice(0, 5).map((finding) => (
          <div key={finding.id} className="mb-1.5 flex items-start gap-2 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" style={{ color: SEVERITY_TONE[finding.severity] }} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[var(--v-ink)]">{finding.title}</p>
              <p className="text-[9px] leading-relaxed text-[var(--v-muted)]">{finding.whyItMatters}</p>
            </div>
          </div>
        ))}
        {!severe && <p className="text-[9.5px] text-[var(--v-muted)]">No high-severity findings.</p>}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-[var(--v-violet)]" />
        <p className="text-[9px] leading-relaxed text-[var(--v-muted)]">
          This analysis runs on the selected source only. It never changes the prompt, the canvas or the project.
        </p>
      </div>
    </div>
  );
};

export const ProjectToolsDialog: React.FC<ProjectToolsDialogProps> = ({
  open,
  tool,
  project,
  sources,
  onToolChange,
  onClose,
  onOpenFull,
}) => {
  const [sourceId, setSourceId] = useState('');
  const [sourceOpen, setSourceOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSourceId((current) => (sources.some((source) => source.id === current) ? current : sources[0]?.id || ''));
  }, [open, sources]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const source = sources.find((entry) => entry.id === sourceId) || sources[0] || null;

  const compiled = useMemo(() => {
    if (!open || !source || !source.text.trim()) return null;
    const pages = pagesFromPrompt(source.text);
    if (!pages.length) return null;
    const drafts =
      source.kind === 'prompt'
        ? promptDrafts(source.text)
        : compileRequirements({
            text: pages.join('\n\n'),
            pages,
            pageCount: pages.length,
            fileName: source.label,
            mimeType: 'text/plain',
          });
    const now = new Date().toISOString();
    const requirements: RequirementRecord[] = drafts.map((draft) => {
      const base: RequirementRecord = {
        ...draft,
        id: `${source.id}:${draft.requirementCode}`,
        projectId: project.id,
        documentId: null,
        status: 'pending_review',
        priority: 'medium',
        priorityReason: null,
        createdAt: now,
      };
      const priority = classifyRequirementPriority(base);
      return { ...base, priority: priority.priority, priorityReason: priority.reason };
    });
    const analysis = analyzeRequirements(requirements);
    const criteria = generateAcceptanceCriteria(requirements, project.id);
    let risk = 0;
    let questions = 0;
    let issues = 0;
    try {
      const screens = compilePromptScreens(source.text);
      const elements = screens[0]?.elements || [];
      risk = roughRisk(elements);
      questions = screens.flatMap((screen) => auditElements(screen.elements)).length;
      issues = screens.flatMap((screen) => auditQuality(screen.elements)).length;
    } catch {
      // The prompt compiler is best-effort on free-form sources.
    }
    return { requirements, analysis, criteria, risk, questions, issues };
  }, [open, project.id, source]);

  if (!open) return null;

  const counts: Record<ProjectToolId, string> = {
    requirements: compiled ? String(compiled.requirements.length) : '—',
    graph: compiled ? String(compiled.analysis.graph.nodes.length) : '—',
    review: compiled ? String(compiled.analysis.findings.length) : '—',
    prompt: source ? String(pagesFromPrompt(source.text).length) : '—',
    build: 'Base44',
    design: 'Tokens',
    analyser: compiled ? `risk ${compiled.risk}` : '—',
  };

  const activeTool = TOOLS.find((entry) => entry.id === tool) || TOOLS[0];

  return (
    <div className="fixed inset-0 z-[95] flex justify-end" role="dialog" aria-modal="true" aria-label={`${activeTool.label} — ${project.name}`}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="drawer-panel relative flex h-full w-full max-w-[720px] flex-col overflow-hidden border-l border-[var(--v-line)] bg-[var(--v-surface)] shadow-[-30px_0_120px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex flex-wrap items-start gap-2 border-b border-[var(--v-line)] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="v-eyebrow">Project tools · {project.name}</p>
            <h2 className="mt-0.5 text-[17px] font-semibold text-[var(--v-ink)]">{activeTool.label}</h2>
            <p className="mt-0.5 text-[9.5px] text-[var(--v-faint)]">{activeTool.hint}</p>
          </div>
          <span className="hidden rounded-full border border-[var(--v-line)] bg-[var(--v-surface-2)] px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-[var(--v-faint)] sm:inline-flex">
            {tool === 'build' || tool === 'design' ? 'Read-only' : 'Read-only analysis'}
          </span>
          {tool !== 'build' && tool !== 'design' && (
            <button type="button" onClick={() => onOpenFull(tool)} className="v-btn v-btn-ghost h-7 px-2 text-[9.5px]">
              <ArrowUpRight className="h-3 w-3" /> Open page
            </button>
          )}
          <button type="button" onClick={onClose} className="v-icon-btn" aria-label="Close project tools">
            <X className="h-4 w-4" />
          </button>
        </div>

        {tool !== 'design' && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--v-line)] bg-[var(--v-surface-2)]/40 px-4 py-2">
            <button
              type="button"
              onClick={() => setSourceOpen((value) => !value)}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)] px-2 text-[9.5px] text-[var(--v-muted)] hover:text-[var(--v-ink)]"
              aria-expanded={sourceOpen}
            >
              <Layers className="h-3 w-3 text-[var(--v-violet)]" />
              Source: <span className="max-w-[220px] truncate font-semibold text-[var(--v-ink)]">{source?.label || 'none'}</span>
              <ChevronDown className="h-3 w-3 text-[var(--v-faint)]" />
            </button>
            {source && <span className="truncate text-[9px] text-[var(--v-faint)]">{source.detail}</span>}
            <span className="ml-auto text-[8.5px] text-[var(--v-faint)]">
              {tool === 'build'
                ? 'Pick the prompt to copy into Base44. Nothing here edits the project.'
                : 'Choose the prompt to analyse. Nothing here edits the project.'}
            </span>
          </div>
        )}

        {sourceOpen && tool !== 'design' && (
          <div className="border-b border-[var(--v-line)] bg-[var(--v-surface)] p-2">
            <div className="grid max-h-[220px] gap-1 overflow-y-auto">
              {sources.map((entry) => {
                const active = entry.id === source?.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      setSourceId(entry.id);
                      setSourceOpen(false);
                    }}
                    className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors ${
                      active
                        ? 'border-[var(--v-violet)]/60 bg-[var(--v-violet)]/8'
                        : 'border-transparent hover:border-[var(--v-line)] hover:bg-[var(--v-surface-2)]'
                    }`}
                  >
                    <FileText className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-[var(--v-violet)]' : 'text-[var(--v-faint)]'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] font-semibold text-[var(--v-ink)]">{entry.label}</span>
                      <span className="block truncate text-[8.5px] text-[var(--v-faint)]">{entry.detail}</span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--v-violet)]" />}
                  </button>
                );
              })}
              {!sources.length && (
                <p className="px-2 py-3 text-[10px] text-[var(--v-muted)]">
                  This project has no prompt or text source yet. Create a canvas or write a prompt, then reopen the tools.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[196px_1fr]">
          <div className="flex gap-1 overflow-x-auto border-b border-[var(--v-line)] p-2 md:flex-col md:overflow-visible md:border-b-0 md:border-r">
            {TOOLS.map((entry) => {
              const Icon = entry.icon;
              const active = entry.id === tool;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onToolChange(entry.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] transition-colors md:w-full ${
                    active
                      ? 'bg-[var(--v-surface-2)] text-[var(--v-ink)]'
                      : 'text-[var(--v-muted)] hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-[var(--v-violet)]' : 'text-[var(--v-faint)]'}`} />
                  <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                  <span className="hidden text-[8px] text-[var(--v-faint)] md:inline">{counts[entry.id]}</span>
                </button>
              );
            })}
          </div>

          <div key={tool} className="tool-swap v-scroll min-h-0 overflow-y-auto p-4">
            {!source && (
              <Empty title="No source to analyse yet" body="Create a canvas or write a prompt in this project. The tools will then analyse it here, without changing anything." />
            )}

            {source && tool === 'requirements' && (
              compiled ? <RequirementsView requirements={compiled.requirements} sourceLabel={source.label} sourceKind={source.kind} /> : <Empty title="Could not read this source" body="Try another prompt or file." />
            )}

            {source && tool === 'graph' && (
              compiled ? <GraphView analysis={compiled.analysis} /> : <Empty title="Could not read this source" body="Try another prompt or file." />
            )}

            {source && tool === 'review' && (
              compiled ? <ReviewView analysis={compiled.analysis} criteria={compiled.criteria} /> : <Empty title="Could not read this source" body="Try another prompt or file." />
            )}

            {source && tool === 'prompt' && <PromptView text={source.text} sourceLabel={source.label} />}

            {source && tool === 'build' && <BuildView text={source.text} />}

            {tool === 'design' && <DesignView projectId={project.id} />}

            {source && tool === 'analyser' && (
              compiled ? (
                <AnalyserView
                  risk={compiled.risk}
                  requirements={compiled.requirements}
                  findings={compiled.analysis.findings}
                  criteria={compiled.criteria}
                  questions={compiled.questions}
                  issues={compiled.issues}
                />
              ) : (
                <Empty title="Could not read this source" body="Try another prompt or file." />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
