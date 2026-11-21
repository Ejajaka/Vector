import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Clock3,
  Compass,
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { ActiveTab } from '../types/analysis.ts';
import { useProject } from '../context/ProjectContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { TEMPLATES } from '../data/templates.ts';
import { TemplateArt } from '../components/templates/TemplateArt.tsx';
import { FeatureSpotlight } from '../components/onboarding/FeatureSpotlight.tsx';
import {
  TRIAL_PROJECTS,
  isPaid,
  planFor,
  readEntitlements,
  trialRemaining,
  type EntitlementState,
} from '../services/entitlements.ts';

interface DashboardPageProps {
  onNavigate: (tab: ActiveTab) => void;
  onStartNewAnalysis: () => void;
  onStartTour?: () => void;
  onOpenProject?: (id: string, name: string) => void;
}

function firstName(input: string): string {
  return input.replace(/@.*/, '').trim().split(/\s+/)[0] || 'there';
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onStartNewAnalysis, onStartTour, onOpenProject }) => {
  const { projects, selectProject } = useProject();
  const { user } = useAuth();
  const [state, setState] = useState<EntitlementState>(readEntitlements());
  const [query, setQuery] = useState('');

  useEffect(() => {
    const sync = () => setState(readEntitlements());
    window.addEventListener('vector:entitlements', sync);
    return () => window.removeEventListener('vector:entitlements', sync);
  }, []);

  const plan = planFor(state.plan);
  const paid = isPaid(state);
  const remaining = trialRemaining(state);
  const used = Math.min(TRIAL_PROJECTS, state.projectsCreated);

  const name =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    'there';

  const recent = projects.slice(0, 4);
  const explore = TEMPLATES.slice(0, 5);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      onNavigate('templates');
      return;
    }
    const match = TEMPLATES.find(
      (template) =>
        template.name.toLowerCase().includes(query.toLowerCase()) ||
        template.tags.some((tag) => tag.includes(query.toLowerCase()))
    );
    onNavigate(match ? 'templates' : 'projects');
  };

  return (
    <div className="space-y-5 v-fade-up relative">
      {onStartTour && <FeatureSpotlight onStartTour={onStartTour} />}
      {/* Hero */}
      <section className="v-card rounded-xl px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="v-eyebrow">Workspace</p>
            <h1 className="v-display mt-1.5 text-[25px] text-[var(--v-ink)] sm:text-[28px]">
              What will you <span className="text-[var(--v-muted)]">build</span> today?
            </h1>
            <p className="mt-2 max-w-[560px] text-[13px] leading-[1.6] text-[var(--v-muted)]">
              Turn one vague sentence into a complete, scored prompt — with every label, action, colour and placement resolved before you generate.
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-1 rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="rounded bg-[var(--v-surface)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--v-ink)]"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('templates')}
              className="rounded px-2.5 py-1 text-[11.5px] font-medium text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)]"
            >
              Templates
            </button>
          </div>
        </div>

        <form onSubmit={search} className="mt-5 w-full max-w-[560px]">
          <div className="flex items-center gap-2 rounded-md border border-[var(--v-line)] bg-[var(--v-bg)] p-1 pl-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--v-faint)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates, elements or prompt ideas"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--v-ink)] outline-none placeholder:text-[var(--v-faint)]"
            />
            <button type="submit" className="v-btn v-btn-primary h-7 shrink-0 px-3 text-[12px]">
              Start <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] px-2.5 py-1 text-[var(--v-muted)]">
            <Sparkles className="h-3 w-3 text-[var(--v-accent)]" />
            {paid ? `${plan.name} plan active` : `${remaining} of ${TRIAL_PROJECTS} free projects left`}
          </span>
          <button
            type="button"
            onClick={onStartNewAnalysis}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] px-2.5 py-1 text-[var(--v-muted)] transition-colors hover:border-[var(--v-line-strong)] hover:text-[var(--v-ink)]"
          >
            <Wand2 className="h-3 w-3" /> Score a prompt
          </button>
        </div>
      </section>

      {/* Continue */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="v-eyebrow">Continue</p>
            <h2 className="v-display text-[18px] mt-0.5">Pick up where you left off</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="text-[12px] font-semibold text-[var(--v-violet)] hover:underline"
          >
            All projects
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="v-card v-card-lift flex min-h-[124px] flex-col items-start justify-between rounded-lg border-dashed bg-[var(--v-surface-2)] p-3.5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--v-accent-soft)] text-[var(--v-accent-hover)]">
              <Plus className="w-5 h-5" />
            </span>
            <div className="text-left">
              <p className="text-[14px] font-semibold text-[var(--v-ink)]">New project</p>
              <p className="mt-0.5 text-[11.5px] text-[var(--v-muted)]">
                {paid ? 'Unlimited on your plan' : `${remaining} free left`}
              </p>
            </div>
          </button>

          {recent.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                if (onOpenProject) onOpenProject(project.id, project.name);
                else { selectProject(project.id); onNavigate('projects'); }
              }}
              className="v-card v-card-lift group overflow-hidden rounded-lg text-left"
            >
              <div className="relative h-[74px] bg-[var(--v-surface-2)]">
                <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,rgba(113,112,255,.14),transparent_60%)]" />
                <span className="absolute bottom-2 left-2.5 text-[17px] font-semibold tracking-[-0.02em] text-[var(--v-ink)]">
                  {project.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="absolute top-2 right-2 w-5 h-5 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)]/70 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-3 h-3 text-[var(--v-ink)]" />
                </span>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-semibold text-[var(--v-ink)] truncate">{project.name}</p>
                <p className="mt-0.5 text-[9.5px] text-[var(--v-muted)] flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </button>
          ))}

          {recent.length === 0 && (
            <div className="v-card col-span-2 flex flex-col justify-center rounded-lg p-5 sm:col-span-2 xl:col-span-3">
              <p className="text-[14px] font-semibold text-[var(--v-ink)]">No projects yet</p>
              <p className="mt-1 text-[12px] text-[var(--v-muted)] max-w-md">
                Start from a template — it pre-fills every required attribute so your first prompt is already complete.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('templates')}
                className="mt-3 self-start v-btn v-btn-dark h-9 px-4 text-[12px]"
              >
                Browse templates
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Explore templates */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="v-eyebrow">Templates</p>
            <h2 className="v-display text-[18px] mt-0.5">Start from something real</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('templates')}
            className="text-[12px] font-semibold text-[var(--v-violet)] hover:underline"
          >
            Explore all
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {explore.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onNavigate('templates')}
              className="group text-left"
            >
              <div
                className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-bg)] transition-transform duration-500 group-hover:-translate-y-0.5"
              >
                <TemplateArt template={template} />
                <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-[#0B0E14]/75 py-1 text-center text-[9px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Open in editor
                </span>
              </div>
              <p className="mt-1.5 truncate text-[11px] font-semibold text-[var(--v-ink)]">{template.name}</p>
              <p className="text-[9.5px] text-[var(--v-faint)]">{template.category}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Learn strip */}
      <section className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <div className="v-card flex flex-col gap-4 rounded-lg p-5 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] text-[var(--v-accent-hover)]">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-[var(--v-ink)]">New here? Take the 60-second tour</p>
            <p className="mt-0.5 text-[11.5px] text-[var(--v-muted)]">
              Five short steps covering projects, templates, the block palette and the risk score.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('learn')}
            className="v-btn v-btn-ghost h-9 px-4 text-[12px] shrink-0"
          >
            Open Learn
          </button>
        </div>

        <div className="v-card rounded-lg p-5 flex items-center gap-4">
          <span className="w-11 h-11 rounded-lg bg-[var(--v-surface-2)] grid place-items-center shrink-0">
            <Compass className="w-5 h-5 text-[var(--v-muted)]" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-[var(--v-ink)]">
              {paid ? `${plan.name} plan` : `${used}/${TRIAL_PROJECTS} free projects used`}
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-[var(--v-surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full v-grad transition-all duration-500"
                style={{ width: `${paid ? 100 : Math.max(6, (used / TRIAL_PROJECTS) * 100)}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('pricing')}
            className="v-btn v-btn-dark h-9 px-4 text-[12px] shrink-0"
          >
            {paid ? 'Manage' : 'Upgrade'}
          </button>
        </div>
      </section>
    </div>
  );
};
