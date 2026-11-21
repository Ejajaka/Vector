import type { CanvasItemType } from './canvas.ts';

/**
 * Styled element variants.
 *
 * The palette is a gallery of *designed* options, not a list of primitive names:
 * six buttons, five cards, six text styles, and so on. Each variant carries its
 * own geometry, default copy, and the sentence it contributes to the prompt.
 */

export type StyleKey =
  | 'btn-solid'
  | 'btn-gradient'
  | 'btn-outline'
  | 'btn-pill'
  | 'btn-ghost'
  | 'btn-dark'
  | 'card-elevated'
  | 'card-outline'
  | 'card-gradient'
  | 'card-stat'
  | 'card-media'
  | 'text-display'
  | 'text-h2'
  | 'text-h3'
  | 'text-body'
  | 'text-caption'
  | 'text-quote'
  | 'text-checklist'
  | 'input-labelled'
  | 'input-search'
  | 'input-float'
  | 'nav-light'
  | 'nav-dark'
  | 'badge-soft'
  | 'badge-solid'
  | 'badge-dot'
  | 'image-rounded'
  | 'image-framed'
  | 'image-bleed'
  | 'chart-bars'
  | 'chart-line'
  | 'table-default'
  | 'footer-default'
  | 'modal-default'
  | 'avatar-initials'
  | 'avatar-ring'
  | 'rect'
  | 'btn-icon'
  | 'btn-split'
  | 'btn-loading'
  | 'btn-danger'
  | 'card-list'
  | 'card-profile'
  | 'card-pricing'
  | 'text-label'
  | 'text-link'
  | 'text-code'
  | 'input-textarea'
  | 'input-select'
  | 'input-checkbox'
  | 'input-toggle'
  | 'nav-tabs'
  | 'badge-count'
  | 'image-avatar-grid'
  | 'chart-donut'
  | 'chart-progress'
  | 'divider'
  | 'accordion';

export interface StyleVariant {
  id: string;
  /** Canvas primitive used for geometry, prompt grouping and defaults. */
  type: CanvasItemType;
  name: string;
  group: string;
  style: StyleKey;
  w: number;
  h: number;
  label: string;
  color?: string;
  /** How this variant is described in the generated prompt. */
  prompt: string;
}

const B = (id: string, name: string, style: StyleKey, prompt: string, color?: string): StyleVariant => ({
  id,
  type: 'button',
  name,
  group: 'Buttons',
  style,
  w: 176,
  h: 48,
  label: 'Get started',
  color,
  prompt,
});

const C = (id: string, name: string, style: StyleKey, prompt: string, color?: string): StyleVariant => ({
  id,
  type: 'card',
  name,
  group: 'Cards',
  style,
  w: 320,
  h: 190,
  label: 'Feature card',
  color,
  prompt,
});

const T = (id: string, name: string, style: StyleKey, label: string, prompt: string, h: number): StyleVariant => ({
  id,
  type: 'text',
  name,
  group: 'Text',
  style,
  w: 520,
  h,
  label,
  prompt,
});

