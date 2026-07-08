# S.A.F.E. Management — Incident Reporting System
Semantic versioning: MAJOR.MINOR.PATCH.

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
