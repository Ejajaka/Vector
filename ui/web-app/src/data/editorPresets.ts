import { newId, type CanvasItem, type CanvasItemType } from './canvas.ts';

export interface TextPreset {
  id: string;
  name: string;
  sample: string;
  variant: string;
  fontSize: number;
  fontWeight: number;
  w: number;
  h: number;
  premium?: boolean;
}

export const TEXT_PRESETS: TextPreset[] = [
  { id: 'heading', name: 'Add a heading', sample: 'Add a heading', variant: 'text-h2', fontSize: 40, fontWeight: 800, w: 640, h: 56 },
  { id: 'subheading', name: 'Add a subheading', sample: 'Add a subheading', variant: 'text-h3', fontSize: 26, fontWeight: 600, w: 520, h: 40 },
  { id: 'body', name: 'Add a little bit of body text', sample: 'Add a little bit of body text', variant: 'text-body', fontSize: 16, fontWeight: 400, w: 520, h: 72 },
  { id: 'display', name: 'Display headline', sample: 'Big, quiet confidence', variant: 'text-display', fontSize: 56, fontWeight: 800, w: 760, h: 72, premium: true },
  { id: 'editorial', name: 'Editorial serif', sample: 'A slower kind of luxury', variant: 'text-h2', fontSize: 44, fontWeight: 400, w: 700, h: 60, premium: true },
];

export interface TextCombo {
  id: string;
  name: string;
  description: string;
  premium?: boolean;
  build: (pageWidth: number) => Array<Partial<CanvasItem>>;
}

export const TEXT_COMBOS: TextCombo[] = [
  {
    id: 'hero-copy',
    name: 'Hero copy',
    description: 'Heading, supporting line and a call to action.',
    build: (pageWidth) => [
      { type: 'text', variant: 'text-display', label: 'Design at the speed of thought', x: 64, y: 120, w: Math.min(720, pageWidth - 128), h: 72, fontSize: 48, fontWeight: 800 },
      { type: 'text', variant: 'text-body', label: 'Turn one sentence into a complete, reviewed interface brief.', x: 64, y: 208, w: 520, h: 56, fontSize: 16 },
      { type: 'button', variant: 'btn-gradient', label: 'Start free', x: 64, y: 288, w: 176, h: 48 },
    ],
  },
  {
    id: 'section-head',
    name: 'Section header',
    description: 'Caption, heading and a short paragraph.',
    build: () => [
      { type: 'text', variant: 'text-caption', label: 'Why it matters', x: 64, y: 120, w: 320, h: 22 },
      { type: 'text', variant: 'text-h2', label: 'Fewer rounds, better screens', x: 64, y: 152, w: 640, h: 48, fontSize: 32, fontWeight: 800 },
      { type: 'text', variant: 'text-body', label: 'Every element arrives with its label, action, colour and placement already decided.', x: 64, y: 212, w: 520, h: 60, fontSize: 16 },
    ],
  },
  {
    id: 'quote',
    name: 'Pull quote',
    description: 'A quote with attribution.',
    build: () => [
      { type: 'text', variant: 'text-quote', label: '“It cut our design review from four rounds to one.”', x: 64, y: 140, w: 640, h: 72, fontSize: 24, fontWeight: 400 },
      { type: 'text', variant: 'text-caption', label: 'Roshna George · Product design', x: 64, y: 226, w: 420, h: 22 },
    ],
  },
  {
    id: 'pricing-block',
    name: 'Pricing block',
    description: 'Three tiers with CTAs.',
    premium: true,
    build: (pageWidth) => {
      const cardW = Math.min(300, Math.floor((pageWidth - 128 - 32) / 3));
      return [0, 1, 2].flatMap((index) => [
        { type: 'card' as CanvasItemType, variant: index === 1 ? 'card-elevated' : 'card-outline', label: ['Starter', 'Pro', 'Team'][index], x: 64 + index * (cardW + 16), y: 140, w: cardW, h: 248 },
        { type: 'text' as CanvasItemType, variant: 'text-h3', label: `₹${['0', '499', '1499'][index]}`, x: 84 + index * (cardW + 16), y: 300, w: cardW - 40, h: 32, fontSize: 22, fontWeight: 800 },
        { type: 'button' as CanvasItemType, variant: index === 1 ? 'btn-gradient' : 'btn-outline', label: 'Choose', x: 84 + index * (cardW + 16), y: 344, w: cardW - 40, h: 44 },
      ]);
    },
  },
];

export interface ContentCategory {
  id: string;
  name: string;
  width: number;
  height: number;
  premium?: boolean;
  build: (w: number, h: number) => Array<Partial<CanvasItem>>;
}

