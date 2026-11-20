export const config = { runtime: 'edge' };

import {
  WEBHOOK_SECRET,
  findPlanByRazorpayId,
  hmacHex,
  json,
  safeEqual,
  upsertSubscription,
} from '../_lib/razorpay';

/**
 * Razorpay webhook: the durable source of truth for subscription state.
 * Configure it at https://www.vectorco.in/api/razorpay/webhook with
 * subscription.activated, subscription.charged, subscription.cancelled,
 * subscription.paused, subscription.resumed and payment.failed.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!WEBHOOK_SECRET) return json({ error: 'Webhook secret is not configured.' }, 503);

  const raw = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';
  const expected = await hmacHex(WEBHOOK_SECRET, raw);
  if (!safeEqual(expected, signature)) {
    return json({ error: 'Invalid webhook signature.' }, 400);
  }

  let payload: {
    event?: string;
    payload?: {
      subscription?: {
        entity?: {
          id?: string;
          plan_id?: string;
          status?: string;
          current_end?: number;
          notes?: Record<string, string>;
        };
      };
      payment?: { entity?: { id?: string; status?: string } };
    };
  };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const entity = payload.payload?.subscription?.entity;
  if (!entity?.id || !entity.plan_id) {
    return json({ received: true, ignored: true });
  }

  const mapped = findPlanByRazorpayId(entity.plan_id);
  const userId = entity.notes?.user_id || '';
  if (!mapped || !userId) {
    return json({ received: true, ignored: true });
  }

  await upsertSubscription({
    user_id: userId,
    razorpay_subscription_id: entity.id,
    plan: mapped.plan,
    billing: mapped.billing,
    status: entity.status || 'unknown',
    current_end: entity.current_end
      ? new Date(entity.current_end * 1000).toISOString()
      : null,
  });

  return json({ received: true, event: payload.event || '' });
}
