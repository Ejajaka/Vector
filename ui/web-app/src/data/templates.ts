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
  {
    id: 'booking-flow',
    name: 'Booking Flow',
    category: 'Marketing',
    tagline: 'Service picker, calendar and a confirmed appointment.',
    description:
      'A three-step booking surface: choose a service, pick a date and time from a real calendar, enter contact details, then see a confirmation with the appointment summary and a reschedule action.',
    tags: ['booking', 'calendar', 'appointments', 'confirmation'],
    palette: ['#EEF0F6', '#D9DDEC'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Header', attrs: ['brand, help link'] },
      { type: 'card', label: 'Service picker', attrs: ['three options', 'duration + price'] },
      { type: 'image', label: 'Calendar', attrs: ['month view', 'unavailable days disabled'] },
      { type: 'input', label: 'Contact details', attrs: ['name, email, phone'] },
      { type: 'button', label: 'Confirm booking', attrs: ['full width', 'success screen next'] },
    ],
    pages: [
      {
        name: 'Confirmed',
        blocks: [
          { type: 'heading', label: 'You are booked', attrs: ['confirmation title'] },
          { type: 'card', label: 'Appointment summary', attrs: ['service, date, time, location'] },
          { type: 'button', label: 'Reschedule', attrs: ['secondary'] },
          { type: 'button', label: 'Add to calendar', attrs: ['primary, downloads .ics'] },
        ],
      },
    ],
  },
  {
    id: 'crm-contacts',
    name: 'CRM Contacts',
    category: 'Data',
    tagline: 'A table that stays usable at ten thousand rows.',
    description:
      'A sales workspace with saved views, a filter bar, a dense contacts table with owner and status chips, row selection for bulk actions, and a side panel for the selected contact.',
    tags: ['crm', 'table', 'filters', 'bulk actions'],
    palette: ['#E9EEF1', '#C9D7DF'],
    opensAt: 'requirements',
    blocks: [
      { type: 'sidebar', label: 'Navigation rail', attrs: ['left, 220px', 'Contacts, Deals, Reports'] },
      { type: 'input', label: 'Search and filters', attrs: ['search, owner, stage'] },
      { type: 'table', label: 'Contacts table', attrs: ['sticky header', 'sortable, selectable'] },
      { type: 'card', label: 'Contact side panel', attrs: ['right, 320px', 'details and activity'] },
      { type: 'button', label: 'Bulk action bar', attrs: ['appears on selection', 'email, tag, delete'] },
    ],
  },
  {
    id: 'kanban-board',
    name: 'Kanban Board',
    category: 'Collaboration',
    tagline: 'Columns, cards and a drag that feels physical.',
    description:
      'A planning board with four columns, draggable cards, assignee avatars, due-date chips, filters and a quick-add composer at the top of every column.',
    tags: ['kanban', 'tasks', 'drag', 'collaboration'],
    palette: ['#EEF2EC', '#D6E1D1'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Board header', attrs: ['title, members, filters'] },
      { type: 'card', label: 'Columns', attrs: ['Backlog, In progress, Review, Done'] },
      { type: 'card', label: 'Task cards', attrs: ['title, assignee, due date'] },
      { type: 'button', label: 'Quick add', attrs: ['bottom of each column'] },
      { type: 'avatar', label: 'Assignees', attrs: ['overlapping, +N'] },
    ],
  },
  {
    id: 'calendar-scheduler',
    name: 'Calendar Scheduler',
    category: 'Dashboard',
    tagline: 'A week view that survives real meetings.',
    description:
      'An editorial calendar with a week grid, all-day row, overlapping event handling, a mini month picker, and an event drawer for title, attendees and notes.',
    tags: ['calendar', 'scheduling', 'week view', 'events'],
    palette: ['#F1EEF7', '#DDD4EC'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Calendar header', attrs: ['today, week, month toggle'] },
      { type: 'sidebar', label: 'Mini month', attrs: ['left, 220px', 'date picker'] },
      { type: 'card', label: 'Week grid', attrs: ['7 columns', '30-minute slots'] },
      { type: 'card', label: 'Event drawer', attrs: ['right, 320px', 'details and attendees'] },
      { type: 'button', label: 'New event', attrs: ['top right, primary'] },
    ],
  },
  {
    id: 'help-center',
    name: 'Help Center',
    category: 'Marketing',
    tagline: 'Search first, category second, article third.',
    description:
      'A support home with a prominent search, six topic cards, a popular-articles list and a contact card. Every article page keeps the same search and a table of contents.',
    tags: ['help center', 'docs', 'search', 'support'],
    palette: ['#EDF1F6', '#D4DEE9'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Header', attrs: ['brand, sign in, contact'] },
      { type: 'input', label: 'Search', attrs: ['full width', 'top of page'] },
      { type: 'card', label: 'Topic grid', attrs: ['6 cards', 'icon + title'] },
      { type: 'card', label: 'Popular articles', attrs: ['list of 6'] },
      { type: 'card', label: 'Contact support', attrs: ['email + response time'] },
    ],
    pages: [
      {
        name: 'Article',
        blocks: [
          { type: 'input', label: 'Article search', attrs: ['top of page'] },
          { type: 'heading', label: 'Article title', attrs: ['display'] },
          { type: 'text', label: 'Body copy', attrs: ['h2, paragraphs, code'] },
          { type: 'card', label: 'Was this helpful?', attrs: ['yes / no feedback'] },
        ],
      },
    ],
  },
  {
    id: 'blog-editorial',
    name: 'Blog / Article',
    category: 'Marketing',
    tagline: 'A reading experience with a real table of contents.',
    description:
      'Long-form article layout: title, author and date, a sticky table of contents, a readable measure, pull quotes, code blocks, and related posts at the end.',
    tags: ['blog', 'article', 'editorial', 'reading'],
    palette: ['#F5F1EA', '#E3DCCF'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Header', attrs: ['brand, subscribe'] },
      { type: 'image', label: 'Cover image', attrs: ['full bleed, 16:9'] },
      { type: 'text', label: 'Article body', attrs: ['max 70ch', 'h2, quote, code'] },
      { type: 'card', label: 'Table of contents', attrs: ['left, sticky'] },
      { type: 'card', label: 'Related posts', attrs: ['3 cards at the end'] },
    ],
  },
  {
    id: 'invoice-receipt',
    name: 'Invoice & Receipt',
    category: 'Commerce',
    tagline: 'A printable invoice that also looks right on a phone.',
    description:
      'A finance document with sender and customer blocks, invoice meta, line items with quantities and tax, a totals block, payment status and a print-friendly footer.',
    tags: ['invoice', 'receipt', 'billing', 'print'],
    palette: ['#F2F0EB', '#DFDAD0'],
    opensAt: 'requirements',
    blocks: [
      { type: 'heading', label: 'Invoice header', attrs: ['brand, invoice number'] },
      { type: 'card', label: 'From / Bill to', attrs: ['two columns'] },
      { type: 'table', label: 'Line items', attrs: ['description, qty, price, total'] },
      { type: 'card', label: 'Totals', attrs: ['subtotal, GST, total'] },
      { type: 'badge', label: 'Paid', attrs: ['status chip'] },
      { type: 'button', label: 'Download PDF', attrs: ['top right'] },
    ],
  },
  {
    id: 'waitlist-page',
    name: 'Waitlist / Coming Soon',
    category: 'Marketing',
    tagline: 'One promise, one email field, one launch date.',
    description:
      'A focused pre-launch page: positioning line, email capture with inline validation, social proof avatars, a short FAQ and a launch countdown.',
    tags: ['waitlist', 'coming soon', 'email capture', 'launch'],
    palette: ['#F3EDF6', '#E1D2EA'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Header', attrs: ['logo only'] },
      { type: 'heading', label: 'Promise', attrs: ['display, one sentence'] },
      { type: 'input', label: 'Waitlist email', attrs: ['inline submit', 'validation'] },
      { type: 'avatar', label: 'Social proof', attrs: ['avatars + joined count'] },
      { type: 'card', label: 'FAQ', attrs: ['3 questions'] },
      { type: 'badge', label: 'Launching soon', attrs: ['date chip'] },
    ],
  },
  {
    id: 'file-manager',
    name: 'File Manager',
    category: 'Data',
    tagline: 'Folders, a list view and a preview that does not jump.',
    description:
      'A workspace file browser with a folder tree, breadcrumbs, a sortable list of files with type icons, multi-select, and a right-side preview drawer.',
    tags: ['files', 'folders', 'preview', 'list'],
    palette: ['#EDF0F3', '#D2DCE5'],
    opensAt: 'requirements',
    blocks: [
      { type: 'sidebar', label: 'Folder tree', attrs: ['left, 240px', 'nested, collapsible'] },
      { type: 'navbar', label: 'Breadcrumbs', attrs: ['top bar', 'search + upload'] },
      { type: 'table', label: 'File list', attrs: ['name, type, owner, size'] },
      { type: 'card', label: 'Preview drawer', attrs: ['right, 360px', 'image, pdf, code'] },
      { type: 'button', label: 'Upload', attrs: ['top right, primary'] },
    ],
  },
  {
    id: 'team-directory',
    name: 'Team Directory',
    category: 'Collaboration',
    tagline: 'People, roles and a way to find the right person.',
    description:
      'A people directory with search, department filters, a card grid with avatars and roles, and a profile drawer with contact details and current projects.',
    tags: ['team', 'directory', 'people', 'org'],
    palette: ['#EEF1F5', '#D6DFEA'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Header', attrs: ['title, search, invite'] },
      { type: 'input', label: 'Search people', attrs: ['name, role, skill'] },
      { type: 'card', label: 'Person cards', attrs: ['grid, avatar + role'] },
      { type: 'card', label: 'Profile drawer', attrs: ['right, contact + projects'] },
      { type: 'dropdown', label: 'Department filter', attrs: ['All, Design, Eng, Ops'] },
    ],
  },
  {
    id: 'inventory-manager',
    name: 'Inventory Manager',
    category: 'Data',
    tagline: 'Stock levels, orders and the exceptions that need a human.',
    description:
      'An inventory workspace with a stock table, low-stock badges, search and filters, a stock-by-category chart, and bulk reorder actions.',
    tags: ['inventory', 'stock', 'table', 'filters', 'orders', 'data'],
    palette: ['#EEF2F0', '#D2E0D9'],
    opensAt: 'requirements',
    blocks: [
      { type: 'sidebar', label: 'Navigation', attrs: ['left, 224px', 'Stock, Orders, Suppliers'] },
      { type: 'navbar', label: 'Inventory header', attrs: ['search, filters, export'] },
      { type: 'table', label: 'Stock table', attrs: ['sku, product, stock, status'] },
      { type: 'input', label: 'Search inventory', attrs: ['sku or product name'] },
      { type: 'chart', label: 'Stock by category', attrs: ['bar chart, six categories'] },
      { type: 'badge', label: 'Low stock', attrs: ['coral, count'] },
      { type: 'button', label: 'Reorder selected', attrs: ['bulk action, primary'] },
    ],
  },
  {
    id: 'analytics-report',
    name: 'Analytics Report',
    category: 'Dashboard',
    tagline: 'A reporting surface built around the number that matters.',
    description:
      'A monthly analytics report with KPI cards, a primary trend chart, a channel breakdown table, a date range filter and an export action.',
    tags: ['analytics', 'report', 'chart', 'kpi', 'dashboard', 'data'],
    palette: ['#EEF0F7', '#D8DDF0'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Report header', attrs: ['title, date range, export'] },
      { type: 'heading', label: 'Monthly performance', attrs: ['page title, period label'] },
      { type: 'card', label: 'KPI cards ×4', attrs: ['revenue, signups, churn, MRR'] },
      { type: 'chart', label: 'Primary trend', attrs: ['line + area, 30 days'] },
      { type: 'dropdown', label: 'Date range', attrs: ['7 / 30 / 90 days'] },
      { type: 'table', label: 'Channel breakdown', attrs: ['source, sessions, conversion'] },
      { type: 'button', label: 'Export report', attrs: ['CSV, top right'] },
    ],
  },
  {
    id: 'admin-console',
    name: 'Admin Console',
    category: 'Dashboard',
    tagline: 'Users, roles and the audit trail in one place.',
    description:
      'An internal admin console with a sidebar, a searchable user table, role badges, an invite dialog, and an audit log for sensitive actions.',
    tags: ['admin', 'users', 'roles', 'permissions', 'audit', 'settings', 'table'],
    palette: ['#EEF1F4', '#D6DFE8'],
    opensAt: 'requirements',
    blocks: [
      { type: 'sidebar', label: 'Admin navigation', attrs: ['Users, Roles, Audit, Settings'] },
      { type: 'navbar', label: 'Console header', attrs: ['search, invite, account'] },
      { type: 'table', label: 'Users table', attrs: ['name, role, status, last active'] },
      { type: 'badge', label: 'Role badges', attrs: ['Owner, Admin, Member'] },
      { type: 'input', label: 'Search users', attrs: ['name or email, instant'] },
      { type: 'modal', label: 'Invite member', attrs: ['email, role, send'] },
      { type: 'card', label: 'Audit log', attrs: ['actor, action, time'] },
    ],
  },
  {
    id: 'mobile-checkout',
    name: 'Mobile Checkout',
    category: 'Mobile',
    tagline: 'A three-step checkout that fits a thumb.',
    description:
      'A compact mobile checkout with an order summary, address and payment fields, a sticky pay button, and a confirmation screen.',
    tags: ['mobile', 'checkout', 'payment', 'cart', 'order', 'forms'],
    palette: ['#F7F1EC', '#EAD9CC'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Checkout header', attrs: ['back, step 2 of 3'] },
      { type: 'card', label: 'Order summary', attrs: ['two items, total'] },
      { type: 'input', label: 'Email', attrs: ['labelled, validated'] },
      { type: 'input', label: 'Card details', attrs: ['number, expiry, CVC'] },
      { type: 'checkbox', label: 'Save this card', attrs: ['optional'] },
      { type: 'button', label: 'Pay now', attrs: ['sticky bottom, primary'] },
      { type: 'badge', label: 'Secure checkout', attrs: ['lock icon'] },
    ],
  },
  {
    id: 'team-activity',
    name: 'Team Activity',
    category: 'Collaboration',
    tagline: 'What changed, who changed it, and what needs a reply.',
    description:
      'A collaboration feed with member avatars, a filterable activity stream, mentions, invite controls and a compact permissions summary.',
    tags: ['team', 'activity', 'collaboration', 'permissions', 'invite', 'feed'],
    palette: ['#F0EDF8', '#DAD2EE'],
    opensAt: 'requirements',
    blocks: [
      { type: 'sidebar', label: 'Workspace nav', attrs: ['Activity, Members, Settings'] },
      { type: 'heading', label: 'Team activity', attrs: ['title, filter label'] },
      { type: 'avatar', label: 'Member avatars', attrs: ['overlapping, +4'] },
      { type: 'card', label: 'Activity feed', attrs: ['actor, action, time'] },
      { type: 'input', label: 'Search activity', attrs: ['person or project'] },
      { type: 'dropdown', label: 'Filter by type', attrs: ['All, Comments, Edits'] },
      { type: 'button', label: 'Invite teammate', attrs: ['top right, primary'] },
    ],
  },
  {
    id: 'customer-portal',
    name: 'Customer Portal',
    category: 'Auth',
    tagline: 'Sign in, see the account, pay the invoice.',
    description:
      'A customer account portal with a sign-in screen, a summary card, invoice history, support links and a secure sign-out action.',
    tags: ['portal', 'login', 'account', 'invoices', 'support', 'auth', 'table'],
    palette: ['#EEF3F7', '#D6E2EC'],
    opensAt: 'requirements',
    blocks: [
      { type: 'navbar', label: 'Portal header', attrs: ['logo, account, sign out'] },
      { type: 'heading', label: 'Welcome back', attrs: ['account name, plan'] },
      { type: 'input', label: 'Email', attrs: ['sign-in, validated'] },
      { type: 'input', label: 'Password', attrs: ['reveal control'] },
      { type: 'button', label: 'Sign in', attrs: ['primary, full width'] },
      { type: 'card', label: 'Plan summary', attrs: ['plan, renewal, usage'] },
      { type: 'table', label: 'Invoices', attrs: ['date, amount, status, download'] },
    ],
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((template) => template.id === id);
}
