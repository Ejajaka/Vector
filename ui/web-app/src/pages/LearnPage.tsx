import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  Layers,
  Play,
  ScanLine,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type { ActiveTab } from '../types/analysis.ts';
import { LessonDialog, type LessonGuide } from '../components/learn/LessonDialog.tsx';

interface LearnPageProps {
  onNavigate: (tab: ActiveTab) => void;
  onStartTour: () => void;
}

interface Lesson {
  title: string;
  summary: string;
  minutes: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: React.ElementType;
  from: string;
  to: string;
  guide?: LessonGuide;
}

const TABS = ['Get started', 'Workflows', 'Prompting', 'Elements', 'Templates', 'Billing'] as const;
type Tab = (typeof TABS)[number];

const DOCUMENT_WORKFLOW_GUIDE: LessonGuide = {
  intro:
    'Use this when a company or client gives you a brief, a requirements document or a product spec. The document is the source of truth; Vector turns it into traceable requirements, findings, acceptance criteria and a build-ready prompt.',
  steps: [
    'Create the project in Projects and name it after the client and product. Start blank unless a template genuinely matches their product.',
    'Open Project tools → Requirements. Upload the client document (PDF, DOCX, TXT or Markdown). Wait for the parsed state and check the page count.',
    'Read the extracted requirements. Each one keeps its page, paragraph and character reference. Approve what is in scope, reject what is not, and run Prioritize.',
    'Open Requirement graph. Work through conflicts, dependency links and ambiguities. Every finding quotes the requirement code, so send those exact codes back to the client for a decision.',
    'Open Review & acceptance. Accept or reject the inferred behaviours, then approve the acceptance criteria. Criteria stay linked to requirement codes and become the test plan.',
    'Attach the client design system. Import their token JSON, or create one from their brand colours. If they have no formal system, choose a domain preset, then edit the four colours and typeface.',
    'Open Canvas. Build or adjust the screens with palette blocks. Every button needs a label, an action, a colour and a location; every input needs validation and error behaviour.',
    'Select elements and add Behaviour notes for interactions the document leaves implicit. Notes are written into the prompt under INTERACTIONS, not kept as loose comments.',
    'Open Prompt studio and choose the canvas or analysis source. Read the six-section brief end to end. If a question is still open, answer it in Prompt mode before copying.',
    'Open Prompt analyser. Check risk, readiness, open questions and quality issues. Resolve the high-severity items; do not treat a low risk score as approval.',
    'Open the Base44 builder, sign in or sign up with email and password, paste the prompt and build. Publish the app, then save the published URL for the Live app preview.',
    'Final gate: requirements approved, criteria approved, conflicts resolved, design tokens applied, prompt copied, live URL saved. Export the ZIP or share the project link with the client.',
  ],
  demo: 'project',
  action: { label: 'Open Requirements', tab: 'requirements' },
};

const SOLO_WORKFLOW_GUIDE: LessonGuide = {
  intro:
    'Use this when there is no company document. You are the source of truth: the canvas, the prompt, the design system and the project tools are how you turn an idea into a complete, buildable brief.',
  steps: [
    'Create a project from Projects → New project. Answer the three setup questions so Vector suggests templates that match the purpose and features.',
    'Pick a template or a blank canvas. Templates are starting points, not requirements; delete anything that does not belong to your product.',
    'Open Design systems and choose a domain colour combination that fits, or create your own. Save and apply it so the canvas background, text, buttons and cards all use the same tokens.',
    'Open Canvas and place the core blocks: navigation, hero or page header, primary content, empty state, form or table, and the main action. Use the palette rather than describing the layout in prose.',
    'Give every element a label, a concrete action and a colour. Add validation, loading, empty, error and success states where the interaction needs them.',
    'Use Behaviour notes on every interactive element. Write what happens on click, failure, retry, duplicate submission, permission denial and small screens.',
    'Open Prompt mode and write one plain sentence about the screen. Answer the clarification questions; the prompt remains a draft until the blocking gaps are resolved.',
    'Open Project tools → Design systems to confirm the tokens, Prompt studio to read the six-section brief, and Prompt analyser to check risk and readiness.',
    'Use the Prompt analyser’s open questions and quality issues as your checklist. If you later get a client document, upload it in Requirements; the graph, review and acceptance criteria will switch to that document.',
    'Copy the finished prompt into Base44, v0, Bolt or Lovable. Build and publish the app, then save the published URL in the Live app tab.',
    'Return to the project and iterate with prompt versions and behaviour notes. Share the project link or export the ZIP when the build is ready for review.',
  ],
  demo: 'elements',
  action: { label: 'Open projects', tab: 'projects' },
};

