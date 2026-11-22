-- Shared canvas docs for link-based collaboration.
-- The room id is the capability in the share link; signed-in users can read
-- and edit that room. Owners keep their normal project canvas locally.

create table if not exists public.shared_project_docs (
  room text primary key,
  owner_id uuid references auth.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null default 'Shared screen',
  pages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists shared_project_docs_project_idx
  on public.shared_project_docs(project_id);

alter table public.shared_project_docs enable row level security;

drop policy if exists "shared_project_docs_read" on public.shared_project_docs;
create policy "shared_project_docs_read"
  on public.shared_project_docs for select
  to authenticated
  using (true);

drop policy if exists "shared_project_docs_insert" on public.shared_project_docs;
create policy "shared_project_docs_insert"
  on public.shared_project_docs for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "shared_project_docs_update" on public.shared_project_docs;
create policy "shared_project_docs_update"
  on public.shared_project_docs for update
  to authenticated
  using (true)
  with check (auth.uid() is not null);

drop policy if exists "shared_project_docs_delete" on public.shared_project_docs;
create policy "shared_project_docs_delete"
  on public.shared_project_docs for delete
  to authenticated
  using (auth.uid() is not null);

grant select, insert, update, delete on public.shared_project_docs to authenticated;
