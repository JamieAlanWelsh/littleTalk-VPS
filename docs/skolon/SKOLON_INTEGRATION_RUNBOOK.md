# Skolon Integration Runbook

Last updated: 2026-06-10

## 1) Current live setup summary

The current Skolon integration is live and working for:
- School provisioning from license data
- Teacher launch from Skolon app tile (SSO)
- Local user auto-provisioning for eligible users

Important behavior:
- Incremental sync handles new/changed data quickly
- License revocation is guaranteed by nightly full refresh

## 2) Integration code locations

- `littleTalkApp/integrations/skolon_client.py`
  - OAuth token handling and Skolon API client requests
- `littleTalkApp/integrations/skolon_sync.py`
  - Sync logic for schools, licenses, users, groups
- `littleTalkApp/views_modules/skolon.py`
  - SSO launch/callback and webhook endpoints
- `littleTalkApp/management/commands/skolon_sync.py`
  - CLI command used by timers

Main command:
- `python manage.py skolon_sync`
- `python manage.py skolon_sync --full-refresh`

## 3) Server environment details (VPS)

Host stack:
- Ubuntu VPS
- gunicorn + nginx

Project paths:
- Project dir: `/home/admin/littleTalk`
- Python venv: `/home/admin/littleTalk/littletalkvenv/bin/python`
- Environment file: `/etc/littleTalk/littleTalk.env`

Service logs:
- gunicorn app logs: `sudo journalctl -u gunicorn.service`
- incremental sync logs: `sudo journalctl -u skolon-sync.service`
- full refresh logs: `sudo journalctl -u skolon-full-refresh.service`

## 4) systemd timer setup

### 4.1 Incremental sync (every 5 minutes)

Unit files:
- `/etc/systemd/system/skolon-sync.service`
- `/etc/systemd/system/skolon-sync.timer`

Service runs:
- `python manage.py skolon_sync`

Purpose:
- Fast onboarding and frequent updates

### 4.2 Full refresh sync (nightly)

Unit files:
- `/etc/systemd/system/skolon-full-refresh.service`
- `/etc/systemd/system/skolon-full-refresh.timer`

Service runs:
- `python manage.py skolon_sync --full-refresh`

Purpose:
- Authoritative reconciliation
- Guarantees license revocation cleanup

Current schedule:
- Nightly at `02:10 UTC`

## 5) How to inspect current timer status

List scheduled timers:
- `systemctl list-timers | grep skolon`

Check timer status:
- `systemctl status skolon-sync.timer`
- `systemctl status skolon-full-refresh.timer`

Check last service run:
- `systemctl status skolon-sync.service`
- `systemctl status skolon-full-refresh.service`

Notes:
- `Type=oneshot` services normally show `inactive (dead)` after success
- Success is confirmed by `status=0/SUCCESS`

## 6) How to edit and adjust timers

### 6.1 Edit incremental frequency

Edit timer file:
- `sudo nano /etc/systemd/system/skolon-sync.timer`

Adjust, for example:
- `OnUnitActiveSec=5min` (change to 2min, 10min, etc.)

Apply changes:
1. `sudo systemctl daemon-reload`
2. `sudo systemctl restart skolon-sync.timer`
3. `systemctl list-timers | grep skolon-sync`

### 6.2 Edit nightly full-refresh time

Edit timer file:
- `sudo nano /etc/systemd/system/skolon-full-refresh.timer`

Recommended calendar format:
- `OnCalendar=02:10`
  - equivalent to daily at 02:10 local system time

Apply changes:
1. `sudo systemd-analyze verify /etc/systemd/system/skolon-full-refresh.timer`
2. `sudo systemctl daemon-reload`
3. `sudo systemctl restart skolon-full-refresh.timer`
4. `systemctl list-timers | grep skolon-full-refresh`

## 7) Manual run commands (for diagnostics)

Run incremental now:
- `python manage.py skolon_sync`

Run full refresh now:
- `python manage.py skolon_sync --full-refresh`

Force reset cursors and full sync:
- `python manage.py skolon_sync --full-refresh`

## 8) Known behaviors and gotchas

1. Incremental revocation gap
- Incremental sync updates only schools seen in current license deltas
- If removal is not present in delta payload, school can remain licensed until full refresh
- Nightly full refresh solves this operationally

2. Common systemd timer typo
- If calendar is malformed (example: `--* 02:10:00`), timer fails with:
  - `Failed to parse calendar specification`
  - `Timer unit lacks value setting`
- Fix by using:
  - `OnCalendar=02:10`

3. Common service exec error
- `status=203/EXEC` means bad executable path in `ExecStart`
- Confirm with:
  - `which python`
  - check absolute venv path in service file

## 9) UAT checklist before release notifications

1. Assign school-wide license in Skolon admin
2. Confirm school appears and is licensed after incremental timer window
3. Launch from Skolon tile as teacher and verify auto-login
4. Remove license and verify revocation after nightly full refresh
5. Re-assign and verify reactivation path

## 10) Security and operational follow-ups

1. Rotate all exposed secrets immediately if shared outside secure channels
2. Keep env values in `/etc/littleTalk/littleTalk.env` only
3. Add webhook request verification (shared secret/signature) for Skolon webhook endpoints
4. Coordinate with Skolon to fix non-firing data-edits webhook for true real-time behavior
