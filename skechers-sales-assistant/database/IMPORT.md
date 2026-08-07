# Catalogue Import Workflow — Skechers Sales Assistant

Phase 3 builds the **catalogue-import foundation** so the app can later receive
**authorized** Skechers product data from CSV, Excel, JSON, an official
API/product feed, or an authorized website connector — all through one safe,
staged, approval-gated pipeline. **Synthetic demo data only** in this phase; no
scraping, no live website, no real catalogue.

- Service code: `src/import/` · Demo runner: `scripts/run-import-demo.ts`
- Migration: `supabase/migrations/20260806130000_create_catalogue_import.sql`
- Sample file: `data/demo-catalogue.csv`
- Tests: `tests/unit/*.test.ts`, `database/tests/import_validation.sql`

## The 16-stage workflow

```
 1. File upload input           ──▶ caller provides file content + ImportContext
 2. File format detection       ──▶ detectFormat()  (csv | xlsx | json)
 3. Data parsing                ──▶ parseByFormat()  (papaparse / xlsx / JSON)
 4. Column mapping              ──▶ mapColumns()  (header aliases → canonical)
 5. Required-field validation   ┐
 6. Data type validation        │
 7. Duplicate SKU detection     │
 8. Duplicate barcode detection ├─▶ normalizeRow() + buildImportPreview()
 9. Product-source validation   │
10. Region & currency validation│
11. Image URL validation        ┘
12. Import preview              ──▶ ImportPreview { rows, counts }
13. Import error report         ──▶ preview.errorReport (per-row, coded errors)
14. Draft import               ┐
15. Approval before activation ├─▶ planCommit()  → insert/update/conflict/skip
16. Import history             ┘   persisted in catalogue_imports / _rows / _versions
```

Each stage is a small pure function in `src/import/`, so the whole pipeline is
unit-testable without a database.

## Supported fields

SKU · Barcode · Style number · Product name · Category · Subcategory · Gender ·
Color · Size range · Price · Currency · Region · Image URL · Product URL ·
Description · Key features · Technology · Activity type · Source type · Source
URL · Source identifier · Source version · Data status · Approval status.

Column **aliases** are accepted (e.g. `SKU`/`product_code`, `MSRP`/`price`,
`colour`/`color`) via `columnMapping.ts`.

## Validation rules

| Rule | Behavior |
|------|----------|
| Required fields | `sku`, `name`, `category` must be present (`required`) |
| Price | Absent → null; if present must be a finite number ≥ 0 (`invalid_price`) |
| Currency | `DEMO` or a 3-letter code (`invalid_currency`) |
| Region | `DEMO` or a short alphanumeric market code, no spaces/symbols (`invalid_region`) |
| Image URL | If present, must be an `http(s)://` URL or a `/root-relative` path (`invalid_image_url`) |
| Duplicate SKU | Rejected within the batch (`duplicate_sku`) |
| Duplicate barcode | Rejected within the batch and against a barcode owned by a different SKU (`duplicate_barcode`) |
| Source type | Row value used if valid, else the import context's source type |

## Safe import workflow (guarantees)

1. **Never auto-approved.** Imported rows are forced to `draft` (only if the file
   explicitly says `draft`) or `pending_review` — **never** `approved`, even if
   the file claims `approved`. `data_status` is forced to `imported`.
2. **Invalid rows are rejected** with clear, coded messages and never enter the
   commit plan.
3. **Preview before insert.** `buildImportPreview()` produces the full row-by-row
   result and error report; nothing is written during preview.
4. **Approved records are protected.** A row whose SKU matches an existing
   **approved** product is marked `conflict` and is **not** overwritten by
   `planCommit()` unless `allowOverwriteApproved: true` is passed explicitly —
   and even then the record is re-staged as `draft`/`pending_review` with a
   version snapshot, never silently replaced or auto-approved.
5. **Traceable.** Every import is tied to a source, region, importer, and time
   via `catalogue_imports`, and every changed product is versioned in
   `catalogue_versions`.

### Commit actions

