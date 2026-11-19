import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Clock3,
  FolderKanban,
  GitBranch,
  LayoutTemplate,
  Palette,
  Plus,
  Send,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { buildPagesPrompt } from '../data/canvas.ts';
import { BuildComposerModal } from '../components/projects/BuildComposerModal.tsx';
import { ConnectDialog } from '../components/generators/ConnectDialog.tsx';
import { isPaid, readEntitlements } from '../services/entitlements.ts';
import { getActiveDesignSystem } from '../services/designSystems.ts';
import type { CanvasPage } from '../data/canvas.ts';
import { Download, FileText, Paperclip, Rocket, Trash2, Upload, Wand2 } from 'lucide-react';

interface ProjectRef {
  id: string;
  name: string;
  description?: string;
}

interface ProjectWorkspacePageProps {
  project: ProjectRef;
  onBack: () => void;
  onOpenCanvas: () => void;
  onBlankCanvas: () => void;
  onOptimizePrompt: () => void;
  onOpenDesignSystem: () => void;
  onDeploy: () => void;
  onOpenRequirements: () => void;
  onOpenIntelligence: () => void;
  onOpenReview: () => void;
  onOpenPromptStudio: () => void;
  onOpenWorkspace: () => void;
}

interface SavedDoc {
  name: string;
  pages: CanvasPage[];
  updatedAt?: string;
}

