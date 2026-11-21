import React, { useState } from 'react';
import { Check, Crown, Sparkles, X } from 'lucide-react';
import { PLANS, isPaid, readEntitlements } from '../../services/entitlements.ts';

interface PricingDialogProps {
  open: boolean;
  onClose: () => void;
  onLearnMore: () => void;
}

/**
 * The quick plan chooser used by Upgrade / See plans actions. Choosing a plan
 * opens the detailed Plans and pricing page, which owns checkout and GST
 * details; this dialog stays a fast comparison.
 */
export const PricingDialog: React.FC<PricingDialogProps> = ({ open, onClose, onLearnMore }) => {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  if (!open) return null;

  const state = readEntitlements();
  const paid = isPaid(state);

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Plans and pricing">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="v-scroll relative max-h-[90vh] w-full max-w-[1000px] overflow-y-auto rounded-lg border border-white/10 bg-[#242424] p-4 text-white shadow-[0_40px_100px_-30px_rgba(0,0,0,.95)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B9A8FF]">
              {paid ? `${PLANS.find((plan) => plan.code === state.plan)?.name || 'Current'} plan` : 'Starter hub'}
            </p>
            <h2 className="mt-1 text-[20px] font-semibold sm:text-[24px]">Which plan would you like?</h2>
            <p className="mt-1 text-[11.5px] text-white/45">
              Compare the plans here, then continue to the detailed page for checkout and seat selection.
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/50 hover:bg-white/10" aria-label="Close pricing">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 inline-flex items-center rounded-full bg-white/8 p-1">
          {(['monthly', 'annual'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBilling(option)}
              className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold capitalize ${
                billing === option ? 'bg-[#e8e8ea] text-[#08090a]' : 'text-white/60'
              }`}
            >
              {option}
              {option === 'annual' && <span className="ml-1 text-[9px] font-semibold text-[#6ea8fe]">save 17%</span>}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2.5 md:grid-cols-2">
          {PLANS.map((plan) => {
            const price = billing === 'annual' ? plan.annualInr : plan.monthlyInr;
            const perMonth = plan.code === 'free' ? 0 : billing === 'annual' ? Math.round(plan.annualInr / 12) : plan.monthlyInr;
            const current = plan.code === state.plan;
            const popular = plan.code === 'pro';

            return (
              <div
                key={plan.code}
                className={`flex flex-col rounded-xl border p-3.5 ${
                  popular ? 'border-[#7C5CFF]/70 bg-[#2D2940]' : 'border-white/10 bg-[#2B2B2B]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold">{plan.name}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-white/40">{plan.tagline}</p>
                  </div>
                  {popular && (
                    <span className="shrink-0 rounded-full bg-[#7C5CFF]/20 px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-[#B9A8FF]">
                      Popular
                    </span>
                  )}
                </div>

                <p className="mt-3 text-[22px] font-semibold leading-none">
                  {plan.code === 'free' ? 'Free' : `₹${perMonth.toLocaleString('en-IN')}`}
                  {plan.code !== 'free' && <span className="ml-1 text-[10px] font-medium text-white/40">/mo</span>}
                </p>
                <p className="mt-1 text-[9.5px] text-white/35">
                  {plan.code === 'free'
                    ? 'No card required'
                    : billing === 'annual'
                      ? `₹${price.toLocaleString('en-IN')} billed yearly`
                      : 'billed monthly'}
                </p>

                <ul className="mt-3 flex-1 space-y-1.5">
                  {plan.highlights.slice(0, 4).map((highlight) => (
                    <li key={highlight} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-white/65">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#6ea8fe]" />
                      {highlight}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={onLearnMore}
                  disabled={current}
                  className={`mt-3 h-8 w-full rounded-md text-[10.5px] font-semibold ${
                    current
                      ? 'cursor-default bg-white/8 text-white/40'
                      : popular
                        ? 'bg-[#e8e8ea] text-[#08090a] hover:bg-white'
                        : 'border border-white/20 text-white/85 hover:bg-white/10'
                  }`}
                >
                  {current ? 'Current plan' : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <p className="flex items-center gap-1.5 text-[10px] text-white/35">
            <Sparkles className="h-3 w-3 text-[#B9A8FF]" />
            {paid ? 'Change or cancel any time.' : 'Two full projects stay free. Nothing is charged until you choose a plan.'}
          </p>
          <button
            type="button"
            onClick={onLearnMore}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/20 px-3 text-[11px] font-semibold text-white/85 hover:bg-white/10"
          >
            <Crown className="h-3 w-3 text-[#FFC53D]" /> Learn more and compare every feature
          </button>
        </div>
      </div>
    </div>
  );
};
