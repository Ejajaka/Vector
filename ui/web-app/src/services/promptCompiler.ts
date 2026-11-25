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
  | 'background' | 'shape'
  | 'navbar' | 'heading' | 'text' | 'button' | 'input' | 'link'
  | 'card' | 'image' | 'avatar' | 'badge' | 'tabs' | 'progress'
  | 'table' | 'chart' | 'modal' | 'checkbox' | 'footer';

export interface CompiledElement {
  id: string;
  kind: ElementKind;
  label: string;
  colour?: string;
  /** Second colour for split backdrops. */
  colour2?: string;
  /** True when the colour came from the prompt's design tokens, not this element. */
  colourInferred?: boolean;
  action?: string;
  location?: string;
  /** Explicit direction from words like "vertically" / "in a row". */
  orientation?: 'vertical' | 'horizontal';
  /** Explicit side from words like "rightmost" / "on the left". */
  align?: 'left' | 'right' | 'center';
  /** Pin to the top or bottom of the content area. */
  anchor?: 'top' | 'bottom';
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

/** User-taught phrases. `ignore` means "never ask about this again". */
export type LearnedLexicon = Record<string, ElementKind | 'ignore'>;

export interface ClarificationOption {
  label: string;
  /** Omit for the "Ignore" option. */
  kind?: ElementKind;
}

export interface Clarification {
  id: string;
  phrase: string;
  text: string;
  options: ClarificationOption[];
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
  /** The typeface the prompt names, when it names one we do not ship. */
  fontLabel?: string;
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
  clarifications: Clarification[];
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
    kind: 'shape',
    words: ['diagonal line', 'dashed line', 'dotted line', 'horizontal line', 'vertical line', 'divider', 'separator', 'ellipse', 'rectangle', 'triangle', 'polygon', 'circle', 'square', 'arrow', 'wave', 'line'],
  },
  {
    kind: 'navbar',
    words: ['navigation bar', 'navbar', 'nav bar', 'top bar', 'app bar', 'site header', 'page header', 'menu bar', 'navigation', 'header', 'navber', 'navigaton', 'navbr'],
  },
  {
    kind: 'input',
    words: ['filter dropdown', 'filter menu', 'filter bar', 'sort dropdown', 'sort menu', 'sort control', 'text field', 'text box', 'textbox', 'search bar', 'search field', 'search box', 'searchbar', 'date picker', 'email address', 'dropdown', 'textarea', 'password', 'username', 'email', 'input', 'field', 'phone number', 'otp', 'serch bar', 'seach bar', 'serch', 'seach', 'inpt', 'imput', 'feild', 'text feld'],
  },
  { kind: 'button', words: ['call to action', 'sign in button', 'login button', 'cta', 'button', 'submit', 'buton', 'buttn'] },
  { kind: 'link', words: ['hyperlink', 'text link', 'anchor link', 'link', 'anchor', 'lnk'] },
  { kind: 'tabs', words: ['segmented control', 'tab group', 'tab bar', 'tabs', 'tab', 'tabss'] },
  { kind: 'badge', words: ['status badge', 'badge', 'pill', 'chip', 'tag', 'bage', 'badg'] },
  { kind: 'progress', words: ['progress indicator', 'progress bar', 'loading bar', 'stepper', 'progress', 'progess'] },
  { kind: 'avatar', words: ['profile picture', 'profile photo', 'profile image', 'user photo', 'avatar', 'avtar', 'avater'] },
  { kind: 'card', words: ['product card', 'stat card', 'pricing card', 'feature card', 'kpi', 'metric', 'stat', 'statistic', 'card', 'tile', 'panel', 'crd', 'cardd'] },
  {
    kind: 'image',
    words: ['header image', 'hero image', 'feature image', 'background image', 'illustration', 'screenshot', 'thumbnail', 'picture', 'gallery', 'banner', 'photo', 'image', 'graphic', 'logo', 'map', 'imge', 'img', 'pcture'],
  },
  { kind: 'table', words: ['data grid', 'datagrid', 'list of rows', 'leaderboard', 'table', 'tabel', 'tble'] },
  { kind: 'chart', words: ['bar chart', 'line chart', 'pie chart', 'sparkline', 'chart', 'graph', 'analytics', 'chaart', 'charrt'] },
  { kind: 'modal', words: ['modal', 'dialog', 'popup', 'drawer', 'overlay', 'modle', 'modl'] },
  { kind: 'checkbox', words: ['checkbox', 'check box', 'toggle', 'switch', 'radio button', 'radio', 'checkbok', 'chekbox'] },
  { kind: 'heading', words: ['headline', 'heading', 'hero text', 'title', 'h1', 'h2', 'headng', 'headin', 'heding'] },
  {
    kind: 'text',
    words: ['body copy', 'paragraph', 'description', 'subheading', 'subtitle', 'caption', 'tagline', 'summary', 'price', 'rating', 'review', 'copy', 'text', 'paragraf', 'descriptin'],
  },
];

/** Ties at the same span resolve toward the more specific component. */
const KIND_PRIORITY: Record<ElementKind, number> = {
  background: 0, shape: 1,
  avatar: 1, badge: 2, link: 2, tabs: 2, progress: 2,
  input: 3, button: 3, card: 4,
  image: 5, table: 5, chart: 5, modal: 5, checkbox: 5,
  navbar: 6, footer: 6, heading: 7, text: 8,
};

