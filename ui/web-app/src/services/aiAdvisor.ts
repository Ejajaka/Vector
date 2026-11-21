/**
 * "Help from AI" advisor.
 *
 * Two modes:
 *  1. If the user has configured an OpenAI-compatible endpoint in Settings, the
 *     question is sent with the live prompt as context.
 *  2. Otherwise a deterministic local reviewer answers from the prompt itself —
 *     no network, no key, and it never invents content.
 */

import { loadSettings } from './settings.ts';

export interface AdvisorContext {
  title: string;
  prompt: string;
  kind: 'canvas' | 'prompt' | 'general';
  elements?: Array<{ name: string; label: string }>;
  colors?: string[];
  /** Page the user is editing. */
  pageName?: string;
  pageCount?: number;
  frame?: { width: number; height: number };
  background?: string;
  selected?: { name: string; label: string; w: number; h: number };
}

let context: AdvisorContext = { title: 'Workspace', prompt: '', kind: 'general' };

export function setAdvisorContext(next: Partial<AdvisorContext>): void {
  context = { ...context, ...next };
}

export function getAdvisorContext(): AdvisorContext {
  return context;
}

const VAGUE_WORDS = [
  'nice', 'good', 'modern', 'clean', 'simple', 'some', 'maybe', 'better',
  'appropriate', 'suitable', 'fancy', 'attractive', 'user-friendly', 'sleek', 'etc',
];

const ACTION_CUES = ['open', 'submit', 'save', 'send', 'close', 'download', 'navigate', 'go to', 'create', 'delete', 'confirm', 'cancel', 'start', 'sign', 'log', 'pay', 'add'];

export interface PromptReview {
  vague: string[];
  buttonsWithoutAction: number;
  inputsWithoutLabel: number;
  buttons: number;
  inputs: number;
  colours: string[];
  hasResponsive: boolean;
  hasStates: boolean;
  hasAccessibility: boolean;
}

