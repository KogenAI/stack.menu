# Build and contribute

[Project home](../README.md) · [Implementation scope](current-state.md) · [Content inputs](../menu/README.md)

Start at the checkout root with Node 24 (minimum 22.12), npm 9.6.5+ and Python 3.9+. The lockfile and `.node-version` record the build inputs. The production site is [stack.menu](https://stack.menu/); the repository is [KogenAI/stack.menu](https://github.com/KogenAI/stack.menu).

## Content owners

| Change | Editable source |
| --- | --- |
| Agent instructions and reference discovery | [`content/agent-entry.md`](../content/agent-entry.md) |
| Context fields and selection behavior | [`content/routing.md`](../content/routing.md), [`lib/router.js`](../lib/router.js) |
| Profile summaries | [`menu/profiles.json`](../menu/profiles.json) |
| Dated research and imported attribution | [`menu/inputs/`](../menu/inputs/) and [`menu/README.md`](../menu/README.md) |
| Contact, company identity and mailbox purposes | [`content/contact.json`](../content/contact.json) |
| Human-page copy | [`scripts/minimal_site.py`](../scripts/minimal_site.py) |
| Shared layout, metadata and responsive styles | [`src/layouts/Menu.astro`](../src/layouts/Menu.astro), [`src/styles.css`](../src/styles.css) |
| Icons, share artwork and licensed fonts | [`branding/README.md`](../branding/README.md) |

Contact facts must match the product's maintained public routes and [Optimum Tech's published identity](https://optimum.ba/). The [Elixir Menu contact page](https://elixir.menu/contact/) supplies the existing tool-correction structure. Keep each mailbox's purpose explicit, use visible email addresses, and label the mailing address accurately. Update the contact snapshot first; the HTML, JSON export, structured metadata and generated Markdown share it. A mailto link is not delivery evidence.

## Ordered local refresh

1. Edit the affected owner. Preserve original research dates, provenance and third-party LICENSE/NOTICE files. A build uses checked-in snapshots and needs no other project checkout. To import revised maintained sources explicitly, use `python3 scripts/import-inputs.py --research <packet-directory> --elixir <Elixir-Menu-checkout> --snapshot-date <YYYY-MM-DD>` with the actual source directories; review changed facts and hashes before building.
2. Run `npm ci` on a new checkout or changed lockfile. After editing the share master, run `npm run export:share`. Then run `npm run build`. Shared records generate initial HTML, Markdown/JSON, schema, sitemap, robots and Pages routing/header configuration. Never edit `dist/` or `.generated/` directly.
3. Run `npm run preview`; open `http://127.0.0.1:8770/` (override the port with `STACK_MENU_PORT`). This adapter uses the Pages middleware and route handler. Local responses prohibit indexing and analytics. Stop the preview when finished.
4. Inspect changed pages and shared-layout consumers at desktop and phone widths. Include the footer, keyboard focus, loaded fonts and long text. Check ordinary links/anchors, descriptive labels, unique page titles/descriptions and correct canonical metadata. Contact/About/Privacy should use the same shell and factual content as the rest of the site.
5. Fetch HTML, direct Markdown/JSON and negotiated `Accept: text/markdown` variants. Check MIME, `Vary: Accept`, GET/HEAD, true missing-page status and representation agreement. For routing changes, check chosen-stack preservation, new choices, explicit migration, native/offline/static requirements and invalid context. Use direct checks appropriate to the change; do not add a static-site regression suite.
6. Record changed scope and actual verification. A later source change needs renewed checks for its affected output. Keep setup recipes labeled documentation-reviewed until the application recipe has actually run.

Output: a clean `dist/`, prepared Pages handlers and checked local preview. Deployment uses Cloudflare Pages with `npm run build`, output `dist/` and the repository's `functions/`. The deterministic `/route` requires Functions; all reference guidance remains directly readable. Production account, DNS, analytics and search operations belong to the site's maintainer.

On failure, retain the diagnostic, repair the failed prerequisite, rebuild and resume that check. Do not serve stale output as a checked candidate. A successful build or scanner score cannot replace rendered review; missing browser evidence remains an explicit limitation.

## Agent-access baseline

Serve essential answers in initial HTML with ordinary links and a canonical sitemap. Preserve real statuses, legitimate public crawler access and direct text resources. Markdown must come from the same content owner, with correct MIME and format-specific cache behavior. Only advertise resources that exist. Reference sites need no invented MCP, payment or login capability. Scanner observations supplement direct access and content checks; neither proves indexing, ranking or successful application setup.

Implementation references: [Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/), [Functions API](https://developers.cloudflare.com/pages/functions/api-reference/), [Pages headers](https://developers.cloudflare.com/pages/configuration/headers/), [Google search guidance](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
