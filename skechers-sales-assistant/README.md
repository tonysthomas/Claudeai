# Skechers Sales Assistant

A **mobile-first, AI-powered retail sales assistant for Skechers store
associates**. After a customer selects or scans a Skechers product, the app
recommends the **next best approved product(s)** — an upgrade, an alternative,
socks, shoe-care, or a complementary item — each with a ready-to-say selling
sentence, so associates can attach, upsell, and cross-sell with confidence and
consistency.

> **Core principle:** the app recommends **only approved products** in the
> Skechers ecosystem. It never invents products, prices, features,
> technologies, availability, or claims.

**Operating context.** Built for an **authorized exclusive Skechers retail
partner**. Subject to the partner agreement and approvals, it may eventually use
official Skechers product information and approved catalogue references. During
development it uses **synthetic demo data only** — no live retrieval, no
scraper/crawler — and never claims endorsement or authorization beyond the
actual agreement, nor presents itself as a public Skechers website.

**Data sources (multi-source, adapter-based).** The app is designed to draw from
several product-data sources behind a common source-adapter layer — authorized
website, approved catalogue, official API/feed, internal manual entry, and
synthetic demo data — all normalized, validated, and approved into one internal
database that is the single runtime source of truth. See `PROJECT_PLAN.md` §3a.

## Status

**Phases 1–6 complete.** Planning & setup, database foundation (8 tables +
synthetic seed), catalogue-import workflow, the mobile UI shell, the rules-based
recommendation engine, and **associate authentication + store context**
(Supabase Auth, `associate_profiles`, RLS-enforced event identity). **DEMO_MODE**
is preserved for local dev and tests (synthetic associate, no login required).
No AI or real Skechers data yet.

**Phases 7 & 9 complete.** Associates can record an outcome (added to basket /
interested / declined / unavailable / not relevant) under each recommendation
(RLS-safe, PII-free); and, **in DEMO_MODE only**, expand a **sales guidance**
panel (discovery question · selling point · objection handling · closing
question, each copyable) built from deterministic synthetic content + the stored
approved reason/benefit. Remaining phases (8 inventory, 10 analytics) are paused;
AI work (grounded assist, LLM rephrasing, AI re-ranking, RAG, AI Sales Coach) is
later/future (Phase 11+).

### Roadmap

1. Project foundation and architecture — ✅
2. Database schema and product relationships — ✅
3. Product catalogue and approved import workflow — ✅
4. Mobile UI, product lookup, and customer needs — ✅
5. Rules-based recommendation engine — ✅
6. Associate authentication and store context — ✅
7. Recommendation outcomes and associate feedback — ✅
8. Inventory and store stock integration — paused
9. Demo sales guidance layer — ✅ (demo mode only)
10. Performance analytics dashboard — paused
11. AI Sales Coach — later / future
12. Final testing, deployment, security, and governance — future

### Auth & DEMO_MODE

- With `VITE_DEMO_MODE=true` (default), the app runs as a synthetic demo
  associate — **no login required** — and recommendation events are anonymous.
  This keeps local dev and the automated tests working offline.
- With `VITE_DEMO_MODE=false` (production), routes are protected: associates sign
  in with Supabase email/password, and recommendation events carry the session
  associate + assigned store (the client cannot forge them — RLS enforces it).
- **Never** put the Supabase **service-role** key in the frontend; only
  `VITE_SUPABASE_ANON_KEY` is used client-side.

Start here:

- [`CLAUDE.md`](./CLAUDE.md) — rules, scope, and standards for anyone (human or
  agent) working in this project.
- [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) — product overview, workflow, phase
  roadmap, architecture, database entities, recommendation logic, open
  decisions, and definition of done.
- [`DECISIONS.md`](./DECISIONS.md) — technology stack rationale and
  architectural decisions with alternatives considered.
- [`.env.example`](./.env.example) — environment variables that will eventually
  be required (names only).

## Proposed stack (see `DECISIONS.md` for rationale)

TypeScript · React 18 · Vite (PWA) · Tailwind CSS · React Router · TanStack
Query · Supabase (Postgres + Auth + Storage + RLS + Edge Functions) · Vitest ·
Playwright.

## Workflow (MVP)

1. Associate enters or scans a product code → 2. app shows the product → 3.
associate picks a customer need → 4. app shows **three prioritized
recommendations** (image, name, price, type, reason, benefit, selling sentence,
availability) → 5. associate records the outcome.

## Getting started (frontend)

Mobile-first React + Vite + Tailwind app for the associate flow: **search a
product → view details → select a customer need**. Reads the existing `products`
and `customer_needs` tables via Supabase (public anon key only).

```bash
cd skechers-sales-assistant
npm install

# Point at a local Supabase (or any Supabase project). Copy the env template:
cp .env.example .env
#   VITE_SUPABASE_URL=...        (e.g. http://127.0.0.1:54321 for local supabase)
#   VITE_SUPABASE_ANON_KEY=...   (public anon key ONLY — never the service role)
#   VITE_DEMO_MODE=true          (labels prices/availability as demo)

npm run dev         # start the dev server (http://localhost:5173)
npm run typecheck   # tsc --noEmit
npm test            # vitest (unit + UI component tests)
npm run build       # production build → dist/
npm run preview     # preview the production build
```

To populate data, run the database migrations + seed (see
[`database/VALIDATION.md`](./database/VALIDATION.md)) against your local Supabase,
then start the app. The demo shows synthetic products only and never presents
itself as an official Skechers application.

## Working conventions

Development proceeds **phase by phase**, with an approval gate before each next
phase. See the roadmap in `PROJECT_PLAN.md`.
