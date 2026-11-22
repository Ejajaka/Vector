import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Image as ImageIcon,
  Layers,
  Loader2,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  buildPagesPrompt,
  FONT_STACKS,
  type CanvasItem,
  type CanvasPage,
} from '../data/canvas.ts';
import {
  auditElements,
  auditQuality,
  compilePromptScreens,
  layoutElements,
  roughRisk,
  type CompiledElement,
  type PromptScreen,
  type Question,
} from '../services/promptCompiler.ts';
import { TYPE_TO_VARIANT, VARIANTS, variantById } from '../data/styles.ts';
import { StyledElement } from '../components/editor/StyledElement.tsx';
import { WireframePreview } from '../components/editor/WireframePreview.tsx';
import { parseFigmaJson } from '../services/figma.ts';
import { designSystemPrompt, getActiveDesignSystem, type DesignSystem } from '../services/designSystems.ts';
import { DesignSystemPickerDialog } from '../components/project/DesignSystemPickerDialog.tsx';
import { readProjectSetup } from '../services/projectSeed.ts';
import { readBase44PageUrl, saveBase44PageUrl } from '../services/base44.ts';
import { loadProjectMemory } from '../services/projectMemory.ts';
import { MEMORY_KEYS } from '../services/generation/memory.ts';
import { analyzeRequirements } from '../services/requirements/intelligence.ts';
import { generateAcceptanceCriteria } from '../services/requirements/acceptance.ts';
import { buildDocumentPrompt } from '../services/requirements/documentPrompt.ts';
import { listAcceptanceCriteria } from '../services/requirements/acceptanceRepository.ts';
import { listRequirementDocuments, listRequirements } from '../services/documents/requirementDocuments.ts';
import type { AcceptanceCriterion, RequirementDocument, RequirementRecord } from '../types/requirements.ts';
import { currentRoom, projectRoom, shareLink } from '../services/collab.ts';
import { loadSharedDoc, saveSharedDoc, encodeSharedCanvas } from '../services/sharedDocs.ts';
import { isPaid, readEntitlements } from '../services/entitlements.ts';
import type { ActiveTab } from '../types/analysis.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useSearchAutocomplete } from '../hooks/useSearchAutocomplete.ts';
import { SearchSuggestions } from '../components/ui/SearchSuggestions.tsx';
import {
  ProjectToolsDialog,
  type ProjectToolId,
  type ProjectToolSource,
} from '../components/project/ProjectToolsDialog.tsx';

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
  onNavigate: (tab: ActiveTab) => void;
}

interface SavedDoc {
  name: string;
  pages: CanvasPage[];
  updatedAt?: string;
}

interface PromptDraft {
  text?: string;
  submitted?: string;
  answers?: Record<string, string>;
  confirmed?: Record<string, boolean>;
}

interface RevisedPrompt {
  prompt: string;
  updatedAt: string;
  risk: number;
  elements: number;
  pages: number;
}

interface PromptVersion {
  id: string;
  label: string;
  source: 'canvas' | 'analysis';
  prompt: string;
  updatedAt: string;
  pages: number;
  elements: number;
  risk?: number;
}

interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

interface Artifact {
  id: string;
  label: string;
  summary: string;
  bodyHtml: string;
  json: unknown;
  graphSvg?: string;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function relativeTime(value?: string): string {
  if (!value) return 'not saved yet';
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return 'recently';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return new Date(value).toLocaleDateString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'project';
}

function dataUrlToText(dataUrl: string): string {
  try {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) return '';
    const meta = dataUrl.slice(0, comma);
    const payload = dataUrl.slice(comma + 1);
    if (!meta.includes(';base64')) return decodeURIComponent(payload);
    const bytes = dataUrlToBytes(dataUrl);
    return bytes ? new TextDecoder().decode(bytes) : '';
  } catch {
    return '';
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  try {
    const base64 = dataUrl.split(',')[1];
    if (!base64) return null;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    return null;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function variantFor(item: CanvasItem) {
  return (
    variantById(item.variant || '') ||
    variantById(TYPE_TO_VARIANT[item.type] || '') ||
    VARIANTS[0]
  );
}

/** Renders the real first canvas page, scaled into a PowerPoint-style slide. */
const ActualBoard: React.FC<{ page?: CanvasPage; empty: string }> = ({ page, empty }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth || 320);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!page) {
    return (
      <div ref={ref} aria-hidden="true" className="grid h-[180px] place-items-center rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] px-4 text-center text-[10px] text-[var(--v-faint)]">
        {empty}
      </div>
    );
  }

  const pageW = page.width || 1200;
  const pageH = page.height || 800;
  const scale = Math.min(width / pageW, 180 / pageH);

  return (
    <div ref={ref} aria-hidden="true" className="relative h-[180px] overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)]">
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: pageW * scale,
          height: pageH * scale,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="relative shadow-[0_12px_28px_-18px_rgba(20,18,31,.45)]"
          style={{
            width: pageW,
            height: pageH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: page.background || '#FFFFFF',
          }}
        >
          {page.items.map((item) => (
            <div
              key={item.id}
              className="pointer-events-none absolute"
              style={{
                left: item.x,
                top: item.y,
                width: item.w,
                height: item.h,
                fontFamily: item.fontFamily ? FONT_STACKS[item.fontFamily] : undefined,
              }}
            >
              <StyledElement
                style={variantFor(item).style}
                label={item.label}
                texts={item.texts}
                color={item.color}
                src={item.src}
                fontSize={item.fontSize}
                fontWeight={item.fontWeight}
                align={item.align}
                fill={item.fill}
                strokeColor={item.strokeColor}
                strokeWidth={item.strokeWidth}
                radius={item.radius}
                fontFamily={item.fontFamily}
                italic={item.italic}
                underline={item.underline}
                tracking={item.tracking}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FolderItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  meta?: string;
  active?: boolean;
  badge?: string;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent) => void;
  onClick?: () => void;
  trailing?: React.ReactNode;
}> = ({ icon, title, meta, active, badge, draggable, onDragStart, onClick, trailing }) => (
  <div
    draggable={draggable}
    onDragStart={onDragStart}
    onClick={onClick}
    className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
      active ? 'bg-[var(--v-violet)]/10' : 'hover:bg-[var(--v-surface-2)]'
    }`}
    title={title}
  >
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${active ? 'bg-[var(--v-violet)] text-white' : 'bg-[var(--v-surface-2)] text-[var(--v-muted)]'}`}>
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-1">
        <span className="block truncate text-[10.5px] font-semibold text-[var(--v-ink)]">{title}</span>
        {badge && <span className="shrink-0 rounded bg-[var(--v-surface-2)] px-1 py-0.5 text-[7.5px] font-semibold uppercase tracking-wider text-[var(--v-faint)]">{badge}</span>}
      </span>
      {meta && <span className="block truncate text-[8.5px] text-[var(--v-faint)]">{meta}</span>}
    </span>
    {trailing}
  </div>
);

const FolderGroup: React.FC<{
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, count, open, onToggle, children }) => (
  <div className="mt-2">
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-1.5 px-1 py-1 text-left">
      {open ? <ChevronDown className="h-3 w-3 text-[var(--v-faint)]" /> : <ChevronRight className="h-3 w-3 text-[var(--v-faint)]" />}
      <span className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[var(--v-faint)]">{title}</span>
      <span className="ml-auto text-[8px] text-[var(--v-faint)]">{count}</span>
    </button>
    {open && <div className="space-y-0.5">{children}</div>}
  </div>
);

const ArtifactModal: React.FC<{
  artifact: Artifact;
  onClose: () => void;
}> = ({ artifact, onClose }) => (
  <div className="fixed inset-0 z-[96] grid place-items-center p-3" role="dialog" aria-modal="true" aria-label={artifact.label}>
    <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
    <div className="relative flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[0_30px_80px_-30px_rgba(20,18,31,.5)]">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--v-line)] px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--v-violet)]/10 text-[var(--v-violet)]">
          <FileJson className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[var(--v-ink)]">{artifact.label}</p>
          <p className="truncate text-[9.5px] text-[var(--v-faint)]">{artifact.summary}</p>
        </div>
        <button type="button" onClick={onClose} className="v-icon-btn" aria-label="Close analysis">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="v-scroll min-h-0 flex-1 overflow-auto p-4">
        {artifact.graphSvg ? (
          <div className="rounded-xl bg-[var(--v-surface-2)] p-2" dangerouslySetInnerHTML={{ __html: artifact.graphSvg }} />
        ) : (
          <div className="v-artifact" dangerouslySetInnerHTML={{ __html: artifact.bodyHtml }} />
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--v-line)] px-4 py-3">
        <button
          type="button"
          onClick={() =>
            downloadBlob(
              new Blob([JSON.stringify(artifact.json, null, 2)], { type: 'application/json' }),
              `${slug(artifact.label)}.json`
            )
          }
          className="v-btn v-btn-ghost h-8 px-3 text-[10.5px]"
        >
          <Download className="h-3.5 w-3.5" /> Download JSON
        </button>
        <span className="ml-auto text-[9px] text-[var(--v-faint)]">Generated automatically from this project</span>
      </div>
    </div>
  </div>
);

