/**
 * Plan entitlements.
 *
 * The free tier gives every new account TWO projects. Once both are used the
 * workspace becomes read-only until a plan is purchased. This module is the
 * single source of truth for the client; the same rules must be enforced in
 * Supabase (RLS + edge function) before billing goes live, because anything
 * that runs in the browser can be edited by the user.
 */

export type PlanCode = 'free' | 'pro' | 'team' | 'business';

export const TRIAL_PROJECTS = 2;

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  tagline: string;
  monthlyInr: number;
  annualInr: number;
  highlights: string[];
  limits: {
    projects: number | 'unlimited';
    templates: number | 'all';
    integrations: number | 'all';
    seats: number;
    aiExplanations: boolean;
    deployments: boolean;
  };
}

export const PLANS: PlanDefinition[] = [
  {
    code: 'free',
    name: 'Free',
    tagline: 'Try the full engine on two projects.',
    monthlyInr: 0,
    annualInr: 0,
    highlights: [
      '2 projects, forever',
      'Rules engine, fully on-device',
      '3 starter templates',
      'Clarification questions & risk score',
      'Local history',
    ],
    limits: { projects: TRIAL_PROJECTS, templates: 3, integrations: 0, seats: 1, aiExplanations: false, deployments: false },
  },
  {
    code: 'pro',
    name: 'Pro',
    tagline: 'For designers and developers shipping weekly.',
    monthlyInr: 199,
    annualInr: 1990,
    highlights: [
      'Unlimited projects',
      'All 27 templates with previews',
      'Block palette prompt composer',
      'AI explanations (bring your own key)',
      'Export to Figma-format JSON, Markdown, Spec Kit',
      '2 integrations',
    ],
    limits: { projects: 'unlimited', templates: 'all', integrations: 2, seats: 1, aiExplanations: true, deployments: true },
  },

];

const STORAGE_KEY = 'vector_entitlements_v1';

export interface EntitlementState {
  plan: PlanCode;
  /** ISO timestamp of the first project created, used as trial start. */
  trialStartedAt: string | null;
  /** How many projects this account has ever created. */
  projectsCreated: number;
  upgradedAt: string | null;
  /** Razorpay payment id, kept for the receipt screen. */
  paymentId: string | null;
}

const DEFAULT_STATE: EntitlementState = {
  plan: 'free',
  trialStartedAt: null,
  projectsCreated: 0,
  upgradedAt: null,
  paymentId: null,
};

export function readEntitlements(): EntitlementState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<EntitlementState>;
    return {
      plan: (parsed.plan as PlanCode) || 'free',
      trialStartedAt: parsed.trialStartedAt || null,
      projectsCreated: Number(parsed.projectsCreated) || 0,
      upgradedAt: parsed.upgradedAt || null,
      paymentId: parsed.paymentId || null,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function write(state: EntitlementState): EntitlementState {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best effort: private mode or storage disabled.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vector:entitlements', { detail: state }));
  }
  return state;
}

export function planFor(code: PlanCode): PlanDefinition {
  return PLANS.find((plan) => plan.code === code) || PLANS[0];
}

export function isPaid(state: EntitlementState): boolean {
  return state.plan !== 'free';
}

export function trialRemaining(state: EntitlementState): number {
  if (isPaid(state)) return TRIAL_PROJECTS;
  return Math.max(0, TRIAL_PROJECTS - state.projectsCreated);
}

export function canCreateProject(state: EntitlementState): boolean {
  if (isPaid(state)) return true;
  return state.projectsCreated < TRIAL_PROJECTS;
}

export function recordProjectCreated(): EntitlementState {
  const state = readEntitlements();
  return write({
    ...state,
    trialStartedAt: state.trialStartedAt || new Date().toISOString(),
    projectsCreated: state.projectsCreated + 1,
  });
}

export function upgradePlan(plan: PlanCode, paymentId: string | null = null): EntitlementState {
  const state = readEntitlements();
  return write({
    ...state,
    plan,
    upgradedAt: new Date().toISOString(),
    paymentId,
  });
}

export function resetEntitlements(): EntitlementState {
  return write({ ...DEFAULT_STATE });
}

/**
 * Apply the plan that the billing server reports. Project counters are kept,
 * so a reconcile never resets usage or the trial start.
 */
export function setPlanState(plan: PlanCode, paymentId: string | null = null): EntitlementState {
  const state = readEntitlements();
  return write({
    ...state,
    plan,
    upgradedAt: plan === 'free' ? null : state.upgradedAt || new Date().toISOString(),
    paymentId: plan === 'free' ? null : paymentId ?? state.paymentId,
  });
}

export function hasFeature(feature: 'templates' | 'integrations' | 'deployments' | 'aiExplanations'): boolean {
  const state = readEntitlements();
  return isPaid(state);
}
