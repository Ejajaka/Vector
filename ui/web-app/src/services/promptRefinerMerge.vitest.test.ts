import { describe, expect, it } from 'vitest';
import { compilePrompt } from './promptCompiler.ts';
import { mergeLineSpans } from './promptRefiner.ts';
import type { DetectedSpan } from './bertEngine.ts';

describe('local BERT merge', () => {
  it('fills an unresolved card label from the model element span', () => {
    const line = 'Add a card with revenue';
    const compiled = compilePrompt(line);
    const card = compiled.elements.find((element) => element.kind === 'card');
    expect(card?.label).toBeFalsy();

    const spans: DetectedSpan[] = [{ label: 'ELEMENT', text: 'revenue', char_start: 0, char_end: 0 }];
    const merged = mergeLineSpans(compiled.elements, line, spans, compiled.archetype);

    expect(merged.applied.length).toBeGreaterThan(0);
    expect(card?.label).toBe('Revenue');
  });

  it('ignores noisy model labels instead of writing them as copy', () => {
    const line = 'Support dark mode and light mode at the same time';
    const compiled = compilePrompt(line);
    const spans: DetectedSpan[] = [
      { label: 'LABEL', text: 'mode and', char_start: 0, char_end: 0 },
      { label: 'ELEMENT', text: 'dark', char_start: 0, char_end: 0 },
    ];
    const before = JSON.stringify(compiled.elements);
    mergeLineSpans(compiled.elements, line, spans, compiled.archetype);
    expect(JSON.stringify(compiled.elements)).toBe(before);
  });
});

