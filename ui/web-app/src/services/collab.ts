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
const STALE_MS = 12_000;

export function sharingMode(): 'cloud' | 'local' {
  return isSupabaseConfigured ? 'cloud' : 'local';
}

export function randomColour(seed: string): string {
  const sum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PEER_COLOURS[sum % PEER_COLOURS.length];
}

export function makePeer(name: string): Peer {
  const id = `peer_${Math.random().toString(36).slice(2, 10)}`;
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
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, Array<{ peer?: Peer }>>;
        const peers: Peer[] = [];
        Object.values(state).forEach((entries) => {
          entries.forEach((entry) => {
            const peer = entry?.peer;
            if (peer && peer.id !== this.me.id) peers.push({ ...peer, lastSeen: Date.now() });
          });
        });
        this.peers = new Map(peers.map((peer) => [peer.id, peer]));
        this.emit();
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') void channel.track({ peer: this.me, online_at: new Date().toISOString() });
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
      this.broadcastDocIfAuthoritative();
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
      if (ids[0] === this.me.id) this.broadcastDocIfAuthoritative();
      return;
    }

    if (message.type === 'doc') {
      this.handlers.onDoc(message);
    }
  }

  setDocProvider(provider: () => { name: string; pages: CanvasPage[] } | null): void {
    this.docProvider = provider;
  }

  private broadcastDocIfAuthoritative(): void {
    const ids = [this.me.id, ...this.peers.keys()].sort();
    if (ids[0] === this.me.id) {
      const doc = this.docProvider();
      if (doc) this.post({ type: 'doc', ...doc, by: this.me.id });
    }
  }

  private prune(): void {
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
    this.handlers.onPeers(Array.from(this.peers.values()).map((peer) => ({ ...peer })));
  }

  presence(patch: Partial<Peer>): void {
    this.me = { ...this.me, ...patch, lastSeen: Date.now() };
    this.post({ type: 'presence', peer: this.me });
    this.cloud?.track({ peer: this.me, online_at: new Date().toISOString() });
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
