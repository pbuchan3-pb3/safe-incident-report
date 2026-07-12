# Atlas Architecture Review — CTO Assessment

**Scope:** Full architectural review of Atlas as of v2.0.7 (5,115-line single-file
application + 1 Cloudflare Worker), evaluated against the stated vision: an AI
interview engine replacing structured forms across industries, prepared for
Series A, federal contracts, Fortune 100, and international deployment.

**Stance:** This review is deliberately adversarial toward our own decisions. It
is not a celebration of the v2.0.x arc. Where the truth is uncomfortable, it is
stated plainly.

---

## 0. Inventory Truth (read this first)

Before scoring, one correction to the brief. The "current architecture" list
includes several items that do not exist yet:

- **Multi-person engine** — does NOT exist. Guest/witness data lives in ad hoc
  `formData` fields plus `witnessList[]`. The People Engine is planned, not built.
- **Offline capability** — a roadmap item. Today, a dropped connection mid-report
  loses the transcription pathway (audio is preserved; the session is not).
- **Operational dashboards / Training platform / Knowledge engine** — planned.
  CSS scaffolding for dashboard components exists (inert); nothing else.
- **Structured evidence capture** — partially true (photos, audio blobs, seat
  parsing, structured assignments); there is no evidence chain-of-custody model.

A CTO who lets the deck say "multi-person engine" when it's five formData fields
will eventually present that deck to a federal procurement officer. We don't
inflate the inventory. Everything below evaluates what actually exists.

---

## 1. Executive Assessment

Atlas is a **strong product with a pre-platform architecture**. The product
instincts are genuinely excellent — conversation-first capture, fact/editorial
separation, raw-data preservation, human-approval-before-lock, honest
dual-channel status, deterministic (not AI) fact-sensitive rendering. Several of
these instincts are *better* than what I see in mature enterprise incident tools,
which are mostly forms with lipstick.

But the implementation is a 5,115-line single HTML file with 148 functions
sharing one global scope, one mutable `formData` object, an index-based flow
array with ad hoc branch mutations, no automated behavioral tests, no build
system, no server of record, no identity model, and no audit trail. That is not
a criticism of how we got here — single-file was the *right* call for velocity
and field deployability, and the checksum/verification discipline substituted
admirably for missing test infrastructure. But every one of those choices is now
at or past its scaling limit. The next module built directly on this foundation
makes the eventual extraction more expensive, not less.

**The central architectural finding:** Atlas's most valuable asset is not code.
It is the *interview flow knowledge* — the questions, branches, follow-ups,
editorial rules, and validation logic encoded over months of field iteration.
Today that knowledge is trapped as imperative JavaScript inside `askNextQuestion()`
and its branches. The single highest-leverage move is to extract it into a
declarative, versionable question-graph data model. Everything else — multi-
industry packs, the Knowledge Engine, testing, i18n, even the ten-year vision —
becomes tractable once the interview is data. It stays hard while the interview
is code.

**Verdict:** ship-worthy product, pre-Series-A platform. The gap is closeable in
two disciplined quarters without stopping field deployments, because the build
can produce today's single-file artifact as an output while the source becomes a
real system.

---

## 2. Architecture Score

**Platform readiness (against the stated vision): 42 / 100.**

Scored dimensionally: Product/domain design 85. Security fundamentals 65 (no
client secrets, strict CORS, honest key handling — but no auth, no audit, no
rate limiting). AI architecture 55 (provider isolation exists for STT; text
provider hardcoded; prompts unversioned). Data architecture 30 (no schema, no
system of record, no tenancy). Engineering infrastructure 25 (no build, no CI,
no behavioral tests, no environments). Compliance/enterprise 15 (no identity,
no audit trail, no retention policy, no DR).

A 42 is not an insult. Most successful platforms scored a 40 the year before
their platform rewrite; the failures are the ones that scored themselves 80.

---

## 3. Top 25 Strengths

1. Conversation-first product thesis — the core differentiator, and correct.
2. Fact-capture / editorial-writing separation (editorial profile registry).
3. Raw + cleaned dual preservation (`<field>Raw`) — an auditability instinct
   most vendors never develop.
4. Deterministic, quote-protected entity rendering — names woven without AI
   fact drift; quotes provably untouched.
