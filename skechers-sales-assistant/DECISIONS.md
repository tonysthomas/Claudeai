# DECISIONS.md — Skechers Sales Assistant

Architectural decisions and the alternatives considered. Newest decisions can
be appended over time. Status: **Proposed** (pending Step 1 approval).

---

## 1. Technology stack (and why)

| Layer | Choice | Why | Alternatives considered |
|-------|--------|-----|-------------------------|
| Language | **TypeScript (strict)** | Required by brief; type safety across UI + data; shared types with generated DB types | Plain JS (rejected: no safety), ReScript (niche) |
| Frontend framework | **React 18** | Required by brief; largest ecosystem; strong PWA + testing story | Vue, Svelte (fine, but off-brief) |
| Build/dev tooling | **Vite** | Instant dev server, first-class TS, simple PWA plugin; the app is client-heavy talking to Supabase, so no SSR needed | Next.js (SSR/App Router overkill for a store-floor PWA; adds a server we don't need in MVP), CRA (deprecated) |
| Styling | **Tailwind CSS** | Utility-first, mobile-first breakpoints, fast to build consistent responsive UI on small screens | CSS Modules, MUI (heavier), Chakra |
| Routing | **React Router** | Simple client routing matching the linear workflow | TanStack Router (newer, less familiar) |
| Server state | **TanStack Query** | Caching + loading/error/empty handling for Supabase reads/writes without boilerplate | Redux Toolkit Query, SWR, hand-rolled |
| PWA | **vite-plugin-pwa** | Installable, offline app shell, icon/manifest handling — associates run it from a phone | Manual service worker (more error-prone) |
| Backend + DB | **Supabase (Postgres + Auth + Storage + RLS + Edge Functions)** | Brief's preferred platform; managed relational Postgres satisfies the relational requirement; RLS gives per-table security; Storage hosts placeholder images; Auth and Edge Functions are ready when Phases 6–7 arrive — no bespoke backend to run in the MVP | Firebase (NoSQL, not relational — rejected), custom Node/Express + Postgres (more infra to own), PlanetScale/Neon + separate auth (more glue) |
| DB client | **supabase-js** + generated types | Typed queries, RLS-aware, integrates with TanStack Query | Prisma (adds a second source of truth vs. SQL migrations) |
| CSV import | **Node script + papaparse** | Simple, testable one-off importer for sample data; runs with service-role key server-side | SQL `COPY` (less validation), manual entry |
| Testing | **Vitest + React Testing Library + Playwright** | Vitest pairs natively with Vite; RTL for components; Playwright for one e2e happy path | Jest (slower with Vite), Cypress (heavier) |
| Lint/format | **ESLint + Prettier** | Enforce standards from `CLAUDE.md`; CI-gated | Biome (promising, less mature ecosystem) |
| Package manager | **pnpm** (proposed) | Fast, disk-efficient, strict deps | npm (fine fallback — open decision) |
| CI | **GitHub Actions** | Repo already uses `.github/workflows`; run typecheck + lint + unit on PR | CircleCI, GitLab CI |
| Hosting (frontend) | **Vercel** (proposed) | Zero-config Vite deploys, preview URLs, HTTPS | Netlify, Cloudflare Pages (all viable) |

---

## 2. Key architectural decisions

### ADR-001 — Supabase over a custom backend
**Decision:** Use Supabase (managed Postgres) as the backend/DB.
**Context:** Brief prefers Supabase; MVP needs a relational store, image hosting,
and a path to auth + server-side AI without standing up infrastructure.
**Consequences:** Fast start, RLS-based security, hosted images; some vendor
coupling (mitigated because it's plain Postgres and can be exported).
**Alternatives:** Firebase (not relational), self-hosted Postgres + Express
(more to operate), Neon/PlanetScale + separate auth (more integration work).

### ADR-002 — Vite SPA/PWA instead of Next.js
**Decision:** Client-side React SPA built with Vite, shipped as an installable PWA.
**Context:** Store associates use it on a phone; content is dynamic per-tap and
personalized to no one (no SEO/SSR need). Supabase is queried directly from the
client under RLS.
**Consequences:** No server to run for the MVP; simplest possible deploy. If we
later need server-side rendering or heavy server logic, we add Edge Functions
(AI) or reconsider.
**Alternatives:** Next.js (SSR/App Router — unnecessary server complexity now).

### ADR-003 — Recommendation copy is stored & curated, not generated (MVP)
**Decision:** `reason`, `customer_benefit`, and `selling_sentence` are columns on
`recommendation_rules`, authored/approved by humans.
**Context:** Product principle: never invent claims. The MVP engine only
reorders and renders approved rows.
**Consequences:** Guarantees compliance; requires a curation process (open
decision). AI in Phase 7 may rephrase but stays grounded on these rows.
**Alternatives:** Runtime LLM generation (rejected for MVP — hallucination risk).

### ADR-004 — Deterministic, testable recommendation engine (Phase 4)
**Decision:** Implement recommendations as pure TypeScript functions over data
from `recommendation_rules` / `product_relationships`, independent of UI and DB.
**Context:** Must be unit-testable and explainable; no AI yet.
**Consequences:** Predictable output, easy tests, clear upgrade path to AI
re-ranking later.
**Alternatives:** In-DB SQL-only logic (harder to unit test), AI-first (off-brief
for the MVP).

### ADR-005 — Row Level Security everywhere; catalog read-only, outcomes narrow-write
**Decision:** RLS on every table, default deny. Catalog/rules are read-only to
the client; outcomes are inserted through a validated policy; no table is
world-writable. Service-role key only in server scripts.
**Context:** Security rules in `CLAUDE.md`; anon browser client must be safe.
**Consequences:** Safe direct-from-client access; slightly more policy authoring.

### ADR-006 — Static availability field in MVP (no POS)
**Decision:** `products.availability_status` is a manually maintained enum.
**Context:** Brief forbids POS/inventory integration in step one.
**Consequences:** Simple, but can go stale; flagged as an open decision and a
risk. Live availability arrives in Phase 9.

### ADR-007 — Synthetic demo data with explicit demo labeling
**Decision:** Until an approved catalogue exists, use synthetic product data and
placeholder images. Flag records `is_demo` and render prices/availability with
explicit demo labels. The app never presents itself as official Skechers, claims
no affiliation/endorsement, stores no customer PII, and makes no
medical/health/unsupported claims. The public website is reference-only — no
scraping, crawling, bulk-download, copying, or redistribution.
**Context:** Product data source policy; legal/brand safety while prototyping.
**Consequences:** Safe to demo; a `VITE_DEMO_MODE` flag drives the labeling.
**Alternatives:** Using website data directly (rejected — not authorized, not a
production source).
**Explicit non-goal:** No scraping, crawling, or automated website-collection
tooling is implemented in any phase. Data comes only from synthetic samples now
and, later, from an authorized approved-catalogue upload. The website is a
human research reference only.

### ADR-008 — Staged, versioned, approval-gated import pipeline
**Decision:** Design the production data model for an upload path via CSV, Excel,
JSON, or an authorized API. Imports land in `import_batches` +
`product_import_rows` (raw), are validated (required fields, duplicate SKUs,
price, image URL, category against `product_categories`), shown as a **preview
with a per-row error report**, and only then committed to `products` — writing a
`product_versions` history entry. Products stay inactive until **manual
approval**. Every record carries `source`, `imported_at`, `region`, `currency`,
and `approval_status`.
**Context:** Catalogue governance requirements; nothing recommended before
approval.
**Consequences:** Auditable, reversible imports; more schema up front. The schema
is created in Phase 2; the full import tooling/UI is built in Phase 8.
**Alternatives:** Direct upsert into `products` (rejected — no validation,
preview, versioning, or approval gate).

### ADR-009 — Source-adapter (multi-source) data architecture
**Decision:** Support multiple product-data sources behind a common
source-adapter architecture — (1) authorized Skechers website, (2) approved
catalogue, (3) official API/feed, (4) internal manual entry, (5) synthetic demo
data. Every source flows through the same pipeline: *connector → normalization →
validation → approval → internal product database*. The recommendation engine
and associate app read **only** the normalized internal database.
**Context:** Business clarification — the app is for an authorized exclusive
Skechers retail partner and may eventually consume official product data from
different sources; the engine must not be permanently coupled to one source.
**Consequences:** Sources can be added/swapped without touching the engine;
requires a normalization layer and per-source connectors. Product model gains
`source_type`, `source_url`, `source_identifier`, `source_region`,
`source_version`, `permission_status`, `last_synced_at`, `data_status`,
`approval_status`, `approved_by`, `approved_at`.
**Alternatives:** Hard-wiring the engine to one source (rejected — brittle,
blocks region/official-data expansion).

### ADR-010 — Authorized-partner data posture (no live retrieval yet)
**Decision:** Treat official Skechers data usage as a **future, permission-gated
capability** unlocked by the partner agreement/approvals. Until then: synthetic
demo data only; no scraper, crawler, or live website/API retrieval is
implemented; the frontend never calls an external product website directly; and
the app never claims endorsement or authorization beyond the actual agreement,
nor presents itself as a public Skechers website. Region and currency are stored
per official record; no single global catalogue is assumed.
**Context:** Business clarification about the partner relationship, balanced
against the standing no-scraping / synthetic-first guardrails (ADR-007), which
remain in force.
**Consequences:** A clear, compliant path to official data later without
building anything risky now. Supersedes only the earlier "no affiliation at all"
framing — reframed as "no claims beyond the actual partner agreement"; all other
ADR-007 guardrails stand.
**Alternatives:** Enabling website/API access now (rejected — premature, not yet
authorized, and out of the current phase scope).

### ADR-011 — Permissive demo RLS now; harden before production
**Decision:** In the demo, catalogue/reference tables (`products`,
`product_sources`, `product_relationships`, `customer_needs`, `stores`,
`inventory`) allow anonymous `SELECT`; `recommendation_approvals` and
`recommendation_events` are default-deny (writes via privileged roles during
seeding/demo). This is acceptable **only** because the data is synthetic.
**Context:** Phase 2 has no auth yet (auth is Phase 6); the future read-only
frontend needs to read demo data.
**Consequences:** Simple to develop against; **not** production-safe. A
pre-production security review (Phase 10) MUST review and restrict: anonymous
product reads, catalogue import permissions, product approval permissions,
recommendation-relationship changes, inventory updates, and recommendation-event
writes. Tracked in `PROJECT_PLAN.md` (Pre-production security review) and
`CLAUDE.md` security rules.
**Alternatives:** Locking everything down now (rejected — no auth exists yet, and
it would block demo development); leaving it permissive into production
(rejected — unsafe).

### ADR-012 — Frontend structure: prop-driven views + thin query containers (Phase 4)
**Decision:** Build the UI as small **presentational components** driven purely
by props (loading/error/empty/success), wrapped by thin **container** components
that wire TanStack Query + the Supabase client + React Router. The associate's
selection (product + customer need) lives in a `SelectionContext`, ready for the
Phase 5 engine.
**Context:** Phase 4 needs testable states without a live database, and a clean
seam for the recommendation engine.
**Consequences:** Every state is unit-testable by rendering the view with props;
data access is isolated in `src/lib`; no recommendations are produced yet. Data
layer is mocked/omitted in tests, so no Supabase instance is required to test.
**Alternatives:** Fetching directly inside presentational components (harder to
test); a global store like Redux (unnecessary for this scope).

### ADR-013 — Demo labeling in the UI
**Decision:** `VITE_DEMO_MODE` (default true) makes the UI render prices with a
`Demo` prefix and show a `DEMO` badge in the header; the app never presents as an
official Skechers application.
**Context:** Product principle — synthetic data must never look like official
Skechers pricing/branding.
**Consequences:** Safe to demo; flip `VITE_DEMO_MODE=false` only with approved
real data. **Alternatives:** No demo labeling (rejected — misleading).

### ADR-014 — Deterministic slot-based recommendation engine (Phase 5)
**Decision:** The engine is a pure function over candidate relationships. It
fills three fixed slots — premium upgrade (`upgrade_to`), alternative
(`alternative_to`), and add-on (`pairs_with`/`recommended_add_on` to
socks/shoe-care) — taking one per slot, max three. Ordering within a slot is
fully deterministic: need-relevant first → `priority` asc → price asc → SKU asc.
It excludes the source product, inactive/unapproved/out-of-region/out-of-stock
candidates, and mismatched `recommended_for_customer_need` edges; it dedupes
target products and copies `reason`/`customer_benefit` verbatim.
**Context:** Phase 5 needs explainable, testable recommendations with no AI and
no generated claims.
**Consequences:** Same inputs → same outputs (unit-tested); a clean seam for a
future AI re-ranking phase that stays grounded on these rows.
**Alternatives:** Weighted scoring across all types (less predictable), AI-first
(off-brief).
**Coverage source.** The engine's *output quality* depends on relationship
coverage, not on the rules. Coverage must come from **approved relationship
data**, never from loosening the filters. In production the pipeline is:
**Approved catalogue → product features & technologies → approved relationship
mapping → recommendation engine.** During prototyping the demo seed stands in
for that pipeline: coverage gaps are fixed by adding complete, approved
synthetic relationships (see `database/tests/recommendation_validation.sql`),
not by weakening `upgrade`/`alternative`/`add-on` filtering.

### ADR-015 — Anonymous display-event logging + demo insert policy
**Decision:** Recommendation display events are logged to `recommendation_events`
with **no** associate/customer identity (`associate_id` null). A narrow RLS
insert policy (`with check (associate_id is null)`) lets the demo client write
them; logging is best-effort and never blocks the UI.
**Context:** The spec requires recording display events without collecting PII,
while RLS is otherwise default-deny.
**Consequences:** Anonymous analytics are captured now; the Phase 10 security
review will tighten who can write events (already on the checklist).
**Alternatives:** No logging (loses signal); a service-role write from the client
(rejected — never ship service-role keys to the browser).

---

## 3. Project folder structure (proposed)

```
skechers-sales-assistant/
├─ CLAUDE.md                 # agent/dev guidance (rules)
├─ PROJECT_PLAN.md           # scope, roadmap, architecture, entities
├─ DECISIONS.md              # this file
├─ README.md                 # what/why/how to run
├─ .env.example              # documented env var names (no values)
├─ .gitignore                # ignore secrets & build artifacts
├─ public/
│  ├─ icons/                 # PWA icons (added later)
│  └─ images/products/       # placeholder product images (added later)
├─ src/
│  ├─ main.tsx  App.tsx      # app entry (Phase 3)
│  ├─ routes/                # route definitions
│  ├─ pages/                 # Lookup, Product, NeedSelection, Recommendations, Outcome
│  ├─ components/ui/         # shared UI primitives
│  ├─ features/
│  │  ├─ products/           # lookup + display
│  │  ├─ recommendations/    # engine + cards (Phase 4)
│  │  └─ outcomes/           # outcome logging (Phase 5)
│  ├─ lib/                   # supabase client, typed API/service layer
│  ├─ hooks/                 # shared hooks
│  ├─ types/                 # shared + generated DB types
│  ├─ data/                  # sample CSV / fixtures
│  └─ styles/                # tailwind entry
├─ supabase/
│  ├─ migrations/            # schema as migrations (Phase 2)
│  ├─ seed/                  # sample seed data (Phase 2)
│  └─ config.toml            # supabase project config (added with CLI)
├─ scripts/
│  └─ import-products.ts     # CSV → DB importer (Phase 2)
└─ tests/
   ├─ unit/                  # Vitest
   └─ e2e/                   # Playwright
```

The directory skeleton (with `.gitkeep`) is created in Step 1; source files are
added in their respective phases.

---

## 4. Security & privacy considerations

- **No customer PII** collected, stored, or shown. Outcomes are anonymous.
- **RLS default-deny** on all tables; catalog read-only, outcomes narrow-write.
- **Secret hygiene:** `.env` git-ignored, `.env.example` documents names only;
  only `VITE_`-prefixed values ship to the browser; service-role key is
  server-only.
- **Grounded content:** app renders approved rows; never fabricates products,
  prices, features, or claims.
- **Transport:** HTTPS only (hosting + Supabase enforce TLS).
- **Input validation:** product codes and outcome enums validated before use.
- **No proprietary data:** placeholder images and sample data in development.

---

## 5. Testing strategy

- **Unit (Vitest):** recommendation/scoring logic, data mappers, validators.
- **Component (React Testing Library):** each screen's loading/empty/error/
  success and "fewer than three recommendations" states.
- **E2E (Playwright):** one happy-path run of the full workflow.
- **Determinism:** fixtures/seed only — never live data.
- **CI gate:** typecheck + lint + unit on every PR; red builds don't merge.

---

## 6. Environment variables (eventual)

Names only — see `.env.example`. Values never committed.

| Variable | Scope | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | browser | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | browser | Public anon key (RLS-guarded) |
| `VITE_APP_ENV` | browser | `development` / `production` flag |
| `VITE_DEMO_MODE` | browser | When true, render demo labels on prices/availability (synthetic data) |
| `SUPABASE_SERVICE_ROLE_KEY` | server/scripts only | Import script + admin tasks — **never** shipped to client |
| `SUPABASE_PROJECT_REF` | server/scripts | CLI / migrations target |
| `SUPABASE_DB_URL` | server/scripts | Direct DB connection for migrations/import |
| `ANTHROPIC_API_KEY` *(Phase 7)* | Edge Function only | Grounded AI assist — server-side, never client |
| `VITE_SENTRY_DSN` *(optional)* | browser | Error monitoring |

---

## 7. Local development commands (once scaffolded — Phase 2+)

```bash
pnpm install                 # install deps
pnpm dev                     # run Vite dev server (mobile-first)
pnpm build && pnpm preview   # production build + local preview
pnpm typecheck               # tsc --noEmit
pnpm lint                    # ESLint
pnpm test                    # Vitest unit/component
pnpm test:e2e                # Playwright
supabase start               # local Supabase (Docker)
supabase db reset            # apply migrations + seed locally
pnpm import:products -- src/data/sample-products.csv   # CSV import
```

*(These are the intended scripts; `package.json` is created in Phase 2, not now.)*

---

## 8. Deployment options

- **Frontend:** Vercel (recommended) — zero-config Vite, preview URLs, HTTPS.
  Alternatives: Netlify, Cloudflare Pages.
- **Backend/DB:** Supabase Cloud (managed Postgres, Storage, Auth, Edge
  Functions).
- **CI/CD:** GitHub Actions runs checks on PR; deploy on merge to the default
  branch.

---

## 9. Risks & open questions

**Risks**
- **Stale availability** without POS integration could mislead associates.
- **Curation bottleneck:** approved selling copy must be authored/maintained by
  someone — quality and coverage depend on it.
- **Sparse rules:** if `recommendation_rules` are thin, the engine returns fewer
  than three recommendations (acceptable, but reduces value).
- **Image/data licensing:** must use placeholders until an approved asset source
  exists.
- **AI grounding (future):** must be rigorously constrained to avoid inventing
  claims.

**Open questions** (also in `PROJECT_PLAN.md` §8)
1. Recommendation mix policy: fixed category slots vs. pure priority?
2. Availability ownership & acceptable staleness?
3. Any associate/store attribution in MVP outcomes, or fully anonymous?
4. Single currency for MVP; when do multi-region pricing and i18n arrive?
5. Who owns curation of approved products and selling copy?
6. Scanning hardware: phone camera vs. store handheld scanners?
7. Package manager: pnpm vs. npm?

---

## 10. Definition of done — Step 1

See `PROJECT_PLAN.md` §8. In short: docs written, stack chosen and justified,
folder skeleton + env template + `.gitignore` in place, entities specified,
boundaries explicit, committed and pushed — and **no** engine/UI/auth/AI/real
data — then wait for approval before Phase 2.
