# S.A.F.E. Management — Incident Reporting System
Semantic versioning: MAJOR.MINOR.PATCH.

## [2.0.1] — Mobile Recorder Reliability
- Android: no simultaneous SpeechRecognition (silent MediaRecorder-only capture);
  no auto-restart loop (removed the recurring 5-7s system beep).
- Dual-channel messaging: transcription failure never implies the audio failed.
- Recorder diagnostics under ?debug=1; ?srtest=1 recognition-only probe.

## [2.0.8] — Conversational Refinement + Adaptive Recognition
- Name confirmation cards (shared nameCardHtml, used for every person) now read
  "First Name / Middle Name / Last Name / Suffix" and ask "Does this look
  correct?"; empty components still suppressed.
- Recognition interview personalizes prompts with the confirmed employee name via
  a shared empRef() helper (reuses isConfirmedPersonName): "Tell me what
  <Name> did that deserves recognition..."; never exposes Unknown/Refused.
- Adaptive recognition beneficiary step: "Who benefited from what <Name> did?"
  (Guest(s)/Employee(s)/Team/Supervisor/Event Operations/Multiple Groups/Other/
  Not Applicable). The guest-count question is asked ONLY when Guest(s) is
  selected; otherwise skipped. No fabricated values.
- Recorder failure vs editorial rejection: when the AI can't produce a report
  from spoken words, Atlas now says "I couldn't understand enough of the
  recording to prepare a report." with Re-record / Review the transcript / Type
  it instead. The raw transcript is preserved and editable, never discarded.
- Shared-infrastructure discipline: reused nameCardHtml, isConfirmedPersonName,
  mountRecorderCard; no duplicated renderers or business logic.
- Byte-identical: recorder, Worker, Whisper, assignment selector, name parser,
  entity-aware renderer, PDF, Word, exports, Field Mode. Worker unchanged.
- Deferred to v2.0.9: interview-wide confirmed-name prompts (guest/witness across
  the incident flow) via a generic personRef(role) helper — sequenced to avoid
  prompt drift while converting many static prompts to name-aware ones.

## [2.0.7] — Native Report File Sharing
- Share PDF File / Share Word File now share the ACTUAL generated file via the Web
  Share API (navigator.share({files:[...]})) - Gmail and other apps receive the
  real .pdf/.doc attachment, not an Acrobat/GitHub/blob link.
- One generator, two destinations: forcePdfDownload and the new forcePdfBlob share
  a single _pdfConfig(); generatePDF/generateWord gained a _mode==='share' branch
  that returns the same html/rtf artifact instead of downloading. Content is
  unchanged (byte-identical bodies aside from the share branch).
- Real File objects: application/pdf and application/msword (current RTF-based .doc).
- Graceful fallback when files can't be shared: auto-download + "Native file
  sharing isn't supported on this device. Your report has been downloaded. Please
  attach the downloaded file to your email." (never silent).
- Professional timestamped filenames, no random IDs:
  SAFE_Incident_Report_YYYY-MM-DD_HHMM.pdf/.doc (Word aligned to the PDF pattern).
- All existing buttons retained (Download PDF/Word, Submit/Email). Desktop keeps
  downloading. Recorder, transcription, entity-aware wording, reassignment,
  clothing recorder, Word encoding, and the Worker all unchanged/byte-identical.

## [2.0.6] — Entity-Aware Reporting + Soft Data Consistency
- Verified names now appear with role descriptors in generated report wording via
  a shared, deterministic, quote-protected render layer (no AI synthesis, no fact
  drift): confirmedGuestIdentity(), isConfirmedPersonName(), protectQuotedSegments(),
  renderFirstReference(), finalNarrative(), guestStatementRendered().
- Incident narrative: first non-quoted generic reference becomes e.g. "The female
  guest, Chartel Ross, ..."; later references keep generic/last-name wording.
  Idempotent (never double-inserts). Unknown/Refused never render as a name.
- Quote protection: text inside straight or curly quotation marks is never
  altered; names are never inserted into a direct quote.
- Witness output: "The witness, <Name>, stated: <quote>" / "...did not provide a
  statement." / unnamed -> "The <type> witness ...". witnessStatement grammar-only
  profile unchanged; raw statements preserved.
- Guest statement: "The guest, <Name>, stated: <their words>" lead-in; wording
  preserved; status values pass through unchanged.
