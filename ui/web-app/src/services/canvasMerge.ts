import type { CanvasItem, CanvasPage } from '../data/canvas.ts';

export interface CanvasTombstones {
  deletedItems?: string[];
  deletedPages?: string[];
}

export interface CanvasPatch {
  name: string;
  /** Only pages (and items) that changed since the last broadcast. */
  pages: CanvasPage[];
  deletedItems: string[];
  deletedPages: string[];
}

/**
 * Build a compact patch for Realtime. Supabase rejects large broadcast
 * payloads, so full canvases are only exchanged through the room API; edits go
 * out as small per-item patches.
 */
export function buildCanvasPatch(
  previous: { name: string; pages: CanvasPage[] },
  next: { name: string; pages: CanvasPage[] },
): CanvasPatch | null {
  const previousPages = new Map(previous.pages.map((page) => [String(page.id), page]));
  const nextPages = new Map(next.pages.map((page) => [String(page.id), page]));
  const changedPages: CanvasPage[] = [];
  const deletedItems: string[] = [];
  const deletedPages: string[] = [];

  for (const [id, page] of nextPages) {
    const before = previousPages.get(id);
    const beforeItems = new Map((before?.items || []).map((item) => [String(item.id), item]));
    const nextItemIds = new Set(page.items.map((item) => String(item.id)));
    const changedItems = page.items.filter((item) => {
      const old = beforeItems.get(String(item.id));
      return !old || JSON.stringify(old) !== JSON.stringify(item);
    });
    for (const oldId of beforeItems.keys()) {
      if (!nextItemIds.has(oldId)) deletedItems.push(oldId);
    }
    const metaChanged =
      !before ||
      before.name !== page.name ||
      before.width !== page.width ||
      before.height !== page.height ||
      before.background !== page.background;
    if (!before || metaChanged || changedItems.length) {
      changedPages.push({ ...page, items: changedItems });
    }
  }

  for (const id of previousPages.keys()) {
    if (!nextPages.has(id)) deletedPages.push(id);
  }

  if (!changedPages.length && !deletedItems.length && !deletedPages.length) return null;
  return { name: next.name, pages: changedPages, deletedItems, deletedPages };
}

function pageKey(page: CanvasPage): string {
  return String(page.name || page.id || '').trim().toLowerCase() || page.id;
}

/**
 * Live collaboration is merge-only: a peer can add or update elements, but an
 * older or partial document must never erase elements this browser already has.
 * Deletions travel separately as tombstones so a removed element is not
 * resurrected by the next merge.
 */
export function mergeCanvasPages(
  current: CanvasPage[],
  incoming: CanvasPage[],
  deleted: CanvasTombstones = {},
): CanvasPage[] {
  if (!incoming.length && !current.length) return current;

  const pages = new Map<string, CanvasPage>();
  for (const page of current) {
    pages.set(pageKey(page), { ...page, items: Array.isArray(page.items) ? [...page.items] : [] });
  }

  for (const page of incoming) {
    const key = pageKey(page);
    const existing = pages.get(key);
    if (!existing) {
      pages.set(key, { ...page, items: Array.isArray(page.items) ? [...page.items] : [] });
      continue;
    }
    const items = new Map<string, CanvasItem>();
    for (const item of existing.items) items.set(String(item.id), item);
    for (const item of page.items || []) items.set(String(item.id), item);
    pages.set(key, {
      ...existing,
      ...page,
      items: Array.from(items.values()),
    });
  }

  const goneItems = new Set((deleted.deletedItems || []).map(String));
  const gonePages = new Set((deleted.deletedPages || []).map(String));
  const merged = Array.from(pages.values())
    .filter((page) => !gonePages.has(String(page.id)) && !gonePages.has(String(page.name)))
    .map((page) => ({
      ...page,
      items: page.items.filter((item) => !goneItems.has(String(item.id))),
    }));

  if (!merged.length) {
    // Never hand the editor zero pages; keep one blank surface to draw on.
    return current.length ? [current[0]] : incoming.length ? [incoming[0]] : [];
  }
  return merged;
}
