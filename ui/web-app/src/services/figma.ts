/**
 * Figma import → revised prompt bundle.
 *
 * Feed it the JSON from the Figma REST API (`/v1/files/:key`) or a plugin
 * export with the same shape, and it extracts every measurable element,
 * rebuilds it on the canvas, and produces a single deliverable: the revised
 * prompt plus a manifest, the images, and any attached files.
 */

import { newId, type CanvasItem, type CanvasPage } from '../data/canvas.ts';

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface FigmaPaint {
  type?: string;
  visible?: boolean;
  color?: FigmaColor;
  opacity?: number;
  imageRef?: string;
}

interface FigmaNode {
  id: string;
  name?: string;
  type: string;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  cornerRadius?: number;
  characters?: string;
  style?: {
    fontSize?: number;
    fontWeight?: number;
    textAlignHorizontal?: string;
    fontFamily?: string;
    textCase?: string;
  };
  children?: FigmaNode[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface FigmaImportResult {
  pages: CanvasPage[];
  warnings: string[];
  imageRefs: string[];
  nodeCount: number;
}

function toHex(colour?: FigmaColor): string | undefined {
  if (!colour) return undefined;
  const channel = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 255).toString(16).padStart(2, '0');
  return `#${channel(colour.r)}${channel(colour.g)}${channel(colour.b)}`.toUpperCase();
}

function firstSolidFill(node: FigmaNode): string | undefined {
  const fill = (node.fills || []).find((paint) => paint.type === 'SOLID' && paint.visible !== false);
  return toHex(fill?.color);
}

function isImageFill(node: FigmaNode): string | undefined {
  const fill = (node.fills || []).find((paint) => paint.type === 'IMAGE');
  return fill?.imageRef;
}

/** Bounds relative to the page frame, clamped inside it. */
function relativeBox(node: FigmaNode, frame: FigmaNode): { x: number; y: number; w: number; h: number } {
  const box = node.absoluteBoundingBox || { x: 0, y: 0, width: 0, height: 0 };
  const origin = frame.absoluteBoundingBox || { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: Math.max(0, Math.round(box.x - origin.x)),
    y: Math.max(0, Math.round(box.y - origin.y)),
    w: Math.max(8, Math.round(box.width)),
    h: Math.max(8, Math.round(box.height)),
  };
}

function nodeToItem(node: FigmaNode, frame: FigmaNode): CanvasItem | null {
  const { x, y, w, h } = relativeBox(node, frame);
  const fill = firstSolidFill(node);
  const imageRef = isImageFill(node);
  const radius = node.cornerRadius ?? undefined;

  const base = {
    id: newId(),
    x,
    y,
    w,
    h,
    color: fill,
    radius: radius != null ? Math.round(radius) : undefined,
    fill,
  };

  if (imageRef) {
    return {
      ...base,
      type: 'image',
      variant: 'image-rounded',
      label: node.name || 'Imported image',
      // The image bytes need a second authenticated request; the reference is
      // kept in the manifest so it can be resolved later.
      fill: undefined,
    };
  }

  switch (node.type) {
    case 'TEXT': {
      const text = (node.characters || '').trim();
      if (!text) return null;
      const fontSize = node.style?.fontSize ? Math.round(node.style.fontSize) : 16;
      const weight = node.style?.fontWeight || 400;
      const align =
        node.style?.textAlignHorizontal === 'CENTER'
          ? 'center'
          : node.style?.textAlignHorizontal === 'RIGHT'
            ? 'right'
            : 'left';
      const variant = fontSize >= 36 ? 'text-display' : fontSize >= 24 ? 'text-h2' : fontSize >= 18 ? 'text-h3' : 'text-body';
      return {
        ...base,
        type: 'text',
        variant,
        label: text,
        fontSize,
        fontWeight: weight >= 700 ? 800 : weight >= 600 ? 600 : 400,
        align,
        color: fill || '#0B0E14',
        fill: undefined,
      };
    }
    case 'ELLIPSE':
      return { ...base, type: 'card', variant: 'rect', label: node.name || 'Ellipse', radius: 999 };
    case 'RECTANGLE':
      return { ...base, type: 'card', variant: 'rect', label: node.name || 'Rectangle' };
    case 'COMPONENT':
    case 'INSTANCE':
    case 'COMPONENT_SET':
      return {
        ...base,
        type: 'card',
        variant: 'card-outline',
        label: node.name || 'Component',
        strokeColor: fill,
        strokeWidth: node.strokeWeight ? Math.round(node.strokeWeight) : undefined,
      };
    default:
      return null;
  }
}

function walk(node: FigmaNode, frame: FigmaNode, out: CanvasItem[], warnings: string[], images: string[], depth = 0): void {
  if (depth > 24) return;
  (node.children || []).forEach((child) => {
    const item = nodeToItem(child, frame);
    if (item) {
      out.push(item);
      if (isImageFill(child)) images.push(isImageFill(child)!);
    }
    walk(child, frame, out, warnings, images, depth + 1);
    if (child.type === 'GROUP' && !child.children?.length) {
      warnings.push(`Skipped empty group “${child.name || child.id}”.`);
    }
  });
}

export function parseFigmaJson(text: string): FigmaImportResult {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON. Export the file from Figma as JSON first.');
  }

