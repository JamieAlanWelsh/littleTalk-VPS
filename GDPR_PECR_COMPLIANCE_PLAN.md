# UK GDPR, PECR and Company Compliance Plan

**Organisation:** LITTLETALK SLT LIMITED  
**Company number:** 16333340  
**Registered office:** 19 Ganghill, Guildford, Surrey, GU1 1XE  
**Plan date:** 26 July 2026  
**Status:** Implementation in progress; legal and governance review outstanding

## Purpose

LITTLETALK SLT LIMITED should execute a containment-first programme: immediately prevent Google Analytics 4 (GA4) from loading without opt-in and correct public identity and unsupported claims; establish school controller/processor contracts and the accountability records that determine product behaviour; then implement rights, retention, and deletion controls against those approved rules.

This plan is based on repository evidence, the deployed public site, and ICO/GOV.UK guidance reviewed on 26 July 2026. The ICO notes that relevant guidance is being reviewed following the Data (Use and Access) Act. A UK privacy solicitor or qualified data protection adviser must approve legal positions, contracts, and notices before publication. This plan is not legal advice or a certification of compliance.

## Initial Audit Baseline

This section records the position found at the start of the review. Items subsequently remediated are checked in the progress checkpoint below.

- The business has supplied the legal operator as LITTLETALK SLT LIMITED, company number 16333340, with registered office at 19 Ganghill, Guildford, Surrey, GU1 1XE. Confirm the Companies House record states "registered in England and Wales" before publishing that jurisdiction.
- There are no known Data Processing Agreements (DPAs), Record of Processing Activities (ROPA), Data Protection Impact Assessment (DPIA), Legitimate Interests Assessment (LIA), processor/transfer register, retention procedure, rights procedure, or breach procedure.
- School terms currently consist of invoices and signup acceptance wording. The schools' and company's roles, processing instructions, and responsibilities for learner data are not contractually defined.
- GA4 is injected before user choice in both shared base templates. There is no prior consent control, rejection option, preference management, or consent evidence.
- Public notices omit active services and recipients and contain potentially unsupported claims about multi-factor authentication, access logging, incident procedures, regular audits, DPO appointment, EEA-only processing, and deletion.
- The terms promise deletion after six months, while the data policy suggests approximately two years. No automated enforcement of either period was found.
- The service processes children's names, dates of birth, screener answers, recommendations, usage/progress data, and free-text notes that may reveal health or SEND information.
- Existing learner and Skolon deletion paths do not demonstrably erase all linked assessment, exercise, and account data.
- No complete access/export, account erasure, restriction, objection, or automated retention workflow was found.

## Compliance Principles

1. Do not claim compliance merely because policies have been published. Completion requires implemented controls, signed contracts, owned records, trained staff, and tested procedures.
2. Do not use consent as a universal basis for learner processing. School-directed and direct-parent processing require separate role and lawful-basis decisions.
3. Where actual special-category data is processed, identify both an Article 6 lawful basis and an Article 9/DPA 2018 condition.
4. Privacy notices must describe actual production behaviour. Unsupported security, location, retention, or governance claims must not be published.
5. Non-essential tracking must remain disabled until the user takes an affirmative, informed action.

## Progress Checkpoint: 26 July 2026

### Completed in the Repository

