#!/bin/sh
set -eu
cd /app/apps/api
bunx prisma migrate deploy
# Demo data (shared demo password) only when asked for. Idempotent: fills missing rows by unique name/code.
if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  bun prisma/seed/index.ts
fi
# First super admin for a fresh production database; skipped once one exists.
if [ -n "${BOOTSTRAP_ADMIN_EMAIL:-}" ]; then
  bun prisma/seed/bootstrap-admin.ts
fi
exec bun dist/main.js
