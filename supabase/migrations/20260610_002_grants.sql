-- =============================================================
-- Table privileges for the API roles
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- RLS is and stays ENABLED on every table. These GRANTs are orthogonal to RLS:
--   • GRANT = table-level capability (may this role touch the table at all?)
--   • RLS policy = row-level gate (which rows may it touch?)
-- PostgREST checks the GRANT first and returns 42501 "permission denied for
-- table" before RLS is evaluated — which is the 403 we hit. Granting does NOT
-- weaken isolation: the policies from migration 001 remain the enforcer.
--
-- We grant to `authenticated` ONLY (not `anon`). The app requires a login for
-- all data access, so the anon role needs no table privileges at all.
--
-- Note on memberships: INSERT is granted but there is intentionally NO insert
-- POLICY on memberships, so direct client inserts are still denied by RLS —
-- membership creation only happens through the SECURITY DEFINER RPCs.

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.families,
  public.memberships,
  public.people,
  public.items,
  public.meds,
  public.invites
to authenticated;
