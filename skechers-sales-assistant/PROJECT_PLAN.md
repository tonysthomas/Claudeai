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

**Operating context.** The app is for an **authorized exclusive Skechers retail
partner**. Subject to the applicable approval and partner agreement, it should
eventually be able to use official Skechers website product information and,
later, approved catalogue references. It may eventually need official product
data such as: images, product names, style numbers, SKUs/product codes,
descriptions, features, Skechers technologies, prices, currency, region, sizes,
product URLs, socks, shoe-care products, and approved upgrade / alternative /
add-on relationships. Until the partner agreement and approvals are in place,
development uses synthetic demo data only, with no live retrieval or scraping,
and the app never claims endorsement or authorization beyond the actual
agreement.

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

> **Delivery log (linear execution order).** ✅ **1. Planning & setup** → ✅
> **2. Data model & seed** → ✅ **3. Catalogue import workflow**
> (`database/IMPORT.md`) → ✅ **4. Mobile UI shell** (product lookup + detail +
> customer-need selection) → ✅ **5. Rules-based recommendation engine**
> (upgrade / alternative / add-on + anonymous display logging) → ▶ **next: auth**.
> The table below lists the thematic work-areas; their numbers are stable
> references used across the docs/code (e.g. "auth = Phase 6"). Catalogue import
> delivered the approved-import foundation of the "Real data" area (thematic
> Phase 8) early.

| Phase | Name | Focus | Notable exclusions |
|------|------|-------|--------------------|
| **1 ✅** | Planning & setup | This doc, `CLAUDE.md`, `DECISIONS.md`, folder skeleton, env template | No code/engine/UI/auth/AI/real data |
| **2 ✅** | Data model & seed | Supabase schema + migrations (8 tables), enums, RLS, synthetic seed, placeholder images, validation | No UI yet |
| **3 ✅** | Core UI shell | React + Vite + Tailwind app, routing, product lookup + display, need selection (reads catalogue data) | No recommendation logic |
| **4 ✅** | Recommendation engine (rules-based) | Deterministic prioritization from approved `product_relationships`; top-3 across categories; anonymous display logging | No AI |
| **5** | Outcome logging | Record outcomes to DB (anonymous), narrow write policy, basic validation | No analytics dashboards |
| **6** | Auth | Supabase Auth for associates; attribute outcomes to associate/store | — |
| **7** | AI assist (grounded) | LLM re-ranking / phrasing constrained to approved catalog data; guardrails & evals | Never introduces new facts |
| **8** | Real data & scanning | Approved catalog import pipeline **(import foundation ✅ delivered — `database/IMPORT.md`)**, camera barcode scanning | — |
| **9** | Integrations & analytics | POS/inventory & live availability, manager dashboards, A/B testing, i18n, offline sync | — |
| **10** | Security hardening & deployment | Production RLS/permission review (see checklist below), secrets & env hardening, deploy pipeline | Final phase before launch |

### Pre-production security review (required before launch — Phase 10)

The demo's anonymous read policy is acceptable **only** because it exposes
synthetic products. Before production, the security & deployment phase must
review and restrict:

- [ ] **Who can view products** — scope/limit what unauthenticated clients see
      (current demo allows anonymous reads of synthetic data only).
- [ ] **Who can upload catalogues** — restrict catalogue-import permissions.
- [ ] **Who can approve products** — restrict product-approval permissions.
- [ ] **Who can modify relationships** — restrict recommendation-edge create/update.
- [ ] **Inventory updates** — restrict who can write inventory.
- [ ] **Who can write recommendation events** — narrow, validated insert policy only.
- [ ] **Catalogue image storage vs. URL reference** — decide whether images are
      stored (e.g. Supabase Storage) or referenced by URL, with the security,
      privacy, licensing, and availability implications of each.

(Not a blocker for Phase 3; tracked here so it is not lost.)

### Data-source roadmap (future, permission-gated)

Layered on top of the phase roadmap; each item is built through the
source-adapter architecture (§3a) and only after the relevant approvals:

- **Website connector** — an authorized adapter for official Skechers website
  product information (no scraping/crawler; permission-gated retrieval only).
- **Approved catalogue import** — CSV/Excel/JSON upload via the staged,
  validated, versioned pipeline (§6).
