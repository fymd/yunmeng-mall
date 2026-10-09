# Development Progress — 云梦AI代充商城

## Current Status

**T14 Category CRUD**: ✅ DONE  
**Last Update**: 2026-10-09 22:50 JST

## Milestone 4 — Admin
- [x] T13 Admin layout + guard
- [x] **T14 Category CRUD**
- [ ] T15 Product CRUD
- [ ] T16 Order management
- [ ] T17 Site config

### T14 Features
- GET /api/categories?all=1 (admin, includes disabled)
- POST / PATCH / DELETE (admin only)
- Admin UI: list, create, edit, enable/disable, delete (blocked if has products)
- Sort field supported

### Access
Login as admin → /admin/categories

## Next: T15 Product CRUD

Repo: https://github.com/fymd/yunmeng-mall
