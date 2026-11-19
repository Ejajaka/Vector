/**
 * Deterministic prompt → wireframe compiler. No model involved.
 *
 * Reads an instruction the way a designer would: splits it into sections and
 * spec lines, finds the components those lines talk about, extracts the
 * attributes that were actually stated, merges repeated mentions, then lays
 * the result out using a canonical skeleton for the inferred screen archetype.
 *
 * Everything the engine decides is reported in `meta` so the UI can show the
 * reasoning instead of a black box.
 */

export type ElementKind =
  | 'navbar' | 'heading' | 'text' | 'button' | 'input'
  | 'card' | 'image' | 'table' | 'chart' | 'modal' | 'checkbox' | 'footer';

export interface CompiledElement {
  id: string;
  kind: ElementKind;
  label: string;
  colour?: string;
  action?: string;
  location?: string;
  /** Preferred style variant from the editor's catalogue. */
  preset?: string;
  /** How many times this element was mentioned before merging. */
  count?: number;
  /** Section of the prompt the element came from, e.g. "Hero". */
  section?: string;
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
}

export type Archetype = 'auth' | 'landing' | 'dashboard' | 'commerce' | 'generic';

export interface CompileMeta {
  /** True when the prompt already had headings / bullets / numbered lines. */
  structured: boolean;
  sections: string[];
  /** Lines that looked like spec, before element extraction. */
  specLines: number;
  /** Spec lines that produced an element. */
  usedLines: number;
  /** Spec lines that contained no recognisable component. */
  skippedLines: number;
  /** Kinds that were mentioned more than once and collapsed. */
  merges: Array<{ kind: ElementKind; from: number; to: number }>;
  dark: boolean;
  /** Human-readable engine trace, shown in the Analysis panel. */
  notes: string[];
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
  /** Longer, more specific phrases first — they win at the same position. */
  words: string[];
}

const KIND_DEFS: KindDef[] = [
  {
    kind: 'footer',
    words: ['footer', 'bottom bar', 'copyright bar'],
  },
  {
    kind: 'navbar',
    words: ['navigation bar', 'navbar', 'nav bar', 'top bar', 'app bar', 'site header', 'page header', 'menu bar', 'navigation', 'header'],
  },
  {
    kind: 'input',
    words: ['text field', 'text box', 'textbox', 'search bar', 'search field', 'search box', 'date picker', 'email address', 'dropdown', 'textarea', 'password', 'username', 'email', 'input', 'field', 'phone number', 'otp'],
  },
  {
    kind: 'button',
    words: ['call to action', 'sign in button', 'login button', 'cta', 'button', 'submit'],
  },
  {
    kind: 'card',
    words: ['product card', 'stat card', 'pricing card', 'feature card', 'card', 'tile', 'panel'],
  },
  {
    kind: 'image',
    words: ['header image', 'hero image', 'feature image', 'background image', 'illustration', 'screenshot', 'thumbnail', 'picture', 'gallery', 'avatar', 'banner', 'photo', 'image', 'graphic', 'logo', 'map'],
  },
  {
    kind: 'table',
    words: ['data grid', 'datagrid', 'list of rows', 'leaderboard', 'table'],
  },
  {
    kind: 'chart',
    words: ['bar chart', 'line chart', 'pie chart', 'sparkline', 'chart', 'graph', 'analytics'],
  },
  {
    kind: 'modal',
    words: ['modal', 'dialog', 'popup', 'drawer', 'overlay'],
  },
  {
    kind: 'checkbox',
    words: ['checkbox', 'check box', 'toggle', 'switch', 'radio button', 'radio'],
  },
  {
    kind: 'heading',
    words: ['headline', 'heading', 'hero text', 'title', 'h1', 'h2'],
  },
  {
    kind: 'text',
    words: ['body copy', 'paragraph', 'description', 'subheading', 'subtitle', 'caption', 'tagline', 'summary', 'price', 'rating', 'review', 'copy', 'text'],
  },
];

