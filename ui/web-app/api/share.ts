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

export default async function handler(req: any, res: any) {
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
        updatedAt: new Date().toISOString(),
      };
      const { error } = await client.from('project_memory').upsert(
        {
          project_id: projectId,
          key: memoryKey(room),
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'project_id,key' },
      );
      if (error) throw new Error(error.message);
      res.status(200).json({ ok: true, doc: value });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Shared canvas request failed.' });
  }
}
