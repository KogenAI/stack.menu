# Add Bruno sponsorship to Stack Menu

Slug: stack-menu-bruno-sponsorship
Model: not applicable — the change adds static page content, a static profile page and agent guidance text; it has no stateful behavior.
Acceptance:
- .kogen/intents/stack-menu-bruno-sponsorship/acceptance.feature
- features/steps/stack-menu-bruno-sponsorship__steps.js

This Intent adds one disclosed sponsorship for Bruno (an API client for testing and sharing HTTP requests). The Build reuses or adapts the verified source patch (SHA-256 cc4d81218e151c210e6e04ae86aa3015334eeaef6fc1582b203dfaa7cec67803, including the Bruno mark, apply-checked against KogenAI/stack.menu at 0349f48a3e98b59da468d8f857aa01144491e4d5; asset https://app.kogen.studio/workspaces/optimum/projects/stack-menu/assets/bruno-preview-patch-20261118/original/1, local review record https://app.kogen.studio/workspaces/optimum/projects/stack-menu/documents/bruno-sponsorship-local-review-20261118?revision=1), after checking the actual source revision, and follows the maintained Stack Menu workflow in docs/website-workflow.md.

Homepage. A Sponsored card is placed after the full hero demo (the hero figure with its video, caption `hero-demo-caption` and "What happens in this demo?" summary) and before the "Bring the coding agent you already use" section. It is one element marked `data-sponsor="bruno"` that says Sponsored and Bruno and shows the first-party Bruno mark as an `img` with non-empty alt text and a root-relative `src` that exists in `dist`. It has exactly one primary link (`data-sponsor-link="primary"`) to the plain Bruno product link (https, host usebruno.com, no query string or fragment, `rel` containing `sponsored`) and exactly one secondary link (`data-sponsor-link="profile"`) to `/sponsors/bruno/`. The card layout works at desktop and phone widths (390 px): its styles contain it (no fixed width over 380 px) and a media query at a breakpoint between 390 and 1024 px separates the phone from the desktop layout.

Profile. `/sponsors/bruno/` is a built page with an h1 naming Bruno. It says Bruno is a Stack Menu sponsor, that any mention is optional, that Stack Menu selection stays based on requirements, and describes API testing. It links to the plain Bruno product link only, and is listed in `sitemap.xml`.

Agent guidance. `content/agent-entry.md` gains one section whose `##` heading contains the word sponsor (for example "Optional sponsored discovery"), which reaches `dist/llms.txt` and `dist/llms-full.txt` unchanged. After stack selection, the agent may mention Bruno as optional and must say explicitly that it is a Stack Menu sponsor, only for a relevant API testing or shared HTTP request need where the user has no existing tool and no conflicting requirement. It links `/sponsors/bruno/` and the plain product link. It tells the agent to omit the mention for unrelated tasks, chosen tooling, ad-free requests and declines. It states the plain product link stays in use pending a verified referral arrangement; no referral or tracking parameters are added. Bruno appears nowhere else in `content/agent-entry.md`.

Boundaries. Core stack selection, ranking and setup stay requirements-based: no Bruno or sponsor mention in `lib/`, `functions/`, `menu/`, `content/routing.md`, the route responses, `recommendations.json`, `choose.md`, the selection index, catalogue, generators or any stack guide. Nothing is deployed or pushed, no dependency is added, and `.kogen/project.yaml` is not edited. Existing scenarios under `tests/scenarios/` stay unchanged and green. The Build runs `npm run check`, and records the Build and verification outcome (including the agent entry, sponsor guidance and full bundle checks, the relevant API scenario and the unrelated and chosen-tool controls from the review record, and a browser inspection of the card at desktop width and 390 px through the maintained preview, or a statement that it could not) on the issue https://app.kogen.studio/workspaces/optimum/projects/stack-menu/issues/40091ac7-0115-407c-81d7-60dbb4619d9d.

## Decisions
- The card is identified by `data-sponsor="bruno"` with `data-sponsor-link` values `primary` and `profile`, and the profile lives at `/sponsors/bruno/`; the source patch is adapted to these names. (decision: D1, round 1) (evidence: src/design/home.html; src/pages/[...page].astro; scripts/finalize.py) (assumption: the patch's own markup and profile path may differ; the Build adapts the patch to these literals.) (source: request)
- The plain Bruno link is any https usebruno.com URL without query string or fragment, expected to be https://www.usebruno.com/; no referral parameters until an arrangement is verified. (decision: D2, round 1) (assumption: the exact plain product URL is the one in the review patch and was not fetched while shaping.) (source: request)
- The external Bruno link carries rel containing `sponsored` to mark paid placement. (decision: D3, round 1) (assumption: rel=sponsored is an accepted way to disclose the placement.) (source: request)
- Sponsor guidance is one `##` section of content/agent-entry.md; llms.txt and llms-full.txt derive from that file, so the full bundle carries it. (decision: D4, round 1) (evidence: content/agent-entry.md; scripts/minimal_site.py; scripts/build-menu.py; scripts/build-agent-content.py) (source: request)
- Selection, ranking and setup stay unchanged; acceptance proves it by absence of Bruno from routing code, policy, route responses and stack guides, and the unchanged existing scenario tests. (decision: D5, round 1) (evidence: lib/router.js; menu/recommendations.json; tests/scenarios/helpers.js; package.json) (source: request)
- Layout is checked statically through built CSS and not by pixels; the Build performs the desktop and 390 px browser inspection through the maintained preview, because no browser dependency exists in the project. (decision: D6, round 1) (evidence: package.json; public/design/home.css) (assumption: a human or the Build's inspection covers actual rendering; no step observes pixels.) (source: request)
- Acceptance builds one disposable copy with the configured build script, as the existing Stack Menu Intents do. (decision: D7, round 1) (evidence: features/steps/stack-menu-desktop-guidance__steps.js; package.json) (source: request)
- Agent behavior itself cannot be executed deterministically; the guidance text carrying each condition and each omission is the testable surface. Controls are deferred because the correct implementation spans page markup, CSS, a new page, assets and guidance. (decision: D8, round 1) (evidence: content/agent-entry.md) (assumption: guidance wording checks stand in for the review record's live agent controls.) (source: request)

## Source comparison
- Sponsored card after the full homepage demo and caption; card goes to Bruno, secondary link opens the profile: addressed in scenarios 1 and 2.
- Desktop and phone widths: static CSS check in scenario 3; rendered inspection recorded by the Build or an external handoff.
- Dedicated sponsor profile: scenario 4.
- Optional mention after stack selection with explicit sponsor disclosure, only for relevant API testing or shared HTTP request need with no existing tool or conflict; omit for unrelated tasks, chosen tooling, ad-free requests, declines; plain link pending verified referral arrangement: scenario 5.
- Selection, ranking and setup remain requirements-based; relevant API and chosen-tool controls: scenarios 6, 7 and 8.
- Required `npm run check`: scenario 9 runs its test and compiler stages in the copy; the Build runs the full command.
- Recording the outcome on the issue: Build obligation stated in prose; not executable here.
- Source patch content, actual patch URL and review record were not readable while shaping: preserved as references the Build must consult; omitted from acceptance.
- Referral links, deployment, push, new dependencies and other sponsors: omitted.

## Tests
- Homepage card placement, mark, disclosure and links: features/steps/stack-menu-bruno-sponsorship__steps.js (scenario)
- Card layout containment and phone/desktop breakpoint: features/steps/stack-menu-bruno-sponsorship__steps.js (scenario)
- Sponsor profile page content, plain link and sitemap: features/steps/stack-menu-bruno-sponsorship__steps.js (scenario)
- Sponsored discovery guidance in entry, llms.txt and full bundle with conditions, omissions and plain link: features/steps/stack-menu-bruno-sponsorship__steps.js (scenario)
- Route responses and selection, ranking and setup content stay free of Bruno: features/steps/stack-menu-bruno-sponsorship__steps.js (scenario)
- Earlier scenarios stay green: tests/scenarios (existing)

## Feasibility
- none
