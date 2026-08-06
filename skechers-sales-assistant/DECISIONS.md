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
