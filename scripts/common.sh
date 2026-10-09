#!/usr/bin/env bash
# Shared helpers for Yunmeng Mall ops scripts
# shellcheck disable=SC2034

set -euo pipefail

# Resolve repo root (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
APP_URL="${APP_URL:-http://localhost:3000}"
DB_USER="${DB_USER:-yunmeng}"
DB_NAME="${DB_NAME:-yunmeng}"
DB_SERVICE="${DB_SERVICE:-db}"
APP_SERVICE="${APP_SERVICE:-app}"

# Docker Compose project name → volume prefix (default: directory name)
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-$(basename "$ROOT_DIR" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')}"
# Common volume names: <project>_pgdata, <project>_uploads
VOLUME_PGDATA="${VOLUME_PGDATA:-${PROJECT_NAME}_pgdata}"
VOLUME_UPLOADS="${VOLUME_UPLOADS:-${PROJECT_NAME}_uploads}"

log() { echo "==> $*"; }
warn() { echo "WARNING: $*" >&2; }
die() { echo "ERROR: $*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "需要命令: $1"
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" "$@"
  else
    die "未找到 docker compose 或 docker-compose"
  fi
}

compose_running() {
  compose ps --status running -q "$1" 2>/dev/null | grep -q .
}

wait_for_health() {
  local url="${1:-$APP_URL/api/health}"
  local retries="${2:-30}"
  local i=1
  log "等待健康检查: $url"
  while [ "$i" -le "$retries" ]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      log "健康检查通过"
      return 0
    fi
    sleep 2
    i=$((i + 1))
  done
  warn "健康检查超时（应用可能仍在启动）"
  return 1
}
