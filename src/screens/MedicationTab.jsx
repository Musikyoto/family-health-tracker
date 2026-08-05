// Medication tab — Morning / Noon / Evening (SPEC §8). Converted from the design export.
// One time bucket shows at a time, picked via a segmented control (Variant A).
import React from 'react';
import { T, FOOD_LABEL, safeArea } from '../lib/theme.js';
import { todayIso } from '../lib/data.js';
import { Icon } from '../components/Icon.jsx';
import { Avatar, PrimaryButton } from '../components/ui.jsx';
import { TabHeader, EmptyBlock, FAB } from './CalendarTab.jsx';
import { Copyright } from '../components/Copyright.jsx';

const TIMES = ['Morning', 'Noon', 'Evening'];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Parse at local midnight: `new Date('2026-08-04')` is UTC midnight and renders
// a day early anywhere west of UTC — the same trap todayIso() avoids.
const parseIso = (iso) => new Date(`${iso}T00:00:00`);
const fmtMonthYear = (iso) => { const d = parseIso(iso); return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`; };
const fmtDayMonth = (iso) => { const d = parseIso(iso); return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`; };

// A course is finished the day AFTER its end date — an end date of today means
// today is still a day it's taken. ISO dates are zero-padded, so comparing the
// strings is chronological: no Date object, no timezone, no toISOString.
const isFinished = (m) => !!m.endDate && m.endDate < todayIso();

// Date context for the meta line. A medicine with no dates gets nothing:
// having no dates already means on-going, and tagging every undated row
// identically would be noise rather than signal.
function courseText(m) {
  if (isFinished(m)) return `ended ${fmtDayMonth(m.endDate)}`;
  return [
    m.startDate ? `since ${fmtMonthYear(m.startDate)}` : null,
    m.endDate ? `until ${fmtDayMonth(m.endDate)}` : null,
  ].filter(Boolean).join(' · ');
}

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

// `finished` only quiets the dose chip — the medicine name keeps its full-ink
// weight either way, since a finished course is still something a carer reads.
// The end date leads the meta line there, so a long note can't ellipsize away
// the one fact that section exists to show.
function MedRow({ med, person, onClick, finished = false }) {
  const food = FOOD_LABEL[med.food];
  const course = courseText(med);
  const meta = (finished ? [person.name, course, food, med.note] : [person.name, food, med.note, course])
    .filter(Boolean).join(' · ');
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', cursor: onClick ? 'pointer' : 'default' }}>
      <Avatar person={person} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>{med.name}</span>
          <span style={{
            fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            color: finished ? T.deep : T.accentSolid, background: finished ? T.rowBg : T.accentTint,
          }}>{med.dose}</span>
        </div>
        <div style={{ fontSize: 12.5, color: T.metaGrey, marginTop: 3, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta}
        </div>
      </div>
      {onClick && <Icon name="chevron" size={16} color={T.metaGrey} strokeWidth={2} style={{ flexShrink: 0 }} />}
    </div>
  );
}

export function MedicationTab({ data, role, todoBadge, calendarBadge, onTab, onGear, onAdd, onAddPerson, onOpenMed, onSignOut }) {
  const [time, setTime] = React.useState('Morning'); // always Morning on mount — no persistence
  const [showFinished, setShowFinished] = React.useState(false);
  const peopleById = Object.fromEntries(data.people.map((p) => [p.id, p]));
  const noMeds = data.meds.length === 0;
  // A finished course drops out of the daily lists AND the segment counts — it
  // isn't a morning or an evening thing any more. It's still a medicine though,
  // so a family whose meds have all finished sees empty segments plus the
  // finished section, not the "no medications" empty state.
  const liveMeds = data.meds.filter((m) => !isFinished(m));
  const finishedMeds = data.meds.filter(isFinished).sort((a, b) => b.endDate.localeCompare(a.endDate));
  const counts = Object.fromEntries(TIMES.map((t) => [t, liveMeds.filter((m) => m.times.includes(t)).length]));
  const activeMeds = liveMeds.filter((m) => m.times.includes(time));

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: safeArea.bottom(120) }}>
      <TabHeader active="medication" onTab={onTab} role={role} onGear={onGear} onSignOut={onSignOut} todoBadge={todoBadge} calendarBadge={calendarBadge} />

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
            <div style={{ background: T.card, borderRadius: 18, padding: '2px 16px', boxShadow: T.shadowSoft }}>
              {activeMeds.map((m, i) => (
                <div key={m.id} style={{ borderBottom: i < activeMeds.length - 1 ? `1px solid ${T.hairline}` : 'none' }}>
                  <MedRow med={m} person={peopleById[m.personId]} onClick={role === 'editor' && onOpenMed ? () => onOpenMed(m.id) : undefined} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: T.metaGrey, fontSize: 13, fontStyle: 'italic', padding: '16px 0 4px' }}>
              No {time.toLowerCase()} medicines yet.
            </div>
          )}
          {/* Finished courses sit outside the time segments entirely, as one
              quiet row that opens in place. Hidden when there are none. */}
          {finishedMeds.length > 0 && (
            <div>
              <button onClick={() => setShowFinished((v) => !v)} aria-expanded={showFinished} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px',
                borderRadius: 14, background: T.rowBg, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <Icon name="check" size={17} color={T.deep} strokeWidth={2.2} />
                <span style={{ flex: 1, textAlign: 'left', fontSize: 14.5, fontWeight: 700, color: T.deep }}>
                  Finished medicines ({finishedMeds.length})
                </span>
                <Icon name="chevron" size={15} color={T.deep} strokeWidth={2}
                  style={{ transform: showFinished ? 'rotate(90deg)' : 'none', transition: 'transform 160ms ease' }} />
              </button>
              {showFinished && (
                <div style={{ background: T.card, borderRadius: 18, padding: '2px 16px', boxShadow: T.shadowSoft, marginTop: 10 }}>
                  {finishedMeds.map((m, i) => (
                    <div key={m.id} style={{ borderBottom: i < finishedMeds.length - 1 ? `1px solid ${T.hairline}` : 'none' }}>
                      <MedRow med={m} person={peopleById[m.personId]} finished
                        onClick={role === 'editor' && onOpenMed ? () => onOpenMed(m.id) : undefined} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* trailing note: same treatment as the Contacts tab's footnote */}
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
