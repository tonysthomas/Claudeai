# Product Relationships — Skechers Sales Assistant

How the recommendation edges are modeled in `product_relationships`, the eight
relationship types, and the synthetic demo edges seeded in Phase 2. All copy
here is **curated** — the app renders `reason`/`customer_benefit`, it never
generates them.

## The edge model

A relationship is a **directed, typed, approved edge** from a *source* product
(the one the customer selected/scanned) to a *target* product (the recommended
one):

```
source_product ──[relationship_type, priority, region]──▶ target_product
                    + reason (curated)
                    + customer_benefit (curated)
                    + activity_type / customer_need (when relevant)
                    + active + approval_status
```

- A product **cannot** relate to itself (`source <> target`).
- An edge is unique per `(source, target, relationship_type, region)` — the same
  pair can carry different relationship types, and different regions can differ.
- `priority > 0` orders competing edges (lower = shown first).
- Only `active = true` **and** `approval_status = approved` edges are used in
  production. Demo edges are seeded as `active` with `approval_status = demo`.

## The eight relationship types

| Type | Meaning | Typical target |
|------|---------|----------------|
| `upgrade_to` | A premium/step-up version | Higher-tier shoe |
| `alternative_to` | A comparable alternative | Similar shoe |
| `pairs_with` | Naturally worn together (attach) | Socks |
| `recommended_add_on` | A complementary add-on (attach) | Shoe-care |
| `lower_price_option` | A cheaper option | Budget shoe |
| `higher_price_option` | A more premium option | Premium shoe |
| `best_for_activity` | Best choice for an activity | Activity-specialized shoe |
| `recommended_for_customer_need` | Best choice for a stated need | Need-matched shoe |

> **Attach modeling.** Socks are modeled as `pairs_with` (shoe + sock attach) and
> shoe-care as `recommended_add_on`. Both feed the attach-rate goals.

## How the recommendation engine (future, Phase 4) will read them

Given a **selected product** and optionally a **customer need**:

1. Read `product_relationships` where `source_product_id = <selected>`,
   `active`, and (in production) `approval_status = approved`.
2. Optionally filter/boost by `customer_need` / `activity_type` and `region`.
3. Order by `priority`, diversify across types (e.g. an upgrade **plus** socks
   **plus** shoe-care), and return the top few — each carrying its curated
   `reason` and `customer_benefit`.

The engine only ever returns products/edges that exist and are approved; it never
invents relationships. (Engine implementation is Phase 4 — not built yet.)

## Seeded demo edges (27 total)

| Relationship type | Count | Examples (source → target) |
|-------------------|------:|----------------------------|
| `upgrade_to` | 3 | Demo Walk Comfort 1 → Demo Walk Comfort 2 |
| `alternative_to` | 2 | Demo Walk Comfort 1 → Demo Everyday Slip-On 1 |
| `pairs_with` (socks) | 5 | Demo Walk Comfort 1 → Demo Performance Sock 1 |
| `recommended_add_on` (shoe-care) | 3 | Demo Walk Comfort 1 → Demo Shoe Care Kit 1 |
| `lower_price_option` | 2 | Demo Walk Comfort 2 → Demo Budget Step 1 |
| `higher_price_option` | 2 | Demo Budget Step 1 → Demo Max Cushion Cloud 1 |
| `best_for_activity` | 5 | Demo Everyday Slip-On 1 → Demo Sport Fit Runner 1 |
| `recommended_for_customer_need` | 5 | Demo Street Style 1 → Demo Work Cushion 2 (`work_long_hours`) |

Example: recommendations for **Demo Walk Comfort 1** (`SHOE-WALK-001`) return 5
edges — an upgrade, an alternative, a sock pairing, a shoe-care add-on, and a
premium (higher-price) option — enough to build a diversified top-3.

## Customer needs

Edges may carry a `customer_need` (matching a `customer_needs.code`):
`everyday_comfort`, `walking`, `work_long_hours`, `fitness`, `travel`, `style`,
`budget`, `maximum_cushioning`, `support`. The `recommended_for_customer_need`
type maps a stated need directly to a suitable product.

## Region awareness

Every edge stores a `region` (demo: `DEMO`). This means a future authorized
catalogue can hold **different** approved relationships per region without
collisions — the uniqueness key includes `region`, and the engine filters by it.
No single global catalogue is assumed.
