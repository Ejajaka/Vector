import type { TemplateDefinition } from './templates.ts';
import { TYPE_TO_VARIANT, VARIANT_TEXT_FIELDS, variantById } from './styles.ts';

export type CanvasItemType =
  | 'navbar'
  | 'heading'
  | 'text'
  | 'button'
  | 'input'
  | 'card'
  | 'image'
  | 'chart'
  | 'table'
  | 'avatar'
  | 'badge'
  | 'footer'
  | 'modal';

export type AnimationTrigger = 'load' | 'hover' | 'click' | 'in-view';

export type AnimationKind =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'rotate'
  | 'blur'
  | 'bounce'
  | 'pulse'
  | 'float'
  | 'wipe';

export type AnimationEasing =
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'linear'
  | 'spring';

export type AnimationRepeat = 'once' | 'loop' | 'ping-pong';

export interface ElementAnimation {
  kind: AnimationKind;
  trigger: AnimationTrigger;
  duration: number;
  delay: number;
  easing: AnimationEasing;
  distance: number;
  repeat: AnimationRepeat;
}

export const DEFAULT_ANIMATION = (kind: AnimationKind = 'fade'): ElementAnimation => ({
  kind,
  trigger: 'load',
  duration: 600,
  delay: 0,
  easing: 'ease-out',
  distance: 24,
  repeat: 'once',
});

export const ANIMATION_PRESETS: Array<{
  id: AnimationKind;
  name: string;
  hint: string;
}> = [
  { id: 'fade', name: 'Fade', hint: 'Soft appear' },
  { id: 'slide-up', name: 'Rise', hint: 'Slide up' },
  { id: 'slide-down', name: 'Drop', hint: 'Slide down' },
  { id: 'slide-left', name: 'Left', hint: 'Slide left' },
  { id: 'slide-right', name: 'Right', hint: 'Slide right' },
  { id: 'zoom-in', name: 'Zoom', hint: 'Scale in' },
  { id: 'zoom-out', name: 'Shrink', hint: 'Scale out' },
  { id: 'rotate', name: 'Tilt', hint: 'Rotate in' },
  { id: 'blur', name: 'Focus', hint: 'Blur in' },
  { id: 'bounce', name: 'Bounce', hint: 'Drop bounce' },
  { id: 'pulse', name: 'Pulse', hint: 'Attention' },
  { id: 'float', name: 'Float', hint: 'Idle drift' },
  { id: 'wipe', name: 'Wipe', hint: 'Reveal' },
];

export interface CanvasItem {
  id: string;
  type: CanvasItemType;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Styled variant id from `data/styles.ts`. Falls back to the type default. */
  variant?: string;
  /** Text shown in the canvas and used as the prompt label. */
  label: string;
  /** Accent colour for buttons/cards, or the text fill for text styles. */
  color?: string;
  /** Extra prompt detail, e.g. "opens the signup modal". */
  action?: string;
  /** Interaction comments captured from the inspector and carried into the prompt. */
  notes?: string[];
  /** Secondary editable copy inside a composite component (value, CTA, links…). */
  texts?: Record<string, string>;
  /** Uploaded or pasted image as a data URL. */
  src?: string;
  /** Text-only overrides. */
  fontSize?: number;
  fontWeight?: number;
  align?: 'left' | 'center' | 'right';
  /* ---- universal style overrides ---- */
  /** Surface fill. Falls back to the variant's own background. */
  fill?: string;
  /** Border colour; only drawn when strokeWidth > 0. */
  strokeColor?: string;
  /** Border thickness in px. */
  strokeWidth?: number;
  /** Corner radius in px. */
  radius?: number;
  /** Font family key, see FONT_STACKS. */
  fontFamily?: string;
  italic?: boolean;
  underline?: boolean;
  /** Letter spacing in px. */
  tracking?: number;
  /** Prototype: jump to this page when clicked in preview. */
  linkToPageId?: string;
  /** Prototype: entrance/attention animation. */
  animation?: ElementAnimation;
}

export interface CanvasPage {
  id: string;
  name: string;
  items: CanvasItem[];
  /** Page background. Defaults to white when unset. */
  background?: string;
  /** Frame size. Defaults to 1200×800 when unset. */
  width?: number;
  height?: number;
  /** Transition used when a prototype link lands on this page. */
  transition?: 'none' | 'fade' | 'slide' | 'push' | 'dissolve';
  /** Page-transition duration in ms. Defaults to 350. */
  transitionDuration?: number;
}

