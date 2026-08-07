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
decision). A later AI phase (Phase 11+) may rephrase but stays grounded on these rows.
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
risk. Live availability arrives in Phase 8 (inventory and store stock integration).

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
is created in Phase 2; the full real-catalogue import tooling/UI is a later phase.
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
pre-production security review (Phase 12) MUST review and restrict: anonymous
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
**Consequences:** Anonymous analytics are captured now; the Phase 12 security
review will tighten who can write events (already on the checklist).
**Alternatives:** No logging (loses signal); a service-role write from the client
(rejected — never ship service-role keys to the browser).

### ADR-016 — Associate auth with a DEMO_MODE bypass (Phase 6)
**Decision:** Use Supabase email/password auth. An `AuthProvider` tracks the
session and loads the associate's `associate_profiles` row + store. In
**DEMO_MODE** (default locally and in tests) it provides a synthetic
authenticated associate **without** calling Supabase, so the app and the Phase
4/5 acceptance tests run offline; the `RequireAuth` guard bypasses. In
production, routes are protected and unauthenticated users are redirected to
`/login`.
**Context:** The spec requires real auth while preserving DEMO_MODE for local dev
and automated tests.
**Consequences:** Tests need no Supabase; production is gated. `demoMode` is an
overridable prop so tests can exercise the production path too.
**Alternatives:** Requiring login even in tests (brittle, needs a live backend).

### ADR-017 — Event identity enforced by RLS; demo events gated by a DB GUC
**Decision:** `recommendation_events` inserts are governed by two policies: an
**authenticated** policy allowing a row only when `associate_id = app_current_uid()`
and `store_id = current_associate_store()` (the frontend cannot forge either),
and a **demo** policy allowing anonymous (`associate_id IS NULL`) rows only when
`app_demo_mode()` is true. `app_current_uid()` reads the JWT `sub`;
`app_demo_mode()` reads the `app.demo_mode` GUC (set by the demo seed only). No
update/delete policies exist, so associates cannot mutate events.
**Context:** "associate_id/store_id come from the session, cannot be arbitrary;
anonymous inserts only in DEMO_MODE, blocked in production."
**Consequences:** Enforcement is in the database, not just the client; portable
(GUC-based, no hard dependency on the Supabase `auth` schema) so it validates on
plain Postgres. Production simply never sets `app.demo_mode`.
**Alternatives:** Client-only checks (bypassable); `auth.uid()` directly (ties
the migration to the Supabase auth schema, breaking vanilla-PG validation).

### ADR-018 — associate_profiles.auth_user_id is a logical link (no hard FK)
**Decision:** `associate_profiles.auth_user_id` is a unique uuid logically linked
to `auth.users(id)`, without a hard FK.
**Context:** Demo seeding has no real auth user; a hard FK to `auth.users` would
block seeding and vanilla-PG validation.
**Consequences:** Demo data seeds anywhere; production provisions the profile
from the real auth user id. A hard FK (or an `on auth.users` trigger) can be
added in a Supabase-only migration later.
**Alternatives:** Hard FK now (breaks demo/validation).

### ADR-019 — Outcome feedback: append-only events, optimistic + non-blocking (Phase 7)
**Decision:** Each recommendation card carries an `OutcomeActionBar`. Tapping an
outcome writes **one** `recommendation_events` row via `logRecommendationOutcome`
(reusing the Phase 6 RLS rules — session associate/store in production, anonymous
in DEMO_MODE). The write is **optimistic and non-blocking**: the UI reflects the
choice and a confirmation immediately while the insert runs in the background;
failures surface a retry. Changing the outcome logs a **new** event (events are
append-only, immutable to associates); the latest tap is the current state.
**Context:** Associates need fast, real-time outcome capture on the floor with no
customer PII and no POS/payment hardware.
**Consequences:** Simple, auditable event stream; "current outcome" is the latest
event for a (selected, recommended) pair — analytics (a paused, later phase) can
reduce over the stream. No update/delete needed (and none is allowed by RLS).
**Alternatives:** Mutable per-recommendation outcome rows (needs update policy +
conflict handling; loses history); blocking writes (slows the associate UI).

