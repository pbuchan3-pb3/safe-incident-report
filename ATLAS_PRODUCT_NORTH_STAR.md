# Atlas Product North Star

| | |
|---|---|
| **Current version** | 1.0 |
| **Approved architecture** | v2.1 (visual), v1.9.12 (functional) |
| **Last updated** | July 2026 |
| **Status** | Living Document |

> **Scope:** Long-term product direction. This document defines intent; it does not change application behavior.
> **Companion documents:** `ATLAS_DESIGN_CONSTITUTION.md`, `ADR_LOG.md`

---

## Mission

Atlas exists to remove the burden of paperwork from frontline professionals.

## Core principle

**One conversation should produce one complete report.**

## Design principle

**Conversation first. Form last.**

The user should not be responsible for understanding the form structure. Atlas should ask the necessary questions, collect answers, identify missing information, ask intelligent follow-ups, and then automatically generate the completed report.

The interface should feel like a structured interview, not a paperwork system.

---

## Required behavior

- Ask one question at a time.
- Accept spoken or typed answers.
- Save progress after each answer.
- Track required, optional, missing, and uncertain fields.
- Ask follow-up questions when an answer is incomplete, contradictory, vague, or introduces a new person, injury, location, evidence item, or timeline issue.
- Allow the user to pause and resume the session.
- At the end, generate the final AP Style report and required structured form fields.
- Do not force the user to manually fill out the form unless they choose to edit fields directly.

---

> **"The supervisor's job is to remember what happened. Atlas's job is to remember everything else."**

---

# Conversation-First Architecture Roadmap

These are the future platform components that will carry Atlas from today's guided interview toward the North Star. They are **direction, not commitments**; none should be built ahead of its own scoped, verified increment. Where a capability already exists in part, it is noted.

### 1. Conversation Session Engine
Tracks interview state, saves progress, supports pause/resume.
*Today:* a linear flow engine (`askNextQuestion`, `flowIndex`, shared `baseFlow`) drives the interview and holds answers in `formData`. Durable pause/resume across sessions is not yet implemented.

### 2. Completeness Engine
Tracks required, optional, missing, uncertain, and contradictory information.
*Today:* designed but not built — see the Interview Confidence Engine note in the Constitution (`computeCompleteness(formData)` advisory, reads facts only, never blocks).

### 3. Follow-Up Engine
Asks targeted follow-ups when answers are vague, incomplete, conflicting, or introduce new entities.
*Today:* partial and rule-based — adaptive questions (`ADAPTIVE_QUESTIONS`, `runAdaptiveQuestions`) and the structured witness mini-flow. Not yet a general follow-up engine.

### 4. Entity Engine
Extracts people, locations, evidence, vehicles, organizations, actions, injuries, and timeline events.
*Today:* narrow, purpose-built parsers exist (`parseName`, `parseSeat`); the witness mini-flow captures people in a scoped way. A general entity model is the People Engine's foundation (roadmapped, not started).

### 5. Output Engine
Generates incident reports, recognition reports, corrective actions, post-event summaries, PDFs, Word documents, email text, and structured data from the same conversation.
*Today:* the export layer (`generatePDF`, `generateWord`, email/text, Sheets payload) already produces multiple outputs from one `formData`; corrective-action and post-event-summary workflows are roadmapped (their editorial profiles exist).

### 6. Confidence Engine
Scores report completeness, evidence completeness, witness completeness, timeline consistency, and policy compliance.
*Today:* not built. Advisory only by design — it should inform, never block (Constitution Principle 11: Human Judgment Prevails).

### 7. Knowledge Engine
Allows Atlas to remember prior incidents, repeat people, repeat locations, event trends, and operational patterns.
*Today:* not built. This is the v3.0 direction in the evolution roadmap; it depends on a durable data model and must respect data-retention and privacy constraints before any cross-incident memory is introduced.

---

## Consistency with existing governance

This North Star is consistent with, and does not supersede, the `ATLAS_DESIGN_CONSTITUTION.md` and `ADR_LOG.md`:

- "Conversation first. Form last." is the product-level statement of **Principle 1** (Atlas conducts interviews, not forms) and **Principle 2** (collect facts first, write later).
- The Output Engine reflects **Principle 8** (reports are outputs of the interview) and **ADR-005** (Operational Context in every export).
- The Confidence Engine's advisory-only stance reflects **Principle 11** and **ADR-007** (AI narratives require supervisor review; human judgment prevails).
- Every engine above is expected to be a **shared platform service** (**Principle 3**, **ADR-006**), inherited by all workflows rather than reimplemented per workflow.

None of these engines is implemented here. This document records the destination so that each future increment can be checked against it.
