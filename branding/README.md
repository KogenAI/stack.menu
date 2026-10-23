# Artwork and surface map

[Project home](../README.md) · [Refresh procedure](../docs/website-workflow.md) · [Design adaptation](../docs/redesign-2026-10-20.md)

Almir selected Oghogho’s design for implementation on 20 October 2026. The released site uses its mark, near-white/near-black surfaces, blue links, Geist prose, JetBrains Mono utility text, pill actions and glass folders. The source is `optimumBA/design` at `9c62989`; its design library remains the collaboration owner. The 21 October release used signed commit `2ce8993dfff5e16b4764ccc07426f5df5a7fb0ec` and Cloudflare deployment `e031b7ef-7198-4372-a304-b1b477392769`; see the [current-state release record](../docs/current-state.md#real-demonstration--21-october-2026). The 23 October reviewed base `9aa317f` was pushed. The subsequent task/rewrite-source candidate remains local; deployment evidence is owned by the maintainer’s surface record.

[`mark.svg`](mark.svg) is the reusable designer mark master. The header/footer inline it from this file; [`share-card.svg`](share-card.svg) is the editable URL-card composition. Run `npm run export:share` after either changes: it synchronizes the mark in the card, exports [`public/share-card.png`](../public/share-card.png) at 1200×630 and regenerates the theme-aware [`favicon.svg`](../public/favicon.svg). Then rebuild and inspect real rendered sizes/crops. The share card uses a portable Arial fallback; on-page type remains the designer’s locally bundled fonts.

| Surface | Editable text/source | Asset or output |
| --- | --- | --- |
| Homepage | [`src/design/home.html`](../src/design/home.html) | `/`; centered real ChatGPT recording and matching player in the agent panel |
| Agent marks | [LobeHub Icons at pinned revision](https://github.com/lobehub/lobe-icons/tree/680f1d7f95b5ae6a494fe43539da8a992f17b53d/packages/static-svg/icons) | [`public/design/orbit/`](../public/design/orbit/) contains unchanged Claude, Codex and Cursor SVGs at their existing URLs. [`public/attribution/logos-NOTICE.txt`](../public/attribution/logos-NOTICE.txt) maps each asset to its upstream file and SHA-256 hashes; [`lobehub-icons-LICENSE.txt`](../public/attribution/lobehub-icons-LICENSE.txt) contains the full MIT notice |
| Demo media | Maintainer-held original and edit recipe; [`public/media/`](../public/media/) contains publication derivatives only | `stack-menu-demo.mp4` (H.264, silent, 16.5 seconds, 2304×1612) and its actual-frame JPEG poster; selected source ranges sped up 4×/16× |
| Header/footer | [`src/design/`](../src/design/), `mark.svg` | Shared initial HTML across all pages |
| Library, comparisons, recommendation and rewrite | [`scripts/design_interactive.py`](../scripts/design_interactive.py), `src/design/`, `public/design/interactive.*` | `/library/`, `/compare/`, `/choose/`, `/rewrite/` |
| Stack guides | [`scripts/design_guides.py`](../scripts/design_guides.py), maintained profiles/generators/contracts | All 16 current `/stacks/{id}/` pages |
| Agent guidance | [`content/agent-entry.md`](../content/agent-entry.md), [`content/generation-policy.json`](../content/generation-policy.json), [`menu/generators/`](../menu/generators/) and attributed records | `/llms.txt`, full guides, Markdown, JSON and `/generators.json` |
| Contact and footer facts | [`content/contact.json`](../content/contact.json) | `/contact/`, `/contact.json`, Markdown and structured metadata |
| Browser icon | `mark.svg`, export script | `/favicon.svg` |
| Shared URL card | `share-card.svg`, `mark.svg` | `/share-card.png`; shared Open Graph metadata |
| Production website | [`src/layouts/Menu.astro`](../src/layouts/Menu.astro), Pages handlers/configuration | Canonical `https://stack.menu` on Cloudflare Pages; current evidenced release is 21 October 2026 |

Local fonts retain their [Geist](../public/design/geist-LICENSE.txt) and [JetBrains Mono](../public/design/jetbrains-mono-LICENSE.txt) notices. Preserve the imported Elixir Menu and earlier Plex notices as well. Designer folder artwork is generated locally by the retained portable implementation. The homepage’s three agent marks use the pinned LobeHub files and license listed above; this attribution does not claim trademark clearance or endorsement.

The iCloud product record `publishing/branding/stack-menu/MESSAGING.md` owns accepted messaging/provenance; the templates implement it. That folder’s `SURFACES.md` owns external account/deployment evidence. This map owns source-to-output paths. A local export does not establish a saved live card or publication. Analytics and contact/privacy claims must describe the actual production configuration.
