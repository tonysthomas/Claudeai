# CLAUDE.md — Skechers Sales Assistant

Guidance for any AI agent (or developer) working in this project folder.
Read this file first. Follow it exactly.

---

## Project purpose

A **mobile-first, AI-powered retail sales assistant for Skechers store
associates**. After a customer selects or scans a Skechers product, the app
recommends the **next best approved product(s)** so the associate can attach,
upsell, and cross-sell with confidence and consistency.

**Operating context.** The application is built for use by an **authorized
exclusive Skechers retail partner**. Subject to the applicable approval and
partner agreement, it should eventually be able to use official Skechers website
product information and, later, incorporate approved catalogue references. This
authorized-partner context does **not** loosen the guardrails below: during
development we use synthetic demo data only, we do not implement any live
retrieval or scraping, and we never claim endorsement or authorization beyond
the actual partner agreement.

Business goals it serves:

- Increase Average Transaction Value (ATV).
- Increase Units Per Transaction (UPT).
- Improve shoe-and-sock attach rate.
- Improve shoe-care attach rate.
- Increase upselling and cross-selling.
- Improve associate confidence.
- Improve consistency of the customer experience.

---

## Product principles (non-negotiable)

1. **Approved products only.** The app recommends only real, approved products
   inside the Skechers ecosystem that exist in our own catalog data.
2. **Never invent.** Do not invent products, prices, features, technologies,
   availability, or claims. Every fact shown to an associate must come from
   stored, reviewed catalog/rule data.
3. **Copy is curated, not generated (MVP).** Reasons, customer benefits, and
   selling sentences are stored and human-approved. The app does not fabricate
   selling copy at runtime in the MVP.
4. **No customer PII.** Never collect, store, or display real customer personal
   data. Outcome logging is anonymous.
5. **No proprietary data misuse.** Do not scrape, copy, or embed proprietary
   Skechers data or assets. Use placeholder images and sample data in
   development.
6. **Grounded AI only (future).** When AI is introduced, it must be constrained
   to approved catalog data (retrieval-grounded). It may reorder or phrase, but
   must never introduce facts not present in the approved data.

### Product data source policy

- The public Skechers website may be used **only as a research reference** for
  understanding categories, naming conventions, features, technologies, and
  possible product relationships — unless explicit authorization is obtained.
- **Do not** scrape, crawl, bulk-download, copy, or redistribute Skechers
  website content without explicit authorization. Website data is **never** the
  production database.
- **Do not implement** scraping, crawling, or any automated website-collection
  tooling — not in the MVP and not in any later phase. Populate data only from
  synthetic samples now, and later from an authorized approved-catalogue upload.
- Until an approved catalogue exists:
  - Use **synthetic** sample product data only.
  - Use placeholder images or approved development assets only.
  - **Label all prices as demo prices** and **all availability as demo
    availability** in the UI.
  - Do **not** present the application as a public Skechers website, and do
    **not** claim endorsement or authorization **beyond the actual partner
    agreement** (see Operating context above).
  - Do **not** store personal customer information.
  - Do **not** make medical, health, or otherwise unsupported product claims.
- **Official data is a future, permission-gated capability.** Once the partner
  agreement and approvals are in place, the app may use official Skechers
  product information (see the source list below). Until then, no live retrieval
  is implemented and synthetic demo data is the only source.

---

### Data architecture principle (multi-source, adapter-based)

The application must support **multiple product-data sources** behind a common
**source-adapter architecture**, so the recommendation engine is never
permanently dependent on one source:

1. Authorized Skechers website source (future, permission-gated).
2. Approved Skechers catalogue (future).
3. Official API or product feed, if provided (future).
4. Internal manual entry.
5. Synthetic demo data (development — the only active source now).

Every source flows through the same pipeline into one normalized internal
database, which is the **only** thing associate interactions read from:

```
Product source → Data connector → Product normalization → Validation →
Approval → Internal product database → Recommendation engine → Associate app
```

**Rules for this architecture:**

- **Do not** implement live website retrieval, a scraper, or a crawler yet.
- **Do not** call any external product website directly from the frontend.
- **Do not** assume every country has the same products, prices, sizes, images,
  or availability. Store `region` and `currency` on official product records,
  plus source URL and import/synchronization details.
- Associate interactions read **only** from the internal normalized database —
  never from a live external source.
- The **AI must not invent** product details or recommendation relationships.
- Upgrade, alternative, pairs-with, and add-on relationships must be **approved**
  or generated from **approved business rules**. The AI may **explain** approved
  relationships in customer-friendly language, but may not create them.

## MVP scope (Phase 1)

In scope for the MVP:

- Enter or scan a product code and display the matched product.
- Select one customer need from the approved need list.
- Show **three prioritized recommendations**, each with: image, name, price,
  recommendation type, reason, customer benefit, selling sentence, availability.
- Record an outcome per recommendation: Presented, Customer interested, Added to
  basket, Customer declined, Product unavailable, Not relevant.
- Sample/seed data and placeholder images.
- Mobile-first responsive UI.

**Recommendation categories (MVP):** Premium upgrade · Alternative Skechers
product · Recommended socks · Shoe-care product · Other approved complementary
product.

