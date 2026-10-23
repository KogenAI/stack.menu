# Stack Menu

Tools and guidance for choosing an application stack, building with a known stack and reconsidering an existing application. The primary reader is the user's agent. The human website uses Oghogho’s design for browsing, comparing and reading the same maintained guides. The redesign and real ChatGPT demonstration are live at [stack.menu](https://stack.menu/), released 21 October 2026.

[Website](https://stack.menu/) · [Agent entry](https://stack.menu/llms.txt) · [Contact](https://stack.menu/contact/)

## Start here

- [Catalogue direction](docs/catalogue-direction-2026-10-23.md) — accepted scope and local implementation of task recommendations, guide presentation and rewrite sources; awaiting review.
- [20 October redesign](docs/redesign-2026-10-20.md) — design provenance, local review and 21 October release evidence.
- [Build and contribute](docs/website-workflow.md) — editable owners, local preview, direct checks and recovery.
- [Implementation scope](docs/current-state.md) — supported behavior and evidence limits.
- [Agent instructions](content/agent-entry.md) — navigation and contextual guidance.
- [Generator guidance](menu/generators/README.md) — official initializers, templates and conditional follow-up generators across the current catalogue.
- [Routing contract](content/routing.md) — structured context and optional endpoint.
- [Content inputs](menu/README.md) — dated snapshots, research freshness and attribution.
- [Artwork and surface map](branding/README.md) — editable masters, generated exports and font licenses.

## Local use

Use Node 24 (minimum 22.12), npm 9.6.5+ and Python 3.9+:

```sh
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:8770/`. The preview uses the same Pages middleware and route handler, with no analytics and an HTTP `noindex` header. Local agents can fetch `/llms.txt` directly. Remote agents need the public site or an attached `dist/llms-full.txt`.

The site uses Astro static output and a small deterministic Cloudflare Pages Function for optional context routing. It has no embedded chatbot. Full HTML, Markdown and JSON guidance covers 16 stack guides. Recommendation guidance follows the user’s task and explicit constraints; the catalogue is not a ranked universal recommendation. Setup recipes and dependency combinations are documentation-reviewed; they are not universally integration-qualified.

## Folder map

| Folder | Contents |
| --- | --- |
| `content/` | Agent entry, contact facts, routing contract and Cookout example |
| `menu/` | Profile summaries and dated research snapshots |
| `src/` | Static routes, semantic layout, metadata and responsive styles |
| `lib/`, `functions/` | Context routing and Markdown negotiation |
| `public/` | Fonts/licenses, favicon and share-card exports |
| `branding/` | Editable share artwork and source-to-surface mapping |
| `scripts/` | Content compilation, representation generation and preview |
| `docs/` | Contributor workflow and implementation scope |
| `.generated/`, `dist/` | Disposable build inputs/output; rebuild rather than editing |

Preserve imported Elixir Menu's Apache 2.0 [LICENSE](public/menu-assets/elixir-LICENSE.txt) and [NOTICE](public/menu-assets/elixir-NOTICE.txt). Repository code and editorial summaries use [Apache 2.0](LICENSE); preserve the [NOTICE](NOTICE) and [identity boundaries](BRANDING.md). Sources, review dates and gaps remain explicit in the guides.