### ADR-020 — Demo sales guidance is deterministic in-app content, DEMO_MODE only (Phase 9)
**Decision:** Sales guidance (discovery question → selling point → objection
handling → closing question) is generated by a **pure, deterministic** function
that maps `(customer_need, recommendation_type)` to **synthetic** templates and
composes them with the recommendation's already-approved `reason`/`customer_benefit`.
It is rendered **only when `isDemoMode`**, tagged `content_status: 'demo'` /
`source_type: 'synthetic'`, with a visible DEMO badge. **No AI, no external
requests, no scrapers, no DB table/migration, no customer PII.** Language stays
on comfort / feel / style / value / protection — no medical, biomechanical, or
unsupported claims.
**Context:** Phase 9 asks for structured guidance in demo mode without any AI.
**Consequences:** Fully testable and offline; a clean seam for a future,
approved guidance source (or the Phase 11 AI Sales Coach) to replace the
templates without touching the UI. Not shown in production until such a source
exists.
**Alternatives:** A guidance DB table + seed (unnecessary for demo-only, adds RLS
surface); LLM-generated guidance (explicitly out of scope — Phase 11+).

### ADR-021 — Analytics dashboard aggregates a synthetic dataset in-app, DEMO_MODE only (Phase 10)
**Decision:** The performance analytics dashboard is built from a **pure
aggregation function** (`aggregateEvents`) over a **fixed, deterministic synthetic
event dataset** (`SYNTHETIC_ANALYTICS_EVENTS`), not a live query over the
`recommendation_events` table. It computes acceptance rate (interested + added to
basket), attach rate, decline / unavailable / not-relevant rates, the full
8-action outcome distribution, and acceptance grouped by need, category, and
product pairing. The page is **gated to `isDemoMode`** and carries a prominent
**DEMO — synthetic analytics** disclaimer; a non-demo build shows a
"demo-only preview" notice instead. **No AI, no external requests, no new DB
table/migration, no real-sales claims, no customer PII.**
**Context:** Phase 10 asks for a management-style dashboard in demo mode. Querying
real events would (a) require aggregation RLS/policies and management roles that
belong to the Phase 12 security review, and (b) show near-empty data in the demo.
A deterministic synthetic set gives a realistic, testable, offline dashboard now.
**Consequences:** The aggregation math is unit-tested in isolation; swapping the
synthetic source for a real (approved, RLS-governed) aggregate query later is a
one-module change behind the same `AnalyticsSummary` shape, with no UI rework.
Figures must never be read as real performance — they are labeled synthetic
throughout.
**Alternatives:** Live Supabase aggregation now (premature — needs management
roles + reporting RLS, a Phase 12 concern); a materialized analytics table
(unnecessary for demo-only data); charting libraries (kept to lightweight inline
bars to preserve the self-contained single-file demo and avoid new deps).

### ADR-022 — AI Sales Coach: grounded, provider-abstracted, template-fallback, DEMO_MODE mock (Phase 11)
**Decision:** The AI Sales Coach is built around a small **`CoachProvider`
seam** and a service that always guarantees a safe result. The flow is: build a
**strict grounding context** from ONLY approved data (selected + recommended
product name/category/technology/key-features, price delta, recommendation type,
and the approved stored relationship reason/benefit + customer need) → call the
provider under a **timeout** → **validate** the output through guardrails
(reject medical/health/biomechanical claims; flag any technology not present in
the context) → on **any** failure (error, timeout, guardrail) **fall back to the
Phase 9 deterministic approved templates**. In **DEMO_MODE** the provider is a
**local mock** that composes natural-language tips **from the context object
only** (grounded by construction) — **no external API calls, no customer PII**.
In production `selectCoachProvider` returns **null**, so the coach always serves
the approved template until a real, approved, retrieval-grounded provider is
wired behind the same seam. The coach is a **conversational Q&A**: the associate
asks a free-text question, which the provider classifies into an intent (price /
style / fit objection, comparison, feature→benefit, add-on, discovery, closing,
general) and answers **from the context only**; the fallback maps the same intent
to the matching Phase 9 approved snippet, so every answer — AI or fallback — stays
grounded and safe. Thumbs 👍/👎 feedback is **demo-only, anonymous, and
not persisted** (no new table/migration, no PII).
**Context:** Phase 11 asks for dynamic conversational coaching without violating
the "approved products only / never invent / grounded AI only" principles or
introducing external dependencies or PII in the demo.
**Consequences:** The whole AI path is deterministic and testable offline; the
guardrails + fallback make the feature safe to ship in demo and safe-by-default
in production. Swapping the mock for a real LLM (with retrieval over approved
data) is a one-module change implementing `CoachProvider`; the context builder,
guardrails, fallback, and UI stay unchanged. AI output is never treated as a
source of truth — it may only rephrase already-approved facts.
**Alternatives:** Calling a hosted LLM directly from the browser (leaks keys,
adds PII/egress risk, non-deterministic tests — rejected); generating selling
copy without grounding (violates the no-invention principle — rejected);
persisting AI feedback to a new table now (premature; a reporting/RLS concern for
Phase 12 — deferred).

