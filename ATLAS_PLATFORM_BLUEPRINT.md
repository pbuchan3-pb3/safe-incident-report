# The Atlas Platform Blueprint (v3.0)

**Author's stance:** Chief Software Architect. Horizon: ten years. Optimizing for
permanence, not speed. The Incident Reporting Module (v2.x) is the platform's
first production module and its proof — it is migrated, never discarded.

**The invariant every layer must preserve:** one intelligent conversation
produces one complete, trusted operational record — approved by a human,
traceable to its source, and provable years later.

---

## Deliverable 1 — The Subsystem Catalog

Atlas organizes into five planes. Subsystems communicate through two spines:
the **Session Event Stream** (append-only facts about what happened in a
conversation) and the **Record Object** (the typed, versioned projection of
those facts). No subsystem calls another's internals; each consumes events and
schemas. This is what keeps a 30-subsystem platform from becoming a 30-way
tangle.

### Plane 1 — Definition (versioned data, no code)
| Subsystem | Why it exists | Owns |
|---|---|---|
| **Interview Pack Registry** | Interviews are data (Deliverable 3); packs are the product's unit of distribution | Pack manifests, question graphs, versions |
| **Prompt Registry** | AI behavior must be versioned, evaluated, and auditable like code | Prompts, editorial policies, eval baselines |
| **Rules Engine definitions** | Validation/compliance logic varies per industry and jurisdiction | Rule sets, severity policies, consistency checks (the hair soft-check, generalized) |
| **Report Template Registry** | Output formats vary per customer/agency | Document templates (DOCX/PDF/email), layout policies |
| **Policy Library** | Government/enterprise deployments bind records to policy citations | Policies, retention schedules, classification labels |

### Plane 2 — Execution (generic engines; the industry knowledge lives in Plane 1)
| Subsystem | Why | Owns |
|---|---|---|
| **Interview Engine** | Walks a question graph; asks, branches, follows up. The heart of Atlas — today's `askNextQuestion()`, generalized | Session flow state |
| **Conversation Engine** | Renders the interview as dialogue (chat, voice, future channels); separated from the Interview Engine so channels can multiply | Turn presentation, channel adapters |
| **Workflow Engine** | Records have lifecycles beyond the interview (review → approval → amendment → closure) | Record states, transitions, assignments of work |
| **Validation Engine** | Executes rule sets against the Record continuously, not just at the end | Validation results, soft/hard findings |
| **People Engine** | Persons are first-class entities with roles per record, not scattered fields | Person entities, role bindings, identity confidence |
| **Evidence Engine** | Chain of custody for anything attached to a record | Evidence items, custody events, integrity hashes |
| **Media Engine** | Capture/storage/processing of audio, photo, video (the recorder, generalized) | Media blobs, formats, device metadata |
| **Timeline Engine** | Reconstructs event chronology from answers and evidence timestamps | Timeline assertions with confidence + source |
| **Document Generation Engine** | Renders the Record through templates, server-side, deterministically | Rendered artifacts + their hashes |
| **Offline Sync Engine** | Field reality: capture must survive dead connectivity | Local event queues, conflict resolution, sync receipts |
| **Notification Engine** | Real delivery (email/SMS/webhook), replacing mailto | Notification jobs, receipts |
| **Search Engine** | Records must be findable at fleet scale | Indexes (never source data) |
| **Analytics Engine** | Aggregates operational patterns for dashboards | Metrics, aggregations |
| **Task Engine** | Follow-ups become tracked work, not narrative text | Tasks, due states |

### Plane 3 — Intelligence (Deliverables 4 & 7)
AI Routing Engine (the Gateway), capability services (Transcription, Editorial,
Validation-AI, Summarization, Classification, Risk Detection, Knowledge
Retrieval, NL Query), the Agent Runtime, and the Knowledge Engine (cross-record
entity/pattern graph). Owns: model registry, AI call telemetry, retrieval
indexes. Everything here is replaceable labor; Plane 1 is the score it plays.