const CAPS: Record<ElementKind, number> = {
  background: 1, shape: 6,
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
  background: [], shape: [], navbar: [], footer: [], text: [], tabs: [], progress: [],
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
  // Layout instructions are not part of the copy.
  value = value.replace(
    /\s+to\s+be\s+(?:placed|positioned|aligned|arranged|stacked|shown|displayed|put)\b.*$/i,
    ''
  );
  value = value.replace(
    /\s+(?:placed|positioned|aligned|arranged|stacked|shown|displayed|put)\b.*$/i,
    ''
  );
  value = value.replace(
    /\s+(?:vertically|horizontally|vertical|horizontal|in\s+a\s+column|in\s+a\s+row|side\s+by\s+side)\b.*$/i,
    ''
  );
  value = value.replace(
    /\s+(?:to|on|at)\s+the\s+(?:far\s+)?(?:right|left|top|bottom)(?:most)?(?:\s+(?:side|hand|corner|edge))?\b.*$/i,
    ''
  );
  value = value.replace(/\s+(?:rightmost|leftmost|topmost|bottommost)\b.*$/i, '');
  value = value.replace(
    /\s+(?:in|at|on|with|that|which|using|colou?red|sized|below|above|under|after|before|next\s+to|beside|inside|outside|near)\s+.*$/i,
    ''
  );
  value = value.replace(/[.,;:]+$/, '');

  // Correct the most common component typos without touching other words.
  const typos: Record<string, string> = {
    serch: 'search', seach: 'search', dishs: 'dishes', dishe: 'dishes',
    emial: 'email', pasword: 'password', passwrod: 'password', usrname: 'username',
  };
  value = value.replace(/\b\w+\b/g, (word) => {
    const fix = typos[word.toLowerCase()];
    if (!fix) return word;
    return word[0] === word[0].toUpperCase() ? fix.charAt(0).toUpperCase() + fix.slice(1) : fix;
  });

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

/**
 * Pick the colour closest to a component's keyword, not the first colour in
 * the line. "yellow background with a green button" must colour the button
 * green, not yellow.
 */
function findNearestColour(text: string, keyword: string): string | undefined {
  const masked = maskQuoted(text);
  const matches: Array<{ value: string; index: number }> = [];
  const hex = /#[0-9a-f]{6}\b/gi;
  let match: RegExpExecArray | null;
  while ((match = hex.exec(masked)) !== null) {
    matches.push({ value: match[0].toUpperCase(), index: match.index });
  }
  for (const [name, value] of Object.entries(COLOURS)) {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    while ((match = regex.exec(masked)) !== null) {
      matches.push({ value, index: match.index });
    }
  }
  if (!matches.length) return undefined;

  // A colour inside a background phrase belongs to the page, not the control.
  const candidates = matches.filter((entry) => {
    const context = masked.slice(
      Math.max(0, entry.index - 24),
      Math.min(masked.length, entry.index + 32)
    );
    return !/\b(?:background|backdrop|canvas|fill|paint|screen|page)\b|\b(?:upper|lower)\s+half\b/i.test(
      context
    );
  });
  const pool = candidates.length ? candidates : matches;

  const anchor =
    new RegExp(`\\b${escapeRe(keyword)}s?\\b`, 'i').exec(masked)?.index ?? pool[0].index;
  let best: { value: string; distance: number } | undefined;
  pool.forEach((entry) => {
    const distance = Math.abs(entry.index - anchor);
    if (!best || distance < best.distance) best = { value: entry.value, distance };
  });

  // A colour far from the keyword belongs to another component.
  return best && best.distance <= 32 ? best.value : undefined;
}

function findColours(text: string): string[] {
  const masked = maskQuoted(text);
  const found: Array<{ value: string; index: number }> = [];
  const hex = /#[0-9a-f]{6}\b/gi;
  let match: RegExpExecArray | null;
  while ((match = hex.exec(masked)) !== null) {
    found.push({ value: match[0].toUpperCase(), index: match.index });
  }
  for (const [name, value] of Object.entries(COLOURS)) {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    while ((match = regex.exec(masked)) !== null) {
      found.push({ value, index: match.index });
    }
  }
  const seen = new Set<string>();
  return found
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.value)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
};