- Consistent wording across review, PDF, Word, email, text, and Sheets (single
  finalNarrative()/guestStatementRendered() source); raw + approved fields never
  overwritten.
- Hair color/style soft check: if color is Not Observed/Unknown but a concrete
  style is chosen, a one-time non-blocking prompt (Yes, keep both / Change Hair
  Color / Change Hair Style); never repeats, never clears values.
- generatePDF/generateWord changed only at the narrative + guest-statement lines
  (authorized); all recorder/transcription/parser/selector functions byte-identical.
  Worker unchanged.

## [2.0.5] — Narrative Capture Expansion (clothing recorder)
- Guest-clothing question now mounts the shared recorder (mountRecorderCard) with
  three one-tap options: Record Full Description / Type Instead / I don't recall.
  Reuses the existing backend transcription pathway; no second recorder; Android
  no-beep and duration behavior inherited unchanged.
- New narrowly-scoped clothingDescription editorial profile: grammar, spelling,
  punctuation, garment terminology and ordering only. Never infers brand, color,
  material, team, logo, footwear, gender, or intent; preserves uncertainty.
- I don't recall stores the standard sentence with no AI call; guestClothingRaw /
  guestClothing / guestClothingStatus (provided | not recalled) preserved.
- Confirmation after typed/recorded input: Looks Correct / Edit / Re-record /
  I don't recall; Edit routes through the existing re-clean prompt.
- Name-aware prompt was already driven by guestRef() (the guest / last name /
  full name; never "Unknown"/"Refused").
- Deferred to v2.0.6 (documented): entity-aware narrative/witness/guest wording
  (role-plus-name) and the hair color/style soft-confirmation. These are
  fact-sensitive editorial changes and are sequenced as their own verified pass.
- Worker unchanged; recorder, transcription, exports, reassignment, Field Mode,
  name-card, Word repair all byte-identical.

## [2.0.4] — Structured Reassignment
- Reassignment now reuses the shared grouped assignment selector (new reusable
  mountAssignmentSelector({mode/prompt/selectedValues/onConfirm})) instead of a
  free-text box. Prompt: "Which assignment(s) were you reassigned to?"
- Initial vs. reassigned assignments stored distinctly: assignmentsWorked /
  initialAssignments (initial) and reassignmentAssignments (new); assignmentStatus
  records "Remained..." or "Reassigned". No fabricated timeline text.
- Operational Context, review screen, PDF/Word/email (via operationalContextText),
  and the export payload now show "Initial Assignment(s)" and "Reassigned To"
  separately; assignment values are never labeled "Assignment Timeline".
- Legacy fallback: old assignmentTimeline free-text renders under "Reassignment
  Details" (never relabeled as a timeline).
- Incident location untouched (no cross-contamination). Worker unchanged;
  recorder, transcription, Field Mode, name-card, Word encoding all byte-identical.

## [2.0.2b part 2] — Word Export Repair
- Word/RTF encoding fixed: non-ASCII (em/en dashes, curly quotes/apostrophes)
  now emitted as RTF \uN? escapes — eliminates mojibake (no more "a-euro"
  sequences). "C1-C8" and "Minor - Resolved on scene" render correctly.
- Duplicate header fixed: the centered header now reads the Filed line (date/time)
  instead of repeating "Submission ID:"; body no longer re-renders the title,
  Submission ID, or Filed lines (each appears once).
