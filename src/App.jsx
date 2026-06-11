import React from 'react';
import { seedData } from './lib/data.js';
import {
  listPeople, createPerson, updatePerson, deletePerson,
  listItems, createItem, updateItem, deleteItem,
} from './lib/api.js';
import { CalendarTab, ItemDetail } from './screens/CalendarTab.jsx';
import { MedicationTab } from './screens/MedicationTab.jsx';
import { CalendarForm, MedForm } from './screens/Forms.jsx';
import { SettingsHome, PeopleList, PersonForm, DeletePersonDialog } from './screens/Settings.jsx';
import { InviteScreen } from './screens/InviteScreen.jsx';
import { LoadingScreen } from './components/LoadingScreen.jsx';

// Build progress: people + calendar items come from Supabase (scoped to the
// active family, refetch-on-change). meds are still a local placeholder until
// step 7. family + role come from the active membership (FamilyGate).

export default function App({ family, role, onSignOut }) {
  const [people, setPeople] = React.useState(undefined); // from DB; undefined = loading
  const [items, setItems] = React.useState(undefined);   // from DB; undefined = loading
  const [data, setData] = React.useState(() => ({ meds: seedData().meds })); // meds local until step 7
  const [tab, setTab] = React.useState('calendar');
  const [stack, setStack] = React.useState([]);
  const [deletePersonId, setDeletePersonId] = React.useState(null);

  const reloadPeople = React.useCallback(
    () => listPeople(family.id).then(setPeople).catch((e) => { console.error('Failed to load people:', e); setPeople([]); }),
    [family.id]);
  const reloadItems = React.useCallback(
    () => listItems(family.id).then(setItems).catch((e) => { console.error('Failed to load items:', e); setItems([]); }),
    [family.id]);
  React.useEffect(() => { reloadPeople(); reloadItems(); }, [reloadPeople, reloadItems]);

  const top = stack[stack.length - 1] || null;
  const push = (o) => setStack((s) => [...s, o]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const closeAll = () => setStack([]);

  // meds mutations — still a local placeholder until step 7
  const upsert = (key, rec) => setData((d) => {
    const arr = d[key]; const i = arr.findIndex((x) => x.id === rec.id);
    const next = i >= 0 ? arr.map((x) => (x.id === rec.id ? rec : x)) : [...arr, rec];
    return { ...d, [key]: next };
  });
  const remove = (key, id) => setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));

  // people mutations — Supabase write, then refetch
  const savePerson = async (rec) => {
    if (rec.id) await updatePerson(rec.id, { name: rec.name, color: rec.color });
    else await createPerson(family.id, { name: rec.name, color: rec.color });
    await reloadPeople();
  };
  const removePersonById = async (id) => {
    await deletePerson(id); // DB cascade removes this person's items (+ meds) rows
    await Promise.all([reloadPeople(), reloadItems()]);
  };

  // item mutations — Supabase write, then refetch
  const saveItem = async (rec) => {
    if (rec.id) await updateItem(rec.id, rec);
    else await createItem(family.id, rec);
    await reloadItems();
  };
  const removeItemById = async (id) => {
    await deleteItem(id);
    await reloadItems();
  };

  if (people === undefined || items === undefined) return <LoadingScreen label="Loading…" />;

  const peopleById = Object.fromEntries(people.map((p) => [p.id, p]));
  const peopleSummary = people.length ? people.map((p) => p.name).join(', ') : 'No one added yet';

  // Show items/meds only for people who still exist. meds placeholders point at
  // people not in this family, so they fall away here; for items (real) this
  // guards the brief gap between a person delete and the refetch.
  const visibleData = {
    people,
    items: items.filter((it) => peopleById[it.personId]),
    meds: data.meds.filter((m) => peopleById[m.personId]),
  };

  const onAdd = () => push({ type: tab === 'calendar' ? 'calForm' : 'medForm' });
  const onGear = () => push({ type: 'settings' });

  // overlay
  let overlay = null;
  if (top) {
    if (top.type === 'itemDetail') {
      const item = items.find((x) => x.id === top.id);
      if (item && peopleById[item.personId]) overlay = <ItemDetail item={item} person={peopleById[item.personId]} role={role}
        onBack={pop} onEdit={() => push({ type: 'calForm', editId: item.id })} />;
    } else if (top.type === 'calForm') {
      const initial = top.editId ? items.find((x) => x.id === top.editId) : null;
      overlay = <CalendarForm people={people} initial={initial}
        onCancel={pop}
        onSave={async (rec) => { try { await saveItem(rec); pop(); } catch (e) { console.error('Save item failed:', e); } }}
        onDelete={async () => { try { await removeItemById(top.editId); closeAll(); } catch (e) { console.error('Delete item failed:', e); } }} />;
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
          itemCount={items.filter((it) => it.personId === deletePersonId).length}
          medCount={data.meds.filter((m) => m.personId === deletePersonId).length}
          onCancel={() => setDeletePersonId(null)}
          onConfirm={async () => { try { await removePersonById(deletePersonId); setDeletePersonId(null); pop(); } catch (e) { console.error('Delete person failed:', e); } }} />
      )}
    </div>
  );
}
