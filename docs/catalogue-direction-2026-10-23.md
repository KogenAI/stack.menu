# Catalogue direction — revised scope, 23 October 2026

[Project home](../README.md) · [Current implementation and open defects](current-state.md) · [Content owners and checks](website-workflow.md)

**Status: accepted scope and principles, with local implementation recorded by problem in current-state.md. No follow-up changes may be pushed before his approval.** This revision records Almir's clarification after the joint Opus review. It supersedes the broader approach-selection proposal. Agreement on the principles below is not acceptance of every guide disposition, platform addition or schema change previously proposed.

## Accepted direction and product boundary

Almir explicitly agreed to:

- Keep the 16 guides while stopping the presentation of all 16 as recommendations.
- Organize recommendations around tasks; technology-shaped categories such as “Python API” are inappropriate as top-level tasks.
- Add legacy migration sources.

Almir clarified that **Stack Menu focuses on choosing stacks for new software and rewriting existing software solutions**. It should briefly remind readers to consider existing services or specialized products, without becoming a general digital adviser or selecting an approach before selecting a stack.

The preface is a short, nonblocking reminder: before building or rewriting, consider whether an existing service or specialized tool already meets the need. Continue directly to the software/stack work when that is the user's intent. It is not another questionnaire, a required buy-versus-build stage or a new recommendation journey. Preserve explicitly chosen stacks and targets.

The earlier proposals for a service/platform decision engine, typed retain/service/product outcomes, an `approach` field, a SaaS directory and broad vendor-comparison records are **outside the clarified scope**. Shopify-first commerce selection and new standalone platform setup guides were not accepted. Preserve useful research as evidence rather than treating it as an approved backlog.

## What the catalogue needs to distinguish

1. **Recommendations for a task:** a reasoned starting stack, its trade-off and alternatives whose requirements actually apply.
2. **The guide library:** useful references for deliberate choices and existing projects, without equal recommendation status.
3. **Rewrite sources:** systems people actually have, including older versions/tooling and supported platforms. Source coverage is not a new-project endorsement.

A healthy omitted stack is not obsolete. WordPress and WooCommerce can be rewrite sources without being classified as legacy or becoming flagship new-project recommendations. No current guide needs deletion or a source-only label solely to reduce the visible number of recommendations.

Prefer per-task conditions over a global ranked badge. SwiftUI can be the primary for an iOS-specific requirement while Expo fits a shared iOS/Android brief. Language, team knowledge, hosting, an existing backend and device requirements narrow the task. Do not infer PHP expertise merely from owning WordPress.

## Historical observations at the 23 October base

The audited source is `9aa317fd6d85c4108343bb4a4062b77eed58cce9`, pushed on 23 October. Deployment is not certified by this review. The local follow-up reconciles the older unpublished wording with that source-publication receipt; this does not certify a later deployment.

- `src/design/recommend.html` labels all guide folders “Recommended stacks.” Guide browsing and actual recommendations need distinct presentation.
- `menu/recommendations.json` includes technology-shaped top-level jobs such as Python admin, Python API and full-stack React. The useful constraints should survive without reserving a headline category for each guide.
- `lib/router.js` accepts existing and target stacks from the same finite profile list. WordPress and WooCommerce fail as unknown profiles. Sources and recommended targets need distinct eligibility and an honest path for unlisted systems.
- `lib/migration-fit.js` currently knows browser UI and server-runtime responsibilities. A CMS or commerce rewrite also needs an application-specific inventory; matching language or component labels cannot establish a safe replacement.
- The browser rejects identical source and target selections even though maintaining or upgrading within an ecosystem can be useful. Supporting that path is a proposed detail, not a newly accepted product journey.

A primary recommendation currently references a full profile. Under the clarified scope, that is not inherently a defect: the main output should remain stack guidance. Revisit the record shape only where concrete stack compositions or source coverage require it; do not expand it to support a general procurement product.

## Task-based recommendations

Proposed reader-facing tasks should describe the software being built: content websites, business applications, collaborative applications, APIs/services, integrations/automation, command-line tools and mobile applications. Exact labels and grouping remain to be designed; no fixed number of categories is approved.

