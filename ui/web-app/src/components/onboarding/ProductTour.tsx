import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, LayoutDashboard, LayoutTemplate, Sparkles, Wallet, X } from 'lucide-react';

const DONE_KEY = 'vector_tour_done_v1';

interface Step {
  title: string;
  body: string;
  icon: React.ElementType;
  hint: string;
  /** CSS selector for the element this step spotlights. */
  anchor?: string;
  placement?: 'right' | 'bottom' | 'left';
}

const STEPS: Step[] = [
  {
    title: 'This is your workspace',
    body: 'Everything starts on Home: recent projects, templates, your free-project meter and the AI assistant.',
    icon: LayoutDashboard,
    hint: 'The Vector logo always brings you back here.',
    anchor: '[data-tour="nav-dashboard"]',
    placement: 'right',
  },
  {
    title: 'Projects hold everything',
    body: 'Each project keeps its brief, canvas, prompt versions and deployments together — with sharing and a trash you can restore from.',
    icon: Compass,
    hint: 'Open an existing project or create a blank one from here.',
    anchor: '[data-tour="nav-projects"]',
    placement: 'right',
  },
  {
    title: 'Templates open as a real design',
    body: 'Ten designed starters. Click one and the canvas opens already composed — nav, cards, charts, copy. Then you edit it.',
    icon: LayoutTemplate,
    hint: 'Every template shows a full element list before you commit.',
    anchor: '[data-tour="nav-templates"]',
    placement: 'right',
  },
  {
    title: 'Learn while you build',
    body: 'Short lessons and the 60-second walkthrough live here — no manual to read end to end.',
    icon: Sparkles,
    hint: 'You can replay this tour any time from Learn.',
    anchor: '[data-tour="nav-learn"]',
    placement: 'right',
  },
  {
    title: 'Two projects are on us',
    body: 'Your first two projects are free, no card. Plans start at ₹499/month and unlock all generators and one-click deploys.',
    icon: Wallet,
    hint: 'Nothing is charged until you choose a plan.',
    anchor: '[data-tour="nav-pricing"]',
    placement: 'right',
  },
];

interface ProductTourProps {
  open: boolean;
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const ProductTour: React.FC<ProductTourProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const current = STEPS[step];

  function finish() {
    try {
      localStorage.setItem(DONE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    setStep(0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Track the spotlighted element so the card can sit next to it.
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const selector = STEPS[step]?.anchor;
      if (!selector) {
        setRect(null);
        return;
      }
      const node = document.querySelector(selector);
      if (!node) {
        setRect(null);
        return;
      }
      const box = node.getBoundingClientRect();
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
    };
    measure();
    window.addEventListener('resize', measure);
    const interval = window.setInterval(measure, 400);
    return () => {
      window.removeEventListener('resize', measure);
      window.clearInterval(interval);
    };
  }, [open, step]);

  if (!open) return null;

  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  // Card geometry: beside the anchor when there is room, otherwise centred.
  const cardWidth = 380;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
  const canAnchor = !!rect && rect.width > 0 && viewportWidth > 1024;

  const cardStyle: React.CSSProperties = canAnchor
    ? {
        position: 'fixed',
        top: Math.min(Math.max(16, rect!.top - 8), viewportHeight - 340),
        left: Math.min(rect!.left + rect!.width + 18, viewportWidth - cardWidth - 16),
        width: cardWidth,
      }
    : {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(440px, calc(100vw - 32px))',
      };

  return (
    <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Spotlight: a ring around the target with a huge shadow to dim the rest. */}
      {canAnchor ? (
        <>
          <div
            className="pointer-events-none rounded-lg"
            style={{
              position: 'fixed',
              top: rect!.top - 6,
              left: rect!.left - 6,
              width: rect!.width + 12,
              height: rect!.height + 12,
              boxShadow: '0 0 0 2px #7C5CFF, 0 0 0 9999px rgba(6, 8, 12, .62)',
              transition: 'all .35s cubic-bezier(.16,1,.3,1)',
            }}
          />
          <div className="fixed inset-0" onClick={finish} aria-hidden="true" />
        </>
      ) : (
        <div className="fixed inset-0 bg-[#06080C]/60 backdrop-blur-[2px]" onClick={finish} aria-hidden="true" />
      )}

      <div
        style={cardStyle}
        className="z-10 bg-[var(--v-surface)] border border-[var(--v-line)] rounded-lg shadow-[0_40px_90px_-40px_rgba(0,0,0,.8)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-3.5">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === step
                    ? 'w-6 bg-[var(--v-violet)]'
                    : index < step
                      ? 'w-1.5 bg-[var(--v-teal)]'
                      : 'w-1.5 bg-[var(--v-line)]'
                }`}
              />
            ))}
          </div>
          <button type="button" onClick={finish} className="v-icon-btn w-6 h-6" aria-label="Close tour">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-4 pb-4 pt-3">
          <span className="w-10 h-10 rounded-xl bg-[var(--v-surface-2)] grid place-items-center">
            <Icon className="w-[18px] h-[18px] text-[var(--v-violet)]" />
          </span>
          <h2 id="tour-title" className="mt-3 text-[17px] font-semibold tracking-tight text-[var(--v-ink)]">
            {current.title}
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--v-muted)]">{current.body}</p>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--v-surface-2)] px-3 py-2">
            <Check className="w-3.5 h-3.5 mt-0.5 text-[var(--v-teal)] shrink-0" />
            <p className="text-[11px] text-[var(--v-muted)]">{current.hint}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--v-surface-2)] border-t border-[var(--v-line)]">
          <button type="button" onClick={finish} className="text-[11.5px] font-semibold text-[var(--v-muted)] hover:text-[var(--v-ink)]">
            Skip
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
              className="h-8 px-3 rounded-lg border border-[var(--v-line)] text-[11.5px] font-semibold text-[var(--v-ink)] disabled:opacity-40"
            >
              <ArrowLeft className="w-3 h-3 inline mr-1" /> Back
            </button>
            <button
              type="button"
              onClick={() => (last ? finish() : setStep((value) => value + 1))}
              className="h-8 px-3.5 rounded-lg text-[11.5px] font-semibold text-white inline-flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--v-accent)' }}
            >
              {last ? 'Start building' : 'Next'}
              {!last && <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <p className="sr-only">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
};

export function shouldShowTour(): boolean {
  try {
    return !localStorage.getItem(DONE_KEY);
  } catch {
    return false;
  }
}

export function resetTour(): void {
  try {
    localStorage.removeItem(DONE_KEY);
  } catch {
    // ignore
  }
}
