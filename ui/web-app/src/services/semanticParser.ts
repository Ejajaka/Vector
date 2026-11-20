/**
 * High-quality model parser.
 *
 * A strong hosted model reads the prompt and proposes the *schema*
 * (screens, components, attributes, ambiguity). The deterministic compiler
 * remains the renderer and the guardrail:
 *
 *   prompt → model schema → validation → deterministic layout + risk
 *
 * The model never draws pixels. It cannot invent unsupported kinds, malformed
 * colours or arbitrary CSS. If it fails validation, the deterministic result
 * stays in place.
 *
 * Works with any OpenAI-compatible endpoint: OpenAI, Groq, OpenRouter, a
 * self-hosted proxy, Ollama or vLLM. For commercial deployments point the base
 * URL at your own proxy so API keys never reach the browser.
 */

import { chatJson, isLLMConfigured } from './llmEngine.ts';
import { loadSettings } from './settings.ts';
import {
  auditElements,
  finaliseElements,
  layoutElements,
  roughRisk,
  type Clarification,
  type CompiledElement,
  type ElementKind,
  type LearnedLexicon,
  type PromptScreen,
  type Signal,
} from './promptCompiler.ts';

export interface ModelParseResult {
  screens: PromptScreen[];
  model: string;
  provider: string;
  ms: number;
  warnings: string[];
  deterministicRisk: number;
  modelRisk: number;
}

const SYSTEM = `You are the schema parser for a UI wireframe compiler. Return ONLY valid JSON.

Allowed component kinds:
background, shape, navbar, heading, text, button, input, link, card, image, avatar, badge, tabs, progress, table, chart, modal, checkbox, footer.

Rules:
- Split into screens only at explicit markers ("---", "Screen 2: ...", "Page 2: ...") or when the user clearly describes a different screen. Ordinary headings like "Hero", "Menu" or "Footer" are sections of one screen.
- Extract every component the user mentions or clearly implies. Include drawings.
- Copy labels and actions exactly from the prompt. If a label or action is not stated, use "".
- Only use colours stated or clearly named; never invent a palette.
- Honour direction and side: vertical/horizontal, left/right/centre, top/bottom.
- Honour quantities: "6 dishes" → count 6.
- A split or gradient page fill: kind "background", preset "split-diagonal" | "split-horizontal" | "gradient", with colour and colour2.
- A drawn line, circle, rectangle, triangle or arrow: kind "shape", preset "shape-line" | "shape-diagonal" | "shape-circle" | "shape-rect" | "shape-triangle" | "shape-arrow" | "shape-divider".
- Do not invent components, sections, labels or copy.
- If a word cannot be mapped to a kind, add it to "unmapped" with 2-4 concrete options. Do not ask about ordinary words, page titles or section headings.

JSON shape:
{"screens":[{"name":"Login","archetype":"auth","elements":[{"kind":"heading","label":"Welcome back","section":"","colour":"","colour2":"","action":"","orientation":"","align":"","anchor":"","count":1,"preset":""}]}],"unmapped":[{"phrase":"carousel","question":"How should the carousel be drawn?","options":[{"label":"Image gallery","kind":"image"},{"label":"Row of cards","kind":"card"},{"label":"Ignore"}]}]}

archetype is one of auth, landing, dashboard, commerce, generic.
orientation is vertical | horizontal or "".
align is left | right | center or "".
anchor is top | bottom or "".
`;

const KINDS: ElementKind[] = [
  'background', 'shape', 'navbar', 'heading', 'text', 'button', 'input', 'link',
  'card', 'image', 'avatar', 'badge', 'tabs', 'progress', 'table', 'chart',
  'modal', 'checkbox', 'footer',
];
const KIND_SET = new Set<string>(KINDS);

const KIND_ALIASES: Record<string, ElementKind> = {
  dropdown: 'input', select: 'input', textbox: 'input', searchbox: 'input',
  sidebar: 'navbar', nav: 'navbar', header: 'navbar', navigation: 'navbar',
  list: 'table', datagrid: 'table', records: 'table',
  divider: 'shape', line: 'shape', circle: 'shape', rectangle: 'shape',
  backdrop: 'background', hero: 'image', media: 'image', video: 'image',
  pill: 'badge', tag: 'badge', chip: 'badge',
  panel: 'card', tile: 'card',
  dialog: 'modal', popup: 'modal', drawer: 'modal', sheet: 'modal',
  toggle: 'checkbox', switch: 'checkbox',
};

const ARCHETYPES = new Set(['auth', 'landing', 'dashboard', 'commerce', 'generic']);