function findCount(text: string): number | undefined {
  const nouns = 'cards?|tiles?|items?|images?|photos?|products?|dishes?|dishs?|columns?|rows?|buttons?|features?|badges?|avatars?|links?';
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

interface Placement {
  vertical?: boolean;
  horizontal?: boolean;
  align?: 'left' | 'right' | 'center';
  anchor?: 'top' | 'bottom';
  relative?: 'above' | 'below';
}

/** Tolerate the misspellings people actually type in layout instructions. */
function normaliseLayoutText(text: string): string {
  return maskQuoted(text)
    .toLowerCase()
    .replace(/\brigth(?:most)?\b|\brght\b/g, 'right')
    .replace(/\blefth?most\b/g, 'leftmost')
    .replace(/\blft\b/g, 'left')
    .replace(/\bbotom\b|\bbottm\b/g, 'bottom')
    .replace(/\btopp\b/g, 'top')
    .replace(/\bvertcal\b|\bverticle\b|\bverticaly\b/g, 'vertical')
    .replace(/\bhorizental\b|\bhorizonal\b|\bhorizontaly\b/g, 'horizontal')
    .replace(/\bcenterd\b|\bcentre\b|\bcentred\b|\bcentered\b/g, 'center');
}

/**
 * Read layout instructions independently of component attributes.
 * "cards … placed vertically to the rightmost side" is direction + side,
 * not a longer card label.
 */
function findPlacement(text: string): Placement {
  const lower = normaliseLayoutText(text);

  const vertical = /\b(?:vertical(?:ly)?|stack(?:ed|ing)?|in a column|single column|column of|one (?:below|under) (?:the )?other)\b/.test(
    lower
  );
  const horizontal = /\b(?:horizontal(?:ly)?|in a row|side[- ]by[- ]side|across|row of)\b/.test(lower);

  const align: Placement['align'] = /\b(?:rightmost|right[- ]most|right[- ]hand(?: side)?|right side|on the right|to the right|at the right|far right)\b/.test(
    lower
  )
    ? 'right'
    : /\b(?:leftmost|left[- ]most|left[- ]hand(?: side)?|left side|on the left|to the left|at the left|far left)\b/.test(
        lower
      )
      ? 'left'
      : /\b(?:center(?:ed)?|middle)\b/.test(lower)
        ? 'center'
        : undefined;

  const anchor: Placement['anchor'] = /\b(?:at\s+(?:the\s+)?(?:very\s+)?bottom|bottom(?:most)?\s+of\s+(?:the\s+)?(?:screen|page|board|app|viewport)|(?:screen|page|board|viewport)\s+bottom|bottom)\b/.test(
    lower
  )
    ? 'bottom'
    : /\b(?:at\s+(?:the\s+)?(?:very\s+)?top|top(?:most)?\s+of\s+(?:the\s+)?(?:screen|page|board|app|viewport)|(?:screen|page|board|viewport)\s+top|top)\b/.test(
        lower
      )
      ? 'top'
      : undefined;

  const relative: Placement['relative'] = /\b(?:below|under|beneath|after)\b/.test(lower)
    ? 'below'
    : /\b(?:above|before|over)\b/.test(lower)
      ? 'above'
      : undefined;

  return { vertical, horizontal, align, anchor, relative };
}

function locationFromPlacement(placement: Placement): string | undefined {
  if (placement.anchor) return placement.anchor;
  if (placement.relative) return placement.relative;
  if (placement.align === 'right') return 'right';
  if (placement.align === 'left') return 'left';
  if (placement.align === 'center') return 'centre';
  return undefined;
}

/**
 * Explicit positional wording outranks the archetype's default skeleton:
 * "search at the top, cards below it" must be two ordered rows, not the
 * canonical card-then-input order.
 */
const LOCATION_RANK: Record<string, number> = {
  top: 0, above: 0, before: 0, first: 0,
  left: 1, right: 1, centre: 1, center: 1, middle: 1, sidebar: 1,
  bottom: 2, below: 2, under: 2, after: 2, last: 2,
};

function findBrand(text: string): string | undefined {
  const named = text.match(
    /\b(?:brand|company|startup|restaurant|store|shop)\s+(?:name\s+|title\s+)?(?:is\s+|called\s+|named\s+)?["“']([^"“”']{2,32})["“”']/i
  );
  return named ? cleanLabel(named[1]) : undefined;
}

const DEFAULTS: Array<[RegExp, string]> = [
  [/\b(?:email|emial)\b/i, 'Email'],
  [/\b(?:password|pasword|passwrod)\b/i, 'Password'],
  [/\b(?:username|usrname)\b/i, 'Username'],
  [/\bphone|mobile\b/i, 'Phone number'],
  [/\botp\b|verification code/i, 'Verification code'],
  [/\b(?:search|serch|seach)\b/i, 'Search'],
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

  if (kind === 'shape') {
    const drawn = text.match(
      /\b(?:draw|add|include|show|display|insert|place|put)\s+(?:a|an|the)?\s*([a-z][a-z -]{2,28}?)(?=\s+(?:at|on|in|to|with|that|which|below|above|for|from|across|between|near|inside|outside|next|under|over|and)\b|[,.;]|$)/i
    );
    if (drawn) return titleCase(cleanLabel(drawn[1]));
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
    const metricHeading = text.match(/\b(kpis?|metrics?|stats?|statistics?)\b\s*[:\-]\s*\S/i);
    if (metricHeading) return /^kpi/i.test(metricHeading[1]) ? 'KPIs' : 'Metrics';
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
      if (/search|find|filter|serch|seach/.test(lower)) return 'input-search';
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
    case 'shape':
      if (/diagonal/.test(lower)) return 'shape-diagonal';
      if (/divider|separator|horizontal line/.test(lower)) return 'shape-divider';
      if (/circle|ellipse/.test(lower)) return 'shape-circle';
      if (/triangle/.test(lower)) return 'shape-triangle';
      if (/arrow/.test(lower)) return 'shape-arrow';
      if (/rect|square|box/.test(lower)) return 'shape-rect';
      if (/line/.test(lower)) return 'shape-line';
      // An unknown word taught as a shape becomes a labelled placeholder box.
      return 'shape-rect';
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

/**
 * A split/diagonal/colour-half instruction is a backdrop, not a component.
 * It can still be drawn, but it never counts as a UI control.
 */
function detectBackdrop(text: string): CompiledElement | undefined {
  const masked = maskQuoted(text);
  const lower = masked.toLowerCase();
  const diagonal = /\b(?:diagonal(?:ly)?|from\s+top[- ]right|top[- ]right)\b/.test(lower);
  const split =
    /\b(?:split|halves?|half|two[- ]tone|gradient)\b/.test(lower) ||
    /\b(?:upper|lower|top|bottom)\s+half\b/.test(lower);
  if (!diagonal && !split) return undefined;

  const mentionsSurface =
    /\b(?:background|backdrop|canvas|fill|paint|page|screen)\b/.test(lower) ||
    /\b(?:upper|lower|top|bottom)\s+half\b/.test(lower);
  if (!mentionsSurface) return undefined;

  const colours = findColours(text);
  if (colours.length < 2) return undefined;

  const gradient = /\bgradient\b/.test(lower);

  return {
    id: '',
    kind: 'background',
    label: gradient
      ? 'Gradient background'
      : diagonal
        ? 'Diagonal split background'
        : 'Split background',
    colour: colours[0],
    colour2: colours[1],
    preset: gradient ? 'gradient' : diagonal ? 'split-diagonal' : 'split-horizontal',
    confidence: 0.8,
    sourceLine: text,
    parentLine: text,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  };
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

  // The prompt may name a family we do not ship (Inter, Roboto, …). The canvas
  // keeps its closest token, but the hand-off prompt must carry the real name
  // instead of claiming the default "jakarta".
  const namedFont = text.match(
    /\b(inter|roboto|helvetica|arial|dm sans|manrope|poppins|montserrat|open sans|lato|nunito|source sans|ibm plex sans|geist|sf pro|system ui|figtree|satoshi|work sans|plus jakarta sans|bricolage grotesque)\b/i,
  )?.[1];

  return {
    primary: primary || base.primary,
    statedColour: Boolean(primary) || base.statedColour,
    theme,
    density,
    radius,
    font,
    fontLabel: namedFont ? namedFont : undefined,
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

function findAllKinds(text: string, lexicon: LearnedLexicon = {}): KindMatch[] {
  // Quoted copy is an attribute, not a component mention.
  const lower = maskQuoted(text).toLowerCase();
  const raw: KindMatch[] = [];

  // Phrases learned from the user's own clarifications.
  for (const [phrase, learnedKind] of Object.entries(lexicon)) {
    if (learnedKind === 'ignore') continue;
    const term = phrase.trim();
    if (!term) continue;
    const regex = new RegExp(`\\b${escapeRe(term)}s?\\b`, 'gi');
    let learned: RegExpExecArray | null;
    while ((learned = regex.exec(lower)) !== null) {
      raw.push({
        kind: learnedKind,
        word: term,
        start: learned.index,
        end: learned.index + learned[0].length,
      });
      if (learned.index === regex.lastIndex) regex.lastIndex += 1;
    }
  }

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
  return buildElement(hit, text, unit, findAction(text), undefined, archetype, DEFAULT_TOKENS);
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
    // A period or comma is a clause boundary only when whitespace or the end of
    // the line follows it: "2.5rem" and "10,000 rows" must stay intact.
    .split(/,(?=\s)|;|\.(?=\s|$)|\n|\s+and\s+(?=[a-z])|\s+plus\s+/i)
    .map((part) => part.replace(/\u0000(\d+)\u0000/g, (_whole, index: string) => quoted[Number(index)]).trim())
    .filter(Boolean);
}

function parsePrompt(prompt: string, lexicon: LearnedLexicon = {}): ParsedPrompt {
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

    // Typography specs ("Use font Inter 2.5rem for the title") describe tokens,
    // not UI structure; reading "title" as a heading would create a ghost card.
    const isTypographyOnly = (value: string) =>
      /\b(font|typeface|font[- ]family|font[- ]size|letter[- ]spacing|line[- ]height)\b/i.test(value) &&
      !/\b(button|input|field|table|card|navbar|footer|modal|chart|image|badge|checkbox|dropdown|sidebar|menu|heading|headline|avatar|form|list)\b/i.test(value);
    if (isTypographyOnly(line)) continue;

    const colonSection = line.match(/^([A-Za-z][A-Za-z /&-]{1,28}):$/);
    if (colonSection && findAllKinds(line, lexicon).length === 0) {
      noteSection(colonSection[1]);
      continue;
    }

    const tabList = /\btabs?\s+(?:for|of|with)\b|\btab (?:bar|group)\b/i.test(line);
    if (structured || tabList) {
      units.push({ text: line, section, line: originalLine });
    } else {
      splitProse(line)
        .filter((text) => !isTypographyOnly(text))
        .forEach((text) => units.push({ text, section, line: originalLine }));
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
  unitAction: string | undefined,
  brand: string | undefined,
  archetype: Archetype,
  tokens: DesignTokens
): CompiledElement {
  const lower = windowText.toLowerCase();
  const interactive = ['button', 'modal', 'checkbox'].includes(hit.kind);
  const placement = findPlacement(windowText);
  const label = inferLabel(windowText, hit.kind, unit.section, brand);
  const colour = findNearestColour(windowText, hit.word);
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
    location: locationFromPlacement(placement),
    orientation: placement.vertical
      ? 'vertical'
      : placement.horizontal
        ? 'horizontal'
        : undefined,
    align: placement.align,
    anchor: placement.anchor,
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
  tokens: DesignTokens,
  lexicon: LearnedLexicon = {}
): CompiledElement[] {
  const hits = findAllKinds(unit.text, lexicon);
  if (!hits.length) return [];
  const windows = windowsFor(unit.text, hits);
  // A unit-level action is only safe when the line produced one element.
  const unitAction = windows.length === 1 ? findAction(unit.text) : undefined;

  return windows.map(({ text, hit }) =>
    buildElement(hit, text, unit, unitAction, brand, archetype, tokens)
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

function expandQuantities(elements: CompiledElement[]): {
  elements: CompiledElement[];
  notes: Signal[];
} {
  const expanded: CompiledElement[] = [];
  const notes: Signal[] = [];

  elements.forEach((element) => {
    const count = element.count || 1;
    if (
      (element.kind === 'card' || element.kind === 'image' || element.kind === 'avatar' ||
        element.kind === 'badge' || element.kind === 'link') &&
      count > 1
    ) {
      const shown = Math.min(count, 3);
      notes.push({
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

  return { elements: expanded, notes };
}

/**
 * Validate externally supplied elements (model output) with the same rules the
 * deterministic compiler uses: de-duplicate, cap counts, expand quantities and
 * sort into the screen's canonical order.
 */
export function finaliseElements(
  elements: CompiledElement[],
  archetype: Archetype,
  idPrefix = 'el'
): CompiledElement[] {
  const deduped = dedupe(elements);
  const capped = applyCaps(deduped);
  const { elements: expanded } = expandQuantities(capped);
  const ordered = sortSemantic(applyCaps(expanded), archetype);
  return ordered.map((element, index) => ({
    ...element,
    id: `${idPrefix}_${index + 1}`,
  }));
}

const SEMANTIC_ORDER: Record<Archetype, ElementKind[]> = {
  auth: ['background', 'shape', 'navbar', 'image', 'avatar', 'heading', 'text', 'input', 'checkbox', 'button', 'link', 'badge', 'tabs', 'progress', 'card', 'table', 'chart', 'modal', 'footer'],
  commerce: ['background', 'shape', 'navbar', 'image', 'avatar', 'heading', 'text', 'badge', 'card', 'tabs', 'input', 'button', 'link', 'progress', 'table', 'chart', 'checkbox', 'modal', 'footer'],
  // The page title leads a dashboard; metrics and tables follow it.
  dashboard: ['background', 'shape', 'navbar', 'heading', 'text', 'card', 'chart', 'progress', 'table', 'tabs', 'input', 'button', 'link', 'badge', 'image', 'avatar', 'checkbox', 'modal', 'footer'],
  landing: ['background', 'shape', 'navbar', 'image', 'avatar', 'heading', 'text', 'badge', 'button', 'link', 'card', 'tabs', 'input', 'progress', 'table', 'chart', 'checkbox', 'modal', 'footer'],
  generic: ['background', 'shape', 'navbar', 'image', 'avatar', 'heading', 'text', 'badge', 'tabs', 'card', 'progress', 'input', 'button', 'link', 'table', 'chart', 'modal', 'checkbox', 'footer'],
};

function sortSemantic(elements: CompiledElement[], archetype: Archetype): CompiledElement[] {
  const order = SEMANTIC_ORDER[archetype];
  const hasExplicitLocation = elements.some(
    (element) => element.location && LOCATION_RANK[element.location] !== undefined
  );
  const structural = (element: CompiledElement) =>
    element.kind === 'background' ? -3
      : element.kind === 'navbar' ? -2
        : element.kind === 'footer' ? 2 : 0;

  return elements
    .map((element, index) => ({ element, index }))
    .sort((a, b) => {
      const structure = structural(a.element) - structural(b.element);
      if (structure !== 0) return structure;

      if (hasExplicitLocation) {
        const rankA = a.element.location ? LOCATION_RANK[a.element.location] ?? 1 : 1;
        const rankB = b.element.location ? LOCATION_RANK[b.element.location] ?? 1 : 1;
        if (rankA !== rankB) return rankA - rankB;
      }

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
/* Clarifications                                                      */
/* ------------------------------------------------------------------ */

const GENERIC_KIND_OPTIONS: ClarificationOption[] = [
  { label: 'Heading', kind: 'heading' },
  { label: 'Text', kind: 'text' },
  { label: 'Card', kind: 'card' },
  { label: 'Button', kind: 'button' },
  { label: 'Input', kind: 'input' },
  { label: 'Image', kind: 'image' },
  { label: 'Shape', kind: 'shape' },
  { label: 'Ignore' },
];

const AMBIGUOUS_TERMS: Array<{
  phrase: string;
  question: string;
  options: ClarificationOption[];
}> = [
  {
    phrase: 'carousel',
    question: 'How should the carousel be drawn?',
    options: [
      { label: 'Image gallery', kind: 'image' },
      { label: 'Row of cards', kind: 'card' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'accordion',
    question: 'How should the accordion be drawn?',
    options: [
      { label: 'Stacked cards', kind: 'card' },
      { label: 'List of rows', kind: 'table' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'sidebar',
    question: 'What is the sidebar?',
    options: [
      { label: 'Navigation bar', kind: 'navbar' },
      { label: 'Panel', kind: 'card' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'tooltip',
    question: 'How should the tooltip be drawn?',
    options: [
      { label: 'Badge', kind: 'badge' },
      { label: 'Modal', kind: 'modal' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'popover',
    question: 'How should the popover be drawn?',
    options: [
      { label: 'Modal', kind: 'modal' },
      { label: 'Badge', kind: 'badge' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'calendar',
    question: 'How should the calendar be drawn?',
    options: [
      { label: 'Table', kind: 'table' },
      { label: 'Cards', kind: 'card' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'feed',
    question: 'How should the feed be drawn?',
    options: [
      { label: 'List of rows', kind: 'table' },
      { label: 'Cards', kind: 'card' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'chat',
    question: 'How should the chat area be drawn?',
    options: [
      { label: 'List of rows', kind: 'table' },
      { label: 'Cards', kind: 'card' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'hero',
    question: 'What is the hero?',
    options: [
      { label: 'Hero image', kind: 'image' },
      { label: 'Heading', kind: 'heading' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'testimonial',
    question: 'How should the testimonial be drawn?',
    options: [
      { label: 'Card', kind: 'card' },
      { label: 'Quote text', kind: 'text' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'pricing',
    question: 'How should the pricing section be drawn?',
    options: [
      { label: 'Pricing cards', kind: 'card' },
      { label: 'Pricing table', kind: 'table' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'kanban',
    question: 'How should the kanban board be drawn?',
    options: [
      { label: 'Cards', kind: 'card' },
      { label: 'Table', kind: 'table' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'video',
    question: 'How should the video be drawn?',
    options: [
      { label: 'Media block', kind: 'image' },
      { label: 'Card', kind: 'card' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'rating',
    question: 'How should the rating be drawn?',
    options: [
      { label: 'Text', kind: 'text' },
      { label: 'Badge', kind: 'badge' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'breadcrumb',
    question: 'How should the breadcrumb be drawn?',
    options: [
      { label: 'Links', kind: 'link' },
      { label: 'Text', kind: 'text' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'pagination',
    question: 'How should pagination be drawn?',
    options: [
      { label: 'Buttons', kind: 'button' },
      { label: 'Links', kind: 'link' },
      { label: 'Ignore' },
    ],
  },
  {
    phrase: 'slider',
    question: 'How should the slider be drawn?',
    options: [
      { label: 'Input', kind: 'input' },
      { label: 'Progress bar', kind: 'progress' },
      { label: 'Ignore' },
    ],
  },
];

/**
 * Ask only when a word is genuinely unmapped and changes the wireframe.
 * Choosing an option is saved by the UI as a learned phrase, so the same
 * question is never asked twice in this workspace.
 */
function detectClarifications(text: string, lexicon: LearnedLexicon = {}): Clarification[] {
  const found: Clarification[] = [];
  const seen = new Set<string>();
  const hits = findAllKinds(text, lexicon);

  for (const term of AMBIGUOUS_TERMS) {
    if (lexicon[term.phrase] !== undefined) continue;
    const regex = new RegExp(`\\b${escapeRe(term.phrase)}s?\\b`, 'gi');
    let match: RegExpExecArray | null;
    let occurrences = 0;
    let coveredOccurrences = 0;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      occurrences += 1;

      // A heading such as "## Hero" or "Pricing:" names a section, not an
      // undrawn component. Do not ask about it.
      const lineStart = text.lastIndexOf('\n', start) + 1;
      const lineBreak = text.indexOf('\n', start);
      const sourceLine = text.slice(lineStart, lineBreak === -1 ? text.length : lineBreak).trim();
      const headingLine =
        /^#{1,6}\s+/.test(sourceLine) ||
        (/:\s*$/.test(sourceLine) && sourceLine.length <= 40);
      const after = text.slice(end, end + 16).toLowerCase();
      const pageContext = /^\s+(?:page|screen|section|view|area)\b/.test(after);

      // "hero image" is already an image; "pricing cards" already a card.
      if (
        headingLine ||
        pageContext ||
        hits.some((hit) => hit.start <= start && hit.end >= end)
      ) {
        coveredOccurrences += 1;
      }
    }

    // If the prompt already expressed the concept anywhere, do not ask.
    if (occurrences > 0 && coveredOccurrences === 0) {
      found.push({
        id: `clarify_${term.phrase}`,
        phrase: term.phrase,
        text: term.question,
        options: term.options,
      });
      seen.add(term.phrase);
    }
  }

  // Open vocabulary: a noun after add/include/show/draw that is not in the
  // schema becomes a proper multiple-choice question, not a silent omission.
  const verbs =
    /\b(?:add|include|show|display|draw|insert|place|put)\s+(?:a|an|the)\s+([a-z][a-z -]{2,32}?)(?=\s+(?:at|on|in|to|with|that|which|below|above|for|from|across|between|near|inside|outside|next|under|over|and)\b|[,.;]|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = verbs.exec(text)) !== null && found.length < 3) {
    const phrase = match[1].trim().toLowerCase();
    if (!phrase || seen.has(phrase) || lexicon[phrase] !== undefined) continue;
    if (
      /^(?:nice|modern|clean|simple|cool|good|great|new|responsive|small|large|big|some|few|beautiful|professional|minimal|dark|light|rounded|spacious|compact|better|best)\b/.test(
        phrase
      )
    ) {
      continue;
    }
    if (findAllKinds(phrase, lexicon).length > 0) continue;
    if (/\b(?:page|screen|section|view|area|layout|design|style|colou?r|copy)\b/.test(phrase)) continue;

    found.push({
      id: `clarify_${phrase.replace(/\s+/g, '_')}`,
      phrase,
      text: `What should “${phrase}” be on this screen?`,
      options: GENERIC_KIND_OPTIONS,
    });
    seen.add(phrase);
  }

  return found.slice(0, 3);
}

/* ------------------------------------------------------------------ */
/* Compile                                                             */
/* ------------------------------------------------------------------ */

const INJECTION_RE = /(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)|(print|reveal|show|repeat|output)\s+(me\s+)?(your\s+)?(system\s+prompt|hidden\s+prompt|developer\s+prompt|instructions?)/i;

/** Removes instructions aimed at the downstream model, not at the design. */
export function stripPromptInjection(text: string): { text: string; removed: number } {
  const parts = text.split(/(?<=[.!?])\s+/);
  const kept = parts.filter((part) => !INJECTION_RE.test(part));
  return { text: kept.join(' ').trim(), removed: parts.length - kept.length };
}

const ACCENT_COLOUR_WORDS = [
  'red', 'blue', 'green', 'violet', 'purple', 'orange', 'amber', 'yellow', 'teal',
  'cyan', 'pink', 'rose', 'indigo', 'emerald', 'coral', 'lavender', 'mint', 'sky', 'navy',
];

/**
 * Contradictions that a deterministic compiler cannot resolve on its own. They
 * are surfaced as warnings so the person decides before the prompt is handed to
 * a generator.
 */
export function detectContradictions(prompt: string): Signal[] {
  const signals: Signal[] = [];
  const lower = prompt.toLowerCase();

  const pairRe = new RegExp(
    `\\b(${ACCENT_COLOUR_WORDS.join('|')})\\b\\s*(?:,|and|\\+|/)\\s*\\b(${ACCENT_COLOUR_WORDS.join('|')})\\b`,
    'i',
  );
  const pair = lower.match(pairRe);
  if (pair && pair[1] !== pair[2]) {
    const first = COLOURS[pair[1]] || pair[1];
    const second = COLOURS[pair[2]] || pair[2];
    signals.push({
      tone: 'warn',
      text: `Two accent colours are requested (${pair[1]} ${first}, ${pair[2]} ${second}). One is applied as primary — confirm the other is an accent, not a second primary.`,
    });
  }

  const darkLight =
    /\b(dark|night)\b[^.]{0,40}\b(light|day)\b/i.test(lower) ||
    /\b(light|day)\b[^.]{0,40}\b(dark|night)\b/i.test(lower);
  if (darkLight && !/\b(toggle|switch|preference|system setting|follows? the (os|system|device)|automatic|auto)\b/i.test(lower)) {
    signals.push({
      tone: 'warn',
      text: 'The prompt asks for a dark theme and a light theme at once. Pick a default, or ask for a user-facing toggle.',
    });
  }

  const prohibitsDelete = /\b(never|not|no|don'?t|must not|should not|cannot|can'?t)\b[^.]{0,30}\b(delete|deletion|remove|removal)\b/i.test(lower);
  if (prohibitsDelete) {
    signals.push({
      tone: 'warn',
      text: 'The prompt forbids deletion but also mentions a delete/remove action. The generated control keeps that action — confirm which rule wins.',
    });
  }

  return signals;
}

export function compilePrompt(
  prompt: string,
  tokenBase?: DesignTokens,
  lexicon: LearnedLexicon = {}
): CompileResult {
  const tokens = parseTokens(prompt, tokenBase ?? DEFAULT_TOKENS);
  const archetype = detectArchetype(prompt);
  const brand = findBrand(prompt);
  const parsed = parsePrompt(prompt, lexicon);
  const dark = tokens.theme === 'dark';

  if (!prompt.trim()) {
    return {
      elements: [],
      questions: [],
      clarifications: [],
      archetype: 'generic',
      meta: {
        structured: false, sections: [], specLines: 0, usedLines: 0,
        skippedLines: 0, merges: [], dark, tokens, signals: [], lines: [],
      },
    };
  }

  const backdrop = detectBackdrop(prompt);
  const clarifications = detectClarifications(prompt, lexicon);
  const ignoredOnly = Object.entries(lexicon).some(
    ([phrase, kind]) =>
      kind === 'ignore' &&
      phrase.trim().length > 0 &&
      new RegExp(`\\b${escapeRe(phrase.trim())}s?\\b`, 'i').test(prompt)
  );
  let raw: CompiledElement[] = backdrop ? [backdrop] : [];
  let usedLines = backdrop ? 1 : 0;

  parsed.units.forEach((unit) => {
    const extracted = extractElements(unit, brand, archetype, tokens, lexicon);
    if (!extracted.length) return;
    usedLines += 1;
    raw.push(...extracted);
  });

  // A button described inside a card ("…with name, price and an add button")
  // is an affordance of that card, not a page-level button. Footer links are
  // represented by the footer component.
  const foldedNotes: string[] = [];
  raw = raw.filter((element) => {
    // The diagonal split backdrop already draws its own divider line.
    if (
      backdrop &&
      element.kind === 'shape' &&
      /diagonal/i.test(element.sourceLine || '') &&
      (element.preset === 'shape-diagonal' || element.preset === 'shape-line')
    ) {
      return false;
    }
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
    // The page title leads the page, even when components were detected first.
    raw.unshift({
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

  // Do not invent a hero when the prompt contains no UI language. Returning an
  // empty page plus a clear warning is more honest than three placeholder
  // components the user never asked for.
  const noComponents = !raw.length && clarifications.length === 0 && !ignoredOnly;

  const before = countKinds(raw);
  const deduped = dedupe(raw);
  const capped = applyCaps(deduped);

  const { elements: expanded, notes: repeatSignals } = expandQuantities(capped);

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

  const injection = stripPromptInjection(prompt);
  if (injection.removed > 0) {
    signals.push({
      tone: 'warn',
      text: `${injection.removed} instruction${injection.removed === 1 ? '' : 's'} tried to override the downstream model and ${injection.removed === 1 ? 'was' : 'were'} removed from the hand-off prompt.`,
    });
  }
  detectContradictions(prompt).forEach((signal) => signals.push(signal));

  if (noComponents) {
    signals.push({
      tone: 'warn',
      text: 'No UI components were recognised. Add a heading, button, input, card or image so there is something to draw.',
    });
  }

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
      text: `${skippedLines} line${skippedLines === 1 ? '' : 's'} contained no UI component and ${skippedLines === 1 ? 'was' : 'were'} ignored.`,
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

  if (backdrop) {
    signals.push({
      tone: 'infer',
      text: `Backdrop: ${
        backdrop.preset === 'split-diagonal'
          ? 'diagonal split'
          : backdrop.preset === 'gradient'
            ? 'gradient'
            : 'split fill'
      } ${backdrop.colour} / ${backdrop.colour2}.`,
    });
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
    clarifications,
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

/**
 * A marker can carry the description on the same line
 * ("Screen 1: Login page with email and password fields…"). Treat that inline
 * text as page content instead of discarding it; short values such as
 * "Screen 2: Dashboard" stay page names.
 */
function screenMarkerInlineBody(line: string): string | undefined {
  const trimmed = line.trim();
  if (/^-{3,}$/.test(trimmed)) return undefined;
  const content = stripHeading(trimmed);
  const explicit = content.match(/^(?:screen|page|view|step)\s*\d*\s*[:—–-]\s*(.+)$/i);
  if (!explicit) return undefined;
  const value = explicit[1].trim();
  if (!value) return undefined;
  const words = value.split(/\s+/).filter(Boolean).length;
  // Sentences, comma lists and long descriptions are body copy, not a name.
  return words >= 5 || /[,.;]/.test(value) ? value : undefined;
}

/** Pull a short title out of an inline screen description. */
function inlineScreenTitle(value: string): string | undefined {
  const lead = value
    .split(/\s+(?:with|that|which|containing|including|showing|featuring|where)\b|[,.;:]/i)[0]
    .replace(/\s+(?:screen|page|view|dashboard)$/i, '')
    .trim();
  if (!lead || lead.length > 40) return undefined;
  const words = lead.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 3) return undefined;
  if (/^(?:a|an|the|this|that|my|our|your)$/i.test(words[0])) return undefined;
  return cleanHeading(titleCase(lead.toLowerCase()));
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
export function compilePromptScreens(
  prompt: string,
  lexicon: LearnedLexicon = {}
): PromptScreen[] {
  const lines = prompt.split(/\r?\n/);
  const markers = lines.filter((line) => isScreenMarker(line)).length;

  // One separator is enough: "page one --- page two" is two pages. A single
  // marker at the top is just a page title and yields one page after filtering.
  if (markers === 0) {
    const compiled = compilePrompt(prompt, undefined, lexicon);
    const name = blockName(prompt, compiled.archetype) || 'Screen 1';
    return [{ ...compiled, id: 'screen_1', name }];
  }

  const blocks: Array<{ name: string; text: string; fromMarker: boolean }> = [];
  let current: { name: string; lines: string[]; fromMarker: boolean } = {
    name: '',
    lines: [],
    fromMarker: false,
  };

  lines.forEach((line) => {
    if (isScreenMarker(line)) {
      if (current.lines.some((entry) => entry.trim())) {
        blocks.push({ name: current.name, text: current.lines.join('\n'), fromMarker: current.fromMarker });
      }
      const inlineBody = screenMarkerInlineBody(line);
      current = {
        name: inlineBody ? inlineScreenTitle(inlineBody) || '' : screenMarkerName(line) || '',
        lines: inlineBody ? [inlineBody] : [],
        fromMarker: true,
      };
    } else {
      current.lines.push(line);
    }
  });
  if (current.lines.some((entry) => entry.trim())) {
    blocks.push({ name: current.name, text: current.lines.join('\n'), fromMarker: current.fromMarker });
  }

  // Tokens are global only when the user wrote them in the preamble. A colour
  // mentioned inside one screen must not tint the other screens.
  const preamble = blocks.find((block) => !block.fromMarker)?.text || '';
  const globalTokens = parseTokens(preamble);

  const candidates = blocks
    .map((block) => {
      const compiled = compilePrompt(block.text, globalTokens, lexicon);
      return {
        compiled,
        name: block.name || blockName(block.text, compiled.archetype) || '',
        fromMarker: block.fromMarker,
      };
    })
    // A preamble such as "Dark theme, emerald primary colour" is not a page.
    // A screen the user explicitly named stays even when no component was
    // recognised — dropping it silently is worse than explaining the gap.
    .filter((entry) => entry.compiled.meta.usedLines > 0 || entry.fromMarker);

  const screens: PromptScreen[] = candidates.map((entry, index) => {
    const id = `screen_${index + 1}`;
    const recognised = entry.compiled.meta.usedLines > 0;
    const elements = recognised
      ? entry.compiled.elements.map((element) => ({ ...element, id: `${id}_${element.id}` }))
      : [];
    const signals: Signal[] = recognised
      ? entry.compiled.meta.signals
      : [
          {
            tone: 'info',
            text: `${entry.compiled.meta.structured ? 'Structured' : 'Prose'} prompt: ${entry.compiled.meta.specLines} line${entry.compiled.meta.specLines === 1 ? '' : 's'} read on this screen.`,
          },
          {
            tone: 'warn',
            text: 'No UI components were recognised on this screen. It reads like a visual or drawing instruction; describe components (heading, card, button…) to draw a wireframe.',
          },
        ];
    return {
      ...entry.compiled,
      id,
      name: entry.name || `Screen ${index + 1}`,
      elements,
      questions: elements.length ? auditElements(elements) : [],
      meta: {
        ...entry.compiled.meta,
        tokens: recognised ? entry.compiled.meta.tokens : globalTokens,
        dark: recognised ? entry.compiled.meta.dark : globalTokens.theme === 'dark',
        signals,
      },
    };
  });

  return screens.length
    ? screens
    : [{ ...compilePrompt(prompt, undefined, lexicon), id: 'screen_1', name: 'Screen 1' }];
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
      // "vertically" means one per row, not a 3-up grid.
      const limit = mobile || element.orientation === 'vertical' ? 1 : 3;
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

/** Place one row, honouring explicit side alignment for single elements. */
function placeRow(
  row: Row,
  y: number,
  factor: number,
  frame: Frame,
  density: number,
  out: CompiledElement[]
): number {
  const mobile = frame.w === FRAMES.mobile.w;
  const height = Math.max(24, row.h * factor);
  const cols = row.items.length;
  const inner = frame.w - frame.pad * 2;
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
      else if (element.kind === 'card' && element.orientation === 'vertical') {
        width = Math.min(360, colW);
      } else if (element.kind === 'image' && element.orientation === 'vertical') {
        width = Math.min(420, colW);
      }
    }

    let x = frame.pad + index * (colW + frame.gap);
    if (cols === 1) {
      if (element.align === 'right') x = frame.w - frame.pad - width;
      else if (element.align === 'center') x = (frame.w - width) / 2;
      else x = frame.pad;
    }
    if (element.kind === 'modal') x = (frame.w - width) / 2;

    out.push({ ...element, x, y, w: width, h: height });
  });

  return height;
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
  const mobile = frame.w === FRAMES.mobile.w;
  const viewport: Viewport = mobile ? 'mobile' : 'desktop';

  // Explicit position wording beats the canonical hero split.
  const hasExplicitLayout = body.some(
    (element) => element.align || element.anchor || element.orientation || element.location
  );

  if (!mobile && !hasExplicitLayout) {
    const split = splitHero(body, archetype);
    if (split) {
      y = layoutHero(split, frame, density, top, bottom, body.length > 8, out);
      flowBody = split.rest;
    }
  }

  const bottomAnchored = flowBody.filter((element) => element.anchor === 'bottom');
  const flowing = flowBody.filter((element) => element.anchor !== 'bottom');
  const bottomRows = buildRows(bottomAnchored, viewport, density);
  const bottomHeight =
    bottomRows.reduce((sum, row) => sum + row.h, 0) + Math.max(0, bottomRows.length - 1) * frame.gap;

  const available = Math.max(
    120,
    bottom - y - (bottomRows.length ? bottomHeight + frame.gap : 0)
  );
  const rows = buildRows(flowing, viewport, density);
  const total = rows.reduce((sum, row) => sum + row.h, 0) + Math.max(0, rows.length - 1) * frame.gap;
  const factor = total > available ? Math.max(0.28, available / total) : 1;
  const gap = frame.gap * factor;

  rows.forEach((row) => {
    y += placeRow(row, y, factor, frame, density, out) + gap;
  });

  if (bottomRows.length) {
    let by = bottom - bottomHeight;
    bottomRows.forEach((row) => {
      by += placeRow(row, by, 1, frame, density, out) + frame.gap;
    });
  }
}

export function layoutElements(
  elements: CompiledElement[],
  archetype: Archetype,
  viewport: Viewport = 'desktop',
  tokens?: DesignTokens
): CompiledElement[] {
  const frame = FRAMES[viewport];
  const density = DENSITY_SCALE[tokens?.density || 'comfortable'];
  const background = elements.filter((element) => element.kind === 'background');
  const shapes = elements.filter((element) => element.kind === 'shape');
  const nav = elements.filter((element) => element.kind === 'navbar');
  const footer = elements.filter((element) => element.kind === 'footer');
  const body = elements.filter(
    (element) =>
      element.kind !== 'navbar' &&
      element.kind !== 'footer' &&
      element.kind !== 'background' &&
      element.kind !== 'shape'
  );
  const out: CompiledElement[] = [];

  background.slice(0, 1).forEach((element) => {
    out.push({ ...element, x: 0, y: 0, w: frame.w, h: frame.h });
  });

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

  // Shapes are overlays: rendered last so they sit above the content.
  shapes.forEach((element, index) => {
    const preset = element.preset || 'shape-line';
    if (preset === 'shape-diagonal') {
      out.push({ ...element, x: 0, y: 0, w: frame.w, h: frame.h });
    } else if (preset === 'shape-divider') {
      out.push({
        ...element,
        x: frame.pad,
        y: frame.h / 2,
        w: frame.w - frame.pad * 2,
        h: 3,
      });
    } else {
      const size = Math.min(240, frame.w * 0.28);
      out.push({
        ...element,
        x: (frame.w - size) / 2 + index * 10,
        y: (frame.h - size) / 2 + index * 10,
        w: size,
        h: size,
      });
    }
  });

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
