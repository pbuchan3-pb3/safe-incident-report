# S.A.F.E. Management — Atlas

Atlas is an AI Operations Interview Platform for event security and venue operations at Ford Field. It guides supervisors through a structured, conversational interview to collect operational facts, then produces professional incident and employee-recognition reports.

The application is a single self-contained `index.html` deployed to GitHub Pages. AI narrative cleanup runs server-side through a Cloudflare Worker (`safe-ai-proxy-worker.js`); no API key is ever present in the browser.

## Architecture & governance documentation

The approved architecture is documented in these reference files:

- **[ATLAS_PRODUCT_NORTH_STAR.md](ATLAS_PRODUCT_NORTH_STAR.md)** — the long-term product direction: one conversation produces one complete report ("Conversation first. Form last."), plus the Conversation-First Architecture Roadmap.
- **[ATLAS_DESIGN_CONSTITUTION.md](ATLAS_DESIGN_CONSTITUTION.md)** — design philosophy, the guiding principles, the architecture diagram, the security architecture, and the implementation reference.
- **[ADR_LOG.md](ADR_LOG.md)** — the Architectural Decision Records: the significant decisions behind Atlas and the reasoning for each.

These documents are internal architectural governance references. They are not exposed inside the Atlas application UI.

## Configuration

Set the AI proxy endpoint in `api-config.js` (`window.SAFE_AI_PROXY_URL`). The Anthropic key lives only as a Cloudflare Worker secret — never in the repository or the browser. See the Security Architecture appendix in the Constitution for details.
