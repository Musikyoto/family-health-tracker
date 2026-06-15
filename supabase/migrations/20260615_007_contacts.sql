-- =============================================================
-- contacts: a flat, family-shared list of medical contacts (doctors, clinics).
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- NOT person-linked (no person_id), so there is no person_in_family guard.
-- RLS follows the same pattern as people/items/meds: members read, editors
-- write. phones is a jsonb list of { label, number }.

create table public.contacts (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  name       text not null,
  specialty  text,
  phones     jsonb not null default '[]',
  location   text,
  created_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

create policy "contacts: members can select"
  on public.contacts for select
  using (public.is_member(family_id));

create policy "contacts: editors can insert"
  on public.contacts for insert
  with check (public.is_editor(family_id));

create policy "contacts: editors can update"
  on public.contacts for update
  using (public.is_editor(family_id));

create policy "contacts: editors can delete"
  on public.contacts for delete
  using (public.is_editor(family_id));

grant select, insert, update, delete on public.contacts to authenticated;
