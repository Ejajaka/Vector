import { describe, expect, it } from 'vitest';
import { compileRequirementsWithStats } from './compiler.ts';
import type { ExtractedDocument } from '../../types/requirements.ts';

function documentFor(pages: string[]): ExtractedDocument {
  return {
    pages,
    text: pages.join('\n\n'),
    pageCount: pages.length,
    fileName: 'requirements.md',
    mimeType: 'text/markdown',
  };
}

describe('requirement compile cap', () => {
  it('reports truncation when the document exceeds the cap', () => {
    const page = Array.from({ length: 320 }, (_, index) => `Requirement ${index + 1} must be visible.`).join('\n');
    const stats = compileRequirementsWithStats(documentFor([page]), { codePrefix: 'REQ-CAP' });
    expect(stats.drafts).toHaveLength(300);
    expect(stats.truncated).toBe(true);
    expect(stats.limit).toBe(300);
  });

  it('does not report truncation for a document inside the cap', () => {
    const docs = compileRequirementsWithStats(documentFor(['The page must show a button.']), { codePrefix: 'REQ-OK' });
    expect(docs.drafts).toHaveLength(1);
    expect(docs.truncated).toBe(false);
  });
});
