import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, Check, Copy, Cpu, Layers, Loader2, Plus, Sparkles, Undo2,
} from 'lucide-react';
import {
  REQUIRED_ATTRS,
  auditElements,
  auditQuality,
  compilePromptScreens,
  layoutElements,
  roughRisk,
  type CompiledElement,
  type PromptScreen,
  type QualityIssue,
  type Question,
  type Viewport,
} from '../services/promptCompiler.ts';
import { refineWithBERT } from '../services/promptRefiner.ts';
import { WireframePreview } from '../components/editor/WireframePreview.tsx';

interface Props {
  projectName: string;
  onBack: () => void;
  onOpenCanvas: () => void;
  onGenerate: (prompt: string) => void;
}

interface PageRefinement {
  elements: CompiledElement[];
  applied: string[];
  confidence: number;
  ms: number;
}

interface ScreenView {
  screen: PromptScreen;
  elements: CompiledElement[];
  open: Question[];
  risk: number;
  issues: QualityIssue[];
}

const HINTS: Record<string, string> = {
  action: 'Needed so the built UI wires the interaction, not just the label.',
  label: 'Needed so the generator writes real copy instead of a placeholder.',
  colour: 'Needed so the palette is decided, not guessed.',
  location: 'Needed so the element lands in the right region.',
};

const TONE: Record<string, string> = {
  info: 'bg-[var(--v-muted)]',
  merge: 'bg-[#F59E0B]',
  infer: 'bg-[var(--v-teal)]',
  warn: 'bg-[#E5484D]',
};

const missingAttrs = (element: CompiledElement) =>
  (REQUIRED_ATTRS[element.kind] || []).filter(
    (attribute) => !element[attribute as keyof CompiledElement]
  );

/** Apply confirmed answers, including sibling fills for repeated grids. */
function applyAnswers(
  base: CompiledElement[],
  answers: Record<string, string>,
  confirmed: Record<string, boolean>
): CompiledElement[] {
  const patches = new Map<string, Partial<CompiledElement>>();

  Object.entries(answers).forEach(([key, value]) => {
    if (!confirmed[key] || !value.trim()) return;
    const [id, attribute] = key.split(':');
    const target = base.find((element) => element.id === id);
    if (!target) return;

    base.forEach((element) => {
      const sameElement = element.id === target.id;
      const sibling =
        attribute !== 'location' &&
        element.kind === target.kind &&
        (element.section || '') === (target.section || '') &&
        (element.sourceLine || '') === (target.sourceLine || '') &&
        (element.action || '') === (target.action || '') &&
        !element[attribute as keyof CompiledElement];

      if (!sameElement && !sibling) return;
      const patch = patches.get(element.id) || {};
      (patch as Record<string, string>)[attribute] = value.trim();
      patches.set(element.id, patch);
    });
  });

  return base.map((element) => {
    const patch = patches.get(element.id);
    return patch ? { ...element, ...patch } : element;
  });
}

/**
 * Describe where an element sits on the schematic board without implying that
 * its pixel geometry was specified by the user.
 */
function placementOf(element: CompiledElement, boardWidth: number): string {
  const wide = element.w >= boardWidth * 0.6;
  switch (element.kind) {
    case 'background': return 'full-board backdrop';
    case 'navbar': return 'full width, top';
    case 'footer': return 'full width, bottom';
    case 'modal': return 'centred overlay';
    case 'table':
    case 'chart': return 'full width, data block';
    case 'card': return wide ? 'full-width card' : 'grid cell';
    case 'image': return wide ? 'hero media' : 'media tile';
    case 'input': return 'form column';
    case 'button':
    case 'link':
    case 'badge':
    case 'avatar':
    case 'checkbox': return 'inline action';
    case 'tabs': return 'full width, below header';
    case 'progress': return 'inline progress';
    case 'heading': return 'wide heading';
    case 'text': return 'body copy';
    default: return 'content block';
  }
}

