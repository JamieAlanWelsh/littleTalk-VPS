# Testing Checklist

Use this checklist before merging pull requests and before production deploys.

The automated test suite covers backend Django behavior such as imports, URL wiring, template rendering, form validation, model behavior, redirects, permissions, and database side effects.

The automated test suite does not open a real browser or execute frontend JavaScript. For that reason, small targeted manual checks are still useful when a change affects the visible user experience.

## Pre-PR (required)

- [ ] Run full backend tests:
      python3 manage.py test littleTalkApp.tests accounts -v 2 --settings=littleTalk.settings_test
- [ ] Confirm the test run completed successfully before requesting review or merging. This is the main automated gate for backend confidence.
- [ ] If a view or route changed, verify related contract tests pass in:
      littleTalkApp/tests/test_contracts.py
- [ ] If form validation changed, add or update tests in:
      littleTalkApp/tests/test_forms.py
- [ ] If model behavior changed, add or update tests in:
      littleTalkApp/tests/test_models.py
- [ ] If auth or membership logic changed, run the relevant flow tests and middleware tests.

## Team Check (required)

- [ ] Confirm with the other engineer that the relevant tests were run.
- [ ] If the change affects templates or static asset loading, run:
      python3 manage.py collectstatic --noinput --settings=littleTalk.settings_test
- [ ] If the change is user-facing, do a focused manual click-through of only the affected flow.
- [ ] Manual click-through means a short check in the browser for the page or flow you changed, mainly to catch broken buttons, JavaScript issues, layout problems, or other browser-only issues that Django tests do not see.

## Pre-Deploy (required)

- [ ] Re-run full test suite on the release branch.
- [ ] Confirm migrations are included and reviewed.
- [ ] Confirm no failing or skipped critical tests.
- [ ] Perform focused manual click-through for user-facing flows touched by the release.
- [ ] Do not treat manual checking as a full site-wide QA pass. It is only a targeted check for browser-visible behavior changed in the release.

## Regression Focus

Prioritize adding tests for:
- Import wiring failures between views facade and view modules.
- Template resolution failures for rendered pages.
- URL naming or reverse() breakage.
- Form and model validation edge cases.
