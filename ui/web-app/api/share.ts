import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const client = url && serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;

function projectFromRoom(room: string): string | null {
  if (room.startsWith('project_')) return room.slice('project_'.length);
  return null;
}

function memoryKey(room: string): string {
  return `shared_canvas:${room}`;
}

function mergeDocs(previous: any, incoming: any) {
  const pages = new Map<string, any>();
  const addPage = (page: any) => {
    const key = String(page?.name || page?.id || Math.random()).toLowerCase();
    const existing = pages.get(key);
    if (!existing) {
      pages.set(key, { ...page, items: Array.isArray(page?.items) ? [...page.items] : [] });
      return;
    }
    const items = new Map<string, any>();
    for (const item of existing.items || []) items.set(String(item.id), item);
    for (const item of page?.items || []) items.set(String(item.id), item);
    pages.set(key, {
      ...existing,
      ...page,
      items: Array.from(items.values()),
    });
  };
  for (const page of previous?.pages || []) addPage(page);
  for (const page of incoming?.pages || []) addPage(page);

  // Tombstones are permanent for the room: an element or page id is removed
  // only when an editor deliberately deletes it.
  const deletedItems = new Set<string>([
    ...(Array.isArray(previous?.deletedItems) ? previous.deletedItems : []),
    ...(Array.isArray(incoming?.deletedItems) ? incoming.deletedItems : []),
  ].map(String));
  const deletedPages = new Set<string>([
    ...(Array.isArray(previous?.deletedPages) ? previous.deletedPages : []),
    ...(Array.isArray(incoming?.deletedPages) ? incoming.deletedPages : []),
  ].map(String));

  const mergedPages = Array.from(pages.values())
    .filter((page) => !deletedPages.has(String(page?.id)) && !deletedPages.has(String(page?.name)))
    .map((page) => ({
      ...page,
      items: (page.items || []).filter((item: any) => !deletedItems.has(String(item?.id))),
    }));

  return {
    ...incoming,
    pages: mergedPages,
    deletedItems: Array.from(deletedItems).slice(-4000),
    deletedPages: Array.from(deletedPages).slice(-500),
    updatedAt: new Date().toISOString(),
  };
}

async function mergeAndSave(projectId: string, key: string, value: any) {
  if (!client) throw new Error('Shared canvases are not configured on this deployment.');
  // Two editors can save at the same time. Read-merge-write is retried against
  // the row version, so a slower request cannot overwrite a newer canvas or
  // drop its deletion tombstones.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data: existing, error: readError } = await client
      .from('project_memory')
      .select('value, updated_at')
      .eq('project_id', projectId)
      .eq('key', key)
      .maybeSingle();
    if (readError) throw new Error(readError.message);

    const merged = mergeDocs(existing?.value || null, value);
    const now = new Date().toISOString();

    if (existing) {
      const { data, error } = await client
        .from('project_memory')
        .update({ value: merged, updated_at: now })
        .eq('project_id', projectId)
        .eq('key', key)
        .eq('updated_at', existing.updated_at)
        .select('value');
      if (error) throw new Error(error.message);
      if (data && data.length) return merged;
      await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 160));
      continue;
    }

    const { error: insertError } = await client
      .from('project_memory')
      .insert({ project_id: projectId, key, value: merged, updated_at: now });
    if (!insertError) return merged;
    // Another request inserted the row first; retry as an update.
  }
  throw new Error('Could not save the shared canvas. Please try again.');
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (!client) {
    res.status(503).json({ error: 'Shared canvases are not configured on this deployment.' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const room = String(req.query.room || '');
      const projectId = String(req.query.projectId || projectFromRoom(room) || '');
      if (!room || !projectId) {
        res.status(400).json({ error: 'room and projectId are required.' });
        return;
      }
      const { data, error } = await client
        .from('project_memory')
        .select('value, updated_at')
        .eq('project_id', projectId)
        .eq('key', memoryKey(room))
        .maybeSingle();
      if (error) throw new Error(error.message);
      res.status(200).json({ doc: data?.value || null });
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const room = String(body.room || '');
      const projectId = String(body.projectId || projectFromRoom(room) || '');
      const pages = Array.isArray(body.pages) ? body.pages : [];
      if (!room || !projectId || !pages.length) {
        res.status(400).json({ error: 'room, projectId and pages are required.' });
        return;
      }
      const value = {
        name: String(body.name || 'Shared screen'),
        pages,
        ownerId: body.ownerId || null,
        projectId,
        deletedItems: Array.isArray(body.deletedItems) ? body.deletedItems.map(String) : [],
        deletedPages: Array.isArray(body.deletedPages) ? body.deletedPages.map(String) : [],
        updatedAt: new Date().toISOString(),
      };
      const merged = await mergeAndSave(projectId, memoryKey(room), value);
      res.status(200).json({ ok: true, doc: merged });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Shared canvas request failed.' });
  }
}