export const VARIANTS: StyleVariant[] = [
  /* Buttons ------------------------------------------------------- */
  B('btn-solid', 'Solid', 'btn-solid', 'primary filled button with a solid accent background, white label, 10px radius', '#7C5CFF'),
  B('btn-gradient', 'Gradient', 'btn-gradient', 'primary button with a violet→blue gradient and soft coloured shadow', '#7C5CFF'),
  B('btn-outline', 'Outline', 'btn-outline', 'secondary button with a 1px border, transparent fill and dark label', '#0B0E14'),
  B('btn-pill', 'Pill', 'btn-pill', 'fully rounded pill button in a soft tint with a matching dark label', '#7C5CFF'),
  B('btn-ghost', 'Ghost', 'btn-ghost', 'text-only ghost button with no fill, underline on hover', '#0B0E14'),
  B('btn-dark', 'Dark', 'btn-dark', 'high-contrast dark button with white label, used for the single most important action', '#0B0E14'),

  /* Cards --------------------------------------------------------- */
  C('card-elevated', 'Elevated', 'card-elevated', 'card with a white surface, 12px radius and a soft drop shadow', '#7C5CFF'),
  C('card-outline', 'Outlined', 'card-outline', 'card with a hairline border, no shadow, 12px radius', '#7C5CFF'),
  C('card-gradient', 'Gradient', 'card-gradient', 'promotional card with a violet→cyan gradient background and white copy', '#7C5CFF'),
  C('card-stat', 'Stat', 'card-stat', 'metric card with a large number, label and a green delta chip', '#22D3EE'),
  C('card-media', 'Media', 'card-media', 'media card with a top image and title/caption block underneath', '#FF7A59'),

  /* Text ---------------------------------------------------------- */
  T('text-display', 'Display', 'text-display', 'Build faster with clarity', 'display heading, 44px, tight tracking, extrabold', 64),
  T('text-h2', 'Heading', 'text-h2', 'Section heading', 'section heading, 28px, bold', 44),
  T('text-h3', 'Subheading', 'text-h3', 'Card title', 'subheading, 18px, semibold', 32),
  T('text-body', 'Paragraph', 'text-body', 'A short paragraph of supporting copy that explains the value in one or two sentences.', 'body paragraph, 14px, 1.6 line height, muted colour', 64),
  T('text-caption', 'Caption', 'text-caption', 'Updated 2 minutes ago', 'caption text, 11px, uppercase tracking, muted', 22),
  T('text-quote', 'Quote', 'text-quote', '“It cut our design review from four rounds to one.”', 'pull quote with a left accent rule and italic styling', 72),
  T('text-checklist', 'Checklist', 'text-checklist', 'What is included', 'checklist of four items with check icons, 8px spacing', 108),

  /* Inputs -------------------------------------------------------- */
  { id: 'input-labelled', type: 'input', name: 'Labelled field', group: 'Inputs', style: 'input-labelled', w: 340, h: 64, label: 'Work email', prompt: 'labelled text field with a visible label above, placeholder and focus ring' },
  { id: 'input-search', type: 'input', name: 'Search bar', group: 'Inputs', style: 'input-search', w: 360, h: 44, label: 'Search anything', prompt: 'rounded search bar with a magnifier icon and keyboard hint' },
  { id: 'input-float', type: 'input', name: 'Floating label', group: 'Inputs', style: 'input-float', w: 340, h: 56, label: 'Password', prompt: 'field with an inline floating label and a reveal-password toggle' },

  /* Navigation ---------------------------------------------------- */
  { id: 'nav-light', type: 'navbar', name: 'Light navbar', group: 'Navigation', style: 'nav-light', w: 1120, h: 64, label: 'Acme', prompt: 'light navigation bar, brand left, four links centre-right and a solid CTA', color: '#7C5CFF' },
  { id: 'nav-dark', type: 'navbar', name: 'Dark navbar', group: 'Navigation', style: 'nav-dark', w: 1120, h: 64, label: 'Acme', prompt: 'dark navigation bar with white wordmark and a gradient CTA', color: '#22D3EE' },

  /* Badges -------------------------------------------------------- */
  { id: 'badge-soft', type: 'badge', name: 'Soft badge', group: 'Badges', style: 'badge-soft', w: 92, h: 28, label: 'New', prompt: 'soft tinted status badge with rounded-full corners', color: '#7C5CFF' },
  { id: 'badge-solid', type: 'badge', name: 'Solid badge', group: 'Badges', style: 'badge-solid', w: 92, h: 28, label: 'Pro', prompt: 'solid accent badge with white text', color: '#7C5CFF' },
  { id: 'badge-dot', type: 'badge', name: 'Status dot', group: 'Badges', style: 'badge-dot', w: 108, h: 26, label: 'Live', prompt: 'status pill with a leading coloured dot and label', color: '#22D3EE' },

  /* Images -------------------------------------------------------- */
  { id: 'image-rounded', type: 'image', name: 'Rounded image', group: 'Images', style: 'image-rounded', w: 420, h: 280, label: 'Product shot', prompt: 'rounded image block with object-fit cover and alt text', color: '#FF7A59' },
  { id: 'image-framed', type: 'image', name: 'Framed image', group: 'Images', style: 'image-framed', w: 380, h: 300, label: 'App preview', prompt: 'image inside a browser-style frame with a caption underneath', color: '#7C5CFF' },
  { id: 'image-bleed', type: 'image', name: 'Full bleed', group: 'Images', style: 'image-bleed', w: 520, h: 240, label: 'Hero visual', prompt: 'edge-to-edge image band with a gradient scrim for text contrast', color: '#7C5CFF' },

  /* Data ---------------------------------------------------------- */
  { id: 'chart-bars', type: 'chart', name: 'Bar chart', group: 'Data', style: 'chart-bars', w: 560, h: 240, label: 'Revenue by month', prompt: 'bar chart with labelled axes and a highlight colour for the latest period', color: '#7C5CFF' },
  { id: 'chart-line', type: 'chart', name: 'Line chart', group: 'Data', style: 'chart-line', w: 560, h: 240, label: 'Active users', prompt: 'line chart with a gradient area fill, gridlines and tooltip', color: '#22D3EE' },
  { id: 'table-default', type: 'table', name: 'Data table', group: 'Data', style: 'table-default', w: 900, h: 260, label: 'Orders', prompt: 'data table with sticky header, sortable columns, row selection and empty state' },

  /* Structure ----------------------------------------------------- */
  { id: 'footer-default', type: 'footer', name: 'Footer', group: 'Structure', style: 'footer-default', w: 1120, h: 96, label: 'Acme', prompt: 'footer with three link columns, social icons and a legal line' },
  { id: 'modal-default', type: 'modal', name: 'Modal', group: 'Structure', style: 'modal-default', w: 440, h: 280, label: 'Confirm change', prompt: 'centred modal with a title, body copy and cancel/confirm actions' },
  { id: 'avatar-initials', type: 'avatar', name: 'Initials', group: 'Structure', style: 'avatar-initials', w: 56, h: 56, label: 'RG', prompt: 'circular avatar with initials and an accessible name', color: '#7C5CFF' },
  { id: 'avatar-ring', type: 'avatar', name: 'Ringed', group: 'Structure', style: 'avatar-ring', w: 64, h: 64, label: 'RG', prompt: 'circular avatar with a 2px accent ring', color: '#22D3EE' },

  /* Shapes -------------------------------------------------------- */
  { id: 'shape-rect', type: 'card', name: 'Rectangle', group: 'Shapes', style: 'rect', w: 320, h: 200, label: 'Box', prompt: 'rectangular surface with a fill and an optional border' },

  /* More buttons -------------------------------------------------- */
  { id: 'btn-icon', type: 'button', name: 'Icon button', group: 'Buttons', style: 'btn-icon', w: 48, h: 48, label: '+', color: '#7C5CFF', prompt: 'square icon button with rounded corners and a single glyph' },
  { id: 'btn-split', type: 'button', name: 'Split button', group: 'Buttons', style: 'btn-split', w: 208, h: 48, label: 'Publish', color: '#7C5CFF', prompt: 'split button: primary label plus a divider and chevron menu' },
  { id: 'btn-loading', type: 'button', name: 'Loading', group: 'Buttons', style: 'btn-loading', w: 176, h: 48, label: 'Saving', color: '#7C5CFF', prompt: 'button in a loading state with a spinner and disabled styling' },
  { id: 'btn-danger', type: 'button', name: 'Danger', group: 'Buttons', style: 'btn-danger', w: 176, h: 48, label: 'Delete', color: '#FF7A59', prompt: 'destructive button in coral with a clear verb label' },

  /* More cards ---------------------------------------------------- */
  { id: 'card-list', type: 'card', name: 'List card', group: 'Cards', style: 'card-list', w: 340, h: 220, label: 'Activity', prompt: 'card containing a list of rows with dividers' },
  { id: 'card-profile', type: 'card', name: 'Profile card', group: 'Cards', style: 'card-profile', w: 280, h: 240, label: 'Your Name', color: '#7C5CFF', prompt: 'profile card with an avatar, name, role and two actions' },
  { id: 'card-pricing', type: 'card', name: 'Pricing card', group: 'Cards', style: 'card-pricing', w: 280, h: 300, label: 'Pro', color: '#7C5CFF', prompt: 'pricing card with a plan name, price, feature list and CTA' },

  /* More text ----------------------------------------------------- */
  { id: 'text-label', type: 'text', name: 'Label', group: 'Text', style: 'text-label', w: 220, h: 24, label: 'Email address', prompt: 'form label, 12px, semibold, muted' },
  { id: 'text-link', type: 'text', name: 'Link', group: 'Text', style: 'text-link', w: 220, h: 24, label: 'View all projects', color: '#7C5CFF', prompt: 'inline text link with an underline and hover colour' },
  { id: 'text-code', type: 'text', name: 'Code', group: 'Text', style: 'text-code', w: 320, h: 64, label: 'npm run build', prompt: 'inline code block on a tinted surface with monospace type' },

  /* More inputs --------------------------------------------------- */
  { id: 'input-textarea', type: 'input', name: 'Text area', group: 'Inputs', style: 'input-textarea', w: 340, h: 120, label: 'Message', prompt: 'multi-line text area with a label and resize handle' },
  { id: 'input-select', type: 'input', name: 'Select', group: 'Inputs', style: 'input-select', w: 340, h: 56, label: 'Country', prompt: 'select field with a chevron and a visible label' },
  { id: 'input-checkbox', type: 'input', name: 'Checkbox', group: 'Inputs', style: 'input-checkbox', w: 260, h: 28, label: 'Email me updates', prompt: 'checkbox with a checked state and a clickable label' },
  { id: 'input-toggle', type: 'input', name: 'Toggle', group: 'Inputs', style: 'input-toggle', w: 220, h: 32, label: 'Notifications', color: '#7C5CFF', prompt: 'toggle switch in the on position with a label' },

  /* More navigation ----------------------------------------------- */
  { id: 'nav-tabs', type: 'navbar', name: 'Tabs', group: 'Navigation', style: 'nav-tabs', w: 560, h: 48, label: 'Overview', color: '#7C5CFF', prompt: 'horizontal tab bar with an active underline and three inactive tabs' },

  /* More badges --------------------------------------------------- */
  { id: 'badge-count', type: 'badge', name: 'Count', group: 'Badges', style: 'badge-count', w: 28, h: 24, label: '8', color: '#FF7A59', prompt: 'small circular count badge for unread items' },

  /* More images --------------------------------------------------- */
  { id: 'image-avatar-grid', type: 'image', name: 'Avatar grid', group: 'Images', style: 'image-avatar-grid', w: 240, h: 120, label: 'Team', color: '#7C5CFF', prompt: 'row of overlapping circular avatars with a +N indicator' },

  /* More data ----------------------------------------------------- */
  { id: 'chart-donut', type: 'chart', name: 'Donut', group: 'Data', style: 'chart-donut', w: 240, h: 240, label: 'Share', color: '#7C5CFF', prompt: 'donut chart with a centre label and four segments' },
  { id: 'chart-progress', type: 'chart', name: 'Progress', group: 'Data', style: 'chart-progress', w: 360, h: 56, label: 'Storage', color: '#7C5CFF', prompt: 'linear progress bar with a percentage label' },

  /* More structure ------------------------------------------------ */
  { id: 'divider', type: 'card', name: 'Divider', group: 'Structure', style: 'divider', w: 520, h: 32, label: 'OR', prompt: 'horizontal divider with a centred label' },
  { id: 'accordion', type: 'card', name: 'Accordion', group: 'Structure', style: 'accordion', w: 480, h: 160, label: 'Frequently asked', prompt: 'accordion list with one expanded row and three collapsed rows' },

  /* Expanded palette ---------------------------------------------- */
  { id: 'btn-coral', type: 'button', name: 'Coral CTA', group: 'Buttons', style: 'btn-solid', w: 196, h: 48, label: 'Book a demo', color: '#FF7A59', prompt: 'coral primary button for a warm secondary action' },
  { id: 'btn-amber', type: 'button', name: 'Amber CTA', group: 'Buttons', style: 'btn-solid', w: 188, h: 48, label: 'Upgrade', color: '#FFC53D', prompt: 'amber primary button for an upgrade action' },
  { id: 'btn-blue', type: 'button', name: 'Blue CTA', group: 'Buttons', style: 'btn-solid', w: 180, h: 48, label: 'Continue', color: '#0D99FF', prompt: 'blue primary button for the next step' },
  { id: 'btn-quiet', type: 'button', name: 'Quiet', group: 'Buttons', style: 'btn-ghost', w: 150, h: 40, label: 'Learn more', color: '#0B0E14', prompt: 'quiet text button for a low-priority action' },
  { id: 'btn-compact', type: 'button', name: 'Compact', group: 'Buttons', style: 'btn-outline', w: 132, h: 36, label: 'Edit', prompt: 'compact outline button that fits a table row' },
  { id: 'btn-wide', type: 'button', name: 'Full width', group: 'Buttons', style: 'btn-solid', w: 320, h: 52, label: 'Continue to payment', color: '#5E6AD2', prompt: 'full-width primary button for a checkout step' },
  { id: 'btn-soft', type: 'button', name: 'Soft tint', group: 'Buttons', style: 'btn-pill', w: 168, h: 40, label: 'Invite team', color: '#5E6AD2', prompt: 'soft tinted pill button for a supportive action' },
  { id: 'btn-inverse', type: 'button', name: 'Inverse', group: 'Buttons', style: 'btn-dark', w: 184, h: 48, label: 'Open workspace', color: '#0B0E14', prompt: 'dark inverse button for the strongest action on a light surface' },
  { id: 'btn-loading-wide', type: 'button', name: 'Saving', group: 'Buttons', style: 'btn-loading', w: 240, h: 48, label: 'Saving changes', color: '#5E6AD2', prompt: 'wide loading button with spinner and disabled state' },
  { id: 'btn-icon-ghost', type: 'button', name: 'Icon ghost', group: 'Buttons', style: 'btn-icon', w: 40, h: 40, label: '+', color: '#0B0E14', prompt: 'ghost square icon button for a toolbar' },

  { id: 'card-testimonial', type: 'card', name: 'Testimonial', group: 'Cards', style: 'card-outline', w: 360, h: 220, label: '“It cut our review from four rounds to one.”', prompt: 'testimonial card with quote, avatar and attribution' },
  { id: 'card-feature', type: 'card', name: 'Feature', group: 'Cards', style: 'card-elevated', w: 320, h: 200, label: 'Everything in one place', prompt: 'feature card with icon, title and two-line description' },
  { id: 'card-onboarding', type: 'card', name: 'Onboarding', group: 'Cards', style: 'card-list', w: 360, h: 240, label: 'Get set up', prompt: 'onboarding checklist card with three steps' },
  { id: 'card-dark', type: 'card', name: 'Dark card', group: 'Cards', style: 'card-gradient', w: 340, h: 200, label: 'Pro workspace', prompt: 'dark gradient card for a highlighted plan' },
  { id: 'card-media-wide', type: 'card', name: 'Media wide', group: 'Cards', style: 'card-media', w: 420, h: 260, label: 'Case study', prompt: 'wide media card with a cover image and caption' },
  { id: 'card-metric-large', type: 'card', name: 'Metric', group: 'Cards', style: 'card-stat', w: 280, h: 160, label: '$48,200', prompt: 'large metric card with a label and positive delta' },
  { id: 'card-pricing-mini', type: 'card', name: 'Pricing mini', group: 'Cards', style: 'card-pricing', w: 240, h: 280, label: 'Pro', prompt: 'compact pricing card with three features and a CTA' },
  { id: 'card-empty', type: 'card', name: 'Empty state', group: 'Cards', style: 'card-outline', w: 360, h: 200, label: 'Nothing here yet', prompt: 'empty state card with an illustration, title and action' },

  { id: 'text-hero', type: 'text', name: 'Hero', group: 'Text', style: 'text-display', w: 720, h: 128, label: 'Build the whole screen', prompt: 'hero headline, 64px, tight tracking, extrabold' },
  { id: 'text-eyebrow', type: 'text', name: 'Eyebrow', group: 'Text', style: 'text-caption', w: 240, h: 22, label: 'NEW FEATURE', prompt: 'eyebrow caption above a heading, uppercase tracking' },
  { id: 'text-kicker', type: 'text', name: 'Kicker', group: 'Text', style: 'text-label', w: 260, h: 24, label: 'Why it matters', prompt: 'small kicker label above a section heading' },
  { id: 'text-large-body', type: 'text', name: 'Large paragraph', group: 'Text', style: 'text-body', w: 560, h: 88, label: 'A longer supporting paragraph that explains the value in two or three sentences.', prompt: 'large body paragraph, 18px, comfortable line height' },
  { id: 'text-small', type: 'text', name: 'Small print', group: 'Text', style: 'text-caption', w: 360, h: 20, label: 'Prices include GST. Cancel any time.', prompt: 'small print caption under a form or price' },
  { id: 'text-price', type: 'text', name: 'Price', group: 'Text', style: 'text-display', w: 260, h: 56, label: '₹1,990', prompt: 'large price numeral with a small period label' },
  { id: 'text-stat', type: 'text', name: 'Stat number', group: 'Text', style: 'text-display', w: 220, h: 64, label: '48k', prompt: 'large metric number above a short label' },
  { id: 'text-feature', type: 'text', name: 'Feature title', group: 'Text', style: 'text-h3', w: 320, h: 32, label: 'Everything resolved', prompt: 'feature title, 20px, semibold' },
  { id: 'text-testimonial', type: 'text', name: 'Testimonial', group: 'Text', style: 'text-quote', w: 480, h: 88, label: '“The brief was complete before the kickoff.”', prompt: 'testimonial quote with attribution below' },
  { id: 'text-code-block', type: 'text', name: 'Code block', group: 'Text', style: 'text-code', w: 360, h: 80, label: 'npm run dev', prompt: 'code block on a tinted surface with a copy control' },
  { id: 'text-step', type: 'text', name: 'Step number', group: 'Text', style: 'text-label', w: 80, h: 24, label: '01', prompt: 'numbered step marker above a title' },
  { id: 'text-footer', type: 'text', name: 'Footer line', group: 'Text', style: 'text-caption', w: 420, h: 20, label: '© 2026 Vector. All rights reserved.', prompt: 'footer legal line, 11px, muted' },

  { id: 'input-email', type: 'input', name: 'Email field', group: 'Inputs', style: 'input-labelled', w: 340, h: 64, label: 'Email address', prompt: 'email field with a visible label and browser validation' },
  { id: 'input-password', type: 'input', name: 'Password field', group: 'Inputs', style: 'input-float', w: 340, h: 56, label: 'Password', prompt: 'password field with a reveal control and strength hint' },
  { id: 'input-phone', type: 'input', name: 'Phone field', group: 'Inputs', style: 'input-labelled', w: 340, h: 64, label: 'Phone number', prompt: 'phone field with a country selector and formatting' },
  { id: 'input-otp', type: 'input', name: 'OTP field', group: 'Inputs', style: 'input-labelled', w: 300, h: 64, label: '6-digit code', prompt: 'one-time code field with six separated digits' },
  { id: 'input-search-large', type: 'input', name: 'Command search', group: 'Inputs', style: 'input-search', w: 460, h: 48, label: 'Search projects', prompt: 'command search field with a keyboard shortcut hint' },
  { id: 'input-message', type: 'input', name: 'Message', group: 'Inputs', style: 'input-textarea', w: 380, h: 120, label: 'Your message', prompt: 'message text area with a character count' },
  { id: 'input-country', type: 'input', name: 'Country', group: 'Inputs', style: 'input-select', w: 320, h: 56, label: 'Country', prompt: 'country selector with a searchable menu' },
  { id: 'input-consent', type: 'input', name: 'Consent', group: 'Inputs', style: 'input-checkbox', w: 320, h: 28, label: 'I agree to the terms', prompt: 'consent checkbox with links to the policy pages' },

  { id: 'nav-marketing', type: 'navbar', name: 'Marketing nav', group: 'Navigation', style: 'nav-light', w: 1120, h: 64, label: 'Acme', color: '#5E6AD2', prompt: 'marketing navigation with logo, five links and a sign-up CTA' },
  { id: 'nav-app', type: 'navbar', name: 'App bar', group: 'Navigation', style: 'nav-dark', w: 1120, h: 56, label: 'Workspace', color: '#5E6AD2', prompt: 'app top bar with workspace switcher, search and avatar' },
  { id: 'nav-breadcrumb', type: 'navbar', name: 'Breadcrumb', group: 'Navigation', style: 'nav-tabs', w: 560, h: 36, label: 'Projects / Checkout', color: '#5E6AD2', prompt: 'breadcrumb trail with the current page highlighted' },
  { id: 'nav-sidebar', type: 'navbar', name: 'Sidebar nav', group: 'Navigation', style: 'nav-dark', w: 240, h: 640, label: 'Workspace', color: '#5E6AD2', prompt: 'vertical sidebar navigation with sections and a footer action' },

  { id: 'badge-beta', type: 'badge', name: 'Beta', group: 'Badges', style: 'badge-soft', w: 72, h: 26, label: 'Beta', color: '#5E6AD2', prompt: 'soft beta badge next to a feature name' },
  { id: 'badge-new', type: 'badge', name: 'New', group: 'Badges', style: 'badge-solid', w: 64, h: 24, label: 'New', color: '#5E6AD2', prompt: 'solid new badge for a recently shipped feature' },
  { id: 'badge-offline', type: 'badge', name: 'Offline', group: 'Badges', style: 'badge-dot', w: 108, h: 26, label: 'Offline', color: '#FF7A59', prompt: 'status badge with a coral dot for an offline state' },
  { id: 'badge-count-large', type: 'badge', name: '99+', group: 'Badges', style: 'badge-count', w: 32, h: 24, label: '99+', color: '#FF7A59', prompt: 'count badge that caps at 99+' },

  { id: 'image-hero', type: 'image', name: 'Hero image', group: 'Images', style: 'image-bleed', w: 640, h: 360, label: 'Hero visual', color: '#5E6AD2', prompt: 'full-bleed hero image with a gradient scrim' },
  { id: 'image-product', type: 'image', name: 'Product shot', group: 'Images', style: 'image-rounded', w: 420, h: 420, label: 'Product', color: '#FF7A59', prompt: 'square product image with a soft background' },
  { id: 'image-screenshot', type: 'image', name: 'Screenshot', group: 'Images', style: 'image-framed', w: 560, h: 360, label: 'App screenshot', color: '#0D99FF', prompt: 'browser-framed app screenshot with a caption' },
  { id: 'image-portrait', type: 'image', name: 'Portrait', group: 'Images', style: 'image-framed', w: 280, h: 360, label: 'Portrait', color: '#8B5CF6', prompt: 'portrait image with a rounded frame and caption' },
  { id: 'image-gallery', type: 'image', name: 'Gallery', group: 'Images', style: 'image-rounded', w: 620, h: 300, label: 'Gallery', color: '#FFC53D', prompt: 'image gallery with four thumbnails and a lightbox' },
  { id: 'image-team', type: 'image', name: 'Team avatars', group: 'Images', style: 'image-avatar-grid', w: 280, h: 120, label: 'Team', color: '#5E6AD2', prompt: 'row of team avatars with a +N indicator' },

  { id: 'chart-spark', type: 'chart', name: 'Sparkline', group: 'Data', style: 'chart-line', w: 260, h: 80, label: 'Weekly active users', color: '#5E6AD2', prompt: 'compact sparkline with a subtle area fill' },
  { id: 'chart-funnel', type: 'chart', name: 'Funnel', group: 'Data', style: 'chart-bars', w: 480, h: 260, label: 'Signup funnel', color: '#0D99FF', prompt: 'funnel chart with four labelled stages' },
  { id: 'chart-usage', type: 'chart', name: 'Usage ring', group: 'Data', style: 'chart-donut', w: 220, h: 220, label: 'Plan usage', color: '#5E6AD2', prompt: 'donut chart showing usage against a limit, with a 72% centre label' },
  { id: 'chart-capacity', type: 'chart', name: 'Capacity', group: 'Data', style: 'chart-progress', w: 420, h: 52, label: 'Storage used', color: '#FFC53D', prompt: 'progress bar with a used-of-total label' },
  { id: 'table-compact', type: 'table', name: 'Compact table', group: 'Data', style: 'table-default', w: 760, h: 220, label: 'Invoices', prompt: 'compact table with invoice, date, amount and status' },
  { id: 'table-people', type: 'table', name: 'People table', group: 'Data', style: 'table-default', w: 900, h: 280, label: 'Team members', prompt: 'table of people with avatar, role, status and actions' },

  { id: 'footer-compact', type: 'footer', name: 'Compact footer', group: 'Structure', style: 'footer-default', w: 1120, h: 68, label: 'Acme', prompt: 'compact footer with a wordmark, links and a legal line' },
  { id: 'modal-confirm', type: 'modal', name: 'Confirm modal', group: 'Structure', style: 'modal-default', w: 420, h: 260, label: 'Delete project?', prompt: 'confirmation modal with destructive and cancel actions' },
  { id: 'avatar-group', type: 'avatar', name: 'Avatar group', group: 'Structure', style: 'avatar-ring', w: 160, h: 48, label: 'RG', prompt: 'overlapping avatar group with a +4 indicator' },
  { id: 'divider-light', type: 'card', name: 'Hairline', group: 'Structure', style: 'divider', w: 640, h: 24, label: 'OR', prompt: 'thin hairline divider with a centred label' },
  { id: 'accordion-faq', type: 'card', name: 'FAQ', group: 'Structure', style: 'accordion', w: 560, h: 200, label: 'Frequently asked questions', prompt: 'FAQ accordion with one open answer and three closed questions' },

  { id: 'shape-square', type: 'card', name: 'Square', group: 'Shapes', style: 'rect', w: 240, h: 240, label: 'Square', prompt: 'square surface with a fill and optional border' },
  { id: 'shape-panel', type: 'card', name: 'Panel', group: 'Shapes', style: 'rect', w: 400, h: 260, label: 'Panel', prompt: 'rounded panel surface for grouping content' },
  { id: 'shape-strip', type: 'card', name: 'Strip', group: 'Shapes', style: 'rect', w: 640, h: 96, label: 'Banner', prompt: 'full-width banner strip with a fill' },
];

