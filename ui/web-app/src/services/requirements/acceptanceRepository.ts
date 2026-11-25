import type {
  AcceptanceCriterion,
  AcceptanceCriterionRow,
  RequirementSuggestion,
  SuggestionStatus,
} from '../../types/requirements.ts';
import { supabase } from '../supabase/client.ts';
import { loadProjectMemory, saveProjectMemory } from '../projectMemory.ts';

const SUGGESTIONS_KEY = 'requirement_suggestions';
const LOCAL_SUGGESTIONS_KEY = 'vector_requirement_suggestions_v1';
const LOCAL_CRITERIA_KEY = 'vector_acceptance_criteria_v1';

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Local mode is best effort.
  }
}

function mapCriterion(row: AcceptanceCriterionRow, requirementCode: string): AcceptanceCriterion {
  return {
    id: row.id,
    projectId: row.project_id,
    requirementId: row.requirement_id,
    requirementCode,
    given: row.given_text,
    when: row.when_text,
    then: row.then_text,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
  };
}

export async function loadSuggestions(projectId: string): Promise<RequirementSuggestion[]> {
  if (!supabase) {
    return readLocal<RequirementSuggestion>(`${LOCAL_SUGGESTIONS_KEY}_${projectId}`);
  }
  return loadProjectMemory<RequirementSuggestion[]>(projectId, SUGGESTIONS_KEY, []);
}

export async function saveSuggestions(projectId: string, suggestions: RequirementSuggestion[]): Promise<void> {
  if (!supabase) {
    writeLocal(`${LOCAL_SUGGESTIONS_KEY}_${projectId}`, suggestions);
    return;
  }
  await saveProjectMemory(projectId, SUGGESTIONS_KEY, suggestions);
}

export async function updateSuggestionStatus(
  projectId: string,
  suggestions: RequirementSuggestion[],
  suggestionId: string,
  status: SuggestionStatus,
): Promise<RequirementSuggestion[]> {
  const next = suggestions.map((suggestion) =>
    suggestion.id === suggestionId ? { ...suggestion, status } : suggestion
  );
  await saveSuggestions(projectId, next);
  return next;
}

export async function updateSuggestionStatuses(
  projectId: string,
  suggestions: RequirementSuggestion[],
  suggestionIds: string[],
  status: SuggestionStatus,
): Promise<RequirementSuggestion[]> {
  const ids = new Set(suggestionIds);
  const next = suggestions.map((suggestion) =>
    ids.has(suggestion.id) ? { ...suggestion, status } : suggestion
  );
  await saveSuggestions(projectId, next);
  return next;
}

export async function listAcceptanceCriteria(
  projectId: string,
  requirementCodes: Map<string, string>,
): Promise<AcceptanceCriterion[]> {
  if (!supabase) {
    return readLocal<AcceptanceCriterion>(`${LOCAL_CRITERIA_KEY}_${projectId}`).filter(
      (criterion) => criterion.projectId === projectId,
    );
  }
  const { data, error } = await supabase
    .from('acceptance_criteria')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapCriterion(row as AcceptanceCriterionRow, requirementCodes.get(row.requirement_id) || ''));
}

export async function ensureAcceptanceCriteria(
  projectId: string,
  criteria: AcceptanceCriterion[],
): Promise<AcceptanceCriterion[]> {
  if (!criteria.length) return criteria;
  if (!supabase) {
    const key = `${LOCAL_CRITERIA_KEY}_${projectId}`;
    const existing = readLocal<AcceptanceCriterion>(key);
    const ids = new Set(existing.map((criterion) => criterion.id));
    const merged = [...existing, ...criteria.filter((criterion) => !ids.has(criterion.id))];
    writeLocal(key, merged);
    return criteria;
  }
  const { data: existing, error: existingError } = await supabase
    .from('acceptance_criteria')
    .select('id')
    .eq('project_id', projectId);
  if (existingError) throw new Error(existingError.message);
  const existingIds = new Set((existing || []).map((row) => row.id));
  const missing = criteria.filter((criterion) => !existingIds.has(criterion.id));
  if (missing.length) {
    const rows = missing.map((criterion) => ({
      id: criterion.id,
      project_id: projectId,
      requirement_id: criterion.requirementId,
      given_text: criterion.given,
      when_text: criterion.when,
      then_text: criterion.then,
      status: criterion.status,
      source: criterion.source,
    }));
    for (let index = 0; index < rows.length; index += 200) {
      const { error } = await supabase.from('acceptance_criteria').insert(rows.slice(index, index + 200));
      if (error) throw new Error(error.message);
    }
  }
  return [...criteria];
}

export async function updateAcceptanceStatus(
  criterionId: string,
  status: AcceptanceCriterion['status'],
): Promise<void> {
  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index);
    if (!storageKey?.startsWith(LOCAL_CRITERIA_KEY)) continue;
    const items = readLocal<AcceptanceCriterion>(storageKey);
    if (!items.some((criterion) => criterion.id === criterionId)) continue;
    writeLocal(
      storageKey,
      items.map((criterion) => (criterion.id === criterionId ? { ...criterion, status } : criterion)),
    );
  }
  if (!supabase) return;
  const { error } = await supabase
    .from('acceptance_criteria')
    .update({ status })
    .eq('id', criterionId);
  if (error) throw new Error(error.message);
}

export async function updateAcceptanceStatuses(
  criterionIds: string[],
  status: AcceptanceCriterion['status'],
): Promise<void> {
  if (!criterionIds.length) return;
  const ids = new Set(criterionIds);
  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index);
    if (!storageKey?.startsWith(LOCAL_CRITERIA_KEY)) continue;
    const items = readLocal<AcceptanceCriterion>(storageKey);
    if (!items.some((criterion) => ids.has(criterion.id))) continue;
    writeLocal(
      storageKey,
      items.map((criterion) => (ids.has(criterion.id) ? { ...criterion, status } : criterion)),
    );
  }
  if (!supabase) return;
  for (let index = 0; index < criterionIds.length; index += 100) {
    const { error } = await supabase
      .from('acceptance_criteria')
      .update({ status })
      .in('id', criterionIds.slice(index, index + 100));
    if (error) throw new Error(error.message);
  }
}