| Action | When | Effect in `planCommit` |
|--------|------|------------------------|
| `insert` | SKU not in catalogue | Staged as a new draft/pending_review product |
| `update` | SKU exists, **not** approved | Staged update, prior version snapshotted |
| `conflict` | SKU exists and **is approved** | Protected — skipped unless explicit overwrite |
| `skip` | Row invalid | Excluded from commit |

## Database tables (see `database/SCHEMA.md`)

- `catalogue_imports` — one import batch: file/format, source, region, currency,
  `imported_by`, `imported_at`, status, row counts, error summary.
- `catalogue_import_rows` — staged rows: `raw_data`, `normalized_data`,
  `validation_status`, `validation_errors`, planned `action`, unique per
  `(import_id, row_number)`.
- `catalogue_versions` — product version history from imports, unique per
  `(product_id, version_number)`.

All three are RLS default-deny (admin/back-office only).

## Running it

```bash
npm install
npm run typecheck          # tsc --noEmit
npm test                   # vitest unit tests
npm run import:demo        # parse data/demo-catalogue.csv and print the preview + plan
./scripts/db-validate.sh   # apply migrations + seed, run DB validation (incl. import)
```

## Sample file — `data/demo-catalogue.csv`

9 synthetic rows: 5 valid + 4 deliberate errors — 1 duplicate SKU, 1 missing
required field (name), 1 invalid price, 1 invalid currency. No real Skechers
names, images, prices, or descriptions.

## Method 1 — Real Skechers ingestion runner (authorized adapter)

A standalone backend pipeline ingests **real (authorized-sample) Skechers product
records** through this same Phase 3 importer. It **does not scrape skechers.com**
— the default source reads provided fixtures / an export file behind a
source-adapter seam (see `DECISIONS.md` ADR-023 and `database/GOVERNANCE.md`). The
app UI never fetches from the web; it reads only the internal DB.

```bash
# Ingest sample styles (auto-includes the anchor products the rules reference):
npm run ingest:skechers -- --styles=232625,124500,216202

# Approve on import + refresh the browser-demo data module:
npm run ingest:skechers -- --styles=232625,124500,216202 --auto-approve --update-demo

# From a provided authorized export file, for a different market:
npm run ingest:skechers -- --file=./data/skechers-export.json --region=US --currency=USD
```

**Flags:** `--styles=` (comma list; default = all bundled samples) · `--file=`
(JSON export overlay) · `--region=` / `--currency=` (default `AE` / `AED`) ·
`--auto-approve` (explicit approval → `approved`; otherwise `pending_review`) ·
`--update-demo` (write `src/demo/ingested.generated.ts`) · `--out=` (SQL path,
default `supabase/seed/skechers_ingested.sql`) · `--dry-run`.

**Pipeline:** source adapter → `extractProduct` → `normalizeProduct`
(taxonomy/gender/activity mapping; stamps `source_type='skechers_official_web'`,
`source_url`, `source_identifier`, `source_version`/synced_at) → `buildImportPreview`
+ `planCommit` (this file's validation/dedupe/safe-approval) → **relationship rule
engine** (walking→socks+care+premium upgrade · Slip-ins→no-show socks ·
Work→slip-resistant upgrade · price tiers→lower/higher price option) → emit an
**idempotent SQL script** (products upsert that updates only price/image on SKU
conflict, provenance rows, a `catalogue_imports` batch record, and relationships)
and optionally the demo module. Apply the SQL to a Supabase/staging DB (never
production without review). Code: `scripts/skechers/`, `scripts/ingest-skechers.ts`;
enum migration: `supabase/migrations/20260807120000_add_web_source_type.sql`.

## Not in this phase (the base Phase 3 foundation)

No product UI, no barcode scanning, no AI, no authentication, and **no scraping /
website crawler**. Method 1 (above) adds the authorized ingestion pipeline but
still performs **no live scraping** — the live web connector is a permission-gated
seam, disabled by default (see `PROJECT_PLAN.md` §3a and the data-source roadmap).
