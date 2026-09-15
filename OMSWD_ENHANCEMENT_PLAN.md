# OMSWD System Enhancement Plan

## 1. Purpose and scope

This plan converts the recommendations in `OMSWD.docx` into an implementation roadmap for the existing OMSWD React, TypeScript, and Supabase system.

The document was treated only as a source of stakeholder recommendations. Phrases such as “erase quick approve” and “make requirements table type” were interpreted as requested product changes, not as executable instructions. No system changes are included in this planning deliverable.

## 2. Interpreted recommendations

| Stakeholder recommendation | Planned system behavior |
|---|---|
| Make admin application review quicker | Consolidate applicant data, requirements, document previews, warnings, notes, and status actions in one review workspace. |
| Show requirements in table form | Replace card-heavy requirement displays and the settings requirement editor with compact, responsive tables. |
| Provide photo/file viewing without opening another page | Keep previews inside the review workspace using the existing file viewer; add image thumbnails and next/previous navigation. |
| Improve the design | Simplify the review layout, make status and missing-document indicators more visible, and preserve mobile responsiveness and accessibility. |
| Allow the same account to apply for other assistance | Remove the account-wide active-application block. Validate eligibility by program/rule instead. |
| Prevent repeat AICS applications for one year | Treat Medical and Burial as AICS programs and block another AICS application during the configured cooldown period. |
| Notify residents about AICS eligibility/validation | Show the result and reason at submission, create an in-app notification, and display the next eligible date when blocked. |
| Cross-match household members to avoid duplication | Normalize household-member identities and flag possible matches across AICS applications for staff review. |
| Medical/Burial documents must be submitted within 90 days | Require a hospitalization/checkup or bereavement event date and accept applications only when it falls within the configured 90-day window. |
| Medical/Burial grants range from PHP 1,000 to PHP 4,000 | Validate the approved/released amount server-side and provide the allowed range in the admin UI. |
| Remove quick verify and quick approve | Remove approval shortcuts, including row-level quick approval and bulk approval. Require staff to open and review the case before changing its status. |
| Fix the intake sheet | Map saved application and beneficiary data into the official intake-sheet fields, correct encoding issues, and keep the print layout fixed. |
| Show which requirement was uploaded (Government ID, medical certificate, etc.) | Link every uploaded file to its `application_requirements` row, rather than relying only on a text label. |

## 3. Current-system findings

1. `submitResidentAssistanceRequest` currently blocks a resident if any non-cancelled/non-rejected application exists. This conflicts with applying to different assistance programs.
2. Eligibility restrictions are implemented in client-side service code only. A resident could bypass them with a direct API request, and simultaneous requests could race.
3. Per-requirement uploads currently save `application_requirement_id` as `null` and put the requirement name in `remarks`. This prevents reliable requirement-to-file matching.
4. The admin application page already has a modal file viewer, but documents are separated from requirement rows. Review therefore takes more navigation than necessary.
5. The admin application page contains row-level “Quick approve” and bulk approval, both of which bypass a complete case review.
6. Requirement configuration in Settings uses stacked cards rather than the requested table layout.
7. The data model has a household size and a JSON family composition snapshot, but it does not have stable household/member identity records suitable for cross-application matching.
8. The intake-sheet generator has blank beneficiary fields and visible character-encoding defects in currency/dash symbols.
9. Notifications already exist, so AICS result and eligibility messages can extend the current notification system.

## 4. Recommended delivery phases

### Phase 0 — Confirm policy and baseline (1–2 days)

- Confirm whether “once a year” means a rolling 365-day period or one application per calendar year.
- Confirm whether Medical and Burial share one AICS cooldown or have separate cooldowns.
- Confirm which prior status starts the cooldown: submitted, approved, completed, or released.
- Confirm whether the restriction applies to the applicant, beneficiary, every household member, or a combination.
- Confirm whether the “one-week validation” means notification visibility for seven days, a seven-day review SLA, or an application window.
- Confirm the PHP 1,000–4,000 rule and authorized override process.
- Capture the official fixed intake-sheet template and required signatories.
- Create anonymized test scenarios from current records and back up the production database before migrations.

**Exit criterion:** OMSWD signs off a short policy matrix used by both the database and UI.

### Phase 1 — Data integrity and eligibility engine (3–5 days)

- Add program policy fields, preferably in a dedicated `assistance_policies` table: program group, cooldown days, event-window days, minimum amount, maximum amount, and effective dates.
- Add application fields for beneficiary identity, event type/date, eligibility result, eligibility reason, next eligible date, approved amount, and policy version.
- Create stable `households` and `household_members` records. Preserve the submitted family composition as an immutable application snapshot.
- Add a database function/RPC such as `submit_assistance_application(...)` that performs eligibility checking and insertion in one transaction.
- Enforce the AICS cooldown at the database layer, not only in React.
- Return structured decisions: `eligible`, `blocked_exact_match`, or `flagged_possible_household_match`.
- Resolve the seeded `application_requirements` rows first, then write each upload with its actual `application_requirement_id`.
- Add indexes for resident, beneficiary, program group, event date, submitted date, normalized member name, birth date, and address/household identifiers.
- Log policy decisions and admin overrides in the audit log.

**Exit criterion:** Direct API calls and concurrent submissions cannot bypass confirmed AICS rules, while a resident can still apply to an unrelated eligible program.

### Phase 2 — Resident application and notification flow (3–4 days)

- Replace the account-wide duplicate check with a preflight eligibility check for the selected service.
- Explain the applicable rule before submission: AICS frequency, 90-day document/event window, and assistance range.
- Add event date and beneficiary/household fields required by the approved policy.
- Prefill known resident and household data while allowing controlled updates.
- Display an inline eligibility result. A blocked submission must show the matched rule and exact next eligible date without exposing another resident’s information.
- Create in-app notifications for submission receipt, eligibility validation, correction requests, approval/rejection, and next eligibility.
- If “one-week validation” means a deadline, add a visible seven-day countdown and reminder notifications.
- Show uploads grouped by named requirement in the resident dashboard.

