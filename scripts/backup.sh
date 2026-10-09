#!/usr/bin/env bash
# One-click backup: PostgreSQL dump + uploads volume + metadata
# Usage: ./scripts/backup.sh
# Env: BACKUP_DIR, COMPOSE_PROJECT_NAME, VOLUME_PGDATA, VOLUME_UPLOADS

# shellcheck source=common.sh
source "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_cmd docker
require_cmd tar
require_cmd date

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
NAME="yunmeng_backup_${TIMESTAMP}"
WORK="$BACKUP_DIR/$NAME"
mkdir -p "$WORK"

log "备份目录: $WORK"
log "项目名/卷前缀: $PROJECT_NAME"

# --- PostgreSQL dump ---
if compose_running "$DB_SERVICE"; then
  log "导出 PostgreSQL ($DB_SERVICE)..."
  if compose exec -T "$DB_SERVICE" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl \
    > "$WORK/database.sql"; then
    log "数据库 SQL 已写入 database.sql ($(wc -c < "$WORK/database.sql") bytes)"
  else
    die "pg_dump 失败"
  fi
else
  warn "数据库容器未运行，跳过 SQL 导出（仅备份 uploads 若存在）"
  echo "# no dump: db container not running at backup time" > "$WORK/database.sql"
fi

# --- Uploads volume ---
log "备份 uploads 卷 ($VOLUME_UPLOADS)..."
if docker volume inspect "$VOLUME_UPLOADS" >/dev/null 2>&1; then
  docker run --rm \
    -v "$VOLUME_UPLOADS":/data:ro \
    -v "$WORK":/backup \
    alpine:3.20 \
    tar czf /backup/uploads.tar.gz -C /data . \
    || warn "uploads 打包失败"
else
  warn "卷 $VOLUME_UPLOADS 不存在，写入空 uploads 包"
  # try alternate common names
  ALT="yunmeng-mall_uploads"
  if docker volume inspect "$ALT" >/dev/null 2>&1; then
    log "使用备用卷名: $ALT"
    docker run --rm -v "$ALT":/data:ro -v "$WORK":/backup alpine:3.20 \
      tar czf /backup/uploads.tar.gz -C /data . || true
  else
    tar czf "$WORK/uploads.tar.gz" -T /dev/null 2>/dev/null || \
      printf '' | gzip > "$WORK/uploads.tar.gz"
  fi
fi

# --- Metadata (no secrets) ---
{
  echo "timestamp=$TIMESTAMP"
  echo "hostname=$(hostname 2>/dev/null || echo unknown)"
  echo "project=$PROJECT_NAME"
  echo "db_user=$DB_USER"
  echo "db_name=$DB_NAME"
  echo "app_url=$APP_URL"
  echo "git=$(git rev-parse --short HEAD 2>/dev/null || echo n/a)"
} > "$WORK/meta.txt"

# Optional: copy .env.example only (never auto-copy real .env into shared backups by default)
if [ -f "$ROOT_DIR/.env.example" ]; then
  cp "$ROOT_DIR/.env.example" "$WORK/env.example"
fi

# --- Bundle ---
ARCHIVE="$BACKUP_DIR/${NAME}.tar.gz"
log "打包 $ARCHIVE ..."
tar czf "$ARCHIVE" -C "$BACKUP_DIR" "$NAME"
rm -rf "$WORK"

log "备份完成: $ARCHIVE"
ls -lh "$ARCHIVE"
echo ""
echo "迁移到新机器: 复制该文件后执行:"
echo "  ./scripts/restore.sh $ARCHIVE"
