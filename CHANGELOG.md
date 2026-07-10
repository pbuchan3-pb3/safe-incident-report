# S.A.F.E. Management — Incident Reporting System
Semantic versioning: MAJOR.MINOR.PATCH.

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
