import { describe, expect, it } from 'vitest';
import { mergeCanvasPages } from './canvasMerge.ts';
import { removedSince } from './sharedDocs.ts';
import type { CanvasPage } from '../data/canvas.ts';

function page(id: string, items: string[]): CanvasPage {
  return {
    id,
    name: `Page ${id}`,
    width: 1200,
    height: 800,
    items: items.map((itemId) => ({
      id: itemId,
      type: 'card',
      x: 0,
      y: 0,
      w: 320,
      h: 200,
      label: itemId,
    })),
  };
}

describe('live canvas merging', () => {
  it('never drops elements this browser already has', () => {
    const current = [page('p1', ['a', 'b'])];
    const incoming = [page('p1', ['c'])];
    const merged = mergeCanvasPages(current, incoming);
    expect(merged[0].items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not resurrect an element deleted by a peer', () => {
    const current = [page('p1', ['a', 'b'])];
    const incoming = [page('p1', ['b'])];
    const merged = mergeCanvasPages(current, incoming, { deletedItems: ['a'] });
    expect(merged[0].items.map((item) => item.id)).toEqual(['b']);
  });

  it('does not resurrect a deleted page', () => {
    const current = [page('p1', []), page('p2', ['a'])];
    const merged = mergeCanvasPages(current, [], { deletedPages: ['p1'] });
    expect(merged.map((canvasPage) => canvasPage.id)).toEqual(['p2']);
  });

  it('reports only elements that actually disappeared locally', () => {
    const removed = removedSince(
      { pages: [page('p1', ['a', 'b'])] },
      { pages: [page('p1', ['b'])] },
    );
    expect(removed.deletedItems).toEqual(['a']);
    expect(removed.deletedPages).toEqual([]);
  });
});
