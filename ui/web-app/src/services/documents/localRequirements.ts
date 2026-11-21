import type {
  RequirementDocument,
  RequirementPriority,
  RequirementRecord,
  RequirementStatus,
} from '../../types/requirements.ts';

const DOCS_KEY = 'vector_requirement_documents_v1';
const REQS_KEY = 'vector_requirements_v1';

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Local mode is best effort.
  }
}

export function listLocalDocuments(projectId: string): RequirementDocument[] {
  return read<RequirementDocument>(DOCS_KEY)
    .filter((document) => document.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function listLocalRequirements(projectId: string): RequirementRecord[] {
  return read<RequirementRecord>(REQS_KEY)
    .filter((requirement) => requirement.projectId === projectId)
    .sort((a, b) => a.requirementCode.localeCompare(b.requirementCode));
}

export function saveLocalDocument(document: RequirementDocument): void {
  const all = read<RequirementDocument>(DOCS_KEY).filter((entry) => entry.id !== document.id);
  write(DOCS_KEY, [document, ...all]);
}

export function saveLocalRequirements(projectId: string, requirements: RequirementRecord[]): void {
  const all = read<RequirementRecord>(REQS_KEY).filter((entry) => entry.projectId !== projectId);
  write(REQS_KEY, [...all, ...requirements]);
}

export function removeLocalDocument(projectId: string, documentId: string): void {
  write(
    DOCS_KEY,
    read<RequirementDocument>(DOCS_KEY).filter(
      (document) => !(document.projectId === projectId && document.id === documentId),
    ),
  );
  write(
    REQS_KEY,
    read<RequirementRecord>(REQS_KEY).filter(
      (requirement) => !(requirement.projectId === projectId && requirement.documentId === documentId),
    ),
  );
}

export function updateLocalRequirementStatus(
  projectId: string,
  requirementIds: string[],
  status: RequirementStatus,
): void {
  const ids = new Set(requirementIds);
  const all = read<RequirementRecord>(REQS_KEY).map((requirement) =>
    requirement.projectId === projectId && ids.has(requirement.id)
      ? { ...requirement, status }
      : requirement,
  );
  write(REQS_KEY, all);
}

export function updateLocalRequirementPriorities(
  projectId: string,
  requirements: Array<{ id: string; priority: RequirementPriority; priorityReason: string }>,
): void {
  const byId = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  const all = read<RequirementRecord>(REQS_KEY).map((requirement) => {
    if (requirement.projectId !== projectId) return requirement;
    const next = byId.get(requirement.id);
    return next
      ? { ...requirement, priority: next.priority, priorityReason: next.priorityReason }
      : requirement;
  });
  write(REQS_KEY, all);
}