export const ProjectWorkspacePage: React.FC<ProjectWorkspacePageProps> = ({
  project,
  onBack,
  onOpenCanvas,
  onBlankCanvas,
  onOptimizePrompt,
  onOpenDesignSystem,
  onDeploy,
  onOpenRequirements,
  onOpenIntelligence,
  onOpenReview,
  onOpenPromptStudio,
  onOpenWorkspace,
}) => {
  const [doc, setDoc] = useState<SavedDoc | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [connectPrompt, setConnectPrompt] = useState<string | null>(null);
  const [files, setFiles] = useState<Array<{ id: string; name: string; type: string; size: number; dataUrl: string }>>([]);
  const fileRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const rawFiles = localStorage.getItem(`vector_project_files_${project.id}`);
      if (rawFiles) setFiles(JSON.parse(rawFiles));
    } catch {
      // ignore
    }
  }, [project.id]);

  const persistFiles = (next: typeof files) => {
    setFiles(next);
    try {
      localStorage.setItem(`vector_project_files_${project.id}`, JSON.stringify(next));
    } catch {
      // quota
    }
  };

  const addFiles = (list: File[]) => {
    list.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        persistFiles([
          ...files,
          {
            id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl: String(reader.result || ''),
          },
        ]);
      reader.readAsDataURL(file);
    });
  };
  const designSystem = useMemo(() => getActiveDesignSystem(), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`vector_project_doc_${project.id}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.pages)) setDoc(parsed);
    } catch {
      // ignore
    }
  }, [project.id]);

  const canvasPrompt = doc ? buildPagesPrompt(project.name, doc.pages) : '';
  const paid = isPaid(readEntitlements());
  const pageCount = doc?.pages?.length || 0;
  const elementCount = doc?.pages?.reduce((sum, page) => sum + page.items.length, 0) || 0;
  const edited = doc?.updatedAt ? new Date(doc.updatedAt) : null;

  return (
    <div className="space-y-5 v-fade-up">
      {/* Header */}
      <section className="rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-5">
        <div className="flex flex-wrap items-start gap-3">
          <button type="button" onClick={onBack} className="v-icon-btn -ml-1 shrink-0" aria-label="Back to projects">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="v-eyebrow">Project workspace</p>
            <h1 className="v-display mt-1 truncate text-[26px] text-[var(--v-ink)] sm:text-[30px]">{project.name}</h1>
            <p className="mt-1 text-[12px] text-[var(--v-muted)]">
              {project.description || 'Everything for this project lives here — canvases, templates, prompts and assets.'}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {doc && (
              <button type="button" onClick={onOpenCanvas} className="v-btn v-btn-ghost h-9 px-3 text-[11.5px]">
                Open canvas
              </button>
            )}
            <button type="button" onClick={onBlankCanvas} className="v-btn v-btn-primary h-9 px-3.5 text-[11.5px]">
              <Plus className="w-3.5 h-3.5" /> New canvas
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Canvases', value: String(pageCount || 0) },
            { label: 'Elements', value: String(elementCount) },
            { label: 'Last edited', value: edited ? edited.toLocaleDateString() : '—' },
            { label: 'Design system', value: designSystem?.name || 'None' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-[var(--v-surface-2)] px-3 py-2">
              <p className="truncate text-[13px] font-extrabold text-[var(--v-ink)]">{stat.value}</p>
              <p className="text-[9.5px] uppercase tracking-wider text-[var(--v-faint)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="v-eyebrow">Project pipeline</p>
            <h2 className="mt-0.5 text-[14px] font-bold text-[var(--v-ink)]">Requirements → Analyse → Review → Brief → Build</h2>
          </div>
          <span className="text-[10px] text-[var(--v-faint)]">One workspace for every stage</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { title: 'Requirements', caption: 'Upload and approve', icon: FileText, action: onOpenRequirements },
            { title: 'Analyse', caption: 'Check the prompt', icon: Sparkles, action: onOptimizePrompt },
            { title: 'Review findings', caption: 'Ambiguities and conflicts', icon: GitBranch, action: onOpenIntelligence },
            { title: 'Acceptance', caption: 'Suggestions and criteria', icon: ClipboardCheck, action: onOpenReview },
            { title: 'Brief', caption: 'Build the six-section prompt', icon: Wand2, action: onOpenPromptStudio },
            { title: 'Build', caption: 'Generate and preview', icon: Rocket, action: onOpenWorkspace },
          ].map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.title}
                type="button"
                onClick={stage.action}
                className="group rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] px-3 py-2.5 text-left transition-colors hover:border-[var(--v-violet)] hover:bg-[var(--v-surface)]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--v-surface)] text-[var(--v-violet)] group-hover:bg-[var(--v-surface-2)]">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="mt-1.5 block text-[11.5px] font-bold text-[var(--v-ink)]">{stage.title}</span>
                <span className="block text-[9.5px] leading-snug text-[var(--v-muted)]">{stage.caption}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Start */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: doc ? 'Continue working' : 'Blank canvas',
            body: doc ? `Pick up ${pageCount} canvas page${pageCount === 1 ? '' : 's'}.` : 'Start from an empty 1200×800 frame.',
            icon: FolderKanban,
            action: doc ? onOpenCanvas : onBlankCanvas,
          },
          {
            title: 'Requirements',
            body: 'Upload a document and approve the compiled requirements.',
            icon: FileText,
            action: onOpenRequirements,
          },
          {
            title: 'Analyse a prompt',
            body: 'Score an instruction and find its gaps before you generate.',
            icon: Sparkles,
            action: onOptimizePrompt,
          },
          {
            title: 'Review findings',
            body: 'Inspect ambiguities, conflicts and dependencies in the graph.',
            icon: GitBranch,
            action: onOpenIntelligence,
          },
          {
            title: 'Review & acceptance',
            body: 'Accept suggestions and approve Given/When/Then criteria.',
            icon: ClipboardCheck,
            action: onOpenReview,
          },
          {
            title: 'Build the brief',
            body: 'Generate the six-section prompt from approved decisions.',
            icon: Wand2,
            action: onOpenPromptStudio,
          },
          {
            title: 'Design system',
            body: designSystem ? `${designSystem.name} is attached to prompts.` : 'Attach your organisation tokens.',
            icon: Palette,
            action: onOpenDesignSystem,
          },
          {
            title: 'Build and generate',
            body: 'Send the approved brief to the builder and preview the result.',
            icon: Rocket,
            action: onOpenWorkspace,
          },
          {
            title: 'Deploy',
            body: 'Connect Vercel or Netlify and publish this project.',
            icon: Send,
            action: onDeploy,
          },
          {
            title: 'Share this project',
            body: 'Invite people and see who is editing live.',
            icon: Share2,
            action: onOpenCanvas,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              type="button"
              onClick={card.action}
              className="v-card v-card-lift rounded-2xl p-4 text-left"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--v-surface-2)] text-[var(--v-violet)]">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-2.5 text-[12.5px] font-bold text-[var(--v-ink)]">{card.title}</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-[var(--v-muted)]">{card.body}</p>
            </button>
          );
        })}
      </section>

      <BuildComposerModal
        open={composerOpen}
        projectName={project.name}
        canvasPrompt={canvasPrompt}
        canvasPages={pageCount}
        files={files}
        onClose={() => setComposerOpen(false)}
        onConnect={(prompt) => {
          setComposerOpen(false);
          setConnectPrompt(prompt);
        }}
      />

      <ConnectDialog
        open={Boolean(connectPrompt)}
        onClose={() => setConnectPrompt(null)}
        prompt={connectPrompt || ''}
        paid={paid}
        onRequireUpgrade={() => setConnectPrompt(null)}
      />

      {/* Files and documents */}
      <section className="rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Paperclip className="h-3.5 w-3.5 text-[var(--v-muted)]" />
          <p className="text-[12px] font-bold text-[var(--v-ink)]">Files and documents</p>
          <span className="text-[10px] text-[var(--v-faint)]">{files.length} in this project</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--v-line)] px-2.5 text-[10.5px] font-bold text-[var(--v-ink)] hover:bg-[var(--v-surface-2)]"
          >
            <Upload className="h-3 w-3" /> Add files
          </button>
        </div>

        {files.length === 0 ? (
          <p className="mt-2 text-[11px] text-[var(--v-muted)]">
            Briefs, brand PDFs, screenshots — anything the project needs. Kept with the project.
          </p>
        ) : (
          <div className="mt-2.5 space-y-1.5">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-2 rounded-lg bg-[var(--v-surface-2)] px-2.5 py-1.5">
                <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--v-muted)]" />
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[var(--v-ink)]">{file.name}</span>
                <span className="shrink-0 text-[9.5px] text-[var(--v-faint)]">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                <a href={file.dataUrl} download={file.name} className="grid h-6 w-6 place-items-center rounded text-[var(--v-muted)] hover:text-[var(--v-ink)]" aria-label="Download">
                  <Download className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  onClick={() => persistFiles(files.filter((entry) => entry.id !== file.id))}
                  className="grid h-6 w-6 place-items-center rounded text-[var(--v-coral)]"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(Array.from(event.target.files || []));
            event.target.value = '';
          }}
        />
      </section>

      {/* Activity */}
      <section className="rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
        <div className="flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5 text-[var(--v-muted)]" />
          <p className="text-[12px] font-bold text-[var(--v-ink)]">Project activity</p>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--v-muted)]">
          {doc
            ? `Last saved ${edited ? edited.toLocaleString() : 'recently'} · ${pageCount} canvas page${pageCount === 1 ? '' : 's'} · ${elementCount} elements. Everything is stored under this project.`
            : 'Nothing saved yet. Start a blank canvas or pick a template — the result is stored under this project.'}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--v-surface-2)] px-2 py-0.5 text-[9.5px] font-semibold text-[var(--v-muted)]">
            <Users className="h-2.5 w-2.5" /> Members can be invited
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--v-surface-2)] px-2 py-0.5 text-[9.5px] font-semibold text-[var(--v-muted)]">
            <Send className="h-2.5 w-2.5" /> Generate from the canvas
          </span>
          <button
            type="button"
            onClick={onOpenCanvas}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--v-ink)] px-2 py-0.5 text-[9.5px] font-bold text-[var(--v-surface)]"
          >
            Open workspace <ArrowRight className="h-2.5 w-2.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
