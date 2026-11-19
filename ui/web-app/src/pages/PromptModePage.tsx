import React, { useMemo, useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, Check, Copy, Cpu, Layers, Loader2, Sparkles, Undo2,
} from 'lucide-react';
import {
  REQUIRED_ATTRS,
  auditElements,
  auditQuality,
  compilePrompt,
  layoutElements,
  roughRisk,
  type CompiledElement,
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

export const PromptModePage: React.FC<Props> = ({ projectName, onBack, onOpenCanvas, onGenerate }) => {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'wireframe' | 'prompt'>('wireframe');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [baselineRisk, setBaselineRisk] = useState<number | null>(null);
  const [refined, setRefined] = useState<{
    elements: CompiledElement[];
    applied: string[];
    confidence: number;
    ms: number;
  } | null>(null);
  const [deep, setDeep] = useState<{
    running: boolean;
    percent: number;
    stage: string;
    error?: string;
  }>({ running: false, percent: 0, stage: '' });

  const compiled = useMemo(() => compilePrompt(submitted), [submitted]);
  const baseElements = refined?.elements ?? compiled.elements;

  // Only confirmed answers change the artifact, so risk cannot drop on a
  // keystroke and "no gaps left" only appears after a real answer.
  const merged: CompiledElement[] = useMemo(
    () =>
      baseElements.map((element) => {
        const patch: Partial<CompiledElement> = {};
        Object.entries(answers).forEach(([key, value]) => {
          const [id, attribute] = key.split(':');
          if (id === element.id && confirmed[key] && value.trim()) {
            (patch as Record<string, string>)[attribute] = value.trim();
          }
        });
        return Object.keys(patch).length ? { ...element, ...patch } : element;
      }),
    [baseElements, answers, confirmed]
  );

  const open = useMemo(() => auditElements(merged), [merged]);
  const elements = useMemo(
    () => layoutElements(merged, compiled.archetype, viewport, compiled.meta.tokens),
    [merged, compiled.archetype, compiled.meta.tokens, viewport]
  );
  const issues = useMemo(() => auditQuality(elements), [elements]);
  const risk = roughRisk(elements);
  const ready = submitted.trim().length > 0 && open.length === 0;
  const answeredCount = Object.values(confirmed).filter(Boolean).length;

  const missingCount = elements.reduce((sum, element) => sum + missingAttrs(element).length, 0);
  const requiredCount = elements.reduce(
    (sum, element) => sum + (REQUIRED_ATTRS[element.kind]?.length || 0),
    0
  );
  const confidence = elements.length
    ? Math.round(
        (elements.reduce((sum, element) => sum + (element.confidence || 0), 0) / elements.length) * 100
      )
    : 0;

  const revisedPrompt = useMemo(() => {
    if (!submitted.trim()) return '';
    const tokens = compiled.meta.tokens;
    const lines: string[] = [
      'ROLE',
      'You are a senior product designer and front-end engineer.',
      '',
      'TASK',
      submitted.trim(),
      '',
      'SCREEN TYPE',
      `${compiled.archetype} · ${viewport}`,
      '',
      'DESIGN TOKENS',
      `primary ${tokens.primary}${tokens.statedColour ? '' : ' (house default)'}`,
      `theme ${tokens.theme}`,
      `density ${tokens.density}`,
      `radius ${tokens.radius}px`,
      `typeface ${tokens.font}`,
      '',
      'ELEMENTS',
    ];

    elements.forEach((element, index) => {
      const attrs = [
        element.label ? `label “${element.label}”` : 'label UNRESOLVED',
        element.count && element.count > 1 ? `×${element.count}` : '',
        element.colour ? `colour ${element.colour}${element.colourInferred ? ' (derived)' : ''}` : '',
        element.action ? `action ${element.action}` : '',
        element.section ? `section “${element.section}”` : '',
        `${Math.round(element.w)}×${Math.round(element.h)} at ${Math.round(element.x)},${Math.round(element.y)}`,
      ].filter(Boolean);
      lines.push(`${index + 1}. ${element.kind} — ${attrs.join(', ')}.`);
    });

    if (issues.length) {
      lines.push('', 'AUDIT');
      issues.slice(0, 6).forEach((issue) => lines.push(`- ${issue.text}`));
    }

    lines.push('', 'CONSTRAINTS');
    lines.push('- Responsive; single column below 768px. WCAG AA contrast, visible focus states.');
    lines.push('- Real copy, designed empty, loading and error states. Do not invent extra sections.');
    if (compiled.meta.dark) lines.push('- Dark theme: dark surfaces with accessible light text.');
    return lines.join('\n');
  }, [submitted, elements, compiled.archetype, compiled.meta, viewport, issues]);

  const suggestions = useMemo(() => {
    if (!submitted.trim()) return [];
    const found: string[] = [];
    const unlabelled = merged.filter(
      (element) => !element.label && (REQUIRED_ATTRS[element.kind] || []).includes('label')
    ).length;

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
    return found.slice(0, 4);
  }, [submitted, merged, compiled.meta, issues]);

  const analyse = () => {
    const next = compilePrompt(text);
    const layout = layoutElements(next.elements, next.archetype, 'desktop', next.meta.tokens);
    setSubmitted(text);
    setAnswers({});
    setConfirmed({});
    setBaselineRisk(roughRisk(layout));
    setRefined(null);
    setDeep({ running: false, percent: 0, stage: '' });
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
    setDeep({ running: true, percent: 0, stage: 'Starting the local model' });
    try {
      const outcome = await refineWithBERT(compiled, (progress) =>
        setDeep({ running: true, percent: progress.percent, stage: progress.stage })
      );
      setRefined({
        elements: outcome.elements,
        applied: outcome.applied,
        confidence: outcome.confidence,
        ms: outcome.ms,
      });
      setDeep({
        running: false,
        percent: 100,
        stage: `${outcome.lines} lines · ${outcome.applied.length} fix${outcome.applied.length === 1 ? '' : 'es'} · ${Math.round(outcome.confidence * 100)}% span confidence · ${outcome.ms}ms`,
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

  const boardWidth = viewport === 'mobile' ? 390 : 1200;
  const boardHeight = viewport === 'mobile' ? 844 : 800;

  return (
    <div className="mx-auto max-w-[1240px] space-y-4 v-fade-up">
      <header className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} className="v-icon-btn -ml-1" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[16px] font-bold text-[var(--v-ink)]">{projectName}</h1>
          <p className="text-[10.5px] text-[var(--v-faint)]">
            Prompt mode · deterministic engine · optional local model pass
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
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={6}
              placeholder={'Login page with a blue button saying "Continue", email and password fields, and a logo at the top.'}
              className="mt-1.5 w-full resize-none rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
            />
          </label>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={analyse} className="v-btn v-btn-primary h-9 px-4 text-[11.5px]">
              <Sparkles className="w-3.5 h-3.5" /> Analyse prompt
            </button>
            {submitted && (
              <span className="text-[10.5px] text-[var(--v-muted)]">
                {elements.length} elements · risk {risk} · {open.length} open · {confidence}% confidence
              </span>
            )}
          </div>

          {/* ------------------------------------------------ engine output */}
          {submitted && (
            <div className="mt-3 rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Analysis</p>
                <span className="text-[9.5px] text-[var(--v-faint)]">
                  {compiled.archetype} · {elements.length} el · risk {risk}
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
                    disabled={deep.running}
                    className="flex h-7 items-center gap-1.5 rounded-lg bg-[var(--v-ink)] px-2.5 text-[10px] font-bold text-[var(--v-surface)] disabled:opacity-50"
                  >
                    {deep.running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Cpu className="h-3 w-3" />}
                    {refined ? 'Re-run deep pass' : 'Deep pass (local BERT)'}
                  </button>
                  {refined && !deep.running && (
                    <button
                      type="button"
                      onClick={() => {
                        setRefined(null);
                        setDeep({ running: false, percent: 0, stage: '' });
                      }}
                      className="flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-[var(--v-muted)] hover:text-[var(--v-ink)]"
                    >
                      <Undo2 className="h-3 w-3" /> Undo
                    </button>
                  )}
                  <span className="text-[9px] text-[var(--v-faint)]">
                    Optional. Fills only unresolved attributes, never invents components.
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
                  <p className="mt-1 text-[9px] text-[var(--v-muted)]">
                    {refined ? `Model pass: ${deep.stage}` : deep.stage}
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
                        {element.label || <span className="italic text-[var(--v-faint)]">needs copy</span>}
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

              <p className="mt-2 text-[9.5px] leading-relaxed text-[var(--v-faint)]">
                Risk {risk}: {missingCount} unresolved attribute{missingCount === 1 ? '' : 's'} of {requiredCount}{' '}
                required, plus {issues.length} design issue{issues.length === 1 ? '' : 's'}. Dashed red boxes are the
                same gaps.
              </p>
            </div>
          )}

          {/* -------------------------------------------- clarification list */}
          {submitted && open.length > 0 && (
            <div className="mt-3 rounded-xl border border-[var(--v-violet)]/40 bg-[var(--v-surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--v-ink)]">
                  <AlertCircle className="h-3.5 w-3.5 text-[var(--v-violet)]" />
                  {open.length} open question{open.length === 1 ? '' : 's'}
                </p>
                <span className="text-[9.5px] text-[var(--v-faint)]">answer → engine re-runs</span>
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
                  Re-analysed after {answeredCount} answer{answeredCount === 1 ? '' : 's'}
                  {refined ? ' + model pass' : ''}
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
              <Check className="h-3.5 w-3.5" /> No gaps left — every required attribute is answered.
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
                ? `${compiled.archetype} · ${elements.length} el · risk ${risk}`
                : 'waiting for a prompt'}
            </span>
          </div>

          {view === 'wireframe' ? (
            <>
              <div className="mt-2 rounded-xl bg-[var(--v-surface-2)] p-3">
                <WireframePreview
                  elements={elements}
                  dark={compiled.meta.dark}
                  width={boardWidth}
                  height={boardHeight}
                  empty={
                    <div className="text-center">
                      <Layers className="mx-auto h-5 w-5 text-[#C3C1CE]" />
                      <p className="mt-2 text-[11px] font-bold text-[#0B0E14]">Nothing to preview</p>
                      <p className="mt-0.5 text-[10px] text-[#64626F]">
                        Write a prompt and press Analyse.
                      </p>
                    </div>
                  }
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-[var(--v-faint)]">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-3 rounded-[2px] border border-dashed border-[#E5484D]" />
                  unresolved attribute
                </span>
                <span>Deterministic layout · optional local model · no cloud call.</span>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Revised prompt</p>
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
            Generate with this prompt <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </div>
    </div>
  );
};
