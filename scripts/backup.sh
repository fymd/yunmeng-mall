#!/bin/bash
# One-click backup for Yunmeng Mall (Docker volumes)
set -e
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NAME="yunmeng_backup_${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

echo "==> Backing up PostgreSQL..."
docker compose exec -T db pg_dump -U yunmeng yunmeng > "$BACKUP_DIR/${NAME}.sql" 2>/dev/null || \
  echo "Warning: could not dump DB (is docker compose running?)"

echo "==> Backing up uploads volume (if any)..."
docker run --rm -v yunmeng-mall_uploads:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine \
  tar czf "/backup/${NAME}_uploads.tar.gz" -C /data . 2>/dev/null || true

echo "==> Done. Files in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR/${NAME}"* 2>/dev/null || ls -lh "$BACKUP_DIR"
