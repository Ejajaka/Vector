import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Clock3,
  Compass,
  GraduationCap,
  LayoutTemplate,
  Plus,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { ActiveTab } from '../types/analysis.ts';
import { useProject } from '../context/ProjectContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { TEMPLATE_CATEGORIES, TEMPLATES } from '../data/templates.ts';
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

const CATEGORY_STYLES: Record<string, { from: string; to: string }> = {
  All: { from: '#00b8cc', to: '#7170ff' },
  Dashboard: { from: '#7170ff', to: '#8b7bff' },
  Marketing: { from: '#d46ec0', to: '#8b7bff' },
  Commerce: { from: '#f2c94c', to: '#fc7840' },
  Auth: { from: '#8b7bff', to: '#4ea7fc' },
  Mobile: { from: '#00b8cc', to: '#4cc38a' },
  Data: { from: '#4ea7fc', to: '#00b8cc' },
  Collaboration: { from: '#fc7840', to: '#d46ec0' },
};

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
      <section className="v-mesh v-noise rounded-3xl px-5 sm:px-8 lg:px-10 py-7 sm:py-9 text-white">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1 p-0.5 rounded-full border border-[var(--v-line)] bg-[var(--v-surface)]/70">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-3.5 py-1.5 rounded-full bg-[#e5e5e6] text-[#08090a] text-[12px] font-medium"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('templates')}
              className="px-3.5 py-1.5 rounded-full text-[var(--v-muted)] text-[12px] font-medium hover:text-[var(--v-ink)] transition-colors"
            >
              Templates
            </button>
          </div>

          <h1 className="v-display mt-4 text-[28px] sm:text-[34px] lg:text-[40px] max-w-[18ch]">
            What will you <span className="text-[var(--v-muted)]">build</span> today?
          </h1>
          <p className="mt-2 text-[12px] sm:text-[13px] text-[var(--v-muted)] max-w-md">
            Turn one vague sentence into a complete, scored prompt — with every label, action, colour and placement resolved before you generate.
          </p>

          <form onSubmit={search} className="mt-5 w-full max-w-[520px]">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-1 pl-3 shadow-[0_20px_60px_-30px_rgba(0,0,0,.8)]">
              <Search className="w-4 h-4 text-[var(--v-faint)] shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search templates, elements or prompt ideas"
                className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-[var(--v-ink)] placeholder:text-[var(--v-faint)]"
              />
              <button type="submit" className="v-btn v-btn-primary h-8 px-4 text-[12.5px] shrink-0">
                Start <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11.5px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--v-surface-2)] border border-[var(--v-line)] text-[var(--v-muted)]">
              <Sparkles className="w-3 h-3 text-[var(--v-accent)]" />
              {paid ? `${plan.name} plan active` : `${remaining} of ${TRIAL_PROJECTS} free projects left`}
            </span>
            <button
              type="button"
              onClick={onStartNewAnalysis}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--v-surface-2)] border border-[var(--v-line)] text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)] hover:border-[var(--v-line-strong)]"
            >
              <Wand2 className="w-3 h-3" /> Score a prompt
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="v-eyebrow">Browse by</p>
            <h2 className="v-display text-[18px] mt-0.5">Pick a starting shape</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('templates')}
            className="text-[12px] font-bold text-[var(--v-violet)] hover:underline"
          >
            See all templates
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto v-scroll pb-2">
          {TEMPLATE_CATEGORIES.filter((category) => category !== 'All').map((category) => {
            const tone = CATEGORY_STYLES[category] || CATEGORY_STYLES.All;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onNavigate('templates')}
                className="group flex flex-col items-center gap-2 shrink-0 w-[86px]"
              >
                <span
                  className="w-[44px] h-[44px] rounded-lg border border-[var(--v-line)] grid place-items-center transition-colors group-hover:border-[var(--v-line-strong)]"
                  style={{ backgroundColor: `${tone.from}14`, color: tone.from }}
                >
                  <LayoutTemplate className="w-[18px] h-[18px]" />
                </span>
                <span className="text-[11px] font-medium text-[var(--v-muted)] group-hover:text-[var(--v-ink)] transition-colors">
                  {category}
                </span>
              </button>
            );
          })}
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
            className="text-[12px] font-bold text-[var(--v-violet)] hover:underline"
          >
            All projects
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="v-card v-card-lift rounded-2xl p-3.5 flex flex-col items-start justify-between min-h-[132px] border-dashed bg-[var(--v-surface-2)]"
          >
            <span className="w-10 h-10 rounded-2xl v-grad text-white grid place-items-center shadow-[0_10px_24px_-14px_rgba(79,125,243,.9)]">
              <Plus className="w-5 h-5" />
            </span>
            <div className="text-left">
              <p className="text-[14px] font-bold text-[var(--v-ink)]">New project</p>
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
              className="v-card v-card-lift rounded-2xl overflow-hidden text-left group"
            >
              <div
                className="h-[74px] relative"
                style={{
                  backgroundImage: `linear-gradient(140deg, ${
                    CATEGORY_STYLES[Object.keys(CATEGORY_STYLES)[(project.name.length % 6) + 1]]?.from || '#7170ff'
                  }26, ${
                    CATEGORY_STYLES[Object.keys(CATEGORY_STYLES)[(project.name.length % 6) + 1]]?.to || '#4ea7fc'
                  }14)`,
                }}
              >
                <div className="absolute inset-0 bg-[var(--v-surface)]/30" />
                <span className="absolute bottom-2 left-2.5 text-[17px] font-semibold tracking-[-0.02em] text-[var(--v-ink)]">
                  {project.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="absolute top-2 right-2 w-5 h-5 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)]/70 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-3 h-3 text-[var(--v-ink)]" />
                </span>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-bold text-[var(--v-ink)] truncate">{project.name}</p>
                <p className="mt-0.5 text-[9.5px] text-[var(--v-muted)] flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </button>
          ))}

          {recent.length === 0 && (
            <div className="col-span-2 sm:col-span-2 xl:col-span-3 v-card rounded-2xl p-5 flex flex-col justify-center">
              <p className="text-[14px] font-bold text-[var(--v-ink)]">No projects yet</p>
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
            className="text-[12px] font-bold text-[var(--v-violet)] hover:underline"
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
                className="aspect-[4/3] rounded-xl overflow-hidden relative border border-[var(--v-line)] group-hover:-translate-y-0.5 transition-transform duration-500"
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

      {/* Learn strip */}
      <section className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <div className="v-card rounded-[24px] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="w-11 h-11 rounded-2xl v-grad-warm text-white grid place-items-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-bold text-[var(--v-ink)]">New here? Take the 60-second tour</p>
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

        <div className="v-card rounded-[24px] p-5 flex items-center gap-4">
          <span className="w-11 h-11 rounded-2xl bg-[var(--v-surface-2)] grid place-items-center shrink-0">
            <Compass className="w-5 h-5 text-[var(--v-muted)]" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-bold text-[var(--v-ink)]">
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
