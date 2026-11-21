import { isPaid, readEntitlements, setPlanState, type PlanCode } from './entitlements.ts';
import { supabase } from './supabase/client.ts';

interface SubscriptionRow {
  plan?: string;
  status?: string;
  current_end?: string | null;
  razorpay_subscription_id?: string;
}

export interface BillingSubscription {
  subscriptionId: string;
  plan: string;
  status: 'active' | 'cancelled' | 'authenticated' | string;
  currentEnd: string | null;
}

/**
 * Owner/testing accounts that keep Pro without a Razorpay subscription.
 * Matched against the authenticated Supabase email, never user input.
 */
const COMPED_PRO_EMAILS = new Set([
  'sanjeev.vakalapudi@gmail.com',
  'bl.sc.u4cse24043@bl.students.amrita.edu',
]);

/**
 * The browser plan is a cache. On every sign-in, compare it with the billing
 * table so a plan is never active just because localStorage says so.
 *
 * - A live active subscription upgrades the browser.
 * - A cancelled subscription keeps Pro until its paid period ends.
 * - No current subscription downgrades a stale Pro state to free.
 * - Network or RLS failures keep the local state (offline tolerance).
 */
export async function reconcileEntitlements(userId: string, email?: string | null): Promise<void> {
  if (!userId) return;

  if (email && COMPED_PRO_EMAILS.has(email.trim().toLowerCase())) {
    if (readEntitlements().plan !== 'pro') setPlanState('pro', 'comped');
    return;
  }

  if (!supabase) return;

  const { data, error } = await supabase
    .from('billing_subscriptions')
    .select('plan, status, current_end')
    .eq('user_id', userId)
    .in('status', ['active', 'cancelled'])
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) return;

  const row = (data?.[0] || null) as SubscriptionRow | null;
  const currentEnd = row?.current_end ? new Date(row.current_end).getTime() : null;
  // A cancelled subscription was paid through current_end, so it keeps Pro
  // until that date. An active subscription with no end is treated as live.
  const validEnd =
    currentEnd === null
      ? row?.status === 'active'
      : Number.isFinite(currentEnd) && currentEnd > Date.now();
  const active = Boolean(row?.plan) && validEnd;

  if (active && row?.plan) {
    if (readEntitlements().plan !== row.plan) {
      setPlanState(row.plan as PlanCode, readEntitlements().paymentId);
    }
    return;
  }

  if (isPaid(readEntitlements())) setPlanState('free');
}

/** The paid subscription attached to an account, if one exists. */
export async function fetchBillingSubscription(userId: string): Promise<BillingSubscription | null> {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('billing_subscriptions')
    .select('razorpay_subscription_id, plan, status, current_end')
    .eq('user_id', userId)
    .in('status', ['active', 'authenticated', 'cancelled'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.razorpay_subscription_id) return null;

  return {
    subscriptionId: data.razorpay_subscription_id,
    plan: data.plan || 'pro',
    status: data.status || 'active',
    currentEnd: data.current_end || null,
  };
}

/** Cancel AutoPay for the signed-in user's own subscription. */
export async function cancelBillingSubscription(
  subscriptionId: string,
): Promise<{ cancelled: boolean; status: string; currentEnd: string | null }> {
  if (!supabase) throw new Error('Billing is not configured.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sign in again to cancel AutoPay.');

  const response = await fetch('/api/razorpay/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ subscriptionId }),
  });
  const result = (await response.json().catch(() => ({}))) as {
    cancelled?: boolean;
    status?: string;
    currentEnd?: string | null;
    error?: string;
  };
  if (!response.ok || !result.cancelled) {
    throw new Error(result.error || 'Could not cancel AutoPay. Try again.');
  }
  return {
    cancelled: true,
    status: result.status || 'cancelled',
    currentEnd: result.currentEnd || null,
  };
}
