# FridgeMind AI 🧊

**Your AI employee for zero food waste.**

A working prototype of the FridgeMind AI product described in the PRD — an AI
"Food Steward" that manages what's inside your fridge, tracks expiry, tells you
what to eat first, and suggests recipes to use up food before it's wasted.

It's a single self-contained `index.html` (no build step, no backend) that runs
the whole flow using `localStorage`, so you can try the full experience today.

## Run it

- **Locally:** open `fridgemind/index.html` in any modern browser.
- **Served:** any static host works. A demo fridge loads on first run so the
  app is populated from the start (clear or reload it from **Stats → Settings**).

## What's built (MVP scope from the PRD)

| PRD feature | Status in this prototype |
|---|---|
| **Smart food inventory** | ✅ Name, category, quantity/unit, purchase date, shelf life, expiry, location note |
| **Food status engine** | ✅ Every item auto-classified **Fresh / Use soon / Urgent / Expired** from its expiry date |
| **AI image recognition (scan)** | ✅ Photo scan → item list → confirm & add. Real recognition via OpenAI Vision when a key is set (Settings); demo recognition otherwise |
| **Quick add & manual entry** | ✅ One-tap common items + full manual form with auto shelf-life defaults per category |
| **Leftover tracking** | ✅ Log a cooked dish with a safe-to-eat window |
| **Daily AI reminder** | ✅ The **Food Steward** morning brief prioritises what to eat, flags expiries, suggests a recipe, and estimates money saved |
| **"I Finished" flow** | ✅ One tap removes the item and records it to consumption history |
| **Recipe recommendations** | ✅ Ranked to use your most *urgent* ingredients first, with have/missing ingredient chips and a match bar |
| **Dashboard** | ✅ Items in fridge, expiring ≤ 1 day, items rescued, money saved, items wasted, rescue rate, fridge-health breakdown, recent history |

## The "AI Employee" positioning

Per the PRD's standout suggestion, the app is framed around a **Food Steward**,
not a passive tracker. The home screen opens with a personalised brief:

> 👨‍🍳 **Good morning, Tony** — FridgeMind · your Food Steward
> 🟠 Spinach should be eaten today.
> 🟠 Milk expires tomorrow.
> 🍳 You have everything for a Banana Smoothie.
> 💰 Eating today's priorities saves ~AED 78 from the bin.

## How it maps to the PRD's data model

The `localStorage` shape mirrors the Supabase tables so a backend swap is
mechanical:

- **Food Items** → `store.items` — `{ id, name, category, quantity, unit, purchase, shelf, expiry, note }`
- **Consumption History** → `store.history` — `{ id, name, category, quantity, date, wasted, value }`
- **Users / Settings** → `store.settings` — `{ name, currency, itemValue, key }`
- **Notifications** — generated live by the Food Steward brief engine

Status, shelf-life defaults, and money-saved estimates are driven by a
per-category knowledge base (`CATEGORIES`) and an item→emoji/category map
(`ITEM_DB`), both easy to extend.

## Real AI vision (optional)

Add an OpenAI API key in **Settings** to recognise real fridge photos with
`gpt-4o-mini` vision. The key is stored only in your browser and is used only
for the photo→items call. Without a key, scanning runs in demo mode. Live API
calls require the app to be served over HTTPS.

## Not yet built (Phase 2/3 in the PRD)

Smart shopping list, family sharing, barcode scanner, voice logging, nutrition
dashboard, WhatsApp reminders, and the proactive Phase-3 habit insights
("you waste yogurt every month") are intentionally out of this first prototype.

---
*Prototype · UI: 🏠 Home · 🧊 Fridge · ＋ Scan · 🍳 Recipes · 📊 Stats · ⚙ Settings*