### ADR-023 — Web data ingestion: authorized source-adapter pipeline, no scraper (Method 1)
**Decision:** Real Skechers product ingestion is a **standalone backend pipeline**
(`scripts/skechers/` + `scripts/ingest-skechers.ts`) built on a **source-adapter
seam** (`SkechersSource`). The default adapter (`FixtureSkechersSource`) reads
**authorized sample records** from bundled fixtures / a provided export file — it
performs **no network access**. A `LiveWebSource` adapter exists only to show the
seam; it is **disabled by default and refuses to run** unless
`SKECHERS_INGEST_AUTHORIZED=true` and an operator-supplied approved endpoint are
set, and it **never defaults to skechers.com**. This project ships **no scraper**
(honoring CLAUDE.md's "do not implement scraping/crawling tooling — not in any
phase"). The pipeline: source → `extractProduct` → `normalizeProduct`
(taxonomy/gender/activity mapping + `source_type='skechers_official_web'`,
`source_url`, `source_identifier`, `source_version`/synced_at) → the **Phase 3
importer** (`buildImportPreview`/`planCommit` — same validation, dedupe, and
safe-approval guarantees) → an **automatic relationship rule engine** that wires
typed edges from **approved business rules** (walking→socks+care+premium upgrade;
Slip-ins→no-show socks; Work→slip-resistant upgrade; price tiers→lower/higher
price options) → emitters that produce an **idempotent SQL script** (products
upsert that updates only price/image on SKU conflict, provenance rows, batch
record, relationships) and an optional **browser-demo module**. The app UI never
fetches from skechers.com; it reads only the internal DB (or the demo module).
Approval stays **`pending_review`** unless `--auto-approve` is passed (an explicit
action), never weakening the importer's safe default.
**Context:** Method 1 asked to fetch real product data live from skechers.com,
which directly conflicts with CLAUDE.md's non-negotiable no-scraping rule and the
"official data is permission-gated" policy. The user chose the **authorized
adapter + provided data** path, so the whole pipeline is real, runnable, and
tested without scraping. A new `source_type='skechers_official_web'` enum value
(migration `20260807120000`) makes this provenance explicit and auditable.
**Consequences:** Ingestion is deterministic and unit/DB-testable offline;
relationships are generated from approved rules (never invented product facts);
provenance and approval gating are preserved end-to-end. Swapping in a real
authorized feed/connector is a one-adapter change behind `SkechersSource` — the
extractor, normalizer, relationship engine, importer, and emitters stay unchanged.
Generated relationship reasons/benefits are factual and non-medical.
**Alternatives:** A live scraper of skechers.com (violates CLAUDE.md + unauthorized
use of a third-party site — rejected); calling the website from the app UI
(violates "app never calls external product sites" — rejected); auto-approving
imports by default (violates the Phase 3 safe workflow — gated behind an explicit
flag instead).

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
| `ANTHROPIC_API_KEY` *(Phase 11+)* | Edge Function only | Grounded AI assist — server-side, never client |
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
