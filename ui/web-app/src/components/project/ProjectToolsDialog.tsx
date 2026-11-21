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
import { auditElements, auditQuality, compilePromptScreens, roughRisk } from '../../services/promptCompiler.ts';
import {
  applySystemToProject,
  getActiveDesignSystem,
  listDesignSystems,
  saveDesignSystem,
  setActiveDesignSystem,
  type DesignSystem,
  type DesignTokens,
} from '../../services/designSystems.ts';
import { readProjectSetup } from '../../services/projectSeed.ts';
import { readBase44PageUrl } from '../../services/base44.ts';

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
  /** Keep the panel inside its parent (the workspace) instead of covering the app. */
  inline?: boolean;
  tool: ProjectToolId;
  project: { id: string; name: string };
  sources: ProjectToolSource[];
  onToolChange: (tool: ProjectToolId) => void;
  onClose: () => void;
  onOpenFull: (tool: ProjectToolId) => void;
}

const TOOLS: Array<{ id: ProjectToolId; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }> = [
  { id: 'requirements', label: 'Requirements', icon: FileText, hint: 'From uploaded requirement documents' },
  { id: 'graph', label: 'Requirement graph', icon: GitBranch, hint: 'From uploaded requirement documents' },
  { id: 'review', label: 'Review & acceptance', icon: ClipboardCheck, hint: 'From uploaded requirement documents' },
  { id: 'prompt', label: 'Prompt studio', icon: Sparkles, hint: 'The six-section brief' },
  { id: 'design', label: 'Design systems', icon: Palette, hint: 'Tokens this project uses' },
  { id: 'analyser', label: 'Prompt analyser', icon: BarChart3, hint: 'Risk and readiness' },
];

/** Requirement analysis is document-first; prompts and canvas files are not a source. */
const DOCUMENT_TOOLS = new Set<ProjectToolId>(['requirements', 'graph', 'review']);

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

