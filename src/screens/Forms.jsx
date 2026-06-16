// Add/Edit forms — Calendar item (Form A) + Medication (Form B). SPEC §9.
// Converted from the design export to ES modules.
import React from 'react';
import { T, FOOD_LABEL } from '../lib/theme.js';
import { TODAY_ISO } from '../lib/data.js';
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '58px 16px 12px', position: 'sticky', top: 0, zIndex: 20, background: 'linear-gradient(180deg, #E6F2EC 60%, rgba(230,242,236,0) 100%)' }}>
      <button onClick={onCancel} style={{ border: 'none', background: 'transparent', color: T.body, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 4px' }}>Cancel</button>
      <span style={{ fontSize: 16, fontWeight: 700, color: T.deep }}>{title}</span>
      <button onClick={canSave ? onSave : undefined} style={{
        border: 'none', borderRadius: 999, padding: '9px 18px', cursor: canSave ? 'pointer' : 'default', fontFamily: 'inherit',
        background: canSave ? T.accent : T.fieldBg, color: canSave ? '#fff' : T.muted, fontSize: 15, fontWeight: 700,
        boxShadow: canSave ? '0 4px 12px rgba(31,169,160,0.30)' : 'none',
      }}>Save</button>
    </div>
  );
}

// ── Form A: Calendar item ────────────────────────────────────────────
const BASE_TYPES = ['Appointment', 'Test', 'Bill'];

export function CalendarForm({ people, initial, onSave, onCancel, onDelete }) {
  const editing = !!initial;
  const [personId, setPersonId] = React.useState(initial?.personId || people[0]?.id || null);
  const [type, setType] = React.useState(initial?.type || 'Appointment');
  const [customType, setCustomType] = React.useState(BASE_TYPES.includes(initial?.type) ? '' : (initial?.type || ''));
  const [showCustom, setShowCustom] = React.useState(false);
  const [title, setTitle] = React.useState(initial?.title || '');
  const [date, setDate] = React.useState(initial?.date || TODAY_ISO);
  const [time, setTime] = React.useState(to24(initial?.time || ''));
  const [description, setDescription] = React.useState(initial?.description || '');
  const [refs, setRefs] = React.useState(initial?.refs?.length ? initial.refs.map(r => ({ ...r })) : []);

  const canSave = !!personId && title.trim().length > 0;
  const save = () => onSave({
    id: initial?.id, personId, type, title: title.trim(), date, time: formatTime(time),
    description: description.trim(), refs: refs.filter(r => r.label.trim() || r.url.trim()),
  });

  const allTypes = [...BASE_TYPES, ...(customType && !BASE_TYPES.includes(customType) ? [customType] : [])];

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 50 }}>
      <FormBar title={editing ? 'Edit item' : 'New item'} onCancel={onCancel} onSave={save} canSave={canSave} />
      <div style={{ padding: '8px 16px 0' }}>
        <Field label="WHO IS IT FOR">
          <PersonPicker people={people} value={personId} onChange={setPersonId} />
        </Field>

        <Field label="TYPE">
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
        </Field>

        <Field label="TITLE">
          <TextInput value={title} onChange={setTitle} placeholder="e.g. Cardiology review" />
        </Field>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="DATE"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, paddingRight: 8 }} /></Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="TIME"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inputStyle, paddingRight: 8 }} /></Field>
          </div>
        </div>

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
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 50 }}>
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
export function ContactForm({ initial, onSave, onCancel, onDelete }) {
  const editing = !!initial;
  const [name, setName] = React.useState(initial?.name || '');
  const [specialty, setSpecialty] = React.useState(initial?.specialty || '');
  const [phones, setPhones] = React.useState(
    initial?.phones?.length ? initial.phones.map((p) => ({ label: p.label || '', number: p.number || '' })) : [{ label: '', number: '' }]
  );
  const [location, setLocation] = React.useState(initial?.location || '');

  const canSave = name.trim().length > 0;
  const setPhone = (i, patch) => setPhones((cur) => cur.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const save = () => onSave({
    id: initial?.id,
    name: name.trim(),
    specialty: specialty.trim(),
    phones: phones.filter((p) => p.number.trim()).map((p) => ({ label: p.label.trim(), number: p.number.trim() })),
    location: location.trim(),
  });

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 50 }}>
      <FormBar title={editing ? 'Edit contact' : 'New contact'} onCancel={onCancel} onSave={save} canSave={canSave} />
      <div style={{ padding: '8px 16px 0' }}>
        <Field label="NAME">
          <TextInput value={name} onChange={setName} placeholder="e.g. Dr. Okafor" />
        </Field>

        <Field label="SPECIALTY">
          <TextInput value={specialty} onChange={setSpecialty} placeholder="e.g. Cardiologist (optional)" />
        </Field>

        <Field label="PHONE NUMBERS" hint="Add one or more. Each can have a label like Clinic or Mobile.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {phones.map((p, i) => (
              <div key={i} style={{ background: T.card, borderRadius: 16, padding: 12, boxShadow: T.shadowSoft, position: 'relative' }}>
                <button onClick={() => setPhones(phones.filter((_, j) => j !== i))} aria-label="Remove number" style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', border: 'none', background: T.fieldBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <Icon name="close" size={14} color={T.body} strokeWidth={2} />
                </button>
                <input value={p.label} placeholder="Label (optional, e.g. Clinic)" onChange={(e) => setPhone(i, { label: e.target.value })} style={{ ...inputStyle, height: 42, marginBottom: 8, paddingRight: 34 }} />
                <input value={p.number} type="tel" placeholder="Phone number" onChange={(e) => setPhone(i, { number: e.target.value })} style={{ ...inputStyle, height: 42 }} />
              </div>
            ))}
            <button onClick={() => setPhones([...phones, { label: '', number: '' }])} style={{ height: 46, borderRadius: 14, border: `1px dashed ${T.fieldBorder}`, background: T.fieldBg, color: T.accentSolid, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="plus" size={17} color={T.accentSolid} strokeWidth={2.2} /> Add a number
            </button>
          </div>
        </Field>

        <Field label="LOCATION">
          <TextInput value={location} onChange={setLocation} placeholder="e.g. 12 High St, Room 4 (optional)" />
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
