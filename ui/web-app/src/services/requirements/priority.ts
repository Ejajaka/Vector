import type { RequirementPriority, RequirementRecord } from '../../types/requirements.ts';
import { supabase } from '../supabase/client.ts';
import { updateLocalRequirementPriorities } from '../documents/localRequirements.ts';

export interface PriorityResult {
  priority: RequirementPriority;
  reason: string;
}

export function classifyRequirementPriority(requirement: RequirementRecord): PriorityResult {
  const text = requirement.normalizedText.toLowerCase();
  if (/\b(payment|checkout|billing|password|authentication|login|authorization|permission|security|privacy|accessibility|audit)\b/.test(text)) {
    return {
      priority: 'critical',
      reason: 'Security, money, access-control or accessibility impact makes this a critical requirement.',
    };
  }
  if (/\b(customers?|employees?|users?)\b/.test(text) && /\b(must|shall|required|need)\b/.test(text)) {
    return {
      priority: 'high',
      reason: 'It is a mandatory user-facing flow with direct business impact.',
    };
  }
  if (requirement.kind === 'functional' && (requirement.metadata.components || []).length > 0) {
    return {
      priority: 'high',
      reason: 'It describes a core functional interaction on a named component.',
    };
  }
  if (requirement.kind === 'non_functional') {
    return {
      priority: 'medium',
      reason: 'It is a quality or system constraint that supports the functional flows.',
    };
  }
  if (/\b(colou?r|spacing|font|shadow|rounded|cosmetic|style)\b/.test(text)) {
    return {
      priority: 'low',
      reason: 'It primarily affects visual polish rather than a user or business-critical flow.',
    };
  }
  return {
    priority: 'medium',
    reason: 'It supports the interface but has no explicit criticality signal.',
  };
}

export async function applyRequirementPriorities(
  projectId: string,
  requirements: RequirementRecord[],
): Promise<RequirementRecord[]> {
  const classified = requirements.map((requirement) => {
    const result = classifyRequirementPriority(requirement);
    return { ...requirement, priority: result.priority, priorityReason: result.reason };
  });

  updateLocalRequirementPriorities(
    projectId,
    classified.map((requirement) => ({
      id: requirement.id,
      priority: requirement.priority,
      priorityReason: requirement.priorityReason || '',
    })),
  );

  if (supabase) {
    // Group identical decisions so a 300-requirement document costs a handful
    // of requests instead of one round-trip per requirement.
    const groups = new Map<string, { priority: RequirementRecord['priority']; reason: string; ids: string[] }>();
    for (const requirement of classified) {
      const reason = requirement.priorityReason || '';
      const key = `${requirement.priority}|${reason}`;
      const group = groups.get(key) || { priority: requirement.priority, reason, ids: [] };
      group.ids.push(requirement.id);
      groups.set(key, group);
    }
    for (const group of groups.values()) {
      for (let index = 0; index < group.ids.length; index += 100) {
        const { error } = await supabase
          .from('requirements')
          .update({ priority: group.priority, priority_reason: group.reason })
          .in('id', group.ids.slice(index, index + 100))
          .eq('project_id', projectId);
        if (error) throw new Error(error.message);
      }
    }
  }
  return classified;
}
