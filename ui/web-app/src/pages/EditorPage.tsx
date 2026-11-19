import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Crown,
  Download,
  ExternalLink,
  Frame,
  Image as ImageIcon,
  Italic,
  Layers,
  LayoutTemplate,
  Lock,
  Maximize2,
  Minus,
  Monitor,
  MousePointer2,
  PanelLeft,
  PanelLeftClose,
  Play,
  Plus,
  Redo2,
  Rocket,
  Search,
  Send,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Trash2,
  Type,
  Underline,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  buildPagesPrompt,
  emptyCanvas,
  itemsFromTemplate,
  newId,
  summarize,
  FONT_LABELS,
  FONT_STACKS,
  type CanvasItem,
  type CanvasPage,
} from '../data/canvas.ts';
import { VARIANTS, variantById, type StyleVariant } from '../data/styles.ts';
import { DEVICE_GROUPS, describeSize } from '../data/devices.ts';
import { StyledElement } from '../components/editor/StyledElement.tsx';
import { VariantPreview } from '../components/editor/VariantPreview.tsx';
import { CategoryCover } from '../components/editor/CategoryCover.tsx';
import { SpotlightHost } from '../components/onboarding/SpotlightHost.tsx';
import type { TemplateDefinition } from '../data/templates.ts';
import { pageFromVariant } from '../data/projectTypes.ts';
import { layoutForTemplate, DEVICE_FRAMES, LAYOUT_ACCENTS, stackItems } from '../data/templateLayouts.ts';
import { notificationService } from '../services/notifications.ts';
import { setAdvisorContext } from '../services/aiAdvisor.ts';
import { addAsset } from '../services/library.ts';
import { isPaid, readEntitlements } from '../services/entitlements.ts';
import { designSystemPrompt, getActiveDesignSystem } from '../services/designSystems.ts';
import {
  CollabSession,
  addInvite,
  currentRoom,
  makePeer,
  readInvites,
  shareLink,
  sharingMode,
  type Invite,
  type Peer,
} from '../services/collab.ts';
import { ShareDialog } from '../components/collab/ShareDialog.tsx';
import { PagePickerModal } from '../components/projects/PagePickerModal.tsx';
import { ConnectDialog } from '../components/generators/ConnectDialog.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  CONTENT_CATEGORIES,
  TEXT_COMBOS,
  TEXT_PRESETS,
  materialise,
  type ContentCategory,
  type TextCombo,
  type TextPreset,
} from '../data/editorPresets.ts';
import {
  buildBundleJson,
  buildBundleMarkdown,
  downloadFile,
  parseFigmaJson,
  slugify,
  type Attachment,
} from '../services/figma.ts';

interface EditorPageProps {
  template?: TemplateDefinition | null;
  /** Pre-built pages, used by private workspace templates. */
  seed?: { name: string; pages: CanvasPage[] } | null;
  onExit: () => void;
  onOpenAssistant?: () => void;
  onRequireUpgrade?: () => void;
  onNavigate?: (tab: 'design' | 'templates' | 'library' | 'settings' | 'projects') => void;
  /** Project this workspace belongs to. Everything saves under it. */
  projectId?: string;
  projectName?: string;
  /** Fixed theme chosen at project creation. */
  projectTypeId?: string;
  /** Ignore the saved project document (blank / template start). */
  fresh?: boolean;
  /** Space reserved on the right for the assistant panel. */
  rightOffset?: number;
}

type PanelTab = 'templates' | 'elements' | 'text' | 'media' | 'pages' | 'apps';

const PANEL_TABS: Array<{ id: PanelTab; label: string; icon: React.ElementType }> = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'elements', label: 'Assets', icon: Layers },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'pages', label: 'Pages', icon: Copy },
  { id: 'apps', label: 'Apps', icon: Rocket },
];

