# Atlas v2.0.9 — Recognition Intelligence and Interview Refinement

**STATUS: STAGED CANDIDATE — FIELD VERIFICATION PENDING. NOT PRODUCTION-APPROVED.**
v2.0.8 remains the production version while its Android field verification is
reviewed. Deploy v2.0.9 only after v2.0.8 results are accepted.

## Recognition configuration structure
`RECOGNITION_CATEGORY_CONFIG` maps each category to its follow-up and capability
flags. Generic helpers — `recognitionUsesGuestCount()`, `recognitionUsesBenefitQuestion()`,
`recognitionUsesLeadershipQuestions()`, `recognitionUsesSafetyQuestions()`,
`buildRecognitionInterview()` — read the config. A new category is one config entry;
no new interview engine, no scattered conditionals.

## Category branching (verified)
Guest Service → "how many guests benefited?" (guest count). Teamwork → "Who
benefited?" (no auto guest count). Leadership → leadership behavior. Safety →
unsafe condition prevented. Initiative → responsibility accepted. Professionalism
→ professional behavior. Other → none. Supervisors only see relevant questions.

## Structured behavior model
16-option multi-select (`OBSERVED_BEHAVIOR_OPTIONS`) → `recognitionObservedBehaviors[]`
(structured) plus a joined `recognitionObservations` string for backward-compatible
exports. "Other" collects supporting text. Unselected behaviors are never inferred.

## Beneficiary + guest-count logic
`recognitionBeneficiary` / `recognitionGuestCount` preserved. Guest count asked only
when the beneficiary path includes guests. No fabricated or default counts.

## Dynamic names
`empRef()` (built on `isConfirmedPersonName`) personalizes recognition prompts; the
witness prompt uses the confirmed witness name. Unknown/Refused/None/N/A never
render as names. `parseName()` untouched.

## Recommendation workflow
Optional single-select; "Skip"/empty omits the section from every export. Never
implies HR approval.

## Empty-section suppression
Additional Observations, Additional Comments, Recommendation, and beneficiary/count
are omitted when empty or "None"/"N/A" across text, PDF, and Word. Required
operational/audit fields are never suppressed.

## Export changes
Recognition beneficiary, guest count, category, recommendation, and observed
behaviors render through the EXISTING text/PDF/Word/Sheets paths — no second
renderer, no layout redesign. generatePDF/generateWord changed only inside the
recognition block.

## Narrative rules
Editorial guidance passed as CONTEXT to the existing employeeRecognition profile
(profile unchanged): make clear what happened, why exceptional, how it helped
operations, positive result — factual, no exaggeration or invention. Raw input and
approved narrative remain separate.

## Regression results (proven)
20 locked functions byte-identical: parseName, cleanWithAI, transcribeAudio,
recSendToAI, recFinalize, recProcessTranscript, mountRecorderCard,
mountAssignmentSelector, finalNarrative, witnessSummary, confirmedGuestIdentity,
isConfirmedPersonName, guestRef, forcePdfBlob, shareReportFile, forcePdfDownload,
updateProgress, nameCardHtml, operationalContextText, standardizeOther.
generatePDF/generateWord differ only in the recognition block. Android no-beep
preserved. Worker sha unchanged. node --check OK; zero browser keys.

## Remaining risks
- Reassignment-awareness (scope item 7) is satisfied structurally: guest-impact
  questions are gated on recognition category, so a "covered another assignment"
  recognition (Teamwork/Initiative) never asks guest count. There is no separate
  cross-check against the incident reassignment state because recognition and
  incident are distinct flows; if a future combined flow needs it, add a config flag.
- The category→follow-up is one question per category by design; multi-question
  categories would extend the config's followUp to an array (clean future change).
- Not yet exercised on a physical device — staged pending field verification.
