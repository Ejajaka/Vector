const RAZORPAY_API = 'https://api.razorpay.com/v1';
const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

type PlanCode = 'pro' | 'team' | 'business';
type Billing = 'monthly' | 'annual';

const PLANS: Record<PlanCode, { name: string; monthly: { amount: number; planId: string }; annual: { amount: number; planId: string } }> = {
  pro: {
    name: 'Pro',
    monthly: { amount: 499, planId: process.env.RAZORPAY_PLAN_PRO_MONTHLY || 'plan_U2ZYoMsKavqBVD' },
    annual: { amount: 4990, planId: process.env.RAZORPAY_PLAN_PRO_ANNUAL || 'plan_U2Za5LEpzl9biS' },
  },
  team: {
    name: 'Team',
    monthly: { amount: 1499, planId: process.env.RAZORPAY_PLAN_TEAM_MONTHLY || '' },
    annual: { amount: 14990, planId: process.env.RAZORPAY_PLAN_TEAM_ANNUAL || '' },
  },
  business: {
    name: 'Business',
    monthly: { amount: 3999, planId: process.env.RAZORPAY_PLAN_BUSINESS_MONTHLY || '' },
    annual: { amount: 39990, planId: process.env.RAZORPAY_PLAN_BUSINESS_ANNUAL || '' },
  },
};

function basicAuth(): string {
  return `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;
}

async function razorpay(path: string, init: RequestInit = {}): Promise<Response> {
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

async function currentUserFromAuth(
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

export default async function handler(req: any, res: any): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed.' });
      return;
    }
    if (!KEY_ID || !KEY_SECRET) {
      res.status(503).json({ error: 'Razorpay is not configured on this deployment.' });
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const plan = body.plan as PlanCode;
    const billing = body.billing as Billing;
    if (!['pro', 'team', 'business'].includes(plan) || !['monthly', 'annual'].includes(billing)) {
      res.status(400).json({ error: 'Choose a valid plan and billing cycle.' });
      return;
    }

    const authorization = (req.headers.authorization as string) || '';
    const user = await currentUserFromAuth(authorization);
    if (!user) {
      res.status(401).json({ error: 'Sign in before upgrading.' });
      return;
    }

    const config = PLANS[plan][billing];
    if (!config.planId) {
      res.status(503).json({ error: `${PLANS[plan].name} billing is not available yet.` });
      return;
    }

    const response = await razorpay('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: config.planId,
        total_count: billing === 'annual' ? 10 : 60,
        customer_notify: 1,
        notes: {
          product: 'vector',
          plan,
          billing,
          user_id: user.id,
          email: user.email || '',
        },
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      res.status(502).json({
        error: 'Razorpay could not create the subscription.',
        status: response.status,
        detail: text.slice(0, 500),
      });
      return;
    }

    const subscription = JSON.parse(text) as { id?: string; short_url?: string; status?: string };
    if (!subscription.id) {
      res.status(502).json({ error: 'Razorpay returned no subscription id.' });
      return;
    }

    res.status(200).json({
      keyId: KEY_ID,
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url || null,
      status: subscription.status || 'created',
      plan,
      billing,
      amountInr: config.amount,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
