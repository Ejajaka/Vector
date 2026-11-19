/**
 * Razorpay Standard Checkout.
 *
 * Test-mode behaviour: if a `rzp_test_...` key is present (Settings → Payments,
 * or VITE_RAZORPAY_KEY_ID at build time) the real Razorpay modal opens.
 *
 * Live-mode rules (implement before charging real money):
 *   1. Create the order server-side (`/api/razorpay/order`) — never trust the
 *      amount from the browser.
 *   2. Verify `razorpay_signature` with the key secret in a webhook or an edge
 *      function, then write the subscription row.
 *   3. Entitlements must be read from the server, not localStorage.
 */

export interface CheckoutOptions {
  planName: string;
  amountInr: number;
  email?: string;
  name?: string;
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
  onError?: (message: string) => void;
}

const KEY_STORAGE = 'vector_razorpay_key';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: () => void) => void };
  }
}

export function getRazorpayKey(): string {
  try {
    const stored = localStorage.getItem(KEY_STORAGE);
    if (stored) return stored;
  } catch {
    // ignore
  }
  return (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_RAZORPAY_KEY_ID || '';
}

export function setRazorpayKey(key: string): void {
  try {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } catch {
    // ignore
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

export async function startCheckout(options: CheckoutOptions): Promise<void> {
  const key = getRazorpayKey();

  // No key configured: simulate so the funnel can be tested end to end.
  if (!key) {
    const proceed = window.confirm(
      `Razorpay is not configured yet.\n\nSimulate a successful payment for ${options.planName} (₹${options.amountInr})?\n\nAdd a key in Settings → Payments to open the real checkout.`
    );
    if (proceed) options.onSuccess(`sim_${Date.now()}`);
    else options.onDismiss?.();
    return;
  }

  const loaded = await loadScript();
  if (!loaded || !window.Razorpay) {
    options.onError?.('Could not load Razorpay. Check your network connection.');
    return;
  }

  const checkout = new window.Razorpay({
    key,
    amount: options.amountInr * 100,
    currency: 'INR',
    name: 'Vector',
    description: options.planName,
    image: `${window.location.origin}/favicon-512.png`,
    prefill: {
      name: options.name || '',
      email: options.email || '',
    },
    notes: { product: 'vector', plan: options.planName },
    theme: { color: '#49686C' },
    modal: { ondismiss: () => options.onDismiss?.() },
    handler: (response: { razorpay_payment_id?: string }) => {
      options.onSuccess(response.razorpay_payment_id || `pay_${Date.now()}`);
    },
  });

  checkout.on('payment.failed', () => {
    options.onError?.('Payment failed. Nothing was charged — try again or use a different method.');
  });

  checkout.open();
}
