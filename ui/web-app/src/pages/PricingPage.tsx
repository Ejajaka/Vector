import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Check, Crown, Minus, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react';
import {
  PLANS,
  TRIAL_PROJECTS,
  isPaid,
  planFor,
  readEntitlements,
  trialRemaining,
  upgradePlan,
  type EntitlementState,
  type PlanCode,
} from '../services/entitlements.ts';
import { getRazorpayKey, setRazorpayKey, startCheckout } from '../services/razorpay.ts';
import { notificationService } from '../services/notifications.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface PricingPageProps {
  onNavigate: (tab: 'dashboard' | 'projects' | 'settings' | 'integrations') => void;
}

const ROWS: Array<{ label: string; values: [string, string, string, string] }> = [
  { label: 'Projects', values: ['2 total', 'Unlimited', 'Unlimited', 'Unlimited'] },
  { label: 'Templates', values: ['3', 'All 10+', 'All + shared', 'All + shared'] },
  { label: 'Block palette composer', values: ['—', '✓', '✓', '✓'] },
  { label: 'AI explanations', values: ['—', 'BYO key', 'BYO key', 'Managed'] },
  { label: 'Integrations', values: ['—', '2', 'All', 'All'] },
  { label: 'Custom element schema', values: ['—', '—', '✓', '✓'] },
  { label: 'CI gates & audit log', values: ['—', '—', '✓', '✓'] },
  { label: 'One-click deploy', values: ['—', 'Figma export', 'Vercel / Netlify', 'Vercel / Netlify'] },
  { label: 'Seats', values: ['1', '1', '10', '25'] },
  { label: 'Support', values: ['Community', 'Email', 'Priority', 'Dedicated'] },
];

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [state, setState] = useState<EntitlementState>(readEntitlements());
  const [selected, setSelected] = useState<PlanCode>('pro');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [keyDraft, setKeyDraft] = useState(getRazorpayKey());
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const sync = () => setState(readEntitlements());
    window.addEventListener('vector:entitlements', sync);
    return () => window.removeEventListener('vector:entitlements', sync);
  }, []);

  const paid = isPaid(state);
  const remaining = trialRemaining(state);
  const plan = planFor(selected);
  const price = billing === 'annual' ? plan.annualInr : plan.monthlyInr;
  const perMonth = plan.code === 'free' ? 0 : billing === 'annual' ? Math.round(plan.annualInr / 12) : plan.monthlyInr;

  const buy = async () => {
    if (selected === 'free' || plan.monthlyInr === 0) {
      onNavigate('dashboard');
      return;
    }
    setBusy(true);
    setFlash(null);
    await startCheckout({
      planName: `${plan.name} · ${billing}`,
      amountInr: price,
      email: user?.email || undefined,
      name: (user?.user_metadata?.display_name as string | undefined) || undefined,
      onSuccess: (paymentId) => {
        upgradePlan(selected, paymentId);
        notificationService.push({
          kind: 'billing',
          title: `${plan.name} plan activated`,
          body: `Payment ${paymentId.slice(0, 14)}… confirmed. Unlimited projects and integrations are unlocked.`,
          action: { label: 'Go home', tab: 'dashboard' },
        });
        setFlash({ tone: 'ok', text: `${plan.name} is active. Receipt saved to purchase history.` });
        setBusy(false);
      },
      onDismiss: () => setBusy(false),
      onError: (message) => {
        setFlash({ tone: 'err', text: message });
        setBusy(false);
      },
    });
  };

  return (
    <div className="space-y-6 v-fade-up">
      <section className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--v-surface-2)] text-[var(--v-violet)] text-[10.5px] font-bold uppercase tracking-[0.12em]">
          <Sparkles className="w-3 h-3" /> {paid ? `${planFor(state.plan).name} plan` : `${remaining} of ${TRIAL_PROJECTS} free projects left`}
        </span>
        <h1 className="v-display text-[32px] sm:text-[42px] mt-3 text-[var(--v-ink)]">
          Plans that grow with the <span className="v-gradient-text">work</span>
        </h1>
        <p className="mt-2 text-[13px] text-[var(--v-muted)]">
          {paid
            ? 'Change plan any time. Upgrades apply immediately, downgrades at the end of the period.'
            : 'Two full projects are free. Nothing is charged until you choose a plan.'}
        </p>
      </section>

      {flash && (
        <div
          className={`max-w-3xl mx-auto rounded-2xl border px-4 py-3 text-[12.5px] flex items-start gap-2 ${
            flash.tone === 'ok'
              ? 'bg-[#F0FBF7] border-[#BFE9DA] text-[#0C7A5B]'
              : 'bg-[#FDF2F0] border-[#F0C4BF] text-[#B94D42]'
          }`}
        >
          {flash.tone === 'ok' ? <BadgeCheck className="w-4 h-4 mt-0.5 shrink-0" /> : <X className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{flash.text}</span>
        </div>
      )}

      <section className="v-card rounded-[28px] overflow-hidden">
        <div className="grid lg:grid-cols-[380px_1fr]">
          {/* Chooser */}
          <div className="p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-[var(--v-line)]">
            <div className="inline-flex items-center rounded-full bg-[var(--v-surface-2)] p-1">
              {(['monthly', 'annual'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBilling(option)}
                  className={`px-3.5 py-1.5 rounded-full text-[11.5px] font-bold capitalize transition-colors ${
                    billing === option ? 'bg-[var(--v-surface)] text-[var(--v-ink)] shadow-[var(--v-shadow-sm)]' : 'text-[var(--v-muted)]'
                  }`}
                >
                  {option}
                </button>
              ))}
              <span className="ml-1 mr-2 text-[10px] font-bold text-[var(--v-teal)]">−17%</span>
            </div>

            <p className="mt-5 v-eyebrow">Choose your plan</p>

            <div className="mt-2.5 space-y-2">
              {PLANS.map((option) => {
                const isSelected = selected === option.code;
                const isCurrent = state.plan === option.code;
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setSelected(option.code)}
                    className={`w-full text-left rounded-2xl border p-3.5 transition-all ${
                      isSelected
                        ? 'border-[var(--v-violet)] bg-[var(--v-surface)] shadow-[0_0_0_3px_rgba(139,92,246,.14)]'
                        : 'border-[var(--v-line)] hover:border-[var(--v-faint)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 ${
                          isSelected ? 'border-[var(--v-violet)]' : 'border-[var(--v-line)]'
                        }`}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[var(--v-violet)]" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-[var(--v-ink)]">{option.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F0FBF7] text-[#0C7A5B]">
                              Current
                            </span>
                          )}
                          {option.code === 'pro' && !isCurrent && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--v-surface-2)] text-[var(--v-violet)]">
                              Popular
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] text-[var(--v-muted)]">{option.tagline}</span>
                        <span className="mt-1 block text-[12px] font-bold text-[var(--v-ink)]">
                          ₹{(billing === 'annual' ? option.annualInr : option.monthlyInr).toLocaleString('en-IN')}
                          <span className="text-[10px] font-medium text-[var(--v-faint)]">
                            {option.code === 'free' ? ' forever' : billing === 'annual' ? ' / year' : ' / month'}
                          </span>
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void buy()}
              disabled={busy}
              className="mt-4 w-full v-btn v-btn-primary h-11 disabled:opacity-60"
            >
              {busy ? 'Opening checkout…' : selected === 'free' ? 'Start free' : `Continue with ${plan.name}`}
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="mt-2.5 text-center text-[10px] text-[var(--v-faint)]">
              {selected === 'free'
                ? 'No card required.'
                : `Billed in INR${billing === 'annual' ? ' annually' : ' monthly'} · cancel any time · GST extra`}
            </p>

            <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-[var(--v-faint)]">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Razorpay</span>
              <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> UPI · Cards · Netbanking</span>
            </div>
          </div>

          {/* Comparison */}
          <div className="p-5 sm:p-7">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="v-display text-[20px] text-[var(--v-ink)]">{plan.name} includes</h2>
              <p className="text-[11px] text-[var(--v-faint)]">₹{perMonth.toLocaleString('en-IN')}/mo equivalent</p>
            </div>

            <div className="mt-3 grid sm:grid-cols-2 gap-1.5">
              {plan.highlights.map((item) => (
                <div key={item} className="flex items-start gap-2 text-[11.5px] text-[var(--v-ink)]">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-[var(--v-teal)] shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-x-auto v-scroll">
              <table className="w-full min-w-[520px] text-left border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="pb-2 text-[10px] uppercase tracking-[0.12em] font-bold text-[var(--v-faint)]">Compare</th>
                    {PLANS.map((option) => (
                      <th
                        key={option.code}
                        className={`pb-2 px-2 text-[11px] font-bold ${
                          option.code === selected ? 'text-[var(--v-violet)]' : 'text-[var(--v-muted)]'
                        }`}
                      >
                        {option.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, index) => (
                    <tr key={row.label} className={index % 2 === 0 ? 'bg-[var(--v-surface-2)]/50' : ''}>
                      <td className="py-2 pl-2 pr-3 text-[11px] font-medium text-[var(--v-ink)] rounded-l-lg">{row.label}</td>
                      {row.values.map((value, i) => {
                        const isSelectedCol = PLANS[i].code === selected;
                        return (
                          <td
                            key={i}
                            className={`py-2 px-2 text-[11px] ${isSelectedCol ? 'text-[var(--v-ink)] font-semibold' : 'text-[var(--v-muted)]'} ${
                              i === row.values.length - 1 ? 'rounded-r-lg' : ''
                            }`}
                          >
                            {value === '✓' ? (
                              <Check className="w-3.5 h-3.5 text-[var(--v-teal)]" />
                            ) : value === '—' ? (
                              <Minus className="w-3.5 h-3.5 text-[var(--v-faint)]" />
                            ) : (
                              value
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Payments config */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="v-card rounded-[24px] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-[var(--v-ink)] flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[var(--v-muted)]" /> Razorpay checkout
            </h2>
            <span
              className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                getRazorpayKey() ? 'bg-[#F0FBF7] text-[#0C7A5B]' : 'bg-[var(--v-surface-2)] text-[var(--v-muted)]'
              }`}
            >
              {getRazorpayKey() ? 'Test key set' : 'Simulated'}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--v-muted)]">
            Paste a <code className="text-[10px]">rzp_test_…</code> key to open the real modal. The key <em>secret</em> never
            goes in the browser — order creation and signature verification run server-side.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyDraft}
              onChange={(event) => setKeyDraft(event.target.value)}
              placeholder="rzp_test_xxxxxxxxxxxx"
              className="v-input h-10 px-4 text-[12px]"
            />
            <button type="button" onClick={() => setShowKey((value) => !value)} className="v-btn v-btn-ghost h-10 px-3 text-[11px] rounded-lg">
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRazorpayKey(keyDraft);
                setFlash({ tone: 'ok', text: 'Razorpay key saved for this browser.' });
              }}
              className="v-btn v-btn-dark h-10 px-3.5 text-[11px] rounded-lg"
            >
              Save
            </button>
          </div>
        </div>

        <div className="v-card rounded-[24px] p-5">
          <h2 className="text-[13px] font-bold text-[var(--v-ink)] flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#FFC53D]" /> Before you pay
          </h2>
          <ul className="mt-2.5 space-y-1.5 text-[11px] text-[var(--v-muted)]">
            <li className="flex gap-2"><Check className="w-3 h-3 mt-0.5 text-[var(--v-teal)] shrink-0" /> Card, UPI, netbanking and wallets via Razorpay.</li>
            <li className="flex gap-2"><Check className="w-3 h-3 mt-0.5 text-[var(--v-teal)] shrink-0" /> Cancel any time; access runs to the end of the period.</li>
            <li className="flex gap-2"><Check className="w-3 h-3 mt-0.5 text-[var(--v-teal)] shrink-0" /> Receipts and GST invoices in purchase history.</li>
            <li className="flex gap-2"><Check className="w-3 h-3 mt-0.5 text-[var(--v-teal)] shrink-0" /> 7-day refund on your first paid month.</li>
          </ul>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="mt-3 text-[11px] font-bold text-[var(--v-violet)] hover:underline"
          >
            Manage billing in Settings
          </button>
        </div>
      </section>
    </div>
  );
};
