import { describe, expect, it } from 'vitest';
import { buildGraphModel, CARD_WIDTH } from './graphLayout.ts';
import type { RequirementAnalysisResult } from '../../types/requirementIntelligence.ts';
import type { RequirementRecord } from '../../types/requirements.ts';

function requirement(id: string, code: string, text: string): RequirementRecord {
  return {
    id,
    projectId: 'project-1',
    documentId: null,
    requirementCode: code,
    originalText: text,
    normalizedText: text.toLowerCase(),
    kind: 'functional',
    sourcePage: 1,
    sourceParagraph: 1,
    sourceCharStart: 0,
    sourceCharEnd: text.length,
    metadata: { screens: [], components: [], roles: [], behaviours: [] },
    status: 'pending_review',
    priority: 'medium',
    priorityReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

const analysis: RequirementAnalysisResult = {
  requirements: [
    requirement('1', 'REQ-001', 'Employees must sign in before opening a profile.'),
    requirement('2', 'REQ-002', 'Managers must approve profile changes.'),
  ],
  graph: {
    nodes: [
      { id: 'req:1', kind: 'requirement', label: 'REQ-001 · Employees must sign in', requirementId: '1' },
      { id: 'req:2', kind: 'requirement', label: 'REQ-002 · Managers must approve', requirementId: '2' },
      { id: 'screen:profile', kind: 'screen', label: 'Profile' },
      { id: 'component:button', kind: 'component', label: 'Approve button' },
      { id: 'role:manager', kind: 'role', label: 'Manager' },
    ],
    edges: [
      { id: 'e1', source: 'req:1', target: 'screen:profile', kind: 'belongs_to', label: 'belongs to' },
      { id: 'e2', source: 'component:button', target: 'req:2', kind: 'implements', label: 'implements' },
      { id: 'e3', source: 'req:2', target: 'role:manager', kind: 'related_to', label: 'applies to' },
      { id: 'e4', source: 'req:2', target: 'req:1', kind: 'depends_on', label: 'depends on' },
      { id: 'e5', source: 'req:1', target: 'req:2', kind: 'conflicts_with', label: 'conflicts with' },
    ],
  },
  findings: [],
  cycles: [],
  generatedAt: '2026-01-01T00:00:00.000Z',
};

describe('graph layout', () => {
  it('turns attribute nodes into chips on their requirement card', () => {
    const model = buildGraphModel(analysis);
    expect(model.cards).toHaveLength(2);
    const first = model.cards.find((card) => card.code === 'REQ-001')!;
    expect(first.chips.map((group) => group.kind)).toEqual(['screen']);
    expect(first.chips[0].items).toEqual(['Profile']);
  });

  it('keeps only conflicts as relation lines and moves dependencies onto the card', () => {
    const model = buildGraphModel(analysis);
    expect(model.relations).toHaveLength(1);
    expect(model.relations[0].source).toBe('req:1');
    expect(model.relations[0].target).toBe('req:2');
    const second = model.cards.find((card) => card.code === 'REQ-002')!;
    expect(second.dependsOn).toEqual(['REQ-001']);
    expect(second.conflicts).toBe(1);
    expect(second.dependencies).toBe(1);
  });

  it('assigns every card a box inside the board', () => {
    const model = buildGraphModel(analysis);
    for (const card of model.cards) {
      const box = model.positions.get(card.id);
      expect(box).toBeDefined();
      expect(box!.w).toBe(CARD_WIDTH);
      expect(box!.x + box!.w).toBeLessThanOrEqual(model.width);
      expect(box!.y + box!.h).toBeLessThanOrEqual(model.height);
    }
  });
});