5. Human Judgment Prevails (Constitution P11) — supervisor approves everything;
   the correct liability posture for legal-grade documents.
6. Backend transcription behind a Worker — device-independent, key-safe,
   provider-swappable.
7. Zero secrets in the client, ever — learned the hard way, now enforced by
   verification on every build.
8. Strict origin allowlist; no wildcard CORS; generic error surfaces.
9. Config-driven venue/position/assignment model — the seed of industry packs.
10. Shared-component discipline emerging (recorder, assignment selector,
    name-card renderer, `finalNarrative()` as single render source).
11. Platform-aware capture strategy (Android silent recording vs desktop live
    preview) — engineering humility about real devices.
12. Dual-channel status messaging — audio and transcript never conflated; the
    UX never lies about what failed.
13. Graceful degradation everywhere: transcription fails → audio preserved →
    type instead. No dead ends by design.
14. Governance culture: Constitution, ADR log, CHANGELOG, release notes,
    versioned milestones — rare at this stage and genuinely Series-A legible.
15. Checksum-verified increments — byte-identical proofs substituted for a test
    suite better than most startups' actual test suites.
16. Design system declared as inheritance baseline before module sprawl began.
17. Motion-on-Change principle — a coherent, documented design philosophy.
18. Venue vocabulary injection (`initial_prompt`) — domain-aware transcription.
19. Field Mode — the product understands its user is standing in a stadium.
20. Single-file deployability — zero-infrastructure field distribution.
21. Edge-native backend (Cloudflare) — right long-term substrate, near-zero cost.
22. Session/rollback discipline: Worker v1 backup, documented rollback paths.
23. Honest scope sequencing — risky changes isolated into verified increments.
24. The North Star document — "one conversation → one complete report" is a
    testable product invariant, not a slogan.
25. Cost structure: the entire stack runs on cents. Unit economics at scale are
    already excellent.

## 4. Top 25 Weaknesses

