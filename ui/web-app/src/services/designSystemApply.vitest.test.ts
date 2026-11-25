import { describe, expect, it } from 'vitest';
import { applySystemToItems, type DesignSystem } from './designSystems.ts';
import type { CanvasItem } from '../data/canvas.ts';

const system: DesignSystem = {
  id: 'sys-1',
  name: 'Streaming Pop',
  workspaceId: 'workspace_local',
  tokens: {
    primary: '#4F46D0',
    accent: '#FFD166',
    surface: '#111111',
    ink: '#FFFFFF',
    font: 'bricolage',
    radius: 18,
    spacing: 18,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function button(overrides: Partial<CanvasItem> = {}): CanvasItem {
  return {
    id: 'item-1',
    type: 'button',
    variant: 'btn-solid',
    x: 0,
    y: 0,
    w: 168,
    h: 48,
    label: 'Get started',
    color: '#7C5CFF',
    ...overrides,
  };
}

describe('design system application', () => {
  it('recolors a new button with the system primary instead of the house violet', () => {
    const [item] = applySystemToItems([button()], system);
    expect(item.color).toBe('#4F46D0');
    expect(item.fill).toBe('#4F46D0');
    expect(item.radius).toBe(18);
    expect(item.fontFamily).toBe('bricolage');
  });

  it('keeps outline buttons unfilled but uses the system ink', () => {
    const [item] = applySystemToItems([button({ variant: 'btn-outline' })], system);
    expect(item.fill).toBe('#111111');
    expect(item.color).toBe('#4F46D0');
  });
});
