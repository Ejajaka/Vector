import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Sparkles, X } from 'lucide-react';

export type GuidePage = 'dashboard' | 'projects' | 'project' | 'editor' | 'prompt';

interface GuideStep {
  id: string;
  page: GuidePage;
  title: string;
  body: string;
  hint?: string;
  /** CSS selector for the control this step points at. */
  anchor?: string;
  placement?: 'right' | 'left' | 'top' | 'bottom';
  /** Advance when the highlighted control is clicked. */
  advanceOnClick?: boolean;
  /** Optional control to watch when the step points at a larger surface. */
  clickSelector?: string;
  /** Advance as soon as this selector exists (for example, after a wizard closes). */
  advanceOnSelector?: string;
  /** Do not dim the page for this step. */
  noDim?: boolean;
  /** Wait for the project setup wizard to close before advancing. */
  waitForSetup?: boolean;
  /** Keep the step active without drawing a card (used while a modal owns the screen). */
  hidden?: boolean;
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'start',
    page: 'dashboard',
    title: 'Let’s make your first project',
    body: 'A project keeps your brief, canvas, prompt versions and build target together. Every piece of work starts inside one.',
    hint: 'I’ll walk you through creating it, then show you what each tool does.',
    anchor: '[data-guide="dashboard-new-project"]',
    placement: 'bottom',
    advanceOnClick: true,
  },
  {
    id: 'projects-new',
    page: 'projects',
    title: 'Create the project',
    body: 'Click New project. Give it any name — you can change it later.',
    hint: 'The next screen asks three quick questions so your canvas starts with the right structure.',
    anchor: '[data-guide="projects-new"]',
    placement: 'bottom',
    advanceOnClick: true,
  },
  {
    id: 'create-form',
    page: 'projects',
    title: 'Name it, then create',
    body: 'Type a project name and press Create. The setup questions come next.',
    hint: 'A short name is fine. “Checkout redesign” works.',
    anchor: '[data-guide="create-modal"]',
    clickSelector: '[data-guide="create-submit"]',
    placement: 'right',
    advanceOnClick: true,
  },
  {
    id: 'setup',
    page: 'project',
    title: 'Shape the starting canvas',
    body: 'Pick what you are building and how you want to start. These answers suggest a matching template. Press Skip if you want a blank canvas.',
    hint: 'You can change all of this later — nothing here is permanent.',
    advanceOnSelector: '[data-guide="project-tools"]',
    waitForSetup: true,
    hidden: true,
  },
  {
    id: 'tools',
    page: 'project',
    title: 'Your project tools',
    body: 'Requirements captures what to build. Requirement graph shows how the pieces connect. Review & acceptance finds gaps and edge cases. Document prompt writes the final handoff.',
    hint: 'Canvas and Prompt mode sit just below — those are the two ways to make the interface.',
    anchor: '[data-guide="project-tools"]',
    placement: 'bottom',
  },
  {
    id: 'canvas',
    page: 'project',
    title: 'Canvas: place every element',
    body: 'Open Canvas to compose the screen yourself. Add buttons, cards, text, images and charts, then style every one of them.',
    hint: 'Click the Canvas card to open it.',
    anchor: '[data-guide="open-canvas"]',
    placement: 'right',
    advanceOnClick: true,
  },
  {
    id: 'canvas-assets',
    page: 'editor',
    title: 'This is the canvas',
    body: 'The Assets panel on the left holds every element. Click one to drop it on the page, or drag it exactly where you want it.',
    hint: 'Select anything on the page to change its colour, size, radius, font and behaviour on the right.',
    anchor: '[data-spot="editor-assets"]',
    placement: 'right',
  },
  {
    id: 'canvas-prompt',
    page: 'editor',
    title: 'The prompt writes itself',
    body: 'Every element, colour, size and position is described in this prompt. It updates as you work, ready to paste into a builder.',
    hint: 'You can copy it, download the prompt bundle, or send it straight to Base44.',
    anchor: '[data-spot="editor-prompt"]',
    placement: 'left',
  },
  {
    id: 'canvas-exit',
    page: 'editor',
    title: 'Back to the project',
    body: 'Use the back arrow to leave the canvas. Next we’ll try the other way: describe a screen and let Vector build it.',
    hint: 'Nothing is lost — the canvas is saved with the project.',
    anchor: '[data-guide="editor-exit"]',
    placement: 'bottom',
    advanceOnClick: true,
  },
  {
    id: 'prompt-mode',
    page: 'project',
    title: 'Prompt mode: describe it',
    body: 'Click Prompt mode. You type a sentence and Vector produces the interface: layout, elements, copy and a to-scale preview.',
    hint: 'This is the fastest path when you already know what the screen should say.',
    anchor: '[data-guide="open-prompt"]',
    placement: 'left',
    advanceOnClick: true,
  },
  {
    id: 'prompt-input',
    page: 'prompt',
    title: 'Type what you want',
    body: 'Describe the screen in plain English — for example, “Login page with email, password and a blue Continue button”. You can also press Speak and talk.',
    hint: 'Name a second screen with “---” or “Screen 2:” when you need more than one page.',
    anchor: '[data-guide="prompt-input"]',
    placement: 'right',
  },
  {
    id: 'prompt-generate',
    page: 'prompt',
    title: 'Generate the interface',
    body: 'Press Analyse prompt. Vector fills the page with elements and shows a to-scale wireframe on the right.',
    hint: 'No prompt engineering required — one clear sentence is enough.',
    anchor: '[data-guide="prompt-analyse"]',
    placement: 'bottom',
    advanceOnClick: true,
  },
  {
    id: 'prompt-output',
    page: 'prompt',
    title: 'Here is your interface',
    body: 'Everything here came from your sentence. Refine the prompt to change it, and switch to the canvas to fine-tune any element by hand.',
    hint: 'The same UI can become a canvas page with “Switch to canvas”.',
    anchor: '[data-guide="prompt-output"]',
    placement: 'left',
  },
  {
    id: 'prompt-exit',
    page: 'prompt',
    title: 'Back to the project',
    body: 'Return to the project when you are happy. The prompt is saved automatically.',
    hint: 'You can keep both a prompt-mode version and a canvas version.',
    anchor: '[data-guide="prompt-back"]',
    placement: 'bottom',
    advanceOnClick: true,
  },
  {
    id: 'prompt-sources',
    page: 'project',
    title: 'One prompt, two modes',
    body: 'Canvas and Prompt mode both produce a prompt. Pick whichever fits the moment: place elements yourself, or describe them. Both appear under Prompt versions and Document prompt.',
    hint: 'Document prompt combines the approved requirements, design system and prompt into one handoff.',
    anchor: '[data-guide="mode-cards"]',
    placement: 'bottom',
  },
  {
    id: 'base44',
    page: 'project',
    title: 'Build it in Base44',
    body: 'Copy the prompt, then sign in or sign up with your email and password inside the Base44 frame. Paste the prompt and build the real app.',
    hint: 'If the frame stays blank, use “Open in new tab” — it loads the same page.',
    anchor: '[data-guide="base44"]',
    placement: 'top',
  },
];