“Python API” becomes an API task narrowed by a real Python requirement. A React preference likewise narrows web-application guidance. Keep component choices when useful; do not pretend a language constraint is an independent business task.

When context is sufficient, show a clear starting recommendation with its reason and trade-off. Show conditional alternatives only where their deciding requirement matters. Missing context should prompt a consequential stack-selection question, not a long platform-shopping interview. Preserve existing guide URLs and useful shared links.

## Proposed disposition of the existing guides

These are proposed editorial starting points. Framework documentation supports capabilities, not proof of universal superiority. Existing healthy choices remain supported.

| Guide | Recommend when |
| --- | --- |
| Astro | A custom, mostly static content site is justified and the publishing workflow fits; combine with a CMS when editors need one. |
| Rails + Hotwire | A custom integrated web product is justified and no existing team/ecosystem requirement distinguishes alternatives. This is an editorial default, not a measured winner. |
| Django | Python expertise/libraries or Django's data/admin workflow materially benefit that product. |
| Laravel + Livewire | PHP expertise, a Laravel estate or its integrated conventions materially benefit that product. A WordPress source alone is not sufficient. |
| Phoenix + LiveView | Shared live interaction is central and its server-owned model fits. A realtime checkbox alone is insufficient. |
| Next.js | React full-stack requirements, especially Next-specific features, justify it. Compare with Start when the requirements do not decide. |
| React + Vite | A separately owned API and a deliberately assembled browser client justify it; routing/data needs are explicit. Static hosting alone does not rule out a framework. |
| Go service | A separate service boundary is justified; otherwise prefer the existing product framework's API. |
| FastAPI | A separate API benefits materially from Python libraries, SDKs or team context. |
| Rust service | Rust dependencies, existing ownership or demonstrated resource/performance constraints justify its additional demands. |
| Go CLI + TUI | A compiled, distributed CLI is needed; a TUI is conditional rather than compulsory. |
| Rust CLI + TUI | Rust dependencies or resource-control requirements materially justify it; a TUI remains conditional. |
| Python automation + AI | Custom integration/data logic is needed outside a better existing application or automation platform. AI is conditional. |
| Expo + React Native | An installable/device-specific shared mobile application is justified and required native capabilities fit. |
| Swift + SwiftUI | iOS-specific requirements or platform-first development justify a native client. |
| Kotlin + Compose | Android-specific requirements or platform-first development justify a native client. |

React's documentation recommends frameworks while explicitly supporting build-tool paths and explaining their assembly costs. Frameworks can also support static/client-only applications. Our recommendation must reflect both facts. [React application choices](https://react.dev/learn/creating-a-react-app), [build-tool trade-offs](https://react.dev/learn/build-a-react-app-from-scratch).

