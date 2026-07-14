// Cross-family RLS isolation test (the gate for step 4 §3).
//
// Proves a member of family B cannot read or write family A's data — even with
// A's exact row IDs. Every probe runs through each user's real authenticated
// session via the ANON key (the actual PostgREST + RLS path). service_role is
// never used: it bypasses RLS and would make every check falsely pass.
//
// One-time setup — create two DEDICATED, confirmed users in Supabase
//   Authentication → Users → Add user   (tick "Auto Confirm User")
// then add to .env.local (gitignored; NOT VITE_ vars):
//   RLS_TEST_A_EMAIL=...     RLS_TEST_A_PASSWORD=...
//   RLS_TEST_B_EMAIL=...     RLS_TEST_B_PASSWORD=...
//
// Run:  node supabase/tests/rls_cross_family.mjs
// Exit: 0 all-pass · 1 RLS failure (NOT secure) · 2 setup/harness error

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// ── load .env.local from the project root ──
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const env = {}
try {
  for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
    if (line.trim().startsWith('#')) continue
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
} catch {
  console.error('Could not read .env.local at the project root.')
  process.exit(2)
}

const required = [
  'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY',
  'RLS_TEST_A_EMAIL', 'RLS_TEST_A_PASSWORD',
  'RLS_TEST_B_EMAIL', 'RLS_TEST_B_PASSWORD',
]
const missing = required.filter((k) => !env[k])
if (missing.length) {
  console.error('Missing in .env.local: ' + missing.join(', '))
  process.exit(2)
}

const makeClient = () =>
  createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
  if (!ok) failures++
}

async function signIn(label, email, password) {
  const c = makeClient()
  const { data, error } = await c.auth.signInWithPassword({ email, password })
  if (error || !data?.session) {
    console.error(`Could not sign in test user ${label} (${email}): ${error?.message || 'no session'}.`)
    console.error('Create it in Authentication → Users → Add user with "Auto Confirm User" ticked.')
    process.exit(2)
  }
  return { client: c, userId: data.user.id }
}

