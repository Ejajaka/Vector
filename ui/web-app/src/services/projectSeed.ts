import type { TemplateDefinition } from '../data/templates.ts';
import { itemsFromTemplate, newId, type CanvasPage } from '../data/canvas.ts';
import { applySystemToItems, getActiveDesignSystem } from './designSystems.ts';
import {
  DEVICE_FRAMES,
  LAYOUT_ACCENTS,
  layoutForTemplate,
  stackItems,
} from '../data/templateLayouts.ts';

/** Turn a template into the same canvas pages the editor would create. */
export function pagesFromTemplate(template: TemplateDefinition): CanvasPage[] {
  const device = template.device || 'desktop';
  if (device !== 'desktop') {
    const frame = DEVICE_FRAMES[device];
    return [
      {
        id: newId(),
        name: 'Page 1',
        items: stackItems(template.blocks, frame.width, frame.height, LAYOUT_ACCENTS[template.id]),
        width: frame.width,
        height: frame.height,
      },
    ];
  }

  const first: CanvasPage = {
    id: newId(),
    name: 'Page 1',
    items: layoutForTemplate(template.id) ?? itemsFromTemplate(template),
  };
  const extras: CanvasPage[] = (template.pages || []).map((page) => ({
    id: newId(),
    name: page.name,
    items: itemsFromTemplate({ ...template, blocks: page.blocks, pages: undefined }),
  }));
  return [first, ...extras];
}

export function seedProjectFromTemplate(
  projectId: string,
  projectName: string,
  template: TemplateDefinition
): CanvasPage[] {
  const pages = pagesFromTemplate(template);
  const active = getActiveDesignSystem();
  const themed = active
    ? pages.map((page) => ({
        ...page,
        background: active.tokens.surface,
        items: applySystemToItems(page.items, active),
      }))
    : pages;
  try {
    localStorage.setItem(
      `vector_project_doc_${projectId}`,
      JSON.stringify({ name: projectName, pages: themed, updatedAt: new Date().toISOString() })
    );
  } catch {
    // Storage is best effort; the user can still start from a blank canvas.
  }
  return themed;
}

export function readProjectSetup(projectId: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(`vector_project_setup_${projectId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProjectSetup(projectId: string, setup: Record<string, unknown>): void {
  try {
    localStorage.setItem(`vector_project_setup_${projectId}`, JSON.stringify(setup));
  } catch {
    // ignore
  }
}
