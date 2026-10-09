# Development Progress — 云梦AI代充商城

## Current Status

**T20 One-click scripts**: ✅ DONE  
**Last Update**: 2026-10-10 04:05 JST

## Milestone 5 — Polish, Scripts & Ship
- [x] T18 Announcement from config
- [x] T19 Core tests + error handling
- [x] **T20 One-click scripts**
- [ ] T21 README + CI
- [ ] T22 Final review

### T20 Features
- `scripts/common.sh` — compose helpers, health wait, volume names
- `scripts/backup.sh` — pg_dump + uploads tar + meta → timestamped `.tar.gz`
- `scripts/restore.sh` — restore DB (recreate) + uploads; `YES=1` / `SKIP_UPLOADS=1`
- `scripts/deploy.sh` — git pull, compose up --build, health retry
- `docker-compose.yml` — healthcheck, ports via env, optional RUN_SEED
- `docs/ops.md` — operator guide

### Usage
```bash
chmod +x scripts/*.sh
./scripts/deploy.sh
./scripts/backup.sh
YES=1 ./scripts/restore.sh ./backups/yunmeng_backup_*.tar.gz
```

## Next: T21 README (run, Docker deploy, backup/migrate) + CI workflow

Repo: https://github.com/fymd/yunmeng-mall
