import React, { useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Cloud,
  Code2,
  Figma,
  Github,
  Globe,
  Laptop,
  Lock,
  Plug,
  Rocket,
  Sparkles,
  Smartphone,
  Unplug,
  Zap,
} from 'lucide-react';
import type { ActiveTab } from '../types/analysis.ts';
import { isPaid, planFor, readEntitlements } from '../services/entitlements.ts';
import { notificationService } from '../services/notifications.ts';

interface IntegrationsPageProps {
  onNavigate: (tab: ActiveTab) => void;
}

type ProviderId = 'figma' | 'canva' | 'bolt' | 'lovable' | 'base44' | 'vercel' | 'netlify' | 'github';
type Category = 'Design import' | 'Generate' | 'Deploy' | 'Repository';

interface Provider {
  id: ProviderId;
  name: string;
  category: Category;
  description: string;
  icon: React.ElementType;
  from: string;
  to: string;
  badge?: string;
}

const PROVIDERS: Provider[] = [
  { id: 'figma', name: 'Figma', category: 'Design import', description: 'Read a frame, its layers and tokens, and turn it into a structured UI brief.', icon: Figma, from: '#0FA3A3', to: '#4F7DF3', badge: 'Popular' },
  { id: 'canva', name: 'Canva', category: 'Design import', description: 'Import a Canva design and extract layout, colour and copy structure.', icon: Sparkles, from: '#8B5CF6', to: '#0FA3A3' },
  { id: 'bolt', name: 'Bolt', category: 'Generate', description: 'Send the validated brief into Bolt with one click.', icon: Zap, from: '#FFC53D', to: '#FF8A6B' },
  { id: 'lovable', name: 'Lovable', category: 'Generate', description: 'Open a Lovable project pre-filled with the generated prompt.', icon: Rocket, from: '#FF6B8A', to: '#8B5CF6' },
  { id: 'base44', name: 'Base44', category: 'Generate', description: 'Embedded workspace for prompt → build → preview.', icon: Code2, from: '#4F7DF3', to: '#0FA3A3' },
  { id: 'vercel', name: 'Vercel', category: 'Deploy', description: 'Create a project and deploy the build to a live URL.', icon: Cloud, from: '#14121F', to: '#4F7DF3', badge: 'Deploy' },
  { id: 'netlify', name: 'Netlify', category: 'Deploy', description: 'Ship static builds with preview URLs and rollbacks.', icon: Globe, from: '#0FA3A3', to: '#22C1A6', badge: 'Deploy' },
  { id: 'github', name: 'GitHub', category: 'Repository', description: 'Push generated projects into a repository with a ready branch.', icon: Github, from: '#66627A', to: '#14121F' },
];

const STORAGE_KEY = 'vector_integrations_v1';

function readConnected(): ProviderId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ProviderId[]) : [];
  } catch {
    return [];
  }
}

