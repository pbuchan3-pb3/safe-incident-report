# Atlas v2.0.7 - Native Report File Sharing

Frontend-only. Replaces link-style sharing with genuine native file sharing of the
same PDF and Word documents produced by Download.

## File API + Web Share API usage
Share PDF File / Share Word File build a real File object and call
navigator.share({ files:[file] }) after a navigator.canShare({files:[file]}) check.
PDF: application/pdf. Word: application/msword (Atlas generates RTF-based .doc; MIME
labeled accordingly - not mislabeled as DOCX).

## One generator, two destinations
No second renderer. forcePdfDownload() and the new forcePdfBlob() share a single
_pdfConfig() html2pdf configuration, so the shared PDF is byte-for-byte the same
pipeline as the downloaded PDF. generatePDF(isIncident,'share') returns the same
{html, filename}; generateWord(isIncident,'share') returns the same {blob, filename,
mimeType}. Without the 'share' argument both download exactly as before.

## Fallback behavior
If navigator.canShare/share is unavailable or the OS cannot share files, Atlas
downloads the file automatically and shows: "Native file sharing isn't supported on
this device. Your report has been downloaded. Please attach the downloaded file to
your email." A user-cancelled share sheet (AbortError) is treated as a no-op, not an
error. Never silent.

## Filenames
SAFE_Incident_Report_YYYY-MM-DD_HHMM.pdf and .doc (and Recognition_Report for
recognition). No spaces, no parentheses, no random IDs. The Word download filename
was aligned to this timestamped pattern (previously used a random submission ID).

## Supported browsers
Web Share API level 2 (file sharing): Android Chrome, Android Edge, and Samsung
Internet where supported open the native share sheet -> Gmail -> real attachment.
Desktop Chrome/Edge generally lack file-share support and therefore download (the
intended desktop behavior).

## Regression protection (proven)
parseName, cleanWithAI, transcribeAudio, recSendToAI, recProcessTranscript,
recFinalize, mountRecorderCard, mountAssignmentSelector, finalNarrative,
witnessSummary, nameCardHtml, updateProgress - all byte-identical. generatePDF/
generateWord changed only by the added share-mode branch + timestamped filename;
forcePdfDownload changed only to use the shared _pdfConfig(). Worker sha unchanged.
node --check OK; zero browser keys.

## Remaining risk
navigator.share must run in a user-gesture context. The Word blob is synchronous, so
its share is solid. The PDF blob is produced by html2pdf asynchronously after the
tap; on browsers that strictly require an unbroken gesture, the PDF share may fall
back to download (handled gracefully with the message above). Worth confirming on the
target Android devices; Word sharing is the most reliable path.

## Android manual checklist
Share PDF File -> share sheet -> Gmail -> real .pdf attached; Share Word File -> real
.doc attached; unsupported browser -> auto-download + message; Download PDF/Word
produce identical files to the shared ones; desktop downloads; recorder,
entity-aware narrative, reassignment, and Word encoding all still correct.
