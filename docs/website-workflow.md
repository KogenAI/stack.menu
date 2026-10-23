# Build and contribute

[Project home](../README.md) · [Implementation scope](current-state.md) · [Content inputs](../menu/README.md)

Start at the checkout root with Node 24 (minimum 22.12), npm 9.6.5+ and Python 3.9+. The lockfile and `.node-version` record the build inputs. The production site is [stack.menu](https://stack.menu/); the repository is [KogenAI/stack.menu](https://github.com/KogenAI/stack.menu).

## Content owners

| Change | Editable source |
| --- | --- |
| Agent instructions and reference discovery | [`content/agent-entry.md`](../content/agent-entry.md) |
| Context fields and selection behavior | [`content/routing.md`](../content/routing.md), [`lib/router.js`](../lib/router.js), shared [`lib/migration-fit.js`](../lib/migration-fit.js) |
| Generator workflow and per-profile recipes | [`content/generation-policy.json`](../content/generation-policy.json), [`menu/generators/`](../menu/generators/), rendered by [`scripts/generator_content.py`](../scripts/generator_content.py) |
| Task defaults, preferences and aliases | [`menu/recommendations.json`](../menu/recommendations.json), [`lib/recommendation-policy.js`](../lib/recommendation-policy.js), [`scripts/recommendation_content.py`](../scripts/recommendation_content.py) |
| Profile summaries | [`menu/profiles.json`](../menu/profiles.json) |
| Dated research and imported attribution | [`menu/inputs/`](../menu/inputs/) and [`menu/README.md`](../menu/README.md) |
| Contact, company identity and mailbox purposes | [`content/contact.json`](../content/contact.json) |
| Human-page copy and interactive layouts | [`src/design/`](../src/design/), [`scripts/design_site.py`](../scripts/design_site.py), [`scripts/design_interactive.py`](../scripts/design_interactive.py) |
| Complete guide presentation | [`scripts/design_guides.py`](../scripts/design_guides.py), [`public/design/guide.css`](../public/design/guide.css) and [`guide.js`](../public/design/guide.js) |
| Shared layout, metadata and responsive styles | [`src/layouts/Menu.astro`](../src/layouts/Menu.astro), [`src/styles.css`](../src/styles.css) |
| Icons, share artwork and licensed fonts | [`branding/README.md`](../branding/README.md) |
| Recorded demonstration | [`src/design/home.html`](../src/design/home.html), [`public/design/home.css`](../public/design/home.css), [`home.js`](../public/design/home.js) and publication derivatives in [`public/media/`](../public/media/) |

Contact facts must match the product's maintained public routes and [Optimum Tech's published identity](https://optimum.ba/). The [Elixir Menu contact page](https://elixir.menu/contact/) supplies the existing tool-correction structure. Keep each mailbox's purpose explicit, use visible email addresses, and label the mailing address accurately. Update the contact snapshot first; the HTML, JSON export, structured metadata and generated Markdown share it. A mailto link is not delivery evidence.

## Ordered local refresh

1. Edit the affected owner. Preserve original research dates, provenance and third-party LICENSE/NOTICE files. A build uses checked-in snapshots and needs no other project checkout. To import revised maintained sources explicitly, use `python3 scripts/import-inputs.py --research <packet-directory> --elixir <Elixir-Menu-checkout> --snapshot-date <YYYY-MM-DD>` with the actual source directories; review changed facts and hashes before building.
2. Run `npm ci` on a new checkout or changed lockfile. After editing the mark or share master, run `npm run export:share`. Then run `npm run build`. Shared records generate initial HTML, Markdown/JSON, schema, sitemap, robots and Pages routing/header configuration. Never edit `dist/` or `.generated/` directly.
3. Run `npm run preview`; open `http://127.0.0.1:8770/` (override the port with `STACK_MENU_PORT`). This adapter uses the Pages middleware and route handler. Local responses prohibit indexing and analytics. Stop the preview when finished.
4. Inspect changed pages and shared-layout consumers at desktop and phone widths. Include the footer, keyboard focus, loaded fonts and long text. Check ordinary links/anchors, descriptive labels, unique page titles/descriptions and correct canonical metadata. Contact/About/Privacy should use the same shell and factual content as the rest of the site.
5. Fetch HTML, direct Markdown/JSON and negotiated `Accept: text/markdown` variants. Check MIME, `Vary: Accept`, GET/HEAD, true missing-page status and representation agreement. For routing changes, check chosen-stack preservation, new choices, explicit migration, native/offline/static requirements and invalid context. Use direct checks appropriate to the change; do not add a static-site regression suite.
6. Record changed scope and actual verification. A later source change needs renewed checks for its affected output. Keep setup recipes labeled documentation-reviewed until the application recipe has actually run.

Output: a clean `dist/`, prepared Pages handlers and checked local preview. Deployment uses Cloudflare Pages with `npm run build`, output `dist/` and the repository's `functions/`. The deterministic `/route` requires Functions; all reference guidance remains directly readable. Production account, DNS, analytics and search operations belong to the site's maintainer.

For demo refreshes, preserve the original and exact source-range/speed recipe outside the public source tree. Encode H.264 MP4 with `yuv420p` and fast-start metadata, retain the capture's proportions, and use a frame from that export as the poster. Copy only the checked derivatives into `public/media/`. Keep controls, inline playback, explicit dimensions, speed disclosure and a text summary; avoid automatic playback or loading the whole video before a visitor plays it. Build, check MIME and GET/HEAD/range responses, then exercise playback, seeking, pause and fullscreen in the actual local browser on desktop and phone. Verify the local preview remains noindex and sends no analytics. Publication requires the same checks against the saved production revision; a local card/video export does not establish live delivery.

On failure, retain the diagnostic, repair the failed prerequisite, rebuild and resume that check. Do not serve stale output as a checked candidate. A successful build or scanner score cannot replace rendered review; missing browser evidence remains an explicit limitation.

## Agent-access baseline

Serve essential answers in initial HTML with ordinary links and a canonical sitemap. Preserve real statuses, legitimate public crawler access and direct text resources. Markdown must come from the same content owner, with correct MIME and format-specific cache behavior. Only advertise resources that exist. Reference sites need no invented MCP, payment or login capability. Scanner observations supplement direct access and content checks; neither proves indexing, ranking or successful application setup.

Implementation references: [Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/), [Functions API](https://developers.cloudflare.com/pages/functions/api-reference/), [Pages headers](https://developers.cloudflare.com/pages/configuration/headers/), [Google search guidance](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

## Maintain generator guidance

Inputs: affected profile, actual application role, generator/toolchain version and current primary documentation. Start at the checkout root; read the [generator owner](../menu/generators/README.md) and its matching source record. Tools: official documentation, JSON editor, normal build, local preview and direct HTTP inspection.

1. Check official creation and incremental-generator documentation, including installed-version help, option defaults, required tools and whether initialization creates version control or commits. Record the reviewed date and source URLs in the affected `menu/generators/<profile-id>.json`. Distinguish language/module initialization, framework scaffolding and IDE templates. Do not invent a generator where none is documented.
2. Include the appropriate starting points, prerequisites, command working directories, consequential choices, generated files to preserve and conditional follow-up generators. Keep `integration_steps` consistent with those starting points; it replaces dated imported setup instructions in served profiles. Put the shared requirement and generation receipt only in `content/generation-policy.json`; imported historical snapshots retain their original dates and owners.
3. Keep `evidence_status` accurate. Source review alone leaves commands unexecuted; a later actual trial must name the exact toolchain/options and results before claiming execution. Do not treat a single trial as qualification of all dependency combinations.
4. Build. The compiler requires one generator record per curated profile and includes each in its HTML, complete Markdown, structured JSON and full bundle. `/generators.json` exposes the shared workflow and all generator records. Check affected HTML and text/JSON directly, including negotiated Markdown, then inspect desktop and phone rendering.
5. Verify the entry guidance and discovery links reach the generator section. Review that examples cannot be mistaken for an instruction to run all generators or overwrite an existing application. Update implementation scope with what was actually checked.

Outputs: reviewed editable generator records, synchronized representations and a checked local candidate. On missing docs or a failed build, retain the gap/diagnostic, repair the affected owner and resume that step. Completion means all curated profiles have explicit generation guidance, representation agreement passes, and execution limits remain visible. This site publishes instructions; the consuming agent or build system must execute and enforce them.


## Repository commits

For `KogenAI/stack.menu`, use short sentence-case imperative subjects, at most 50 characters, with signed commits and one commit per complete problem. Verified 18 October 2026: the preceding history contained only `b73921ad95e33099f8373296ae30cb2cfd233da2` (`Initial commit`), so no broader convention was established. Almir accepted `Require official generators in stack guides` for the generator-guidance change and explicitly requested its push. Commit/push authorization remains specific to each requested change.

## Refresh Oghogho’s presentation

Start at this repository root with the current design revision and the maintained profile records. [Design provenance and adaptation map](redesign-2026-10-20.md) identifies the imported baseline. The shared design repository remains the collaboration owner; this checkout owns the production implementation.

1. Fetch the design repository, inspect its clean state and fast-forward the shared branch when appropriate. Review changes to the registered Stack Menu design before adapting them; never replace the production content compiler with its dated content snapshot.
2. Edit `src/design/` for page/chrome markup, `public/design/` for browser behavior and tokens, and `scripts/design_*.py` for record-backed page generation. Tailwind 3.4.17 compiles utilities during the build; do not add its browser JIT runtime. Keep external scripts/styles compatible with the policy in `lib/security-policy.json`, used by both middleware and static headers.
3. Refresh brand exports, build and preview with the ordered procedure above. Check library search/empty recovery, a two-stack comparison, recommendation shared links, rewrite source/target validation, and guide selections/copy/download. For mismatched application roles, check that a brief remains unavailable until the replaced boundary and retained interfaces are defined; an interface redesign also needs intended changes/removals and must not offer compatible replacement. Reopening a shared URL or changing the pair must not reuse completed free-text scope. Confirm source and browser copies of `lib/migration-fit.js` agree. Exercise picker arrows, Home/End, type-ahead, Enter, Escape and Tab. Check desktop, phone and both themes, including all changed shared-template consumers and the footer. Essential guide content and library links must remain in initial HTML.
4. Compare canonical agent resources with the pre-change version when touching the content pipeline. Preserve source/review dates and factual owners. Record the exact reviewed design/source revisions and actual checks in the owning current-state record.

Output: a checked, editable local candidate with synchronized artwork and generated representations. If a control, build, policy or content-parity check fails, repair the source owner, rebuild and repeat the affected check. A push may deploy production: honor the current task’s explicit Git boundary. Completion for local-only work is the requested signed local commit plus review evidence; it does not imply publication.
