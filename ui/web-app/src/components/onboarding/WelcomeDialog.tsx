import React from 'react';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import type { PlanCode } from '../../services/entitlements.ts';
import { PLANS } from '../../services/entitlements.ts';

interface WelcomeDialogProps {
  open: boolean;
  name?: string;
  onClose: () => void;
  onOpenPlans: () => void;
  onChoosePlan: (plan: PlanCode) => void;
}

const HIGHLIGHTS = [
  'Turn a rough brief into traceable requirements',
  'Review every inferred behaviour before you build',
  'Carry one complete prompt into your generator',
];

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  open,
  name,
  onClose,
  onOpenPlans,
  onChoosePlan,
}) => {
  if (!open) return null;

  const plans = PLANS;

  return (
    <div className="fixed inset-0 z-[98] grid place-items-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="Welcome to Vector">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-[800px] overflow-hidden rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[0_50px_140px_-40px_rgba(0,0,0,.9)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--v-line)] px-6 py-5">
          <div>
            <p className="v-eyebrow">Welcome</p>
            <h2 className="v-display mt-1 text-[26px] text-[var(--v-ink)]">
              Welcome to Vector{name ? `, ${name}` : ''}.
            </h2>
            <p className="mt-1 max-w-[540px] text-[12.5px] leading-relaxed text-[var(--v-muted)]">
              The requirement-to-interface workspace. Start with a rough sentence, review what the
              engine inferred, and leave with one complete prompt.
            </p>
          </div>
          <button type="button" onClick={onClose} className="v-icon-btn h-7 w-7" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-5 sm:grid-cols-[1.15fr_1fr]">
          <ul className="space-y-2.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-[var(--v-ink-2)]">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--v-accent-soft)] text-[var(--v-accent-hover)]">
                  <Check className="h-2.5 w-2.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3.5">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-[var(--v-faint)]">Included on every plan</p>
            <div className="mt-2 space-y-1.5 text-[11.5px] text-[var(--v-muted)]">
              <p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[var(--v-accent-hover)]" /> Requirement review and evidence</p>
              <p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[var(--v-accent-hover)]" /> Prompt studio and versions</p>
              <p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[var(--v-accent-hover)]" /> Design systems and history</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--v-line)] px-6 py-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[12.5px] font-semibold text-[var(--v-ink)]">Pick a plan when you are ready</p>
              <p className="mt-0.5 text-[11.5px] text-[var(--v-muted)]">Free includes two full projects. Upgrade any time.</p>
            </div>
            <button type="button" onClick={onOpenPlans} className="hidden items-center gap-1 text-[11.5px] font-medium text-[var(--v-muted)] hover:text-[var(--v-ink)] sm:inline-flex">
              See full plans <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {plans.map((plan) => {
              const featured = plan.code === 'pro';
              return (
                <div
                  key={plan.code}
                  className={`rounded-lg border p-3 ${featured ? 'border-[var(--v-accent)]/40 bg-[var(--v-accent-soft)]' : 'border-[var(--v-line)] bg-[var(--v-surface-2)]'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-[var(--v-faint)]">{plan.name}</span>
                    {featured && <span className="rounded bg-[var(--v-accent)] px-1.5 py-0.5 text-[9px] font-semibold text-white">Popular</span>}
                  </div>
                  <p className="mt-1.5 text-[20px] font-semibold tracking-[-0.03em] text-[var(--v-ink)]">
                    ₹{plan.monthlyInr.toLocaleString('en-IN')}
                    <span className="text-[10.5px] font-normal text-[var(--v-faint)]"> / month</span>
                  </p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-[var(--v-muted)]">{plan.tagline}</p>
                  <button
                    type="button"
                    onClick={() => (plan.code === 'free' ? onClose() : onChoosePlan(plan.code))}
                    className={`mt-3 h-7 w-full rounded-md text-[11px] font-medium ${featured ? 'v-btn v-btn-primary' : 'v-btn'}`}
                  >
                    {plan.code === 'free' ? 'Continue free' : `Choose ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