- **Official API / product-feed connector** — pull/sync from an official feed if
  provided.
- **Product synchronization history** — record each sync (source, version,
  timestamp, changes) for audit and rollback.
- **Product validation & approval workflow** — normalize → validate → approve
  before records become active; only approved records are recommended.
- **Region-specific catalogue support** — per-region products, prices, sizes,
  images, and availability (no assumption of a single global catalogue).

---

## 3a. Product-data source architecture (multi-source, adapter-based)

The app must support **multiple product-data sources** behind a common
**source-adapter architecture**, so the recommendation engine is never
permanently coupled to a single source:

| # | Source | Status | Notes |
|---|--------|--------|-------|
| 1 | Authorized Skechers website source | Future, permission-gated | Only after partner agreement/approval; no live retrieval or scraping is built now |
| 2 | Approved Skechers catalogue | Future | Uploaded via the staged import pipeline (§6) |
| 3 | Official API / product feed | Future (if provided) | Pull/sync connector |
| 4 | Internal manual entry | Supported | Curator-entered approved records |
| 5 | Synthetic demo data | **Active now** | The only source during development |

Each source is reached through its own **data connector (adapter)**; all data is
**normalized**, validated, and approved before it lands in the internal database.
Associate interactions read **only** from that normalized internal database.

**Future data flow:**

```
Product source
   → Data connector (per-source adapter)
   → Product normalization
   → Validation
   → Approval
   → Internal product database   ← the single runtime source of truth
   → Recommendation engine
   → Associate application
```

Guardrails (see `CLAUDE.md` for the full list): no live website retrieval,
scraper, or crawler yet; the frontend never calls an external product website
directly; region and currency are stored per official record; the AI never
invents products or relationships and only **explains** approved ones.

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

> **Phase 2 — as built (see `database/SCHEMA.md`).** The migration
> (`supabase/migrations/20260806120000_create_core_schema.sql`) implements **8
> tables**: `products`, `product_sources`, `product_relationships`,
> `recommendation_approvals`, `customer_needs`, `stores`, `inventory`,
> `recommendation_events`. Refinements vs. the original plan below:
> recommendation copy (`reason`/`customer_benefit`) lives on
> `product_relationships` (no separate `recommendation_rules` table);
> `recommendation_events` is the anonymous outcome log (was `outcomes`); a
> `recommended_for_customer_need` relationship type was added (8 total);
> `product_url` and the source/approval fields are on `products`, with
> `permission_status`/`source_region` on `product_sources`. The import-pipeline
> tables (`import_batches`, `product_import_rows`, `product_versions`),
> `product_categories`, and `associates` remain **future-phase** and are not yet
> built.

The originally planned entity list (superseded in part by the note above):

| Entity | Purpose | Key fields (indicative) | Relationships |
|--------|---------|-------------------------|---------------|
| `products` | Approved catalog | `id`, `sku` (unique), `barcode`, `style_number`, `name`, `category`, `subcategory`, `gender`, `color`, `size_range`, `price`, `currency`, `region`, `image_url`, `description`, `key_features`, `technology`, `activity_type`, `source`, `source_url`, `approval_status`, `imported_at`, `updated_at`, plus `is_active`/`is_demo`/`availability_status` (full column list below) | 1—* relationships & rules; referenced by outcomes; has version history |
| `product_categories` | Controlled category list (enables category validation) | `id`, `code`, `label`, `is_active` | referenced by products |
| `customer_needs` | The 9 approved needs | `id`, `code`, `label`, `description` | referenced by rules & outcomes |
| `product_relationships` | Typed links between products | `id`, `from_product_id`, `to_product_id`, `relationship_type`, `priority` | self-ref many-to-many on `products` |
| `recommendation_rules` | Maps (product + need) → recommended product with approved copy | `id`, `source_product_id`, `need_id`, `recommended_product_id`, `recommendation_type`, `reason`, `customer_benefit`, `selling_sentence`, `priority`, `is_active` | joins `products` × `customer_needs` |
| `import_batches` | One upload/ingest event | `id`, `source`, `file_name`, `format` (csv/xlsx/json/api), `region`, `currency`, `status` (previewed/validated/committed/failed), `row_counts`, `error_summary`, `imported_by`, `imported_at` | 1—* staged rows |
| `product_import_rows` | Staged raw rows pending validation/approval | `id`, `batch_id`, `raw_data` (jsonb), `validation_status`, `validation_errors` (jsonb), `resolved_product_id?` | belongs to a batch; may become a product |
| `product_versions` | Version history of product records | `id`, `product_id`, `version_number`, `snapshot` (jsonb), `approval_status`, `changed_by`, `changed_at`, `change_reason` | *—1 products |
| `outcomes` | Anonymous result log | `id`, `source_product_id`, `need_id`, `recommended_product_id`, `recommendation_type`, `outcome`, `associate_id?`, `store_id?`, `created_at` | references products/needs; **no customer PII** |
| `associates` *(Phase 6)* | Login identity | `id`, `display_name`, `store_id`, `role` | referenced by outcomes |
| `stores` *(Phase 6)* | Store context | `id`, `name`, `region` | referenced by associates/outcomes |

