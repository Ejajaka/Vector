import type {
  ExtractedDocument,
  RequirementDraft,
  RequirementKind,
  RequirementMetadata,
} from '../../types/requirements.ts';

const MODAL_RE = /\b(shall|must|should|will|would|needs?\s+to|required|must\s+be|can|may|is\s+able\s+to|are\s+able\s+to)\b/i;
const ACTION_RE = /\b(add|allow|apply|authenticate|build|close|create|delete|disable|display|download|edit|enable|encrypt|ensure|fetch|filter|grant|handle|include|keep|launch|log|make|navigate|notify|open|prevent|provide|redirect|render|require|restrict|save|search|send|show|sort|store|submit|support|update|upload|validate)\b/i;
const UI_NOUN_RE = /\b(button|navbar|navigation|input|field|form|card|modal|dialog|image|dropdown|sidebar|footer|checkbox|table|dashboard|page|screen|menu|toast|banner|tab)\b/i;
const NON_FUNCTIONAL_RE = /\b(security|secure|performance|latency|accessibility|a11y|wcag|responsive|availability|reliability|scalability|compliance|privacy|audit|encrypt\w*|retention|browser|mobile|tablet|internationalization|localization|seo|rate\s+limit|backup|disaster|uptime|gdpr|soc\s*2|pii|downtime|throughput)\b/i;

const SCREENS_RE = /\b([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){0,3})\s+(?:page|screen)\b/g;
const SCREEN_STOPWORDS = /^(the|this|that|these|those|a|an|each|every|any|our|your|their|its|one|same|new|current)$/i;
const ROLES_RE = /\b(admin|administrator|super\s+admin|employee|manager|customer|user|guest|owner|reviewer|operator|auditor|editor|viewer)s?\b/gi;
const COMPONENTS = [
  'button', 'navbar', 'navigation', 'input', 'form', 'card', 'modal', 'dialog',
  'image', 'dropdown', 'sidebar', 'footer', 'checkbox', 'table', 'dashboard',
  'menu', 'toast', 'banner', 'tab',
];
const BEHAVIOURS = [
  'add', 'allow', 'apply', 'authenticate', 'build', 'close', 'create', 'delete',
  'disable', 'display', 'download', 'edit', 'enable', 'encrypt', 'ensure',
  'fetch', 'filter', 'grant', 'handle', 'include', 'keep', 'launch', 'log',
  'navigate', 'notify', 'open', 'prevent', 'provide', 'redirect', 'render',
  'restrict', 'save', 'search', 'send', 'show', 'sort', 'store', 'submit',
  'support', 'update', 'upload', 'validate',
];

export interface CompileOptions {
  codePrefix?: string;
  maxRequirements?: number;
}

function unique(values: string[], limit = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
    if (out.length >= limit) break;
  }
  return out;
}

function metadataFor(text: string, fileName: string): RequirementMetadata {
  const screens = [...text.matchAll(SCREENS_RE)]
    .map((match) => match[1])
    .filter((name) => !SCREEN_STOPWORDS.test(name));
  const roles = [...text.matchAll(ROLES_RE)].map((match) => match[0]);
  const components = COMPONENTS.filter((component) => new RegExp(`\\b${component}s?\\b`, 'i').test(text));
  const behaviours = BEHAVIOURS.filter((verb) => new RegExp(`\\b${verb}\\b`, 'i').test(text));
  return {
    screens: unique(screens),
    components: unique(components),
    roles: unique(roles),
    behaviours: unique(behaviours),
    fileName,
  };
}

function kindFor(text: string): RequirementKind {
  return NON_FUNCTIONAL_RE.test(text) ? 'non_functional' : 'functional';
}

function shouldKeep(text: string, isBullet: boolean): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 12) return false;
  if (/^[A-Z][A-Za-z0-9 /&-]{1,60}:$/.test(trimmed)) return false;
  if (MODAL_RE.test(trimmed)) return true;
  if (UI_NOUN_RE.test(trimmed) && ACTION_RE.test(trimmed)) return true;
  if (isBullet && ACTION_RE.test(trimmed)) return true;
  return false;
}

interface Segment {
  text: string;
  start: number;
  end: number;
  paragraph: number;
}

/**
 * Sentence boundaries that survive real specifications: decimals ("2.5s"),
 * version numbers ("WCAG 2.1"), Latin abbreviations ("e.g.", "i.e."), single
 * letter initials and ellipses.
 */
const ABBREVIATIONS = new Set([
  'e.g', 'i.e', 'etc', 'vs', 'mr', 'mrs', 'ms', 'dr', 'prof', 'inc', 'ltd', 'co',
  'corp', 'fig', 'no', 'approx', 'dept', 'est', 'min', 'max', 'sec', 'hr', 'hrs',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
  'st', 'mt', 'u.s', 'u.k', 'a.m', 'p.m',
]);

