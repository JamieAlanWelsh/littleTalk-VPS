# littleTalkApp Test Package

This package contains integration-style regression tests organized by domain.

## Modules

- `test_middleware_flows.py`: Access-control and school-selection middleware behavior.
- `test_school_flows.py`: Staff invites, school dashboard role updates, and join-request workflows.
- `test_assessment_flows.py`: Typical screener lifecycle flow.
- `test_parent_access_flows.py`: Parent signup via PAC and PAC learner-linking constraints.
- `test_api_security.py`: API nonce replay, timestamp validation, and cross-school permission boundaries.
- `test_contracts.py`: Import, URL, and template contract checks to catch wiring regressions.
- `test_forms.py`: Form validation and data-contract checks.
- `test_models.py`: Core model behavior tests for licensing, role resolution, and age derivation.

## Run

Run all app tests:

```bash
python3 manage.py test littleTalkApp.tests -v 2
```

Run all app tests with CI-safe settings (recommended):

```bash
python3 manage.py test littleTalkApp.tests -v 2 --settings=littleTalk.settings_test
```

Run a single module:

```bash
python3 manage.py test littleTalkApp.tests.test_api_security -v 2
```

## Reliability Notes

- Honeypot-protected endpoints must include `contact_info` in test POST payloads.
- Staff-role tests should set `selected_school_id` in session to satisfy middleware and access checks.
- The automated suite is backend-focused: it checks Django behavior, not full in-browser JavaScript or visual layout behavior.
- For UI-facing changes, keep manual checking narrow: test only the specific page or user flow that changed.

## Team Process

- Use the repository checklist in `littleTalkApp/tests/TESTING_CHECKLIST.md` before merging PRs and before production deploys.
