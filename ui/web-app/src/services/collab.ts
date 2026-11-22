/**
 * Collaboration session.
 *
 * Two transports, picked automatically:
 *
 *  • cloud — Supabase Realtime, when VITE_SUPABASE_URL / ANON_KEY are set.
 *    Everyone who opens the same share link edits together, from any device.
 *
 *  • local — BroadcastChannel, when Supabase is not configured.
 *    Real-time across tabs and windows on this browser only.
 *
 * The editor does not care which is active: both speak the same message shape.
 */

import type { CanvasPage } from '../data/canvas.ts';
import { isSupabaseConfigured, supabase } from './supabase/client.ts';
import { pingPresence } from './presenceApi.ts';

export interface Peer {
  id: string;
  name: string;
  colour: string;
  cursor?: { x: number; y: number };
  pageId?: string;
  selectedId?: string | null;
  editing?: boolean;
  lastSeen: number;
}

export interface CollabHandlers {
  onPeers: (peers: Peer[]) => void;
  onDoc: (doc: { name: string; pages: CanvasPage[]; by: string }) => void;
}

type Message =
  | { type: 'hello'; peer: Peer }
  | { type: 'presence'; peer: Peer }
  | { type: 'bye'; id: string }
  | { type: 'request'; from: string }
  | { type: 'doc'; name: string; pages: CanvasPage[]; by: string };

const PEER_COLOURS = ['#7C5CFF', '#0D99FF', '#A78BFA', '#FF7A59', '#FFC53D', '#E879F9', '#FF5C8A'];
const STALE_MS = 45_000;

export function sharingMode(): 'cloud' | 'local' {
  return isSupabaseConfigured ? 'cloud' : 'local';
}

export function randomColour(seed: string): string {
  const sum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PEER_COLOURS[sum % PEER_COLOURS.length];
}

