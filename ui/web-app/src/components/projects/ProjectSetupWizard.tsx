import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ClipboardList, Layers, Sparkles, Upload, X } from 'lucide-react';
import { TEMPLATES, type TemplateDefinition } from '../../data/templates.ts';

export interface ProjectSetupChoice {
  purposes: string[];
  features: string[];
  start: 'blank' | 'template' | 'import';
  template: TemplateDefinition | null;
}

interface ProjectSetupWizardProps {
  open: boolean;
  project: { id: string; name: string };
  onComplete: (choice: ProjectSetupChoice) => void;
  /** Close without seeding a canvas; the project itself already exists. */
  onDismiss?: () => void;
}

const PURPOSES: Array<{ id: string; label: string; hint: string; categories: string[] }> = [
  { id: 'dashboard', label: 'Dashboard or internal tool', hint: 'KPI cards, tables, filters and sidebars', categories: ['Dashboard', 'Data'] },
  { id: 'marketing', label: 'Marketing website', hint: 'Hero, features, proof and pricing', categories: ['Marketing'] },
  { id: 'commerce', label: 'Online store', hint: 'Product detail, cart and checkout', categories: ['Commerce'] },
  { id: 'auth', label: 'Login or onboarding', hint: 'Sign in, sign up and account setup', categories: ['Auth'] },
  { id: 'mobile', label: 'Mobile app', hint: 'Compact mobile screens', categories: ['Mobile'] },
  { id: 'collab', label: 'Team collaboration', hint: 'Shared boards, activity and permissions', categories: ['Collaboration'] },
  { id: 'analytics', label: 'Analytics or reporting', hint: 'Charts, trends and data tables', categories: ['Data', 'Dashboard'] },
  { id: 'unsure', label: 'Not sure yet', hint: 'Show me good starting points', categories: [] },
];

const FEATURES = [
  'Navigation',
  'Hero section',
  'Cards',
  'Forms and inputs',
  'Charts',
  'Tables',
  'Pricing',
  'Settings',
  'Authentication',
] as const;

/** Words that describe each setup answer inside a template's name, tags and blocks. */
const FEATURE_TERMS: Record<string, string[]> = {
  Navigation: ['nav', 'navbar', 'sidebar', 'menu', 'tabs', 'breadcrumb'],
  'Hero section': ['hero', 'landing', 'headline', 'display', 'marketing'],
  Cards: ['card', 'grid', 'kpi', 'stat', 'metric'],
  'Forms and inputs': ['input', 'form', 'field', 'select', 'checkbox', 'textarea'],
  Charts: ['chart', 'analytics', 'kpi', 'report', 'dashboard', 'trend', 'graph'],
  Tables: ['table', 'data', 'crm', 'admin', 'invoice', 'people', 'row'],
  Pricing: ['pricing', 'plan', 'billing', 'checkout', 'subscription'],
  Settings: ['settings', 'profile', 'preference', 'account', 'billing', 'danger'],
  Authentication: ['auth', 'login', 'signup', 'sign in', 'onboarding', 'password', 'sso'],
};

