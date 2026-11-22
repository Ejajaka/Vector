import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const client = url && serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;

const PRESENCE_TTL_MS = 20_000;
const MAX_NAME = 60;

function projectFromRoom(room: string): string | null {
  if (room.startsWith('project_')) return room.slice('project_'.length);
  return null;
}

function presenceKey(room: string, id: string): string {
  return `presence:${room}:${id}`;
}

/**
 * Presence heartbeats for live rooms.
 *
 * Realtime presence drops collaborators when a socket reconnect races a channel
 * subscribe, so the room also tracks presence in the database. Every editor
 * pings this endpoint, and the response is the authoritative list of people who
 * are still in the room. Closing a tab stops the heartbeat; the entry expires
 * after 20 seconds.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (!client) {
    res.status(503).json({ peers: [], error: 'Live collaboration is not configured on this deployment.' });
    return;
  }

  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      res.setHeader('Allow', 'GET, POST');
      res.status(405).json({ peers: [], error: 'Method not allowed.' });
      return;
    }

    const source = req.method === 'POST'
      ? typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
      : req.query || {};
    const room = String(source.room || '');
    const projectId = String(source.projectId || projectFromRoom(room) || '');
    const id = String(source.id || '');
    const name = String(source.name || 'Guest').slice(0, MAX_NAME);
    const colour = String(source.colour || '#7C5CFF').slice(0, 30);

    if (!room || !projectId || !id) {
      res.status(400).json({ peers: [], error: 'room, projectId and id are required.' });
      return;
    }

    const now = Date.now();
    const { error: writeError } = await client.from('project_memory').upsert(
      {
        project_id: projectId,
        key: presenceKey(room, id),
        value: { id, name, colour, lastSeen: now },
        updated_at: new Date(now).toISOString(),
      },
      { onConflict: 'project_id,key' },
    );
    if (writeError) throw new Error(writeError.message);

    const { data, error } = await client
      .from('project_memory')
      .select('key, value, updated_at')
      .eq('project_id', projectId)
      .like('key', `presence:${room}:%`);
    if (error) throw new Error(error.message);

    const peers: Array<{ id: string; name: string; colour: string; lastSeen: number }> = [];
    const stale: string[] = [];
    for (const row of data || []) {
      const value = row.value || {};
      const lastSeen = Number(value.lastSeen || Date.parse(row.updated_at) || 0);
      if (!lastSeen || now - lastSeen > PRESENCE_TTL_MS) {
        stale.push(row.key);
        continue;
      }
      if (value.id && value.id !== id) {
        peers.push({
          id: String(value.id),
          name: String(value.name || 'Guest'),
          colour: String(value.colour || '#7C5CFF'),
          lastSeen,
        });
      }
    }

    if (stale.length) {
      await client.from('project_memory').delete().eq('project_id', projectId).in('key', stale);
    }

    res.status(200).json({ peers });
  } catch (error) {
    res.status(500).json({ peers: [], error: error instanceof Error ? error.message : 'Presence request failed.' });
  }
}
