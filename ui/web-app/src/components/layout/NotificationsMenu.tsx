import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Rocket, Share2, Sparkles, Wallet } from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import {
  notificationService,
  relativeTime,
  type AppNotification,
  type NotificationKind,
} from '../../services/notifications.ts';

interface NotificationsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (tab: ActiveTab) => void;
}

const ICONS: Record<NotificationKind, React.ElementType> = {
  trial: Wallet,
  billing: Wallet,
  share: Share2,
  deploy: Rocket,
  system: Bell,
  learning: Sparkles,
};

const TONES: Record<NotificationKind, string> = {
  trial: 'bg-[#FEFCE8] text-[#856C16] dark:bg-[#2D2A17] dark:text-[#E2C768]',
  billing: 'bg-[#F4F9F1] text-[#3E6B33] dark:bg-[#1A281E] dark:text-[#8AE07E]',
  share: 'bg-[#F0F5F5] text-[#49686C] dark:bg-[#1F2D2F] dark:text-[#7AA2A6]',
  deploy: 'bg-[#F0F5F5] text-[#49686C] dark:bg-[#1F2D2F] dark:text-[#7AA2A6]',
  system: 'bg-[#F6F4EC] text-[#737A72] dark:bg-[#222E30] dark:text-[#8E9A93]',
  learning: 'bg-[#FEFCE8] text-[#856C16] dark:bg-[#2D2A17] dark:text-[#E2C768]',
};

export const NotificationsMenu: React.FC<NotificationsMenuProps> = ({ open, onOpenChange, onNavigate }) => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => setItems(notificationService.list());

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener('vector:notifications', onChange);
    return () => window.removeEventListener('vector:notifications', onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  const unread = items.filter((item) => !item.readAt).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className={`relative p-2 rounded-lg transition-colors ${
          open
            ? 'bg-[#F6F4EC] dark:bg-[#263335] text-[#283638] dark:text-white'
            : 'text-[#737A72] dark:text-[#8E9A93] hover:text-[#283638] dark:hover:text-white hover:bg-[#F6F4EC] dark:hover:bg-[#263335]'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#B94D42] text-white text-[9px] font-semibold grid place-items-center leading-none">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-[#FFFFFF] dark:bg-[#1B2426] border border-[#E5E2D8] dark:border-[#33403F] rounded-lg shadow-[0_24px_60px_-24px_rgba(16,32,32,0.45)] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E2D8] dark:border-[#29383A]">
            <div>
              <p className="text-[13px] font-semibold text-[#283638] dark:text-[#E7E4D9]">Notifications</p>
              <p className="text-[10.5px] text-[#737A72] dark:text-[#8E9A93]">
                {unread > 0 ? `${unread} unread` : 'You are all caught up'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setItems(notificationService.markAllRead())}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#49686C] dark:text-[#B9D1D4] hover:underline"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-[12px] text-[#737A72]">Nothing here yet.</p>
            )}
            {items.map((item) => {
              const Icon = ICONS[item.kind] || Bell;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setItems(notificationService.markRead(item.id));
                    if (item.action) onNavigate(item.action.tab as ActiveTab);
                    onOpenChange(false);
                  }}
                  className={`w-full flex gap-3 px-4 py-3 text-left border-b border-[#F0EDE3] dark:border-[#222E30] last:border-0 transition-colors hover:bg-[#F6F4EC] dark:hover:bg-[#222E30] ${
                    item.readAt ? 'opacity-70' : ''
                  }`}
                >
                  <span className={`mt-0.5 w-8 h-8 rounded-full grid place-items-center shrink-0 ${TONES[item.kind]}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className="text-[12.5px] font-semibold text-[#283638] dark:text-[#E7E4D9] leading-snug">
                        {item.title}
                      </span>
                      {!item.readAt && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D1B653] shrink-0" />}
                    </span>
                    <span className="block mt-0.5 text-[11.5px] text-[#737A72] dark:text-[#8E9A93] leading-relaxed">
                      {item.body}
                    </span>
                    <span className="block mt-1 text-[10px] uppercase tracking-wider text-[#A8A296]">
                      {relativeTime(item.createdAt)}
                      {item.action ? ` · ${item.action.label}` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2.5 bg-[#FAFAF8] dark:bg-[#202A2B] border-t border-[#E5E2D8] dark:border-[#29383A]">
            <p className="text-[10px] text-[#737A72] dark:text-[#8E9A93]">
              Deployment, sharing and billing events appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
