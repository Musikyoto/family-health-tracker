-- =============================================================
-- Attach the person_in_family integrity guard to meds (see migration 005).
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- Reuses public.check_person_in_family() from migration 005: a med's person_id
-- must belong to the med's family_id.

create trigger meds_person_in_family
  before insert or update on public.meds
  for each row execute function public.check_person_in_family();