const NAMED_COLOURS: Record<string, string> = {
  red: '#E5484D', crimson: '#D62828', rose: '#F43F5E',
  blue: '#4D7CFE', navy: '#1E3A8A', sky: '#38BDF8', indigo: '#4F46E5',
  green: '#28C76F', emerald: '#10B981', mint: '#34D399', teal: '#22D3EE',
  violet: '#7C5CFF', purple: '#7C5CFF', lavender: '#A78BFA',
  orange: '#FF7A59', coral: '#FF6B6B', yellow: '#FFC53D', amber: '#F59E0B',
  black: '#0B0E14', white: '#FFFFFF', grey: '#8A8F98', gray: '#8A8F98',
};

function text(value: unknown, max = 80): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function colour(value: unknown): string | undefined {
  const raw = text(value, 20);
  if (!raw) return undefined;
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toUpperCase();
  return NAMED_COLOURS[raw.toLowerCase()];
}

function kindOf(value: unknown): ElementKind | undefined {
  const raw = text(value, 24).toLowerCase();
  if (!raw) return undefined;
  if (KIND_SET.has(raw)) return raw as ElementKind;
  return KIND_ALIASES[raw];
}

function presetFor(kind: ElementKind, value: unknown): string | undefined {
  const raw = text(value, 32).toLowerCase();
  if (kind === 'background') {
    return ['split-diagonal', 'split-horizontal', 'gradient'].includes(raw)
      ? raw
      : 'split-horizontal';
  }
  if (kind === 'shape') {
    return /^shape-(line|diagonal|circle|rect|triangle|arrow|divider)$/.test(raw)
      ? raw
      : 'shape-rect';
  }
  return raw || undefined;
}

function normaliseElement(
  raw: unknown,
  screenId: string,
  index: number,
  prompt: string
): CompiledElement | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const kind = kindOf(value.kind);
  if (!kind) return null;

  const label = text(value.label, 64);
  const action = text(value.action, 64);
  const countValue = Number(value.count);
  const count =
    Number.isFinite(countValue) && countValue > 1
      ? Math.min(Math.round(countValue), 12)
      : undefined;

  return {
    id: `${screenId}_model_${index + 1}`,
    kind,
    label,
    colour: colour(value.colour),
    colour2: colour(value.colour2),
    colourInferred: false,
    action: action || undefined,
    location: text(value.location, 16) || undefined,
    orientation:
      value.orientation === 'vertical' || value.orientation === 'horizontal'
        ? value.orientation
        : undefined,
    align:
      value.align === 'left' || value.align === 'right' || value.align === 'center'
        ? value.align
        : undefined,
    anchor: value.anchor === 'top' || value.anchor === 'bottom' ? value.anchor : undefined,
    preset: presetFor(kind, value.preset),
    count,
    confidence: 0.85,
    section: text(value.section, 40) || undefined,
    sourceLine: prompt,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  };
}

function normaliseUnmapped(raw: unknown, prompt: string): Clarification[] {
  if (!Array.isArray(raw)) return [];
  const out: Clarification[] = [];
  const seen = new Set<string>();
  const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  raw.slice(0, 3).forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;
    const value = entry as Record<string, unknown>;
    const phrase = text(value.phrase, 40).toLowerCase();
    if (!phrase || seen.has(phrase)) return;
    // A clarification must be about a word the user actually wrote.
    if (!new RegExp(`\\b${escaped(phrase)}s?\\b`, 'i').test(prompt)) return;
    seen.add(phrase);

    const options: Clarification['options'] = [];
    if (Array.isArray(value.options)) {
      value.options.slice(0, 5).forEach((option) => {
        if (!option || typeof option !== 'object') return;
        const optionValue = option as Record<string, unknown>;
        const label = text(optionValue.label, 40);
        if (!label) return;
        options.push({ label, kind: kindOf(optionValue.kind) });
      });
    }
    if (!options.some((option) => !option.kind)) options.push({ label: 'Ignore' });
    if (options.length < 2) return;

    out.push({
      id: `clarify_model_${index}`,
      phrase,
      text: text(value.question, 120) || `What should “${phrase}” be on this screen?`,
      options,
    });
  });

  return out;
}

function baseRisk(screens: PromptScreen[]): number {
  return screens.reduce(
    (max, screen) =>
      Math.max(
        max,
        roughRisk(layoutElements(screen.elements, screen.archetype, 'desktop', screen.meta.tokens))
      ),
    0
  );
}

