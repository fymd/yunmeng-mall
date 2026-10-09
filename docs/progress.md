# Development Progress — 云梦AI代充商城

## Current Status

**T18 Announcement from config**: ✅ DONE  
**Last Update**: 2026-10-10 03:55 JST

## Milestone 4 — Admin
- [x] T13–T17 complete

## Milestone 5 — Polish, Scripts & Ship
- [x] **T18 Announcement from config**
- [ ] T19 Core tests + error handling
- [ ] T20 One-click scripts (backup / restore / deploy)
- [ ] T21 README + CI
- [ ] T22 Final review

### T18 Features
- `Announcement` component: top banner + optional popup from public config
- Popup uses sessionStorage keyed by title+content hash (re-shows when admin updates text)
- `CustomerServiceFloat`: bottom-right FAB reads QQ / WeChat / link from config
- Footer uses `site_name` from config
- Wired in root `layout.tsx`

### How to verify
1. Admin → 站点配置 → 改公告标题/内容，开启「弹窗显示」
2. 前台刷新：顶部黄条 + 弹窗
3. 关闭弹窗后同会话不再弹出；改公告内容后会再次弹出

## Next: T19 Core tests + error handling

Repo: https://github.com/fymd/yunmeng-mall