- Markdown artifacts (** and leading # headings) stripped from Word output.
- generateWord only; generatePDF, recorder, transcription, and all other exports
  byte-identical. Worker unchanged.
- Still deferred (Part 2 remaining): native PDF/Word file sharing (#7/#8),
  structured reassignment picker (#1), entity-aware name rendering (#2-6).

## [2.0.2b] — Mobile Field Experience Completion (partial)
- Mobile Field Mode: after the first substantive answer (progress > 0%), the
  header, timestamp band, Ford Field hero, and progress block collapse on mobile
  (<=640px) into one 56px sticky bar showing "S.A.F.E. Atlas . Ford Field" and
  "<section> . <pct>%" with a thin navy progress line. Fires once per session;
  restored on a new report (startFlow). Desktop unchanged.
- Name confirmation cards omit empty components (no more "Middle: None" /
  "Suffix: None"); shared nameCardHtml() renderer across supervisor, guest,
  employee, and witness cards. parseName() unchanged; status values (Unknown,
  Refused) preserved because they are truthy.
- Floating voice control relocated (mobile Field Mode) to top-right, clear of the
  bottom answer controls (Edit / Looks Correct / Re-record / Send / recorder /
  signature / export); respects safe-area insets.
- No Worker, recorder, transcription, or export changes (all byte-identical).
- Deferred within v2.0.2b: native PDF/Word file sharing (#2), structured
  reassignment picker (#3), Word encoding + presentation (#6/#7). Sequenced as
  export-path and flow increments to avoid regressing the working exports.

## [2.0.2] — Mobile Workflow + Backend Transcription
- Cloudflare Worker v2: added POST /transcribe (Cloudflare Workers AI,
  @cf/openai/whisper-large-v3-turbo) alongside the UNCHANGED Anthropic text
  route. Origin allowlist, MIME allowlist, 20 MB cap, request IDs, generic
  client errors, no audio retention, no wildcard CORS. Backup:
  safe-ai-proxy-worker.v1-backup.js.
- Frontend: transcribeAudio() service (multipart, no manual Content-Type);
  Send Recording uploads audio and routes the returned transcript through the
  field's existing editorial profile; venue-vocabulary hint (initial_prompt).
- Recording duration fix: finalDurationMs computed before the state flips to
  saved (no more 00:00 on nonzero recordings).
- Helper text updated: audio is uploaded for transcription on Send.
- Deferred to v2.0.2b (documented): protected-name confirmation, quick-dictation
  labeling, reassignment picker, floating-voice overlap, native file sharing,
  Field Mode header collapse.

## [2.0.0] — Atlas Visual System (release)

Milestone release. Establishes the enterprise visual foundation on top of the
mature Incident Module (functional core v1.9.12). This is the point from which
all future modules inherit one visual language.

**Visual system (v2.0 + v2.1 + Sprint 1), CSS + static-markup only — interview
engine, Recorder 3.0, AI routing, PDF/Word/email, and the Cloudflare Worker are
unchanged (the inline <script> was byte-identical across the visual sprints; this
release changes only the APP_VERSION string):**
- Reusable design tokens: spacing, radius, elevation, motion timing, color roles.
- Enterprise color hierarchy: SAFE Navy primary, Blue action/progress, SAFE Red
  reserved for destructive/alert only, plus Success/Warning/Neutral.
- Refined cards (soft elevation), buttons (consistent radius, calm press,
  accessible focus), and typography hierarchy.
- Premium Ford Field hero: graduated dark overlay for contrast, one subtle slow
  zoom, static lighting, event-ready [data-event] hook.
- Progress indicator reworked to navy/blue; animates on change only.
- Motion principle adopted — "Motion on Change. Stillness at Rest." — infinite
  ambient loops removed (Design Constitution Principle 12).
- Mobile: larger touch targets, full-row-tappable accordions, iOS input-zoom guard.
- Accessibility: focus-visible rings, prefers-reduced-motion support.
- Dashboard-ready presentation components scaffolded (inert): metric/summary/KPI
  cards, status indicators, chart placeholder, analytics container.
- Header de-versioned (engineering badge replaced with a neutral ops chip).

**Deferred to the next (JS-scoped) sprint, intentionally not in this release:**
- Emoji controls -> single SVG icon family (requires script changes).
- aria-live on the chat window; dynamic hero event/progress data; scroll-collapse
  header; dropping the vestigial Roboto import (it lives inside the PDF/Word CSS
  generator in the script).

## [1.0.0] — Canonical production baseline
- Rebuilt production `index.html` from the verified 3,292-line canonical source
  (strict superset of all prior functionality; zero regressions).
- **Security:** removed hardcoded Anthropic API key fallback. No key ships in
  any committed/browser code.
- Added `.nojekyll` (fixes GitHub Pages serving README via Jekyll).
- Added `.gitignore` (excludes `api-config.js`) and `api-config.example.js`.
- No new application features in this step.

<!-- Next: browser-key architecture decision (server-side proxy) before live
     AI cleanup can run on the public Pages site. Then resume feature backlog. -->

## Documentation — Architectural governance (July 2026)
- Introduced `ATLAS_DESIGN_CONSTITUTION.md` (design philosophy, principles,
  architecture diagram, security architecture, implementation reference) and
  `ADR_LOG.md` (Architectural Decision Records ADR-001 through ADR-007) as part
  of the architectural governance process.
- Added `README.md` linking both governance documents.
- Documentation only — no application, proxy, or runtime behavior changed.
