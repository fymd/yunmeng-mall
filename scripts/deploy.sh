#!/usr/bin/env bash
# One-click deploy / update on cloud host
# Usage:
#   ./scripts/deploy.sh
#   SEED=1 ./scripts/deploy.sh          # also run prisma seed inside app after up
#   SKIP_PULL=1 ./scripts/deploy.sh     # skip git pull
#   APP_URL=https://your.domain ./scripts/deploy.sh

# shellcheck source=common.sh
source "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_cmd docker

if [ ! -f "$COMPOSE_FILE" ]; then
  die "未找到 $COMPOSE_FILE，请在仓库根目录执行"
fi

if [ ! -f "$ROOT_DIR/.env" ] && [ -f "$ROOT_DIR/.env.example" ]; then
  warn "未找到 .env，建议: cp .env.example .env 并修改密钥"
fi

if [ "${SKIP_PULL:-0}" != "1" ]; then
  if [ -d "$ROOT_DIR/.git" ]; then
    log "拉取最新代码..."
    git pull --ff-only || warn "git pull 失败（可能有本地修改），继续构建"
  else
    warn "非 git 目录，跳过 pull"
  fi
fi

log "构建并启动容器..."
compose up -d --build

log "容器状态:"
compose ps

wait_for_health "$APP_URL/api/health" 40 || true

if [ "${SEED:-0}" = "1" ]; then
  log "执行数据库 seed（若容器内可用）..."
  compose exec -T "$APP_SERVICE" npx prisma db seed 2>/dev/null \
    || compose exec -T "$APP_SERVICE" node -e "console.log('seed skip')" \
    || warn "seed 未执行（生产镜像可能不含 tsx/seed）"
fi

log "部署完成"
echo "  健康检查: $APP_URL/api/health"
echo "  前台:     $APP_URL"
echo "  后台:     $APP_URL/admin"
echo "  备份:     ./scripts/backup.sh"
