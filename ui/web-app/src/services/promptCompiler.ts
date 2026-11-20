/**
 * Deterministic prompt → wireframe compiler. No model required.
 *
 * The pipeline is deliberately layered:
 *
 *   1. read     — split the prompt into sections and spec lines
 *   2. detect   — find every component mention, including several per line
 *   3. extract  — measure the attributes that are actually stated
 *   4. merge    — de-duplicate repeats and enforce per-kind caps
 *   5. audit    — ask only about attributes that are genuinely missing
 *   6. solve    — lay the result out on a canonical skeleton, desktop/mobile
 *   7. score    — risk from unresolved attributes plus concrete design issues
 *
 * Everything the engine decides is reported as a signal, so the UI can explain
 * itself. A model is never required for any of this; the optional BERT pass in
 * `promptRefiner.ts` only fills gaps that this file reports as unresolved.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ElementKind =
  | 'navbar' | 'heading' | 'text' | 'button' | 'input' | 'link'
  | 'card' | 'image' | 'avatar' | 'badge' | 'tabs' | 'progress'
  | 'table' | 'chart' | 'modal' | 'checkbox' | 'footer';

export interface CompiledElement {
  id: string;
  kind: ElementKind;
  label: string;
  colour?: string;
  /** True when the colour came from the prompt's design tokens, not this element. */
  colourInferred?: boolean;
  action?: string;
  location?: string;
  /** Preferred style variant from the editor's catalogue. */
  preset?: string;
  /** Explicit quantity in the prompt ("6 dishes"). */
  count?: number;
  /** How many times this component was mentioned before merging. */
  mentions?: number;
  /** 0–1: how much of this element was stated rather than inferred. */
  confidence?: number;
  section?: string;
  /** The spec line this element came from, used by the optional model pass. */
  sourceLine?: string;
  /** The full prompt line, so card/footer children can be folded into them. */
  parentLine?: string;
  /** Corner radius from the prompt's design tokens. */
  radius?: number;
  fontFamily?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Question {
  id: string;
  elementId: string;
  attribute: 'label' | 'action' | 'colour' | 'location';
  text: string;
  priority: number;
  /** A plausible answer the user can accept in one click. */
  suggestion?: string;
}

export type Archetype = 'auth' | 'landing' | 'dashboard' | 'commerce' | 'generic';
export type Viewport = 'desktop' | 'mobile';

export interface DesignTokens {
  primary: string;
  statedColour: boolean;
  theme: 'light' | 'dark';
  density: 'compact' | 'comfortable' | 'spacious';
  radius: number;
  font: 'jakarta' | 'bricolage' | 'georgia' | 'mono';
  responsive: boolean;
}

export interface QualityIssue {
  elementId?: string;
  severity: 'warn' | 'error';
  text: string;
}

export interface Signal {
  tone: 'info' | 'merge' | 'infer' | 'warn';
  text: string;
}

export interface CompileMeta {
  structured: boolean;
  sections: string[];
  specLines: number;
  usedLines: number;
  skippedLines: number;
  merges: Array<{ kind: ElementKind; from: number; to: number }>;
  dark: boolean;
  tokens: DesignTokens;
  signals: Signal[];
  /** Every spec line, for the optional model pass. */
  lines: string[];
}

export interface CompileResult {
  elements: CompiledElement[];
  questions: Question[];
  archetype: Archetype;
  meta: CompileMeta;
}

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */

interface KindDef {
  kind: ElementKind;
  words: string[];
}

const KIND_DEFS: KindDef[] = [
  { kind: 'footer', words: ['footer', 'bottom bar', 'copyright bar'] },
  {
    kind: 'navbar',
    words: ['navigation bar', 'navbar', 'nav bar', 'top bar', 'app bar', 'site header', 'page header', 'menu bar', 'navigation', 'header'],
  },
  {
    kind: 'input',
    words: ['filter dropdown', 'filter menu', 'filter bar', 'sort dropdown', 'sort menu', 'sort control', 'text field', 'text box', 'textbox', 'search bar', 'search field', 'search box', 'date picker', 'email address', 'dropdown', 'textarea', 'password', 'username', 'email', 'input', 'field', 'phone number', 'otp'],
  },
  { kind: 'button', words: ['call to action', 'sign in button', 'login button', 'cta', 'button', 'submit'] },
  { kind: 'link', words: ['hyperlink', 'text link', 'anchor link', 'link', 'anchor'] },
  { kind: 'tabs', words: ['segmented control', 'tab group', 'tab bar', 'tabs', 'tab'] },
  { kind: 'badge', words: ['status badge', 'badge', 'pill', 'chip', 'tag'] },
  { kind: 'progress', words: ['progress indicator', 'progress bar', 'loading bar', 'stepper', 'progress'] },
  { kind: 'avatar', words: ['profile picture', 'profile photo', 'profile image', 'user photo', 'avatar'] },
  { kind: 'card', words: ['product card', 'stat card', 'pricing card', 'feature card', 'card', 'tile', 'panel'] },
  {
    kind: 'image',
    words: ['header image', 'hero image', 'feature image', 'background image', 'illustration', 'screenshot', 'thumbnail', 'picture', 'gallery', 'banner', 'photo', 'image', 'graphic', 'logo', 'map'],
  },
  { kind: 'table', words: ['data grid', 'datagrid', 'list of rows', 'leaderboard', 'table'] },
  { kind: 'chart', words: ['bar chart', 'line chart', 'pie chart', 'sparkline', 'chart', 'graph', 'analytics'] },
  { kind: 'modal', words: ['modal', 'dialog', 'popup', 'drawer', 'overlay'] },
  { kind: 'checkbox', words: ['checkbox', 'check box', 'toggle', 'switch', 'radio button', 'radio'] },
  { kind: 'heading', words: ['headline', 'heading', 'hero text', 'title', 'h1', 'h2'] },
  {
    kind: 'text',
    words: ['body copy', 'paragraph', 'description', 'subheading', 'subtitle', 'caption', 'tagline', 'summary', 'price', 'rating', 'review', 'copy', 'text'],
  },
];

/** Ties at the same span resolve toward the more specific component. */
const KIND_PRIORITY: Record<ElementKind, number> = {
  avatar: 1, badge: 2, link: 2, tabs: 2, progress: 2,
  input: 3, button: 3, card: 4,
  image: 5, table: 5, chart: 5, modal: 5, checkbox: 5,
  navbar: 6, footer: 6, heading: 7, text: 8,
};

const CAPS: Record<ElementKind, number> = {
  navbar: 1, footer: 1, image: 4, card: 4, avatar: 2, badge: 3,
  tabs: 2, progress: 2, input: 3, button: 3, link: 3,
  heading: 3, text: 3, table: 2, chart: 2, modal: 2, checkbox: 2,
};

const CONTAINER_KINDS: ElementKind[] = ['navbar', 'footer', 'card', 'modal', 'table'];

const COLOURS: Record<string, string> = {
  red: '#E5484D', crimson: '#D62828', rose: '#F43F5E',
  blue: '#4D7CFE', navy: '#1E3A8A', sky: '#38BDF8', indigo: '#4F46E5',
  green: '#28C76F', emerald: '#10B981', mint: '#34D399', teal: '#22D3EE',
  violet: '#7C5CFF', purple: '#7C5CFF', lavender: '#A78BFA',
  orange: '#FF7A59', coral: '#FF6B6B', yellow: '#FFC53D', amber: '#F59E0B',
  black: '#0B0E14', white: '#FFFFFF', grey: '#8A8F98', gray: '#8A8F98',
};

const ACCENT_KINDS: ElementKind[] = ['button', 'badge', 'avatar', 'link', 'chart', 'progress', 'navbar', 'checkbox'];

