import type { Peer } from './collab.ts';
import { fetchWithTimeout } from './sharedDocs.ts';

export interface PresenceResult {
  ok: boolean;
  peers: Peer[];
}

/**
 * Heartbeat into the room's server-side presence table and read back everybody
 * who is still there. Unlike Realtime presence this survives socket reconnects,
 * so a collaborator cannot disappear while their browser is still open.
 */
export async function pingPresence(room: string, peer: Peer): Promise<PresenceResult> {
  if (!room || !peer?.id) return { ok: false, peers: [] };
  try {
    const response = await fetchWithTimeout('/api/presence', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        room,
        id: peer.id,
        name: peer.name,
        colour: peer.colour,
      }),
    }, 5000);
    if (!response.ok) return { ok: false, peers: [] };
    const body = await response.json();
    const peers = Array.isArray(body?.peers) ? (body.peers as Peer[]) : [];
    return { ok: true, peers };
  } catch {
    return { ok: false, peers: [] };
  }
}
