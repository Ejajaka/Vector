export const RAZORPAY_API = 'https://api.razorpay.com/v1';

export type PlanCode = 'pro' | 'team' | 'business';
export type Billing = 'monthly' | 'annual';

const env = (key: string): string => process.env[key] || '';

export const KEY_ID = env('RAZORPAY_KEY_ID');
export const KEY_SECRET = env('RAZORPAY_KEY_SECRET');
export const WEBHOOK_SECRET = env('RAZORPAY_WEBHOOK_SECRET');

export const SUPABASE_URL = env('SUPABASE_URL');
export const SUPABASE_ANON_KEY = env('SUPABASE_ANON_KEY');
export const SUPABASE_SERVICE_ROLE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');

export const PLANS: Record<
  PlanCode,
  { name: string; monthly: { amount: number; planId: string }; annual: { amount: number; planId: string } }
> = {
  pro: {
    name: 'Pro',
    monthly: { amount: 199, planId: env('RAZORPAY_PLAN_PRO_MONTHLY') || 'plan_U2h2RY1z2VWQSP' },
    annual: { amount: 1990, planId: env('RAZORPAY_PLAN_PRO_ANNUAL') || 'plan_U2h2RsYsf6dII3' },
  },
  team: {
    name: 'Team',
    monthly: { amount: 1499, planId: env('RAZORPAY_PLAN_TEAM_MONTHLY') },
    annual: { amount: 14990, planId: env('RAZORPAY_PLAN_TEAM_ANNUAL') },
  },
  business: {
    name: 'Business',
    monthly: { amount: 3999, planId: env('RAZORPAY_PLAN_BUSINESS_MONTHLY') },
    annual: { amount: 39990, planId: env('RAZORPAY_PLAN_BUSINESS_ANNUAL') },
  },
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function basicAuth(): string {
  return `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`;
}

export async function razorpay(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${RAZORPAY_API}${path}`, {
    ...init,
    headers: {
      Authorization: basicAuth(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Vector/1.0 (+https://vectorco.in)',
      ...(init.headers || {}),
    },
  });
}

export async function hmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

export async function currentUserFromAuth(
  authorization: string,
): Promise<{ id: string; email?: string } | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !authorization.startsWith('Bearer ')) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: authorization },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string; email?: string };
  return user.id ? { id: user.id, email: user.email } : null;
}

export function findPlanByRazorpayId(planId: string): { plan: PlanCode; billing: Billing } | null {
  for (const plan of Object.keys(PLANS) as PlanCode[]) {
    if (PLANS[plan].monthly.planId === planId) return { plan, billing: 'monthly' };
    if (PLANS[plan].annual.planId === planId) return { plan, billing: 'annual' };
  }
  return null;
}

export async function upsertSubscription(row: {
  user_id: string;
  razorpay_subscription_id: string;
  plan: PlanCode;
  billing: Billing;
  status: string;
  current_end?: string | null;
}): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
  await fetch(`${SUPABASE_URL}/rest/v1/billing_subscriptions?on_conflict=razorpay_subscription_id`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
  });
}
