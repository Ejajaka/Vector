import type { CanvasItem, CanvasPage } from '../data/canvas.ts';

function pageKey(page: CanvasPage): string {
  return String(page.name || page.id || '').trim().toLowerCase() || page.id;
}

/**
 * Live collaboration is merge-only: a peer can add or update elements, but an
 * older or partial document must never erase elements this browser already has.
 */
export function mergeCanvasPages(current: CanvasPage[], incoming: CanvasPage[]): CanvasPage[] {
  if (!incoming.length) return current;
  if (!current.length) return incoming;

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

  return Array.from(pages.values());
}
