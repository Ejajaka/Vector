import type { TemplateBlock } from './templates.ts';

/**
 * Project type fixes the theme. Once chosen, every page you add is drawn from
 * that theme's page catalogue — login has two options, home has two, and so on.
 */

export interface PageVariant {
  id: string;
  name: string;
  description: string;
  blocks: TemplateBlock[];
}

export interface PageKind {
  id: string;
  name: string;
  variants: PageVariant[];
}

export interface ProjectType {
  id: string;
  name: string;
  blurb: string;
  accent: string;
  surface: string;
  pages: PageKind[];
}

const b = (type: string, label: string, attrs: string[]): TemplateBlock => ({ type, label, attrs });

export const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'commerce',
    name: 'E-commerce',
    blurb: 'Catalogue, product, cart and checkout.',
    accent: '#FF7A59',
    surface: '#FFF8F4',
    pages: [
      {
        id: 'home',
        name: 'Home',
        variants: [
          {
            id: 'home-editorial',
            name: 'Editorial',
            description: 'Full-bleed hero with a featured collection.',
            blocks: [b('navbar', 'Navigation', ['brand, search, bag']), b('image', 'Hero', ['full bleed']), b('heading', 'Featured', ['seasonal']), b('card', 'Collection', ['grid of 4']), b('footer', 'Footer', ['links, legal'])],
          },
          {
            id: 'home-grid',
            name: 'Product grid',
            description: 'Dense grid, filters on the left.',
            blocks: [b('navbar', 'Navigation', ['brand, search']), b('sidebar', 'Filters', ['category, size']), b('card', 'Products', ['3 per row']), b('footer', 'Footer', ['links'])],
          },
        ],
      },
      {
        id: 'product',
        name: 'Product',
        variants: [
          { id: 'product-gallery', name: 'Gallery first', description: 'Large images, buy panel right.', blocks: [b('navbar', 'Navigation', ['brand, bag']), b('image', 'Gallery', ['4 thumbnails']), b('card', 'Buy panel', ['price, size']), b('button', 'Add to bag', ['full width'])] },
          { id: 'product-story', name: 'Story first', description: 'Copy-led with materials detail.', blocks: [b('navbar', 'Navigation', ['brand']), b('heading', 'Product name', ['display']), b('text', 'Materials', ['paragraph']), b('image', 'Detail shot', ['inline']), b('button', 'Add to bag', ['sticky'])] },
        ],
      },
      { id: 'login', name: 'Login', variants: [{ id: 'login-card', name: 'Centred card', description: 'Email and social.', blocks: [b('card', 'Form card', ['centred']), b('input', 'Email', ['validated']), b('input', 'Password', ['reveal']), b('button', 'Sign in', ['solid'])] }, { id: 'login-split', name: 'Split screen', description: 'Brand panel plus form.', blocks: [b('image', 'Brand panel', ['left half']), b('heading', 'Welcome back', ['right']), b('input', 'Email', ['labelled']), b('button', 'Continue', ['solid'])] }] },
      { id: 'cart', name: 'Cart', variants: [{ id: 'cart-list', name: 'Line items', description: 'Summary on the right.', blocks: [b('navbar', 'Navigation', ['brand']), b('card', 'Items', ['image, title, qty']), b('card', 'Summary', ['subtotal, shipping']), b('button', 'Checkout', ['sticky'])] }] },
    ],
  },
  {
    id: 'saas',
    name: 'SaaS product',
    blurb: 'Marketing site plus an app dashboard.',
    accent: '#7C5CFF',
    surface: '#FBFAFF',
    pages: [
      { id: 'home', name: 'Home', variants: [{ id: 'home-hero', name: 'Hero + proof', description: 'Headline, CTAs, logos.', blocks: [b('navbar', 'Navigation', ['links, CTA']), b('heading', 'Headline', ['display']), b('text', 'Value line', ['short']), b('button', 'Start free', ['gradient']), b('card', 'Proof', ['3 stats'])] }, { id: 'home-split', name: 'Split hero', description: 'Copy left, screenshot right.', blocks: [b('navbar', 'Navigation', ['links']), b('heading', 'Headline', ['display']), b('image', 'Screenshot', ['right half']), b('button', 'Book a demo', ['outline'])] }] },
      { id: 'pricing', name: 'Pricing', variants: [{ id: 'pricing-three', name: 'Three tiers', description: 'Middle plan highlighted.', blocks: [b('navbar', 'Navigation', ['links']), b('heading', 'Pricing', ['display']), b('card', 'Tiers', ['3 cards']), b('text', 'FAQ', ['accordion'])] }, { id: 'pricing-simple', name: 'Single plan', description: 'One price, one CTA.', blocks: [b('heading', 'One plan', ['display']), b('text', 'What is included', ['checklist']), b('button', 'Start free', ['solid'])] }] },
      { id: 'login', name: 'Login', variants: [{ id: 'login-sso', name: 'SSO first', description: 'Social buttons on top.', blocks: [b('card', 'Form card', ['centred']), b('button', 'Continue with Google', ['outline']), b('input', 'Email', ['labelled']), b('button', 'Sign in', ['solid'])] }, { id: 'login-split', name: 'Split screen', description: 'Product shot plus form.', blocks: [b('image', 'Product', ['left']), b('input', 'Email', ['labelled']), b('button', 'Continue', ['solid'])] }] },
      { id: 'dashboard', name: 'Dashboard', variants: [{ id: 'dash-kpi', name: 'KPI first', description: 'Four cards and a chart.', blocks: [b('navbar', 'Top bar', ['search, avatar']), b('sidebar', 'Navigation', ['sections']), b('card', 'KPIs', ['4 stats']), b('chart', 'Trend', ['30 days'])] }, { id: 'dash-table', name: 'Table first', description: 'Data-dense admin view.', blocks: [b('sidebar', 'Navigation', ['sections']), b('input', 'Search', ['filters']), b('table', 'Records', ['sortable'])] }] },
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile app',
    blurb: 'Phone-first flows and screens.',
    accent: '#22D3EE',
    surface: '#F5FDFF',
    pages: [
      { id: 'home', name: 'Home', variants: [{ id: 'mob-feed', name: 'Feed', description: 'Card feed with tab bar.', blocks: [b('navbar', 'Header', ['title, avatar']), b('card', 'Feed cards', ['stacked']), b('footer', 'Tab bar', ['5 tabs'])] }, { id: 'mob-list', name: 'List', description: 'Compact list rows.', blocks: [b('navbar', 'Header', ['search']), b('card', 'Rows', ['thumbnail, title'])] }] },
      { id: 'onboarding', name: 'Onboarding', variants: [{ id: 'mob-onb-3', name: 'Three steps', description: 'Illustration plus progress.', blocks: [b('image', 'Illustration', ['top']), b('heading', 'Step title', ['large']), b('button', 'Continue', ['full width'])] }] },
      { id: 'login', name: 'Login', variants: [{ id: 'mob-login', name: 'Phone number', description: 'OTP flow.', blocks: [b('heading', 'Enter your number', ['centred']), b('input', 'Phone', ['numeric']), b('button', 'Send code', ['solid'])] }, { id: 'mob-login-social', name: 'Social', description: 'Apple and Google.', blocks: [b('image', 'Logo', ['small']), b('button', 'Continue with Apple', ['dark']), b('button', 'Continue with Google', ['outline'])] }] },
      { id: 'profile', name: 'Profile', variants: [{ id: 'mob-profile', name: 'Settings list', description: 'Avatar and grouped rows.', blocks: [b('card', 'Account', ['avatar, name']), b('card', 'Rows', ['settings']), b('button', 'Log out', ['ghost'])] }] },
    ],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    blurb: 'Personal or studio showcase.',
    accent: '#FFC53D',
    surface: '#FFFDF5',
    pages: [
      { id: 'home', name: 'Home', variants: [{ id: 'folio-grid', name: 'Work grid', description: 'Project tiles with hover.', blocks: [b('heading', 'Name', ['display']), b('text', 'Positioning', ['one line']), b('image', 'Work', ['2 columns'])] }, { id: 'folio-editorial', name: 'Editorial', description: 'Long-form intro then work.', blocks: [b('heading', 'Name', ['display']), b('text', 'About', ['paragraph']), b('card', 'Selected work', ['list'])] }] },
      { id: 'case', name: 'Case study', variants: [{ id: 'case-long', name: 'Long form', description: 'Problem, process, outcome.', blocks: [b('heading', 'Case title', ['display']), b('image', 'Hero', ['wide']), b('text', 'Problem', ['paragraph']), b('text', 'Outcome', ['paragraph'])] }] },
      { id: 'contact', name: 'Contact', variants: [{ id: 'contact-simple', name: 'Simple', description: 'Email and socials.', blocks: [b('heading', 'Say hello', ['display']), b('input', 'Message', ['textarea']), b('button', 'Send', ['solid']), b('footer', 'Socials', ['links'])] }] },
    ],
  },
];

