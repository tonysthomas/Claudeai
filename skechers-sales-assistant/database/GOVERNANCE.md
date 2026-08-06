# Governance & Production Readiness — Skechers Sales Assistant

Phase 12 deliverable. This document is the single reference for **AI & data
governance, data-privacy rules, environment configuration, the security posture,
and the production pre-flight checklist**. It complements `CLAUDE.md` (rules),
`PROJECT_PLAN.md` (roadmap/architecture), `DECISIONS.md` (ADRs), `database/SCHEMA.md`
(schema), and `database/VALIDATION.md` (how the database is validated).

> **Status:** the application is **demo-ready** and validated end-to-end on
> synthetic data. It is **not yet production-cleared for real Skechers data** —
> the [pre-flight checklist](#5-production-pre-flight-checklist) below must be
> completed first. Nothing here authorizes use of official Skechers data beyond
> the actual partner agreement.

---

## 1. AI & Data Governance

**Approved data only.** Every product, price, feature, technology, availability
value, and recommendation relationship shown to an associate comes from stored,
human-approved catalogue/relationship data. The app never invents them.

- **Recommendations** are approved, typed edges in `product_relationships`
  (`upgrade_to`, `alternative_to`, `pairs_with`, `recommended_add_on`, …), each
  carrying an approved `reason` and `customer_benefit`. Only `active`,
  `approved`/`demo` edges to `approved`/`demo` products are ever surfaced.
- **The recommendation engine is deterministic** (rules over approved data). It
  ranks and slots; it does not generate facts.
- **The AI Sales Coach (Phase 11) is strictly grounded and never authoritative.**
  It may only **rephrase** facts already present in the approved grounding
  context (selected + recommended product attributes, the approved
  reason/benefit, the customer need). It runs on a **local mock provider in
  DEMO_MODE only** — no external LLM calls, no network egress. Two guardrails run
  on every AI output before display:
  1. **Prohibited-claims guardrail** — rejects medical / health / therapeutic /
     biomechanical language (e.g. "cures plantar fasciitis", "prevents injury",
     "clinically proven", "orthotic").
  2. **Grounding guardrail** — flags any product/technology token not present in
     the approved context.
  On **any** failure — provider error, timeout, or a tripped guardrail, **and
  always in production** (no provider is wired) — the coach falls back to the
  Phase 9 deterministic **approved templates**. There is no path in which an
  associate sees unvalidated, ungrounded, or fabricated AI text.
- **No hallucinated specs or claims.** Because both the engine and the coach are
  bounded by approved data + guardrails, the system cannot present a feature,
  price, technology, or claim that is not in the approved catalogue.
- **Future AI** (real LLM providers, retrieval-augmented generation, AI
  re-ranking) must implement the same `CoachProvider` seam and pass the same
  guardrails + fallback. Retrieval must be constrained to approved catalogue data.

**No scraping, ever.** The public Skechers website is a research reference only.
The app implements no scraper/crawler/bulk-download in any phase; official data is
a future, permission-gated capability behind the source-adapter layer.

---

## 2. Data Privacy — zero customer PII

**No customer personal data is captured, stored, or displayed, anywhere.**

- **Interaction logs are anonymous.** `recommendation_events` records only what
  was recommended and the outcome: product ids, an optional relationship id, an
  optional customer-need id, an action enum, and (in production) the acting
  associate + their store. It has **no customer identity, contact, payment, or
  demographic fields**, and the app never writes any. Events are **append-only** —
  associates have no update/delete policy.
- **Associates are staff, not customers.** `associate_profiles` links to a
  Supabase auth user (staff login) and an assigned store; it holds an employee
  number, display name, role, and language — **no customer data**.
- **The AI coach receives no customer data.** Its grounding context is built
  purely from approved product/relationship/need records; free-text associate
  questions are classified and answered against that context. Coach 👍/👎 feedback
  is **demo-only, anonymous, and not persisted** (no table, no migration).
- **Analytics are synthetic and aggregate.** The Phase 10 dashboard aggregates a
  fixed synthetic event set (demo mode only) — no real store, associate, or
  customer data, and no PII.
- **Client secrets.** Only the public `VITE_SUPABASE_ANON_KEY` reaches the
  browser (see §3). The service-role key is never shipped to the client.

Anyone adding a feature that would capture customer data (name, contact, loyalty
id, payment, biometrics) **must stop** — it is out of scope and prohibited.

---

## 3. Environment Configuration

Only `VITE_`-prefixed variables are exposed to the browser. **Server/admin keys
are never `VITE_`-prefixed and never imported by `src/`.** (Audited: the only
`import.meta.env` reads in `src/` are `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
and `VITE_DEMO_MODE`; no `SERVICE_ROLE` reference exists anywhere in `src/`.)

| Variable | Scope | Development | Staging | Production |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | browser | local/staging project URL | staging URL | prod URL |
| `VITE_SUPABASE_ANON_KEY` | browser | anon key | anon key | anon key **only** |
| `VITE_APP_ENV` | browser | `development` | `staging` | `production` |
| `VITE_DEMO_MODE` | browser | `true` | `true`/`false` | **`false`** |
| `SUPABASE_SERVICE_ROLE_KEY` | server/scripts | local only | staging secret store | **server/edge secret store only — never client** |
| `SUPABASE_DB_URL` | server/scripts | local | staging | prod (migrations/admin only) |
| `ANTHROPIC_API_KEY` (future) | **edge function only** | unset | secret store | **edge secret store only — never client** |

**DEMO bypass is bounded on two independent layers, and both must be off in
production:**

1. **Frontend** — `VITE_DEMO_MODE=false` disables the synthetic associate, hides
   the demo-only guidance / AI coach / analytics surfaces, and (via
   `selectCoachProvider`) wires **no** AI provider so the coach serves approved
   templates only. `RequireAuth` then forces a real Supabase login.
2. **Database** — the demo bypass is the `app.demo_mode` GUC, **set only by
   `supabase/seed.sql`**, which must never run in production. With the GUC unset,
   `app_demo_mode()` returns false: anonymous event inserts are blocked and
   `associate_profiles` demo visibility is off. This is proven by the auth/RLS
   validation (check **B: anonymous insert blocked in production**).

Neither layer can be triggered in a correctly configured production build/database:
the frontend flag is a compile-time `VITE_` value, and the DB GUC is only ever set
by the demo seed.

---

## 4. Security Posture (current, audited)

Row Level Security is **enabled on every table (default-deny)**. Verified by
`database/tests/auth_rls_validation.sql` (11 checks) plus the core/import/
recommendation suites.

| Surface | Demo posture (current) | Production requirement |
|---|---|---|
| Catalogue reads (`products`, `product_sources`, `product_relationships`, `customer_needs`, `stores`, `inventory`) | Public read of **synthetic** data (`*_read_all using (true)`) | **Lock down** — authenticated-only (or store-scoped) reads. Apply `database/production_hardening.sql`. |
| `recommendation_events` insert | Authenticated: own id + assigned store only; anonymous: **demo-mode GUC only**, `associate_id IS NULL` | Keep authenticated policy; the demo/anon path is dead once the GUC is unset (drop it explicitly). |
| `recommendation_events` update/delete | **No policy → denied** | Unchanged (append-only). |
| `product_relationships`, `recommendation_approvals`, catalogue-import tables (writes) | **No client policy → denied**; server/admin role only | Unchanged — writes via server/admin (service role) only. |
| `associate_profiles` | Read own row (or demo); no client writes | Provision via `auth.users` FK or trigger; keep read-own. |
| Identity forgery | Rejected — associates cannot set arbitrary `associate_id`/`store_id` (checks D/E) | Unchanged. |

**Env-var boundary (audited):** `.env` is git-ignored (`.env`, `.env.*`, with
`!.env.example`); `.env` is **not tracked**; no service-role key appears in `src/`.

---

## 5. Production Pre-flight Checklist

Complete **all** items before serving real (authorized) data. SQL for the
database items is provided, reviewed, in `database/production_hardening.sql`
(a template kept **outside** `supabase/migrations/` so it is never auto-applied).

**Data & seeds**
- [ ] **Do not run `supabase/seed.sql`** against production (it loads synthetic
      data *and* sets the `app.demo_mode` GUC).
- [ ] Confirm `app.demo_mode` is **unset** on the production database
      (`select current_setting('app.demo_mode', true)` → empty). The hardening
      script also `reset`s it defensively.
- [ ] Load only **approved** catalogue data through the staged, validated,
      versioned import pipeline; nothing is recommended until `approved`.

**RLS & permissions** (apply `database/production_hardening.sql` as a real,
timestamped migration)
- [ ] Replace public catalogue-read policies with **authenticated-only**
      (or store-scoped) reads; revoke the demo `anon` grants.
- [ ] Drop the demo-gated anonymous `recommendation_events` insert policy.
- [ ] Confirm writes to `products` / `product_relationships` /
      `recommendation_approvals` / catalogue-import / `inventory` remain
      **server/admin-role only** (no client policy).
- [ ] Decide **catalogue image storage vs. URL reference** and apply the matching
      access controls (Supabase Storage policy or URL allow-list).

**Auth**
- [ ] Link `associate_profiles.auth_user_id` to `auth.users` — either a **hard FK**
      (`on delete cascade`) or an **`on_auth_user_created` trigger** that
      provisions a profile (both templated in the hardening script; pick one).
- [ ] Configure Supabase Auth (email/password or SSO), password policy, and email
      confirmation; assign each associate a store.

**Environment & secrets**
- [ ] `VITE_DEMO_MODE=false`, `VITE_APP_ENV=production`.
- [ ] Client build carries **only** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- [ ] Service-role key and any future `ANTHROPIC_API_KEY` live in a **server/edge
      secret store**, never in a `VITE_` var or `src/`.
- [ ] Serve over **HTTPS** only; set security headers/CSP at the host/CDN.

**Verification (re-run before release)**
- [ ] `npm run typecheck` · `npm test` · `npm run build` all green.
- [ ] `scripts/db-validate.sh` green against a **staging** DB (core + import +
      recommendation + auth/RLS suites).
- [ ] Manual smoke: with `VITE_DEMO_MODE=false`, login is required, the coach
      serves approved templates (no AI provider), and demo-only surfaces are
      hidden.

**Governance sign-off**
- [ ] Partner-agreement scope confirmed for any official Skechers data used.
- [ ] No customer PII collected by any new field, log, or integration.
- [ ] No scraping/crawling tooling present.

---

## 6. Change control

- All schema changes are **migrations** in `supabase/migrations/`; never hand-edit
  production. The hardening template is applied as a reviewed, timestamped
  migration at go-live.
- Significant architectural decisions are recorded in `DECISIONS.md` (ADRs).
- Approved-content fields (reason, benefit, selling sentence, coach templates) are
  **stored, human-reviewed data** — the app renders them; it does not author them.