**Product relationship types:** `upgrade_to`, `alternative_to`, `pairs_with`,
`recommended_add_on`, `lower_price_option`, `higher_price_option`,
`best_for_activity`.

**Customer need categories:** Everyday comfort · Walking · Work or long hours ·
Fitness · Travel · Style · Budget · Maximum cushioning · Support.

---

## Non-MVP scope (explicitly deferred)

Do **not** build these until their phase is approved:

- Authentication / associate accounts.
- The AI recommendation/generation layer or any external AI API calls.
- Real Skechers product data.
- POS or inventory-system integration; real-time availability.
- Camera barcode scanning (MVP uses manual code entry; scanning is a stub/label).
- Manager analytics dashboards, A/B testing, personalization, i18n, offline sync.

---

## Coding standards

- **TypeScript everywhere**, `strict` mode on. No implicit `any`.
- React function components + hooks only. No class components.
- Keep components small and single-purpose; colocate feature logic under
  `src/features/<feature>/`.
- Data access goes through a typed API/service layer (`src/lib`), never raw
  queries scattered in components.
- No secrets in client code. Only `VITE_`-prefixed public config reaches the
  browser.
- Prefer pure, testable functions for recommendation/scoring logic.
- Handle loading / empty / error states explicitly in every data-driven view.
- Lint + format must pass (ESLint + Prettier). Fix warnings, don't suppress.
- Small, focused commits with clear messages.

## Naming conventions

- Files/dirs: `kebab-case` for folders; React components in `PascalCase.tsx`;
  hooks as `useThing.ts`; non-component modules `camelCase.ts`.
- Types/interfaces/enums: `PascalCase`. Enum-like unions in `src/types`.
- Database: `snake_case` tables and columns; tables plural (`products`,
  `product_relationships`); primary key `id`; foreign keys `<entity>_id`.
- Env vars: `SCREAMING_SNAKE_CASE`; browser-exposed ones prefixed `VITE_`.
- Constants: `SCREAMING_SNAKE_CASE`.

## Testing requirements

- **Recommendation/scoring logic must have unit tests** (Vitest) once built.
- Component tests (React Testing Library) for each screen's states.
- One end-to-end happy-path test (Playwright) for the core flow.
- Tests must be deterministic — use fixtures/seed data, never live data.
- CI must run typecheck + lint + unit tests on every PR. Do not merge red.

## Security rules

- Never commit secrets. `.env` is git-ignored; `.env.example` lists names only.
- Service-role / admin keys are used only in server scripts, never shipped to
  the browser.
- Enable Supabase **Row Level Security on every table**; default deny.
- Catalog/rule tables: read-only to the client. Outcome writes go through a
  narrow, validated policy. No table is world-writable.
- Validate all input (product codes, outcome enums) before use.
- No real customer PII, ever. Outcomes are anonymous and aggregate-safe.
- Serve only over HTTPS.
- **Demo RLS is not production RLS.** The current anonymous read policy is
  acceptable in the demo because it exposes only synthetic products. **Before
  production**, the security & deployment phase MUST review and restrict:
  anonymous product reads · catalogue import permissions · product approval
  permissions · recommendation-relationship changes · inventory updates ·
  recommendation-event writes · and whether catalogue images are stored vs.
  referenced by URL. See `PROJECT_PLAN.md` (Pre-production security review) and
  `DECISIONS.md` ADR-011.

## Database rules

- Postgres via Supabase. All schema changes are **migrations** in
  `supabase/migrations/` — never hand-edit production.
- Seed/sample data lives in `supabase/seed/` and is clearly non-production.
- Use foreign keys and constraints; model enums as Postgres enums or lookup
  tables (see `PROJECT_PLAN.md`).
- Approved-content fields (reason, benefit, selling_sentence) are stored data,
  reviewed before use — the app renders them, it does not author them.

### Catalogue governance rules

The production data model must let an approved catalogue be uploaded later via
CSV, Excel, JSON, or an authorized API. Design for this now (schema), even
though the full import tooling is a later phase.

- **Provenance is mandatory.** Every product record must carry full source and
  approval provenance: `source_type`, `source_url`, `source_identifier`,
  `source_region`, `source_version`, `permission_status`, `last_synced_at`,
  `data_status`, `approval_status`, `approved_by`, `approved_at` (plus `region`
  and `currency` for official records). See `PROJECT_PLAN.md` §5 for the planned
  product model.
- **Approval gate.** Imported products are **not active** until manually
  approved. Only approved, active products are ever recommended.
- **Version history.** Product changes are versioned; superseding a record keeps
  the prior version.
- **The import process must support:** product validation, duplicate-SKU
  detection, required-field validation, image-URL validation, price validation,
  category validation, an import **preview**, and import **error reporting** —
  before anything is committed.
- **Demo mode.** While using synthetic data, records are flagged as demo; prices
  and availability are rendered with explicit demo labels.

---

## How to work here

1. **Work phase by phase.** Do only the current, approved phase. The roadmap is
   in `PROJECT_PLAN.md`.
2. **Respect the boundaries above.** If a task seems to require a deferred
   feature, stop and flag it.
3. **Ask for approval before moving to the next phase.** After finishing a
   phase, summarize what was done and the proposed next step, and wait for
   explicit approval before starting the next phase.
4. Record any significant architectural choice in `DECISIONS.md`.
