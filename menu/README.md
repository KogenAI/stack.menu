# Content and inputs

[Project home](../README.md)

`profiles.json` owns short titles, summaries, role/UI/deployment classifications and working-practice summaries for both imported and first-party profiles. `inputs/research/` holds dated snapshots of the maintained Kogen Stack Menu research packet; `inputs/elixir/` holds attributed Elixir Menu snapshots. `inputs/provenance.json` names their owners, dates and hashes. Preserve the original Elixir LICENSE and NOTICE. Do not call an adaptation date a new source review.

This website was prepared from the retained research in the local design checkout on 13 October 2026. The old visual attempts remain in that archive; they are not included in this website's served output. Future website presentation and agent routing changes belong here. Research corrections belong at the research owner, followed by explicit import using `scripts/import-inputs.py`; an ordinary build reads the checked-in snapshots without touching other projects.

`content/agent-entry.md` owns the agent workflow. `lib/router.js` owns the executable routing fields; `scripts/build-schema.mjs` derives `/context.schema.json` from those fields; `lib/selection-index.json` is generated from the same candidate records served as `/selection-index.json`. Root JSON, full records, Markdown and static guides derive from shared records. The browser is unnecessary for retrieval. Optional POST routing handles explicit fields; the visiting agent interprets prose and reasons about requirements.

Imported architecture/migration records retain their 11 October source date and not-run application checks. First-party curated profiles and migration records live in `curated/` and `migrations/`, with their own review date, evidence status, source links and validation. Add their profile classifications and concise directory fields to `profiles.json`; keep full sources and guidance in the first-party record. The compiler requires an exact union of imported and curated profile IDs and migration coverage for each. Do not refresh imported files to update first-party content. A shared capability or tool name does not establish source/target compatibility. Per-stack Markdown and JSON retain the full extended reference and transition research; HTML presents the same recommendations with direct complete-resource links.

`inputs/research/freshness.json` owns the imported check scope, core-guidance dates, corrections and source availability. The compiler exposes that imported receipt at `/research-freshness.json` alongside separately derived first-party profile dates, per-generator review/evidence and current corrections. Each record retains its own `research_freshness`; no later addition re-dates the 394-source imported check. `/coverage.json`, the homepage directory and coverage page derive all use cases from those same records.


[Generator guidance](generators/README.md) is a first-party current layer, separate from the imported research snapshots. It owns creation/template choices and conditional follow-up generation for every curated profile; `content/generation-policy.json` owns the common requirement. The compiler merges it into every profile representation and publishes `/generators.json`. Its source-review dates do not update or imply execution of older setup recipes.

`updates.json` owns narrowly sourced current corrections over imported tool facts. `scripts/current_content.py` applies each correction only while its declared previous wording still matches, so a later reimport requires reconciliation. Each served record and guide keeps the correction date/evidence alongside its unchanged original review date.

`recommendations.json` owns task-based editorial defaults, why/tradeoffs and conditional alternatives. The chooser, context router and generated agent selection workflow use that policy; it does not replace hard constraints or authorize a rewrite. Full guides remain available for explicitly chosen stacks and migration references.


## Current recommendation and rewrite-source owners

[`recommendations.json`](recommendations.json) owns task defaults, optional ecosystem/mobile constraints, conditional overrides and the older task-ID aliases. The shared resolver in [`lib/recommendation-policy.js`](../lib/recommendation-policy.js) applies that policy in the browser and optional endpoint. Guide coverage remains distinct from a recommendation for a particular task.

[`rewrite-sources.json`](rewrite-sources.json) owns five additional source references, their lifecycle evidence, version checks and application inventories. [`scripts/rewrite_sources.py`](../scripts/rewrite_sources.py) validates and renders the same records as HTML, Markdown and JSON. These sources do not enter the full-guide target index or require fictional new-project generators. Supported platforms and obsolete versions retain different lifecycle descriptions. Additions must cite primary guidance and state actual qualification limits.
