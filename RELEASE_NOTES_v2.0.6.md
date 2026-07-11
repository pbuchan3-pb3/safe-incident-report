# Atlas v2.0.6 - Entity-Aware Reporting + Soft Data Consistency

Frontend-only. Uses confirmed names naturally in report wording without altering
facts or quotations, and adds a soft hair color/style consistency check.

## Identity-context helper
`confirmedGuestIdentity()` -> { isConfirmed, fullName, lastName, role,
genderDescriptor }. `isConfirmedPersonName()` rejects Unknown / Refused / N/A /
None / Not provided / Last name only, so those never render as names.

## Narrative rendering (deterministic, not AI)
`renderFirstReference(text, id)` inserts "The <descriptor>, <FullName>," at the
FIRST non-quoted generic reference only, and is idempotent (skips if the name is
already present). `finalNarrative(fd)` is the single source consumed by every
output surface. Raw (`incidentDescriptionRaw`) and approved (`incidentDescription`)
are never overwritten; the rendered wording is computed at output.

## Quote-protection approach
`protectQuotedSegments()` splits text into quoted vs non-quoted spans (straight
and curly quotes). Rendering only touches non-quoted spans, so a direct quote such
as "I saw a female guest hit him." is never modified and a name is never inserted
inside quotation marks.

## Witness rendering
`witnessSummary()` now renders "The witness, <Name>, stated: <quote>" (the
witness's own grammar-cleaned words, preserved verbatim inside the quote),
"...did not provide a statement." when empty, and "The <type> witness ..." when no
verified name exists. The witnessStatement grammar-only profile and raw statements
are untouched.

## Guest-statement rendering
`guestStatementRendered()` adds a "The guest, <Name>, stated: " lead-in when a name
is confirmed (else "The guest stated: "), preserving the guest's wording. Status
values (Refused, No statement provided, etc.) pass through unchanged.

## Export consistency
Review, PDF, Word, email, text, and the Sheets payload all draw the narrative from
`finalNarrative()` and the guest statement from `guestStatementRendered()`, so no
surface can disagree. `generatePDF`/`generateWord` were changed only at those exact
insertion lines.

## Hair soft-check
When hair color is Not Observed/Unknown but a concrete style is selected, a one-time
prompt appears: Yes, keep both / Change Hair Color / Change Hair Style. It never
blocks completion, never clears a value, and never repeats (guarded by a flag).

## Regression protection (proven)
parseName, cleanWithAI, transcribeAudio, recSendToAI, recProcessTranscript,
recFinalize, mountRecorderCard, mountAssignmentSelector, standardizeOther,
nameCardHtml, updateProgress, guestStatementText, guestRef - all byte-identical.
generatePDF/generateWord differ only at the narrative + guest lines. Worker sha
unchanged. node --check OK; zero browser keys.

## Verified (logic tests)
- Named -> "The female guest, Chartel Ross, attempted to strike a male guest."
- Unknown / Refused -> generic descriptor, no name.
- Quote untouched; name placed before, not inside, the quote.
- Idempotent (no double name).
- Witness quote preserved; no-statement and unnamed wording correct.

## Android manual checklist
Named guest -> narrative reads "The female guest, <Name>..."; unknown -> generic;
witness reads "The witness, <Name>, stated: ..."; a direct quote is unchanged in
PDF/Word/email/text; hair soft-check appears once and never blocks; recorder,
clothing recorder, reassignment, and exports still work.
