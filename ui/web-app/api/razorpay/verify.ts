export const config = { runtime: 'nodejs' };

import {
  KEY_ID,
  KEY_SECRET,
  currentUserFromAuth,
  findPlanByRazorpayId,
  hmacHex,
  razorpay,
  safeEqual,
  upsertSubscription,
} from '../_lib/razorpay.js';

/**
 * Verify the checkout handler response, then read the subscription from
 * Razorpay so the plan, status and period are never taken from the browser.
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

  let body: {
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }

  const paymentId = body.razorpay_payment_id || '';
  const subscriptionId = body.razorpay_subscription_id || '';
  const signature = body.razorpay_signature || '';
  if (!paymentId || !subscriptionId || !signature) {
    res.status(400).json({ error: 'Missing payment details.' });
    return;
  }

  const expected = await hmacHex(KEY_SECRET, `${paymentId}|${subscriptionId}`);
  if (!safeEqual(expected, signature)) {
    res.status(400).json({ error: 'Payment signature did not match.' });
    return;
  }

  const authorization = (req.headers.authorization as string) || '';
  const user = await currentUserFromAuth(authorization);
  if (!user) {
    res.status(401).json({ error: 'Sign in before verifying a payment.' });
    return;
  }

  // A valid signature only proves Razorpay produced the handler response. The
  // plan must not unlock until the money is actually captured, so read both
  // the payment and the subscription from Razorpay.
  const paymentResponse = await razorpay(`/payments/${encodeURIComponent(paymentId)}`);
  if (!paymentResponse.ok) {
    res.status(502).json({ error: 'Could not confirm the payment with Razorpay.' });
    return;
  }
  const payment = (await paymentResponse.json()) as {
    id?: string;
    status?: string;
    subscription_id?: string;
  };
  if (payment.status !== 'captured') {
    res.status(402).json({ error: 'Payment is not captured yet. The plan has not been activated.' });
    return;
  }
  if (payment.subscription_id && payment.subscription_id !== subscriptionId) {
    res.status(400).json({ error: 'The payment does not belong to this subscription.' });
    return;
  }

  const upstream = await razorpay(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (!upstream.ok) {
    res.status(502).json({ error: 'Could not confirm the subscription with Razorpay.' });
    return;
  }

  const subscription = (await upstream.json()) as {
    id: string;
    plan_id?: string;
    status?: string;
    current_end?: number;
    notes?: Record<string, string>;
  };

  if (!['active', 'authenticated'].includes(subscription.status || '')) {
    res.status(402).json({ error: 'The subscription is not active yet. The plan has not been activated.' });
    return;
  }

  const mapped = subscription.plan_id ? findPlanByRazorpayId(subscription.plan_id) : null;
  if (!mapped) {
    res.status(400).json({ error: 'Unknown subscription plan.' });
    return;
  }
  if (subscription.notes?.user_id && subscription.notes.user_id !== user.id) {
    res.status(403).json({ error: 'This subscription belongs to another account.' });
    return;
  }

  await upsertSubscription({
    user_id: user.id,
    razorpay_subscription_id: subscription.id,
    plan: mapped.plan,
    billing: mapped.billing,
    status: subscription.status || 'active',
    current_end: subscription.current_end
      ? new Date(subscription.current_end * 1000).toISOString()
      : null,
  });

  res.status(200).json({
    valid: true,
    plan: mapped.plan,
    billing: mapped.billing,
    status: subscription.status,
  });
}