  const document: FigmaNode | undefined = raw?.document || raw?.file?.document || raw;
  if (!document) throw new Error('No Figma document found in that file.');

  // Top-level frames: a page in Figma is a CANVAS whose children are FRAMEs.
  const frames: FigmaNode[] = [];
  const collectFrames = (node: FigmaNode) => {
    if (node.type === 'CANVAS') {
      (node.children || []).forEach((child) => {
        if (['FRAME', 'COMPONENT', 'SECTION'].includes(child.type)) frames.push(child);
      });
      return;
    }
    if (node.type === 'FRAME' && node.absoluteBoundingBox) {
      frames.push(node);
      return;
    }
    (node.children || []).forEach(collectFrames);
  };
  collectFrames(document);

  const warnings: string[] = [];
  const imageRefs: string[] = [];
  let nodeCount = 0;

  const pages: CanvasPage[] = (frames.length ? frames : [document as FigmaNode]).map((frame, index) => {
    const items: CanvasItem[] = [];
    walk(frame, frame, items, warnings, imageRefs);
    nodeCount += items.length;
    const box = frame.absoluteBoundingBox;
    return {
      id: newId(),
      name: frame.name || `Page ${index + 1}`,
      items,
      width: box ? Math.round(box.width) : 1440,
      height: box ? Math.round(box.height) : 900,
    };
  });

  if (!nodeCount) {
    warnings.push('No text or shapes were found — the export may only contain frames.');
  }
  if (imageRefs.length) {
    warnings.push(
      `${imageRefs.length} image${imageRefs.length === 1 ? '' : 's'} reference Figma asset hashes. They are listed in the manifest; re-upload them in the canvas to embed the pixels.`
    );
  }

  return { pages, warnings, imageRefs: Array.from(new Set(imageRefs)), nodeCount };
}

/* ---------------------------------------------------------------- */
/* Bundle export                                                     */
/* ---------------------------------------------------------------- */

