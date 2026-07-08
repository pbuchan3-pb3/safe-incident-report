# Atlas Design Constitution

| | |
|---|---|
| **Current version** | 1.0 |
| **Approved architecture** | v1.9.7 |
| **Last updated** | July 2026 |
| **Status** | Living Document |

> **Scope:** Design philosophy and architecture. This document does not change application behavior. As a living document it is expected to evolve — update the version and last-updated fields above when it changes.

---

## Purpose

Atlas is an **AI Operations Interview Platform** for event security and venue operations.

Atlas is not merely a digital form.

Its purpose is to help supervisors collect accurate operational facts, preserve original input, apply the correct editorial profile, and produce professional reports with minimal friction.

---

## Principle 1 — Atlas Conducts Interviews, Not Forms

Atlas should feel like an experienced S.A.F.E. Operations Manager conducting a structured interview.

The supervisor should not feel like they are filling out a static form.

---

## Principle 2 — Collect Facts First

Atlas first collects facts.

Only after facts are collected should Atlas invoke the appropriate editorial profile.

Fact collection and narrative writing must remain separate.

Pipeline:

```text
Workflow
   ↓
Interview
   ↓
Facts Collected
   ↓
Editorial Profile
   ↓
Final Report
```

---

## Principle 3 — Shared Services First

Whenever possible, new features should become shared platform services.

Examples:

- Recorder / Narrative Capture Engine
- Editorial Engine
- Name Parser
- Seat Parser
- Operational Context Engine
- Venue Knowledge Engine
- Export Engine
- Future Analytics Engine

Do not duplicate logic across workflows.

---

## Principle 4 — Preserve Original Input

Never destroy the supervisor's original wording.

Maintain:

```text
Original Input
   ↓
Parsed / Structured Data
   ↓
Editorial Rewrite
   ↓
Final Report
```

The final report may use the polished version, but the original input should remain internally available for auditing, troubleshooting, and future review.

---

## Principle 5 — AI Is Invisible to the Supervisor

The supervisor should not need to understand:

- prompts
- AP Style routing
- editorial profiles
- AI model behavior
- backend proxy logic

Atlas should automatically route each response to the correct engine.

---

## Principle 6 — Configuration Over Code

Venue knowledge, assignments, recognition values, question flows, and workflow definitions should increasingly be configuration-driven.

Future venues should require new configuration, not new workflow logic.

---

## Principle 7 — Operational Context Matters

Atlas should understand:

- who is reporting
- their position
- venue
- assignments worked
- reassignment timeline
- location
- incident context

before producing reports.

---

## Principle 8 — Reports Are Outputs

Incident reports, recognition reports, corrective action reports, and post-event summaries are outputs of the Interview Engine.

They are not the architecture itself.

---

## Principle 9 — Optimize for Supervisors Under Pressure

Assume the supervisor is tired, standing, multitasking, or working in a noisy environment.

Every screen should:

- reduce typing
- reduce clicks
- reduce scrolling
- reduce ambiguity
- make the next action obvious

---

## Principle 10 — Every Enhancement Should Strengthen the Platform

Before adding a feature, ask:

> Can this become a shared capability?

If yes, build it once and let all workflows inherit it.

---

# Atlas Architecture Diagram

```text
                         Atlas Interview Engine
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
 Narrative Capture Engine   Operational Context Engine   Venue Knowledge Engine
        │                         │                         │
        │                         │                         │
 Recorder / Typing          Position / Assignment       Ford Field Profile
 Future Transcription       Reassignment Timeline       Future Venue Profiles
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                         Fact Collection Layer
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
   Name Parser               Seat Parser              Location Parser
                                  │
                                  │
                         Editorial Engine
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
 Incident Writer        Employee Recognition Writer    Witness Statement Writer
        │                         │                         │
        ├─────────────────────────┼─────────────────────────┤
        │                         │                         │
 HR Discipline Writer     Executive Summary Writer     Future Editors
                                  │
                                  │
                           Report Engine
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
       PDF                       Word                      Email
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                              Sheets / Data
                                  │
                                  │
                         Analytics Engine (Future)
```

