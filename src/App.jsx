import React from 'react';
import { seedData } from './lib/data.js';
import { CalendarTab, ItemDetail } from './screens/CalendarTab.jsx';
import { MedicationTab } from './screens/MedicationTab.jsx';
import { CalendarForm, MedForm } from './screens/Forms.jsx';
import { SettingsHome, PeopleList, PersonForm, InviteLinks, RegenerateDialog, DeletePersonDialog } from './screens/Settings.jsx';

// Build progress: all main screens + Settings (People, Invite links) live.
// people/items/meds are still in-memory seed data (swapped to Supabase in
// later steps). family + role now come from the active membership (FamilyGate).

const DEFAULT_LINKS = { view: 'famhealth.app/v/8kq2-rd7m', edit: 'famhealth.app/e/x9f4-2bnp' };
const randLink = (p) => `famhealth.app/${p}/${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}`;

export default function App({ role, onSignOut }) {
  const [data, setData] = React.useState(seedData);
  const [tab, setTab] = React.useState('calendar');
  const [stack, setStack] = React.useState([]);
  const [links, setLinks] = React.useState(DEFAULT_LINKS);
  const [regenKind, setRegenKind] = React.useState(null);
  const [deletePersonId, setDeletePersonId] = React.useState(null);

  const top = stack[stack.length - 1] || null;
  const push = (o) => setStack((s) => [...s, o]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const closeAll = () => setStack([]);
  const peopleById = Object.fromEntries(data.people.map((p) => [p.id, p]));
  const peopleSummary = data.people.length ? data.people.map((p) => p.name).join(', ') : 'No one added yet';

  // mutations
  const upsert = (key, rec) => setData((d) => {
    const arr = d[key]; const i = arr.findIndex((x) => x.id === rec.id);
    const next = i >= 0 ? arr.map((x) => (x.id === rec.id ? rec : x)) : [...arr, rec];
    return { ...d, [key]: next };
  });
  const remove = (key, id) => setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));
  const removePerson = (id) => setData((d) => ({
    people: d.people.filter((p) => p.id !== id),
    items: d.items.filter((it) => it.personId !== id),
    meds: d.meds.filter((m) => m.personId !== id),
  }));

  const onAdd = () => push({ type: tab === 'calendar' ? 'calForm' : 'medForm' });
  const onGear = () => push({ type: 'settings' });

  // overlay
  let overlay = null;
  if (top) {
    if (top.type === 'itemDetail') {
      const item = data.items.find((x) => x.id === top.id);
      if (item) overlay = <ItemDetail item={item} person={peopleById[item.personId]} role={role}
        onBack={pop} onEdit={() => push({ type: 'calForm', editId: item.id })} />;
    } else if (top.type === 'calForm') {
      const initial = top.editId ? data.items.find((x) => x.id === top.editId) : null;
      overlay = <CalendarForm people={data.people} initial={initial}
        onCancel={pop}
        onSave={(rec) => { upsert('items', rec); pop(); }}
        onDelete={() => { remove('items', top.editId); closeAll(); }} />;
    } else if (top.type === 'medForm') {
      const initial = top.editId ? data.meds.find((x) => x.id === top.editId) : null;
      overlay = <MedForm people={data.people} initial={initial}
        onCancel={pop}
        onSave={(rec) => { upsert('meds', rec); pop(); }}
        onDelete={() => { remove('meds', top.editId); closeAll(); }} />;
    } else if (top.type === 'settings') {
      overlay = <SettingsHome onBack={pop} peopleSummary={peopleSummary}
        onPeople={() => push({ type: 'people' })}
        onInvite={() => push({ type: 'invite' })}
        onSignOut={onSignOut} />;
    } else if (top.type === 'people') {
      overlay = <PeopleList people={data.people} onBack={pop}
        onAdd={() => push({ type: 'personForm' })}
        onEdit={(id) => push({ type: 'personForm', editId: id })} />;
    } else if (top.type === 'personForm') {
      const initial = top.editId ? data.people.find((x) => x.id === top.editId) : null;
      overlay = <PersonForm people={data.people} initial={initial}
        onCancel={pop}
        onSave={(rec) => { upsert('people', rec); pop(); }}
        onDelete={() => setDeletePersonId(top.editId)} />;
    } else if (top.type === 'invite') {
      overlay = <InviteLinks onBack={pop} links={links} onRegen={(k) => setRegenKind(k)} />;
    }
  }

  const tabScreen = tab === 'calendar'
    ? <CalendarTab data={data} role={role} onTab={setTab} onGear={onGear} onAdd={onAdd}
        onOpenItem={(id) => push({ type: 'itemDetail', id })} />
    : <MedicationTab data={data} role={role} onTab={setTab} onGear={onGear} onAdd={onAdd}
        onOpenMed={(id) => push({ type: 'medForm', editId: id })} />;

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {tabScreen}
      {overlay && <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>{overlay}</div>}
      {regenKind && (
        <RegenerateDialog kind={regenKind}
          onCancel={() => setRegenKind(null)}
          onConfirm={() => { setLinks((l) => ({ ...l, [regenKind]: randLink(regenKind === 'edit' ? 'e' : 'v') })); setRegenKind(null); }} />
      )}
      {deletePersonId && peopleById[deletePersonId] && (
        <DeletePersonDialog
          person={peopleById[deletePersonId]}
          itemCount={data.items.filter((it) => it.personId === deletePersonId).length}
          medCount={data.meds.filter((m) => m.personId === deletePersonId).length}
          onCancel={() => setDeletePersonId(null)}
          onConfirm={() => { removePerson(deletePersonId); setDeletePersonId(null); pop(); }} />
      )}
    </div>
  );
}
