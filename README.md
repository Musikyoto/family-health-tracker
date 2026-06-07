# Family Health Tracker

A mobile-friendly website for a family to keep track of **medical appointments, tests, bills, and medications** — all in one calm, low-noise place.

Built because existing family apps carry too many unused features. This is deliberately stripped down to health and scheduling only, designed for **non-technical family members** to open and understand at a glance.

---

## Status

🎨 **Design complete** — viewing screens, editing flows, visual language, and access model are all locked.
🛠️ **Build not yet started.**

## Source of truth

📄 **[`docs/SPEC.md`](docs/SPEC.md)** — the full design specification. Every locked decision lives there: platform, access model, all screens, the visual language (with color tokens), form field sets, and the threads still open before build.

> Update `SPEC.md` whenever a design decision changes. It is the single source of truth.

---

## At a glance

| | |
|---|---|
| **Platform** | Mobile-friendly website (PWA-capable). Not a native app. |
| **Access** | Secret links — one view-only link for family, one edit link kept private. No passwords. |
| **Audience** | Non-technical family. Glance-and-understand is the design priority. |
| **Look** | Warm, light, calm. Green→teal gradient accents, large readable dates. Not clinical. |
| **Now vs later** | Built family-first; designed product-ready. A subscription product is a possible future, not the current build. |

## Main features

- **Calendar** — month view with red dots on days that have appointments, tests, or bills. Tap a day to see its items; tap an item for full detail (date, time, notes, and links to documents/prescriptions in Drive).
- **Medication** — a separate tab grouped by Morning / Noon / Evening, with each medicine labelled by person, showing dose and food/timing notes.
- **People** — a family-defined list (name + color); each person stays visually distinct across the app.
- **Settings** — editor-only area for managing people and the invite links.

---

## Repo structure

```
family-health-tracker/
├── README.md        ← you are here
└── docs/
    └── SPEC.md      ← full design specification
```

(Code directories — e.g. `src/`, `public/` — slot in here once the build begins.)

## Working conventions

- Plan in chat → build in Claude Code, one task at a time, verifying before moving on.
- Commit and push after every meaningful session.
- Show diffs with surrounding context for code changes.
