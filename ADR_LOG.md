# Atlas — Architectural Decision Records (ADR Log)

> **Status:** Internal project reference · **Applies to:** Atlas v1.9.7 and forward
> **Companion document:** `ATLAS_DESIGN_CONSTITUTION.md`
> **Scope:** Records the significant architectural decisions behind Atlas and why they were made. This log is documentation only; it does not change application behavior.

An ADR captures a single decision, the reason for it, and its status. Accepted ADRs are considered binding architectural direction — changing one requires a new superseding ADR, not an ad-hoc edit.

---

## ADR-001 — Separate fact collection from editorial writing

**Decision:** Separate fact collection from editorial writing.

**Reason:** Allows multiple editorial profiles while preserving factual integrity.

**Status:** Accepted

**In the code (v1.9.7):** The interview collects facts into `formData` first; only afterward does `cleanWithAI()` invoke an editorial profile resolved by `resolveEditorProfile()` from the `EDITOR_PROFILES` registry. The narrative writers never gather facts, and fact collection never writes prose. See Constitution Principle 2.

---

## ADR-002 — Preserve original supervisor input

**Decision:** Store original supervisor input alongside AI-edited versions.

**Reason:** Supports auditing, troubleshooting, supervisor coaching, and future AI improvements.

**Status:** Accepted

**In the code (v1.9.7):** Every AI-rewritten narrative retains its raw source as `<field>Raw` (e.g. `incidentDescriptionRaw`, `recognitionDescriptionRaw`), and structured "Other"/parsed fields keep `positionHeldOriginal`, `assignmentsWorkedOriginal`, `guestSeatRaw`, `guestStatementRaw`, `guestClothingRaw`, `assignmentTimelineRaw`. Reports use the edited version; originals stay internal. See Constitution Principle 4.

---

## ADR-003 — One shared Recorder / Narrative Capture Engine

**Decision:** Use a single shared Recorder/Narrative Capture Engine.

**Reason:** Every workflow benefits from improvements automatically.

**Status:** Accepted

**In the code (v1.9.7):** One implementation — `mountRecorderCard()` with `recRenderControls()` / `recSendToAI()` / `recCollapse()` — mounts on any step flagged `mountRecorder:true` and on verbal guest statements. Improvements (idle/record/pause/complete states, collapse, send routing) apply everywhere at once. Future transcription plugs into `recSendToAI()` without UI changes. See Constitution Principle 3.

---

## ADR-004 — Venue knowledge lives in configuration

**Decision:** Venue knowledge belongs in configuration, not interview logic.

**Reason:** Allows Atlas to support multiple venues without rewriting workflows.

**Status:** Accepted

**In the code (v1.9.7):** `VENUE_CONFIG` (read via `activeVenueConfig()`) holds the venue name, positions (`POSITION_CONFIG`), and assignment groups (`ASSIGNMENT_CONFIG`, including sections 101–146 generated from a loop). The interview engine reads these configs; adding a venue is a configuration entry, not new workflow code. See Constitution Principle 6.

---

## ADR-005 — Operational Context is a first-class data object

**Decision:** Operational Context is a first-class data object and appears in every export.

**Reason:** Operational context is essential for understanding reports and future analytics.

**Status:** Accepted

**In the code (v1.9.7):** Position, assignments worked, and reassignment timeline are collected once in `baseFlow` (shared across workflows) and rendered by `operationalContextText()` in every deliverable — on-screen review card, PDF, Word, email body, text export, and the Sheets payload (added in the v1.9.7 audit remediation, gap G3). See Constitution Principle 7.

---

## Decision status legend

| Status | Meaning |
|---|---|
| Accepted | Binding architectural direction; build to it. |
| Proposed | Under consideration; not yet binding. |
| Superseded | Replaced by a later ADR (reference the successor). |
| Deprecated | No longer applies; retained for history. |

## How to add an ADR

1. Add the next number (`ADR-006`, …) with Decision / Reason / Status.
2. If it changes an existing decision, mark the old one **Superseded by ADR-00N** rather than deleting it — the history is the point.
3. Where practical, add an "In the code" line pointing to the implementing identifier(s).