- [x] Removed unconditional GA4 loading from shared public and authenticated layouts.
- [x] Added first-visit analytics controls with reject, customise, and accept choices; analytics is off until affirmative opt-in.
- [x] Added versioned browser preference storage containing the analytics choice, policy version, and update timestamp.
- [x] Added analytics withdrawal and preference reopening from **Data & Privacy Policy** under **Cookies and Browser Storage**.
- [x] Added best-effort removal of GA cookies after analytics is rejected or withdrawn.
- [x] Documented Django session and CSRF cookies, consent preference storage, GA cookies, purposes, and withdrawal behaviour.
- [x] Removed the always-visible cookie settings control so returning visitors with a current preference are not repeatedly prompted.
- [x] Consolidated the maintained public legal surface into **Terms & Conditions** and **Data & Privacy Policy**.
- [x] Preserved legacy `/data-policy/` and `/cookies/` URLs by redirecting them to the combined policy's cookie section.
- [x] Removed company/address disclosures from shared and authenticated layouts and placed the registered office in the privacy policy's **Contacting Us** section.
- [x] Published the company identity, company number, registered office, registration jurisdiction, support contact, and privacy contact in the maintained legal documents.
- [x] Replaced an unsupported statutory DPO claim with accurate **Privacy Lead** wording.
- [x] Removed or qualified identified unsupported claims concerning MFA, access logging, audits, EEA-only processing, secure deletion, and fixed retention.
- [x] Removed wording that treated continued use as acceptance of the privacy notice.
- [x] Replaced contradictory six-month/two-year deletion promises with interim retention wording pending an approved schedule.
- [x] Updated the public footer to the two maintained legal links and corrected its copyright year.
- [x] Added or revised just-in-time privacy wording across school, parent, learner, screener, support, invitation, and join-request collection points.
- [x] Changed subscription checkout initiation to a CSRF-protected POST requiring terms acknowledgement and an explicit immediate-service-start request.
- [x] Added terms/privacy versions and the immediate-service-start request to Stripe checkout metadata.
- [x] Removed discretionary-only refund and mandatory arbitration wording while preserving statutory consumer rights.
- [x] Added focused contract coverage for legal routes, legacy redirects, pre-consent analytics blocking, cookie controls, public claims, and checkout metadata.
- [x] Documented that production secrets are supplied through the Nginx/Gunicorn environment rather than treating repository development defaults as evidence of exposed production credentials.

### Partially Complete or Awaiting Evidence

- [ ] **Browser verification:** inspect production network requests and browser storage before choice, after rejection, after acceptance, and after withdrawal on public/authenticated desktop and mobile pages.
- [ ] **Cookie inventory:** verify all production cookies, storage, remote scripts, fonts, CDNs, and embeds in a clean browser against the published policy.
- [ ] **Legal review:** obtain qualified review of the combined policy, terms, controller/processor positions, lawful bases, children's approach, and subscription wording.
- [ ] **Collection points:** recheck every current collection template before release; repository contract coverage has identified that account setup no longer links to both maintained legal documents.
- [ ] **Consumer contracting:** confirm total-price/tax presentation, cancellation mechanics, model cancellation form, complaints process, and durable post-order confirmation against the live Stripe/email journey.
- [ ] **Production security evidence:** verify deployed `DEBUG`, host, HTTPS/HSTS, cookie, CSRF, secret injection, access-control, backup, logging, and monitoring settings. Environment-based secret injection is reported in place but has not been independently inspected in this review.
- [ ] **Governance and lifecycle controls:** Phase 1 records/contracts and the Phase 3 access, erasure, restriction, retention, and audit workflows remain outstanding.

## Phase 0: Contain Public Exposure

**Target:** First release, days 1-3  
**Exit criterion:** No Google request occurs before analytics opt-in; verified company details and truthful interim notices are live.

1. Change the shared public and authenticated layouts so GA4 and its remote script are never loaded until the user affirmatively accepts analytics.
2. Provide an accessible first-layer control with equally prominent **Accept analytics** and **Reject analytics** choices, granular settings, and no preselected non-essential purposes.
3. Persist a versioned preference and provide a **Cookie settings** link from the Data & Privacy Policy. Do not treat continued browsing, signup, or another unrelated action as consent.
4. Add a cookie inventory and policy covering Django session and CSRF cookies, the consent preference, GA4 cookies/identifiers, provider, purpose, duration, and withdrawal.
5. Inventory cookies, browser storage, remote scripts, fonts, CDNs, and embedded services in a clean browser before finalising the policy. Classify only genuinely essential service or security storage as strictly necessary.
6. Retain proportionate evidence of the policy/CMP version, choice, and timestamp without unnecessarily identifying anonymous visitors.
7. Publish verified company particulars in the maintained public legal documents: full registered name including LIMITED, company number, registered office, and registration jurisdiction. Include direct business and privacy contact details without adding the registered office to authenticated layouts.
8. Add a VAT number only if the business is VAT-registered. Do not publish selected director names unless all directors are listed. Correct the stale copyright year.
9. Remove or qualify unsupported claims about MFA, profile access logging, exclusive EEA processing, regular audits, secure deletion, DPO appointment, and fixed retention.
10. Remove wording that treats continued use as acceptance of a privacy notice. A privacy notice provides information; it is not contractual consent.
11. Replace contradictory six-month/two-year retention wording with a truthful interim statement pending the approved retention schedule.
12. Create a remediation evidence log recording the original behaviour, release date, tracking test results, public-page changes, owner, and legal-review status.