export const FONT_STACKS: Record<string, string> = {
  jakarta: "'Plus Jakarta Sans', system-ui, sans-serif",
  bricolage: "'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

export const FONT_LABELS: Array<{ id: string; label: string }> = [
  { id: 'jakarta', label: 'Jakarta' },
  { id: 'bricolage', label: 'Bricolage' },
  { id: 'georgia', label: 'Serif' },
  { id: 'mono', label: 'Mono' },
];

export const DEFAULT_PAGE = (): CanvasPage => ({ id: newId(), name: 'Page 1', items: [] });

export interface PaletteEntry {
  type: CanvasItemType;
  name: string;
  hint: string;
  w: number;
  h: number;
  color?: string;
}

export interface PaletteGroup {
  id: string;
  name: string;
  items: PaletteEntry[];
}

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export const PALETTE: PaletteGroup[] = [
  {
    id: 'layout',
    name: 'Layout',
    items: [
      { type: 'navbar', name: 'Navbar', hint: 'Top navigation bar', w: 1072, h: 64 },
      { type: 'footer', name: 'Footer', hint: 'Links and legal strip', w: 1072, h: 96 },
      { type: 'card', name: 'Card', hint: 'Bordered content surface', w: 320, h: 200 },
      { type: 'modal', name: 'Modal', hint: 'Centered dialog', w: 420, h: 260 },
    ],
  },
  {
    id: 'content',
    name: 'Content',
    items: [
      { type: 'heading', name: 'Heading', hint: 'Page or section title', w: 520, h: 52 },
      { type: 'text', name: 'Paragraph', hint: 'Body copy block', w: 420, h: 64 },
      { type: 'button', name: 'Button', hint: 'Primary call to action', w: 168, h: 48, color: '#7C5CFF' },
      { type: 'badge', name: 'Badge', hint: 'Status or label chip', w: 120, h: 32 },
      { type: 'avatar', name: 'Avatar', hint: 'User or brand image', w: 64, h: 64 },
    ],
  },
  {
    id: 'form',
    name: 'Form',
    items: [
      { type: 'input', name: 'Text input', hint: 'Labelled field', w: 320, h: 48 },
      { type: 'input', name: 'Email field', hint: 'With validation', w: 320, h: 48 },
      { type: 'input', name: 'Password field', hint: 'With reveal toggle', w: 320, h: 48 },
      { type: 'button', name: 'Submit', hint: 'Full-width form button', w: 320, h: 48, color: '#4D7CFE' },
    ],
  },
  {
    id: 'media',
    name: 'Media',
    items: [
      { type: 'image', name: 'Image', hint: 'Hero or product shot', w: 420, h: 280 },
      { type: 'image', name: 'Gallery', hint: 'Image grid', w: 520, h: 320 },
      { type: 'chart', name: 'Chart', hint: 'Trend or bar chart', w: 560, h: 240 },
      { type: 'table', name: 'Data table', hint: 'Rows, columns, paging', w: 900, h: 280 },
    ],
  },
];

const SWATCHES = ['#7C5CFF', '#4D7CFE', '#22D3EE', '#FF7A59', '#FFC53D', '#0B0E14'];

export function defaultColor(index: number): string {
  return SWATCHES[index % SWATCHES.length];
}

let counter = 0;
export function newId(): string {
  counter += 1;
  return `el_${Date.now().toString(36)}_${counter}`;
}

const FULL_WIDTH: CanvasItemType[] = ['navbar', 'footer', 'chart', 'table'];

const TEMPLATE_TYPE_MAP: Record<string, CanvasItemType> = {
  navbar: 'navbar',
  footer: 'footer',
  heading: 'heading',
  text: 'text',
  button: 'button',
  input: 'input',
  card: 'card',
  image: 'image',
  modal: 'modal',
  table: 'table',
  chart: 'chart',
  avatar: 'avatar',
  badge: 'badge',
  // Template-only vocabulary folded into canvas primitives.
  sidebar: 'card',
  dropdown: 'input',
  checkbox: 'input',
};

/** Lay a template's blocks out on the canvas with sensible geometry. */
export function itemsFromTemplate(template: TemplateDefinition): CanvasItem[] {
  let y = 40;
  let column = 0;
  const items: CanvasItem[] = [];

  template.blocks.forEach((block, index) => {
    const type = TEMPLATE_TYPE_MAP[block.type] || 'card';
    const color = defaultColor(index);

    if (FULL_WIDTH.includes(type)) {
      if (type === 'navbar') {
        items.push({ id: newId(), type, x: 40, y: 0, w: 1120, h: 64, label: 'Top navigation', action: 'logo left, links right' });
        y = Math.max(y, 104);
        return;
      }
      if (type === 'footer') {
        items.push({ id: newId(), type, x: 40, y: CANVAS_HEIGHT - 120, w: 1120, h: 88, label: 'Footer' });
        return;
      }
      items.push({
        id: newId(),
        type,
        x: 40,
        y,
        w: type === 'table' ? 1120 : 900,
        h: type === 'chart' ? 220 : 240,
        label: block.label,
        color,
      });
      y += (type === 'chart' ? 220 : 240) + 24;
      return;
    }

    if (type === 'heading' || type === 'text') {
      const w = type === 'heading' ? 640 : 520;
      const h = type === 'heading' ? 56 : 64;
      items.push({ id: newId(), type, x: 40, y, w, h, label: block.label });
      y += h + 16;
      return;
    }

    if (type === 'input' || type === 'button') {
      const w = type === 'input' ? 340 : 180;
      const h = 48;
      const x = 40 + column * (w + 24);
      items.push({ id: newId(), type, x, y, w, h, label: block.label, color: type === 'button' ? color : undefined });
      if (column === 0) {
        column = 1;
      } else {
        column = 0;
        y += h + 20;
      }
      return;
    }

    // cards, images, modals, badges, avatars
    const w = type === 'image' ? 400 : type === 'modal' ? 460 : 340;
    const h = type === 'image' ? 260 : type === 'modal' ? 280 : 180;
    const x = 40 + column * (w + 24);
    items.push({ id: newId(), type, x, y, w, h, label: block.label, color });
    if (column === 0) {
      column = 1;
    } else {
      column = 0;
      y += h + 24;
    }
  });

  return items.map((item) => ({ ...item, variant: TYPE_TO_VARIANT[item.type] || 'card-elevated' }));
}

export function emptyCanvas(): CanvasItem[] {
  // A blank template opens a genuinely blank page — no seeded elements.
  return [];
}

const TYPE_PROMPT: Record<CanvasItemType, (item: CanvasItem) => string> = {
  navbar: (i) =>
    `Top navigation bar spanning the full width at the top (${Math.round(i.w)}×${Math.round(i.h)}px). Brand mark on the left, primary links, and a sign-in action on the right.`,
  heading: (i) =>
    `Section heading reading “${i.label}” at ${Math.round(i.x)},${Math.round(i.y)} (${Math.round(i.w)}px wide). Large, tight tracking, high contrast.`,
  text: (i) =>
    `Supporting paragraph at ${Math.round(i.x)},${Math.round(i.y)}, maximum ${Math.round(i.w)}px wide, comfortable line height and muted colour.`,
  button: (i) =>
    `Button labelled “${i.label}” at ${Math.round(i.x)},${Math.round(i.y)}, ${Math.round(i.w)}×${Math.round(i.h)}px, background ${i.color || '#7C5CFF'}, white text, rounded 10px. Action: ${i.action || 'performs the primary task on this screen'}.`,
  input: (i) =>
    `Form field for “${i.label}” at ${Math.round(i.x)},${Math.round(i.y)}, ${Math.round(i.w)}×${Math.round(i.h)}px, with a visible label above, placeholder, focus ring and inline validation.`,
  card: (i) =>
    `Card at ${Math.round(i.x)},${Math.round(i.y)}, ${Math.round(i.w)}×${Math.round(i.h)}px, titled “${i.label}”, subtle border, 12px radius, 16px padding.`,
  image: (i) =>
    `Image block “${i.label}” at ${Math.round(i.x)},${Math.round(i.y)}, ${Math.round(i.w)}×${Math.round(i.h)}px, rounded corners, object-fit cover, descriptive alt text.`,
  chart: (i) =>
    `Chart at ${Math.round(i.x)},${Math.round(i.y)}, ${Math.round(i.w)}×${Math.round(i.h)}px showing the primary trend, labelled axes and a legend.`,
  table: (i) =>
    `Data table at ${Math.round(i.x)},${Math.round(i.y)}, ${Math.round(i.w)}×${Math.round(i.h)}px with sticky header, sortable columns, row selection and empty state.`,
  modal: (i) =>
    `Modal dialog “${i.label}” centred on screen, ${Math.round(i.w)}×${Math.round(i.h)}px, with title, body and two actions (cancel, confirm).`,
  avatar: (i) =>
    `Avatar ${Math.round(i.w)}×${Math.round(i.h)}px at ${Math.round(i.x)},${Math.round(i.y)}, circular, with an accessible name.`,
  badge: (i) =>
    `Status badge reading “${i.label}” at ${Math.round(i.x)},${Math.round(i.y)}, small, rounded-full, high contrast.`,
  footer: (i) =>
    `Footer at the bottom of the page (${Math.round(i.w)}×${Math.round(i.h)}px) with link columns, legal line and social icons.`,
};

/** Build the prompt that stays in sync with the canvas. */
export function buildPrompt(name: string, items: CanvasItem[]): string {
  if (items.length === 0) {
    return `Build a “${name}” screen. Drop elements onto the canvas and the prompt will assemble itself here.`;
  }

  const colors = Array.from(new Set(items.map((item) => item.color).filter(Boolean))) as string[];
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  const summary = Object.entries(counts)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');

  return [
    `Build a “${name}” screen as a responsive web application.`,
    '',
    `COMPOSITION — ${summary}. Layout is a 1200×800 desktop canvas, stacking to a single column below 768px.`,
    '',
    'ELEMENTS',
    ...items.map((item, index) => {
      const variant = item.variant ? variantById(item.variant) : undefined;
      const describe = TYPE_PROMPT[item.type] || TYPE_PROMPT.card;
      const base = variant ? variant.prompt : describe(item);
      return `${index + 1}. ${base[0].toUpperCase()}${base.slice(1)} — labelled “${item.label}”, at ${Math.round(item.x)},${Math.round(item.y)}, ${Math.round(item.w)}×${Math.round(item.h)}px${
        item.color ? `, accent ${item.color}` : ''
      }.`;
    }),
    '',
    'DESIGN SYSTEM',
    `- Accent colours in use: ${colors.length ? colors.join(', ') : 'violet #7C5CFF with a neutral grey scale'}.`,
    '- Type scale: 40/28/18/14px, 1.5 line height for body, 1.1 for headings.',
    '- Spacing on an 8px grid; 12px card radius; 1px hairline borders.',
    '- Light and dark themes both required.',
    '',
    'QUALITY BAR',
    '- Every interactive element has a visible label, hover and focus state.',
    '- No placeholder lorem ipsum — use realistic copy.',
    '- Meets WCAG AA contrast for text and controls.',
    '- Empty, loading and error states are designed, not omitted.',
  ].join('\n');
}

/** Multi-page prompt: one section per page, plus shared design-system notes. */
export function buildPagesPrompt(name: string, pages: CanvasPage[]): string {
  const total = pages.reduce((count, page) => count + page.items.length, 0);
  if (!total) {
    return `Build a “${name}” flow. Drop elements onto the canvas and the prompt will assemble itself here.`;
  }

  const allItems = pages.flatMap((page) => page.items);
  const colours = Array.from(new Set(allItems.map((item) => item.color).filter(Boolean))) as string[];

  const describe = (item: CanvasItem): string => {
    const variant = item.variant ? variantById(item.variant) : undefined;
    const base = variant ? variant.prompt : TYPE_PROMPT[item.type]?.(item) || TYPE_PROMPT.card(item);
    const bits = [
      `${base[0].toUpperCase()}${base.slice(1)}`,
      `labelled “${item.label}”`,
      `at ${Math.round(item.x)},${Math.round(item.y)}`,
      `${Math.round(item.w)}×${Math.round(item.h)}px`,
    ];
    if (item.color) bits.push(`accent ${item.color}`);
    if (item.fill) bits.push(`surface ${item.fill}`);
    if (item.strokeColor) bits.push(`border ${item.strokeColor}`);
    if (item.radius != null) bits.push(`${Math.round(item.radius)}px radius`);
    if (item.fontSize) bits.push(`font size ${item.fontSize}px`);
    if (item.fontWeight) bits.push(`weight ${item.fontWeight}`);
    if (item.fontFamily) bits.push(`${item.fontFamily} typeface`);
    if (item.align) bits.push(`${item.align}-aligned`);
    if (item.italic) bits.push('italic');
    if (item.underline) bits.push('underlined');
    if (item.action) bits.push(`on click: ${item.action.replace(/[.]+$/, '')}`);
    if (item.notes?.length) {
      bits.push(`comments: ${item.notes.map((note) => note.trim().replace(/[.]+$/, '')).join('; ')}`);
    }
    const extraFields = VARIANT_TEXT_FIELDS[item.variant || ''] || [];
    if (extraFields.length) {
      bits.push(
        `text fields: ${extraFields
          .map((field) => `${field.label.toLowerCase()} “${item.texts?.[field.id] ?? field.fallback}”`)
          .join(', ')}`
      );
    }
    if (item.src) bits.push('using the supplied image');
    if (item.animation) {
      const motion = item.animation;
      bits.push(
        `animated with ${motion.kind} on ${motion.trigger}, ${motion.duration}ms${
          motion.delay ? ` after ${motion.delay}ms` : ''
        }, ${motion.easing}${motion.repeat !== 'once' ? `, ${motion.repeat}` : ''}`
      );
    }
    return bits.join(', ') + '.';
  };

  const pageSections = pages
    .map((page, pageIndex) => {
      if (page.items.length === 0) return '';
      const lines = page.items.map((item, index) => `  ${index + 1}. ${describe(item)}`);
      const background = page.background || '#FFFFFF';
      const transition =
        page.transition && page.transition !== 'none'
          ? `, transition ${page.transition} ${page.transitionDuration ?? 350}ms`
          : '';
      return [
        `PAGE ${pageIndex + 1} - "${page.name}" (background ${background}${transition})`,
        ...lines,
      ].join('\n');
    })
    .filter(Boolean);

  const motion = allItems
    .filter((item) => item.animation)
    .map((item) => {
      const animation = item.animation!;
      return `- "${item.label}": ${animation.kind} on ${animation.trigger}, ${animation.duration}ms${
        animation.delay ? ` delay ${animation.delay}ms` : ''
      }, ${animation.easing}${animation.repeat !== 'once' ? `, ${animation.repeat}` : ''}.`;
    });
  const pageTransitions = pages
    .filter((page) => page.transition && page.transition !== 'none')
    .map(
      (page) =>
        `- ${page.name}: ${page.transition} over ${page.transitionDuration ?? 350}ms.`
    );
  const interactions = pages.flatMap((page) =>
    page.items
      .filter((item) => item.action || item.notes?.length)
      .map((item) => {
        const parts: string[] = [`- On "${page.name}", "${item.label || item.type}" (${item.type} at ${Math.round(item.x)},${Math.round(item.y)})`];
        if (item.action) parts.push(`click → ${item.action.replace(/[.]+$/, '')}`);
        if (item.notes?.length) {
          parts.push(`notes: ${item.notes.map((note) => note.trim().replace(/[.]+$/, '')).join('; ')}`);
        }
        return `${parts.join('; ')}.`;
      })
  );

  return [
    `Build a “${name}” product as a responsive web application with ${pages.length} page${pages.length === 1 ? '' : 's'}.`,
    '',
    'PAGES',
    ...pageSections,
    '',
    'NAVIGATION',
    pages.length > 1
      ? `Link the pages in this order: ${pages.map((page) => page.name).join(' → ')}. The active page is highlighted in the navigation.`
      : 'Single page — the primary call to action is the only navigation target.',
    '',
    'INTERACTIONS',
    ...(interactions.length ? interactions : ['- No extra interactions specified.']),
    '- Preserve the element order and placement above when writing the interaction copy.',
    '',
    'MOTION',
    ...(motion.length ? motion : ['- No element animations specified.']),
    ...(pageTransitions.length ? pageTransitions : ['- No page transitions specified.']),
    '- Respect prefers-reduced-motion: disable non-essential motion for those users.',
    '- Use only the motion described above; do not add extra loops or attention effects.',
    '',
    'DESIGN SYSTEM',
    `- Accent colours in use: ${colours.length ? colours.join(', ') : 'violet #7C5CFF with a neutral grey scale'}.`,
    `- Page backgrounds: ${pages.map((page) => `${page.name} ${page.background || '#FFFFFF'}`).join(', ')}.`,
    '- Body text must meet 4.5:1 contrast against the page background.',
    '- Type scale: 40/28/18/14px, 1.5 line height for body, 1.1 for headings.',
    '- Spacing on an 8px grid; 12px card radius; 1px hairline borders.',
    '- Light and dark themes both required.',
    '',
    'QUALITY BAR',
    '- Every interactive element has a visible label, hover and focus state.',
    '- No placeholder lorem ipsum — use realistic copy.',
    '- Meets WCAG AA contrast for text and controls.',
    '- Empty, loading and error states are designed, not omitted.',
  ].join('\n');
}

export function summarize(items: CanvasItem[]): { label: string; value: string }[] {
  const imageCount = items.filter((item) => item.type === 'image').length;
  const inputs = items.filter((item) => item.type === 'input').length;
  return [
    { label: 'Elements', value: String(items.length) },
    { label: 'Sections', value: String(new Set(items.map((item) => item.y)).size) },
    { label: 'Inputs', value: String(inputs) },
    { label: 'Images', value: String(imageCount) },
  ];
}
