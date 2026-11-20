import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Clock3,
  Database,
  FolderKanban,
  LayoutGrid,
  LayoutTemplate,
  List,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useProject } from '../context/ProjectContext.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import { SpotlightHost } from '../components/onboarding/SpotlightHost.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import type { Project } from '../types/projects.ts';
import { isPaid, readEntitlements, trialRemaining } from '../services/entitlements.ts';

interface ProjectsPageProps {
  onOpenProject: (project: Project) => void;
  onOpenSettings: () => void;
  onBrowseTemplates?: () => void;
  onOpenIntegrations?: () => void;
  onOpenEditor?: () => void;
  onCreated?: (project: Project) => void;
  onOpenPricing?: () => void;
}

type Tab = 'all' | 'recent' | 'shared' | 'trash';

const TONES = [
  ['#0FA3A3', '#4F7DF3'],
  ['#4F7DF3', '#8B5CF6'],
  ['#FF6B8A', '#FF8A6B'],
  ['#FFC53D', '#FF8A6B'],
  ['#8B5CF6', '#FF6B8A'],
  ['#22C1A6', '#4F7DF3'],
];

function toneFor(id: string): [string, string] {
  const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TONES[sum % TONES.length] as [string, string];
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onOpenProject,
  onOpenSettings,
  onBrowseTemplates,
  onOpenIntegrations,
  onOpenEditor,
  onCreated,
  onOpenPricing,
}) => {
  const { localMode } = useAuth();
  const { projects, currentProject, loading, error, createProject, updateProject, deleteProject, selectProject, refresh } =
    useProject();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'updated' | 'name'>('updated');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const entitlements = readEntitlements();
  const paid = isPaid(entitlements);
  const remaining = trialRemaining(entitlements);

  const active = projects.filter((project) => project.status === 'active');
  const trashed = projects.filter((project) => project.status === 'archived');

  const visible = useMemo(() => {
    const base = tab === 'trash' ? trashed : active;
    const term = query.trim().toLowerCase();
    const filtered = term
      ? base.filter(
          (project) =>
            project.name.toLowerCase().includes(term) || (project.description || '').toLowerCase().includes(term)
        )
      : base;
    return [...filtered].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [tab, active, trashed, query, sort]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const created = await createProject(name, description);
      setName('');
      setDescription('');
      setCreateOpen(false);
      toast('Project created', 'success');
      onCreated?.(created);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not create project.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const openProject = (project: Project) => {
    selectProject(project.id);
    onOpenProject(project);
  };

  const handleEditSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editTarget || !editName.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      await updateProject(editTarget.id, { name: editName.trim(), description: editDescription.trim() });
      toast('Project updated', 'success');
      setEditTarget(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update project.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const archive = async (project: Project) => {
    try {
      await updateProject(project.id, { status: 'archived' });
      setMenuFor(null);
      toast('Moved to trash', 'info');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not move project.', 'error');
    }
  };

  const restore = async (project: Project) => {
    try {
      await updateProject(project.id, { status: 'active' });
      toast('Project restored', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not restore project.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      toast('Project deleted permanently', 'info');
      setDeleteTarget(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete project.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const share = async (project: Project) => {
    const link = `${window.location.origin}${window.location.pathname}?project=${project.id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast('View link copied to clipboard', 'success');
    } catch {
      toast(link, 'info');
    }
    setMenuFor(null);
  };

  const TABS: Array<{ id: Tab; label: string; icon: React.ElementType; count?: number }> = [
    { id: 'all', label: 'All projects', icon: LayoutGrid },
    { id: 'recent', label: 'Recents', icon: Clock3 },
    { id: 'shared', label: 'Shared with you', icon: Users },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-5 v-fade-up">
      <SpotlightHost page="projects" />
      {/* Sub navigation */}
      <aside className="lg:w-[214px] shrink-0">
        <div className="lg:sticky lg:top-[84px] space-y-1">
          {TABS.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--v-surface)] text-[var(--v-ink)] shadow-[var(--v-shadow-sm)]'
                    : 'text-[var(--v-muted)] hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--v-violet)]' : ''}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'trash' && trashed.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--v-surface-2)]">
                    {trashed.length}
                  </span>
                )}
              </button>
            );
          })}

          <div className="!mt-4 rounded-2xl border border-dashed border-[var(--v-line)] p-3.5">
            <p className="text-[11.5px] font-bold text-[var(--v-ink)]">
              {paid ? 'Unlimited projects' : `${remaining} free project${remaining === 1 ? '' : 's'} left`}
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-[var(--v-muted)]">
              {paid
                ? 'Your plan includes unlimited projects, all templates and integrations.'
                : 'Two full projects on the house. Upgrade when you need more.'}
            </p>
            <button
              type="button"
              onClick={() => onOpenPricing?.()}
              className="mt-2 text-[10.5px] font-bold text-[var(--v-violet)] hover:underline"
            >
              {paid ? 'Manage plan' : 'See plans'}
            </button>
          </div>

          {localMode && (
            <div className="rounded-2xl bg-[var(--v-surface-2)] p-3 text-[10.5px] leading-relaxed text-[var(--v-muted)]">
              <b className="text-[var(--v-ink)]">Local mode.</b> Projects are stored in this browser only.
            </div>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11.5px] font-semibold text-[var(--v-muted)] hover:text-[var(--v-ink)]"
          >
            <Database className="w-3.5 h-3.5" /> Account & data
          </button>
        </div>
      </aside>

      {/* Main */}
      <section className="flex-1 min-w-0">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="v-display text-[30px] sm:text-[38px] text-[var(--v-ink)]">
            {tab === 'trash' ? 'Trash' : tab === 'shared' ? 'Shared with you' : tab === 'recent' ? 'Recents' : 'All projects'}
          </h1>
          <p className="mt-1.5 text-[12.5px] text-[var(--v-muted)]">
            {tab === 'trash'
              ? 'Restore a project or delete it permanently.'
              : 'Every project keeps its requirements, prompts, design system and history in one place.'}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-[#F0C4BF] bg-[#FDF2F0] px-4 py-3 text-[12px] text-[#B94D42]">
            {error}
          </div>
        )}

        {/* Search + filters */}
        <div className="mt-5">
          <div className="relative max-w-[620px] mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--v-faint)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects"
              className="v-input h-11 pl-11 pr-4 text-[13px]"
              disabled={tab === 'shared'}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button type="button" className="v-chip" onClick={() => setSort('updated')} data-active={sort === 'updated'}>
              Last modified
            </button>
            <button type="button" className="v-chip" onClick={() => setSort('name')} data-active={sort === 'name'}>
              Name
            </button>
            <button type="button" className="v-chip" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
              {view === 'grid' ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
              {view === 'grid' ? 'List' : 'Grid'}
            </button>
            <button type="button" onClick={() => void refresh()} className="v-chip">
              <RotateCcw className="w-3.5 h-3.5" /> Refresh
            </button>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-[var(--v-faint)]" />}
          </div>
        </div>

        {tab === 'shared' ? (
          <div className="mt-10 v-card rounded-[24px] p-10 text-center max-w-xl mx-auto">
            <Users className="w-7 h-7 mx-auto text-[var(--v-faint)]" />
            <p className="mt-2 text-[14px] font-bold text-[var(--v-ink)]">Nothing shared with you yet</p>
            <p className="mt-1 text-[12px] text-[var(--v-muted)]">
              When a teammate shares a project, it appears here with their permissions.
            </p>
          </div>
        ) : (
          <>
            {/* Create card + grid */}
            <div
              className={`mt-6 ${
                view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'
              }`}
            >
              {tab !== 'trash' && view === 'grid' && (
                <button
                  type="button"
                  data-spot="projects-create"
                  onClick={() => setCreateOpen(true)}
                  className="rounded-[20px] border-2 border-dashed border-[var(--v-line)] hover:border-[var(--v-violet)] bg-[var(--v-surface-2)] min-h-[190px] flex flex-col items-center justify-center gap-2 transition-colors group"
                >
                  <span className="w-11 h-11 rounded-2xl v-grad text-white grid place-items-center group-hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5" />
                  </span>
                  <span className="text-[12.5px] font-bold text-[var(--v-ink)]">New project</span>
                  <span className="text-[10.5px] text-[var(--v-faint)]">
                    {paid ? 'Unlimited' : `${remaining} free left`}
                  </span>
                </button>
              )}

              {visible.map((project) => {
                const [from, to] = toneFor(project.id);
                const isCurrent = currentProject?.id === project.id;
                const menuOpen = menuFor === project.id;

                return (
                  <article
                    key={project.id}
                    className={`relative group ${
                      view === 'grid'
                        ? 'v-card v-card-lift rounded-[20px]'
                        : 'v-card rounded-2xl p-3 flex items-center gap-3'
                    }`}
                  >
                    {view === 'grid' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => (tab === 'trash' ? undefined : openProject(project))}
                          className="block w-full text-left"
                        >
                          <div
                            className="h-[132px] relative overflow-hidden rounded-t-[20px]"
                            style={{ backgroundImage: `linear-gradient(140deg, ${from}, ${to})` }}
                          >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,.45),transparent_55%)]" />
                            <span className="absolute bottom-2.5 left-3.5 v-display text-white/95 text-[28px]">
                              {project.name.slice(0, 2).toUpperCase()}
                            </span>
                            {isCurrent && (
                              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-white/90 text-[9px] font-bold uppercase tracking-wider text-[#14121F]">
                                Current
                              </span>
                            )}
                            <span className="absolute bottom-2.5 right-3 w-7 h-7 rounded-full bg-white/25 backdrop-blur grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                            </span>
                          </div>
                          <div className="p-3.5">
                            <p className="text-[12.5px] font-bold text-[var(--v-ink)] truncate">{project.name}</p>
                            <p className="mt-0.5 text-[10.5px] text-[var(--v-faint)] truncate">
                              {project.description || 'No description'}
                            </p>
                            <p className="mt-1 text-[10px] text-[var(--v-faint)] flex items-center gap-1">
                              <Clock3 className="w-2.5 h-2.5" />
                              {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className="w-10 h-10 rounded-xl shrink-0 grid place-items-center text-white text-[12px] font-bold"
                          style={{ backgroundImage: `linear-gradient(140deg, ${from}, ${to})` }}
                        >
                          {project.name.slice(0, 2).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => (tab === 'trash' ? undefined : openProject(project))}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="text-[12.5px] font-bold text-[var(--v-ink)] truncate">{project.name}</p>
                          <p className="text-[10.5px] text-[var(--v-faint)] truncate">
                            {project.description || 'No description'} · {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </button>
                      </>
                    )}

                    {/* Actions */}
                    <div className={`${view === 'grid' ? 'absolute top-2.5 right-2.5 z-20' : 'relative'}`}>
                      {tab === 'trash' ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void restore(project)}
                            className="px-2.5 py-1.5 rounded-lg bg-[var(--v-surface)] border border-[var(--v-line)] text-[10.5px] font-bold text-[var(--v-ink)] hover:border-[var(--v-violet)]"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(project)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FDF2F0] text-[10.5px] font-bold text-[#B94D42] hover:bg-[#FBEAE7]"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setMenuFor(menuOpen ? null : project.id)}
                            className="w-7 h-7 rounded-full bg-[var(--v-surface)]/90 backdrop-blur border border-[var(--v-line)] grid place-items-center text-[var(--v-muted)] hover:text-[var(--v-ink)]"
                            aria-label={`Actions for ${project.name}`}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {menuOpen && (
                            <div className="absolute right-0 top-9 w-[176px] v-card p-1.5 shadow-[var(--v-shadow-lg)] z-30">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditTarget(project);
                                  setEditName(project.name);
                                  setEditDescription(project.description || '');
                                  setMenuFor(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-semibold hover:bg-[var(--v-surface-2)]"
                              >
                                <Pencil className="w-3.5 h-3.5 text-[var(--v-muted)]" /> Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => void share(project)}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-semibold hover:bg-[var(--v-surface-2)]"
                              >
                                <Share2 className="w-3.5 h-3.5 text-[var(--v-muted)]" /> Share link
                              </button>
                              <button
                                type="button"
                                onClick={() => void archive(project)}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-semibold text-[#B94D42] hover:bg-[#FDF2F0]"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Move to trash
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {!loading && visible.length === 0 && (
              <div className="mt-6 v-card rounded-[24px] p-10 text-center">
                <Sparkles className="w-6 h-6 mx-auto text-[var(--v-faint)]" />
                <p className="mt-2 text-[13.5px] font-bold text-[var(--v-ink)]">
                  {query ? `No projects match “${query}”` : tab === 'trash' ? 'Trash is empty' : 'No projects yet'}
                </p>
                <p className="mt-1 text-[11.5px] text-[var(--v-muted)]">
                  {tab === 'trash' ? 'Deleted projects can be restored for 30 days.' : 'Create one, or start from a template.'}
                </p>
                {tab !== 'trash' && (
                  <button type="button" onClick={() => setCreateOpen(true)} className="mt-3 v-btn v-btn-primary h-9 px-4 text-[12px]">
                    <Plus className="w-3.5 h-3.5" /> New project
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <div className="absolute inset-0 bg-[#14121F]/50 backdrop-blur-sm" onClick={() => setCreateOpen(false)} aria-hidden="true" />
          <form onSubmit={handleCreate} className="relative w-full max-w-[440px] v-card rounded-[24px] p-6 shadow-[var(--v-shadow-lg)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="v-eyebrow">New</p>
                <h2 className="v-display text-[24px] mt-1 text-[var(--v-ink)]">Create a project</h2>
              </div>
              <button type="button" onClick={() => setCreateOpen(false)} className="v-icon-btn -mr-2 -mt-2" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block mt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Customer portal redesign"
                maxLength={120}
                autoFocus
                className="v-input mt-1.5 h-11 px-4 text-[13px]"
              />
            </label>

            <label className="block mt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="What is being designed?"
                className="mt-1.5 w-full rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] px-4 py-3 text-[13px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
              />
            </label>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-[10.5px] text-[var(--v-faint)]">
                {paid ? 'Unlimited projects' : `${remaining} free project${remaining === 1 ? '' : 's'} remaining`}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="v-btn v-btn-ghost h-9 px-4 text-[12px]">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !name.trim()} className="v-btn v-btn-primary h-9 px-4 text-[12px] disabled:opacity-60">
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <div className="absolute inset-0 bg-[#14121F]/50 backdrop-blur-sm" onClick={() => setEditTarget(null)} aria-hidden="true" />
          <form onSubmit={handleEditSave} className="relative w-full max-w-[440px] v-card rounded-[24px] p-6 shadow-[var(--v-shadow-lg)]">
            <div className="flex items-start justify-between">
              <h2 className="v-display text-[22px] text-[var(--v-ink)]">Edit project</h2>
              <button type="button" onClick={() => setEditTarget(null)} className="v-icon-btn -mr-2 -mt-2" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block mt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Name</span>
              <input value={editName} onChange={(event) => setEditName(event.target.value)} required maxLength={120} className="v-input mt-1.5 h-11 px-4 text-[13px]" />
            </label>
            <label className="block mt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Description</span>
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] px-4 py-3 text-[13px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditTarget(null)} className="v-btn v-btn-ghost h-9 px-4 text-[12px]">
                Cancel
              </button>
              <button type="submit" disabled={savingEdit || !editName.trim()} className="v-btn v-btn-primary h-9 px-4 text-[12px] disabled:opacity-60">
                {savingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete permanently?"
        message={
          <>
            <b>{deleteTarget?.name}</b> and everything inside it will be removed. This cannot be undone.
          </>
        }
        confirmLabel="Delete forever"
        busy={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
