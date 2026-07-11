# Atlas v2.0.2b — Mobile Field Experience Completion (part 1)

Frontend-only. Continues from the deployed, field-verified v2.0.2 baseline.
**No Cloudflare Worker, recorder, transcription, or export code was changed** —
those functions are proven byte-identical to v2.0.2.

## Delivered this pass (mobile-layout cluster)

**1. Mobile Field Mode (highest priority).** On mobile (`<=640px`), the moment the
first substantive answer lands (progress > 0%), the full header, timestamp band,
Ford Field hero, and Report Progress block are removed and replaced by a single
sticky command bar (~56px) reading `S.A.F.E. Atlas . Ford Field` with
`<section> . <pct>%` and a 2px navy progress line. It fires **once per report
session** (deterministic, not scroll-driven), stays through review/signature/
export, and the full branded header is restored only when a new report begins.
Desktop keeps the full hero (mobile breakpoint only). Safe-area insets respected.

**4. Name confirmation card.** A shared `nameCardHtml()` renderer now omits empty
components — no more `Middle: None` / `Suffix: None`. `Whitney Jones` shows First
+ Last; `Peyton Buchanan III` shows First + Last + Suffix; a middle name shows
only when present. Applied to supervisor, guest, employee, and witness cards.
`parseName()` is unchanged; status values like `Unknown`/`Refused` survive
(they're truthy).

**5. Floating voice-control collision.** In mobile Field Mode the control is
relocated to the top-right, clear of every bottom-anchored answer control (Edit,
Looks Correct, Re-record, Send, recorder buttons, signature, export). Safe-area
aware.

## Exact Field Mode trigger

`updateProgress()` computes `pct = flowIndex / activeFlow.length`. When `pct > 0`
it calls `enterFieldMode()` (once-guarded via `_fieldModeOn`), adding
`body.field-mode`. `startFlow()` calls `exitFieldMode()` so a new report opens
with full branding. The section label is derived from the current step's `key`
via `sectionLabelFor()`.

## Regression protection (proven)

`generatePDF`, `generateWord`, `parseName`, `cleanWithAI`, `recStartSpeech`,
`transcribeAudio`, `recSendToAI`, `recProcessTranscript`, `recFinalize`, and the
`SAFE_AI_PROXY_URL` / `SAFE_TRANSCRIBE_URL` / `TRANSCRIPTION_PROVIDER` constants
are all byte-identical to v2.0.2. Android no-beep guard and the duration fix
remain in place. Worker checksum unchanged.

## Deferred to v2.0.2b part 2 (sequenced, not dropped)

- **#2 Native PDF/Word file sharing** (`navigator.share({files})` + honest
  download fallback, explicit Share/Download/Email buttons).
- **#3 Structured reassignment picker** (reuse the assignment selector; store
  `initialAssignments` / `reassignmentAssignments` distinctly; no invented times).
- **#6/#7 Word export** encoding fix (UTF-8 charset, kill mojibake, de-duplicate
  Submission ID) and professional HTML presentation.

Reason for sequencing: #2/#6/#7 all modify the export path and #3 modifies the
interview flow. Grouping them into their own verified increment keeps the
now-working exports and recorder out of a blind, untestable layout pass.

## Manual Android checklist (this pass)

- New report shows full centered branding at 0%.
- First answer -> branding stack disappears; compact bar appears.
- No hero remains at 50% / 77% / 97%; workspace gains the space.
- Compact bar covers no messages or buttons; desktop branding intact.
- `Whitney Jones` -> First + Last only; `Peyton Buchanan III` -> First/Last/Suffix.
- Voice control never overlaps Edit / Looks Correct / composer / recorder / export.
- Recorder regression: 60s record -> Send -> transcript -> correct profile ->
  reviewable -> nonzero duration -> no beep.
