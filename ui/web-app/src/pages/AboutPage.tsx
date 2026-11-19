import React from 'react';
import { ArrowRight, Check, ChevronRight, MessageSquareText, ScanSearch, Wand2 } from 'lucide-react';

interface AboutPageProps {
  onStartAnalysis: () => void;
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

export const AboutPage: React.FC<AboutPageProps> = ({ onStartAnalysis }) => {
  const scrollToWorkflow = () => {
    document.getElementById('workflow-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-14 px-4 pb-12 sm:px-6 lg:space-y-20 lg:px-8">
      <section className="relative pt-4 sm:pt-8" aria-label="Hero">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-1 text-[11px] font-semibold text-[var(--v-muted)] shadow-[var(--v-shadow-sm)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0FA3A3]" />
              Prompt review before generation
            </span>

            <h1 className="v-display text-[34px] leading-[1.1] text-[var(--v-ink)] sm:text-[46px] lg:text-[52px]">
              Find what your UI prompt leaves out.
            </h1>

            <p className="max-w-xl text-[14px] leading-relaxed text-[var(--v-muted)] sm:text-[15px]">
              Vector reads a natural-language UI request, detects every element, and tells you exactly
              which labels, colours, placements and actions are missing — before a generator guesses.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={onStartAnalysis} className="v-btn v-btn-primary h-11 px-5 text-[13px]">
                Analyse a prompt <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={scrollToWorkflow} className="v-btn v-btn-ghost h-11 px-5 text-[13px]">
                See how it works <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-[11.5px] text-[var(--v-muted)]">
              {['Runs in your browser', 'No account needed to try', 'Grounded in your wording'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#3E6B33]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="v-card rounded-3xl p-5 shadow-[var(--v-shadow-lg)] sm:p-6">
            <div className="flex items-center justify-between">
              <p className="v-eyebrow">Example review</p>
              <span className="rounded-full border border-[#FEF08A] bg-[#FEFCE8] px-2 py-0.5 text-[10px] font-bold text-[#856C16]">
                Medium · 44/100
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--v-faint)]">Your prompt</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--v-ink)]">
                Add a <mark className="rounded bg-[#D1B653]/30 px-1 text-[#856C16]">red</mark>{' '}
                <mark className="rounded bg-[#49686C]/15 px-1 text-[#30494B]">button</mark> labelled{' '}
                <mark className="rounded bg-[#C96839]/15 px-1 text-[#9C4A28]">“Sign Up”</mark>.
              </p>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-[var(--v-line)] px-3 py-2">
                <span className="text-[11.5px] font-semibold text-[var(--v-ink)]">Button #1</span>
                <span className="text-[10.5px] text-[var(--v-muted)]">LABEL · Sign Up · COLOR · red</span>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-[#FEF08A] bg-[#FEFCE8] px-3 py-2">
                <span className="mt-0.5 text-[11px]">⚠</span>
                <div>
                  <p className="text-[11px] font-bold text-[#856C16]">Missing action and placement</p>
                  <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#856C16]/80">
                    Where does it sit, and what happens when it is clicked?
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-[#CFE2C8] bg-[#F4F9F1] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3E6B33]">Improved prompt</p>
                <p className="mt-1 font-mono text-[10.5px] leading-relaxed text-[#30494B]">
                  Add a red button in the &lt;location&gt; labelled “Sign Up” that &lt;what it does&gt;.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow-section" className="scroll-mt-24" aria-label="How it works">
        <div className="mx-auto max-w-2xl text-center">
          <p className="v-eyebrow">How it works</p>
          <h2 className="v-display mt-1 text-[26px] text-[var(--v-ink)] sm:text-[32px]">Three steps, one clear result.</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--v-muted)]">
            No setup, no project required. Paste a prompt and review the gaps.
          </p>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.Icon;
            return (
              <div key={step.title} className="v-card rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--v-surface-2)] text-[var(--v-violet)]">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[var(--v-faint)]">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-[14px] font-bold text-[var(--v-ink)]">{step.title}</h3>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--v-muted)]">{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Why it helps">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Element-aware', 'Findings stay attached to the element they describe, not the whole screen.'],
            ['Grounded', 'Values that are not in your prompt are never invented; they become questions.'],
            ['Explainable', 'Every warning points back to the exact words that caused it.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] px-4 py-4">
              <p className="text-[12.5px] font-bold text-[var(--v-ink)]">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--v-muted)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="v-mesh v-noise relative overflow-hidden rounded-3xl px-6 py-9 text-center text-white sm:px-10 sm:py-12">
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="v-display text-[26px] sm:text-[32px]">Ready to check your first prompt?</h2>
          <p className="mx-auto mt-2 max-w-lg text-[12.5px] leading-relaxed text-white/75">
            Paste the request you would normally give a UI generator. Vector will show what it is about to guess.
          </p>
          <button
            type="button"
            onClick={onStartAnalysis}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[13px] font-bold text-[#14121F] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Analyse a prompt <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="v-orb -bottom-24 -right-8 h-[240px] w-[240px] bg-[#FFC53D]/35" aria-hidden="true" />
        <div className="v-orb -left-10 top-0 h-[200px] w-[200px] bg-[#0FA3A3]/40" aria-hidden="true" />
      </section>
    </div>
  );
};
