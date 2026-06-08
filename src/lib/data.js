// Data model + seed data (SPEC §5–§8).
// While we build the UI, data lives here as in-memory seed data.
// This is the layer that will later be swapped for Supabase.

export const TODAY_ISO = '2026-06-07';

export function seedData() {
  return {
    people: [
      { id: 'p1', name: 'Dad', color: 'amber' },
      { id: 'p2', name: 'Mum', color: 'blue' },
      { id: 'p3', name: 'Aimee', color: 'pink' },
    ],
    items: [
      { id: 'i1', personId: 'p3', type: 'Appointment', title: 'GP follow-up', date: '2026-06-03', time: '4:00 PM',
        description: 'Review blood-pressure results from last visit. Bring the home readings log.',
        refs: [{ label: 'Previous result', url: '#', kind: 'doc' }] },
      { id: 'i2', personId: 'p1', type: 'Appointment', title: 'Blood pressure check', date: '2026-06-07', time: '9:00 AM',
        description: 'Community nurse home visit. No prep needed.',
        refs: [] },
      { id: 'i3', personId: 'p2', type: 'Bill', title: 'Water bill', date: '2026-06-07', time: '',
        description: 'Quarterly water charge. Due today — pay via the council portal.',
        refs: [{ label: 'Council portal', url: '#', kind: 'doc' }] },
      { id: 'i4', personId: 'p2', type: 'Test', title: 'Blood test', date: '2026-06-12', time: '8:00 AM',
        description: 'Fasting from midnight — water only. Lab is on the ground floor, room 4.',
        refs: [{ label: 'Lab referral letter', url: '#', kind: 'doc' }, { label: 'Map to clinic', url: '#', kind: 'image' }] },
      { id: 'i5', personId: 'p1', type: 'Appointment', title: 'Cardiology review', date: '2026-06-18', time: '2:15 PM',
        description: 'Follow-up with Dr. Okafor. Bring current medication list.',
        refs: [{ label: 'Last ECG', url: '#', kind: 'image' }] },
      { id: 'i6', personId: 'p3', type: 'Appointment', title: 'Orthodontist', date: '2026-06-24', time: '11:00 AM',
        description: 'Routine brace adjustment. Bring retainer case.',
        refs: [] },
      { id: 'i7', personId: 'p2', type: 'Appointment', title: 'Physiotherapy', date: '2026-06-28', time: '10:30 AM',
        description: 'Session 3 of 6. Wear comfortable clothing.',
        refs: [] },
    ],
    meds: [
      { id: 'm1', personId: 'p1', name: 'Amlodipine', dose: '5 mg', times: ['Morning'], food: 'with', note: '' },
      { id: 'm2', personId: 'p1', name: 'Atorvastatin', dose: '20 mg', times: ['Evening'], food: 'none', note: 'After dinner' },
      { id: 'm3', personId: 'p2', name: 'Levothyroxine', dose: '50 mcg', times: ['Morning'], food: 'without', note: '30 min before breakfast' },
      { id: 'm4', personId: 'p2', name: 'Metformin', dose: '500 mg', times: ['Morning', 'Evening'], food: 'with', note: '' },
      { id: 'm5', personId: 'p2', name: 'Iron', dose: '1 tablet', times: ['Noon'], food: 'with', note: '' },
      { id: 'm6', personId: 'p3', name: 'Vitamin D', dose: '1 tablet', times: ['Morning'], food: 'with', note: '' },
      { id: 'm7', personId: 'p3', name: 'Cetirizine', dose: '1 tablet', times: ['Noon'], food: 'none', note: '' },
    ],
  };
}

export function emptyData() {
  return { people: [], items: [], meds: [] };
}

// People-with-data but no items/meds (calendar & med empty states, editor)
export function peopleOnlyData() {
  return { people: seedData().people, items: [], meds: [] };
}

export const uid = () => 'x' + Math.random().toString(36).slice(2, 9);
