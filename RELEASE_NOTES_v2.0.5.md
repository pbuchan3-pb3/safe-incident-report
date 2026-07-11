# Atlas v2.0.5 — Narrative Capture Expansion (clothing recorder)

Frontend-only. Adds the shared recorder to the guest-clothing field and a scoped
clothing editorial profile. The fact-sensitive entity-aware naming work (directive
sections 6-11) and the hair soft-check (section 12) are sequenced to v2.0.6.

## Clothing-recorder integration
The guest-clothing step now presents Record Full Description / Type Instead /
I don't recall. "Record" calls the existing mountRecorderCard('guestClothing',
'clothingDescription', onComplete) - the same backend-transcription recorder used
for the incident narrative, so audio preservation, nonzero duration, and the
Android no-beep behavior are inherited, not reimplemented. "Type Instead" cleans
via the clothing profile and shows a confirmation. "I don't recall" is one tap.

## Clothing editorial profile
clothingDescription: grammar/spelling/punctuation, standard garment terminology,
sensible ordering, filler removal. It must NOT add brand, color, material, team,
logo, footwear type, gender, or intent, and must preserve uncertainty. Facts are
never added.

## Data preserved
guestClothingRaw (verbatim), guestClothing (cleaned), guestClothingStatus
(provided | not recalled). Recorder path also preserves recordingBlob /
transcriptRaw / transcriptEdited / duration via the shared engine.

## I don't recall
Stores exactly "The reporting supervisor could not recall the guest's clothing."
with no AI call and no fabricated description.

## Regression protection (proven)
generatePDF, generateWord, parseName, cleanWithAI, transcribeAudio, recSendToAI,
recProcessTranscript, recFinalize, mountRecorderCard, mountAssignmentSelector,
standardizeOther, askRecleanAfterEdit, nameCardHtml, updateProgress - all
byte-identical. Existing editorial profiles (incidentReport, witnessStatement,
employeeRecognition) byte-identical; clothingDescription appended. Worker sha
unchanged. node --check OK; zero browser keys.

## Deferred to v2.0.6 (sequenced, not dropped)
- Entity-aware wording (role-plus-name) in the incident narrative, witness section,
  and guest statement (sections 6-11), including quote-vs-paraphrase preservation
  and final-synthesis timing. This alters generated narrative text and must not
  change facts or quotations - it warrants its own fact-safety-focused pass.
- Hair color/style soft-confirmation (section 12).

## Android manual checklist (this pass)
- Clothing question shows Record / Type / I don't recall.
- Record 20s -> transcript returns -> cleaned via clothing profile -> confirm.
- Cleaned text adds no brand/color not spoken; uncertainty preserved.
- I don't recall -> standard sentence, no transcription request.
- guestClothingRaw and guestClothing both stored.
- Incident-narrative recorder, witness, reassignment, exports still work.
