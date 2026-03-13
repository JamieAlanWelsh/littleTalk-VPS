# littleTalkApp Test Package

This package contains integration-style regression tests organized by domain.

## Modules

- `test_middleware_flows.py`: Access-control and school-selection middleware behavior.
- `test_school_flows.py`: Staff invites, school dashboard role updates, and join-request workflows.
- `test_assessment_flows.py`: Typical screener lifecycle flow.
- `test_parent_access_flows.py`: Parent signup via PAC and PAC learner-linking constraints.
- `test_api_security.py`: API nonce replay, timestamp validation, and cross-school permission boundaries.

## Run

Run all app tests:

```bash
python3 manage.py test littleTalkApp.tests -v 2
```

Run a single module:

```bash
python3 manage.py test littleTalkApp.tests.test_api_security -v 2
```

## Reliability Notes

- Honeypot-protected endpoints must include `contact_info` in test POST payloads.
- Staff-role tests should set `selected_school_id` in session to satisfy middleware and access checks.