async function main() {
  console.log('\nCross-family RLS isolation test\n' + '='.repeat(42))
  const a = await signIn('A', env.RLS_TEST_A_EMAIL, env.RLS_TEST_A_PASSWORD)
  const b = await signIn('B', env.RLS_TEST_B_EMAIL, env.RLS_TEST_B_PASSWORD)
  const A = a.client, B = b.client

  let familyA, familyB, personA, personB, itemA, medA, contactA

  try {
    // ── setup: each user creates their own family via the real RPC ──
    ;({ data: familyA } = await A.rpc('create_family', { p_name: 'RLS Test A', p_display_name: 'A' }).throwOnError())
    ;({ data: familyB } = await B.rpc('create_family', { p_name: 'RLS Test B', p_display_name: 'B' }).throwOnError())

    // ── seed family A with one person/item/med (as A, its editor) ──
    ;({ data: { id: personA } } = await A.from('people')
      .insert({ family_id: familyA, name: 'Dad A', color: 'amber' }).select('id').single().throwOnError())
    ;({ data: { id: itemA } } = await A.from('items')
      .insert({ family_id: familyA, person_id: personA, type: 'Appointment', title: 'Secret A appointment', date: '2026-06-15' })
      .select('id').single().throwOnError())
    ;({ data: { id: medA } } = await A.from('meds')
      .insert({ family_id: familyA, person_id: personA, name: 'Secret A med' }).select('id').single().throwOnError())
    ;({ data: { id: personB } } = await B.from('people')
      .insert({ family_id: familyB, name: 'Mum B', color: 'blue' }).select('id').single().throwOnError())
    ;({ data: { id: contactA } } = await A.from('contacts')
      .insert({ family_id: familyA, name: 'Secret A contact', phones: [{ label: 'Clinic', location: 'St Lukes', number: '0123' }], now_serving: true }).select('id').single().throwOnError())

    console.log(`\nSetup: family A=${familyA.slice(0, 8)} · family B=${familyB.slice(0, 8)}`)
    console.log(`A's rows — person ${personA.slice(0, 8)} · item ${itemA.slice(0, 8)} · med ${medA.slice(0, 8)}\n`)

    // ── positive controls: same IDs must be visible to A, and B's own session works ──
    console.log('Positive controls (must SUCCEED — proves the probes are meaningful):')
    for (const [tbl, id] of [['people', personA], ['items', itemA], ['meds', medA], ['contacts', contactA]]) {
      const { data, error } = await A.from(tbl).select('*').eq('id', id)
      check(`A can read its own ${tbl} row by id`, !error && data?.length === 1,
        error ? 'error: ' + error.message : '')
    }
    {
      const { data } = await B.from('families').select('*').eq('id', familyB)
      check('B can read its OWN family (session valid; RLS not blanket-denying)', data?.length === 1)
    }

    // ── the gate: B must not touch A's people/items/meds by exact id ──
    console.log("\nIsolation — B against A's exact IDs (must all hold):")

    // SELECT → 0 rows, no error
    for (const [tbl, id] of [['people', personA], ['items', itemA], ['meds', medA], ['contacts', contactA]]) {
      const { data, error } = await B.from(tbl).select('*').eq('id', id)
      check(`B cannot SELECT A's ${tbl} row`, !error && data?.length === 0,
        error ? 'unexpected error: ' + error.message : (data?.length ? `LEAKED ${data.length} row(s)` : ''))
    }

    // UPDATE → 0 rows, no error; then confirm A's value is untouched
    {
      const { data, error } = await B.from('people').update({ name: 'HACKED' }).eq('id', personA).select()
      check("B cannot UPDATE A's person (0 rows affected)", !error && data?.length === 0,
        error ? 'unexpected error: ' + error.message : (data?.length ? 'MODIFIED a row' : ''))
      const { data: after } = await A.from('people').select('name').eq('id', personA).single()
      check("A's person value unchanged after B's update attempt", after?.name === 'Dad A',
        after ? `name is now "${after.name}"` : 'row missing')
    }

    // DELETE → 0 rows, no error; then confirm A's row still present
    {
      const { data, error } = await B.from('people').delete().eq('id', personA).select()
      check("B cannot DELETE A's person (0 rows affected)", !error && data?.length === 0,
        error ? 'unexpected error: ' + error.message : (data?.length ? 'DELETED a row' : ''))
      const { data: still } = await A.from('people').select('id').eq('id', personA)
      check("A's person still exists after B's delete attempt", still?.length === 1)
    }

    // INSERT into A's family → must be rejected (WITH CHECK violation)
    {
      const { data, error } = await B.from('people').insert({ family_id: familyA, name: 'B-injected', color: 'blue' }).select()
      check("B cannot INSERT into A's family (blocked)", !!error,
        error ? '' : `INSERTED row ${data?.[0]?.id?.slice(0, 8)}`)
    }

    // contacts (the new table): same isolation must hold across all verbs
    {
      const { data: u, error: ue } = await B.from('contacts').update({ name: 'HACKED' }).eq('id', contactA).select()
      check("B cannot UPDATE A's contact (0 rows)", !ue && u?.length === 0,
        ue ? 'unexpected error: ' + ue.message : (u?.length ? 'MODIFIED' : ''))
      const { data: d, error: de } = await B.from('contacts').delete().eq('id', contactA).select()
      check("B cannot DELETE A's contact (0 rows)", !de && d?.length === 0,
        de ? 'unexpected error: ' + de.message : (d?.length ? 'DELETED' : ''))
      const { error: ie } = await B.from('contacts').insert({ family_id: familyA, name: 'B-injected contact' }).select()
      check("B cannot INSERT a contact into A's family (blocked)", !!ie, ie ? '' : 'INSERTED')
      const { data: still } = await A.from('contacts').select('id').eq('id', contactA)
      check("A's contact still exists after B's attempts", still?.length === 1)
    }

    // ── access-control write paths: the invariants the whole model rests on ──
    console.log('\nAccess-control write paths (B against A — the linchpins):')
    // Self-insert a membership into A's family. memberships has NO insert policy,
    // so RLS must default-deny. If this ever succeeds, B joins A as editor.
    {
      const { data, error } = await B.from('memberships')
        .insert({ family_id: familyA, user_id: b.userId, role: 'editor', display_name: 'B' }).select()
      check("B cannot self-insert a membership into A's family", !!error,
        error ? '' : 'SELF-JOINED AS EDITOR — TOTAL BREACH')
    }
    // Regenerate A's invites via the RPC — gated on is_editor(p_family_id).
    {
      const { error } = await B.rpc('regenerate_invite', { p_family_id: familyA, p_role: 'editor' })
      check("B cannot regenerate A's invites via RPC", !!error,
        error ? '' : 'MINTED an invite into A')
    }

    // ── bonus: family / membership / invite metadata isolation ──
    console.log('\nBonus — metadata isolation (B against A):')
    {
      const { data, error } = await B.from('families').select('*').eq('id', familyA)
      check("B cannot SELECT A's family row", !error && data?.length === 0)
    }
    {
      const { data, error } = await B.from('memberships').select('*').eq('family_id', familyA)
      check("B cannot SELECT A's memberships", !error && data?.length === 0)
    }
    {
      const { data, error } = await B.from('invites').select('*').eq('family_id', familyA)
      check("B cannot enumerate A's invites", !error && data?.length === 0)
    }

    // ── referential integrity: an item's person must be in the item's family ──
    console.log('\nReferential integrity (person_in_family guard):')
    {
      // A is an editor of family A, so RLS permits the insert into family A;
      // the guard must still reject it because personA... belongs to B's family.
      const { error } = await A.from('items')
        .insert({ family_id: familyA, person_id: personB, type: 'Appointment', title: 'x-family', date: '2026-06-20' })
        .select()
      check("A cannot create an item in family A referencing B's person", !!error,
        error ? '' : 'CROSS-FAMILY person_id was ACCEPTED')
    }
    {
      const { error } = await A.from('meds')
        .insert({ family_id: familyA, person_id: personB, name: 'x-family med' })
        .select()
      check("A cannot create a med in family A referencing B's person", !!error,
        error ? '' : 'CROSS-FAMILY person_id was ACCEPTED')
    }
    // B reassigning its own membership into family A (cross-family injection).
    // Postgres uses USING as the implicit WITH CHECK for UPDATE, so
    // is_editor(new.family_id = A) should reject this.
    {
      const { data: bm } = await B.from('memberships').select('id').eq('family_id', familyB).eq('user_id', b.userId).single()
      const { data, error } = await B.from('memberships').update({ family_id: familyA }).eq('id', bm.id).select()
      const injected = !error && (data?.length ?? 0) > 0
      if (injected) { try { await B.from('memberships').update({ family_id: familyB }).eq('id', bm.id) } catch { /* may fail post-injection */ } }
      check("B cannot reassign its membership into family A", !injected, injected ? 'INJECTED into family A' : '')
    }
  } finally {
    // ── cleanup: each user deletes every family it owns (covers leftovers) ──
    try { await A.from('families').delete().eq('created_by', a.userId) } catch { /* best effort */ }
    try { await B.from('families').delete().eq('created_by', b.userId) } catch { /* best effort */ }
    await A.auth.signOut(); await B.auth.signOut()
  }

  console.log('\n' + '='.repeat(42))
  if (failures === 0) {
    console.log('✓ ALL CHECKS PASSED — family B is fully isolated from family A.\n')
    process.exit(0)
  }
  console.log(`✗ ${failures} CHECK(S) FAILED — RLS isolation is NOT secure. Do not proceed.\n`)
  process.exit(1)
}

main().catch((e) => { console.error('\nHarness error:', e.message); process.exit(2) })