## Phase 1: Establish the Lawful Operating Model

**Target:** Week 1  
**Dependency:** This phase controls the final design of phases 2-4.  
**Exit criterion:** Approved role/lawful-basis matrix, DPA, DPIA, ROPA, retention schedule, processor register, and operational owners exist.

1. Map every processing purpose and data flow for:
   - Public visitors and analytics.
   - Direct-parent accounts and subscriptions.
   - School staff, invitations, join requests, and account administration.
   - Learner identity, screeners, recommendations, exercises, and progress notes.
   - Parent access and school/parent visibility.
   - Support, transactional email, direct marketing, and billing.
   - Skolon provisioning/removal and security/application logging.
2. Record data subjects, data fields, source, purpose, lawful basis, recipient, location, retention trigger, system, and owner in a ROPA/data map.
3. Decide and document roles for each purpose. The recommended starting position for legal review is:
   - Schools act as controllers and LITTLETALK SLT LIMITED acts as their processor for school-directed learner processing.
   - LITTLETALK SLT LIMITED acts as controller for its own account security, billing, support, legal compliance, and consented site analytics.
   - Direct-parent processing is handled as a distinct controller relationship.
4. Test whether recommendation design, product improvement, benchmarking, or cross-customer analytics creates independent-controller or joint-controller purposes.
5. Put an Article 28 DPA/order schedule in place with every school before new substantive learner processing. Execute amendments with existing schools urgently.
6. Ensure the DPA covers subject matter and duration, processing instructions, data and subjects, confidentiality, security, subprocessors and objections, rights/breach/DPIA assistance, deletion or return, audits, and international transfers.
7. Do not promise unconditional school-requested hard deletion where a legal hold, statutory retention requirement, or separate controller purpose applies. Document valid exceptions.
8. Build a processor/subprocessor register for Hetzner, Zoho, Stripe, Google Analytics, Skolon, Calendly, and every CDN, font, script, logging, monitoring, and backup provider actually used.
9. For each provider, verify controller/processor status, contract/DPA, processing location, downstream subprocessors, retention/deletion, and any adequacy regulation, UK IDTA, or UK Addendum required for restricted transfers.
10. Determine whether a statutory DPO is required based on actual core activities and scale. If not, appoint a privacy lead without representing that person as a statutory DPO.
11. Confirm the organisation's ICO data protection fee and registration position.
12. Establish owners and one-month intake/response procedures for access, correction, erasure, restriction, objection, and portability, including identity and authority checks for parents, children, staff, and schools.
13. Complete a DPIA before expanding processing. Cover vulnerable children, scoring and recommendations, health/SEND notes, school power imbalance, third-party roster data, parent access, analytics, breaches, and rights.
14. Record necessity, proportionality, alternatives, likelihood/severity, mitigations, consultation, and residual risk in the DPIA.
15. Create an LIA only for purposes actually relying on legitimate interests.
16. For health/SEND information, identify both an Article 6 basis and a valid Article 9/DPA 2018 condition. If no condition fits, stop collecting the information or obtain valid explicit consent only where counsel confirms it is appropriate.
17. Approve a category-level retention and disposal schedule for rejected join requests, invitations, verification tokens, active/inactive accounts, learner identity, screener history, exercise sessions, progress notes, support messages, billing records, security/audit logs, backups, and processor copies.
18. Resolve school return/deletion instructions, restrictions, and legal holds. Select one public retention statement that matches the implemented schedule.
19. Write and rehearse a breach procedure and register covering discovery time, triage, affected children/data, processor-to-controller escalation, the ICO 72-hour assessment, school/data-subject communication, containment, and lessons learned.

## Phase 2: Transparency, Marketing, and Commercial Terms

**Target:** Weeks 2-3, after Phase 1 decisions  
**Exit criterion:** Counsel-approved notices and contracts accurately describe production behaviour and appear at every relevant collection point.

