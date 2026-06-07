# Family Health Tracker — Design Specification

> **Status:** Design complete (viewing, editing, visual language, access model). Build not yet started.
> **Purpose:** Single source of truth for all locked design decisions. Update this doc whenever a decision changes.
> **Last updated:** June 2026

---

## 1. What this is

A mobile-friendly website for a family to track **medical appointments, tests, bills, and medications** in one simple, low-noise place. Built because existing apps (e.g. FamilyWall) carry too many unused features; this is stripped down to health/scheduling only.

**Primary goal:** get the family using it ASAP.
**Secondary goal:** market it to the public later as a subscription product.

**Guiding principle:** the users are non-technical (parents, sibling). Every screen optimizes for *glance-and-understand* — large readable text, minimal navigation, nothing to learn.

---

## 2. Platform & monetization

- **Build:** Mobile-friendly **website** (responsive web app), **not** a native app.
- **PWA-capable:** built so it can be "added to home screen" and feel app-like, with no app-store install. No native app unless push notifications or store reach later prove necessary.
- **Monetization (future):** subscription (families pay monthly/yearly), billed via Stripe. No app-store cut. Not built now.

**Rationale:** secret-link access, non-technical family, no notifications needed, and subscription model all favor web over native. Web is also the *better* monetization path here, not a compromise.

---

## 3. Family-first vs product-ready (the core build discipline)

**Decision: design product-ready, build family-first.**

- The **data model is generic from day one** — e.g. people are a user-defined list, not hardcoded "Mum/Dad". Item types are extensible. This means going public later is *additive*, not a rewrite.
- **Do NOT build multi-tenant machinery now** — no accounts, no billing, no data-isolation-between-families, no compliance layer. Validate with the real family first.
- The **access layer (secret links) is the disposable part** — it gets replaced by real accounts when monetizing. The viewing/editing screens and visual language all carry over.

---

## 4. Information architecture

Two primary tabs at the top (tab switcher), plus a settings area behind a gear icon.

```
App
├── Calendar tab (default)
│   └── tap a day → day's items appear below
│         └── tap an item → full item detail (deep-dive)
├── Medication tab
│   └── Morning / Noon / Evening sections, meds grouped by person
└── Settings (gear icon, top-right, EDITORS ONLY)
    ├── People (manage who is tracked)
    ├── Invite links (manage view + edit links)
    ├── Bills (deferred placeholder)
    └── Account (future, for going public)
```

---

## 5. People

People are a **user-defined list** (generic — works for any family).

**Each person has:**
- **Name** (free text — "Dad", "Mum", "Aimee", "Grandpa", anything)
- **Color** (chosen from a small preset palette — NOT a full color wheel; presets guarantee legibility and spacing)

**Derived:** the avatar initial = first letter of the name. No separate field.

**No "relationship" field** — the name *is* the label. (Add later only if a bigger product needs formal profiles.)

**This family's people (placeholder data):** Dad, Mum, Aimee.

**Person colors are independent of the app theme** — each person stays visually distinct (Dad = amber, Mum = blue, Aimee = pink in mockups). These identity colors persist regardless of the green/teal app accent.

Managed from **Settings → People**. Each row is tappable to edit/remove.

---

## 6. Calendar tab (default view)

### Month grid
- Standard month calendar, **week starts Sunday**.
- **Today** = a filled circle with the green→teal gradient; the date number sits large inside it.
- **Days with something scheduled** show a single **red dot** beneath the number.
  - Red is deliberately kept (not themed green) so the "something here" signal pops against the calm green UI.
  - A single dot means "tap to see" — dots are NOT color-coded by type or person (keeps the grid calm).
- **Empty days are dimmed and NOT tappable.** (Consequence: adding to an empty day happens via the global "+", not by tapping the day — see §9.)
- **Dates are large and legible** (~17px), the most prominent element in the grid. Weekday letters, nav arrows, and empty days are all quieted so the dates dominate. Generous row spacing for breathing room.

### What appears on the calendar
- **Appointments, tests, and bills** — i.e. dated events.
- **Medications do NOT appear on the calendar** — they recur daily and would flood every day with dots, destroying the signal. Meds live in their own tab.