export function reviewPrompt(prompt: string, ctx: AdvisorContext): PromptReview {
  const lower = prompt.toLowerCase();
  const vague = VAGUE_WORDS.filter((word) => new RegExp(`\\b${word}\\b`).test(lower));
  const buttons = (lower.match(/button/g) || []).length;
  const inputs = (lower.match(/\b(input|field|textbox|text box)\b/g) || []).length;
  const actions = ACTION_CUES.filter((cue) => lower.includes(cue)).length;
  const hexes: string[] = prompt.match(/#[0-9a-f]{6}\b/gi) || [];
  const colours = Array.from(new Set([...hexes, ...(ctx.colors || [])]));

  return {
    vague,
    buttons,
    inputs,
    buttonsWithoutAction: Math.max(0, buttons - Math.min(buttons, actions)),
    inputsWithoutLabel: Math.max(0, inputs - ((lower.match(/label/g) || []).length)),
    colours,
    hasResponsive: /responsiv|mobile|breakpoint|stack/i.test(prompt),
    hasStates: /empty|loading|error state|skeleton/i.test(prompt),
    hasAccessibility: /accessib|aria|contrast|screen reader|wcag/i.test(prompt),
  };
}

export function suggestedQuestions(ctx: AdvisorContext): string[] {
  const review = reviewPrompt(ctx.prompt, ctx);
  const chips: string[] = [];
  const width = ctx.frame?.width || 1200;

  if (ctx.selected) chips.push(`What should this ${ctx.selected.name.toLowerCase()} say?`);
  else if (review.buttonsWithoutAction > 0) chips.push('Which buttons are missing a clear action?');
  else chips.push('What is still missing on this page?');

  if (width <= 480) chips.push('How should this adapt to desktop?');
  else if (width >= 1200) chips.push('How should this adapt to mobile?');
  else chips.push('Suggest a better layout for this page');

  if (review.vague.length) chips.push('Rewrite the vague words for me');
  else chips.push('Write better labels for the buttons');

  chips.push('Suggest a colour palette that fits this screen');
  if (ctx.background && ctx.background.toLowerCase() !== '#ffffff') chips.push('Is the contrast on this background readable?');

  return chips.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/* Local reviewer                                                      */
/* ------------------------------------------------------------------ */

function bullets(lines: string[]): string {
  return lines.map((line) => `• ${line}`).join('\n');
}

function localAnswer(question: string, ctx: AdvisorContext): string {
  const q = question.toLowerCase();
  const review = reviewPrompt(ctx.prompt, ctx);
  const elCount = ctx.elements?.length || 0;

  const screenTopic =
    /colou?r|palette|theme|brand|access|contrast|a11y|screen reader|wcag|keyboard|label|copy|word|text|wording|cta|button|layout|structure|order|section|spacing|grid|responsive|mobile|desktop|tablet|device|breakpoint|adapt|missing|gap|incomplete|forgot|what else|what.*add|improve|fix|change|next|screen|page|prompt|canvas|element|design|state/.test(
      q,
    );

  if (!screenTopic) {
    return [
      "I can't reach the live model right now, so I can only review the current screen.",
      '',
      'Ask me about its copy, labels, layout, colours, states, accessibility or what is missing — or reconnect your model in the AI panel to ask general questions.',
    ].join('\n');
  }

  if (/colou?r|palette|theme|brand/.test(q)) {
    const palette = review.colours.length
      ? review.colours
      : ['#7C5CFF', '#4D7CFE', '#22D3EE', '#FF7A59', '#FFC53D'];
    return [
      `You already use ${palette.length} accent${palette.length === 1 ? '' : 's'}: ${palette.join(', ')}.`,
      '',
      'What I would add, in this order:',
      bullets([
        'One primary action colour (violet #7C5CFF) used only for the main CTA.',
        'A neutral ramp for surfaces: #FFFFFF, #F7F7FB, #EFEDF6, #64626F, #0B0E14.',
        'One semantic pair for status: teal #22D3EE for positive, coral #FF7A59 for destructive.',
        'Cap it at three accents — a fourth makes the screen look accidental.',
      ]),
      '',
      'Contrast rule: body text needs 4.5:1 against its surface; large headings 3:1.',
    ].join('\n');
  }

  if (/access|contrast|a11y|screen reader|wcag|keyboard/.test(q)) {
    const missing = [
      !review.hasAccessibility ? 'The prompt never mentions accessibility — add it explicitly.' : '',
      review.inputsWithoutLabel > 0 ? `${review.inputsWithoutLabel} input${review.inputsWithoutLabel === 1 ? '' : 's'} may lack a visible label.` : '',
      review.buttonsWithoutAction > 0 ? 'Buttons without a stated action are unusable with a screen reader.' : '',
      'Ask for focus-visible rings on every interactive element.',
      'Ask for alt text on every image, not "image".',
      'Do not rely on colour alone to signal state.',
    ].filter(Boolean);
    return ['Accessibility gaps in this prompt:', '', bullets(missing), '', 'Paste this line into the prompt: “Meets WCAG AA contrast, full keyboard navigation, visible focus states, and every control has an accessible name.”'].join('\n');
  }

  if (/label|copy|word|text|wording|cta|button/.test(q)) {
    const labelIdeas = [
      'Use verbs, not nouns: “Create project”, not “Project creation”.',
      'Front-load the outcome: “Start free trial” beats “Submit”.',
      'Keep primary labels under four words.',
      'Destructive actions say what is destroyed: “Delete 3 projects”.',
      'Secondary actions never compete: “Cancel”, “Go back”.',
    ];
    return [
      review.buttons
        ? `You reference ${review.buttons} button${review.buttons === 1 ? '' : 's'}. ${review.buttonsWithoutAction > 0 ? `${review.buttonsWithoutAction} have no stated action.` : 'Each one has an action — good.'}`
        : 'No buttons are described yet, so the screen has no obvious next step.',
      '',
      'Copy rules I would apply:',
      bullets(labelIdeas),
      review.vague.length ? `\nWords to replace: ${review.vague.join(', ')}.` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (/layout|structure|order|section|spacing|grid/.test(q)) {
    return [
      'A predictable vertical order for this kind of screen:',
      '',
      bullets([
        'Navigation (what this is, where I can go)',
        'Headline + one sentence of context',
        'Primary action, above the fold',
        'Supporting content — cards, table or chart',
        'Reassurance — pricing, security, support',
        'Footer',
      ]),
      '',
      review.hasResponsive
        ? 'Responsive behaviour is already stated. Specify the breakpoint (768px) and what stacks first.'
        : 'Add: “single column below 768px, navigation collapses to a menu”.',
    ].join('\n');
  }

  if (/responsive|mobile|desktop|tablet|device|breakpoint|adapt/.test(q)) {
    const width = ctx.frame?.width ?? 1200;
    const height = ctx.frame?.height ?? 800;
    const current = width <= 480 ? 'mobile' : width <= 900 ? 'tablet' : 'desktop';
    const other = current === 'mobile' ? 'desktop' : 'mobile';
    return [
      `This page is framed at ${width}×${height} — a ${current} layout.`,
      '',
      `To make the same page work at ${other} size:`,
      bullets([
        current === 'mobile'
          ? 'Widen to 1440 and place navigation on the left instead of the bottom.'
          : 'Collapse the navigation into a menu below 768px and stack cards to one column.',
        'Keep the same content order — do not reorder sections between breakpoints.',
        'Scale type with a 40/28/18/14 ramp; never below 14px for body.',
        'Give images a fixed aspect ratio so they do not jump.',
        'Test the longest button label at the narrowest width.',
      ]),
      '',
      `Ask me to “add a ${other} page” and I can describe the second frame for you.`,
    ].join('\n');
  }

  if (/missing|gap|incomplete|forgot|what else|what.*add/.test(q)) {
    const gaps = [
      review.buttonsWithoutAction > 0 ? `Label the action for ${review.buttonsWithoutAction} button${review.buttonsWithoutAction === 1 ? '' : 's'}.` : '',
      review.inputsWithoutLabel > 0 ? `Add visible labels to ${review.inputsWithoutLabel} input${review.inputsWithoutLabel === 1 ? '' : 's'}.` : '',
      review.vague.length ? `Replace vague wording: ${review.vague.join(', ')}.` : '',
      !review.hasStates ? 'Describe the empty, loading and error states.' : '',
      !review.hasResponsive ? 'State the responsive behaviour and breakpoint.' : '',
      !review.hasAccessibility ? 'Name the accessibility bar (WCAG AA, keyboard, focus).' : '',
      elCount === 0 ? 'Nothing is placed on the canvas yet — start with navigation and one headline.' : '',
    ].filter(Boolean);

    if (!gaps.length) {
      return [
        'Structurally this is solid. The remaining risk is copy quality, not completeness.',
        '',
        bullets([
          'Every interactive element has a label and an action.',
          'Responsive behaviour and states are described.',
          'Accessibility is named explicitly.',
          '',
          'Next: write the actual button labels and one line of body copy that sells the outcome.',
        ]),
      ].join('\n');
    }

    return [`${gaps.length} gap${gaps.length === 1 ? '' : 's'} I would close before generating:`, '', bullets(gaps)].join('\n');
  }

  // Default: a short review + three concrete next steps.
  const pageLabel = ctx.pageName ? `“${ctx.pageName}”` : `“${ctx.title}”`;
  const frame = ctx.frame ? ` (${ctx.frame.width}×${ctx.frame.height})` : '';
  const selection = ctx.selected ? ` You have the ${ctx.selected.name} “${ctx.selected.label}” selected.` : '';
  const summary = ctx.prompt.trim()
    ? `Looking at ${pageLabel}${frame} — ${elCount || 'a few'} element${elCount === 1 ? '' : 's'}, ${ctx.prompt.split(/\s+/).length} words of prompt.${selection}`
    : 'This page is still empty — place an element on the canvas and I can review it.';

  return [
    summary,
    '',
    'Three things I would do next:',
    bullets([
      review.buttonsWithoutAction > 0
        ? 'Give every button an explicit action.'
        : 'Name the single most important action on this page.',
      review.vague.length ? `Cut the vague words (${review.vague.join(', ')}).` : 'Add one concrete detail per element: colour, placement, or copy.',
      !review.hasStates ? 'Describe the empty and error states.' : 'Check the empty state is reachable in the UI, not just described.',
    ]),
    '',
    `Ask me about ${pageLabel}: the copy, the palette, the layout, or how it should adapt to another screen size.`,
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Remote model                                                        */
/* ------------------------------------------------------------------ */

const SYSTEM = `You are Vector AI, the assistant inside Vector.

Answer the user's actual question directly, in plain language, in at most 160 words.

A "Current screen context" block may be provided. Use it only when it genuinely helps answer the question. The user is allowed to ask general questions, product questions, or anything else; answer those normally and do not turn them into canvas instructions. Never pretend the user asked to add, move or edit an element.

When the question is about the current screen or prompt, be concrete: name the element, the attribute, and the fix. When it is general, answer it as a helpful general assistant and leave the screen out.

If something is unknown, say so or ask for the missing detail. Do not invent content. Do not restate the whole prompt. Do not use markdown headings.`;

export function aiConfigured(): boolean {
  const settings = loadSettings();
  return !!(settings.apiKey && settings.baseUrl && settings.model);
}

/** Vector-hosted model. Wired by env so no key ships in the bundle. */
const HOSTED_URL = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_VECTOR_AI_URL || '').trim();
const HOSTED_KEY = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_VECTOR_AI_KEY || '').trim();

export function hostedConfigured(): boolean {
  return !!(HOSTED_URL && HOSTED_KEY);
}

export type AiMode = 'byo' | 'hosted';

function endpointFor(mode: AiMode): { baseUrl: string; key: string; model: string } | null {
  if (mode === 'hosted') {
    if (!hostedConfigured()) return null;
    return { baseUrl: HOSTED_URL, key: HOSTED_KEY, model: 'vector-default' };
  }
  const settings = loadSettings();
  if (!settings.apiKey) return null;
  return { baseUrl: settings.baseUrl, key: settings.apiKey, model: settings.model };
}

function contextPrompt(question: string, ctx: AdvisorContext): string {
  return `Current screen context (use only when it helps answer the question):
Screen: ${ctx.title}
Page: ${ctx.pageName || 'Page 1'}${ctx.pageCount ? ` of ${ctx.pageCount}` : ''}
Frame: ${ctx.frame ? `${ctx.frame.width}×${ctx.frame.height}` : 'unknown'}
Background: ${ctx.background || '#FFFFFF'}
Selected: ${ctx.selected ? `${ctx.selected.name} “${ctx.selected.label}” (${ctx.selected.w}×${ctx.selected.h})` : 'nothing'}
Canvas elements: ${ctx.elements?.map((element) => `${element.name} (“${element.label}”)`).join(', ') || 'none'}
Accent colours: ${ctx.colors?.join(', ') || 'none'}
Prompt:
${ctx.prompt || '(empty)'}

User question: ${question}`;
}

function requestHeadersUnused(): void {}

/** Stream a model answer token by token. Returns false when streaming is unavailable. */
export async function streamAdvisor(
  question: string,
  ctx: AdvisorContext,
  onDelta: (chunk: string) => void,
  mode: AiMode = 'byo'
): Promise<boolean> {
  const endpoint = endpointFor(mode);
  if (!endpoint) return false;

  const res = await fetch(`${endpoint.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${endpoint.key}`,
      ...(endpoint.baseUrl.includes('opencode.ai') ? { 'x-opencode-session': 'vector' } : {}),
    },
    body: JSON.stringify({
      model: endpoint.model,
      temperature: 0.4,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: contextPrompt(question, ctx) },
      ],
    }),
  });

  if (!res.ok || !res.body) return false;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let received = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta) {
          received = true;
          onDelta(delta);
        }
      } catch {
        // Partial JSON across chunks — ignore and continue.
      }
    }
  }

  return received;
}

