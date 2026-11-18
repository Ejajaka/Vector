import { describe, expect, it } from 'vitest';
import { correctSpelling, findSpellingIssues } from './spelling.ts';
import { DESIGN_PRESETS, presetTokens } from './generation/designPresets.ts';

describe('spelling', () => {
  it('finds and fixes common typos', () => {
    const text = 'Add teh button and recieve seperate labels.';
    expect(findSpellingIssues(text)).toHaveLength(3);
    expect(correctSpelling(text)).toBe('Add the button and receive separate labels.');
  });

  it('leaves clean text untouched', () => {
    const text = 'Employees must sign in before editing a profile.';
    expect(findSpellingIssues(text)).toHaveLength(0);
    expect(correctSpelling(text)).toBe(text);
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
