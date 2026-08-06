-- =============================================================================
-- Skechers Sales Assistant — Catalogue import schema (Phase 3)
-- Migration: create_catalogue_import
--
-- Adds the staged, approval-gated catalogue-import foundation:
--   catalogue_imports      — one import batch (source, region, who/when, counts)
--   catalogue_import_rows  — staged raw+normalized rows with per-row validation
--   catalogue_versions     — version history when an import changes a product
--
-- SYNTHETIC DEMO DATA ONLY. Imported records are never auto-approved: they land
-- as draft/pending_review and only become active after explicit approval.
-- Reuses public.set_updated_at() from the core-schema migration.
-- =============================================================================

-- =============================================================================
-- catalogue_imports  (one upload / ingest event)
-- =============================================================================
create table public.catalogue_imports (
  id                uuid primary key default gen_random_uuid(),
  file_name         text,
  file_format       text not null
                      check (file_format in ('csv', 'xlsx', 'json', 'api_feed', 'website')),
  source_type       text not null
                      check (source_type in ('website', 'catalogue', 'api_feed', 'manual', 'synthetic_demo')),
  source_url        text,
  source_identifier text,
  source_version    text,
  region            text not null default 'DEMO',
  currency          text not null default 'DEMO',
  status            text not null default 'draft'
                      check (status in ('draft', 'previewed', 'validated', 'committed', 'approved', 'failed')),
  total_rows        integer not null default 0,
  valid_rows        integer not null default 0,
  invalid_rows      integer not null default 0,
  committed_rows    integer not null default 0,
  error_summary     jsonb,
  imported_by       text,            -- who imported (auth user reference in Phase 6)
  imported_at       timestamptz not null default now(),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.catalogue_imports is 'One catalogue import batch. Traceable to a source, region, importer, and time. Imported products are never auto-approved.';

create index catalogue_imports_status_idx      on public.catalogue_imports (status);
create index catalogue_imports_imported_at_idx on public.catalogue_imports (imported_at);

create trigger catalogue_imports_set_updated_at
  before update on public.catalogue_imports
  for each row execute function public.set_updated_at();

-- =============================================================================
-- catalogue_import_rows  (staged rows pending validation / approval)
-- =============================================================================
create table public.catalogue_import_rows (
  id                 uuid primary key default gen_random_uuid(),
  import_id          uuid not null references public.catalogue_imports (id) on delete cascade,
  row_number         integer not null,
  raw_data           jsonb not null,
  normalized_data    jsonb,
  validation_status  text not null default 'pending'
                       check (validation_status in ('valid', 'invalid', 'pending')),
  validation_errors  jsonb not null default '[]'::jsonb,
  action             text
                       check (action in ('insert', 'update', 'conflict', 'skip')),
  resolved_product_id uuid references public.products (id) on delete set null,
  created_at         timestamptz not null default now(),
  constraint catalogue_import_rows_unique_row
    unique (import_id, row_number)
);

comment on table public.catalogue_import_rows is 'Staged import rows: raw input, normalized output, per-row validation result, and the planned action (insert/update/conflict/skip). Nothing is committed before preview.';

create index catalogue_import_rows_import_idx  on public.catalogue_import_rows (import_id);
create index catalogue_import_rows_status_idx  on public.catalogue_import_rows (validation_status);
create index catalogue_import_rows_product_idx on public.catalogue_import_rows (resolved_product_id);

-- =============================================================================
-- catalogue_versions  (version history for products changed via import)
-- =============================================================================
create table public.catalogue_versions (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products (id) on delete cascade,
  import_id       uuid references public.catalogue_imports (id) on delete set null,
  version_number  integer not null default 1,
  snapshot        jsonb not null,
  approval_status text not null
                    check (approval_status in ('draft', 'demo', 'pending_review', 'approved', 'rejected', 'archived')),
  change_reason   text,
  changed_by      text,
  changed_at      timestamptz not null default now(),
  constraint catalogue_versions_unique_version
    unique (product_id, version_number)
);

comment on table public.catalogue_versions is 'Version history of product records changed through the import pipeline. Supersedes but never destroys the prior version.';

create index catalogue_versions_product_idx on public.catalogue_versions (product_id);
create index catalogue_versions_import_idx  on public.catalogue_versions (import_id);

-- =============================================================================
-- Row Level Security — import tables are admin/back-office only.
-- RLS enabled, NO public policies → default-deny. Import/approval operations run
-- through privileged/server roles; narrow authenticated policies arrive with
-- auth (Phase 6) and the security phase (Phase 10). No anon access.
-- =============================================================================
alter table public.catalogue_imports     enable row level security;
alter table public.catalogue_import_rows enable row level security;
alter table public.catalogue_versions    enable row level security;
