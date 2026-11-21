import type { CanvasPage } from '../data/canvas.ts';
import { isSupabaseConfigured, supabase } from './supabase/client.ts';

export interface SharedDoc {
  name: string;
  pages: CanvasPage[];
  ownerId?: string | null;
  projectId?: string | null;
}

/**
 * Shared project documents live in Supabase so a collaborator's edits are
 * still there when the project holder opens the project later.
 *
 * The room id is the capability in the share link. RLS allows authenticated
 * users to read/write the row; the app additionally requires Pro before it
 * opens a shared room.
 */
export async function loadSharedDoc(room: string): Promise<SharedDoc | null> {
  if (!isSupabaseConfigured || !supabase || !room) return null;
  const { data, error } = await supabase
    .from('shared_project_docs')
    .select('name, pages, owner_id, project_id')
    .eq('room', room)
    .maybeSingle();
  if (error || !data) return null;
  const pages = Array.isArray(data.pages) ? (data.pages as CanvasPage[]) : [];
  if (!pages.length) return null;
  return {
    name: String(data.name || 'Shared screen'),
    pages,
    ownerId: data.owner_id || null,
    projectId: data.project_id || null,
  };
}

export async function saveSharedDoc(
  room: string,
  doc: SharedDoc,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !room) return;
  await supabase.from('shared_project_docs').upsert(
    {
      room,
      owner_id: doc.ownerId || null,
      project_id: doc.projectId || null,
      name: doc.name,
      pages: doc.pages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'room' },
  );
}