### `products` table — columns from the start

The `products` table is created with these columns in the first migration
(Phase 2), so the schema is ready for the approved catalogue without later
restructuring:

| Column | Type (indicative) | Notes |
|--------|-------------------|-------|
| `id` | uuid (PK) | Generated primary key |
| `sku` | text, unique | Product code; duplicate-checked on import |
| `barcode` | text | Scannable identifier (enables the future scan flow) |
| `style_number` | text | Manufacturer style reference |
| `name` | text | Display name |
| `category` | text | Validated against `product_categories` on import |
| `subcategory` | text | Validated against `product_categories` on import |
| `gender` | text | e.g. men / women / kids / unisex |
| `color` | text | Colorway |
| `size_range` | text | Available sizes |
| `price` | numeric(10,2) | Demo-labeled until an approved catalogue exists |
| `currency` | text | ISO 4217 code (e.g. USD) |
| `region` | text | Market the record applies to |
| `image_url` | text | Format/host validated on import |
| `description` | text | Long description |
| `key_features` | text[] / jsonb | Structured feature list |
| `technology` | text[] / jsonb | Named Skechers technologies (approved data only) |
| `activity_type` | text | Best-for activity (feeds `best_for_activity`) |
| `source` | text | Origin of the record (file/integration) |
| `source_url` | text | Reference URL for the record's origin |
| `approval_status` | text | `draft`/`demo`/`pending_review`/`approved`/`rejected`/`archived`; gates activation |
| `imported_at` | timestamptz | When the record was ingested |
| `updated_at` | timestamptz | Last modification (auto-updated) |

Operational columns also present on the table: `is_active` (only active rows are
recommended), `is_demo` (drives demo labeling of synthetic data), and
`availability_status` (`in_stock`/`limited`/`out_of_stock`/`order_only`; static
in the MVP, demo-labeled until live inventory).

#### Product-source & approval fields (planned addition to the model)

To support the multi-source architecture (§3a), the product model gains these
source/approval-provenance fields. *Planned — the current Phase 2 migration is
not modified for this update; these are folded in when Phase 2 resumes.*

| Field | Type | Notes |
|-------|------|-------|
| `source_type` | text | Which source class: `website` / `catalogue` / `api_feed` / `manual` / `synthetic_demo` |
| `source_url` | text | Origin URL for the record (already present) |
| `source_identifier` | text | Stable id in the source system (e.g. source SKU/style ref) |
| `source_region` | text | Region the source record applies to |
| `source_version` | text | Version/snapshot tag of the source data |
| `permission_status` | text | Authorization state to use this record (e.g. `pending`/`granted`/`revoked`) |
| `last_synced_at` | timestamptz | Last synchronization time from the source |
| `data_status` | text | Pipeline state (e.g. `raw`/`normalized`/`validated`) |
| `approval_status` | text | `draft`/`demo`/`pending_review`/`approved`/`rejected`/`archived` (present) |
| `approved_by` | text/uuid | Who approved the record |
| `approved_at` | timestamptz | When the record was approved |

Region and currency remain required for official records; every official record
also stores its source URL and import/synchronization details.

**Enum-like values** (Postgres enums or lookup tables):

- `relationship_type`: `upgrade_to`, `alternative_to`, `pairs_with`,
  `recommended_add_on`, `lower_price_option`, `higher_price_option`,
  `best_for_activity`, `recommended_for_customer_need`.
