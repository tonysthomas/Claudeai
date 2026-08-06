# PROJECT_PLAN.md — Skechers Sales Assistant

Step 1 deliverable: planning and project setup. This document is the source of
truth for scope, architecture, and roadmap. Nothing here is built yet beyond
docs and the folder skeleton.

---

## 1. Product overview

A mobile-first web app (installable PWA) for **Skechers retail associates**.
The associate looks up a product the customer is holding, picks the customer's
need, and instantly gets **three prioritized, approved recommendations** — an
upgrade, an alternative, socks, shoe-care, or a complementary item — each with
ready-to-say selling language. The associate then logs what happened.

The goal is to lift ATV, UPT, and attach rates while making every associate as
confident and consistent as the best one on the floor — **without ever inventing
a product, price, feature, or claim.**

---

## 2. User workflow (MVP)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Associate enters or scans a product code                     │
│         (MVP: manual entry; camera scan is a later phase)       │
├─────────────────────────────────────────────────────────────────┤
│ 2. App displays the selected product (image, name, price)       │
├─────────────────────────────────────────────────────────────────┤
│ 3. Associate selects ONE customer need                          │
│    Everyday comfort · Walking · Work/long hours · Fitness ·     │
│    Travel · Style · Budget · Max cushioning · Support           │
├─────────────────────────────────────────────────────────────────┤
│ 4. App shows THREE prioritized recommendations                  │
├─────────────────────────────────────────────────────────────────┤
│ 5. Each recommendation card shows:                              │
│    image · name · price · recommendation type · reason ·        │
│    customer benefit · selling sentence · availability           │
├─────────────────────────────────────────────────────────────────┤
│ 6. Associate records an outcome per recommendation:             │
│    Presented · Interested · Added to basket · Declined ·        │
│    Unavailable · Not relevant                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase roadmap

Each phase ends with a review and an explicit approval gate before the next.

| Phase | Name | Focus | Notable exclusions |
|------|------|-------|--------------------|
| **1 (now)** | Planning & setup | This doc, `CLAUDE.md`, `DECISIONS.md`, folder skeleton, env template | No code/engine/UI/auth/AI/real data |
| **2** | Data model & seed | Supabase schema + migrations, enums/lookups, sample seed data, CSV import script, placeholder images | No UI yet |
| **3** | Core UI shell | React + Vite + Tailwind PWA shell, routing, product lookup + display, need selection (reads seed data) | No recommendation logic |
| **4** | Recommendation engine (rules-based) | Deterministic scoring/prioritization from stored relationships + rules; return top 3 across categories | No AI |
| **5** | Outcome logging | Record outcomes to DB (anonymous), narrow write policy, basic validation | No analytics dashboards |
| **6** | Auth | Supabase Auth for associates; attribute outcomes to associate/store | — |
| **7** | AI assist (grounded) | LLM re-ranking / phrasing constrained to approved catalog data; guardrails & evals | Never introduces new facts |
| **8** | Real data & scanning | Approved catalog import pipeline, camera barcode scanning | — |
| **9** | Integrations & analytics | POS/inventory & live availability, manager dashboards, A/B testing, i18n, offline sync | — |

---

## 4. Proposed architecture

### High level

```
┌──────────────────────────┐        ┌───────────────────────────────┐
│  React + Vite PWA (TS)    │  HTTPS │  Supabase                     │
│  Tailwind, React Router,  │───────▶│  • Postgres (relational)      │
│  TanStack Query           │        │  • Row Level Security         │
│  supabase-js client       │        │  • Storage (placeholder imgs) │
│                           │        │  • Auth (Phase 6+)            │
│  (browser, mobile-first)  │        │  • Edge Functions (Phase 7+)  │
└──────────────────────────┘        └───────────────────────────────┘
        ▲                                    ▲
        │ build/deploy                       │ migrations / seed / import
   Vercel / Netlify                    supabase CLI + scripts/import-products.ts
```

### Frontend architecture

- **React 18 + Vite + TypeScript**, mobile-first, installable via
  `vite-plugin-pwa`.
- **Routing:** React Router — screens map to the workflow: Lookup → Product →
  Need → Recommendations → Outcome.
- **Server state:** TanStack Query wrapping the Supabase client (caching,
  loading/error states).
- **Styling:** Tailwind CSS (utility-first, mobile-first breakpoints).
- **Structure:** feature-first. Each feature (`products`, `recommendations`,
  `outcomes`) owns its components, hooks, and types under `src/features/`.
  Shared UI primitives in `src/components/ui`. All data access via `src/lib`.
- **Recommendation logic** lives as pure TypeScript functions (Phase 4) so it is
  unit-testable independent of UI and DB.

### Backend & database architecture

- **Supabase** = managed Postgres + Auth + Storage + RLS + Edge Functions.
  Meets the relational-DB requirement and removes bespoke backend work for the
  MVP.
- **Schema as migrations** in `supabase/migrations/`; seed data in
  `supabase/seed/`.
- **Data flow:** catalog + recommendation rules are read-only to the client;
  outcomes are written through a narrow, validated RLS policy.
- **CSV import:** `scripts/import-products.ts` parses a sample CSV (papaparse)
  and upserts products/relationships via the service-role key (server-side only).
