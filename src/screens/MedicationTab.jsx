// Medication tab — Morning / Noon / Evening (SPEC §8). Converted from the design export.
// One time bucket shows at a time, picked via a segmented control (Variant A).
import React from 'react';
import { T, FOOD_LABEL } from '../lib/theme.js';
import { Icon } from '../components/Icon.jsx';
import { Avatar, PrimaryButton } from '../components/ui.jsx';
import { TabHeader, EmptyBlock, FAB } from './CalendarTab.jsx';
import { Copyright } from '../components/Copyright.jsx';

const TIMES = ['Morning', 'Noon', 'Evening'];

// Segmented control: Morning | Noon | Evening, each with its bucket count.
function TimeSegments({ active, counts, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, background: T.segBg, borderRadius: 12 }}>
      {TIMES.map((t) => {
        const on = active === t;
        return (
          <button key={t} onClick={() => onSelect(t)} style={{
            flex: 1, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: on ? '#fff' : 'transparent', color: on ? T.tealDeep : T.body,
            fontSize: 12.5, fontWeight: on ? 700 : 600,
            boxShadow: on ? '0 1px 6px rgba(31,74,64,0.10)' : 'none',
            transition: 'background 140ms ease, color 140ms ease',
          }}>
            {t}
            <span style={{ fontWeight: on ? 600 : 500, opacity: 0.75 }}>{counts[t]}</span>
          </button>
        );
      })}
    </div>
  );
}

function MedRow({ med, person, onClick }) {
  const food = FOOD_LABEL[med.food];
  const note = [food, med.note].filter(Boolean).join(' · ');
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', cursor: onClick ? 'pointer' : 'default' }}>
      <Avatar person={person} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: T.deep }}>{med.name}</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: T.accentSolid, background: T.accentTint, padding: '2px 10px', borderRadius: 999 }}>{med.dose}</span>
        </div>
        <div style={{ fontSize: 13, color: T.body, marginTop: 3, fontWeight: 500 }}>
          {person.name}{note ? ` · ${note}` : ''}
        </div>
      </div>
      {onClick && <Icon name="chevron" size={16} color={T.muted} strokeWidth={2} />}
    </div>
  );
}

export function MedicationTab({ data, role, onTab, onGear, onAdd, onAddPerson, onOpenMed, onSignOut }) {
  const [time, setTime] = React.useState('Morning'); // always Morning on mount — no persistence
  const peopleById = Object.fromEntries(data.people.map((p) => [p.id, p]));
  const noMeds = data.meds.length === 0;
  const counts = Object.fromEntries(TIMES.map((t) => [t, data.meds.filter((m) => m.times.includes(t)).length]));
  const activeMeds = data.meds.filter((m) => m.times.includes(time));

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 120 }}>
      <TabHeader active="medication" onTab={onTab} role={role} onGear={onGear} onSignOut={onSignOut} />

      {noMeds ? (
        role === 'editor' ? (
          data.people.length === 0 ? (
            <EmptyBlock icon="users" title="Add your first person"
              body="Start with the people you're tracking — then you can add their medications."
              action={<PrimaryButton icon="plus" onClick={onAddPerson}>Add a person</PrimaryButton>} />
          ) : (
            <EmptyBlock icon="pill" title="No medications added"
              body="Add a medication to see it sorted into morning, noon, and evening."
              action={<PrimaryButton icon="plus" onClick={onAdd}>Add medication</PrimaryButton>} />
          )
        ) : (
          <EmptyBlock icon="pill" title="Nothing here yet"
            body="When medications are added, they'll appear here, sorted by time of day." />
        )
      ) : (
        <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TimeSegments active={time} counts={counts} onSelect={setTime} />
          {activeMeds.length ? (
            <div style={{ background: T.card, borderRadius: 20, padding: '2px 16px', boxShadow: T.shadowCard }}>
              {activeMeds.map((m, i) => (
                <div key={m.id} style={{ borderBottom: i < activeMeds.length - 1 ? `1px solid ${T.fieldBorder}` : 'none' }}>
                  <MedRow med={m} person={peopleById[m.personId]} onClick={role === 'editor' && onOpenMed ? () => onOpenMed(m.id) : undefined} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: T.metaGrey, fontSize: 13, fontStyle: 'italic', padding: '16px 0 4px' }}>
              No {time.toLowerCase()} medicines yet.
            </div>
          )}
          <div style={{ textAlign: 'center', color: T.muted, fontSize: 13, fontWeight: 500, padding: '4px 0 0' }}>
            A reference list — nothing to check off.
          </div>
        </div>
      )}

      <Copyright />
      {role === 'editor' && <FAB onClick={onAdd} />}
    </div>
  );
}
