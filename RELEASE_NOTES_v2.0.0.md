# Atlas v2.0.0 — Atlas Visual System

**Release type:** Milestone (visual foundation)
**Functional core:** v1.9.12 (Incident Module)
**Date:** July 2026

---

## What this release is

Atlas v2.0.0 is the point at which Atlas stops being a polished prototype and
becomes a product with a **design system**. It packages the visual work (v2.0,
v2.1, and Sprint 1) into one enterprise foundation and declares it the baseline
that every future module inherits.

It is a **visual** release. The functional incident-reporting core is v1.9.12 and
is unchanged: the interview engine, Recorder 3.0 and live transcription, AI
editorial routing, Operational Context, and PDF/Word/email generation all behave
exactly as before. Across the visual sprints the inline `<script>` was proven
byte-identical; this release changes a single line — the `APP_VERSION` string —
so the deployed file self-identifies as `2.0.0`.

## Highlights

- **Design tokens** for spacing, radius, elevation, motion, and color.
- **Enterprise color hierarchy** — SAFE Navy (primary), Blue (action/progress),
  SAFE Red (destructive/alert only), Success/Warning/Neutral.
- **Refined cards, buttons, typography**, and a premium Ford Field hero.
- **Motion on Change. Stillness at Rest.** (Design Constitution Principle 12) —
  ambient loops removed; motion communicates state changes only.
- **Accessibility & mobile**: focus-visible rings, reduced-motion support, larger
  touch targets, full-row-tappable accordions, iOS input-zoom guard.
- **Dashboard-ready components** scaffolded (inert) for future analytics.

## Not in this release (next, JS-scoped sprint)

Emoji → SVG icon family, `aria-live` on the chat window, dynamic hero
event/progress data, scroll-collapse header, and removing the vestigial Roboto
import (it lives inside the PDF/Word CSS generator in the script). These require
script changes and will ship as their own verified increment.

## The discipline this release establishes

From v2.0.0 forward, new modules — People Engine, Knowledge Graph, Operational
Intelligence Dashboard, Michigan Post-Event Summary, Training Academy — **inherit
this visual system**. They compose from existing tokens and components rather than
inventing styles. See "The Atlas Visual System is the Inheritance Baseline" in
`ATLAS_DESIGN_CONSTITUTION.md`.

---

## How to commit and tag this release

Claude cannot push to GitHub. Run these from the repository root
(`pbuchan3-pb3/safe-incident-report`) after copying the staged files in:

```bash
git add index.html CHANGELOG.md RELEASE_NOTES_v2.0.0.md \
        ATLAS_DESIGN_CONSTITUTION.md ATLAS_PRODUCT_NORTH_STAR.md \
        ADR_LOG.md README.md

git commit -m "release: v2.0.0 — Atlas Visual System

Enterprise visual foundation on the v1.9.12 incident core.
Design tokens, color roles, refined cards/buttons/typography, premium hero,
Motion-on-Change principle, accessibility + mobile, dashboard-ready components.
Functional core unchanged; only APP_VERSION changed in the script."

git tag -a v2.0.0 -m "Atlas Visual System — enterprise UI foundation"

git push origin main
git push origin v2.0.0
```

Verify the deploy: open the GitHub Pages URL and confirm the app loads, the
progress bar reads navy, the hero is calm, and a normal incident + recognition
run still works end to end.
