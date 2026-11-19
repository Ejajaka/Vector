/**
 * Private, workspace-scoped templates.
 *
 * Organisations often have their own documented UI standards (brand grids,
 * regulatory layouts, internal component rules). Those must never leak into the
 * public library. Private templates are stored per workspace and are only
 * listed for that workspace.
 *
 * Client-side scoping is a UI boundary, not a security boundary — when this is
 * backed by Supabase, the same record needs an RLS policy of
 * `workspace_id = auth.jwt() -> 'workspace'`.
 */

import type { CanvasItem, CanvasPage } from '../data/canvas.ts';
import { newId } from '../data/canvas.ts';

export interface PrivateTemplate {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  pages: Array<{ name: string; items: CanvasItem[]; width?: number; height?: number; background?: string }>;
  createdAt: string;
  source?: string;
}

const KEY = 'vector_private_templates_v1';

export function workspaceId(): string {
  try {
    return localStorage.getItem('vector_workspace_id_v1') || 'workspace_local';
  } catch {
    return 'workspace_local';
  }
}

function readAll(): PrivateTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PrivateTemplate[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: PrivateTemplate[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function listPrivate(workspace = workspaceId()): PrivateTemplate[] {
  return readAll().filter((template) => template.workspaceId === workspace);
}

export function savePrivate(template: Omit<PrivateTemplate, 'id' | 'createdAt' | 'workspaceId'> & { workspaceId?: string }): PrivateTemplate {
  const record: PrivateTemplate = {
    ...template,
    id: `priv_${Math.random().toString(36).slice(2, 10)}`,
    workspaceId: template.workspaceId || workspaceId(),
    createdAt: new Date().toISOString(),
  };
  writeAll([record, ...readAll()]);
  return record;
}

export function deletePrivate(id: string): void {
  writeAll(readAll().filter((template) => template.id !== id));
}

/**
 * Accepts either a Vector bundle (`{ name, pages: [{ name, items }] }`) or a
 * plain design JSON (`{ name, elements: [...] }`).
 */
export function importPrivateTemplate(text: string): PrivateTemplate {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const name = String(raw?.name || 'Imported template').trim();

  const pages: PrivateTemplate['pages'] = Array.isArray(raw?.pages)
    ? raw.pages.map((page: any) => ({
        name: String(page?.name || 'Page'),
        items: Array.isArray(page?.items) ? page.items : [],
        width: page?.width,
        height: page?.height,
        background: page?.background,
      }))
    : [
        {
          name: 'Page 1',
          items: Array.isArray(raw?.elements) ? raw.elements : [],
        },
      ];

  if (!pages.some((page) => page.items.length > 0)) {
    throw new Error('No elements found in that file. Export the page with its layers included.');
  }

  return savePrivate({
    name,
    description: String(raw?.description || 'Imported into this workspace only.'),
    pages,
    source: String(raw?.source || 'import'),
  });
}

export function pagesFromPrivate(template: PrivateTemplate): CanvasPage[] {
  return template.pages.map((page) => ({
    id: newId(),
    name: page.name,
    items: page.items,
    width: page.width,
    height: page.height,
    background: page.background,
  }));
}