- **AI (Phase 7):** runs in a Supabase Edge Function so provider keys never
  reach the browser; strictly grounded on approved rows.

---

## 5. Database entity list

Detailed columns are defined at build time (Phase 2). Entities and relationships:

| Entity | Purpose | Key fields (indicative) | Relationships |
|--------|---------|-------------------------|---------------|
| `products` | Approved catalog | `id`, `product_code` (unique), `name`, `category`, `type`, `gender`, `price`, `currency`, `description`, `image_url`, `availability_status`, `is_active` | 1—* relationships & rules; referenced by outcomes |
| `customer_needs` | The 9 approved needs | `id`, `code`, `label`, `description` | referenced by rules & outcomes |
| `product_relationships` | Typed links between products | `id`, `from_product_id`, `to_product_id`, `relationship_type`, `priority` | self-ref many-to-many on `products` |
| `recommendation_rules` | Maps (product + need) → recommended product with approved copy | `id`, `source_product_id`, `need_id`, `recommended_product_id`, `recommendation_type`, `reason`, `customer_benefit`, `selling_sentence`, `priority`, `is_active` | joins `products` × `customer_needs` |
| `outcomes` | Anonymous result log | `id`, `source_product_id`, `need_id`, `recommended_product_id`, `recommendation_type`, `outcome`, `associate_id?`, `store_id?`, `created_at` | references products/needs; **no customer PII** |
| `associates` *(Phase 6)* | Login identity | `id`, `display_name`, `store_id`, `role` | referenced by outcomes |
| `stores` *(Phase 6)* | Store context | `id`, `name`, `region` | referenced by associates/outcomes |

**Enum-like values** (Postgres enums or lookup tables):

- `relationship_type`: `upgrade_to`, `alternative_to`, `pairs_with`,
  `recommended_add_on`, `lower_price_option`, `higher_price_option`,
  `best_for_activity`.
- `recommendation_type`: `premium_upgrade`, `alternative`, `socks`, `shoe_care`,
  `complementary`.
- `availability_status`: `in_stock`, `limited`, `out_of_stock`, `order_only`
  (static field in MVP — no live inventory).
- `outcome`: `presented`, `interested`, `added_to_basket`, `declined`,
  `unavailable`, `not_relevant`.

---

## 6. Recommendation logic outline (Phase 4 — rules-based, no AI)

Input: a **source product** + a **selected need**.

1. **Gather candidates** from `recommendation_rules` where
   `source_product_id = <product>` and `need_id = <need>` and `is_active`.
   Fall back to `product_relationships` (e.g. `best_for_activity`,
   `recommended_add_on`) when explicit rules are thin.
2. **Filter** to approved, active products only. Respect `availability_status`
   (do not hide, but surface it).
3. **Score / prioritize** using: rule `priority`, recommendation-type weighting,
   need match strength, and price fit relative to the source product.
4. **Diversify** the final three so the associate gets a useful mix — e.g. one
   upgrade/alternative shoe **plus** socks **plus** shoe-care — rather than three
   near-duplicates. The exact mix policy is an open decision (see below).
5. **Return top 3**, each carrying its stored `reason`, `customer_benefit`, and
   `selling_sentence`. **No copy is generated at runtime.**

Guardrail: the engine can only ever output products and copy that exist in the
approved tables. If there are fewer than three eligible recommendations, it
returns fewer and says so — it never pads with invented items.

---

## 7. Open decisions

Tracked here and mirrored in `DECISIONS.md` (see "Open questions"):

1. **Recommendation mix policy** — fixed slots (e.g. 1 shoe + socks + care) vs.
   pure priority ranking for the top 3?
2. **Availability model** — static per-product field is fine for MVP, but who
   maintains it, and how stale can it be before it misleads?
3. **Associate attribution** — do we need any associate/store identity in the
   MVP outcome log, or keep it fully anonymous until Phase 6 auth?
4. **Currency / multi-region** — single currency for MVP? When do i18n and
   multi-country pricing enter?
5. **Data ownership** — who curates approved products and, critically, the
   approved selling copy (reason/benefit/selling_sentence)?
6. **Scanning hardware** — camera-based barcode vs. store handheld scanners for
   the eventual scan flow.
7. **Package manager** — pnpm (recommended) vs. npm.

---

## 8. Definition of done (Step 1)

Step 1 is complete when:

- [x] `skechers-sales-assistant/` project folder exists, self-contained.
- [x] `CLAUDE.md`, `PROJECT_PLAN.md`, `DECISIONS.md`, and `README.md` are
      written and coherent.
- [x] Technology stack is chosen and each choice is justified (`DECISIONS.md`).
- [x] Folder structure is defined and the skeleton exists in the repo.
- [x] Database entities and relationships are specified (not yet migrated).
- [x] Eventual environment variables are documented (`.env.example`).
- [x] Project `.gitignore` protects secrets and build artifacts.
- [x] MVP and non-MVP boundaries are explicit.
- [ ] Changes committed and pushed to `claude/skechers-sales-assistant-d3jch5`.
- [ ] **No** app code, recommendation engine, full UI, auth, AI calls, or real
      Skechers data added.
- [ ] Reviewer approval obtained before starting Phase 2.