export const PromptModePage: React.FC<Props> = ({ projectName, onBack, onOpenCanvas, onGenerate }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [activeId, setActiveId] = useState('screen_1');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'wireframe' | 'prompt'>('wireframe');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [baselineRisks, setBaselineRisks] = useState<Record<string, number>>({});
  const [refinedById, setRefinedById] = useState<Record<string, PageRefinement | undefined>>({});
  const [deep, setDeep] = useState<{
    running: boolean;
    percent: number;
    stage: string;
    error?: string;
    rejected?: boolean;
  }>({ running: false, percent: 0, stage: '' });

  const screens = useMemo(() => compilePromptScreens(submitted), [submitted]);
  const pageIndex = Math.max(0, screens.findIndex((screen) => screen.id === activeId));
  const compiled = screens[pageIndex] ?? screens[0];

  const refined = refinedById[compiled.id];
  const baseElements = refined?.elements ?? compiled.elements;
  const merged = useMemo(
    () => applyAnswers(baseElements, answers, confirmed),
    [baseElements, answers, confirmed]
  );
  const open = useMemo(() => auditElements(merged), [merged]);
  const elements = useMemo(
    () => layoutElements(merged, compiled.archetype, viewport, compiled.meta.tokens),
    [merged, compiled.archetype, compiled.meta.tokens, viewport]
  );
  const issues = useMemo(() => auditQuality(elements), [elements]);
  const risk = roughRisk(elements);
  const baselineRisk = baselineRisks[compiled.id] ?? null;
  const answeredCount = Object.values(confirmed).filter(Boolean).length;

  const allScreens: ScreenView[] = useMemo(
    () =>
      screens.map((screen) => {
        const pageBase = refinedById[screen.id]?.elements ?? screen.elements;
        const pageMerged = applyAnswers(pageBase, answers, confirmed);
        const pageLayout = layoutElements(
          pageMerged,
          screen.archetype,
          viewport,
          screen.meta.tokens
        );
        return {
          screen,
          elements: pageLayout,
          open: auditElements(pageMerged),
          risk: roughRisk(pageLayout),
          issues: auditQuality(pageLayout),
        };
      }),
    [screens, refinedById, answers, confirmed, viewport]
  );

  const totalOpen = allScreens.reduce((sum, page) => sum + page.open.length, 0);
  const overallRisk = allScreens.reduce((max, page) => Math.max(max, page.risk), 0);
  const unrecognised = allScreens.filter(
    (page) => page.screen.meta.usedLines === 0 && page.screen.meta.specLines > 0
  );
  const ready = submitted.trim().length > 0 && totalOpen === 0 && unrecognised.length === 0;
  const pageReady = submitted.trim().length > 0 && open.length === 0 && elements.length > 0;

  const confidence = elements.length
    ? Math.round(
        (elements.reduce((sum, element) => sum + (element.confidence || 0), 0) / elements.length) * 100
      )
    : 0;

  const missingCount = elements.reduce((sum, element) => sum + missingAttrs(element).length, 0);
  const requiredCount = elements.reduce(
    (sum, element) => sum + (REQUIRED_ATTRS[element.kind]?.length || 0),
    0
  );

  const boardWidth = viewport === 'mobile' ? 390 : 1200;
  const boardHeight = viewport === 'mobile' ? 844 : 800;

  const revisedPrompt = useMemo(() => {
    if (!submitted.trim()) return '';
    const tokens = screens[0]?.meta.tokens ?? compiled.meta.tokens;
    const multi = screens.length > 1;
    const lines: string[] = [
      'ROLE',
      'You are a senior product designer and front-end engineer.',
      '',
      'TASK',
      submitted.trim(),
      '',
      'SCREENS',
      ...screens.map((screen, index) => `${index + 1}. ${screen.name} — ${screen.archetype}`),
      '',
      'DESIGN TOKENS',
      `primary ${tokens.primary}${tokens.statedColour ? '' : ' (house default)'}`,
      `theme ${tokens.theme}`,
      `density ${tokens.density}`,
      `radius ${tokens.radius}px`,
      `typeface ${tokens.font}`,
      '',
      'LAYOUT',
      `Schematic ${boardWidth}×${boardHeight} ${viewport} board. Positions are a starting skeleton, not fixed CSS or a measurement taken from the request. Use responsive auto-layout.`,
      '',
    ];

    const writePage = (page: ScreenView) => {
      if (!page.elements.length) {
        lines.push('(no recognised components — this page reads as a drawing or visual instruction, not UI)');
        lines.push('');
        return;
      }

      page.elements.forEach((element, index) => {
        const attrs = [
          element.label ? `label “${element.label}”` : 'label UNRESOLVED',
          element.count && element.count > 1 ? `×${element.count}` : '',
          element.colour ? `colour ${element.colour}${element.colourInferred ? ' (derived)' : ''}` : '',
          element.colour2 ? `second colour ${element.colour2}` : '',
          element.action ? `action ${element.action}` : '',
          element.section ? `section “${element.section}”` : '',
          `place ${placementOf(element, boardWidth)}`,
        ].filter(Boolean);
        lines.push(`${index + 1}. ${element.kind} — ${attrs.join(', ')}.`);
      });
      lines.push('');
    };

    if (!multi) {
      lines.push('ELEMENTS');
      writePage(allScreens[0]);
    } else {
      allScreens.forEach((page, index) => {
        lines.push(`ELEMENTS — Page ${index + 1}: ${page.screen.name}`);
        writePage(page);
      });
    }

    const audit = Array.from(
      new Set(allScreens.flatMap((page) => page.issues.map((issue) => issue.text)))
    );
    if (audit.length) {
      lines.push('AUDIT');
      audit.slice(0, 8).forEach((text) => lines.push(`- ${text}`));
      lines.push('');
    }

    lines.push('CONSTRAINTS');
    lines.push('- Responsive; single column below 768px. WCAG AA contrast, visible focus states.');
    lines.push('- Real copy, designed empty, loading and error states. Do not invent extra sections.');
    if (allScreens.some((page) => page.screen.meta.dark)) {
      lines.push('- Dark theme: dark surfaces with accessible light text.');
    }
    if (multi) lines.push(`- Build ${screens.length} screens as one flow; keep navigation labels consistent between pages.`);
    return lines.join('\n');
  }, [
    submitted, screens, allScreens, compiled.meta.tokens, viewport, boardWidth, boardHeight,
  ]);

  const suggestions = useMemo(() => {
    if (!submitted.trim()) return [];
    const found: string[] = [];
    const unlabelled = merged.filter(
      (element) => !element.label && (REQUIRED_ATTRS[element.kind] || []).includes('label')
    ).length;

    if (compiled.meta.usedLines === 0 && compiled.meta.specLines > 0) {
      found.push('This page has no screenshot-able components — describe UI elements, not a drawing.');
    }
    if (unlabelled > 0) {
      found.push(
        `${unlabelled} element${unlabelled === 1 ? '' : 's'} still need${unlabelled === 1 ? 's' : ''} real copy.`
      );
    }
    if (!compiled.meta.tokens.statedColour) {
      found.push('No primary colour stated — accents use the house violet. Name one for a real palette.');
    }
    if (!compiled.meta.tokens.responsive) {
      found.push('Responsive behaviour not stated — the board shows one breakpoint.');
    }
    if (issues.length > 0) {
      found.push(`${issues.length} design issue${issues.length === 1 ? '' : 's'}: ${issues[0].text}`);
    }
    if (!compiled.meta.structured && submitted.trim().split(/\s+/).length > 45) {
      found.push('Long prose — split the spec into sections so no line is skipped.');
    }
    if (screens.length > 1 && totalOpen > 0) {
      found.push(`${totalOpen} gap${totalOpen === 1 ? '' : 's'} remain across ${screens.length} pages.`);
    }
    return found.slice(0, 4);
  }, [submitted, merged, compiled.meta, issues, screens.length, totalOpen]);

  /**
   * Append a new screen block. The marker keeps the source readable and gives
   * the page a name; the user only has to write the components underneath.
   */
  const addScreen = () => {
    const separators = (text.match(/^-{3,}\s*$/gm) || []).length;
    const named = (text.match(/^(?:#{1,6}\s*)?(?:screen|page|view|step)\s*\d*/gim) || []).length;
    const hasContent = text.trim().length > 0;
    const existingPages = Math.max(separators, named) || (hasContent ? 1 : 0);
    const next = existingPages + 1;
    const prefix = hasContent ? `${text.trimEnd()}\n\n` : '';
    setText(`${prefix}---\nScreen ${next}: `);
    requestAnimationFrame(() => {
      const field = textareaRef.current;
      if (!field) return;
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    });
  };

  const analyse = () => {
    const next = compilePromptScreens(text);
    const baselines: Record<string, number> = {};
    next.forEach((screen) => {
      baselines[screen.id] = roughRisk(
        layoutElements(screen.elements, screen.archetype, 'desktop', screen.meta.tokens)
      );
    });
    setSubmitted(text);
    setAnswers({});
    setConfirmed({});
    setBaselineRisks(baselines);
    setRefinedById({});
    setDeep({ running: false, percent: 0, stage: '' });
    setActiveId(next[0]?.id ?? 'screen_1');
    setView('wireframe');
  };

  const answer = (id: string) => {
    if ((answers[id] || '').trim().length < 2) return;
    setConfirmed((previous) => ({ ...previous, [id]: true }));
  };

  const answerWith = (id: string, value: string) => {
    setAnswers((previous) => ({ ...previous, [id]: value }));
    setConfirmed((previous) => ({ ...previous, [id]: true }));
  };

  const runDeepPass = async () => {
    if (!submitted.trim() || deep.running) return;
    const screenId = compiled.id;
    const screenName = compiled.name;
    setDeep({ running: true, percent: 0, stage: `Starting the local model for ${screenName}` });
    try {
      const outcome = await refineWithBERT(compiled, (progress) =>
        setDeep({ running: true, percent: progress.percent, stage: progress.stage })
      );
      const span = `${outcome.lines} lines · ${Math.round(outcome.confidence * 100)}% span confidence · ${outcome.ms}ms`;

      if (outcome.rejected) {
        setRefinedById((previous) => ({ ...previous, [screenId]: undefined }));
        setDeep({
          running: false,
          percent: 100,
          rejected: true,
          stage: `Rejected on ${screenName} — the model would raise risk ${outcome.beforeRisk} → ${outcome.afterRisk}. Deterministic result kept. ${span}`,
        });
        return;
      }

      if (!outcome.applied.length) {
        setRefinedById((previous) => ({ ...previous, [screenId]: undefined }));
        setDeep({
          running: false,
          percent: 100,
          stage: `No grounded fixes found on ${screenName}. Deterministic result kept. ${span}`,
        });
        return;
      }

      setRefinedById((previous) => ({
        ...previous,
        [screenId]: {
          elements: outcome.elements,
          applied: outcome.applied,
          confidence: outcome.confidence,
          ms: outcome.ms,
        },
      }));
      setDeep({
        running: false,
        percent: 100,
        stage: `${outcome.applied.length} fix${outcome.applied.length === 1 ? '' : 'es'} on ${screenName} · ${span}`,
      });
    } catch (error) {
      setDeep({
        running: false,
        percent: 0,
        stage: '',
        error: error instanceof Error ? error.message : 'The local model is unavailable — the deterministic result is kept.',
      });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(revisedPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] space-y-4 v-fade-up">
      <header className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} className="v-icon-btn -ml-1" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[16px] font-bold text-[var(--v-ink)]">{projectName}</h1>
          <p className="text-[10.5px] text-[var(--v-faint)]">
            Prompt mode · deterministic engine · {screens.length > 1 ? `${screens.length} pages · ` : ''}optional local model
          </p>
        </div>
        <button type="button" onClick={onOpenCanvas} className="ml-auto v-btn v-btn-ghost h-8 px-3 text-[11px]">
          <Layers className="w-3 h-3" /> Switch to canvas
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ------------------------------------------------ prompt + engine */}
        <section className="rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Describe the screen</span>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={6}
              placeholder={'Login page with a blue button saying "Continue", email and password fields, and a logo at the top.'}
              className="mt-1.5 w-full resize-none rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
            />
          </label>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[9.5px] text-[var(--v-faint)]">
              Pages split on <code className="font-semibold">---</code> or{' '}
              <code className="font-semibold">Screen 2: Dashboard</code>. Name the screen, press Enter, then describe it.
            </span>
            <button
              type="button"
              onClick={addScreen}
              className="flex h-6 items-center gap-1 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-2 text-[9.5px] font-bold text-[var(--v-muted)] hover:border-[var(--v-violet)] hover:text-[var(--v-violet)]"
            >
              <Plus className="h-3 w-3" /> Add screen
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={analyse} className="v-btn v-btn-primary h-9 px-4 text-[11.5px]">
              <Sparkles className="w-3.5 h-3.5" /> Analyse prompt
            </button>
            {submitted && (
              <span className="text-[10.5px] text-[var(--v-muted)]">
                {screens.length > 1 ? `${screens.length} pages · ` : ''}
                {elements.length} elements · risk {risk} · {open.length} open · {confidence}% confidence
              </span>
            )}
          </div>

          {/* ------------------------------------------------ engine output */}
          {submitted && (
            <div className="mt-3 rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">
                  Analysis{screens.length > 1 ? ` · page ${pageIndex + 1} of ${screens.length}` : ''}
                </p>
                <span className="text-[9.5px] text-[var(--v-faint)]">
                  {compiled.name} · {compiled.archetype} · risk {risk}
                  {screens.length > 1 ? ` · overall ${overallRisk}` : ''}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full bg-[var(--v-surface)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--v-muted)]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: compiled.meta.tokens.primary }} />
                  {compiled.meta.tokens.primary}
                  {!compiled.meta.tokens.statedColour && ' (house)'}
                </span>
                <span className="rounded-full bg-[var(--v-surface)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--v-muted)]">
                  {compiled.meta.tokens.theme}
                </span>
                <span className="rounded-full bg-[var(--v-surface)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--v-muted)]">
                  {compiled.meta.tokens.density}
                </span>
                <span className="rounded-full bg-[var(--v-surface)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--v-muted)]">
                  radius {compiled.meta.tokens.radius}
                </span>
                <span className="rounded-full bg-[var(--v-surface)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--v-muted)]">
                  {compiled.meta.tokens.font}
                </span>
              </div>

              <ul className="mt-2 space-y-1">
                {compiled.meta.signals.map((signal) => (
                  <li key={signal.text} className="flex gap-1.5 text-[10px] leading-relaxed text-[var(--v-muted)]">
                    <span className={`mt-[5px] h-1 w-1 shrink-0 rounded-full ${TONE[signal.tone] || TONE.info}`} />
                    {signal.text}
                  </li>
                ))}
              </ul>

              {/* ------------------------------------------------ model pass */}
              <div className="mt-2.5 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={runDeepPass}
                    disabled={deep.running || elements.length === 0}
                    className="flex h-7 items-center gap-1.5 rounded-lg bg-[var(--v-ink)] px-2.5 text-[10px] font-bold text-[var(--v-surface)] disabled:opacity-50"
                  >
                    {deep.running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Cpu className="h-3 w-3" />}
                    {refined ? 'Re-run deep pass' : 'Deep pass (local BERT)'}
                  </button>
                  {refined && !deep.running && (
                    <button
                      type="button"
                      onClick={() => {
                        setRefinedById((previous) => ({ ...previous, [compiled.id]: undefined }));
                        setDeep({ running: false, percent: 0, stage: '' });
                      }}
                      className="flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-[var(--v-muted)] hover:text-[var(--v-ink)]"
                    >
                      <Undo2 className="h-3 w-3" /> Undo
                    </button>
                  )}
                  <span className="text-[9px] text-[var(--v-faint)]">
                    Runs on your machine and is cached after first use. A pass that raises risk is rejected.
                  </span>
                </div>

                {deep.running && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--v-line)]">
                      <div
                        className="h-full rounded-full bg-[var(--v-violet)] transition-all"
                        style={{ width: `${deep.percent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[9px] text-[var(--v-muted)]">{deep.stage}</p>
                  </div>
                )}

                {!deep.running && deep.stage && (
                  <p
                    className="mt-1 text-[9px]"
                    style={{ color: deep.rejected ? '#B45309' : 'var(--v-muted)' }}
                  >
                    {deep.stage}
                  </p>
                )}
                {!deep.running && refined && refined.applied.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {refined.applied.slice(0, 4).map((entry) => (
                      <li key={entry} className="text-[9px] text-[var(--v-muted)]">• {entry}</li>
                    ))}
                  </ul>
                )}
                {deep.error && (
                  <p className="mt-1 text-[9px] text-[#B94D42]">{deep.error}</p>
                )}
              </div>

              {/* ------------------------------------------------ components */}
              <p className="mt-2.5 text-[9px] font-bold uppercase tracking-wider text-[var(--v-faint)]">Components</p>
              <div className="mt-1 max-h-[200px] space-y-1 overflow-auto v-scroll pr-1">
                {elements.map((element) => {
                  const missing = missingAttrs(element);
                  return (
                    <div key={element.id} className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="rounded bg-[var(--v-surface)] px-1.5 py-0.5 font-bold uppercase tracking-wider text-[var(--v-muted)]">
                        {element.kind}
                      </span>
                      <span className="font-semibold text-[var(--v-ink)]">
                        {element.label ||
                          ((REQUIRED_ATTRS[element.kind] || []).includes('label') ? (
                            <span className="italic text-[var(--v-faint)]">needs copy</span>
                          ) : (
                            <span className="text-[var(--v-faint)]">—</span>
                          ))}
                      </span>
                      {element.section && (
                        <span className="text-[9px] text-[var(--v-faint)]">@{element.section}</span>
                      )}
                      {element.mentions && element.mentions > 1 && (
                        <span className="rounded-full bg-[var(--v-surface)] px-1 text-[9px] font-bold text-[var(--v-muted)]">
                          ×{element.mentions}
                        </span>
                      )}
                      {element.colour && (
                        <span
                          className="rounded px-1 py-0.5 text-[9px]"
                          style={{ background: `${element.colour}22`, color: element.colour }}
                        >
                          {element.colour}
                          {element.colourInferred ? ' ·' : ''}
                        </span>
                      )}
                      {element.colour2 && (
                        <span
                          className="rounded px-1 py-0.5 text-[9px]"
                          style={{ background: `${element.colour2}22`, color: element.colour2 }}
                        >
                          {element.colour2}
                        </span>
                      )}
                      {element.action && (
                        <span className="text-[9px] text-[var(--v-muted)]">→ {element.action}</span>
                      )}
                      <span className="text-[9px] text-[var(--v-faint)]">
                        {Math.round((element.confidence || 0) * 100)}%
                      </span>
                      {missing.length > 0 && (
                        <span className="text-[9px] font-semibold text-[#B94D42]">missing {missing.join(', ')}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {issues.length > 0 && (
                <div className="mt-2 rounded-lg bg-[var(--v-surface)] p-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#B94D42]">
                    Design audit · {issues.length}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {issues.slice(0, 4).map((issue) => (
                      <li key={issue.text} className="text-[9.5px] leading-relaxed text-[var(--v-muted)]">• {issue.text}</li>
                    ))}
                  </ul>
                </div>
              )}

              {elements.length === 0 ? (
                <p className="mt-2 text-[9.5px] leading-relaxed text-[var(--v-faint)]">
                  No components to score on this page. {compiled.meta.specLines} line
                  {compiled.meta.specLines === 1 ? '' : 's'} were read, but none described a UI component.
                </p>
              ) : (
                <p className="mt-2 text-[9.5px] leading-relaxed text-[var(--v-faint)]">
                  Risk {risk}: {missingCount} unresolved attribute{missingCount === 1 ? '' : 's'} of {requiredCount}{' '}
                  required, plus {issues.length} design issue{issues.length === 1 ? '' : 's'}. Dashed red boxes are the
                  same gaps. Geometry is a schematic default, not a measurement of your request.
                </p>
              )}
            </div>
          )}

          {/* -------------------------------------------- clarification list */}
          {submitted && open.length > 0 && (
            <div className="mt-3 rounded-xl border border-[var(--v-violet)]/40 bg-[var(--v-surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--v-ink)]">
                  <AlertCircle className="h-3.5 w-3.5 text-[var(--v-violet)]" />
                  {open.length} open question{open.length === 1 ? '' : 's'}
                  {screens.length > 1 ? ` on ${compiled.name}` : ''}
                </p>
                <span className="text-[9.5px] text-[var(--v-faint)]">
                  {totalOpen} across all pages · answer → re-runs
                </span>
              </div>

              <div className="mt-2 max-h-[300px] space-y-2.5 overflow-auto v-scroll pr-1">
                {open.map((question) => (
                  <div key={question.id}>
                    <label className="block text-[10.5px] text-[var(--v-muted)]">{question.text}</label>
                    {question.suggestion && (
                      <button
                        type="button"
                        onClick={() => answerWith(question.id, question.suggestion as string)}
                        className="mt-1 rounded-full border border-[var(--v-line)] bg-[var(--v-surface)] px-2 py-0.5 text-[9.5px] font-semibold text-[var(--v-violet)] hover:border-[var(--v-violet)]"
                      >
                        Use “{question.suggestion}”
                      </button>
                    )}
                    <div className="mt-1 flex gap-1.5">
                      <input
                        value={answers[question.id] || ''}
                        onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            answer(question.id);
                          }
                        }}
                        placeholder="Type your answer, then press Enter"
                        className="v-input h-8 flex-1 px-2.5 text-[11.5px]"
                      />
                      <button
                        type="button"
                        disabled={(answers[question.id] || '').trim().length < 2}
                        onClick={() => answer(question.id)}
                        className="h-8 rounded-lg bg-[var(--v-ink)] px-2.5 text-[10.5px] font-bold text-[var(--v-surface)] disabled:opacity-30"
                      >
                        Answer
                      </button>
                    </div>
                    <p className="mt-0.5 text-[9.5px] text-[var(--v-faint)]">
                      {HINTS[question.attribute] || HINTS.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --------------------------------------------------- re-analysis */}
          {submitted && (answeredCount > 0 || refined) && baselineRisk !== null && (
            <div className="mt-3 rounded-xl border border-[var(--v-teal)]/40 bg-[var(--v-surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--v-ink)]">
                  <Check className="h-3.5 w-3.5 text-[var(--v-teal)]" />
                  {answeredCount > 0
                    ? `Re-analysed after ${answeredCount} answer${answeredCount === 1 ? '' : 's'}${refined ? ' + model pass' : ''}`
                    : 'Re-analysed after the model pass'}
                  {screens.length > 1 ? ` · ${compiled.name}` : ''}
                </p>
                <span className="text-[9.5px] font-semibold text-[var(--v-teal)]">
                  risk {baselineRisk} → {risk}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-[var(--v-muted)]">
                {elements.length} element{elements.length === 1 ? '' : 's'} · {open.length} open ·{' '}
                {confidence}% confidence · {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}
              </p>
              {suggestions.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion} className="flex gap-1.5 text-[10px] leading-relaxed text-[var(--v-muted)]">
                      <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[var(--v-violet)]" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {submitted && ready && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--v-teal)]">
              <Check className="h-3.5 w-3.5" /> No gaps left — every page is complete.
            </p>
          )}

          {submitted && !ready && pageReady && totalOpen > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--v-teal)]">
              <Check className="h-3.5 w-3.5" /> {compiled.name} is complete — {totalOpen} gap
              {totalOpen === 1 ? '' : 's'} remain on other pages.
            </p>
          )}

          {submitted && unrecognised.length > 0 && (
            <p className="mt-3 flex gap-1.5 text-[10.5px] font-semibold leading-relaxed text-[#B45309]">
              <AlertCircle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
              {unrecognised.length === 1
                ? `“${unrecognised[0].screen.name}” has no recognised UI components — it reads like a drawing, not a screen spec.`
                : `${unrecognised.length} pages have no recognised UI components.`}
            </p>
          )}
        </section>

        {/* ------------------------------------------------ artifact preview */}
        <section className="rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-full bg-[var(--v-surface-2)] p-0.5">
              {(['wireframe', 'prompt'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`rounded-full px-2.5 py-1 text-[9.5px] font-bold capitalize ${
                    view === option ? 'bg-[var(--v-ink)] text-[var(--v-surface)]' : 'text-[var(--v-muted)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {view === 'wireframe' && (
              <div className="flex rounded-full bg-[var(--v-surface-2)] p-0.5">
                {(['desktop', 'mobile'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setViewport(option)}
                    className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize ${
                      viewport === option ? 'bg-[var(--v-ink)] text-[var(--v-surface)]' : 'text-[var(--v-muted)]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            <span className="text-[10px] text-[var(--v-faint)]">
              {submitted
                ? `${compiled.archetype} · ${elements.length} el · risk ${risk}${screens.length > 1 ? ` · overall ${overallRisk}` : ''}`
                : 'waiting for a prompt'}
            </span>
          </div>

          {screens.length > 1 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {screens.map((screen, index) => {
                const pageView = allScreens[index];
                const active = screen.id === compiled.id;
                return (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => setActiveId(screen.id)}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-semibold ${
                      active
                        ? 'bg-[var(--v-ink)] text-[var(--v-surface)]'
                        : 'bg-[var(--v-surface-2)] text-[var(--v-muted)] hover:text-[var(--v-ink)]'
                    }`}
                  >
                    <span className={active ? 'opacity-70' : 'opacity-60'}>{index + 1}</span>
                    {screen.name}
                    {pageView && pageView.open.length > 0 && (
                      <span className={`rounded-full px-1 text-[8px] ${active ? 'bg-white/20' : 'bg-[var(--v-surface)]'}`}>
                        {pageView.open.length}
                      </span>
                    )}
                    {pageView &&
                      pageView.screen.meta.usedLines === 0 &&
                      pageView.screen.meta.specLines > 0 && (
                        <span
                          className={`rounded-full px-1 text-[8px] font-bold ${
                            active ? 'bg-white/20' : 'bg-[#B45309]/10 text-[#B45309]'
                          }`}
                        >
                          !
                        </span>
                      )}
                  </button>
                );
              })}
            </div>
          )}

          {view === 'wireframe' ? (
            <>
              <div className="mt-2 rounded-xl bg-[var(--v-surface-2)] p-3">
                <WireframePreview
                  elements={elements}
                  dark={compiled.meta.dark}
                  width={boardWidth}
                  height={boardHeight}
                  empty={
                    submitted && compiled.meta.usedLines === 0 && compiled.meta.specLines > 0 ? (
                      <div className="px-4 text-center">
                        <p className={`text-[11px] font-bold ${compiled.meta.dark ? 'text-white' : 'text-[#0B0E14]'}`}>
                          No UI components on this page
                        </p>
                        <p className={`mt-1 text-[10px] leading-relaxed ${compiled.meta.dark ? 'text-white/70' : 'text-[#64626F]'}`}>
                          This reads like a drawing or visual instruction. Describe components — heading, card,
                          button — to draw a wireframe.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Layers className="mx-auto h-5 w-5 text-[#C3C1CE]" />
                        <p className="mt-2 text-[11px] font-bold text-[#0B0E14]">Nothing to preview</p>
                        <p className="mt-0.5 text-[10px] text-[#64626F]">
                          Write a prompt and press Analyse.
                        </p>
                      </div>
                    )
                  }
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-[var(--v-faint)]">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-3 rounded-[2px] border border-dashed border-[#E5484D]" />
                  unresolved attribute
                </span>
                <span>Schematic geometry · deterministic layout · no cloud call.</span>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">
                  Revised prompt{screens.length > 1 ? ` · ${screens.length} pages` : ''}
                </p>
                <button
                  type="button"
                  onClick={copy}
                  className="text-[10.5px] font-bold text-[var(--v-violet)] hover:underline"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="mt-1 h-[430px] overflow-auto v-scroll rounded-xl bg-[var(--v-surface-2)] p-2.5 font-mono text-[9.5px] leading-relaxed text-[var(--v-muted)]">
                {revisedPrompt || 'Analyse a prompt and the revised prompt appears here.'}
              </pre>
            </div>
          )}

          <button
            type="button"
            onClick={() => onGenerate(revisedPrompt)}
            disabled={!submitted}
            className="mt-2 v-btn v-btn-primary h-9 w-full text-[11.5px] disabled:opacity-40"
          >
            Generate {screens.length > 1 ? `${screens.length} screens` : 'with this prompt'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </div>
    </div>
  );
};
