# Database Validation — Skechers Sales Assistant

How the Phase 2 database foundation is validated, and the latest results.
Validation runs against a **local** database only — never production.

- Test script: `database/tests/validation.sql`
- Runner: `scripts/db-validate.sh`

## What is verified

| # | Check |
|---|-------|
| 1 | All 8 core tables are created |
| 2 | Seed data loads with expected counts |
| 3 | Products can be queried (by SKU) |
| 4 | Recommendations can be queried by source product |
| 5 | Duplicate SKUs are rejected |
| 6 | Self-referencing relationships are rejected |
| 7 | Invalid relationship types are rejected |
| 8 | Invalid status values are rejected |
| 9 | Foreign keys are enforced |
| 10 | Duplicate inventory (product/store/size) is rejected |
| 11 | Inventory can be queried by store and product |
| 12 | Official data-source fields exist (future synchronization) |
| 13 | Priority must be greater than zero |
| 14 | Barcode is unique when present |

**Recommendation coverage** (`recommendation_validation.sql`): R1 no self-refs ·
R2 no duplicate edges · R3 ≥5 shoes slottable · R4 five named products fully
covered with distinct slot targets · R5 all demo-region/approved.

**Authentication / RLS** (`auth_rls_validation.sql`, run as a non-superuser role
with a simulated JWT + demo GUC): A anonymous insert allowed in demo mode · B
blocked in production · C authenticated self+store insert allowed · D arbitrary
`associate_id` rejected · E arbitrary `store_id` rejected · F associates cannot
update/delete events · G cannot write products/relationships/approvals/catalogue ·
H associate can read own profile.

Positive checks assert expected data; negative checks attempt an invalid insert
inside a sub-transaction and confirm the database **rejects** it.

## How to run

### Option A — Supabase CLI (preferred, when installed)

```bash
cd skechers-sales-assistant
supabase start          # starts a local Supabase stack (Docker)
supabase db reset       # applies migrations + seed.sql to the LOCAL db
./scripts/db-validate.sh   # applies schema/seed (idempotent) and runs the tests
```

`scripts/db-validate.sh` defaults to the local Supabase database
(`postgresql://postgres:postgres@127.0.0.1:54322/postgres`). Override with
`DATABASE_URL=... ./scripts/db-validate.sh` to target another **local** database.

### Option B — Direct against the Supabase Postgres image (also used for this run)

The schema, seed, and all 14 checks were additionally validated against the
**official Supabase Postgres image** (`public.ecr.aws/supabase/postgres:15.8.1.085`,
the exact image `supabase start` uses), run directly via Docker. Because that
image has the `anon`/`authenticated` roles, the Supabase-specific grant/RLS path
executed and was confirmed:

- RLS enabled on all **8/8** tables; **6** read policies present.
- `anon` has `SELECT` on `products` (portable grant block ran).
- An `anon`-role read returns all **18** demo products (RLS + policy + grant).

### Option C — Local PostgreSQL

Also validated against a local **PostgreSQL 16** cluster. The migration is
portable: Supabase-only role grants (`anon`/`authenticated`) are applied only if
those roles exist, so it runs cleanly on plain Postgres and on Supabase alike.

### Note on the full `supabase start` stack

`supabase start` successfully pulls the images and applies the migration + seed
to Supabase Postgres, but the **full local stack cannot finish booting in this
sandbox**: an auxiliary service container fails with
`error setting rlimit type 7 (NOFILE): operation not permitted` because the
sandbox caps file-descriptor limits (hard limit 20000) and the container isn't
permitted to raise them. This is an environment limitation, not a schema issue —
the database layer itself is fully validated (above). In an unrestricted
environment, `supabase start` + `supabase db reset` run normally.

```bash
# spin up a throwaway local cluster, apply migration + seed, run validation.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260806120000_create_core_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/tests/validation.sql
```

## Latest results — ✅ all passed (PostgreSQL 16)

```
=== APPLY MIGRATION ===  migration: OK
=== LOAD SEED ===        seed: OK
=== VALIDATION TESTS ===
PASS 1: all 8 core tables exist
PASS 2: seed counts correct (18 products, 27 relationships, ...)
PASS 3: products queryable by SKU
PASS 4: 5 recommendations queryable for SHOE-WALK-001
PASS 5: duplicate SKU rejected
PASS 6: self-referencing relationship rejected
PASS 7: invalid relationship_type rejected
PASS 8: invalid approval_status rejected
PASS 9: foreign keys enforced (non-existent products rejected)
PASS 10: duplicate inventory (product/store/size) rejected
PASS 11: inventory queryable by store & product (4 rows)
PASS 12: official data-source fields present on products & product_sources
PASS 13: priority must be > 0 (zero rejected)
PASS 14: duplicate barcode rejected (unique when present)
================= ALL VALIDATIONS PASSED =================
VALIDATION EXIT: 0
```

## Seed-data counts

| Entity | Count |
|--------|------:|
| products (10 shoes / 5 socks / 3 shoe-care) | 18 |
| product_sources | 18 |
| product_relationships | 27 |
| recommendation_approvals | 3 |
| customer_needs | 9 |
| stores | 1 |
| inventory | 53 |
| recommendation_events | 5 |