export const REQUIRED_ATTRS: Record<ElementKind, Array<Question['attribute']>> = {
  navbar: [], footer: [], text: [], tabs: [], progress: [],
  heading: ['label'], card: ['label'], image: ['label'], avatar: ['label'],
  badge: ['label'], link: ['label'], input: ['label'],
  button: ['label', 'action'], table: ['label'], chart: ['label'],
  modal: ['label', 'action'], checkbox: ['label'],
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function cleanHeading(value: string): string {
  return value
    .replace(/[#*_`]/g, '')
    .replace(/[:\-–—]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
}

function cleanLabel(raw: string): string {
  let value = raw.trim();
  value = value.replace(/^["“”'‘’]+|["“”'‘’]+$/g, '');
  value = value.replace(/^(?:a|an|the)\s+/i, '');
  value = value.replace(/^\d+\s+/, '');
  value = value.replace(/\s+(?:in|at|on|with|that|which|using|colou?red|sized)\s+.*$/i, '');
  value = value.replace(/[.,;:]+$/, '');
  value = value.replace(/\s+/g, ' ').trim();
  return value.length > 48 ? `${value.slice(0, 45).trim()}…` : value;
}

/**
 * Replace quoted copy with spaces of the same length. A label like
 * "Book a table" must not be read as a table component.
 */
function maskQuoted(text: string): string {
  return text.replace(/(["“”'])[^"“”']*\1/g, (match) => ' '.repeat(match.length));
}

function findColour(text: string): string | undefined {
  const masked = maskQuoted(text);
  const hex = masked.match(/#[0-9a-f]{6}\b/i);
  if (hex) return hex[0].toUpperCase();
  const lower = masked.toLowerCase();
  let best: { value: string; index: number; length: number } | undefined;
  for (const [name, value] of Object.entries(COLOURS)) {
    const match = new RegExp(`\\b${name}\\b`, 'i').exec(lower);
    if (!match) continue;
    if (!best || match.index < best.index || (match.index === best.index && name.length > best.length)) {
      best = { value, index: match.index, length: name.length };
    }
  }
  return best?.value;
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
};

function findCount(text: string): number | undefined {
  const nouns = 'cards?|tiles?|items?|images?|photos?|products?|dishes?|columns?|rows?|buttons?|features?|badges?|avatars?|links?';
  const gap = '(?:stat|feature|product|pricing|menu|blog|team|profile)?\\s*';
  const numeric = text.match(new RegExp(`\\b(\\d{1,2})\\s+${gap}(?:${nouns})\\b`, 'i'));
  if (numeric) {
    const value = Number.parseInt(numeric[1], 10);
    if (Number.isFinite(value) && value > 0) return Math.min(value, 8);
  }
  const word = text.match(new RegExp(`\\b(one|two|three|four|five|six|seven|eight|nine)\\s+${gap}(?:${nouns})\\b`, 'i'));
  return word ? WORD_NUMBERS[word[1].toLowerCase()] : undefined;
}

const ACTION_VERB =
  /^(?:open|close|submit|save|send|download|navigate|redirect|go|get|try|join|add|remove|delete|confirm|cancel|start|sign|log|pay|book|order|create|show|display|filter|search|upload|export|import|toggle|switch|view|edit|update|share|copy|invite|subscribe|buy|checkout|dismiss)\w*/i;

export function isActionPhrase(value: string): boolean {
  return ACTION_VERB.test(value.trim());
}

function cleanAction(value: string): string {
  return value
    .replace(/^["“”'‘’]+|["“”'‘’]+$/g, '')
    .replace(/[.,;:]+$/, '')
    .replace(/\s+(?:and|or|to|for|with|a|an|the)$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
}

/** Only interactive components get actions, and never from an imperative. */
function findAction(text: string): string | undefined {
  const candidates = [
    text.match(/\bon click\s*[,:]?\s*(.+)$/i)?.[1],
    text.match(/\b(?:that|which)\s+([a-z][a-z ]{2,44})$/i)?.[1],
    text.match(/\bto\s+([a-z][a-z ]{2,44})$/i)?.[1],
  ];
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && isActionPhrase(value)) return cleanAction(value);
  }
  return undefined;
}

function findLocation(text: string): string | undefined {
  const match = maskQuoted(text).match(/\b(top|bottom|left|right|centre|center|middle|sidebar)\b/i);
  return match ? match[1].toLowerCase() : undefined;
}

function findBrand(text: string): string | undefined {
  const named = text.match(
    /\b(?:brand|company|startup|restaurant|store|shop)\s+(?:name\s+|title\s+)?(?:is\s+|called\s+|named\s+)?["“']([^"“”']{2,32})["“”']/i
  );
  return named ? cleanLabel(named[1]) : undefined;
}

const DEFAULTS: Array<[RegExp, string]> = [
  [/\bemail\b/i, 'Email'],
  [/\bpassword\b/i, 'Password'],
  [/\busername\b/i, 'Username'],
  [/\bphone|mobile\b/i, 'Phone number'],
  [/\botp\b|verification code/i, 'Verification code'],
  [/\bsearch\b/i, 'Search'],
  [/\bfilter\b/i, 'Filter'],
  [/\bsort\b/i, 'Sort by'],
  [/\bsize\b/i, 'Size'],
  [/\bcolou?r\b/i, 'Colour'],
  [/\bquantity\b/i, 'Quantity'],
  [/\bcity\b/i, 'City'],
  [/\bcountry\b/i, 'Country'],
  [/\baddress\b/i, 'Address'],
  [/\bmessage\b/i, 'Message'],
  [/\bcomment\b/i, 'Comment'],
  [/\bname\b/i, 'Name'],
  [/\bdropdown|select\b/i, 'Choose an option'],
  [/\blogo\b/i, 'Logo'],
  [/\bgallery\b/i, 'Gallery'],
  [/\bhero|banner\b/i, 'Hero image'],
  [/\bmap\b/i, 'Map'],
];

function inferLabel(
  text: string,
  kind: ElementKind,
  section: string,
  brand: string | undefined
): string {
  const quoted = text.match(/["“”']([^"“”']{2,48})["“”']/);
  if (quoted) return cleanLabel(quoted[1]);

  const colon = text.match(
    /^\s*(?:label|title|heading|headline|button|cta|text|copy|name|placeholder)\s*[:\-]\s*(.+)$/i
  );
  if (colon) return cleanLabel(colon[1]);

  const says = text.match(
    /(?:says?|saying|labelled|labeled|titled|reads?|captioned|named|called)\s*[:\-]?\s*(.+)$/i
  );
  if (says) return cleanLabel(says[1]);

  const word = text.match(
    /\b(?:with|using)\s+(?:the\s+)?(?:word|words|text|label|copy)\s*[:\-]?\s*["“”']?([^"“”',.;]{2,48})/i
  );
  if (word) return cleanLabel(word[1]);

  if (kind === 'image' || kind === 'avatar') {
    const of = text.match(
      /\b(?:images?|photos?|pictures?|illustrations?|graphics?|banners?|logos?|avatars?|thumbnails?|screenshots?|maps?|galleries|gallery)\s+(?:of|for|showing)\s+(.+)$/i
    );
    if (of) return titleCase(cleanLabel(of[1]));
  }

  if (kind === 'tabs') {
    const tabsFor = text.match(/\btabs?\s+(?:for|of|with)\s+(.+)$/i);
    if (tabsFor) return titleCase(cleanLabel(tabsFor[1]));
  }

  if (kind === 'input' || kind === 'checkbox' || kind === 'badge' || kind === 'link') {
    const forWhat = text.match(/\b(?:fields?|inputs?|search|dropdowns?|box(?:es)?|checkbox(?:es)?|badges?|links?)\s+(?:for|of|to)\s+(.+)$/i);
    if (forWhat) return titleCase(cleanLabel(forWhat[1]));
    for (const [pattern, label] of DEFAULTS) {
      if (pattern.test(text)) return label;
    }
  }

  if (kind === 'table' || kind === 'chart') {
    const of = text.match(/\b(?:tables?|charts?|graphs?|lists?)\s+(?:of|for|showing)\s+(.+)$/i);
    if (of) return titleCase(cleanLabel(of[1]));
    if (section) return `${titleCase(section)} ${kind === 'table' ? 'table' : 'chart'}`;
    return kind === 'table' ? 'Table' : 'Metric chart';
  }

  if (kind === 'card') {
    const named: Record<string, string> = {
      feature: 'Features', product: 'Products', pricing: 'Plans', stat: 'Metrics',
      testimonial: 'Testimonials', menu: 'Menu', blog: 'Articles', team: 'Team',
    };
    const type = text.match(/\b(feature|product|pricing|stat|testimonial|menu|blog|team)\s+cards?\b/i);
    if (type) return named[type[1].toLowerCase()];
    const of = text.match(/\b(?:cards?|tiles?|panels?)\s+(?:for|of|showing)\s+(.+)$/i);
    if (of) return titleCase(cleanLabel(of[1]));
  }

  if (kind === 'navbar') return brand || 'Brand';
  if (kind === 'footer') return 'Footer';
  if (kind === 'avatar') return 'User';
  if (kind === 'link') return 'Learn more';
  if (kind === 'badge') return '';

  if (kind === 'image') {
    for (const [pattern, label] of DEFAULTS) {
      if (pattern.test(text)) return label;
    }
  }

  return '';
}

function pickPreset(kind: ElementKind, lower: string, dark: boolean, archetype: Archetype): string | undefined {
  switch (kind) {
    case 'navbar': return dark ? 'nav-dark' : 'nav-light';
    case 'input':
      if (/search|find|filter/.test(lower)) return 'input-search';
      if (/password|otp|code|pin/.test(lower)) return 'input-float';
      return 'input-labelled';
    case 'image':
      if (/hero|banner|background|full[- ]bleed/.test(lower)) return 'image-bleed';
      if (/screenshot|app preview|framed|mockup/.test(lower)) return 'image-framed';
      return 'image-rounded';
    case 'avatar': return 'avatar-initials';
    case 'badge': return /solid/.test(lower) ? 'badge-solid' : /dot|status/.test(lower) ? 'badge-dot' : 'badge-soft';
    case 'link': return 'btn-ghost';
    case 'card':
      if (/stat|metric|kpi|revenue|sales|growth|number/.test(lower)) return 'card-stat';
      if (/feature|pricing|plan|testimonial/.test(lower)) return 'card-elevated';
      return 'card-media';
    case 'chart': return /line|trend|growth|over time/.test(lower) ? 'chart-line' : 'chart-bars';
    case 'button': return dark ? 'btn-dark' : 'btn-solid';
    case 'heading': return archetype === 'dashboard' ? 'text-h2' : 'text-display';
    default: return undefined;
  }
}

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const DEFAULT_TOKENS: DesignTokens = {
  primary: '#7C5CFF',
  statedColour: false,
  theme: 'light',
  density: 'comfortable',
  radius: 10,
  font: 'jakarta',
  responsive: true,
};

/**
 * "Build a settings screen" names the screen, so it can seed a page heading.
 * Only used when the prompt did not already describe a heading.
 */
function inferScreenTitle(text: string, archetype: Archetype): string | undefined {
  if (archetype === 'landing' || archetype === 'commerce') return undefined;
  const first = (text.split(/\r?\n/).find((line) => line.trim()) || text).replace(/^#+\s*/, '');
  const direct = first.match(/\b([A-Za-z][a-z]{2,20})\s+(?:screen|page|dashboard|view)\b/i);
  const word = direct
    ? direct[1]
    : archetype === 'dashboard' && /^dashboard\b/i.test(first.trim())
      ? 'Dashboard'
      : undefined;
  if (!word) return undefined;
  if (
    /^(landing|home|main|this|the|new|web|mobile|whole|modern|nice|cool|clean|simple|minimal|beautiful|good|great|awesome|stunning|sleek|responsive|dark|light|single|full)$/i.test(
      word
    )
  ) {
    return undefined;
  }
  return titleCase(word.toLowerCase());
}

function parseTokens(text: string, base: DesignTokens = DEFAULT_TOKENS): DesignTokens {
  const lower = text.toLowerCase();
  const near = lower.match(/\b(?:primary|accent|brand|main|cta)\s*(?:colou?r)?\s*(?:is|:)?\s*(#[0-9a-f]{6}|[a-z]+)/i);
  let primary: string | undefined;
  if (near) {
    const value = near[1];
    primary = value.startsWith('#') ? value.toUpperCase() : COLOURS[value.toLowerCase()];
  }
  // A page block may mention "a green button" without redefining the brand.
  // Only an explicit primary/accent/brand phrase can override an inherited one.
  if (!primary && !base.statedColour) primary = findColour(text);

  const darkSignal =
    /\b(?:dark|black)\s+(?:mode|theme|background|ui)\b/i.test(text) ||
    /background\s+(?:is\s+|in\s+)?(?:black|dark)/i.test(text) ||
    /\bdark\b[^.\n]{0,30}\b(?:page|screen|ui|design|site|landing|dashboard|app)\b/i.test(text);
  const lightSignal =
    /\b(?:light|white)\s+(?:mode|theme|background|ui)\b/i.test(text) ||
    /background\s+(?:is\s+|in\s+)?(?:white|light)/i.test(text);

  const theme: DesignTokens['theme'] = darkSignal ? 'dark' : lightSignal ? 'light' : base.theme;

  const density: DesignTokens['density'] = /compact|dense|tight/i.test(text)
    ? 'compact'
    : /spacious|airy|roomy|generous/i.test(text)
      ? 'spacious'
      : base.density;

  const radius = /sharp|square corners|no radius/i.test(text)
    ? 0
    : /pill|fully rounded|rounded-full/i.test(text)
      ? 999
      : /rounded|soft corners/i.test(text)
        ? 14
        : base.radius;

  const font: DesignTokens['font'] = /serif|editorial/i.test(text)
    ? 'georgia'
    : /mono|terminal|code/i.test(text)
      ? 'mono'
      : /display|expressive|bold type/i.test(text)
        ? 'bricolage'
        : base.font;

  return {
    primary: primary || base.primary,
    statedColour: Boolean(primary) || base.statedColour,
    theme,
    density,
    radius,
    font,
    responsive: /responsive|mobile|tablet|breakpoint|desktop/i.test(text) || base.responsive,
  };
}

/* ------------------------------------------------------------------ */
/* Component detection                                                 */
/* ------------------------------------------------------------------ */

interface KindMatch {
  kind: ElementKind;
  word: string;
  start: number;
  end: number;
}

function findAllKinds(text: string): KindMatch[] {
  // Quoted copy is an attribute, not a component mention.
  const lower = maskQuoted(text).toLowerCase();
  const raw: KindMatch[] = [];

  for (const def of KIND_DEFS) {
    for (const word of def.words) {
      const plural = /s$/i.test(word) ? '' : 's?';
      const regex = new RegExp(`\\b${escapeRe(word)}${plural}\\b`, 'gi');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(lower)) !== null) {
        raw.push({ kind: def.kind, word, start: match.index, end: match.index + match[0].length });
        if (match.index === regex.lastIndex) regex.lastIndex += 1;
      }
    }
  }

  // A short match inside a longer one is the same mention: "text" in
  // "text field", "header" in "header image", "picture" in "profile picture".
  const filtered = raw.filter(
    (match) =>
      !raw.some(
        (other) =>
          other !== match &&
          other.start <= match.start &&
          other.end >= match.end &&
          other.end - other.start > match.end - match.start
      )
  );

  filtered.sort(
    (a, b) =>
      a.start - b.start ||
      b.end - b.start - (a.end - a.start) ||
      KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]
  );

  const chosen: KindMatch[] = [];
  for (const match of filtered) {
    const previous = chosen[chosen.length - 1];
    if (previous && match.start < previous.end) {
      if (match.end - match.start > previous.end - previous.start) {
        chosen[chosen.length - 1] = match;
      }
      continue;
    }
    chosen.push(match);
  }
  return chosen;
}

/** Classify a bare noun phrase (used by the optional model pass). */
export function classifyText(text: string): ElementKind | undefined {
  return findAllKinds(text)[0]?.kind;
}

/** Extract a colour from arbitrary model span text. */
export function colourFromText(text: string): string | undefined {
  return findColour(text);
}

/** Re-apply the deterministic screen order after external refinement. */
export function sortForArchetype(
  elements: CompiledElement[],
  archetype: Archetype
): CompiledElement[] {
  return sortSemantic(elements, archetype);
}

/**
 * Build one element from a bare phrase. Used by the optional model pass when
 * it finds a component the deterministic parser did not see.
 */
export function elementFromText(
  text: string,
  archetype: Archetype = 'generic'
): CompiledElement | undefined {
  const hit = findAllKinds(text)[0];
  if (!hit) return undefined;
  const unit: Unit = { text, section: '', line: text };
  return buildElement(hit, text, unit, findColour(text), findAction(text), undefined, archetype, DEFAULT_TOKENS);
}

interface Unit {
  text: string;
  section: string;
  line: string;
}

interface ParsedPrompt {
  units: Unit[];
  sections: string[];
  structured: boolean;
}

function splitProse(line: string): string[] {
  const quoted: string[] = [];
  const masked = line.replace(/(["“”'])([^"“”']{1,60})\1/g, (match) => {
    quoted.push(match);
    return `\u0000${quoted.length - 1}\u0000`;
  });
  return masked
    .split(/,|;|\.|\n|\s+and\s+(?=[a-z])|\s+plus\s+/i)
    .map((part) => part.replace(/\u0000(\d+)\u0000/g, (_whole, index: string) => quoted[Number(index)]).trim())
    .filter(Boolean);
}

function parsePrompt(prompt: string): ParsedPrompt {
  const rawLines = prompt.split(/\r?\n/);
  const headingLines = rawLines.filter((line) => /^\s*#{1,6}\s+/.test(line)).length;
  const bulletLines = rawLines.filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(line)).length;
  const boldLines = rawLines.filter((line) => /^\s*\*\*[^*]+\*\*\s*:?\s*$/.test(line)).length;
  const structured = headingLines >= 1 || boldLines >= 1 || bulletLines >= 2;

  const units: Unit[] = [];
  const sections: string[] = [];
  let section = '';

  const noteSection = (value: string) => {
    section = cleanHeading(value);
    if (section && !sections.includes(section)) sections.push(section);
  };

  for (const raw of rawLines) {
    const originalLine = raw.trim();
    let line = originalLine;
    if (!line) continue;

    const hash = line.match(/^#{1,6}\s+(.+)$/);
    if (hash) {
      noteSection(hash[1]);
      continue;
    }

    const bold = line.match(/^\*\*([^*]+)\*\*\s*:?\s*$/);
    if (bold && bold[1].length <= 48) {
      noteSection(bold[1]);
      continue;
    }

    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (bullet) line = bullet[1];

    line = line.replace(/\*\*|__|`/g, '').trim();
    if (!line) continue;

    const colonSection = line.match(/^([A-Za-z][A-Za-z /&-]{1,28}):$/);
    if (colonSection && findAllKinds(line).length === 0) {
      noteSection(colonSection[1]);
      continue;
    }

    const tabList = /\btabs?\s+(?:for|of|with)\b|\btab (?:bar|group)\b/i.test(line);
    if (structured || tabList) {
      units.push({ text: line, section, line: originalLine });
    } else {
      splitProse(line).forEach((text) => units.push({ text, section, line: originalLine }));
    }
  }

  return { units, sections, structured };
}

/* ------------------------------------------------------------------ */
/* Archetype                                                           */
/* ------------------------------------------------------------------ */

const ARCHETYPE_RULES: Array<{ archetype: Archetype; patterns: RegExp[] }> = [
  {
    archetype: 'auth',
    patterns: [/log ?in/, /sign ?in/, /sign ?up/, /register/, /\botp\b/, /password/, /create account/, /forgot password/, /2fa/],
  },
  {
    archetype: 'commerce',
    patterns: [/cart/, /checkout/, /product/, /shop/, /store/, /price/, /\border/, /\bmenu\b/, /restaurant/, /food/, /delivery/, /dish/, /catalog/, /add to (?:bag|cart)/],
  },
  {
    archetype: 'dashboard',
    patterns: [/dashboard/, /analytics/, /\badmin\b/, /\bmetrics?\b/, /\bkpis?\b/, /report/, /\btable\b/, /\bchart\b/],
  },
  {
    archetype: 'landing',
    patterns: [/landing/, /\bhero\b/, /marketing/, /homepage/, /testimonial/, /pricing/, /waitlist/, /newsletter/, /\bfeatures?\b/],
  },
];

function detectArchetype(text: string): Archetype {
  const lower = text.toLowerCase();
  const head = lower.slice(0, 180);
  let best: { archetype: Archetype; score: number } = { archetype: 'generic', score: 0 };

  for (const rule of ARCHETYPE_RULES) {
    let score = 0;
    rule.patterns.forEach((pattern) => {
      if (pattern.test(lower)) score += 1;
      if (pattern.test(head)) score += 2;
    });
    if (score > best.score) best = { archetype: rule.archetype, score };
  }

  return best.score >= 1 ? best.archetype : 'generic';
}

/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

/** Drop a list connector that belongs to the next mention, not this one. */
function trimWindow(text: string): string {
  let value = text.trim();
  const cut = value.lastIndexOf(',');
  if (cut > 0 && value.slice(cut + 1).trim().length <= 14) {
    value = value.slice(0, cut);
  }
  value = value.replace(/\s+and\s+(?:a|an|the)\s*\w*$/i, '');
  value = value.replace(/\s+and\s*$/i, '');
  return value.replace(/[,\s]+$/, '').trim();
}

function windowsFor(text: string, hits: KindMatch[]): Array<{ text: string; hit: KindMatch }> {
  // "password fields" contains two matches of the same kind but is one field.
  // Two inputs separated by real words ("search bar … sort dropdown") are two.
  const sameKind =
    hits.every((hit) => hit.kind === hits[0].kind) &&
    hits.every((hit, index) => index === 0 || hit.start - hits[index - 1].end <= 3);
  if (hits.length <= 1 || sameKind || CONTAINER_KINDS.includes(hits[0].kind)) {
    return [{ text, hit: hits[0] }];
  }
  const limited = hits.slice(0, 6);

  // Start a window after the connector that precedes its mention, so
  // "three badges" keeps its quantifier instead of starting at "badges".
  const startOf = (index: number): number => {
    if (index === 0) return 0;
    const previous = limited[index - 1];
    const between = text.slice(previous.end, limited[index].start);
    const connectors = /(?:,|\band\b|\bplus\b)\s*/gi;
    let lastEnd = -1;
    let match: RegExpExecArray | null;
    while ((match = connectors.exec(between)) !== null) {
      lastEnd = previous.end + match.index + match[0].length;
    }
    return lastEnd >= 0 ? lastEnd : previous.end;
  };

  return limited.map((hit, index) => ({
    text: trimWindow(
      text.slice(
        startOf(index),
        index + 1 < limited.length ? limited[index + 1].start : text.length
      )
    ),
    hit,
  }));
}

function confidenceFor(
  hit: KindMatch,
  text: string,
  label: string,
  colour: string | undefined,
  action: string | undefined,
  section: string
): number {
  let score = 0.42;
  if (hit.word.length >= 6) score += 0.1;
  if (label) score += 0.15;
  if (colour) score += 0.08;
  if (action) score += 0.1;
  if (section) score += 0.05;
  if (/["“”']/.test(text)) score += 0.05;
  return Number(Math.min(1, score).toFixed(2));
}

function buildElement(
  hit: KindMatch,
  windowText: string,
  unit: Unit,
  unitColour: string | undefined,
  unitAction: string | undefined,
  brand: string | undefined,
  archetype: Archetype,
  tokens: DesignTokens
): CompiledElement {
  const lower = windowText.toLowerCase();
  const interactive = ['button', 'modal', 'checkbox'].includes(hit.kind);
  const label = inferLabel(windowText, hit.kind, unit.section, brand);
  const colour = findColour(windowText) || unitColour;
  // "Book a table" / "Order now" already state their action in the label.
  const derivedAction =
    hit.kind === 'button' && label && isActionPhrase(label) ? label.toLowerCase() : undefined;
  const action = interactive ? findAction(windowText) || unitAction || derivedAction : undefined;

  return {
    id: '',
    kind: hit.kind,
    label,
    colour:
      colour ||
      (tokens.statedColour && ACCENT_KINDS.includes(hit.kind) ? tokens.primary : undefined),
    colourInferred: !colour && tokens.statedColour && ACCENT_KINDS.includes(hit.kind),
    action,
    location: findLocation(windowText),
    preset: pickPreset(hit.kind, lower, tokens.theme === 'dark', archetype),
    count: findCount(windowText),
    confidence: confidenceFor(hit, windowText, label, colour, action, unit.section),
    section: unit.section || undefined,
    sourceLine: unit.text,
    parentLine: unit.line,
    radius: ['button', 'input', 'card', 'modal', 'image', 'badge'].includes(hit.kind)
      ? tokens.radius
      : undefined,
    fontFamily: tokens.font,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  };
}

function extractElements(
  unit: Unit,
  brand: string | undefined,
  archetype: Archetype,
  tokens: DesignTokens
): CompiledElement[] {
  const hits = findAllKinds(unit.text);
  if (!hits.length) return [];
  const unitColour = findColour(unit.text);
  const windows = windowsFor(unit.text, hits);
  // A unit-level action is only safe when the line produced one element.
  const unitAction = windows.length === 1 ? findAction(unit.text) : undefined;

  return windows.map(({ text, hit }) =>
    buildElement(hit, text, unit, unitColour, unitAction, brand, archetype, tokens)
  );
}

function countKinds(elements: CompiledElement[]): Partial<Record<ElementKind, number>> {
  const counts: Partial<Record<ElementKind, number>> = {};
  elements.forEach((element) => {
    counts[element.kind] = (counts[element.kind] || 0) + 1;
  });
  return counts;
}

function dedupe(elements: CompiledElement[]): CompiledElement[] {
  const kept: CompiledElement[] = [];
  const byKey = new Map<string, CompiledElement>();

  for (const element of elements) {
    const labelKey = element.label.trim().toLowerCase();
    let target = labelKey ? byKey.get(`${element.kind}::${labelKey}`) : undefined;

    if (!target && CAPS[element.kind] === 1) {
      target = kept.find((entry) => entry.kind === element.kind);
    }
    if (!target && !labelKey) {
      target = kept.find(
        (entry) =>
          entry.kind === element.kind &&
          !entry.label &&
          (entry.section || '') === (element.section || '') &&
          (!entry.action || !element.action || entry.action === element.action)
      );
    }

    if (target) {
      if (!target.label && element.label) target.label = element.label;
      if (!target.action && element.action) target.action = element.action;
      if (!target.colour && element.colour) {
        target.colour = element.colour;
        target.colourInferred = element.colourInferred;
      }
      target.mentions = (target.mentions || 1) + (element.mentions || 1);
      target.confidence = Math.max(target.confidence || 0, element.confidence || 0);
      continue;
    }

    const clone: CompiledElement = { ...element };
    kept.push(clone);
    if (labelKey) byKey.set(`${element.kind}::${labelKey}`, clone);
  }

  return kept;
}

function applyCaps(elements: CompiledElement[]): CompiledElement[] {
  const counts: Partial<Record<ElementKind, number>> = {};
  const kept: CompiledElement[] = [];
  for (const element of elements) {
    const next = (counts[element.kind] || 0) + 1;
    counts[element.kind] = next;
    if (next > CAPS[element.kind]) continue;
    kept.push(element);
  }
  return kept;
}

const SEMANTIC_ORDER: Record<Archetype, ElementKind[]> = {
  auth: ['navbar', 'image', 'avatar', 'heading', 'text', 'input', 'checkbox', 'button', 'link', 'badge', 'tabs', 'progress', 'card', 'table', 'chart', 'modal', 'footer'],
  commerce: ['navbar', 'image', 'avatar', 'heading', 'text', 'badge', 'card', 'tabs', 'input', 'button', 'link', 'progress', 'table', 'chart', 'checkbox', 'modal', 'footer'],
  dashboard: ['navbar', 'card', 'chart', 'progress', 'table', 'tabs', 'heading', 'text', 'input', 'button', 'link', 'badge', 'image', 'avatar', 'checkbox', 'modal', 'footer'],
  landing: ['navbar', 'image', 'avatar', 'heading', 'text', 'badge', 'button', 'link', 'card', 'tabs', 'input', 'progress', 'table', 'chart', 'checkbox', 'modal', 'footer'],
  generic: ['navbar', 'image', 'avatar', 'heading', 'text', 'badge', 'tabs', 'card', 'progress', 'input', 'button', 'link', 'table', 'chart', 'modal', 'checkbox', 'footer'],
};

function sortSemantic(elements: CompiledElement[], archetype: Archetype): CompiledElement[] {
  const order = SEMANTIC_ORDER[archetype];
  return elements
    .map((element, index) => ({ element, index }))
    .sort((a, b) => {
      const diff = order.indexOf(a.element.kind) - order.indexOf(b.element.kind);
      return diff !== 0 ? diff : a.index - b.index;
    })
    .map((entry) => entry.element);
}

/* ------------------------------------------------------------------ */
/* Questions                                                           */
/* ------------------------------------------------------------------ */

function priorityFor(kind: ElementKind, attribute: Question['attribute']): number {
  if (attribute === 'action') return 0;
  switch (kind) {
    case 'button': return attribute === 'label' ? 1 : 0;
    case 'heading': return 2;
    case 'input': return 3;
    case 'card': return 4;
    case 'image': return 5;
    case 'modal': return 6;
    case 'checkbox': return 7;
    case 'badge': return 8;
    case 'link': return 9;
    case 'avatar': return 10;
    default: return 11;
  }
}

function labelSuggestion(element: CompiledElement): string | undefined {
  if (element.kind === 'button' && element.action) {
    return titleCase(element.action.replace(/s\b/g, '').split(' ')[0]);
  }
  if (element.section) {
    if (element.kind === 'heading' || element.kind === 'card' || element.kind === 'badge') {
      return titleCase(element.section);
    }
    if (element.kind === 'image') return `${titleCase(element.section)} image`;
  }
  switch (element.kind) {
    case 'image': return 'Product photo';
    case 'avatar': return 'User';
    case 'link': return 'Learn more';
    case 'badge': return 'New';
    case 'card': return 'Card title';
    case 'heading': return 'Your headline';
    default: return undefined;
  }
}

function questionText(element: CompiledElement, attribute: Question['attribute']): string {
  const where = element.section ? ` in "${element.section}"` : '';

  if (attribute === 'action') {
    return element.label
      ? `What should "${element.label}" do when clicked?`
      : `What happens when the ${element.kind}${where} is used?`;
  }

  switch (element.kind) {
    case 'button':
      return element.action
        ? `What should the button (${element.action}) say?`
        : `What should the button${where} say?`;
    case 'heading': return `What headline should the ${element.section || 'screen'} carry?`;
    case 'input': return `What should the input${where} ask for?`;
    case 'card': return `What does the card${where} show?`;
    case 'image': return `What should the image${where} show?`;
    case 'checkbox': return `What is the checkbox${where} for?`;
    case 'badge': return `What should the badge${where} say?`;
    case 'link': return `What should the link${where} say?`;
    case 'avatar': return `Whose avatar is this${where}?`;
    default: return `What should the ${element.kind}${where} say?`;
  }
}

export function auditElements(elements: CompiledElement[]): Question[] {
  const questions: Question[] = [];
  const seen = new Set<string>();
  elements.forEach((element) => {
    (REQUIRED_ATTRS[element.kind] || []).forEach((attribute) => {
      const value = element[attribute as keyof CompiledElement];
      if (value) return;
      // Three identical unlabelled cards need one answer, not three.
      const group = `${element.kind}|${element.section || ''}|${element.sourceLine || ''}|${attribute}|${element.action || ''}`;
      if (seen.has(group)) return;
      seen.add(group);
      questions.push({
        id: `${element.id}:${attribute}`,
        elementId: element.id,
        attribute,
        text: questionText(element, attribute),
        priority: priorityFor(element.kind, attribute),
        suggestion: attribute === 'label' ? labelSuggestion(element) : undefined,
      });
    });
  });
  return questions.sort((a, b) => a.priority - b.priority);
}

/* ------------------------------------------------------------------ */
/* Quality audit                                                       */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return null;
  const value = match[1];
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
}

/** Concrete, checkable design problems — not opinions. */
export function auditQuality(elements: CompiledElement[]): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const ctaLabels = new Map<string, number>();
  const seenContrast = new Set<string>();

  elements.forEach((element) => {
    if (!element.colour) return;

    // 3:1 is the WCAG threshold for UI text/components. Higher text thresholds
    // belong to the generated UI, not this schematic, so they are not audited
    // here (otherwise every brand colour reads as "broken").
    if (element.kind === 'button' || element.kind === 'avatar') {
      const ratio = contrastRatio('#FFFFFF', element.colour);
      if (ratio < 3) {
        const key = `white:${element.colour}`;
        if (!seenContrast.has(key)) {
          seenContrast.add(key);
          issues.push({
            elementId: element.id,
            severity: 'warn',
            text: `White text on ${element.colour} is ${ratio}:1 — below the 3:1 UI contrast floor.`,
          });
        }
      }
    }

    if (element.kind === 'link') {
      const ratio = contrastRatio(element.colour, '#FFFFFF');
      if (ratio < 3) {
        const key = `link:${element.colour}`;
        if (!seenContrast.has(key)) {
          seenContrast.add(key);
          issues.push({
            elementId: element.id,
            severity: 'warn',
            text: `Link colour ${element.colour} is ${ratio}:1 on white — below the 3:1 UI contrast floor.`,
          });
        }
      }
    }

    if (element.kind === 'button' && element.label) {
      const key = element.label.trim().toLowerCase();
      ctaLabels.set(key, (ctaLabels.get(key) || 0) + 1);
    }
  });

  ctaLabels.forEach((count, label) => {
    if (count > 1) {
      issues.push({
        severity: 'warn',
        text: `${count} buttons are labelled “${label}” — distinct actions need distinct copy.`,
      });
    }
  });

  return issues;
}

/* ------------------------------------------------------------------ */
/* Compile                                                             */
/* ------------------------------------------------------------------ */

export function compilePrompt(prompt: string, tokenBase?: DesignTokens): CompileResult {
  const tokens = parseTokens(prompt, tokenBase ?? DEFAULT_TOKENS);
  const archetype = detectArchetype(prompt);
  const brand = findBrand(prompt);
  const parsed = parsePrompt(prompt);
  const dark = tokens.theme === 'dark';

  if (!prompt.trim()) {
    return {
      elements: [],
      questions: [],
      archetype: 'generic',
      meta: {
        structured: false, sections: [], specLines: 0, usedLines: 0,
        skippedLines: 0, merges: [], dark, tokens, signals: [], lines: [],
      },
    };
  }

  let raw: CompiledElement[] = [];
  let usedLines = 0;

  parsed.units.forEach((unit) => {
    const extracted = extractElements(unit, brand, archetype, tokens);
    if (!extracted.length) return;
    usedLines += 1;
    raw.push(...extracted);
  });

  // A button described inside a card ("…with name, price and an add button")
  // is an affordance of that card, not a page-level button. Footer links are
  // represented by the footer component.
  const foldedNotes: string[] = [];
  raw = raw.filter((element) => {
    const parent = (element.parentLine || '').toLowerCase();
    if (
      element.kind === 'button' &&
      /\bcards?\b/.test(parent) &&
      !element.label &&
      !element.action
    ) {
      foldedNotes.push('A card-level add button was folded into its card.');
      return false;
    }
    if (
      element.kind === 'link' &&
      /\bfooter\b/.test(parent) &&
      (!element.label || element.label === 'Learn more')
    ) {
      foldedNotes.push('Footer links are represented by the footer component.');
      return false;
    }
    return true;
  });

  // "Login page" / "Settings screen" names the page; seed a heading when the
  // prompt did not already describe one.
  const screenTitle = inferScreenTitle(prompt, archetype);
  if (screenTitle && !raw.some((element) => element.kind === 'heading')) {
    raw.push({
      id: '', kind: 'heading', label: screenTitle, preset: 'text-h2',
      confidence: 0.5, radius: tokens.radius, fontFamily: tokens.font,
      x: 0, y: 0, w: 0, h: 0,
    });
  }

  // A "## Navigation" / "## Footer" section implies that structure even when
  // its bullets only talk about links.
  if (
    parsed.sections.some((section) => /^(nav|navbar|navigation|header)$/i.test(section)) &&
    !raw.some((element) => element.kind === 'navbar')
  ) {
    raw.push({
      id: '', kind: 'navbar', label: brand || 'Brand',
      preset: dark ? 'nav-dark' : 'nav-light',
      section: parsed.sections.find((section) => /^(nav|navbar|navigation|header)$/i.test(section)),
      confidence: 0.6, radius: tokens.radius, fontFamily: tokens.font,
      x: 0, y: 0, w: 0, h: 0,
    });
  }
  if (
    parsed.sections.some((section) => /^footer$/i.test(section)) &&
    !raw.some((element) => element.kind === 'footer')
  ) {
    raw.push({
      id: '', kind: 'footer', label: 'Footer', preset: 'footer-default',
      section: parsed.sections.find((section) => /^footer$/i.test(section)),
      confidence: 0.6, fontFamily: tokens.font,
      x: 0, y: 0, w: 0, h: 0,
    });
  }

  if (!raw.length) {
    raw.push(
      { id: '', kind: 'heading', label: '', preset: 'text-display', confidence: 0.2, radius: tokens.radius, fontFamily: tokens.font, x: 0, y: 0, w: 0, h: 0 },
      { id: '', kind: 'text', label: '', preset: 'text-body', confidence: 0.2, fontFamily: tokens.font, x: 0, y: 0, w: 0, h: 0 },
      { id: '', kind: 'button', label: '', preset: 'btn-solid', confidence: 0.2, radius: tokens.radius, fontFamily: tokens.font, action: undefined, x: 0, y: 0, w: 0, h: 0 }
    );
  }

  const before = countKinds(raw);
  const deduped = dedupe(raw);
  const capped = applyCaps(deduped);

  // "6 dishes" is one spec line but should read as a grid, not one wide box.
  const expanded: CompiledElement[] = [];
  const repeatSignals: Signal[] = [];
  capped.forEach((element) => {
    const count = element.count || 1;
    if (
      (element.kind === 'card' || element.kind === 'image' || element.kind === 'avatar' ||
        element.kind === 'badge' || element.kind === 'link') &&
      count > 1
    ) {
      const shown = Math.min(count, 3);
      repeatSignals.push({
        tone: 'infer',
        text: `Requested ${count} ${element.kind}s → ${shown} drawn (a grid, not one wide box).`,
      });
      for (let index = 0; index < shown; index += 1) {
        expanded.push({ ...element, count: undefined });
      }
    } else {
      expanded.push(element);
    }
  });

  const ordered = sortSemantic(applyCaps(expanded), archetype).map((element, index) => ({
    ...element,
    id: `el_${index + 1}`,
  }));

  const after = countKinds(ordered);
  const merges = Object.entries(before)
    .filter(([kind, count]) => (count || 0) > (after[kind as ElementKind] || 0))
    .map(([kind, count]) => ({
      kind: kind as ElementKind,
      from: count || 0,
      to: after[kind as ElementKind] || 0,
    }));

  const skippedLines = Math.max(0, parsed.units.length - usedLines);
  const signals: Signal[] = [];

  if (parsed.structured) {
    signals.push({
      tone: 'info',
      text: `Structured prompt: read section by section (${parsed.sections.length} section${parsed.sections.length === 1 ? '' : 's'}${parsed.sections.length ? `: ${parsed.sections.slice(0, 4).join(', ')}${parsed.sections.length > 4 ? '…' : ''}` : ''}).`,
    });
  } else {
    signals.push({ tone: 'info', text: 'Prose prompt: clauses split on commas, full stops and “and”.' });
  }

  signals.push({
    tone: 'info',
    text: `${parsed.units.length} spec line${parsed.units.length === 1 ? '' : 's'} read → ${ordered.length} element${ordered.length === 1 ? '' : 's'} kept.`,
  });

  if (skippedLines > 0) {
    signals.push({
      tone: 'info',
      text: `${skippedLines} line${skippedLines === 1 ? '' : 's'} contained no UI component and were ignored.`,
    });
  }

  merges.forEach((merge) => {
    const reason = merge.to >= CAPS[merge.kind] ? `capped at ${CAPS[merge.kind]}` : 'de-duplicated';
    signals.push({
      tone: 'merge',
      text: `“${merge.kind}” was mentioned ${merge.from}× → ${merge.to} kept (${reason}).`,
    });
  });

  repeatSignals.forEach((signal) => signals.push(signal));
  foldedNotes.forEach((note) => signals.push({ tone: 'merge', text: note }));

  if (tokens.statedColour) {
    signals.push({
      tone: 'infer',
      text: `Primary colour ${tokens.primary} applied to ${ACCENT_KINDS.filter((kind) => ordered.some((element) => element.kind === kind)).join(', ') || 'accents'}.`,
    });
  } else {
    signals.push({ tone: 'info', text: 'No primary colour stated — accents use the house violet.' });
  }

  if (dark) signals.push({ tone: 'info', text: 'Dark theme detected — navigation and buttons use dark variants.' });
  if (tokens.density !== 'comfortable') signals.push({ tone: 'info', text: `${titleCase(tokens.density)} density inferred from the wording.` });

  const avgConfidence = ordered.length
    ? Number((ordered.reduce((sum, element) => sum + (element.confidence || 0), 0) / ordered.length).toFixed(2))
    : 0;
  signals.push({ tone: 'infer', text: `Mean extraction confidence ${Math.round(avgConfidence * 100)}% — lower values are the ones the questions target.` });

  return {
    elements: ordered,
    questions: auditElements(ordered),
    archetype,
    meta: {
      structured: parsed.structured,
      sections: parsed.sections,
      specLines: parsed.units.length,
      usedLines,
      skippedLines,
      merges,
      dark,
      tokens,
      signals,
      lines: parsed.units.map((unit) => unit.text),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Pages / screens                                                     */
/* ------------------------------------------------------------------ */

export interface PromptScreen extends CompileResult {
  id: string;
  name: string;
}

function stripHeading(line: string): string {
  return line.trim().replace(/^#{1,6}\s*/, '');
}

function isScreenMarker(line: string): boolean {
  const trimmed = line.trim();
  if (/^-{3,}$/.test(trimmed)) return true;
  const content = stripHeading(trimmed);
  if (/^(?:screen|page|view|step)\s*\d*\s*(?:[:—–-].*)?$/i.test(content)) return true;
  return /^#{1,6}\s+.+\s+(?:screen|page|view)\s*$/i.test(trimmed);
}

function screenMarkerName(line: string): string | undefined {
  const trimmed = line.trim();
  if (/^-{3,}$/.test(trimmed)) return undefined;
  const content = stripHeading(trimmed);
  const explicit = content.match(/^(?:screen|page|view|step)\s*\d*\s*[:—–-]\s*(.+)$/i);
  if (explicit) return cleanHeading(explicit[1]);
  const trailing = content.match(/^(.+?)\s+(?:screen|page|view)$/i);
  if (trailing) return cleanHeading(trailing[1]);
  return undefined;
}

function blockName(text: string, archetype: Archetype): string | undefined {
  const heading = text.split(/\r?\n/).find((line) => /^#{1,6}\s+\S/.test(line));
  if (heading) {
    const value = cleanHeading(heading.replace(/^#{1,6}\s+/, ''));
    if (value && !/^(hero|features?|footer|navigation|nav|menu|section|content)$/i.test(value)) {
      return value;
    }
  }
  return inferScreenTitle(text, archetype);
}

/**
 * Split an explicit multi-screen prompt into independently solved pages.
 *
 * Boundaries are unambiguous markers — `---`, `Screen 2: Dashboard`,
 * `## Login screen` — so ordinary section headings such as `## Hero` remain
 * sections of one page rather than becoming pages themselves.
 */
export function compilePromptScreens(prompt: string): PromptScreen[] {
  const lines = prompt.split(/\r?\n/);
  const markers = lines.filter((line) => isScreenMarker(line)).length;

  if (markers < 2) {
    const compiled = compilePrompt(prompt);
    const name = blockName(prompt, compiled.archetype) || 'Screen 1';
    return [{ ...compiled, id: 'screen_1', name }];
  }

  const globalTokens = parseTokens(prompt);
  const blocks: Array<{ name: string; text: string }> = [];
  let current: { name: string; lines: string[] } = { name: '', lines: [] };

  lines.forEach((line) => {
    if (isScreenMarker(line)) {
      if (current.lines.some((entry) => entry.trim())) {
        blocks.push({ name: current.name, text: current.lines.join('\n') });
      }
      current = { name: screenMarkerName(line) || '', lines: [] };
    } else {
      current.lines.push(line);
    }
  });
  if (current.lines.some((entry) => entry.trim())) {
    blocks.push({ name: current.name, text: current.lines.join('\n') });
  }

  const candidates = blocks
    .map((block) => {
      const compiled = compilePrompt(block.text, globalTokens);
      return {
        compiled,
        name: block.name || blockName(block.text, compiled.archetype) || '',
      };
    })
    // A preamble such as "Dark theme, emerald primary colour" is not a page.
    .filter((entry) => entry.compiled.meta.usedLines > 0);

  const screens: PromptScreen[] = candidates.map((entry, index) => {
    const id = `screen_${index + 1}`;
    const elements = entry.compiled.elements.map((element) => ({
      ...element,
      id: `${id}_${element.id}`,
    }));
    return {
      ...entry.compiled,
      id,
      name: entry.name || `Screen ${index + 1}`,
      elements,
      questions: auditElements(elements),
    };
  });

  return screens.length
    ? screens
    : [{ ...compilePrompt(prompt), id: 'screen_1', name: 'Screen 1' }];
}

/* ------------------------------------------------------------------ */
/* Layout frames                                                       */
/* ------------------------------------------------------------------ */

interface Frame {
  w: number;
  h: number;
  pad: number;
  navH: number;
  footerH: number;
  gap: number;
}

const FRAMES: Record<Viewport, Frame> = {
  desktop: { w: 1200, h: 800, pad: 64, navH: 64, footerH: 80, gap: 16 },
  mobile: { w: 390, h: 844, pad: 20, navH: 56, footerH: 72, gap: 12 },
};

const DENSITY_SCALE: Record<DesignTokens['density'], number> = {
  compact: 0.9,
  comfortable: 1,
  spacious: 1.08,
};

interface Row {
  items: CompiledElement[];
  h: number;
}

function heightFor(element: CompiledElement, viewport: Viewport, density: number): number {
  const desktop: Partial<Record<ElementKind, number>> = {
    heading: 72, text: 48, input: 64, table: 208, chart: 200, modal: 260,
    tabs: 44, link: 32, badge: 28, progress: 32, checkbox: 48,
  };
  const mobile: Partial<Record<ElementKind, number>> = {
    heading: 48, text: 44, input: 56, table: 180, chart: 160, modal: 220,
    tabs: 40, link: 30, badge: 26, progress: 30, checkbox: 40,
  };
  const base = (viewport === 'mobile' ? mobile : desktop)[element.kind] || 44;
  const inputHeight = element.preset === 'input-search' ? (viewport === 'mobile' ? 44 : 48) : base;
  return inputHeight * density;
}

function buildRows(
  body: CompiledElement[],
  viewport: Viewport,
  density: number
): Row[] {
  const rows: Row[] = [];
  let index = 0;
  const mobile = viewport === 'mobile';

  while (index < body.length) {
    const element = body[index];

    if (element.kind === 'image' || element.kind === 'avatar' || element.kind === 'card') {
      const kind = element.kind;
      const items: CompiledElement[] = [];
      const limit = mobile ? 1 : 3;
      while (index < body.length && body[index].kind === kind && items.length < limit) {
        items.push(body[index]);
        index += 1;
      }
      const grid = items.length > 1;
      const base =
        kind === 'card' ? (grid ? 172 : 180)
          : kind === 'image' ? (grid ? 176 : 240)
            : 72;
      rows.push({ items, h: base * density });
      continue;
    }

    if (element.kind === 'button' || element.kind === 'link' || element.kind === 'checkbox') {
      const items: CompiledElement[] = [];
      const limit = mobile ? 1 : 3;
      while (
        index < body.length &&
        ['button', 'link', 'checkbox'].includes(body[index].kind) &&
        items.length < limit
      ) {
        items.push(body[index]);
        index += 1;
      }
      rows.push({ items, h: 48 * density });
      continue;
    }

    if (element.kind === 'badge') {
      const items: CompiledElement[] = [];
      const limit = mobile ? 2 : 4;
      while (index < body.length && body[index].kind === 'badge' && items.length < limit) {
        items.push(body[index]);
        index += 1;
      }
      rows.push({ items, h: 28 * density });
      continue;
    }

    rows.push({ items: [element], h: heightFor(element, viewport, density) });
    index += 1;
  }

  return rows;
}

function layoutAuth(
  body: CompiledElement[],
  frame: Frame,
  density: number,
  top: number,
  bottom: number,
  out: CompiledElement[]
): void {
  const colW = Math.min(frame.w === 1200 ? 420 : frame.w - frame.pad * 2, frame.w - frame.pad * 2);
  const x = (frame.w - colW) / 2;
  const heights = body.map((element) => {
    if (element.kind === 'image') return 64 * density;
    if (element.kind === 'avatar') return 72 * density;
    if (element.kind === 'input') return 64 * density;
    if (element.kind === 'button') return 48 * density;
    if (element.kind === 'heading') return 56 * density;
    return 40 * density;
  });
  const total = heights.reduce((sum, height) => sum + height, 0) + Math.max(0, body.length - 1) * frame.gap;
  let y = Math.max(top + 16, top + (bottom - top - total) / 2);

  body.forEach((element, index) => {
    const height = heights[index];
    if (element.kind === 'image' || element.kind === 'avatar') {
      const size = element.kind === 'avatar' ? 72 : 64;
      out.push({ ...element, x: x + colW / 2 - (size * density) / 2, y, w: size * density, h: size * density });
    } else if (element.kind === 'input' || element.kind === 'button') {
      out.push({ ...element, x, y, w: colW, h: height });
    } else {
      out.push({ ...element, x: x + 24, y, w: colW - 48, h: height });
    }
    y += height + frame.gap;
  });
}

interface HeroSplit {
  hero: CompiledElement;
  left: CompiledElement[];
  rest: CompiledElement[];
}

function splitHero(body: CompiledElement[], archetype: Archetype): HeroSplit | null {
  if (archetype !== 'commerce' && archetype !== 'landing') return null;
  const images = body.filter((element) => element.kind === 'image');
  if (images.length !== 1) return null;
  const hero = images[0];
  const leftKinds: ElementKind[] = ['heading', 'text', 'badge', 'button', 'link', 'avatar'];
  const left = body.filter((element) => element !== hero && leftKinds.includes(element.kind));
  if (left.length < 2) return null;
  const rest = body.filter((element) => element !== hero && !left.includes(element));
  return { hero, left, rest };
}

function layoutHero(
  split: HeroSplit,
  frame: Frame,
  density: number,
  top: number,
  bottom: number,
  dense: boolean,
  out: CompiledElement[]
): number {
  const gap = frame.gap;
  const leftX = frame.pad;
  const leftW = Math.min(500, (frame.w - frame.pad * 2) * 0.46);
  const heroX = leftX + leftW + 40;
  const heroW = frame.w - frame.pad - heroX;

  const leftHeights = split.left.map((element) => {
    if (element.kind === 'heading') return 84 * density;
    if (element.kind === 'text') return 60 * density;
    if (element.kind === 'button') return 48 * density;
    if (element.kind === 'badge') return 28 * density;
    if (element.kind === 'link') return 32 * density;
    return 40 * density;
  });
  const leftTotal = leftHeights.reduce((sum, height) => sum + height, 0) + Math.max(0, split.left.length - 1) * gap;
  // A busy screen gets a smaller hero so the content below is not crushed.
  const heroCap = (bottom - top) * (dense ? 0.34 : 0.55);
  const heroH = Math.min(Math.max(leftTotal, 260 * density), heroCap);
  const leftScale = leftTotal > heroH ? heroH / leftTotal : 1;
  const centerY = top + Math.max(0, (heroH - leftTotal * leftScale) / 2);

  let y = centerY;
  split.left.forEach((element, index) => {
    const height = leftHeights[index] * leftScale;
    const width =
      element.kind === 'button' ? Math.min(220, leftW)
        : element.kind === 'link' || element.kind === 'badge' ? Math.min(220, leftW)
          : leftW;
    out.push({ ...element, x: leftX, y, w: width, h: height });
    y += height + gap * leftScale;
  });

  out.push({ ...split.hero, x: heroX, y: top, w: heroW, h: heroH });
  return top + heroH + gap * 2;
}

function layoutFlow(
  body: CompiledElement[],
  frame: Frame,
  density: number,
  top: number,
  bottom: number,
  archetype: Archetype,
  out: CompiledElement[]
): void {
  let y = top;
  let flowBody = body;

  if (frame.w === FRAMES.desktop.w) {
    const split = splitHero(body, archetype);
    if (split) {
      y = layoutHero(split, frame, density, top, bottom, body.length > 8, out);
      flowBody = split.rest;
    }
  }

  const available = Math.max(120, bottom - y);
  const rows = buildRows(flowBody, frame.w === FRAMES.mobile.w ? 'mobile' : 'desktop', density);
  const total = rows.reduce((sum, row) => sum + row.h, 0) + Math.max(0, rows.length - 1) * frame.gap;
  const factor = total > available ? Math.max(0.28, available / total) : 1;
  const gap = frame.gap * factor;
  const inner = frame.w - frame.pad * 2;
  const mobile = frame.w === FRAMES.mobile.w;

  rows.forEach((row) => {
    const height = Math.max(24, row.h * factor);
    const cols = row.items.length;
    const colW = (inner - frame.gap * (cols - 1)) / cols;

    row.items.forEach((element, index) => {
      let width = colW;
      if (cols === 1) {
        if (element.kind === 'button') width = mobile ? inner : Math.min(220, colW);
        else if (element.kind === 'link') width = Math.min(240, colW);
        else if (element.kind === 'badge') width = Math.min(140, colW);
        else if (element.kind === 'input') width = mobile ? inner : Math.min(420, colW);
        else if (element.kind === 'heading') width = mobile ? inner : Math.min(860, colW);
        else if (element.kind === 'text') width = mobile ? inner : Math.min(720, colW);
        else if (element.kind === 'modal') width = Math.min(mobile ? inner : 480, colW);
        else if (element.kind === 'checkbox') width = Math.min(300, colW);
        else if (element.kind === 'progress') width = Math.min(360, colW);
        else if (element.kind === 'avatar') width = Math.min(72 * density, colW);
      }
      const x = element.kind === 'modal' ? (frame.w - width) / 2 : frame.pad + index * (colW + frame.gap);
      out.push({ ...element, x, y, w: width, h: height });
    });

    y += height + gap;
  });
}

export function layoutElements(
  elements: CompiledElement[],
  archetype: Archetype,
  viewport: Viewport = 'desktop',
  tokens?: DesignTokens
): CompiledElement[] {
  const frame = FRAMES[viewport];
  const density = DENSITY_SCALE[tokens?.density || 'comfortable'];
  const nav = elements.filter((element) => element.kind === 'navbar');
  const footer = elements.filter((element) => element.kind === 'footer');
  const body = elements.filter((element) => element.kind !== 'navbar' && element.kind !== 'footer');
  const out: CompiledElement[] = [];

  const navH = frame.navH;
  nav.forEach((element) =>
    out.push({ ...element, x: frame.pad, y: frame.pad / 2, w: frame.w - frame.pad * 2, h: navH })
  );

  const top = nav.length ? frame.pad / 2 + navH + frame.gap * 1.5 : frame.pad / 2;
  const footerTop = frame.h - frame.footerH - frame.pad / 2;
  const bottom = footer.length ? footerTop - frame.gap * 1.5 : frame.h - frame.pad / 2;

  if (archetype === 'auth') layoutAuth(body, frame, density, top, bottom, out);
  else layoutFlow(body, frame, density, top, bottom, archetype, out);

  footer.forEach((element) =>
    out.push({ ...element, x: frame.pad, y: footerTop, w: frame.w - frame.pad * 2, h: frame.footerH })
  );

  return out;
}

/* ------------------------------------------------------------------ */
/* Risk                                                               */
/* ------------------------------------------------------------------ */

/**
 * Risk combines unresolved required attributes with concrete design issues.
 * Missing attributes carry 80% of the score; contrast, touch targets and
 * duplicate copy carry the rest.
 */
export function roughRisk(elements: CompiledElement[]): number {
  if (!elements.length) return 60;

  const required = elements.reduce(
    (sum, element) => sum + (REQUIRED_ATTRS[element.kind]?.length || 0),
    0
  );
  const missing = elements.reduce(
    (sum, element) =>
      sum +
      (REQUIRED_ATTRS[element.kind] || []).filter(
        (attribute) => !element[attribute as keyof CompiledElement]
      ).length,
    0
  );

  const completeness = required === 0 ? 0 : missing / required;
  const issuePenalty = Math.min(12, auditQuality(elements).length * 3);
  return Math.min(95, Math.max(6, Math.round(6 + completeness * 78 + issuePenalty)));
}
