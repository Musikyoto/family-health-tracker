import React from 'react';
import { seedData } from './lib/data.js';
import { CalendarTab } from './screens/CalendarTab.jsx';

// Step 2 of the build: render the Calendar tab on its own with seed data,
// to verify it matches the approved design before we wire up navigation,
// the other screens, and (later) Supabase.
//
// Handlers are stubs for now — they just log. They get real behaviour
// once the navigation/state machine is reassembled in a later step.

export default function App() {
  const [data] = React.useState(seedData);

  return (
    <CalendarTab
      data={data}
      role="editor"
      onTab={(t) => console.log('switch tab →', t)}
      onGear={() => console.log('open settings')}
      onAdd={() => console.log('add item')}
      onOpenItem={(id) => console.log('open item', id)}
    />
  );
}