- `recommendation_type`: `premium_upgrade`, `alternative`, `socks`, `shoe_care`,
  `complementary`.
- `availability_status`: `in_stock`, `limited`, `out_of_stock`, `order_only`
  (static field in MVP — no live inventory).
- `outcome`: `presented`, `interested`, `added_to_basket`, `declined`,
  `unavailable`, `not_relevant`.
- `approval_status` (text): `draft`, `demo`, `pending_review`, `approved`,
  `rejected`, `archived`. (`demo` marks synthetic prototype records.)
- `import_status`: `previewed`, `validated`, `committed`, `failed`.

---

## 6. Product data source & catalogue governance

**Product-data strategy (summary).**

1. During prototyping, use **synthetic** Skechers-style sample data and
   placeholder images.
2. The public Skechers website may be used **only as a research reference**
   unless authorization is obtained.
3. Do **not** scrape, crawl, bulk-download, or redistribute website content.
4. Do **not** present the prototype as an official Skechers product.
5. The database is designed for a **future approved-catalogue upload**.
6. The product model carries `source`, `source_url`, `region`, `currency`,
   `approval_status`, and `imported_at`.
7. The future catalogue-import workflow supports **CSV, Excel, JSON, or an
   authorized API**.
8. That import design includes **validation, duplicate detection, preview, error
   reporting, approval, and version history**.
9. **No scraping or automated website-collection is implemented in any phase.**

**Prototype data policy.** The public Skechers website is a **reference only**
(categories, naming, features, technologies, relationships). No scraping,
crawling, bulk-downloading, copying, or redistribution without explicit
authorization, and website data is never the production database. Until an
approved catalogue exists we use **synthetic** sample data and placeholder
images; prices and availability are shown with **explicit demo labels**; the app
does not present itself as official Skechers or claim any affiliation; no
customer PII is stored; and no medical/health/unsupported claims are made.

**Production import model (designed now, tooling built in Phase 8).** The schema
is designed so an approved catalogue can later be uploaded via **CSV, Excel,
JSON, or an authorized API**. Every imported record carries `source`,
`imported_at`, `region`, `currency`, and `approval_status`, and stays **inactive
until manually approved**. The import path is staged, not direct-to-live:

```
Upload (CSV/XLSX/JSON/API)
   → parse into import_batches + product_import_rows (raw)
   → VALIDATE each row:
        • required-field validation
        • duplicate-SKU detection (within batch and vs. existing catalog)
        • price validation (numeric, currency, sane range)
        • image-URL validation (well-formed, reachable/allowed host)
        • category validation (against product_categories)
   → PREVIEW: show valid rows, warnings, and a per-row ERROR REPORT
   → on approve: COMMIT to products + write product_versions (version history)
   → products become active only after manual APPROVAL
```

Nothing is committed before preview; nothing is recommended before approval.

### Product data roadmap

1. **Prototype stage (now).** Synthetic sample data and placeholder images. The
   purpose is to test the workflow, database structure, recommendation logic,
   and UX — not to hold real products.
2. **Reference research stage.** Review the public Skechers website *only* to
   understand categories, product attributes, naming patterns, technologies, and
   possible recommendation relationships. This stage **does not** create a
   production catalogue.
3. **Approved catalogue stage.** After the required approval is obtained, support
   catalogue upload via CSV, Excel, JSON, or an authorized integration, through
   the staged/validated/versioned pipeline above.

### Production catalogue fields (target schema for the approved stage)

