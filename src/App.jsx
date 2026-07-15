import React from 'react';
import {
  listPeople, createPerson, updatePerson, deletePerson,
  listItems, createItem, updateItem, deleteItem,
  listMeds, createMed, updateMed, deleteMed,
  listContacts, createContact, updateContact, deleteContact,
} from './lib/api.js';
import { CalendarTab, ItemDetail } from './screens/CalendarTab.jsx';
import { MedicationTab } from './screens/MedicationTab.jsx';
import { ContactsTab } from './screens/ContactsTab.jsx';
import { CalendarForm, MedForm, ContactForm } from './screens/Forms.jsx';
import { SettingsHome, PeopleList, PersonForm, DeletePersonDialog, SignOutDialog } from './screens/Settings.jsx';
import { InviteScreen } from './screens/InviteScreen.jsx';
import { LoadingScreen } from './components/LoadingScreen.jsx';

// people, calendar items, and meds all come from Supabase, scoped to the active
// family, with refetch-on-change. family + role come from the active membership.

export default function App({ family, role, onSignOut }) {
  const [people, setPeople] = React.useState(undefined); // undefined = loading
  const [items, setItems] = React.useState(undefined);
  const [meds, setMeds] = React.useState(undefined);
  const [contacts, setContacts] = React.useState(undefined);
  const [tab, setTab] = React.useState('calendar');
  const [stack, setStack] = React.useState([]);
  const [deletePersonId, setDeletePersonId] = React.useState(null);
  const [confirmSignOut, setConfirmSignOut] = React.useState(false);
  const requestSignOut = () => setConfirmSignOut(true);

  const reloadPeople = React.useCallback(
    () => listPeople(family.id).then(setPeople).catch((e) => { console.error('Failed to load people:', e); setPeople([]); }),
    [family.id]);
  const reloadItems = React.useCallback(
    () => listItems(family.id).then(setItems).catch((e) => { console.error('Failed to load items:', e); setItems([]); }),
    [family.id]);
  const reloadMeds = React.useCallback(
    () => listMeds(family.id).then(setMeds).catch((e) => { console.error('Failed to load meds:', e); setMeds([]); }),
    [family.id]);
  const reloadContacts = React.useCallback(
    () => listContacts(family.id).then(setContacts).catch((e) => { console.error('Failed to load contacts:', e); setContacts([]); }),
    [family.id]);
  React.useEffect(() => { reloadPeople(); reloadItems(); reloadMeds(); reloadContacts(); }, [reloadPeople, reloadItems, reloadMeds, reloadContacts]);

  // Refetch when the user returns to the app (tab visible / window focused) so a
  // change made by another family member on another device shows up without a
  // manual refresh. Debounced so visibility + focus don't double-fire.
  React.useEffect(() => {
    let last = 0;
    const maybeRefetch = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - last < 1500) return;
      last = now;
      reloadPeople(); reloadItems(); reloadMeds(); reloadContacts();
    };
    document.addEventListener('visibilitychange', maybeRefetch);
    window.addEventListener('focus', maybeRefetch);
    return () => {
      document.removeEventListener('visibilitychange', maybeRefetch);
      window.removeEventListener('focus', maybeRefetch);
    };
  }, [reloadPeople, reloadItems, reloadMeds, reloadContacts]);

  const top = stack[stack.length - 1] || null;
  const push = (o) => setStack((s) => [...s, o]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const closeAll = () => setStack([]);

  // people mutations — Supabase write, then refetch
  const savePerson = async (rec) => {
    if (rec.id) await updatePerson(rec.id, { name: rec.name, color: rec.color });
    else await createPerson(family.id, { name: rec.name, color: rec.color });
    await reloadPeople();
  };
  const removePersonById = async (id) => {
    await deletePerson(id); // DB cascade removes this person's items + meds rows
    await Promise.all([reloadPeople(), reloadItems(), reloadMeds()]);
  };

  // item mutations
  const saveItem = async (rec) => {
    if (rec.id) await updateItem(rec.id, rec);
    else await createItem(family.id, rec);
    await reloadItems();
  };
  const removeItemById = async (id) => { await deleteItem(id); await reloadItems(); };

  // med mutations
  const saveMed = async (rec) => {
    if (rec.id) await updateMed(rec.id, rec);
    else await createMed(family.id, rec);
    await reloadMeds();
  };
  const removeMedById = async (id) => { await deleteMed(id); await reloadMeds(); };

  // contact mutations — items embed a copy of their linked contact, so
  // contact changes (and deletes → SET NULL) refetch items too
  const saveContact = async (rec) => {
    if (rec.id) await updateContact(rec.id, rec);
    else await createContact(family.id, rec);
    await Promise.all([reloadContacts(), reloadItems()]);
  };
  const removeContactById = async (id) => { await deleteContact(id); await Promise.all([reloadContacts(), reloadItems()]); };

  if (people === undefined || items === undefined || meds === undefined || contacts === undefined) return <LoadingScreen label="Loading…" />;

  const peopleById = Object.fromEntries(people.map((p) => [p.id, p]));
  const peopleSummary = people.length ? people.map((p) => p.name).join(', ') : 'No one added yet';

  // Show items/meds only for people who still exist — guards the brief gap
  // between a person delete and the items/meds refetch.
  const visibleData = {
    people,
    items: items.filter((it) => peopleById[it.personId]),
    meds: meds.filter((m) => peopleById[m.personId]),
  };

  const onAdd = () => push({ type: tab === 'calendar' ? 'calForm' : tab === 'medication' ? 'medForm' : 'contactForm' });
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
      overlay = <CalendarForm people={people} contacts={contacts} initial={initial}
        onCancel={pop}
        onSave={async (rec) => { try { await saveItem(rec); pop(); } catch (e) { console.error('Save item failed:', e); } }}
        onDelete={async () => { try { await removeItemById(top.editId); closeAll(); } catch (e) { console.error('Delete item failed:', e); } }} />;
    } else if (top.type === 'medForm') {
      const initial = top.editId ? meds.find((x) => x.id === top.editId) : null;
      overlay = <MedForm people={people} initial={initial}
        onCancel={pop}
        onSave={async (rec) => { try { await saveMed(rec); pop(); } catch (e) { console.error('Save med failed:', e); } }}
        onDelete={async () => { try { await removeMedById(top.editId); closeAll(); } catch (e) { console.error('Delete med failed:', e); } }} />;
    } else if (top.type === 'settings') {
      overlay = <SettingsHome onBack={pop} peopleSummary={peopleSummary}
        onPeople={() => push({ type: 'people' })}
        onInvite={() => push({ type: 'invite' })}
        onSignOut={requestSignOut} />;
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
    } else if (top.type === 'contactForm') {
      const initial = top.editId ? contacts.find((x) => x.id === top.editId) : null;
      overlay = <ContactForm initial={initial}
        onCancel={pop}
        onSave={async (rec) => { try { await saveContact(rec); pop(); } catch (e) { console.error('Save contact failed:', e); } }}
        onDelete={async () => { try { await removeContactById(top.editId); closeAll(); } catch (e) { console.error('Delete contact failed:', e); } }} />;
    }
  }

  const onAddPerson = () => push({ type: 'personForm' });
  let tabScreen;
  if (tab === 'calendar') {
    tabScreen = <CalendarTab data={visibleData} role={role} onTab={setTab} onGear={onGear} onAdd={onAdd} onAddPerson={onAddPerson}
      onOpenItem={(id) => push({ type: 'itemDetail', id })} onSignOut={requestSignOut} />;
  } else if (tab === 'medication') {
    tabScreen = <MedicationTab data={visibleData} role={role} onTab={setTab} onGear={onGear} onAdd={onAdd} onAddPerson={onAddPerson}
      onOpenMed={(id) => push({ type: 'medForm', editId: id })} onSignOut={requestSignOut} />;
  } else {
    tabScreen = <ContactsTab contacts={contacts} role={role} onTab={setTab} onGear={onGear} onAdd={onAdd}
      onOpenContact={(id) => push({ type: 'contactForm', editId: id })} onSignOut={requestSignOut} />;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {tabScreen}
      {overlay && <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>{overlay}</div>}
      {deletePersonId && peopleById[deletePersonId] && (
        <DeletePersonDialog
          person={peopleById[deletePersonId]}
          itemCount={items.filter((it) => it.personId === deletePersonId).length}
          medCount={meds.filter((m) => m.personId === deletePersonId).length}
          onCancel={() => setDeletePersonId(null)}
          onConfirm={async () => { try { await removePersonById(deletePersonId); setDeletePersonId(null); pop(); } catch (e) { console.error('Delete person failed:', e); } }} />
      )}
      {confirmSignOut && (
        <SignOutDialog
          onCancel={() => setConfirmSignOut(false)}
          onConfirm={() => { setConfirmSignOut(false); onSignOut(); }} />
      )}
    </div>
  );
}
