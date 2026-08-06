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

echo "==> applying migrations (in order)"
for m in "$HERE"/supabase/migrations/*_*.sql; do
  echo "    - $(basename "$m")"
  "${PSQL[@]}" -f "$m"
done

echo "==> loading seed"
"${PSQL[@]}" -f "$HERE/supabase/seed.sql"

echo "==> running core validation tests"
"${PSQL[@]}" -f "$HERE/database/tests/validation.sql"

echo "==> running catalogue-import validation tests"
"${PSQL[@]}" -f "$HERE/database/tests/import_validation.sql"

echo "==> running recommendation validation tests"
"${PSQL[@]}" -f "$HERE/database/tests/recommendation_validation.sql"

echo "==> OK: all validations passed"
