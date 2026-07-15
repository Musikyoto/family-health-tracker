-- =============================================================
-- Keep-alive: a no-op RPC for the daily GitHub Actions ping.
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- Supabase's free tier pauses projects after ~7 idle days — which would
-- take the app down for the whole family. A scheduled GitHub Actions
-- workflow (.github/workflows/keepalive.yml) POSTs
-- /rest/v1/rpc/keepalive once a day so the project always counts as
-- active.
--
-- Safe to expose to anon: the function returns only now() — no table
-- access, no arguments, stable — so an unauthenticated caller learns
-- nothing but the server clock. This is deliberately the only surface
-- intended for anonymous callers: every table grant is
-- authenticated-only (002), and every other RPC requires an
-- authenticated uid to do anything.

create or replace function public.keepalive()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

grant execute on function public.keepalive() to anon;
