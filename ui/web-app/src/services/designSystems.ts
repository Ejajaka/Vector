/**
 * Workspace-owned design systems.
 *
 * These are the organisation's own tokens — colours, type, radius, spacing —
 * created by that workspace and only listed for it. Nothing here is derived
 * from a third-party brand, and nothing is published to a public library.
 *
 * When this is backed by Supabase, the table needs
 * `workspace_id = auth.jwt() -> 'workspace'` in RLS, plus a membership check so
 * only people registered under the company can read it.
 */

import { newId, type CanvasItem, type CanvasPage } from '../data/canvas.ts';

export interface DesignTokens {
  primary: string;
  accent: string;
  surface: string;
  ink: string;
  font: 'jakarta' | 'bricolage' | 'georgia' | 'mono';
  radius: number;
  spacing: number;
}

export interface DesignSystem {
  id: string;
  name: string;
  workspaceId: string;
  tokens: DesignTokens;
  note?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

const KEY = 'vector_design_systems_v1';
const ACTIVE_KEY = 'vector_active_design_system_v1';

export function workspaceId(): string {
  try {
    return localStorage.getItem('vector_workspace_id_v1') || 'workspace_local';
  } catch {
    return 'workspace_local';
  }
}

function readAll(): DesignSystem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as DesignSystem[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: DesignSystem[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function listDesignSystems(workspace = workspaceId()): DesignSystem[] {
  return readAll().filter((system) => system.workspaceId === workspace);
}

export function saveDesignSystem(input: {
  name: string;
  tokens: DesignTokens;
  note?: string;
  logo?: string;
  id?: string;
}): DesignSystem {
  const all = readAll();
  const now = new Date().toISOString();
  const existing = input.id ? all.find((system) => system.id === input.id) : undefined;

  if (existing) {
    const updated: DesignSystem = { ...existing, ...input, updatedAt: now };
    writeAll(all.map((system) => (system.id === updated.id ? updated : system)));
    return updated;
  }

  const created: DesignSystem = {
    id: `ds_${Math.random().toString(36).slice(2, 10)}`,
    name: input.name.trim() || 'Untitled system',
    workspaceId: workspaceId(),
    tokens: input.tokens,
    note: input.note,
    logo: input.logo,
    createdAt: now,
    updatedAt: now,
  };
  writeAll([created, ...all]);
  return created;
}

export function deleteDesignSystem(id: string): void {
  writeAll(readAll().filter((system) => system.id !== id));
  if (getActiveId() === id) setActiveDesignSystem(null);
}

export function setActiveDesignSystem(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
}

export function getActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function getActiveDesignSystem(): DesignSystem | null {
  const id = getActiveId();
  if (!id) return null;
  return listDesignSystems().find((system) => system.id === id) || null;
}

import { downloadFile, slugify } from './figma.ts';

export function downloadSystem(system: DesignSystem): void {
  downloadFile(`${slugify(system.name)}-design-system.json`, exportDesignSystem(system), 'application/json');
}

export function exportDesignSystem(system: DesignSystem): string {
  return JSON.stringify(
    { format: 'vector.design-system/1', name: system.name, tokens: system.tokens, note: system.note },
    null,
    2
  );
}

export function importDesignSystem(text: string): DesignSystem {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const tokens = raw?.tokens;
  if (!tokens || typeof tokens !== 'object') {
    throw new Error('No tokens found. Expected a "tokens" object with colours, font and radius.');
  }
  return saveDesignSystem({
    name: String(raw?.name || 'Imported system'),
    note: String(raw?.note || ''),
    tokens: {
      primary: String(tokens.primary || '#7C5CFF'),
      accent: String(tokens.accent || '#22D3EE'),
      surface: String(tokens.surface || '#FFFFFF'),
      ink: String(tokens.ink || '#0B0E14'),
      font: (['jakarta', 'bricolage', 'georgia', 'mono'].includes(tokens.font) ? tokens.font : 'jakarta') as DesignTokens['font'],
      radius: Number(tokens.radius) || 12,
      spacing: Number(tokens.spacing) || 8,
    },
  });
}

/** The block that gets appended to every prompt while this system is active. */
export function designSystemPrompt(system: DesignSystem): string {
  const { tokens } = system;
  return [
    `DESIGN SYSTEM — ${system.name}`,
    `- Primary ${tokens.primary}, accent ${tokens.accent}, surface ${tokens.surface}, ink ${tokens.ink}.`,
    `- Type: ${tokens.font}; radius ${tokens.radius}px; spacing base ${tokens.spacing}px.`,
    system.note ? `- Notes: ${system.note}` : '',
    '- Use only these tokens. Do not introduce new colours or radii.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Build a starter page whose elements are already wearing the system. */
export function pagesFromDesignSystem(system: DesignSystem): CanvasPage[] {
  const { tokens } = system;
  const items: CanvasItem[] = [
    {
      id: newId(),
      type: 'navbar',
      variant: 'nav-light',
      x: 40,
      y: 0,
      w: 1120,
      h: 64,
      label: system.name,
      color: tokens.primary,
      fill: tokens.surface,
      strokeWidth: 1,
      strokeColor: `${tokens.ink}22`,
      radius: tokens.radius,
    },
    {
      id: newId(),
      type: 'text',
      variant: 'text-display',
      x: 64,
      y: 120,
      w: 720,
      h: 96,
      label: `${system.name} starter`,
      fontSize: 48,
      fontWeight: 800,
      color: tokens.ink,
      fontFamily: tokens.font,
    },
    {
      id: newId(),
      type: 'text',
      variant: 'text-body',
      x: 64,
      y: 232,
      w: 520,
      h: 60,
      label: 'Replace this line with the value proposition. Tokens are already applied.',
      fontSize: 16,
      color: tokens.ink,
      fontFamily: tokens.font,
    },
    {
      id: newId(),
      type: 'button',
      variant: 'btn-solid',
      x: 64,
      y: 320,
      w: 176,
      h: 48,
      label: 'Get started',
      color: tokens.primary,
      radius: tokens.radius,
    },
    {
      id: newId(),
      type: 'card',
      variant: 'card-outline',
      x: 64,
      y: 420,
      w: 340,
      h: 190,
      label: 'Feature',
      fill: tokens.surface,
      strokeWidth: 1,
      strokeColor: `${tokens.ink}18`,
      radius: tokens.radius,
    },
    {
      id: newId(),
      type: 'card',
      variant: 'card-stat',
      x: 428,
      y: 420,
      w: 300,
      h: 190,
      label: 'Metric',
      fill: tokens.surface,
      strokeColor: `${tokens.ink}18`,
      color: tokens.accent,
      radius: tokens.radius,
    },
  ];

  return [
    {
      id: newId(),
      name: 'Page 1',
      items: applySystemToItems(items, system),
      width: 1200,
      height: 800,
      background: tokens.surface,
    },
  ];
}

/** Apply the system's tokens to every element on a page. */
export function applySystemToItems(items: CanvasItem[], system: DesignSystem): CanvasItem[] {
  const { tokens } = system;
  const surfaceIsDark = (() => {
    const hex = tokens.surface.replace('#', '');
    if (hex.length !== 6) return false;
    const [r, g, b] = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
  })();

  return items.map((item) => {
    const next: CanvasItem = {
      ...item,
      radius: tokens.radius,
      fontFamily: item.type === 'text' || item.type === 'heading' ? tokens.font : item.fontFamily,
    };

    if (['navbar', 'card', 'input', 'table', 'modal', 'footer'].includes(item.type)) {
      next.fill = tokens.surface;
      next.strokeColor = `${tokens.ink}${surfaceIsDark ? '33' : '22'}`;
      next.strokeWidth = item.strokeWidth || 1;
    }
    if (item.type === 'button') {
      next.color = tokens.primary;
      if (item.variant !== 'btn-outline' && item.variant !== 'btn-ghost') next.fill = tokens.primary;
    }
    if (item.type === 'badge') next.color = tokens.accent;
    if (item.type === 'text' || item.type === 'heading') next.color = tokens.ink;
    if (item.type === 'chart') next.color = tokens.primary;
    if (item.type === 'avatar') next.fill = tokens.accent;
    if (item.type === 'navbar') next.color = tokens.primary;
    if (item.type === 'table') next.color = tokens.primary;
    if (item.type === 'input') next.color = tokens.ink;
    if (item.type === 'footer') next.color = tokens.ink;
    if (item.type === 'card') next.color = item.variant?.includes('stat') ? tokens.accent : tokens.primary;
    if (item.variant?.includes('stat') || item.variant?.includes('accent')) next.color = tokens.accent;
    if (item.variant?.includes('outline')) {
      next.fill = tokens.surface;
      next.strokeColor = `${tokens.ink}22`;
    }

    return next;
  });
}

/** Recolour this project's saved canvas with the active design system. */
export function applySystemToProject(projectId: string, system: DesignSystem): CanvasPage[] | null {
  try {
    const key = `vector_project_doc_${projectId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const doc = JSON.parse(raw) as { pages?: CanvasPage[]; [key: string]: unknown };
    const pages = (doc.pages || []).map((page) => ({
      ...page,
      background: system.tokens.surface,
      items: applySystemToItems(page.items || [], system),
    }));
    localStorage.setItem(
      key,
      JSON.stringify({ ...doc, pages, updatedAt: new Date().toISOString() }),
    );
    return pages;
  } catch {
    return null;
  }
}