1. Replace the overlapping privacy/data pages with a legally reviewed layered privacy notice covering:
   - Company identity and direct contact details.
   - Roles in school and direct-parent contexts.
   - Purposes and lawful bases.
   - Special-category processing.
   - Recipients and processors.
   - International transfers and safeguards.
   - Category-specific retention.
   - Data-subject rights, consent withdrawal, and legitimate-interest objections.
   - Complaints to the ICO.
   - Required/optional data and consequences of not providing it.
   - Data sources, including schools and Skolon.
   - Meaningful information about screener/recommendation logic and expected effects.
2. Maintain a clearly linked **Cookies and Browser Storage** section within the combined Data & Privacy Policy.
3. Add point-of-collection notices at school signup, join requests, staff invitations/acceptance, parent signup/access, learner creation, screener start, support, and payment.
4. Version the terms/notices accepted or displayed. Do not add mandatory "I consent to the privacy policy" checkboxes. Use terms acknowledgment and separate optional consent only where consent is the selected lawful basis.
5. Produce a concise child-accessible notice appropriate for ages 2-11 and a fuller adult/guardian notice.
6. Explain what the app remembers, who can see it, how recommendations work, how to ask questions or exercise rights, and that the service provides educational support rather than diagnosis.
7. Assess the service against the Children's Code if it is likely to be accessed directly by children. Default optional sharing/profiling off and record best-interests decisions.
8. Replace the existing terms with separate or clearly partitioned school/B2B and parent/consumer terms.
9. For consumer subscriptions, disclose legal identity/contact/address, service and technical requirements, total recurring price and taxes, billing period/minimum term, auto-renewal, cancellation method, statutory 14-day cancellation and early-start consequences where applicable, model cancellation form, refund timing, complaints, and governing jurisdiction.
10. Remove "refund at sole discretion" and mandatory UK arbitration wording unless counsel confirms the revised provisions preserve statutory consumer rights.
11. Send durable contract confirmation by email after an order is completed.
12. Add a complaints route and direct privacy contact.
13. Treat accessibility as a separate product quality and legal-assessment track. Do not represent an accessibility statement, public SLA, VAT number, or professional registration number as universally mandatory company website disclosures.
14. Audit every outbound email. Separate transactional messages from direct marketing.
15. Ensure optional marketing defaults off, evidence the opt-in or valid soft opt-in, identify the sender, provide easy unsubscribe in each marketing message, and maintain suppression records.
16. Do not add unsubscribe links to essential security/service messages in a way that implies users can disable necessary communications.

## Phase 3: Data-Subject and Lifecycle Controls

**Target:** Weeks 3-6  
**Dependency:** Approved controller roles, retention rules, and lawful bases  
**Exit criterion:** Access, erasure, restriction, consent withdrawal, and retention workflows are complete, authorised, idempotent, and tested.

1. Create one domain service that inventories and exports personal data through authorised ORM relationships.
2. Produce a structured, machine-readable package with supplementary access information covering User, Profile, ParentProfile, memberships, invitations, join requests, learners, parent links, assessment history, exercise sessions, targets, progress notes, Skolon mapping, and relevant account events.
3. Scope exports according to the controller relationship and verify requester identity and authority. Remember that access is broader than the narrower right to portability.
4. Create one idempotent erasure/anonymisation service used by self-service requests, support/admin handling, learner deletion, account closure, and Skolon removal.
5. Encode approved retention rules and legal holds. Cover assessment, exercise, target, note, token, membership, and many-to-many relationships, and notify processors where required.
6. Retain only minimal, non-reversible compliance evidence. Do not assume an unsalted email hash is anonymous; it remains readily linkable.
7. Add authenticated settings flows for data access/export, correction links, account/learner erasure, consent preferences, and contact-based restriction/objection requests.
8. Implement explicit restriction statuses and defined behaviour for each processing path. Do not rely on an undefined global `processing_restricted` switch.
9. Implement the approved retention schedule through idempotent management commands with `--dry-run`, category counts, legal-hold/restriction exclusions, bounded batches, processor follow-up, and audit output.
10. Schedule the commands operationally and document backup expiry. Require owner approval of dry-run results before destructive production execution.
11. Make Skolon removal converge on the same erasure service.
12. Authenticate/signature-check Skolon webhooks according to Skolon's specification, handle replay/idempotency, and provide auditable outcomes.
13. Reconcile deletion or return with the relevant school. A user-removal webhook does not necessarily authorise deletion of school-controlled learner records.
14. Add proportionate immutable audit events for rights requests, exports, erasure decisions/execution, restrictions, consent changes, and privileged access/changes.
15. Minimise audit payloads, restrict visibility, assign retention periods, and never copy child notes or decrypted personal data into logs unnecessarily.

