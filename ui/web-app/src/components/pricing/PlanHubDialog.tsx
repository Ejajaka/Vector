import React from 'react';
import { ArrowRight, Check, FolderKanban, LayoutTemplate, Plug, Users, X } from 'lucide-react';
import {
  TRIAL_PROJECTS,
  isPaid,
  planFor,
  readEntitlements,
  trialRemaining,
} from '../../services/entitlements.ts';

export type PlanHubTab = 'included' | 'usage';

interface PlanHubDialogProps {
  open: boolean;
  initialTab?: PlanHubTab;
  onClose: () => void;
  onSeePlans: () => void;
}

function readProjectCount(): number {
  try {
    const raw = localStorage.getItem('vector_projects_v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function usagePercent(used: number, limit: number | null): number {
  if (!limit) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

/** Starter hub: what is included in the current plan and how much is used. */
export const PlanHubDialog: React.FC<PlanHubDialogProps> = ({ open, initialTab = 'included', onClose, onSeePlans }) => {
  const [tab, setTab] = React.useState<PlanHubTab>(initialTab);

  React.useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  if (!open) return null;

  const state = readEntitlements();
  const plan = planFor(state.plan);
  const paid = isPaid(state);
  const projects = readProjectCount();
  const projectLimit = plan.limits.projects === 'unlimited' ? null : plan.limits.projects;
  const remaining = trialRemaining(state);

  const rows = [
    {
      icon: FolderKanban,
      label: 'Projects',
      used: projects,
      limit: projectLimit,
      detail: projectLimit ? `${projects} of ${projectLimit} used` : `${projects} created · unlimited`,
    },
    {
      icon: LayoutTemplate,
      label: 'Templates',
      used: null,
      limit: null,
      detail: plan.limits.templates === 'all' ? 'Every template unlocked' : `${plan.limits.templates} starter templates`,
    },
    {
      icon: Plug,
      label: 'Integrations',
      used: null,
      limit: null,
      detail:
        plan.limits.integrations === 'all'
          ? 'Every integration unlocked'
          : plan.limits.integrations === 0
            ? 'Not included on Free'
            : `${plan.limits.integrations} integrations`,
    },
    {
      icon: Users,
      label: 'Seats',
      used: 1,
      limit: plan.limits.seats,
      detail: `${plan.limits.seats} seat${plan.limits.seats === 1 ? '' : 's'} included`,
    },
  ];

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Starter hub">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative flex max-h-[90vh] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#242424] text-white shadow-[0_40px_100px_-30px_rgba(0,0,0,.95)] md:flex-row">
        <aside className="shrink-0 border-b border-white/10 p-3 md:w-[200px] md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold">Starter hub</p>
            <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md text-white/50 hover:bg-white/10 md:hidden" aria-label="Close starter hub">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-1 md:block md:space-y-1">
            {([
              { id: 'included' as const, label: "See what's included" },
              { id: 'usage' as const, label: 'Your plan and usage' },
            ]).map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={`rounded-lg px-2.5 py-2 text-left text-[11.5px] font-semibold ${
                  tab === entry.id ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-[#2B2B2B] p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#B9A8FF]">{plan.name} plan</p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/45">
              {paid ? 'Thank you for supporting Vector.' : `${remaining} of ${TRIAL_PROJECTS} free projects left.`}
            </p>
            <button type="button" onClick={onSeePlans} className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-white px-2 py-1.5 text-[10px] font-bold text-[#17171A]">
              See plans <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </aside>

        <div className="v-scroll min-w-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                {tab === 'included' ? 'Included in your plan' : 'Usage this period'}
              </p>
              <h3 className="mt-1 text-[18px] font-semibold">
                {tab === 'included' ? `${plan.name} includes` : 'Your plan and usage'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="hidden h-7 w-7 place-items-center rounded-md text-white/50 hover:bg-white/10 md:grid" aria-label="Close starter hub">
              <X className="h-4 w-4" />
            </button>
          </div>

          {tab === 'included' ? (
            <div className="mt-4 space-y-3">
              <p className="text-[11.5px] leading-relaxed text-white/55">{plan.tagline}</p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {plan.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-1.5 rounded-lg bg-[#2B2B2B] px-2.5 py-2 text-[10.5px] leading-relaxed text-white/70">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#22C55E]" />
                    {highlight}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={onSeePlans} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0D99FF] px-3 text-[11px] font-semibold text-white hover:bg-[#0b8ae6]">
                Compare all plans <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {rows.map((row) => {
                const Icon = row.icon;
                const percent = row.used != null && row.limit != null ? usagePercent(row.used, row.limit) : null;
                return (
                  <div key={row.label} className="rounded-lg border border-white/10 bg-[#2B2B2B] p-2.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-white/45" />
                      <span className="text-[11px] font-semibold">{row.label}</span>
                      <span className="ml-auto text-[10px] text-white/40">{row.detail}</span>
                    </div>
                    {percent != null && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${percent >= 100 ? 'bg-[#FF8A8A]' : 'bg-[#7C5CFF]'}`}
                          style={{ width: `${Math.max(3, percent)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="rounded-lg border border-[#7C5CFF]/30 bg-[#2D2940] p-2.5">
                <p className="text-[10.5px] font-semibold text-[#D8D0FF]">
                  {projectLimit && projects >= projectLimit ? 'Project limit reached' : 'Good room to keep building'}
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-white/50">
                  {projectLimit
                    ? `${Math.max(0, projectLimit - projects)} project slot${projectLimit - projects === 1 ? '' : 's'} left. Free projects stay available forever.`
                    : 'Unlimited projects, all templates and every integration on this plan.'}
                </p>
                <button type="button" onClick={onSeePlans} className="mt-2 inline-flex h-7 items-center gap-1 rounded-md border border-white/20 px-2.5 text-[10px] font-semibold text-white/85 hover:bg-white/10">
                  See plans <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
