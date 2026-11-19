import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronRight,
  Ellipsis,
  FolderKanban,
  FolderOpen,
  GraduationCap,
  History,
  LayoutTemplate,
  LogIn,
  Palette,
  Plug,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import { Logo } from '../ui/Logo.tsx';
import { isPaid, planFor, readEntitlements, trialRemaining } from '../../services/entitlements.ts';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  publicMode?: boolean;
  onRequestSignIn?: () => void;
}

interface RailItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
}

const PRIMARY: RailItem[] = [
  { id: 'new-analysis', label: 'Analyse', icon: Sparkles },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'history', label: 'History', icon: History },
];

const WORKSPACE: RailItem[] = [
  { id: 'library', label: 'Library', icon: FolderOpen },
  { id: 'design', label: 'Design systems', icon: Palette },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
  { id: 'integrations', label: 'Integrations', icon: Plug },
];

const ACCOUNT: RailItem[] = [
  { id: 'pricing', label: 'Plans and pricing', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  publicMode = false,
  onRequestSignIn,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  const entitlements = readEntitlements();
  const plan = planFor(entitlements.plan);
  const paid = isPaid(entitlements);
  const remaining = trialRemaining(entitlements);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
      if (!createRef.current?.contains(event.target as Node)) setCreateOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        setCreateOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const go = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
    setMoreOpen(false);
    setCreateOpen(false);
  };

  const RailButton: React.FC<{ item: RailItem }> = ({ item }) => {
    const Icon = item.icon;
    const active = activeTab === item.id;
    return (
      <button
        type="button"
        onClick={() => go(item.id)}
        data-tour={`nav-${item.id}`}
        aria-current={active ? 'page' : undefined}
        className={`group relative flex flex-col items-center justify-center gap-1 w-[60px] py-2 rounded-2xl transition-all ${
          active
            ? 'bg-[var(--v-surface)] text-[var(--v-ink)] shadow-[var(--v-shadow-sm)]'
            : 'text-[var(--v-muted)] hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]'
        }`}
        title={item.label}
      >
        <span
          className={`grid place-items-center w-6 h-6 ${active ? 'text-[var(--v-violet)]' : ''}`}
        >
          <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.2 : 1.8} />
        </span>
        <span className="text-[9.5px] font-semibold leading-none tracking-tight">{item.label}</span>
        {active && (
          <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full v-grad" />
        )}
      </button>
    );
  };

  const CreateMenu: React.FC = () => (
    <div className="absolute left-[64px] top-0 w-[240px] v-card p-2 shadow-[var(--v-shadow-lg)] z-50">
      <p className="px-2 py-1.5 v-eyebrow">Create</p>
      {[
        { label: 'Analyse a prompt', tab: 'new-analysis' as ActiveTab, icon: Sparkles },
        { label: 'New project', tab: 'projects' as ActiveTab, icon: FolderKanban },
        { label: 'From a template', tab: 'templates' as ActiveTab, icon: LayoutTemplate },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => go(item.tab)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12.5px] font-semibold text-[var(--v-ink)] hover:bg-[var(--v-surface-2)] transition-colors"
          >
            <Icon className="w-4 h-4 text-[var(--v-muted)]" />
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#14121F]/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[76px] hidden lg:flex flex-col items-center py-4 gap-2 border-r border-[var(--v-line)] v-glass ${
          isMobileOpen ? 'flex' : ''
        }`}
        aria-label="Primary navigation"
      >
        {/* Brand */}
        <button
          type="button"
          onClick={() => go('dashboard')}
          className="mb-1 rounded-2xl p-0.5 hover:scale-105 transition-transform"
          aria-label="Vector — go to home"
          title="Vector"
        >
          <Logo size={36} />
        </button>

        {/* Create */}
        <div className="relative mb-1" ref={createRef}>
          <button
            type="button"
            onClick={() => setCreateOpen((value) => !value)}
            className="w-[48px] h-[48px] rounded-2xl v-grad text-white grid place-items-center shadow-[0_10px_24px_-12px_rgba(79,125,243,.8)] hover:scale-105 active:scale-95 transition-transform"
            aria-label="Create"
            aria-expanded={createOpen}
            title="Create"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          {createOpen && <CreateMenu />}
        </div>

        <div className="w-8 h-px bg-[var(--v-line)] my-1" />

        {publicMode ? (
          <div className="flex flex-col items-center gap-1.5">
            {[
              { id: 'about' as ActiveTab, label: 'About', icon: Sparkles },
              { id: 'pricing' as ActiveTab, label: 'Pricing', icon: Wallet },
              { id: 'learn' as ActiveTab, label: 'Learn', icon: GraduationCap },
            ].map((item) => (
              <RailButton key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <nav className="flex flex-col items-center gap-1.5 flex-1">
            {PRIMARY.map((item) => (
              <RailButton key={item.id} item={item} />
            ))}

            <div className="relative mt-1" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((value) => !value)}
                className={`flex flex-col items-center justify-center gap-1 w-[60px] py-2 rounded-2xl transition-all ${
                  moreOpen ? 'bg-[var(--v-surface)] shadow-[var(--v-shadow-sm)] text-[var(--v-ink)]' : 'text-[var(--v-muted)] hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]'
                }`}
                aria-expanded={moreOpen}
                aria-label="More"
                title="More"
              >
                <Ellipsis className="w-[19px] h-[19px]" />
                <span className="text-[9.5px] font-semibold leading-none">More</span>
              </button>

              {moreOpen && (
                <div className="absolute left-[64px] top-0 w-[248px] v-card p-2 shadow-[var(--v-shadow-lg)] z-50 max-h-[70vh] overflow-y-auto v-scroll">
                  <p className="px-2 py-1.5 v-eyebrow">Workspace</p>
                  {WORKSPACE.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go(item.id)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12.5px] font-semibold text-[var(--v-ink)] hover:bg-[var(--v-surface-2)] transition-colors"
                      >
                        <Icon className="w-4 h-4 text-[var(--v-muted)]" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight className="w-3 h-3 text-[var(--v-faint)]" />
                      </button>
                    );
                  })}
                  <div className="h-px bg-[var(--v-line)] my-1.5" />
                  <p className="px-2 py-1.5 v-eyebrow">Account</p>
                  {ACCOUNT.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go(item.id)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12.5px] font-semibold text-[var(--v-ink)] hover:bg-[var(--v-surface-2)] transition-colors"
                      >
                        <Icon className="w-4 h-4 text-[var(--v-muted)]" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight className="w-3 h-3 text-[var(--v-faint)]" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        )}

        {/* Plan */}
        <div className="mt-auto flex flex-col items-center gap-1.5 pt-2">
          {publicMode ? (
            <button
              type="button"
              onClick={onRequestSignIn}
              className="w-[52px] h-[52px] rounded-2xl bg-[var(--v-ink)] text-[var(--v-surface)] grid place-items-center hover:opacity-90"
              title="Sign in"
              aria-label="Sign in"
            >
              <LogIn className="w-4 h-4" />
            </button>
          ) : paid ? (
            <button
              type="button"
              onClick={() => go('pricing')}
              className="w-[52px] py-2 rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] text-center hover:border-[var(--v-violet)] transition-colors"
              title={`${plan.name} plan`}
            >
              <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--v-violet)]">{plan.name}</span>
              <span className="block text-[8.5px] text-[var(--v-faint)] mt-0.5">active</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go('pricing')}
              className="w-[52px] py-2 rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] text-center hover:border-[var(--v-violet)] transition-colors"
              title={`${remaining} free projects left`}
            >
              <span className="block text-[10px] font-extrabold text-[var(--v-ink)]">{remaining}</span>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-[var(--v-faint)]">free</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-[260px] bg-[var(--v-surface)] border-r border-[var(--v-line)] p-4 lg:hidden overflow-y-auto v-scroll">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Logo size={30} />
              <span className="font-bold text-[15px]">Vector</span>
            </div>
            <button type="button" onClick={() => setIsMobileOpen(false)} className="v-icon-btn" aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="v-eyebrow px-1 mb-1.5">Workspace</p>
          <div className="space-y-0.5 mb-3">
            {PRIMARY.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                    active ? 'bg-[var(--v-surface-2)] text-[var(--v-ink)]' : 'text-[var(--v-muted)] hover:bg-[var(--v-surface-2)]'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </button>
              );
            })}
          </div>

          <p className="v-eyebrow px-1 mb-1.5">Workspace</p>
          <div className="space-y-0.5 mb-3">
            {WORKSPACE.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--v-muted)] hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]"
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </button>
              );
            })}
          </div>

          <p className="v-eyebrow px-1 mb-1.5">Account</p>
          <div className="space-y-0.5">
            {ACCOUNT.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--v-muted)] hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]"
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={() => go('pricing')} className="mt-4 w-full v-btn v-btn-primary">
            <Bell className="w-4 h-4" /> {paid ? 'Manage plan' : 'Upgrade'}
          </button>
        </div>
      )}
    </>
  );
};
