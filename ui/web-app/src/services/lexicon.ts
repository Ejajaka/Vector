/**
 * Workspace-local learned vocabulary.
 *
 * When a clarification maps an unknown or ambiguous word to a component, the
 * mapping is stored here. Every later compile in this browser resolves that
 * phrase automatically, so the engine expands without a model retrain.
 *
 * This is deliberately local: it is the user's own vocabulary, not a shared
 * training corpus.
 */
import type { ElementKind, LearnedLexicon } from './promptCompiler.ts';

const KEY = 'vector_learned_lexicon_v1';

export function loadLearnedLexicon(): LearnedLexicon {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as LearnedLexicon;
  } catch {
    return {};
  }
}

export function saveLearnedPhrase(
  phrase: string,
  kind: ElementKind | 'ignore'
): LearnedLexicon {
  const current = loadLearnedLexicon();
  const key = phrase.trim().toLowerCase();
  if (!key) return current;
  const next: LearnedLexicon = { ...current, [key]: kind };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // A full quota must not break compilation.
  }
  return next;
}

export function clearLearnedLexicon(): LearnedLexicon {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  return {};
}
