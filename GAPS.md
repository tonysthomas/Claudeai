# GAPS.md

## Honest framing

This is not a list of bugs in existing code — there is no code. Instead,
this is an honest inventory of **everything a real project needs that is
currently missing**, ordered by what blocks progress most. Treat this as
a punch list for bootstrapping the repo, not a bug tracker. Delete items
from this list as they're actually resolved (don't just leave them
checked off in prose — remove them, so this file stays a true reflection
of what's missing).

---

### 1. No defined purpose or requirements (blocks everything)
- **What**: Nothing in the repo states what `claudeai` is supposed to do.
  The README is a placeholder (`# Claudeai` / `Claudeai repository`).
- **Where**: `README.md`.
- **Why it matters**: Every other decision (stack, architecture, tests,
  CI) depends on knowing the goal. Building anything before this is
  resolved risks throwaway work.
- **Suggested fix**: Before writing code, get an explicit statement of
  purpose from the repo owner and write it into `README.md` and
  `PROJECT.md`. This is a conversation, not a coding task — do not
  invent a purpose to unblock yourself.

### 2. No language/framework/stack chosen
- **What**: No dependency manifest of any kind exists (`package.json`,
  `pyproject.toml`, `requirements.txt`, `go.mod`, `Cargo.toml`, etc.).
- **Where**: repository root.
- **Why it matters**: Any code written without this decision being made
  explicitly risks being scaffolded around the wrong tool for the job,
  or around an agent's default preference rather than the user's.
- **Suggested fix**: Once purpose is known, propose 1-2 reasonable stack
  options to the user and get confirmation before scaffolding.

### 3. No test infrastructure
- **What**: No test runner, no test directory, no test files.
- **Where**: N/A (doesn't exist).
- **Why it matters**: There is currently 0% coverage of 0% of a system —
  trivially true, but it means the *first* commit of real logic should
  come with a test harness already wired up, not bolted on later.
- **Suggested fix**: When the stack is chosen, set up the standard test
  runner for that ecosystem (e.g. `pytest`, `vitest`/`jest`, `go test`)
  as part of the same PR that adds the first real module, not deferred.

### 4. No CI/CD
- **What**: No `.github/workflows/`, no other CI configuration.
- **Where**: N/A.
- **Why it matters**: Without CI, broken code can land on `main`
  undetected, and there's no automated gate for the PR-babysitting
  workflow this environment supports.
- **Suggested fix**: Add a minimal GitHub Actions workflow that installs
  dependencies and runs lint + tests on every push/PR, once there's a
  stack and at least a trivial test to run.

### 5. No `.gitignore`
- **What**: No `.gitignore` file.
- **Where**: repository root.
- **Why it matters**: Without one, the first `npm install` / `pip
  install` / build step risks committing `node_modules/`, `__pycache__/`,
  build artifacts, or local env files (`.env`) straight into git history.
  This is a real risk given secrets handling should be a day-one concern.
- **Suggested fix**: Add a `.gitignore` matching the chosen stack (e.g.
  GitHub's standard template for the language) *before* running the
  first install/build command in this repo.

### 6. No license
- **What**: No `LICENSE` file.
- **Where**: repository root.
- **Why it matters**: If this project is ever meant to be shared, forked,
  or open-sourced, an unlicensed repo defaults to "all rights reserved,"
  which may not match intent.
- **Suggested fix**: Low priority unless/until the project has external
  users — ask the user whether this is a private/personal tool or
  something intended for wider release, and add a license accordingly.

### 7. No secrets/config handling convention established
- **What**: No `.env.example`, no config module, no documented approach
  to secrets (API keys, tokens) at all — because no code exists yet to
  need them.
- **Where**: N/A.
- **Why it matters**: Given the likely Claude/Anthropic-API-adjacent
  nature suggested by the repo name, the first real code written here
  will probably need an API key almost immediately. Getting the pattern
  right from commit #1 (env vars + `.gitignore`'d `.env`, never hardcoded
  keys, never committed) avoids a painful history-scrub later.
- **Suggested fix**: When scaffolding the first real module, establish
  the secrets pattern (e.g. `.env` + `.env.example` + a documented list
  of required variables) in the same change, before any code that
  actually calls an external API.

### 8. `CLAUDE.md` had no prior content to preserve
- **What**: There was no existing `CLAUDE.md` before this session.
- **Where**: repository root (now created).
- **Why it matters**: Not a gap in itself, but flagged here so future
  sessions know the operational file was created from scratch on
  2026-07-08 and should be revised as real conventions emerge — its
  current content is necessarily generic/bootstrapping guidance rather
  than codebase-derived convention.
- **Suggested fix**: Revisit `CLAUDE.md` after the first real feature
  lands and replace the placeholder guidance with actual observed
  conventions (build commands, file layout, error handling patterns).
