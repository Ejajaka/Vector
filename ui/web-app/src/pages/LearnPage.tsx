import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  Figma,
  Layers,
  Play,
  Rocket,
  ScanLine,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type { ActiveTab } from '../types/analysis.ts';

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

const TABS = ['Get started', 'Prompting', 'Elements', 'Templates', 'Integrations', 'Billing'] as const;
type Tab = (typeof TABS)[number];

const LESSONS: Record<Tab, Lesson[]> = {
  'Get started': [
    { title: 'Your first project in 4 minutes', summary: 'Create a project, write one sentence, and let the analyzer tell you what is missing.', minutes: 4, level: 'Beginner', icon: Compass, from: '#0FA3A3', to: '#4F7DF3' },
    { title: 'A tour of the workspace', summary: 'Home, projects, templates and the prompt studio — where everything lives.', minutes: 3, level: 'Beginner', icon: Play, from: '#FFC53D', to: '#FF8A6B' },
    { title: 'Reading the risk score', summary: 'What 0–100 means, the four components, and when to ignore it.', minutes: 2, level: 'Beginner', icon: ScanLine, from: '#4F7DF3', to: '#8B5CF6' },
    { title: 'Answering clarification questions', summary: 'Why the final prompt is blocked until every gap is resolved.', minutes: 5, level: 'Beginner', icon: Sparkles, from: '#FF6B8A', to: '#8B5CF6' },
  ],
  Prompting: [
    { title: 'The four attributes every button needs', summary: 'Label, action, colour and location — the checklist behind the schema.', minutes: 3, level: 'Beginner', icon: Layers, from: '#0FA3A3', to: '#22C1A6' },
    { title: 'Vague is worse than missing', summary: '“Some nice colour” occupies an attribute without resolving it.', minutes: 4, level: 'Intermediate', icon: ScanLine, from: '#FFC53D', to: '#FF8A6B' },
    { title: 'Why attribute linking matters', summary: 'Two colours, two elements — which one is red?', minutes: 5, level: 'Intermediate', icon: Layers, from: '#4F7DF3', to: '#0FA3A3' },
    { title: 'Building a prompt with blocks', summary: 'Search the palette, click an element, watch the prompt assemble itself.', minutes: 6, level: 'Intermediate', icon: Sparkles, from: '#FF6B8A', to: '#FF8A6B' },
  ],
  Elements: [
    { title: 'The 10 supported elements', summary: 'Button, navbar, input, card, modal, image, dropdown, sidebar, footer, checkbox.', minutes: 5, level: 'Beginner', icon: BookOpen, from: '#4F7DF3', to: '#8B5CF6' },
    { title: 'Customising the schema', summary: 'Add required attributes for your design system (Team plan).', minutes: 7, level: 'Advanced', icon: Layers, from: '#0FA3A3', to: '#4F7DF3' },
  ],
  Templates: [
    { title: 'Using a template without inheriting its opinions', summary: 'Preview the attributes, keep what applies, delete the rest.', minutes: 3, level: 'Beginner', icon: Layers, from: '#8B5CF6', to: '#FF6B8A' },
    { title: 'How a template becomes a prompt', summary: 'Blocks → attributes → prose → score, step by step.', minutes: 4, level: 'Intermediate', icon: Sparkles, from: '#0FA3A3', to: '#4F7DF3' },
  ],
  Integrations: [
    { title: 'From Figma frame to brief', summary: 'Connect Figma, pick a frame, and let Vector describe what it sees.', minutes: 5, level: 'Intermediate', icon: Figma, from: '#0FA3A3', to: '#22C1A6' },
    { title: 'Deploying from Vector', summary: 'Connect a host and ship the build without leaving the app.', minutes: 6, level: 'Advanced', icon: Rocket, from: '#FF6B8A', to: '#8B5CF6' },
  ],
  Billing: [
    { title: 'How the two-project trial works', summary: 'What counts as a project, what happens at zero, how to restore access.', minutes: 2, level: 'Beginner', icon: Wallet, from: '#FFC53D', to: '#FF8A6B' },
    { title: 'Invoices, GST and refunds', summary: 'Where receipts live, what is taxed, and the refund window.', minutes: 3, level: 'Beginner', icon: BookOpen, from: '#4F7DF3', to: '#0FA3A3' },
  ],
};

export const LearnPage: React.FC<LearnPageProps> = ({ onNavigate, onStartTour }) => {
  const [tab, setTab] = useState<Tab>('Get started');
  const lessons = LESSONS[tab];

  return (
    <div className="space-y-6 v-fade-up">
      <section className="v-mesh v-noise rounded-[32px] px-6 sm:px-10 py-9 text-white relative">
        <div className="relative z-10 max-w-xl">
          <p className="text-[10.5px] uppercase tracking-[0.18em] font-semibold text-white/70">Learn</p>
          <h1 className="v-display text-[30px] sm:text-[40px] mt-2">Short lessons, not a manual</h1>
          <p className="mt-2 text-[13px] text-white/75 max-w-md">
            Two to six minutes each, written for people who want to ship a better prompt today.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={onStartTour} className="v-btn bg-white text-[#14121F] h-10 px-5 text-[12.5px]">
              <Play className="w-3.5 h-3.5" /> Start the 60-second tour
            </button>
            <button type="button" onClick={() => onNavigate('templates')} className="v-btn border border-white/30 text-white h-10 px-5 text-[12.5px] hover:bg-white/10">
              Browse templates <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <BookOpen className="hidden lg:block absolute right-10 bottom-6 w-32 h-32 text-white/10" />
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
            <article key={lesson.title} className="v-card v-card-lift rounded-lg p-4 cursor-pointer group">
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
          { title: 'Connect your first tool', body: 'Figma import and one-click deploys.', icon: Figma, tab: 'integrations' as ActiveTab, cta: 'Open' },
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
    </div>
  );
};
