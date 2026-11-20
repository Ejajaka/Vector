import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Briefcase,
  ChevronRight,
  CircleHelp,
  Flag,
  Globe,
  History,
  Laptop,
  LayoutGrid,
  Lightbulb,
  LogOut,
  MessageSquareWarning,
  Monitor,
  Palette,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { planFor, readEntitlements } from '../../services/entitlements.ts';

interface ProfileMenuProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onSignOut: () => void;
  onReplayTour: () => void;
  onOpenNotifications: () => void;
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
  onOpenNotifications,
  unreadCount,
}) => {
  const { user, localMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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
        setHelpOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setHelpOpen(false);
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
    setHelpOpen(false);
  };

  const openHub = (tab: 'included' | 'usage') => {
    window.dispatchEvent(new CustomEvent('vector:open-plan-hub', { detail: tab }));
    setOpen(false);
    setHelpOpen(false);
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px] transition-colors ${
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
        aria-label="Account menu"
        className={`relative w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold text-white transition-transform hover:scale-105 ${
          open ? 'ring-2 ring-[#49686C] ring-offset-2 ring-offset-[#FFFFFF] dark:ring-offset-[#1B2426]' : ''
        }`}
        style={{ background: 'linear-gradient(135deg, #49686C, #2F4B4E)' }}
      >
        {initials(displayName)}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#D1B653] border-2 border-[#FFFFFF] dark:border-[#1B2426]" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[320px] bg-[#FFFFFF] dark:bg-[#1B2426] border border-[#E5E2D8] dark:border-[#33403F] rounded-2xl shadow-[0_24px_60px_-24px_rgba(16,32,32,0.45)] z-50 overflow-hidden"
        >
          {/* Account header */}
          <button
            type="button"
            onClick={() => go('settings')}
            className="w-full flex items-center gap-3 px-4 py-4 border-b border-[#E5E2D8] dark:border-[#29383A] hover:bg-[#F6F4EC] dark:hover:bg-[#222E30] transition-colors text-left"
          >
            <span
              className="w-11 h-11 rounded-full grid place-items-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #49686C, #2F4B4E)' }}
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

          {/* Plan / workspace */}
          <div className="px-4 py-3 border-b border-[#E5E2D8] dark:border-[#29383A]">
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-[#737A72] mb-2">Workspace</p>
            <button
              type="button"
              onClick={() => go('pricing')}
              className="w-full flex items-center gap-3 text-left rounded-lg hover:bg-[#F6F4EC] dark:hover:bg-[#222E30] transition-colors p-1 -m-1"
            >
              <span className="w-9 h-9 rounded-full bg-[#D1B653]/25 text-[#856C16] dark:text-[#E2C768] grid place-items-center text-[11px] font-bold shrink-0">
                {initials(displayName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[#283638] dark:text-[#E7E4D9] truncate">
                  {displayName.split(' ')[0]}’s workspace
                </span>
                <span className="block text-[11px] text-[#737A72] dark:text-[#8E9A93]">
                  {plan.name} {plan.code === 'free' ? '· 2 free projects' : '· active'}
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#737A72] shrink-0" />
            </button>
          </div>

          {/* Menu */}
          <div className="p-2">
            <Row icon={UserRound} label="Your account" onClick={() => go('settings')} />
            <Row
              icon={LayoutGrid}
              label="Dashboard"
              onClick={() => go('dashboard')}
              trailing={activeTab === 'dashboard' ? <span className="w-1.5 h-1.5 rounded-full bg-[#49686C]" /> : null}
            />
            <Row icon={Wallet} label="Plans and pricing" onClick={() => go('pricing')} />
            <Row icon={Sparkles} label="See what's included" onClick={() => openHub('included')} />
            <Row icon={Lightbulb} label="Your plan and usage" onClick={() => openHub('usage')} />
            <Row icon={History} label="Purchase history" onClick={() => go('pricing')} />
            <Row
              icon={theme === 'dark' ? Globe : Palette}
              label={theme === 'dark' ? 'Theme: Dark' : 'Theme: Light'}
              onClick={toggleTheme}
              trailing={<span className="text-[11px] text-[#737A72]">Toggle</span>}
            />
            <Row icon={Bell} label="Notifications" onClick={onOpenNotifications} trailing={
              unreadCount > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#49686C] text-white">{unreadCount}</span>
              ) : null
            } />
          </div>

          <div className="h-px bg-[#E5E2D8] dark:bg-[#29383A] mx-2" />

          {/* Help & feedback with flyout */}
          <div className="p-2 space-y-1">
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setHelpOpen(true)}
                onClick={() => setHelpOpen((value) => !value)}
                aria-expanded={helpOpen}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px] transition-colors ${
                  helpOpen
                    ? 'bg-[#F6F4EC] dark:bg-[#222E30] text-[#283638] dark:text-[#E7E4D9]'
                    : 'text-[#283638] dark:text-[#E7E4D9] hover:bg-[#F6F4EC] dark:hover:bg-[#222E30]'
                }`}
              >
                <CircleHelp className="w-4 h-4 text-[#737A72] dark:text-[#8E9A93] shrink-0" />
                <span className="flex-1 truncate">Help and feedback</span>
                <ChevronRight className={`w-4 h-4 text-[#737A72] transition-transform ${helpOpen ? 'rotate-90' : ''}`} />
              </button>

              {helpOpen && (
                <div className="mt-1 ml-3 pl-3 border-l border-[#E5E2D8] dark:border-[#33403F] space-y-0.5">
                  <button
                    type="button"
                    onClick={() => go('learn')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] text-[#283638] dark:text-[#E7E4D9] hover:bg-[#F6F4EC] dark:hover:bg-[#222E30]"
                  >
                    <CircleHelp className="w-3.5 h-3.5 text-[#737A72]" /> Get help
                  </button>
                  <button
                    type="button"
                    onClick={() => go('integrations')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] text-[#283638] dark:text-[#E7E4D9] hover:bg-[#F6F4EC] dark:hover:bg-[#222E30]"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-[#737A72]" /> Suggest improvement
                  </button>
                  <button
                    type="button"
                    onClick={() => go('learn')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] text-[#283638] dark:text-[#E7E4D9] hover:bg-[#F6F4EC] dark:hover:bg-[#222E30]"
                  >
                    <Flag className="w-3.5 h-3.5 text-[#737A72]" /> Report content
                  </button>
                  <button
                    type="button"
                    onClick={() => go('privacy')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] text-[#283638] dark:text-[#E7E4D9] hover:bg-[#F6F4EC] dark:hover:bg-[#222E30]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#737A72]" /> Privacy policy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onReplayTour();
                      setOpen(false);
                      setHelpOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] text-[#283638] dark:text-[#E7E4D9] hover:bg-[#F6F4EC] dark:hover:bg-[#222E30]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#737A72]" /> Replay product tour
                  </button>
                </div>
              )}
            </div>

            <Row icon={MessageSquareWarning} label="Send feedback" onClick={() => go('learn')} />
            <Row icon={Briefcase} label="Open in desktop app" onClick={() => go('integrations')} />
            <Row icon={Monitor} label="Download for Windows / Mac" onClick={() => go('integrations')} />
            <Row icon={Settings} label="Settings" onClick={() => go('settings')} />
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
    </div>
  );
};