## Phase 4: Security and Data Protection by Design

**Target:** Weeks 3-6, in parallel after DPIA controls are approved  
**Exit criterion:** Published security claims are backed by deployed configuration, test evidence, and owned procedures.

1. Validate production DEBUG and secret handling, TLS/HSTS, session cookie flags, CSRF behaviour, password and verification throttling, staff/school object permissions, admin/MFA reality, webhook authentication, log redaction/retention, backups, encryption/key access, and incident monitoring.
2. Verify cookie attributes against deployed response headers. Django session cookies are HttpOnly by default, but deployed defaults must be evidenced.
3. Do not set the CSRF cookie HttpOnly while the React client reads the token unless that frontend flow is redesigned.
4. Apply the DPIA's minimisation decisions to learner DOB, assessment history, free-text notes, and analytics.
5. Do not use blanket field encryption as a substitute for access control and retention. Determine whether assessment information is health data in context, then select database/disk encryption, field encryption, key management, least privilege, or pseudonymisation according to the threat model and query requirements.
6. Verify role isolation for multi-school users, school-wide learner access, and parent access tokens.
7. Add privileged access logging where promised by the privacy notice or school DPA, and restrict staff to learners required for their role.

## Phase 5: Assurance and Release Evidence

**Target:** After each phase and quarterly  
**Exit criterion:** Controls are demonstrably effective in production and supported by current governance evidence.

1. Add browser-level PECR tests in a fresh profile proving:
   - Before choice and after rejection, there are no Google requests, GA cookies, local-storage identifiers, or queued transmissions.
   - Acceptance loads GA once.
   - Withdrawal deletes GA cookies where possible and prevents future requests.
   - Preferences work on public, authenticated, desktop, and mobile pages.
   - Controls remain keyboard and screen-reader accessible.
2. Re-run tracking tests against production using network and browser-storage inspection.
3. Add Django tests for company/legal routes, notice links and versions, export authorisation/completeness, cross-school denial, parent/child authority, each erasure entry point, retained exceptions, idempotency, restrictions, retention dry-run/live behaviour, Skolon authentication/replay, and audit minimisation.
4. Perform staged data rehearsals with synthetic fixtures:
   - Export and compare every model relationship.
   - Erase and prove prohibited data is absent while authorised evidence remains.
   - Run each retention category in dry-run mode and then against a disposable database.
   - Exercise processor notifications.
   - Restore a backup and confirm expired data disappears as backups age out.
5. Assemble a client assurance pack containing the signed school DPA/order schedule, current subprocessor list, concise security measures, role summary, appropriate DPIA summary, retention schedule, rights/breach contacts, ICO status, legal notices, and dated test evidence.
6. Do not publish internal attack details or claim certification that the organisation does not hold.
7. Set quarterly and change-triggered reviews for cookies/scripts, subprocessors/transfers, DPIA, ROPA, retention execution, rights metrics, incidents, notices, and contracts.
8. Require privacy review before adding a tracker, child-data field, integration, or recommendation/profiling purpose.

## Implementation Touchpoints

