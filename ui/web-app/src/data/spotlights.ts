import type { SpotlightArt } from '../components/onboarding/Spotlight.tsx';

export interface SpotlightDef {
  id: string;
  page: 'editor' | 'templates' | 'projects' | 'home';
  title: string;
  body: string;
  art: SpotlightArt;
  anchor: string;
  learnMore?: boolean;
}

/**
 * Contextual first-visit tips. One is shown at a time, per page, until the user
 * dismisses it. Keyed by `${page}:${id}` in localStorage.
 */
export const SPOTLIGHTS: SpotlightDef[] = [
  {
    id: 'editor-drag',
    page: 'editor',
    title: 'Drag anything onto the canvas',
    body: 'Buttons, cards, text, charts and images are all in the Assets panel. Drag one in, or click it to drop it in the middle.',
    art: 'drag',
    anchor: '[data-spot="editor-assets"]',
  },
  {
    id: 'editor-style',
    page: 'editor',
    title: 'Every box is fully styleable',
    body: 'Select any element to change its fill, border colour, border thickness, corner radius, font, size, weight, alignment and colour.',
    art: 'style',
    anchor: '[data-spot="editor-inspector"]',
  },
  {
    id: 'editor-prompt',
    page: 'editor',
    title: 'The prompt writes itself',
    body: 'Every move, resize and colour change is described in the prompt on the right. Copy it into Base44, Bolt or Lovable when you are done.',
    art: 'prompt',
    anchor: '[data-spot="editor-prompt"]',
  },
  {
    id: 'editor-pages',
    page: 'editor',
    title: 'Add as many pages as you need',
    body: 'The page strip at the bottom adds, duplicates and deletes pages. Each page carries its own background and elements.',
    art: 'pages',
    anchor: '[data-spot="editor-pages"]',
  },
  {
    id: 'templates-open',
    page: 'templates',
    title: 'Click a template to start designing',
    body: 'Templates open straight into the canvas with their layout already composed. Preview first if you want to see what is inside.',
    art: 'template',
    anchor: '[data-spot="templates-grid"]',
  },
  {
    id: 'projects-start',
    page: 'projects',
    title: 'Three ways to start',
    body: 'Create a blank project, open a template, or import an existing design. Everything lives inside a project.',
    art: 'drag',
    anchor: '[data-spot="projects-create"]',
  },
];

const KEY = 'vector_spotlights_v1';

export function seenSpotlights(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markSpotlightSeen(page: string, id: string): void {
  try {
    const next = Array.from(new Set([...seenSpotlights(), `${page}:${id}`]));
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function nextSpotlight(page: SpotlightDef['page']): SpotlightDef | null {
  const seen = seenSpotlights();
  return SPOTLIGHTS.find((item) => item.page === page && !seen.includes(`${item.page}:${item.id}`)) || null;
}

export function resetSpotlights(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
