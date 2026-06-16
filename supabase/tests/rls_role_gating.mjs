// Role-gating RLS test (step 8): a VIEWER member of a family can READ its data
// but cannot WRITE it; an editor can. This complements rls_cross_family.mjs
// (which covers non-members) by exercising the is_editor predicate within a
// single family. Probes run through each user's real anon-key session.
//
// Reuses the two test users from .env.local: A = editor, B joins A's family as
// a viewer (via the family's viewer invite). Run: node supabase/tests/rls_role_gating.mjs
// Exit: 0 all-pass · 1 gating failure · 2 setup/harness error

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

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
    process.exit(2)
  }
  return { client: c, userId: data.user.id }
}

async function main() {
  console.log('\nRole-gating RLS test (viewer is read-only)\n' + '='.repeat(44))
  const a = await signIn('A (editor)', env.RLS_TEST_A_EMAIL, env.RLS_TEST_A_PASSWORD)
  const b = await signIn('B (viewer)', env.RLS_TEST_B_EMAIL, env.RLS_TEST_B_PASSWORD)
  const A = a.client, B = b.client

  let family

  try {
    // ── setup: A creates a family, seeds data, B joins it as a viewer ──
    ;({ data: family } = await A.rpc('create_family', { p_name: 'Role Gating', p_display_name: 'Editor A' }).throwOnError())
    const { data: { id: personP } } = await A.from('people')
      .insert({ family_id: family, name: 'Person P', color: 'amber' }).select('id').single().throwOnError()
    const { data: { id: itemI } } = await A.from('items')
      .insert({ family_id: family, person_id: personP, type: 'Appointment', title: 'Appt', date: '2026-06-20' })
      .select('id').single().throwOnError()
    const { data: { id: medM } } = await A.from('meds')
      .insert({ family_id: family, person_id: personP, name: 'Med M' }).select('id').single().throwOnError()
    const { data: { id: contactC } } = await A.from('contacts')
      .insert({ family_id: family, name: 'Dr Contact', specialty: 'GP', phones: [{ label: 'Clinic', number: '0123' }] }).select('id').single().throwOnError()

    const { data: invite } = await A.from('invites')
      .select('code').eq('family_id', family).eq('role', 'viewer').eq('revoked', false).single().throwOnError()
    const { data: joined } = await B.rpc('join_family', { p_code: invite.code, p_display_name: 'Viewer B' }).throwOnError()
    check('B joined the family as a viewer', joined?.role === 'viewer', `role=${joined?.role}`)

    // ── viewer CAN read (is_member) ──
    console.log('\nViewer can READ family data (must succeed):')
    for (const [tbl, id] of [['people', personP], ['items', itemI], ['meds', medM], ['contacts', contactC]]) {
      const { data, error } = await B.from(tbl).select('*').eq('id', id)
      check(`viewer can SELECT ${tbl}`, !error && data?.length === 1, error ? 'error: ' + error.message : '')
    }

    // ── viewer CANNOT write (is_editor gate) ──
    console.log('\nViewer is blocked from WRITES:')
    // INSERT → rejected (WITH CHECK is_editor)
    for (const [tbl, row] of [
      ['people', { family_id: family, name: 'V-insert', color: 'blue' }],
      ['items', { family_id: family, person_id: personP, type: 'Appointment', title: 'V', date: '2026-06-21' }],
      ['meds', { family_id: family, person_id: personP, name: 'V-med' }],
      ['contacts', { family_id: family, name: 'V-contact' }],
    ]) {
      const { error } = await B.from(tbl).insert(row).select()
      check(`viewer cannot INSERT a ${tbl.replace(/s$/, '')}`, !!error, error ? '' : 'INSERT was ACCEPTED')
    }
    // UPDATE → 0 rows, no error; editor confirms the value is untouched
    {
      const { data, error } = await B.from('people').update({ name: 'HACKED' }).eq('id', personP).select()
      check('viewer cannot UPDATE a person (0 rows)', !error && data?.length === 0,
        error ? 'unexpected error: ' + error.message : (data?.length ? 'MODIFIED a row' : ''))
      const { data: after } = await A.from('people').select('name').eq('id', personP).single()
      check("person value unchanged after viewer's update attempt", after?.name === 'Person P', `name="${after?.name}"`)
    }
    // DELETE → 0 rows, no error; editor confirms the row still exists
    {
      const { data, error } = await B.from('meds').delete().eq('id', medM).select()
      check('viewer cannot DELETE a med (0 rows)', !error && data?.length === 0,
        error ? 'unexpected error: ' + error.message : (data?.length ? 'DELETED a row' : ''))
      const { data: still } = await A.from('meds').select('id').eq('id', medM)
      check('med still exists after viewer delete attempt', still?.length === 1)
    }
    // contacts: viewer can't UPDATE or DELETE (is_editor gate → 0 rows)
    {
      const { data, error } = await B.from('contacts').update({ name: 'HACKED' }).eq('id', contactC).select()
      check('viewer cannot UPDATE a contact (0 rows)', !error && data?.length === 0,
        error ? 'unexpected error: ' + error.message : (data?.length ? 'MODIFIED a row' : ''))
      const { data: del, error: delErr } = await B.from('contacts').delete().eq('id', contactC).select()
      check('viewer cannot DELETE a contact (0 rows)', !delErr && del?.length === 0,
        delErr ? 'unexpected error: ' + delErr.message : (del?.length ? 'DELETED a row' : ''))
      const { data: c } = await A.from('contacts').select('name').eq('id', contactC).single()
      check("contact unchanged + present after viewer's attempts", c?.name === 'Dr Contact', `name="${c?.name}"`)
    }

    // ── the worst case: viewer must not be able to make itself an editor ──
    // memberships UPDATE policy is `using (is_editor(family_id))`, so a viewer
    // is filtered out of the update scope → 0 rows. (A viewer DELETEing another
    // member's row is blocked by the same is_editor branch of the DELETE policy.)
    console.log('\nViewer cannot self-escalate (membership role change):')
    {
      const { data, error } = await B.from('memberships')
        .update({ role: 'editor' }).eq('family_id', family).eq('user_id', b.userId).select()
      check('viewer cannot UPDATE own membership to editor (0 rows)', !error && data?.length === 0,
        error ? 'unexpected error: ' + error.message : (data?.length ? 'ESCALATED to editor' : ''))
      const { data: m } = await A.from('memberships')
        .select('role').eq('family_id', family).eq('user_id', b.userId).single()
      check("viewer's role is still 'viewer' after the attempt", m?.role === 'viewer', `role=${m?.role}`)
    }

    // ── editor positive control: A CAN write ──
    console.log('\nEditor can WRITE (positive control):')
    {
      const { data, error } = await A.from('people').update({ name: 'Person P (edited)' }).eq('id', personP).select()
      check('editor CAN update a person', !error && data?.length === 1, error ? 'error: ' + error.message : '')
    }
  } finally {
    try { await A.from('families').delete().eq('created_by', a.userId) } catch { /* best effort */ }
    await A.auth.signOut(); await B.auth.signOut()
  }

  console.log('\n' + '='.repeat(44))
  if (failures === 0) {
    console.log('✓ ALL CHECKS PASSED — viewers are read-only, editors can write.\n')
    process.exit(0)
  }
  console.log(`✗ ${failures} CHECK(S) FAILED — role gating is NOT secure.\n`)
  process.exit(1)
}

main().catch((e) => { console.error('\nHarness error:', e.message); process.exit(2) })