const LESSONS: Record<Tab, Lesson[]> = {
  'Get started': [
    { title: 'Your first project in 4 minutes', summary: 'Create a project, write one sentence, and let the analyzer tell you what is missing.', minutes: 4, level: 'Beginner', icon: Compass, from: '#5E6AD2', to: '#4F7DF3' },
    { title: 'A tour of the workspace', summary: 'Home, projects, templates and the prompt studio — where everything lives.', minutes: 3, level: 'Beginner', icon: Play, from: '#FFC53D', to: '#FF8A6B' },
    { title: 'Reading the risk score', summary: 'What 0–100 means, the four components, and when to ignore it.', minutes: 2, level: 'Beginner', icon: ScanLine, from: '#4F7DF3', to: '#8B5CF6' },
    { title: 'Answering clarification questions', summary: 'Why the final prompt is blocked until every gap is resolved.', minutes: 5, level: 'Beginner', icon: Sparkles, from: '#FF6B8A', to: '#8B5CF6' },
  ],
  Workflows: [
    {
      title: 'Company or client document to a complete build',
      summary: 'Upload the brief, trace requirements, resolve findings, approve acceptance criteria, apply the design system, then build.',
      minutes: 10,
      level: 'Advanced',
      icon: BookOpen,
      from: '#5E6AD2',
      to: '#22D3EE',
      guide: DOCUMENT_WORKFLOW_GUIDE,
    },
    {
      title: 'No document? Build the whole project from scratch',
      summary: 'Use templates, the canvas, behaviour notes, the design system and every project tool when you are creating on your own.',
      minutes: 9,
      level: 'Intermediate',
      icon: Sparkles,
      from: '#FF6B8A',
      to: '#8B5CF6',
      guide: SOLO_WORKFLOW_GUIDE,
    },
  ],
  Prompting: [
    { title: 'The four attributes every button needs', summary: 'Label, action, colour and location — the checklist behind the schema.', minutes: 3, level: 'Beginner', icon: Layers, from: '#5E6AD2', to: '#A78BFA' },
    { title: 'Vague is worse than missing', summary: '“Some nice colour” occupies an attribute without resolving it.', minutes: 4, level: 'Intermediate', icon: ScanLine, from: '#FFC53D', to: '#FF8A6B' },
    { title: 'Why attribute linking matters', summary: 'Two colours, two elements — which one is red?', minutes: 5, level: 'Intermediate', icon: Layers, from: '#4F7DF3', to: '#5E6AD2' },
    { title: 'Building a prompt with blocks', summary: 'Search the palette, click an element, watch the prompt assemble itself.', minutes: 6, level: 'Intermediate', icon: Sparkles, from: '#FF6B8A', to: '#FF8A6B' },
  ],
  Elements: [
    { title: 'The 10 supported elements', summary: 'Button, navbar, input, card, modal, image, dropdown, sidebar, footer, checkbox.', minutes: 5, level: 'Beginner', icon: BookOpen, from: '#4F7DF3', to: '#8B5CF6' },
    { title: 'Customising the schema', summary: 'Add required attributes for your design system (Pro plan).', minutes: 7, level: 'Advanced', icon: Layers, from: '#5E6AD2', to: '#4F7DF3' },
  ],
  Templates: [
    { title: 'Using a template without inheriting its opinions', summary: 'Preview the attributes, keep what applies, delete the rest.', minutes: 3, level: 'Beginner', icon: Layers, from: '#8B5CF6', to: '#FF6B8A' },
    { title: 'How a template becomes a prompt', summary: 'Blocks → attributes → prose → score, step by step.', minutes: 4, level: 'Intermediate', icon: Sparkles, from: '#5E6AD2', to: '#4F7DF3' },
  ],
  Billing: [
    { title: 'How the two-project trial works', summary: 'What counts as a project, what happens at zero, how to restore access.', minutes: 2, level: 'Beginner', icon: Wallet, from: '#FFC53D', to: '#FF8A6B' },
    { title: 'Invoices, GST and refunds', summary: 'Where receipts live, what is taxed, and the refund window.', minutes: 3, level: 'Beginner', icon: BookOpen, from: '#4F7DF3', to: '#5E6AD2' },
  ],
};


