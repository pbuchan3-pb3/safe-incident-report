# Atlas v2.0.4 — Structured Reassignment

Narrowly scoped, frontend-only. Replaces the free-text reassignment question with
the existing structured assignment selector.

## Shared selector refactor
The inline assignment picker was extracted into a reusable
`mountAssignmentSelector({ selectedValues, help, summaryLabel, onConfirm })`
driven by the same `VENUE_CONFIG` / `ASSIGNMENT_CONFIG`, accordion UI, multi-select,
Other + `standardizeOther` flow, and selected-summary. Both the initial-assignment
step and the reassignment step call it — no second hardcoded list.

## New data fields
- `formData.assignmentsWorked` / `formData.initialAssignments` — initial (unchanged
  backward-compatible field, plus a clear alias).
- `formData.reassignmentAssignments` — structured reassignment values.
- `formData.reassignmentOthers` — raw/standardized "Other" entries (auditable).
- `formData.assignmentStatus` — "Remained in the assigned position(s) for the
  entire shift." or "Reassigned". No invented times or sequence.

## Legacy fallback
Old reports with `assignmentTimeline` free-text render under "Reassignment Details"
and are never relabeled as a timeline.

## Review + exports
Operational Context card, review screen, and `operationalContextText()` (shared by
PDF, Word, and email) plus the export payload now show "Initial Assignment(s)" and
"Reassigned To" distinctly. Incident location is untouched.

## Regression protection (proven)
`generatePDF`, `generateWord`, `parseName`, `cleanWithAI`, `transcribeAudio`,
`recSendToAI`, `recProcessTranscript`, `recFinalize`, `nameCardHtml`,
`updateProgress`, `standardizeOther` — all byte-identical. Worker sha unchanged.
`node --check` OK; zero browser keys.

## Verified (logic tests)
- One reassignment -> "Initial Assignment(s): Gate A / Reassigned To: Gate B".
- Remained -> "Assignment Status: Remained...".
- Multiple -> "Reassigned To: Field Access, Stage Pit".
- Legacy -> "Reassignment Details: Moved to Gate B after halftime."
- No time words introduced anywhere.