- [littleTalkApp/templates/base.html](littleTalkApp/templates/base.html) and [littleTalkApp/templates/landing_base.html](littleTalkApp/templates/landing_base.html): remove unconditional GA and host shared consent controls and cookie-settings links.
- [littleTalkApp/templates/public/legal/privacy.html](littleTalkApp/templates/public/legal/privacy.html) and [littleTalkApp/templates/public/legal/terms.html](littleTalkApp/templates/public/legal/terms.html): maintain the combined Data & Privacy Policy and Terms & Conditions. Legacy `/data-policy/` and `/cookies/` URLs redirect to the combined policy.
- [littleTalkApp/urls.py](littleTalkApp/urls.py) and [littleTalkApp/views_modules/public.py](littleTalkApp/views_modules/public.py): cookie/privacy/children/rights routes and a consent preference endpoint if server-side evidence is used.
- [littleTalkApp/forms.py](littleTalkApp/forms.py) and relevant signup, invitation, parent, learner, screener, support, and subscription templates: just-in-time notices and separate terms/marketing choices.
- [littleTalkApp/models.py](littleTalkApp/models.py) and [accounts/models.py](accounts/models.py): relationship inventory and minimal rights/consent/audit records after retention and controller decisions.
- [littleTalkApp/views_modules/profile.py](littleTalkApp/views_modules/profile.py), [littleTalkApp/views_modules/settings_views.py](littleTalkApp/views_modules/settings_views.py), and [littleTalkApp/views_modules/skolon.py](littleTalkApp/views_modules/skolon.py): converge export, rights, and erasure entry points on shared domain services.
- [littleTalkApp/management/commands](littleTalkApp/management/commands): retention dry-run/execution and operational reporting, following the existing command pattern.
- [littleTalkApp/utilities.py](littleTalkApp/utilities.py) and [littleTalkApp/templates/emails](littleTalkApp/templates/emails): classify messages and add compliant marketing withdrawal/suppression only to marketing.
- [littleTalk/settings.py](littleTalk/settings.py) and [littleTalk/settings_test.py](littleTalk/settings_test.py): deployed security settings and test configuration.
- [littleTalkApp/tests](littleTalkApp/tests) and [frontend/src](frontend/src): lifecycle/authorisation tests and consent UI. Keep consent bootstrap independent of the authenticated React bundle so public pages are covered.

## Governance Documents to Create

Create controlled working documents for:

- ROPA and data-flow map.
- Controller/processor and Article 6/Article 9 matrix.
- DPIA and any LIAs.
- School DPA and processing schedule template.
- Subprocessor and international-transfer register.
- Retention and disposal schedule.
- Data-subject rights procedure and request log.
- Personal-data breach procedure and breach register.
- Cookie inventory and consent configuration register.
- Security measures and control-evidence register.

Do not commit executed contracts, live incident information, or personal-data request records to source control. Store them in a controlled business system with appropriate access and retention.

## Verification Commands and Activities

1. Run targeted and full Django tests:

   ```bash
   python3 manage.py test littleTalkApp.tests -v 2 --settings=littleTalk.settings_test
   ```

2. Run the exact frontend lint, typecheck, test, and build scripts exposed by [package.json](package.json).
3. Inspect production network requests, cookies, and browser storage in clean desktop and mobile profiles before choice, after rejection, after acceptance, and after withdrawal.
4. Compare footer/legal identity with the live Companies House record.
5. Verify every public factual claim against an owned evidence item.
6. Obtain legal/privacy sign-off for controller/processor roles, the Article 6/9 matrix, DPA, DPIA residual risk, notices, children's approach, and consumer terms.
7. Obtain executed DPAs/order schedules for existing schools and complete processor contracts and transfer safeguards.
8. Record the ICO fee/registration determination.
9. Rehearse subject-access, erasure, restriction, and breach scenarios against timed checklists, including school/parent authority and processor notifications.

## Completion Criteria

The programme is complete only when:

- GA4 remains technically blocked until affirmative opt-in, and rejection causes no Google traffic.
- Company disclosures and legal notices are accurate and live.
- School roles and instructions are defined in executed contracts.
- Every purpose has an approved lawful basis and, where needed, Article 9 condition.
- The ROPA, DPIA, retention schedule, processor register, rights procedure, and breach procedure are owned and current.
- Product behaviour implements approved access, erasure, restriction, consent-withdrawal, and retention decisions.
- Processor deletion/return and international-transfer safeguards are evidenced.
- Staff know how to identify and escalate rights requests and incidents.
- Automated tests, production inspection, and operational rehearsals demonstrate that controls work.
- Legal and engineering owners have signed off that published statements match actual production behaviour.

## Scope Boundaries

This plan covers UK GDPR, the Data Protection Act 2018, PECR, UK limited-company website disclosures, and directly related UK consumer subscription disclosures.

Separate specialist reviews may still be required for clinical or medical-device classification, safeguarding, advertising-claim substantiation, complete accessibility conformance, employment privacy, tax/accounting requirements, and non-UK legal regimes.
