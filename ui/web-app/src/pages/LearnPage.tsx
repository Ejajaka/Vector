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
}

const TABS = ['Get started', 'Prompting', 'Elements', 'Templates', 'Billing'] as const;
type Tab = (typeof TABS)[number];

const LESSONS: Record<Tab, Lesson[]> = {
  'Get started': [
    { title: 'Your first project in 4 minutes', summary: 'Create a project, write one sentence, and let the analyzer tell you what is missing.', minutes: 4, level: 'Beginner', icon: Compass, from: '#5E6AD2', to: '#4F7DF3' },
    { title: 'A tour of the workspace', summary: 'Home, projects, templates and the prompt studio — where everything lives.', minutes: 3, level: 'Beginner', icon: Play, from: '#FFC53D', to: '#FF8A6B' },
    { title: 'Reading the risk score', summary: 'What 0–100 means, the four components, and when to ignore it.', minutes: 2, level: 'Beginner', icon: ScanLine, from: '#4F7DF3', to: '#8B5CF6' },
    { title: 'Answering clarification questions', summary: 'Why the final prompt is blocked until every gap is resolved.', minutes: 5, level: 'Beginner', icon: Sparkles, from: '#FF6B8A', to: '#8B5CF6' },
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
    action: { label: 'Open projects', tab: 'projects' },
  },
  Prompting: {
    intro: 'A prompt is just a clear description of what should appear, what it does, and when it changes.',
    steps: [
      'Open a project and choose Prompt mode.',
      'Describe the screen the way you would explain it to a teammate.',
      'Answer the short questions the analyser asks.',
      'Copy the finished prompt into Base44, v0, Bolt or Figma.',
    ],
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
          <button type="button" onClick={() => onNavigate('templates')} className="v-btn h-8 px-3 text-[12px]">
            Browse templates <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
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
          guide={GUIDES[tab]}
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
