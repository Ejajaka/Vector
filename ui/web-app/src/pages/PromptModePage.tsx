import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Copy, Layers, Sparkles } from 'lucide-react';
import {
  REQUIRED_ATTRS,
  compilePrompt,
  layoutElements,
  roughRisk,
  type CompiledElement,
} from '../services/promptCompiler.ts';
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
  const [baselineRisk, setBaselineRisk] = useState<number | null>(null);

  const compiled = useMemo(() => compilePrompt(submitted), [submitted]);

  // Only confirmed answers change the artifact, so risk cannot drop on a
  // keystroke and "no gaps left" only appears after a real answer.
  const elements: CompiledElement[] = useMemo(() => {
    const merged = compiled.elements.map((element) => {
      const patch: Partial<CompiledElement> = {};
      Object.entries(answers).forEach(([key, value]) => {
        const [id, attribute] = key.split(':');
        if (id === element.id && confirmed[key] && value.trim()) {
          (patch as Record<string, string>)[attribute] = value.trim();
        }
      });
      return { ...element, ...patch };
    });
    return layoutElements(merged, compiled.archetype);
  }, [compiled, answers, confirmed]);

  const open = compiled.questions.filter((question) => !confirmed[question.id]);
  const risk = roughRisk(elements);
  const ready = submitted.trim().length > 0 && open.length === 0;
  const answeredCount = Object.values(confirmed).filter(Boolean).length;

  const missingCount = elements.reduce((sum, element) => sum + missingAttrs(element).length, 0);
  const requiredCount = elements.reduce(
    (sum, element) => sum + (REQUIRED_ATTRS[element.kind]?.length || 0),
    0
  );

  const revisedPrompt = useMemo(() => {
    if (!submitted.trim()) return '';
    const lines: string[] = [
      'ROLE',
      'You are a senior product designer and front-end engineer.',
      '',
      'TASK',
      submitted.trim(),
      '',
      'SCREEN TYPE',
      compiled.archetype,
      '',
      'ELEMENTS',
    ];

    elements.forEach((element, index) => {
      const attrs = [
        element.label ? `label “${element.label}”` : 'label UNRESOLVED',
        element.count && element.count > 1 ? `×${element.count}` : '',
        element.colour ? `colour ${element.colour}` : '',
        element.action ? `action ${element.action}` : '',
        element.section ? `section “${element.section}”` : '',
        `${Math.round(element.w)}×${Math.round(element.h)} at ${Math.round(element.x)},${Math.round(element.y)}`,
      ].filter(Boolean);
      lines.push(`${index + 1}. ${element.kind} — ${attrs.join(', ')}.`);
    });

    lines.push('', 'CONSTRAINTS');
    lines.push('- Responsive; single column below 768px. WCAG AA contrast, visible focus states.');
    lines.push('- Real copy, designed empty, loading and error states. Do not invent extra sections.');
    if (compiled.meta.dark) lines.push('- Dark theme: dark surfaces with accessible light text.');
    return lines.join('\n');
  }, [submitted, elements, compiled.archetype, compiled.meta.dark]);

  const suggestions = useMemo(() => {
    if (!submitted.trim()) return [];
    const found: string[] = [];
    const unlabelled = elements.filter(
      (element) => !element.label && (REQUIRED_ATTRS[element.kind] || []).includes('label')
    ).length;

    if (unlabelled > 0) {
      found.push(
        `${unlabelled} element${unlabelled === 1 ? '' : 's'} still need${unlabelled === 1 ? 's' : ''} real copy.`
      );
    }
    if (!/#[0-9a-f]{6}\b|\b(red|blue|green|teal|violet|purple|orange|yellow|black|white|grey|gray|navy|emerald|rose|indigo|coral|amber)\b/i.test(submitted)) {
      found.push('No primary colour stated — the wireframe falls back to violet.');
    }
    if (!/\b(?:dark|light)\s+(?:mode|theme|background|ui)\b|background\s+(?:is\s+)?(?:dark|black|white|light)/i.test(submitted)) {
      found.push('Background theme not stated (light or dark).');
    }
    if (!compiled.meta.structured && submitted.trim().split(/\s+/).length > 45) {
      found.push('Long prose — split the spec into sections so no line is skipped.');
    }
    if (compiled.meta.merges.length > 0) {
      const merge = compiled.meta.merges[0];
      found.push(
        `“${merge.kind}” appeared ${merge.from}× and was merged to ${merge.to}. Check nothing important was dropped.`
      );
    }
    return found.slice(0, 4);
  }, [submitted, elements, compiled.meta]);

  const analyse = () => {
    const next = compilePrompt(text);
    setSubmitted(text);
    setAnswers({});
    setConfirmed({});
    setBaselineRisk(roughRisk(next.elements));
    setView('wireframe');
  };

  const answer = (id: string) => {
    if ((answers[id] || '').trim().length < 2) return;
    setConfirmed((previous) => ({ ...previous, [id]: true }));
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
            Prompt mode · describe the screen, answer the gaps, flip between wireframe and prompt
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
                {elements.length} elements · risk {risk} · {open.length} open
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

              <ul className="mt-1.5 space-y-1">
                {compiled.meta.notes.map((note) => (
                  <li key={note} className="flex gap-1.5 text-[10px] leading-relaxed text-[var(--v-muted)]">
                    <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[var(--v-violet)]" />
                    {note}
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-[var(--v-faint)]">Components</p>
              <div className="mt-1 max-h-[190px] space-y-1 overflow-auto v-scroll pr-1">
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
                      {element.count && element.count > 1 && (
                        <span className="rounded-full bg-[var(--v-surface)] px-1 text-[9px] font-bold text-[var(--v-muted)]">
                          ×{element.count}
                        </span>
                      )}
                      {element.colour && (
                        <span
                          className="rounded px-1 py-0.5 text-[9px]"
                          style={{ background: `${element.colour}22`, color: element.colour }}
                        >
                          {element.colour}
                        </span>
                      )}
                      {element.action && (
                        <span className="text-[9px] text-[var(--v-muted)]">→ {element.action}</span>
                      )}
                      {missing.length > 0 && (
                        <span className="text-[9px] font-semibold text-[#B94D42]">missing {missing.join(', ')}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-2 text-[9.5px] leading-relaxed text-[var(--v-faint)]">
                Risk {risk}: {missingCount} unresolved attribute{missingCount === 1 ? '' : 's'} of {requiredCount}{' '}
                required. Dashed red boxes in the wireframe are the same gaps.
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

              <div className="mt-2 max-h-[280px] space-y-2 overflow-auto v-scroll pr-1">
                {open.map((question) => (
                  <div key={question.id}>
                    <label className="block text-[10.5px] text-[var(--v-muted)]">{question.text}</label>
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
          {submitted && answeredCount > 0 && baselineRisk !== null && (
            <div className="mt-3 rounded-xl border border-[var(--v-teal)]/40 bg-[var(--v-surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--v-ink)]">
                  <Check className="h-3.5 w-3.5 text-[var(--v-teal)]" />
                  Re-analysed after {answeredCount} answer{answeredCount === 1 ? '' : 's'}
                </p>
                <span className="text-[9.5px] font-semibold text-[var(--v-teal)]">
                  risk {baselineRisk} → {risk}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-[var(--v-muted)]">
                {elements.length} element{elements.length === 1 ? '' : 's'} · {open.length} open ·{' '}
                {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}
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
          <div className="flex items-center justify-between gap-2">
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
                <span>Deterministic layout — no model involved.</span>
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