function splitSentences(text: string): Array<{ text: string; index: number }> {
  const out: Array<{ text: string; index: number }> = [];
  let start = 0;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char !== '.' && char !== '!' && char !== '?') continue;

    let end = i;
    while (end + 1 < text.length && /[.!?]/.test(text[end + 1])) end += 1;
    while (end + 1 < text.length && /["'”’)\]]/.test(text[end + 1])) end += 1;

    // "2.5", "1.2.3" and other numeric dots are not sentence ends.
    if (char === '.' && /\d/.test(text[i - 1] || '') && /\d/.test(text[end + 1] || '')) {
      i = end;
      continue;
    }

    if (char === '.') {
      const beforeWord = text.slice(0, i);
      const match = beforeWord.match(/([A-Za-z][A-Za-z.]*)$/);
      const word = (match?.[1] || '').toLowerCase();
      const precededByWordChar =
        Boolean(match) && /[A-Za-z0-9]/.test(beforeWord[beforeWord.length - (match?.[1].length || 0) - 1] || '');
      if (!precededByWordChar && (ABBREVIATIONS.has(word) || /^[A-Z]$/.test(match?.[1] || ''))) {
        i = end;
        continue;
      }
    }

    // A real sentence break is followed by whitespace and a new capital,
    // number, quote or bracket (or the end of the block).
    const rest = text.slice(end + 1);
    if (rest.trim() && !/^[A-Z0-9"“'‘(\[]/.test(rest.trim())) {
      i = end;
      continue;
    }

    const raw = text.slice(start, end + 1);
    const trimmed = raw.trim();
    if (trimmed) {
      out.push({ text: trimmed, index: start + raw.indexOf(trimmed) });
    }
    start = end + 1;
    i = end;
  }

  const tail = text.slice(start);
  const trimmed = tail.trim();
  if (trimmed) out.push({ text: trimmed, index: start + tail.indexOf(trimmed) });
  return out;
}

interface Block {
  text: string;
  start: number;
  end: number;
  paragraph: number;
  bullet: boolean;
}

function segmentsForPage(pageText: string): Segment[] {
  const lines = pageText.split(/\r?\n/);
  const blocks: Block[] = [];
  let offset = 0;
  let paragraph = 0;
  let open: Block | null = null;

  const flush = () => {
    if (open) blocks.push(open);
    open = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      offset += line.length + 1;
      continue;
    }
    paragraph += 1;
    const leading = line.indexOf(trimmed);
    const lineStart = offset + leading;
    const bullet = /^([-*•]|\d+[.)])\s+/.test(trimmed);
    const cleaned = bullet ? trimmed.replace(/^([-*•]|\d+[.)])\s+/, '').trim() : trimmed;
    const cleanedStart = lineStart + (trimmed.length - cleaned.length);
    const cleanedEnd = cleanedStart + cleaned.length;

    // PDF and DOCX exports hard-wrap paragraphs at the page width. A line that
    // does not end a sentence and continues in lower case belongs to the line
    // above it, so requirements are not cut in half at the wrap point.
    const joins =
      open !== null &&
      !bullet &&
      !/[.!?;:]["'”’)\]]?$/.test(open.text.trimEnd()) &&
      (/^[a-z0-9]/.test(cleaned) || /[,;:–—\-]$/.test(open.text.trimEnd()));

    if (joins && open) {
      open.text = `${open.text.trimEnd()} ${cleaned}`;
      open.end = cleanedEnd;
    } else {
      flush();
      open = { text: cleaned, start: cleanedStart, end: cleanedEnd, paragraph, bullet };
    }
    offset += line.length + 1;
  }
  flush();

  const segments: Segment[] = [];
  for (const block of blocks) {
    for (const sentence of splitSentences(block.text)) {
      if (!shouldKeep(sentence.text, block.bullet)) continue;
      segments.push({
        text: sentence.text,
        start: block.start + sentence.index,
        end: block.start + sentence.index + sentence.text.length,
        paragraph: block.paragraph,
      });
    }
  }
  return segments;
}

/**
 * Deterministic requirement compiler.
 *
 * It deliberately preserves the exact requirement wording and character
 * offsets. Semantic LLM enrichment can add labels/suggestions later, but it
 * may not replace or silently rewrite the source text.
 */
export interface CompileStats {
  drafts: RequirementDraft[];
  /** True when the document held more unique statements than the cap allows. */
  truncated: boolean;
  /** The cap that applied to this compile. */
  limit: number;
}

export const REQUIREMENT_LIMIT = 300;

export function compileRequirementsWithStats(
  document: ExtractedDocument,
  options: CompileOptions = {},
): CompileStats {
  const prefix = options.codePrefix || 'REQ';
  const max = options.maxRequirements ?? REQUIREMENT_LIMIT;
  const drafts: RequirementDraft[] = [];
  const seen = new Set<string>();
  let truncated = false;
  let globalOffset = 0;

  document.pages.forEach((page, pageIndex) => {
    const segments = segmentsForPage(page);
    for (const segment of segments) {
      const normalized = segment.text.replace(/\s+/g, ' ').trim();
      if (!normalized) continue;
      const dedupeKey = normalized.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      if (drafts.length >= max) {
        truncated = true;
        break;
      }
      seen.add(dedupeKey);
      drafts.push({
        requirementCode: `${prefix}-${String(drafts.length + 1).padStart(3, '0')}`,
        originalText: segment.text,
        normalizedText: normalized,
        kind: kindFor(segment.text),
        sourcePage: pageIndex + 1,
        sourceParagraph: segment.paragraph,
        sourceCharStart: globalOffset + segment.start,
        sourceCharEnd: globalOffset + segment.end,
        metadata: metadataFor(segment.text, document.fileName),
      });
    }
    globalOffset += page.length + 2;
  });

  return { drafts, truncated, limit: max };
}

export function compileRequirements(
  document: ExtractedDocument,
  options: CompileOptions = {},
): RequirementDraft[] {
  return compileRequirementsWithStats(document, options).drafts;
}
