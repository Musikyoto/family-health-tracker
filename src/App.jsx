import React from 'react';
import { seedData } from './lib/data.js';
import { CalendarTab, ItemDetail } from './screens/CalendarTab.jsx';
import { MedicationTab } from './screens/MedicationTab.jsx';
import { CalendarForm, MedForm } from './screens/Forms.jsx';

// Build progress: Calendar + Medication tabs, item detail, and add/edit/delete
// forms — all interactive. Data is in-memory seed data (Supabase comes later).
// Still stubbed (log only): the gear (Settings/People/Invite), built next round.

export default function App() {
  const [data, setData] = React.useState(seedData);
  const [tab, setTab] = React.useState('calendar');
  const [stack, setStack] = React.useState([]); // overlay stack of screens

  const role = 'editor';
  const top = stack[stack.length - 1] || null;
  const push = (o) => setStack((s) => [...s, o]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const closeAll = () => setStack([]);
  const peopleById = Object.fromEntries(data.people.map((p) => [p.id, p]));

  // mutations
  const upsert = (key, rec) => setData((d) => {
    const arr = d[key]; const i = arr.findIndex((x) => x.id === rec.id);
    const next = i >= 0 ? arr.map((x) => (x.id === rec.id ? rec : x)) : [...arr, rec];
    return { ...d, [key]: next };
  });
  const remove = (key, id) => setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));

  const onAdd = () => push({ type: tab === 'calendar' ? 'calForm' : 'medForm' });
  const onGear = () => console.log('open settings (built next round)');

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
      {overlay && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>{overlay}</div>
      )}
    </div>
  );
}
