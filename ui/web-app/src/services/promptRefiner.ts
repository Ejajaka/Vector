/**
 * Optional model pass.
 *
 * The deterministic compiler in `promptCompiler.ts` is the source of truth and
 * works with no model at all. This module runs the repository's fine-tuned
 * DistilBERT UI-span tagger (ELEMENT / LABEL / COLOR / ACTION / LOCATION) as a
 * second opinion, then merges only what the model can ground in the prompt:
 *
 *   - a label is filled only when the element has none
 *   - a colour is filled only when it parses as a real colour
 *   - an action is filled only when it starts with a real interaction verb
 *   - a component is added only when its span classifies with the deterministic
 *     vocabulary, so the model can never invent a new kind of UI
 *
 * Nothing is overwritten. If the model is unavailable, or its spans do not
 * validate, the deterministic result is returned untouched.
 */

import {
  classifyText,
  colourFromText,
  elementFromText,
  isActionPhrase,
  sortForArchetype,
  type Archetype,
  type CompileResult,
  type CompiledElement,
} from './promptCompiler.ts';
import type { DetectedSpan } from './bertEngine.ts';

export interface RefineProgress {
  percent: number;
  stage: string;
}

export interface RefineOutcome {
  elements: CompiledElement[];
  applied: string[];
  confidence: number;
  lines: number;
  added: number;
  ms: number;
}

const MAX_LINES = 32;
const MAX_ADDED = 4;

const spanCache = new Map<string, { spans: DetectedSpan[]; confidence: number }>();

const INTERACTIVE = new Set(['button', 'modal', 'checkbox']);