1. 5,115-line monolith; 148 functions in one global scope; no modules, no build.
2. Interview flow is imperative code (index-based array + branch mutations like
   the hair-check's `flowIndex` rewind) — the crown-jewel knowledge is trapped.
3. `formData` is a single untyped mutable global — no schema, no validation
   layer, no versioning of the data object itself.
4. No automated behavioral tests. `node --check` + checksums verify syntax and
   non-change; nothing verifies behavior. One person's phone is the QA lab.
5. No system of record. A signed legal document's canonical home is a Google
   Sheets payload and the user's Downloads folder.
6. No identity: no auth, no users, no roles, no sessions. Anyone with the URL
   is a supervisor.
7. No audit trail: edits overwrite; there is no append-only event log of who
   changed what when — disqualifying for legal/government use.
8. Signature is a PNG image — visually meaningful, cryptographically meaningless.
   No document hash, no tamper evidence, no chain of custody.
9. Submission IDs are client-generated randoms — collision-possible and
   regenerated per export call (PDF and Word of the same report can differ).
10. Anthropic is hardcoded in the Worker; text-AI provider isolation exists only
    for transcription. No model registry, no fallback provider.
11. Prompts/editorial profiles are inline string literals — unversioned,
    untested, unevaluatable. A prompt regression would be invisible.
12. Runtime CDN dependencies (html2pdf from cdnjs, Google Fonts) — supply-chain
    exposure and guaranteed offline failure.
13. Word export is RTF labeled .doc — serviceable, but not the DOCX enterprises
    and records systems expect; client-side PDF rendering varies by device.
14. Email is `mailto:` — no delivery guarantee, no receipt, no server-side send.
15. No offline story: no service worker, no local session persistence (a page
    refresh mid-interview loses the report), no sync queue.
16. No observability: no error reporting, no metrics, no session analytics —
    field failures are discovered by the founder personally.
17. No rate limiting or abuse protection on the Worker (documented as "if
    available," never implemented).
18. Single-tenant, single-venue in practice; multi-venue is config-possible but
    untested; multi-tenant isolation doesn't exist at any layer.
19. No i18n/l10n — strings hardcoded throughout; the "future multilingual"
    transcription parameter has no UI or content counterpart.
20. Accessibility gaps: no aria-live on the chat, emoji-as-icons persists,
    screen-reader flow untested (deferred repeatedly, correctly, but still open).
21. No environment separation: production is the only environment; every deploy
    is a production deploy tested by real users.
22. No CI/CD: builds are assembled by AI-run Python in a chat session — superbly
    verified, but irreproducible without me.
23. Person data is scattered (guest fields, witnessList, supervisor fields) with
    no unified person model — the People Engine will have to excavate, not extend.
24. The flow engine and the UI are fused: `askNextQuestion()` both decides what
    to ask and renders it — testing logic requires a browser.
25. Key state lives in DOM/closures (quick replies, interceptors) — session
    state cannot be serialized, which blocks offline, sync, and resume.

---

## 5. Technical Debt Assessment

Debt is concentrated in four strata, in ascending cost-to-fix:

**Stratum 1 — Cosmetic (cheap, anytime):** emoji icons, aria-live, CDN vendoring,
string extraction for i18n readiness.

**Stratum 2 — Structural (weeks, before next module):** monolith → modules with
a build that still emits the single-file artifact; typed report schema; state
extracted from DOM/closures into a serializable session object.

**Stratum 3 — Foundational (a quarter, before multi-tenant/industry #2):**
declarative question-graph engine; server of record + append-only event log;
identity/auth; prompt registry with versioning and golden-session evals.

**Stratum 4 — Regulatory (before government/healthcare):** cryptographic document
integrity, retention policies, tenancy isolation, SOC 2 → FedRAMP path, DR.

The compounding rule: every feature built before Stratum 2/3 is paid for twice.
The v2.0.x arc was justified — it fixed field-blocking defects. The People
Engine, built on the current foundation, would not be justified.

## 6. Missing Enterprise Capabilities

SSO/SAML/OIDC; RBAC; multi-tenancy with data isolation; admin console; report
lifecycle states (draft → review → approved → amended, with amendments as new
events, never edits); server-side rendered DOCX/PDF; delivery infrastructure
(real email/webhooks, not mailto); retention and legal-hold; API for records
systems (most enterprises will demand Atlas push into ServiceNow/Salesforce/
their RMS, not replace it); SLAs and status page; data export/portability;
observability stack; environment tiers.

## 7. Missing Government Capabilities

FedRAMP-aligned hosting path (Cloudflare has FedRAMP ambitions; the architecture
must not preclude GovCloud/on-prem); CJIS considerations for law-enforcement
data; NIST 800-53 control mapping; audit immutability (append-only, hash-chained
event log); PIV/CAC auth; Section 508 accessibility (currently failing); records
schedules (NARA-style retention); air-gapped/offline deployment mode; FIPS-
validated crypto for signatures and at-rest data; incident data classification
(CUI handling). None are surprising; all are absent; several dictate data-model
decisions that are cheap now and brutal later.

## 8. Missing AI Capabilities

Provider abstraction for text AI (exists only for STT); model registry with
per-task routing; prompt versioning + regression evals (golden transcripts →
expected outputs); confidence signals surfaced to the user (the North Star's
Confidence Engine); structured-output contracts (JSON-schema'd AI responses
instead of free text); a validation/consistency agent (the hair soft-check is
the hand-built prototype of what should be a general rules engine); retrieval
grounding for the Knowledge Engine; PII redaction as a service; cost/latency
telemetry per AI call; safe fallback chains (provider A → provider B → deterministic).

---

## 9. Comparison Against World-Class Systems

**Salesforce — adopt: metadata-driven platform.** Salesforce's insight is that
the application is *data interpreted by an engine*, not code. Atlas's industry
vision is exactly this: an incident pack, an OSHA pack, an HR pack — each a
bundle of question graphs, schemas, editorial profiles, and compliance rules.
Atlas is weaker here (flow is code); adopting this is the v3.0 thesis.

**ServiceNow — adopt: workflow + audit as first-class.** Every state change in
ServiceNow is a logged, queryable event. Atlas has no event model. Weaker.

**Palantir — adopt: ontology.** Palantir wins federal contracts on data lineage:
every datum traceable to source. Atlas's raw/cleaned preservation is a genuine
seed of this — extend it into full provenance (this value came from this
utterance, cleaned by this prompt version, approved by this person at this time).
Atlas is conceptually aligned, structurally behind.

**Stripe — adopt: API-first with versioning.** Stripe treats its API as the
product and never breaks it. Atlas has no API; when it does, version from day
one. Also adopt Stripe-grade docs culture — the release-notes discipline is
already halfway there.

**Linear — adopt: local-first sync engine.** Linear's offline-capable synced
state is the best model for Atlas's field reality (concrete stadium corridors
kill connectivity). A serializable session + sync queue is the Atlas version.

**Notion — adopt: block/schema data model.** Interview steps as typed data
blocks, composable and renderable by an engine.

**GitHub — adopt: everything-as-code + review gates.** Atlas's governance docs
are strong; its change pipeline (AI-assembled in chat) is irreproducible. Move
the discipline into CI.

**Anthropic/OpenAI — adopt: eval culture.** Model and prompt changes gated by
eval suites. Atlas changes prompts with zero regression detection today.

**Cloudflare — already aligned:** edge-first, cheap, key-isolated. Deepen, don't
change.

**Figma — note, don't adopt yet:** multiplayer CRDT is v10 territory (multi-
officer collaborative AARs), not now.

**Where Atlas is genuinely stronger than all of them:** none of these companies
has a good *conversational structured-capture* engine. Forms with AI sprinkled
on top is the incumbent state of the art. Atlas's interview-first architecture,
fact/editorial separation, and honest field UX are real differentiation — the
product layer is ahead of the market; the platform layer is behind it.

---

## 10. Future AI Readiness

**Provider isolation:** Formalize the Worker into an **AI Gateway** with routes
per capability (`/rewrite`, `/transcribe`, later `/synthesize`, `/validate`),
each backed by a model registry entry (provider, model, prompt version, limits,
fallback chain). The app speaks capabilities, never vendors. Swapping Claude N
for Claude N+2 — or adding a second provider — becomes a registry edit.

**Prompt versioning:** Prompts become data: `profile: clothingDescription@3`,
stored with changelog and eval results. Every AI response is stamped with the
prompt+model version that produced it (this is also the Palantir-style
provenance federal buyers want).

**Editorial profile evolution:** Profiles become declarative policy objects
(allowed transformations, forbidden inferences, tone, person) compiled to
prompts per model family — the current strings are generation 1 of this.

**Agent communication:** When specialized agents arrive (interviewer, editor,
validator, compliance checker), they communicate through the session's
structured state — the typed report object — never through prose handoffs.
Structured state is the contract; models are interchangeable labor.

**Should Atlas become an orchestrator? Yes — it already secretly is.** The
interview engine sequencing questions, routing text through profiles, invoking
transcription, and applying deterministic renderers *is* orchestration with one
model. Naming it, and moving orchestration server-side where it can be logged,
evaluated, and secured, is the honest evolution. The long-term shape: Atlas is
the conductor; models are instruments; the score (question graphs + policies)
is versioned data.

---

## 11. Roadmaps

**Scalability roadmap:** (1) Serializable session state → survives refresh; (2)
server of record (Cloudflare D1/Durable Objects first, Postgres when needed) —
sessions and events, not just final payloads; (3) offline-first: service worker
+ local queue + sync; (4) server-side document rendering (DOCX/PDF) removing
device variance; (5) multi-tenant isolation at the data layer; (6) regional
deployment for international data residency.

**Security roadmap:** (1) Rate limiting + abuse protection on the Worker (now);
(2) auth (start with signed magic links/OIDC, design for PIV/CAC); (3) append-
only, hash-chained event log = tamper-evident audit; (4) document integrity:
hash the rendered report into the record and stamp exports; (5) secrets/
environment separation with staging; (6) SOC 2 controls as engineering habits
now, certification when revenue justifies; (7) data classification + retention
policy documents (cheap, and federal conversations start here).

**Data architecture roadmap:** (1) Typed canonical Report schema — all exports
become renderers of one object (finalNarrative() already points this way); (2)
unified Person model (the People Engine's real deliverable) referenced by role,
not duplicated per field; (3) event-sourced session: the interview is a stream
of answer events; formData becomes a projection; (4) provenance per field
(source utterance, prompt version, approver, timestamp); (5) knowledge layer:
cross-report entity and pattern indexing (the Knowledge Engine), built on the
schema, never on scraped prose.

---

## 12. Recommended Platform Architecture (target state)

Three planes, strictly separated:

**1. Definition plane (data, versioned):** industry packs = question graphs +
report schemas + editorial policies + validation rules + document templates +
vocabulary. Ford Field incident reporting becomes pack #1, not the hardcoded app.

**2. Execution plane (engines, generic):** interview engine (graph walker),
session store (event-sourced, offline-capable), AI Gateway (capability routes,
model registry, prompt versions, evals), rendering service (DOCX/PDF/email from
schema), identity + audit.

**3. Experience plane (clients):** the field web app (still buildable as a
single-file artifact — keep that superpower), future admin console, future
dashboard — all consumers of the same session API and design system.

The Constitution's inheritance rule already governs the experience plane. This
architecture extends the same principle to logic and data.

---

## 13. Vision Milestones

**Atlas v3.0 — "The interview is data" (12–18 months):** source split into
modules with CI producing the single-file field artifact; typed report schema;
declarative question-graph engine executing today's incident flow with zero
field-visible change; session persistence + resume; AI Gateway with versioned
prompts and golden-session evals; auth v1; append-only event log; server of
record; People Engine built on the unified person model. Success test: the
Recognition flow and the incident flow are both *packs*, and a third pack (e.g.
Michigan Post-Event Summary) ships without touching engine code.

**Atlas v5.0 — "The platform has customers" (3–4 years):** multi-tenant SaaS;
industry packs authored via admin tooling (metadata-driven, Salesforce-style);
offline-first sync engine; server-rendered DOCX/PDF with cryptographic stamps;
SSO/RBAC; integrations API (push to RMS/ServiceNow/Salesforce); observability;
SOC 2; first regulated-industry deployments (insurance, corporate
investigations); orchestrated multi-agent pipeline (interviewer/editor/
validator) behind the Gateway.

**Atlas v10.0 — "The operating system for what happened" (8–10 years):**
incident reporting is one application among dozens running on the Atlas engine;
a pack marketplace; cross-report Knowledge Graph powering prevention analytics
("Gate B decisions after 10 PM correlate with X"); government/air-gapped
deployment editions; multilingual field capture; voice-native multi-party
capture (AARs, depositions); Atlas as the system every other record system
ingests from — because Atlas owns the moment of capture, and capture is where
truth enters the record.

---

## 14. If I Were CTO: The First 10 Decisions

1. **Declare a platform pause after the current field-verification cycle:** no
   new modules (People Engine included) until Stratum 2/3 debt is addressed.
   Field fixes continue; foundations get the next two quarters.
2. **Extract the interview into a declarative question graph** — the single
   highest-leverage refactor. Prove it by running today's exact incident flow
   through the new engine with a golden-session diff showing identical output.
3. **Stand up a real repository with CI** whose build emits the current
   single-file artifact. We keep the field superpower and gain reproducibility;
   the chat-assembled build process retires with honors.
4. **Define the canonical typed Report schema** and make every export a
   renderer of it. `finalNarrative()` proved the pattern; finish the job.
5. **Build the golden-session test harness before any further flow changes:**
   recorded interviews replayed headlessly, asserting on the report object and
   rendered documents. This converts our checksum discipline into behavioral
   coverage.
6. **Promote the Worker to an AI Gateway:** capability routes, model registry,
   versioned prompts, per-call telemetry, fallback chains, rate limiting. Text
   AI gets the same provider isolation transcription already has.
7. **Introduce the event-sourced session + server of record** (D1/Durable
   Objects): answers as append-only events; audit trail and offline sync both
   fall out of this one decision.
8. **Ship identity v1 and design the tenancy model now** — even a simple
   authenticated-supervisor model — because every month without it deepens the
   retrofit.
9. **Vendor all runtime dependencies and move document rendering server-side**
   (DOCX first): kills the CDN supply-chain risk, the offline failure, and the
   device-variance PDF problem in one move.
10. **Write the compliance foundation documents** (data classification,
    retention, chain-of-custody design, SOC 2 gap list) — two weeks of writing
    that unlocks every serious enterprise and government conversation, and
    constrains the data model while constraining it is still free.

---

*Filed as a governance document alongside the Design Constitution and ADR log.
Recommended next step: convert decisions 1–5 into an ADR-009 (platform
extraction) after field verification of v2.0.7 completes.*
