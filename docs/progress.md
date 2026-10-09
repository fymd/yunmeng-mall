# Development Progress — 云梦AI代充商城

## Current Status

**T17 Site + Payment config**: ✅ DONE  
**Last Update**: 2026-10-10 03:50 JST

## Milestone 4 — Admin
- [x] T13 Admin layout
- [x] T14 Category CRUD
- [x] T15 Product CRUD + publish
- [x] T16 Order management
- [x] **T17 Site config**

### T17 Features
- GET /api/config — public keys only
- GET /api/config?all=1 — full config (admin)
- POST /api/config — admin batch/single update; sensitive keys masked; skip unchanged ********
- Admin UI: site name/logo, customer service, announcement, system flags, payment mode + Alipay/WeChat credential fields
- Header reads site_name from public config

### Access
/admin/config (login as admin)

## Milestone 4 complete

## Next: Milestone 5 — T18 Announcement from config (frontend banner/modal)

Repo: https://github.com/fymd/yunmeng-mall
