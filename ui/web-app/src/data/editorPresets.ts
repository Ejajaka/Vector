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
  { id: 'hero', name: 'Hero headline', sample: 'Build the whole screen', variant: 'text-display', fontSize: 64, fontWeight: 800, w: 820, h: 88 },
  { id: 'eyebrow', name: 'Eyebrow', sample: 'NEW FEATURE', variant: 'text-caption', fontSize: 11, fontWeight: 700, w: 280, h: 22 },
  { id: 'overline', name: 'Overline', sample: 'WHY IT MATTERS', variant: 'text-caption', fontSize: 10, fontWeight: 600, w: 280, h: 20 },
  { id: 'kicker', name: 'Kicker', sample: 'A calmer way to ship', variant: 'text-label', fontSize: 13, fontWeight: 600, w: 320, h: 24 },
  { id: 'large-body', name: 'Large paragraph', sample: 'A longer supporting paragraph that explains the value in two or three sentences.', variant: 'text-body', fontSize: 18, fontWeight: 400, w: 600, h: 96 },
  { id: 'small', name: 'Small print', sample: 'Prices include GST. Cancel any time.', variant: 'text-caption', fontSize: 11, fontWeight: 400, w: 420, h: 20 },
  { id: 'price', name: 'Price', sample: '₹1,990', variant: 'text-display', fontSize: 48, fontWeight: 800, w: 240, h: 60 },
  { id: 'stat', name: 'Stat number', sample: '48k', variant: 'text-display', fontSize: 42, fontWeight: 800, w: 180, h: 52 },
  { id: 'feature', name: 'Feature title', sample: 'Everything resolved', variant: 'text-h3', fontSize: 20, fontWeight: 600, w: 340, h: 32 },
  { id: 'testimonial', name: 'Testimonial', sample: '“The brief was complete before the kickoff.”', variant: 'text-quote', fontSize: 26, fontWeight: 400, w: 520, h: 84 },
  { id: 'code-block', name: 'Code block', sample: 'npm run dev', variant: 'text-code', fontSize: 13, fontWeight: 400, w: 340, h: 64 },
  { id: 'step', name: 'Step number', sample: '01', variant: 'text-label', fontSize: 12, fontWeight: 700, w: 72, h: 22 },
  { id: 'footer-line', name: 'Footer line', sample: '© 2026 Vector. All rights reserved.', variant: 'text-caption', fontSize: 10, fontWeight: 400, w: 460, h: 18 },
  { id: 'quote', name: 'Pull quote', sample: '“Fewer rounds, better screens.”', variant: 'text-quote', fontSize: 30, fontWeight: 400, w: 620, h: 80, premium: true },
  { id: 'caption', name: 'Caption', sample: 'Updated 2 minutes ago', variant: 'text-caption', fontSize: 11, fontWeight: 400, w: 320, h: 20 },
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
      { type: 'text', variant: 'text-caption', label: 'Your Name · Product design', x: 64, y: 226, w: 420, h: 22 },
    ],
  },
  {
    id: 'pricing-block',
    name: 'Pricing block',
    description: 'Three tiers with CTAs.',
    premium: true,
    build: (pageWidth) => {
      const cardW = Math.min(300, Math.floor((pageWidth - 128 - 32) / 3));
      return [0, 1, 2].flatMap((index): Array<Partial<CanvasItem>> => [
        { type: 'card' as CanvasItemType, variant: index === 1 ? 'card-elevated' : 'card-outline', label: ['Starter', 'Pro', 'Team'][index], x: 64 + index * (cardW + 16), y: 140, w: cardW, h: 248 },
        { type: 'text' as CanvasItemType, variant: 'text-h3', label: `₹${['0', '499', '1499'][index]}`, x: 84 + index * (cardW + 16), y: 300, w: cardW - 40, h: 32, fontSize: 22, fontWeight: 800 },
        { type: 'button' as CanvasItemType, variant: index === 1 ? 'btn-gradient' : 'btn-outline', label: 'Choose', x: 84 + index * (cardW + 16), y: 344, w: cardW - 40, h: 44 },
      ]);
    },
  },
  {
    id: 'feature-grid',
    name: 'Feature grid',
    description: 'Section heading with three feature cards.',
    build: (pageWidth): Array<Partial<CanvasItem>> => {
      const cardW = Math.min(300, Math.floor((pageWidth - 128 - 32) / 3));
      return [
        { type: 'text', variant: 'text-caption', label: 'WHAT YOU GET', x: 64, y: 64, w: 320, h: 22 },
        { type: 'text', variant: 'text-h2', label: 'Everything in one place', x: 64, y: 96, w: 640, h: 48, fontSize: 32, fontWeight: 800 },
        ...[0, 1, 2].flatMap((index): Array<Partial<CanvasItem>> => [
          { type: 'card', variant: 'card-elevated', label: ['Plan', 'Review', 'Ship'][index], x: 64 + index * (cardW + 16), y: 180, w: cardW, h: 190 },
          { type: 'text', variant: 'text-feature', label: ['One brief', 'One review', 'One export'][index], x: 84 + index * (cardW + 16), y: 300, w: cardW - 40, h: 28, fontSize: 18, fontWeight: 700 },
        ]),
      ];
    },
  },
  {
    id: 'stats-row',
    name: 'Stats row',
    description: 'Four proof-point numbers.',
    build: (pageWidth) => {
      const cardW = Math.floor((pageWidth - 128 - 48) / 4);
      return [0, 1, 2, 3].flatMap((index): Array<Partial<CanvasItem>> => [
        { type: 'card', variant: 'card-stat', label: ['48k', '12 min', '99.9%', '4.9/5'][index], x: 64 + index * (cardW + 16), y: 140, w: cardW, h: 150 },
        { type: 'text', variant: 'text-caption', label: ['Active users', 'To first brief', 'Uptime', 'Team rating'][index], x: 84 + index * (cardW + 16), y: 258, w: cardW - 40, h: 22 },
      ]);
    },
  },
  {
    id: 'testimonial-band',
    name: 'Testimonial',
    description: 'Quote, avatar and attribution.',
    build: () => [
      { type: 'card', variant: 'card-elevated', label: 'Testimonial', x: 64, y: 140, w: 720, h: 220 },
      { type: 'text', variant: 'text-quote', label: '“It cut our design review from four rounds to one.”', x: 96, y: 180, w: 640, h: 100, fontSize: 28 },
      { type: 'avatar', variant: 'avatar-initials', label: 'RG', x: 96, y: 300, w: 44, h: 44, color: '#5E6AD2' },
      { type: 'text', variant: 'text-caption', label: 'Roshna George · Product design', x: 156, y: 312, w: 380, h: 22 },
    ],
  },
  {
    id: 'faq-block',
    name: 'FAQ',
    description: 'Question heading and four accordion rows.',
    build: () => [
      { type: 'text', variant: 'text-h2', label: 'Questions, answered', x: 64, y: 100, w: 520, h: 48, fontSize: 32, fontWeight: 800 },
      { type: 'card', variant: 'accordion', label: 'Frequently asked', x: 64, y: 180, w: 640, h: 240 },
    ],
  },
  {
    id: 'cta-band',
    name: 'CTA band',
    description: 'A closing call to action.',
    build: (pageWidth) => [
      { type: 'card', variant: 'card-gradient', label: 'Start building', x: 64, y: 160, w: pageWidth - 128, h: 220 },
      { type: 'text', variant: 'text-display', label: 'Know what your prompt forgot.', x: 104, y: 210, w: 620, h: 72, fontSize: 38, fontWeight: 800, color: '#FFFFFF' },
      { type: 'button', variant: 'btn-dark', label: 'Start free', x: 104, y: 306, w: 160, h: 46 },
    ],
  },
  {
    id: 'footer-block',
    name: 'Footer',
    description: 'Three link columns and a legal line.',
    build: () => [
      { type: 'footer', variant: 'footer-default', label: 'Acme', x: 64, y: 640, w: 1120, h: 96 },
    ],
  },
  {
    id: 'auth-form',
    name: 'Auth form',
    description: 'Email, password and submit.',
    build: () => [
      { type: 'text', variant: 'text-h2', label: 'Welcome back', x: 64, y: 120, w: 420, h: 48, fontSize: 32, fontWeight: 800 },
      { type: 'text', variant: 'text-body', label: 'Sign in to continue to your projects.', x: 64, y: 180, w: 380, h: 44 },
      { type: 'input', variant: 'input-labelled', label: 'Email address', x: 64, y: 250, w: 340, h: 64 },
      { type: 'input', variant: 'input-float', label: 'Password', x: 64, y: 330, w: 340, h: 56 },
      { type: 'button', variant: 'btn-solid', label: 'Sign in', x: 64, y: 408, w: 340, h: 48 },
      { type: 'text', variant: 'text-caption', label: 'Forgot password?', x: 64, y: 472, w: 220, h: 22 },
    ],
  },
  {
    id: 'onboarding-steps',
    name: 'Onboarding steps',
    description: 'Three numbered steps with actions.',
    build: (): Array<Partial<CanvasItem>> => [
      { type: 'text', variant: 'text-caption', label: 'GETTING STARTED', x: 64, y: 100, w: 320, h: 22 },
      { type: 'text', variant: 'text-h2', label: 'Three steps to your first brief', x: 64, y: 132, w: 640, h: 48, fontSize: 30, fontWeight: 800 },
      ...[0, 1, 2].flatMap((index): Array<Partial<CanvasItem>> => [
        { type: 'card', variant: 'card-outline', label: `Step 0${index + 1}`, x: 64 + index * 280, y: 210, w: 260, h: 180 },
        { type: 'text', variant: 'text-feature', label: ['Create a project', 'Write one sentence', 'Generate the prompt'][index], x: 84 + index * 280, y: 330, w: 220, h: 28, fontSize: 16, fontWeight: 700 },
      ]),
    ],
  },
  {
    id: 'blog-card',
    name: 'Blog card',
    description: 'Cover image, title and meta.',
    build: () => [
      { type: 'card', variant: 'card-media', label: 'Designing with constraints', x: 64, y: 120, w: 420, h: 320 },
      { type: 'text', variant: 'text-caption', label: 'PRODUCT · 6 MIN READ', x: 84, y: 360, w: 340, h: 22 },
      { type: 'text', variant: 'text-h3', label: 'Designing with constraints', x: 84, y: 390, w: 340, h: 50, fontSize: 22, fontWeight: 700 },
    ],
  },
  {
    id: 'empty-state',
    name: 'Empty state',
    description: 'Illustration, explanation and one action.',
    build: () => [
      { type: 'card', variant: 'card-outline', label: 'Nothing here yet', x: 220, y: 180, w: 520, h: 300 },
      { type: 'text', variant: 'text-h3', label: 'Nothing here yet', x: 280, y: 300, w: 400, h: 40, fontSize: 24, fontWeight: 700, align: 'center' },
      { type: 'text', variant: 'text-body', label: 'Create your first project and the folder fills itself.', x: 300, y: 350, w: 360, h: 60, align: 'center' },
      { type: 'button', variant: 'btn-solid', label: 'New project', x: 360, y: 420, w: 240, h: 46 },
    ],
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
  {
    id: 'landing',
    name: 'Landing page',
    width: 1440,
    height: 900,
    build: (w) => [
      { type: 'navbar', variant: 'nav-marketing', label: 'Acme', x: 40, y: 0, w: w - 80, h: 64, color: '#5E6AD2' },
      { type: 'text', variant: 'text-caption', label: 'NEW · BUILT FOR TEAMS', x: 64, y: 120, w: 360, h: 22 },
      { type: 'text', variant: 'text-hero', label: 'The review layer for AI-built interfaces', x: 64, y: 156, w: 680, h: 160, fontSize: 60, fontWeight: 800 },
      { type: 'text', variant: 'text-large-body', label: 'Turn one vague sentence into a complete, scored prompt with every label and state resolved.', x: 64, y: 330, w: 560, h: 70, fontSize: 18 },
      { type: 'button', variant: 'btn-gradient', label: 'Start free', x: 64, y: 420, w: 180, h: 50 },
      { type: 'button', variant: 'btn-outline', label: 'See how it works', x: 260, y: 420, w: 200, h: 50 },
      { type: 'image', variant: 'image-framed', label: 'Product preview', x: w - 620, y: 150, w: 540, h: 380, color: '#5E6AD2' },
      { type: 'card', variant: 'card-stat', label: '48k', x: 64, y: 540, w: 280, h: 140 },
      { type: 'card', variant: 'card-stat', label: '12 min', x: 364, y: 540, w: 280, h: 140 },
      { type: 'card', variant: 'card-elevated', label: 'One complete brief', x: w - 620, y: 560, w: 540, h: 220 },
    ],
  },
  {
    id: 'pricing-page-cat',
    name: 'Pricing page',
    width: 1440,
    height: 900,
    build: (w): Array<Partial<CanvasItem>> => [
      { type: 'navbar', variant: 'nav-marketing', label: 'Acme', x: 40, y: 0, w: w - 80, h: 64, color: '#5E6AD2' },
      { type: 'text', variant: 'text-h2', label: 'Simple, honest pricing', x: 64, y: 120, w: 620, h: 56, fontSize: 42, fontWeight: 800 },
      { type: 'text', variant: 'text-body', label: 'Two full projects are free. Nothing is charged until you choose a plan.', x: 64, y: 190, w: 600, h: 50 },
      ...[0, 1, 2].flatMap((index): Array<Partial<CanvasItem>> => [
        { type: 'card', variant: index === 1 ? 'card-gradient' : 'card-outline', label: ['Free', 'Pro', 'Team'][index], x: 64 + index * 340, y: 280, w: 300, h: 340 },
        { type: 'text', variant: 'text-h3', label: ['₹0', '₹199', '₹1,499'][index], x: 88 + index * 340, y: 430, w: 250, h: 42, fontSize: 28, fontWeight: 800 },
        { type: 'button', variant: index === 1 ? 'btn-dark' : 'btn-outline', label: 'Choose', x: 88 + index * 340, y: 540, w: 252, h: 46 },
      ]),
      { type: 'card', variant: 'accordion', label: 'Pricing questions', x: 64, y: 660, w: 760, h: 180 },
    ],
  },
  {
    id: 'dashboard-cat',
    name: 'Dashboard',
    width: 1440,
    height: 900,
    build: (w) => [
      { type: 'navbar', variant: 'nav-sidebar', label: 'Workspace', x: 0, y: 0, w: 220, h: 900, color: '#5E6AD2' },
      { type: 'navbar', variant: 'nav-app', label: 'Overview', x: 220, y: 0, w: w - 220, h: 56, color: '#5E6AD2' },
      { type: 'card', variant: 'card-stat', label: '$48,200', x: 252, y: 88, w: 260, h: 150 },
      { type: 'card', variant: 'card-stat', label: '1,284', x: 528, y: 88, w: 260, h: 150 },
      { type: 'card', variant: 'card-stat', label: '98.2%', x: 804, y: 88, w: 260, h: 150 },
      { type: 'card', variant: 'card-stat', label: '4.9', x: 1080, y: 88, w: 260, h: 150 },
      { type: 'chart', variant: 'chart-line', label: 'Revenue trend', x: 252, y: 264, w: 700, h: 280, color: '#5E6AD2' },
      { type: 'chart', variant: 'chart-donut', label: 'Sources', x: 976, y: 264, w: 280, h: 280, color: '#0D99FF' },
      { type: 'table', variant: 'table-default', label: 'Recent activity', x: 252, y: 570, w: 1088, h: 260 },
    ],
  },
  {
    id: 'login-cat',
    name: 'Login',
    width: 1440,
    height: 900,
    build: () => [
      { type: 'card', variant: 'card-elevated', label: 'Sign in', x: 460, y: 130, w: 520, h: 560 },
      { type: 'text', variant: 'text-h2', label: 'Welcome back', x: 520, y: 200, w: 400, h: 48, fontSize: 34, fontWeight: 800 },
      { type: 'text', variant: 'text-body', label: 'Sign in to continue to your projects.', x: 520, y: 258, w: 380, h: 40 },
      { type: 'input', variant: 'input-labelled', label: 'Email address', x: 520, y: 330, w: 400, h: 64 },
      { type: 'input', variant: 'input-float', label: 'Password', x: 520, y: 410, w: 400, h: 56 },
      { type: 'button', variant: 'btn-solid', label: 'Sign in', x: 520, y: 490, w: 400, h: 48 },
      { type: 'text', variant: 'text-caption', label: 'Forgot password?', x: 520, y: 552, w: 200, h: 22 },
      { type: 'text', variant: 'text-caption', label: 'New here? Create an account', x: 520, y: 600, w: 380, h: 22 },
    ],
  },
  {
    id: 'signup-cat',
    name: 'Signup',
    width: 1440,
    height: 900,
    build: () => [
      { type: 'card', variant: 'card-elevated', label: 'Create account', x: 460, y: 110, w: 520, h: 620 },
      { type: 'text', variant: 'text-h2', label: 'Create your workspace', x: 520, y: 180, w: 420, h: 48, fontSize: 32, fontWeight: 800 },
      { type: 'input', variant: 'input-labelled', label: 'Your name', x: 520, y: 260, w: 400, h: 64 },
      { type: 'input', variant: 'input-labelled', label: 'Email address', x: 520, y: 340, w: 400, h: 64 },
      { type: 'input', variant: 'input-float', label: 'Password', x: 520, y: 420, w: 400, h: 56 },
      { type: 'input', variant: 'input-consent', label: 'I agree to the terms', x: 520, y: 496, w: 400, h: 28 },
      { type: 'button', variant: 'btn-solid', label: 'Create account', x: 520, y: 550, w: 400, h: 50 },
      { type: 'text', variant: 'text-caption', label: 'Already have an account? Sign in', x: 520, y: 616, w: 400, h: 22 },
    ],
  },
  {
    id: 'checkout-cat',
    name: 'Checkout',
    width: 1440,
    height: 900,
    build: (w) => [
      { type: 'navbar', variant: 'nav-app', label: 'Checkout', x: 0, y: 0, w, h: 56, color: '#5E6AD2' },
      { type: 'text', variant: 'text-h2', label: 'Checkout', x: 64, y: 100, w: 400, h: 46, fontSize: 34, fontWeight: 800 },
      { type: 'card', variant: 'card-outline', label: 'Contact', x: 64, y: 170, w: 640, h: 180 },
      { type: 'input', variant: 'input-labelled', label: 'Email address', x: 88, y: 220, w: 400, h: 64 },
      { type: 'card', variant: 'card-outline', label: 'Payment', x: 64, y: 370, w: 640, h: 300 },
      { type: 'input', variant: 'input-labelled', label: 'Card number', x: 88, y: 420, w: 400, h: 64 },
      { type: 'input', variant: 'input-labelled', label: 'Name on card', x: 88, y: 500, w: 400, h: 64 },
      { type: 'card', variant: 'card-elevated', label: 'Order summary', x: 740, y: 170, w: 340, h: 380 },
      { type: 'button', variant: 'btn-solid', label: 'Pay now', x: 88, y: 590, w: 400, h: 50 },
    ],
  },
  {
    id: 'blog-cat',
    name: 'Blog index',
    width: 1440,
    height: 900,
    build: (w): Array<Partial<CanvasItem>> => [
      { type: 'navbar', variant: 'nav-marketing', label: 'Acme', x: 40, y: 0, w: w - 80, h: 64, color: '#5E6AD2' },
      { type: 'text', variant: 'text-h2', label: 'Notes on shipping better interfaces', x: 64, y: 120, w: 760, h: 56, fontSize: 42, fontWeight: 800 },
      ...[0, 1, 2, 3].flatMap((index): Array<Partial<CanvasItem>> => [
        { type: 'card', variant: 'card-media', label: ['Design', 'Systems', 'Teams', 'AI'][index], x: 64 + (index % 2) * 360, y: 220 + Math.floor(index / 2) * 300, w: 330, h: 260 },
        { type: 'text', variant: 'text-caption', label: '6 MIN READ', x: 84 + (index % 2) * 360, y: 390 + Math.floor(index / 2) * 300, w: 260, h: 22 },
      ]),
    ],
  },
  {
    id: 'settings-cat',
    name: 'Settings',
    width: 1440,
    height: 900,
    build: (w) => [
      { type: 'navbar', variant: 'nav-sidebar', label: 'Settings', x: 0, y: 0, w: 220, h: 900, color: '#5E6AD2' },
      { type: 'text', variant: 'text-h2', label: 'Settings', x: 260, y: 100, w: 400, h: 46, fontSize: 34, fontWeight: 800 },
      { type: 'card', variant: 'card-outline', label: 'Profile', x: 260, y: 170, w: 760, h: 220 },
      { type: 'avatar', variant: 'avatar-initials', label: 'RG', x: 290, y: 210, w: 64, h: 64, color: '#5E6AD2' },
      { type: 'input', variant: 'input-labelled', label: 'Display name', x: 380, y: 210, w: 340, h: 64 },
      { type: 'input', variant: 'input-labelled', label: 'Email address', x: 380, y: 290, w: 340, h: 64 },
      { type: 'card', variant: 'card-outline', label: 'Appearance', x: 260, y: 410, w: 760, h: 220 },
      { type: 'input', variant: 'input-toggle', label: 'Email notifications', x: 290, y: 470, w: 300, h: 32 },
      { type: 'button', variant: 'btn-solid', label: 'Save changes', x: 260, y: 660, w: 180, h: 48 },
    ],
  },
  {
    id: 'error-404',
    name: '404 page',
    width: 1440,
    height: 900,
    build: () => [
      { type: 'text', variant: 'text-caption', label: '404', x: 64, y: 120, w: 120, h: 24 },
      { type: 'text', variant: 'text-display', label: 'This page does not exist.', x: 64, y: 156, w: 760, h: 72, fontSize: 48, fontWeight: 800 },
      { type: 'text', variant: 'text-body', label: 'The link may be old, or the address may have a typo.', x: 64, y: 244, w: 520, h: 50 },
      { type: 'button', variant: 'btn-solid', label: 'Back to home', x: 64, y: 320, w: 180, h: 48 },
      { type: 'button', variant: 'btn-ghost', label: 'Contact us', x: 260, y: 320, w: 160, h: 48 },
    ],
  },
  {
    id: 'mobile-app',
    name: 'Mobile screen',
    width: 390,
    height: 844,
    build: () => [
      { type: 'navbar', variant: 'nav-app', label: 'Acme', x: 0, y: 0, w: 390, h: 56, color: '#5E6AD2' },
      { type: 'text', variant: 'text-h2', label: 'Good morning, Roshna', x: 20, y: 84, w: 340, h: 40, fontSize: 26, fontWeight: 800 },
      { type: 'card', variant: 'card-stat', label: '₹48,200', x: 20, y: 144, w: 160, h: 130 },
      { type: 'card', variant: 'card-stat', label: '1,284', x: 200, y: 144, w: 160, h: 130 },
      { type: 'card', variant: 'card-list', label: 'Recent activity', x: 20, y: 294, w: 350, h: 260 },
      { type: 'button', variant: 'btn-solid', label: 'View all', x: 20, y: 574, w: 350, h: 48 },
    ],
  },
  {
    id: 'tablet-app',
    name: 'Tablet screen',
    width: 834,
    height: 1112,
    build: () => [
      { type: 'navbar', variant: 'nav-tabs', label: 'Overview', x: 0, y: 0, w: 834, h: 56, color: '#5E6AD2' },
      { type: 'text', variant: 'text-h2', label: 'Overview', x: 32, y: 96, w: 500, h: 46, fontSize: 34, fontWeight: 800 },
      { type: 'card', variant: 'card-stat', label: '$48,200', x: 32, y: 164, w: 360, h: 160 },
      { type: 'card', variant: 'card-stat', label: '1,284', x: 416, y: 164, w: 360, h: 160 },
      { type: 'chart', variant: 'chart-line', label: 'Trend', x: 32, y: 350, w: 744, h: 300, color: '#5E6AD2' },
      { type: 'table', variant: 'table-default', label: 'Activity', x: 32, y: 680, w: 744, h: 320 },
    ],
  },
  {
    id: 'email-cat',
    name: 'Email',
    width: 600,
    height: 800,
    build: () => [
      { type: 'navbar', variant: 'nav-light', label: 'Acme', x: 0, y: 0, w: 600, h: 56, color: '#5E6AD2' },
      { type: 'text', variant: 'text-h2', label: 'Your workspace is ready', x: 32, y: 96, w: 500, h: 46, fontSize: 28, fontWeight: 800 },
      { type: 'text', variant: 'text-body', label: 'Hi Roshna — your Vector workspace is ready. Sign in to create your first brief.', x: 32, y: 156, w: 500, h: 80 },
      { type: 'button', variant: 'btn-solid', label: 'Open workspace', x: 32, y: 260, w: 220, h: 48 },
      { type: 'image', variant: 'image-rounded', label: 'Preview', x: 32, y: 340, w: 536, h: 220, color: '#5E6AD2' },
      { type: 'text', variant: 'text-caption', label: 'Vector · requirement engineering', x: 32, y: 600, w: 400, h: 20 },
    ],
  },
  {
    id: 'presentation-cat',
    name: 'Presentation',
    width: 1920,
    height: 1080,
    build: (w) => [
      { type: 'text', variant: 'text-caption', label: 'VECTOR · 2026', x: 96, y: 96, w: 400, h: 24 },
      { type: 'text', variant: 'text-hero', label: 'Know what your prompt forgot.', x: 96, y: 150, w: 1100, h: 180, fontSize: 78, fontWeight: 800 },
      { type: 'text', variant: 'text-large-body', label: 'A complete, reviewed interface brief before the first line of code.', x: 96, y: 360, w: 900, h: 80, fontSize: 24 },
      { type: 'card', variant: 'card-gradient', label: '48k', x: w - 620, y: 180, w: 480, h: 360 },
      { type: 'text', variant: 'text-caption', label: '01 / 12', x: 96, y: 980, w: 200, h: 24 },
    ],
  },
  {
    id: 'story-cat',
    name: 'Story',
    width: 1080,
    height: 1920,
    build: () => [
      { type: 'card', variant: 'card-gradient', label: 'New drop', x: 0, y: 0, w: 1080, h: 1920 },
      { type: 'text', variant: 'text-display', label: '30% off this week', x: 96, y: 1320, w: 880, h: 140, fontSize: 84, fontWeight: 800, color: '#FFFFFF' },
      { type: 'text', variant: 'text-body', label: 'In stores and online.', x: 96, y: 1480, w: 700, h: 50, color: '#FFFFFF' },
      { type: 'button', variant: 'btn-dark', label: 'Shop now', x: 96, y: 1580, w: 240, h: 60 },
    ],
  },
  {
    id: 'menu-cat',
    name: 'Menu page',
    width: 1440,
    height: 900,
    build: (w) => [
      { type: 'navbar', variant: 'nav-light', label: 'Acme', x: 40, y: 0, w: w - 80, h: 64, color: '#5E6AD2' },
      { type: 'text', variant: 'text-h2', label: 'The menu', x: 64, y: 120, w: 500, h: 56, fontSize: 42, fontWeight: 800 },
      { type: 'card', variant: 'card-list', label: 'Small plates', x: 64, y: 200, w: 600, h: 260 },
      { type: 'card', variant: 'card-list', label: 'Mains', x: 64, y: 480, w: 600, h: 260 },
      { type: 'card', variant: 'card-elevated', label: 'Reserve a table', x: 740, y: 200, w: 340, h: 240 },
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