async function remoteAnswer(question: string, ctx: AdvisorContext, mode: AiMode = 'byo'): Promise<string> {
  const endpoint = endpointFor(mode);
  if (!endpoint) throw new Error('No model configured.');
  const res = await fetch(`${endpoint.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${endpoint.key}`,
      ...(endpoint.baseUrl.includes('opencode.ai') ? { 'x-opencode-session': 'vector' } : {}),
    },
    body: JSON.stringify({
      model: endpoint.model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: contextPrompt(question, ctx) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Advisor request failed (${res.status})`);
  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content || '').trim();
}

export async function askAdvisor(
  question: string,
  ctx: AdvisorContext,
  mode: AiMode = 'byo'
): Promise<{ answer: string; source: 'ai' | 'local'; note?: string }> {
  const endpoint = endpointFor(mode);
  if (endpoint) {
    try {
      const answer = await remoteAnswer(question, ctx, mode);
      if (answer) return { answer, source: 'ai' };
      return { answer: localAnswer(question, ctx), source: 'local', note: 'The model returned nothing, so this is the local review.' };
    } catch {
      return {
        answer: localAnswer(question, ctx),
        source: 'local',
        note: 'Could not reach the model — answering from the local reviewer instead.',
      };
    }
  }
  return { answer: localAnswer(question, ctx), source: 'local' };
}
