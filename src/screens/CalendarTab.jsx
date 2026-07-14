// Calendar tab + Item detail — SPEC §6, §7. Converted from the design export.
import React from 'react';
import { T } from '../lib/theme.js';
import { TODAY_ISO } from '../lib/data.js';
import { Icon } from '../components/Icon.jsx';
import { Avatar, PrimaryButton, TopBar } from '../components/ui.jsx';
import { Copyright } from '../components/Copyright.jsx';

const TODAY = TODAY_ISO; // '2026-06-07'
const pad2 = (n) => String(n).padStart(2, '0');
const isoOf = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
const FULL_WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Make a user-entered reference URL safe to open. Preserve an explicit scheme
// (https://…, mailto:, tel:), otherwise default to https:// so a bare
// "example.com" opens as an absolute URL instead of a relative path.
function normalizeUrl(url) {
  const u = (url || '').trim();
  if (!u) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(u) || /^(mailto|tel):/i.test(u)) return u;
  return `https://${u}`;
}

function buildWeeks(year, month) {
  const first = new Date(year, month, 1).getDay();           // 0=Sun
  const dim = new Date(year, month + 1, 0).getDate();
  const prevDim = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = first - 1; i >= 0; i--) cells.push({ day: prevDim - i, inMonth: false });
  for (let d = 1; d <= dim; d++) cells.push({ day: d, inMonth: true });
  let nx = 1;
  while (cells.length % 7 !== 0) cells.push({ day: nx++, inMonth: false });
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// Shared header: tabs + a top-right slot — gear (→ Settings) for editors,
// sign-out for viewers (who can't reach Settings).
const slotBtnStyle = {
  width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#fff',
  boxShadow: '0 2px 10px rgba(31,74,64,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0,
};
// Tab key (used for routing + active state) is decoupled from the display
// label, so the medication tab can show "Meds" while staying keyed 'medication'.
const TABS = [
  { key: 'calendar', label: 'Calendar', icon: 'calendar' },
  { key: 'medication', label: 'Meds', icon: 'pill' },
  { key: 'contacts', label: 'Contacts', icon: 'stethoscope' },
];
export function TabHeader({ active, onTab, role, onGear, onSignOut }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 16px 16px' }}>
      <img src="/mamori-mark.svg" alt="Mamori" width={54} height={54} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', gap: 4, padding: 4, background: '#fff', borderRadius: 15, boxShadow: T.shadowSoft }}>
        {TABS.map((t) => {
          const on = active === t.key;
          return (
            <button key={t.key} onClick={() => onTab(t.key)} style={{
              flex: 1, height: 46, borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: 0,
              background: on ? T.tealDeep : 'transparent', color: on ? '#fff' : T.body,
              fontSize: 11, fontWeight: on ? 700 : 600, letterSpacing: '0.1px',
              boxShadow: on ? '0 3px 10px rgba(15,110,86,0.28)' : 'none',
              transition: 'background 160ms ease, color 160ms ease',
            }}>
              <Icon name={t.icon} size={16} color={on ? '#fff' : T.body} strokeWidth={1.9} />
              {t.label}
            </button>
          );
        })}
      </div>
      {role === 'editor' ? (
        <button onClick={onGear} aria-label="Settings" style={slotBtnStyle}>
          <Icon name="gear" size={22} color={T.body} />
        </button>
      ) : (
        <button onClick={onSignOut} aria-label="Sign out" style={slotBtnStyle}>
          <Icon name="logout" size={21} color={T.body} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({ icon, title, body, action }) {
  return (
    <div style={{ padding: '38px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: '#fff', boxShadow: T.shadowSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        <Icon name={icon} size={28} color={T.accentSolid} strokeWidth={1.7} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.deep, marginBottom: 7 }}>{title}</div>
      <div style={{ fontSize: 14.5, color: T.body, lineHeight: 1.5, maxWidth: 250, fontWeight: 500 }}>{body}</div>
      {action && <div style={{ marginTop: 20, width: '100%', maxWidth: 220 }}>{action}</div>}
    </div>
  );
}

export function FAB({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Add item" style={{
      position: 'absolute', right: 20, bottom: 30, width: 58, height: 58, borderRadius: '50%', border: 'none',
      cursor: 'pointer', background: T.accent, color: '#fff', boxShadow: '0 8px 22px rgba(31,169,160,0.40)', zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
    }}>
      <Icon name="plus" size={26} color="#fff" strokeWidth={2.4} />
    </button>
  );
}

function ItemRow({ item, person, onClick }) {
  const meta = [person.name, item.type === 'Bill' ? 'Bill' : item.time, item.type === 'Bill' && !item.time ? 'due today' : null]
    .filter(Boolean).join(' · ');
  return (
    <div onClick={onClick} style={{
      background: T.card, borderRadius: 18, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 13,
      boxShadow: T.shadowSoft, cursor: 'pointer',
    }}>
      <Avatar person={person} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.deep, lineHeight: 1.25 }}>{item.title}</div>
        <div style={{ fontSize: 13, color: T.body, marginTop: 3, fontWeight: 500 }}>{meta}</div>
      </div>
      <Icon name="chevron" size={16} color={T.muted} strokeWidth={2} />
    </div>
  );
}

export function CalendarTab({ data, role, onTab, onGear, onAdd, onAddPerson, onOpenItem, onSignOut }) {
  const [vy, setVy] = React.useState(2026);
  const [vm, setVm] = React.useState(5); // June
  const [selected, setSelected] = React.useState(TODAY);
  const peopleById = Object.fromEntries(data.people.map((p) => [p.id, p]));

  const itemsByDate = {};
  data.items.forEach((it) => { (itemsByDate[it.date] = itemsByDate[it.date] || []).push(it); });

  const weeks = buildWeeks(vy, vm);
  const noItems = data.items.length === 0;
  const selInView = selected && selected.startsWith(isoOf(vy, vm, 1).slice(0, 7));
  const selItems = (selected && itemsByDate[selected]) || [];
  const selDate = selected ? new Date(selected + 'T00:00:00') : null;

  const shiftMonth = (dir) => {
    let m = vm + dir, y = vy;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setVm(m); setVy(y); setSelected(null);
  };

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 120 }}>
      <TabHeader active="calendar" onTab={onTab} role={role} onGear={onGear} onSignOut={onSignOut} />

      {/* Calendar card */}
      <div style={{ background: T.card, borderRadius: 26, margin: '0 16px', padding: '20px 16px 18px', boxShadow: T.shadowCard }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 14px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.deep, letterSpacing: '0.1px' }}>{MONTHS[vm]} {vy}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[-1, 1].map((d) => (
              <button key={d} onClick={() => shiftMonth(d)} style={{
                width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', background: T.fieldBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}>
                <Icon name={d < 0 ? 'back' : 'chevron'} size={16} color={T.body} strokeWidth={2.2} />
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', marginBottom: 4 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: '0.5px' }}>{w}</div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', marginTop: 6 }}>
            {week.map((cell, ci) => {
              const iso = cell.inMonth ? isoOf(vy, vm, cell.day) : null;
              const has = iso && itemsByDate[iso];
              const isToday = iso === TODAY;
              const isSel = iso && iso === selected && !isToday;
              const tappable = isToday || has;
              let numColor = T.muted, weight = 400, circle = {};
              if (!cell.inMonth) { numColor = T.faint; }
              else if (isToday) { numColor = '#fff'; weight = 700; circle = { background: T.accent, boxShadow: '0 4px 12px rgba(31,169,160,0.35)' }; }
              else if (isSel) { numColor = T.deep; weight = 700; circle = { background: T.selFill }; }
              else if (has) { numColor = T.deep; weight = 600; }
              return (
                <div key={ci} onClick={tappable ? () => setSelected(iso) : undefined}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4, cursor: tappable ? 'pointer' : 'default', userSelect: 'none' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, fontWeight: weight, color: numColor, fontVariantNumeric: 'tabular-nums', transition: 'background 140ms ease', ...circle,
                  }}>{cell.day}</div>
                  <div style={{ height: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    {has && <div style={{ width: 6, height: 6, borderRadius: '50%', background: isToday ? 'rgba(255,255,255,0.92)' : T.red }} />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Below the grid */}
      {noItems ? (
        role === 'editor' ? (
          data.people.length === 0 ? (
            <EmptyBlock icon="users" title="Add your first person"
              body="Start with the people you're tracking — then you can add their appointments, tests, and bills."
              action={<PrimaryButton icon="plus" onClick={onAddPerson}>Add a person</PrimaryButton>} />
          ) : (
            <EmptyBlock icon="inbox" title="No appointments yet"
              body="Add an appointment, test, or bill and it'll show up here on the day."
              action={<PrimaryButton icon="plus" onClick={onAdd}>Add item</PrimaryButton>} />
          )
        ) : (
          <EmptyBlock icon="inbox" title="Nothing scheduled yet"
            body="When appointments or tests are added, they'll appear here. Check back soon." />
        )
      ) : selInView ? (
        <div style={{ margin: '22px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 2px 12px' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.deep }}>
              {FULL_WD[selDate.getDay()]}, {MONTHS[selDate.getMonth()]} {selDate.getDate()}
            </span>
            {selected === TODAY && (
              <span style={{ fontSize: 12, fontWeight: 700, color: T.accentSolid, background: T.accentTint, padding: '2px 9px', borderRadius: 999, letterSpacing: '0.3px' }}>TODAY</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selItems.length ? selItems.map((it) => (
              <ItemRow key={it.id} item={it} person={peopleById[it.personId]} onClick={() => onOpenItem(it.id)} />
            )) : (
              <div style={{ background: T.card, borderRadius: 18, padding: '26px 16px', textAlign: 'center', boxShadow: T.shadowSoft, color: T.body, fontSize: 15, fontWeight: 500 }}>Nothing scheduled</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ margin: '26px 16px 0', textAlign: 'center', color: T.muted, fontSize: 14.5, fontWeight: 500 }}>
          Tap a day to see what's on.
        </div>
      )}

      <Copyright />
      {role === 'editor' && <FAB onClick={onAdd} />}
    </div>
  );
}

// ── Item detail (deep-dive) — SPEC §7 ────────────────────────────────
export function ItemDetail({ item, person, role, onBack, onEdit }) {
  const Row = ({ icon, label, value }) => (
    <div style={{ display: 'flex', gap: 13, padding: '14px 0', borderBottom: `1px solid ${T.fieldBorder}` }}>
      <Icon name={icon} size={20} color={T.accentSolid} strokeWidth={1.8} style={{ marginTop: 1, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.muted, letterSpacing: '0.3px', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: T.deep, lineHeight: 1.45 }}>{value}</div>
      </div>
    </div>
  );
  const dateObj = new Date(item.date + 'T00:00:00');
  const dateStr = `${FULL_WD[dateObj.getDay()]}, ${MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 40 }}>
      <TopBar title="" onBack={onBack}
        trailing={role === 'editor' && (
          <button onClick={onEdit} style={{ height: 42, padding: '0 18px', borderRadius: 999, border: 'none', cursor: 'pointer', background: '#fff', boxShadow: T.shadowSoft, color: T.accentSolid, fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }}>Edit</button>
        )} />

      <div style={{ padding: '4px 16px 0' }}>
        {/* hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <Avatar person={person} size={54} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 23, fontWeight: 700, color: T.deep, lineHeight: 1.2, letterSpacing: '0.1px' }}>{item.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: T.body }}>{person.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.body, background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{item.type}</span>
            </div>
          </div>
        </div>

        <div style={{ background: T.card, borderRadius: 22, padding: '4px 18px 16px', boxShadow: T.shadowCard }}>
          <Row icon="calendar" label="DATE" value={dateStr} />
          {item.time && <Row icon="clock" label="TIME" value={item.time} />}
          {item.description && <Row icon="doc" label="DESCRIPTION" value={item.description} />}

          {/* References */}
          <div style={{ paddingTop: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.muted, letterSpacing: '0.3px', marginBottom: 10 }}>REFERENCES &amp; DOCUMENTS</div>
            {item.refs && item.refs.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {item.refs.map((r, i) => {
                  const href = normalizeUrl(r.url);
                  const Tag = href ? 'a' : 'div';
                  return (
                    <Tag key={i} {...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {})}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 14, background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, cursor: href ? 'pointer' : 'default', textDecoration: 'none', color: 'inherit' }}>
                      <Icon name={r.kind === 'image' ? 'image' : 'doc'} size={20} color={T.accentSolid} strokeWidth={1.8} />
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: T.deep }}>{r.label || href}</span>
                      {href && <Icon name="link" size={17} color={T.muted} strokeWidth={1.8} />}
                    </Tag>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: T.muted, fontWeight: 500, padding: '4px 0' }}>No links added.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