export function makePeer(name: string): Peer {
  // A tab keeps one identity even if the editor remounts (for example when the
  // signed-in profile finishes loading). Realtime presence and the server-side
  // heartbeat then agree on who is in the room.
  let id = '';
  try {
    const key = 'vector_peer_id';
    let saved = sessionStorage.getItem(key);
    if (!saved || !saved.startsWith('peer_')) {
      saved = `peer_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(key, saved);
    }
    id = saved;
  } catch {
    id = `peer_${Math.random().toString(36).slice(2, 10)}`;
  }
  return {
    id,
    name: name || 'Guest',
    colour: randomColour(id),
    lastSeen: Date.now(),
    selectedId: null,
  };
}

export class CollabSession {
  private channel: BroadcastChannel | null = null;
  private cloud: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
  private peers = new Map<string, Peer>();
  private heartbeat: number | null = null;
  private sweep: number | null = null;
  private presenceTimer: number | null = null;
  private serverPeers = new Map<string, Peer>();
  private serverMissing = new Map<string, number>();
  private serverPresenceAt = 0;
  private me: Peer;
  private room: string;
  private handlers: CollabHandlers;
  private docProvider: () => { name: string; pages: CanvasPage[] } | null = () => null;
  readonly mode: 'cloud' | 'local' = sharingMode();

  constructor(room: string, me: Peer, handlers: CollabHandlers) {
    this.room = room;
    this.me = me;
    this.handlers = handlers;

    if (supabase) {
      this.connectCloud();
    } else if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(`vector-collab:${room}`);
      this.channel.onmessage = (event: MessageEvent<Message>) => this.receive(event.data);
    }

    this.post({ type: 'hello', peer: this.me });
    this.post({ type: 'request', from: this.me.id });

    this.heartbeat = window.setInterval(() => {
      this.me.lastSeen = Date.now();
      this.post({ type: 'presence', peer: this.me });
      this.cloud?.track({ peer: this.me, online_at: new Date().toISOString() });
      this.prune();
    }, 3000);

    this.sweep = window.setInterval(() => this.prune(), 4000);

    if (this.cloud) {
      this.pingServerPresence();
      this.presenceTimer = window.setInterval(() => this.pingServerPresence(), 5000);
    }
  }

  /**
   * Realtime presence can drop a collaborator for a few seconds while a socket
   * reconnects. The room's server-side heartbeat is authoritative, so show the
   * people who pinged within the last few seconds.
   */
  private async pingServerPresence(): Promise<void> {
    const result = await pingPresence(this.room, this.me);
    if (!result.ok) {
      if (Date.now() - this.serverPresenceAt > 30_000) {
        this.serverPeers = new Map();
        this.serverPresenceAt = 0;
        this.emit();
      }
      return;
    }
    const next = new Map<string, Peer>();
    const now = Date.now();
    const seen = new Set<string>();
    result.peers.forEach((peer) => {
      if (!peer?.id || peer.id === this.me.id) return;
      seen.add(peer.id);
      next.set(peer.id, { ...peer, lastSeen: now });
    });
    // Keep someone visible through a single missed heartbeat or a flaky read;
    // remove them only when they have been absent for a couple of polls.
    this.serverPeers.forEach((peer, id) => {
      if (seen.has(id)) {
        this.serverMissing.delete(id);
        next.set(id, peer);
        return;
      }
      const missingSince = this.serverMissing.get(id) || now;
      this.serverMissing.set(id, missingSince);
      if (now - missingSince < 10_000) next.set(id, peer);
    });
    for (const id of Array.from(this.serverMissing.keys())) {
      if (!next.has(id)) this.serverMissing.delete(id);
    }
    this.serverPeers = next;
    this.serverPresenceAt = now;
    this.emit();
  }

  private syncRealtimePresence(): void {
    if (!this.cloud) return;
    const state = this.cloud.presenceState() as Record<string, Array<{ peer?: Peer }>>;
    Object.values(state).forEach((entries) => {
      entries.forEach((entry) => {
        const peer = entry?.peer;
        if (peer && peer.id !== this.me.id) this.peers.set(peer.id, { ...peer, lastSeen: Date.now() });
      });
    });
    this.emit();
  }

  private connectCloud(): void {
    if (!supabase) return;
    const channel = supabase.channel(`vector-canvas:${this.room}`, {
      config: {
        broadcast: { self: false },
        presence: { key: this.me.id },
      },
    });

    channel
      .on('broadcast', { event: 'msg' }, ({ payload }: { payload: Message }) => this.receive(payload))
      .on('presence', { event: 'sync' }, () => this.syncRealtimePresence())
      .on('presence', { event: 'join' }, () => this.syncRealtimePresence())
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          void channel.track({ peer: this.me, online_at: new Date().toISOString() });
          this.pingServerPresence();
        }
      });

    this.cloud = channel;
  }

  private post(message: Message): void {
    if (this.cloud) {
      void this.cloud.send({ type: 'broadcast', event: 'msg', payload: message });
      return;
    }
    this.channel?.postMessage(message);
  }

  private receive(message: Message): void {
    if (!message || typeof message !== 'object') return;

    if (message.type === 'hello') {
      if (message.peer.id === this.me.id) return;
      this.peers.set(message.peer.id, { ...message.peer, lastSeen: Date.now() });
      this.emit();
      this.post({ type: 'presence', peer: this.me });
      this.broadcastDocIfAvailable();
      return;
    }

    if (message.type === 'presence') {
      if (message.peer.id === this.me.id) return;
      this.peers.set(message.peer.id, { ...message.peer, lastSeen: Date.now() });
      this.emit();
      return;
    }

    if (message.type === 'bye') {
      this.peers.delete(message.id);
      this.emit();
      return;
    }

    if (message.type === 'request') {
      const ids = [this.me.id, ...this.peers.keys()].sort();
      if (ids[0] === this.me.id) this.broadcastDocIfAvailable();
      return;
    }

    if (message.type === 'doc') {
      this.handlers.onDoc(message);
    }
  }

  setDocProvider(provider: () => { name: string; pages: CanvasPage[] } | null): void {
    this.docProvider = provider;
  }

  private broadcastDocIfAvailable(): void {
    const doc = this.docProvider();
    if (doc) this.post({ type: 'doc', ...doc, by: this.me.id });
  }

  private prune(): void {
    // Cloud presence is authoritative: Supabase emits a fresh sync on join,
    // leave and heartbeat, so a browser throttling its timers in the
    // background must not make a collaborator disappear.
    if (this.cloud) return;
    const now = Date.now();
    let changed = false;
    this.peers.forEach((peer, id) => {
      if (now - peer.lastSeen > STALE_MS) {
        this.peers.delete(id);
        changed = true;
      }
    });
    if (changed) this.emit();
  }

  private emit(): void {
    // The server heartbeat is authoritative while it is fresh: a collaborator
    // stays visible for as long as their browser keeps pinging.
    const serverFresh = this.serverPresenceAt > 0 && Date.now() - this.serverPresenceAt < 15_000;
    const source = serverFresh ? this.serverPeers : this.peers;
    this.handlers.onPeers(Array.from(source.values()).map((peer) => ({ ...peer })));
  }

  presence(patch: Partial<Peer>): void {
    this.me = { ...this.me, ...patch, lastSeen: Date.now() };
    this.post({ type: 'presence', peer: this.me });
    this.cloud?.track({ peer: this.me, online_at: new Date().toISOString() });
    if (this.cloud) void this.pingServerPresence();
  }

  publish(doc: { name: string; pages: CanvasPage[] }): void {
    this.post({ type: 'doc', ...doc, by: this.me.id });
  }

  get self(): Peer {
    return this.me;
  }

  close(): void {
    this.post({ type: 'bye', id: this.me.id });
    if (this.heartbeat) window.clearInterval(this.heartbeat);
    if (this.sweep) window.clearInterval(this.sweep);
    if (this.presenceTimer) window.clearInterval(this.presenceTimer);
    this.channel?.close();
    if (this.cloud && supabase) void supabase.removeChannel(this.cloud);
  }
}

/* ------------------------------------------------------------------ */
/* Room helpers                                                        */
/* ------------------------------------------------------------------ */

export function roomFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  } catch {
    return null;
  }
}

export function currentRoom(): string {
  const fromUrl = roomFromUrl();
  if (fromUrl) return fromUrl;
  try {
    const saved = localStorage.getItem('vector_room_id_v1');
    if (saved) return saved;
    const created = `room_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('vector_room_id_v1', created);
    return created;
  } catch {
    return 'local-room';
  }
}


/** Stable room for a project, shared by every collaborator link. */
export function projectRoom(projectId: string): string {
  return `project_${projectId}`;
}

export function shareLink(room: string): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('room', room);
  return url.toString();
}

export interface Invite {
  id: string;
  email: string;
  role: 'edit' | 'view';
  invitedAt: string;
}

const INVITES_KEY = 'vector_invites_v1';

export function readInvites(): Invite[] {
  try {
    const raw = localStorage.getItem(INVITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addInvite(email: string, role: 'edit' | 'view'): Invite[] {
  const next = [
    ...readInvites(),
    { id: `inv_${Date.now()}`, email, role, invitedAt: new Date().toISOString() },
  ];
  try {
    localStorage.setItem(INVITES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
