# Skolon Integration Setup (Simple Guide)

This is the plain-English guide for how our Skolon integration works.

## What this integration does

When a school uses Skolon, this integration lets teachers launch our app from Skolon and log in automatically.

It also keeps school, license, and user data updated in our database.

## Big picture flow

1. Skolon sends us updates through webhooks.
2. Our sync jobs pull the latest data from Skolon APIs.
3. We store schools, licenses, and teacher user mappings in our database.
4. A teacher clicks our app tile in Skolon.
5. Skolon redirects the teacher to our callback URL.
6. We verify who they are, find or create their local account, and log them in.

## Webhooks we use

These are inbound endpoints in our app (Skolon calls these URLs):

1. POST /webhooks/skolon/
Purpose: Data edits notification (for changed users, schools, licenses, groups).
Code: littleTalkApp/views_modules/skolon.py (skolon_webhook)

2. POST /webhooks/skolon/remove-user/
Purpose: GDPR remove-user request.
Code: littleTalkApp/views_modules/skolon.py (skolon_remove_user)

3. POST /webhooks/skolon/remove-class/
Purpose: GDPR remove-class request.
Code: littleTalkApp/views_modules/skolon.py (skolon_remove_class)

Notes:
- These endpoints are csrf_exempt because Skolon servers call them directly.
- Current implementation acknowledges quickly and performs sync logic server-side.

## SSO endpoints we use

1. GET /sso/launch/
Purpose: Start login flow by redirecting browser to Skolon IdP.

2. GET /sso/callback/
Purpose: Receive auth code from Skolon, exchange for token, identify user session, and log in/provision user.

Code: littleTalkApp/views_modules/skolon.py

## Services we created (server jobs)

These systemd units keep data current in production:

1. Incremental sync service
- Service: skolon-sync.service
- Timer: skolon-sync.timer
- Run frequency: every 5 minutes
- Command: python manage.py skolon_sync
- Why: picks up recent changes quickly

2. Full refresh service
- Service: skolon-full-refresh.service
- Timer: skolon-full-refresh.timer
- Run frequency: nightly (02:10)
- Command: python manage.py skolon_sync --full-refresh
- Why: authoritative cleanup and reconciliation (especially license state)

## Skolon API endpoints we call

Base URL depends on environment:
- Test: https://api-test.skolon.com
- Production: https://api.skolon.com

OAuth/token endpoint:
- POST /oauth/access_token (via SKOLON_TOKEN_URL)

Partner endpoints used by our integration:
1. GET /v2/partner/user/session
Used during SSO callback to identify the logged-in Skolon user.

2. GET /v2/partner/user
Used for roster sync of users.

3. GET /v2/partner/school
Used for school/org sync.

4. GET /v2/partner/group
Used for group sync.

5. GET /v2/partner/license
Used for license sync and school access status.

Code: littleTalkApp/integrations/skolon_client.py

## Important data rules in our sync

1. We only sync TEACHER roles for login mapping.
2. School licensing controls access in our app.
3. User-school matching checks all listed school memberships and links to the first mapped local school.
4. Full refresh resets cursors and re-syncs all core entities.

## Main code locations

1. API client and token handling
- littleTalkApp/integrations/skolon_client.py

2. Sync logic
- littleTalkApp/integrations/skolon_sync.py

3. Webhooks and SSO views
- littleTalkApp/views_modules/skolon.py

4. Manual sync command
- littleTalkApp/management/commands/skolon_sync.py

## Manual commands

1. Incremental sync now
- python manage.py skolon_sync

2. Full refresh now
- python manage.py skolon_sync --full-refresh

## Quick troubleshooting checklist

1. Confirm timers are active (incremental + nightly full refresh).
2. Confirm Skolon webhook endpoint is reachable and returning 200.
3. Run full refresh and inspect user stats (eligible, created, updated, skipped).
4. Verify target school license is active in sync output.
5. Verify expected teacher count for that school in local SkolonUser records.