function escapePipes(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function buildBundleMarkdown(options: {
  name: string;
  prompt: string;
  pages: CanvasPage[];
  attachments: Attachment[];
  imageRefs?: string[];
  source?: string;
}): string {
  const { name, prompt, pages, attachments, imageRefs = [], source = 'Vector canvas' } = options;
  const allItems = pages.flatMap((page) => page.items);
  const images = allItems.filter((item) => item.src);

  const lines: string[] = [];
  lines.push(`# ${name} — revised UI prompt bundle`, '');
  lines.push(`Source: ${source}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Pages: ${pages.length} · Elements: ${allItems.length} · Images: ${images.length} · Files: ${attachments.length}`, '');
  lines.push('---', '', '## 1. Revised prompt', '', '```text', prompt, '```', '');

  lines.push('## 2. Element manifest', '');
  lines.push('| # | Page | Type | Label | X | Y | W | H | Fill | Border | Motion |');
  lines.push('|---|------|------|-------|---|---|---|---|------|--------|--------|');
  let index = 1;
  pages.forEach((page) => {
    page.items.forEach((item) => {
      lines.push(
        `| ${index++} | ${escapePipes(page.name)} | ${item.type} | ${escapePipes(item.label)} | ${item.x} | ${item.y} | ${item.w} | ${item.h} | ${item.fill || item.color || '—'} | ${
          item.strokeWidth ? `${item.strokeWidth}px ${item.strokeColor || '#000000'}` : '—'
        } | ${
          item.animation
            ? `${item.animation.kind} / ${item.animation.trigger} / ${item.animation.duration}ms`
            : '—'
        } |`
      );
    });
  });
  lines.push('');

  lines.push('## 3. Page frames', '');
  pages.forEach((page) => {
    const transition =
      page.transition && page.transition !== 'none'
        ? `, transition ${page.transition} ${page.transitionDuration ?? 350}ms`
        : '';
    lines.push(
      `- **${page.name}** — ${page.width || 1200}×${page.height || 800}, background ${page.background || '#FFFFFF'}, ${page.items.length} elements${transition}`
    );
  });
  lines.push('');

  lines.push('## 3b. Motion', '');
  const animated = allItems.filter((item) => item.animation);
  if (animated.length) {
    animated.forEach((item) => {
      const animation = item.animation!;
      lines.push(
        `- **${escapePipes(item.label)}** — ${animation.kind} on ${animation.trigger}, ${animation.duration}ms${
          animation.delay ? `, ${animation.delay}ms delay` : ''
        }, ${animation.easing}${animation.repeat !== 'once' ? `, ${animation.repeat}` : ''}.`
      );
    });
  } else {
    lines.push('- No element animations specified.');
  }
  pages
    .filter((page) => page.transition && page.transition !== 'none')
    .forEach((page) =>
      lines.push(
        `- **Page ${escapePipes(page.name)}** — ${page.transition}, ${page.transitionDuration ?? 350}ms.`
      )
    );
  lines.push('- Respect prefers-reduced-motion.', '');


  if (images.length) {
    lines.push('## 4. Images (embedded)', '');
    images.forEach((item) => {
      lines.push(`### ${item.label}`);
      lines.push(`Position ${item.x},${item.y} · ${item.w}×${item.h}`);
      lines.push('');
      lines.push(`![${item.label}](${item.src})`);
      lines.push('');
    });
  }

  if (imageRefs.length) {
    lines.push('## 5. Figma image references', '');
    lines.push('These hashes must be resolved with the Figma API to fetch the pixels:');
    lines.push('');
    imageRefs.forEach((ref) => lines.push(`- \`${ref}\``));
    lines.push('');
  }

  if (attachments.length) {
    lines.push('## 6. Attached files', '');
    attachments.forEach((file) => {
      const kb = Math.round(file.size / 1024);
      lines.push(`### ${file.name}`);
      lines.push(`${file.type || 'application/octet-stream'} · ${kb} KB`);
      lines.push('');
      lines.push(`[Download ${file.name}](${file.dataUrl})`);
      lines.push('');
    });
  }

  lines.push('---', '', '## Instructions for the generator', '');
  lines.push('Build the interface described above as a responsive web application.');
  lines.push('- Follow the element manifest exactly: every label, position and size is intentional.');
  lines.push('- Use the embedded images as the real assets, at the stated positions.');
  lines.push('- Meet WCAG AA contrast, and design empty, loading and error states.');
  lines.push('- Do not invent extra sections.');

  return lines.join('\n');
}

export function buildBundleJson(options: {
  name: string;
  prompt: string;
  pages: CanvasPage[];
  attachments: Attachment[];
  imageRefs?: string[];
}): string {
  return JSON.stringify(
    {
      name: options.name,
      generatedAt: new Date().toISOString(),
      prompt: options.prompt,
      pages: options.pages,
      attachments: options.attachments.map(({ dataUrl, ...rest }) => ({ ...rest, embedded: dataUrl.startsWith('data:') })),
      imageRefs: options.imageRefs || [],
    },
    null,
    2
  );
}

export function downloadFile(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'vector-bundle';
}