const CARD_WIDTH = 372;
const CARD_HEIGHT_ESTIMATE = 250;
const CARD_GAP = 18;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CardPosition {
  top: number;
  left: number;
  width: number;
  centred: boolean;
  placement: 'left' | 'right' | 'top' | 'bottom' | 'centre';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function placeCard(rect: Rect | null, preferred?: GuideStep['placement']): CardPosition {
  const vw = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const vh = typeof window === 'undefined' ? 900 : window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - 24);
  if (!rect) {
    return {
      top: Math.max(12, vh - CARD_HEIGHT_ESTIMATE - 28),
      left: vw / 2 - width / 2,
      width,
      centred: true,
      placement: 'centre',
    };
  }

  const options: Array<{ placement: NonNullable<GuideStep['placement']>; space: number }> = [
    { placement: 'right', space: vw - rect.left - rect.width },
    { placement: 'left', space: rect.left },
    { placement: 'bottom', space: vh - rect.top - rect.height },
    { placement: 'top', space: rect.top },
  ];
  const requiredX = width + CARD_GAP + 12;
  const requiredY = CARD_HEIGHT_ESTIMATE + CARD_GAP + 12;
  const preferredOption = options.find((option) => option.placement === preferred);
  const chosen =
    (preferredOption && preferredOption.space >= (preferred === 'top' || preferred === 'bottom' ? requiredY : requiredX)
      ? preferredOption
      : null) ||
    options.find((option) => option.space >= (option.placement === 'top' || option.placement === 'bottom' ? requiredY : requiredX)) ||
    options.sort((a, b) => b.space - a.space)[0];

  const centredX = clamp(rect.left + rect.width / 2 - width / 2, 12, vw - width - 12);
  const centredY = clamp(rect.top + rect.height / 2 - CARD_HEIGHT_ESTIMATE / 2, 12, vh - CARD_HEIGHT_ESTIMATE - 12);

  if (chosen.placement === 'right') {
    return {
      top: clamp(rect.top + rect.height / 2 - CARD_HEIGHT_ESTIMATE / 2, 12, vh - CARD_HEIGHT_ESTIMATE - 12),
      left: clamp(rect.left + rect.width + CARD_GAP, 12, vw - width - 12),
      width,
      centred: false,
      placement: 'right',
    };
  }
  if (chosen.placement === 'left') {
    return {
      top: clamp(rect.top + rect.height / 2 - CARD_HEIGHT_ESTIMATE / 2, 12, vh - CARD_HEIGHT_ESTIMATE - 12),
      left: clamp(rect.left - width - CARD_GAP, 12, vw - width - 12),
      width,
      centred: false,
      placement: 'left',
    };
  }
  if (chosen.placement === 'top') {
    return {
      top: clamp(rect.top - CARD_HEIGHT_ESTIMATE - CARD_GAP, 12, vh - CARD_HEIGHT_ESTIMATE - 12),
      left: centredX,
      width,
      centred: false,
      placement: 'top',
    };
  }
  return {
    top: clamp(rect.top + rect.height + CARD_GAP, 12, vh - CARD_HEIGHT_ESTIMATE - 12),
    left: centredX,
    width,
    centred: false,
    placement: 'bottom',
  };
}

