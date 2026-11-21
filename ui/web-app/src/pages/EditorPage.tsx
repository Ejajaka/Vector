import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  CreditCard,
  Crown,
  Database,
  Download,
  ExternalLink,
  FileText,
  Frame,
  Github,
  Globe,
  Heart,
  Image as ImageIcon,
  Italic,
  Layers,
  LayoutTemplate,
  Lock,
  Maximize2,
  Minimize2,
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
  MessageSquare,
  Table2,
  Tablet,
  Trash2,
  Type,
  Underline,
  Undo2,
  Upload,
  Zap,
  X,
} from 'lucide-react';
import {
  ANIMATION_PRESETS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_ANIMATION,
  buildPagesPrompt,
  emptyCanvas,
  itemsFromTemplate,
  newId,
  summarize,
  FONT_LABELS,
  FONT_STACKS,
  type CanvasItem,
  type CanvasItemType,
  type CanvasPage,
  type ElementAnimation,
} from '../data/canvas.ts';
import { TYPE_TO_VARIANT, VARIANTS, VARIANT_TEXT_FIELDS, variantById, type StyleVariant } from '../data/styles.ts';
import { DEVICE_GROUPS, describeSize } from '../data/devices.ts';
import { StyledElement } from '../components/editor/StyledElement.tsx';
import { VariantPreview } from '../components/editor/VariantPreview.tsx';
import { SideBySideBuild } from '../components/generators/SideBySideBuild.tsx';
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
  projectRoom,
  roomFromUrl,
  readInvites,
  shareLink,
  sharingMode,
  type Invite,
  type Peer,
} from '../services/collab.ts';
import { ShareDialog } from '../components/collab/ShareDialog.tsx';
import { loadSharedDoc, saveSharedDoc } from '../services/sharedDocs.ts';
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

