import type { CanvasItem, CanvasItemType } from './canvas.ts';

/**
 * Hand-composed canvas layouts.
 *
 * A template is not "some blocks stacked vertically" — opening one should show
 * the design you previewed. These are explicit coordinates on the 1200×800
 * artboard, using the same styled variants as the palette so the result is
 * editable and the prompt reads correctly.
 */

let seq = 0;
function el(
  type: CanvasItemType,
  variant: string,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color?: string
): CanvasItem {
  seq += 1;
  return { id: `lay_${seq}_${Math.random().toString(36).slice(2, 7)}`, type, variant, x, y, w, h, label, color };
}

const VIOLET = '#7C5CFF';
const BLUE = '#4D7CFE';
const CYAN = '#22D3EE';
const CORAL = '#FF7A59';
const SUN = '#FFC53D';

const LAYOUTS: Record<string, CanvasItem[]> = {
  /* ------------------------------------------------------- dashboards */
  'saas-dashboard': [
    el('navbar', 'nav-light', 40, 0, 1120, 64, 'Northwind', VIOLET),
    el('card', 'card-outline', 40, 88, 220, 660, 'Navigation'),
    el('card', 'card-stat', 284, 88, 205, 120, 'Revenue', VIOLET),
    el('card', 'card-stat', 504, 88, 205, 120, 'Churn', CYAN),
    el('card', 'card-stat', 724, 88, 205, 120, 'Signups', BLUE),
    el('card', 'card-stat', 944, 88, 205, 120, 'MRR', CORAL),
    el('chart', 'chart-bars', 284, 232, 865, 210, 'Revenue by month', VIOLET),
    el('text', 'text-h3', 284, 466, 300, 28, 'Recent orders'),
    el('table', 'table-default', 284, 504, 865, 244, 'Orders'),
  ],

  /* --------------------------------------------------------- commerce */
  'commerce-product': [
    el('navbar', 'nav-light', 40, 0, 1120, 64, 'Atelier', CORAL),
    el('image', 'image-rounded', 40, 100, 520, 440, 'Merino wool coat', CORAL),
    el('image', 'image-rounded', 40, 556, 120, 100, 'Detail 1', CORAL),
    el('image', 'image-rounded', 174, 556, 120, 100, 'Detail 2', CORAL),
    el('image', 'image-rounded', 308, 556, 120, 100, 'Detail 3', CORAL),
    el('image', 'image-rounded', 442, 556, 118, 100, 'Detail 4', CORAL),
    el('text', 'text-h2', 600, 108, 540, 44, 'Merino Wool Coat'),
    el('text', 'text-h3', 600, 168, 240, 30, '₹8,400'),
    el('text', 'text-body', 600, 214, 500, 66, 'Double-faced merino, cut relaxed, finished with horn buttons. Made in a small run of 120.'),
    el('input', 'input-labelled', 600, 306, 360, 64, 'Size'),
    el('button', 'btn-dark', 600, 392, 520, 56, 'Add to bag'),
    el('text', 'text-caption', 600, 468, 420, 22, 'Free returns · Ships in 2 days'),
    el('badge', 'badge-soft', 600, 510, 92, 28, 'Low stock', CORAL),
  ],

  /* ------------------------------------------------------------- auth */
  'auth-suite': [
    el('card', 'card-elevated', 370, 120, 460, 520, 'Sign in'),
    el('text', 'text-h2', 430, 176, 340, 40, 'Welcome back'),
    el('text', 'text-body', 430, 222, 340, 44, 'Sign in to pick up your projects.'),
    el('input', 'input-labelled', 430, 288, 340, 64, 'Work email'),
    el('input', 'input-float', 430, 368, 340, 56, 'Password'),
    el('button', 'btn-solid', 430, 444, 340, 48, 'Sign in', VIOLET),
    el('button', 'btn-ghost', 430, 504, 340, 40, 'Forgot password?'),
    el('text', 'text-caption', 430, 566, 340, 22, 'By continuing you agree to the terms.'),
  ],

  /* ---------------------------------------------------------- pricing */
  'pricing-page': [
    el('navbar', 'nav-light', 40, 0, 1120, 64, 'Northwind', VIOLET),
    el('text', 'text-display', 40, 108, 760, 60, 'Simple pricing'),
    el('text', 'text-body', 40, 176, 560, 44, 'Two projects free. Upgrade when the work grows.'),
    el('card', 'card-outline', 40, 250, 350, 420, 'Starter'),
    el('text', 'text-h3', 68, 286, 240, 28, 'Starter'),
    el('text', 'text-display', 68, 322, 240, 52, '₹0'),
    el('button', 'btn-outline', 68, 596, 294, 48, 'Start free'),
    el('card', 'card-elevated', 414, 232, 372, 456, 'Pro'),
    el('badge', 'badge-solid', 430, 258, 70, 26, 'Popular', VIOLET),
    el('text', 'text-h3', 446, 300, 240, 28, 'Pro'),
    el('text', 'text-display', 446, 336, 240, 52, '₹499'),
    el('button', 'btn-gradient', 446, 604, 308, 52, 'Choose Pro'),
    el('card', 'card-outline', 810, 250, 350, 420, 'Team'),
    el('text', 'text-h3', 838, 286, 240, 28, 'Team'),
    el('text', 'text-display', 838, 322, 240, 52, '₹1,499'),
    el('button', 'btn-outline', 838, 596, 294, 48, 'Talk to us'),
    el('text', 'text-caption', 40, 690, 400, 22, 'Prices exclude GST. Cancel any time.'),
  ],

  /* --------------------------------------------------------- landing */
  'landing-hero': [
    el('navbar', 'nav-dark', 40, 0, 1120, 64, 'Northwind', CYAN),
    el('text', 'text-display', 40, 122, 640, 116, 'Design at the speed of thought'),
    el('text', 'text-body', 40, 252, 520, 66, 'Turn an idea into a complete, reviewed interface brief in minutes. No blank page, no guessing.'),
    el('button', 'btn-gradient', 40, 340, 210, 52, 'Start free'),
    el('button', 'btn-outline', 266, 340, 180, 52, 'Watch demo'),
    el('text', 'text-caption', 40, 416, 420, 22, 'Trusted by 4,000 product teams'),
    el('image', 'image-rounded', 700, 122, 460, 380, 'Product preview', VIOLET),
    el('card', 'card-stat', 40, 476, 200, 120, 'Time saved', CYAN),
    el('card', 'card-stat', 256, 476, 200, 120, 'Rework', VIOLET),
    el('card', 'card-stat', 472, 476, 200, 120, 'Adoption', BLUE),
    el('footer', 'footer-default', 40, 640, 1120, 90, 'Northwind'),
  ],

  /* ------------------------------------------------------- admin table */
  'admin-table': [
    el('navbar', 'nav-light', 40, 0, 1120, 64, 'Northwind', BLUE),
    el('text', 'text-h2', 40, 96, 500, 44, 'Orders'),
    el('text', 'text-body', 40, 148, 520, 24, '1,284 orders this month'),
    el('input', 'input-search', 40, 190, 380, 44, 'Search orders'),
    el('badge', 'badge-dot', 436, 198, 108, 26, 'Live', CYAN),
    el('button', 'btn-solid', 1000, 190, 160, 44, 'Export CSV', BLUE),
    el('table', 'table-default', 40, 258, 1120, 400, 'Orders'),
    el('footer', 'footer-default', 40, 682, 1120, 84, 'Northwind'),
  ],

  /* ------------------------------------------------------------- chat */
  'chat-interface': [
    el('card', 'card-outline', 40, 40, 280, 720, 'Threads'),
    el('input', 'input-search', 60, 64, 240, 40, 'Search'),
    el('text', 'text-h3', 64, 124, 220, 26, 'Design review'),
    el('text', 'text-caption', 64, 156, 220, 20, '3 members'),
    el('text', 'text-h3', 360, 60, 340, 28, 'Design review'),
    el('card', 'card-elevated', 360, 116, 520, 92, 'Can we tighten the pricing table?'),
    el('card', 'card-gradient', 640, 228, 520, 92, 'Yes — merging the last two rows.'),
    el('card', 'card-elevated', 360, 340, 560, 92, 'Ship it after the a11y pass.'),
    el('text', 'text-caption', 360, 456, 300, 20, 'Roshna is typing…'),
    el('input', 'input-labelled', 360, 690, 640, 56, 'Message'),
    el('button', 'btn-solid', 1024, 690, 136, 56, 'Send', VIOLET),
  ],

  /* ----------------------------------------------------------- mobile */
  'mobile-feed': [
    el('card', 'card-outline', 420, 40, 360, 720, 'Feed'),
    el('image', 'image-rounded', 444, 96, 312, 260, 'Today’s picks', CORAL),
    el('text', 'text-h3', 444, 380, 312, 30, 'Linen, in four colours'),
    el('text', 'text-body', 444, 416, 312, 60, 'A quiet capsule for the shoulder season. Cut relaxed, washed twice.'),
    el('button', 'btn-pill', 444, 496, 148, 44, 'Save', CORAL),
    el('button', 'btn-ghost', 604, 496, 152, 44, 'Share'),
    el('badge', 'badge-dot', 444, 566, 108, 26, 'In stock', CYAN),
    el('input', 'input-search', 444, 660, 312, 44, 'Search the feed'),
  ],

  /* --------------------------------------------------------- settings */
  'settings-panel': [
    el('card', 'card-outline', 40, 40, 260, 720, 'Settings'),
    el('text', 'text-h2', 340, 64, 480, 44, 'Profile'),
    el('text', 'text-caption', 340, 122, 300, 22, 'Account details'),
    el('input', 'input-labelled', 340, 160, 420, 64, 'Full name'),
    el('input', 'input-labelled', 340, 240, 420, 64, 'Email'),
    el('input', 'input-float', 340, 320, 420, 56, 'Password'),
    el('button', 'btn-dark', 340, 400, 220, 48, 'Save changes'),
    el('card', 'card-elevated', 800, 160, 360, 250, 'Danger zone'),
    el('text', 'text-body', 824, 208, 312, 64, 'Deleting the account removes every project, prompt and deployment.'),
    el('button', 'btn-outline', 824, 300, 312, 48, 'Delete account', CORAL),
  ],

  /* -------------------------------------------------------- portfolio */
  'portfolio-grid': [
    el('text', 'text-display', 40, 72, 700, 60, 'Your Name'),
    el('text', 'text-body', 40, 148, 520, 44, 'Product designer working on developer tools and design systems.'),
    el('text', 'text-caption', 40, 214, 300, 22, 'Selected work'),
    el('image', 'image-rounded', 40, 250, 540, 220, 'Northwind dashboard', VIOLET),
    el('image', 'image-rounded', 600, 250, 540, 220, 'Atelier storefront', CORAL),
    el('image', 'image-rounded', 40, 490, 540, 220, 'Chat product', CYAN),
    el('image', 'image-rounded', 600, 490, 540, 220, 'Pricing page', BLUE),
    el('button', 'btn-dark', 40, 726, 200, 44, 'Get in touch'),
  ],
};

