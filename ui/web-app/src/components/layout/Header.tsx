import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Compass,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutTemplate,
  Menu,
  Monitor,
  Network,
  Plus,
  Search,
  Settings,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Logo } from '../ui/Logo.tsx';
import { useProject } from '../../context/ProjectContext.tsx';
import { useProjectVocabulary } from '../../hooks/useProjectVocabulary.ts';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';
import { ProfileMenu } from './ProfileMenu.tsx';
import { NotificationsMenu } from './NotificationsMenu.tsx';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMobileMenu: () => void;
  publicMode?: boolean;
  onRequestSignIn?: () => void;
  onReplayTour?: () => void;
  onOpenAssistant?: () => void;
  onSignedOut?: () => void;
}

const TITLES: Record<ActiveTab, string> = {
  about: 'About Vector',
  overview: 'Overview',
  dashboard: 'Home',
  projects: 'Projects',
  project: 'Project workspace',
  templates: 'Templates',
  library: 'Library',
  learn: 'Learn',
  pricing: 'Plans and pricing',
  integrations: 'Integrations',
  requirements: 'Requirements',
  intelligence: 'Requirement intelligence',
  review: 'Review & acceptance',
  prompt: 'Prompt studio',
  design: 'Design systems',
  workspace: 'Build workspace',
  'new-analysis': 'Analyse',
  editor: 'Editor',
  history: 'History',
  manual: 'Manual',
  settings: 'Settings',
  privacy: 'Privacy',
  terms: 'Terms of service',
  contact: 'Contact',
};

