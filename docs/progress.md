# Development Progress — 云梦AI代充商城

## Current Status

**T16 Order management**: ✅ DONE  
**Last Update**: 2026-10-10 03:40 JST

## Milestone 4 — Admin
- [x] T13 Admin layout
- [x] T14 Category CRUD
- [x] T15 Product CRUD + publish
- [x] **T16 Order management**
- [ ] T17 Site config

### T16 Features
- GET /api/orders?all=1 — admin list with status / keyword filter + pagination
- PATCH /api/orders — admin update status & remark (sets paidAt when → PAID)
- Admin UI: order table, status dropdown, quick 发货/完成, remark editor, search

### Access
/admin/orders (login as admin)

## Next: T17 Site + Payment config UI

Repo: https://github.com/fymd/yunmeng-mall
