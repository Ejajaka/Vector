export const config = { runtime: 'nodejs' };

import {
  KEY_ID,
  KEY_SECRET,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  currentUserFromAuth,
  razorpay,
} from '../_lib/razorpay.js';

interface SubscriptionRow {
  id: string;
  plan?: string;
  billing?: string;
  status?: string;
  current_end?: string | null;
  razorpay_subscription_id?: string;
}

function serviceHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Customer-initiated AutoPay cancellation.
 *
 * The browser sends the subscription id it already sees. The server checks
 * that the subscription belongs to the signed-in user, cancels it in Razorpay
 * immediately, and marks the billing row cancelled. The paid period is kept,
 * so Pro stays active until current_end without renewing.
 */
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  if (!KEY_ID || !KEY_SECRET) {
    res.status(503).json({ error: 'Razorpay is not configured.' });
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(503).json({ error: 'Billing storage is not configured.' });
    return;
  }

  let body: { subscriptionId?: string };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }

  const subscriptionId = (body.subscriptionId || '').trim();
  if (!subscriptionId) {
    res.status(400).json({ error: 'Missing subscription id.' });
    return;
  }

  const authorization = (req.headers.authorization as string) || '';
  const user = await currentUserFromAuth(authorization);
  if (!user) {
    res.status(401).json({ error: 'Sign in to cancel AutoPay.' });
    return;
  }

  const query = new URLSearchParams({
    select: 'id,plan,billing,status,current_end,razorpay_subscription_id',
    user_id: `eq.${user.id}`,
    razorpay_subscription_id: `eq.${subscriptionId}`,
    limit: '1',
  });
  const rowResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/billing_subscriptions?${query.toString()}`,
    { headers: serviceHeaders() },
  );
  if (!rowResponse.ok) {
    res.status(502).json({ error: 'Could not read the subscription.' });
    return;
  }
  const rows = (await rowResponse.json()) as SubscriptionRow[];
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: 'No paid subscription is attached to this account.' });
    return;
  }

  if (row.status === 'cancelled') {
    res.status(200).json({
      cancelled: true,
      already: true,
      status: 'cancelled',
      currentEnd: row.current_end || null,
    });
    return;
  }

  const upstream = await razorpay(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancel_at_cycle_end: 0 }),
  });
  const text = await upstream.text();
  if (!upstream.ok) {
    res.status(502).json({
      error: 'Razorpay could not cancel this AutoPay. Try again or contact support.',
      status: upstream.status,
      detail: text.slice(0, 300),
    });
    return;
  }

  let cancelled: { status?: string; current_end?: number } = {};
  try {
    cancelled = JSON.parse(text) as typeof cancelled;
  } catch {
    // Razorpay returned 2xx but not JSON; keep going with the row's end date.
  }

  const currentEnd = cancelled.current_end
    ? new Date(cancelled.current_end * 1000).toISOString()
    : row.current_end || null;

  await fetch(
    `${SUPABASE_URL}/rest/v1/billing_subscriptions?razorpay_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
    {
      method: 'PATCH',
      headers: serviceHeaders(),
      body: JSON.stringify({
        status: 'cancelled',
        current_end: currentEnd,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  res.status(200).json({
    cancelled: true,
    status: cancelled.status || 'cancelled',
    currentEnd,
  });
}
