# FridgeMind AI 🧊

**Your AI employee for zero food waste.**

An AI "Food Steward" that manages what's inside your fridge — it tracks expiry,
tells you what to eat first, and helps you finish food before it's wasted.

We're building this **phase by phase**. This repo currently ships **Phase 1
(the MVP, §6 of the PRD)** as a working prototype: a single self-contained
`index.html` (no build step, no backend) that runs the whole Phase 1 flow using
`localStorage`, in a shape that mirrors the planned Supabase schema.

## Run it

- **Locally:** open `fridgemind/index.html` in any modern browser.
- **Served:** any static host works. A demo fridge loads on first run so the
  app is populated from the start (clear or reload it from **Settings**).

## Phase 1 — MVP (what's built now)

Scoped exactly to the PRD's §6 "MVP Features":

| Phase 1 feature | Status |
|---|---|
| **Landing page + accounts** | ✅ Marketing landing → **sign up / log in** with email + password → gated app, with per-user fridge data and log out |
| **Smart food inventory** | ✅ Name, category, quantity/unit, **photo**, purchase date, shelf life, expiry, status |
| **Food status engine** | ✅ Every item auto-classified **Fresh / Use soon / Urgent / Expired** from its expiry date |
| **AI image recognition** | ✅ *Scan groceries* → recognises several items from one photo → confirm & add |
| **OCR** | ✅ *Scan a label* → reads **expiry date, manufacture date & brand** from packaging and pre-fills the item |
| **Leftover tracking** | ✅ Log a cooked dish with a safe-to-eat window |
| **Daily AI reminder** | ✅ The **Food Steward** brief prioritises what to eat, flags expiries, estimates money saved |
| **"I Finished" flow** | ✅ One tap removes the item and records it to consumption history |
| **Dashboard** | ✅ Items in fridge, expiring ≤ 1 day, food saved, money saved, waste, rescue rate, fridge-health breakdown, recent history |

**UI:** 🏠 Home · 🧊 Fridge · ＋ Scan · 📊 Stats · ⚙️ Settings.

### A note on authentication

Accounts are **browser-local** for this prototype: each user is stored in this
browser with a per-user salt and a SHA-256 password hash (no plaintext), and
each account gets its own isolated fridge. This stands in for the PRD's
**Supabase Auth** — swapping to real auth later is a drop-in replacement of the
`signup` / `login` functions. There's also an **"Explore the demo"** shortcut
that opens a guest account with no sign-up.

### Real AI vision & OCR (optional)

Add an OpenAI API key in **Settings** to recognise real fridge photos and read
real labels with `gpt-4o-mini` vision. The key is stored only in your browser
and used only for those calls. Without a key, scanning runs in demo mode. Live
API calls require the app to be served over HTTPS.

### How it maps to the PRD data model

The `localStorage` shape mirrors the Supabase tables so a backend swap is
mechanical:

- **Food Items** → `store.items` — `{ id, name, category, quantity, unit, purchase, shelf, expiry, note, photo }`
- **Consumption History** → `store.history` — `{ id, name, category, quantity, date, wasted, value }`
- **Users / Settings** → `store.settings` — `{ name, currency, itemValue, key }`
- **Notifications** — generated live by the Food Steward brief engine

Status, shelf-life defaults, and money-saved estimates are driven by a
per-category knowledge base (`CATEGORIES`) and an item→emoji/category map
(`ITEM_DB`), both easy to extend.

## Roadmap (next phases)

Deliberately **not** in Phase 1 — we'll add these in later phases:

- **Phase 2 (§7):** recipe recommendations, smart shopping list, family
  sharing, barcode scanner, voice logging, smart search, nutrition dashboard,
  WhatsApp reminders.
- **Phase 3 (§8):** the proactive AI employee — habit insights like
  "you waste yogurt every month" or "finish your chicken before buying more".

---
*FridgeMind AI · Phase 1 (MVP) prototype · data stored locally in your browser*
