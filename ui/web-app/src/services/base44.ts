export interface Base44Config {
  token: string;
  organizationId?: string;
  proxyUrl?: string;
}

export interface Base44App {
  id: string;
  name?: string;
  status?: 'ready' | 'processing' | 'error' | string;
  statusDetail?: string | null;
  slug?: string | null;
  previewScreenshotUrl?: string | null;
  screenshotUrl?: string | null;
  url?: string;
  sourceVersion?: string;
  createdAt?: string;
}

const CONFIG_KEY = 'vector_base44_config_v1';

export function readBase44Config(): Base44Config {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { token: '' };
    const parsed = JSON.parse(raw) as Partial<Base44Config>;
    return {
      token: typeof parsed.token === 'string' ? parsed.token : '',
      organizationId: typeof parsed.organizationId === 'string' ? parsed.organizationId : undefined,
      proxyUrl: typeof parsed.proxyUrl === 'string' ? parsed.proxyUrl : undefined,
    };
  } catch {
    return { token: '' };
  }
}

export function saveBase44Config(config: Base44Config): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function base44Configured(config: Base44Config): boolean {
  return Boolean(config.token.trim() || proxyEndpoint(config).trim());
}

function proxyEndpoint(config: Base44Config): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  return (config.proxyUrl || env.VITE_BASE44_PROXY_URL || '').trim();
}

function normalizeApp(payload: Record<string, unknown>, sourceVersion?: string): Base44App {
  const status = payload.status as { state?: string; details?: string | null } | undefined;
  const slug = typeof payload.slug === 'string' ? payload.slug : null;
  return {
    id: String(payload.id || ''),
    name: typeof payload.name === 'string' ? payload.name : undefined,
    status: status?.state,
    statusDetail: status?.details ?? null,
    slug,
    previewScreenshotUrl:
      typeof payload.preview_screenshot_url === 'string' ? payload.preview_screenshot_url : null,
    screenshotUrl: typeof payload.screenshot_url === 'string' ? payload.screenshot_url : null,
    url: slug ? `https://${slug}.base44.app` : 'https://app.base44.com',
    sourceVersion,
    createdAt: typeof payload.created_date === 'string' ? payload.created_date : undefined,
  };
}

async function request(
  config: Base44Config,
  path: string,
  init: RequestInit
): Promise<Record<string, unknown>> {
  const proxy = proxyEndpoint(config);
  if (proxy) {
    const url = new URL(proxy, window.location.origin).toString();
    const separator = url.includes('?') ? '&' : '?';
    const proxied = path ? `${url}${separator}path=${encodeURIComponent(path)}` : url;
    const response = await fetch(proxied, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...(config.token ? { 'x-base44-token': config.token } : {}),
        ...(config.organizationId ? { 'x-base44-organization': config.organizationId } : {}),
      },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(body || `Base44 proxy failed (${response.status}).`);
    }
    return (await response.json()) as Record<string, unknown>;
  }

  if (!config.token.trim()) {
    throw new Error('Connect Base44 first — add a workspace token in the Base44 panel.');
  }

  const response = await fetch(`https://app.base44.com${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${config.token.trim()}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    let detail = '';
    try {
      const parsed = JSON.parse(raw) as { message?: string; detail?: string; error?: { message?: string } };
      detail = parsed.error?.message || parsed.message || parsed.detail || '';
    } catch {
      detail = raw.slice(0, 180);
    }
    if (response.status === 401) {
      throw new Error('Base44 rejected the workspace token (401). Check the token and its app-create permission.');
    }
    throw new Error(
      detail
        ? `Base44 rejected the request (${response.status}): ${detail}`
        : `Base44 rejected the request (${response.status}). If the browser blocks direct access, deploy the Base44 proxy.`
    );
  }
  return (await response.json()) as Record<string, unknown>;
}

export async function createBase44App(options: {
  prompt: string;
  name: string;
  config: Base44Config;
  sourceVersion?: string;
}): Promise<Base44App> {
  const payload = await request(options.config, '/api/apps', {
    method: 'POST',
    body: JSON.stringify({
      initial_message: { content: options.prompt },
      name: options.name,
      prevent_iframe_embedding: false,
    }),
  });
  return normalizeApp(payload, options.sourceVersion);
}

export async function getBase44App(options: {
  id: string;
  config: Base44Config;
  sourceVersion?: string;
}): Promise<Base44App> {
  const payload = await request(options.config, `/api/apps/${options.id}`, { method: 'GET' });
  return normalizeApp(payload, options.sourceVersion);
}

export function readProjectBase44(projectId: string): Base44App | null {
  try {
    const raw = localStorage.getItem(`vector_project_base44_${projectId}`);
    return raw ? (JSON.parse(raw) as Base44App) : null;
  } catch {
    return null;
  }
}

export function saveProjectBase44(projectId: string, app: Base44App | null): void {
  try {
    if (app) localStorage.setItem(`vector_project_base44_${projectId}`, JSON.stringify(app));
    else localStorage.removeItem(`vector_project_base44_${projectId}`);
  } catch {
    // ignore
  }
}

export const BASE44_DEFAULT_URL = 'https://app.base44.com';

function base44PageKey(projectId: string): string {
  return `vector_project_base44_page_${projectId}`;
}

const BASE44_GUARD_KEY = 'vector_base44_guard_dismissed_v1';

/**
 * The embedded builder shows its own social buttons, so Vector points people at
 * the email form first. Once the person clicks inside the frame the pointer has
 * done its job and the hint is gone for good — on every project.
 */
export function readBase44GuardDismissed(): boolean {
  try {
    return localStorage.getItem(BASE44_GUARD_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveBase44GuardDismissed(): void {
  try {
    localStorage.setItem(BASE44_GUARD_KEY, '1');
  } catch {
    // ignore
  }
}

/** The exact Base44 page this project should embed and open. */
export function readBase44PageUrl(projectId: string): string {
  try {
    const explicit = localStorage.getItem(base44PageKey(projectId));
    if (explicit && /^https?:\/\//i.test(explicit)) return explicit;
    const app = readProjectBase44(projectId);
    if (app?.url && /^https?:\/\//i.test(app.url)) return app.url;
  } catch {
    // Storage is best effort; fall back to the Base44 home page.
  }
  return BASE44_DEFAULT_URL;
}

export function saveBase44PageUrl(projectId: string, url: string): string {
  const next = url.trim();
  if (!/^https?:\/\//i.test(next)) return readBase44PageUrl(projectId);
  try {
    localStorage.setItem(base44PageKey(projectId), next);
  } catch {
    // ignore
  }
  return next;
}