export function projectType(id?: string): ProjectType {
  return PROJECT_TYPES.find((type) => type.id === id) || PROJECT_TYPES[1];
}

export function pageKind(projectTypeId: string | undefined, kindId: string): PageKind | undefined {
  return projectType(projectTypeId).pages.find((kind) => kind.id === kindId);
}

/* ------------------------------------------------------------------ */

import { newId, type CanvasPage } from './canvas.ts';
import { stackItems } from './templateLayouts.ts';

/** First page of a project type, used as the opening canvas. */
export function starterPages(typeId: string): CanvasPage[] {
  const theme = projectType(typeId);
  const first = theme.pages[0];
  const variant = first.variants[0];
  return [
    {
      id: newId(),
      name: first.name,
      items: stackItems(variant.blocks, 1440, 900, theme.accent),
      width: 1440,
      height: 900,
      background: theme.surface,
    },
  ];
}

/** Build a page from a chosen layout inside the fixed theme. */
export function pageFromVariant(typeId: string, kind: PageKind, variant: PageVariant): CanvasPage {
  const theme = projectType(typeId);
  return {
    id: newId(),
    name: kind.name,
    items: stackItems(variant.blocks, 1440, 900, theme.accent),
    width: 1440,
    height: 900,
    background: theme.surface,
  };
}
