import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Cpu,
  Eye,
  Gauge,
  Layers,
  Link2,
  RefreshCw,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { Reveal } from '../components/ui/Reveal.tsx';
import { CountUp } from '../components/ui/CountUp.tsx';

interface AboutPageProps {
  onStartAnalysis: () => void;
}

const PROBLEM_CARDS = [
  {
    Icon: AlertTriangle,
    iconClass: 'bg-[#FDF2F0] text-[#B94D42]',
    title: 'Missing details',
    text: '“Add a button” says nothing about its text, colour, placement or what clicking it does. The generator has to guess.',
  },
  {
    Icon: Eye,
    iconClass: 'bg-[#FEFCE8] text-[#D1B653]',
    title: 'Vague values',
    text: '“Some nice colour”, “somewhere on the side” and “does something useful” are not actionable. Vector asks instead of pretending.',
  },
  {
    Icon: Link2,
    iconClass: 'bg-[#F0F5F5] text-[#49686C]',
    title: 'Attribute ambiguity',
    text: 'With several elements on screen, it is easy to attach a colour or action to the wrong component. Vector links every attribute to an element.',
  },
];

const WORKFLOW_STEPS = [
  {
    n: '01',
    tag: 'Compile',
    title: 'Upload',
    text: 'Drop in a PDF, DOCX, TXT or Markdown document. Vector extracts every requirement with its source page and character offsets.',
    foot: '→ Traceable requirements',
  },
  {
    n: '02',
    tag: 'Analyze',
    title: 'Detect',
    text: 'Vector reads the prompt or requirement text, detects elements, and asks targeted questions when a detail is missing or unclear.',
    foot: '→ Clear, grounded input',
  },
  {
    n: '03',
    tag: 'Review',
    title: 'Approve',
    text: 'Ambiguities, conflicts and dependencies surface in a live graph. Edge cases are suggested, then accepted or rejected by a human.',
    foot: '→ Audited acceptance',
  },
  {
    n: '04',
    tag: 'Generate',
    title: 'Ship',
    text: 'Produce a six-section design brief with your design tokens, version it, and build it in Base44 from the workspace.',
    foot: '→ Build-ready brief',
  },
];

const ADVANTAGES = [
  {
    Icon: Layers,
    iconClass: 'text-[#49686C]',
    title: 'Element-aware findings',
    text: 'Every missing detail is attached to a specific element — not just “the prompt is incomplete”.',
  },
  {
    Icon: ShieldCheck,
    iconClass: 'text-[#3E6B33]',
    title: 'Grounded suggestions',
    text: 'Recommendations use the confirmed prompt and answers. Placeholders remain where the user has not decided.',
  },
  {
    Icon: Gauge,
    iconClass: 'text-[#D1B653]',
    title: 'Shared risk score',
    text: 'Completeness, vagueness, review confidence and unresolved questions combine into a consistent 0–100 score.',
  },
  {
    Icon: Wand2,
    iconClass: 'text-[#49686C]',
    title: 'Project-scoped by design',
    text: 'Documents, requirements, approvals, prompts and analyses stay inside their project and are visible only to your account.',
  },
  {
    Icon: Link2,
    iconClass: 'text-[#49686C]',
    title: 'Traceable by default',
    text: 'Every compiled requirement keeps its source document, page, paragraph and character range, so a reviewer can check the original wording in seconds.',
  },
  {
    Icon: ClipboardCheck,
    iconClass: 'text-[#3E6B33]',
    title: 'Approval audit trail',
    text: 'Requirement and acceptance-criteria decisions are recorded with the actor and reason, so the brief can prove what was approved and when.',
  },
];