interface GuidedTourProps {
  open: boolean;
  page: GuidePage;
  step: number;
  setupOpen?: boolean;
  onStep: (step: number) => void;
  onDone: () => void;
  onNavigate: (page: GuidePage) => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  open,
  page,
  step,
  setupOpen = false,
  onStep,
  onDone,
  onNavigate,
}) => {
  const current = GUIDE_STEPS[clamp(step, 0, GUIDE_STEPS.length - 1)];
  const [rect, setRect] = useState<Rect | null>(null);
  const nextRef = useRef<() => void>(() => undefined);

  const next = useCallback(() => {
    if (step >= GUIDE_STEPS.length - 1) {
      onDone();
      return;
    }
    onStep(step + 1);
  }, [onDone, onStep, step]);

  nextRef.current = next;

  useEffect(() => {
    if (!open) return;
    document.body.dataset.onboarding = 'open';
    return () => {
      delete document.body.dataset.onboarding;
    };
  }, [open]);

  // Track the highlighted element (the layout changes while pages animate).
  useEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    const selector = current.anchor;
    if (!selector) {
      setRect(null);
      return;
    }
    const measure = () => {
      const node = document.querySelector(selector);
      if (!node) {
        setRect(null);
        return;
      }
      const box = node.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) {
        setRect(null);
        return;
      }
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
    };
    measure();
    const interval = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, step, current.anchor]);

  // Bring an off-screen target into view before pointing at it.
  useEffect(() => {
    if (!open || !current.anchor) return;
    const timer = window.setTimeout(() => {
      const node = document.querySelector(current.anchor!);
      if (!node) return;
      const box = node.getBoundingClientRect();
      const offScreen =
        box.top < 56 ||
        box.bottom > window.innerHeight - 56 ||
        box.left < 0 ||
        box.right > window.innerWidth;
      if (offScreen) node.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [open, step, current.anchor]);

  // A click on the highlighted control continues the guide.
  useEffect(() => {
    if (!open || !current.advanceOnClick) return;
    const selector = current.clickSelector || current.anchor;
    if (!selector) return;
    const handler = (event: MouseEvent) => {
      const node = document.querySelector(selector);
      if (!node || !node.contains(event.target as Node)) return;
      window.setTimeout(() => nextRef.current(), 320);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [open, step, current.advanceOnClick, current.anchor, current.clickSelector]);

  // Some steps finish when the next UI appears (for example, a wizard closes).
  useEffect(() => {
    if (!open || !current.advanceOnSelector) return;
    if (current.waitForSetup && setupOpen) return;
    const timer = window.setInterval(() => {
      if (setupOpen) return;
      if (document.querySelector(current.advanceOnSelector!)) {
        window.clearInterval(timer);
        nextRef.current();
      }
    }, 350);
    return () => window.clearInterval(timer);
  }, [open, step, current.advanceOnSelector, current.waitForSetup, setupOpen]);

  // Keyboard control.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.key === 'Escape') onDone();
      if (event.key === 'ArrowRight') nextRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onDone]);

  if (!open) return null;
  if (current.hidden) return null;

  const last = step >= GUIDE_STEPS.length - 1;
  const card = placeCard(rect, current.placement);
  const onOtherPage = current.page !== page;

  const arrow = (() => {
    if (!rect || card.placement === 'centre') return null;
    const centreY = clamp(rect.top + rect.height / 2, rect.top + 18, rect.top + rect.height - 18);
    const centreX = clamp(rect.left + rect.width / 2, rect.left + 18, rect.left + rect.width - 18);
    if (card.placement === 'left') return { left: rect.left - 24, top: centreY, angle: 0 };
    if (card.placement === 'right') return { left: rect.left + rect.width + 24, top: centreY, angle: 180 };
    if (card.placement === 'top') return { left: centreX, top: rect.top - 24, angle: 90 };
    return { left: centreX, top: rect.top + rect.height + 24, angle: -90 };
  })();

  return (
    <div className="fixed inset-0 z-[120]" style={{ pointerEvents: 'none' }} aria-live="polite">
      {rect && !current.noDim ? (
        <div
          className="pointer-events-none fixed rounded-xl"
          style={{
            top: rect.top - 7,
            left: rect.left - 7,
            width: rect.width + 14,
            height: rect.height + 14,
            border: '2px solid #7C5CFF',
            boxShadow: '0 0 0 1px rgba(255,255,255,.18) inset, 0 0 0 9999px rgba(5, 7, 11, .62)',
            transition: 'all .3s cubic-bezier(.16,1,.3,1)',
          }}
        />
      ) : (
        !current.noDim && <div className="pointer-events-none fixed inset-0 bg-black/50" />
      )}

      {arrow && (
        <div
          className="pointer-events-none fixed"
          style={{
            left: arrow.left,
            top: arrow.top,
            zIndex: 2,
            transform: `translate(-50%, -50%) rotate(${arrow.angle}deg)`,
          }}
        >
          <span className="v-guide-arrow grid h-9 w-9 place-items-center rounded-full border border-[#B9A8FF]/50 bg-[#1B1730]/95 text-[#C9BCFF] shadow-[0_8px_26px_rgba(124,92,255,.55)]">
            <ArrowRight className="h-5 w-5" strokeWidth={2.6} />
          </span>
        </div>
      )}

      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="guided-tour-title"
        className="fixed overflow-y-auto overflow-x-hidden rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[0_44px_110px_-38px_rgba(0,0,0,.85)]"
        style={{
          top: card.top,
          left: card.left,
          width: card.width,
          maxHeight: 'calc(100vh - 24px)',
          zIndex: 1,
          pointerEvents: 'auto',
          transition: 'top .3s cubic-bezier(.16,1,.3,1), left .3s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <div className="flex items-center justify-between border-b border-[var(--v-line)] bg-[var(--v-surface-2)] px-3.5 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--v-muted)]">
            <Sparkles className="h-3 w-3 text-[var(--v-violet)]" />
            Guided setup · {step + 1}/{GUIDE_STEPS.length}
          </span>
          <button type="button" onClick={onDone} className="v-icon-btn h-6 w-6" aria-label="Close guide">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-0.5 w-full bg-[var(--v-line)]">
          <div
            className="h-full bg-[var(--v-violet)] transition-[width] duration-300"
            style={{ width: `${((step + 1) / GUIDE_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="px-4 pb-3.5 pt-3">
          <h2 id="guided-tour-title" className="text-[16px] font-semibold tracking-tight text-[var(--v-ink)]">
            {current.title}
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--v-muted)]">{current.body}</p>
          {current.hint && (
            <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-[var(--v-surface-2)] px-2.5 py-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--v-teal)]" />
              <p className="text-[10.5px] leading-relaxed text-[var(--v-muted)]">{current.hint}</p>
            </div>
          )}
          {current.advanceOnClick && !onOtherPage && (
            <p className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-semibold text-[var(--v-violet)]">
              <ChevronRight className="h-3 w-3" /> Click the highlighted control to continue
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--v-line)] bg-[var(--v-surface-2)] px-3.5 py-2.5">
          <button type="button" onClick={onDone} className="text-[10.5px] font-semibold text-[var(--v-muted)] hover:text-[var(--v-ink)]">
            Skip guide
          </button>
          <div className="flex items-center gap-1.5">
            {step > 0 && (
              <button
                type="button"
                onClick={() => onStep(step - 1)}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--v-line)] px-2 text-[10.5px] font-semibold text-[var(--v-ink)]"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
            )}
            {onOtherPage ? (
              <button
                type="button"
                onClick={() => onNavigate(current.page)}
                className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-[10.5px] font-semibold text-white"
                style={{ backgroundColor: 'var(--v-accent)' }}
              >
                Show me <ArrowRight className="h-3 w-3" />
              </button>
            ) : current.advanceOnClick ? (
              <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--v-violet)]/40 bg-[var(--v-violet)]/10 px-2.5 text-[10.5px] font-semibold text-[var(--v-violet)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--v-violet)]" />
                Waiting for your click
              </span>
            ) : (
              <button
                type="button"
                onClick={next}
                className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-[10.5px] font-semibold text-white"
                style={{ backgroundColor: 'var(--v-accent)' }}
              >
                {last ? 'Finish' : 'Next'} {!last && <ArrowRight className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
