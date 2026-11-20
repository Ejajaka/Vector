export const config = { runtime: 'edge' };

/**
 * Commercial model proxy.
 *
 * The browser must never receive a provider API key. Deploy this function on
 * Vercel/Netlify/Cloudflare, set MODEL_API_KEY server-side, and point the web
 * app at `<deployment>/api` with VITE_VECTOR_PROXY_URL.
 *
 * The app sends an OpenAI-compatible chat request; this function forwards only
 * the fields the schema parser needs and returns the provider response.
 *
 * Production hardening still required:
 *  - authenticate the caller (e.g. verify a Supabase JWT),
 *  - rate limit per user/workspace,
 *  - log metadata only, never prompt text,
 *  - set ALLOWED_ORIGIN if the web app is on a different origin.
 */

const PROVIDER = (process.env.MODEL_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
const PROVIDER_KEY = process.env.MODEL_API_KEY || '';
const MODEL = process.env.MODEL_NAME || 'openai/gpt-oss-120b';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...(ALLOWED_ORIGIN
      ? {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Headers': 'authorization, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          Vary: 'Origin',
        }
      : {}),
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: headers() });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: headers() });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  if (!PROVIDER_KEY) {
    return json({ error: 'MODEL_API_KEY is not configured on the proxy.' }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-10) : [];
  if (!messages.length) {
    return json({ error: 'No messages supplied.' }, 400);
  }
  if (JSON.stringify(messages).length > 60_000) {
    return json({ error: 'Request is too large.' }, 413);
  }

  const upstream = await fetch(`${PROVIDER}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PROVIDER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0,
      max_tokens: Math.min(Number(payload.max_tokens) || 4000, 4000),
      ...(payload.response_format ? { response_format: payload.response_format } : {}),
    }),
  });

  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: headers() });
}
