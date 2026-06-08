import React from 'react';
import { seedData } from './lib/data.js';
import { CalendarTab } from './screens/CalendarTab.jsx';
import { MedicationTab } from './screens/MedicationTab.jsx';

// Build progress: Calendar + Medication tabs, with working tab switching.
// Still stubbed (log only): gear (Settings), + (forms), tapping an item.
// Those come alive once the remaining screens are converted and navigation
// is reassembled. Data is still in-memory seed data (Supabase comes later).

export default function App() {
  const [data] = React.useState(seedData);
  const [tab, setTab] = React.useState('calendar');

  const shared = {
    data,
    role: 'editor',
    onTab: setTab,
    onGear: () => console.log('open settings'),
    onAdd: () => console.log('add', tab === 'calendar' ? 'item' : 'medication'),
  };

  return tab === 'calendar' ? (
    <CalendarTab {...shared} onOpenItem={(id) => console.log('open item', id)} />
  ) : (
    <MedicationTab {...shared} />
  );
}