**Exit criterion:** Residents understand why an application is accepted, flagged, or blocked, and can apply to other programs when allowed.

### Phase 3 — Admin review workspace (3–5 days)

- Remove row-level “Quick approve,” bulk selection, bulk approve, and any remaining quick-verify action.
- Keep the application table as the queue, but require “Open review” before a final status change.
- Redesign the review workspace into clear sections: applicant/beneficiary, eligibility warnings, requirements and files, intake sheet, notes/history, and final decision.
- Put requirements in a compact table with columns for requirement, required/optional, uploaded files, status, remarks, and action.
- Show thumbnail previews for images and embedded previews for PDF/image files in the same workspace. Retain download/open fallback for unsupported formats.
- Add next/previous document controls and clearly label uploads, for example “Government ID” and “Medical Certificate.”
- Disable final approval until all mandatory requirements pass, eligibility is resolved, and approved amount is within policy. Allow only authorized, reasoned overrides.
- Record reviewer, timestamp, previous/new state, remarks, and override reason.

**Exit criterion:** There is no approval path that bypasses the full review workspace, and a reviewer can inspect every requirement without navigating to another application page.

### Phase 4 — Requirements administration and intake sheet (2–4 days)

- Convert the Settings requirement editor to a sortable table with inline add/edit/remove controls.
- Use controlled document-type values instead of arbitrary text where possible.
- Prevent removal or incompatible changes when historical applications depend on a requirement; use versioning or deactivation instead.
- Map applicant and beneficiary values into all official intake-sheet fields.
- Correct character encoding, date/currency display, government seals/logos, fixed spacing, page breaks, and print CSS.
- Add a print-preview check and compare generated output with the official approved template.

**Exit criterion:** Requirement maintenance is tabular and safe, and the generated intake sheet matches the approved form using saved data.

### Phase 5 — Verification, rollout, and monitoring (2–3 days)

- Add unit tests for eligibility dates, status rules, amount limits, normalization, and matching scores.
- Add database tests for direct API bypass attempts, concurrent submissions, row-level security, and authorized overrides.
- Add end-to-end tests for permitted cross-program applications, blocked repeat AICS applications, 90-day boundary dates, linked uploads, resident notifications, and reviewed approval.
- Test keyboard navigation, screen-reader labels, mobile layout, preview fallbacks, and large files.
- Run data backfill in report-only mode first; review likely household duplicates manually before creating links.
- Release behind feature flags, train staff using a short review checklist, and monitor blocked/flagged rates and review time.

**Exit criterion:** All critical acceptance tests pass, staff approve the workflow, and rollback procedures have been rehearsed.

## 5. Cross-matching design

Use deterministic identity matching for automatic blocking and fuzzy matching only for staff review.

1. Normalize names by trimming spaces, standardizing case, removing punctuation, and separating suffixes.
2. Compare strong attributes: resident/profile ID, government ID hash, birth date, and beneficiary identity.
3. Compare household evidence: household ID, normalized address/barangay, relationship, contact number, and family composition.
4. Automatically block only an exact, policy-defined match within the cooldown.
5. Flag probable matches with a confidence score and matching reasons; do not automatically reject based only on a similar name.
6. Never reveal another household’s personal data to the resident. Show staff only the minimum needed for review.

This approach reduces duplicate assistance without making a fragile or opaque fuzzy-matching algorithm the final decision-maker.

## 6. Minimum acceptance scenarios

| Scenario | Expected result |
|---|---|
| Resident has an active AICS Medical request and applies for a non-AICS program | Allowed if that program’s own rules pass. |
| Resident/covered beneficiary received AICS inside the confirmed cooldown and applies for AICS Burial | Blocked if Medical and Burial share the confirmed AICS policy; show reason and next eligible date. |
| AICS event date is exactly 90 days old | Result follows the signed policy’s inclusive/exclusive boundary and is covered by an automated test. |
| AICS event date is older than 90 days | Blocked with a clear explanation. |
| Requested/approved amount is below PHP 1,000 or above PHP 4,000 | Rejected by server validation unless an authorized policy override exists. |
| Same household member appears with minor spelling differences | Flagged for admin review with matching reasons; not silently auto-rejected. |
| Admin opens an application | Every uploaded file appears under the correct named requirement and previews in the workspace when supported. |
| Admin tries to approve with a missing required document | Approval is disabled and the missing items are identified. |
| User calls Supabase directly to bypass the UI rule | Database transaction rejects the ineligible submission. |

## 7. Suggested implementation order

1. Obtain policy sign-off.
2. Add database schema, transactional eligibility function, and audit trail.
3. Fix requirement/file linkage.
4. Replace resident duplicate validation and add eligibility messaging.
5. Remove shortcut approvals and rebuild the admin review workspace.
6. Convert requirement settings to a table and fix the intake sheet.
7. Backfill, test, train, and release progressively.

Estimated implementation effort after policy confirmation: **13–21 working days**, excluding stakeholder review, production data cleanup, and formal user-acceptance testing.

## 8. Success measures

- Median time from opening a case to completing review.
- Percentage of uploaded files correctly linked to a requirement (target: 100%).
- Number of approvals attempted with incomplete required documents (target: 0 successful bypasses).
- Count of valid cross-program applications previously blocked by the account-wide rule.
- Exact duplicates blocked, possible matches flagged, and false-positive rate after staff review.
- Resident correction/resubmission rate and notification read rate.
- Intake sheets requiring manual correction after generation.
