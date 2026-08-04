// Add/Edit forms — Calendar item (Form A) + Medication (Form B). SPEC §9.
// Converted from the design export to ES modules.
import React from 'react';
import { T, FOOD_LABEL, safeArea } from '../lib/theme.js';
import { todayIso, DAYS, sortDays } from '../lib/data.js';
import { Icon } from '../components/Icon.jsx';
import { Field, TextInput, TextArea, Pill, PersonPicker, GhostButton, inputStyle } from '../components/ui.jsx';

function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}
function to24(display) {
  if (!display) return '';
  const m = display.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return '';
  let h = parseInt(m[1]); const min = m[2]; const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

function FormBar({ title, onCancel, onSave, canSave }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${safeArea.top(58, 14)} 16px 12px`, position: 'sticky', top: 0, zIndex: 20, background: 'linear-gradient(180deg, #E6F2EC 60%, rgba(230,242,236,0) 100%)' }}>
      <button onClick={onCancel} className="tap" style={{ border: 'none', background: 'transparent', color: T.body, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 4px', minHeight: 44 }}>Cancel</button>
      <span style={{ fontSize: 16, fontWeight: 700, color: T.deep }}>{title}</span>
      <button onClick={canSave ? onSave : undefined} className="tap" style={{
        border: 'none', borderRadius: 999, padding: '9px 18px', minHeight: 44, cursor: canSave ? 'pointer' : 'default', fontFamily: 'inherit',
        background: canSave ? T.accent : T.fieldBg, color: canSave ? '#fff' : T.muted, fontSize: 15, fontWeight: 700,
        boxShadow: canSave ? '0 4px 12px rgba(31,169,160,0.30)' : 'none',
      }}>Save</button>
    </div>
  );
}

// ── Form A: Calendar item ────────────────────────────────────────────
// 'Test' was retired in migration 014 — a test is an appointment, and the
// title/description carry the specifics. Any non-base type (including a
// straggler 'Test') still round-trips via the custom-chip path below.
const BASE_TYPES = ['Appointment', 'Bill'];

// `todo` renders the creation variant used by the To-do tab: no date/time and
// no type chips (an unbooked item is always an Appointment). Editing always
// uses the full form, so a to-do can be scheduled by picking a date.
export function CalendarForm({ people, contacts = [], initial, todo = false, onSave, onCancel, onDelete }) {
  const editing = !!initial;
  const [personId, setPersonId] = React.useState(initial?.personId || people[0]?.id || null);
  const [type, setType] = React.useState(initial?.type || 'Appointment');
  const [customType, setCustomType] = React.useState(BASE_TYPES.includes(initial?.type) ? '' : (initial?.type || ''));
  const [showCustom, setShowCustom] = React.useState(false);
  const [title, setTitle] = React.useState(initial?.title || '');
  // A new item defaults to today; an existing one keeps its own date — and a
  // null date (a To-do) must stay empty. `??` not `||`, or opening a To-do in
  // the edit form would silently prefill today and schedule it on save.
  const [date, setDate] = React.useState(() => (initial ? (initial.date ?? '') : todayIso()));
  const [time, setTime] = React.useState(to24(initial?.time || ''));
  const [contactId, setContactId] = React.useState(initial?.contactId || null);
  const [tentative, setTentative] = React.useState(initial?.tentative || false);
  const [description, setDescription] = React.useState(initial?.description || '');
  const [refs, setRefs] = React.useState(initial?.refs?.length ? initial.refs.map(r => ({ ...r })) : []);

  const canSave = !!personId && title.trim().length > 0;
  const save = () => onSave({
    id: initial?.id, personId, type, title: title.trim(),
    date: date || null, // cleared date => null => the item moves to To-do
    time: formatTime(time),
    contactId: contactId || null,
    tentative,
    description: description.trim(), refs: refs.filter(r => r.label.trim() || r.url.trim()),
  });

  const allTypes = [...BASE_TYPES, ...(customType && !BASE_TYPES.includes(customType) ? [customType] : [])];

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: safeArea.bottom(50) }}>
      <FormBar title={editing ? 'Edit item' : (todo ? 'New to-do' : 'New item')} onCancel={onCancel} onSave={save} canSave={canSave} />
      <div style={{ padding: '8px 16px 0' }}>
        <Field label="WHO IS IT FOR">
          <PersonPicker people={people} value={personId} onChange={setPersonId} />
        </Field>

        {!todo && <Field label="TYPE">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {allTypes.map((t) => <Pill key={t} label={t} active={type === t} onClick={() => setType(t)} />)}
            <Pill label="Custom" icon="plus" active={false} onClick={() => setShowCustom((s) => !s)} />
          </div>
          {showCustom && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <TextInput value={customType} onChange={setCustomType} placeholder="Custom type name" />
              <button onClick={() => { if (customType.trim()) { setType(customType.trim()); setShowCustom(false); } }}
                style={{ border: 'none', borderRadius: 14, padding: '0 18px', background: T.accent, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15 }}>Add</button>
            </div>
          )}
        </Field>}

        <Field label="TITLE">
          <TextInput value={title} onChange={setTitle} placeholder="e.g. Cardiology review" />
        </Field>

        {!todo && (
          <>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Field label="DATE"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, paddingRight: 8 }} /></Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="TIME"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inputStyle, paddingRight: 8 }} /></Field>
              </div>
            </div>
            {editing && !date && (
              <div style={{ fontSize: 13, color: T.tealDeep, fontWeight: 500, margin: '-6px 2px 16px' }}>
                Pick a date to move this to the Calendar.
              </div>
            )}
          </>
        )}

        <Field label="STATUS">
          <button type="button" onClick={() => setTentative((v) => !v)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
            borderRadius: 14, background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: tentative ? T.flag : '#fff', border: tentative ? 'none' : `2px solid ${T.faint}`,
            }}>
              {tentative && <Icon name="check" size={15} color="#fff" strokeWidth={2.8} />}
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: T.deep }}>Mark as tentative</span>
          </button>
        </Field>

        <Field label="DOCTOR (OPTIONAL)" hint="From your Contacts.">
          <select value={contactId || ''} onChange={(e) => setContactId(e.target.value || null)} style={{ ...inputStyle, paddingRight: 8 }}>
            <option value="">None</option>
            {[...contacts].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.specialty ? ` — ${c.specialty}` : ''}</option>
            ))}
          </select>
        </Field>

        <Field label="DESCRIPTION">
          <TextArea value={description} onChange={setDescription} placeholder="Notes, prep instructions, location…" rows={3} />
        </Field>

        <Field label="REFERENCES & DOCUMENTS" hint="Links only — the app doesn't host files. Paste a Drive or Photos link.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {refs.map((r, i) => (
              <div key={i} style={{ background: T.card, borderRadius: 16, padding: 12, boxShadow: T.shadowSoft, position: 'relative' }}>
                <button onClick={() => setRefs(refs.filter((_, j) => j !== i))} aria-label="Remove link" style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', border: 'none', background: T.fieldBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <Icon name="close" size={14} color={T.body} strokeWidth={2} />
                </button>
                <input value={r.label} placeholder="Label (e.g. Referral letter)" onChange={(e) => { const n = [...refs]; n[i] = { ...r, label: e.target.value }; setRefs(n); }} style={{ ...inputStyle, height: 42, marginBottom: 8, paddingRight: 34 }} />
                <input value={r.url} placeholder="Paste link…" onChange={(e) => { const n = [...refs]; n[i] = { ...r, url: e.target.value, kind: /\.(jpg|jpeg|png|heic|gif)/i.test(e.target.value) ? 'image' : 'doc' }; setRefs(n); }} style={{ ...inputStyle, height: 42 }} />
              </div>
            ))}
            <button onClick={() => setRefs([...refs, { label: '', url: '', kind: 'doc' }])} style={{ height: 46, borderRadius: 14, border: `1px dashed ${T.fieldBorder}`, background: T.fieldBg, color: T.accentSolid, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="plus" size={17} color={T.accentSolid} strokeWidth={2.2} /> Add a link
            </button>
          </div>
        </Field>

        {editing && (
          <div style={{ marginTop: 8 }}>
            <GhostButton danger onClick={onDelete}><Icon name="trash" size={18} color={T.red} strokeWidth={1.9} /> Delete item</GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form B: Medication ───────────────────────────────────────────────
export function MedForm({ people, initial, onSave, onCancel, onDelete }) {
  const editing = !!initial;
  const [personId, setPersonId] = React.useState(initial?.personId || people[0]?.id || null);
  const [name, setName] = React.useState(initial?.name || '');
  const [dose, setDose] = React.useState(initial?.dose || '');
  const [times, setTimes] = React.useState(initial?.times ? [...initial.times] : []);
  const [food, setFood] = React.useState(initial?.food || 'none');
  const [note, setNote] = React.useState(initial?.note || '');

  const toggleTime = (t) => setTimes((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);
  const canSave = !!personId && name.trim().length > 0 && times.length > 0;
  const save = () => onSave({ id: initial?.id, personId, name: name.trim(), dose: dose.trim(), times, food, note: note.trim() });

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: safeArea.bottom(50) }}>
      <FormBar title={editing ? 'Edit medication' : 'New medication'} onCancel={onCancel} onSave={save} canSave={canSave} />
      <div style={{ padding: '8px 16px 0' }}>
        <Field label="WHO IS IT FOR">
          <PersonPicker people={people} value={personId} onChange={setPersonId} />
        </Field>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1.4 }}><Field label="MEDICATION"><TextInput value={name} onChange={setName} placeholder="e.g. Metformin" /></Field></div>
          <div style={{ flex: 1 }}><Field label="DOSE"><TextInput value={dose} onChange={setDose} placeholder="500 mg" /></Field></div>
        </div>

        <Field label="WHEN TO TAKE" hint="Tap all that apply — it'll show in each section.">
          <div style={{ display: 'flex', gap: 8 }}>
            {[['Morning', 'sunrise'], ['Noon', 'sun'], ['Evening', 'moon']].map(([t, ic]) => (
              <div key={t} style={{ flex: 1 }}><Pill full label={t} icon={ic} active={times.includes(t)} onClick={() => toggleTime(t)} /></div>
            ))}
          </div>
        </Field>

        <Field label="FOOD">
          <div style={{ display: 'flex', gap: 8 }}>
            {[['with', 'With food'], ['without', 'Without'], ['none', 'No note']].map(([v, l]) => (
              <div key={v} style={{ flex: 1 }}><Pill full label={l} active={food === v} onClick={() => setFood(v)} /></div>
            ))}
          </div>
        </Field>

        <Field label="NOTE">
          <TextArea value={note} onChange={setNote} placeholder="e.g. take 30 min before eating, avoid dairy" rows={2} />
        </Field>

        {editing && (
          <div style={{ marginTop: 8 }}>
            <GhostButton danger onClick={onDelete}><Icon name="trash" size={18} color={T.red} strokeWidth={1.9} /> Delete medication</GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form C: Contact ──────────────────────────────────────────────────
// Seven compact tap-toggle chips for one schedule pair's days (canonical
// week order). Same interaction as the med time chips; selected = solid teal.
function DayChips({ value, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {DAYS.map((d) => {
        const on = value.includes(d);
        return (
          <button key={d} type="button" onClick={() => onToggle(d)} style={{
            flex: 1, height: 36, borderRadius: 10, padding: 0,
            border: on ? 'none' : `1px solid ${T.fieldBorder}`,
            background: on ? T.chipOn : T.fieldBg, color: on ? '#fff' : T.body,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>{d}</button>
        );
      })}
    </div>
  );
}

export function ContactForm({ initial, onSave, onCancel, onDelete }) {
  const editing = !!initial;
  const [name, setName] = React.useState(initial?.name || '');
  const [specialty, setSpecialty] = React.useState(initial?.specialty || '');
  const emptySchedule = () => ({ days: [], hours: '' });
  const [phones, setPhones] = React.useState(
    initial?.phones?.length
      ? initial.phones.map((p) => ({
          label: p.label || '', location: p.location || '', number: p.number || '',
          schedules: p.schedules?.length
            ? p.schedules.map((s) => ({ days: s.days ? [...s.days] : [], hours: s.hours || '' }))
            : [emptySchedule()], // one empty group shows by default
        }))
      : [{ label: '', location: '', number: '', schedules: [emptySchedule()] }]
  );
  const [nowServing, setNowServing] = React.useState(initial?.nowServing || false);

  const canSave = name.trim().length > 0;
  const setPhone = (i, patch) => setPhones((cur) => cur.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const setSchedules = (i, fn) => setPhones((cur) => cur.map((p, j) => (j === i ? { ...p, schedules: fn(p.schedules) } : p)));
  const setSchedule = (i, si, patch) => setSchedules(i, (list) => list.map((s, k) => (k === si ? { ...s, ...patch } : s)));
  const toggleScheduleDay = (i, si, d) => setSchedules(i, (list) => list.map((s, k) =>
    k === si ? { ...s, days: s.days.includes(d) ? s.days.filter((x) => x !== d) : [...s.days, d] } : s));
  const save = () => onSave({
    id: initial?.id,
    name: name.trim(),
    specialty: specialty.trim(),
    phones: phones
      .filter((p) => p.number.trim())
      .map((p) => ({
        label: p.label.trim(), location: p.location.trim(), number: p.number.trim(),
        schedules: p.schedules
          .map((s) => ({ days: sortDays(s.days), hours: s.hours.trim() })) // canonical week order regardless of tap order
          .filter((s) => s.days.length > 0 || s.hours), // drop empty pairs
      })),
    nowServing,
  });

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: safeArea.bottom(50) }}>
      <FormBar title={editing ? 'Edit contact' : 'New contact'} onCancel={onCancel} onSave={save} canSave={canSave} />
      <div style={{ padding: '8px 16px 0' }}>
        <Field label="NAME">
          <TextInput value={name} onChange={setName} placeholder="e.g. Dr. Okafor" />
        </Field>

        <Field label="SPECIALTY">
          <TextInput value={specialty} onChange={setSpecialty} placeholder="e.g. Cardiologist (optional)" />
        </Field>

        <Field label="ONLINE CONSULTS" hint="NowServing is a telehealth app — some doctors take online consults through it.">
          <button type="button" onClick={() => setNowServing((v) => !v)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
            borderRadius: 14, background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: nowServing ? T.accent : '#fff', border: nowServing ? 'none' : `2px solid ${T.faint}`,
            }}>
              {nowServing && <Icon name="check" size={15} color="#fff" strokeWidth={2.8} />}
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: T.deep }}>Available on NowServing</span>
          </button>
        </Field>

        <Field label="PHONE NUMBERS" hint="Add one or more. Each number can have its own label, location, and clinic schedule — e.g. a secretary at a specific hospital.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {phones.map((p, i) => (
              <div key={i} style={{ background: T.card, borderRadius: 16, padding: 12, boxShadow: T.shadowSoft, position: 'relative' }}>
                <button onClick={() => setPhones(phones.filter((_, j) => j !== i))} aria-label="Remove number" style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', border: 'none', background: T.fieldBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <Icon name="close" size={14} color={T.body} strokeWidth={2} />
                </button>
                <input value={p.label} placeholder="Label (optional, e.g. Miss Jo / Clinic)" onChange={(e) => setPhone(i, { label: e.target.value })} style={{ ...inputStyle, height: 42, marginBottom: 8, paddingRight: 34 }} />
                <input value={p.location} placeholder="Location (optional, e.g. St Luke's)" onChange={(e) => setPhone(i, { location: e.target.value })} style={{ ...inputStyle, height: 42, marginBottom: 8 }} />
                <input value={p.number} type="tel" placeholder="Phone number" onChange={(e) => setPhone(i, { number: e.target.value })} style={{ ...inputStyle, height: 42 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.5px', margin: '12px 2px 7px' }}>SCHEDULE AT THIS CLINIC</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.schedules.map((s, si) => (
                    <div key={si} style={si > 0 ? { borderTop: `1px solid ${T.hairline}`, paddingTop: 10 } : undefined}>
                      <DayChips value={s.days} onToggle={(d) => toggleScheduleDay(i, si, d)} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <input value={s.hours} placeholder="Hours (optional, e.g. 9:00 AM – 12:00 NN)" onChange={(e) => setSchedule(i, si, { hours: e.target.value })} style={{ ...inputStyle, height: 42, flex: 1, minWidth: 0 }} />
                        <button onClick={() => setSchedules(i, (list) => list.filter((_, k) => k !== si))} aria-label="Remove schedule" style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: T.fieldBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
                          <Icon name="close" size={14} color={T.body} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setSchedules(i, (list) => [...list, emptySchedule()])} style={{ height: 38, borderRadius: 12, border: `1px dashed ${T.fieldBorder}`, background: T.fieldBg, color: T.accentSolid, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Icon name="plus" size={15} color={T.accentSolid} strokeWidth={2.2} /> Add schedule
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => setPhones([...phones, { label: '', location: '', number: '', schedules: [emptySchedule()] }])} style={{ height: 46, borderRadius: 14, border: `1px dashed ${T.fieldBorder}`, background: T.fieldBg, color: T.accentSolid, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="plus" size={17} color={T.accentSolid} strokeWidth={2.2} /> Add a number
            </button>
          </div>
        </Field>

        {editing && (
          <div style={{ marginTop: 8 }}>
            <GhostButton danger onClick={onDelete}><Icon name="trash" size={18} color={T.red} strokeWidth={1.9} /> Delete contact</GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form D: Reference (past result / document) ───────────────────────
// A reference is an item with type 'Reference': person, title, an optional
// date, notes, and links. No time, type chips, doctor, or tentative toggle.
export function ReferenceForm({ people, initial, onSave, onCancel, onDelete }) {
  const editing = !!initial;
  const [personId, setPersonId] = React.useState(initial?.personId || people[0]?.id || null);
  const [title, setTitle] = React.useState(initial?.title || '');
  const [date, setDate] = React.useState(initial?.date ?? ''); // optional, empty by default
  const [description, setDescription] = React.useState(initial?.description || '');
  const [refs, setRefs] = React.useState(initial?.refs?.length ? initial.refs.map((r) => ({ ...r })) : []);

  const canSave = !!personId && title.trim().length > 0;
  const save = () => onSave({
    id: initial?.id, personId, type: 'Reference', title: title.trim(),
    date: date || null, time: '', contactId: null, tentative: false,
    description: description.trim(), refs: refs.filter((r) => r.label.trim() || r.url.trim()),
  });

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: safeArea.bottom(50) }}>
      <FormBar title={editing ? 'Edit reference' : 'New reference'} onCancel={onCancel} onSave={save} canSave={canSave} />
      <div style={{ padding: '8px 16px 0' }}>
        <Field label="WHO IS IT FOR">
          <PersonPicker people={people} value={personId} onChange={setPersonId} />
        </Field>

        <Field label="TITLE">
          <TextInput value={title} onChange={setTitle} placeholder="e.g. Blood test results" />
        </Field>

        <Field label="DATE — OPTIONAL">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, paddingRight: 8 }} />
        </Field>

        <Field label="DESCRIPTION">
          <TextArea value={description} onChange={setDescription} placeholder="Notes, what it's for…" rows={3} />
        </Field>

        <Field label="REFERENCES & DOCUMENTS" hint="Links only — the app doesn't host files. Paste a Drive or Photos link.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {refs.map((r, i) => (
              <div key={i} style={{ background: T.card, borderRadius: 16, padding: 12, boxShadow: T.shadowSoft, position: 'relative' }}>
                <button onClick={() => setRefs(refs.filter((_, j) => j !== i))} aria-label="Remove link" style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', border: 'none', background: T.fieldBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <Icon name="close" size={14} color={T.body} strokeWidth={2} />
                </button>
                <input value={r.label} placeholder="Label (e.g. Lab report)" onChange={(e) => { const n = [...refs]; n[i] = { ...r, label: e.target.value }; setRefs(n); }} style={{ ...inputStyle, height: 42, marginBottom: 8, paddingRight: 34 }} />
                <input value={r.url} placeholder="Paste link…" onChange={(e) => { const n = [...refs]; n[i] = { ...r, url: e.target.value, kind: /\.(jpg|jpeg|png|heic|gif)/i.test(e.target.value) ? 'image' : 'doc' }; setRefs(n); }} style={{ ...inputStyle, height: 42 }} />
              </div>
            ))}
            <button onClick={() => setRefs([...refs, { label: '', url: '', kind: 'doc' }])} style={{ height: 46, borderRadius: 14, border: `1px dashed ${T.fieldBorder}`, background: T.fieldBg, color: T.accentSolid, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="plus" size={17} color={T.accentSolid} strokeWidth={2.2} /> Add a link
            </button>
          </div>
        </Field>

        {editing && (
          <div style={{ marginTop: 8 }}>
            <GhostButton danger onClick={onDelete}><Icon name="trash" size={18} color={T.red} strokeWidth={1.9} /> Delete reference</GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}
