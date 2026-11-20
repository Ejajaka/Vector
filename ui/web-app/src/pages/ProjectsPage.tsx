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
    <div className="v-fade-up">
      <SpotlightHost page="projects" />
      <div className="mx-auto w-full max-w-[1120px]">
        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="v-display text-[24px] text-[var(--v-ink)]">
              {tab === 'trash' ? 'Trash' : tab === 'shared' ? 'Shared with you' : tab === 'recent' ? 'Recents' : 'Projects'}
            </h1>
            <p className="mt-1 max-w-[560px] text-[13px] text-[var(--v-muted)]">
              {tab === 'trash'
                ? 'Restore a project or delete it permanently.'
                : 'Requirements, prompts, design systems and history stay together in one place.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--v-faint)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects"
                className="v-input h-8 w-[230px] pl-8 pr-3 text-[12.5px]"
                disabled={tab === 'shared'}
                aria-label="Search projects"
              />
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="v-btn v-btn-primary h-8 px-3 text-[12.5px]"
            >
              <Plus className="w-3.5 h-3.5" /> New project
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-[var(--v-danger)]/30 bg-[var(--v-danger-soft)] px-3 py-2 text-[12px] text-[var(--v-danger)]">
            {error}
          </div>
        )}

        {/* Views toolbar */}
        <div className="mt-6 flex flex-wrap items-center gap-1 border-b border-[var(--v-line)] pb-2">
          {TABS.map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] transition-colors ${
                  isActive
                    ? 'bg-[var(--v-surface-2)] text-[var(--v-ink)]'
                    : 'text-[var(--v-muted)] hover:bg-[var(--v-surface-2)]/60 hover:text-[var(--v-ink)]'
                }`}
              >
                {item.label}
                {item.id === 'trash' && trashed.length > 0 && (
                  <span className="text-[10px] text-[var(--v-faint)]">{trashed.length}</span>
                )}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="v-chip h-7"
              onClick={() => setSort(sort === 'updated' ? 'name' : 'updated')}
              title="Toggle sort order"
            >
              {sort === 'updated' ? 'Last modified' : 'Name'}
            </button>
            <button
              type="button"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="v-icon-btn"
              aria-label={view === 'grid' ? 'Show as list' : 'Show as grid'}
              title={view === 'grid' ? 'List view' : 'Grid view'}
            >
              {view === 'grid' ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              className="v-icon-btn"
              aria-label="Refresh projects"
              title="Refresh"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="relative mt-4 sm:hidden">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--v-faint)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            className="v-input h-8 w-full pl-8 pr-3 text-[12.5px]"
            disabled={tab === 'shared'}
            aria-label="Search projects"
          />
        </div>

        {tab === 'shared' ? (
          <div className="mt-10 v-card rounded-xl p-10 text-center max-w-xl mx-auto">
            <Users className="w-7 h-7 mx-auto text-[var(--v-faint)]" />
            <p className="mt-2 text-[14px] font-semibold text-[var(--v-ink)]">Nothing shared with you yet</p>
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
                  className="rounded-xl border border-dashed border-[var(--v-line)] bg-transparent transition-colors hover:border-[var(--v-line-strong)] hover:bg-[var(--v-surface)] min-h-[172px] flex flex-col items-center justify-center gap-2 group"
                >
                  <span className="w-9 h-9 rounded-lg border border-[var(--v-line)] grid place-items-center text-[var(--v-muted)] transition-colors group-hover:text-[var(--v-ink)]">
                    <Plus className="w-4 h-4" />
                  </span>
                  <span className="text-[12.5px] font-medium text-[var(--v-ink)]">New project</span>
                  <span className="text-[10.5px] text-[var(--v-faint)]">
                    {paid ? 'Unlimited' : `${remaining} free left`}
                  </span>
                </button>
              )}

              {visible.map((project) => {
                const isCurrent = currentProject?.id === project.id;
                const menuOpen = menuFor === project.id;

                return (
                  <article
                    key={project.id}
                    className={`relative group ${
                      view === 'grid'
                        ? 'v-card v-card-lift rounded-xl'
                        : 'v-card flex items-center gap-3 rounded-lg p-3'
                    }`}
                  >
                    {view === 'grid' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => (tab === 'trash' ? undefined : openProject(project))}
                          className="block w-full text-left"
                        >
                          <div className="relative h-[112px] overflow-hidden rounded-t-lg border-b border-[var(--v-line)] bg-[var(--v-surface-2)]">
                            <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,rgba(113,112,255,.14),transparent_60%)]" />
                            <span className="absolute bottom-2.5 left-3.5 text-[24px] font-semibold tracking-[-0.03em] text-[var(--v-ink)]">
                              {project.name.slice(0, 2).toUpperCase()}
                            </span>
                            {isCurrent && (
                              <span className="absolute top-2.5 left-2.5 rounded-full border border-[var(--v-line)] bg-[var(--v-surface)]/85 px-2 py-0.5 text-[9px] font-medium text-[var(--v-muted)]">
                                Current
                              </span>
                            )}
                            <span className="absolute bottom-2.5 right-3 grid h-6 w-6 place-items-center rounded-md border border-[var(--v-line)] bg-[var(--v-surface)]/70 opacity-0 transition-opacity group-hover:opacity-100">
                              <ArrowUpRight className="w-3 h-3 text-[var(--v-ink)]" />
                            </span>
                          </div>
                          <div className="p-3.5">
                            <p className="text-[12.5px] font-semibold text-[var(--v-ink)] truncate">{project.name}</p>
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
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] text-[12px] font-semibold text-[var(--v-ink)]">
                          {project.name.slice(0, 2).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => (tab === 'trash' ? undefined : openProject(project))}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="text-[12.5px] font-semibold text-[var(--v-ink)] truncate">{project.name}</p>
                          <p className="text-[10.5px] text-[var(--v-faint)] truncate">
                            {project.description || 'No description'} Â· {new Date(project.updatedAt).toLocaleDateString()}
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
                            className="px-2.5 py-1.5 rounded-lg bg-[var(--v-surface)] border border-[var(--v-line)] text-[10.5px] font-semibold text-[var(--v-ink)] hover:border-[var(--v-violet)]"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(project)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FDF2F0] text-[10.5px] font-semibold text-[#B94D42] hover:bg-[#FBEAE7]"
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
              <div className="mt-6 v-card rounded-xl p-10 text-center">
                <Sparkles className="w-6 h-6 mx-auto text-[var(--v-faint)]" />
                <p className="mt-2 text-[13.5px] font-semibold text-[var(--v-ink)]">
                  {query ? `No projects match â€œ${query}â€` : tab === 'trash' ? 'Trash is empty' : 'No projects yet'}
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

        {/* Footer meta */}
        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--v-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-[var(--v-faint)]">
            {paid ? 'Pro plan · unlimited projects' : `${remaining} free project${remaining === 1 ? '' : 's'} left`}
            {localMode ? ' · Stored in this browser' : ''}
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onOpenPricing?.()}
              className="text-[11.5px] text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)]"
            >
              {paid ? 'Manage plan' : 'See plans'}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)]"
            >
              <Database className="w-3.5 h-3.5" /> Account &amp; data
            </button>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <div className="absolute inset-0 bg-[#14121F]/50 backdrop-blur-sm" onClick={() => setCreateOpen(false)} aria-hidden="true" />
          <form onSubmit={handleCreate} className="relative w-full max-w-[440px] v-card rounded-xl p-6 shadow-[var(--v-shadow-lg)]">
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">Name</span>
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="What is being designed?"
                className="mt-1.5 w-full rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-4 py-3 text-[13px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
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
          <form onSubmit={handleEditSave} className="relative w-full max-w-[440px] v-card rounded-xl p-6 shadow-[var(--v-shadow-lg)]">
            <div className="flex items-start justify-between">
              <h2 className="v-display text-[22px] text-[var(--v-ink)]">Edit project</h2>
              <button type="button" onClick={() => setEditTarget(null)} className="v-icon-btn -mr-2 -mt-2" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">Name</span>
              <input value={editName} onChange={(event) => setEditName(event.target.value)} required maxLength={120} className="v-input mt-1.5 h-11 px-4 text-[13px]" />
            </label>
            <label className="block mt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">Description</span>
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-4 py-3 text-[13px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
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

