-- =============================================================
-- Referential-integrity guard: an item/med's person must belong to the
-- same family as the item/med itself.
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- The RLS WITH CHECK on items/meds validates family_id (is_editor) but not that
-- person_id points at a person IN that family — so without this an editor could
-- attach a row to a person from another family. A CHECK constraint can't do a
-- cross-row lookup, so we use a trigger. SECURITY DEFINER + search_path='' so it
-- validates the real relationship regardless of the caller's RLS visibility
-- (and never leaks data — it only raises). Reused for meds in step 7.

create or replace function public.check_person_in_family()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.people p
    where p.id = new.person_id and p.family_id = new.family_id
  ) then
    raise exception 'person_id % is not a member of family %', new.person_id, new.family_id;
  end if;
  return new;
end;
$$;

create trigger items_person_in_family
  before insert or update on public.items
  for each row execute function public.check_person_in_family();
