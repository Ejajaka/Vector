import { useEffect, useMemo, useState } from 'react';
import type { ActiveTab } from '../types/analysis.ts';
import { useProject } from '../context/ProjectContext.tsx';
import { TEMPLATES } from '../data/templates.ts';
import { historyStorage } from '../services/historyStorage.ts';
import { listDesignSystems } from '../services/designSystems.ts';
import { listRequirements } from '../services/documents/requirementDocuments.ts';

export type VocabKind =
  | 'project'
  | 'requirement'
  | 'prompt'
  | 'template'
  | 'design'
  | 'page'
  | 'element'
  | 'file'
  | 'history';

export interface VocabItem {
  value: string;
  kind: VocabKind;
  detail?: string;
  tab?: ActiveTab;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

/**
 * Vocabulary that belongs to the workspace and the selected project only.
 * It deliberately excludes generic web or model vocabulary: every suggestion
 * comes from a project record, a canvas, a prompt, a requirement, a design
 * system, a template or local analysis history.
 */
export function useProjectVocabulary(): VocabItem[] {
  const { projects, currentProject } = useProject();
  const [requirements, setRequirements] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    setRequirements([]);
    if (!currentProject) return;
    listRequirements(currentProject.id)
      .then((rows) => {
        if (!active) return;
        setRequirements(
          rows.flatMap((row) => [row.requirementCode, row.originalText, row.normalizedText]).map(clean).filter(Boolean)
        );
      })
      .catch(() => {
        // Local mode or an offline workspace has no requirement rows to suggest.
      });
    return () => {
      active = false;
    };
  }, [currentProject?.id]);

  return useMemo(() => {
    const out: VocabItem[] = [];
    const add = (value: string, kind: VocabKind, detail?: string, tab?: ActiveTab) => {
      const text = clean(value);
      if (text.length < 2 || text.length > 140) return;
      out.push({ value: text, kind, detail, tab });
    };

    projects.forEach((project) => {
      add(project.name, 'project', project.description || 'Project', 'projects');
      if (project.description) add(project.description, 'project', 'Project description', 'projects');
    });

    if (currentProject) {
      const doc = readJson<{ pages?: Array<{ name?: string; items?: Array<{ label?: string; texts?: Record<string, string> }> }> }>(
        `vector_project_doc_${currentProject.id}`
      );
      doc?.pages?.forEach((page) => {
        add(page.name || '', 'page', 'Canvas page', 'editor');
        page.items?.forEach((item) => {
          add(item.label || '', 'element', 'Canvas element', 'editor');
          Object.values(item.texts || {}).forEach((text) => add(text, 'element', 'Element text', 'editor'));
        });
      });

      const draft = readJson<{ text?: string; submitted?: string; answers?: Record<string, string> }>(
        `vector_project_prompt_${currentProject.id}`
      );
      [draft?.text, draft?.submitted, ...Object.values(draft?.answers || {})].forEach((text) =>
        add(text || '', 'prompt', 'Prompt draft', 'prompt')
      );

      const revised = readJson<{ prompt?: string }>(`vector_project_revised_prompt_${currentProject.id}`);
      add(revised?.prompt || '', 'prompt', 'Revised prompt', 'prompt');

      const files = readJson<Array<{ name?: string }>>(`vector_project_files_${currentProject.id}`) || [];
      files.forEach((file) => add(file.name || '', 'file', 'Project file', 'library'));
    }

    requirements.forEach((text) => add(text, 'requirement', 'Requirement', 'requirements'));

    listDesignSystems().forEach((system) => {
      add(system.name, 'design', 'Design system', 'design');
      add(system.note || '', 'design', 'Design system note', 'design');
    });

    historyStorage.getAll(currentProject?.id).forEach((item) => {
      add(item.prompt, 'history', 'Analysis prompt', 'history');
      item.resources.forEach((resource) => add(resource.label, 'history', 'Analysis resource', 'history'));
    });

    TEMPLATES.forEach((template) => {
      add(template.name, 'template', 'Template', 'templates');
      add(template.tagline, 'template', 'Template tagline', 'templates');
      template.tags.forEach((tag) => add(tag, 'template', 'Template tag', 'templates'));
    });

    const seen = new Set<string>();
    return out.filter((item) => {
      const key = item.value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 500);
  }, [projects, currentProject, requirements]);
}