const GUIDES: Record<Tab, LessonGuide> = {
  'Get started': {
    intro: 'A project is one workspace for one screen or flow. Everything you write, review and generate stays inside it.',
    steps: [
      'Open Projects and choose New project.',
      'Pick a template, or start with a blank canvas.',
      'Write one plain sentence about the screen you want.',
      'Read the questions, answer them, then generate the prompt.',
    ],
    demo: 'project',
    action: { label: 'Open projects', tab: 'projects' },
  },
  Workflows: DOCUMENT_WORKFLOW_GUIDE,
  Prompting: {
    intro: 'A prompt is just a clear description of what should appear, what it does, and when it changes.',
    steps: [
      'Open a project and choose Prompt mode.',
      'Describe the screen the way you would explain it to a teammate.',
      'Answer the short questions the analyser asks.',
      'Copy the finished prompt into Base44, v0, Bolt or Figma.',
    ],
    demo: 'prompt',
    action: { label: 'Try the analyser', tab: 'new-analysis' },
  },
  Elements: {
    intro: 'An element is one piece of the screen: a button, card, input, table or menu.',
    steps: [
      'Open the canvas editor.',
      'Choose an element type from the palette.',
      'Give it a label, an action and a colour.',
      'Check the empty, loading and error states.',
    ],
    demo: 'elements',
    action: { label: 'Open projects', tab: 'projects' },
  },
  Templates: {
    intro: 'A template is a ready-made set of blocks. You keep the useful parts and delete the rest.',
    steps: [
      'Open Templates.',
      'Preview a template to see every block and attribute.',
      'Choose Open to create a project already filled in.',
      'Edit only the blocks that do not apply to you.',
    ],
    demo: 'templates',
    action: { label: 'Browse templates', tab: 'templates' },
  },
  Billing: {
    intro: 'Two full projects are free. Pro is ?199 per month or ?1,990 per year, and you can cancel any time.',
    steps: [
      'Open Plans and pricing from the account menu.',
      'Choose Pro and pick monthly or yearly.',
      'Pay through Razorpay. The plan activates after verification.',
      'Find receipts under Settings when you need them.',
    ],
    demo: 'billing',
    action: { label: 'See plans', tab: 'pricing' },
  },
};

