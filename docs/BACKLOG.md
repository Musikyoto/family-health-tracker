# Backlog

Future work captured during the Supabase backend build.

## Members management screen (next feature after deploy)

**Why.** There is currently no way to revoke an existing member's access.
Invite regeneration only stops the old code/link from being used to *join* — it
does not touch anyone who has already joined. So once someone is a member, they
keep access indefinitely. (Confirmed in testing: account B, already a member,
retained access after account A regenerated the invites and B signed out/in.)

**What.**
- A "Members" entry in Settings (editor-only) listing each member with their
  display name and role (editor / viewer).
- Remove a member → deletes their `memberships` row, which ends their access
  (RLS keys off membership).
- Optional: change a member's role (viewer ↔ editor).

**RLS / implementation notes.**
- Removal already works against existing policy: `memberships` DELETE is
  `using (is_editor(family_id) or user_id = auth.uid())`, so an editor can
  delete any member of their family — no schema change needed.
- Role change needs a `memberships` UPDATE path. The UPDATE policy is
  `using (is_editor(family_id))` with **no WITH CHECK**; if role-change is
  exposed to the client, add a WITH CHECK to constrain what an editor may set
  (e.g. keep `family_id`/`user_id` fixed, role in ('editor','viewer')).
- Guard against removing or demoting the **last editor** of a family (lockout).
- A removed member's session stays valid until it refreshes; their next query
  returns nothing (RLS) — acceptable, but note it.

## Also noted (smaller)
- ESLint currently fails on ~9 pre-existing errors (components defined in
  render, an unused import, a non-component export) — spun off as a separate
  cleanup task. `npm run lint` should pass once done.
- After the Supabase swap, `src/lib/data.js` still exports `seedData`,
  `emptyData`, `peopleOnlyData`, and `uid`, now unused (only `TODAY_ISO` is
  imported). Trim them.
