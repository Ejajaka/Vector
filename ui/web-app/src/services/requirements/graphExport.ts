import type { RequirementAnalysisResult } from '../../types/requirementIntelligence.ts';
import { buildGraphModel, type GraphCard } from './graphLayout.ts';

const MARGIN_X = 70;
const HEADER = 138;
const FOOTER = 84;
const SCALE = 2;
const CARD_RADIUS = 12;

const CHIP_COLOR: Record<string, string> = {
  screen: '#3E6B33',
  component: '#856C16',
  role: '#30494B',
  interaction: '#9C4A28',
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !current) {
      current = trial;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 4) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 3 && ctx.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}…`;
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  background: string,
  color: string,
) {
  ctx.font = '700 8px "Segoe UI", sans-serif';
  const width = ctx.measureText(text).width + 10;
  ctx.fillStyle = background;
  rounded(ctx, x, y, width, 14, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(text, x + 5, y + 10);
  return width;
}

function drawCard(ctx: CanvasRenderingContext2D, card: GraphCard, x: number, y: number) {
  const w = 300;
  const h = card.height;
  const conflict = card.conflicts > 0;

  ctx.save();
  ctx.shadowColor = 'rgba(40, 54, 56, 0.08)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#FFFFFF';
  rounded(ctx, x, y, w, h, CARD_RADIUS);
  ctx.fill();
  ctx.restore();

  ctx.save();
  rounded(ctx, x, y, w, h, CARD_RADIUS);
  ctx.clip();
  ctx.fillStyle = '#FAFAF8';
  ctx.fillRect(x, y, w, 27);
  ctx.restore();

  ctx.strokeStyle = conflict ? '#E3B7B0' : '#E5E2D8';
  ctx.lineWidth = 1;
  rounded(ctx, x, y, w, h, CARD_RADIUS);
  ctx.stroke();

  ctx.fillStyle = '#49686C';
  ctx.font = '700 10px "Consolas", monospace';
  ctx.fillText(card.code, x + 10, y + 17);

  let badgeX = x + w - 10;
  if (card.dependencies > 0) {
    const label = `${card.dependencies} need${card.dependencies === 1 ? '' : 's'}`;
    ctx.font = '700 8px "Segoe UI", sans-serif';
    const width = ctx.measureText(label).width + 10;
    badgeX -= width;
    pill(ctx, label, badgeX, y + 6.5, '#F0F5F5', '#49686C');
    badgeX -= 4;
  }
  if (conflict) {
    const label = `${card.conflicts} conflict${card.conflicts === 1 ? '' : 's'}`;
    ctx.font = '700 8px "Segoe UI", sans-serif';
    const width = ctx.measureText(label).width + 10;
    badgeX -= width;
    pill(ctx, label, badgeX, y + 6.5, '#FDF2F0', '#B94D42');
  }

  ctx.fillStyle = '#283638';
  ctx.font = '400 10.5px "Segoe UI", sans-serif';
  const lines = wrap(ctx, card.text, w - 20, 2);
  lines.forEach((line, index) => {
    ctx.fillText(line, x + 10, y + 42 + index * 15);
  });

  let rowY = y + 42 + lines.length * 15 + 6;
  for (const group of card.chips) {
    ctx.fillStyle = CHIP_COLOR[group.kind] || '#737A72';
    ctx.font = '700 7.5px "Segoe UI", sans-serif';
    ctx.fillText(group.label.toUpperCase(), x + 10, rowY + 8);

    let cx = x + 66;
    ctx.font = '400 8.5px "Segoe UI", sans-serif';
    for (const item of group.items) {
      const label = fit(ctx, item, 86);
      const width = ctx.measureText(label).width + 10;
      ctx.fillStyle = '#FAFAF8';
      ctx.strokeStyle = '#EFECE3';
      ctx.lineWidth = 1;
      rounded(ctx, cx, rowY, width, 14, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#5B625B';
      ctx.fillText(label, cx + 5, rowY + 10);
      cx += width + 4;
    }
    if (group.total > group.items.length) {
      ctx.fillStyle = '#9A9688';
      ctx.font = '400 8.5px "Segoe UI", sans-serif';
      ctx.fillText(`+${group.total - group.items.length}`, cx + 1, rowY + 10);
    }
    rowY += 22;
  }

  if (card.dependsOn.length > 0) {
    ctx.fillStyle = '#49686C';
    ctx.font = '700 7.5px "Segoe UI", sans-serif';
    ctx.fillText('NEEDS', x + 10, rowY + 8);

    ctx.font = '400 8.5px "Segoe UI", sans-serif';
    const label = fit(ctx, card.dependsOn.join(', '), 208);
    const width = ctx.measureText(label).width + 10;
    ctx.fillStyle = '#F0F5F5';
    ctx.strokeStyle = '#D6E2E2';
    rounded(ctx, x + 66, rowY, width, 14, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#49686C';
    ctx.fillText(label, x + 71, rowY + 10);
  }
}

export interface GraphExportOptions {
  projectName: string;
  counts: { requirements: number; ambiguities: number; conflicts: number; dependencies: number };
}

export async function exportRequirementGraph(
  analysis: RequirementAnalysisResult,
  options: GraphExportOptions,
): Promise<Blob> {
  const model = buildGraphModel(analysis);
  const width = MARGIN_X * 2 + Math.max(model.width, 300);
  const height = HEADER + Math.max(model.height, 120) + FOOTER;
  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#FAFAF8';
  ctx.fillRect(0, 0, width, height);

  // Header.
  ctx.fillStyle = '#283638';
  ctx.font = '700 30px "Segoe UI", sans-serif';
  ctx.fillText('Requirement graph', MARGIN_X, 56);
  ctx.fillStyle = '#49686C';
  ctx.font = '600 15px "Segoe UI", sans-serif';
  ctx.fillText(options.projectName, MARGIN_X, 82);
  ctx.fillStyle = '#737A72';
  ctx.font = '400 13px "Segoe UI", sans-serif';
  const summary =
    `${options.counts.requirements} requirement cards · ${options.counts.ambiguities} ambiguities · ` +
    `${options.counts.conflicts} conflicts · ${options.counts.dependencies} dependencies`;
  ctx.fillText(summary, MARGIN_X, 106);

  // Only conflicts are drawn between cards. Everything else lives on the card,
  // which keeps the exported diagram as calm as the on-screen board.
  for (const relation of model.relations) {
    const from = model.positions.get(relation.source);
    const to = model.positions.get(relation.target);
    if (!from || !to) continue;
    const x1 = MARGIN_X + from.x + from.w / 2;
    const y1 = HEADER + from.y + from.h;
    const x2 = MARGIN_X + to.x + to.w / 2;
    const y2 = HEADER + to.y;
    const bend = Math.max(24, Math.abs(y2 - y1) * 0.35);

    ctx.strokeStyle = '#B94D42';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1, y1 + bend, x2, y2 - bend, x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#B94D42';
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 3.5, y2 - 7);
    ctx.lineTo(x2 + 3.5, y2 - 7);
    ctx.closePath();
    ctx.fill();

    const midY = (y1 + y2) / 2;
    const midX = (x1 + x2) / 2;
    ctx.font = '700 9px "Segoe UI", sans-serif';
    const label = 'conflict';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = '#FDF2F0';
    rounded(ctx, midX - tw / 2 - 5, midY - 8, tw + 10, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#B94D42';
    ctx.fillText(label, midX - tw / 2, midY + 3);
  }

  for (const card of model.cards) {
    const box = model.positions.get(card.id);
    if (!box) continue;
    drawCard(ctx, card, MARGIN_X + box.x, HEADER + box.y);
  }

  // Footer legend.
  const legend: Array<[string, string]> = [
    ['screen', '#688E5E'],
    ['component', '#D1B653'],
    ['role', '#5A8090'],
    ['interaction', '#C96839'],
    ['conflict', '#B94D42'],
  ];
  let lx = MARGIN_X;
  const ly = height - 34;
  ctx.font = '600 12px "Segoe UI", sans-serif';
  for (const [label, color] of legend) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lx + 4, ly - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#737A72';
    ctx.fillText(label, lx + 14, ly);
    lx += ctx.measureText(label).width + 42;
  }
  ctx.fillStyle = '#B9B5A9';
  ctx.font = '400 11px "Segoe UI", sans-serif';
  ctx.fillText('Needs = dependency · Generated by Vector', width - 280, ly);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create the PNG.'));
    }, 'image/png');
  });
}