export const PALETTE_GROUPS = ['Buttons', 'Cards', 'Shapes', 'Text', 'Inputs', 'Navigation', 'Badges', 'Images', 'Data', 'Structure'];

export function variantById(id: string): StyleVariant | undefined {
  return VARIANTS.find((variant) => variant.id === id);
}

/** The variant a template block should adopt by default. */
export const TYPE_TO_VARIANT: Record<string, string> = {
  button: 'btn-solid',
  card: 'card-elevated',
  text: 'text-body',
  heading: 'text-h2',
  input: 'input-labelled',
  navbar: 'nav-light',
  badge: 'badge-soft',
  image: 'image-rounded',
  chart: 'chart-bars',
  table: 'table-default',
  footer: 'footer-default',
  modal: 'modal-default',
  avatar: 'avatar-initials',
  sidebar: 'card-outline',
  dropdown: 'input-labelled',
  checkbox: 'input-labelled',
};

export interface VariantTextField {
  id: string;
  label: string;
  fallback: string;
}

/**
 * Extra editable copy inside a single component. The main label stays on the
 * element itself; these are the secondary text runs that used to be hardcoded
 * (metric values, nav links, placeholders, CTA labels).
 */
export const VARIANT_TEXT_FIELDS: Record<string, VariantTextField[]> = {
  'card-stat': [
    { id: 'value', label: 'Metric value', fallback: '₹48,210' },
    { id: 'delta', label: 'Change', fallback: '▲ 12.4%' },
  ],
  'card-gradient': [{ id: 'cta', label: 'Button label', fallback: 'Open' }],
  'nav-light': [
    { id: 'links', label: 'Links (comma separated)', fallback: 'Product,Pricing,Docs' },
    { id: 'cta', label: 'Action label', fallback: 'Sign in' },
  ],
  'nav-dark': [
    { id: 'links', label: 'Links (comma separated)', fallback: 'Product,Pricing' },
    { id: 'cta', label: 'Action label', fallback: 'Get started' },
  ],
  'input-labelled': [{ id: 'placeholder', label: 'Placeholder', fallback: 'you@company.com' }],
  'input-search': [{ id: 'shortcut', label: 'Keyboard hint', fallback: '⌘K' }],
  'input-float': [{ id: 'value', label: 'Value', fallback: '••••••••' }],
  'table-default': [{ id: 'search', label: 'Toolbar text', fallback: 'Search · Filter' }],
  'chart-bars': [{ id: 'caption', label: 'Caption', fallback: 'Last 9 months' }],
  'footer-default': [
    { id: 'links', label: 'Links (comma separated)', fallback: 'Product,Company,Legal' },
    { id: 'copyright', label: 'Copyright', fallback: '© 2026' },
  ],
  'modal-default': [
    { id: 'cta', label: 'Confirm label', fallback: 'Confirm' },
    { id: 'cancel', label: 'Cancel label', fallback: 'Cancel' },
  ],
};
