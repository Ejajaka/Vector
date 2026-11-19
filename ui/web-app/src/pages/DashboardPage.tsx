import React, { useState } from 'react';
import {
  ArrowUpRight,
  Clock3,
  FolderKanban,
  History,
  LayoutTemplate,
  Plus,
  Sparkles,
} from 'lucide-react';
import type { ActiveTab, AnalysisResult } from '../types/analysis.ts';
import { useProject } from '../context/ProjectContext.tsx';
import { TEMPLATES } from '../data/templates.ts';
import { TemplateArt } from '../components/templates/TemplateArt.tsx';
import { historyStorage } from '../services/historyStorage.ts';
import { TRIAL_PROJECTS, isPaid, readEntitlements, trialRemaining } from '../services/entitlements.ts';

interface DashboardPageProps {
  onNavigate: (tab: ActiveTab) => void;
  onStartNewAnalysis: (prompt?: string) => void;
  onStartTour?: () => void;
  onOpenProject?: (id: string, name: string) => void;
  onOpenAnalysis?: (item: AnalysisResult) => void;
}

const EXAMPLES = [
  'Add a red button at the top right labelled "Sign Up".',
  'Build a pricing page with three plans and a monthly toggle.',
  'Create a login form and a forgot-password link.',
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onStartNewAnalysis,
  onOpenProject,
  onOpenAnalysis,
}) => {
  const { projects, currentProject } = useProject();
  const [prompt, setPrompt] = useState('');
  const entitlements = readEntitlements();
  const remaining = trialRemaining(entitlements);
  const paid = isPaid(entitlements);

  const recentProjects = projects.slice(0, 4);
  const recentAnalyses = historyStorage
    .filterAndSort({ projectId: currentProject?.id, sortBy: 'date_desc' })
    .slice(0, 4);
  const templates = TEMPLATES.slice(0, 4);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onStartNewAnalysis(prompt.trim());
  };

  return (
    <div className="space-y-6 v-fade-up">
      <section className="v-mesh v-noise rounded-3xl px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-10">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold">
            <Sparkles className="h-3 w-3 text-[#FFD98A]" />
            Prompt completeness check
          </span>
          <h1 className="v-display mt-4 text-[30px] leading-tight sm:text-[38px]">
            Find the gaps before you <span className="italic text-[#FFD98A]">generate</span>.
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/75 sm:text-[13.5px]">
            Paste a UI prompt. Vector detects each element, points out what is missing or vague,
            and gives you a clearer prompt to use instead.
          </p>

          <form onSubmit={submit} className="mx-auto mt-6 w-full max-w-2xl">
            <div className="rounded-2xl bg-white p-2 shadow-[0_24px_60px_-28px_rgba(0,0,0,.7)]">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={3}
                placeholder='e.g. Add a red button at the top right labelled "Sign Up" that opens the signup form.'
                className="w-full resize-none bg-transparent px-3 py-2 text-[14px] leading-relaxed text-[#14121F] outline-none placeholder:text-[#8B8798]"
              />
              <div className="flex flex-col gap-2 border-t border-[#ECE9F2] px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="px-1 text-[10.5px] text-[#8B8798]">
                  {currentProject ? `Saving to ${currentProject.name}` : 'Runs locally. No account needed.'}
                </span>
                <button type="submit" className="v-btn v-btn-primary h-10 px-5 text-[12.5px]">
                  Analyse prompt <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10.5px] text-white/55">Try an example:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="max-w-[280px] truncate rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10.5px] text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                title={example}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="v-orb -bottom-24 -right-10 h-[280px] w-[280px] bg-[#FFC53D]/40" aria-hidden="true" />
        <div className="v-orb -left-16 top-0 h-[220px] w-[220px] bg-[#0FA3A3]/50" aria-hidden="true" />
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onStartNewAnalysis()}
          className="v-card v-card-lift flex items-center gap-3 rounded-2xl p-4 text-left"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl v-grad text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[12.5px] font-bold text-[var(--v-ink)]">Analyse a prompt</span>
            <span className="block text-[10.5px] text-[var(--v-muted)]">Start with one clear action</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('templates')}
          className="v-card v-card-lift flex items-center gap-3 rounded-2xl p-4 text-left"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--v-surface-2)] text-[var(--v-violet)]">
            <LayoutTemplate className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[12.5px] font-bold text-[var(--v-ink)]">Start from a template</span>
            <span className="block text-[10.5px] text-[var(--v-muted)]">Pre-filled, editable examples</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('history')}
          className="v-card v-card-lift flex items-center gap-3 rounded-2xl p-4 text-left"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--v-surface-2)] text-[var(--v-muted)]">
            <History className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[12.5px] font-bold text-[var(--v-ink)]">Open history</span>
            <span className="block text-[10.5px] text-[var(--v-muted)]">Return to a previous analysis</span>
          </span>
        </button>
      </div>

      {recentAnalyses.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="v-eyebrow">Recent</p>
              <h2 className="v-display mt-0.5 text-[18px]">Your last analyses</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-[12px] font-bold text-[var(--v-violet)] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recentAnalyses.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenAnalysis?.(item)}
                className="v-card v-card-lift rounded-2xl p-3.5 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-faint)]">
                    {item.riskLevel} risk
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[var(--v-ink)]">{item.riskScore}/100</span>
                </div>
                <p className="mt-2 line-clamp-2 min-h-[34px] text-[12px] font-semibold leading-snug text-[var(--v-ink)]">
                  {item.prompt}
                </p>
                <p className="mt-2 flex items-center gap-1 text-[9.5px] text-[var(--v-faint)]">
                  <Clock3 className="h-3 w-3" />
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Saved analysis'}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="v-eyebrow">Projects</p>
            <h2 className="v-display mt-0.5 text-[18px]">Keep work together</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="text-[12px] font-bold text-[var(--v-violet)] hover:underline"
          >
            All projects
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="v-card v-card-lift flex min-h-[118px] flex-col items-start justify-between rounded-2xl border-dashed bg-[var(--v-surface-2)] p-3.5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl v-grad text-white">
              <Plus className="h-4 w-4" />
            </span>
            <div className="text-left">
              <p className="text-[13px] font-bold text-[var(--v-ink)]">New project</p>
              <p className="mt-0.5 text-[10.5px] text-[var(--v-muted)]">
                {paid ? 'Unlimited on your plan' : `${remaining} of ${TRIAL_PROJECTS} free left`}
              </p>
            </div>
          </button>

          {recentProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                if (onOpenProject) onOpenProject(project.id, project.name);
                else onNavigate('projects');
              }}
              className="v-card v-card-lift overflow-hidden rounded-2xl text-left"
            >
              <div className="relative h-[62px] bg-[linear-gradient(140deg,#4F7DF3,#8B5CF6)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)] opacity-25" />
                <FolderKanban className="absolute bottom-2 left-2.5 h-4 w-4 text-white/90" />
              </div>
              <div className="p-2.5">
                <p className="truncate text-[11px] font-bold text-[var(--v-ink)]">{project.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[9.5px] text-[var(--v-muted)]">
                  <Clock3 className="h-3 w-3" />
                  {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}

          {recentProjects.length === 0 && (
            <div className="v-card col-span-2 flex flex-col justify-center rounded-2xl p-5 sm:col-span-2 xl:col-span-3">
              <p className="text-[13px] font-bold text-[var(--v-ink)]">No projects yet</p>
              <p className="mt-1 max-w-md text-[11.5px] text-[var(--v-muted)]">
                You can analyse a prompt without one. Projects simply keep saved analyses and documents together.
              </p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="v-eyebrow">Templates</p>
            <h2 className="v-display mt-0.5 text-[18px]">Start from something real</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('templates')}
            className="text-[12px] font-bold text-[var(--v-violet)] hover:underline"
          >
            Explore all
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {templates.map((template) => (
            <button key={template.id} type="button" onClick={() => onNavigate('templates')} className="group text-left">
              <div
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--v-line)] transition-transform duration-500 group-hover:-translate-y-0.5"
                style={{ backgroundImage: `linear-gradient(160deg, ${template.palette[0]}, ${template.palette[1]})` }}
              >
                <TemplateArt template={template} />
                <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-[#0B0E14]/75 py-1 text-center text-[9px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Open in editor
                </span>
              </div>
              <p className="mt-1.5 truncate text-[11px] font-bold text-[var(--v-ink)]">{template.name}</p>
              <p className="text-[9.5px] text-[var(--v-faint)]">{template.category}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
