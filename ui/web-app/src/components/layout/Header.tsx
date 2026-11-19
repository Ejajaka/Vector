import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  Compass,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutTemplate,
  Menu,
  Moon,
  Plus,
  Plug,
  Search,
  Settings,
  Sparkles,
  Sun,
  Wallet,
} from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useProject } from '../../context/ProjectContext.tsx';
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
  'new-analysis': 'New analysis',
  editor: 'Editor',
  history: 'History',
  manual: 'Manual',
  settings: 'Settings',
  privacy: 'Privacy',
  terms: 'Terms of service',
  contact: 'Contact',
};

const COMMANDS: Array<{ id: ActiveTab; label: string; hint: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'Home', hint: 'Dashboard', icon: Compass },
  { id: 'projects', label: 'Projects', hint: 'All projects, recents, trash', icon: FolderKanban },
  { id: 'templates', label: 'Templates', hint: '10 previewable starters', icon: LayoutTemplate },
  { id: 'learn', label: 'Learn', hint: 'Guides and walkthroughs', icon: GraduationCap },
  { id: 'prompt', label: 'Prompt studio', hint: 'Build the prompt', icon: Sparkles },
  { id: 'requirements', label: 'Requirements', hint: 'Documents and traceability', icon: FileText },
  { id: 'integrations', label: 'Integrations', hint: 'Figma, Canva, Vercel, Netlify', icon: Plug },
  { id: 'design', label: 'Design systems', hint: 'Tokens and brand context', icon: Blocks },
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
}) => {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { selectProject, projects } = useProject();
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

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setConfirmingLogout(false);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-[68px] border-b border-[var(--v-line)] v-glass">
        <div className="mx-auto flex h-full w-full max-w-[1680px] items-center gap-3 px-4 lg:px-6">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden v-icon-btn -ml-2"
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

          <span className="v-display text-[19px] tracking-tight text-[var(--v-ink)] shrink-0">
            {TITLES[activeTab] || 'Vector'}
          </span>

          {!publicMode && (
            <div className="relative flex-1 max-w-[520px] mx-auto hidden md:block" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--v-faint)] pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search projects, templates and tools"
                className="v-input h-10 pl-11 pr-16 text-[13px]"
                aria-label="Search"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-[var(--v-line)] text-[10px] font-semibold text-[var(--v-faint)]">
                ⌘K
              </span>

              {searchOpen && (
                <div className="absolute left-0 right-0 top-[46px] v-card p-2 shadow-[var(--v-shadow-lg)] z-50">
                  <p className="px-2 py-1.5 v-eyebrow">Jump to</p>
                  {filtered.length === 0 && (
                    <p className="px-2 py-3 text-[12px] text-[var(--v-muted)]">Nothing matches “{query}”.</p>
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
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left hover:bg-[var(--v-surface-2)] transition-colors"
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
                            setActiveTab('requirements');
                            setSearchOpen(false);
                            setQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left hover:bg-[var(--v-surface-2)]"
                        >
                          <span className="w-7 h-7 rounded-lg v-grad text-white grid place-items-center text-[10px] font-bold shrink-0">
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
              <button type="button" onClick={onRequestSignIn} className="v-btn v-btn-primary h-9 px-4 text-[12.5px]">
                Sign in
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  className="v-btn v-btn-primary h-9 px-3.5 text-[12.5px] hidden sm:inline-flex"
                >
                  <Plus className="w-4 h-4" /> Create
                </button>

                <button
                  type="button"
                  onClick={onOpenAssistant}
                  className="v-btn v-btn-ghost h-9 px-3 text-[12.5px] text-[var(--v-violet)]"
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

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="v-icon-btn"
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

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