---

# Appendix — Implementation Reference (v1.9.7)

This appendix maps the principles and engines above to the actual identifiers in `index.html`, so future contributors can find the shared service rather than re-implementing it. Items marked **(planned)** or **(designed)** are intentionally not yet built.

### Shared services in code

| Engine (diagram) | Implemented as | Notes |
|---|---|---|
| Narrative Capture Engine | `mountRecorderCard()`, `recRenderControls()`, `recSendToAI()`, `recCollapse()` | One reusable recorder; mounted on any step with `mountRecorder:true` and on verbal guest statements. Engine is transport-agnostic so transcription can plug in later via `recSendToAI()`. |
| Operational Context Engine | `POSITION_CONFIG`, `ASSIGNMENT_CONFIG`, `VENUE_CONFIG`, handlers `isPositionHeld` / `isAssignments` / `isAssignmentTimeline` / `isOperationalSummary`, `operationalContextText()` | Collected once in `baseFlow`, reused by every workflow. |
| Venue Knowledge Engine | `VENUE_CONFIG`, `activeVenueConfig()` | Ford Field configured; additional venues are config entries (Principle 6). |
| Name Parser | `parseName()`, `applyEmployeeName()` | Single shared parser for supervisor, employee, and guest names. |
| Seat Parser | `parseSeat()`, `guestSeatDisplay()` | Section / Row / Seat parsed to discrete fields; never treated as a name. |
| Location Parser | — | **(planned)** — a shared Ford Field location tree unifying Operational Context assignments with incident location is not yet implemented. |
| Editorial Engine | `EDITOR_PROFILES` registry + `resolveEditorProfile()` + `cleanWithAI()` | Profiles: `incidentReport`, `employeeRecognition`, `witnessStatement`, `discipline`, `executiveSummary`. Routing is automatic (Principle 5). |
| Report Engine | `generatePDF()`, `generateWord()`, `sendViaMailto()`, `submitToSheets()`, `showFinalForm()` | PDF/Word/email/Sheets/review all include Operational Context (v1.9.7 G3). |
| Analytics Engine | — | **(future)** — no analytics built; structured data model is preserved to support it later. |
| Interview Confidence Engine | — | **(designed, not built)** — advisory completeness indicator reading only `formData`; see roadmap. |

### Editorial profiles → writers

- `incidentReport` → Incident Writer (objective, chronological, AP style).
- `employeeRecognition` → Employee Recognition Writer (warm, HR-grade, operational impact).
- `witnessStatement` → Witness Statement Editor (first-person preserved; grammar/spelling only).
- `discipline` → HR Discipline Writer — **registered, unused** (no Corrective Action workflow yet).
- `executiveSummary` → Executive Summary Writer — **registered, unused** (no Executive Summary workflow yet).

### Preserve-original-input (Principle 4) in code

Original values retained alongside edited versions: `<field>Raw` for every AI-rewritten narrative (e.g. `incidentDescriptionRaw`, `recognitionDescriptionRaw`), plus `positionHeldOriginal`, `assignmentsWorkedOriginal`, `guestSeatRaw`, `guestStatementRaw`, `guestClothingRaw`, `assignmentTimelineRaw`.

### AI is invisible (Principle 5) in code

The browser never holds a key. `cleanWithAI()` posts to `SAFE_AI_PROXY_URL` (a Cloudflare Worker that holds the key server-side) and falls back to raw text on any failure, with developer diagnostics behind `?debug=1` (`safeDiag`). The supervisor never sees prompts, profiles, or proxy behavior.

### Open roadmap (tracked, not yet built)

- **Shared Location Tree** unifying assignments and incident location (Location Parser above).
- **Interview Confidence Engine** — `computeCompleteness(formData)` → 🟢 / 🟡 / 🔴 advisory badge; reads collected facts only, never editorial output; never blocks completion.
- **Corrective Action** and **Michigan Post Event Summary** workflows (their editorial profiles are ready).
- **Multi-venue** profiles (Huntington Place, Comerica Park, Little Caesars Arena, and others) as configuration.
- **Analytics** over the preserved structured data.
