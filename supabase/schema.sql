-- ─────────────────────────────────────────────────────────────
-- Glowe Play — core schema
-- Run this ONCE in Supabase → SQL Editor → New query → Run.
-- Safe to re-run (uses "if not exists" / "drop policy if exists").
-- ─────────────────────────────────────────────────────────────

-- One row per child. Belongs to the family account (auth user) that created it.
create table if not exists public.children (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  birthdate  date,
  created_at timestamptz not null default now()
);
create index if not exists children_owner_idx on public.children (owner);

-- Per-child badge progress. The badge catalog itself lives in the app (js/app.js);
-- here we only store each child's status for a given badge_id.
create table if not exists public.child_badges (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.children (id) on delete cascade,
  badge_id   text not null,
  status     text not null default 'new' check (status in ('new','progress','earned')),
  updated_at timestamptz not null default now(),
  unique (child_id, badge_id)
);
create index if not exists child_badges_child_idx on public.child_badges (child_id);

-- ── Row Level Security ───────────────────────────────────────
alter table public.children     enable row level security;
alter table public.child_badges enable row level security;

-- children: a user can only see/modify their own children
drop policy if exists children_select on public.children;
drop policy if exists children_insert on public.children;
drop policy if exists children_update on public.children;
drop policy if exists children_delete on public.children;

create policy children_select on public.children
  for select using (auth.uid() = owner);
create policy children_insert on public.children
  for insert with check (auth.uid() = owner);
create policy children_update on public.children
  for update using (auth.uid() = owner) with check (auth.uid() = owner);
create policy children_delete on public.children
  for delete using (auth.uid() = owner);

-- child_badges: access only if the parent child row belongs to you
drop policy if exists child_badges_select on public.child_badges;
drop policy if exists child_badges_insert on public.child_badges;
drop policy if exists child_badges_update on public.child_badges;
drop policy if exists child_badges_delete on public.child_badges;

create policy child_badges_select on public.child_badges
  for select using (exists (
    select 1 from public.children c where c.id = child_id and c.owner = auth.uid()));
create policy child_badges_insert on public.child_badges
  for insert with check (exists (
    select 1 from public.children c where c.id = child_id and c.owner = auth.uid()));
create policy child_badges_update on public.child_badges
  for update using (exists (
    select 1 from public.children c where c.id = child_id and c.owner = auth.uid()));
create policy child_badges_delete on public.child_badges
  for delete using (exists (
    select 1 from public.children c where c.id = child_id and c.owner = auth.uid()));