TanStack Start is stable and supports full-stack React with typed routing and server functions. A missing local guide is not evidence that Next.js is better. First add an honest, scoped Next/Start comparison with deciding requirements, not eight equal-looking alternatives. A new full Start guide should meet the normal source, generator and baseline-check bar; distinguish documentation review from actual starter/deployment execution. Apply that evidence standard consistently, including the existing failed Expo baseline checks. Do not imply a representative starter trial certifies real applications. [Start overview](https://tanstack.com/start/latest/docs/framework/react/overview), [Next deployment options](https://nextjs.org/docs/app/getting-started/deploying).

## Rewrite-source coverage

The local candidate adds the following initial source coverage:

- **Create React App, AngularJS and Vue 2:** version/tooling-specific source guidance with actual lifecycle evidence. CRA modernization can preserve React while changing tooling; Vue 2 can lead to Vue 3 rather than forcing a move to a framework we happen to document. [CRA lifecycle](https://react.dev/blog/2025/02/14/sunsetting-create-react-app), [AngularJS support](https://docs.angularjs.org/misc/version-support-status), [Vue 2 lifecycle](https://v2.vuejs.org/eol/).
- **WordPress and WooCommerce:** important real-world sources from Almir's examples, with inventories for publishing, plugins and commerce behavior. They are supported-platform source coverage, not automatically “legacy.” WooCommerce's source notes should reference shared WordPress responsibilities instead of duplicating them. [WordPress features](https://wordpress.org/about/features/), [WooCommerce migration considerations](https://help.shopify.com/en/manual/migrating-to-shopify/migrating-from-woocommerce).
- **Other sources:** report coverage gaps honestly. Drupal, Magento, Shopify and other platforms need scoped source research as relevant; they are not automatically scheduled full additions.

Separate normal source and target eligibility. Lifecycle-only records should not appear as recommended new-project targets. A documented source is not a promise that every target can replace it. Conversely, absent capabilities in a target guide are not proof replacement is impossible.

For a real rewrite, inventory responsibilities as **kept**, **replaced** or **retired**, naming their owners, interfaces and validation. This is software migration scope, not general business consultancy. Plugin behavior remains unknown until inspected. A frontend-only replacement must not silently discard a backend, editing workflow, checkout or order system. Full replacement can still be appropriate when those responsibilities are implemented elsewhere or deliberately removed.

## Commerce and specialized tools within this boundary

Commerce remains relevant when choosing software architecture or scoping a rewrite. Identify whether the work is a storefront, an integration or an entire commerce application, and what already owns catalogue, orders, payment, tax/shipping rules, subscriptions and fulfillment. A custom storefront does not automatically require a custom commerce backend. [Shopify headless architecture](https://shopify.dev/docs/storefronts/headless).

The short preface can mention hosted commerce or specialized commerce software as alternatives to rebuilding everything. The core stack guidance should account for retained tools and interfaces. This does not authorize a Shopify/WooCommerce product-selection wizard, a payment-provider eligibility engine, vendor price comparisons or new full platform setup guides.

The best custom-commerce recommendation still needs a focused comparison of the actual software requirements. “Online store” should not automatically yield a generic web framework, nor should it automatically yield a hosted vendor. That narrower research remains proposed; no commerce default was approved.

## Completion checks and separate problems

Accepted local implementation checks:

1. The library keeps all 16 guides without labeling them all recommendations.
2. An API task can be narrowed by Python needs without presenting “Python API” as its own top-level task.
3. The preface is brief and nonblocking; an explicit build in Laravel, Phoenix or Rust proceeds within that choice.
4. CRA/Vue 2 modernization can retain the application's ecosystem and replace only the relevant version/tooling.
5. A WordPress or WooCommerce source receives the right inventory and is not mapped to Laravel merely because it uses PHP.
6. A browser-only rewrite cannot silently discard backend or commerce responsibilities; a deliberate full replacement can explain their new owners or retirement.
7. An unlisted source gets an honest coverage/research path without invented compatibility.
8. An iOS-specific requirement can select SwiftUI as the primary.
9. Human HTML, direct/negotiated Markdown, llms discovery, JSON and routing guidance agree; useful published IDs and links remain meaningful.

Map actual implementation changes to independently assessable problems before choosing a commit count. The recommendation presentation/curation, task taxonomy and rewrite-source support have distinct observable outcomes; sharing a file is not a reason to mix unrelated changes. The current schema and source records are implemented locally for review; broader additions remain proposals.

At the proposal stage, Expo routing, malformed Expo alternatives, chooser scrolling/focus, long labels, inline-link styling, negotiated Markdown, legacy `?kind=` behavior and the migration clarification hole were separate open defects. Their subsequent repairs and verification are recorded in [current implementation scope](current-state.md). Reader HTTP 403/1010 remains a separate hosting problem. The scope decision itself did not close any implementation defect.

## Provenance and remaining decisions

The lead and Claude Code 2.1.306, main model `claude-opus-5-5`, high effort, completed an independent audit and a follow-up challenge in session `1f1afb61-fb8a-4837-847f-8168214ab582`. Both rounds succeeded without permission denials. Evidence is retained at `/Users/almirsarajcic/Areas/Kogen/stack.menu-review/2026-10-23/catalogue-direction/`.

Almir's later clarification in this chat owns the narrower product boundary and the three accepted principles above. Earlier Opus/lead proposals are historical evidence, not additional authority or an approved backlog. The local candidate makes the task labels, initial source list and source/target behavior concrete for review. Broader commerce comparisons and any additional full guide remain proposals. The research review did not execute an application benchmark or migration. Almir then authorized the local implementation candidate; current checks and remaining limits belong to [implementation scope](current-state.md). Broader guide expansions and commerce defaults remain deferred.
