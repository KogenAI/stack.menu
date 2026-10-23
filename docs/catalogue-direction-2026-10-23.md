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

## Commerce and specialized tools within this boundary

Commerce remains relevant when choosing software architecture or scoping a rewrite. Identify whether the work is a storefront, an integration or an entire commerce application, and what already owns catalogue, orders, payment, tax/shipping rules, subscriptions and fulfillment. A custom storefront does not automatically require a custom commerce backend. [Shopify headless architecture](https://shopify.dev/docs/storefronts/headless).

The short preface can mention hosted commerce or specialized commerce software as alternatives to rebuilding everything. The core stack guidance should account for retained tools and interfaces. This does not authorize a Shopify/WooCommerce product-selection wizard, a payment-provider eligibility engine, vendor price comparisons or new full platform setup guides.

The best custom-commerce recommendation still needs a focused comparison of the actual software requirements. “Online store” should not automatically yield a generic web framework, nor should it automatically yield a hosted vendor. That narrower research remains proposed; no commerce default was approved.
