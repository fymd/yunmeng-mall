#!/bin/sh
set -e

echo "[entrypoint] Waiting for database..."
if [ -n "$DATABASE_URL" ]; then
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if npx prisma db push --skip-generate 2>/dev/null; then
      echo "[entrypoint] Database ready."
      break
    fi
    echo "[entrypoint] DB not ready, retry $i..."
    sleep 2
  done
fi

echo "[entrypoint] Starting app..."
exec "$@"
