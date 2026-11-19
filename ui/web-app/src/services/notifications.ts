export type NotificationKind = 'trial' | 'billing' | 'share' | 'deploy' | 'system' | 'learning';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  action?: { label: string; tab: string };
}

const STORAGE_KEY = 'vector_notifications_v1';

function seed(): AppNotification[] {
  const now = Date.now();
  const at = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
  return [
    {
      id: 'n-welcome',
      kind: 'learning',
      title: 'Your first two projects are free',
      body: 'Build two projects on the house, then pick a plan. Nothing is charged until you upgrade.',
      createdAt: at(3),
      readAt: null,
      action: { label: 'See plans', tab: 'pricing' },
    },
    {
      id: 'n-templates',
      kind: 'system',
      title: '10 new templates are live',
      body: 'Dashboards, commerce, auth and mobile screens — each with a full attribute preview.',
      createdAt: at(180),
      readAt: null,
      action: { label: 'Browse templates', tab: 'templates' },
    },
    {
      id: 'n-tour',
      kind: 'learning',
      title: 'Take the 60-second tour',
      body: 'A quick walkthrough of projects, the block palette and the risk score.',
      createdAt: at(1440),
      readAt: at(1400),
      action: { label: 'Start tour', tab: 'learn' },
    },
  ];
}

export const notificationService = {
  list(): AppNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = seed();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as AppNotification[]) : [];
    } catch {
      return [];
    }
  },

  save(items: AppNotification[]): AppNotification[] {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 40)));
    } catch {
      // best effort
    }
    window.dispatchEvent(new CustomEvent('vector:notifications'));
    return items;
  },

  push(input: Omit<AppNotification, 'id' | 'createdAt' | 'readAt'>): AppNotification[] {
    const items = notificationService.list();
    const next: AppNotification = {
      ...input,
      id: `n-${Date.now()}`,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    return notificationService.save([next, ...items]);
  },

  markAllRead(): AppNotification[] {
    const items = notificationService.list().map((item) =>
      item.readAt ? item : { ...item, readAt: new Date().toISOString() }
    );
    return notificationService.save(items);
  },

  markRead(id: string): AppNotification[] {
    const items = notificationService.list().map((item) =>
      item.id === id ? { ...item, readAt: new Date().toISOString() } : item
    );
    return notificationService.save(items);
  },

  unreadCount(): number {
    return notificationService.list().filter((item) => !item.readAt).length;
  },
};

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