const BuildView: React.FC<{ text: string; projectId: string }> = ({ text, projectId }) => {
  const [copied, copy] = useCopied();
  const [key, setKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const base44Url = useMemo(() => readBase44PageUrl(projectId), [projectId]);
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
        <a href={base44Url} target="_blank" rel="noreferrer" className="v-btn v-btn-ghost h-7 px-2 text-[9.5px]">
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

const DesignView: React.FC<{ projectId: string; onOpenPage: () => void }> = ({ projectId, onOpenPage }) => {
  const setup = useMemo(() => readProjectSetup(projectId), [projectId]);
  const [system, setSystem] = useState<DesignSystem | null>(() => getActiveDesignSystem());
  const [systems] = useState<DesignSystem[]>(() => listDesignSystems());
  const [name, setName] = useState(system?.name || '');
  const [tokens, setTokens] = useState<DesignTokens>(
    system?.tokens || {
      primary: DEFAULT_TOKENS.primary,
      accent: DEFAULT_TOKENS.accent,
      surface: DEFAULT_TOKENS.surface,
      ink: DEFAULT_TOKENS.ink,
      font: 'jakarta',
      radius: 12,
      spacing: 8,
    },
  );
  const [saved, setSaved] = useState(false);

  const purposes = Array.isArray(setup?.purposes) ? (setup?.purposes as string[]) : [];
  const features = Array.isArray(setup?.features) ? (setup?.features as string[]) : [];

  const choose = (next: DesignSystem) => {
    setActiveDesignSystem(next.id);
    setSystem(next);
    setName(next.name);
    setTokens(next.tokens);
    applySystemToProject(projectId, next);
    setSaved(true);
  };

  const save = () => {
    if (!system) return;
    const next = saveDesignSystem({ id: system.id, name, note: system.note, tokens });
    setSystem(next);
    setName(next.name);
    setTokens(next.tokens);
    applySystemToProject(projectId, next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const update = (key: keyof DesignTokens, value: string | number) =>
    setTokens((current) => ({ ...current, [key]: value }));

  if (!system) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--v-violet)]/10 text-[var(--v-violet)]">
              <Palette className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[var(--v-ink)]">No design system active</p>
              <p className="text-[9px] text-[var(--v-faint)]">Pick one to apply its colours to this project.</p>
            </div>
            <button type="button" onClick={onOpenPage} className="v-btn v-btn-ghost h-7 px-2 text-[9px]">
              <ArrowUpRight className="h-3 w-3" /> Open page
            </button>
          </div>
        </div>
        {systems.length === 0 ? (
          <Empty title="No design systems yet" body="Create one on the Design systems page, then return here." />
        ) : (
          <div className="grid gap-2">
            {systems.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => choose(entry)}
                className="flex items-center gap-2 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5 text-left hover:border-[var(--v-violet)]"
              >
                <span className="flex gap-1">
                  {[entry.tokens.primary, entry.tokens.accent, entry.tokens.surface].map((colour) => (
                    <span key={colour} className="h-4 w-4 rounded-full border border-[var(--v-line)]" style={{ background: colour }} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-semibold text-[var(--v-ink)]">{entry.name}</span>
                  <span className="block truncate text-[9px] text-[var(--v-faint)]">{entry.tokens.font} · {entry.tokens.radius}px</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--v-violet)]/10 text-[var(--v-violet)]">
          <Palette className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[var(--v-ink)]">Active design system</p>
          <p className="text-[9px] text-[var(--v-faint)]">Edit the tokens; saving recolours this project's canvas.</p>
        </div>
        <button type="button" onClick={onOpenPage} className="v-btn v-btn-ghost h-7 px-2 text-[9px]">
          <ArrowUpRight className="h-3 w-3" /> Open page
        </button>
      </div>

      <label className="block">
        <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--v-faint)]">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 h-8 w-full rounded-md border border-[var(--v-line)] bg-[var(--v-surface)] px-2 text-[11px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
        />
      </label>

      <div>
        <SectionHeading title="Colour" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([
            ['primary', 'Primary'],
            ['accent', 'Accent'],
            ['surface', 'Surface'],
            ['ink', 'Ink'],
          ] as const).map(([key, label]) => (
            <label key={key} className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2">
              <span className="block h-9 w-full rounded-md border border-white/10" style={{ background: tokens[key] }} />
              <span className="mt-1.5 flex items-center gap-1.5">
                <input
                  type="color"
                  value={tokens[key]}
                  onChange={(event) => update(key, event.target.value)}
                  className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
                  aria-label={label}
                />
                <span className="text-[9px] font-semibold text-[var(--v-ink)]">{label}</span>
              </span>
              <span className="block font-mono text-[8.5px] text-[var(--v-faint)]">{tokens[key]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
          <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--v-faint)]">Typeface</span>
          <select
            value={tokens.font}
            onChange={(event) => update('font', event.target.value)}
            className="mt-1 h-7 w-full rounded border border-[var(--v-line)] bg-[var(--v-surface)] px-1 text-[10px] text-[var(--v-ink)]"
          >
            {['jakarta', 'bricolage', 'georgia', 'mono'].map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </label>
        <label className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
          <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--v-faint)]">Radius · {tokens.radius}px</span>
          <input type="range" min={0} max={32} value={tokens.radius} onChange={(event) => update('radius', Number(event.target.value))} className="mt-3 w-full accent-[var(--v-violet)]" />
        </label>
        <label className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
          <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--v-faint)]">Spacing · {tokens.spacing}px</span>
          <input type="range" min={2} max={16} value={tokens.spacing} onChange={(event) => update('spacing', Number(event.target.value))} className="mt-3 w-full accent-[var(--v-violet)]" />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={save} className="v-btn v-btn-primary h-8 px-3 text-[10.5px]">
          {saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saved ? 'Saved to canvas' : 'Save and apply to canvas'}
        </button>
        <span className="text-[9px] text-[var(--v-faint)]">This changes the saved canvas colours for this project.</span>
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
  questions: number;
  issues: number;
}> = ({ risk, questions, issues }) => {
  const tone = risk >= 60 ? '#F27D6E' : risk >= 35 ? '#E0B15C' : '#8C8CFF';
  const label = risk >= 60 ? 'High risk' : risk >= 35 ? 'Medium risk' : 'Low risk';
  const readiness = Math.max(0, Math.min(100, Math.round(100 - questions * 6 - issues * 4)));
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[1.1fr_1fr]">
        <div className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-[var(--v-faint)]">Risk score</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="v-display text-[34px] leading-none" style={{ color: tone }}>{risk}</p>
            <span className="pb-1 text-[10px] text-[var(--v-muted)]">/ 100 - {label}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--v-surface)]">
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, risk)}%`, background: tone }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Risk band', value: label },
            { label: 'Readiness', value: `${readiness}%` },
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

      <div className="flex items-start gap-2 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-[var(--v-violet)]" />
        <p className="text-[9px] leading-relaxed text-[var(--v-muted)]">
          This analyser reads the selected prompt only. Requirement documents are reviewed separately in
          Requirement graph and Review & acceptance.
        </p>
      </div>
    </div>
  );
};

export const ProjectToolsDialog: React.FC<ProjectToolsDialogProps> = ({
  open,
  inline = false,
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
  const documentTool = DOCUMENT_TOOLS.has(tool);

  const compiled = useMemo(() => {
    if (!open || documentTool || !source || !source.text.trim()) return null;
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
    return { risk, questions, issues };
  }, [open, source, documentTool]);

  if (!open) return null;

  const counts: Record<ProjectToolId, string> = {
    requirements: 'Documents',
    graph: 'Documents',
    review: 'Documents',
    prompt: source ? String(pagesFromPrompt(source.text).length) : '—',
    build: 'Base44',
    design: 'Tokens',
    analyser: compiled ? `risk ${compiled.risk}` : '—',
  };

  const activeTool = TOOLS.find((entry) => entry.id === tool) || TOOLS[0];

  return (
    <div
      className={`${inline ? 'absolute inset-0 z-30 rounded-lg' : 'fixed inset-0 z-[95]'} flex justify-end`}
      role="dialog"
      aria-modal="true"
      aria-label={`${activeTool.label} — ${project.name}`}
    >
      <div
        className={`absolute inset-0 ${inline ? 'bg-black/40' : 'bg-black/55 backdrop-blur-sm'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="drawer-panel relative flex h-full w-full max-w-[720px] flex-col overflow-hidden border-l border-[var(--v-line)] bg-[var(--v-surface)] shadow-[-30px_0_120px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex flex-wrap items-start gap-2 border-b border-[var(--v-line)] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="v-eyebrow">Project tools · {project.name}</p>
            <h2 className="mt-0.5 text-[17px] font-semibold text-[var(--v-ink)]">{activeTool.label}</h2>
            <p className="mt-0.5 text-[9.5px] text-[var(--v-faint)]">{activeTool.hint}</p>
          </div>
          <span className="hidden rounded-full border border-[var(--v-line)] bg-[var(--v-surface-2)] px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-[var(--v-faint)] sm:inline-flex">
            {tool === 'build' ? 'Read-only' : tool === 'design' ? 'Editable' : documentTool ? 'From documents' : 'Read-only analysis'}
          </span>
          {tool !== 'build' && (
            <button type="button" onClick={() => onOpenFull(tool)} className="v-btn v-btn-ghost h-7 px-2 text-[9.5px]">
              <ArrowUpRight className="h-3 w-3" /> Open page
            </button>
          )}
          <button type="button" onClick={onClose} className="v-icon-btn" aria-label="Close project tools">
            <X className="h-4 w-4" />
          </button>
        </div>

        {tool !== 'design' && !documentTool && (
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

        {sourceOpen && tool !== 'design' && !documentTool && (
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
            {documentTool && (
              <div className="rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--v-violet)]/10 text-[var(--v-violet)]">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[12px] font-semibold text-[var(--v-ink)]">Upload a requirement document</h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--v-muted)]">
                      Requirement graph, review findings and acceptance criteria are extracted only from an uploaded PDF,
                      DOCX, TXT or Markdown document. Prompts and canvas pages are not used here.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenFull(tool)}
                      className="v-btn v-btn-primary mt-3 h-8 px-3 text-[10.5px]"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Open {tool === 'requirements' ? 'Requirement Compiler' : tool === 'graph' ? 'Requirement graph' : 'Review & acceptance'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!documentTool && !source && (
              <Empty title="No source to analyse yet" body="Create a canvas or write a prompt in this project. The tools will then analyse it here, without changing anything." />
            )}

            {source && tool === 'prompt' && <PromptView text={source.text} sourceLabel={source.label} />}

            {source && tool === 'build' && <BuildView text={source.text} projectId={project.id} />}

            {tool === 'design' && <DesignView projectId={project.id} onOpenPage={() => onOpenFull('design')} />}

            {source && tool === 'analyser' && (
              compiled ? (
                <AnalyserView
                  risk={compiled.risk}
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