export const LearnPage: React.FC<LearnPageProps> = ({ onNavigate, onStartTour }) => {
  const [tab, setTab] = useState<Tab>('Get started');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const lessons = LESSONS[tab];

  return (
    <div className="space-y-6 v-fade-up">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="v-eyebrow">Learn</p>
          <h1 className="v-display mt-1 text-[26px] text-[var(--v-ink)]">Short lessons, not a manual</h1>
          <p className="mt-1 max-w-[620px] text-[13px] text-[var(--v-muted)]">
            Two to six minutes each, written for people who want to ship a better prompt today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onStartTour} className="v-btn v-btn-primary h-8 px-3 text-[12px]">
            <Play className="h-3.5 w-3.5" /> Start the tour
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('vector:start-guide'))}
            className="v-btn h-8 px-3 text-[12px]"
          >
            <Sparkles className="h-3.5 w-3.5" /> Guided setup
          </button>
          <button type="button" onClick={() => onNavigate('templates')} className="v-btn h-8 px-3 text-[12px]">
            Browse templates <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {LESSONS.Workflows.map((lesson, index) => (
          <button
            key={lesson.title}
            type="button"
            onClick={() => {
              setTab('Workflows');
              setActiveLesson(lesson);
            }}
            className="v-card v-card-lift rounded-lg p-4 text-left"
          >
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--v-faint)]">
              Complete workflow {index === 0 ? 'A' : 'B'}
            </span>
            <h3 className="mt-1 text-[13px] font-semibold text-[var(--v-ink)]">{lesson.title}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--v-muted)]">{lesson.summary}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-semibold text-[var(--v-violet)]">
              Open step-by-step guide <ArrowRight className="h-3 w-3" />
            </span>
          </button>
        ))}
      </section>

      <div className="flex items-center gap-2 overflow-x-auto v-scroll pb-1">
        {TABS.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className="v-chip" data-active={tab === item}>
            {item}
          </button>
        ))}
      </div>

      <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {lessons.map((lesson) => {
          const Icon = lesson.icon;
          return (
            <article
              key={lesson.title}
              role="button"
              tabIndex={0}
              onClick={() => setActiveLesson(lesson)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActiveLesson(lesson); } }}
              className="v-card v-card-lift rounded-lg p-4 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[var(--v-violet)]"
            >
              <div className="flex items-start justify-between">
                <span
                  className="w-11 h-11 rounded-lg grid place-items-center text-white"
                  style={{ backgroundImage: `linear-gradient(140deg, ${lesson.from}, ${lesson.to})` }}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--v-faint)]">{lesson.level}</span>
              </div>
              <h3 className="mt-3 text-[13px] font-semibold text-[var(--v-ink)] leading-snug">{lesson.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--v-muted)] line-clamp-2">{lesson.summary}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--v-faint)]">
                  <Clock3 className="w-3 h-3" /> {lesson.minutes} min
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[var(--v-violet)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Read <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[
          { title: 'Watch the walkthrough', body: 'Two minutes, narrated, whole flow.', icon: Play, tab: 'learn' as ActiveTab, cta: 'Watch' },
          { title: 'Start from a template', body: 'Preview a screen, then open it in the editor.', icon: Layers, tab: 'templates' as ActiveTab, cta: 'Browse' },
          { title: 'Pick a plan when ready', body: 'Two projects free, no card.', icon: Wallet, tab: 'pricing' as ActiveTab, cta: 'Compare' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="v-card rounded-lg p-4">
              <Icon className="w-4 h-4 text-[var(--v-violet)]" />
              <p className="mt-2 text-[12.5px] font-semibold text-[var(--v-ink)]">{card.title}</p>
              <p className="mt-0.5 text-[10.5px] text-[var(--v-muted)]">{card.body}</p>
              <button type="button" onClick={() => onNavigate(card.tab)} className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-semibold text-[var(--v-violet)] hover:underline">
                {card.cta} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </section>

      <section className="v-card rounded-lg p-4 flex items-center gap-3">
        <CheckCircle2 className="w-4 h-4 text-[var(--v-teal)] shrink-0" />
        <p className="text-[11px] text-[var(--v-muted)]">
          Looking for the old step-by-step manual? It still exists, but this page is the faster path.
        </p>
        <button type="button" onClick={() => onNavigate('manual')} className="ml-auto text-[10.5px] font-semibold text-[var(--v-violet)] hover:underline shrink-0">
          Open manual
        </button>
      </section>

      {activeLesson && (
        <LessonDialog
          lesson={activeLesson}
          guide={activeLesson.guide ?? GUIDES[tab]}
          onClose={() => setActiveLesson(null)}
          onTry={(target) => {
            setActiveLesson(null);
            onNavigate(target);
          }}
        />
      )}
    </div>
  );
};
