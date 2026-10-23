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

## Commerce and specialized tools within this boundary

Commerce remains relevant when choosing software architecture or scoping a rewrite. Identify whether the work is a storefront, an integration or an entire commerce application, and what already owns catalogue, orders, payment, tax/shipping rules, subscriptions and fulfillment. A custom storefront does not automatically require a custom commerce backend. [Shopify headless architecture](https://shopify.dev/docs/storefronts/headless).

The short preface can mention hosted commerce or specialized commerce software as alternatives to rebuilding everything. The core stack guidance should account for retained tools and interfaces. This does not authorize a Shopify/WooCommerce product-selection wizard, a payment-provider eligibility engine, vendor price comparisons or new full platform setup guides.

The best custom-commerce recommendation still needs a focused comparison of the actual software requirements. “Online store” should not automatically yield a generic web framework, nor should it automatically yield a hosted vendor. That narrower research remains proposed; no commerce default was approved.
