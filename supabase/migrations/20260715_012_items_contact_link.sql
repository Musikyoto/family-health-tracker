-- =============================================================
-- Items → contacts link: optional doctor on an appointment/test/bill.
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- items.contact_id is nullable (no backfill) and ON DELETE SET NULL:
-- deleting a contact unlinks it from items rather than deleting them.
-- (The SET NULL update itself re-fires the trigger with a null value,
-- which passes the null short-circuit.)
--
-- RLS: NO policy changes. The items policies are family-scoped
-- (is_member/is_editor on family_id) and column-agnostic, and the table
-- grant to `authenticated` has no column list — contact_id inherits both.
-- What RLS alone can't stop is an editor of family A pointing an item at
-- family B's contact (WITH CHECK validates family_id, not what contact_id
-- references) — that cross-family hole is closed by the trigger below,
-- mirroring check_person_in_family (005): SECURITY DEFINER +
-- search_path = '' so it validates the real relationship regardless of
-- the caller's RLS visibility, and never leaks (it only raises).

alter table public.items
  add column if not exists contact_id uuid references public.contacts(id) on delete set null;

create or replace function public.check_contact_in_family()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.contact_id is not null and not exists (
    select 1 from public.contacts c
    where c.id = new.contact_id and c.family_id = new.family_id
  ) then
    raise exception 'contact_id % is not in family %', new.contact_id, new.family_id;
  end if;
  return new;
end;
$$;

drop trigger if exists items_contact_in_family on public.items;
create trigger items_contact_in_family
  before insert or update on public.items
  for each row execute function public.check_contact_in_family();