function tidy(text: string): string {
  return text
    .replace(/^["“”'‘’]+|["“”'‘’]+$/g, '')
    .replace(/[.,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function usableLabel(text: string, kind: string): string | undefined {
  const value = tidy(text);
  if (value.length < 2 || value.length > 48) return undefined;
  // "button" is the noun, not the copy.
  if (classifyText(value) === kind) return undefined;
  return value;
}

function usableAction(text: string): string | undefined {
  const value = tidy(text);
  if (value.length < 3 || value.length > 48) return undefined;
  return isActionPhrase(value) ? value : undefined;
}

function usableLocation(text: string): string | undefined {
  const match = text.toLowerCase().match(/\b(top|bottom|left|right|centre|center|middle|sidebar)\b/);
  return match?.[1];
}

function spanFor(spans: DetectedSpan[], label: string): DetectedSpan | undefined {
  return spans.find((span) => span.label === label && span.text.trim().length > 0);
}

/** A span is only trusted when its text actually occurs in the line. */
function grounded(span: DetectedSpan | undefined, line: string): span is DetectedSpan {
  if (!span) return false;
  const text = span.text.trim();
  if (!text) return false;
  return line.toLowerCase().includes(text.toLowerCase());
}

/**
 * Merge one line's model spans into the working element list.
 * Exported so the merge rules can be tested without downloading the model.
 */
export function mergeLineSpans(
  elements: CompiledElement[],
  line: string,
  spans: DetectedSpan[],
  archetype: Archetype,
  maxAdded = MAX_ADDED
): { applied: string[]; added: number } {
  const applied: string[] = [];
  let added = 0;
  if (!spans.length) return { applied, added };

  const lineElements = elements.filter((element) => element.sourceLine === line);

  if (lineElements.length === 1) {
    const element = lineElements[0];

    if (!element.label) {
      const span = spanFor(spans, 'LABEL');
      const value = grounded(span, line) ? usableLabel(span.text, element.kind) : undefined;
      if (value) {
        element.label = value;
        element.confidence = Math.max(element.confidence || 0, 0.72);
        applied.push(`label “${value}” for ${element.kind}`);
      }
    }

    if (!element.colour) {
      const span = spanFor(spans, 'COLOR');
      const value = grounded(span, line) ? colourFromText(span.text) : undefined;
      if (value) {
        element.colour = value;
        element.colourInferred = false;
        applied.push(`colour ${value} for ${element.kind}`);
      }
    }

    if (!element.action && INTERACTIVE.has(element.kind)) {
      const span = spanFor(spans, 'ACTION');
      const value = grounded(span, line) ? usableAction(span.text) : undefined;
      if (value) {
        element.action = value;
        element.confidence = Math.max(element.confidence || 0, 0.7);
        applied.push(`action “${value}” for ${element.kind}`);
      }
    }

    if (!element.location) {
      const span = spanFor(spans, 'LOCATION');
      const value = grounded(span, line) ? usableLocation(span.text) : undefined;
      if (value) {
        element.location = value;
        applied.push(`position ${value} for ${element.kind}`);
      }
    }

    return { applied, added };
  }

  // The line produced several elements (or none). Only add a component when
  // the span itself classifies, so the model cannot invent a new kind.
  const elementSpan = spanFor(spans, 'ELEMENT');
  if (!grounded(elementSpan, line) || added >= maxAdded) return { applied, added };
  const kind = classifyText(elementSpan.text);
  if (!kind) return { applied, added };
  if (lineElements.some((element) => element.kind === kind)) return { applied, added };

  const created = elementFromText(elementSpan.text, archetype);
  if (!created) return { applied, added };

  const label = spanFor(spans, 'LABEL');
  const value = grounded(label, line) ? usableLabel(label.text, created.kind) : undefined;
  if (value) created.label = value;

  const colour = spanFor(spans, 'COLOR');
  const colourValue = grounded(colour, line) ? colourFromText(colour.text) : undefined;
  if (colourValue) {
    created.colour = colourValue;
    created.colourInferred = false;
  }

  if (INTERACTIVE.has(created.kind)) {
    const action = spanFor(spans, 'ACTION');
    const actionValue = grounded(action, line) ? usableAction(action.text) : undefined;
    if (actionValue) created.action = actionValue;
  }

  created.id = `el_bert_${elements.length + 1}`;
  created.sourceLine = line;
  created.confidence = 0.55;
  elements.push(created);
  added += 1;
  applied.push(`added ${created.kind} from a model span`);

  return { applied, added };
}

export async function refineWithBERT(
  result: CompileResult,
  onProgress?: (progress: RefineProgress) => void
): Promise<RefineOutcome> {
  const started = performance.now();
  const lines = Array.from(new Set(result.meta.lines.map((line) => line.trim())))
    .filter(Boolean)
    .slice(0, MAX_LINES);

  if (!lines.length) {
    return { elements: result.elements, applied: [], confidence: 0, lines: 0, added: 0, ms: 0 };
  }

  const { runBERT } = await import('./bertEngine.ts');
  const elements = result.elements.map((element) => ({ ...element }));
  const applied: string[] = [];
  let confidenceSum = 0;
  let confidenceCount = 0;
  let added = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const basePercent = (index / lines.length) * 92;

    let cached = spanCache.get(line);
    if (!cached) {
      try {
        const outcome = await runBERT(line, (progress) => {
          onProgress?.({
            percent: Math.round(basePercent + (progress.percent / 100) * (92 / lines.length)),
            stage: progress.file ? `Loading ${progress.file}` : 'Loading local model',
          });
        });
        cached = { spans: outcome.spans, confidence: outcome.confidence };
        spanCache.set(line, cached);
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'The local model could not be loaded.'
        );
      }
    }

    confidenceSum += cached.confidence;
    confidenceCount += 1;

    onProgress?.({
      percent: Math.round(((index + 1) / lines.length) * 92),
      stage: `Reading line ${index + 1} of ${lines.length}`,
    });

    const merged = mergeLineSpans(
      elements,
      line,
      cached.spans,
      result.archetype,
      MAX_ADDED - added
    );
    added += merged.added;
    applied.push(...merged.applied);
  }

  onProgress?.({ percent: 96, stage: 'Merging with the deterministic result' });

  const mergedElements = sortForArchetype(elements, result.archetype);

  return {
    elements: mergedElements,
    applied,
    confidence: confidenceCount ? Number((confidenceSum / confidenceCount).toFixed(3)) : 0,
    lines: lines.length,
    added,
    ms: Math.round(performance.now() - started),
  };
}