export const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ onNavigate }) => {
  const [connected, setConnected] = useState<ProviderId[]>(readConnected());
  const [filter, setFilter] = useState<'All' | Category>('All');
  const entitlement = readEntitlements();
  const paid = isPaid(entitlement);
  const plan = planFor(entitlement.plan);

  const toggle = (provider: Provider) => {
    if (!paid) {
      onNavigate('pricing');
      return;
    }
    const next = connected.includes(provider.id)
      ? connected.filter((id) => id !== provider.id)
      : [...connected, provider.id];
    setConnected(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    if (next.includes(provider.id)) {
      notificationService.push({
        kind: 'system',
        title: `${provider.name} connected`,
        body: `${provider.category} is now available from your projects.`,
        action: { label: 'Open projects', tab: 'projects' },
      });
    }
  };

  const visible = filter === 'All' ? PROVIDERS : PROVIDERS.filter((provider) => provider.category === filter);

  return (
    <div className="space-y-6 v-fade-up">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="v-eyebrow">Integrations</p>
          <h1 className="v-display mt-1 text-[26px] text-[var(--v-ink)]">Connect the tools you already use</h1>
          <p className="mt-1 max-w-[620px] text-[13px] text-[var(--v-muted)]">
            Import a design, generate the build, then deploy it — without copying prompts between tabs.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-1.5">
          <BadgeCheck className={`h-3.5 w-3.5 ${paid ? 'text-[var(--v-accent-hover)]' : 'text-[var(--v-faint)]'}`} />
          <span className="text-[11px] font-semibold text-[var(--v-ink)]">{plan.name} plan</span>
          {!paid && (
            <button type="button" onClick={() => onNavigate('pricing')} className="text-[10.5px] font-semibold text-[var(--v-violet)] hover:underline">
              Unlock
            </button>
          )}
        </div>
      </section>

      <div className="v-scroll flex items-center gap-2 overflow-x-auto pb-1">
        {(['All', 'Design import', 'Generate', 'Deploy', 'Repository'] as const).map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className="v-chip" data-active={filter === item}>
            {item}
          </button>
        ))}
      </div>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {visible.map((provider) => {
          const Icon = provider.icon;
          const isConnected = connected.includes(provider.id);
          return (
            <article key={provider.id} className="v-card v-card-lift rounded-lg p-4 flex flex-col">
              <div className="flex items-start gap-3">
                <span
                  className="w-11 h-11 rounded-lg grid place-items-center text-white shrink-0"
                  style={{ backgroundImage: `linear-gradient(140deg, ${provider.from}, ${provider.to})` }}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[13px] font-semibold text-[var(--v-ink)] truncate">{provider.name}</h3>
                    {provider.badge && (
                      <span className="text-[8.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--v-surface-2)] text-[var(--v-muted)]">
                        {provider.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[9.5px] uppercase tracking-wider text-[var(--v-faint)]">{provider.category}</p>
                </div>
                {isConnected && (
                  <span className="w-2 h-2 rounded-full bg-[var(--v-teal)] shrink-0 mt-1" title="Connected" />
                )}
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-[var(--v-muted)] flex-1">{provider.description}</p>

              <button
                type="button"
                onClick={() => toggle(provider)}
                className={`mt-3 w-full v-btn h-9 text-[11.5px] rounded-xl ${
                  isConnected ? 'v-btn-ghost' : paid ? 'v-btn-dark' : 'v-btn-ghost'
                }`}
              >
                {isConnected ? (
                  <>
                    <Unplug className="w-3.5 h-3.5" /> Disconnect
                  </>
                ) : paid ? (
                  <>
                    <Plug className="w-3.5 h-3.5" /> Connect
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Upgrade to connect
                  </>
                )}
              </button>
            </article>
          );
        })}
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="v-card rounded-lg p-5">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg v-grad text-white grid place-items-center shrink-0">
              <Rocket className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[13.5px] font-semibold text-[var(--v-ink)]">Deploy from here</h2>
              <p className="mt-0.5 text-[11px] text-[var(--v-muted)]">
                Once a project is generated, send it to a host and get a live URL back in the project.
                {!paid && ' Deployment is available on paid plans.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(['vercel', 'netlify'] as ProviderId[]).map((id) => {
                  const provider = PROVIDERS.find((item) => item.id === id)!;
                  const ready = paid && connected.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        if (!paid) return onNavigate('pricing');
                        if (!connected.includes(id)) return toggle(provider);
                        notificationService.push({
                          kind: 'deploy',
                          title: `Deploy queued on ${provider.name}`,
                          body: 'A preview URL will appear in the project once the build finishes.',
                          action: { label: 'View projects', tab: 'projects' },
                        });
                        onNavigate('projects');
                      }}
                      className={`v-btn h-9 px-3.5 text-[11.5px] rounded-xl ${ready ? 'v-btn-dark' : 'v-btn-ghost'}`}
                    >
                      {ready ? <Rocket className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      Deploy to {provider.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="v-card rounded-lg p-4">
            <Laptop className="w-4 h-4 text-[var(--v-muted)]" />
            <p className="mt-2 text-[12.5px] font-semibold text-[var(--v-ink)]">Desktop app</p>
            <p className="mt-0.5 text-[10.5px] text-[var(--v-muted)]">Windows 10+ and macOS 12+.</p>
            <a
              href="/downloads/vector-windows.exe"
              className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--v-violet)] hover:underline"
            >
              Download <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="v-card rounded-lg p-4">
            <Smartphone className="w-4 h-4 text-[var(--v-muted)]" />
            <p className="mt-2 text-[12.5px] font-semibold text-[var(--v-ink)]">iPhone</p>
            <p className="mt-0.5 text-[10.5px] text-[var(--v-muted)]">Share → Add to Home Screen.</p>
            <span className="mt-2.5 inline-block text-[10px] text-[var(--v-faint)]">Works offline</span>
          </div>
        </div>
      </section>
    </div>
  );
};
