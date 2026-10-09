# 云梦AI代充商城 / Yunmeng AI Top-up Mall

自托管的 AI 数字商品（代充）商城，参考 [yunmeng.fit](https://yunmeng.fit/) 的核心体验：分类浏览、库存状态、下单与订单查询、可配置管理后台。

**技术栈**：Next.js 15 · TypeScript · Tailwind · Prisma · SQLite（开发）/ PostgreSQL（生产）· Docker Compose

进度与设计文档：[docs/progress.md](docs/progress.md) · [docs/prd.md](docs/prd.md) · [docs/plan.md](docs/plan.md) · [docs/ops.md](docs/ops.md)

---

## 功能概览

| 前台 | 后台（管理员） |
|------|----------------|
| 分类筛选 + 关键词搜索 | 分类 / 商品 CRUD、上下架 |
| 商品详情、模拟支付下单 | 订单列表、改状态、备注 |
| 注册登录、订单号查询 | 站点名、公告、支付模式与密钥 |
| 公告横幅 / 弹窗、客服浮窗 | 角色守卫 `/admin` |

默认管理员（seed 后）：`admin` / `admin123`  
演示用户：`demo` / `user123`

---

## 本地开发

**要求**：Node.js 20+、npm

```bash
git clone https://github.com/fymd/yunmeng-mall.git
cd yunmeng-mall
cp .env.example .env
npm install

# 初始化 SQLite 并写入示例数据
npx prisma generate
npx prisma db push
npm run db:seed

npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` / `npm start` | 生产构建与启动 |
| `npm test` | 单元测试（Vitest） |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | 重置库并重新 seed |

开发默认 `DATABASE_URL="file:./dev.db"`（见 `.env.example`）。

---

## Docker 生产部署（云主机）

**要求**：Docker + Compose v2

```bash
cp .env.example .env
# 务必修改 NEXTAUTH_SECRET，并将 NEXTAUTH_URL 设为公网地址

chmod +x scripts/*.sh
./scripts/deploy.sh
```

等价于：`docker compose up -d --build`。

- 应用：`http://<主机>:3000`（可用 `APP_PORT` 改端口）
- 健康检查：`GET /api/health`
- 镜像构建时会将 Prisma provider 切换为 **PostgreSQL**，入口脚本执行 `prisma db push`

更完整的运维说明见 **[docs/ops.md](docs/ops.md)**。

### 环境变量要点

| 变量 | 说明 |
|------|------|
| `NEXTAUTH_SECRET` | Session 签名密钥，生产必须更换 |
| `NEXTAUTH_URL` | 站点对外 URL |
| `PAYMENT_MODE` | `mock`（默认）/ 预留 `alipay` · `wechat` |
| `POSTGRES_PASSWORD` | Compose 中数据库密码 |
| `RUN_SEED=1` | 容器启动时尝试 seed（慎用生产） |

---

## 备份 / 恢复 / 迁移

```bash
# 备份 → backups/yunmeng_backup_*.tar.gz（库 + uploads，不含真实 .env）
./scripts/backup.sh

# 恢复（会覆盖目标库）
YES=1 ./scripts/restore.sh ./backups/yunmeng_backup_YYYYMMDD_HHMMSS.tar.gz

# 仅恢复数据库
SKIP_UPLOADS=1 YES=1 ./scripts/restore.sh ./backups/yunmeng_backup_....tar.gz
```

迁移到新机器：复制归档与代码 → 配置 `.env` → `restore.sh` → `deploy.sh` → 更新 DNS / `NEXTAUTH_URL`。

---

## 项目结构（简）

```
src/app/           # App Router 页面与 API
src/components/    # 布局、公告、商品弹窗等
src/lib/           # auth / config / payment / prisma
prisma/            # schema + seed
scripts/           # backup / restore / deploy
docs/              # PRD、计划、进度、运维
```

---

## CI

GitHub Actions（`.github/workflows/ci.yml`）在 `push` / `pull_request` 到 `main` 时运行：

1. **Test** — `npm test`
2. **Lint** — `npm run lint`
3. **Build** — `prisma generate` + `npm run build`（SQLite `DATABASE_URL`）

---

## License

MIT
