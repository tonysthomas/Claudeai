# CLAUDE.md — Skechers Sales Assistant

Guidance for any AI agent (or developer) working in this project folder.
Read this file first. Follow it exactly.

---

## Project purpose

A **mobile-first, AI-powered retail sales assistant for Skechers store
associates**. After a customer selects or scans a Skechers product, the app
recommends the **next best approved product(s)** so the associate can attach,
upsell, and cross-sell with confidence and consistency.

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

- The public Skechers website may be used **only as a reference** for
  understanding categories, naming conventions, features, technologies, and
  possible product relationships.
- **Do not** scrape, crawl, bulk-download, copy, or redistribute Skechers
  website content without explicit authorization. Website data is **never** the
  production database.
- Until an approved catalogue exists:
  - Use **synthetic** sample product data only.
  - Use placeholder images or approved development assets only.
  - **Label all prices as demo prices** and **all availability as demo
    availability** in the UI.
  - Do **not** make the app look like an official Skechers application, and do
    **not** claim affiliation, authorization, or endorsement by Skechers.
  - Do **not** store personal customer information.
  - Do **not** make medical, health, or otherwise unsupported product claims.

---

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

- **Provenance is mandatory.** Every imported product record must carry:
  `source`, `import_date`, `region`, `currency`, and `approval_status`.
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
