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
// sides (array of { label, url, kind }). contact_id optionally links a
// doctor from contacts — reads embed the contact and route it through
// contactFromRow, so its phones pass the same phoneFromJson shim.
// created_at rides along so the To-do tab can surface the longest-waiting
// unscheduled item first; date is nullable (015) = "not scheduled yet".
const ITEM_COLS = 'id, person_id, type, title, date, time, description, refs, contact_id, created_at, important, contact:contacts(id, name, specialty, phones, now_serving)'
const itemFromRow = (r) => ({
  id: r.id, personId: r.person_id, type: r.type, title: r.title,
  date: r.date ?? null, time: r.time ?? '', description: r.description ?? '', refs: r.refs ?? [],
  contactId: r.contact_id ?? null, createdAt: r.created_at, important: r.important ?? false,
  contact: r.contact ? contactFromRow(r.contact) : null,
})
const itemFields = (it) => ({
  person_id: it.personId, type: it.type, title: it.title,
  // guard the column boundary: '' is not a valid date, null is "not scheduled"
  date: it.date || null,
  time: it.time, description: it.description, refs: it.refs,
  contact_id: it.contactId ?? null, important: !!it.important,
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

// ── Meds ─────────────────────────────────────────────────────────────
// times is text[] both sides (subset of Morning/Noon/Evening).
const MED_COLS = 'id, person_id, name, dose, times, food, note'
const medFromRow = (r) => ({
  id: r.id, personId: r.person_id, name: r.name, dose: r.dose ?? '',
  times: r.times ?? [], food: r.food ?? 'none', note: r.note ?? '',
})
const medFields = (m) => ({
  person_id: m.personId, name: m.name, dose: m.dose,
  times: m.times, food: m.food, note: m.note,
})

export async function listMeds(familyId) {
  const { data, error } = await supabase
    .from('meds')
    .select(MED_COLS)
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(medFromRow)
}

export async function createMed(familyId, med) {
  const { data, error } = await supabase
    .from('meds')
    .insert({ family_id: familyId, ...medFields(med) })
    .select(MED_COLS)
    .single()
  if (error) throw error
  return medFromRow(data)
}

export async function updateMed(id, med) {
  const { data, error } = await supabase
    .from('meds')
    .update(medFields(med)) // family_id is immutable — not updated
    .eq('id', id)
    .select(MED_COLS)
    .single()
  if (error) throw error
  return medFromRow(data)
}

export async function deleteMed(id) {
  const { error } = await supabase.from('meds').delete().eq('id', id)
  if (error) throw error
}

// ── Contacts ─────────────────────────────────────────────────────────
// Flat family-shared list (not person-linked). phones is a jsonb list of
// { label, location, number, schedules: [{ days, hours }] } — location and
// schedules are per-phone, and one number can hold several day/hour pairs
// (same clinic, different hours on different days).
//
// Backward-compat read: before schedules, a phone carried a single flat
// { days, hours } — surface that as schedules[0]. The form only writes the
// new shape, so old entries upgrade on their next save. Normalizing here
// means the card and form never see the old shape.
const phoneFromJson = (p) => ({
  label: p.label ?? '', location: p.location ?? '', number: p.number ?? '',
  schedules: Array.isArray(p.schedules)
    ? p.schedules.map((s) => ({ days: s?.days ?? [], hours: s?.hours ?? '' }))
    : (p.days?.length || (p.hours ?? '').trim()
        ? [{ days: p.days ?? [], hours: p.hours ?? '' }]
        : []),
})
const CONTACT_COLS = 'id, name, specialty, phones, now_serving'
const contactFromRow = (r) => ({
  id: r.id, name: r.name, specialty: r.specialty ?? '',
  phones: (r.phones ?? []).map(phoneFromJson), nowServing: r.now_serving ?? false,
})
const contactFields = (c) => ({
  name: c.name, specialty: c.specialty, phones: c.phones, now_serving: !!c.nowServing,
})

export async function listContacts(familyId) {
  const { data, error } = await supabase
    .from('contacts')
    .select(CONTACT_COLS)
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(contactFromRow)
}

export async function createContact(familyId, contact) {
  const { data, error } = await supabase
    .from('contacts')
    .insert({ family_id: familyId, ...contactFields(contact) })
    .select(CONTACT_COLS)
    .single()
  if (error) throw error
  return contactFromRow(data)
}

export async function updateContact(id, contact) {
  const { data, error } = await supabase
    .from('contacts')
    .update(contactFields(contact)) // family_id is immutable
    .eq('id', id)
    .select(CONTACT_COLS)
    .single()
  if (error) throw error
  return contactFromRow(data)
}

export async function deleteContact(id) {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw error
}