export function normaliseModelScreens(
  raw: unknown,
  prompt: string,
  baseScreens: PromptScreen[],
  modelLabel = 'model',
  ms = 0
): { screens: PromptScreen[]; warnings: string[]; deterministicRisk: number; modelRisk: number } {
  const root = (raw || {}) as Record<string, unknown>;
  const rawScreens = Array.isArray(root.screens) ? root.screens : [];
  if (!rawScreens.length) {
    throw new Error('The model returned no screens. The deterministic result is unchanged.');
  }

  const warnings: string[] = [];
  const unmapped = normaliseUnmapped(root.unmapped, prompt);
  const lowerPrompt = prompt.toLowerCase();
  let inventedTotal = 0;

  if (rawScreens.length < baseScreens.length) {
    warnings.push(
      `The model returned ${rawScreens.length} screen${rawScreens.length === 1 ? '' : 's'}; the deterministic parse found ${baseScreens.length}.`
    );
  }

  const screens: PromptScreen[] = rawScreens.slice(0, 8).map((entry, index) => {
    const value = (entry || {}) as Record<string, unknown>;
    const base = baseScreens[index] ?? baseScreens[baseScreens.length - 1];
    const id = `screen_${index + 1}`;
    const rawElements = Array.isArray(value.elements) ? value.elements.slice(0, 32) : [];
    const normalised = rawElements
      .map((element, elementIndex) => normaliseElement(element, id, elementIndex, prompt))
      .filter((element): element is CompiledElement => Boolean(element));

    const archetypeRaw = text(value.archetype, 20).toLowerCase();
    const archetype = ARCHETYPES.has(archetypeRaw)
      ? (archetypeRaw as PromptScreen['archetype'])
      : base.archetype;

    let elements = normalised.length
      ? finaliseElements(normalised, archetype, `${id}_el`)
      : base.elements;
    if (!normalised.length) {
      warnings.push(
        `Screen ${index + 1}: the model returned no valid components, so the deterministic layout was used.`
      );
    } else {
      inventedTotal += normalised.filter(
        (element) =>
          (element.label && !lowerPrompt.includes(element.label.toLowerCase())) ||
          (element.action && !lowerPrompt.includes(element.action.toLowerCase()))
      ).length;
    }

    const signals: Signal[] = [
      {
        tone: 'infer',
        text: `Model parse · ${modelLabel} · ${elements.length} components · ${ms}ms.`,
      },
      {
        tone: 'info',
        text: 'Schema validated by the deterministic compiler. Layout and risk are computed locally.',
      },
      ...base.meta.signals
        .filter((signal) => !/elements kept|Mean extraction confidence/.test(signal.text))
        .slice(0, 3),
    ];

    return {
      ...base,
      id,
      name: text(value.name, 32) || base.name || `Screen ${index + 1}`,
      archetype,
      elements,
      questions: auditElements(elements),
      clarifications:
        index === 0
          ? [...base.clarifications, ...unmapped].filter(
              (item, position, list) =>
                list.findIndex((other) => other.phrase === item.phrase) === position
            )
          : base.clarifications,
      meta: {
        ...base.meta,
        usedLines: elements.length ? Math.max(1, base.meta.usedLines) : 0,
        signals,
      },
    };
  });

  if (inventedTotal > 0) {
    warnings.push(
      `${inventedTotal} component${inventedTotal === 1 ? '' : 's'} contain${
        inventedTotal === 1 ? 's' : ''
      } copy the prompt did not state. Review the model's labels and actions before generating.`
    );
  }

  const deterministicRisk = baseRisk(baseScreens);
  const modelRisk = baseRisk(screens);
  if (modelRisk > deterministicRisk) {
    warnings.push(
      `Model risk ${modelRisk} is higher than the deterministic ${deterministicRisk}. Switch back to deterministic if the model's version looks wrong.`
    );
  }

  return { screens, warnings, deterministicRisk, modelRisk };
}

export async function parsePromptWithModel(
  prompt: string,
  lexicon: LearnedLexicon,
  baseScreens: PromptScreen[]
): Promise<ModelParseResult> {
  const settings = loadSettings();
  if (!isLLMConfigured(settings)) {
    throw new Error('No model configured. Add an OpenAI-compatible key or proxy in the assistant.');
  }
  if (!prompt.trim()) {
    throw new Error('There is no prompt to parse.');
  }

  const started = performance.now();
  const known = Object.entries(lexicon)
    .filter(([, kind]) => kind !== 'ignore')
    .slice(0, 80)
    .map(([phrase, kind]) => `- ${phrase} → ${kind}`)
    .join('\n');

  const user = [
    'PROMPT:',
    prompt.slice(0, 12000),
    '',
    'KNOWN WORKSPACE WORDS (use these kinds):',
    known || '(none)',
  ].join('\n');

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 45000);

  let raw: unknown;
  try {
    raw = await chatJson(SYSTEM, user, settings, {
      maxTokens: 4000,
      jsonMode: true,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The model timed out. Try a shorter prompt or a faster model.');
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }

  const ms = Math.round(performance.now() - started);
  const normalised = normaliseModelScreens(raw, prompt, baseScreens, settings.model, ms);

  return {
    ...normalised,
    model: settings.model,
    provider: settings.baseUrl,
    ms,
  };
}
