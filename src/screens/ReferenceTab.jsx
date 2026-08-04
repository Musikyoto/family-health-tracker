// Reference tab — past results and documents. A reference is an item with
// type 'Reference' (no migration); it never appears on the Calendar or To-do.
// Rows reuse the shared ItemRow with a custom meta line; detail/edit reuse the
// item detail (with a conditional date row) and ReferenceForm.
import { T, safeArea } from '../lib/theme.js';
import { Icon } from '../components/Icon.jsx';
import { PrimaryButton } from '../components/ui.jsx';
import { TabHeader, EmptyBlock, FAB, ItemRow } from './CalendarTab.jsx';
import { Copyright } from '../components/Copyright.jsx';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso) => { const d = new Date(iso + 'T00:00:00'); return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };

// Meta line: date (or "No date", quiet italic) · link glyph + doc count ·
// description snippet — one line, ellipsized.
function ReferenceSub({ item }) {
  const snippet = (item.description || '').replace(/\s+/g, ' ').trim();
  const count = item.refs?.length || 0;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
      {item.date
        ? <span style={{ flexShrink: 0 }}>{fmtDate(item.date)}</span>
        : <span style={{ flexShrink: 0, fontStyle: 'italic', color: T.muted }}>No date</span>}
      {count > 0 && (
        <>
          <span style={{ flexShrink: 0 }}>·</span>
          <Icon name="link" size={12.5} color={T.metaGrey} strokeWidth={1.9} style={{ flexShrink: 0 }} />
          <span style={{ flexShrink: 0 }}>{count}</span>
        </>
      )}
      {snippet && (
        <>
          <span style={{ flexShrink: 0 }}>·</span>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snippet}</span>
        </>
      )}
    </span>
  );
}

export function ReferenceTab({ data, role, todoBadge, calendarBadge, onTab, onGear, onAdd, onAddPerson, onOpenItem, onSignOut }) {
  const peopleById = Object.fromEntries(data.people.map((p) => [p.id, p]));
  // newest first; undated entries sort to the bottom
  const refs = data.items
    .filter((it) => it.type === 'Reference')
    .sort((a, b) => (!a.date && !b.date ? 0 : !a.date ? 1 : !b.date ? -1 : b.date.localeCompare(a.date)));

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: safeArea.bottom(120) }}>
      <TabHeader active="reference" onTab={onTab} role={role} onGear={onGear} onSignOut={onSignOut} todoBadge={todoBadge} calendarBadge={calendarBadge} />

      {refs.length === 0 ? (
        role === 'editor' ? (
          data.people.length === 0 ? (
            <EmptyBlock icon="users" title="Add your first person"
              body="Start with the people you're tracking — then you can keep their results and documents here."
              action={<PrimaryButton icon="plus" onClick={onAddPerson}>Add a person</PrimaryButton>} />
          ) : (
            <EmptyBlock icon="folder" title="Nothing filed yet"
              body="Keep past results, letters, and documents here, each with a link. Tap + to file the first."
              action={<PrimaryButton icon="plus" onClick={onAdd}>Add a reference</PrimaryButton>} />
          )
        ) : (
          <EmptyBlock icon="folder" title="Nothing filed yet"
            body="When results or documents are added, they'll appear here." />
        )
      ) : (
        <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {refs.map((it) => (
            <ItemRow key={it.id} item={it} person={peopleById[it.personId]}
              sub={<ReferenceSub item={it} />}
              onClick={() => onOpenItem(it.id)} />
          ))}
          <div style={{ textAlign: 'center', color: T.muted, fontSize: 13, fontWeight: 500, padding: '4px 0 0' }}>
            Records only — these never appear on the Calendar.
          </div>
        </div>
      )}

      <Copyright />
      {role === 'editor' && <FAB onClick={onAdd} />}
    </div>
  );
}
