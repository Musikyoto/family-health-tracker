// Medication tab — Morning / Noon / Evening (SPEC §8). Converted from the design export.
import { T, FOOD_LABEL } from '../lib/theme.js';
import { Icon } from '../components/Icon.jsx';
import { Avatar, PrimaryButton } from '../components/ui.jsx';
import { TabHeader, EmptyBlock, FAB } from './CalendarTab.jsx';

const TIME_SECTIONS = [
  { key: 'Morning', icon: 'sunrise' },
  { key: 'Noon', icon: 'sun' },
  { key: 'Evening', icon: 'moon' },
];

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
  const peopleById = Object.fromEntries(data.people.map((p) => [p.id, p]));
  const noMeds = data.meds.length === 0;

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 120 }}>
      <TabHeader active="Medication" onTab={onTab} role={role} onGear={onGear} onSignOut={onSignOut} />

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
        <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TIME_SECTIONS.map((sec) => {
            const meds = data.meds.filter((m) => m.times.includes(sec.key));
            if (!meds.length) return null;
            return (
              <div key={sec.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 4px 9px' }}>
                  <Icon name={sec.icon} size={19} color={T.accentSolid} strokeWidth={1.9} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.deep, letterSpacing: '0.3px' }}>{sec.key}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>{meds.length}</span>
                </div>
                <div style={{ background: T.card, borderRadius: 20, padding: '2px 16px', boxShadow: T.shadowCard }}>
                  {meds.map((m, i) => (
                    <div key={m.id} style={{ borderBottom: i < meds.length - 1 ? `1px solid ${T.fieldBorder}` : 'none' }}>
                      <MedRow med={m} person={peopleById[m.personId]} onClick={role === 'editor' && onOpenMed ? () => onOpenMed(m.id) : undefined} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ textAlign: 'center', color: T.muted, fontSize: 13, fontWeight: 500, padding: '4px 0 0' }}>
            A reference list — nothing to check off.
          </div>
        </div>
      )}

      {role === 'editor' && <FAB onClick={onAdd} />}
    </div>
  );
}
