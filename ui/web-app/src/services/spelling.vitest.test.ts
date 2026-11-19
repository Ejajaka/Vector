import { describe, expect, it } from 'vitest';
import { correctSpelling, findSpellingIssues } from './spelling.ts';
import { DESIGN_PRESETS, presetTokens } from './generation/designPresets.ts';

describe('spelling', () => {
  it('finds and fixes common typos', () => {
    const text = 'Add teh button and recieve seperate labels.';
    expect(findSpellingIssues(text)).toHaveLength(3);
    expect(correctSpelling(text)).toBe('Add the button and receive separate labels.');
  });

  it('catches typos that are not in the curated list', () => {
    const text = 'Show a buton in the heder with a labl.';
    const issues = findSpellingIssues(text);
    expect(issues.map((issue) => `${issue.from}->${issue.to}`)).toEqual([
      'buton->button',
      'heder->header',
      'labl->label',
    ]);
    expect(correctSpelling(text)).toBe('Show a button in the header with a label.');
  });

  it('removes accidentally repeated words', () => {
    expect(correctSpelling('Add the the button to the screen.')).toBe('Add the button to the screen.');
  });

  it('does not flag valid product vocabulary or British spellings', () => {
    const text =
      'The responsive profile screen must be usable on mobile; the navbar, dropdown and checkbox use the colour palette while the centre panel keeps its behaviour.';
    expect(findSpellingIssues(text)).toEqual([]);
  });

  it('leaves clean text untouched', () => {
    const text = 'Employees must sign in before editing a profile.';
    expect(findSpellingIssues(text)).toHaveLength(0);
    expect(correctSpelling(text)).toBe(text);
  });

  it('ignores email addresses and urls', () => {
    const text = 'Contact sanje@example.com or visit https://example.com/docs.';
    expect(findSpellingIssues(text)).toHaveLength(0);
  });
});

describe('design presets', () => {
  it('provides domain themes with complete tokens', () => {
    expect(DESIGN_PRESETS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(DESIGN_PRESETS.map((preset) => preset.domain)).size).toBe(DESIGN_PRESETS.length);
    for (const preset of DESIGN_PRESETS) {
      const tokens = presetTokens(preset);
      expect(tokens.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(tokens.typography.length).toBeGreaterThan(0);
      expect(tokens.brandGuidelines.length).toBeGreaterThan(0);
    }
  });
});
