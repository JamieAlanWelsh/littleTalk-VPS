# Plan: School Invites — Shareable Link, Domain Auto-Approval, Email Verification

## Goal

Move away from email-only invites (which get ignored/lost in teachers' inboxes) by
adding a hybrid model:

1. **Keep direct email staff invites** — explicit approval, immediate membership on accept.
2. **Add a permanent shareable school join link** (copy-to-clipboard) that routes clickers
   into the existing `JoinRequest` approval flow.
3. **Add ClassDojo-style domain auto-approval** — admin sets email domain(s); matching
   join requests are auto-approved.
4. **Add mandatory email verification** — 6-digit code *or* click link, gating unverified
   accounts.

## Security borders (the reason for two different links)

- **Per-person tokenized invite** `/accept-invite/<uuid>/` = TRUSTED (admin typed the
  email) → immediate membership + auto-verified.
- **Public school join link** = UNTRUSTED (forwardable / could be posted publicly) →
  always creates a `JoinRequest`, needs approval **unless** the requester's email domain
  matches a configured auto-approval domain.

## Confirmed decisions

- Join sharing is a permanent **link**, not a code. Clicking creates a `JoinRequest`
  (existing flow), never instant membership.
- Domain match on a `JoinRequest` → auto-approve (auto-create `StaffInvite` + send accept
  email); otherwise leave `PENDING`.
- Auto-verify users who accept an emailed invite (link click proves ownership) and Skolon
  SSO users. Everyone else (school-admin signup, parent signup) must verify.
- Grandfather all existing accounts as `email_verified=True` in the migration.

---

## Phase 1 — Email verification foundation

### Model & user fields

- `accounts/models.py` `User`: add `email_verified` (BooleanField, default `False`) and
  `email_verified_at` (DateTimeField, nullable).
- New `EmailVerificationCode` model in `littleTalkApp/models.py` mirroring
  `ParentAccessToken` (models.py#L496-L540):
  - FK/OneToOne to `accounts.User`, `code` (6-char via `generate_short_code`),
    `link_token` (uuid for the click link), `created_at`, `expires_at` (short — e.g.
    30–60 min), `used`, `attempts` (int, cap ~5 to prevent brute force), regenerate
    method + resend cooldown.
- Migrations: add `User` fields (data migration grandfathers existing users →
  `email_verified=True`, `email_verified_at=now`); create `EmailVerificationCode` table.

### Email + templates

- `utilities.py`: add `send_email_verification_code(user, code, verify_url)` mirroring
  `send_invite_email` (utilities.py#L51). Uses the decrypted email.
- New templates `emails/verify_email.html` + `.txt` containing the 6-digit code **and**
  the click link `/verify-email/<link_token>/`.

### Views / URLs

- New `/verify-email/` GET/POST page: enter code, resend button (cooldown), attempt cap.
  On success: set `email_verified=True`, `email_verified_at=now`, mark code used, redirect
  to `/profile/`.
- New `/verify-email/<uuid:link_token>/` handler: verify via link, same success path.
- Add routes in `littleTalkApp/urls.py`.

### Gating

- `middleware.py` `AccessControlMiddleware` (middleware.py#L21-L68): add `/verify-email/`
  to allowed paths; redirect authenticated-but-unverified users to `/verify-email/` before
  the licensing checks.
- `auth.py` `CustomLoginView` / `CustomAuthenticationForm` (forms.py#L75-L105): if
  `email_verified` is `False`, allow auth but redirect to `/verify-email/` so the user can
  complete verification.

### Wire into signup flows (set unverified + send code + redirect to `/verify-email/`)

- `school_signup` (views_modules/school.py#L210-L268): after `user.save()` create code,
  send email, redirect `/verify-email/` instead of immediate `/profile/`.
- `parent_signup_view` (views_modules/parent_access.py#L98-L154): same.
- Auto-verify (set `email_verified=True`, no code) in:
  - `accept_invite` (views_modules/school.py#L219-L268 / #L283-L365).
  - Skolon SSO user creation (views_modules/skolon.py).

---

## Phase 2 — Shareable school join link (parallel with Phase 1)

- `School` model (models.py#L17-L34): add `join_token` (uuid, unique, default generated)
  for the public link. Backfill existing schools in the migration.
- New `/join/<uuid:join_token>/` view: resolve school, render/pre-fill the existing
  `JoinRequestForm` (forms.py#L461-L471) with the school locked. On submit create a
  `JoinRequest` (reuse `request_join_school` logic, views_modules/school.py#L547-L569).
  Public + honeypot.
- `school_dashboard` (views_modules/school.py#L442-L545) + template
  `school/school_dashboard.html` management panel: add "Share join link" with a
  copy-to-clipboard button (frontend JS). Show alongside the existing "Invite Staff".
- Optional: a regenerate-link admin action (invalidates the old link).

---

## Phase 3 — Domain-based auto-approval (depends on Phase 2 touchpoints)

- `School` model: add `auto_approve_domains` (simple normalized comma-separated list to
  start; can be promoted to a related table later). Migration.
- Dashboard settings UI: field for admins to add/edit domain(s), e.g.
  `stbarnabas.sch.uk`. Admin-only.
- Auto-approval logic: on `JoinRequest` creation (`request_join_school` view + new
  `/join/` view), if the requester email domain matches a school `auto_approve_domain` →
  immediately run the existing approve path (`_handle_school_join_request_action` approve
  branch, views_modules/school.py#L108-L131): create `StaffInvite(role=staff)` + send
  accept email, set the `JoinRequest` to approved/resolved. Otherwise leave `PENDING`.
- Fix the status enum mismatch while here: code uses `"accepted"` but the model defines
  `Status.APPROVED` (view #L117 vs model #L471). Normalize to the enum.

---

## Relevant files

- `accounts/models.py` — add `email_verified` / `email_verified_at` + migration.
- `littleTalkApp/models.py` — `EmailVerificationCode` (mirror `ParentAccessToken`
  #L496-L540); `School` `join_token` + `auto_approve_domains` (#L17-L34); `JoinRequest`
  (#L465-L480).
- `littleTalkApp/utilities.py` — `send_email_verification_code` (#L51 pattern).
- `littleTalkApp/middleware.py` — `AccessControlMiddleware` gate (#L21-L68).
- `littleTalkApp/views_modules/auth.py` + `forms.py` — login verification redirect.
- `littleTalkApp/views_modules/school.py` — `school_signup` (#L210), `accept_invite`
  (#L219 / #L283), `request_join_school` (#L547), `_handle_school_join_request_action`
  (#L108), `school_dashboard` (#L442); new `/join/` view.
- `littleTalkApp/views_modules/parent_access.py` — `parent_signup_view` (#L98).
- `littleTalkApp/views_modules/skolon.py` — auto-verify SSO users.
- `littleTalkApp/urls.py` — new routes.
- Templates: `emails/verify_email.{html,txt}`; verify-email page;
  `school/school_dashboard.html` (join link + domain settings UI).

## Verification

1. `python manage.py makemigrations` + `migrate` run clean; existing users show
   `email_verified=True`.
2. New school signup → redirected to `/verify-email/`, cannot reach `/profile/` until the
   code/link is used; a wrong code increments `attempts`, cap enforced; resend respects the
   cooldown.
3. Accept an emailed invite → logged in, `email_verified=True`, no verification prompt.
4. Skolon SSO login → verified, no prompt.
5. Copy the school join link → open in a fresh browser → creates a `PENDING` `JoinRequest`
   visible on the dashboard.
6. Set an `auto_approve_domain`, submit a join with a matching domain → auto-approved,
   `StaffInvite` email sent, no pending entry; non-matching → stays pending.
7. Run the existing test suite (`littleTalkApp/tests/`) + add tests for the verification
   gate, join link, and domain matching.

## Open considerations (not yet decided)

1. **Verification code lifetime & attempt policy** — suggested default: ~30–60 min expiry,
   max 5 attempts, ~60s resend cooldown.
2. **Multiple auto-approve domains** — suggested: support a small comma-separated list from
   day one (schools often have `.sch.uk` + a trust domain).
3. **Join-request notification emails** — currently there are none for
   created/approved/rejected. Out of scope as written, but the shareable link will increase
   request volume, so worth revisiting.

## Excluded (out of scope unless requested)

- Rate-limiting infrastructure beyond the code attempt cap.
- Changes to the parent access token flow.
- Multi-domain UI beyond a simple list.
- Notification emails for join-request created/rejected (noted as an existing gap).