/** Maximum number of each kind allowed on one screen. */
const CAPS: Record<ElementKind, number> = {
  navbar: 1,
  footer: 1,
  image: 4,
  card: 4,
  input: 3,
  button: 3,
  heading: 3,
  text: 3,
  table: 2,
  chart: 2,
  modal: 2,
  checkbox: 2,
};

const COLOURS: Record<string, string> = {
  red: '#E5484D', crimson: '#D62828', rose: '#F43F5E',
  blue: '#4D7CFE', navy: '#1E3A8A', sky: '#38BDF8', indigo: '#4F46E5',
  green: '#28C76F', emerald: '#10B981', mint: '#34D399', teal: '#22D3EE',
  violet: '#7C5CFF', purple: '#7C5CFF', lavender: '#A78BFA',
  orange: '#FF7A59', coral: '#FF6B6B', yellow: '#FFC53D', amber: '#F59E0B',
  black: '#0B0E14', white: '#FFFFFF', grey: '#8A8F98', gray: '#8A8F98',
};

export const REQUIRED_ATTRS: Record<ElementKind, Array<Question['attribute']>> = {
  navbar: [],
  footer: [],
  text: [],
  heading: ['label'],
  card: ['label'],
  image: ['label'],
  input: ['label'],
  button: ['label', 'action'],
  table: ['label'],
  chart: ['label'],
  modal: ['label', 'action'],
  checkbox: ['label'],
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function titleCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
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
  value = value.replace(/\s+(?:in|at|on|with|that|which|using|colou?red)\s+.*$/i, '');
  value = value.replace(/[.,;:]+$/, '');
  value = value.replace(/\s+/g, ' ').trim();
  return value.length > 48 ? `${value.slice(0, 45).trim()}…` : value;
}

interface KindHit {
  kind: ElementKind;
  word: string;
  index: number;
}

/**
 * Find the component a line is talking about. Earliest mention wins; at the
 * same position the longer phrase wins (`header image` → image, not navbar).
 */
function findKind(text: string): KindHit | undefined {
  const lower = text.toLowerCase();
  let best: KindHit | undefined;
  for (const def of KIND_DEFS) {
    for (const word of def.words) {
      // Accept the common plural ("cards", "images", "buttons") without
      // listing every form in the vocabulary.
      const plural = /s$/i.test(word) ? '' : 's?';
      const match = new RegExp(`\\b${escapeRe(word)}${plural}\\b`, 'i').exec(lower);
      if (!match) continue;
      if (
        !best ||
        match.index < best.index ||
        (match.index === best.index && word.length > best.word.length)
      ) {
        best = { kind: def.kind, word, index: match.index };
      }
    }
  }
  return best;
}

