import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ClipboardCheck,
  Compass,
  FileText,
  FolderKanban,
  FolderOpen,
  GraduationCap,
  History,
  Info,
  LayoutTemplate,
  LogIn,
  Monitor,
  Network,
  Palette,
  Plug,
  Plus,
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
  { id: 'dashboard', label: 'Home', icon: Compass },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'library', label: 'Library', icon: FolderOpen },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
  { id: 'integrations', label: 'Integrations', icon: Plug },
];

const BUILD: RailItem[] = [
  { id: 'requirements', label: 'Requirements', icon: FileText },
  { id: 'intelligence', label: 'Requirement graph', icon: Network },
  { id: 'review', label: 'Review & acceptance', icon: ClipboardCheck },
  { id: 'prompt', label: 'Prompt studio', icon: Sparkles },
  { id: 'workspace', label: 'Build workspace', icon: Monitor },
  { id: 'design', label: 'Design systems', icon: Palette },
  { id: 'new-analysis', label: 'Prompt analyser', icon: Sparkles },
];

const ACCOUNT: RailItem[] = [
  { id: 'pricing', label: 'Plans and pricing', icon: Wallet },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'Product page', icon: Info },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
];

const PUBLIC_ITEMS: RailItem[] = [
  { id: 'about', label: 'Product', icon: Info },
  { id: 'pricing', label: 'Pricing', icon: Wallet },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
];

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-2 pb-1.5 pt-5 text-[10.5px] font-medium uppercase tracking-[0.05em] text-[var(--v-faint)]">
    {children}
  </p>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  publicMode = false,
  onRequestSignIn,
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);

  const entitlements = readEntitlements();
  const plan = planFor(entitlements.plan);
  const paid = isPaid(entitlements);
  const remaining = trialRemaining(entitlements);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!createRef.current?.contains(event.target as Node)) setCreateOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCreateOpen(false);
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
    setCreateOpen(false);
  };

  const NavItem: React.FC<{ item: RailItem }> = ({ item }) => {
    const Icon = item.icon;
    const active = activeTab === item.id;
    return (
      <button
        type="button"
        onClick={() => go(item.id)}
        data-tour={`nav-${item.id}`}
        aria-current={active ? 'page' : undefined}
        className={`flex h-[30px] w-full items-center gap-2.5 rounded-[5px] px-2 text-left text-[12.5px] transition-colors ${
          active
            ? 'bg-[var(--v-surface-2)] font-medium text-[var(--v-ink)]'
            : 'text-[var(--v-muted)] hover:bg-[var(--v-surface-2)]/60 hover:text-[var(--v-ink)]'
        }`}
        title={item.label}
      >
        <Icon
          className={`h-[15px] w-[15px] shrink-0 ${active ? 'text-[var(--v-accent-hover)]' : 'opacity-80'}`}
          strokeWidth={active ? 2 : 1.7}
        />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </button>
    );
  };

  const CreateMenu: React.FC = () => (
    <div className="absolute left-0 top-full z-50 mt-1 w-[232px] v-card p-1.5 shadow-[var(--v-shadow-lg)]">
      <p className="px-2 py-1.5 v-eyebrow">Create</p>
      {[
        { label: 'New project', tab: 'projects' as ActiveTab, icon: FolderKanban },
        { label: 'From a template', tab: 'templates' as ActiveTab, icon: LayoutTemplate },
        { label: 'Analyse a prompt', tab: 'new-analysis' as ActiveTab, icon: Sparkles },
        { label: 'Import from Figma', tab: 'integrations' as ActiveTab, icon: Plug },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => go(item.tab)}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-medium text-[var(--v-ink)] transition-colors hover:bg-[var(--v-surface-2)]"
          >
            <Icon className="h-4 w-4 text-[var(--v-muted)]" />
            {item.label}
          </button>
        );
      })}
    </div>
  );

  const PlanCard: React.FC = () => (
    <div className="px-2 pb-2">
      <div className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-[var(--v-faint)]">
            {paid ? plan.name : 'Free'}
          </span>
          <span className="rounded-full border border-[var(--v-line)] px-1.5 py-0.5 text-[9.5px] text-[var(--v-muted)]">
            {paid ? 'Active' : `${remaining} left`}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--v-surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--v-accent)]"
            style={{ width: paid ? '100%' : `${Math.max(8, ((2 - remaining) / 2) * 100)}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => go('pricing')}
          className="mt-2 w-full rounded-md border border-[var(--v-line)] px-2 py-1.5 text-[11.5px] font-medium text-[var(--v-ink)] transition-colors hover:border-[var(--v-line-strong)] hover:bg-[var(--v-surface-2)]"
        >
          {paid ? 'Manage plan' : 'Upgrade'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-[232px] flex-col border-r border-[var(--v-line)] bg-[var(--v-sidebar,#0b0c0d)] lg:flex"
        aria-label="Primary navigation"
      >
        <div className="flex items-center gap-2 px-3 pb-2 pt-3">
          <button
            type="button"
            onClick={() => go('dashboard')}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-[var(--v-surface-2)]"
            aria-label="Vector home"
            title="Vector"
          >
            <Logo size={20} />
            <span className="truncate text-[13.5px] font-semibold tracking-[-0.015em] text-[var(--v-ink)]">
              Vector
            </span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 text-[var(--v-faint)]" />
          </button>
        </div>

        <div className="relative px-3 pb-1" ref={createRef}>
          <button
            type="button"
            onClick={() => setCreateOpen((value) => !value)}
            className="flex h-8 w-full items-center gap-2 rounded-md bg-[var(--v-surface)] px-2.5 text-left text-[12.5px] font-medium text-[var(--v-ink)] ring-1 ring-inset ring-[var(--v-line)] transition-colors hover:ring-[var(--v-line-strong)]"
            aria-expanded={createOpen}
          >
            <Plus className="h-4 w-4 text-[var(--v-muted)]" />
            Create
            <ChevronDown className="ml-auto h-3.5 w-3.5 text-[var(--v-faint)]" />
          </button>
          {createOpen && <CreateMenu />}
        </div>

        <nav className="v-scroll mt-1 flex-1 overflow-y-auto px-2 pb-2">
          {publicMode ? (
            <>
              <SectionLabel>Workspace</SectionLabel>
              {PUBLIC_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </>
          ) : (
            <>
              <SectionLabel>Workspace</SectionLabel>
              {PRIMARY.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}

              <SectionLabel>Project</SectionLabel>
              {BUILD.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}

              <SectionLabel>Account</SectionLabel>
              {ACCOUNT.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </>
          )}
        </nav>

        {publicMode ? (
          <div className="border-t border-[var(--v-line)] p-2">
            <button
              type="button"
              onClick={onRequestSignIn}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[var(--v-ink)] text-[12.5px] font-medium text-[var(--v-bg)] transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </button>
          </div>
        ) : (
          <div className="border-t border-[var(--v-line)] pt-2">
            <PlanCard />
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto border-r border-[var(--v-line)] bg-[var(--v-bg)] p-3 v-scroll lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-[14px] font-semibold tracking-[-0.015em]">Vector</span>
            </div>
            <button type="button" onClick={() => setIsMobileOpen(false)} className="v-icon-btn" aria-label="Close menu">
              <X className="h-4 w-4" />
            </button>
          </div>

          {publicMode ? (
            <>
              <SectionLabel>Workspace</SectionLabel>
              <div className="space-y-0.5">
                {PUBLIC_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.id)}
                      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-[var(--v-muted)] hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]"
                    >
                      <Icon className="h-4 w-4" /> {item.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <SectionLabel>Workspace</SectionLabel>
              <div className="space-y-0.5">
                {PRIMARY.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.id)}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-[var(--v-surface-2)] text-[var(--v-ink)]'
                          : 'text-[var(--v-muted)] hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]'
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {item.label}
                    </button>
                  );
                })}
              </div>

              <SectionLabel>Project</SectionLabel>
              <div className="space-y-0.5">
                {BUILD.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.id)}
                      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-[var(--v-muted)] hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]"
                    >
                      <Icon className="h-4 w-4" /> {item.label}
                    </button>
                  );
                })}
              </div>

              <SectionLabel>Account</SectionLabel>
              <div className="space-y-0.5">
                {ACCOUNT.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.id)}
                      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-[var(--v-muted)] hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]"
                    >
                      <Icon className="h-4 w-4" /> {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
                <p className="px-1 text-[9.5px] font-medium uppercase tracking-[0.12em] text-[var(--v-muted)]">
                  Starter hub
                </p>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('vector:open-plan-hub', { detail: 'included' }))}
                  className="mt-1 w-full rounded-md px-1.5 py-1.5 text-left text-[11px] font-medium text-[var(--v-muted)] hover:bg-[var(--v-surface)] hover:text-[var(--v-ink)]"
                >
                  See what's included
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('vector:open-plan-hub', { detail: 'usage' }))}
                  className="w-full rounded-md px-1.5 py-1.5 text-left text-[11px] font-medium text-[var(--v-muted)] hover:bg-[var(--v-surface)] hover:text-[var(--v-ink)]"
                >
                  Your plan and usage
                </button>
              </div>

              <button type="button" onClick={() => go('pricing')} className="mt-3 w-full v-btn v-btn-primary">
                <Bell className="h-4 w-4" /> {paid ? 'Manage plan' : 'Upgrade'}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};
