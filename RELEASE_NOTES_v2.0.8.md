# Atlas v2.0.8 - Conversational Refinement + Adaptive Recognition

Frontend-only conversational polish. Reuses existing shared infrastructure
(nameCardHtml, isConfirmedPersonName, mountRecorderCard) rather than duplicating.

## Name confirmation cards (item 1)
The single shared renderer now labels First Name / Middle Name / Last Name /
Suffix and asks "Does this look correct?". Empty components stay suppressed. One
change applies to supervisor, guest, witness, employee, and every future person.

## Confirmed names in recognition (items 2/5)
A shared empRef() helper (built on isConfirmedPersonName) returns the confirmed
employee name or a neutral "this employee" fallback, and personalizes the
recognition prompts. Unknown/Refused/N/A never surface as names.

## Adaptive recognition beneficiary (item 4)
After the recognition narrative, Atlas asks "Who benefited from what <Name> did?"
with eight options. "Approximately how many guests were assisted?" is asked ONLY
when Guest(s) is chosen; otherwise it is skipped. No default counts.

## Recorder failure vs editorial rejection (item 3)
Transcription failure (empty audio) and editorial rejection (words captured but
not reportable) are now distinct. When the editor can't produce a report from the
words, Atlas says "I couldn't understand enough of the recording to prepare a
report." and offers Re-record / Review the transcript / Type it instead. The raw
transcript is preserved and editable - never discarded.

## Regression protection (proven)
generatePDF, generateWord, parseName, cleanWithAI, transcribeAudio, recSendToAI,
recFinalize, mountRecorderCard, mountAssignmentSelector, finalNarrative,
witnessSummary, confirmedGuestIdentity, isConfirmedPersonName, guestRef,
forcePdfBlob, shareReportFile, updateProgress - all byte-identical. Only
nameCardHtml (item 1) and recProcessTranscript (item 3) changed, plus the
recognition-flow additions. Android no-beep and duration preserved. Worker sha
unchanged. node --check OK; zero browser keys.

## Deferred to v2.0.9
Interview-wide confirmed-name prompts across the incident flow (guest/witness),
via a generic personRef(role) helper. Deferred deliberately: converting the many
static incident prompts to name-aware ones should be one consistent helper-driven
sweep, not a scattered partial edit, to honor the single-engine architecture.

## Manual checklist
Name card shows First Name/Last Name + "Does this look correct?"; recognition
prompts use the employee's confirmed name; "Who benefited?" gates the guest-count
question; a garbled recording yields the friendly re-record/review/type options
with the transcript preserved; recorder, PDF, Word, and desktop all unchanged.
