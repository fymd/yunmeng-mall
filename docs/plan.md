# Implementation Plan — 云梦AI代充商城 / Yunmeng AI Top-up Mall

> Based on approved PRD: docs/prd.md  
> Updated: Docker + PostgreSQL (prod) + one-click backup/migrate/deploy  
> Status: **Confirmed — ready for development**

## 1. Summary

Build a full-stack digital goods mall (AI top-up style) with Next.js.  
**Production target**: Cloud host with Docker Compose (Next.js + PostgreSQL + Caddy/Nginx).  
Provide one-click scripts for backup, restore/migration, and deployment.  
Development uses SQLite for speed; production uses PostgreSQL.  
Payment starts with Mock Provider, fully configurable for later Alipay/WeChat switch.

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                 Cloud Host (Docker Compose)                    │
│  ┌─ Next.js App ── PostgreSQL ── Caddy/Nginx ── Volumes ─┐  │
│  │  (app)         (db)          (proxy)        (data/uploads)│  │
└───────────────────────────────────────────────────┘

Development: Next.js + Prisma + SQLite (single file)
Production : Docker Compose with PostgreSQL + persistent volumes
```

**Key design decisions**
- Payment abstract interface (Mock → Alipay/WeChat via config only)
- Admin under `/admin` with role guard
- All persistent data in Docker volumes (easy backup)
- One-click scripts: `scripts/backup.sh`, `scripts/restore.sh`, `scripts/deploy.sh`

## 3. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 15** (App Router) + TypeScript | Full-stack, great DX |
| UI | Tailwind CSS | Fast responsive UI |
| ORM | Prisma | Excellent migrations, SQLite ↔ Postgres switch |
| Database (dev) | SQLite | Zero-config local development |
| Database (prod) | **PostgreSQL** (Docker) | Reliable for production, easy backup |
| Auth | NextAuth.js or iron-session + bcrypt | Secure |
| Payment | Provider interface (Mock first) | Config-driven switch |
| Deployment | **Docker Compose** + Caddy/Nginx | One-click style on cloud host |
| Scripts | backup / restore / deploy shell scripts | True one-click operations |

## 4. Data Model (core)

- User (id, username/email, passwordHash, role: user|admin)
- Category (id, name, sort, enabled)
- Product (id, categoryId, name, description, price, stockStatus, tags, enabled, image?)
- Order (id, orderNo, userId, productId, amount, status, remark, timestamps)
- Config (key-value for site settings + payment credentials)

## 5. Task Breakdown (Vertical Slices)

### Milestone 1 — Foundation (T1–T5)
| ID | Task | DoD | Size | Depends |
|----|------|-----|------|--------|
| T1 | Project init: Next.js + TS + Tailwind + Prisma | `npm run dev` works | S | - |
| T2 | Schema + seed (User/Category/Product/Order/Config) + admin user | Seed creates sample data + admin | M | T1 |
| T3 | Basic responsive layout (header, sidebar, footer) | Homepage shell renders | S | T1 |
| T4 | Config service + Payment Provider interface (Mock implemented) | Config read/write + Mock pay success | M | T2 |
| T5 | Docker Compose skeleton (app + postgres + volume) + .env.example | `docker compose up` starts stack | M | T1 |

### Milestone 2 — Catalog (T6–T8)
| ID | Task | DoD | Size | Depends |
|----|------|-----|------|--------|
| T6 | Category API + sidebar filter | Click category filters list | M | T2, T3 |
| T7 | Product list + search + stock badge + buy button | Search/filter/badges work | M | T6 |
| T8 | Product detail modal/page | Full info + buy action ready | S | T7 |

### Milestone 3 — Auth & Order (T9–T12)
| ID | Task | DoD | Size | Depends |
|----|------|-----|------|--------|
| T9 | Register + Login + protected routes | Auth flow complete | M | T2 |
| T10 | Create order + Mock payment integration | Order created, status via Mock | M | T4, T8, T9 |
| T11 | Order query (by orderNo + my orders) | Query works for guest & user | M | T10 |
| T12 | Order status pages + success feedback | Clear status after pay | S | T11 |

### Milestone 4 — Admin / Config Center (T13–T17)
| ID | Task | DoD | Size | Depends |
|----|------|-----|------|--------|
| T13 | Admin layout + role guard | Only admin accesses /admin | S | T9 |
| T14 | Category CRUD | Full category management | M | T13 |
| T15 | Product CRUD + 上架/下架 | Full product publish management | M | T13 |
| T16 | Order list + status change + remark | Admin can process orders | M | T13 |
| T17 | Site + Payment config UI | Change site name, announcement, payment mode & keys | M | T4, T13 |

### Milestone 5 — Polish, Scripts & Ship (T18–T22)
| ID | Task | DoD | Size | Depends |
|----|------|-----|------|--------|
| T18 | Announcement from config | Banner/modal works | S | T17 |
| T19 | Core tests + error handling | Critical paths covered | M | T12, T17 |
| T20 | **One-click scripts**: backup.sh / restore.sh / deploy.sh | Scripts work on cloud host | M | T5 |
| T21 | README (run, Docker deploy, backup/migrate) + CI workflow | Clear docs for cloud host | M | T20 |
| T22 | Final review, seed polish, responsive check | Demo-ready | S | all |

## 6. One-click Operations (Target)

- **Backup**: `./scripts/backup.sh` → creates timestamped archive (db volume + uploads + config)
- **Restore / Migrate**: copy archive to new host → `./scripts/restore.sh` → update DNS
- **Deploy / Update**: `./scripts/deploy.sh` (pull + build + up)

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| SQLite in prod | Dev only; prod forced to PostgreSQL via Docker |
| Missing files in backup | All persistent data in named Docker volumes |
| Secret leakage | .env not in git; scripts handle env carefully |
| Complex manual deploy | Docker Compose + scripts make it near one-click |

## 8. Testing Strategy

- Unit: schemas, Mock payment, config
- Integration: catalog, order, admin APIs
- Manual: full user flow + admin flow + backup/restore test

## 9. Milestones

1. Foundation + Docker skeleton
2. Public catalog live
3. End-to-end order with mock pay
4. Admin fully usable (product publish + config)
5. One-click scripts + docs + ship ready

---

**Plan confirmed. Starting development from T1.**