### Tapping a day
- The selected day highlights; its items expand **below the calendar** (stay on page, nothing navigates away).
- Each item row: colored person-initial, item title, and a meta line (person · time · short note).
- Empty state for a tapped day: a calm "Nothing scheduled" (largely moot since empty days aren't tappable).

---

## 7. Item detail (deep-dive)

Tapping an item opens its full detail. Fields:

1. **Date**
2. **Time**
3. **Description** — free text (notes, prep instructions, location, etc.)
4. **References & documents** — a list of **labelled, tappable links**.
   - Each reference = a **label** (e.g. "Referral letter", "Previous result") + a **URL**.
   - Icon hints at type: document icon for files/links, photo icon for image links.
   - **Links only — the app does NOT host/upload files.** Documents and prescription photos live in the family's own Google Drive / Photos; the app links out to them. Tapping opens them externally (where they can be zoomed, etc.).
   - **Prescription photos:** handled as links now (photograph into Drive, paste link). True in-app photo upload is **deferred** to when the product backend exists (see §12).

---

## 8. Medication tab

Organized into **three time-of-day sections: Morning / Noon / Evening.**

Under each section, medications are listed and **labelled by person** (colored initial + name).

**Each medication shows:**
- **Drug name**
- **Dose** (e.g. "1 tablet", "500 mg") — shown on a pill-shaped tag
- **Person** (colored initial)
- **Food/timing note** where relevant (e.g. "with food", "after dinner")

**Behavior:**
- This is a **reference view, not a checklist** — NO "mark as taken" / check-off. (No reminders or per-day state was requested; adding it later would make the app stateful — a much bigger build.)
- A medication assigned to multiple times (e.g. Morning + Evening) **appears in each relevant section.** This is correct, not duplication — it's one underlying med shown in both places; editing it updates both.

---

## 9. Editing flow

Two forms, one per data type. Each form is **reused for both Add and Edit** (Edit opens it pre-filled). Consistent look between the two forms and with the viewing screens.

### Entry point
- A **global "+" / "Add item"** action (e.g. floating button / button below the day detail). Opens a **blank form with a date picker inside** — this sidesteps the non-tappable-empty-day problem (you pick the date in the form rather than tapping a day first).

### Form A — Calendar item (appointment / test / bill)
Fields:
- **Who is it for** — person picker, **single-select** (1 item = 1 person). Selected avatar is ringed in the green→teal gradient.
- **Type** — pills: **Appointment / Test / Bill / + Custom**.
  - "Custom" lets a family define their own types (future-proofing for marketing).
  - **This settles the bills question:** bills are a *type on the calendar*, not a separate calendar.
  - (Custom-type visual distinction — icon/color per type — is a *later* refinement; simple labels are enough for now.)
- **Title** — free text.
- **Date** + **Time** — side by side; open the phone's native date/time pickers.
- **Description** — free text.
- **References & documents** — repeatable label+link rows ("Add a link"). Same pattern as §7. (Future: a "Take photo" option appears beside "Add a link" when upload is built.)

### Form B — Medication
Fields:
- **Who is it for** — single-select person picker (same control as Form A).
- **Medication** (name) + **Dose** — side by side (both short).
- **When to take** — **multi-select**: Morning / Noon / Evening (tap all that apply). Selecting multiple is what makes a med appear in multiple tab sections.
- **Food** — quick toggle: **With food / Without / No note**.
- **Note** — optional free text for specifics ("take 30 min before eating", "avoid dairy").
- **No date field** — meds are ongoing, not tied to a day.

### Delete
- The **Edit** version of each form needs a **Delete** action (red, at the bottom). The **New** version does not (nothing to delete yet).

### Open / unresolved field questions (not yet decided)
- **Short medication courses** (start/end date, auto-expire after N days, e.g. antibiotics) — NOT designed. Current model is ongoing-only. Decide if short courses are needed.
- Confirm the **medication form** field set is final (user moved to theming before confirming).

---

## 10. Settings

- Reached via a **gear icon, top-right** of the main screen (NOT a bottom nav bar — a bottom bar would over-promote a rarely-used admin area and create competing navigation; the top tabs already handle daily switching).
- **Editors only:** the gear (and all add/edit buttons) **do not render** for view-only visitors.
- Settings is the editor's control center. Contents:
  - **People** (§5)
  - **Invite links** (§11)
  - **Bills** — deferred placeholder
  - **Account** — future, for going public

---

## 11. Access & roles (the "throwaway-but-fine-for-now" layer)

**Model: secret links. No passwords/logins.** Two roles, expressed by **which link you arrived through.**

### Two links
1. **View-only link** — *hand out freely* to family (Mum, Dad, Aimee). Renders the app read-only: no gear, no "+", taps open items for viewing only.
2. **Edit link** — *keep private* (you + your brother). Full access: view, add, edit, delete, Settings.

### Management
- Both links are managed from **Settings → Invite links** (editors only).
- Each link has **Copy** and **Regenerate**.
- **Regenerate warns before acting** — it invalidates the link for *everyone* on it; they must be re-sent the new link.
- The **edit link is the sensitive one** — if leaked, someone can alter the family's medical records. Treat with care.

### First-time experience
- The **first** time someone opens a link: a calm **welcome screen** — "Welcome to your family's health space" + a single **Enter** button.
- Welcome is **generic (no name)** — a *shared* view link can't identify who's opening it.
- On **every subsequent visit:** land straight on the **calendar**, no welcome, no friction.

### Known limitations (accepted for family-first)
- **Not real security** — anyone with a link gets that access. Acceptable for family-internal use; chosen knowingly.
- **No per-person revocation** — regenerating a link kicks off *everyone* on it. (Per-person viewer links were considered and declined for simplicity; per-person control arrives naturally with real accounts when monetizing.)
- **Does not survive going public** — this whole layer is replaced by real accounts for paying customers. Expected. The screens/visual language carry over; this is the disposable piece.

---

## 12. Deferred to "going public" (do NOT build now)

- Real accounts (sign-up, login, password reset, sessions)
- Multi-tenant data isolation (family A never sees family B)
- Medical-data compliance (consent, retention, deletion, jurisdictional health-data law)
- Billing / subscriptions (Stripe), onboarding, support
- **True in-app photo/file upload** + file storage (e.g. Supabase Storage) — biggest reason: hosting prescription images makes you a custodian of highly sensitive medical data; defer until the backend exists anyway.
- Per-person invite links + per-person revocation
- Custom item-type theming (per-type icons/colors)

---

## 13. Visual language (LOCKED)

The complete visual identity. Applies app-wide.

### Theme
- **Light only.** No dark mode (doubles design/test surface; not needed for daytime family glancing; easy to add later if demanded).
- **Warm, calm, health/wellbeing register** — explicitly NOT clinical/gray.

### Background
- A **gentle gradient wash** behind each screen: soft green → faint teal → pale neutral. Example used in mockups:
  `linear-gradient(160deg, #E6F2EC 0%, #E8F3F1 55%, #EFF3ED 100%)`
- **White cards float on top of the wash.** All *information* (dates, text, doses) sits on clean white for maximum legibility. **Gradient lives in the margins, never under text/data.**

### Signature accent — green→teal gradient
- The app's signature, used on: **today's circle, active tab, primary buttons ("Enter", "Add item", "Save", "Copy"), selected states** (person-picker ring, multi-select med times, selected type pills).
- Gradient used in mockups: `linear-gradient(135deg, #2E8B57 0%, #1FA9A0 100%)`
- Direction/balance is tunable; current is an even green→teal split, 135°.

### Attention color
- **Red dots** for "something scheduled": `#E2542F` (warm red). Kept red on purpose — warm red against green/teal is the deliberate functional contrast.

### Type & color tokens (from mockups — refine in build)
- **Deep text (headings/dates):** `#1F4A40` / `#2C4632`
- **Body / meta text:** `#6E938A` / `#5A8175`
- **Muted (weekday letters, empty days, placeholders):** `#9CBAB1` / `#B7D0C8`
- **Card surface:** `#FFFFFF`
- **Soft input fields:** `#F5FAF8` background, `#DEEAE5` border
- **Dates:** ~17px, the visual star of the calendar grid.
- **Person identity colors (independent of theme):**
  - Dad — amber: bg `#FBE6C0`, text `#7A4E08`
  - Mum — blue: bg `#C9DEF5`, text `#0C447C`
  - Aimee — pink: bg `#F4CBDA`, text `#72243E`
  - (Future people pick from the preset palette: amber, blue, pink, green `#A8D5BA`, lavender `#D4C5E8`, peach `#F4CBA0`, aqua `#A0CFD8`.)

> Note: hex values are the mockup reference. Finalize as proper design tokens (CSS variables) during build.

---

## 14. Screen inventory (design status)

| Screen | Status |
|---|---|
| Calendar tab — month grid + tap-day detail | ✅ Designed |
| Item detail (deep-dive) | ✅ Designed |
| Medication tab — Morning/Noon/Evening by person | ✅ Designed |
| People management (list + add/edit) | ✅ Designed |
| Settings home | ✅ Designed |
| Invite links panel | ✅ Designed |
| Add/Edit calendar item form | ✅ Designed |
| Add/Edit medication form | ✅ Designed |
| First-time welcome | ✅ Designed |
| Visual language / theme | ✅ Locked |
| **Delete action on edit forms** | ⚠️ Specified, not mocked |
| **Empty states** (no data yet; first-run setup for editor) | ⚠️ Not designed |
| **Regenerate confirmation dialog** | ⚠️ Specified, not mocked |
| **Short medication courses** | ❓ Undecided |

---

## 15. Open threads to close before / during build

1. Does the **medication form** field set feel final?
2. **Short medication courses** (auto-expire) — needed or not?
3. **Delete** confirmation pattern (forms).
4. **Empty states** — especially the editor's very first run (no people, no items yet — needs an onboarding nudge to "add your first person").
5. **Regenerate** confirmation copy/behavior.

---

## 16. Working conventions (for build sessions)

- Plan in chat → execute in Claude Code, one task at a time, verify before proceeding.
- Push to GitHub after every meaningful session.
- Show diffs (with surrounding context) for any code change, not just prose descriptions.
