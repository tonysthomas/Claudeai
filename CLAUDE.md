# CLAUDE.md

Operational instructions for Claude Code sessions in this repo. Read
`PROJECT.md` for narrative context (what this project is, what's known
vs. inferred) and `GAPS.md` for the full punch list of what's missing.
This file is intentionally short — update it as real conventions emerge.

## Current state (2026-07-08)

This repo is **empty**: a `README.md` placeholder and nothing else. No
language, framework, build tool, test runner, linter, or CI exists yet.
There is no code to run, build, test, or lint — do not invent commands
for a stack that hasn't been chosen.

## Rules for this stage of the project

1. **Do not scaffold a stack unprompted.** If asked to "add a feature" or
   "fix a bug" before a stack exists, stop and ask what the project is
   meant to be and what stack to use — don't default to a framework of
   convenience (e.g. don't silently reach for Next.js/Express/FastAPI
   just because it's a common default).
2. **Don't fabricate architecture or history.** If you're tempted to
   describe "the existing pattern" for something, check first — there
   may not be one yet. `PROJECT.md` and `GAPS.md` as of this writing
   describe an empty repo on purpose; don't let later edits invent a
   fictional past for the project.
3. **When the first real code is added**, in the same change:
   - Add a `.gitignore` matching the chosen stack, before running any
     install/build command (see `GAPS.md` #5 — avoids committing
     `node_modules/`, build artifacts, or `.env` files).
   - Wire up a test runner and at least one real test, not a stub.
   - Establish the secrets/config pattern (`.env` + `.env.example`,
     values never hardcoded, never committed) if the code talks to any
     external API or service.
4. **After the first real feature lands**, replace this file's
   "Commands" section below with the actual verified commands, and
   revise `PROJECT.md`'s architecture section with what was actually
   built (not aspirational design).

## Commands

None exist yet. This section is a placeholder — fill in the real
build/test/lint/run/deploy commands as soon as they exist, and verify
each one actually works before writing it here (don't copy a guess from
a framework's default docs without confirming it runs in this repo).

## Conventions

None established yet — there is no code to derive conventions from.
Once code exists, this section should describe what the codebase
*actually does* (naming, file layout, error handling, state management),
not generic best-practice advice.

## Pointers

- `PROJECT.md` — what this project is (or isn't yet), architecture once
  it exists, and what's known vs. inferred about intent.
- `GAPS.md` — full list of what's missing to get this repo to a working
  first state, ordered by what blocks progress most.