/** Returns the composed layout for a template, or null when there is none. */
export function layoutForTemplate(id: string): CanvasItem[] | null {
  const layout = LAYOUTS[id];
  if (!layout) return null;
  // Clone so an editing session never mutates the shared definition.
  return layout.map((item) => ({ ...item, id: `el_${Math.random().toString(36).slice(2, 9)}` }));
}

export const HAS_LAYOUT = (id: string): boolean => !!LAYOUTS[id];

export const LAYOUT_ACCENTS: Record<string, string> = {  'saas-dashboard': VIOLET,
  'commerce-product': CORAL,
  'auth-suite': VIOLET,
  'pricing-page': VIOLET,
  'landing-hero': CYAN,
  'admin-table': BLUE,
  'chat-interface': VIOLET,
  'mobile-feed': CORAL,
  'settings-panel': BLUE,
  'portfolio-grid': SUN,
};

/* ------------------------------------------------------------------ */
/* Device-aware starters                                               */
/* ------------------------------------------------------------------ */

export const DEVICE_FRAMES: Record<'desktop' | 'tablet' | 'mobile', { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 834, height: 1194 },
  mobile: { width: 390, height: 844 },
};

/**
 * One-column layout for narrow frames. A 1200px dashboard does not fit a phone,
 * so the block list is re-flowed instead of cropped.
 */
