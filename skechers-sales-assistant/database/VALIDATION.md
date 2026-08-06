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

### Option B — Local PostgreSQL (used for this run)

The Supabase CLI was not available in the validation environment, so the schema
was validated against a local **PostgreSQL 16** cluster (the same engine
Supabase runs). The migration is portable: Supabase-only role grants
(`anon`/`authenticated`) are applied only if those roles exist, so it runs
cleanly on both.

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
