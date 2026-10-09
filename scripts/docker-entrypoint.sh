#!/bin/sh
set -e

echo "[entrypoint] Waiting for database..."
if [ -n "$DATABASE_URL" ]; then
  i=1
  while [ "$i" -le 15 ]; do
    if npx prisma db push --skip-generate 2>/dev/null; then
      echo "[entrypoint] Database schema ready."
      break
    fi
    echo "[entrypoint] DB not ready, retry $i/15..."
    i=$((i + 1))
    sleep 2
  done

  if [ "${RUN_SEED:-0}" = "1" ]; then
    echo "[entrypoint] RUN_SEED=1 — attempting seed..."
    npx prisma db seed 2>/dev/null || echo "[entrypoint] seed skipped or failed"
  fi
fi

echo "[entrypoint] Starting app..."
exec "$@"
