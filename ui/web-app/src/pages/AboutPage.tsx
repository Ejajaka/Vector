import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Blocks,
  Check,
  ChevronRight,
  CircleDot,
  Download,
  GripVertical,
  Layers,
  LogIn,
  MessageSquareText,
  Plus,
  ScanSearch,
  Sparkles,
  UserPlus,
  Wand2,
} from 'lucide-react';
import { WINDOWS_INSTALLER_URL } from '../data/downloads.ts';

interface AboutPageProps {
  onStartAnalysis: () => void;
  onOpenTemplates?: () => void;
  auth?: {
    configured: boolean;
    onLogin: () => void;
    onRegister: () => void;
    onContinueLocal?: () => void;
  };
}

const STEPS = [
  {
    Icon: ScanSearch,
    title: 'Detect the elements',
    text: 'Vector finds buttons, inputs, cards, navbars and the details attached to each one.',
  },
  {
    Icon: MessageSquareText,
    title: 'Show what is missing',
    text: 'Missing labels, vague colours and unclear actions are reported against the exact element.',
  },
  {
    Icon: Wand2,
    title: 'Give you a better prompt',
    text: 'You leave with a clearer prompt and, where needed, specific questions to answer.',
  },
];

const FIGURES = [
  {
    figure: 'Fig 0.1',
    title: 'Prompt review',
    text: 'Every prompt is scored, annotated and rewritten against the same requirement model — not a vibe check.',
  },
  {
    figure: 'Fig 0.2',
    title: 'Traceable brief',
    text: 'Requirements, acceptance criteria and review findings stay linked to the words that produced them.',
  },
  {
    figure: 'Fig 0.3',
    title: 'Local by default',
    text: 'Detection, graphing and rewriting run in your browser. Bring a model only when you want one.',
  },
];

const FINDINGS = [
  ['Missing action', 'What should “Continue” do when clicked?', 'Required'],
  ['Unresolved attribute', 'No colour is specified for the primary button.', 'Medium'],
  ['Unlinked state', 'The password field has no error or disabled state.', 'Low'],
];

