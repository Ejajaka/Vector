import { describe, expect, it } from 'vitest';
import { parseFigmaJson } from './figma.ts';

describe('figma JSON import', () => {
  it('turns a frame and its children into editable canvas pages', () => {
    const file = {
      document: {
        type: 'DOCUMENT',
        children: [
          {
            type: 'CANVAS',
            children: [
              {
                id: 'frame-1',
                type: 'FRAME',
                name: 'Checkout',
                absoluteBoundingBox: { x: 0, y: 0, width: 1200, height: 800 },
                children: [
                  {
                    id: 'title-1',
                    type: 'TEXT',
                    name: 'Title',
                    absoluteBoundingBox: { x: 60, y: 60, width: 400, height: 50 },
                    characters: 'Checkout',
                    style: { fontSize: 32, fontWeight: 700 },
                    fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],
                  },
                  {
                    id: 'card-1',
                    type: 'RECTANGLE',
                    name: 'Card',
                    absoluteBoundingBox: { x: 60, y: 140, width: 400, height: 200 },
                    fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const result = parseFigmaJson(JSON.stringify(file));
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].name).toBe('Checkout');
    expect(result.pages[0].items).toHaveLength(2);
    expect(result.pages[0].items[0].type).toBe('text');
    expect(result.pages[0].items[0].label).toBe('Checkout');
    expect(result.pages[0].items[1].type).toBe('card');
    expect(result.nodeCount).toBe(2);
  });
});