const GLANCE_STATS = [
  { value: 4, suffix: '', label: 'review stages', detail: 'Compile → Detect → Review → Ship' },
  { value: 6, suffix: '', label: 'brief sections', detail: 'Generated from approved decisions' },
  { value: 100, suffix: ' / 100', label: 'risk score', detail: 'A heuristic, not a guarantee' },
  { value: 0, suffix: ' bytes', label: 'prompt data uploaded', detail: 'Analysis runs in your browser' },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onStartAnalysis }) => {
  const scrollToWorkflow = () => {
    document.getElementById('workflow-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Interactive live-preview simulation state
  const [animStep, setAnimStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setAnimStep((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePreviewMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const node = previewRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    node.classList.add('is-tilting');
    node.style.setProperty('--tilt-x', `${(0.5 - py) * 7}deg`);
    node.style.setProperty('--tilt-y', `${(px - 0.5) * 9}deg`);
    node.style.setProperty('--glow-x', `${px * 100}%`);
    node.style.setProperty('--glow-y', `${py * 100}%`);
  };

  const resetPreviewTilt = () => {
    const node = previewRef.current;
    if (!node) return;
    node.classList.remove('is-tilting');
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <div className="space-y-16 lg:space-y-24 max-w-6xl mx-auto pb-12 antialiased">
      {/* HERO */}
      <section id="hero" className="relative pt-2 sm:pt-6 lg:pt-8 scroll-mt-24" aria-label="Hero">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#49686C]/5 rounded-full blur-3xl pointer-events-none -z-10 animate-orb-drift" />
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-[#D1B653]/10 rounded-full blur-2xl pointer-events-none -z-10 animate-orb-drift-slow" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="rise-in" style={{ animationDelay: '0ms' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E4EBDD] text-[#30494B] border border-[#CFE2C8] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#49686C] animate-pulse" />
                <span>Vector — Requirement engineering for UI teams</span>
              </div>
            </div>

            <h1
              className="rise-in text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#283638] tracking-tight leading-[1.15]"
              style={{ animationDelay: '90ms' }}
            >
              Better interfaces start <br className="hidden sm:inline" />
              <span className="text-[#49686C] underline decoration-[#D1B653] decoration-wavy decoration-2 underline-offset-6">
                before the first line
              </span>{' '}
              of UI code.
            </h1>

            <p
              className="rise-in text-base sm:text-lg text-[#737A72] max-w-xl leading-relaxed"
              style={{ animationDelay: '170ms' }}
            >
              Turn company requirement documents into traceable requirements, reviewed edge cases,
              audited acceptance criteria and a six-section design brief — all before a generator
              is allowed to guess.
            </p>

            <div
              className="rise-in flex flex-wrap items-center gap-4 pt-2"
              style={{ animationDelay: '250ms' }}
            >
              <button
                type="button"
                onClick={onStartAnalysis}
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#49686C] hover:bg-[#30494B] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                <span>Start a requirement review</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={scrollToWorkflow}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-[#F6F4EC] text-[#283638] border border-[#E5E2D8] hover:border-[#CDC9BC] text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>How It Works</span>
                <ChevronRight className="w-4 h-4 text-[#737A72]" />
              </button>
            </div>

            <div
              className="rise-in pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#737A72]"
              style={{ animationDelay: '330ms' }}
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#49686C]" />
                <span>Smart element detection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#49686C]" />
                <span>Traceable requirements</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#49686C]" />
                <span>Human-approved briefs</span>
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW CARD */}
          <div
            className="rise-in lg:col-span-5 relative"
            style={{ animationDelay: '320ms' }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
              setIsPaused(false);
              resetPreviewTilt();
            }}
          >
            <div className="animate-float-soft">
              <div
                ref={previewRef}
                onMouseMove={handlePreviewMove}
                className="tilt-card group relative bg-[#FFFFFF] rounded-2xl border border-[#E5E2D8] shadow-lg p-5 sm:p-6 space-y-4 overflow-hidden"
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'radial-gradient(420px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(73,104,108,0.12), transparent 62%)',
                  }}
                  aria-hidden="true"
                />

                <div className="relative flex items-center justify-between pb-3 border-b border-[#E5E2D8]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#B94D42]/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D1B653]/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#688E5E]/70" />
                    <span className="text-[11px] font-mono text-[#737A72] ml-2">vector.live</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F6F4EC] text-[#49686C] font-semibold">
                    Step {animStep + 1}/4
                  </span>
                </div>

                <div className="relative space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#737A72]">
                    Input UI prompt
                  </span>
                  <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E2D8] text-xs font-mono text-[#283638] leading-relaxed relative">
                    Add a{' '}
                    <span className="bg-[#FDF2F0] text-[#B94D42] px-1 py-0.5 rounded font-bold">
                      red
                    </span>{' '}
                    <span className="bg-[#E4EBDD] text-[#30494B] px-1 py-0.5 rounded font-bold">
                      button
                    </span>{' '}
                    labelled{' '}
                    <span className="bg-[#F0F5F5] text-[#49686C] px-1 py-0.5 rounded font-bold">
                      “Sign Up”
                    </span>
                    .
                  </div>
                </div>

                {/* Step 1: Element Detection */}
                <div className={`relative transition-all duration-300 ${animStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#283638] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#49686C]" /> Detected elements
                    </span>
                    <span className="text-[11px] text-[#49686C] font-mono">1 element</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 rounded bg-[#F0F5F5] border border-[#CFDFE1] text-[11px] font-mono font-medium text-[#49686C] flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Button #1
                    </span>
                    <span className="px-2 py-1 rounded bg-[#F4F9F1] border border-[#CFE2C8] text-[11px] font-mono font-medium text-[#3E6B33]">
                      LABEL · Sign Up
                    </span>
                    <span className="px-2 py-1 rounded bg-[#FEFCE8] border border-[#FEF08A] text-[11px] font-mono font-medium text-[#856C16]">
                      COLOR · red
                    </span>
                  </div>
                </div>

                {/* Step 2: Evaluation Findings */}
                <div className={`relative transition-all duration-300 ${animStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#283638] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D1B653]" /> Evaluation findings
                    </span>
                    <span className="text-[11px] text-[#856C16] font-semibold font-mono">Medium · 44/100</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded bg-[#FEFCE8] border border-[#FEF08A] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#856C16] shrink-0" />
                        <span className="font-semibold text-[#856C16]">Missing action (ACTION)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#856C16]">Missing</span>
                    </div>
                    <div className="p-2 rounded bg-[#FEFCE8] border border-[#FEF08A] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#856C16] shrink-0" />
                        <span className="font-semibold text-[#856C16]">Missing placement (LOCATION)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#856C16]">Missing</span>
                    </div>
                  </div>
                </div>

                {/* Step 3: Validated Rewrite */}
                <div className={`relative transition-all duration-300 ${animStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>
                  <div className="p-2.5 rounded-lg bg-[#F4F9F1] border border-[#CFE2C8] space-y-1 text-xs text-[#2D5A27]">
                    <div className="flex items-center justify-between gap-2 font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3E6B33]" />
                        Validated best prompt
                      </span>
                      <span className="text-[10px] font-mono bg-white/70 rounded px-1.5 py-0.5 text-[#3E6B33]">
                        risk 44/100
                      </span>
                    </div>
                    <p className="text-[11px] font-mono leading-relaxed">
                      Add a red button in the &lt;location&gt; labelled “Sign Up” that &lt;what it does&gt;.
                    </p>
                  </div>
                </div>

                {/* Interactive step indicator */}
                <div className="relative flex items-center justify-between pt-2 border-t border-[#E5E2D8] text-[11px] text-[#737A72]">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setAnimStep(step)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          animStep === step ? 'w-6 bg-[#49686C]' : 'w-2 bg-[#E5E2D8] hover:bg-[#CDC9BC]'
                        }`}
                        aria-label={`Show step ${step + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnimStep((s) => (s + 1) % 4)}
                    className="inline-flex items-center gap-1 text-[#49686C] hover:text-[#30494B] font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Next simulation step</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rise-in flex justify-center pt-10 sm:pt-12" style={{ animationDelay: '520ms' }}>
          <button
            type="button"
            onClick={scrollToWorkflow}
            className="group inline-flex items-center gap-2 rounded-full border border-[#E5E2D8] bg-white/70 px-4 py-2 text-[11px] font-semibold text-[#737A72] shadow-xs transition-colors hover:border-[#49686C]/40 hover:text-[#283638] dark:border-[#33403F] dark:bg-white/5 dark:text-[#9AA6A2] dark:hover:text-[#F2F5F3]"
          >
            <ArrowDown className="h-3.5 w-3.5 animate-cue text-[#49686C] dark:text-[#B9D1D4]" />
            Scroll to see how the workflow fits together
          </button>
        </div>
      </section>

      {/* AT A GLANCE */}
      <section aria-label="Vector at a glance" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {GLANCE_STATS.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 80} y={26} className="h-full">
            <div className="lift-card h-full rounded-2xl border border-[#E5E2D8] bg-white/80 p-5 shadow-xs dark:border-[#29383A] dark:bg-white/[0.03]">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#283638] dark:text-[#F2F5F3]">
                <CountUp to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#49686C] dark:text-[#B9D1D4]">
                {stat.label}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#737A72] dark:text-[#9AA6A2]">
                {stat.detail}
              </p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* PROBLEM */}
      <Reveal
        as="section"
        id="problem-section"
        className="scroll-mt-24 bg-white rounded-2xl border border-[#E5E2D8] p-6 sm:p-10 shadow-xs space-y-6"
      >
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-bold text-[#D1B653] uppercase tracking-wider">
            The completeness gap
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#283638] tracking-tight">
            A prompt can look clear and still generate the wrong UI.
          </h2>
          <p className="text-sm text-[#737A72] leading-relaxed">
            UI generators fill the gaps themselves. Missing labels, vague colours and ambiguous
            actions become assumptions in the generated screen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {PROBLEM_CARDS.map((card, index) => (
            <Reveal key={card.title} delay={index * 100} y={28} className="h-full">
              <div className="lift-card h-full p-5 rounded-xl bg-[#FAFAF8] border border-[#E5E2D8] space-y-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconClass}`}>
                  <card.Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#283638]">{card.title}</h3>
                <p className="text-xs text-[#737A72] leading-relaxed">{card.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Reveal>

      {/* WORKFLOW */}
      <section id="workflow-section" className="space-y-8 scroll-mt-24">
        <Reveal className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-bold text-[#49686C] uppercase tracking-wider">
            Diagnostic workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#283638] tracking-tight">
            How Vector works
          </h2>
          <p className="text-sm text-[#737A72]">
            Four stages that turn an ambiguous UI request into a safe, specific prompt.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          <div
            className="pointer-events-none absolute left-[6%] right-[6%] top-[52px] hidden h-px bg-gradient-to-r from-transparent via-[#E5E2D8] to-transparent dark:via-[#29383A] lg:block"
            aria-hidden="true"
          />
          {WORKFLOW_STEPS.map((step, index) => (
            <Reveal key={step.n} delay={index * 100} y={36} className="h-full">
              <div className="lift-card relative h-full bg-white p-5 rounded-xl border border-[#E5E2D8] shadow-xs flex flex-col justify-between overflow-hidden group hover:border-[#49686C] transition-colors">
                <span
                  className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-[#49686C] to-[#D1B653] transition-transform duration-500 group-hover:scale-x-100"
                  aria-hidden="true"
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 ${
                        index === 3 ? 'bg-[#F4F9F1] text-[#3E6B33]' : 'bg-[#F0F5F5] text-[#49686C]'
                      }`}
                    >
                      {step.n}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-[#737A72]">{step.tag}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#283638]">{step.title}</h3>
                  <p className="text-xs text-[#737A72] leading-relaxed">{step.text}</p>
                </div>
                <div
                  className={`pt-4 text-[11px] font-mono ${
                    index === 3 ? 'text-[#3E6B33]' : 'text-[#49686C]'
                  }`}
                >
                  {step.foot}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="advantages-section" className="space-y-6 scroll-mt-24">
        <Reveal className="max-w-2xl space-y-2">
          <div className="text-xs font-bold text-[#49686C] uppercase tracking-wider">
            Why teams choose Vector
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#283638] tracking-tight">
            What makes Vector useful?
          </h2>
          <p className="text-sm text-[#737A72]">
            Built for designers, product teams and engineers who use AI-assisted UI generation.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ADVANTAGES.map((advantage, index) => (
            <Reveal key={advantage.title} delay={index * 80} y={30} className="h-full">
              <div className="lift-card h-full bg-white p-5 rounded-xl border border-[#E5E2D8] shadow-xs space-y-2 group">
                <div className="flex items-center gap-2">
                  <advantage.Icon
                    className={`w-4 h-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-110 ${advantage.iconClass}`}
                  />
                  <h3 className="text-sm font-bold text-[#283638]">{advantage.title}</h3>
                </div>
                <p className="text-xs text-[#737A72] leading-relaxed">{advantage.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HONESTY */}
      <Reveal
        as="section"
        className="bg-white rounded-2xl border border-[#E5E2D8] p-6 sm:p-8 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E2D8]">
          <Cpu className="w-4 h-4 text-[#49686C]" />
          <h2 className="text-base font-bold text-[#283638]">Honest by design</h2>
        </div>

        <div className="space-y-3 text-xs text-[#737A72] leading-relaxed">
          <p>
            Every finding is explainable and tied to the words in your prompt. Values that cannot be
            found in the prompt or in your answers are rejected, never invented.
          </p>
          <p>
            The final prompt is built from the confirmed checklist and placeholders. Nothing is added
            silently: missing colours, locations or actions stay visible as placeholders for a human
            to decide.
          </p>
          <p className="text-[#30494B] font-medium bg-[#F6F4EC] p-3 rounded-lg border border-[#E5E2D8]">
            The risk score is a heuristic, not a guarantee. It highlights missing details and
            uncertainty; it does not replace design review or a human check of the generated UI.
          </p>
        </div>
      </Reveal>

      {/* CTA */}
      <Reveal
        as="section"
        className="relative overflow-hidden rounded-2xl bg-[#30494B] p-8 sm:p-12 text-center text-white space-y-5 shadow-lg"
      >
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
          <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#D1B653] blur-3xl animate-orb-drift" />
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#49686C] blur-3xl animate-orb-drift-slow" />
        </div>
        <div className="max-w-xl mx-auto space-y-3 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Make the missing details visible.
          </h2>
          <p className="text-sm text-gray-200 leading-relaxed">
            Start with the UI you want to build. Review what the prompt left out before generating
            the screen.
          </p>
          <div className="pt-3">
            <button
              type="button"
              onClick={onStartAnalysis}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D1B653] hover:bg-[#bda241] text-[#283638] text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>Start a requirement review</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
          <ClipboardCheck className="w-64 h-64" />
        </div>
      </Reveal>
    </div>
  );
};