export const ProjectWorkspacePage: React.FC<ProjectWorkspacePageProps> = ({
  project,
  onBack,
  onOpenCanvas,
  onBlankCanvas,
  onOptimizePrompt,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [doc, setDoc] = useState<SavedDoc | null>(null);
  const [draft, setDraft] = useState<PromptDraft>({});
  const [revised, setRevised] = useState<RevisedPrompt | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [folderOpen, setFolderOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 900
  );
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeVersionId, setActiveVersionId] = useState<string>('');
  const [base44VersionId, setBase44VersionId] = useState<string>('');
  const [promptModal, setPromptModal] = useState<PromptVersion | null>(null);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareGateOpen, setShareGateOpen] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [toolOpen, setToolOpen] = useState<ProjectToolId | null>(null);
  const [base44Copied, setBase44Copied] = useState(false);
  const [base44Key, setBase44Key] = useState(0);
  const [base44Loaded, setBase44Loaded] = useState(false);
  const [base44PageUrl, setBase44PageUrl] = useState(() => readBase44PageUrl(project.id));
  const [base44PageDraft, setBase44PageDraft] = useState(() => readBase44PageUrl(project.id));
  const [base44PageError, setBase44PageError] = useState('');
  const [generatedAt, setGeneratedAt] = useState(new Date().toISOString());
  const [requirementDocs, setRequirementDocs] = useState<RequirementDocument[]>([]);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [savedCriteria, setSavedCriteria] = useState<AcceptanceCriterion[]>([]);
  const [uploadPrompt, setUploadPrompt] = useState<string | null>(null);
  const [designSystemOpen, setDesignSystemOpen] = useState(false);
  const [documentPromptOpen, setDocumentPromptOpen] = useState(false);
  const [documentPromptCopied, setDocumentPromptCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const figmaRef = useRef<HTMLInputElement>(null);

  const setup = useMemo(() => readProjectSetup(project.id), [project.id]);
  const [designSystem, setDesignSystem] = useState<DesignSystem | null>(() => getActiveDesignSystem());

  const loadProject = useCallback(() => {
    const savedDoc = readJson<SavedDoc>(`vector_project_doc_${project.id}`);
    setDoc(savedDoc && Array.isArray(savedDoc.pages) ? savedDoc : null);
    setDraft(readJson<PromptDraft>(`vector_project_prompt_${project.id}`) || {});
    setRevised(readJson<RevisedPrompt>(`vector_project_revised_prompt_${project.id}`));
    setFiles(readJson<ProjectFile[]>(`vector_project_files_${project.id}`) || []);
  }, [project.id]);

  useEffect(() => {
    loadProject();
    const onFocus = () => loadProject();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadProject]);

  // A collaborator may have edited while the holder was away. Pull the shared
  // room so the project folder reflects their latest canvas.
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('share') !== '1') return;
    void loadSharedDoc(projectRoom(project.id)).then((shared) => {
      if (cancelled || !shared || !shared.pages.length) return;
      const local = readJson<SavedDoc>(`vector_project_doc_${project.id}`);
      if (local && JSON.stringify(local.pages) === JSON.stringify(shared.pages)) return;
      const next: SavedDoc = {
        name: shared.name || project.name,
        pages: shared.pages,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(`vector_project_doc_${project.id}`, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      setDoc(next);
    });
    return () => {
      cancelled = true;
    };
  }, [project.id, project.name]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (typing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setFolderOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const analysis = useMemo(() => {
    const submitted = (draft.submitted || '').trim();
    if (!submitted) return null;
    const screens = compilePromptScreens(submitted);
    const laidOut = screens.map((screen) => ({
      screen,
      elements: layoutElements(screen.elements, screen.archetype, 'desktop', screen.meta.tokens),
    }));
    const first = laidOut[0];
    if (!first) return null;
    return {
      screens,
      laidOut,
      first,
      risk: roughRisk(first.elements),
      questions: laidOut.flatMap((entry) => auditElements(entry.elements)),
    };
  }, [draft.submitted]);

  const versions = useMemo<PromptVersion[]>(() => {
    const next: PromptVersion[] = [];
    if (doc && doc.pages.length) {
      const base = buildPagesPrompt(project.name, doc.pages);
      next.push({
        id: 'canvas',
        label: 'Canvas prompt',
        source: 'canvas',
        prompt: designSystem ? `${base}\n\n${designSystemPrompt(designSystem)}` : base,
        updatedAt: doc.updatedAt || new Date().toISOString(),
        pages: doc.pages.length,
        elements: doc.pages.reduce((sum, page) => sum + page.items.length, 0),
      });
    }
    if (revised && revised.prompt.trim()) {
      next.push({
        id: 'analysis',
        label: 'Analysis prompt',
        source: 'analysis',
        prompt: revised.prompt,
        updatedAt: revised.updatedAt,
        pages: revised.pages,
        elements: revised.elements,
        risk: revised.risk,
      });
    }
    return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [doc, project.name, revised, designSystem]);

  const toolSources = useMemo<ProjectToolSource[]>(() => {
    const list: ProjectToolSource[] = versions.map((version) => ({
      id: `prompt:${version.id}`,
      label: version.label,
      detail: `${version.pages} page${version.pages === 1 ? '' : 's'} · ${version.elements} element${version.elements === 1 ? '' : 's'}${version.risk != null ? ` · risk ${version.risk}` : ''}`,
      text: version.prompt,
      kind: 'prompt',
    }));
    files.forEach((file) => {
      const textLike =
        file.type.startsWith('text/') ||
        /\.(txt|md|markdown|json|csv|tsv|html?)$/i.test(file.name);
      if (!textLike) return;
      const text = dataUrlToText(file.dataUrl);
      if (text.trim().length < 24) return;
      list.push({
        id: `file:${file.id}`,
        label: file.name,
        detail: `Project file · ${Math.max(1, Math.round(file.size / 1024))} KB`,
        text,
        kind: 'file',
      });
    });
    return list;
  }, [files, versions]);

  useEffect(() => {
    if (!versions.length) {
      setActiveVersionId('');
      setBase44VersionId('');
      return;
    }
    setActiveVersionId((current) =>
      versions.some((version) => version.id === current) ? current : versions[0].id
    );
    setBase44VersionId((current) =>
      versions.some((version) => version.id === current) ? current : versions[0].id
    );
  }, [versions]);

  const activeVersion = versions.find((version) => version.id === activeVersionId) || versions[0];
  const base44Version = versions.find((version) => version.id === base44VersionId) || activeVersion;
  const collabRoom = useMemo(() => projectRoom(project.id), [project.id]);
  const shareUrl = useMemo(() => {
    const url = new URL(shareLink(collabRoom));
    url.searchParams.set('project', project.id);
    url.searchParams.set('name', project.name);
    url.searchParams.set('share', '1');
    if (user?.id) url.searchParams.set('owner', user.id);
    if (doc?.pages.length) {
      const payload = encodeSharedCanvas({
        name: doc.name || project.name,
        pages: doc.pages,
        ownerId: user?.id || null,
        projectId: project.id,
      });
      if (payload.length < 1_500_000) url.searchParams.set('canvas', payload);
    }
    return url.toString();
  }, [collabRoom, doc, project.id, project.name, user?.id]);

  const sourcePages = useMemo(() => {
    if (activeVersion?.source === 'canvas' && doc) {
      return doc.pages.map((page) => ({
        name: page.name,
        width: page.width || 1200,
        height: page.height || 800,
        background: page.background || '#FFFFFF',
        elements: page.items.map((item) => ({
          id: item.id,
          kind: item.type,
          label: item.label,
          action: item.action,
          notes: item.notes,
          linkToPageId: item.linkToPageId,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          color: item.color,
          fontSize: item.fontSize,
        })),
      }));
    }
    if (activeVersion?.source === 'analysis' && analysis) {
      return analysis.laidOut.map((entry) => ({
        name: entry.screen.name,
        width: 1200,
        height: 800,
        background: entry.screen.meta.dark ? '#0B0E14' : '#FFFFFF',
        elements: entry.elements.map((element) => ({
          id: element.id,
          kind: element.kind,
          label: element.label,
          action: element.action,
          notes: undefined as string[] | undefined,
          linkToPageId: undefined as string | undefined,
          x: element.x,
          y: element.y,
          w: element.w,
          h: element.h,
          color: element.colour,
          fontSize: undefined as number | undefined,
        })),
      }));
    }
    return [];
  }, [activeVersion, doc, analysis]);

  const artifacts = useMemo<Artifact[]>(() => {
    const pages = sourcePages;
    const elements = pages.flatMap((page) =>
      page.elements.map((element) => ({ ...element, page: page.name }))
    );
    const openQuestions: Question[] =
      activeVersion?.source === 'analysis' && analysis ? analysis.questions : [];

    const analysisJson = {
      generatedAt,
      source: activeVersion?.label || 'No source yet',
      sourceUpdatedAt: activeVersion?.updatedAt || null,
      risk: activeVersion?.risk ?? (analysis?.risk ?? null),
      pages: pages.length,
      elements: elements.length,
      openQuestions: openQuestions.map((question) => ({ id: question.id, text: question.text })),
    };

    const listHtml = (items: string[]) =>
      items.length
        ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '<p class="muted">Nothing to show yet.</p>';

    const analysisHtml = `<p><span class="pill">${escapeHtml(activeVersion?.label || 'No source')}</span></p>
      <table><tr><th>Pages</th><td>${pages.length}</td></tr>
      <tr><th>Elements</th><td>${elements.length}</td></tr>
      <tr><th>Risk</th><td>${activeVersion?.risk ?? analysis?.risk ?? '-'}</td></tr>
      <tr><th>Open questions</th><td>${openQuestions.length}</td></tr></table>
      <h2>Open questions</h2>${listHtml(openQuestions.map((question) => question.text))}`;

    // Requirement graph, review findings and acceptance criteria are extracted
    // from uploaded requirement documents, never from the canvas or a prompt.
    return [
      {
        id: 'prompt-analysis',
        label: 'Prompt analysis',
        summary: `${activeVersion?.label || 'No source'} - ${elements.length} elements${activeVersion?.risk != null ? ` - risk ${activeVersion.risk}` : ''}`,
        bodyHtml: analysisHtml,
        json: analysisJson,
      },
    ];
  }, [activeVersion, analysis, generatedAt, sourcePages]);

  useEffect(() => {
    setGeneratedAt(new Date().toISOString());
  }, [doc?.updatedAt, revised?.updatedAt, activeVersion?.id, files.length]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `vector_project_generated_${project.id}`,
        JSON.stringify({
          generatedAt,
          source: activeVersion?.label || null,
          artifacts: artifacts.map((entry) => ({ id: entry.id, label: entry.label, json: entry.json })),
        })
      );
    } catch {
      // best effort
    }
  }, [project.id, generatedAt, activeVersion?.label, artifacts]);

  const importFigmaFile = async (file: File) => {
    setImportError(null);
    try {
      const result = parseFigmaJson(await file.text());
      if (!result.pages.length) throw new Error('That export did not contain any pages.');
      const next = { name: project.name, pages: result.pages, updatedAt: new Date().toISOString() };
      localStorage.setItem(`vector_project_doc_${project.id}`, JSON.stringify(next));
      setDoc(next);
      setImportOpen(false);
      onOpenCanvas();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'That file could not be imported.');
    }
  };

  const addFiles = (list: File[]) => {
    list.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const entry = {
          id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: String(reader.result || ''),
        };
        setFiles((previous) => {
          const next = [...previous, entry];
          try {
            localStorage.setItem(`vector_project_files_${project.id}`, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    const next = files.filter((file) => file.id !== id);
    setFiles(next);
    try {
      localStorage.setItem(`vector_project_files_${project.id}`, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const copyShare = async () => {
    // Always publish the current canvas when the owner copies a share link,
    // so the recipient sees the same state rather than an older snapshot.
    if (doc && doc.pages.length) {
      try {
        localStorage.setItem(`vector_project_share_room_${project.id}`, collabRoom);
      } catch {
        // ignore
      }
      void saveSharedDoc(collabRoom, {
        name: doc.name || project.name,
        pages: doc.pages,
        ownerId: user?.id || null,
        projectId: project.id,
      });
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let room = '';
    try {
      room = localStorage.getItem(`vector_project_share_room_${project.id}`) || '';
    } catch {
      room = '';
    }
    if (!room || !doc?.pages.length) return;
    const timer = window.setTimeout(() => {
      void saveSharedDoc(room, {
        name: doc.name || project.name,
        pages: doc.pages,
        ownerId: user?.id || null,
        projectId: project.id,
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [doc, project.id, project.name, user?.id]);

  const zipProject = async () => {
    setZipBusy(true);
    try {
      const zip = new JSZip();
      const root = slug(project.name);
      const activePrompt = activeVersion?.prompt || '';
      zip.file('project.json', JSON.stringify({
        id: project.id,
        name: project.name,
        description: project.description || '',
        setup,
        activePromptVersion: activeVersion?.label || null,
        generatedAt,
        versions: versions.map((version) => ({
          id: version.id,
          label: version.label,
          source: version.source,
          updatedAt: version.updatedAt,
          pages: version.pages,
          elements: version.elements,
          risk: version.risk ?? null,
        })),
      }, null, 2));
      zip.file('README.md', `# ${project.name}\n\n${project.description || ''}\n\nActive prompt: ${activeVersion?.label || 'none'}\nGenerated: ${generatedAt}\n`);
      if (activePrompt) zip.file('prompt.md', activePrompt);
      versions.forEach((version) => {
        zip.file(`prompts/${version.source}-${slug(version.updatedAt)}.md`, version.prompt);
      });
      if (doc) {
        zip.file('canvas/project.canvas.json', JSON.stringify(doc, null, 2));
        doc.pages.forEach((page) => {
          zip.file(`canvas/${slug(page.name)}.json`, JSON.stringify(page, null, 2));
        });
      }
      if (draft.submitted) {
        zip.file('analysis/prompt.json', JSON.stringify({ draft, revised }, null, 2));
      }
      files.forEach((file) => {
        const bytes = dataUrlToBytes(file.dataUrl);
        if (bytes) zip.file(`sources/files/${file.name}`, bytes);
      });
      if (designSystem) zip.file('sources/design-system.json', JSON.stringify(designSystem, null, 2));
      artifacts.forEach((entry) => {
        zip.file(`generated/${entry.id}.json`, JSON.stringify(entry.json, null, 2));
        zip.file(`generated/${entry.id}.html`, openHtmlDocument(entry.label, entry.graphSvg || entry.bodyHtml));
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `${root}.zip`);
    } finally {
      setZipBusy(false);
    }
  };

  const fullTabForTool: Record<ProjectToolId, ActiveTab> = {
    requirements: 'requirements',
    graph: 'intelligence',
    review: 'review',
    prompt: 'prompt',
    build: 'workspace',
    design: 'design',
    analyser: 'new-analysis',
  };

  const copyBase44Prompt = async () => {
    if (!base44Version) return;
    try {
      await navigator.clipboard.writeText(base44Version.prompt);
      setBase44Copied(true);
      window.setTimeout(() => setBase44Copied(false), 1800);
    } catch {
      setBase44Copied(false);
    }
  };

  const reloadBase44 = () => {
    setBase44Loaded(false);
    setBase44Key((value) => value + 1);
  };

  useEffect(() => {
    let active = true;
    setBase44PageError('');
    const next = readBase44PageUrl(project.id);
    setBase44PageUrl(next);
    setBase44PageDraft(next);
    const explicitKey = `vector_project_base44_page_${project.id}`;
    if (localStorage.getItem(explicitKey)) return;
    void loadProjectMemory<string>(project.id, MEMORY_KEYS.publishedUrl, '').then((url) => {
      if (!active || !/^https?:\/\//i.test(url)) return;
      setBase44PageUrl(url);
      setBase44PageDraft(url);
    }).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [project.id]);

  const applyBase44Page = () => {
    const next = base44PageDraft.trim();
    if (!/^https?:\/\//i.test(next)) {
      setBase44PageError('Enter a full https URL, for example https://app.base44.com/apps/...');
      return;
    }
    const saved = saveBase44PageUrl(project.id, next);
    setBase44PageUrl(saved);
    setBase44PageDraft(saved);
    setBase44PageError('');
    setBase44Loaded(false);
    setBase44Key((value) => value + 1);
  };

  useEffect(() => {
    let active = true;
    void Promise.all([
      listRequirementDocuments(project.id),
      listRequirements(project.id),
    ])
      .then(async ([docs, reqs]) => {
        if (!active) return;
        setRequirementDocs(docs);
        setRequirements(reqs);
        const codeMap = new Map(reqs.map((requirement) => [requirement.id, requirement.requirementCode]));
        const criteria = await listAcceptanceCriteria(project.id, codeMap).catch(() => []);
        if (active) setSavedCriteria(criteria);
      })
      .catch(() => {
        if (!active) return;
        setRequirementDocs([]);
        setRequirements([]);
        setSavedCriteria([]);
      });
    return () => {
      active = false;
    };
  }, [project.id]);

  const requirementAnalysis = useMemo(
    () => (requirements.length ? analyzeRequirements(requirements) : null),
    [requirements],
  );
  const requirementCriteria = useMemo(
    () => (requirements.length ? generateAcceptanceCriteria(requirements, project.id) : []),
    [requirements, project.id],
  );
  const hasRequirementDocument = requirementDocs.length > 0;
  const approvedRequirements = requirements.filter((requirement) => requirement.status === 'approved');
  const approvedCriteria = savedCriteria.filter((criterion) => criterion.status === 'approved');
  const documentPrompt = useMemo(
    () =>
      buildDocumentPrompt({
        projectName: project.name,
        documentNames: requirementDocs.map((document) => document.fileName),
        requirements,
        criteria: savedCriteria,
        designSystem,
        analysis: requirementAnalysis,
        referenceFiles: files.map((file) => ({ name: file.name, type: file.type })),
      }),
    [project.name, requirementDocs, requirements, savedCriteria, designSystem, requirementAnalysis, files],
  );

  const activePromptLabel = activeVersion?.label || 'No prompt yet';
  const activeMeta = activeVersion
    ? `${activeVersion.pages} page${activeVersion.pages === 1 ? '' : 's'} · ${activeVersion.elements} elements${activeVersion.risk != null ? ` · risk ${activeVersion.risk}` : ''}`
    : 'Add a canvas or analyse a prompt';

  const filtered = (label: string) => !search.trim() || label.toLowerCase().includes(search.trim().toLowerCase());
  const filteredVersions = versions.filter((version) => filtered(version.label));
  const filteredPages = (doc?.pages || []).filter((page) => filtered(page.name));
  const filteredFiles = files.filter((file) => filtered(file.name));
  const generatedItems = [
    {
      id: 'graph',
      label: 'Requirement graph',
      summary: requirementAnalysis
        ? `${requirementAnalysis.graph.nodes.length} nodes · ${requirementAnalysis.graph.edges.length} relations`
        : hasRequirementDocument
          ? 'No requirements found in the document'
          : 'Requires a project document',
      tab: 'intelligence' as ActiveTab,
      ready: !!requirementAnalysis,
    },
    {
      id: 'review',
      label: 'Review findings',
      summary: requirementAnalysis
        ? `${requirementAnalysis.findings.length} findings`
        : hasRequirementDocument
          ? 'No requirements found in the document'
          : 'Requires a project document',
      tab: 'review' as ActiveTab,
      ready: !!requirementAnalysis,
    },
    {
      id: 'acceptance',
      label: 'Acceptance criteria',
      summary: requirementAnalysis
        ? `${requirementCriteria.length} criteria`
        : hasRequirementDocument
          ? 'No requirements found in the document'
          : 'Requires a project document',
      tab: 'review' as ActiveTab,
      ready: !!requirementAnalysis,
    },
  ];
  const filteredGenerated = generatedItems.filter((entry) => filtered(entry.label));
  const sourceMatches = !search.trim() || filtered('design system') || filtered('import');

  const projectSearchVocab = useMemo(() => [
    ...(doc?.pages || []).flatMap((page) => [
      { value: page.name, kind: 'page' as const, detail: 'Canvas page', tab: 'project' as const },
      ...(page.items || []).map((item) => ({ value: item.label, kind: 'element' as const, detail: 'Canvas element', tab: 'project' as const })),
    ]),
    ...versions.map((version) => ({ value: version.label, kind: 'prompt' as const, detail: 'Prompt version', tab: 'project' as const })),
    ...files.map((file) => ({ value: file.name, kind: 'file' as const, detail: 'Project file', tab: 'project' as const })),
    ...generatedItems.map((entry) => ({ value: entry.label, kind: 'element' as const, detail: entry.ready ? 'Generated from the project document' : 'Requires a project document', tab: 'project' as const })),
  ].filter((item) => item.value && item.value.trim().length > 1), [doc, versions, files, generatedItems]);
  const autocomplete = useSearchAutocomplete(projectSearchVocab, search, setSearch);

  const toggleGroup = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-3">
      {/* Header */}
      <header className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-2.5">
        <button type="button" onClick={onBack} className="v-icon-btn -ml-1" aria-label="Back to projects">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[16px] font-semibold text-[var(--v-ink)]">{project.name}</h1>
            {typeof setup?.start === 'string' && (
              <span className="rounded-full bg-[var(--v-surface-2)] px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">
                {setup.start}
              </span>
            )}
          </div>
          <p className="truncate text-[9.5px] text-[var(--v-faint)]">
            {activePromptLabel} · {activeMeta}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => void zipProject()} disabled={zipBusy} className="v-btn v-btn-ghost h-8 px-2.5 text-[10.5px]">
            {zipBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Zip
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPaid(readEntitlements())) {
                setShareGateOpen(true);
                return;
              }
              try {
                localStorage.setItem(`vector_project_share_room_${project.id}`, collabRoom);
              } catch {
                // ignore
              }
              if (doc?.pages.length) {
                void saveSharedDoc(collabRoom, {
                  name: doc.name || project.name,
                  pages: doc.pages,
                  ownerId: user?.id || null,
                  projectId: project.id,
                });
              }
              setShareOpen(true);
            }}
            className="v-btn v-btn-ghost h-8 px-2.5 text-[10.5px]"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </header>

      <nav data-guide="project-tools" className="flex shrink-0 flex-wrap items-center gap-1 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-1">
        <span className="px-2 text-[9.5px] font-medium uppercase tracking-[0.05em] text-[var(--v-faint)]">Project tools</span>
        {[
          { id: 'requirements' as ProjectToolId, label: 'Requirements', icon: FileText },
          { id: 'graph' as ProjectToolId, label: 'Requirement graph', icon: GitBranch },
          { id: 'review' as ProjectToolId, label: 'Review & acceptance', icon: ClipboardCheck },
        ].map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onNavigate(fullTabForTool[tool.id])}
              className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[10.5px] font-medium text-[var(--v-muted)] transition-colors hover:bg-[var(--v-surface-2)] hover:text-[var(--v-ink)]"
            >
              <Icon className="h-3.5 w-3.5" /> {tool.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setDocumentPromptOpen(true)}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[10.5px] font-medium text-[var(--v-violet)] transition-colors hover:bg-[var(--v-violet)]/10"
        >
          <FileJson className="h-3.5 w-3.5" /> Document prompt
        </button>
      </nav>

      <div className="flex min-h-0 flex-1 gap-3">
        {/* Folder */}
        <aside
          className={`flex min-h-0 shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] transition-[width] duration-200 ${
            folderOpen ? 'w-[286px]' : 'w-[58px]'
          }`}
        >
          <div className="flex h-11 shrink-0 items-center gap-1 border-b border-[var(--v-line)] px-2">
            {folderOpen ? (
              <>
                <FolderOpen className="h-4 w-4 text-[var(--v-violet)]" />
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[var(--v-ink)]">Project folder</span>
                <button type="button" onClick={() => setFolderOpen(false)} className="v-icon-btn h-6 w-6" aria-label="Collapse project folder">
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setFolderOpen(true)} className="mx-auto grid h-8 w-8 place-items-center rounded-md text-[var(--v-muted)] hover:bg-[var(--v-surface-2)]" aria-label="Expand project folder">
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
          </div>

          {folderOpen ? (
            <>
              <div className="shrink-0 p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--v-faint)]" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      autocomplete.setOpen(true);
                    }}
                    onFocus={() => autocomplete.setOpen(search.length > 0)}
                    onBlur={() => window.setTimeout(() => autocomplete.setOpen(false), 120)}
                    onKeyDown={autocomplete.onKeyDown}
                    placeholder="Search this project"
                    className="h-7 w-full rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] pl-7 pr-2 text-[10px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
                    autoComplete="off"
                  />
                  {autocomplete.open && (
                    <SearchSuggestions items={autocomplete.suggestions} active={autocomplete.active} onPick={autocomplete.pick} />
                  )}
                </div>
              </div>
              <div className="v-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                {filtered('active prompt') && (
                  <FolderGroup title="Active prompt" count={1} open={!collapsed.active} onToggle={() => toggleGroup('active')}>
                    <FolderItem
                      icon={<FileText className="h-3 w-3" />}
                      title="UI Prompt"
                      meta={activePromptLabel}
                      active
                      badge="root"
                      onClick={() => activeVersion && setPromptModal(activeVersion)}
                    />
                  </FolderGroup>
                )}

                {(!search.trim() || filteredVersions.length > 0) && (
                  <FolderGroup title="Prompt versions" count={filteredVersions.length} open={!collapsed.versions} onToggle={() => toggleGroup('versions')}>
                    {filteredVersions.map((version) => (
                      <FolderItem
                        key={version.id}
                        icon={<FileText className="h-3 w-3" />}
                        title={version.label}
                        meta={`${relativeTime(version.updatedAt)}${version.risk != null ? ` · risk ${version.risk}` : ''}`}
                        active={version.id === activeVersionId}
                        badge={version.id === activeVersionId ? 'active' : undefined}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('application/x-vector-prompt', JSON.stringify(version));
                          event.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => {
                          setActiveVersionId(version.id);
                          setBase44VersionId(version.id);
                          setPromptModal(version);
                        }}
                      />
                    ))}
                    {versions.length === 0 && <p className="px-2 py-1 text-[9px] text-[var(--v-faint)]">No prompt versions yet.</p>}
                  </FolderGroup>
                )}

                {(!search.trim() || filteredPages.length > 0) && (
                  <FolderGroup title="Canvas" count={filteredPages.length} open={!collapsed.canvas} onToggle={() => toggleGroup('canvas')}>
                    {filteredPages.map((page) => (
                      <FolderItem
                        key={page.id}
                        icon={<Layers className="h-3 w-3" />}
                        title={page.name}
                        meta={`${page.width || 1200}×${page.height || 800} · ${page.items.length} elements`}
                        onClick={onOpenCanvas}
                      />
                    ))}
                    {!doc?.pages.length && (
                      <FolderItem icon={<Plus className="h-3 w-3" />} title="Start canvas" meta="Blank page" onClick={onBlankCanvas} />
                    )}
                  </FolderGroup>
                )}

                {sourceMatches && (
                  <FolderGroup title="Sources" count={filteredFiles.length + (designSystem ? 1 : 0) + 1} open={!collapsed.sources} onToggle={() => toggleGroup('sources')}>
                    <FolderItem
                      icon={<Palette className="h-3 w-3" />}
                      title="Design system"
                      meta={designSystem?.name || 'None attached'}
                      onClick={() => setDesignSystemOpen(true)}
                    />
                    <FolderItem
                      icon={<Upload className="h-3 w-3" />}
                      title="Import a design"
                      meta="Figma JSON → editable canvas"
                      onClick={() => setImportOpen(true)}
                    />
                    {filteredFiles.map((file) => (
                      <FolderItem
                        key={file.id}
                        icon={file.type.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <Paperclip className="h-3 w-3" />}
                        title={file.name}
                        meta={`${Math.max(1, Math.round(file.size / 1024))} KB`}
                        onClick={() => window.open(file.dataUrl, '_blank', 'noopener,noreferrer')}
                        trailing={
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeFile(file.id);
                            }}
                            className="grid h-5 w-5 place-items-center rounded text-[var(--v-faint)] hover:text-[var(--v-coral)]"
                            aria-label={`Remove ${file.name}`}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        }
                      />
                    ))}
                  </FolderGroup>
                )}

                {(!search.trim() || filteredGenerated.length > 0) && (
                  <FolderGroup title="Generated" count={filteredGenerated.length} open={!collapsed.generated} onToggle={() => toggleGroup('generated')}>
                    {filteredGenerated.map((entry) => (
                      <FolderItem
                        key={entry.id}
                        icon={
                          entry.id === 'graph' ? (
                            <GitBranch className="h-3 w-3" />
                          ) : entry.id === 'review' ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <ClipboardCheck className="h-3 w-3" />
                          )
                        }
                        title={entry.label}
                        meta={entry.ready ? `${relativeTime(generatedAt)} - ${entry.summary}` : entry.summary}
                        badge={entry.ready ? 'auto' : 'locked'}
                        onClick={() => (entry.ready ? onNavigate(entry.tab) : setUploadPrompt(entry.label))}
                      />
                    ))}
                  </FolderGroup>
                )}
              </div>
              <div className="flex shrink-0 gap-1 border-t border-[var(--v-line)] p-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="v-btn v-btn-ghost h-7 flex-1 px-1.5 text-[8.5px]">
                  <Paperclip className="h-3 w-3" /> Files
                </button>
                <button type="button" onClick={() => onNavigate('requirements')} className="v-btn v-btn-ghost h-7 flex-1 px-1.5 text-[8.5px]">
                  <Upload className="h-3 w-3" /> Req. doc
                </button>
                <button type="button" onClick={onBlankCanvas} className="v-btn v-btn-ghost h-7 flex-1 px-1.5 text-[8.5px]">
                  <Plus className="h-3 w-3" /> Canvas
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center gap-1 px-1 py-2">
              <button type="button" onClick={() => setPromptModal(activeVersion || null)} className="grid h-8 w-8 place-items-center rounded-md bg-[var(--v-violet)]/10 text-[var(--v-violet)]" title="Active prompt">
                <FileText className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setFolderOpen(true)} className="grid h-8 w-8 place-items-center rounded-md text-[var(--v-muted)] hover:bg-[var(--v-surface-2)]" title={`${versions.length} prompt versions`}>
                <Layers className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setFolderOpen(true)} className="grid h-8 w-8 place-items-center rounded-md text-[var(--v-muted)] hover:bg-[var(--v-surface-2)]" title={`${doc?.pages.length || 0} canvas pages`}>
                <ImageIcon className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setFolderOpen(true)} className="grid h-8 w-8 place-items-center rounded-md text-[var(--v-muted)] hover:bg-[var(--v-surface-2)]" title="Generated analysis">
                <GitBranch className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setFolderOpen(true)} className="mt-auto grid h-8 w-8 place-items-center rounded-md text-[var(--v-muted)] hover:bg-[var(--v-surface-2)]" title="Expand folder">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </aside>

        {/* Workspace */}
        <div className="relative flex min-h-0 min-w-0 flex-1">
        <section className="v-scroll flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          <div data-guide="mode-cards" className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              data-guide="open-canvas"
              onClick={doc ? onOpenCanvas : onBlankCanvas}
              className="group rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-3 text-left transition-colors hover:border-[var(--v-violet)]"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--v-violet)]/10 text-[var(--v-violet)]">
                  <Layers className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-[var(--v-ink)]">Canvas</p>
                  <p className="text-[9px] text-[var(--v-faint)]">
                    {doc ? `${doc.pages.length} pages · ${relativeTime(doc.updatedAt)}` : 'Start from a blank page'}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--v-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--v-violet)]" />
              </div>
              <div className="mt-2.5">
                <ActualBoard page={doc?.pages[0]} empty="Open a blank canvas and place elements." />
              </div>
            </button>

            <button
              type="button"
              data-guide="open-prompt"
              onClick={onOptimizePrompt}
              className="group rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-3 text-left transition-colors hover:border-[var(--v-violet)]"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--v-teal)]/10 text-[var(--v-teal)]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-[var(--v-ink)]">Prompt mode</p>
                  <p className="text-[9px] text-[var(--v-faint)]">
                    {revised ? `risk ${revised.risk} · ${relativeTime(revised.updatedAt)}` : 'Write, analyse and clarify'}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--v-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--v-teal)]" />
              </div>
              <div className="mt-2.5 flex h-[180px] items-center justify-center overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-1">
                {analysis ? (
                  <div className="pointer-events-none w-full max-w-[270px]">
                    <WireframePreview
                      elements={analysis.first.elements}
                      dark={analysis.first.screen.meta.dark}
                      width={1200}
                      height={800}
                      maxWidth={270}
                      empty={
                        <p className="text-[9px] leading-relaxed text-[var(--v-faint)]">
                          No UI components yet — describe a wireframe.
                        </p>
                      }
                    />
                  </div>
                ) : (
                  <p className="px-4 text-center text-[9.5px] leading-relaxed text-[var(--v-faint)]">
                    Write a prompt and the to-scale Page 1 wireframe appears here.
                  </p>
                )}
              </div>
            </button>
          </div>

          {/* Base44 */}
          <div data-guide="base44" className="flex flex-col rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)]">
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--v-line)] px-3 py-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#7C5CFF]/10 text-[#7C5CFF]">
                <Rocket className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-semibold text-[var(--v-ink)]">Base44 builder</p>
                <p className="text-[9px] text-[var(--v-faint)]">
                  Sign in or sign up using email and password inside the frame. The frame and the new tab use the same exact page URL.
                </p>
              </div>
              <button type="button" onClick={reloadBase44} className="v-btn v-btn-ghost h-7 px-2 text-[9.5px]">
                <RefreshCw className="h-3 w-3" /> Reload
              </button>
              <a href={base44PageUrl} target="_blank" rel="noreferrer" className="v-btn v-btn-ghost h-7 px-2 text-[9.5px]">
                <ExternalLink className="h-3 w-3" /> Open in new tab
              </a>
            </div>

            <div className="grid gap-3 p-3 lg:grid-cols-[minmax(220px,32%)_1fr]">
              <div className="flex flex-col gap-2">
                <div className="rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
                  <label htmlFor="base44-page-url" className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--v-muted)]">
                    Exact Base44 page
                  </label>
                  <div className="mt-1 flex gap-1">
                    <input
                      id="base44-page-url"
                      value={base44PageDraft}
                      onChange={(event) => {
                        setBase44PageDraft(event.target.value);
                        setBase44PageError('');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          applyBase44Page();
                        }
                      }}
                      placeholder="https://app.base44.com/apps/..."
                      className="h-7 min-w-0 flex-1 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)] px-2 text-[9.5px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
                    />
                    <button type="button" onClick={applyBase44Page} className="v-btn v-btn-ghost h-7 px-2 text-[9px]">
                      Use
                    </button>
                  </div>
                  <p className="mt-1 text-[8.5px] leading-relaxed text-[var(--v-faint)]">
                    Copy the address from Base44. "Open in new tab" will load this exact page.
                  </p>
                  {base44PageError && <p className="mt-1 text-[8.5px] text-[#B94D42]">{base44PageError}</p>}
                </div>

                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    try {
                      const version = JSON.parse(event.dataTransfer.getData('application/x-vector-prompt')) as PromptVersion;
                      if (version?.id) setBase44VersionId(version.id);
                    } catch {
                      // ignore malformed drops
                    }
                  }}
                  className="rounded-xl border border-dashed border-[var(--v-violet)]/50 bg-[var(--v-violet)]/5 p-2.5"
                >
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--v-violet)]">Drop a prompt version</p>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-[var(--v-muted)]">
                    Drag from Prompt versions in the folder, or pick one here. Copy it, then paste it into a new Base44 app.
                  </p>
                  <select
                    value={base44Version?.id || ''}
                    onChange={(event) => setBase44VersionId(event.target.value)}
                    aria-label="Prompt source for Base44"
                    className="mt-2 h-7 w-full rounded-md border border-[var(--v-line)] bg-[var(--v-surface)] px-2 text-[10px] text-[var(--v-ink)] outline-none"
                  >
                    {versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.label}
                      </option>
                    ))}
                    {!versions.length && <option value="">No prompt yet</option>}
                  </select>
                  <p className="mt-1.5 truncate text-[9px] text-[var(--v-faint)]">
                    Using: {base44Version?.label || 'none'} · {base44Version ? relativeTime(base44Version.updatedAt) : 'create a source first'}
                  </p>
                </div>

                <details className="rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2">
                  <summary className="cursor-pointer text-[9.5px] font-semibold text-[var(--v-muted)]">View prompt</summary>
                  <pre className="v-scroll mt-1 max-h-[160px] overflow-auto whitespace-pre-wrap text-[9px] leading-relaxed text-[var(--v-ink)]">
                    {base44Version?.prompt || 'No prompt yet.'}
                  </pre>
                </details>

                <button
                  type="button"
                  onClick={() => void copyBase44Prompt()}
                  disabled={!base44Version}
                  className="v-btn v-btn-primary h-9 text-[11px] disabled:opacity-40"
                >
                  {base44Copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {base44Copied ? 'Copied — paste in Base44' : 'Copy prompt for Base44'}
                </button>
                <p className="text-[9px] leading-relaxed text-[var(--v-faint)]">
                  No API key needed. Base44 keeps its own sign-in; if the panel stays blank, the host is blocking embedding — use Open in new tab.
                </p>
              </div>

              <div className="relative flex h-[440px] flex-col overflow-hidden rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] lg:h-[560px]">
                {!base44Loaded && (
                  <div className="absolute inset-0 z-10 grid place-items-center bg-[var(--v-surface-2)]">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#7C5CFF]" />
                      <p className="mt-2 text-[10px] text-[var(--v-muted)]">Loading Base44…</p>
                    </div>
                  </div>
                )}
                <iframe
                  key={`${base44Key}:${base44PageUrl}`}
                  src={base44PageUrl}
                  title="Base44 builder"
                  className="h-full w-full flex-1 border-0 bg-white"
                  allow="clipboard-read; clipboard-write"
                  onLoad={() => setBase44Loaded(true)}
                  onError={() => setBase44Loaded(true)}
                />
              </div>
            </div>
          </div>
        </section>

        <ProjectToolsDialog
          inline
          open={toolOpen !== null}
          tool={toolOpen || 'requirements'}
          project={{ id: project.id, name: project.name }}
          sources={toolSources}
          onToolChange={(next) => setToolOpen(next)}
          onClose={() => setToolOpen(null)}
          onOpenFull={(next) => {
            setToolOpen(null);
            onNavigate(fullTabForTool[next]);
          }}
        />
        </div>
      </div>

      {/* Modals */}
      {artifact && <ArtifactModal artifact={artifact} onClose={() => setArtifact(null)} />}

      <DesignSystemPickerDialog
        open={designSystemOpen}
        projectId={project.id}
        onClose={() => setDesignSystemOpen(false)}
        onApplied={(system, pages) => {
          setDesignSystem(system);
          if (pages.length) {
            setDoc((current) =>
              current
                ? { ...current, pages, updatedAt: new Date().toISOString() }
                : current,
            );
            setGeneratedAt(new Date().toISOString());
          }
        }}
      />

      {documentPromptOpen && (
        <div className="fixed inset-0 z-[97] grid place-items-center p-3" role="dialog" aria-modal="true" aria-label="Document prompt">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setDocumentPromptOpen(false)} aria-hidden="true" />
          <div className="relative flex max-h-[92vh] w-full max-w-[920px] flex-col overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[var(--v-shadow-lg)]">
            <div className="flex shrink-0 items-start gap-3 border-b border-[var(--v-line)] px-5 py-3.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--v-violet)]/10 text-[var(--v-violet)]">
                <FileJson className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="v-eyebrow">Project tools</p>
                <h2 className="mt-0.5 text-[16px] font-semibold text-[var(--v-ink)]">Document prompt</h2>
                <p className="mt-0.5 text-[10px] text-[var(--v-faint)]">
                  {approvedRequirements.length} approved requirement{approvedRequirements.length === 1 ? '' : 's'} ·{' '}
                  {approvedCriteria.length} approved {approvedCriteria.length === 1 ? 'criterion' : 'criteria'} ·{' '}
                  {designSystem?.name || 'No design system'}
                </p>
              </div>
              <button type="button" onClick={() => setDocumentPromptOpen(false)} className="v-icon-btn" aria-label="Close document prompt">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="v-scroll min-h-0 flex-1 overflow-y-auto p-4">
              {approvedRequirements.length === 0 ? (
                <div className="grid min-h-[280px] place-items-center rounded-lg border border-dashed border-[var(--v-line)] p-6 text-center">
                  <div className="max-w-[420px]">
                    <FileText className="mx-auto h-7 w-7 text-[var(--v-faint)]" />
                    <p className="mt-2 text-[13px] font-semibold text-[var(--v-ink)]">Approve requirements first</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--v-muted)]">
                      This prompt is built from approved requirements, approved acceptance criteria, the active design
                      system and the review findings. Approve the source statements, then come back.
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDocumentPromptOpen(false);
                          onNavigate('requirements');
                        }}
                        className="v-btn v-btn-primary h-8 px-3 text-[10.5px]"
                      >
                        Open Requirements
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDocumentPromptOpen(false);
                          onNavigate('review');
                        }}
                        className="v-btn v-btn-ghost h-8 px-3 text-[10.5px]"
                      >
                        Open Review & acceptance
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {approvedCriteria.length === 0 && (
                    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-3 py-2 text-[10.5px] text-[#9C4A28]">
                      No acceptance criteria are approved yet.
                      <button
                        type="button"
                        onClick={() => {
                          setDocumentPromptOpen(false);
                          onNavigate('review');
                        }}
                        className="font-semibold underline"
                      >
                        Approve criteria
                      </button>
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-4 font-mono text-[10.5px] leading-relaxed text-[var(--v-ink)]">
                    {documentPrompt}
                  </pre>
                </>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--v-line)] px-4 py-3">
              <span className="text-[9.5px] text-[var(--v-faint)]">
                Only approved requirements and criteria are copied. Review notes are included as constraints.
              </span>
              <button
                type="button"
                disabled={approvedRequirements.length === 0}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(documentPrompt);
                    setDocumentPromptCopied(true);
                    window.setTimeout(() => setDocumentPromptCopied(false), 1600);
                  } catch {
                    setDocumentPromptCopied(false);
                  }
                }}
                className="v-btn v-btn-primary ml-auto h-8 px-3 text-[10.5px] disabled:opacity-40"
              >
                {documentPromptCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {documentPromptCopied ? 'Copied' : 'Copy prompt'}
              </button>
              <button type="button" onClick={() => setDocumentPromptOpen(false)} className="v-btn v-btn-ghost h-8 px-3 text-[10.5px]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadPrompt && (
        <div className="fixed inset-0 z-[97] grid place-items-center p-3" role="dialog" aria-modal="true" aria-label="Upload a project document">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setUploadPrompt(null)} aria-hidden="true" />
          <div className="relative w-full max-w-[440px] rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-5 shadow-[var(--v-shadow-lg)]">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--v-violet)]/10 text-[var(--v-violet)]">
              <FileText className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-[16px] font-semibold text-[var(--v-ink)]">Upload a project document</h2>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--v-muted)]">
              {hasRequirementDocument
                ? 'The uploaded document did not produce requirement statements. Upload a clearer requirement document to get '
                : 'Upload a requirement document to get '}
              <b className="text-[var(--v-ink)]">{uploadPrompt}</b>. Prompts and
              canvas pages are not used for requirement analysis.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setUploadPrompt(null)} className="v-btn v-btn-ghost h-8 px-3 text-[10.5px]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadPrompt(null);
                  onNavigate('requirements');
                }}
                className="v-btn v-btn-primary h-8 px-3 text-[10.5px]"
              >
                <Upload className="h-3.5 w-3.5" /> Upload document
              </button>
            </div>
          </div>
        </div>
      )}

      {promptModal && (
        <div className="fixed inset-0 z-[96] grid place-items-center p-3" role="dialog" aria-modal="true" aria-label={promptModal.label}>
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setPromptModal(null)} aria-hidden="true" />
          <div className="relative flex max-h-[90vh] w-full max-w-[820px] flex-col overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)]">
            <div className="flex items-center gap-2 border-b border-[var(--v-line)] px-4 py-3">
              <FileText className="h-4 w-4 text-[var(--v-violet)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[var(--v-ink)]">{promptModal.label}</p>
                <p className="text-[9px] text-[var(--v-faint)]">{relativeTime(promptModal.updatedAt)} · {promptModal.pages} pages · {promptModal.elements} elements</p>
              </div>
              <button type="button" onClick={() => setPromptModal(null)} className="v-icon-btn" aria-label="Close prompt">
                <X className="h-4 w-4" />
              </button>
            </div>
            <pre className="v-scroll min-h-0 flex-1 overflow-auto whitespace-pre-wrap p-4 text-[10.5px] leading-relaxed text-[var(--v-ink)]">
              {promptModal.prompt}
            </pre>
            <div className="flex gap-2 border-t border-[var(--v-line)] p-3">
              <button
                type="button"
                onClick={() => {
                  setBase44VersionId(promptModal.id);
                  setPromptModal(null);
                }}
                className="v-btn v-btn-primary h-8 px-3 text-[10.5px]"
              >
                <Rocket className="h-3.5 w-3.5" /> Use in Base44
              </button>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(promptModal.prompt)}
                className="v-btn v-btn-ghost h-8 px-3 text-[10.5px]"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {shareGateOpen && (
        <div className="fixed inset-0 z-[94] grid place-items-center p-3" role="dialog" aria-modal="true" aria-label="Sharing needs Pro">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShareGateOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-[440px] rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] p-5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--v-violet)]/12 text-[var(--v-violet)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="v-eyebrow mt-3">Pro feature</p>
            <h2 className="mt-0.5 text-[18px] font-semibold text-[var(--v-ink)]">Share this project live</h2>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--v-muted)]">
              Invite another Pro member to edit the same canvas at the same time. Cursors, selections and every change stay in sync.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-[var(--v-muted)]">
              {['Live cursors and selections', 'Both people edit at once', "Changes saved to the project holder's project"].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-[var(--v-violet)]" /> {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShareGateOpen(false)} className="v-btn v-btn-ghost h-8 px-3 text-[10.5px]">
                Not now
              </button>
              <button
                type="button"
                onClick={() => {
                  setShareGateOpen(false);
                  onNavigate('pricing');
                }}
                className="v-btn v-btn-primary h-8 px-3 text-[10.5px]"
              >
                Upgrade to Pro <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {shareOpen && (
        <div className="fixed inset-0 z-[94] grid place-items-center p-3" role="dialog" aria-modal="true" aria-label="Share project">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShareOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-[480px] rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="v-eyebrow">Share</p>
                <h2 className="mt-0.5 text-[17px] font-semibold text-[var(--v-ink)]">Share this project</h2>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--v-muted)]">
                  This link includes the current canvas snapshot. Recipients sign in and see the same state; Pro is not required to open it.
                </p>
              </div>
              <button type="button" onClick={() => setShareOpen(false)} className="v-icon-btn" aria-label="Close share">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-1.5">
              <input
                readOnly
                value={shareUrl}
                className="h-8 min-w-0 flex-1 rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] px-2 text-[10px] text-[var(--v-muted)]"
              />
              <button type="button" onClick={() => void copyShare()} className="v-btn v-btn-primary h-8 px-3 text-[10.5px]">
                {shareCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {shareCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[9px] text-[var(--v-faint)]">
              <Users className="h-3 w-3" /> Project access, roles and live presence
            </p>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-[93] grid place-items-center p-3" role="dialog" aria-modal="true" aria-label="Import into project">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setImportOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-[500px] rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="v-eyebrow">Import</p>
                <h2 className="mt-0.5 text-[17px] font-semibold text-[var(--v-ink)]">Bring existing work into this project</h2>
              </div>
              <button type="button" onClick={() => setImportOpen(false)} className="v-icon-btn" aria-label="Close import">
                <X className="h-4 w-4" />
              </button>
            </div>
            <button type="button" onClick={() => figmaRef.current?.click()} className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3 text-left hover:border-[var(--v-violet)]">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--v-surface)] text-[var(--v-violet)]"><Upload className="h-4 w-4" /></span>
              <span><span className="block text-[11.5px] font-semibold text-[var(--v-ink)]">Import a Figma JSON export</span><span className="block text-[9.5px] text-[var(--v-muted)]">Pages and elements become editable canvas pages. Use this for design files, not requirement documents.</span></span>
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3 text-left hover:border-[var(--v-violet)]">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--v-surface)] text-[var(--v-coral)]"><Paperclip className="h-4 w-4" /></span>
              <span><span className="block text-[11.5px] font-semibold text-[var(--v-ink)]">Attach reference files</span><span className="block text-[9.5px] text-[var(--v-muted)]">Briefs, screenshots or brand files kept in Sources, included in the ZIP and listed in the document prompt.</span></span>
            </button>
            {importError && <p className="mt-2 text-[10px] text-[#B94D42]">{importError}</p>}
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(Array.from(event.target.files || []));
          setImportOpen(false);
          event.target.value = '';
        }}
      />
      <input
        ref={figmaRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importFigmaFile(file);
          event.target.value = '';
        }}
      />
    </div>
  );
};

function openHtmlDocument(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
  body{font-family:Inter,system-ui,sans-serif;margin:0;padding:28px;background:#f7f7fb;color:#17171a}
  main{max-width:1000px;margin:0 auto;background:#fff;border:1px solid #e7e5f0;border-radius:18px;padding:24px}
  h1{font-size:22px;margin:0 0 4px} p,li{font-size:13px;line-height:1.55;color:#4b4b55} ul{padding-left:20px}
  .pill{display:inline-block;border-radius:999px;background:#f1eff8;color:#5b4bd6;padding:3px 9px;font-size:11px;font-weight:700}
  table{width:100%;border-collapse:collapse} td,th{border-bottom:1px solid #efedf6;padding:7px 6px;text-align:left;font-size:12px}
  svg{max-width:100%;height:auto}
  </style></head><body><main><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`;
}
