#!/usr/bin/env bash
# Restore from a backup archive produced by backup.sh
# Usage:
#   ./scripts/restore.sh ./backups/yunmeng_backup_YYYYMMDD_HHMMSS.tar.gz
# Optional:
#   SKIP_UPLOADS=1 ./scripts/restore.sh <archive>   # only restore DB
#   YES=1 ./scripts/restore.sh <archive>            # non-interactive

# shellcheck source=common.sh
source "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_cmd docker
require_cmd tar

ARCHIVE="${1:-}"
if [ -z "$ARCHIVE" ]; then
  echo "Usage: $0 <backup.tar.gz>"
  echo "Example: $0 ./backups/yunmeng_backup_20261010_120000.tar.gz"
  exit 1
fi

if [ ! -f "$ARCHIVE" ]; then
  die "备份文件不存在: $ARCHIVE"
fi

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

log "解压 $ARCHIVE ..."
tar xzf "$ARCHIVE" -C "$TMP"
# Support both: archive root is yunmeng_backup_* dir, or files at top
SRC="$(find "$TMP" -maxdepth 2 -type d -name 'yunmeng_backup_*' | head -1)"
if [ -z "$SRC" ]; then
  SRC="$TMP"
fi

if [ ! -f "$SRC/database.sql" ]; then
  die "归档中缺少 database.sql"
fi

if [ "${YES:-0}" != "1" ]; then
  echo "即将恢复数据库到容器服务 '$DB_SERVICE'（会覆盖现有数据）。"
  echo "备份: $ARCHIVE"
  read -r -p "确认继续? [y/N] " ans
  case "$ans" in
    y|Y|yes|YES) ;;
    *) die "已取消" ;;
  esac
fi

# Ensure stack is up enough for DB
log "确保数据库服务运行..."
compose up -d "$DB_SERVICE"

# Wait for postgres ready
for i in $(seq 1 30); do
  if compose exec -T "$DB_SERVICE" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! compose exec -T "$DB_SERVICE" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
  die "数据库未就绪"
fi

log "恢复 PostgreSQL..."
# Drop connections and recreate schema-friendly restore
compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
SQL

compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" < "$SRC/database.sql" \
  || die "导入 SQL 失败"

log "数据库恢复完成"

if [ "${SKIP_UPLOADS:-0}" != "1" ] && [ -f "$SRC/uploads.tar.gz" ]; then
  log "恢复 uploads 卷 ($VOLUME_UPLOADS)..."
  # Create volume if missing
  docker volume create "$VOLUME_UPLOADS" >/dev/null 2>&1 || true
  docker run --rm \
    -v "$VOLUME_UPLOADS":/data \
    -v "$SRC":/backup:ro \
    alpine:3.20 \
    sh -c 'rm -rf /data/* /data/.[!.]* 2>/dev/null; tar xzf /backup/uploads.tar.gz -C /data' \
    || warn "uploads 恢复失败"
else
  log "跳过 uploads 恢复"
fi

if [ -f "$SRC/meta.txt" ]; then
  log "备份元信息:"
  cat "$SRC/meta.txt"
fi

log "可选: 重启应用容器"
compose up -d "$APP_SERVICE" 2>/dev/null || true
wait_for_health || true

log "恢复完成。请确认 NEXTAUTH_URL / DNS 指向新主机。"