function findColour(text: string): string | undefined {
  const hex = text.match(/#[0-9a-f]{6}\b/i);
  if (hex) return hex[0].toUpperCase();
  const lower = text.toLowerCase();
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
  const nouns = 'cards?|tiles?|items?|images?|photos?|products?|dishes?|columns?|rows?|buttons?|features?';
  const numeric = text.match(new RegExp(`\\b(\\d{1,2})\\s+(?:${nouns})\\b`, 'i'));
  if (numeric) {
    const value = Number.parseInt(numeric[1], 10);
    if (Number.isFinite(value) && value > 0) return Math.min(value, 8);
  }
  const word = text.match(new RegExp(`\\b(one|two|three|four|five|six|seven|eight|nine)\\s+(?:${nouns})\\b`, 'i'));
  return word ? WORD_NUMBERS[word[1].toLowerCase()] : undefined;
}

const ACTION_VERB =
  /^(?:open|close|submit|save|send|download|navigate|redirect|go|add|remove|delete|confirm|cancel|start|sign|log|pay|book|create|show|display|filter|search|upload|export|import|toggle|switch|view|edit|update|share|copy|invite|subscribe|buy|checkout)\w*/i;

function cleanAction(value: string): string {
  return value
    .replace(/^["“”'‘’]+|["“”'‘’]+$/g, '')
    .replace(/[.,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
}

/**
 * Only interactive components get an action. An imperative sentence
 * ("Add a header…") must not be mistaken for a button action.
 */
function findAction(text: string): string | undefined {
  const candidates = [
    text.match(/\bon click\s*[,:]?\s*(.+)$/i)?.[1],
    text.match(/\b(?:that|which)\s+([a-z][a-z ]{2,44})$/i)?.[1],
    text.match(/\bto\s+([a-z][a-z ]{2,44})$/i)?.[1],
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && ACTION_VERB.test(value)) return cleanAction(value);
  }

  return undefined;
}

function findLocation(text: string): string | undefined {
  const match = text.match(/\b(top|bottom|left|right|centre|center|middle)\b/i);
  return match ? match[1].toLowerCase() : undefined;
}

function findBrand(text: string): string | undefined {
  const named = text.match(
    /\b(?:brand|company|startup|restaurant|store|shop)\s+(?:name\s+|title\s+)?(?:is\s+|called\s+|named\s+)?["“']([^"“”']{2,32})["“”']/i
  );
  if (named) return cleanLabel(named[1]);
  return undefined;
}

const DEFAULTS: Array<[RegExp, string]> = [
  [/\bemail\b/i, 'Email'],
  [/\bpassword\b/i, 'Password'],
  [/\busername\b/i, 'Username'],
  [/\bphone|mobile\b/i, 'Phone number'],
  [/\botp\b|verification code/i, 'Verification code'],
  [/\bsearch\b/i, 'Search'],
  [/\bsize\b/i, 'Size'],
  [/\bcolou?r\b/i, 'Colour'],
  [/\bquantity\b/i, 'Quantity'],
  [/\bdropdown|select\b/i, 'Choose an option'],
  [/\blogo\b/i, 'Logo'],
  [/\bavatar|profile (?:photo|picture)\b/i, 'Avatar'],
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

  if (kind === 'image') {
    const of = text.match(
      /\b(?:image|photo|picture|illustration|graphic|banner|logo|avatar|thumbnail|screenshot|map|gallery)\s+(?:of|for|showing)\s+(.+)$/i
    );
    if (of) return titleCase(cleanLabel(of[1]));
  }

  if (kind === 'input' || kind === 'checkbox') {
    const forWhat = text.match(/\b(?:field|input|search|dropdown|box|checkbox)\s+(?:for|of)\s+(.+)$/i);
    if (forWhat) return titleCase(cleanLabel(forWhat[1]));
    for (const [pattern, label] of DEFAULTS) {
      if (pattern.test(text)) return label;
    }
  }

  if (kind === 'table' || kind === 'chart') {
    const of = text.match(/\b(?:table|chart|graph|list)\s+(?:of|for|showing)\s+(.+)$/i);
    if (of) return titleCase(cleanLabel(of[1]));
    if (section) return `${titleCase(section)} ${kind === 'table' ? 'table' : 'chart'}`;
    return kind === 'table' ? 'Table' : 'Metric chart';
  }

  if (kind === 'card') {
    const named: Record<string, string> = {
      feature: 'Features',
      product: 'Products',
      pricing: 'Plans',
      stat: 'Metrics',
      testimonial: 'Testimonials',
      menu: 'Menu',
      blog: 'Articles',
      team: 'Team',
    };
    const type = text.match(/\b(feature|product|pricing|stat|testimonial|menu|blog|team)\s+cards?\b/i);
    if (type) return named[type[1].toLowerCase()];
    if (section) {
      const of = text.match(/\b(?:cards?|tiles?|panels?)\s+(?:for|of|showing)\s+(.+)$/i);
      if (of) return titleCase(cleanLabel(of[1]));
    }
  }

  if (kind === 'navbar') return brand || 'Brand';
  if (kind === 'footer') return 'Footer';
  if (kind === 'image') {
    for (const [pattern, label] of DEFAULTS) {
      if (pattern.test(text)) return label;
    }
  }

  return '';
}

function pickPreset(kind: ElementKind, lower: string, dark: boolean, archetype: Archetype): string | undefined {
  switch (kind) {
    case 'navbar':
      return dark ? 'nav-dark' : 'nav-light';
    case 'input':
      if (/search|find|filter/.test(lower)) return 'input-search';
      if (/password|otp|code|pin/.test(lower)) return 'input-float';
      return 'input-labelled';
    case 'image':
      if (/hero|banner|background|full[- ]bleed/.test(lower)) return 'image-bleed';
      if (/screenshot|app preview|framed|mockup/.test(lower)) return 'image-framed';
      return 'image-rounded';
    case 'card':
      if (/stat|metric|kpi|revenue|sales|growth|number/.test(lower)) return 'card-stat';
      if (/feature|pricing|plan|testimonial/.test(lower)) return 'card-elevated';
      return 'card-media';
    case 'chart':
      return /line|trend|growth|over time/.test(lower) ? 'chart-line' : 'chart-bars';
    case 'button':
      return dark ? 'btn-dark' : 'btn-solid';
    case 'heading':
      return archetype === 'dashboard' ? 'text-h2' : 'text-display';
    default:
      return undefined;
  }
}

/* ------------------------------------------------------------------ */
/* Reading the prompt                                                  */
/* ------------------------------------------------------------------ */

interface Unit {
  text: string;
  section: string;
}

interface ParsedPrompt {
  units: Unit[];
  sections: string[];
  structured: boolean;
}

/** Split prose into clauses without breaking quoted copy. */
function splitProse(line: string): string[] {
  const quoted: string[] = [];
  const masked = line.replace(/(["“”'])([^"“”']{1,60})\1/g, (match) => {
    quoted.push(match);
    return `\u0000${quoted.length - 1}\u0000`;
  });
  return masked
    .split(/,|;|\.|\n|\s+and\s+(?=[a-z])/i)
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
    let line = raw.trim();
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
    if (colonSection && !findKind(line)) {
      noteSection(colonSection[1]);
      continue;
    }

    if (structured) {
      units.push({ text: line, section });
    } else {
      splitProse(line).forEach((text) => units.push({ text, section }));
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
      // The title of a prompt usually names the screen type, so weight it.
      if (pattern.test(head)) score += 1;
    });
    if (score > best.score) {
      best = { archetype: rule.archetype, score };
    }
  }

  return best.score >= 1 ? best.archetype : 'generic';
}

function detectDark(text: string): boolean {
  return /\b(?:dark|black)\s+(?:mode|theme|background|ui)\b/i.test(text) || /background\s+(?:is\s+|in\s+)?(?:black|dark)/i.test(text);
}

/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

function extractElement(
  unit: Unit,
  brand: string | undefined,
  archetype: Archetype,
  dark: boolean
): CompiledElement | undefined {
  const hit = findKind(unit.text);
  if (!hit) return undefined;

  const lower = unit.text.toLowerCase();
  const kind = hit.kind;
  const interactive = kind === 'button' || kind === 'modal' || kind === 'checkbox' || kind === 'input';

  return {
    id: '',
    kind,
    label: inferLabel(unit.text, kind, unit.section, brand),
    colour: findColour(unit.text),
    action: interactive ? findAction(unit.text) : undefined,
    location: findLocation(unit.text),
    preset: pickPreset(kind, lower, dark, archetype),
    count: findCount(unit.text),
    section: unit.section || undefined,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  };
}

function countKinds(elements: CompiledElement[]): Partial<Record<ElementKind, number>> {
  const counts: Partial<Record<ElementKind, number>> = {};
  elements.forEach((element) => {
    counts[element.kind] = (counts[element.kind] || 0) + 1;
  });
  return counts;
}

/** Collapse repeat mentions of the same component. */
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
          // Different declared actions are different buttons, not repeats.
          (!entry.action || !element.action || entry.action === element.action)
      );
    }

    if (target) {
      // `count` is an explicit quantity from the prompt ("6 dishes"), never a
      // count of repeat mentions — merging must not turn one box into many.
      if (!target.action && element.action) target.action = element.action;
      if (!target.colour && element.colour) target.colour = element.colour;
      if (!target.label && element.label) target.label = element.label;
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
  auth: ['navbar', 'image', 'heading', 'text', 'input', 'checkbox', 'button', 'modal', 'footer'],
  commerce: ['navbar', 'image', 'heading', 'text', 'card', 'input', 'button', 'footer'],
  dashboard: ['navbar', 'card', 'chart', 'table', 'heading', 'text', 'input', 'button', 'footer'],
  landing: ['navbar', 'image', 'heading', 'text', 'button', 'card', 'input', 'footer'],
  generic: ['navbar', 'image', 'heading', 'text', 'card', 'input', 'button', 'table', 'chart', 'modal', 'checkbox', 'footer'],
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
    default: return 8;
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
    case 'heading':
      return `What headline should the ${element.section || 'screen'} carry?`;
    case 'input':
      return `What should the input${where} ask for?`;
    case 'card':
      return `What does the card${where} show?`;
    case 'image':
      return `What should the image${where} show?`;
    case 'checkbox':
      return `What is the checkbox${where} for?`;
    default:
      return `What should the ${element.kind}${where} say?`;
  }
}