### Plane 4 — Trust (Deliverable 5)
Authentication, Authorization (RBAC+ABAC), Multi-tenancy, Audit Engine
(append-only hash-chained event log), Crypto/Key Management, Security Engine
(threat monitoring, rate limiting, abuse protection). Owns: identities, grants,
tenants, the audit chain, keys. Trust services wrap every other plane; nothing
bypasses them.

### Plane 5 — Experience & Developer
Field App (mobile runtime; still buildable as a single-file artifact — the field
superpower is preserved as a build target), Administration Console, Operational
Dashboard, Training Engine, Reporting/NL Query surface, API Gateway (the only
door), Plugin System + Industry Module Loader (Deliverable 8), Developer SDK.
Owns: presentation state only. All data access goes through the API Gateway
with the caller's identity — including Atlas's own UIs (dogfooding the API is
what keeps it honest).

**Communication rules (the whole diagram in four sentences):** Clients speak
only to the API Gateway. Engines emit and consume events on the Session Event
Stream and read/write the Record through the schema. Intelligence services are
invoked by engines through the AI Routing Engine and return structured,
schema-validated outputs stamped with model+prompt versions. Trust services
authenticate every call, authorize every access, and append every consequential
action to the audit chain.

---

## Deliverable 2 — The Atlas Data Model

