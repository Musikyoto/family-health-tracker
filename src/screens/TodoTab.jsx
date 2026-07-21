// To-do tab — appointments that still need booking: items with no date yet
// (items.date is nullable since migration 015). Giving one a date moves it to
// the Calendar; clearing a date anywhere brings the item back here.
import { T, safeArea } from '../lib/theme.js';
import { Icon } from '../components/Icon.jsx';
import { PrimaryButton } from '../components/ui.jsx';
import { TabHeader, EmptyBlock, FAB, ItemRow } from './CalendarTab.jsx';
import { Copyright } from '../components/Copyright.jsx';

// Sub-line: person, the linked doctor (with a stethoscope), then whatever
// description there is — one line, ellipsized, never wrapping the row.
function TodoSub({ item, person }) {
  const snippet = (item.description || '').replace(/\s+/g, ' ').trim();
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
      <span style={{ flexShrink: 0 }}>{person.name}</span>
      {item.contact && (
        <>
          <span style={{ flexShrink: 0 }}>·</span>
          <Icon name="stethoscope" size={12.5} color={T.tealDeep} strokeWidth={1.9} style={{ flexShrink: 0 }} />
          <span style={{ flexShrink: 0, color: T.tealDeep, fontWeight: 600 }}>{item.contact.name}</span>
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

export function TodoTab({ data, role, onTab, onGear, onAdd, onAddPerson, onOpenItem, onSignOut }) {
  const peopleById = Object.fromEntries(data.people.map((p) => [p.id, p]));
  // longest-waiting first: a booking backlog should surface what's been
  // sitting unbooked the longest, not the newest thing added.
  const todos = data.items
    .filter((it) => !it.date)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: safeArea.bottom(120) }}>
      <TabHeader active="todo" onTab={onTab} role={role} onGear={onGear} onSignOut={onSignOut} />

      {todos.length === 0 ? (
        role === 'editor' ? (
          data.people.length === 0 ? (
            <EmptyBlock icon="users" title="Add your first person"
              body="Start with the people you're tracking — then you can note down what still needs booking."
              action={<PrimaryButton icon="plus" onClick={onAddPerson}>Add a person</PrimaryButton>} />
          ) : (
            <EmptyBlock icon="checklist" title="Nothing waiting to be booked"
              body="Tap + to note an appointment that still needs a date. Once you book it, add the date and it moves to the Calendar."
              action={<PrimaryButton icon="plus" onClick={onAdd}>Add a to-do</PrimaryButton>} />
          )
        ) : (
          <EmptyBlock icon="checklist" title="Nothing waiting to be booked"
            body="When something needs booking, it'll appear here." />
        )
      ) : (
        <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {todos.map((it) => (
            <ItemRow key={it.id} item={it} person={peopleById[it.personId]}
              sub={<TodoSub item={it} person={peopleById[it.personId]} />}
              onClick={() => onOpenItem(it.id)} />
          ))}
          <div style={{ textAlign: 'center', color: T.muted, fontSize: 13, fontWeight: 500, padding: '4px 0 0' }}>
            Add a date to move one to the Calendar.
          </div>
        </div>
      )}

      <Copyright />
      {role === 'editor' && <FAB onClick={onAdd} />}
    </div>
  );
}