export function stackItems(
  blocks: Array<{ type: string; label: string }>,
  width: number,
  height: number,
  accent = VIOLET
): CanvasItem[] {
  const pad = 16;
  const inner = width - pad * 2;
  const items: CanvasItem[] = [];
  let y = 0;
  let counter = 0;

  const push = (type: CanvasItem['type'], variant: string, w: number, h: number, label: string, color?: string) => {
    counter += 1;
    items.push({
      id: `stack_${counter}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      variant,
      x: pad,
      y,
      w,
      h,
      label,
      color,
    });
    y += h + 12;
  };

  blocks.forEach((block) => {
    switch (block.type) {
      case 'navbar':
        push('navbar', 'nav-light', inner, 56, block.label, accent);
        break;
      case 'heading':
        push('text', 'text-h2', inner, 40, block.label);
        break;
      case 'text':
        push('text', 'text-body', inner, 52, block.label);
        break;
      case 'button':
        push('button', 'btn-solid', Math.min(inner, 220), 48, block.label, accent);
        break;
      case 'input':
      case 'dropdown':
      case 'checkbox':
        push('input', 'input-labelled', inner, 56, block.label);
        break;
      case 'image':
        push('image', 'image-rounded', inner, 180, block.label, accent);
        break;
      case 'chart':
        push('chart', 'chart-bars', inner, 150, block.label, accent);
        break;
      case 'table':
        push('table', 'table-default', inner, 170, block.label);
        break;
      case 'card':
      case 'sidebar':
        push('card', 'card-elevated', inner, 130, block.label, accent);
        break;
      case 'modal':
        push('modal', 'modal-default', inner, 190, block.label);
        break;
      case 'footer':
        break;
      default:
        push('card', 'card-outline', inner, 120, block.label);
    }
  });

  return items.filter((item) => item.y + item.h <= height + 80);
}
