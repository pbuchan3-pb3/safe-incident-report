S.A.F.E. Incident Report — Testing Guide
Overview
This project uses a two-layer testing strategy:
Automated regression suite — pure JavaScript logic tests that run in Node.js in under one second. Run these after every change before uploading to GitHub.
Manual pre-deployment checklist — UI, voice, camera, signature, and share behaviors that require a real browser and phone to verify. Run these before any deployment that touches the user-facing flow.
---
Automated Tests
Location
```
tests/
  safe_regression_suite.js   — the test runner (69 checks across 9 suites)
  app_logic.js               — extracted app functions under test
  package.json               — npm test script
```
Requirements
Node.js 16 or later (`node --version` to check)
No additional packages required
How to run
From the project root:
```bash
cd tests
node safe_regression_suite.js
```
Or using npm:
```bash
cd tests
npm test
```
How to interpret results
Each check prints either `✅` (pass) or `❌` (fail) with a description.
```
✅ Migration does not crash when formData.people is undefined
❌ Migrated name correct — expected "Chartel Ross", got undefined
```
The final summary shows total pass/fail count and a clear go/no-go line:
```
✅ ALL TESTS PASSED — safe to deploy
```
or
```
❌ FAILURES DETECTED — do not deploy until fixed
```
The process exits with code `0` on full pass and `1` on any failure, so it works in CI pipelines and pre-commit hooks.
When a test fails
Read the failure label carefully — it names exactly what broke.
Open `safe_incident_form_24.html` and find the function the test is checking.
Fix the logic in the app file.
Re-extract `app_logic.js` by running the extraction script (see below).
Re-run the suite and confirm all 69 checks pass before uploading.
Re-extracting app_logic.js
`app_logic.js` is generated from `safe_incident_form_24.html`. After any change to the app's core logic functions, regenerate it:
```bash
python3 extract_logic.py
```
Or run the extraction block manually from `extract_logic.py` (see that file for details). The functions extracted are: `escapeHtml`, `ROLE_CATEGORIES`, `SUBJECT_ROLES`, `WITNESS_ROLES`, `newPerson`, `formData`, `migrateLegacyGuestToPeople`, `getSubjectPeople`, `getWitnessPeople`, `correctKnownNames`, `generateAnalyticsTags`.
---
What Each Suite Validates
Suite 1 — escapeHtml / XSS Prevention (9 checks)
Verifies that user-typed and voice-transcribed content is HTML-escaped before being inserted into the chat UI or PDF. Tests `<`, `>`, `&`, `"`, null/undefined inputs, numbers, and a full XSS payload. This directly guards against the stored XSS vulnerability identified in the June 2026 security audit.
Suite 2 — Data Model Integrity (7 checks)
Verifies the people array data model: that all 8 role categories are present, that subject and witness role lists don't overlap, that `newPerson()` returns an object with all 18 required fields, that `photoDataUrls` initializes as an empty array, and that each new person gets a unique ID even under rapid successive calls.
Suite 3 — getSubjectPeople / getWitnessPeople Filtering (4 checks)
Verifies that the two filter functions that drive all PDF and report card rendering correctly separate people by role. Also tests that both functions return an empty array gracefully when `formData.people` is `null` or `undefined`, which would otherwise crash every render path.
Suite 4 — migrateLegacyGuestToPeople() (16 checks)
The most comprehensive suite — covers the backward-compatibility migration that converts old single-guest reports (saved before the structured people rebuild) into the new people array format. Verifies: crash-safety when `formData.people` is undefined, correct field mapping for all appearance fields, roleCategory defaulting (Subject for regular incidents, Employee for misconduct), photo preservation, idempotency (calling twice doesn't duplicate), no-op behavior when nothing to migrate, and the Employee Misconduct legacy path.
Suite 5 — correctKnownNames() (8 checks)
Verifies name auto-correction logic that fixes voice-to-text misspellings (like "Chartell" → "Chartel") before text is sent to AP Style rewriting. Tests double-letter correction, case normalization, multi-person name arrays, graceful handling of empty input, no corruption of unrelated words that happen to contain name substrings, and the exact real-world failure case from a live June 2026 report.
Suite 6 — Analytics Tag Generation (8 checks)
Verifies that the analytics tagging function correctly derives tags from structured form data: incident category, gate number extraction from location strings, severity tier conversion, identified-subject detection, camera footage flags, and day-of-week tagging. Also tests graceful handling of empty formData.
Suite 7 — Structured People Scenarios (10 checks)
The core correctness suite — runs all 10 structured people scenarios end-to-end against real logic:
#	Scenario	What it verifies
1	One subject, no witnesses	Subject populated, witness section empty
2	One subject, one witness	Zero cross-contamination between sections
3	Aggressor, victim, witness	Three-party incident correctly split
4	Same name, dual role confirmed	Both sections populated only when explicitly confirmed
5	Unknown subject, known witness	Unknown name handled without breaking categorization
6	Witness only, no subject	Subject section correctly empty
7	Employee Misconduct	Employee role lands in subject section with position preserved
8	Medical — patient and witness	Victim role correctly classified
9	Unauthorized Access, no seat	Blank seat field suppressed correctly
10	Legacy draft migration	Old format correctly converted, person in right section
Suite 8 — Flow Logic Edge Cases (4 checks)
Verifies the ambiguity detection logic that fires when the same name is entered twice with different roles. Tests: duplicate name detection, case-insensitive matching, exclusion of "Unknown" from deduplication logic, and single-role resolution updating in place without creating duplicates.
Suite 9 — Backward Compatibility (3 checks)
Verifies that filter functions return empty arrays rather than throwing when called on an empty people array, and that unique IDs remain unique across 10 rapid successive `newPerson()` calls.
---
Manual Pre-Deployment Checklist
Run these on a real phone (iOS and Android if possible) before every production upload to GitHub Pages. These behaviors cannot be automated from Node.js.
Form Flow
[ ] App loads at `https://pbuchan3-pb3.github.io/safe-incident-report/Index.html`
[ ] Name capture: type first name only, then last name — confirm "Peyton Buchanan" assembled correctly with no duplication
[ ] Name capture: type full name in the first field (e.g. "Whitney Jones"), type last name again in second field — confirm "Whitney Jones Jones" does NOT appear
[ ] Voice input: tap mic, speak a full sentence — confirm transcript appears in input field (not auto-submitted)
[ ] Incident category selection: tap each category once to confirm the correct follow-up questions appear
[ ] Camera zone: tap "Yes — captured on surveillance", confirm next question shows camera zone with "Unknown / Not confirmed at this time" tap option
People Loop
[ ] Add one subject — confirm appears under Subjects / Involved Parties in live report
[ ] Add one witness — confirm appears under Witnesses section, not Subjects
[ ] Add same name twice with different roles — confirm app asks "Was [name] [role A], [role B], or both?" and does not auto-assign dual role
[ ] Enter a witness statement with a deliberately misspelled subject name (e.g. "Chartell") — confirm AP Style rewrite corrects to "Chartel"
[ ] Skip appearance questions for a witness — confirm "Skip — name and role only" option works
Signature
[ ] Tap canvas without drawing — confirm "Please provide a complete signature" alert fires
[ ] Draw a real signature — confirm it accepts and captures correctly
[ ] Check filing timestamp on the final report — confirm it reflects the time of signing, not the time the page loaded
PDF and Export
[ ] Download PDF — confirm Subjects section shows person cards with role labels, Witness section is separate
[ ] Confirm photo embeds in PDF with "Captured:" and "By:" metadata caption
[ ] Confirm Incident Breakdown table (Observed / Statement / Officer Action / Outcome) appears
[ ] Confirm Recommendation field appears (or "No recommendation" if skipped)
[ ] Confirm `window.onload=()=>{window.print();}` does NOT appear as visible text on the last page of the PDF (it should be in a script tag only)
Share and Submit
[ ] Tap "Share Report (with file attached)" — confirm file is attached in the share sheet, not empty
[ ] Tap "Save to Records & Email Text Summary" — confirm email opens with text body (no attachment expected — this is correct behavior)
[ ] Submit while offline — confirm warning message appears and Retry button is shown
[ ] Submit while online — confirm "✅ Report saved" status appears
Draft and Resume
[ ] Start a report, close the tab, reopen — confirm "Unfinished Report Found" prompt appears
[ ] Resume draft — confirm flow picks up at the right question
[ ] Discard draft — confirm form resets cleanly
Edge Cases
[ ] Submit report twice by double-tapping — confirm second tap is blocked
[ ] Type `<script>alert(1)</script>` into a free-text field — confirm it displays as literal text, not as an alert
[ ] Upload a photo, complete report, check PDF — confirm photo appears embedded (not just "1 photo attached")
---
Adding New Tests
When you build a new feature:
Add the relevant pure-logic function to the extraction list in `extract_logic.py`
Re-run extraction to update `app_logic.js`
Add a new `section()` block in `safe_regression_suite.js` with at minimum: a happy-path check, an edge-case check, and a graceful-failure check
Run the full suite — all existing checks must still pass
Add corresponding manual checklist items above for any new UI behavior
The rule from the implementation roadmap applies here: do not consider work complete until all regression tests pass.
---
Test File Maintenance
File	Update when
`safe_regression_suite.js`	Adding features, fixing bugs, or changing logic
`app_logic.js`	Anytime `safe_incident_form_24.html` logic changes — re-extract, do not edit manually
`package.json`	Only if Node version requirements or scripts change
`TESTING.md`	After adding new suites or changing deployment procedures
