# Database Schema — Skechers Sales Assistant

Phase 2 database foundation. **Synthetic demo data only** — no real Skechers
catalogue data. The schema is designed so future authorized sources (website,
approved catalogue, official API/feed, manual entry) can synchronize into the
same normalized model.

- Migration: `supabase/migrations/20260806120000_create_core_schema.sql`
- Seed: `supabase/seed.sql`
- Validation: `database/tests/validation.sql` (see `database/VALIDATION.md`)

## Tables at a glance

| Table | Purpose |
|-------|---------|
| `products` | Normalized internal product catalogue (the single runtime source of truth) |
| `product_sources` | Where each product came from, its authorization, and sync/approval details |
| `product_relationships` | Approved, typed recommendation edges between products |
| `recommendation_approvals` | Audit trail of approval decisions for products & relationships |
| `customer_needs` | Canonical customer-need categories (reference data) |
| `stores` | Demo store context |
| `inventory` | Demo, static stock per product/store/size |
| `recommendation_events` | Anonymous log of what was recommended and the outcome (no PII) |

## Enumerated (CHECK-constrained) values

| Field | Allowed values |
|-------|----------------|
| `products.source_type`, `product_sources.source_type` | `website`, `catalogue`, `api_feed`, `manual`, `synthetic_demo` |
| `products.data_status` | `demo`, `imported`, `synchronized`, `changed`, `archived` |
| `products.approval_status`, `product_sources.approval_status`, `product_relationships.approval_status`, `recommendation_approvals.approval_status` | `draft`, `demo`, `pending_review`, `approved`, `rejected`, `archived` |
| `product_sources.permission_status` | `pending`, `granted`, `revoked`, `not_required` |
| `product_relationships.relationship_type` | `upgrade_to`, `alternative_to`, `pairs_with`, `recommended_add_on`, `lower_price_option`, `higher_price_option`, `best_for_activity`, `recommended_for_customer_need` |
| `recommendation_events.action` | `displayed`, `opened`, `presented`, `customer_interested`, `added_to_basket`, `customer_declined`, `product_unavailable`, `not_relevant` |

---

## 1. `products`

The normalized internal catalogue. Associate interactions read **only** from
here — never from a live external source.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `sku` | text, **unique, not null** | Product code |
| `barcode` | text | **Unique when present** (partial unique index) |
| `style_number` | text | Manufacturer style reference |
| `name` | text, not null | Display name |
| `category` | text, not null | e.g. `shoes`, `socks`, `shoe_care` |
| `subcategory` | text | e.g. `walking`, `work`, `kit` |
| `gender` | text | e.g. `unisex` |
| `color` | text | Colorway |
| `size_range` | text | e.g. `US 7-12` |
| `price` | numeric(10,2) | Demo price until an approved catalogue exists |
| `currency` | text, not null | Default `DEMO` |
| `region` | text, not null | Default `DEMO` |
| `image_url` | text | Placeholder asset during prototyping |
| `product_url` | text | Customer-facing product page (distinct from `source_url`) |
| `description` | text | Long description |
| `key_features` | jsonb | Structured feature list |
| `technology` | text | Named technology (approved data only) |
| `activity_type` | text | Best-for activity |
| `source_type` | text, not null | Which source class produced the record (default `synthetic_demo`) |
| `source_url` | text | Provenance URL of the source record |
| `source_identifier` | text | Stable id in the source system |
| `source_version` | text | Version/snapshot tag of the source data |
| `data_status` | text, not null | `demo`/`imported`/`synchronized`/`changed`/`archived` |
| `approval_status` | text, not null | Gates production usability; default `demo` |
| `approved_by` | text | Approver (becomes an auth user reference in Phase 6) |
| `approved_at` | timestamptz | When approved |
| `last_synced_at` | timestamptz | Last synchronization from the source |
| `imported_at` | timestamptz | When first ingested |
| `created_at` / `updated_at` | timestamptz | `updated_at` maintained by trigger |

**Indexes:** unique `sku`, partial-unique `barcode`, `category`, `activity_type`,
`technology`, `source_type`.

## 2. `product_sources`

Per-product provenance, authorization, and synchronization tracking — the basis
for multi-source, permission-gated sync.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid → `products.id` (cascade) | Nullable (can register a source before linking) |
| `source_type` | text, not null | Source class |
| `source_url` | text | Source location |
| `source_identifier` | text | Stable id in the source |
| `source_region` | text, not null | Default `DEMO` |
| `source_version` | text | Snapshot/version |
| `permission_status` | text, not null | `pending`/`granted`/`revoked`/`not_required` |
| `captured_at` | timestamptz | Capture or import date |
| `synced_at` | timestamptz | Synchronization date |
| `approval_status` | text, not null | Approval info; default `demo` |
| `approved_by` / `approved_at` | text / timestamptz | Approval info |
| `notes` | text | |
| `created_at` / `updated_at` | timestamptz | `updated_at` maintained by trigger |

**Indexes:** `product_id`, `source_type`.

## 3. `product_relationships`