/** Representative variant used as a category thumbnail. */
const CATEGORY_COVER: Record<string, string> = {
  Buttons: 'btn-solid',
  Cards: 'card-elevated',
  Shapes: 'shape-rect',
  Text: 'text-h2',
  Inputs: 'input-labelled',
  Navigation: 'nav-light',
  Badges: 'badge-soft',
  Images: 'image-rounded',
  Data: 'chart-bars',
  Structure: 'modal-default',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isDarkColour(hex: string): boolean {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(value.slice(0, 2), 16) || 0;
  const g = parseInt(value.slice(2, 4), 16) || 0;
  const b = parseInt(value.slice(4, 6), 16) || 0;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
}

/** Render a variant scaled into a fixed white thumbnail tile. */
const Tile: React.FC<{ variant: StyleVariant; size?: number }> = ({ variant }) => (
  <div className="h-full w-full overflow-hidden rounded-md" style={{ background: '#FFFFFF' }}>
    <VariantPreview variant={variant} />
  </div>
);

const Section: React.FC<{ title: string; children?: React.ReactNode; action?: React.ReactNode; defaultOpen?: boolean }> = ({
  title,
  children,
  action,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/8">
      <div className="h-10 flex items-center gap-1 px-3">
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-1 min-w-0">
          <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="text-[11.5px] font-semibold text-white/90">{title}</span>
        </button>
        <div className="ml-auto flex items-center gap-1">{action}</div>
      </div>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
};

export const EditorPage: React.FC<EditorPageProps> = ({
  template,
  seed,
  onExit,
  onOpenAssistant,
  onRequireUpgrade,
  onNavigate,
  projectId,
  projectName,
  projectTypeId,
  fresh = false,
  rightOffset = 0,
}) => {
  const projectDocKey = projectId ? `vector_project_doc_${projectId}` : null;

  const loadProjectDoc = (): { name: string; pages: CanvasPage[] } | null => {
    if (!projectDocKey) return null;
    try {
      const raw = localStorage.getItem(projectDocKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.pages) || parsed.pages.length === 0) return null;
      return { name: String(parsed.name || projectName || 'Untitled screen'), pages: parsed.pages as CanvasPage[] };
    } catch {
      return null;
    }
  };

  const restored = fresh ? null : loadProjectDoc();

  const [name, setName] = useState(restored?.name || projectName || seed?.name || template?.name || 'Untitled screen');
  const [pages, setPages] = useState<CanvasPage[]>(() => {
    if (restored?.pages?.length) return restored.pages;
    if (seed?.pages?.length) return seed.pages;
    if (!template) return [{ id: newId(), name: 'Page 1', items: emptyCanvas() }];
    const device = template.device || 'desktop';
    if (device !== 'desktop') {
      const frame = DEVICE_FRAMES[device];
      return [
        {
          id: newId(),
          name: 'Page 1',
          items: stackItems(template.blocks, frame.width, frame.height, LAYOUT_ACCENTS[template.id]),
          width: frame.width,
          height: frame.height,
        },
      ];
    }
    const first: CanvasPage = {
      id: newId(),
      name: 'Page 1',
      items: layoutForTemplate(template.id) ?? itemsFromTemplate(template),
    };
    const extras: CanvasPage[] = (template.pages || []).map((page) => ({
      id: newId(),
      name: page.name,
      items: itemsFromTemplate({ ...template, blocks: page.blocks, pages: undefined }),
    }));
    return [first, ...extras];
  });
  const [activePageId, setActivePageId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelTab>('elements');
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(0.72);
  const [preview, setPreview] = useState(false);
  const [base44, setBase44] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openFrameGroup, setOpenFrameGroup] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(() => {
    try {
      return localStorage.getItem('vector_panel_open_v1') !== '0';
    } catch {
      return true;
    }
  });
  const artboardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const figmaRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLTextAreaElement | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  // Collaboration
  const { user } = useAuth();
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'You';
  const [room] = useState(() => currentRoom());
  const [peers, setPeers] = useState<Peer[]>([]);
  const [me, setMe] = useState<Peer | null>(null);
  const [invites, setInvites] = useState<Invite[]>(() => readInvites());
  const [shareOpen, setShareOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [workspaceMenu, setWorkspaceMenu] = useState(false);
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'design' | 'prototype'>('design');
  const sessionRef = useRef<CollabSession | null>(null);
  const applyingRemote = useRef(false);
  const publishTimer = useRef<number | undefined>(undefined);
  const lastCursor = useRef(0);
  const dragRef = useRef<{ id: string; mode: 'move' | 'resize'; startX: number; startY: number; origin: CanvasItem } | null>(null);
  const history = useRef<CanvasPage[][]>([]);
  const future = useRef<CanvasPage[][]>([]);

  const activePage = pages.find((page) => page.id === activePageId) || pages[0];
  const items = activePage?.items || [];
  const pageBg = activePage?.background || '#FFFFFF';
  const pageWidth = activePage?.width || CANVAS_WIDTH;
  const pageHeight = activePage?.height || CANVAS_HEIGHT;
  const pageIsDark = isDarkColour(pageBg);

  useEffect(() => {
    if (!activePageId && pages[0]) setActivePageId(pages[0].id);
  }, [activePageId, pages]);

  useEffect(() => {
    try {
      localStorage.setItem('vector_panel_open_v1', panelOpen ? '1' : '0');
    } catch {
      // ignore
    }
  }, [panelOpen]);

  const selected = items.find((item) => item.id === selectedId) || null;
  const activeSystem = getActiveDesignSystem();
  // Autosave into the project document so leaving and returning keeps everything.
  useEffect(() => {
    if (!projectDocKey) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(projectDocKey, JSON.stringify({ name, pages, updatedAt: new Date().toISOString() }));
      } catch {
        // ignore quota errors
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [name, pages, projectDocKey]);

  const prompt = useMemo(() => {
    const base = buildPagesPrompt(name, pages);
    const system = getActiveDesignSystem();
    return system ? `${base}\n\n${designSystemPrompt(system)}` : base;
  }, [name, pages]);
  const stats = useMemo(() => summarize(items), [items]);

  const docRef = useRef({ name, pages });
  useEffect(() => {
    docRef.current = { name, pages };
  }, [name, pages]);

  useEffect(() => {
    const session = new CollabSession(room, makePeer(displayName), {
      onPeers: setPeers,
      onDoc: (doc) => {
        applyingRemote.current = true;
        setName(doc.name);
        setPages(doc.pages);
        setActivePageId(doc.pages[0]?.id || '');
        setSelectedId(null);
        window.setTimeout(() => {
          applyingRemote.current = false;
        }, 60);
      },
    });
    session.setDocProvider(() => docRef.current);
    sessionRef.current = session;
    setMe(session.self);
    return () => {
      session.close();
      sessionRef.current = null;
    };
  }, [room, displayName]);

  // Broadcast local edits, but never echo a document that came from a peer.
  useEffect(() => {
    if (applyingRemote.current) return;
    window.clearTimeout(publishTimer.current);
    publishTimer.current = window.setTimeout(() => sessionRef.current?.publish({ name, pages }), 160);
    return () => window.clearTimeout(publishTimer.current);
  }, [name, pages]);

  // Presence: which page, which element, whether typing.
  useEffect(() => {
    sessionRef.current?.presence({ selectedId, pageId: activePageId, editing: !!editingId });
  }, [selectedId, activePageId, editingId]);

  // Focus and select the inline editor as soon as a text element enters edit mode,
  // so the caret is on the canvas and typing replaces the old copy immediately.
  useEffect(() => {
    if (!editingId) return;
    const node = editRef.current;
    if (!node) return;
    node.focus();
    node.select();
  }, [editingId]);

  useEffect(() => {
    setAdvisorContext({
      title: name,
      prompt,
      kind: 'canvas',
      pageName: activePage?.name || 'Page 1',
      pageCount: pages.length,
      frame: { width: pageWidth, height: pageHeight },
      background: pageBg,
      selected: selected ? { name: (variantById(selected.variant || '') || VARIANTS[0]).name, label: selected.label, w: selected.w, h: selected.h } : undefined,
      elements: items.map((item) => ({
        name: (variantById(item.variant || '') || VARIANTS[0]).name,
        label: item.label,
      })),
      colors: Array.from(new Set(items.map((item) => item.color).filter(Boolean))) as string[],
    });
  }, [name, prompt, items, activePage?.name, pages.length, pageWidth, pageHeight, pageBg, selected]);

  const setPageItems = useCallback(
    (pageId: string, next: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[]), record = true) => {
      setPages((prev) => {
        if (record) {
          history.current = [...history.current.slice(-19), prev];
          future.current = [];
        }
        return prev.map((page) =>
          page.id === pageId ? { ...page, items: typeof next === 'function' ? next(page.items) : next } : page
        );
      });
      setSaved(false);
    },
    []
  );

  const commit = (next: CanvasItem[]) => setPageItems(activePage.id, next);
  const update = (id: string, patch: Partial<CanvasItem>) =>
    setPageItems(activePage.id, (prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)), false);

  const undo = () => {
    const previous = history.current.pop();
    if (!previous) return;
    future.current.push(pages);
    setPages(previous);
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(pages);
    setPages(next);
  };

  const addVariant = (variant: StyleVariant) => {
    const offset = items.length * 14;
    const item: CanvasItem = {
      id: newId(),
      type: variant.type,
      variant: variant.id,
      x: clamp(60 + (offset % 220), 0, Math.max(0, pageWidth - variant.w)),
      y: clamp(120 + (offset % 300), 0, Math.max(0, pageHeight - variant.h)),
      w: variant.w,
      h: variant.h,
      label: variant.label,
      color: variant.color ?? (variant.group === 'Text' && pageIsDark ? '#FFFFFF' : undefined),
    };
    commit([...items, item]);
    setSelectedId(item.id);
    if (variant.group === 'Text') setEditingId(item.id);
  };

  const paid = isPaid(readEntitlements());

  const blockedByPlan = (premium?: boolean): boolean => {
    if (!premium || paid) return false;
    onRequireUpgrade?.();
    return true;
  };

  const addTextPreset = (preset: TextPreset) => {
    if (blockedByPlan(preset.premium)) return;
    const item: CanvasItem = {
      id: newId(),
      type: 'text',
      variant: preset.variant,
      x: 64,
      y: 120,
      w: Math.min(preset.w, Math.max(160, pageWidth - 128)),
      h: preset.h,
      label: preset.sample,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      fontFamily: preset.id === 'editorial' ? 'georgia' : undefined,
    };
    commit([...items, item]);
    setSelectedId(item.id);
    setEditingId(item.id);
  };

  const addTextCombo = (combo: TextCombo) => {
    if (blockedByPlan(combo.premium)) return;
    const built = materialise(combo.build(pageWidth));
    commit([...items, ...built]);
    setSelectedId(built[0]?.id || null);
  };

  const addContentCategory = (category: ContentCategory) => {
    if (blockedByPlan(category.premium)) return;
    const page: CanvasPage = {
      id: newId(),
      name: category.name,
      items: materialise(category.build(category.width, category.height)),
      width: category.width,
      height: category.height,
    };
    setPages((prev) => [...prev, page]);
    setActivePageId(page.id);
    setSelectedId(null);
    notificationService.push({
      kind: 'system',
      title: `${category.name} page added`,
      body: `${category.width}×${category.height} frame with a starter layout.`,
      action: { label: 'Open pages', tab: 'projects' },
    });
  };

  const setPageBackground = (background: string) => {    setPages((prev) => prev.map((page) => (page.id === activePage.id ? { ...page, background } : page)));
    setSaved(false);
  };

  const setPageSize = (width: number, height: number, label?: string) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id
          ? { ...page, width: Math.max(120, Math.round(width)), height: Math.max(120, Math.round(height)), ...(label ? { name: label } : {}) }
          : page
      )
    );
    setSaved(false);
  };

  const fixTextContrast = () => {
    const colour = pageIsDark ? '#FFFFFF' : '#0B0E14';
    commit(items.map((item) => (item.type === 'text' ? { ...item, color: colour } : item)));
  };

  const removeSelected = () => {
    if (!selectedId) return;
    commit(items.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy: CanvasItem = { ...selected, id: newId(), x: selected.x + 24, y: selected.y + 24 };
    commit([...items, copy]);
    setSelectedId(copy.id);
  };

  const addImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      if (!src) return;
      // Keep every upload so it can be reused from the Library later.
      void addAsset({
        name: file.name || 'Image',
        kind: 'image',
        mime: file.type || 'image/png',
        size: file.size,
        dataUrl: src,
        source: 'canvas',
      });
      const image = new Image();
      image.onload = () => {
        const ratio = image.width / image.height || 1.4;
        const w = Math.min(360, pageWidth - 80);
        const h = Math.round(w / ratio);
        const item: CanvasItem = {
          id: newId(),
          type: 'image',
          variant: 'image-rounded',
          x: 60,
          y: 120,
          w,
          h,
          label: file.name.replace(/\.[^.]+$/, '') || 'Image',
          src,
        };
        setPageItems(activePage.id, (prev) => [...prev, item]);
        setSelectedId(item.id);
      };
      image.onerror = () => {
        const item: CanvasItem = {
          id: newId(),
          type: 'image',
          variant: 'image-rounded',
          x: 60,
          y: 120,
          w: 360,
          h: 240,
          label: 'Image',
          src,
        };
        setPageItems(activePage.id, (prev) => [...prev, item]);
        setSelectedId(item.id);
      };
      image.src = src;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      const files = Array.from(event.clipboardData?.files || []).filter((file) => file.type.startsWith('image/'));
      if (files.length) {
        event.preventDefault();
        files.forEach(addImageFromFile);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      if (event.key === 'Escape') {
        setEditingId(null);
        setSelectedId(null);
      }
      if (event.key === 'Enter' && selectedId) {
        const target = items.find((item) => item.id === selectedId);
        if (target?.type === 'text') {
          event.preventDefault();
          setEditingId(selectedId);
        }
      }
      if (event.key === '[') setPanelOpen((value) => !value);
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        removeSelected();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelected();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, items, pages]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (event.clientX - drag.startX) / zoom;
      const dy = (event.clientY - drag.startY) / zoom;
      const origin = drag.origin;
      if (drag.mode === 'move') {
        update(drag.id, {
          x: clamp(Math.round(origin.x + dx), 0, Math.max(0, pageWidth - origin.w)),
          y: clamp(Math.round(origin.y + dy), 0, Math.max(0, pageHeight - origin.h)),
        });
      } else {
        update(drag.id, {
          w: clamp(Math.round(origin.w + dx), 40, pageWidth - origin.x),
          h: clamp(Math.round(origin.h + dy), 20, pageHeight - origin.y),
        });
      }
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [zoom, pageWidth, pageHeight]);

  const startDrag = (event: React.MouseEvent, item: CanvasItem, mode: 'move' | 'resize') => {
    event.stopPropagation();
    if (preview || editingId === item.id) return;
    setSelectedId(item.id);
    dragRef.current = { id: item.id, mode, startX: event.clientX, startY: event.clientY, origin: { ...item } };
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith('image/'));
    if (files.length) {
      files.forEach(addImageFromFile);
      return;
    }
    const raw = event.dataTransfer.getData('application/x-vector-variant');
    if (!raw || !artboardRef.current) return;
    const variant = variantById(raw);
    if (!variant) return;
    const rect = artboardRef.current.getBoundingClientRect();
    const x = clamp(Math.round((event.clientX - rect.left) / zoom - variant.w / 2), 0, Math.max(0, pageWidth - variant.w));
    const y = clamp(Math.round((event.clientY - rect.top) / zoom - variant.h / 2), 0, Math.max(0, pageHeight - variant.h));
    const item: CanvasItem = {
      id: newId(),
      type: variant.type,
      variant: variant.id,
      x,
      y,
      w: variant.w,
      h: variant.h,
      label: variant.label,
      color: variant.color ?? (variant.group === 'Text' && pageIsDark ? '#FFFFFF' : undefined),
    };
    commit([...items, item]);
    setSelectedId(item.id);
    if (variant.group === 'Text') setEditingId(item.id);
  };

  const addPage = () => {
    const page: CanvasPage = { id: newId(), name: `Page ${pages.length + 1}`, items: [], width: pageWidth, height: pageHeight };
    setPages((prev) => [...prev, page]);
    setActivePageId(page.id);
    setSelectedId(null);
  };

  const duplicatePage = () => {
    const page: CanvasPage = {
      id: newId(),
      name: `${activePage.name} copy`,
      items: items.map((item) => ({ ...item, id: newId() })),
      background: activePage.background,
      width: pageWidth,
      height: pageHeight,
    };
    setPages((prev) => [...prev, page]);
    setActivePageId(page.id);
  };

  const deletePage = () => {
    if (pages.length === 1) return;
    const next = pages.filter((page) => page.id !== activePage.id);
    setPages(next);
    setActivePageId(next[0].id);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      notificationService.push({ kind: 'system', title: 'Copy failed', body: 'Select the prompt and copy manually.' });
    }
  };

  const sendToBase44 = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      // ignore
    }
    setBase44(true);
    window.open('https://app.base44.com', '_blank', 'noopener,noreferrer');
    notificationService.push({
      kind: 'deploy',
      title: 'Prompt sent to Base44',
      body: 'Paste it into a new Base44 app to generate the live UI.',
      action: { label: 'Open projects', tab: 'projects' },
    });
  };

  const importFigmaFile = async (file: File) => {
    try {
      const text = await file.text();
      const result = parseFigmaJson(text);
      setPages(result.pages);
      setActivePageId(result.pages[0].id);
      setSelectedId(null);
      setImportWarnings(result.warnings);
      notificationService.push({
        kind: 'system',
        title: 'Figma import complete',
        body: `${result.nodeCount} elements across ${result.pages.length} page${result.pages.length === 1 ? '' : 's'}.`,
        action: { label: 'Open analyser', tab: 'new-analysis' },
      });
    } catch (error) {
      notificationService.push({
        kind: 'system',
        title: 'Import failed',
        body: error instanceof Error ? error.message : 'Unknown error.',
      });
    }
  };

  const attachFiles = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          { id: newId(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: String(reader.result || '') },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const downloadBundle = () => {
    const markdown = buildBundleMarkdown({ name, prompt, pages, attachments });
    downloadFile(`${slugify(name)}-bundle.md`, markdown, 'text/markdown');
  };

  const downloadManifest = () => {
    const json = buildBundleJson({ name, prompt, pages, attachments });
    downloadFile(`${slugify(name)}-manifest.json`, json, 'application/json');
  };

  const save = () => {
    try {
      if (projectDocKey) {
        localStorage.setItem(projectDocKey, JSON.stringify({ name, pages, updatedAt: new Date().toISOString() }));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
        return;
      }
      const key = 'vector_canvas_v1';
      const records = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [
        { id: newId(), name, templateId: template?.id || null, pages, prompt, updatedAt: new Date().toISOString() },
        ...(Array.isArray(records) ? records : []),
      ].slice(0, 20);
      localStorage.setItem(key, JSON.stringify(next));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      // ignore
    }
  };

  const fitToScreen = () => {
    const availableWidth = window.innerWidth - 700;
    const availableHeight = window.innerHeight - 180;
    setZoom(clamp(Math.min(availableWidth / pageWidth, availableHeight / pageHeight), 0.15, 1.2));
  };

  const allVariants = VARIANTS.filter((variant) => {
    if (panel === 'text') return variant.group === 'Text';
    if (panel === 'media') return variant.group === 'Images' || variant.group === 'Data';
    return true;
  });

  const searchResults = allVariants.filter(
    (variant) =>
      !query.trim() ||
      variant.name.toLowerCase().includes(query.toLowerCase()) ||
      variant.group.toLowerCase().includes(query.toLowerCase())
  );

  const groups = Array.from(new Set(allVariants.map((variant) => variant.group)));
  const showingSearch = query.trim().length > 0;

  const SWATCHES = ['#FFFFFF', '#0B0E14', '#7C5CFF', '#4D7CFE', '#22D3EE', '#FF7A59', '#FFC53D'];

  const colorRow = (label: string, value: string | undefined, onChange: (next: string) => void, allowNone = false) => (
    <div className="flex items-center gap-1.5">
      <span className="text-[10.5px] text-white/45 w-14 shrink-0">{label}</span>
      <div className="flex flex-wrap items-center gap-1">
        {allowNone && (
          <button
            type="button"
            onClick={() => onChange('')}
            className={`h-5 px-1.5 rounded border text-[9px] font-semibold ${!value ? 'border-[#0D99FF] text-white' : 'border-white/15 text-white/50'}`}
          >
            None
          </button>
        )}
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onChange(swatch)}
            className={`w-5 h-5 rounded border ${value?.toLowerCase() === swatch.toLowerCase() ? 'border-[#0D99FF]' : 'border-white/15'}`}
            style={{ background: swatch }}
            aria-label={`${label} ${swatch}`}
          />
        ))}
        <label className="relative w-5 h-5 rounded border border-white/25 cursor-pointer overflow-hidden grid place-items-center" title="Custom colour">
          <span className="text-[9px] text-white/60">+</span>
          <input
            type="color"
            value={value && value.startsWith('#') ? value : '#7C5CFF'}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label={`${label} custom colour`}
          />
        </label>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-[#1E1E1E] text-white"
      style={{ right: rightOffset, transition: 'right 200ms ease' }}
    >
      {/* Top bar */}
      <header className="h-12 shrink-0 flex items-center gap-2 px-2 border-b border-white/10 bg-[#2C2C2C]">
        <button type="button" onClick={onExit} className="w-8 h-8 rounded-md grid place-items-center text-white/60 hover:text-white hover:bg-white/10" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-6 h-6 rounded-md shrink-0" style={{ backgroundImage: 'linear-gradient(135deg,#7C5CFF,#22D3EE)' }} />
        <button
          type="button"
          onClick={() => setPanelOpen((value) => !value)}
          className={`w-8 h-8 rounded-md grid place-items-center ${panelOpen ? 'text-white/70' : 'text-white/40'} hover:bg-white/10`}
          title="Toggle assets panel  ["
          aria-label="Toggle assets panel"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="bg-transparent text-[12.5px] font-semibold outline-none border-b border-transparent focus:border-white/25 min-w-[120px] max-w-[240px]"
          />
          <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-white/10 text-white/50">
            {describeSize(pageWidth, pageHeight)}
          </span>
          <ChevronDown className="w-3 h-3 text-white/40" />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden md:flex items-center -space-x-1.5 mr-1">
            {[me, ...peers]
              .filter(Boolean)
              .slice(0, 4)
              .map((peer) => (
                <span
                  key={peer!.id}
                  className="w-6 h-6 rounded-full border-2 border-[#2C2C2C] grid place-items-center text-[9px] font-bold text-white"
                  style={{ background: peer!.colour }}
                  title={`${peer!.name}${peer!.id === me?.id ? ' (you)' : ''}`}
                >
                  {peer!.name.slice(0, 2).toUpperCase()}
                </span>
              ))}
            {peers.length > 3 && (
              <span className="w-6 h-6 rounded-full border-2 border-[#2C2C2C] bg-[#383838] grid place-items-center text-[8.5px] font-bold text-white/70">
                +{peers.length - 3}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setPreview((value) => !value)}
            className={`w-8 h-8 rounded-md grid place-items-center ${preview ? 'bg-[#0D99FF] text-white' : 'text-white/60 hover:bg-white/10'}`}
            title={preview ? 'Back to edit' : 'Preview'}
          >
            {preview ? <MousePointer2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={fitToScreen}
            className="hidden sm:flex items-center gap-1 px-1.5 h-7 rounded-md hover:bg-white/10"
            title="Fit to screen"
          >
            <Minus className="w-3 h-3 text-white/40" />
            <span className="text-[11px] font-medium w-10 text-center text-white/80">{Math.round(zoom * 100)}%</span>
            <Plus className="w-3 h-3 text-white/40" />
          </button>

          <button
            type="button"
            onClick={() => figmaRef.current?.click()}
            className="h-8 px-2.5 rounded-md text-[11.5px] font-semibold text-white/75 hover:bg-white/10 inline-flex items-center gap-1.5"
            title="Import a Figma JSON export"
          >
            <Frame className="w-3.5 h-3.5" /> Import Figma
          </button>
          <button
            type="button"
            onClick={onOpenAssistant}
            className="h-8 px-2.5 rounded-md text-[11.5px] font-semibold text-white/75 hover:bg-white/10 inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B9A8FF]" /> Ask AI
          </button>
          <button type="button" onClick={save} className="h-8 px-3 rounded-md text-[11.5px] font-semibold text-white/80 hover:bg-white/10 hidden sm:inline-flex items-center">
            {saved ? 'Saved' : 'Save'}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setWorkspaceMenu((open) => !open)}
              className="h-8 rounded-md border border-white/15 px-2.5 text-[11.5px] font-semibold text-white/80 hover:bg-white/10 inline-flex items-center gap-1"
              aria-expanded={workspaceMenu}
            >
              Workspace <ChevronDown className="w-3 h-3" />
            </button>

            {workspaceMenu && (
              <>
                <div className="fixed inset-0 z-[38]" onClick={() => setWorkspaceMenu(false)} aria-hidden="true" />
                <div className="absolute right-0 top-9 z-[39] w-[220px] rounded-lg border border-white/10 bg-[#333] p-1.5 shadow-[0_24px_50px_-20px_rgba(0,0,0,.9)]">
                  {[
                    { label: 'Share and invite', action: () => setShareOpen(true) },
                    { label: 'Generate with an app', action: () => setConnectOpen(true) },
                    { label: 'Design system', action: () => onNavigate?.('design') },
                    { label: 'Templates', action: () => onNavigate?.('templates') },
                    { label: 'Library', action: () => onNavigate?.('library') },
                    { label: 'Import from Figma', action: () => figmaRef.current?.click() },
                    { label: 'Export prompt bundle', action: downloadBundle },
                    { label: 'Ask Vector AI', action: () => onOpenAssistant?.() },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setWorkspaceMenu(false);
                        item.action();
                      }}
                      className="w-full rounded-md px-2.5 py-2 text-left text-[11.5px] font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            className="h-8 rounded-md px-3.5 text-[11.5px] font-semibold text-white"
            style={{ backgroundImage: 'linear-gradient(118deg,#7C5CFF,#4D7CFE 55%,#22D3EE)' }}
          >
            Generate
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="h-8 rounded-md border border-white/20 px-3 text-[11.5px] font-semibold text-white/85 hover:bg-white/5"
          >
            Share
          </button>
        </div>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          Array.from(event.target.files || []).forEach(addImageFromFile);
          event.target.value = '';
        }}
      />

      <input
        ref={figmaRef}
        type="file"
        accept="application/json,.json,.fig"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importFigmaFile(file);
          event.target.value = '';
        }}
      />

      <input
        ref={attachRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          attachFiles(Array.from(event.target.files || []));
          event.target.value = '';
        }}
      />

      <div className="flex-1 flex min-h-0">
        {/* Rail */}
        <nav className="w-[64px] shrink-0 border-r border-white/10 bg-[#2C2C2C] flex flex-col items-center pt-2 gap-0.5">
          {PANEL_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = panel === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-spot={tab.id === 'elements' ? 'editor-assets' : undefined}
                onClick={() => {
                  setPanel(tab.id);
                  setPanelOpen(true);
                  setCategory(null);
                }}
                className={`w-[56px] py-1.5 rounded-md flex flex-col items-center gap-1 transition-colors ${
                  active ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-[9px] font-medium">{tab.label}</span>
              </button>
            );
          })}
          <div className="mt-auto mb-2">
            <button type="button" onClick={onOpenAssistant} className="w-[56px] py-1.5 rounded-md flex flex-col items-center gap-1 text-white/45 hover:text-white/80">
              <CircleHelp className="w-[18px] h-[18px]" />
              <span className="text-[9px]">Help</span>
            </button>
          </div>
        </nav>

        {/* Assets panel */}
        <aside
          className={`shrink-0 border-r border-white/10 bg-[#2C2C2C] flex flex-col min-h-0 overflow-hidden transition-[width] duration-200 ${
            panelOpen ? 'w-[300px]' : 'w-0 border-r-0'
          }`}
          aria-hidden={!panelOpen}
        >
          <div className="h-12 shrink-0 flex items-center justify-between px-3 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              {category && !showingSearch && (
                <button type="button" onClick={() => setCategory(null)} className="w-5 h-5 rounded grid place-items-center text-white/50 hover:bg-white/10" aria-label="Back">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                </button>
              )}
              <span className="text-[12.5px] font-semibold truncate">
                {category && !showingSearch ? category : panel === 'pages' ? 'Pages' : 'Assets'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="w-6 h-6 rounded grid place-items-center text-white/45 hover:bg-white/10" title="Library">
                <BookOpen className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="w-6 h-6 rounded grid place-items-center text-white/45 hover:bg-white/10"
                aria-label="Hide panel"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search in this library"
                className="w-full h-8 pl-8 pr-8 rounded-md bg-[#383838] border border-transparent focus:border-[#0D99FF] text-[11.5px] outline-none placeholder:text-white/30"
              />
              <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto v-scroll px-3 pb-4">
            {/* Text tab: Canva-style presets and combos */}
            {!showingSearch && !category && panel === 'text' && (
              <div className="pt-1">
                <p className="mb-2 text-[10.5px] font-medium text-white/45">Add text</p>
                <div className="space-y-2">
                  {TEXT_PRESETS.map((preset) => (
                    <button key={preset.id} type="button" onClick={() => addTextPreset(preset)} className="group w-full text-left">
                      <div className="flex h-[58px] items-center justify-between rounded-lg bg-white px-3 ring-1 ring-white/10 transition-colors group-hover:ring-[#0D99FF]">
                        <span
                          className="truncate text-[#0B0E14]"
                          style={{
                            fontSize: Math.min(preset.fontSize, 22),
                            fontWeight: preset.fontWeight,
                            fontFamily: preset.id === 'editorial' ? FONT_STACKS.georgia : undefined,
                          }}
                        >
                          {preset.sample}
                        </span>
                        {preset.premium && <Crown className="h-3.5 w-3.5 shrink-0 text-[#B8860B]" />}
                      </div>
                      <span className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10.5px] text-white/70">{preset.name}</span>
                        {preset.premium && (
                          <span className="rounded bg-[#FFC53D]/20 px-1 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[#FFC53D]">
                            Pro
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>

                <p className="mb-2 mt-4 text-[10.5px] font-medium text-white/45">Text combos</p>
                <div className="space-y-1.5">
                  {TEXT_COMBOS.map((combo) => (
                    <button
                      key={combo.id}
                      type="button"
                      onClick={() => addTextCombo(combo)}
                      className="flex w-full items-center gap-2 rounded-lg bg-[#383838] p-2 text-left transition-colors hover:bg-white/15"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-white/85">{combo.name}</span>
                        <span className="block truncate text-[9.5px] text-white/40">{combo.description}</span>
                      </span>
                      {combo.premium ? <Crown className="h-3.5 w-3.5 text-[#FFC53D]" /> : <ChevronRight className="h-3.5 w-3.5 text-white/30" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Templates tab: content categories */}
            {!showingSearch && !category && panel === 'templates' && (
              <div className="pt-1">
                <p className="mb-1 text-[10.5px] font-medium text-white/45">Categories</p>
                {CONTENT_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addContentCategory(item)}
                    className="flex w-full items-center gap-3 rounded-lg py-2.5 text-left transition-colors hover:bg-white/5"
                  >
                    <span
                      className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-lg text-[18px] font-bold text-white ring-1 ring-white/10"
                      style={{ backgroundImage: 'linear-gradient(140deg,#7C5CFF,#22D3EE)' }}
                    >
                      {item.name[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium text-white/90">{item.name}</span>
                      <span className="block text-[10px] text-white/40">
                        {item.width}×{item.height}
                      </span>
                    </span>
                    {item.premium ? <Crown className="h-3.5 w-3.5 text-[#FFC53D]" /> : <ChevronRight className="h-4 w-4 text-white/30" />}
                  </button>
                ))}
                <p className="mt-3 text-[9.5px] leading-relaxed text-white/30">
                  Each category adds a new page at the right frame size. Locked items are part of Pro.
                </p>
              </div>
            )}

            {/* Category list (Figma-style) */}
            {!showingSearch && !category && panel !== 'text' && panel !== 'templates' &&
              groups.map((group) => {
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setCategory(group)}
                    className="w-full flex items-center gap-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-[72px] h-[72px] rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
                      <CategoryCover group={group} />
                    </div>
                    <span className="flex-1 text-[12.5px] font-medium text-white/90">{group}</span>
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </button>
                );
              })}

            {/* Drill-in or search results */}
            {(showingSearch || category) && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {(showingSearch ? searchResults : allVariants.filter((variant) => variant.group === category)).map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('application/x-vector-variant', variant.id);
                      event.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => addVariant(variant)}
                    className="group text-left cursor-grab active:cursor-grabbing"
                    title={`${variant.name} — drag onto the canvas`}
                  >
                    <div className="rounded-lg overflow-hidden ring-1 ring-white/10 group-hover:ring-[#0D99FF] p-1.5" style={{ background: '#383838' }}>
                      <div className="h-[72px]">
                        <Tile variant={variant} size={62} />
                      </div>
                    </div>
                    <span className="mt-1 block text-[10.5px] text-white/80 truncate">{variant.name}</span>
                  </button>
                ))}
              </div>
            )}

            {showingSearch && searchResults.length === 0 && (
              <p className="py-6 text-center text-[11px] text-white/35">Nothing matches “{query}”.</p>
            )}
          </div>

          <div className="p-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-8 rounded-md border border-white/15 text-[11px] font-medium text-white/75 inline-flex items-center justify-center gap-1.5 hover:bg-white/5"
            >
              <Upload className="w-3.5 h-3.5" /> Upload image
            </button>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 min-w-0 relative overflow-auto v-scroll bg-[#1E1E1E] flex justify-center pt-10 pb-24" onClick={() => setSelectedId(null)}>
          <div style={{ width: pageWidth * zoom, height: pageHeight * zoom }}>
            <div
              ref={artboardRef}
              key={`${activePage.id}-${preview ? 'preview' : 'edit'}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
              style={{
                width: pageWidth,
                height: pageHeight,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                backgroundColor: pageBg,
              }}
              className={`relative shadow-[0_0_0_1px_rgba(255,255,255,.08),0_24px_60px_-20px_rgba(0,0,0,.8)] ${
                preview ? `v-page-${activePage.transition || 'none'}` : ''
              }`}
            >
              <span className="absolute -top-6 left-0 text-[11px] text-white/40 select-none">{activePage?.name}</span>
              <span className="absolute -bottom-6 right-0 px-1.5 py-0.5 rounded bg-[#0D99FF] text-white text-[9.5px] font-medium">
                {pageWidth} × {pageHeight}
              </span>

              {items.length === 0 && !preview && (
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center max-w-[420px]">
                    <span className="w-11 h-11 rounded-lg bg-black/5 grid place-items-center mx-auto">
                      <Plus className="w-5 h-5 text-black/25" />
                    </span>
                    <p className="mt-3 text-[14px] font-semibold text-black/60">Blank canvas</p>
                    <p className="mt-1 text-[12px] text-black/35">Drag an element from the left, or paste an image with ⌘V.</p>
                  </div>
                </div>
              )}

              {items.map((item) => {
                const variant = variantById(item.variant || '') || VARIANTS[0];
                const editing = editingId === item.id;
                const isSelected = selectedId === item.id && !preview;
                return (
                  <div
                    key={item.id}
                    onMouseDown={(event) => startDrag(event, item, 'move')}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (preview && item.linkToPageId) {
                        setActivePageId(item.linkToPageId);
                        return;
                      }
                      setSelectedId(item.id);
                    }}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      if (item.type === 'text') setEditingId(item.id);
                    }}
                    style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
                    className={`absolute select-none ${preview ? '' : editing ? 'cursor-text' : 'cursor-move'}`}
                  >
                    {editing ? (
                      <textarea
                        ref={editRef}
                        value={item.label}
                        spellCheck={false}
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => update(item.id, { label: event.target.value })}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape' || (event.key === 'Enter' && !event.shiftKey)) {
                            event.preventDefault();
                            setEditingId(null);
                          }
                        }}
                        style={{
                          fontSize: item.fontSize ?? 28,
                          color: item.color || '#0B0E14',
                          fontWeight: item.fontWeight ?? 700,
                          textAlign: item.align || 'left',
                          fontFamily: item.fontFamily ? FONT_STACKS[item.fontFamily] : undefined,
                          fontStyle: item.italic ? 'italic' : undefined,
                          textDecoration: item.underline ? 'underline' : undefined,
                          letterSpacing: item.tracking != null ? `${item.tracking}px` : undefined,
                          lineHeight: 1.15,
                          padding: 0,
                          margin: 0,
                          border: 'none',
                          outline: 'none',
                          resize: 'none',
                          overflow: 'hidden',
                          background: 'transparent',
                          caretColor: item.color || '#0B0E14',
                          boxShadow: '0 0 0 1.5px #0D99FF',
                          borderRadius: 4,
                        }}
                        className="w-full h-full block"
                      />
                    ) : (
                      <StyledElement
                        style={variant.style}
                        label={item.label}
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
                    )}

                    {isSelected && !editing && (
                      <>
                        <span className="absolute inset-0 ring-[1.5px] ring-[#0D99FF] pointer-events-none" />
                        <span className="absolute -top-5 left-0 px-1 py-0.5 rounded-sm bg-[#0D99FF] text-white text-[9px] font-medium whitespace-nowrap">
                          {item.w} × {item.h}
                        </span>
                        {[
                          'left-0 top-0 -translate-x-1/2 -translate-y-1/2',
                          'right-0 top-0 translate-x-1/2 -translate-y-1/2',
                          'left-0 bottom-0 -translate-x-1/2 translate-y-1/2',
                          'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
                        ].map((position, index) => (
                          <span
                            key={position}
                            onMouseDown={(event) => {
                              if (index !== 3) return;
                              event.stopPropagation();
                              startDrag(event, item, 'resize');
                            }}
                            className={`absolute w-2 h-2 bg-white border border-[#0D99FF] rounded-[1px] ${position}`}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            commit(items.filter((entry) => entry.id !== item.id));
                            setSelectedId(null);
                          }}
                          className="absolute -top-6 right-0 w-5 h-5 rounded bg-[#2C2C2C] border border-white/15 grid place-items-center text-white/70"
                          aria-label="Delete element"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pages strip */}
          <div data-spot="editor-pages" className="absolute bottom-4 left-4 flex items-center gap-1 px-1.5 py-1.5 rounded-lg bg-[#2C2C2C] border border-white/10 shadow-lg">
            {pages.map((page, index) => (
              <button
                key={page.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActivePageId(page.id);
                  setSelectedId(null);
                }}
                className={`h-7 min-w-[26px] px-2 rounded text-[10.5px] font-medium ${
                  page.id === activePage.id ? 'bg-[#0D99FF] text-white' : 'text-white/60 hover:bg-white/10'
                }`}
                title={`${page.name} · ${page.width || CANVAS_WIDTH}×${page.height || CANVAS_HEIGHT}`}
              >
                {index + 1}
              </button>
            ))}
            <button type="button" onClick={(event) => { event.stopPropagation(); setPagePickerOpen(true); }} className="w-7 h-7 rounded text-white/70 hover:bg-white/10 grid place-items-center" aria-label="Add page">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-4 bg-white/10 mx-0.5" />
            <button type="button" onClick={duplicatePage} className="h-7 px-2 rounded text-[10px] text-white/55 hover:bg-white/10">Duplicate</button>
            <button type="button" onClick={deletePage} disabled={pages.length === 1} className="h-7 px-2 rounded text-[10px] text-white/55 hover:bg-white/10 disabled:opacity-30">Delete</button>
          </div>

          {/* Floating toolbar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-1.5 rounded-xl bg-[#2C2C2C] border border-white/10 shadow-[0_16px_40px_-12px_rgba(0,0,0,.8)]">
            {[
              { icon: MousePointer2, label: 'Select', action: () => setSelectedId(null) },
              { icon: Frame, label: 'Card', action: () => addVariant(VARIANTS.find((v) => v.id === 'card-outline')!) },
              { icon: Square, label: 'Button', action: () => addVariant(VARIANTS.find((v) => v.id === 'btn-solid')!) },
              { icon: Type, label: 'Text', action: () => addVariant(VARIANTS.find((v) => v.id === 'text-body')!) },
              { icon: ImageIcon, label: 'Image', action: () => fileRef.current?.click() },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.label}
                  type="button"
                  onClick={(event) => { event.stopPropagation(); tool.action(); }}
                  title={tool.label}
                  className="w-8 h-8 rounded-md grid place-items-center text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}

            <span className="w-px h-5 bg-white/10 mx-1" />

            {selected ? (
              <>
                {[
                  { icon: AlignLeft, value: 'left' as const },
                  { icon: AlignCenter, value: 'center' as const },
                  { icon: AlignRight, value: 'right' as const },
                ].map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.value}
                      type="button"
                      onClick={(event) => { event.stopPropagation(); update(selected.id, { align: tool.value }); }}
                      title={`Align ${tool.value}`}
                      className={`w-8 h-8 rounded-md grid place-items-center ${(selected.align || 'left') === tool.value ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10'}`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
                <span className="w-px h-5 bg-white/10 mx-1" />
                <button type="button" onClick={(event) => { event.stopPropagation(); duplicateSelected(); }} title="Duplicate" className="w-8 h-8 rounded-md grid place-items-center text-white/60 hover:bg-white/10">
                  <Copy className="w-4 h-4" />
                </button>
                <button type="button" onClick={(event) => { event.stopPropagation(); removeSelected(); }} title="Delete" className="w-8 h-8 rounded-md grid place-items-center text-[#FF8A8A] hover:bg-white/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button type="button" onClick={(event) => { event.stopPropagation(); undo(); }} title="Undo" className="w-8 h-8 rounded-md grid place-items-center text-white/60 hover:bg-white/10">
                <Undo2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onOpenAssistant?.(); }}
            className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-[#2C2C2C] border border-white/10 grid place-items-center text-white/60 hover:text-white shadow-lg"
            aria-label="Help"
          >
            <CircleHelp className="w-4 h-4" />
          </button>
        </main>

        {/* Inspector */}
        <aside data-spot="editor-inspector" className="w-[286px] shrink-0 border-l border-white/10 bg-[#2C2C2C] flex flex-col min-h-0 overflow-y-auto v-scroll">
          <div className="h-11 shrink-0 flex items-center gap-1 px-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => setInspectorTab('design')}
              className={`h-7 px-2 rounded text-[11.5px] font-semibold ${inspectorTab === 'design' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'}`}
            >
              Design
            </button>
            <button
              type="button"
              onClick={() => setInspectorTab('prototype')}
              className={`h-7 px-2 rounded text-[11.5px] font-semibold ${inspectorTab === 'prototype' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'}`}
            >
              Prototype
            </button>
            <span className="ml-auto text-[11px] text-white/40">{Math.round(zoom * 100)}%</span>
          </div>

          {inspectorTab === 'prototype' && (
            <>
              <Section title="Page transition">
                <div className="grid grid-cols-2 gap-1.5">
                  {(['none', 'fade', 'slide', 'push', 'dissolve'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setPages((prev) => prev.map((page) => (page.id === activePage.id ? { ...page, transition: option } : page)))
                      }
                      className={`h-7 rounded text-[10.5px] font-semibold capitalize ${
                        (activePage.transition || 'none') === option ? 'bg-[#0D99FF] text-white' : 'bg-[#383838] text-white/65'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="text-[9.5px] leading-relaxed text-white/35">
                  Applied when a click lands on this page in Preview. Press ▶ in the top bar to try it.
                </p>
              </Section>

              <Section title="Interaction">
                {selected ? (
                  <>
                    <p className="text-[10.5px] text-white/55">
                      On click, “{selected.label}” should go to:
                    </p>
                    <select
                      value={selected.linkToPageId || ''}
                      onChange={(event) => update(selected.id, { linkToPageId: event.target.value || undefined })}
                      className="h-8 w-full rounded bg-[#383838] px-2 text-[11px] text-white outline-none"
                    >
                      <option value="">No link</option>
                      {pages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.name}
                        </option>
                      ))}
                    </select>
                    {selected.linkToPageId && (
                      <p className="text-[9.5px] text-[#22D3EE]">
                        Links to {pages.find((page) => page.id === selected.linkToPageId)?.name}.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[10.5px] leading-relaxed text-white/45">
                    Select an element on the canvas to give it a click target.
                  </p>
                )}
              </Section>
            </>
          )}

          {inspectorTab === 'design' && (
            <>
          <Section title="Frame">
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] text-white/45 w-14">Size</span>
              <input
                type="number"
                value={pageWidth}
                onChange={(event) => setPageSize(Number(event.target.value), pageHeight)}
                className="w-[64px] h-7 rounded bg-[#383838] px-1.5 text-[10.5px] outline-none"
                aria-label="Frame width"
              />
              <input
                type="number"
                value={pageHeight}
                onChange={(event) => setPageSize(pageWidth, Number(event.target.value))}
                className="w-[64px] h-7 rounded bg-[#383838] px-1.5 text-[10.5px] outline-none"
                aria-label="Frame height"
              />
              <button
                type="button"
                onClick={() => setPageSize(pageHeight, pageWidth)}
                className="h-7 px-2 rounded bg-[#383838] text-[10px] text-white/70 hover:bg-white/15"
                title="Swap orientation"
              >
                ⟳
              </button>
            </div>

            <div className="space-y-0.5 pt-0.5">
              {DEVICE_GROUPS.map((group) => {
                const open = openFrameGroup === group.id;
                const Icon = group.id === 'phone' ? Smartphone : group.id === 'tablet' ? Tablet : Monitor;
                return (
                  <div key={group.id}>
                    <button
                      type="button"
                      onClick={() => setOpenFrameGroup(open ? null : group.id)}
                      className="w-full flex items-center gap-1.5 h-7 rounded text-[10.5px] text-white/75 hover:bg-white/5"
                    >
                      <ChevronRight className={`w-3 h-3 text-white/35 transition-transform ${open ? 'rotate-90' : ''}`} />
                      <Icon className="w-3 h-3 text-white/40" />
                      <span className="flex-1 text-left">{group.label}</span>
                    </button>
                    {open && (
                      <div className="pl-4 pb-1">
                        {group.devices.map((device) => {
                          const active = pageWidth === device.width && pageHeight === device.height;
                          return (
                            <button
                              key={device.id}
                              type="button"
                              onClick={() => setPageSize(device.width, device.height)}
                              className={`w-full flex items-center justify-between h-7 px-1.5 rounded text-[10.5px] ${
                                active ? 'bg-[#0D99FF]/20 text-white' : 'text-white/60 hover:bg-white/5'
                              }`}
                            >
                              <span className="truncate">{device.name}</span>
                              <span className="text-white/35 tabular-nums">{device.width}×{device.height}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Page">
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] text-white/45 w-14">Background</span>
              <label className="relative w-6 h-6 rounded border border-white/15 overflow-hidden cursor-pointer">
                <span className="absolute inset-0" style={{ background: pageBg }} />
                <input type="color" value={pageBg} onChange={(event) => setPageBackground(event.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Custom background colour" />
              </label>
              <span className="text-[10.5px] font-mono text-white/70">{pageBg.toUpperCase()}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {['#FFFFFF', '#F7F7FB', '#F1E9DC', '#E7EDE9', '#0F1117', '#0B1220', '#1B2430'].map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setPageBackground(swatch)}
                  className={`w-5 h-5 rounded border ${pageBg.toLowerCase() === swatch.toLowerCase() ? 'border-[#0D99FF]' : 'border-white/15'}`}
                  style={{ background: swatch }}
                  aria-label={`Background ${swatch}`}
                />
              ))}
            </div>
            {pageIsDark && (
              <button type="button" onClick={fixTextContrast} className="w-full h-7 rounded bg-white/5 text-[10px] font-medium text-white/70 hover:bg-white/10">
                Make text readable on this background
              </button>
            )}
          </Section>

          {selected && !preview && (
            <Section
              title={(variantById(selected.variant || '') || VARIANTS[0]).name}
              action={
                <>
                  <button type="button" onClick={duplicateSelected} className="w-6 h-6 rounded grid place-items-center text-white/45 hover:bg-white/10" aria-label="Duplicate">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={removeSelected} className="w-6 h-6 rounded grid place-items-center text-[#FF8A8A] hover:bg-white/10" aria-label="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              }
            >
              {selected.type === 'text' ? (
                <div className="rounded-md bg-[#383838] px-2.5 py-2">
                  <p className="text-[10.5px] leading-relaxed text-white/50">
                    Type directly on the canvas — double-click the text, or press Enter.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingId(selected.id)}
                    className="mt-1.5 w-full h-7 rounded text-[10.5px] font-semibold text-white"
                    style={{ background: '#0D99FF' }}
                  >
                    Edit text on canvas
                  </button>
                </div>
              ) : (
                <input
                  value={selected.label}
                  onChange={(event) => update(selected.id, { label: event.target.value })}
                  className="w-full h-7 rounded-md bg-[#383838] px-2 text-[11.5px] outline-none focus:ring-1 focus:ring-[#0D99FF]"
                />
              )}

              {selected.type === 'text' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] text-white/45 w-14">Size</span>
                  <input
                    type="number"
                    value={selected.fontSize ?? 28}
                    onChange={(event) => update(selected.id, { fontSize: Number(event.target.value) || 12 })}
                    className="w-12 h-7 rounded bg-[#383838] px-1.5 text-[10.5px] outline-none"
                  />
                  {[400, 600, 800].map((weight) => (
                    <button
                      key={weight}
                      type="button"
                      onClick={() => update(selected.id, { fontWeight: weight })}
                      className={`h-7 px-2 rounded text-[10px] font-bold ${(selected.fontWeight ?? 700) === weight ? 'bg-[#0D99FF] text-white' : 'bg-[#383838] text-white/60'}`}
                    >
                      {weight === 400 ? 'R' : weight === 600 ? 'SB' : 'B'}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] text-white/45 w-14">{selected.type === 'text' ? 'Fill' : 'Accent'}</span>
                <div className="flex gap-1 flex-wrap">
                  {SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => update(selected.id, { color: swatch })}
                      className={`w-5 h-5 rounded border ${selected.color === swatch ? 'border-[#0D99FF]' : 'border-white/15'}`}
                      style={{ background: swatch }}
                      aria-label={`Use ${swatch}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] text-white/45 w-14">W / H</span>
                <input
                  type="number"
                  value={selected.w}
                  onChange={(event) => update(selected.id, { w: Number(event.target.value) || 60 })}
                  className="w-[60px] h-7 rounded bg-[#383838] px-1.5 text-[10.5px] outline-none"
                  aria-label="Width"
                />
                <input
                  type="number"
                  value={selected.h}
                  onChange={(event) => update(selected.id, { h: Number(event.target.value) || 24 })}
                  className="w-[60px] h-7 rounded bg-[#383838] px-1.5 text-[10.5px] outline-none"
                  aria-label="Height"
                />
              </div>

              {selected.type !== 'text' && colorRow('Surface', selected.fill, (next) => update(selected.id, { fill: next || undefined }), true)}
              {colorRow('Border', selected.strokeColor, (next) => update(selected.id, { strokeColor: next }))}

              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] text-white/45 w-14 shrink-0">Thickness</span>
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={1}
                  value={selected.strokeWidth ?? 0}
                  onChange={(event) => update(selected.id, { strokeWidth: Number(event.target.value) })}
                  className="flex-1 accent-[#0D99FF]"
                />
                <span className="w-9 text-right text-[10.5px] text-white/70">{selected.strokeWidth ?? 0}px</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] text-white/45 w-14 shrink-0">Radius</span>
                <input
                  type="range"
                  min={0}
                  max={48}
                  step={1}
                  value={selected.radius ?? 12}
                  onChange={(event) => update(selected.id, { radius: Number(event.target.value) })}
                  className="flex-1 accent-[#0D99FF]"
                />
                <span className="w-9 text-right text-[10.5px] text-white/70">{selected.radius ?? 12}px</span>
              </div>

              {selected.type === 'text' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] text-white/45 w-14 shrink-0">Font</span>
                    <select
                      value={selected.fontFamily || 'jakarta'}
                      onChange={(event) => update(selected.id, { fontFamily: event.target.value })}
                      className="h-7 flex-1 rounded bg-[#383838] px-1.5 text-[10.5px] text-white outline-none"
                      style={{ fontFamily: FONT_STACKS[selected.fontFamily || 'jakarta'] }}
                    >
                      {FONT_LABELS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] text-white/45 w-14 shrink-0">Style</span>
                    <button
                      type="button"
                      onClick={() => update(selected.id, { italic: !selected.italic })}
                      className={`w-7 h-7 rounded grid place-items-center ${selected.italic ? 'bg-[#0D99FF] text-white' : 'bg-[#383838] text-white/60'}`}
                      aria-label="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => update(selected.id, { underline: !selected.underline })}
                      className={`w-7 h-7 rounded grid place-items-center ${selected.underline ? 'bg-[#0D99FF] text-white' : 'bg-[#383838] text-white/60'}`}
                      aria-label="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <span className="mx-0.5 h-4 w-px bg-white/10" />
                    {([
                      { value: 'left' as const, icon: AlignLeft },
                      { value: 'center' as const, icon: AlignCenter },
                      { value: 'right' as const, icon: AlignRight },
                    ]).map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => update(selected.id, { align: option.value })}
                          className={`w-7 h-7 rounded grid place-items-center ${
                            (selected.align || 'left') === option.value ? 'bg-[#0D99FF] text-white' : 'bg-[#383838] text-white/60'
                          }`}
                          aria-label={`Align ${option.value}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </Section>
          )}

          <Section
            title="Prompt"
            action={
              <button type="button" onClick={copyPrompt} className="w-6 h-6 rounded grid place-items-center text-white/45 hover:bg-white/10" aria-label="Copy prompt">
                {copied ? <Check className="w-3 h-3 text-[#22D3EE]" /> : <Copy className="w-3 h-3" />}
              </button>
            }
          >
            <div data-spot="editor-prompt">
              {activeSystem && (
                <p className="mb-1.5 flex items-center gap-1 text-[9.5px] font-semibold text-[#B9A8FF]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#B9A8FF]" /> {activeSystem.name} tokens attached
                </p>
              )}
              <textarea
                readOnly
                value={prompt}
                className="w-full h-[170px] resize-none rounded-md bg-[#383838] p-2 text-[10px] leading-relaxed font-mono text-white/75 outline-none v-scroll"
              />
            </div>
            <button
              type="button"
              onClick={sendToBase44}
              className="w-full h-8 rounded-md text-[11px] font-semibold text-white inline-flex items-center justify-center gap-1.5"
              style={{ background: '#0D99FF' }}
            >
              <Send className="w-3 h-3" /> Send to Base44
            </button>
          </Section>

          <Section title="Export">
            <button
              type="button"
              onClick={downloadBundle}
              className="w-full h-8 rounded-md text-[11px] font-semibold text-white inline-flex items-center justify-center gap-1.5"
              style={{ background: '#0D99FF' }}
            >
              <Download className="w-3 h-3" /> Prompt bundle (.md)
            </button>
            <button
              type="button"
              onClick={downloadManifest}
              className="w-full h-8 rounded-md border border-white/15 text-[11px] font-semibold text-white/85 inline-flex items-center justify-center gap-1.5 hover:bg-white/5"
            >
              <Download className="w-3 h-3" /> Manifest (.json)
            </button>
            <button
              type="button"
              onClick={() => attachRef.current?.click()}
              className="w-full h-8 rounded-md border border-dashed border-white/20 text-[11px] font-semibold text-white/70 inline-flex items-center justify-center gap-1.5 hover:bg-white/5"
            >
              <Plus className="w-3 h-3" /> Attach files
            </button>

            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center gap-1.5 rounded bg-[#383838] px-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-[10px] text-white/75">{file.name}</span>
                    <span className="text-[9px] text-white/35">{Math.round(file.size / 1024)}kb</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((entry) => entry.id !== file.id))}
                      className="w-4 h-4 rounded grid place-items-center text-white/40 hover:text-white"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[9.5px] leading-relaxed text-white/30">
              The bundle carries the revised prompt, the element manifest, every image and any attached files, ready for a generator.
            </p>
          </Section>
            </>
          )}

          <div className="m-3 rounded-lg border border-white/10 bg-[#333] p-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md grid place-items-center" style={{ backgroundImage: 'linear-gradient(135deg,#7C5CFF,#22D3EE)' }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </span>
              <p className="text-[11.5px] font-semibold">Ask Vector AI</p>
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-white/55">
              It can see this canvas. Ask what is missing, how to word a button, or which palette to use.
            </p>
            <button
              type="button"
              onClick={onOpenAssistant}
              className="mt-2.5 w-full h-8 rounded-md border border-white/15 text-[11px] font-semibold text-white/85 hover:bg-white/5"
            >
              Open assistant
            </button>
          </div>
        </aside>
      </div>

      <SpotlightHost page="editor" onLearnMore={() => onOpenAssistant?.()} />

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        room={room}
        link={shareLink(room)}
        peers={peers}
        me={me || makePeer(displayName)}
        invites={invites}
        mode={sharingMode()}
        onInvite={(email, role) => setInvites(addInvite(email, role))}
      />

      <PagePickerModal
        open={pagePickerOpen}
        projectTypeId={projectTypeId}
        onClose={() => setPagePickerOpen(false)}
        onPick={(kind, variant) => {
          const page = pageFromVariant(projectTypeId || 'saas', kind, variant);
          setPages((prev) => [...prev, page]);
          setActivePageId(page.id);
          setSelectedId(null);
          setPagePickerOpen(false);
        }}
      />

      <ConnectDialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        prompt={prompt}
        paid={paid}
        onRequireUpgrade={() => onRequireUpgrade?.()}
      />

      {/* Base44 drawer */}
      {base44 && (
        <div className="fixed inset-0 z-[80] flex">
          <div className="flex-1 bg-black/60" onClick={() => setBase44(false)} aria-hidden="true" />
          <div className="w-full max-w-[560px] bg-[#2C2C2C] border-l border-white/10 flex flex-col text-white">
            <div className="h-11 flex items-center justify-between px-3 border-b border-white/10">
              <p className="text-[12px] font-semibold">Send to Base44</p>
              <button type="button" onClick={() => setBase44(false)} className="w-7 h-7 rounded grid place-items-center text-white/60 hover:bg-white/10" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto v-scroll flex-1">
              <div className="rounded-lg bg-[#383838] p-3">
                <p className="text-[11px] font-semibold mb-1">1. Prompt copied</p>
                <p className="text-[10.5px] text-white/50">{copied ? 'Your canvas prompt is on the clipboard.' : 'Copy the prompt if it did not copy automatically.'}</p>
                <button type="button" onClick={copyPrompt} className="mt-2 h-7 px-2.5 rounded border border-white/15 text-[10.5px] font-medium inline-flex items-center gap-1.5">
                  <Copy className="w-3 h-3" /> Copy again
                </button>
              </div>

              <div className="rounded-lg bg-[#383838] p-3">
                <p className="text-[11px] font-semibold mb-1">2. Open Base44 and paste</p>
                <p className="text-[10.5px] text-white/50">Base44's own sign-in is required — Vector does not hold your credentials.</p>
                <a href="https://app.base44.com" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[11px] font-semibold text-white" style={{ background: '#0D99FF' }}>
                  Open Base44 <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="rounded-lg border border-white/10 overflow-hidden">
                <div className="h-8 flex items-center gap-2 px-2.5 bg-[#383838] border-b border-white/10">
                  <span className="w-2 h-2 rounded-full bg-[#FF7A59]" />
                  <span className="w-2 h-2 rounded-full bg-[#FFC53D]" />
                  <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
                  <span className="ml-1 text-[9.5px] text-white/35">app.base44.com</span>
                </div>
                <iframe title="Base44" src="https://app.base44.com" className="w-full h-[420px] canvas-surface" sandbox="allow-scripts allow-forms allow-same-origin allow-popups" />
              </div>
              <p className="text-[9.5px] text-white/30">If the panel stays blank, Base44 blocks embedding. Use “Open Base44” — the prompt is already copied.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