/** All attributes the prompt left unresolved. Risk uses this same list. */
export function auditElements(elements: CompiledElement[]): Question[] {
  const questions: Question[] = [];
  elements.forEach((element) => {
    (REQUIRED_ATTRS[element.kind] || []).forEach((attribute) => {
      const value = element[attribute as keyof CompiledElement];
      if (!value) {
        questions.push({
          id: `${element.id}:${attribute}`,
          elementId: element.id,
          attribute,
          text: questionText(element, attribute),
          priority: priorityFor(element.kind, attribute),
        });
      }
    });
  });
  return questions.sort((a, b) => a.priority - b.priority);
}

/* ------------------------------------------------------------------ */
/* Compile                                                             */
/* ------------------------------------------------------------------ */

export function compilePrompt(prompt: string): CompileResult {
  if (!prompt.trim()) {
    return {
      elements: [],
      questions: [],
      archetype: 'generic',
      meta: {
        structured: false,
        sections: [],
        specLines: 0,
        usedLines: 0,
        skippedLines: 0,
        merges: [],
        dark: false,
        notes: [],
      },
    };
  }

  const archetype = detectArchetype(prompt);
  const dark = detectDark(prompt);
  const brand = findBrand(prompt);
  const parsed = parsePrompt(prompt);

  const raw: CompiledElement[] = [];
  let usedLines = 0;

  parsed.units.forEach((unit) => {
    const element = extractElement(unit, brand, archetype, dark);
    if (!element) return;
    usedLines += 1;
    raw.push(element);
  });

  // A "## Navigation" / "## Footer" section implies that structure even when
  // its bullets only talk about links.
  if (
    parsed.sections.some((section) => /^(nav|navbar|navigation|header)$/i.test(section)) &&
    !raw.some((element) => element.kind === 'navbar')
  ) {
    raw.push({
      id: '', kind: 'navbar', label: brand || 'Brand', preset: dark ? 'nav-dark' : 'nav-light',
      section: parsed.sections.find((section) => /^(nav|navbar|navigation|header)$/i.test(section)),
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
      x: 0, y: 0, w: 0, h: 0,
    });
  }

  if (!raw.length) {
    raw.push({
      id: 'auto_heading', kind: 'heading', label: '', preset: 'text-display',
      x: 0, y: 0, w: 0, h: 0,
    });
    raw.push({
      id: 'auto_text', kind: 'text', label: '', preset: 'text-body',
      x: 0, y: 0, w: 0, h: 0,
    });
    raw.push({
      id: 'auto_button', kind: 'button', label: '', preset: 'btn-solid',
      x: 0, y: 0, w: 0, h: 0,
    });
  }

  const before = countKinds(raw);
  const deduped = dedupe(raw);
  const capped = applyCaps(deduped);

  // "6 dishes" is one spec line but should read as a grid, not one wide card.
  const expanded: CompiledElement[] = [];
  const repeatNotes: string[] = [];
  capped.forEach((element) => {
    const count = element.count || 1;
    if ((element.kind === 'card' || element.kind === 'image') && count > 1) {
      const shown = Math.min(count, 3);
      repeatNotes.push(`Requested ${count} ${element.kind}s → ${shown} drawn (a grid, not one wide box).`);
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
  const notes: string[] = [];

  if (parsed.structured) {
    notes.push(
      `Structured prompt: read section by section (${parsed.sections.length} section${parsed.sections.length === 1 ? '' : 's'}${parsed.sections.length ? `: ${parsed.sections.slice(0, 4).join(', ')}${parsed.sections.length > 4 ? '…' : ''}` : ''}).`
    );
  } else {
    notes.push('Prose prompt: clauses split on commas, full stops and “and”.');
  }

  notes.push(
    `${parsed.units.length} spec line${parsed.units.length === 1 ? '' : 's'} read → ${ordered.length} element${ordered.length === 1 ? '' : 's'} kept.`
  );

  if (skippedLines > 0) {
    notes.push(`${skippedLines} line${skippedLines === 1 ? '' : 's'} contained no UI component and were ignored.`);
  }

  merges.forEach((merge) => {
    const reason =
      merge.to >= CAPS[merge.kind] ? `capped at ${CAPS[merge.kind]}` : 'de-duplicated';
    notes.push(`“${merge.kind}” was mentioned ${merge.from}× → ${merge.to} kept (${reason}).`);
  });

  repeatNotes.forEach((note) => notes.push(note));

  if (dark) notes.push('Dark theme detected — navigation and buttons use dark variants.');

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
      notes,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

const W = 1200;
const H = 800;
const PAD = 64;
const GAP = 16;

interface Row {
  items: CompiledElement[];
  h: number;
}

function buildRows(body: CompiledElement[]): Row[] {
  const rows: Row[] = [];
  let index = 0;

  while (index < body.length) {
    const element = body[index];

    if (element.kind === 'image' || element.kind === 'card') {
      const kind = element.kind;
      const items: CompiledElement[] = [];
      while (index < body.length && body[index].kind === kind && items.length < 3) {
        items.push(body[index]);
        index += 1;
      }
      rows.push({ items, h: items.length > 1 ? (kind === 'image' ? 176 : 172) : kind === 'image' ? 240 : 180 });
      continue;
    }

    if (element.kind === 'button' || element.kind === 'checkbox') {
      const items: CompiledElement[] = [];
      while (
        index < body.length &&
        (body[index].kind === 'button' || body[index].kind === 'checkbox') &&
        items.length < 3
      ) {
        items.push(body[index]);
        index += 1;
      }
      rows.push({ items, h: 48 });
      continue;
    }

    const heights: Partial<Record<ElementKind, number>> = {
      heading: 72,
      text: 48,
      table: 208,
      chart: 200,
      modal: 260,
    };
    const height =
      element.kind === 'input'
        ? element.preset === 'input-search'
          ? 48
          : 64
        : heights[element.kind] || 44;

    rows.push({ items: [element], h: height });
    index += 1;
  }

  return rows;
}

function layoutAuth(
  body: CompiledElement[],
  top: number,
  bottom: number,
  out: CompiledElement[]
): void {
  const colW = Math.min(420, W - PAD * 2);
  const x = (W - colW) / 2;
  const heights = body.map((element) => {
    if (element.kind === 'image') return 64;
    if (element.kind === 'input') return 64;
    if (element.kind === 'button') return 48;
    if (element.kind === 'heading') return 56;
    return 40;
  });
  const total =
    heights.reduce((sum, height) => sum + height, 0) + Math.max(0, body.length - 1) * GAP;

  let y = Math.max(top + 16, top + (bottom - top - total) / 2);

  body.forEach((element, index) => {
    const height = heights[index];
    if (element.kind === 'image') {
      out.push({ ...element, x: x + colW / 2 - 32, y, w: 64, h: 64 });
    } else if (element.kind === 'input' || element.kind === 'button') {
      out.push({ ...element, x, y, w: colW, h: height });
    } else {
      out.push({ ...element, x: x + 24, y, w: colW - 48, h: height });
    }
    y += height + GAP;
  });
}

function layoutFlow(
  body: CompiledElement[],
  top: number,
  bottom: number,
  out: CompiledElement[]
): void {
  const available = Math.max(120, bottom - top);
  const rows = buildRows(body);
  const total = rows.reduce((sum, row) => sum + row.h, 0) + Math.max(0, rows.length - 1) * GAP;
  // Shrink proportionally until the whole stack sits above the footer. The old
  // hard floor of 0.5 let tall pages run into the footer.
  const factor = total > available ? Math.max(0.25, available / total) : 1;
  const gap = GAP * factor;
  const inner = W - PAD * 2;

  let y = top;
  rows.forEach((row) => {
    const height = Math.max(28, row.h * factor);
    const cols = row.items.length;
    const colW = (inner - GAP * (cols - 1)) / cols;

    row.items.forEach((element, index) => {
      let width = colW;
      if (cols === 1) {
        if (element.kind === 'button') width = Math.min(220, colW);
        else if (element.kind === 'input') width = Math.min(420, colW);
        else if (element.kind === 'heading') width = Math.min(860, colW);
        else if (element.kind === 'text') width = Math.min(720, colW);
        else if (element.kind === 'modal') width = Math.min(480, colW);
        else if (element.kind === 'checkbox') width = Math.min(300, colW);
      }
      const x = element.kind === 'modal' ? (W - width) / 2 : PAD + index * (colW + GAP);
      out.push({ ...element, x, y, w: width, h: height });
    });

    y += height + gap;
  });
}

export function layoutElements(elements: CompiledElement[], archetype: Archetype): CompiledElement[] {
  const nav = elements.filter((element) => element.kind === 'navbar');
  const footer = elements.filter((element) => element.kind === 'footer');
  const body = elements.filter((element) => element.kind !== 'navbar' && element.kind !== 'footer');
  const out: CompiledElement[] = [];

  nav.forEach((element) => out.push({ ...element, x: PAD, y: 32, w: W - PAD * 2, h: 64 }));

  const top = nav.length ? 32 + 64 + 24 : 40;
  const footerTop = H - 96;
  const bottom = footer.length ? footerTop - 24 : H - 40;

  if (archetype === 'auth') layoutAuth(body, top, bottom, out);
  else layoutFlow(body, top, bottom, out);

  footer.forEach((element) => out.push({ ...element, x: PAD, y: footerTop, w: W - PAD * 2, h: 80 }));

  return out;
}

/* ------------------------------------------------------------------ */
/* Risk                                                                */
/* ------------------------------------------------------------------ */

/**
 * Share of required attributes the prompt still leaves open, as a 0–95 score.
 * Nothing missing is not "zero risk", only "low risk", hence the floor.
 */
export function roughRisk(elements: CompiledElement[]): number {
  if (!elements.length) return 60;

  const required = elements.reduce(
    (sum, element) => sum + (REQUIRED_ATTRS[element.kind]?.length || 0),
    0
  );
  if (required === 0) return 6;

  const missing = elements.reduce(
    (sum, element) =>
      sum +
      (REQUIRED_ATTRS[element.kind] || []).filter(
        (attribute) => !element[attribute as keyof CompiledElement]
      ).length,
    0
  );

  return Math.min(95, Math.max(6, Math.round((missing / required) * 94) + 6));
}