const APPS: Array<{
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  url?: string;
}> = [
  { id: 'base44', name: 'Base44', description: 'Generate and publish the interface', icon: Rocket },
  { id: 'figma', name: 'Figma', description: 'Import a Figma JSON export', icon: Frame },
  { id: 'v0', name: 'v0', description: 'Generate UI from a prompt', icon: Sparkles, url: 'https://v0.dev' },
  { id: 'bolt', name: 'Bolt', description: 'Full-stack app builder', icon: Zap, url: 'https://bolt.new' },
  { id: 'lovable', name: 'Lovable', description: 'Prompt-to-app builder', icon: Heart, url: 'https://lovable.dev' },
  { id: 'framer', name: 'Framer', description: 'Design and publish sites', icon: Frame, url: 'https://framer.com' },
  { id: 'webflow', name: 'Webflow', description: 'Visual web builder', icon: Globe, url: 'https://webflow.com' },
  { id: 'github', name: 'GitHub', description: 'Push the prompt bundle', icon: Github, url: 'https://github.com' },
  { id: 'supabase', name: 'Supabase', description: 'Auth, data and storage', icon: Database, url: 'https://supabase.com' },
  { id: 'stripe', name: 'Stripe', description: 'Payments and billing', icon: CreditCard, url: 'https://stripe.com' },
  { id: 'notion', name: 'Notion', description: 'Docs and product specs', icon: FileText, url: 'https://notion.so' },
  { id: 'slack', name: 'Slack', description: 'Share the brief with the team', icon: MessageSquare, url: 'https://slack.com' },
  { id: 'linear', name: 'Linear', description: 'Turn the brief into issues', icon: Layers, url: 'https://linear.app' },
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

/** True when a single tap should place the caret instead of only selecting. */
function canInlineEdit(item: CanvasItem): boolean {
  return item.variant !== 'shape-rect';
}

/** Best renderer for an item, even when it was seeded without a variant id. */
function variantFor(item: CanvasItem): StyleVariant {
  return (
    variantById(item.variant || '') ||
    variantById(TYPE_TO_VARIANT[item.type] || '') ||
    VARIANTS[0]
  );
}

/**
 * Keep an AI arrangement inside the page. If the chosen layout is taller or
 * wider than the frame, scale the whole composition down uniformly (including
 * type) and then clamp every edge as a final guarantee.
 */
function containArrangement(items: CanvasItem[], W: number, H: number): CanvasItem[] {
  if (!items.length) return items;
  const minX = Math.min(...items.map((item) => item.x));
  const minY = Math.min(...items.map((item) => item.y));
  const maxX = Math.max(...items.map((item) => item.x + item.w));
  const maxY = Math.max(...items.map((item) => item.y + item.h));
  const left = Math.max(0, minX);
  const top = Math.max(0, minY);
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const availableW = Math.max(1, W - left);
  const availableH = Math.max(1, H - top);
  const scale = Math.min(1, availableW / width, availableH / height);

  return items.map((item) => {
    const x = clamp(Math.round(left + (item.x - minX) * scale), 0, Math.max(0, W - 24));
    const y = clamp(Math.round(top + (item.y - minY) * scale), 0, Math.max(0, H - 16));
    const w = clamp(Math.round(item.w * scale), 24, Math.max(24, W - x));
    const h = clamp(Math.round(item.h * scale), 16, Math.max(16, H - y));
    const fontSize = item.fontSize
      ? clamp(Math.round(item.fontSize * scale), 8, Math.max(8, Math.min(200, Math.round(h / 1.1))))
      : item.fontSize;
    return { ...item, x, y, w, h, fontSize };
  });
}

/**
 * Deterministic layout suggestions used by the Design button. The user can
 * cycle through four arrangements; each one starts from the layout they saved
 * before the first suggestion.
 */
function aiArrange(items: CanvasItem[], W: number, H: number, variant: number): CanvasItem[] {
  const groups = {
    nav: [] as CanvasItem[],
    footer: [] as CanvasItem[],
    heading: [] as CanvasItem[],
    text: [] as CanvasItem[],
    form: [] as CanvasItem[],
    button: [] as CanvasItem[],
    media: [] as CanvasItem[],
    card: [] as CanvasItem[],
    badge: [] as CanvasItem[],
    other: [] as CanvasItem[],
  };

  items.forEach((item) => {
    if (item.type === 'navbar') groups.nav.push(item);
    else if (item.type === 'footer') groups.footer.push(item);
    else if (item.type === 'heading') groups.heading.push(item);
    else if (item.type === 'text') groups.text.push(item);
    else if (item.type === 'input') groups.form.push(item);
    else if (item.type === 'button') groups.button.push(item);
    else if (item.type === 'image' || item.type === 'chart' || item.type === 'table') groups.media.push(item);
    else if (item.type === 'card' || item.type === 'modal') groups.card.push(item);
    else if (item.type === 'badge' || item.type === 'avatar') groups.badge.push(item);
    else groups.other.push(item);
  });

  const margin = Math.max(28, Math.round(Math.min(W, H) * 0.055));
  const gap = Math.max(12, Math.round(margin * 0.3));
  const contentW = W - margin * 2;
  let y = margin;
  const positions = new Map<string, { x: number; y: number; w: number; h: number }>();

  const put = (item: CanvasItem, x: number, top: number, w: number, h: number, minH = 32) => {
    positions.set(item.id, {
      x: Math.round(x),
      y: Math.round(top),
      w: Math.round(Math.max(40, w)),
      h: Math.round(Math.max(minH, h)),
    });
  };

  const headingH = (item: CanvasItem) => Math.max(48, Math.round((item.fontSize ?? 28) * 1.55));
  const textH = (item: CanvasItem) =>
    Math.max(44, Math.min(150, Math.ceil((item.label || 'Copy').length / 58) * (item.fontSize ?? 14) * 1.8));
  const formH = (item: CanvasItem) => Math.max(56, item.h || 56);
  const buttonH = (item: CanvasItem) => Math.max(44, item.h || 48);
  const badgeH = (item: CanvasItem) => Math.max(28, item.h || 32);
  const mediaH = (item: CanvasItem) => Math.max(150, Math.min(240, item.h || 190));

  groups.nav.forEach((item) => put(item, margin, 20, contentW, 64));
  if (groups.nav.length) y = 20 + 64 + gap;

  const colW = Math.min(760, contentW);

  if (variant === 1 && (groups.media.length || groups.card.length) && contentW >= 720) {
    // Split: copy and controls on the left, visual content on the right.
    const leftW = Math.round(contentW * 0.46);
    const rightX = margin + leftW + gap;
    const rightW = contentW - leftW - gap;
    let ly = y;
    groups.heading.forEach((item) => {
      const h = headingH(item);
      put(item, margin, ly, leftW, h);
      ly += h + gap;
    });
    groups.text.forEach((item) => {
      const h = textH(item);
      put(item, margin, ly, Math.min(leftW, 640), h);
      ly += h + gap;
    });
    groups.badge.forEach((item) => {
      const h = badgeH(item);
      put(item, margin, ly, Math.min(220, leftW), h);
      ly += h + gap;
    });
    groups.form.forEach((item) => {
      const h = formH(item);
      put(item, margin, ly, Math.min(leftW, 440), h);
      ly += h + gap;
    });
    groups.button.forEach((item) => {
      const h = buttonH(item);
      put(item, margin, ly, Math.min(Math.max(200, item.w), leftW), h);
      ly += h + gap;
    });

    const right = [...groups.card, ...groups.media];
    const rowH = Math.max(120, Math.min(230, Math.floor((H - margin - y - gap * Math.max(0, right.length - 1)) / Math.max(1, right.length))));
    let ry = y;
    right.forEach((item) => {
      put(item, rightX, ry, rightW, rowH, 110);
      ry += rowH + gap;
    });
    groups.other.forEach((item) => {
      const h = 150;
      put(item, margin, Math.max(ly, ry), contentW, h);
      ry += h + gap;
    });
  } else if (variant === 2) {
    // Grid: heading first, then everything in two balanced columns.
    let gy = y;
    groups.heading.forEach((item) => {
      const h = headingH(item);
      put(item, margin, gy, Math.min(contentW, 900), h);
      gy += h + gap;
    });
    groups.text.forEach((item) => {
      const h = textH(item);
      put(item, margin, gy, Math.min(contentW, 760), h);
      gy += h + gap;
    });

    const grid = [...groups.card, ...groups.media, ...groups.form, ...groups.button, ...groups.badge, ...groups.other];
    const cols = contentW >= 760 ? 2 : 1;
    const cellW = (contentW - gap * (cols - 1)) / cols;
    for (let index = 0; index < grid.length; index += cols) {
      const row = grid.slice(index, index + cols);
      const rowH = Math.max(
        ...row.map((item) =>
          item.type === 'button'
            ? buttonH(item)
            : item.type === 'input'
              ? formH(item)
              : item.type === 'badge' || item.type === 'avatar'
                ? badgeH(item)
                : item.type === 'card' || item.type === 'image' || item.type === 'chart' || item.type === 'table'
                  ? mediaH(item)
                  : 130
        ),
        32
      );
      row.forEach((item, column) => {
        put(item, margin + column * (cellW + gap), gy, cellW, rowH, 32);
      });
      gy += rowH + gap;
    }
  } else {
    // Centred stack (0) or left-aligned editorial (3).
    const centre = variant === 0;
    let sy = y;
    const setRow = (item: CanvasItem, w: number, h: number) => {
      const x = centre ? (W - w) / 2 : margin;
      put(item, x, sy, w, h);
      sy += h + gap;
    };

    groups.heading.forEach((item) => setRow(item, Math.min(centre ? 760 : 900, contentW), headingH(item)));
    groups.text.forEach((item) => setRow(item, Math.min(centre ? 640 : 760, contentW), textH(item)));
    groups.badge.forEach((item) => setRow(item, Math.min(220, contentW), badgeH(item)));
    groups.form.forEach((item) => setRow(item, Math.min(colW, contentW), formH(item)));
    groups.button.forEach((item) => setRow(item, Math.min(Math.max(200, item.w), contentW), buttonH(item)));

    const visual = [...groups.card, ...groups.media];
    const visualW = Math.min(contentW, 1000);
    visual.forEach((item) => {
      const h = mediaH(item);
      put(item, centre ? (W - visualW) / 2 : margin, sy, visualW, h, 120);
      sy += h + gap;
    });
    groups.other.forEach((item) => setRow(item, contentW, 150));
  }

  groups.footer.forEach((item) => put(item, margin, H - margin - 88, contentW, 88));

  // Anything unclassified still gets a safe place instead of staying at 0,0.
  let fallbackY = y;
  items.forEach((item) => {
    if (positions.has(item.id)) return;
    const h = Math.max(40, item.h || 60);
    put(item, margin, fallbackY, contentW, h);
    fallbackY += h + gap;
  });

  return containArrangement(
    items.map((item) => {
      const next = positions.get(item.id);
      return next ? { ...item, ...next } : item;
    }),
    W,
    H
  );
}

/** Render a variant scaled into a fixed thumbnail tile. */
const Tile: React.FC<{ variant: StyleVariant }> = ({ variant }) => (
  <div className="h-full w-full overflow-hidden rounded-md" style={{ background: '#F6F5FA' }}>
    <VariantPreview variant={variant} />
  </div>
);

const ANIMATION_EASING: Record<ElementAnimation['easing'], string> = {
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  linear: 'linear',
  spring: 'cubic-bezier(.34, 1.56, .64, 1)',
};

const ANIMATION_TRIGGERS: Array<{ id: ElementAnimation['trigger']; label: string }> = [
  { id: 'load', label: 'On load' },
  { id: 'hover', label: 'On hover' },
  { id: 'click', label: 'On click' },
  { id: 'in-view', label: 'In view' },
];

/** The size each element type renders at before the user picks an override. */
const DEFAULT_FONT_SIZE: Record<CanvasItemType, number> = {
  navbar: 13,
  heading: 28,
  text: 14,
  button: 13,
  input: 12,
  card: 13,
  image: 11,
  chart: 11,
  table: 10,
  avatar: 12,
  badge: 10.5,
  footer: 11,
  modal: 13,
};

const DEFAULT_FONT_WEIGHT: Record<CanvasItemType, number> = {
  navbar: 800,
  heading: 700,
  text: 400,
  button: 700,
  input: 600,
  card: 700,
  image: 600,
  chart: 700,
  table: 700,
  avatar: 700,
  badge: 700,
  footer: 700,
  modal: 700,
};

const TYPE_LABEL: Record<CanvasItemType, string> = {
  navbar: 'Navigation',
  heading: 'Heading',
  text: 'Text',
  button: 'Button',
  input: 'Input',
  card: 'Card',
  image: 'Image',
  chart: 'Chart',
  table: 'Table',
  avatar: 'Avatar',
  badge: 'Badge',
  footer: 'Footer',
  modal: 'Modal',
};

const TEXT_SIZE_PRESETS = [12, 14, 16, 18, 24, 32, 40, 56];

const Section: React.FC<{
  id?: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ id, title, children, action, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className="border-b border-white/8">
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

  // Editors opened from a template or a design system have no project id. Give
  // them their own draft so closing or reloading the tab does not lose edits,
  // keyed by the source so opening a different template starts clean.
  const draftKey = 'vector_editor_draft_v1';
  const draftSource = projectDocKey
    ? `project:${projectId}`
    : template
      ? `template:${template.id}`
      : seed
        ? `seed:${seed.name}`
        : 'blank';

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

  const loadDraft = (): { name: string; pages: CanvasPage[] } | null => {
    if (projectDocKey) return null;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.source !== draftSource) return null;
      if (!Array.isArray(parsed?.pages) || parsed.pages.length === 0) return null;
      return { name: String(parsed.name || 'Untitled screen'), pages: parsed.pages as CanvasPage[] };
    } catch {
      return null;
    }
  };

  const restored = fresh ? null : loadProjectDoc();
  const draft = fresh ? null : loadDraft();

  const [name, setName] = useState(
    restored?.name || draft?.name || projectName || seed?.name || template?.name || 'Untitled screen'
  );
  const [pages, setPages] = useState<CanvasPage[]>(() => {
    if (restored?.pages?.length) return restored.pages;
    if (draft?.pages?.length) return draft.pages;
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
  const [zoom, setZoom] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('vector_editor_zoom_v1'));
      if (Number.isFinite(saved)) return clamp(saved, 0.1, 4);
    } catch {
      // ignore
    }
    return 0.72;
  });
  const zoomRef = useRef(zoom);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const spaceHeldRef = useRef(false);
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const suppressCanvasClick = useRef(false);
  const draggedRef = useRef(false);
  const [preview, setPreview] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);
  const [playAllTick, setPlayAllTick] = useState(0);
  const [itemTicks, setItemTicks] = useState<Record<string, number>>({});
  const [base44, setBase44] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [previewVariant, setPreviewVariant] = useState<StyleVariant | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const designOriginals = useRef<Record<string, CanvasItem[]>>({});
  const [designCycle, setDesignCycle] = useState<Record<string, number>>({});
  const [openFrameGroup, setOpenFrameGroup] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1000) return false;
    try {
      return localStorage.getItem('vector_panel_open_v1') !== '0';
    } catch {
      return true;
    }
  });
  const [inspectorOpen, setInspectorOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 1000
  );
  const artboardRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceImageRef = useRef<HTMLInputElement>(null);
  const insertImageRef = useRef<HTMLInputElement>(null);
  const insertTargetRef = useRef<string | null>(null);
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
  const [room] = useState(() => roomFromUrl() || (projectId ? projectRoom(projectId) : currentRoom()));
  const sharedMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(projectId) || new URLSearchParams(window.location.search).get('share') === '1';
  }, [projectId]);
  const sharedOwner = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('owner');
  }, []);
  const sharedProject = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('project');
  }, []);
  const sharedReady = useRef(false);
  const lastLocalEdit = useRef(0);
  const pollingDoc = useRef(false);
  const viewOnly = useMemo(
    () =>
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('role') === 'view',
    [],
  );
  const [peers, setPeers] = useState<Peer[]>([]);
  const [me, setMe] = useState<Peer | null>(null);
  const [invites, setInvites] = useState<Invite[]>(() => readInvites());
  const [shareOpen, setShareOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [workspaceMenu, setWorkspaceMenu] = useState(false);
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'design' | 'prototype'>('design');
  const sessionRef = useRef<CollabSession | null>(null);
  const applyingRemote = useRef(false);
  const publishTimer = useRef<number | undefined>(undefined);
  const lastCursor = useRef(0);
  const dragRef = useRef<{
    id: string;
    mode: 'move' | 'resize';
    handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | '';
    startX: number;
    startY: number;
    origin: CanvasItem;
    before: CanvasPage[];
    moved: boolean;
  } | null>(null);
  const history = useRef<CanvasPage[][]>([]);
  const future = useRef<CanvasPage[][]>([]);

  const activePage = pages.find((page) => page.id === activePageId) || pages[0];
  const items = activePage?.items || [];
  const pageBg = activePage?.background || '#FFFFFF';
  const pageWidth = activePage?.width || CANVAS_WIDTH;
  const pageHeight = activePage?.height || CANVAS_HEIGHT;
  const pageIsDark = isDarkColour(pageBg);

  const playItem = (id: string) =>
    setItemTicks((previous) => ({ ...previous, [id]: (previous[id] || 0) + 1 }));
  const playAll = () => {
    setEditingId(null);
    setPlayAllTick((value) => value + 1);
  };

  useEffect(() => {
    setPreviewTick(0);
    setPlayAllTick(0);
    setItemTicks({});
  }, [preview, activePageId]);

  useEffect(() => {
    if (!preview) return;
    const timer = window.setTimeout(() => setPreviewTick((value) => value + 1), 80);
    return () => window.clearTimeout(timer);
  }, [preview, activePageId]);

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
  const currentFontSize = selected?.fontSize ?? (selected ? DEFAULT_FONT_SIZE[selected.type] : 14);
  const selectedIsText = selected?.type === 'text' || selected?.type === 'heading';
  const selectedTextFields = selected
    ? VARIANT_TEXT_FIELDS[variantFor(selected).style] || []
    : [];
  const activeSystem = getActiveDesignSystem();

  // Selection changes the whole inspector; always start at the top so the
  // controls for the newly selected object are visible.
  useEffect(() => {
    inspectorRef.current?.scrollTo({ top: 0 });
    setNoteDraft('');
  }, [selectedId, activePageId, inspectorTab, inspectorOpen]);
  // Autosave into the project document (or a source-keyed draft for template
  // editors) so leaving and returning keeps everything.
  useEffect(() => {
    if (viewOnly) return;
    const timer = window.setTimeout(() => {
      try {
        if (projectDocKey) {
          localStorage.setItem(projectDocKey, JSON.stringify({ name, pages, updatedAt: new Date().toISOString() }));
        } else {
          localStorage.setItem(
            draftKey,
            JSON.stringify({ source: draftSource, name, pages, updatedAt: new Date().toISOString() })
          );
        }
      } catch {
        // ignore quota errors
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [name, pages, projectDocKey, draftKey, draftSource]);

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
    session.setDocProvider(() =>
      sharedMode && !sharedReady.current ? null : docRef.current,
    );
    sessionRef.current = session;
    setMe(session.self);
    return () => {
      session.close();
      sessionRef.current = null;
    };
  }, [room, displayName]);

  // Shared rooms persist to Supabase, so edits survive after everyone closes the tab.
  useEffect(() => {
    if (!sharedMode) return;
    let cancelled = false;
    void loadSharedDoc(room).then((doc) => {
      if (cancelled) return;
      if (doc) {
        applyingRemote.current = true;
        setName(doc.name);
        setPages(doc.pages);
        setActivePageId(doc.pages[0]?.id || '');
        setSelectedId(null);
        window.setTimeout(() => {
          applyingRemote.current = false;
        }, 60);
      }
      sharedReady.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [room, sharedMode]);

  useEffect(() => {
    if (!sharedMode || viewOnly || !sharedReady.current) return;
    const timer = window.setTimeout(() => {
      void saveSharedDoc(room, {
        name,
        pages,
        ownerId: sharedOwner || user?.id || null,
        projectId: sharedProject || projectId || null,
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [name, pages, room, sharedMode, viewOnly, sharedOwner, sharedProject, projectId]);

  // Supabase Realtime can be slow to connect on some networks. Poll the room as
  // a quiet fallback so collaborators still see each other's work within a few
  // seconds, and the holder's copy is the same document the server stores.
  useEffect(() => {
    if (!sharedMode) return;
    const timer = window.setInterval(async () => {
      if (pollingDoc.current || applyingRemote.current) return;
      if (Date.now() - lastLocalEdit.current < 2600) return;
      pollingDoc.current = true;
      try {
        const doc = await loadSharedDoc(room);
        if (!doc) return;
        const current = docRef.current;
        if (doc.name === current.name && JSON.stringify(doc.pages) === JSON.stringify(current.pages)) return;
        applyingRemote.current = true;
        setName(doc.name);
        setPages(doc.pages);
        setActivePageId(doc.pages[0]?.id || '');
        window.setTimeout(() => {
          applyingRemote.current = false;
        }, 80);
      } finally {
        pollingDoc.current = false;
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [room, sharedMode]);

  // Broadcast local edits, but never echo a document that came from a peer,
  // and never publish the placeholder document before the room has loaded.
  useEffect(() => {
    if (viewOnly || applyingRemote.current) return;
    if (sharedMode && !sharedReady.current) return;
    lastLocalEdit.current = Date.now();
    window.clearTimeout(publishTimer.current);
    publishTimer.current = window.setTimeout(() => sessionRef.current?.publish({ name, pages }), 160);
    return () => window.clearTimeout(publishTimer.current);
  }, [name, pages, viewOnly, sharedMode]);

  // A view-only guest may watch and pan through the document but must not
  // mutate it with keyboard shortcuts.
  useEffect(() => {
    if (!viewOnly) return;
    const block = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.key === 'Escape' || event.key === 'Tab') return;
      const mutating =
        ['Delete', 'Backspace', 'Enter'].includes(event.key) ||
        ((event.ctrlKey || event.metaKey) &&
          ['z', 'y', 'v', 'x', 'd', 'a'].includes(event.key.toLowerCase()));
      if (mutating) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('keydown', block, true);
    return () => window.removeEventListener('keydown', block, true);
  }, [viewOnly]);

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
      surface: 'Canvas editor',
      summary: `The canvas editor for “${name}”. ${pages.length} page${pages.length === 1 ? '' : 's'}; ${items.length} element${items.length === 1 ? '' : 's'} on ${activePage?.name || 'Page 1'}.${selected ? ` The ${variantFor(selected).name} “${selected.label}” is selected.` : ' Nothing is selected.'}`,
      appearance: `Canvas background ${pageBg}; dark graphite app chrome with a violet accent.`,
      pageName: activePage?.name || 'Page 1',
      pageCount: pages.length,
      frame: { width: pageWidth, height: pageHeight },
      background: pageBg,
      selected: selected ? { name: variantFor(selected).name, label: selected.label, w: selected.w, h: selected.h } : undefined,
      elements: items.map((item) => ({
        name: variantFor(item).name,
        label: item.label,
        notes: item.notes,
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

  /** Notes are appended with a functional update so two quick notes never
   * overwrite each other, and the prompt always sees the latest list. */
  const addNote = () => {
    const next = noteDraft.trim();
    if (!next || !selected) return;
    setPageItems(
      activePage.id,
      (prev) => prev.map((item) => (item.id === selected.id ? { ...item, notes: [...(item.notes || []), next] } : item)),
      false
    );
    setNoteDraft('');
  };

  const removeNote = (index: number) => {
    if (!selected) return;
    setPageItems(
      activePage.id,
      (prev) =>
        prev.map((item) =>
          item.id === selected.id ? { ...item, notes: (item.notes || []).filter((_, entryIndex) => entryIndex !== index) } : item
        ),
      false
    );
  };

  /** Grow the box with the type so large labels never clip or spill. */
  const changeFontSize = (size: number) => {
    if (!selected) return;
    const next = clamp(Math.round(size), 6, 200);
    const patch: Partial<CanvasItem> = { fontSize: next };
    const maxHeight = Math.max(16, pageHeight - selected.y);
    if (selectedIsText) {
      patch.h = Math.min(maxHeight, Math.max(selected.h, Math.round(next * 1.8)));
    } else {
      patch.h = Math.min(maxHeight, Math.max(selected.h, Math.round(next * 1.6)));
      if (selected.type === 'button' || selected.type === 'badge' || selected.type === 'input') {
        patch.w = Math.min(
          Math.max(24, pageWidth - selected.x),
          Math.max(selected.w, Math.round(Math.max(selected.label.length, 6) * next * 0.68))
        );
      }
    }
    update(selected.id, patch);
  };

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

  // Sharing is a Pro feature: free accounts see the upgrade chooser instead.
  const openShare = () => {
    if (!paid) {
      onRequireUpgrade?.();
      return;
    }
    setShareOpen(true);
  };

  // The invite link has to carry the room, the project and its holder, or the
  // recipient would land on their own workspace instead of this canvas.
  const inviteLink = useMemo(() => {
    const url = new URL(shareLink(room));
    if (projectId) url.searchParams.set('project', projectId);
    url.searchParams.set('name', projectName || name || 'Shared project');
    url.searchParams.set('share', '1');
    const owner = sharedOwner || user?.id;
    if (owner) url.searchParams.set('owner', owner);
    return url.toString();
  }, [room, projectId, projectName, name, sharedOwner, user?.id]);

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
      body: `${category.width}Ã—${category.height} frame with a starter layout.`,
      action: { label: 'Open pages', tab: 'projects' },
    });
  };

  const setPageBackground = (background: string) => {    setPages((prev) => prev.map((page) => (page.id === activePage.id ? { ...page, background } : page)));
    setSaved(false);
  };

  const setPageSize = (width: number, height: number, label?: string, record = true) => {
    setPages((prev) => {
      if (record) {
        history.current = [...history.current.slice(-19), prev];
        future.current = [];
      }
      return prev.map((page) =>
        page.id === activePage.id
          ? { ...page, width: Math.max(120, Math.round(width)), height: Math.max(120, Math.round(height)), ...(label ? { name: label } : {}) }
          : page
      );
    });
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

  const aiCycle = designCycle[activePage.id];
  const hasAiDesign = aiCycle !== undefined;

  const applyAiDesign = () => {
    if (!items.length) return;
    const pageId = activePage.id;
    if (!designOriginals.current[pageId]) {
      designOriginals.current[pageId] = items.map((item) => ({ ...item }));
    }
    const next = ((designCycle[pageId] ?? -1) + 1) % 4;
    const original = designOriginals.current[pageId];
    commit(aiArrange(original, pageWidth, pageHeight, next));
    setDesignCycle((prev) => ({ ...prev, [pageId]: next }));
    setSelectedId(null);
    setEditingId(null);
  };

  const revertAiDesign = () => {
    const pageId = activePage.id;
    const original = designOriginals.current[pageId];
    if (!original) return;
    commit(original.map((item) => ({ ...item })));
    delete designOriginals.current[pageId];
    setDesignCycle((prev) => {
      const next = { ...prev };
      delete next[pageId];
      return next;
    });
    setSelectedId(null);
    setEditingId(null);
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

  const replaceSelectedImage = (file: File) => {
    if (!selected || selected.type !== 'image') return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      if (!src) return;
      void addAsset({
        name: file.name || 'Image',
        kind: 'image',
        mime: file.type || 'image/png',
        size: file.size,
        dataUrl: src,
        source: 'canvas',
      });
      commit(items.map((item) => (item.id === selected.id ? { ...item, src, label: item.label || 'Image' } : item)));
    };
    reader.readAsDataURL(file);
  };

  /** Turn a blank rectangle into the element chosen from the quick-insert grid. */
  const convertBox = (
    item: CanvasItem,
    type: CanvasItemType,
    variant: string,
    label: string
  ) => {
    commit(
      items.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              type,
              variant,
              label,
              fill: type === 'image' || type === 'chart' || type === 'table' ? undefined : entry.fill,
            }
          : entry
      )
    );
    setSelectedId(item.id);
    if (type === 'text' || type === 'heading') setEditingId(item.id);
  };

  const insertImageIntoBox = (file: File) => {
    const targetId = insertTargetRef.current;
    if (!targetId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      if (!src) return;
      void addAsset({
        name: file.name || 'Image',
        kind: 'image',
        mime: file.type || 'image/png',
        size: file.size,
        dataUrl: src,
        source: 'canvas',
      });
      commit(
        items.map((entry) =>
          entry.id === targetId
            ? { ...entry, type: 'image' as const, variant: 'image-rounded', src, label: entry.label === 'Box' ? 'Image' : entry.label }
            : entry
        )
      );
      insertTargetRef.current = null;
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
        if (target) {
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
      const screenDx = event.clientX - drag.startX;
      const screenDy = event.clientY - drag.startY;
      // A tap often includes 1â€“2px of finger/mouse jitter. Treat that as a
      // tap, not a drag, so a second tap can put the caret inside the text.
      if (!drag.moved && Math.hypot(screenDx, screenDy) < 3) return;
      const dx = screenDx / zoom;
      const dy = screenDy / zoom;
      const origin = drag.origin;
      drag.moved = true;
      draggedRef.current = true;
      if (drag.mode === 'move') {
        update(drag.id, {
          x: clamp(Math.round(origin.x + dx), 0, Math.max(0, pageWidth - origin.w)),
          y: clamp(Math.round(origin.y + dy), 0, Math.max(0, pageHeight - origin.h)),
        });
      } else {
        const dir = drag.handle || 'se';
        let x = origin.x;
        let y = origin.y;
        let w = origin.w;
        let h = origin.h;

        const baseSize = origin.fontSize ?? DEFAULT_FONT_SIZE[origin.type];
        const minHeight = Math.max(16, Math.round(baseSize * 1.15));
        if (dir.includes('e')) w = clamp(Math.round(origin.w + dx), 24, pageWidth - origin.x);
        if (dir.includes('w')) {
          w = clamp(Math.round(origin.w - dx), 24, origin.x + origin.w);
          x = origin.x + (origin.w - w);
        }
        if (dir.includes('s')) h = clamp(Math.round(origin.h + dy), minHeight, pageHeight - origin.y);
        if (dir.includes('n')) {
          h = clamp(Math.round(origin.h - dy), minHeight, origin.y + origin.h);
          y = origin.y + (origin.h - h);
        }

        const patch: Partial<CanvasItem> = { x, y, w, h };
        // Component labels scale with the box so resizing a picture or card
        // keeps its caption in proportion. Paragraph and heading boxes keep
        // their type size so body copy is not distorted.
        if (
          (w !== origin.w || h !== origin.h) &&
          origin.type !== 'text' &&
          origin.type !== 'heading' &&
          origin.w > 0 &&
          origin.h > 0
        ) {
          const base = origin.fontSize ?? DEFAULT_FONT_SIZE[origin.type];
          const ratio = Math.max(w / origin.w, h / origin.h);
          patch.fontSize = clamp(Math.round(base * ratio), 8, 200);
        }
        update(drag.id, patch);
      }
    };
    const onUp = () => {
      const drag = dragRef.current;
      if (drag?.moved) {
        history.current = [...history.current.slice(-19), drag.before];
        future.current = [];
      }
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [zoom, pageWidth, pageHeight]);

  const startDrag = (
    event: React.MouseEvent,
    item: CanvasItem,
    mode: 'move' | 'resize',
    handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | '' = ''
  ) => {
    if (preview || editingId === item.id || event.button !== 0 || spaceHeldRef.current) return;
    event.stopPropagation();
    draggedRef.current = false;
    setSelectedId(item.id);
    dragRef.current = {
      id: item.id,
      mode,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...item },
      before: pages,
      moved: false,
    };
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
    if (viewOnly) return;
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

  /**
   * Zoom around a point in the viewport. Used by the âˆ’/+ buttons, the zoom
   * menu, keyboard shortcuts and trackpad pinch (ctrl/meta + wheel).
   */
  const applyZoom = useCallback(
    (next: number, clientX?: number, clientY?: number) => {
      const el = viewportRef.current;
      const art = artboardRef.current;
      const target = clamp(next, 0.1, 4);
      zoomRef.current = target;
      if (!el || !art) {
        setZoom(target);
        return;
      }

      const artRect = art.getBoundingClientRect();
      const viewRect = el.getBoundingClientRect();
      const center = clientX == null || clientY == null;
      const cx = clientX ?? viewRect.left + el.clientWidth / 2;
      const cy = clientY ?? viewRect.top + el.clientHeight / 2;
      const px = artRect.width ? (cx - artRect.left) / artRect.width : 0.5;
      const py = artRect.height ? (cy - artRect.top) / artRect.height : 0.5;

      setZoom(target);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const nextArt = artboardRef.current;
          if (!nextArt) return;
          if (center) {
            // Button/zoom-menu changes should always bring the whole page back
            // into view instead of preserving an off-screen scrolled point.
            el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
            el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
            return;
          }
          const nextRect = nextArt.getBoundingClientRect();
          el.scrollLeft += nextRect.left + px * nextRect.width - cx;
          el.scrollTop += nextRect.top + py * nextRect.height - cy;
        });
      });
    },
    []
  );

  const zoomStep = (direction: number) =>
    applyZoom(zoom * (direction > 0 ? 1.15 : 1 / 1.15));

  const fitToScreen = () => {
    const el = viewportRef.current;
    const width = el ? el.clientWidth : window.innerWidth - 700;
    const height = el ? el.clientHeight : window.innerHeight - 180;
    const next = clamp(
      Math.min((width - 96) / pageWidth, (height - 96) / pageHeight),
      0.1,
      2
    );
    applyZoom(next);
  };

  const minimiseCanvas = () => applyZoom(0.15);

  // Preview should always open on a fully visible page, independent of the
  // zoom/scroll the user left the editor in.
  useEffect(() => {
    if (!preview) return;
    const timer = window.setTimeout(() => fitToScreen(), 60);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, activePageId]);

  // Keep the current page in the middle of the viewport after a reload or a
  // page switch, even when the user left a large frame at a small zoom.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
      el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activePageId]);

  const startPan = (event: React.MouseEvent) => {
    const el = viewportRef.current;
    const wantsPan = event.button === 1 || (event.button === 0 && spaceHeldRef.current);
    if (!el || !wantsPan) return;
    event.preventDefault();
    event.stopPropagation();
    suppressCanvasClick.current = true;
    panRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: el.scrollLeft,
      top: el.scrollTop,
    };
    setPanning(true);
  };

  useEffect(() => {
    try {
      localStorage.setItem('vector_editor_zoom_v1', String(zoom));
    } catch {
      // ignore
    }
  }, [zoom]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * 0.0015);
      applyZoom(zoomRef.current * factor, event.clientX, event.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          target.isContentEditable ||
          Boolean(target.closest('button, a, [role="button"]')));

      if (event.code === 'Space' && !typing) {
        event.preventDefault();
        spaceHeldRef.current = true;
        setSpaceHeld(true);
      }
      if (!(event.ctrlKey || event.metaKey) || typing) return;

      if (event.key === '0') {
        event.preventDefault();
        applyZoom(1);
      } else if (event.key === '1') {
        event.preventDefault();
        fitToScreen();
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomStep(1);
      } else if (event.key === '-') {
        event.preventDefault();
        zoomStep(-1);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        spaceHeldRef.current = false;
        setSpaceHeld(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [zoom, pageWidth, pageHeight, applyZoom]);

  useEffect(() => {
    const move = (event: MouseEvent) => {
      const pan = panRef.current;
      const el = viewportRef.current;
      if (!pan || !el) return;
      el.scrollLeft = pan.left - (event.clientX - pan.x);
      el.scrollTop = pan.top - (event.clientY - pan.y);
    };
    const up = () => {
      if (!panRef.current) return;
      panRef.current = null;
      setPanning(false);
      window.setTimeout(() => {
        suppressCanvasClick.current = false;
      }, 0);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  const startFrameResize = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = pageWidth;
    const startH = pageHeight;
    const before = pages;
    let changed = false;
    const move = (moveEvent: MouseEvent) => {
      const nextW = clamp(Math.round(startW + (moveEvent.clientX - startX) / zoom), 320, 3000);
      const nextH = clamp(Math.round(startH + (moveEvent.clientY - startY) / zoom), 240, 3000);
      if (nextW !== startW || nextH !== startH) changed = true;
      // Record one history entry for the whole drag, on mouse-up.
      setPageSize(nextW, nextH, undefined, false);
    };
    const up = () => {
      if (changed) {
        history.current = [...history.current.slice(-19), before];
        future.current = [];
      }
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
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
      className="fixed inset-0 z-[60] flex flex-col bg-[#08090A] text-white"
      style={{ right: rightOffset, transition: 'right 200ms ease' }}
    >
      {/* Top bar */}
      <header className="h-12 shrink-0 flex items-center gap-2 px-2 border-b border-white/10 bg-[#0F1011]">
        <button type="button" onClick={onExit} className="w-8 h-8 rounded-md grid place-items-center text-white/60 hover:text-white hover:bg-white/10" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-6 h-6 rounded-md shrink-0" style={{ backgroundImage: 'linear-gradient(135deg,#5E6AD2,#828FFF)' }} />
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
            readOnly={viewOnly}
            aria-readonly={viewOnly}
            className="bg-transparent text-[12.5px] font-semibold outline-none border-b border-transparent focus:border-white/25 min-w-[120px] max-w-[240px] read-only:focus:border-transparent"
          />
          {viewOnly && (
            <span className="rounded-full border border-[#6ea8fe]/30 bg-[#6ea8fe]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#9cc4ff]">
              View only
            </span>
          )}
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
                  className="w-6 h-6 rounded-full border-2 border-[#0F1011] grid place-items-center text-[9px] font-semibold text-white"
                  style={{ background: peer!.colour }}
                  title={`${peer!.name}${peer!.id === me?.id ? ' (you)' : ''}`}
                >
                  {peer!.name.slice(0, 2).toUpperCase()}
                </span>
              ))}
            {peers.length > 3 && (
              <span className="w-6 h-6 rounded-full border-2 border-[#0F1011] bg-[#383838] grid place-items-center text-[8.5px] font-semibold text-white/70">
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
            onClick={() => {
              setInspectorOpen((value) => {
                const next = !value;
                // On a narrow window only one side panel can fit.
                if (next && window.innerWidth < 1000) setPanelOpen(false);
                return next;
              });
            }}
            className={`w-8 h-8 rounded-md grid place-items-center ${
              inspectorOpen ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/10'
            }`}
            title={inspectorOpen ? 'Hide inspector' : 'Show inspector'}
            aria-label={inspectorOpen ? 'Hide inspector' : 'Show inspector'}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <div className="relative hidden sm:block">
            <div className="flex h-7 items-center overflow-hidden rounded-md border border-white/10 bg-[#333]">
              <button
                type="button"
                onClick={() => zoomStep(-1)}
                className="grid h-7 w-7 place-items-center text-white/60 hover:bg-white/10"
                title="Zoom out (Ctrl/âŒ˜ âˆ’)"
              >
                <Minus className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setZoomMenuOpen((value) => !value)}
                className="h-7 px-1.5 text-[11px] font-medium tabular-nums text-white/80 hover:bg-white/10"
                title="Canvas size"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => zoomStep(1)}
                className="grid h-7 w-7 place-items-center text-white/60 hover:bg-white/10"
                title="Zoom in (Ctrl/âŒ˜ +)"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={fitToScreen}
                className="grid h-7 w-7 place-items-center border-l border-white/10 text-white/60 hover:bg-white/10"
                title="Fit to screen (Ctrl/âŒ˜ 1)"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </div>

            {zoomMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setZoomMenuOpen(false)}
                  aria-label="Close canvas size menu"
                />
                <div className="absolute right-0 top-9 z-50 w-60 rounded-xl border border-white/10 bg-[#0F1011] p-3 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      Canvas size
                    </span>
                    <span className="text-[10px] tabular-nums text-white/55">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={400}
                    step={5}
                    value={Math.round(zoom * 100)}
                    onChange={(event) => applyZoom(Number(event.target.value) / 100)}
                    className="mt-2 w-full accent-[#0D99FF]"
                    aria-label="Canvas zoom"
                  />
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {[25, 50, 75, 100, 150, 200].map((percent) => (
                      <button
                        key={percent}
                        type="button"
                        onClick={() => applyZoom(percent / 100)}
                        className={`h-6 rounded text-[10px] font-semibold ${
                          Math.round(zoom * 100) === percent
                            ? 'bg-[#0D99FF] text-white'
                            : 'bg-[#383838] text-white/65 hover:bg-white/15'
                        }`}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={fitToScreen}
                      className="flex h-7 items-center justify-center gap-1 rounded bg-[#383838] text-[10px] font-semibold text-white/70 hover:bg-white/15"
                      title="Fit to screen"
                    >
                      <Maximize2 className="h-3 w-3" /> Fit
                    </button>
                    <button
                      type="button"
                      onClick={() => applyZoom(1)}
                      className="h-7 rounded bg-[#383838] text-[10px] font-semibold text-white/70 hover:bg-white/15"
                      title="Actual size"
                    >
                      100%
                    </button>
                    <button
                      type="button"
                      onClick={minimiseCanvas}
                      className="flex h-7 items-center justify-center gap-1 rounded bg-[#383838] text-[10px] font-semibold text-white/70 hover:bg-white/15"
                      title="Minimise canvas"
                    >
                      <Minimize2 className="h-3 w-3" /> Min
                    </button>
                  </div>
                  <p className="mt-2 text-[9px] leading-relaxed text-white/35">
                    Ctrl/âŒ˜ + scroll or pinch to zoom. Space or middle-drag to pan.
                  </p>
                </div>
              </>
            )}
          </div>

          {!viewOnly && (
            <button
              type="button"
              onClick={() => figmaRef.current?.click()}
              className="hidden lg:inline-flex h-8 whitespace-nowrap px-2.5 rounded-md text-[11.5px] font-semibold text-white/75 hover:bg-white/10 items-center gap-1.5"
              title="Import a Figma JSON export"
            >
              <Frame className="w-3.5 h-3.5" /> Import Figma
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAssistant}
            className="h-8 whitespace-nowrap px-2.5 rounded-md text-[11.5px] font-semibold text-white/75 hover:bg-white/10 inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B9A8FF]" /> Ask AI
          </button>
          {!viewOnly && (
            <button type="button" onClick={save} className="h-8 whitespace-nowrap px-3 rounded-md text-[11.5px] font-semibold text-white/80 hover:bg-white/10 hidden sm:inline-flex items-center">
              {saved ? 'Saved' : 'Save'}
            </button>
          )}
          {!viewOnly && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setWorkspaceMenu((open) => !open)}
              className="h-8 whitespace-nowrap rounded-md border border-white/15 px-2.5 text-[11.5px] font-semibold text-white/80 hover:bg-white/10 inline-flex items-center gap-1"
              aria-expanded={workspaceMenu}
            >
              Workspace <ChevronDown className="w-3 h-3" />
            </button>

            {workspaceMenu && (
              <>
                <div className="fixed inset-0 z-[38]" onClick={() => setWorkspaceMenu(false)} aria-hidden="true" />
                <div className="absolute right-0 top-9 z-[39] w-[220px] rounded-lg border border-white/10 bg-[#333] p-1.5 shadow-[0_24px_50px_-20px_rgba(0,0,0,.9)]">
                  {[
                    { label: 'Share and invite', action: openShare },
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
          )}

          {!viewOnly && (
            <>
              <button
                type="button"
                onClick={() => setBuildOpen(true)}
                className="h-8 whitespace-nowrap rounded-md px-3.5 text-[11.5px] font-semibold text-white"
                style={{ backgroundImage: 'linear-gradient(135deg,#5E6AD2,#828FFF)' }}
              >
                Generate
              </button>
              <button
                type="button"
                onClick={openShare}
                className="h-8 whitespace-nowrap rounded-md border border-white/20 px-3 text-[11.5px] font-semibold text-white/85 hover:bg-white/5"
              >
                Share
              </button>
            </>
          )}
        </div>
      </header>

      {viewOnly && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 top-12 z-[70] cursor-default"
            aria-hidden="true"
            onContextMenu={(event) => event.preventDefault()}
          />
          <div className="pointer-events-none fixed left-1/2 top-14 z-[71] -translate-x-1/2 rounded-full border border-[#6ea8fe]/30 bg-[#101113]/95 px-3 py-1.5 text-[10.5px] font-semibold text-[#9cc4ff] shadow-lg backdrop-blur">
            View only · changes from the editor appear live
          </div>
        </>
      )}

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
        ref={replaceImageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) replaceSelectedImage(file);
          event.target.value = '';
        }}
      />

      <input
        ref={insertImageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) insertImageIntoBox(file);
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
        {!preview && (
        <nav className="w-[64px] shrink-0 border-r border-white/10 bg-[#0F1011] flex flex-col items-center pt-2 gap-0.5">
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
                  if (window.innerWidth < 1000) setInspectorOpen(false);
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
        )}

        {/* Assets panel */}
        {!preview && (
        <aside
          className={`shrink-0 border-r border-white/10 bg-[#0F1011] flex flex-col min-h-0 overflow-hidden transition-[width] duration-200 ${
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
                {category && !showingSearch
                ? category
                : panel === 'pages'
                  ? 'Pages'
                  : panel === 'apps'
                    ? 'Apps'
                    : panel === 'text'
                      ? 'Text'
                      : panel === 'templates'
                        ? 'Templates'
                        : 'Assets'}
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
                          <span className="rounded bg-[#FFC53D]/20 px-1 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-[#FFC53D]">
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
                <button
                  type="button"
                  onClick={() => onNavigate?.('templates')}
                  className="mb-3 flex w-full items-center justify-between rounded-lg border border-[#7C5CFF]/40 bg-[#7C5CFF]/10 px-2.5 py-2 text-left hover:bg-[#7C5CFF]/20"
                >
                  <span>
                    <span className="block text-[10.5px] font-semibold text-white/85">Browse the full library</span>
                    <span className="block text-[9px] text-white/40">Large previews, pages and exact filled attributes</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#B9A8FF]" />
                </button>
                <p className="mb-1 text-[10.5px] font-medium text-white/45">Start from a size</p>
                {CONTENT_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addContentCategory(item)}
                    className="flex w-full items-center gap-3 rounded-lg py-2.5 text-left transition-colors hover:bg-white/5"
                  >
                    <span
                      className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-lg text-[18px] font-semibold text-white ring-1 ring-white/10"
                      style={{ backgroundImage: 'linear-gradient(140deg,#5E6AD2,#828FFF)' }}
                    >
                      {item.name[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium text-white/90">{item.name}</span>
                      <span className="block text-[10px] text-white/40">
                        {item.width}Ã—{item.height}
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

            {/* Pages: real thumbnails of each canvas page */}
            {!showingSearch && !category && panel === 'pages' && (
              <div className="pt-1">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10.5px] font-medium text-white/45">Pages</p>
                  <button
                    type="button"
                    onClick={() => setPagePickerOpen(true)}
                    className="flex h-6 items-center gap-1 rounded-lg border border-white/15 px-2 text-[9.5px] font-semibold text-white/70 hover:bg-white/10"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {pages.map((page, index) => {
                    const pageW = page.width || CANVAS_WIDTH;
                    const pageH = page.height || CANVAS_HEIGHT;
                    const scale = Math.min(104 / pageW, 68 / pageH);
                    return (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => {
                          setActivePageId(page.id);
                          setSelectedId(null);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg border p-1.5 text-left ${
                          page.id === activePage.id
                            ? 'border-[#0D99FF] bg-[#0D99FF]/10'
                            : 'border-white/10 bg-[#333] hover:bg-white/5'
                        }`}
                      >
                        <div
                          className="relative shrink-0 overflow-hidden rounded border border-white/15"
                          style={{ width: pageW * scale, height: pageH * scale, background: page.background || '#FFFFFF' }}
                        >
                          {page.items.slice(0, 18).map((item) => (
                            <span
                              key={item.id}
                              className="absolute"
                              style={{
                                left: item.x * scale,
                                top: item.y * scale,
                                width: Math.max(2, item.w * scale),
                                height: Math.max(2, item.h * scale),
                                background:
                                  item.type === 'text' || item.type === 'heading'
                                    ? item.color || '#0B0E14'
                                    : item.type === 'image'
                                      ? '#C9C4DA'
                                      : item.color || '#7C5CFF',
                                opacity: item.type === 'text' || item.type === 'heading' ? 0.55 : 0.82,
                                borderRadius: item.type === 'button' ? 2 : 1,
                              }}
                            />
                          ))}
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[10.5px] font-semibold text-white/80">
                            {index + 1}. {page.name}
                          </span>
                          <span className="block text-[9px] text-white/35">
                            {pageW}Ã—{pageH} Â· {page.items.length} element{page.items.length === 1 ? '' : 's'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="mb-2 mt-4 text-[10.5px] font-medium text-white/45">Start a new page</p>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_CATEGORIES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addContentCategory(item)}
                      className="rounded-lg border border-white/10 bg-[#333] p-2 text-left transition-colors hover:border-[#0D99FF] hover:bg-white/5"
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span className="truncate text-[10.5px] font-semibold text-white/85">{item.name}</span>
                        {item.premium && <Crown className="h-3 w-3 shrink-0 text-[#FFC53D]" />}
                      </span>
                      <span className="mt-0.5 block text-[8.5px] text-white/35">
                        {item.width}×{item.height}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Apps tab: the tools around the canvas */}
            {!showingSearch && !category && panel === 'apps' && (
              <div className="pt-1">
                <p className="mb-2 text-[10.5px] font-medium text-white/45">Apps & integrations</p>
                <div className="space-y-1.5">
                  {APPS.map((app) => {
                    const Icon = app.icon;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                          if (app.id === 'base44') setConnectOpen(true);
                          else if (app.id === 'figma') figmaRef.current?.click();
                          else if (app.url) window.open(app.url, '_blank', 'noopener,noreferrer');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg bg-[#383838] p-2 text-left transition-colors hover:bg-white/15"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-[#2C2C2C] text-white/70">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-semibold text-white/85">{app.name}</span>
                          <span className="block truncate text-[9.5px] text-white/40">{app.description}</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[9.5px] leading-relaxed text-white/30">
                  Connect the tools you already use. Nothing is sent anywhere until you open one.
                </p>
              </div>
            )}

            {/* Category list (Figma-style) */}
            {!showingSearch && !category && panel !== 'apps' && panel !== 'text' && panel !== 'templates' && panel !== 'pages' &&
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
                  <div key={variant.id} className="group relative">
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('application/x-vector-variant', variant.id);
                        event.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => addVariant(variant)}
                      className="w-full cursor-grab text-left active:cursor-grabbing"
                      title={`${variant.name} â€” drag onto the canvas`}
                    >
                      <div className="rounded-lg overflow-hidden ring-1 ring-white/10 group-hover:ring-[#0D99FF] p-1.5" style={{ background: '#383838' }}>
                        <div className="h-[86px]">
                          <Tile variant={variant} />
                        </div>
                      </div>
                      <span className="mt-1 block text-[10.5px] text-white/80 truncate">{variant.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewVariant(variant);
                      }}
                      className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-md bg-[#08090A]/85 text-white/70 opacity-70 transition-opacity hover:bg-[#0D99FF] hover:text-white hover:opacity-100"
                      title={`Preview ${variant.name}`}
                      aria-label={`Preview ${variant.name}`}
                    >
                      <Maximize2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showingSearch && searchResults.length === 0 && (
              <p className="py-6 text-center text-[11px] text-white/35">Nothing matches â€œ{query}â€.</p>
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
        )}

        {/* Canvas */}
        <main
          ref={viewportRef}
          onMouseDown={startPan}
          className={`flex-1 min-w-0 relative overflow-auto v-scroll bg-[#08090A] ${
            panning ? 'cursor-grabbing' : spaceHeld ? 'cursor-grab' : ''
          }`}
          onClick={() => {
            if (suppressCanvasClick.current) {
              suppressCanvasClick.current = false;
              return;
            }
            setSelectedId(null);
          }}
        >
          {preview && (
            <div className="pointer-events-auto absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-[#252525]/95 px-3 py-1.5 text-[11px] text-white/80 shadow-[0_12px_30px_-12px_rgba(0,0,0,.8)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
              <span className="font-semibold">Preview</span>
              <span className="text-white/35">Â·</span>
              <span className="max-w-[180px] truncate">{activePage.name}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setPreview(false);
                }}
                className="ml-1 rounded-full bg-[#e8e8ea] px-2.5 py-1 text-[10px] font-semibold text-[#08090a] hover:bg-white/90"
              >
                Back to edit
              </button>
            </div>
          )}
          <div className="flex min-h-full min-w-full p-12">
          <div className="relative m-auto shrink-0" style={{ width: pageWidth * zoom, height: pageHeight * zoom }}>
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
                animationDuration:
                  preview && activePage.transition && activePage.transition !== 'none'
                    ? `${activePage.transitionDuration ?? 350}ms`
                    : undefined,
              }}
              className={`relative shadow-[0_0_0_1px_rgba(255,255,255,.08),0_24px_60px_-20px_rgba(0,0,0,.8)] ${
                preview ? `v-page-${activePage.transition || 'none'}` : ''
              }`}
            >
              <span className="absolute -top-6 left-0 text-[11px] text-white/40 select-none">{activePage?.name}</span>
              <span className="absolute -bottom-6 right-0 px-1.5 py-0.5 rounded bg-[#0D99FF] text-white text-[9.5px] font-medium">
                {pageWidth} Ã— {pageHeight}
              </span>

              {items.length === 0 && !preview && (
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center max-w-[420px]">
                    <span className="w-11 h-11 rounded-lg bg-black/5 grid place-items-center mx-auto">
                      <Plus className="w-5 h-5 text-black/25" />
                    </span>
                    <p className="mt-3 text-[14px] font-semibold text-black/60">Blank canvas</p>
                    <p className="mt-1 text-[12px] text-black/35">Drag an element from the left, or paste an image with âŒ˜V.</p>
                  </div>
                </div>
              )}

              {items.map((item) => {
                const variant = variantFor(item);
                const editing = editingId === item.id;
                const isSelected = selectedId === item.id && !preview;

                const animation = item.animation;
                const autoPlay =
                  preview && (animation?.trigger === 'load' || animation?.trigger === 'in-view');
                const tick =
                  (autoPlay ? previewTick : 0) + (itemTicks[item.id] || 0) + playAllTick;
                const shouldAnimate = Boolean(animation && tick > 0 && !editing);
                const animationClass = shouldAnimate ? `v-anim v-anim-${animation!.kind}` : '';
                const animationStyle = shouldAnimate
                  ? ({
                      '--v-anim-duration': `${animation!.duration}ms`,
                      '--v-anim-delay': `${animation!.delay}ms`,
                      '--v-anim-ease': ANIMATION_EASING[animation!.easing],
                      '--v-anim-distance': `${animation!.distance}px`,
                      animationIterationCount: animation!.repeat === 'once' ? 1 : 'infinite',
                      animationDirection:
                        animation!.repeat === 'ping-pong' ? 'alternate' : 'normal',
                    } as React.CSSProperties)
                  : undefined;
                const animationKey = `${item.id}-${tick}-${animation?.kind || 'none'}`;

                return (
                  <div
                    key={item.id}
                    onMouseDown={(event) => startDrag(event, item, 'move')}
                    onMouseEnter={() => {
                      if (preview && item.animation?.trigger === 'hover') playItem(item.id);
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (preview) {
                        if (item.animation?.trigger === 'click') playItem(item.id);
                        if (item.linkToPageId) setActivePageId(item.linkToPageId);
                        return;
                      }
                      // One tap only selects. Dragging moves, handles reshape,
                      // and a double-tap is the only way into text editing.
                      setSelectedId(item.id);
                      draggedRef.current = false;
                    }}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      if (!preview && canInlineEdit(item)) {
                        setEditingId(item.id);
                        setSelectedId(item.id);
                        setInspectorOpen(true);
                      }
                    }}
                    style={{
                      left: item.x,
                      top: item.y,
                      width: item.w,
                      height: item.h,
                      // Text and controls sit above cards/shapes so every field
                      // can be picked individually when they share one box.
                      zIndex:
                        item.type === 'text' || item.type === 'heading' || item.type === 'button' || item.type === 'badge' || item.type === 'input'
                          ? 6
                          : item.variant === 'shape-rect'
                            ? 1
                            : 3,
                    }}
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
                          fontSize: item.fontSize ?? DEFAULT_FONT_SIZE[item.type],
                          color: item.color || '#0B0E14',
                          fontWeight: item.fontWeight ?? DEFAULT_FONT_WEIGHT[item.type],
                          textAlign:
                            item.align ||
                            (item.type === 'button' || item.type === 'badge' || item.type === 'navbar'
                              ? 'center'
                              : 'left'),
                          paddingTop:
                            item.type === 'button' || item.type === 'badge' || item.type === 'navbar' || item.type === 'input'
                              ? Math.max(
                                  0,
                                  Math.round(
                                    (item.h - (item.fontSize ?? DEFAULT_FONT_SIZE[item.type]) * 1.2) / 2
                                  )
                                )
                              : 0,
                          fontFamily: item.fontFamily ? FONT_STACKS[item.fontFamily] : undefined,
                          fontStyle: item.italic ? 'italic' : undefined,
                          textDecoration: item.underline ? 'underline' : undefined,
                          letterSpacing: item.tracking != null ? `${item.tracking}px` : undefined,
                          lineHeight: 1.15,
                          paddingLeft: 0,
                          paddingRight: 0,
                          paddingBottom: 0,
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
                      <div
                        key={animationKey}
                        className={`h-full w-full ${animationClass}`}
                        style={animationStyle}
                      >
                        <StyledElement
                          style={variant.style}
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
                    )}

                    {item.variant === 'shape-rect' && !preview && !editing && (
                      <div className="absolute inset-0 overflow-hidden">
                        <span className="pointer-events-none absolute inset-2 rounded border border-dashed border-black/20" />
                        <button
                          type="button"
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            convertBox(item, 'text', 'text-body', 'Add text');
                          }}
                          className="absolute left-3 top-2 text-left text-[12px] font-medium text-black/45 hover:text-black/70"
                        >
                          â€¢ Click to add text
                        </button>

                        {isSelected && (
                          <div className="absolute inset-0 grid place-items-center" onMouseDown={(event) => event.stopPropagation()}>
                            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/95 p-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,.45)] ring-1 ring-black/5">
                              {[
                                { icon: ImageIcon, label: 'Insert image', action: () => { insertTargetRef.current = item.id; insertImageRef.current?.click(); } },
                                { icon: Type, label: 'Insert text', action: () => convertBox(item, 'text', 'text-body', 'Add text') },
                                { icon: MousePointer2, label: 'Insert button', action: () => convertBox(item, 'button', 'btn-solid', 'Action') },
                                { icon: Square, label: 'Insert card', action: () => convertBox(item, 'card', 'card-elevated', 'Card title') },
                                { icon: Table2, label: 'Insert table', action: () => convertBox(item, 'table', 'table-default', 'Orders') },
                                { icon: BarChart3, label: 'Insert chart', action: () => convertBox(item, 'chart', 'chart-bars', 'Revenue') },
                              ].map((tool) => {
                                const Icon = tool.icon;
                                return (
                                  <button
                                    key={tool.label}
                                    type="button"
                                    title={tool.label}
                                    aria-label={tool.label}
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      tool.action();
                                    }}
                                    className="grid h-8 w-8 place-items-center rounded-md bg-[#F4F3F8] text-[#4D7CFE] hover:bg-[#E8E6F5]"
                                  >
                                    <Icon className="h-4 w-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isSelected && !editing && (
                      <>
                        <span className="absolute inset-0 ring-[1.5px] ring-[#0D99FF] pointer-events-none" />
                        <span className="absolute -top-5 left-0 px-1 py-0.5 rounded-sm bg-[#0D99FF] text-white text-[9px] font-medium whitespace-nowrap">
                          {item.w} Ã— {item.h}
                        </span>
                        {([
                          { handle: 'nw' as const, position: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' },
                          { handle: 'n' as const, position: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize' },
                          { handle: 'ne' as const, position: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' },
                          { handle: 'e' as const, position: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
                          { handle: 'se' as const, position: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize' },
                          { handle: 's' as const, position: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize' },
                          { handle: 'sw' as const, position: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize' },
                          { handle: 'w' as const, position: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
                        ]).map((entry) => (
                          <span
                            key={entry.handle}
                            onMouseDown={(event) => startDrag(event, item, 'resize', entry.handle)}
                            onClick={(event) => event.stopPropagation()}
                            style={{
                              width: `${8 / zoom}px`,
                              height: `${8 / zoom}px`,
                              borderWidth: `${1 / zoom}px`,
                            }}
                            className={`absolute z-20 rounded-[1px] border border-[#0D99FF] bg-white ${entry.position}`}
                          />
                        ))}
                        {!editing && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(item.id);
                              setEditingId(item.id);
                            }}
                            className="absolute -top-6 right-7 w-5 h-5 rounded bg-[#0F1011] border border-white/15 grid place-items-center text-[#B9A8FF]"
                            aria-label="Edit text"
                            title="Edit text on canvas"
                          >
                            <Type className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            commit(items.filter((entry) => entry.id !== item.id));
                            setSelectedId(null);
                          }}
                          className="absolute -top-6 right-0 w-5 h-5 rounded bg-[#0F1011] border border-white/15 grid place-items-center text-white/70"
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

            {!preview && (
              <button
                type="button"
                onMouseDown={startFrameResize}
                onClick={(event) => event.stopPropagation()}
                className="absolute -bottom-1.5 -right-1.5 z-30 h-3 w-3 cursor-nwse-resize rounded-[2px] border border-[#0D99FF] bg-white"
                title={`Resize frame (${pageWidth} Ã— ${pageHeight})`}
                aria-label="Resize frame"
              />
            )}
          </div>
          </div>

          {/* Bottom dock: pages and tools wrap instead of overlapping. */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 flex-wrap items-end justify-center gap-2">
          <div data-spot="editor-pages" className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-[#0F1011] px-1.5 py-1.5 shadow-lg">
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
                title={`${page.name} Â· ${page.width || CANVAS_WIDTH}Ã—${page.height || CANVAS_HEIGHT}`}
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
          {!preview && (
          <div className="pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-xl border border-white/10 bg-[#0F1011] px-1.5 py-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,.8)]">
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
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); applyAiDesign(); }}
              title="AI design: arrange this page"
              className="flex h-8 items-center gap-1 rounded-md px-2 text-[10.5px] font-semibold text-[#C9BDFF] hover:bg-white/10"
            >
              <Sparkles className="h-3.5 w-3.5" /> Design
            </button>
            {hasAiDesign && (
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); revertAiDesign(); }}
                title="Revert to the layout you made"
                className="flex h-8 items-center gap-1 rounded-md border border-white/15 px-2 text-[10.5px] font-semibold text-white/70 hover:bg-white/10"
              >
                <Undo2 className="h-3.5 w-3.5" /> Revert
              </button>
            )}

            <span className="w-px h-5 bg-white/10 mx-1" />

            <button type="button" onClick={(event) => { event.stopPropagation(); undo(); }} title="Undo (Ctrl/âŒ˜ Z)" className="w-8 h-8 rounded-md grid place-items-center text-white/60 hover:bg-white/10">
              <Undo2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); redo(); }} title="Redo (Ctrl/âŒ˜ Shift Z)" className="w-8 h-8 rounded-md grid place-items-center text-white/60 hover:bg-white/10">
              <Redo2 className="w-4 h-4" />
            </button>

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
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(selected.id);
                    setEditingId(selected.id);
                  }}
                  title="Edit text on canvas (Enter)"
                  className="flex h-8 items-center gap-1 rounded-md px-2 text-[10px] font-semibold text-[#C9BDFF] hover:bg-white/10"
                >
                  <Type className="w-3.5 h-3.5" /> Edit text
                </button>
                <button type="button" onClick={(event) => { event.stopPropagation(); duplicateSelected(); }} title="Duplicate" className="w-8 h-8 rounded-md grid place-items-center text-white/60 hover:bg-white/10">
                  <Copy className="w-4 h-4" />
                </button>
                <button type="button" onClick={(event) => { event.stopPropagation(); removeSelected(); }} title="Delete" className="w-8 h-8 rounded-md grid place-items-center text-[#FF8A8A] hover:bg-white/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : null}
          </div>
          )}
          </div>

          {!preview && (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onOpenAssistant?.(); }}
            className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-[#0F1011] border border-white/10 grid place-items-center text-white/60 hover:text-white shadow-lg"
            aria-label="Help"
          >
            <CircleHelp className="w-4 h-4" />
          </button>
          )}
        </main>

        {/* Inspector */}
        {inspectorOpen && !preview && (
        <aside ref={inspectorRef} data-spot="editor-inspector" className="w-[286px] shrink-0 border-l border-white/10 bg-[#0F1011] flex flex-col min-h-0 overflow-y-auto v-scroll">
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
              onClick={() => {
                setEditingId(null);
                setInspectorTab('prototype');
              }}
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
                {(activePage.transition || 'none') !== 'none' && (
                  <label className="flex items-center gap-2">
                    <span className="w-14 text-[10.5px] text-white/45">Duration</span>
                    <input
                      type="range"
                      min={150}
                      max={1200}
                      step={50}
                      value={activePage.transitionDuration ?? 350}
                      onChange={(event) =>
                        setPages((prev) =>
                          prev.map((page) =>
                            page.id === activePage.id
                              ? { ...page, transitionDuration: Number(event.target.value) }
                              : page
                          )
                        )
                      }
                      className="flex-1 accent-[#0D99FF]"
                    />
                    <span className="w-10 text-right text-[10px] text-white/55">
                      {activePage.transitionDuration ?? 350}ms
                    </span>
                  </label>
                )}
                <p className="text-[9.5px] leading-relaxed text-white/35">
                  Applied when a click lands on this page in Preview. Press â–¶ in the top bar to try it.
                </p>
              </Section>

              <Section title="Interaction">
                {selected ? (
                  <>
                    <p className="text-[10.5px] text-white/55">
                      On click, â€œ{selected.label}â€ should go to:
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
                    <p className="text-[9.5px] leading-relaxed text-white/35">
                      For click copy and a list of behaviour comments, use Design â†’ Behaviour.
                    </p>
                  </>
                ) : (
                  <p className="text-[10.5px] leading-relaxed text-white/45">
                    Select an element on the canvas to give it a click target.
                  </p>
                )}
              </Section>

              <Section
                title="Animation"
                action={
                  <>
                    <button
                      type="button"
                      onClick={() => setPreview(true)}
                      className="flex h-6 items-center gap-1 rounded bg-[#0D99FF] px-2 text-[9.5px] font-semibold text-white hover:bg-[#0b8ae6]"
                      title="Open preview and play the animations"
                    >
                      <Play className="w-2.5 h-2.5" /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={playAll}
                      className="flex h-6 items-center gap-1 rounded bg-[#383838] px-2 text-[9.5px] font-semibold text-white/70 hover:bg-white/15"
                    >
                      Play all
                    </button>
                  </>
                }
              >
                {selected ? (
                  <>
                    {reducedMotion && (
                      <p className="rounded-md bg-[#FFC53D]/10 px-2 py-1.5 text-[9.5px] leading-relaxed text-[#FFC53D]">
                        Reduced motion is enabled in this browser or operating system, so previews are suppressed. Turn it off to see the animation.
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => update(selected.id, { animation: undefined })}
                        className={`h-7 rounded text-[10px] font-semibold ${
                          !selected.animation
                            ? 'bg-[#0D99FF] text-white'
                            : 'bg-[#383838] text-white/65'
                        }`}
                      >
                        None
                      </button>
                      {ANIMATION_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          title={preset.hint}
                          onClick={() => {
                            const current = selected.animation;
                            setEditingId(null);
                            update(selected.id, {
                              animation: current
                                ? { ...current, kind: preset.id }
                                : DEFAULT_ANIMATION(preset.id),
                            });
                            playItem(selected.id);
                          }}
                          className={`h-7 rounded text-[10px] font-semibold ${
                            selected.animation?.kind === preset.id
                              ? 'bg-[#0D99FF] text-white'
                              : 'bg-[#383838] text-white/65'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>

                    {selected.animation && (
                      <>
                        <div>
                          <p className="mb-1 text-[10px] text-white/45">Trigger</p>
                          <div className="grid grid-cols-2 gap-1">
                            {ANIMATION_TRIGGERS.map((trigger) => (
                              <button
                                key={trigger.id}
                                type="button"
                                onClick={() =>
                                  update(selected.id, {
                                    animation: {
                                      ...selected.animation!,
                                      trigger: trigger.id,
                                    },
                                  })
                                }
                                className={`h-7 rounded text-[10px] font-semibold ${
                                  selected.animation!.trigger === trigger.id
                                    ? 'bg-[#0D99FF] text-white'
                                    : 'bg-[#383838] text-white/65'
                                }`}
                              >
                                {trigger.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <label className="flex items-center gap-2">
                          <span className="w-14 text-[10.5px] text-white/45">Duration</span>
                          <input
                            type="range"
                            min={100}
                            max={2000}
                            step={50}
                            value={selected.animation.duration}
                            onChange={(event) =>
                              update(selected.id, {
                                animation: {
                                  ...selected.animation!,
                                  duration: Number(event.target.value),
                                },
                              })
                            }
                            className="flex-1 accent-[#0D99FF]"
                          />
                          <span className="w-10 text-right text-[10px] text-white/55">
                            {selected.animation.duration}ms
                          </span>
                        </label>

                        <label className="flex items-center gap-2">
                          <span className="w-14 text-[10.5px] text-white/45">Delay</span>
                          <input
                            type="range"
                            min={0}
                            max={2000}
                            step={50}
                            value={selected.animation.delay}
                            onChange={(event) =>
                              update(selected.id, {
                                animation: {
                                  ...selected.animation!,
                                  delay: Number(event.target.value),
                                },
                              })
                            }
                            className="flex-1 accent-[#0D99FF]"
                          />
                          <span className="w-10 text-right text-[10px] text-white/55">
                            {selected.animation.delay}ms
                          </span>
                        </label>

                        <label className="flex items-center gap-2">
                          <span className="w-14 text-[10.5px] text-white/45">Easing</span>
                          <select
                            value={selected.animation.easing}
                            onChange={(event) =>
                              update(selected.id, {
                                animation: {
                                  ...selected.animation!,
                                  easing: event.target.value as ElementAnimation['easing'],
                                },
                              })
                            }
                            className="h-7 flex-1 rounded bg-[#383838] px-2 text-[10.5px] text-white outline-none"
                          >
                            <option value="ease-out">Ease out</option>
                            <option value="ease">Ease</option>
                            <option value="ease-in">Ease in</option>
                            <option value="ease-in-out">Ease in out</option>
                            <option value="linear">Linear</option>
                            <option value="spring">Spring</option>
                          </select>
                        </label>

                        {[
                          'slide-up',
                          'slide-down',
                          'slide-left',
                          'slide-right',
                          'bounce',
                          'float',
                        ].includes(selected.animation.kind) && (
                          <label className="flex items-center gap-2">
                            <span className="w-14 text-[10.5px] text-white/45">Distance</span>
                            <input
                              type="range"
                              min={8}
                              max={160}
                              step={4}
                              value={selected.animation.distance}
                              onChange={(event) =>
                                update(selected.id, {
                                  animation: {
                                    ...selected.animation!,
                                    distance: Number(event.target.value),
                                  },
                                })
                              }
                              className="flex-1 accent-[#0D99FF]"
                            />
                            <span className="w-10 text-right text-[10px] text-white/55">
                              {selected.animation.distance}px
                            </span>
                          </label>
                        )}

                        <label className="flex items-center gap-2">
                          <span className="w-14 text-[10.5px] text-white/45">Repeat</span>
                          <select
                            value={selected.animation.repeat}
                            onChange={(event) =>
                              update(selected.id, {
                                animation: {
                                  ...selected.animation!,
                                  repeat: event.target.value as ElementAnimation['repeat'],
                                },
                              })
                            }
                            className="h-7 flex-1 rounded bg-[#383838] px-2 text-[10.5px] text-white outline-none"
                          >
                            <option value="once">Once</option>
                            <option value="loop">Loop</option>
                            <option value="ping-pong">Ping-pong</option>
                          </select>
                        </label>

                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              playItem(selected.id);
                            }}
                            className="flex h-7 flex-1 items-center justify-center gap-1 rounded bg-[#0D99FF] text-[10.5px] font-semibold text-white"
                          >
                            <Play className="w-3 h-3" /> Play
                          </button>
                          <button
                            type="button"
                            onClick={() => update(selected.id, { animation: undefined })}
                            className="h-7 px-2 rounded border border-white/10 text-[10.5px] text-white/60 hover:bg-white/10"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-[9.5px] leading-relaxed text-white/35">
                          Click Preview to play in the full canvas. Hover/click triggers replay there,
                          â€œIn viewâ€ plays when the page appears, and reduced-motion is respected.
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-[10.5px] leading-relaxed text-white/45">
                    Select an element to add an entrance or attention animation.
                  </p>
                )}
              </Section>
            </>
          )}

          {inspectorTab === 'design' && (
            <>
          {!selected && (
            <>
          <Section title="AI layout">
            <p className="text-[10px] leading-relaxed text-white/40">
              Let Vector arrange this page. Click Design again for a different arrangement.
            </p>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={applyAiDesign}
                disabled={!items.length}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-[#7C5CFF] text-[11px] font-semibold text-white hover:bg-[#6a4de8] disabled:opacity-30"
              >
                <Sparkles className="h-3.5 w-3.5" /> Design
              </button>
              {hasAiDesign && (
                <button
                  type="button"
                  onClick={revertAiDesign}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-white/15 px-3 text-[11px] font-semibold text-white/75 hover:bg-white/10"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Revert
                </button>
              )}
            </div>
            {hasAiDesign && (
              <p className="mt-1.5 text-[9.5px] text-[#B9A8FF]">
                Layout {(aiCycle ?? 0) + 1} of 4 Â· your original layout is saved.
              </p>
            )}
          </Section>

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
                âŸ³
              </button>
              <button
                type="button"
                onClick={fitToScreen}
                className="h-7 rounded bg-[#0D99FF] px-2 text-[10px] font-semibold text-white hover:bg-[#0b8ae6]"
                title="Fit this page to the viewport"
              >
                Fit
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
                              <span className="text-white/35 tabular-nums">{device.width}Ã—{device.height}</span>
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

          <Section title="Page background">
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
            <p className="text-[9.5px] leading-relaxed text-white/30">
              Click empty canvas to return here. Select any element to edit only its own controls.
            </p>
          </Section>
            </>
          )}

          {selected && !preview && (
            <>
              <div className="flex items-center gap-1 border-b border-white/8 px-3 py-2 text-[10.5px]">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded px-1.5 py-0.5 font-medium text-white/45 hover:bg-white/10 hover:text-white"
                >
                  Page
                </button>
                <ChevronRight className="h-3 w-3 text-white/25" />
                <span className="min-w-0 flex-1 truncate font-semibold text-white/85">
                  {TYPE_LABEL[selected.type]} Â· {variantFor(selected).name}
                </span>
                <button type="button" onClick={duplicateSelected} className="grid h-6 w-6 place-items-center rounded text-white/45 hover:bg-white/10" aria-label="Duplicate">
                  <Copy className="h-3 w-3" />
                </button>
                <button type="button" onClick={removeSelected} className="grid h-6 w-6 place-items-center rounded text-[#FF8A8A] hover:bg-white/10" aria-label="Delete">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              <Section title="Text">
                {selectedIsText ? (
                  <textarea
                    value={selected.label}
                    onChange={(event) => update(selected.id, { label: event.target.value })}
                    rows={2}
                    className="w-full resize-none rounded-md bg-[#383838] px-2 py-1.5 text-[11.5px] leading-relaxed outline-none focus:ring-1 focus:ring-[#0D99FF]"
                    aria-label="Text content"
                  />
                ) : (
                  <input
                    value={selected.label}
                    onChange={(event) => update(selected.id, { label: event.target.value })}
                    className="h-7 w-full rounded-md bg-[#383838] px-2 text-[11.5px] outline-none focus:ring-1 focus:ring-[#0D99FF]"
                    aria-label="Label"
                  />
                )}

                <div className="mt-2 flex items-center gap-1.5">
                  <span className="w-12 text-[10.5px] text-white/45">Size</span>
                  <button
                    type="button"
                    onClick={() => changeFontSize(currentFontSize - 1)}
                    className="grid h-7 w-7 place-items-center rounded bg-[#383838] text-white/70 hover:bg-white/15"
                    aria-label="Decrease text size"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={6}
                    max={200}
                    value={currentFontSize}
                    onChange={(event) => changeFontSize(Number(event.target.value) || currentFontSize)}
                    className="h-7 w-14 rounded bg-[#383838] px-1.5 text-center text-[11px] tabular-nums outline-none focus:ring-1 focus:ring-[#0D99FF]"
                    aria-label="Text size"
                  />
                  <button
                    type="button"
                    onClick={() => changeFontSize(currentFontSize + 1)}
                    className="grid h-7 w-7 place-items-center rounded bg-[#383838] text-white/70 hover:bg-white/15"
                    aria-label="Increase text size"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[9.5px] text-white/35">px</span>
                </div>

                <div className="mt-1 grid grid-cols-4 gap-1">
                  {TEXT_SIZE_PRESETS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => changeFontSize(size)}
                      className={`h-6 rounded text-[10px] font-semibold tabular-nums ${
                        Math.round(currentFontSize) === size
                          ? 'bg-[#0D99FF] text-white'
                          : 'bg-[#383838] text-white/55 hover:bg-white/15'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="w-12 text-[10.5px] text-white/45">Weight</span>
                  {[400, 600, 800].map((weight) => (
                    <button
                      key={weight}
                      type="button"
                      onClick={() => update(selected.id, { fontWeight: weight })}
                      className={`h-7 flex-1 rounded text-[9.5px] font-semibold ${
                        (selected.fontWeight ?? DEFAULT_FONT_WEIGHT[selected.type]) === weight
                          ? 'bg-[#0D99FF] text-white'
                          : 'bg-[#383838] text-white/60'
                      }`}
                    >
                      {weight === 400 ? 'Regular' : weight === 600 ? 'Semi' : 'Bold'}
                    </button>
                  ))}
                </div>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="w-12 text-[10.5px] text-white/45">Font</span>
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

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="w-12 text-[10.5px] text-white/45">Style</span>
                  <button
                    type="button"
                    onClick={() => update(selected.id, { italic: !selected.italic })}
                    className={`grid h-7 w-7 place-items-center rounded ${selected.italic ? 'bg-[#0D99FF] text-white' : 'bg-[#383838] text-white/60'}`}
                    aria-label="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => update(selected.id, { underline: !selected.underline })}
                    className={`grid h-7 w-7 place-items-center rounded ${selected.underline ? 'bg-[#0D99FF] text-white' : 'bg-[#383838] text-white/60'}`}
                    aria-label="Underline"
                  >
                    <Underline className="h-3.5 w-3.5" />
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
                        className={`grid h-7 w-7 place-items-center rounded ${
                          (selected.align || 'left') === option.value ? 'bg-[#0D99FF] text-white' : 'bg-[#383838] text-white/60'
                        }`}
                        aria-label={`Align ${option.value}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
                </div>

                {selectedIsText && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="w-12 shrink-0 text-[10.5px] text-white/45">Tracking</span>
                    <input
                      type="range"
                      min={-2}
                      max={8}
                      step={0.5}
                      value={selected.tracking ?? 0}
                      onChange={(event) => update(selected.id, { tracking: Number(event.target.value) })}
                      className="flex-1 accent-[#0D99FF]"
                    />
                    <span className="w-9 text-right text-[10.5px] text-white/70">{selected.tracking ?? 0}px</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setEditingId(selected.id)}
                  className="mt-1 h-7 w-full rounded text-[10.5px] font-semibold text-white"
                  style={{ background: '#0D99FF' }}
                >
                  Type directly on canvas
                </button>
                <p className="text-[9.5px] leading-relaxed text-white/30">
                  Double-click the element, or press Enter, to put the caret on the canvas.
                </p>
                {selectedTextFields.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById('vector-text-fields')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                      })
                    }
                    className="mt-1.5 inline-flex h-7 items-center gap-1 rounded-md border border-[#7C5CFF]/40 bg-[#7C5CFF]/10 px-2 text-[10px] font-semibold text-[#C9BDFF] hover:bg-[#7C5CFF]/20"
                  >
                    <Type className="h-3 w-3" /> Edit all {selectedTextFields.length + 1} text fields in this box
                  </button>
                )}
              </Section>

              {selectedTextFields.length > 0 && (
                <Section id="vector-text-fields" title="Text fields">
                  <p className="text-[9.5px] leading-relaxed text-white/35">
                    This component contains several text fields. Double-click the box for the main label, and edit the
                    secondary copy here.
                  </p>
                  {selectedTextFields.map((field) => (
                    <label key={field.id} className="block">
                      <span className="mb-1 block text-[10px] font-semibold text-white/45">{field.label}</span>
                      <input
                        value={selected.texts?.[field.id] ?? field.fallback}
                        onChange={(event) =>
                          update(selected.id, {
                            texts: { ...(selected.texts || {}), [field.id]: event.target.value },
                          })
                        }
                        className="h-7 w-full rounded-md bg-[#383838] px-2 text-[11px] outline-none focus:ring-1 focus:ring-[#0D99FF]"
                      />
                    </label>
                  ))}
                </Section>
              )}

              <Section title="Layout">
                <div className="flex items-center gap-1.5">
                  <span className="w-12 text-[10.5px] text-white/45">Position</span>
                  <input
                    type="number"
                    value={selected.x}
                    onChange={(event) => update(selected.id, { x: Number(event.target.value) || 0 })}
                    className="h-7 w-[58px] rounded bg-[#383838] px-1.5 text-[10.5px] tabular-nums outline-none"
                    aria-label="X position"
                  />
                  <input
                    type="number"
                    value={selected.y}
                    onChange={(event) => update(selected.id, { y: Number(event.target.value) || 0 })}
                    className="h-7 w-[58px] rounded bg-[#383838] px-1.5 text-[10.5px] tabular-nums outline-none"
                    aria-label="Y position"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-12 text-[10.5px] text-white/45">Size</span>
                  <input
                    type="number"
                    value={selected.w}
                    onChange={(event) => update(selected.id, { w: Math.max(16, Number(event.target.value) || 60) })}
                    className="h-7 w-[58px] rounded bg-[#383838] px-1.5 text-[10.5px] tabular-nums outline-none"
                    aria-label="Width"
                  />
                  <input
                    type="number"
                    value={selected.h}
                    onChange={(event) =>
                      update(selected.id, {
                        h: Math.max(Math.round(currentFontSize * 1.15), Number(event.target.value) || 24),
                      })
                    }
                    className="h-7 w-[58px] rounded bg-[#383838] px-1.5 text-[10.5px] tabular-nums outline-none"
                    aria-label="Height"
                  />
                </div>
              </Section>

              <Section title={selectedIsText ? 'Colour' : 'Appearance'}>
                <div className="flex items-start gap-1.5">
                  <span className="w-12 shrink-0 pt-1 text-[10.5px] text-white/45">{selectedIsText ? 'Text' : 'Accent'}</span>
                  <div className="flex flex-wrap gap-1">
                    {SWATCHES.map((swatch) => (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => update(selected.id, { color: swatch })}
                        className={`h-5 w-5 rounded border ${selected.color === swatch ? 'border-[#0D99FF]' : 'border-white/15'}`}
                        style={{ background: swatch }}
                        aria-label={`Use ${swatch}`}
                      />
                    ))}
                  </div>
                </div>

                {!selectedIsText && (
                  <>
                    {colorRow('Surface', selected.fill, (next) => update(selected.id, { fill: next || undefined }), true)}
                    {colorRow('Border', selected.strokeColor, (next) => update(selected.id, { strokeColor: next }))}

                    <div className="flex items-center gap-1.5">
                      <span className="w-14 shrink-0 text-[10.5px] text-white/45">Thickness</span>
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
                      <span className="w-14 shrink-0 text-[10.5px] text-white/45">Radius</span>
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
                  </>
                )}
              </Section>

              {selected.type === 'image' && (
                <Section title="Image">
                  <div className="h-24 w-full overflow-hidden rounded-md border border-white/10 bg-[#383838]">
                    {selected.src ? (
                      <img src={selected.src} alt={selected.label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-[10.5px] text-white/35">No image yet</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => replaceImageRef.current?.click()}
                    className="mt-1.5 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-white/15 text-[11px] font-semibold text-white/85 hover:bg-white/5"
                  >
                    <Upload className="h-3 w-3" /> {selected.src ? 'Replace image' : 'Upload image'}
                  </button>
                  {selected.src && (
                    <button
                      type="button"
                      onClick={() =>
                        commit(items.map((item) => (item.id === selected.id ? { ...item, src: undefined } : item)))
                      }
                      className="mt-1 h-7 w-full rounded-md text-[10.5px] font-medium text-[#FF8A8A] hover:bg-white/5"
                    >
                      Remove image
                    </button>
                  )}
                  <p className="text-[9.5px] leading-relaxed text-white/30">
                    Images are embedded in the project and the exported bundle.
                  </p>
                </Section>
              )}

              <Section title="Behaviour">
                <label className="block text-[10px] font-semibold text-white/45" htmlFor="vector-on-click">
                  What happens on click
                </label>
                <input
                  id="vector-on-click"
                  value={selected.action || ''}
                  onChange={(event) => update(selected.id, { action: event.target.value })}
                  placeholder="e.g. opens the dashboard, filters the table, opens a modal"
                  className="mt-1 h-8 w-full rounded-md bg-[#383838] px-2 text-[11px] outline-none placeholder:text-white/25 focus:ring-1 focus:ring-[#0D99FF]"
                />

                <p className="mt-2 text-[10px] font-semibold text-white/45">Comments and behaviour notes</p>
                <div className="mt-1 flex items-center gap-1">
                  <input
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return;
                      event.preventDefault();
                      addNote();
                    }}
                    placeholder="Add a note for the final prompt…"
                    className="h-7 min-w-0 flex-1 rounded-md bg-[#383838] px-2 text-[10.5px] outline-none placeholder:text-white/25 focus:ring-1 focus:ring-[#0D99FF]"
                  />
                  <button
                    type="button"
                    onClick={addNote}
                    disabled={!noteDraft.trim()}
                    className="grid h-7 w-7 place-items-center rounded bg-[#0D99FF] text-white disabled:opacity-30"
                    aria-label="Add note"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {(selected.notes || []).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {(selected.notes || []).map((note, index) => (
                      <li key={`${note}-${index}`} className="flex items-start gap-1 rounded-md bg-[#383838] px-2 py-1.5">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C5CFF]" />
                        <span className="min-w-0 flex-1 text-[10px] leading-relaxed text-white/70">{note}</span>
                        <button
                          type="button"
                          onClick={() => removeNote(index)}
                          className="grid h-4 w-4 place-items-center rounded text-white/35 hover:text-white"
                          aria-label={`Remove note ${index + 1}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className={`text-[9.5px] leading-relaxed ${(selected.notes || []).length ? 'text-[#B9A8FF]' : 'text-white/30'}`}>
                  {(selected.notes || []).length
                    ? `${(selected.notes || []).length} note${(selected.notes || []).length === 1 ? '' : 's'} included in the prompt's INTERACTIONS section.`
                    : 'Add a note to pin behaviour to the generated prompt under this element.'}
                </p>
              </Section>
            </>
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
              <span className="w-7 h-7 rounded-md grid place-items-center" style={{ backgroundImage: 'linear-gradient(135deg,#5E6AD2,#828FFF)' }}>
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
        )}
      </div>

      <SpotlightHost page="editor" onLearnMore={() => onOpenAssistant?.()} />

      {previewVariant && (() => {
        const scale = Math.min(1, 520 / previewVariant.w, 320 / previewVariant.h);
        return (
          <div className="fixed inset-0 z-[92] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={`Preview ${previewVariant.name}`}>
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setPreviewVariant(null)} aria-hidden="true" />
            <div className="relative w-full max-w-[620px] rounded-lg border border-white/10 bg-[#0F1011] p-4 text-white shadow-[0_40px_90px_-30px_rgba(0,0,0,.95)]">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#B9A8FF]">{previewVariant.group}</p>
                  <h2 className="mt-0.5 text-[16px] font-semibold">{previewVariant.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewVariant(null)}
                  className="grid h-7 w-7 place-items-center rounded-md text-white/50 hover:bg-white/10"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid min-h-[180px] place-items-center overflow-hidden rounded-xl bg-[#F6F5FA] p-4">
                <div style={{ width: previewVariant.w * scale, height: previewVariant.h * scale }}>
                  <div
                    style={{
                      width: previewVariant.w,
                      height: previewVariant.h,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <StyledElement
                      style={previewVariant.style}
                      label={previewVariant.label}
                      color={previewVariant.color}
                    />
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-white/55">{previewVariant.prompt}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addVariant(previewVariant);
                    setPreviewVariant(null);
                  }}
                  className="h-9 flex-1 rounded-md bg-[#0D99FF] text-[11.5px] font-semibold text-white hover:bg-[#0b8ae6]"
                >
                  Add to canvas
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewVariant(null)}
                  className="h-9 rounded-md border border-white/15 px-4 text-[11.5px] font-semibold text-white/75 hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        room={room}
        link={inviteLink}
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

      <SideBySideBuild open={buildOpen} prompt={prompt} onClose={() => setBuildOpen(false)} />

      {/* Base44 drawer */}
      {base44 && (
        <div className="fixed inset-0 z-[80] flex">
          <div className="flex-1 bg-black/60" onClick={() => setBase44(false)} aria-hidden="true" />
          <div className="w-full max-w-[560px] bg-[#0F1011] border-l border-white/10 flex flex-col text-white">
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
                <iframe
                  title="Base44"
                  src="https://app.base44.com"
                  className="w-full h-[420px] canvas-surface"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals"
                  allow="clipboard-read; clipboard-write"
                />
              </div>
              <p className="text-[9.5px] text-white/30">If the panel stays blank, Base44 blocks embedding. Use "Open Base44" — the prompt is already copied.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

