import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  CircleHelp,
  Download,
  Laptop,
  Lightbulb,
  LogOut,
  Settings,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { planFor, readEntitlements } from '../../services/entitlements.ts';
import { WindowsDownloadDialog } from '../downloads/WindowsDownloadDialog.tsx';

interface ProfileMenuProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onSignOut: () => void;
  onReplayTour: () => void;
  unreadCount: number;
}

function initials(name: string): string {
  const parts = name.replace(/@.*/, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'V';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  activeTab,
  onNavigate,
  onSignOut,
  onReplayTour,
  unreadCount,
}) => {
  const { user, localMode } = useAuth();
  const [open, setOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const plan = planFor(readEntitlements().plan);
  const displayName =
    (user?.user_metadata?.display_name as string | undefined)?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email ||
    'Local workspace';
  const email = user?.email || (localMode ? 'Saved in this browser only' : 'Not signed in');

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (tab: ActiveTab) => {
    onNavigate(tab);
    setOpen(false);
  };

  const openHub = (tab: 'included' | 'usage') => {
    window.dispatchEvent(new CustomEvent('vector:open-plan-hub', { detail: tab }));
    setOpen(false);
  };

  const Row: React.FC<{
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    trailing?: React.ReactNode;
    danger?: boolean;
  }> = ({ icon: Icon, label, onClick, trailing, danger }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] transition-colors ${
        danger
          ? 'text-[#B94D42] hover:bg-[#FDF2F0] dark:hover:bg-[#2F1B1A]'
          : 'text-[#283638] dark:text-[#E7E4D9] hover:bg-[#F6F4EC] dark:hover:bg-[#222E30]'
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${danger ? 'text-[#B94D42]' : 'text-[#737A72] dark:text-[#8E9A93]'}`} />
      <span className="flex-1 truncate">{label}</span>
      {trailing}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu (${initials(displayName)})`}
        className={`relative w-8 h-8 rounded-full grid place-items-center text-[11px] font-semibold text-white transition-transform hover:scale-105 ${
          open ? 'ring-2 ring-[#49686C] ring-offset-2 ring-offset-[#FFFFFF] dark:ring-offset-[#1B2426]' : ''
        }`}
        style={{ background: 'linear-gradient(135deg, #5e6ad2, #7170ff)' }}
      >
        {initials(displayName)}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#D1B653] border-2 border-[#FFFFFF] dark:border-[#1B2426]" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="v-scroll absolute right-0 top-full z-50 mt-2 max-h-[calc(100vh-4rem)] w-[320px] overflow-y-auto overflow-x-hidden rounded-lg border border-[#E5E2D8] bg-[#FFFFFF] shadow-[0_24px_60px_-24px_rgba(16,32,32,0.45)] dark:border-[#33403F] dark:bg-[#1B2426]"
        >
          {/* Account header */}
          <button
            type="button"
            onClick={() => go('settings')}
            className="w-full flex items-center gap-3 px-4 py-4 border-b border-[#E5E2D8] dark:border-[#29383A] hover:bg-[#F6F4EC] dark:hover:bg-[#222E30] transition-colors text-left"
          >
            <span
              className="w-11 h-11 rounded-full grid place-items-center text-sm font-semibold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #5e6ad2, #7170ff)' }}
            >
              {initials(displayName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-[#283638] dark:text-[#E7E4D9] truncate">
                {displayName}
              </span>
              <span className="block text-[11px] text-[#737A72] dark:text-[#8E9A93] truncate">{email}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#737A72] shrink-0" />
          </button>

          {/* Menu */}
          <div className="p-2">
            <Row icon={Wallet} label="Plans and pricing" onClick={() => go('pricing')} />
            <Row icon={Lightbulb} label="Your plan and usage" onClick={() => openHub('usage')} />
          </div>

          <div className="h-px bg-[#E5E2D8] dark:bg-[#29383A] mx-2" />

          {/* Help and account links */}
          <div className="p-2 space-y-1">
            <Row icon={CircleHelp} label="Help and feedback" onClick={() => go('learn')} />
            <Row icon={ShieldCheck} label="Privacy" onClick={() => go('privacy')} />
            <Row icon={Settings} label="Settings" onClick={() => go('settings')} />
            <Row icon={Download} label="Download for Windows" onClick={() => { setOpen(false); setDownloadOpen(true); }} />
          </div>

          <div className="h-px bg-[#E5E2D8] dark:bg-[#29383A] mx-2" />

          <div className="p-2">
            <Row icon={LogOut} label="Log out" onClick={onSignOut} danger />
          </div>

          <div className="px-4 py-2.5 bg-[#FAFAF8] dark:bg-[#202A2B] border-t border-[#E5E2D8] dark:border-[#29383A]">
            <p className="text-[10px] text-[#737A72] dark:text-[#8E9A93] flex items-center gap-1.5">
              <Laptop className="w-3 h-3" /> Vector v2.0 · {plan.name} plan
            </p>
          </div>
        </div>
      )}

      <WindowsDownloadDialog open={downloadOpen} onClose={() => setDownloadOpen(false)} />
    </div>
  );
};