The `products` model (and the importer's accepted columns) is designed to hold:

| Field | Notes |
|-------|-------|
| SKU | Unique product code; duplicate-checked on import |
| Barcode | Scannable identifier (enables the future scan flow) |
| Style number | Manufacturer style reference |
| Product name | Display name |
| Category / Subcategory | Validated against `product_categories` |
| Gender | e.g. men / women / kids / unisex |
| Color | Colorway |
| Size range | Available sizes |
| Price + Currency | Numeric price; ISO currency; demo-labeled until approved |
| Region | Market the record applies to |
| Product image | Image URL; format/host validated on import |
| Product description | Long description |
| Key features | Structured feature list |
| Technology | Named Skechers technologies (approved data only) |
| Activity | Best-for activity (feeds `best_for_activity`) |
| Inventory status | Maps to `availability_status`; demo-labeled until live |
| Approval status | `draft` → `pending_review` → `approved` (gates activation) |
| Source | Origin of the record (file/integration) |
| Import date | When the record was ingested |

Prototype records populate a synthetic subset of these fields; the full set is
required only at the approved-catalogue stage.

---

## 7. Recommendation logic outline (Phase 4 — rules-based, no AI)

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

## 8. Open decisions

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
8. **Partner agreement scope** — which official data fields/sources are covered,
   and what `permission_status` values the agreement implies?
9. **Region/currency model** — how many regions at first, and is one product
   record per region or a shared record with per-region overrides?
10. **Approval ownership** — who is `approved_by` (role/identity) once auth
    (Phase 6) exists, and what is the approval SLA?
11. **Sync cadence** — for the future website/API connectors, how often does
    `last_synced_at` refresh, and what triggers a re-sync?

---

## 9. Definition of done (Step 1)

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
- [x] Changes committed and pushed to `claude/skechers-sales-assistant-d3jch5`.
- [x] **No** app code, recommendation engine, full UI, auth, AI calls, or real
      Skechers data added.
- [x] Reviewer approval obtained before starting Phase 2.

---

## 10. Phase 2 status — ✅ COMPLETED (pending reviewer approval)

Phase 2 (Data model & seed) implementation is complete and **all database
validations pass** (14/14 — see `database/VALIDATION.md`).

- [x] Migration `supabase/migrations/20260806120000_create_core_schema.sql`
      creates the 8 tables with constraints, indexes, `updated_at` triggers, RLS.
- [x] `supabase/seed.sql` loads synthetic demo data (18 products, 27
      relationships, 1 store, 53 inventory rows, 18 sources, 5 events, 3
      approvals).
- [x] Placeholder images (`public/images/products/placeholder-*.svg`).
- [x] `supabase/config.toml` for local Supabase.
- [x] Docs: `database/SCHEMA.md`, `database/RELATIONSHIPS.md`,
      `database/VALIDATION.md`.
- [x] Validation script (`scripts/db-validate.sh`) + tests
      (`database/tests/validation.sql`); **all 14 checks pass** on PostgreSQL 16.
- [x] Synthetic data only; no scraping, frontend, auth, AI, barcode scanning,
      recommendation UI, or production Supabase connection.
- [x] Reviewer approval before starting Phase 3.

**Note on validation environment:** validation ran against the official Supabase
Postgres image and a local PostgreSQL 16 cluster (the Supabase CLI was installed;
the full `supabase start` stack is blocked in-sandbox by an rlimit restriction —
see `database/VALIDATION.md`). The migration is portable.

---

## 11. Phase 3 status — ✅ COMPLETED (pending reviewer approval)

Phase 3 (Catalogue import workflow) is complete. **All tests pass:** 38 unit
tests, 14 core DB checks, and 8 import DB checks.

- [x] Migration `supabase/migrations/20260806130000_create_catalogue_import.sql`
      adds `catalogue_imports`, `catalogue_import_rows`, `catalogue_versions`
      (constraints, indexes, `updated_at` trigger, RLS default-deny).
- [x] Import service `src/import/` — the 16 stages as pure, testable functions:
      format detection, CSV/Excel/JSON parsing, column mapping, validation
      (required/type/price/currency/region/image/duplicate SKU & barcode),
      preview + error report, and an approval-gated commit plan.
- [x] Safe workflow: imported rows forced to `draft`/`pending_review` (never
      `approved`); `data_status` forced to `imported`; **approved products are
      conflict-protected** and never overwritten without explicit confirmation.
- [x] Sample file `data/demo-catalogue.csv` (5 valid + 4 deliberate errors).
- [x] Docs `database/IMPORT.md`; `database/SCHEMA.md` updated.
- [x] Unit tests (`tests/unit/*.test.ts`), DB tests
      (`database/tests/import_validation.sql`), demo runner
      (`scripts/run-import-demo.ts`), `db-validate.sh` updated.
- [x] Synthetic data only; no UI, barcode scanning, AI, auth, scraping, website
      crawler, live website, or real catalogue data.
- [ ] Reviewer approval before starting the next phase.

**Package manager:** the TypeScript toolchain uses **npm** (resolves open
decision #7 for now; can revisit).

**Phase 4 objective:** Core UI shell — a mobile-first React + Vite + Tailwind PWA
that reads the catalogue/seed data: product lookup + display and customer-need
selection. **No** recommendation engine, auth, AI, or barcode scanning yet.

---

## 12. Phase 4 status — ✅ COMPLETED (pending reviewer approval)

Phase 4 (Mobile UI shell, product lookup, customer-need selection) is complete.
**All checks pass:** typecheck OK, 52 tests (14 UI + 38 existing), production
build OK.

- [x] Mobile-first app shell (`Header` with app name + `DEMO` badge, `Layout`,
      responsive phone/tablet), reusable loading/error/empty state views.
- [x] Product lookup: search by SKU / style number / name (debounced), clear
      button, "Product not found" state — reads the existing `products` table.
- [x] Product card + detail view: image with category fallback, all required
      fields grouped, demo-labeled price, back-to-search.
- [x] Customer-need selection: the 9 needs (from `customer_needs`), selection
      stored in `SelectionContext` with a confirmation — **no recommendations
      generated** (state prepped for Phase 5).
- [x] Supabase integration via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
      (public anon key only; service-role never in frontend). **No schema
      changes** — the existing tables already had every field.
- [x] Tests for search, not-found, detail rendering, image fallback, need
      selection, loading, error, empty states.
- [x] README (frontend setup), DECISIONS (ADR-012/013) updated.
- [ ] Reviewer approval before starting the next phase.

**Phase 5 objective:** Recommendation engine (rules-based, no AI) — given the
selected product + customer need, read `product_relationships` and return the
top prioritized, approved recommendations (upgrade / alternative / socks /
shoe-care), each with its stored reason, customer benefit, and selling copy,
rendered in the UI with outcome logging. Deterministic and unit-tested; **no
AI**.

---

## 13. Phase 5 status — ✅ COMPLETED (pending reviewer approval)

Phase 5 (Rules-based recommendation engine) is complete. **All checks pass:**
typecheck OK, 66 tests (12 new: 7 engine unit + 4 list-view + 1 acceptance),
production build OK, and DB validation (14 core + 8 import) still green with the
new migration applied.

- [x] Deterministic engine `src/features/recommendations/engine.ts` (pure, no
      AI): filters by self/active/approval/region/availability + need-typed
      match; slots into premium upgrade / alternative / socks-or-care add-on;
      orders need-relevant → priority → price → SKU; dedupes; max 3; copies
      stored reason/benefit verbatim (no generated claims).
- [x] Query layer `src/lib/recommendations.ts`: approved `product_relationships`
      → target products → inventory availability; anonymous `displayed` event
      logging (no PII; `associate_id` null).
- [x] UI: `RecommendationCard`, `RecommendationListView` (loading/error/empty),
      `RecommendationsSection` wired into the product page after need selection.
- [x] Migration `20260806140000_recommendation_events_demo_insert.sql`: narrow,
      PII-free insert policy so the demo can log display events (flagged for the
      Phase 10 security review).
- [x] Tests: engine unit tests, list-view state tests, and a Phase 5 acceptance
      flow; the Phase 4 acceptance flow still passes.
- [x] Browser demo updated (`src/demo/recommendations.ts`) — recommendations now
      render in the self-contained demo build.
- [x] **Seed coverage expansion (post-review):** added demo shoes *Demo Everyday
      Comfort 1*, *Demo Trail Active 1*, *Demo Sport Fit Runner 2* and full
      relationship sets so five demo shoes (Walk Comfort 1, Work Cushion 1, Sport
      Fit Runner 1, Everyday Comfort 1, Trail Active 1) each return an upgrade +
      alternative + add-on. New `database/tests/recommendation_validation.sql`
      (R1–R5) verifies coverage; core/import counts updated (21 products, 48
      relationships).
- [ ] Reviewer approval before starting the next phase.

**Phase 6 objective:** Authentication — Supabase Auth for associates; attribute
recommendation/outcome events to an associate/store; begin tightening the RLS
policies (per the Phase 10 pre-production security review). No AI.
