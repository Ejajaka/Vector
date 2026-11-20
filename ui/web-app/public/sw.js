/**
 * Vector offline shell.
 *
 * The wireframe engine itself is pure local JavaScript. This service worker
 * exists so the app can be *opened* offline too: it precaches the built shell
 * (HTML, JS, CSS, icons) and then serves same-origin assets cache-first.
 *
 * Navigations are network-first so a deploy is picked up immediately; hashed
 * assets never change, so cache-first is safe for them. The optional local
 * BERT model is cached on first use and then available offline as well.
 */
const CACHE = 'vector-shell-v20';

/**
 * Static assets are stored without transport headers:
 *
 * - `content-encoding`: the Cache API keeps the header but the body is already
 *   decoded, which breaks module scripts when replayed.
 * - `vary: Origin`: a `<script crossorigin>` request carries an Origin header
 *   that the precache fetch did not, so Cache.match would miss.
 */
async function cacheable(response) {
  if (!response.body) return response;
  const headers = new Headers(response.headers);
  ['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'vary'].forEach(
    (name) => headers.delete(name)
  );

  if (!response.headers.get('content-encoding')) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const body = await response.arrayBuffer();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function precacheShell() {
  const cache = await caches.open(CACHE);
  const scope = self.registration.scope;
  const indexURL = new URL('index.html', scope).href;

  const response = await fetch(indexURL, { cache: 'reload' });
  if (!response.ok) return;
  await cache.put(indexURL, await cacheable(response.clone()));
  await cache.put(new URL('./', scope).href, await cacheable(response.clone()));

  const html = await response.text();
  const assets = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g))
    .map((match) => match[1])
    .filter(
      (value) =>
        value &&
        !value.startsWith('http') &&
        !value.startsWith('data:') &&
        !value.startsWith('#') &&
        !value.startsWith('//')
    );

  await Promise.all(
    assets.map(async (asset) => {
      try {
        const url = new URL(asset, scope).href;
        const assetResponse = await fetch(url, { cache: 'reload' });
        if (assetResponse.ok) await cache.put(url, await cacheable(assetResponse));
      } catch {
        // A missing optional asset must not block installation.
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isDocument = request.mode === 'navigate' || request.destination === 'document';

  if (isDocument) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const fallback = await caches.match(new URL('index.html', self.registration.scope).href);
        try {
          const response = await fetch(request);
          // A proxy or captive portal can return 5xx instead of failing the
          // fetch. Treat any non-OK navigation as offline and prefer the shell.
          if (!response.ok) return cached || fallback || response;
          const cache = await caches.open(CACHE);
          cache.put(request, await cacheable(response.clone()));
          return response;
        } catch {
          return cached || fallback || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, await cacheable(response.clone()));
        }
        return response;
      } catch {
        return Response.error();
      }
    })()
  );
});
