-- =============================================================
-- Important flag: an optional attention marker for To-do items.
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- items.important defaults false, so every existing row is unflagged and
-- nothing changes visibly until someone toggles it. Same shape as
-- now_serving (008): a plain boolean the UI reads and writes.
--
-- Backward-compatible and safe to run against production before the code
-- ships — a false default is inert. RLS and both integrity triggers are
-- unaffected: they read family_id / person_id / contact_id, never this
-- column, and the authenticated grant has no column list.

alter table public.items add column if not exists important boolean not null default false;
