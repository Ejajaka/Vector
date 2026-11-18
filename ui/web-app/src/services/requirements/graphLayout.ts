import type {
  GraphNodeKind,
  RequirementAnalysisResult,
} from '../../types/requirementIntelligence.ts';

export interface GraphChipGroup {
  kind: GraphNodeKind;
  label: string;
  color: string;
  items: string[];
  total: number;
}

export interface GraphCard {
  id: string;
  code: string;
  text: string;
  chips: GraphChipGroup[];
  dependsOn: string[];
  conflicts: number;
  dependencies: number;
  height: number;
}

export interface GraphRelation {
  id: string;
  source: string;
  target: string;
}

export interface GraphCardBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GraphModel {
  cards: GraphCard[];
  relations: GraphRelation[];
  positions: Map<string, GraphCardBox>;
  columns: number;
  width: number;
  height: number;
}

export const CARD_WIDTH = 300;
export const CARD_GAP_X = 36;
export const CARD_GAP_Y = 46;
const MAX_CHIPS = 2;

const CHIP_ORDER: GraphNodeKind[] = ['screen', 'component', 'role', 'interaction'];

const CHIP_META: Record<string, { label: string; color: string }> = {
  screen: { label: 'Screens', color: '#3E6B33' },
  component: { label: 'Components', color: '#856C16' },
  role: { label: 'Roles', color: '#30494B' },
  interaction: { label: 'Interactions', color: '#9C4A28' },
};

function cardHeight(chipRows: number): number {
  return 100 + chipRows * 22;
}

/**
 * Rebuilds the dense requirement graph into a board of requirement cards.
 *
 * Screens, components, roles and interactions become chips inside their
 * requirement instead of separate nodes, and dependencies become a small
 * "Needs" row. Only genuine conflicts are drawn as lines, which keeps the
 * diagram readable while still showing the important cross-requirement link.
 */
export function buildGraphModel(analysis: RequirementAnalysisResult): GraphModel {
  const nodeById = new Map(analysis.graph.nodes.map((node) => [node.id, node]));
  const requirementByNode = new Map<string, string>();
  for (const node of analysis.graph.nodes) {
    if (node.kind === 'requirement') requirementByNode.set(node.id, node.id);
  }
  const requirementById = new Map(
    analysis.requirements.map((requirement) => [requirement.id, requirement]),
  );

  const attributeLabels = new Map<string, Map<GraphNodeKind, Set<string>>>();
  const dependsOn = new Map<string, Set<string>>();
  const conflicts = new Map<string, number>();
  const dependencies = new Map<string, number>();
  const relations: GraphRelation[] = [];

  const addAttribute = (requirementNodeId: string, attributeNodeId: string) => {
    const attribute = nodeById.get(attributeNodeId);
    if (!attribute) return;
    const groups = attributeLabels.get(requirementNodeId) || new Map<GraphNodeKind, Set<string>>();
    const labels = groups.get(attribute.kind) || new Set<string>();
    labels.add(attribute.label);
    groups.set(attribute.kind, labels);
    attributeLabels.set(requirementNodeId, groups);
  };

  for (const edge of analysis.graph.edges) {
    if (edge.kind === 'conflicts_with') {
      if (!requirementByNode.has(edge.source) || !requirementByNode.has(edge.target)) continue;
      conflicts.set(edge.source, (conflicts.get(edge.source) || 0) + 1);
      conflicts.set(edge.target, (conflicts.get(edge.target) || 0) + 1);
      relations.push({ id: edge.id, source: edge.source, target: edge.target });
      continue;
    }

    if (edge.kind === 'depends_on') {
      if (!requirementByNode.has(edge.source) || !requirementByNode.has(edge.target)) continue;
      dependencies.set(edge.source, (dependencies.get(edge.source) || 0) + 1);
      const targetNode = nodeById.get(edge.target);
      const targetRecord = targetNode?.requirementId
        ? requirementById.get(targetNode.requirementId)
        : undefined;
      const targetCode = targetRecord?.requirementCode || targetNode?.label.split(' · ')[0];
      if (targetCode) {
        const set = dependsOn.get(edge.source) || new Set<string>();
        set.add(targetCode);
        dependsOn.set(edge.source, set);
      }
      continue;
    }

    const sourceIsRequirement = requirementByNode.has(edge.source);
    const targetIsRequirement = requirementByNode.has(edge.target);
    if (sourceIsRequirement && !targetIsRequirement) {
      addAttribute(edge.source, edge.target);
    } else if (!sourceIsRequirement && targetIsRequirement) {
      addAttribute(edge.target, edge.source);
    }
  }

  const cards: GraphCard[] = [];
  for (const node of analysis.graph.nodes) {
    if (node.kind !== 'requirement') continue;
    const record = node.requirementId ? requirementById.get(node.requirementId) : undefined;
    const [labelCode, ...labelRest] = node.label.split(' · ');
    const groups = attributeLabels.get(node.id);
    const chips: GraphChipGroup[] = [];

    for (const kind of CHIP_ORDER) {
      const labels = groups?.get(kind);
      if (!labels?.size) continue;
      const all = [...labels];
      const meta = CHIP_META[kind];
      chips.push({
        kind,
        label: meta.label,
        color: meta.color,
        items: all.slice(0, MAX_CHIPS),
        total: all.length,
      });
    }

    const needs = [...(dependsOn.get(node.id) || [])];
    const conflictCount = conflicts.get(node.id) || 0;
    const dependencyCount = dependencies.get(node.id) || 0;
    const rows = chips.length + (needs.length ? 1 : 0);

    cards.push({
      id: node.id,
      code: record?.requirementCode || labelCode || node.label,
      text: record?.originalText || labelRest.join(' · ') || node.label,
      chips,
      dependsOn: needs,
      conflicts: conflictCount,
      dependencies: dependencyCount,
      height: cardHeight(rows),
    });
  }

  const columns = cards.length <= 2 ? Math.max(cards.length, 1) : cards.length <= 8 ? 3 : 4;
  const positions = new Map<string, GraphCardBox>();
  let rowY = 0;
  let rowHeight = 0;

  cards.forEach((card, index) => {
    const column = index % columns;
    if (column === 0 && index > 0) {
      rowY += rowHeight + CARD_GAP_Y;
      rowHeight = 0;
    }
    positions.set(card.id, { x: column * (CARD_WIDTH + CARD_GAP_X), y: rowY, w: CARD_WIDTH, h: card.height });
    rowHeight = Math.max(rowHeight, card.height);
  });

  const width = columns * CARD_WIDTH + Math.max(0, columns - 1) * CARD_GAP_X;
  const height = cards.length ? rowY + rowHeight : 0;

  return { cards, relations, positions, columns, width, height };
}
