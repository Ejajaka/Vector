import type { ActiveTab } from '../types/analysis.ts';

export type TemplateCategory =
  | 'Dashboard'
  | 'Marketing'
  | 'Commerce'
  | 'Auth'
  | 'Mobile'
  | 'Data'
  | 'Collaboration';

export interface TemplateBlock {
  /** Element type understood by the UI prompt schema. */
  type: string;
  label: string;
  /** Attributes pre-filled from this block, in plain language. */
  attrs: string[];
}

export interface TemplatePageDef {
  name: string;
  blocks: TemplateBlock[];
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  tagline: string;
  description: string;
  tags: string[];
  palette: [string, string];
  blocks: TemplateBlock[];
  /** Extra pages beyond the first. */
  pages?: TemplatePageDef[];
  /** Which workspace tab the template should open into. */
  opensAt: ActiveTab;
  /** Requires a paid plan. */
  pro?: boolean;
  /** Target device for the starter frame. */
  device?: 'desktop' | 'tablet' | 'mobile';
}

export const TEMPLATE_CATEGORIES: Array<TemplateCategory | 'All'> = [
  'All',
  'Dashboard',
  'Marketing',
  'Commerce',
  'Auth',
  'Mobile',
  'Data',
  'Collaboration',
];

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'saas-dashboard',
    name: 'SaaS Analytics Dashboard',
    category: 'Dashboard',
    tagline: 'KPI cards, trend charts and a sidebar your users already understand.',
    description:
      'A production-shaped analytics surface: collapsible sidebar, four KPI cards with delta indicators, a 30-day trend chart, and a recent-activity table. Every element arrives with its required attributes pre-filled so the prompt is complete on load.',
    tags: ['analytics', 'kpi', 'chart', 'sidebar'],
    palette: ['#E7EEEC', '#C9DAD6'],
    opensAt: 'requirements',
    blocks: [
      { type: 'sidebar', label: 'Navigation rail', attrs: ['left edge, 240px', 'teal #49686C', 'Overview, Reports, Settings'] },
      { type: 'card', label: 'KPI cards ×4', attrs: ['top row, 4 across', 'white surface', 'Revenue, Churn, Signups, MRR'] },
      { type: 'image', label: 'Trend chart', attrs: ['below KPIs, full width', 'line + area, 30 days'] },
      { type: 'dropdown', label: 'Date range', attrs: ['top right of chart', 'Last 7 / 30 / 90 days'] },
      { type: 'button', label: 'Export', attrs: ['top right header', 'downloads CSV'] },
    ],
    pages: [
      {
        name: 'Reports',
        blocks: [
          { type: 'navbar', label: 'Top navigation', attrs: ['Overview, Reports, Settings'] },
          { type: 'heading', label: 'Monthly report', attrs: ['page title'] },
          { type: 'chart', label: 'Revenue vs churn', attrs: ['dual axis, 12 months'] },
          { type: 'table', label: 'Export history', attrs: ['date, owner, status'] },
        ],
      },
      {
        name: 'Settings',
        blocks: [
          { type: 'navbar', label: 'Top navigation', attrs: ['Overview, Reports, Settings'] },
          { type: 'card', label: 'Workspace', attrs: ['name, plan, seats'] },
          { type: 'input', label: 'Billing email', attrs: ['validated'] },
          { type: 'button', label: 'Save changes', attrs: ['bottom right'] },
        ],
      },
    ],
  },
  {
    id: 'commerce-product',
    name: 'Product Detail Page',
    category: 'Commerce',
    tagline: 'Gallery, variant picker and a sticky add-to-cart.',
    description:
      'The page that decides revenue. Large image gallery with thumbnails, title and price block, size and colour selectors, quantity stepper, sticky add-to-cart, and a delivery/returns strip.',
    tags: ['ecommerce', 'pdp', 'variants', 'cart'],
    palette: ['#F1EAE2', '#DCCDBE'],
    opensAt: 'requirements',
    device: 'mobile',
    blocks: [
      { type: 'image', label: 'Product gallery', attrs: ['left column, 60% width', 'main image + 4 thumbnails'] },
      { type: 'card', label: 'Buy panel', attrs: ['right column, sticky', 'title, price, rating'] },
      { type: 'dropdown', label: 'Size selector', attrs: ['below price', 'XS–XXL, disabled states'] },
      { type: 'button', label: 'Add to cart', attrs: ['full width, high contrast', 'opens cart drawer'] },
      { type: 'checkbox', label: 'Gift wrap', attrs: ['below CTA', 'adds ₹99'] },
    ],
    pages: [
      {
        name: 'Cart',
        blocks: [
          { type: 'navbar', label: 'Top navigation', attrs: ['brand, search, bag'] },
          { type: 'card', label: 'Line items', attrs: ['image, title, size, qty'] },
          { type: 'input', label: 'Promo code', attrs: ['inline apply button'] },
          { type: 'button', label: 'Checkout', attrs: ['full width, sticky'] },
        ],
      },
    ],
  },
  {
    id: 'auth-suite',
    name: 'Auth & Onboarding',
    category: 'Auth',
    tagline: 'Sign in, sign up, reset — with every error state designed.',
    description:
      'Split-screen auth with brand panel, email/password fields, social buttons, inline validation, and a three-step onboarding that collects role, team size and intent before the first project.',
    tags: ['login', 'signup', 'onboarding', 'validation'],
    palette: ['#E8EDF3', '#CBD8E6'],
    opensAt: 'requirements',
    device: 'mobile',
    blocks: [
      { type: 'card', label: 'Form card', attrs: ['centered, 420px', 'white, 12px radius'] },
      { type: 'input', label: 'Email field', attrs: ['label above', 'inline validation'] },
      { type: 'input', label: 'Password field', attrs: ['show/hide toggle', 'strength meter'] },
      { type: 'button', label: 'Continue', attrs: ['full width', 'disabled until valid'] },
      { type: 'footer', label: 'Legal strip', attrs: ['below card', 'Terms & Privacy links'] },
    ],
    pages: [
      {
        name: 'Onboarding',
        blocks: [
          { type: 'heading', label: 'Tell us about your team', attrs: ['step 1 of 3'] },
          { type: 'input', label: 'Company name', attrs: ['required'] },
          { type: 'dropdown', label: 'Team size', attrs: ['1–10, 11–50, 51+'] },
          { type: 'button', label: 'Continue', attrs: ['disabled until valid'] },
        ],
      },
      {
        name: 'Reset password',
        blocks: [
          { type: 'heading', label: 'Reset your password', attrs: ['centred'] },
          { type: 'input', label: 'Email', attrs: ['prefilled'] },
          { type: 'button', label: 'Send reset link', attrs: ['full width'] },
        ],
      },
    ],
  },
  {
    id: 'pricing-page',
    name: 'Pricing Page',
    category: 'Marketing',
    tagline: 'Three tiers, a comparison table and an objection-handling FAQ.',
    description:
      'Monthly/annual toggle with a discount badge, three plan cards with the recommended tier highlighted, a feature comparison table, and an FAQ that answers the four questions that kill conversion.',
    tags: ['pricing', 'plans', 'comparison', 'faq'],
    palette: ['#F0EDE3', '#DDD6C4'],
    opensAt: 'pricing',
    blocks: [
      { type: 'navbar', label: 'Top navigation', attrs: ['sticky, transparent → solid on scroll', 'logo left, links centre'] },
      { type: 'card', label: 'Plan cards ×3', attrs: ['equal height', 'middle card highlighted'] },
      { type: 'checkbox', label: 'Billing toggle', attrs: ['monthly / annual', 'saves 17%'] },
      { type: 'button', label: 'Choose plan', attrs: ['per card', 'opens checkout'] },
      { type: 'footer', label: 'FAQ accordion', attrs: ['below table', '4 questions'] },
    ],
  },
  {
    id: 'landing-hero',
    name: 'Landing Page Hero',
    category: 'Marketing',
    tagline: 'Headline, proof and one unmistakable call to action.',
    description:
      'Above-the-fold structure that converts: oversized headline with a single idea, supporting line, primary and secondary CTA, social proof row, and a product screenshot in a tilted frame.',
    tags: ['hero', 'landing', 'cta', 'social proof'],
    palette: ['#EFEAF6', '#D6CFE8'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Header bar', attrs: ['fixed, blur backdrop', 'logo, 4 links, Sign in'] },
      { type: 'image', label: 'Hero visual', attrs: ['right half, product screenshot', 'subtle tilt on scroll'] },
      { type: 'button', label: 'Primary CTA', attrs: ['solid, large', 'Start free'] },
      { type: 'button', label: 'Secondary CTA', attrs: ['ghost, beside primary', 'Watch 2-min demo'] },
      { type: 'footer', label: 'Proof strip', attrs: ['below fold', '5 customer logos'] },
    ],
  },
  {
    id: 'admin-table',
    name: 'Admin Data Table',
    category: 'Data',
    tagline: 'Filters, bulk actions and pagination that survive real row counts.',
    description:
      'Dense but readable table: filter chips, search, column sorting, row selection with a bulk action bar, status pills, and server-side pagination. Includes empty, loading and error states.',
    tags: ['table', 'filters', 'bulk actions', 'pagination'],
    palette: ['#E9EEF0', '#CBD7DA'],
    opensAt: 'requirements',
    blocks: [
      { type: 'input', label: 'Search field', attrs: ['top left', 'debounced 300ms'] },
      { type: 'dropdown', label: 'Filter chips', attrs: ['status, owner, date', 'clear all'] },
      { type: 'card', label: 'Data table', attrs: ['full width', 'sticky header, zebra rows'] },
      { type: 'checkbox', label: 'Row selection', attrs: ['left column', 'select all'] },
      { type: 'button', label: 'Bulk actions', attrs: ['appears on selection', 'archive, export'] },
    ],
  },
  {
    id: 'chat-interface',
    name: 'Chat Interface',
    category: 'Collaboration',
    tagline: 'Thread list, message stream and a composer that stays put.',
    description:
      'Two-pane chat: conversation list with unread badges, message stream with avatars and timestamps, typing indicator, and a composer with attachment and send controls.',
    tags: ['chat', 'messaging', 'composer', 'threads'],
    palette: ['#E6F0EC', '#C7DED6'],
    opensAt: 'requirements',
    blocks: [
      { type: 'sidebar', label: 'Thread list', attrs: ['left pane, 280px', 'search + unread badges'] },
      { type: 'image', label: 'Message stream', attrs: ['center, scrollable', 'avatars + timestamps'] },
      { type: 'input', label: 'Composer', attrs: ['pinned bottom', 'attach + send'] },
      { type: 'button', label: 'Send', attrs: ['right of composer', 'disabled when empty'] },
      { type: 'modal', label: 'New thread', attrs: ['centred', 'pick participants'] },
    ],
  },
  {
    id: 'mobile-feed',
    name: 'Mobile App Screen',
    category: 'Mobile',
    tagline: 'Bottom tabs, feed cards and a floating action button.',
    description:
      'A native-feeling mobile screen at 390×844: status bar safe area, header, scrollable feed of media cards, bottom tab bar with five items, and a floating action button.',
    tags: ['mobile', 'feed', 'tabs', 'fab'],
    palette: ['#F3EEE6', '#E0D5C5'],
    opensAt: 'requirements',
    device: 'mobile',
    blocks: [
      { type: 'navbar', label: 'App header', attrs: ['safe area top', 'title + avatar'] },
      { type: 'card', label: 'Feed cards', attrs: ['vertical stack', 'image, caption, actions'] },
      { type: 'image', label: 'Media', attrs: ['4:5 aspect', 'lazy loaded'] },
      { type: 'button', label: 'Floating action', attrs: ['bottom right, 56px', 'opens composer'] },
      { type: 'footer', label: 'Tab bar', attrs: ['5 tabs, sticky', 'home, search, create, inbox, profile'] },
    ],
  },
  {
    id: 'settings-panel',
    name: 'Settings & Profile',
    category: 'Dashboard',
    tagline: 'Account, preferences, billing — and a danger zone people trust.',
    description:
      'Sectioned settings with a left index: profile photo and name, email change with verification, theme and language, notification toggles, plan and invoices, then a destructive zone with typed confirmation.',
    tags: ['settings', 'profile', 'billing', 'danger zone'],
    palette: ['#EDEAE4', '#D5CFC4'],
    opensAt: 'settings',
    blocks: [
      { type: 'sidebar', label: 'Settings index', attrs: ['left, 200px', 'sticky, 6 sections'] },
      { type: 'input', label: 'Profile fields', attrs: ['name, email, avatar'] },
      { type: 'checkbox', label: 'Notification toggles', attrs: ['email, in-app, weekly digest'] },
      { type: 'card', label: 'Plan card', attrs: ['current plan, renews on', 'Manage billing'] },
      { type: 'modal', label: 'Delete account', attrs: ['type-to-confirm', 'red destructive'] },
    ],
  },
  {
    id: 'portfolio-grid',
    name: 'Portfolio Grid',
    category: 'Marketing',
    tagline: 'A case-study grid that lets the work do the talking.',
    description:
      'Editorial portfolio: oversized name, one-line positioning, filterable project grid with hover reveals, and a contact block. Built for designers who need a credible personal site in an afternoon.',
    tags: ['portfolio', 'grid', 'editorial', 'contact'],
    palette: ['#F5F1EA', '#E3DCCF'],
    opensAt: 'requirements',
    device: 'tablet',
    pro: true,
    blocks: [
      { type: 'card', label: 'Intro block', attrs: ['full width', 'name + positioning line'] },
      { type: 'image', label: 'Project grid', attrs: ['2 columns desktop', 'hover reveal'] },
      { type: 'dropdown', label: 'Category filter', attrs: ['top right', 'All / Product / Brand'] },
      { type: 'button', label: 'Contact CTA', attrs: ['end of page', 'mailto link'] },
      { type: 'footer', label: 'Footer', attrs: ['minimal', 'social links'] },
    ],
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((template) => template.id === id);
}
