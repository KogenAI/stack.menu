# Artwork and surface map

[Project home](../README.md) · [Build and contribute](../docs/website-workflow.md)

The website keeps human presentation small and agent guidance complete. Human design and demo media are pending; earlier design attempts are not part of this repository. The simple `s` favicon and text-only share card are provisional assets. They are not a final replacement identity.

[Share master](share-card.svg) is editable. Run `npm run export:share` to regenerate [`public/share-card.png`](../public/share-card.png); rebuild after any export change. Preserve the licensed IBM Plex font files and their [Sans](../public/menu-assets/fonts/plex-sans-LICENSE.txt) and [Mono](../public/menu-assets/fonts/plex-mono-LICENSE.txt) licenses.

| Surface | Editable text/source | Asset or output |
| --- | --- | --- |
| Human homepage | [`scripts/minimal_site.py`](../scripts/minimal_site.py) | `/` in the shared layout |
| Agent guidance | [`content/agent-entry.md`](../content/agent-entry.md), [`content/generation-policy.json`](../content/generation-policy.json), [`menu/generators/`](../menu/generators/) and attributed records | `/llms.txt`, guides, Markdown, JSON and `/generators.json` |
| Contact and footer | [`content/contact.json`](../content/contact.json); contributor refresh procedure | `/contact/`, `/contact.json`, Markdown and ContactPage metadata |
| Browser icon | [`public/favicon.svg`](../public/favicon.svg) | `/favicon.svg` |
| Shared URL card | Product name, headline and introduction in [`share-card.svg`](share-card.svg) | `/share-card.png`; shared Open Graph metadata |
| Production website | [`src/layouts/Menu.astro`](../src/layouts/Menu.astro), Pages handlers/configuration | Canonical `https://stack.menu` on Cloudflare Pages |

Before changing assets, check message agreement and actual small-icon/card crops. Keep temporary assets distinct from an accepted designer master. A local export cannot establish that a hosted upload or saved share card matches it. Analytics and contact/privacy claims must describe the actual production configuration.
