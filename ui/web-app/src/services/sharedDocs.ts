import type { CanvasPage } from '../data/canvas.ts';
import { isSupabaseConfigured, supabase } from './supabase/client.ts';

export interface SharedDoc {
  name: string;
  pages: CanvasPage[];
  ownerId?: string | null;
  projectId?: string | null;
  /** Element ids that were deliberately removed from the room. */
  deletedItems?: string[];
  /** Page ids that were deliberately removed from the room. */
  deletedPages?: string[];
}

function tombstones(doc: SharedDoc): { deletedItems: string[]; deletedPages: string[] } {
  return {
    deletedItems: Array.isArray(doc.deletedItems) ? doc.deletedItems.map(String) : [],
    deletedPages: Array.isArray(doc.deletedPages) ? doc.deletedPages.map(String) : [],
  };
}

/**
 * Collaboration requests must never hang. A stalled request used to hold the
 * poll lock and stop canvas updates until the browser gave up (sometimes 20s).
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A share link can carry the canvas snapshot itself. This keeps the recipient
 * on the same page as the sender even when the optional shared-doc table is
 * not deployed or the room has not been seeded yet.
 */
export function encodeSharedCanvas(doc: SharedDoc): string {
  const json = JSON.stringify({
    name: doc.name,
    pages: doc.pages,
    ownerId: doc.ownerId || null,
    projectId: doc.projectId || null,
  });
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSharedCanvas(value: string | null): SharedDoc | null {
  if (!value) return null;
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<SharedDoc>;
    if (!Array.isArray(parsed.pages) || !parsed.pages.length) return null;
    return {
      name: String(parsed.name || 'Shared screen'),
      pages: parsed.pages as CanvasPage[],
      ownerId: parsed.ownerId || null,
      projectId: parsed.projectId || null,
    };
  } catch {
    return null;
  }
}

export async function loadSharedDoc(room: string): Promise<SharedDoc | null> {
  if (!room) return null;
  try {
    const url = new URL('/api/share', window.location.origin);
    url.searchParams.set('room', room);
    const projectId = room.startsWith('project_') ? room.slice('project_'.length) : '';
    if (projectId) url.searchParams.set('projectId', projectId);
    const response = await fetchWithTimeout(url.toString(), { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (response.ok) {
      const body = await response.json();
      const doc = body?.doc;
      if (doc && Array.isArray(doc.pages) && doc.pages.length) {
        return {
          name: String(doc.name || 'Shared screen'),
          pages: doc.pages as CanvasPage[],
          ownerId: doc.ownerId || null,
          projectId: doc.projectId || projectId || null,
          deletedItems: Array.isArray(doc.deletedItems) ? doc.deletedItems.map(String) : [],
          deletedPages: Array.isArray(doc.deletedPages) ? doc.deletedPages.map(String) : [],
        };
      }
    }
  } catch {
    // Fall through to the Supabase table for older deployments.
  }

  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const result = await Promise.race([
      supabase
        .from('shared_project_docs')
        .select('name, pages, owner_id, project_id')
        .eq('room', room)
        .maybeSingle(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (!result) return null;
    const { data, error } = result;
    if (error || !data) return null;
    const pages = Array.isArray(data.pages) ? (data.pages as CanvasPage[]) : [];
    if (!pages.length) return null;
    return {
      name: String(data.name || 'Shared screen'),
      pages,
      ownerId: data.owner_id || null,
      projectId: data.project_id || null,
    };
  } catch {
    return null;
  }
}

export async function saveSharedDoc(
  room: string,
  doc: SharedDoc,
): Promise<void> {
  if (!room) return;
  const removed = tombstones(doc);
  // The room API can be slow. Retry in the background so the last edit is not
  // lost when a single request times out.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchWithTimeout('/api/share', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, ...doc, ...removed }),
      }, 7000);
      if (response.ok) return;
    } catch {
      // Retry below.
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
  }

  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('shared_project_docs').upsert(
    {
      room,
      owner_id: doc.ownerId || null,
      project_id: doc.projectId || null,
      name: doc.name,
      pages: doc.pages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'room' },
  );
}

/** Ids that existed in `previous` but are gone from `next`. */
export function removedSince(
  previous: { pages: CanvasPage[] },
  next: { pages: CanvasPage[] },
): { deletedItems: string[]; deletedPages: string[] } {
  const previousItems = new Set<string>();
  previous.pages.forEach((page) => page.items.forEach((item) => previousItems.add(String(item.id))));
  const nextItems = new Set<string>();
  next.pages.forEach((page) => page.items.forEach((item) => nextItems.add(String(item.id))));
  const previousPages = new Set(previous.pages.map((page) => String(page.id)));
  const nextPages = new Set(next.pages.map((page) => String(page.id)));
  return {
    deletedItems: Array.from(previousItems).filter((id) => !nextItems.has(id)),
    deletedPages: Array.from(previousPages).filter((id) => !nextPages.has(id)),
  };
}
