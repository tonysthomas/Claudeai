#!/usr/bin/env bash
# =============================================================================
# Validate the Skechers Sales Assistant database schema, seed, and constraints
# against a LOCAL Postgres/Supabase database. Never point this at production.
#
# Usage:
#   DATABASE_URL=postgresql://user:pass@host:port/db ./scripts/db-validate.sh
# Defaults to the local `supabase start` database (127.0.0.1:54322).
#
# Applies the migration, loads the seed, then runs database/tests/validation.sql
# with ON_ERROR_STOP so any failed assertion exits non-zero.
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
PSQL=(psql "$DB_URL" -v ON_ERROR_STOP=1 -X -q)

echo "==> applying migration"
"${PSQL[@]}" -f "$HERE/supabase/migrations/20260806120000_create_core_schema.sql"

echo "==> loading seed"
"${PSQL[@]}" -f "$HERE/supabase/seed.sql"

echo "==> running validation tests"
"${PSQL[@]}" -f "$HERE/database/tests/validation.sql"

echo "==> OK: all validations passed"
