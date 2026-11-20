export const config = { runtime: 'edge' };

/**
 * Commercial Base44 proxy.
 *
 * The browser must never hold a Base44 workspace token. Deploy this function on
 * Vercel/Netlify/Cloudflare with BASE44_API_TOKEN set, then point the app at
 * `/api/base44/apps` (default) or VITE_BASE44_PROXY_URL.
 *
 * POST { initial_message, name, prevent_iframe_embedding } -> create app
 * GET  ?id=<appId>                                          -> app status
 *
 * Production hardening still required: authenticate the caller, rate limit,
 * log metadata only, and set ALLOWED_ORIGIN.
 */

const BASE44 = 'https://app.base44.com';
const TOKEN = process.env.BASE44_API_TOKEN || process.env.BASE44_API_KEY || '';
const ORGANIZATION = process.env.BASE44_ORGANIZATION_ID || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...(ALLOWED_ORIGIN
      ? {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Headers': 'authorization, content-type, x-base44-token, x-base44-organization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          Vary: 'Origin',
        }
      : {}),
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: headers() });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers() });

  const incoming = new URL(request.url);
  const headerToken = request.headers.get('x-base44-token') || '';
  const token = TOKEN || headerToken;
  if (!token) {
    return json(
      {
        error:
          'Base44 is not connected. Set BASE44_API_TOKEN on the proxy, or add a Base44 workspace token in the app.',
      },
      401
    );
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  if (request.method === 'POST') {
    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }
    if (JSON.stringify(payload).length > 120_000) {
      return json({ error: 'Prompt is too large for Base44.' }, 413);
    }
    const organization = request.headers.get('x-base44-organization') || ORGANIZATION;
    const upstream = await fetch(`${BASE44}/api/apps`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        ...payload,
        ...(organization ? { organization_id: organization } : {}),
      }),
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...headers(), 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  }

  if (request.method === 'GET') {
    const path = incoming.searchParams.get('path') || '';
    const id = incoming.searchParams.get('id') || path.split('/').filter(Boolean).pop() || '';
    if (!id) return json({ error: 'Missing app id.' }, 400);
    const upstream = await fetch(`${BASE44}/api/apps/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: authHeaders,
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...headers(), 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  }

  return json({ error: 'Method not allowed.' }, 405);
}