The approved, typed recommendation edges. `reason` and `customer_benefit` are
**curated copy** shown to the associate — never generated at runtime.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `source_product_id` | uuid → `products.id` (cascade), not null | The product in hand |
| `target_product_id` | uuid → `products.id` (cascade), not null | The recommended product |
| `relationship_type` | text, not null | One of the 8 types (see table above) |
| `priority` | integer, not null | **> 0**; lower = higher priority |
| `reason` | text, not null | Why it's recommended (curated) |
| `customer_benefit` | text, not null | The benefit to the customer (curated) |
| `activity_type` | text | When relevant |
| `customer_need` | text | When relevant (matches a `customer_needs.code`) |
| `region` | text, not null | Default `DEMO` |
| `active` | boolean, not null | Default `true` |
| `approval_status` | text, not null | Only approved+active edges recommended in production |
| `created_at` / `updated_at` | timestamptz | `updated_at` maintained by trigger |

**Constraints:** cannot self-reference (`source <> target`); unique
`(source_product_id, target_product_id, relationship_type, region)` (no duplicate
edges); FKs to `products`; `priority > 0`; `relationship_type` &
`approval_status` CHECK-constrained.

**Indexes:** `source_product_id`, `target_product_id`, `relationship_type`.

## 4. `recommendation_approvals`

Audit trail of approval decisions. Each row references a relationship, a product,
or both (CHECK `relationship_id IS NOT NULL OR product_id IS NOT NULL`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `relationship_id` | uuid → `product_relationships.id` (cascade) | Nullable |
| `product_id` | uuid → `products.id` (cascade) | Nullable |
| `approval_status` | text, not null | The decision |
| `approved_by` / `approved_at` | text / timestamptz | Who/when |
| `notes` | text | |
| `created_at` | timestamptz | |

**Indexes:** `relationship_id`, `product_id`.

## 5. `customer_needs`

Canonical reference data, seeded by the migration: `everyday_comfort`, `walking`,
`work_long_hours`, `fitness`, `travel`, `style`, `budget`, `maximum_cushioning`,
`support`. Columns: `id`, `code` (unique), `name`, `description`, `active`,
`created_at`.

## 6. `stores`

Demo store context. Columns: `id`, `name`, `location`, `region` (default `DEMO`),
`active`, `created_at`.

## 7. `inventory`

Demo, static stock. **Not** connected to any POS/inventory system.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid → `products.id` (cascade), not null | |
| `store_id` | uuid → `stores.id` (cascade), not null | |
| `size` | text | Nullable |
| `quantity` | integer, not null | Default 0 |
| `availability_status` | text, not null | Demo values (`demo_available`/`demo_low`/`demo_out`) |
| `updated_at` | timestamptz | Maintained by trigger |

**Constraint:** unique `(product_id, store_id, coalesce(size,''))` — no duplicate
stock rows for the same product/store/size (NULL size treated as one bucket).
**Indexes:** `product_id`, `store_id`.

## 8. `recommendation_events`

Anonymous interaction/outcome log — **no customer PII**.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `selected_product_id` | uuid → `products.id` (cascade), not null | The product in hand |
| `recommended_product_id` | uuid → `products.id` (cascade), not null | What was shown |
| `relationship_id` | uuid → `product_relationships.id` (set null) | The edge behind it |
| `customer_need_id` | uuid → `customer_needs.id` (set null) | Selected need |
| `associate_id` | uuid | Optional until Phase 6 auth (no FK yet) |
| `store_id` | uuid | Optional (no FK yet) |
| `action` | text, not null | Interaction/outcome (8 values) |
| `sale_completed` | boolean, not null | Default false |
| `created_at` | timestamptz | |

**Indexes:** `selected_product_id`, `created_at`.

---

## Foreign-key relationships (summary)

```
products ──1:N──▶ product_sources
products ──1:N──▶ product_relationships (as source_product_id and target_product_id)
products ──1:N──▶ inventory ──N:1──▶ stores
products ──1:N──▶ recommendation_events (as selected_ and recommended_product_id)
product_relationships ──1:N──▶ recommendation_approvals
products              ──1:N──▶ recommendation_approvals
product_relationships ──0..1──▶ recommendation_events (relationship_id, on delete set null)
customer_needs        ──0..1──▶ recommendation_events (customer_need_id, on delete set null)
```

See `database/RELATIONSHIPS.md` for the recommendation-edge model in detail.

## Approval status & lifecycle

`approval_status` gates production usability everywhere it appears:
`draft → pending_review → approved` (or `rejected`/`archived`). The `demo` value
marks synthetic prototype records. **Only `approved` (and `active`) products and
relationships are recommended in production**; during prototyping the data is
`demo`. `products.data_status` tracks the sync lifecycle
(`demo`/`imported`/`synchronized`/`changed`/`archived`).

## Demo data policy

All Phase 2 data is **synthetic** (see `supabase/seed.sql`): invented names
(`Demo Walk Comfort 1`, `Demo Performance Sock 1`, …), placeholder SVG images,
and demo prices/currency/region/availability. No real Skechers product names,
descriptions, prices, images, or website content are used. No scraping or
crawling is performed. No customer PII is stored.

## Future approved catalogue-import process

The source/approval fields exist now so an authorized catalogue can later be
synchronized without restructuring. Planned flow (built in later, permission-
gated phases — see `PROJECT_PLAN.md` §3a and §6):

```
Authorized source (website / approved catalogue / API / feed / manual)
  → Data connector (per-source adapter)
  → Normalization into the products shape
  → Validation (required fields, duplicate SKU, price, image URL, category)
  → Approval (recommendation_approvals; approval_status → approved)
  → Internal products table (data_status → imported/synchronized)
  → Recommendation engine → Associate app
```

`product_sources` records each source and its `permission_status`; `products`
carries `source_*`, `data_status`, `last_synced_at`, and `imported_at` for audit
and re-sync. Nothing is recommended until it is `approved`.
