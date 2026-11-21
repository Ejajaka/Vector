/**
 * Razorpay subscriptions (server-created, signature-verified).
 *
 * The browser sends only the plan code and billing cycle. `/api/razorpay/subscribe`
 * looks up the Razorpay plan id and price, creates the subscription with the
 * secret key, and returns the public key id. The checkout handler is then
 * verified against `/api/razorpay/verify` before the plan is activated.
 */

import { supabase } from './supabase/client.ts';

export type CheckoutPlan = 'pro' | 'team' | 'business';
export type CheckoutBilling = 'monthly' | 'annual';

export interface CheckoutOptions {
  plan: CheckoutPlan;
  billing: CheckoutBilling;
  planName: string;
  amountInr: number;
  email?: string;
  name?: string;
  onSuccess: (paymentId: string, subscriptionId: string) => void;
  onDismiss?: () => void;
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: () => void) => void;
    };
  }
}

function loadScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export async function startCheckout(options: CheckoutOptions): Promise<void> {
  const token = await accessToken();
  if (!token) {
    options.onError?.('Sign in to your workspace before upgrading.');
    return;
  }

  let order: {
    keyId?: string;
    subscriptionId?: string;
    shortUrl?: string;
    error?: string;
  };
  try {
    const response = await fetch('/api/razorpay/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan: options.plan, billing: options.billing }),
    });
    order = (await response.json()) as typeof order;
    if (!response.ok || !order.keyId || !order.subscriptionId) {
      options.onError?.(order.error || 'Could not start the Razorpay subscription.');
      return;
    }
  } catch {
    options.onError?.('Could not reach the payment service.');
    return;
  }

  const loaded = await loadScript();
  if (!loaded || !window.Razorpay) {
    options.onError?.('Could not load Razorpay. Check your network connection.');
    return;
  }

  const checkout = new window.Razorpay({
    key: order.keyId,
    subscription_id: order.subscriptionId,
    name: 'Vector',
    description: `${options.planName} · ${options.billing}`,
    image: `${window.location.origin}/favicon-512.png`,
    prefill: {
      name: options.name || '',
      email: options.email || '',
    },
    notes: { product: 'vector', plan: options.plan, billing: options.billing },
    theme: {
      color: '#5E6AD2',
      backdrop_color: '#08090A',
      hide_topbar: false,
    },
    modal: {
      ondismiss: () => options.onDismiss?.(),
      backdropclose: false,
      escape: true,
      confirm_close: true,
    },
    handler: async (response: {
      razorpay_payment_id?: string;
      razorpay_subscription_id?: string;
      razorpay_signature?: string;
    }) => {
      const paymentId = response.razorpay_payment_id || '';
      const subscriptionId = response.razorpay_subscription_id || order.subscriptionId || '';
      if (!paymentId || !subscriptionId) {
        options.onError?.('Razorpay returned an incomplete payment.');
        return;
      }
      try {
        const verified = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpay_payment_id: paymentId,
            razorpay_subscription_id: subscriptionId,
            razorpay_signature: response.razorpay_signature || '',
          }),
        });
        const result = (await verified.json()) as { valid?: boolean; error?: string };
        if (!verified.ok || !result.valid) {
          options.onError?.(result.error || 'Could not verify the payment.');
          return;
        }
        options.onSuccess(paymentId, subscriptionId);
      } catch {
        options.onError?.('Payment was received but verification could not complete.');
      }
    },
  });

  checkout.on('payment.failed', () => {
    options.onError?.('Payment failed. Nothing was charged — try another method.');
  });

  checkout.open();
}