const COMMANDS: Array<{ id: ActiveTab; label: string; hint: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'Home', hint: 'Overview and recent work', icon: Compass },
  { id: 'new-analysis', label: 'Analyse', hint: 'Review a UI prompt', icon: Sparkles },
  { id: 'projects', label: 'Projects', hint: 'All projects and recent work', icon: FolderKanban },
  { id: 'requirements', label: 'Requirements', hint: 'Documents and traceability', icon: FileText },
  { id: 'intelligence', label: 'Requirement graph', hint: 'Ambiguities and conflicts', icon: Network },
  { id: 'review', label: 'Review & acceptance', hint: 'Suggestions and criteria', icon: ClipboardCheck },
  { id: 'prompt', label: 'Prompt studio', hint: 'Build the six-section brief', icon: Sparkles },
  { id: 'workspace', label: 'Build workspace', hint: 'Generate and preview', icon: Monitor },
  { id: 'templates', label: 'Templates', hint: 'Previewable starters', icon: LayoutTemplate },
  { id: 'history', label: 'History', hint: 'Past analyses', icon: FileText },
  { id: 'learn', label: 'Learn', hint: 'Guides and walkthroughs', icon: GraduationCap },
  { id: 'pricing', label: 'Plans and pricing', hint: 'Trial and billing', icon: Wallet },
  { id: 'settings', label: 'Settings', hint: 'Preferences and account', icon: Settings },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  publicMode = false,
  onRequestSignIn,
  onReplayTour,
  onOpenAssistant,
  onSignedOut,
}) => {
  const { signOut } = useAuth();
  const { selectProject, projects } = useProject();
  const vocabulary = useProjectVocabulary();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  const filtered = COMMANDS.filter(
    (command) =>
      !query.trim() ||
      command.label.toLowerCase().includes(query.toLowerCase()) ||
      command.hint.toLowerCase().includes(query.toLowerCase())
  );

  const vocabularyMatches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    return vocabulary
      .filter((item) => item.value.toLowerCase().includes(term))
      .sort((a, b) => {
        const aStarts = a.value.toLowerCase().startsWith(term) ? 0 : 1;
        const bStarts = b.value.toLowerCase().startsWith(term) ? 0 : 1;
        return aStarts - bStarts;
      })
      .slice(0, 6);
  }, [query, vocabulary]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setConfirmingLogout(false);
      onSignedOut?.();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-[52px] border-b border-[var(--v-line)] bg-[var(--v-bg)]">
        <div className="mx-auto flex h-full w-full max-w-[1480px] items-center gap-2.5 px-4 lg:px-6">
          <button
            onClick={onOpenMobileMenu}
            className="v-icon-btn -ml-2 lg:!hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {activeTab !== 'dashboard' && (
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else setActiveTab('dashboard');
              }}
              className="v-icon-btn shrink-0 -ml-1"
              aria-label="Go back"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex min-w-0 items-center gap-1.5 text-[12.5px]">
            <button
              type="button"
              onClick={() => setActiveTab(publicMode ? 'about' : 'dashboard')}
              className="hidden shrink-0 items-center gap-1.5 text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)] sm:inline-flex"
            >
              <Logo size={16} /> Vector
            </button>
            <span className="hidden text-[var(--v-faint)] sm:inline">/</span>
            <span className="truncate text-[13px] font-medium tracking-[-0.01em] text-[var(--v-ink)]">
              {TITLES[activeTab] || 'Workspace'}
            </span>
          </div>

          {!publicMode && (
            <div className="relative ml-auto mr-auto hidden w-full max-w-[330px] md:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--v-faint)] pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search projects, briefs, templates..."
                className="v-input h-[30px] pl-8 pr-16 text-[12px]"
                aria-label="Search"
              />
              <span className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center rounded border border-[var(--v-line)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--v-faint)] lg:inline-flex">
                Ctrl&nbsp;K
              </span>

              {searchOpen && (
                <div className="absolute left-0 right-0 top-[34px] z-50 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5 shadow-[var(--v-shadow-lg)]">
                  <p className="px-2 py-1.5 v-eyebrow">Jump to</p>
                  {filtered.length === 0 && (
                    <p className="px-2 py-3 text-[12px] text-[var(--v-muted)]">Nothing matches "{query}".</p>
                  )}
                  {filtered.map((command) => {
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(command.id);
                          setSearchOpen(false);
                          setQuery('');
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[var(--v-surface-2)]"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[var(--v-surface-2)] grid place-items-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-[var(--v-muted)]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-semibold text-[var(--v-ink)] truncate">{command.label}</span>
                          <span className="block text-[10.5px] text-[var(--v-faint)] truncate">{command.hint}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--v-faint)]" />
                      </button>
                    );
                  })}

                  {vocabularyMatches.length > 0 && (
                    <>
                      <div className="my-1.5 h-px bg-[var(--v-line)]" />
                      <p className="px-2 py-1.5 v-eyebrow">Project vocabulary</p>
                      {vocabularyMatches.map((item) => (
                        <button
                          key={`${item.kind}:${item.value}`}
                          type="button"
                          onClick={() => {
                            setQuery(item.value);
                            setSearchOpen(false);
                            if (item.tab && item.tab !== 'editor') setActiveTab(item.tab);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[var(--v-surface-2)]"
                        >
                          <span className="w-[72px] shrink-0 truncate rounded border border-[var(--v-line)] bg-[var(--v-surface-2)] px-1 py-0.5 text-center text-[8.5px] font-medium uppercase tracking-[0.04em] text-[var(--v-faint)]">
                            {item.kind}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--v-ink-2)]">{item.value}</span>
                          {item.detail && (
                            <span className="hidden shrink-0 text-[10px] text-[var(--v-faint)] sm:block">{item.detail}</span>
                          )}
                        </button>
                      ))}
                    </>
                  )}

                  {projects.length > 0 && !query && (
                    <>
                      <div className="h-px bg-[var(--v-line)] my-1.5" />
                      <p className="px-2 py-1.5 v-eyebrow">Recent projects</p>
                      {projects.slice(0, 3).map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => {
                            selectProject(project.id);
                            setActiveTab('projects');
                            setSearchOpen(false);
                            setQuery('');
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-[var(--v-surface-2)]"
                        >
                          <span className="w-7 h-7 rounded-lg v-grad text-white grid place-items-center text-[10px] font-semibold shrink-0">
                            {project.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-[12.5px] font-semibold text-[var(--v-ink)] truncate">{project.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5 shrink-0">
            {publicMode ? (
              <button type="button" onClick={onRequestSignIn} className="v-btn v-btn-primary h-8 px-3.5 text-[12.5px]">
                Sign in
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  className="v-btn v-btn-primary h-8 px-3 text-[12.5px] hidden sm:inline-flex"
                >
                  <Plus className="w-4 h-4" /> Create
                </button>

                <button
                  type="button"
                  onClick={onOpenAssistant}
                  className="v-btn v-btn-ghost h-8 px-2.5 text-[12.5px] text-[var(--v-muted)]"
                  title="Ask AI for help with this prompt"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden lg:inline">Ask AI</span>
                </button>

                <NotificationsMenu
                  open={notificationsOpen}
                  onOpenChange={setNotificationsOpen}
                  onNavigate={setActiveTab}
                />

                <ProfileMenu
                  activeTab={activeTab}
                  onNavigate={setActiveTab}
                  onSignOut={() => setConfirmingLogout(true)}
                  onReplayTour={() => onReplayTour?.()}
                  onOpenNotifications={() => setNotificationsOpen(true)}
                  unreadCount={0}
                />
              </>
            )}
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={confirmingLogout}
        title="Log out of Vector?"
        message="You will be signed out of this browser. Your projects, documents and prompts stay saved in your account, and you can sign back in at any time."
        confirmLabel="Log out"
        tone="danger"
        busy={signingOut}
        onConfirm={() => void handleSignOut()}
        onCancel={() => setConfirmingLogout(false)}
      />
    </>
  );
};

