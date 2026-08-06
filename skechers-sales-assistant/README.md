# Skechers Sales Assistant

A **mobile-first, AI-powered retail sales assistant for Skechers store
associates**. After a customer selects or scans a Skechers product, the app
recommends the **next best approved product(s)** — an upgrade, an alternative,
socks, shoe-care, or a complementary item — each with a ready-to-say selling
sentence, so associates can attach, upsell, and cross-sell with confidence and
consistency.

> **Core principle:** the app recommends **only approved products** in the
> Skechers ecosystem. It never invents products, prices, features,
> technologies, availability, or claims.

## Status

**Phase 1 — planning & project setup (this commit).** No application code,
recommendation engine, UI, authentication, AI calls, or real Skechers data yet.

Start here:

- [`CLAUDE.md`](./CLAUDE.md) — rules, scope, and standards for anyone (human or
  agent) working in this project.
- [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) — product overview, workflow, phase
  roadmap, architecture, database entities, recommendation logic, open
  decisions, and definition of done.
- [`DECISIONS.md`](./DECISIONS.md) — technology stack rationale and
  architectural decisions with alternatives considered.
- [`.env.example`](./.env.example) — environment variables that will eventually
  be required (names only).

## Proposed stack (see `DECISIONS.md` for rationale)

TypeScript · React 18 · Vite (PWA) · Tailwind CSS · React Router · TanStack
Query · Supabase (Postgres + Auth + Storage + RLS + Edge Functions) · Vitest ·
Playwright.

## Workflow (MVP)

1. Associate enters or scans a product code → 2. app shows the product → 3.
associate picks a customer need → 4. app shows **three prioritized
recommendations** (image, name, price, type, reason, benefit, selling sentence,
availability) → 5. associate records the outcome.

## Getting started

Not runnable yet — the toolchain is scaffolded in Phase 2. Intended commands are
listed in [`DECISIONS.md`](./DECISIONS.md) §7.

## Working conventions

Development proceeds **phase by phase**, with an approval gate before each next
phase. See the roadmap in `PROJECT_PLAN.md`.
