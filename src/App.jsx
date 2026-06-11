import React from 'react';
import { seedData } from './lib/data.js';
import { listPeople, createPerson, updatePerson, deletePerson } from './lib/api.js';
import { CalendarTab, ItemDetail } from './screens/CalendarTab.jsx';
import { MedicationTab } from './screens/MedicationTab.jsx';
import { CalendarForm, MedForm } from './screens/Forms.jsx';
import { SettingsHome, PeopleList, PersonForm, DeletePersonDialog } from './screens/Settings.jsx';
import { InviteScreen } from './screens/InviteScreen.jsx';
import { LoadingScreen } from './components/LoadingScreen.jsx';

// Build progress: people now come from the Supabase `people` table, scoped to
// the active family, with refetch-on-change. items/meds are still in-memory
// placeholders (local only, not persisted) until steps 6–7. family + role come
// from the active membership (FamilyGate).

export default function App({ family, role, onSignOut }) {
  const [people, setPeople] = React.useState(undefined); // from DB; undefined = loading
  const [data, setData] = React.useState(() => { const s = seedData(); return { items: s.items, meds: s.meds }; });
  const [tab, setTab] = React.useState('calendar');
  const [stack, setStack] = React.useState([]);
  const [deletePersonId, setDeletePersonId] = React.useState(null);

  const reloadPeople = React.useCallback(() => {
    return listPeople(family.id)
      .then(setPeople)
      .catch((e) => { console.error('Failed to load people:', e); setPeople([]); });
  }, [family.id]);
  React.useEffect(() => { reloadPeople(); }, [reloadPeople]);

  const top = stack[stack.length - 1] || null;
  const push = (o) => setStack((s) => [...s, o]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const closeAll = () => setStack([]);

  // items/meds mutations — still local placeholders until steps 6–7
  const upsert = (key, rec) => setData((d) => {
    const arr = d[key]; const i = arr.findIndex((x) => x.id === rec.id);
    const next = i >= 0 ? arr.map((x) => (x.id === rec.id ? rec : x)) : [...arr, rec];
    return { ...d, [key]: next };
  });
  const remove = (key, id) => setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));

  // people mutations — Supabase write, then refetch so the UI reflects the DB
  const savePerson = async (rec) => {
    if (rec.id) await updatePerson(rec.id, { name: rec.name, color: rec.color });
    else await createPerson(family.id, { name: rec.name, color: rec.color });
    await reloadPeople();
  };
  const removePersonById = async (id) => {
    await deletePerson(id); // DB cascade removes this person's items/meds rows
    await reloadPeople();
  };

  if (people === undefined) return <LoadingScreen label="Loading…" />;

  const peopleById = Object.fromEntries(people.map((p) => [p.id, p]));
  const peopleSummary = people.length ? people.map((p) => p.name).join(', ') : 'No one added yet';

  // Only show items/meds whose person still exists. The seed placeholders point
  // at people not in this family, so they fall away here; once items/meds are
  // real this also guards the brief gap between a person delete and the refetch.
  const visibleData = {
    people,
    items: data.items.filter((it) => peopleById[it.personId]),
    meds: data.meds.filter((m) => peopleById[m.personId]),
  };

  const onAdd = () => push({ type: tab === 'calendar' ? 'calForm' : 'medForm' });
  const onGear = () => push({ type: 'settings' });

  // overlay
  let overlay = null;
  if (top) {
    if (top.type === 'itemDetail') {
      const item = data.items.find((x) => x.id === top.id);
      if (item && peopleById[item.personId]) overlay = <ItemDetail item={item} person={peopleById[item.personId]} role={role}
        onBack={pop} onEdit={() => push({ type: 'calForm', editId: item.id })} />;
    } else if (top.type === 'calForm') {
      const initial = top.editId ? data.items.find((x) => x.id === top.editId) : null;
      overlay = <CalendarForm people={people} initial={initial}
        onCancel={pop}
        onSave={(rec) => { upsert('items', rec); pop(); }}
        onDelete={() => { remove('items', top.editId); closeAll(); }} />;
    } else if (top.type === 'medForm') {
      const initial = top.editId ? data.meds.find((x) => x.id === top.editId) : null;
      overlay = <MedForm people={people} initial={initial}
        onCancel={pop}
        onSave={(rec) => { upsert('meds', rec); pop(); }}
        onDelete={() => { remove('meds', top.editId); closeAll(); }} />;
    } else if (top.type === 'settings') {
      overlay = <SettingsHome onBack={pop} peopleSummary={peopleSummary}
        onPeople={() => push({ type: 'people' })}
        onInvite={() => push({ type: 'invite' })}
        onSignOut={onSignOut} />;
    } else if (top.type === 'people') {
      overlay = <PeopleList people={people} onBack={pop}
        onAdd={() => push({ type: 'personForm' })}
        onEdit={(id) => push({ type: 'personForm', editId: id })} />;
    } else if (top.type === 'personForm') {
      const initial = top.editId ? people.find((x) => x.id === top.editId) : null;
      overlay = <PersonForm people={people} initial={initial}
        onCancel={pop}
        onSave={async (rec) => { try { await savePerson(rec); pop(); } catch (e) { console.error('Save person failed:', e); } }}
        onDelete={() => setDeletePersonId(top.editId)} />;
    } else if (top.type === 'invite') {
      overlay = <InviteScreen familyId={family.id} onBack={pop} />;
    }
  }

  const tabScreen = tab === 'calendar'
    ? <CalendarTab data={visibleData} role={role} onTab={setTab} onGear={onGear} onAdd={onAdd}
        onOpenItem={(id) => push({ type: 'itemDetail', id })} />
    : <MedicationTab data={visibleData} role={role} onTab={setTab} onGear={onGear} onAdd={onAdd}
        onOpenMed={(id) => push({ type: 'medForm', editId: id })} />;

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {tabScreen}
      {overlay && <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>{overlay}</div>}
      {deletePersonId && peopleById[deletePersonId] && (
        <DeletePersonDialog
          person={peopleById[deletePersonId]}
          itemCount={data.items.filter((it) => it.personId === deletePersonId).length}
          medCount={data.meds.filter((m) => m.personId === deletePersonId).length}
          onCancel={() => setDeletePersonId(null)}
          onConfirm={async () => { try { await removePersonById(deletePersonId); setDeletePersonId(null); pop(); } catch (e) { console.error('Delete person failed:', e); } }} />
      )}
    </div>
  );
}
