-- ─────────────────────────────────────────────────────────────
-- Glowe Play — memories (uploaded content that completes a badge)
-- Run ONCE in Supabase → SQL Editor, after schema.sql + badges.sql.
-- Safe to re-run.
--
-- Child content (photos, voice, drawings, video, written answers) is
-- PRIVATE: stored in a non-public bucket and readable only by the family
-- that owns the child, enforced by row-level security.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.memories (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.children (id) on delete cascade,
  badge_id   text not null,
  kind       text not null check (kind in ('photo','video','voice','drawing','text')),
  url        text,        -- storage path (files) — bucket 'memories'
  content    text,        -- written answers
  created_at timestamptz not null default now()
);
create index if not exists memories_child_badge_idx on public.memories (child_id, badge_id);

alter table public.memories enable row level security;

drop policy if exists memories_select on public.memories;
drop policy if exists memories_insert on public.memories;
drop policy if exists memories_delete on public.memories;

create policy memories_select on public.memories for select using (
  exists (select 1 from public.children c where c.id = child_id and c.owner = auth.uid()));
create policy memories_insert on public.memories for insert with check (
  exists (select 1 from public.children c where c.id = child_id and c.owner = auth.uid()));
create policy memories_delete on public.memories for delete using (
  exists (select 1 from public.children c where c.id = child_id and c.owner = auth.uid()));

-- ── Private storage bucket for uploaded files ────────────────
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

-- Files live at:  <child_id>/<badge_id>/<file>
-- Access is granted only when the first path segment is a child you own.
drop policy if exists "memories read own"   on storage.objects;
drop policy if exists "memories insert own" on storage.objects;
drop policy if exists "memories delete own" on storage.objects;

create policy "memories read own" on storage.objects for select to authenticated using (
  bucket_id = 'memories' and exists (
    select 1 from public.children c where c.id::text = split_part(storage.objects.name, '/', 1) and c.owner = auth.uid()));
create policy "memories insert own" on storage.objects for insert to authenticated with check (
  bucket_id = 'memories' and exists (
    select 1 from public.children c where c.id::text = split_part(storage.objects.name, '/', 1) and c.owner = auth.uid()));
create policy "memories delete own" on storage.objects for delete to authenticated using (
  bucket_id = 'memories' and exists (
    select 1 from public.children c where c.id::text = split_part(storage.objects.name, '/', 1) and c.owner = auth.uid()));

notify pgrst, 'reload schema';
