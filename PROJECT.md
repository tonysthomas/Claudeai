# PROJECT.md

## What this is, honestly

As of 2026-07-08, `tonysthomas/claudeai` is an **empty greenfield repository**.
The entire contents of the `main` branch are:

```
README.md
```

and the README contains only:

```
# Claudeai
Claudeai repository
```

There is no application code, no configuration, no dependency manifest
(no `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, etc.), no
tests, no CI, and no directory structure beyond `.git` and the README.
`git log --all` shows a single commit ("Initial commit"). Nothing has been
built yet.

**This document intentionally does not describe a tech stack,
architecture, or design decisions, because none exist in the repository.**
Any future version of this file that claims otherwise should be describing
work that has actually landed in the repo — verify against the code, don't
carry old prose forward by inertia.

## What can and can't be inferred

- **Repo name**: `claudeai`. This is a naming signal only — it suggests
  the project is *related to* Claude/Anthropic in some way (an app built
  with the Claude API, a Claude Code extension, a personal tool, etc.),
  but there is nothing in the repo confirming what it will actually do.
  Do not assume a purpose from the name alone.
- **Owner**: `tonysthomas` (GitHub), user email `tonysthomas@gmail.com`.
  This looks like a personal/individual project repo, not an
  organization's product repo, based on the single-owner structure and
  placeholder README — but that's an inference, not a fact stated
  anywhere in the repo.
- **No stack, framework, language, or runtime has been chosen** in the
  repo itself. Don't guess one and start scaffolding around it without
  confirming with the user first.

## What a new engineer (human or AI) should do here

Since there is no existing system to learn, the "onboarding" task for
this repo is different from a normal onboarding: instead of learning
an architecture, the job is to **help make the first real decisions**.
Before writing any code:

1. **Confirm the actual goal.** Ask the user what `claudeai` is meant to
   be — a web app, a CLI, an API service, a library, a Claude Code
   plugin/skill, an experiment. Do not infer this from the repo name.
2. **Confirm the stack** (language, framework, package manager, hosting/
   deploy target) once the goal is known. Pick boring, well-supported
   defaults unless the user has a preference.
3. **Set up the skeleton deliberately**: dependency manifest, a minimal
   entry point, a test runner, a linter/formatter, a `.gitignore`, and a
   CI workflow (e.g. GitHub Actions) that runs tests/lint on push. These
   don't exist yet and someone has to choose them, not assume them.
4. **Update this file (PROJECT.md)** once real architecture exists, with
   an actual component diagram, data flow, and the reasoning behind the
   choices made — the kind of content this document *should* eventually
   contain but can't yet.

## Critical paths / load-bearing code

None. There is no code, so there is nothing yet that is risky to change
or safe to change casually. This section should be filled in as soon as
the first non-trivial module exists, identifying which pieces (auth,
data persistence, payment/billing, public API contracts, etc.) carry the
most risk if broken.

## Non-obvious things that would trip someone up

- The repo *looks* like it might already contain something (it has a
  real GitHub remote, a real branch, real commit history) but it does
  not. Don't assume `git log`/`git blame` will explain "why" something
  is the way it is — there is no "why" yet to discover.
- The current feature branch (`claude/codebase-knowledge-transfer-*`) and
  `main` point at the same single commit. There is no divergent history
  to reconcile.