/** Mandatory project interview: purpose → features → how to start. */
export const ProjectSetupWizard: React.FC<ProjectSetupWizardProps> = ({ open, project, onComplete, onDismiss }) => {
  const [step, setStep] = useState(0);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [start, setStart] = useState<'blank' | 'template' | 'import'>('template');
  const [templateId, setTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setPurposes([]);
    setFeatures([]);
    setStart('template');
    setTemplateId(null);
  }, [open, project.id]);

  const suggested = useMemo(() => {
    const selectedPurposes = PURPOSES.filter((purpose) => purposes.includes(purpose.id));
    const categories = new Set(selectedPurposes.flatMap((purpose) => purpose.categories));
    const terms = Array.from(new Set(features.flatMap((feature) => FEATURE_TERMS[feature] || [])));

    if (categories.size === 0 && terms.length === 0) return TEMPLATES.slice(0, 6);

    return TEMPLATES.map((template) => {
      const haystack = [
        template.name,
        template.category,
        template.tagline,
        template.description,
        template.tags.join(' '),
        ...template.blocks.map((block) => `${block.type} ${block.label} ${block.attrs.join(' ')}`),
      ]
        .join(' ')
        .toLowerCase();

      let score = categories.has(template.category) ? 8 : 0;
      for (const term of terms) {
        if (haystack.includes(term)) score += 2;
      }
      if (features.includes('Pricing') && template.tags.some((tag) => /pricing|checkout|billing/i.test(tag))) score += 3;
      if (features.includes('Authentication') && template.category === 'Auth') score += 3;
      if (features.includes('Charts') && template.blocks.some((block) => block.type === 'chart')) score += 3;
      if (features.includes('Tables') && template.blocks.some((block) => block.type === 'table')) score += 3;

      return { template, score };
    })
      .sort((a, b) => b.score - a.score || a.template.name.localeCompare(b.template.name))
      .slice(0, 6)
      .map((entry) => entry.template);
  }, [purposes, features]);

  const selectedTemplate = TEMPLATES.find((template) => template.id === templateId) || null;
  const canContinue =
    step === 0 ? purposes.length > 0 : step === 1 ? true : start !== 'template' || Boolean(selectedTemplate);

  useEffect(() => {
    if (step !== 2 || start !== 'template') return;
    if (templateId && suggested.some((template) => template.id === templateId)) return;
    if (suggested[0]) setTemplateId(suggested[0].id);
  }, [step, start, templateId, suggested]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onDismiss]);

  if (!open) return null;

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];

  const finish = () => {
    if (start === 'template' && !selectedTemplate) return;
    onComplete({
      purposes,
      features,
      start,
      template: start === 'template' ? selectedTemplate : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[96] grid place-items-center overflow-y-auto p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Set up this project">
      <div className="absolute inset-0 bg-[#14121F]/65 backdrop-blur-sm" aria-hidden="true" />
      <div className="v-scroll relative max-h-[92vh] w-full max-w-[820px] overflow-y-auto rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-4 shadow-[0_40px_100px_-30px_rgba(20,18,31,.55)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="v-eyebrow">New project · {project.name}</p>
            <h2 className="v-display mt-1 text-[22px] text-[var(--v-ink)] sm:text-[26px]">
              {step === 0 ? 'What are you building?' : step === 1 ? 'What should it include?' : 'How do you want to start?'}
            </h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--v-muted)]">
              {step === 0
                ? 'Pick every purpose that applies. We use these answers to suggest the right templates.'
                : step === 1
                  ? 'These become the first blocks in your wireframe. Select as many as you need.'
                  : 'Choose a template, start blank, or import a design. You can change any of this later.'}
            </p>
          </div>
          <span className="rounded-full bg-[var(--v-surface-2)] px-2.5 py-1 text-[9.5px] font-semibold text-[var(--v-muted)]">
            {step + 1} of 3
          </span>
          <button
            type="button"
            onClick={() => onDismiss?.()}
            className="v-icon-btn shrink-0"
            aria-label="Close project setup"
            title="Close setup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--v-surface-2)]">
          <div className="h-full rounded-full bg-[var(--v-violet)] transition-[width] duration-300" style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>

        {step === 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {PURPOSES.map((purpose) => {
              const active = purposes.includes(purpose.id);
              return (
                <button
                  key={purpose.id}
                  type="button"
                  onClick={() => {
                    setPurposes((current) => toggle(current, purpose.id));
                    setTemplateId(null);
                  }}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                    active ? 'border-[var(--v-violet)] bg-[var(--v-violet)]/8' : 'border-[var(--v-line)] bg-[var(--v-surface-2)] hover:border-[var(--v-violet)]/50'
                  }`}
                >
                  <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${active ? 'border-[var(--v-violet)] bg-[var(--v-violet)] text-white' : 'border-[var(--v-line)] bg-[var(--v-surface)]'}`}>
                    {active && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11.5px] font-semibold text-[var(--v-ink)]">{purpose.label}</span>
                    <span className="mt-0.5 block text-[9.5px] leading-relaxed text-[var(--v-muted)]">{purpose.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {FEATURES.map((feature) => {
              const active = features.includes(feature);
              return (
                <button
                  key={feature}
                  type="button"
                  onClick={() => {
                    setFeatures((current) => toggle(current, feature));
                    setTemplateId(null);
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] font-semibold transition-colors ${
                    active ? 'border-[var(--v-violet)] bg-[var(--v-violet)]/8 text-[var(--v-ink)]' : 'border-[var(--v-line)] bg-[var(--v-surface-2)] text-[var(--v-muted)] hover:border-[var(--v-violet)]/50'
                  }`}
                >
                  <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${active ? 'border-[var(--v-violet)] bg-[var(--v-violet)] text-white' : 'border-[var(--v-line)] bg-[var(--v-surface)]'}`}>
                    {active && <Check className="h-2.5 w-2.5" />}
                  </span>
                  {feature}
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { id: 'template' as const, title: 'Use a template', body: 'Start with a proven layout.', icon: Layers },
                { id: 'blank' as const, title: 'Start blank', body: 'An empty 1200×800 canvas.', icon: ClipboardList },
                { id: 'import' as const, title: 'Import a design', body: 'Bring in Figma or another source.', icon: Upload },
              ].map((option) => {
                const Icon = option.icon;
                const active = start === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStart(option.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active ? 'border-[var(--v-violet)] bg-[var(--v-violet)]/8' : 'border-[var(--v-line)] bg-[var(--v-surface-2)] hover:border-[var(--v-violet)]/50'
                    }`}
                  >
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? 'bg-[var(--v-violet)] text-white' : 'bg-[var(--v-surface)] text-[var(--v-muted)]'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="mt-2 block text-[11.5px] font-semibold text-[var(--v-ink)]">{option.title}</span>
                    <span className="mt-0.5 block text-[9.5px] leading-relaxed text-[var(--v-muted)]">{option.body}</span>
                  </button>
                );
              })}
            </div>

            {start === 'template' && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--v-faint)]">Suggested for you</p>
                  <span className="text-[9.5px] text-[var(--v-faint)]">{suggested.length} templates</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggested.map((template) => {
                    const active = templateId === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setTemplateId(template.id)}
                        className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${
                          active ? 'border-[var(--v-violet)] bg-[var(--v-violet)]/8' : 'border-[var(--v-line)] bg-[var(--v-surface-2)] hover:border-[var(--v-violet)]/50'
                        }`}
                      >
                        <span className="grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--v-surface)] ring-1 ring-[var(--v-line)]">
                          <span className="flex flex-col gap-0.5">
                            <span className="h-1.5 w-8 rounded-full" style={{ background: template.palette[0] }} />
                            <span className="h-1 w-6 rounded-full bg-[var(--v-line)]" />
                            <span className="h-1 w-7 rounded-full bg-[var(--v-line)]" />
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-semibold text-[var(--v-ink)]">{template.name}</span>
                          <span className="block truncate text-[9px] text-[var(--v-muted)]">{template.category} · {template.blocks.length} blocks</span>
                        </span>
                        {active && <Check className="h-4 w-4 shrink-0 text-[var(--v-violet)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {start === 'blank' && (
              <p className="rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] px-3 py-2 text-[10.5px] text-[var(--v-muted)]">
                You will land in the project workspace with a blank canvas. You can still add templates later.
              </p>
            )}

            {start === 'import' && (
              <p className="rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] px-3 py-2 text-[10.5px] text-[var(--v-muted)]">
                We will take you to the project workspace, where you can import a Figma JSON export or connect an external builder.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--v-line)] pt-3">
          <div className="flex gap-1.5">
            {step > 0 && (
              <button type="button" onClick={() => setStep((value) => value - 1)} className="v-btn v-btn-ghost h-9 px-3 text-[11px]">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            {step < 2 && (
              <button
                type="button"
                onClick={() => setStep((value) => value + 1)}
                className="v-btn v-btn-ghost h-9 px-3 text-[11px] text-[var(--v-muted)]"
              >
                Skip
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep((value) => value + 1)}
                className="v-btn v-btn-primary h-9 px-4 text-[11.5px] disabled:opacity-40"
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canContinue}
                onClick={finish}
                className="v-btn v-btn-primary h-9 px-4 text-[11.5px] disabled:opacity-40"
              >
                <Sparkles className="h-3.5 w-3.5" /> Create project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
