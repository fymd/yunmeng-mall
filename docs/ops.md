# Operations — 云梦商城一键运维

面向云主机 Docker Compose 部署。

## 前置

- Docker + Docker Compose v2
- Git（可选，用于 `deploy.sh` 拉代码）
- 在仓库根目录执行脚本

```bash
cp .env.example .env
# 编辑 NEXTAUTH_SECRET / NEXTAUTH_URL
chmod +x scripts/*.sh
```

## 部署 / 更新

```bash
./scripts/deploy.sh
```

| 环境变量 | 说明 |
|----------|------|
| `SKIP_PULL=1` | 跳过 `git pull` |
| `SEED=1` | 部署后尝试 seed（开发用） |
| `APP_URL` | 健康检查地址，默认 `http://localhost:3000` |
| `RUN_SEED=1` | 写入 compose 环境，entrypoint 启动时 seed |

首次启动会 `prisma db push` 同步表结构。

## 备份

```bash
./scripts/backup.sh
```

生成 `backups/yunmeng_backup_YYYYMMDD_HHMMSS.tar.gz`，内含：

- `database.sql` — PostgreSQL 逻辑备份
- `uploads.tar.gz` — 上传文件卷
- `meta.txt` — 主机/git 元信息（无密钥）
- `env.example` — 环境变量模板

**不会**自动把真实 `.env` 打进包，避免密钥随备份扩散。

## 恢复 / 迁移

1. 新机器安装 Docker，clone 代码，配置 `.env`
2. 复制备份包到新机器
3. 执行：

```bash
./scripts/restore.sh ./backups/yunmeng_backup_XXXX.tar.gz
# 或非交互：
YES=1 ./scripts/restore.sh ./backups/yunmeng_backup_XXXX.tar.gz
```

4. `./scripts/deploy.sh` 或 `docker compose up -d --build`
5. 更新 DNS / `NEXTAUTH_URL`

仅恢复数据库：`SKIP_UPLOADS=1 YES=1 ./scripts/restore.sh <archive>`

## 卷名称

Compose 默认项目名为当前目录名。若备份找不到 uploads，可指定：

```bash
COMPOSE_PROJECT_NAME=yunmeng-mall VOLUME_UPLOADS=yunmeng-mall_uploads ./scripts/backup.sh
```

查看本机卷：`docker volume ls | grep -E 'pgdata|uploads'`
