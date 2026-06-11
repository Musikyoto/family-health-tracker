-- =============================================================
-- Security hardening: pin search_path on the existing functions
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- No behaviour change. SECURITY DEFINER functions with a mutable search_path
-- are a known privilege-escalation vector (Supabase's linter flags it as
-- "Function Search Path Mutable"). All four functions already fully qualify
-- their references (public.*, auth.*) and otherwise use only pg_catalog
-- built-ins, so pinning search_path to '' is safe and changes no behaviour.
-- regenerate_invite (migration 003) already ships with this set.

alter function public.is_member(uuid)            set search_path = '';
alter function public.is_editor(uuid)            set search_path = '';
alter function public.create_family(text, text)  set search_path = '';
alter function public.join_family(text, text)    set search_path = '';