**Foundational decision: event-sourced spine.** The primary datum is the
**Audit Event** — an immutable, hash-chained, tenant-scoped fact ("answer
given," "field approved," "evidence attached," "document rendered"). Every
other entity is either a definition (Plane 1) or a **projection** of events.
This one decision yields the audit trail, offline sync, amendments-without-
edits, and provenance — four enterprise requirements from one design choice.

**Second decision: `Incident` is not a core entity.** The core entity is the
**Record** (a completed or in-progress structured account). "Incident,"
"Recognition," "OSHA 301," "HR Investigation" are **RecordTypes** defined by
packs. This is what makes unlimited industries possible without schema surgery.

### Entity catalog

**Identity & structure:** `Organization` (tenant root) → `Department` →
`Venue`/`Site` (physical context; Ford Field is one row, not a hardcode) →
`User` (authenticated principal) → `Role` (grants). `Person` is distinct from
`User`: a Person is anyone who appears in a record (guest, witness, officer)
and may have no login; identity confidence is a property (confirmed / stated /
unknown / refused — today's name-status logic, promoted to the model).

**Capture:** `Interview` (one conversation; references a PackVersion) →
`Conversation` (the turn transcript) → `Question` (instance of a pack-defined
QuestionDef) → `Answer` (raw value + source: typed/spoken/selected + media ref).
`Statement` is a specialized Answer carrying voice attributes: direct-quote |
first-person | summary — the quote-protection distinction, promoted to data so
no renderer can ever confuse them.

**The record:** `Record` (typed projection; versioned) → `Field` (each with
**Provenance**: source Answer, prompt version that cleaned it, approver,
timestamp — the raw/cleaned discipline generalized) → `Revision` (a new
projection version; records are amended by append, never edited) → `Approval`
(a human accepting content — Principle 11 as a table) → `Signature`
(cryptographic: document hash + signer identity + timestamp; the ink image
remains as presentation).

**Evidence & media:** `Evidence` (anything relied upon: `Photo`, `Audio`,
`Video`, `Attachment` subtypes) with `CustodyEvent`s (captured, uploaded,
accessed, exported — each hashed into the audit chain). `Media` carries device
metadata and integrity hashes at capture time.

**People in records:** `RoleBinding` links Person ↔ Record with a role (subject,
witness, reporting supervisor, responding officer) — replacing today's
per-role field duplication. `Witness` is a RoleBinding plus its Statements.

**Operations:** `Assignment` (structured posts; today's engine, as entities),
`Action` (what was done), `Task` (follow-up work with state), `Timeline`
(ordered assertions with confidence and per-assertion provenance),
`Notification` (delivery jobs + receipts).

**Governance:** `Policy`, `Rule`, `RetentionSchedule`, `ClassificationLabel`
bound to RecordTypes by packs. `Relationship` (typed Person↔Person,
Record↔Record links — the Knowledge Engine's raw material). `History` is not a
table; it is a query over the event chain — that is the point.

---

## Deliverable 3 — The Atlas Interview Definition Language (AIDL)

Interviews become declarative documents: versioned, diffable, translatable,
testable, and authorable without touching engine code. Conceptual
representation (format illustrative; the concepts are the commitment):

```yaml
pack: safe.incident-report
version: 3.2.0                      # semver; engine checks compatibility range
extends: atlas.core-interview@^2    # packs compose
locales: [en-US, es-US]             # every user string is a key, not a literal
accessibility:
  defaults: { aria_live: polite, min_touch_target: 56px }

entities:                            # what this interview binds to the Record
  guest:   { type: person, role: subject }
  witness: { type: person, role: witness, many: true }

sections:
  - id: operational_context
    title: { key: section.opctx }
    questions:
      - id: assignments_initial
        prompt: { key: q.assignments }
        input:  { type: multi_select, source: venue.assignment_groups }
        writes: record.assignments.initial
        required: true

      - id: reassigned
        prompt: { key: q.reassigned }
        input:  { type: choice, options: [remained, reassigned] }
        branch:
          when: { answer: reassigned }
          goto: assignments_reassigned      # branching is data, not flowIndex math

      - id: assignments_reassigned
        prompt: { key: q.reassigned_to }
        input:  { type: multi_select, source: venue.assignment_groups }
        writes: record.assignments.reassigned
        constraints: [no_invented_times]     # rules by reference

  - id: narrative
    questions:
      - id: incident_description
        prompt: { key: q.describe, vars: { name: user.first_name } }
        capture:
          modes: [record_audio, type]        # recorder mounts by declaration,
          transcription: backend             # not by hand-wired call sites
        editorial: profile.incidentReport@4  # versioned prompt reference
        preserves: raw                       # provenance is mandatory
        confirm: { style: approve_edit_rerecord }
        confidence:
          low_signal: [duration < 5s, transcript_empty]
          on_low: reask_gently

      - id: guest_clothing
        prompt: { key: q.clothing, vars: { ref: entity.guest.reference } }
        capture: { modes: [record_audio, type], allow_dont_recall: true,
                   dont_recall_writes: { key: text.clothing_not_recalled } }
        editorial: profile.clothingDescription@1

validation:
  - rule: hair_style_without_color          # today's soft-check, as data
    when: { record.appearance.hair_color in [not_observed, unknown],
            record.appearance.hair_style: concrete }
    severity: soft-confirm
    prompt: { key: v.hair_consistency }

completion:
  required_fields: [record.narrative, record.severity, record.location]
  required_evidence: []                      # packs may demand photos, etc.
  approvals:
    - approver: role.reporting_supervisor
      scope: full_record
      then: signature                        # cryptographic, per Deliverable 5

rendering:
  entity_rules: { first_reference: role_plus_name, quotes: protected }
  templates: [pdf.safe-incident@2, docx.safe-incident@2, email.summary@1]
```

Everything the v2.x engine does imperatively is expressible here — which is
provable, because the migration test is exact: run the incident flow through
the AIDL engine against golden sessions and diff the rendered documents for
equivalence. Conditions, validation, AI profiles, follow-ups, completion,
branching, evidence, confidence, approvals, versioning, localization, and
accessibility are all first-class declarative concepts, so a third party can
author an OSHA pack without ever reading engine source.

---

## Deliverable 4 — The Atlas AI Layer

**Principle: Atlas speaks capabilities, never vendors.** The AI Routing Engine
(Gateway) exposes capability contracts; providers are registry entries behind
them. Today's Worker — with its Anthropic route and Whisper route — is
generation 1 of exactly this and is preserved as such.

**Capabilities, each independently replaceable:** Transcription · Editorial
Writing · Validation (AI-assisted consistency) · Reasoning (follow-up
selection, gap detection) · Summarization (executive summaries, shift rollups)
· Knowledge Retrieval (grounded lookup over the tenant's corpus) ·
Classification (severity, category, routing) · Risk Detection (flag patterns
for human attention — never autonomous conclusions) · Policy Lookup (citation
retrieval).

**The mechanics that make replaceability real:**
- **Model Registry:** capability → ordered provider chain (primary, fallback,
  deterministic last resort), with per-tenant pinning and per-jurisdiction
  routing (a CJIS tenant can require gov-cloud-hosted models only).
- **Structured output contracts:** every capability returns schema-validated
  JSON, never prose to be parsed. A model that can't meet the contract fails
  fast and falls back.
- **Prompt Registry with eval gates:** prompts are versioned artifacts; a new
  prompt or model version ships only after passing the golden-session eval
  suite for its capability. Every AI-produced Field carries
  `{capability, provider, model, prompt_version, request_id}` in its
  Provenance — the audit answer to "why does the report say this?"
- **Telemetry:** cost, latency, fallback rate, and eval drift per capability —
  the dashboard that tells us when a provider degrades before a customer does.

---

## Deliverable 5 — The Atlas Security Architecture

Designed for government from day one, because retrofitting trust is the one
migration that never goes well.

- **Zero Trust:** no network location confers privilege; every call — including
  Atlas's own UIs and agents — presents identity to the API Gateway and is
  authorized per request. Agents are principals with least-privilege grants.
- **RBAC + ABAC:** roles grant capability classes (file, review, approve,
  administer); attributes constrain them (tenant, department, venue,
  classification level, time). "Supervisors approve records for venues they are
  assigned to" is one ABAC policy, not code.
- **Append-only, hash-chained Audit Event log:** each event includes the hash
  of its predecessor; periodic checkpoint hashes are anchored externally.
  Tampering is detectable, not just forbidden. History cannot be rewritten
  because history is the storage.
- **Document integrity:** every rendered artifact is hashed into the record;
  the hash is printed on the document. **Digital signatures** sign that hash
  with the signer's key — the signature attests to exact content, and any
  later change is provable. The handwritten image remains as human-facing
  presentation over a cryptographic core.
- **Evidence chain of custody:** every Evidence item carries capture-time
  hashes and CustodyEvents (captured/uploaded/accessed/exported, by whom,
  when) in the audit chain — the difference between "a photo" and "an exhibit."
- **Encryption & keys:** TLS everywhere in transit; envelope encryption at
  rest with per-tenant data keys under a KMS; key rotation without data
  rewrite; FIPS-validated modules on government paths.
- **Offline protection:** field devices hold an encrypted local event queue
  keyed to the authenticated user; secure sync uploads events idempotently
  with receipts; device loss exposes ciphertext, not records.
- **Compliance posture:** NIST 800-53 control mapping maintained as a living
  document; FedRAMP-compatible hosting path (edge + gov-cloud regions) kept
  open by never depending on non-certifiable services in the core; CJIS
  requirements (advanced auth, audit, dissemination logging) satisfied by the
  above rather than bolted on; Section 508/WCAG as pack-enforced defaults
  (AIDL carries accessibility metadata) plus platform conformance testing.

---

## Deliverable 6 — The Atlas Platform Lifecycle

**Adding an industry:** author a pack (AIDL + schema extensions + rules +
templates + prompts) → run pack certification (schema validation, golden-
session evals, accessibility lint, security review of any integration
permissions) → publish to the Pack Registry (signed) → tenants install a
version.

**Customer installation:** an Organization subscribes to a pack version;
tenant admins map it to departments/venues, bind local vocabulary, and set
policy parameters (retention, approvals). Installation is configuration —
never deployment of code to the tenant.

**Versioning:** packs use semver with declared engine-compatibility ranges.
Records permanently remember the PackVersion that produced them — a 2019
record renders with 2019 rules forever (legal necessity, not nostalgia).
In-flight interviews complete on their starting version; new versions apply to
new sessions. Migrations between major versions are explicit, reviewed
transforms.

**AI profile updates:** prompt/model changes ship through the eval gate, roll
out progressively (per-tenant canary), and are instantly revertible because
profiles are registry data. Every record knows which profile version touched it.

**Rules distribution:** validation/policy packs version and distribute the same
way; jurisdictional rule sets (e.g., a state's reporting requirements) are
packs a tenant subscribes to.

**Upgrades without breakage:** the platform upgrades continuously; the
contracts (API versions, AIDL schema versions, event schemas) are the stability
boundary. Deprecations get published timelines; nothing breaks a pinned pack.
The v2.x single-file app is the first citizen of this policy: it becomes Pack
#1 running on the AIDL engine, proven equivalent by golden-session diff before
anything is retired.

---

## Deliverable 7 — Atlas for AI Agents

**Architecture:** agents are specialized, least-privilege services coordinating
through the **session's structured state and event stream — never prose
handoffs**. Each agent subscribes to events, reads the Record through the
schema, and emits typed proposals. Proposals become facts only through the
engine (and, where consequential, through human approval). The Supervisor
remains the final authority — Principle 11 does not scale away; it scales up.

| Agent | Responsibility | Inputs | Outputs | Boundary / Escalation |
|---|---|---|---|---|
| **Interview Agent** | Conduct the conversation; choose next question and follow-ups within the pack graph | Session state, pack, answers | Next-question selections, follow-up proposals | May not invent questions outside the pack; escalates coverage gaps to completion rules |
| **Validation Agent** | Continuous consistency/completeness checks | Record, rule sets | Findings (soft/hard) with citations | Never blocks unilaterally beyond pack-declared hard rules; soft findings go to the human |
| **Policy Agent** | Bind applicable policies/citations | Record type, jurisdiction, policy library | Citation proposals | Retrieval only; never asserts compliance conclusions |
| **Evidence Agent** | Solicit, verify, and catalog evidence | Pack evidence requirements, media events | Evidence requests, custody entries, integrity checks | Cannot delete or alter evidence — ever |
| **Timeline Agent** | Assemble chronology with confidence | Answers, media timestamps | Timeline assertions + confidence | Conflicts are surfaced, not silently resolved |
| **Narrative Agent** | Editorial writing via profiles; entity-aware rendering | Approved facts, identity context, profile version | Draft narratives, rendered wording | Fact-preserving contracts; quote protection; output requires human approval |
| **QA Agent** | Pre-completion review against the pack's definition of done | Full record | Quality findings, readiness score | Advisory; cannot approve |
| **Training Agent** | Coach users on platform and policy, using their own (permitted) history | Training packs, user telemetry | Guidance, scenarios | No access to records beyond the trainee's authorized scope |
| **Knowledge Agent** | Cross-record retrieval and pattern surfacing | Knowledge graph, query | Grounded answers with record citations | Tenant-scoped; ABAC-filtered; cites or declines |
| **Supervisor Assistant** | The user-facing orchestrating persona | All of the above, as proposals | The conversation the human experiences | Presents; never fabricates; every consequential act traces to an approval |

**Protocol:** typed proposal events (`agent.proposal.*`) → engine adjudication
→ fact events (`session.answer`, `record.field.updated`) → audit chain. Agents
are replaceable individually because their only interface is the schema.

---

## Deliverable 8 — The Atlas Plugin Architecture

**Everything third parties build is a pack; packs are data plus declared
permissions — never core modification.**

- **Pack types:** industry packs, interview packs, validation/rule packs,
  report-template packs, policy libraries, analytics packs, and integration
  packs (declared connectors: "push completed records of type X to endpoint Y
  as schema Z").
- **Manifest:** identity, semver, engine-compat range, contents, locales,
  requested permissions (data scopes, capabilities, egress destinations),
  signing certificate.
- **Sandboxing:** declarative packs execute in the engines (no third-party
  code in the capture path). Where computation is unavoidable (custom
  analytics, transforms), it runs in isolated workers with schema-only I/O,
  resource limits, and zero ambient credentials.
- **Trust tiers:** Atlas-certified → partner-verified → tenant-private. Signed
  packs, integrity-checked at install; government tenants can restrict to
  certified tiers.
- **Extension points, versioned like APIs:** question input types, validation
  rule functions, template components, capability adapters, dashboard widgets.
  Extension contracts get the Stripe treatment: versioned, documented, never
  silently broken.
- **SDK:** pack scaffolding, local AIDL simulator, golden-session test runner,
  certification pre-check — the developer experience that decides whether a
  marketplace ever becomes real.

---

## Deliverable 9 — The Atlas Maturity Model

**Level 1 — Single Application** *(Atlas today, late-stage):* one module, one
tenant-in-practice, file-based delivery, human verification discipline, AI
capture pipeline working in the field. Exit criteria: golden-session harness,
source modularization with single-file build artifact, serializable sessions.

**Level 2 — Platform:** interviews as data (AIDL) running Pack #1 equivalently;
event-sourced session + server of record; AI Gateway with versioned prompts and
eval gates; identity v1; append-only audit; second pack ships without engine
changes. Exit criteria: two packs, one engine, zero regressions.

**Level 3 — Enterprise Platform:** multi-tenancy with isolation; SSO/RBAC/ABAC;
admin console; server-side DOCX/PDF with document hashing; notification and
integration infrastructure; offline-first sync; observability; SOC 2; SLAs.
Exit criteria: a Fortune-100-shaped tenant runs unassisted.

**Level 4 — Government Platform:** FedRAMP-aligned deployment path; CJIS
controls; cryptographic signatures + chain of custody in production; 508
conformance; retention/legal hold; air-gapped/offline editions; NIST 800-53
mapping audited. Exit criteria: a federal or state agency passes its own
security review of Atlas.

**Level 5 — Global AI Operational Platform:** pack marketplace with certified
third parties; multi-agent orchestration in production; cross-record Knowledge
Engine powering prevention analytics; multilingual capture; multi-party
voice-native sessions; regional data residency; Atlas as the capture layer
other systems of record ingest from. Exit criteria: most new value ships as
packs and agents, not platform code.

---

## Deliverable 10 — The $1B Question

If Atlas is acquired for a billion dollars ten years from now, the diligence
team will point to decisions that were made *now*, when they were cheap:

1. **Interviews became data (AIDL).** The acquirer isn't buying an incident
   app; they're buying an engine plus a library of certified industry packs and
   the marketplace around them. That asset class exists only because the
   question graph left JavaScript in year one.
2. **The event-sourced, provenance-per-field spine.** Every field in every
   record traces to a human utterance, a prompt version, and an approval. In a
   decade of AI-skepticism litigation and regulation, Atlas records will be the
   ones courts and auditors trust — trust is the moat, and it was a schema
   decision.
3. **Capability-based AI with no vendor dependence.** Ten years of model
   churn — providers rising, falling, being acquired — and Atlas swapped
   registry entries while competitors rewrote applications. The Gateway
   decision is why Atlas aged with the AI wave instead of being dated by it.
4. **Trust architecture before the first government customer.** Hash-chained
   audit, cryptographic signatures, chain of custody, tenancy isolation — built
   when there was nothing to protect, which is why the federal review that
   kills most startups was a formality.
5. **The human-approval invariant held at every scale.** As agents multiplied,
   Atlas never let a machine sign a record. "AI-assisted, human-owned" is the
   positioning that survived the backlash cycles and won the regulated
   industries — and it was Constitution Principle 11 all along.
6. **The platform never betrayed the field.** Through every layer of
   enterprise machinery, a supervisor standing in a loud stadium could still
   file a complete report through one conversation on a phone — because field
   deployability was preserved as a build artifact, not sacrificed to
   architecture. The product kept the soul that made the platform worth buying.

---

*Filed alongside ATLAS_ARCHITECTURE_REVIEW.md. Recommended ratification path:
ADR-009 (Platform Extraction: AIDL + event-sourced session + AI Gateway) after
v2.0.7 field verification; this blueprint is its supporting document.*