export const AboutPage: React.FC<AboutPageProps> = ({ onStartAnalysis, onOpenTemplates, auth }) => {
  const scrollToWorkflow = () => {
    document.getElementById('workflow-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full overflow-hidden pb-8">
      {/* Hero ------------------------------------------------------- */}
      <div aria-hidden="true" className="v-spotlight pointer-events-none absolute inset-x-0 -top-40 h-[620px]" />
      <section className="relative mx-auto w-full max-w-[1200px] px-4 pb-6 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24" aria-label="Hero">
        <div className="max-w-[900px] text-left">
          <button
            type="button"
            onClick={onStartAnalysis}
            className="group inline-flex items-center gap-2 rounded-full border border-[var(--v-line)] bg-[var(--v-surface)]/60 py-1 pl-1.5 pr-3 text-[12px] font-medium text-[var(--v-muted)] transition-colors hover:border-[var(--v-line-strong)] hover:text-[var(--v-ink)]"
          >
            <span className="rounded-full bg-[var(--v-accent-soft)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--v-accent-hover)] dark:text-[#a5a8ff]">
              New
            </span>
            On-device voice capture is live
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </button>

          <h1 className="v-display mt-7 max-w-[900px] text-[42px] text-[var(--v-ink)] sm:text-[58px] lg:text-[68px]">
            The review layer for
            <br className="hidden sm:block" />
            <span className="text-[var(--v-muted)]"> AI-built interfaces.</span>
          </h1>

          <p className="mt-5 max-w-[560px] text-[14.5px] leading-[1.65] text-[var(--v-muted)] sm:text-[16px]">
            Vector reads a natural-language UI request, finds every missing label, state and
            interaction, and hands back a complete brief your generator can actually build.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-start gap-2">
            {auth ? (
              <>
                <button
                  type="button"
                  onClick={auth.onLogin}
                  className="v-btn v-btn-primary h-10 rounded-full px-5 text-[13px]"
                >
                  <LogIn className="h-3.5 w-3.5" /> Log in
                </button>
                <button
                  type="button"
                  onClick={auth.onRegister}
                  className="v-btn v-btn-ghost h-10 rounded-full px-5 text-[13px]"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Create an account
                </button>
                <button
                  type="button"
                  onClick={scrollToWorkflow}
                  className="inline-flex h-10 items-center gap-1 px-2 text-[12px] font-medium text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)]"
                >
                  See how it works <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onStartAnalysis}
                  className="v-btn v-btn-primary h-9 rounded-full px-4 text-[13px]"
                >
                  Analyse a prompt <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onOpenTemplates ?? scrollToWorkflow}
                  className="v-btn v-btn-ghost h-9 rounded-full px-4 text-[13px]"
                >
                  Browse templates <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          {auth && !auth.configured && auth.onContinueLocal && (
            <button
              type="button"
              onClick={auth.onContinueLocal}
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)]"
            >
              Continue in local mode without an account <ArrowRight className="h-3 w-3" />
            </button>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-[11.5px] text-[var(--v-faint)]">
            {(auth
              ? ['Two projects free, no card required', 'Requirements, review and prompts in one place', 'Runs in your browser']
              : ['Runs in your browser', 'No account needed to try', 'Grounded in your wording']
            ).map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check className="h-3 w-3 text-[var(--v-accent-hover)]" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Product preview ---------------------------------------- */}
        <div className="relative mt-12 max-w-[1200px] sm:mt-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-24 -top-6 h-32 rounded-full bg-[#7170ff]/10 blur-[70px]"
          />
          <div className="relative overflow-hidden rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[0_50px_140px_-60px_rgba(0,0,0,0.9)]">
            <div className="flex h-10 items-center gap-3 border-b border-[var(--v-line)] px-3.5">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3a3d44]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#3a3d44]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#3a3d44]" />
              </div>
              <span className="mx-auto hidden text-[11px] text-[var(--v-faint)] sm:block">
                vector — checkout-review
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--v-line)] px-2 py-0.5 text-[10px] text-[var(--v-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--v-accent-hover)]" />
                Local
              </span>
            </div>

            <div className="grid sm:grid-cols-[190px_1fr]">
              <div className="hidden border-r border-[var(--v-line)] bg-[var(--v-bg)] p-3 sm:block">
                <p className="px-1.5 text-[11px] font-medium text-[var(--v-muted)]">Acme Design</p>
                <div className="mt-3 space-y-0.5">
                  {[
                    ['Overview', false],
                    ['Projects', true],
                    ['Prompts', false],
                    ['Requirements', false],
                    ['Review', false],
                  ].map(([label, active]) => (
                    <div
                      key={String(label)}
                      className={`flex items-center gap-2 rounded-md px-1.5 py-1.5 text-[11.5px] ${
                        active
                          ? 'bg-[var(--v-surface-2)] text-[var(--v-ink)]'
                          : 'text-[var(--v-muted)]'
                      }`}
                    >
                      <CircleDot className={`h-3 w-3 ${active ? 'text-[var(--v-accent)]' : 'text-[var(--v-faint)]'}`} />
                      {label}
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-md border border-dashed border-[var(--v-line)] p-2 text-[10px] leading-relaxed text-[var(--v-faint)]">
                  Stored in this browser
                </div>
              </div>

              <div className="min-w-0 p-3.5 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-[var(--v-faint)]">Projects / Checkout</span>
                  <span className="ml-auto rounded-full border border-[#f2c94c]/30 bg-[#f2c94c]/10 px-2 py-0.5 text-[10px] font-medium text-[#d9b64a]">
                    Risk 22 · Medium
                  </span>
                </div>

                <div className="mt-3 rounded-lg border border-[var(--v-line)] bg-[var(--v-bg)] p-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--v-faint)]">
                    Your prompt
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--v-ink)]">
                    Build a checkout page with a{' '}
                    <mark className="rounded bg-[var(--v-warning)]/15 px-1 text-[var(--v-warning)]">red</mark>{' '}
                    <mark className="rounded bg-[var(--v-accent)]/15 px-1 text-[var(--v-accent-hover)]">button</mark>{' '}
                    labelled{' '}
                    <mark className="rounded bg-[var(--v-coral)]/15 px-1 text-[var(--v-coral)]">“Pay now”</mark>.
                  </p>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_150px]">
                  <div className="space-y-1.5">
                    {FINDINGS.map(([title, body, severity]) => (
                      <div
                        key={title}
                        className="flex items-start gap-2 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)] px-2.5 py-2"
                      >
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-[var(--v-warning)]" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-[var(--v-ink)]">{title}</p>
                          <p className="truncate text-[10.5px] text-[var(--v-muted)]">{body}</p>
                        </div>
                        <span className="ml-auto shrink-0 rounded-full border border-[var(--v-line)] px-1.5 py-0.5 text-[9px] text-[var(--v-faint)]">
                          {severity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-[var(--v-line)] bg-[var(--v-bg)] p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--v-faint)]">Coverage</p>
                    <p className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[var(--v-ink)]">68%</p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--v-surface-2)]">
                      <div className="h-full w-[68%] rounded-full bg-[var(--v-accent)]" />
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-[var(--v-muted)]">
                      4 of 6 requirement layers are covered.
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-[var(--v-accent-hover)]/25 bg-[var(--v-accent-soft)] p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--v-accent-hover)]">
                    Improved prompt
                  </p>
                  <p className="mt-1 font-mono text-[10.5px] leading-relaxed text-[var(--v-ink)]">
                    On the checkout page, add a red “Pay now” button below the total that confirms the
                    order and shows a success state.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--v-bg)] to-transparent"
          />
        </div>

        <div className="mx-auto mt-10 grid max-w-[880px] grid-cols-2 gap-y-5 border-t border-[var(--v-line)] pt-6 sm:grid-cols-4">
          {[
            ['Prompt review', 'Element-aware findings'],
            ['Requirement graph', 'Ambiguity and conflicts'],
            ['Acceptance criteria', 'Testable outcomes'],
            ['Prompt versions', 'Drag into your builder'],
          ].map(([title, caption]) => (
            <div key={title} className="px-1">
              <p className="text-[12px] font-medium text-[var(--v-ink)]">{title}</p>
              <p className="mt-0.5 text-[11px] text-[var(--v-faint)]">{caption}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features --------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-label="Why it helps">
        <div className="grid gap-8 border-t border-[var(--v-line)] pt-8 sm:grid-cols-3 sm:gap-10">
          {FIGURES.map((item) => (
            <div key={item.figure}>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--v-faint)]">
                {item.figure}
              </p>
              <h2 className="mt-3 text-[15px] font-semibold tracking-[-0.011em] text-[var(--v-ink)]">
                {item.title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-[1.65] text-[var(--v-muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Block composer -------------------------------------------- */}
      <section
        id="block-composer"
        className="relative scroll-mt-20 overflow-hidden border-y border-[var(--v-line)] bg-[var(--v-surface)]/35"
        aria-label="Block composer"
      >
        <div aria-hidden="true" className="v-spotlight pointer-events-none absolute inset-x-0 -top-32 h-[420px]" />
        <div className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--v-accent-hover)]/30 bg-[var(--v-accent-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--v-accent-hover)]">
              <Blocks className="h-3 w-3" /> Block composer
            </span>
            <h2 className="v-display mt-4 text-[28px] text-[var(--v-ink)] sm:text-[38px]">
              Place the blocks.
              <br />
              <span className="text-[var(--v-muted)]">Vector writes the prompt.</span>
            </h2>
            <p className="mt-3 max-w-[430px] text-[13.5px] leading-[1.65] text-[var(--v-muted)]">
              Drop in a nav, hero, KPI row, table, form or auth screen. Vector turns the arrangement
              into a complete six-section prompt with labels, states, interactions and design tokens
              already filled in — ready to paste into Base44, v0, Bolt or Figma.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                '24+ documented UI blocks, from navigation to empty states',
                'Every block carries its label, action and required attributes',
                'Prompt sections update as you add, remove or reorder blocks',
                'Design-system tokens carried into the generated prompt',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[var(--v-muted)]">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--v-accent-soft)] text-[var(--v-accent-hover)]">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={auth ? auth.onRegister : onStartAnalysis}
              className="v-btn v-btn-primary mt-7 h-9 rounded-full px-4 text-[12.5px]"
            >
              <Blocks className="h-3.5 w-3.5" /> Build with blocks
            </button>
          </div>

          <div className="relative">
            <div aria-hidden="true" className="pointer-events-none absolute -inset-6 rounded-2xl bg-[#7170ff]/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]">
              <div className="flex flex-wrap items-center gap-2 border-b border-[var(--v-line)] px-3.5 py-2.5">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--v-accent-soft)] text-[var(--v-accent-hover)]">
                  <Blocks className="h-3 w-3" />
                </span>
                <span className="text-[11.5px] font-semibold text-[var(--v-ink)]">Checkout blocks</span>
                <span className="rounded-full border border-[var(--v-line)] px-2 py-0.5 text-[9px] text-[var(--v-faint)]">3 pages</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[var(--v-accent-hover)]/30 bg-[var(--v-accent-soft)] px-2 py-0.5 text-[9px] font-medium text-[var(--v-accent-hover)]">
                  <Sparkles className="h-2.5 w-2.5" /> Prompt ready
                </span>
              </div>

              <div className="grid gap-0 md:grid-cols-[1fr_1.15fr]">
                <div className="border-b border-[var(--v-line)] bg-[var(--v-bg)] p-3.5 md:border-b-0 md:border-r">
                  <div className="flex items-center justify-between">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--v-faint)]">Block palette</p>
                    <span className="text-[9px] text-[var(--v-faint)]">24 blocks</span>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {[
                      ['Navigation', 'Top nav'],
                      ['Hero', 'Headline + CTA'],
                      ['KPI row', '4 cards'],
                      ['Table', 'Recent orders'],
                      ['Checkout', 'Form + summary'],
                      ['Footer', 'Links + legal'],
                    ].map(([label, detail], index) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2 rounded-md border px-2 py-1.5 ${
                          index === 4
                            ? 'border-[var(--v-accent-hover)]/40 bg-[var(--v-accent-soft)]'
                            : 'border-[var(--v-line)] bg-[var(--v-surface)]'
                        }`}
                      >
                        <GripVertical className="h-3 w-3 text-[var(--v-faint)]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10.5px] font-medium text-[var(--v-ink)]">{label}</p>
                          <p className="truncate text-[9px] text-[var(--v-faint)]">{detail}</p>
                        </div>
                        {index === 4 ? (
                          <Check className="h-3 w-3 text-[var(--v-accent-hover)]" />
                        ) : (
                          <Plus className="h-3 w-3 text-[var(--v-faint)]" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[9px] leading-relaxed text-[var(--v-faint)]">
                    Drag to arrange. Order becomes the layout section of the prompt.
                  </p>
                </div>

                <div className="p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--v-faint)]">Generated prompt</p>
                    <span className="rounded border border-[var(--v-line)] px-1.5 py-0.5 font-mono text-[8.5px] text-[var(--v-faint)]">draft / v.01</span>
                  </div>
                  <div className="mt-2.5 space-y-1.5 font-mono text-[9.5px] leading-relaxed">
                    {[
                      ['01', 'Context', 'Checkout for a commerce store, 1200×800.'],
                      ['02', 'Layout', 'Top nav · 2-col form/summary · footer.'],
                      ['03', 'Components', 'Order summary, card field, promo input.'],
                      ['04', 'Interaction', 'Validate on blur; pay opens the review step.'],
                      ['05', 'Style', 'Indigo #7170FF · Inter · 8px cards.'],
                      ['06', 'Acceptance', 'Empty, loading, error and success states.'],
                    ].map(([number, title, body]) => (
                      <div key={title} className="rounded-md border border-[var(--v-line)] bg-[var(--v-bg)] px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[var(--v-accent-hover)]">{number}</span>
                          <span className="text-[8px] uppercase tracking-[0.1em] text-[var(--v-faint)]">{title}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[9px] text-[var(--v-muted)]">{body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['Base44', 'v0', 'Bolt', 'Figma'].map((tool) => (
                      <span key={tool} className="rounded border border-[var(--v-line)] px-1.5 py-0.5 text-[8px] text-[var(--v-muted)]">
                        {tool}
                      </span>
                    ))}
                    <span className="ml-auto inline-flex items-center gap-1 rounded bg-[var(--v-accent-soft)] px-1.5 py-0.5 text-[8px] font-medium text-[var(--v-accent-hover)]">
                      Copy prompt <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow --------------------------------------------------- */}
      <section id="workflow-section" className="scroll-mt-20 border-y border-[var(--v-line)] bg-[var(--v-surface)]/40" aria-label="How it works">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:gap-16 lg:px-8">
          <div>
            <p className="v-eyebrow">How it works</p>
            <h2 className="v-display mt-3 text-[28px] text-[var(--v-ink)] sm:text-[36px]">
              Three steps, one clear result.
            </h2>
            <p className="mt-3 max-w-[420px] text-[13.5px] leading-[1.65] text-[var(--v-muted)]">
              No setup and no project required. Paste the request you would normally give a UI
              generator and review the gaps before anything is built.
            </p>
            <div className="mt-8 space-y-5 sm:space-y-6">
              {STEPS.map((step, index) => {
                const Icon = step.Icon;
                return (
                  <div key={step.title} className="flex gap-3.5">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[var(--v-line)] bg-[var(--v-bg)] text-[var(--v-muted)]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--v-ink)]">
                        <span className="mr-2 font-mono text-[10.5px] text-[var(--v-faint)]">0{index + 1}</span>
                        {step.title}
                      </p>
                      <p className="mt-1 max-w-[420px] text-[12.5px] leading-relaxed text-[var(--v-muted)]">
                        {step.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-lg bg-[#7170ff]/10 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)]">
              <div className="flex items-center gap-2 border-b border-[var(--v-line)] px-3.5 py-2.5">
                <Sparkles className="h-3.5 w-3.5 text-[var(--v-accent)]" />
                <span className="text-[11.5px] font-medium text-[var(--v-ink)]">Prompt analyser</span>
                <span className="ml-auto rounded-full border border-[var(--v-line)] px-2 py-0.5 text-[10px] text-[var(--v-faint)]">
                  deterministic engine
                </span>
              </div>
              <div className="space-y-3 p-3.5">
                <div className="rounded-lg border border-[var(--v-line)] bg-[var(--v-bg)] p-3">
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--v-faint)]">Input</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--v-ink)]">
                    “Add a red button labelled Sign Up.”
                  </p>
                </div>
                <div className="flex items-center justify-center text-[var(--v-faint)]">
                  <ArrowRight className="h-3.5 w-3.5 rotate-90" />
                </div>
                <div className="rounded-lg border border-[var(--v-line)] p-3">
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--v-faint)]">Questions</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {['Where does the button sit on the screen?', 'What happens when it is clicked?'].map((q) => (
                      <li key={q} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-[var(--v-muted)]">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--v-warning)]" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-[var(--v-accent-hover)]/25 bg-[var(--v-accent-soft)] p-3">
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--v-accent-hover)]">Output</p>
                  <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-[var(--v-ink)]">
                    Add a red button in the &lt;location&gt; labelled “Sign Up” that &lt;what it does&gt;.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-3 grid grid-cols-3 gap-2">
              {[
                ['Layers', '6 checked'],
                ['Elements', '4 found'],
                ['Findings', '2 open'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--v-faint)]">{label}</p>
                  <p className="mt-0.5 text-[12px] font-medium text-[var(--v-ink)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA ------------------------------------------------ */}
      <section className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8" aria-label="Get started">
        <div className="v-mesh relative overflow-hidden px-6 py-14 text-center sm:px-10 sm:py-20">
          <div className="relative z-10 mx-auto max-w-[640px]">
            <p className="v-eyebrow text-white/45">Start with the prompt you already have</p>
            <h2 className="v-display mt-3 text-[30px] text-white sm:text-[42px]">
              Build it right the first time.
            </h2>
            <p className="mx-auto mt-3 max-w-[500px] text-[13.5px] leading-[1.65] text-white/60">
              Paste a request, review what is missing, and hand your generator a brief with no
              guesses left in it.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-start gap-2">
              {auth ? (
                <>
                  <button
                    type="button"
                    onClick={auth.onLogin}
                    className="v-btn h-9 rounded-full border-transparent bg-[#e5e5e6] px-4 text-[13px] font-medium text-[#08090a] hover:bg-[#ffffff]"
                  >
                    <LogIn className="h-3.5 w-3.5" /> Log in
                  </button>
                  <button
                    type="button"
                    onClick={auth.onRegister}
                    className="v-btn h-9 rounded-full border border-white/15 bg-white/[0.04] px-4 text-[13px] text-white hover:bg-white/[0.08]"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Create an account
                  </button>
                  <a
                    href={WINDOWS_INSTALLER_URL}
                    className="v-btn h-9 rounded-full border border-white/15 bg-white/[0.04] px-4 text-[13px] text-white hover:bg-white/[0.08]"
                  >
                    <Download className="h-3.5 w-3.5" /> Download for Windows
                  </a>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onStartAnalysis}
                    className="v-btn h-9 rounded-full border-transparent bg-[#e5e5e6] px-4 text-[13px] font-medium text-[#08090a] hover:bg-[#ffffff]"
                  >
                    Analyse a prompt <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenTemplates ?? scrollToWorkflow}
                    className="v-btn h-9 rounded-full border border-white/15 bg-white/[0.04] px-4 text-[13px] text-white hover:bg-white/[0.08]"
                  >
                    <Layers className="h-3.5 w-3.5" /> Start from a template
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="v-orb -bottom-28 -right-10 h-[300px] w-[300px] bg-[#7170ff]/40" aria-hidden="true" />
          <div className="v-orb -left-16 top-0 h-[240px] w-[240px] bg-[#00b8cc]/30" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
};
