# Implementation Plan — 云梦AI代充商城 / Yunmeng AI Top-up Mall

> Based on approved PRD: docs/prd.md  
> Status: Ready for confirmation

## 1. Summary

Build a full-stack digital goods mall (AI top-up style) with Next.js. Deliver in vertical slices: foundation → catalog → auth & order → admin/config center → polish & ship. Use mock payment with clean abstraction for later real payment. SQLite for easy start (switchable to Postgres).

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                    Browser (React / Next.js)                 │
│  ┌─ Catalog ── Auth ── Order ── Admin/Config Center ─┐  │
└──│─────────────────────────────────────────────│──┘
   │                    API Routes / Server Actions              │
   │  (Next.js App Router)                                      │
   └───────────────────────────────────────────────────┘
                    │
          ┌────────┼────────┐
          │ Payment Provider (abstract) │
          │  Mock | Alipay | Wechat     │
          └──────────────────────┘
                    │
          ┌──────────────────────┐
          │ Prisma + SQLite (dev)     │
          │ (Postgres ready)          │
          └──────────────────────┘
```

**Key design decisions**
- Payment abstract interface so switching from Mock → Alipay/Wechat only needs config change.
- Admin is a protected route group under `/admin`.
- All sensitive keys stored in env or encrypted config; never exposed to client.

## 3. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 15** (App Router) | Full-stack, excellent DX, easy deploy |
| Language | TypeScript | Type safety |
| UI | Tailwind CSS + shadcn/ui (optional) | Fast, modern, responsive |
| Database | Prisma + SQLite (dev) / Postgres (prod) | Simple schema, easy migration |
| Auth | NextAuth.js or simple JWT + bcrypt | Secure session |
| Payment | Custom Provider interface (Mock first) | Extensible |
| Validation | Zod | Shared frontend/backend schemas |
| Testing | Vitest + Playwright (later) | Unit + e2e |

## 4. Data Model (core entities)

- User (id, username/email, passwordHash, role: user|admin, createdAt)
- Category (id, name, sort, enabled)
- Product (id, categoryId, name, description, price, stockStatus, tags, enabled, createdAt)
- Order (id, orderNo, userId, productId, amount, status, remark, createdAt, paidAt)
- Config (key-value store for site name, announcement, payment mode, payment credentials, etc.)
- Announcement (optional separate table or stored in Config)

## 5. Task Breakdown (Vertical Slices)

### Milestone 1 — Foundation (T1–T4)
| ID | Task | DoD | Size | Depends |
|----|------|-----|------|--------|
| T1 | Project init: Next.js + TypeScript + Tailwind + Prisma + SQLite | `npm run dev` works, Prisma client generated | S | - |
| T2 | Core schema + seed (User, Category, Product, Order, Config) | Seed script creates admin + sample categories/products | M | T1 |
| T3 | Basic layout + responsive shell (header, sidebar placeholder, footer) | Homepage renders with nav | S | T1 |
| T4 | Config service (read/write key-value) + payment Provider interface (Mock implemented) | Can read/write config; MockPayment returns success | M | T2 |

### Milestone 2 — Catalog (T5–T7)
| ID | Task | DoD | Size | Depends |
|----|------|-----|------|--------|
| T5 | Category list API + sidebar UI | Click category filters products | M | T2, T3 |
| T6 | Product list + search + stock badge + buy button (UI only) | Search & filter work, badges show correctly | M | T5 |
| T7 | Product detail modal/page | Shows full info, buy button ready | S | T6 |

### Milestone 3 — Auth & Order (T8–T11)
| ID | Task | DoD | Size | Depends |
|----|------|-----|------|--------|
| T8 | Register + Login (JWT/session) + protected routes | Can register, login, logout; middleware protects | M | T2 |
| T9 | Create order flow (login required) + Mock payment | Order created with unique orderNo, status updated via Mock | M | T4, T7, T8 |
| T10 | Order query page (by orderNo + my orders) | Can query by number and see own orders | M | T9 |
| T11 | Order status display + basic success page | Clear status shown after payment | S | T10 |

### Milestone 4 — Admin / Config Center (T12–T16)
| ID | Task | DoD | Size | Depends |
|----|------|-----|------|--------|
| T12 | Admin layout + auth guard (role=admin) | Only admin can access /admin | S | T8 |
| T13 | Category CRUD in admin | Create/edit/sort/enable categories | M | T12 |
| T14 | Product CRUD + 上架/下架 in admin | Full product management works | M | T12 |
| T15 | Order list + status change + remark in admin | Admin can process orders | M | T12 |
| T16 | Site config + Payment config UI (mode, keys placeholders) | Can change site name, announcement, payment mode | M | T4, T12 |

### Milestone 5 — Polish & Ship (T17–T20)
| ID | Task | DoD | Size | Depends |
|----|------|-----|------|--------|
| T17 | Announcement banner/modal from config | Shows on homepage according to config | S | T16 |
| T18 | Basic tests (API + critical flows) + error handling | Core paths covered, no crash on bad input | M | T11, T16 |
| T19 | README + env example + Docker (optional) + CI workflow | Clear run instructions, GitHub Actions basic CI | M | - |
| T20 | Final review, seed polish, responsive check | Ready for demo / deploy | S | all |

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Payment switch complexity | Abstract Provider from day 1 + config-driven |
| Admin scope creep | Strictly limit to listed CRUD + config; no fancy charts in MVP |
| SQLite concurrency | Fine for MVP; document how to switch to Postgres |
| Auth security | Use proven library (NextAuth or iron-session + bcrypt), never roll own crypto |

## 7. Testing Strategy

- Unit: Zod schemas, payment Mock, config service
- Integration: API routes for catalog, order creation, admin CRUD
- Manual / later e2e: full browse → login → buy → query flow
- Admin flows verified manually in Milestone 4

## 8. Milestones Checkpoint

1. **Foundation ready** → can run and seed
2. **Catalog live** → public can browse & search
3. **Order flow complete** → end-to-end purchase with mock pay
4. **Admin usable** → operator can manage products & orders
5. **Ship ready** → docs, CI, clean code

---

**Next step after plan confirmation**: Start coding from T1 (Foundation) following `sdlc-build`.

Please confirm this plan (or request adjustments to priority / stack / scope).
