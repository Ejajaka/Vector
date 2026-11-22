import { describe, expect, it } from 'vitest';
import { decodeSharedCanvas, encodeSharedCanvas } from './sharedDocs.ts';
import type { CanvasPage } from '../data/canvas.ts';

describe('shared canvas links', () => {
  it('round-trips the exact canvas snapshot through the URL payload', () => {
    const pages: CanvasPage[] = [
      {
        id: 'page-1',
        name: 'Checkout',
        width: 1200,
        height: 800,
        background: '#0B0714',
        items: [
          {
            id: 'item-1',
            type: 'button',
            x: 64,
            y: 320,
            w: 176,
            h: 48,
            label: 'Pay now',
            color: '#D1B653',
            action: 'opens the confirmation modal',
            fontFamily: 'bricolage',
          },
        ],
      },
    ];

    const payload = encodeSharedCanvas({
      name: 'Checkout',
      pages,
      ownerId: 'owner-1',
      projectId: 'project-1',
    });
    const decoded = decodeSharedCanvas(payload);

    expect(decoded?.name).toBe('Checkout');
    expect(decoded?.projectId).toBe('project-1');
    expect(decoded?.pages).toEqual(pages);
  });

  it('rejects an empty or malformed payload', () => {
    expect(decodeSharedCanvas(null)).toBeNull();
    expect(decodeSharedCanvas('not-a-canvas')).toBeNull();
  });
});
