import { supabase } from './supabase.js'

// Thin data layer between the Supabase tables (snake_case) and the camelCase
// shapes the UI already uses. Step 4 covers families / memberships / invites;
// people / items / meds are added in later steps.

// ── Memberships ──────────────────────────────────────────────────────
// The families the current user belongs to, with their role in each.
export async function getMyMemberships() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('memberships')
    .select('family_id, role, display_name, families(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((m) => ({
    familyId: m.family_id,
    role: m.role,
    displayName: m.display_name,
    familyName: m.families?.name ?? '',
  }))
}

// ── Bootstrap RPCs (membership creation is controlled server-side) ───
export async function createFamily(name, displayName) {
  const { data, error } = await supabase.rpc('create_family', {
    p_name: name,
    p_display_name: displayName,
  })
  if (error) throw error
  return data // family id (uuid)
}

export async function joinFamily(code, displayName) {
  const { data, error } = await supabase.rpc('join_family', {
    p_code: code,
    p_display_name: displayName,
  })
  if (error) throw error
  return { familyId: data.family_id, role: data.role }
}

// ── Invites ──────────────────────────────────────────────────────────
// The active (non-revoked) invites for a family, grouped by role.
// One active invite per role is expected → returns { editor?, viewer? }.
export async function listInvites(familyId) {
  const { data, error } = await supabase
    .from('invites')
    .select('id, code, role, created_at')
    .eq('family_id', familyId)
    .eq('revoked', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  const byRole = {}
  for (const inv of data ?? []) if (!byRole[inv.role]) byRole[inv.role] = inv
  return byRole
}

// Revoke the active invite of this role and mint a fresh one (server-side RPC).
export async function regenerateInvite(familyId, role) {
  const { data, error } = await supabase.rpc('regenerate_invite', {
    p_family_id: familyId,
    p_role: role,
  })
  if (error) throw error
  return data // the new code string
}

// ── People ───────────────────────────────────────────────────────────
// people columns (id, name, color) already match the UI shape — no mapping.
export async function listPeople(familyId) {
  const { data, error } = await supabase
    .from('people')
    .select('id, name, color')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createPerson(familyId, { name, color }) {
  const { data, error } = await supabase
    .from('people')
    .insert({ family_id: familyId, name, color })
    .select('id, name, color')
    .single()
  if (error) throw error
  return data
}

export async function updatePerson(id, { name, color }) {
  const { data, error } = await supabase
    .from('people')
    .update({ name, color })
    .eq('id', id)
    .select('id, name, color')
    .single()
  if (error) throw error
  return data
}

export async function deletePerson(id) {
  const { error } = await supabase.from('people').delete().eq('id', id)
  if (error) throw error
}

// ── Items (calendar) ─────────────────────────────────────────────────
// Map snake_case row ↔ the camelCase shape the UI uses. refs is jsonb both
// sides (array of { label, url, kind }).
const ITEM_COLS = 'id, person_id, type, title, date, time, description, refs'
const itemFromRow = (r) => ({
  id: r.id, personId: r.person_id, type: r.type, title: r.title,
  date: r.date, time: r.time ?? '', description: r.description ?? '', refs: r.refs ?? [],
})
const itemFields = (it) => ({
  person_id: it.personId, type: it.type, title: it.title,
  date: it.date, time: it.time, description: it.description, refs: it.refs,
})

export async function listItems(familyId) {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_COLS)
    .eq('family_id', familyId)
    .order('date', { ascending: true })
  if (error) throw error
  return (data ?? []).map(itemFromRow)
}

export async function createItem(familyId, item) {
  const { data, error } = await supabase
    .from('items')
    .insert({ family_id: familyId, ...itemFields(item) })
    .select(ITEM_COLS)
    .single()
  if (error) throw error
  return itemFromRow(data)
}

export async function updateItem(id, item) {
  const { data, error } = await supabase
    .from('items')
    .update(itemFields(item)) // family_id is immutable — not updated
    .eq('id', id)
    .select(ITEM_COLS)
    .single()
  if (error) throw error
  return itemFromRow(data)
}

export async function deleteItem(id) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw error
}