export const CONTENT_CATEGORIES: ContentCategory[] = [
  {
    id: 'websites',
    name: 'Websites',
    width: 1440,
    height: 900,
    build: (w) => [
      { type: 'navbar', variant: 'nav-light', label: 'Acme', x: 40, y: 0, w: w - 80, h: 64, color: '#7C5CFF' },
      { type: 'text', variant: 'text-display', label: 'A page that says one thing well', x: 40, y: 120, w: Math.min(720, w - 80), h: 120, fontSize: 56, fontWeight: 800 },
      { type: 'text', variant: 'text-body', label: 'Short supporting line that explains the value in a sentence.', x: 40, y: 256, w: 520, h: 60, fontSize: 16 },
      { type: 'button', variant: 'btn-gradient', label: 'Get started', x: 40, y: 336, w: 184, h: 52 },
      { type: 'image', variant: 'image-rounded', label: 'Hero visual', x: w - 560, y: 120, w: 480, h: 380, color: '#7C5CFF' },
    ],
  },
  {
    id: 'social',
    name: 'Social',
    width: 1080,
    height: 1080,
    build: () => [
      { type: 'card', variant: 'card-gradient', label: 'New drop', x: 80, y: 80, w: 920, h: 920 },
      { type: 'text', variant: 'text-display', label: '30% off this week', x: 140, y: 720, w: 800, h: 80, fontSize: 64, fontWeight: 800, color: '#FFFFFF' },
      { type: 'text', variant: 'text-caption', label: 'In stores and online', x: 140, y: 820, w: 500, h: 24, color: '#FFFFFF' },
    ],
  },
  {
    id: 'docs',
    name: 'Docs',
    width: 794,
    height: 1123,
    build: () => [
      { type: 'text', variant: 'text-h2', label: 'Project brief', x: 64, y: 64, w: 600, h: 48, fontSize: 32, fontWeight: 800 },
      { type: 'text', variant: 'text-caption', label: 'Prepared by Vector', x: 64, y: 120, w: 400, h: 22 },
      { type: 'text', variant: 'text-body', label: 'Two or three sentences that frame the problem and who it is for.', x: 64, y: 168, w: 620, h: 80, fontSize: 14 },
      { type: 'text', variant: 'text-checklist', label: 'What is included', x: 64, y: 276, w: 480, h: 108 },
    ],
  },
  {
    id: 'video',
    name: 'Video',
    width: 1920,
    height: 1080,
    premium: true,
    build: (w) => [
      { type: 'image', variant: 'image-bleed', label: 'Video frame', x: 0, y: 0, w, h: 1080, color: '#4D7CFE' },
      { type: 'text', variant: 'text-display', label: 'Ship the whole screen', x: 120, y: 760, w: 900, h: 96, fontSize: 72, fontWeight: 800, color: '#FFFFFF' },
      { type: 'badge', variant: 'badge-solid', label: 'Episode 04', x: 120, y: 700, w: 120, h: 28 },
    ],
  },
  {
    id: 'whiteboards',
    name: 'Whiteboards',
    width: 1600,
    height: 1200,
    build: () => [
      { type: 'text', variant: 'text-h2', label: 'Flow sketch', x: 80, y: 60, w: 600, h: 48, fontSize: 32, fontWeight: 800 },
      { type: 'card', variant: 'rect', label: 'Idea', x: 80, y: 160, w: 280, h: 180, fill: '#F1E9DC' },
      { type: 'card', variant: 'rect', label: 'Idea', x: 400, y: 160, w: 280, h: 180, fill: '#E7EDE9' },
      { type: 'card', variant: 'rect', label: 'Idea', x: 720, y: 160, w: 280, h: 180, fill: '#F3E9F8' },
    ],
  },
  {
    id: 'logos',
    name: 'Logos',
    width: 1080,
    height: 1080,
    premium: true,
    build: () => [
      { type: 'card', variant: 'rect', label: 'Logo mark', x: 340, y: 340, w: 400, h: 400, fill: '#7C5CFF', radius: 96 },
      { type: 'text', variant: 'text-h2', label: 'Acme', x: 340, y: 780, w: 400, h: 48, fontSize: 40, fontWeight: 800, align: 'center' },
    ],
  },
];

export function materialise(partials: Array<Partial<CanvasItem>>): CanvasItem[] {
  return partials.map((partial) => ({
    id: newId(),
    type: (partial.type || 'card') as CanvasItemType,
    variant: partial.variant,
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    w: partial.w ?? 240,
    h: partial.h ?? 120,
    label: partial.label || 'Element',
    color: partial.color,
    fill: partial.fill,
    radius: partial.radius,
    fontSize: partial.fontSize,
    fontWeight: partial.fontWeight,
    align: partial.align,
    src: partial.src,
    strokeColor: partial.strokeColor,
    strokeWidth: partial.strokeWidth,
    fontFamily: partial.fontFamily,
    italic: partial.italic,
    underline: partial.underline,
    tracking: partial.tracking,
  }));
}
