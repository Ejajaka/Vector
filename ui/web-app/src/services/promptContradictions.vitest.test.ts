import { describe, expect, it } from 'vitest';
import { compilePrompt, detectContradictions } from './promptCompiler.ts';

describe('prompt contradictions', () => {
  it('flags two accent colours, dark+light and a forbidden delete action', () => {
    const signals = detectContradictions(
      'Build a dashboard in blue and green with dark mode and light mode at once. Add a Delete button but it must never allow deletion.',
    );
    expect(signals.some((signal) => /Two accent colours/i.test(signal.text))).toBe(true);
    expect(signals.some((signal) => /dark theme and a light theme/i.test(signal.text))).toBe(true);
    expect(signals.some((signal) => /forbids deletion/i.test(signal.text))).toBe(true);
  });

  it('does not flag a legitimate theme toggle or a single colour', () => {
    const signals = detectContradictions('Add a dark and light theme toggle so users can switch the mode themselves.');
    expect(signals.some((signal) => /dark theme and a light theme/i.test(signal.text))).toBe(false);
    expect(detectContradictions('Use a blue primary button.')).toHaveLength(0);
  });

  it('labels a KPI card instead of leaving it unresolved', () => {
    const compiled = compilePrompt('Show KPIs: revenue, churn, active users, plus a table with sorting and a Delete button.');
    const card = compiled.elements.find((element) => element.kind === 'card');
    expect(card?.label).toBe('KPIs');
  });

  it('keeps decimals and thousands separators when splitting prose', () => {
    const compiled = compilePrompt('Add a table with 10,000 rows and set the title font to 2.5rem.');
    const table = compiled.elements.find((element) => element.kind === 'table');
    expect(table).toBeTruthy();
    expect(compiled.elements.some((element) => element.kind === 'heading')).toBe(false);
    expect(compiled.meta.lines.join(' | ')).toContain('10,000 rows');
  });

  it('does not turn a typography spec into a heading element', () => {
    const compiled = compilePrompt('Use font "Inter" 2.5rem for the title and 0.875rem for the body.');
    expect(compiled.elements.some((element) => element.kind === 'heading')).toBe(false);
    expect(compiled.meta.tokens.fontLabel).toBe('Inter');
  });
});
