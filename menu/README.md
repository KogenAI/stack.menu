# Content and inputs

[Project home](../README.md)

`profiles.json` owns short titles, summaries, role/UI/deployment classifications and working-practice summaries. `inputs/research/` holds dated snapshots of the maintained Kogen Stack Menu research packet; `inputs/elixir/` holds attributed Elixir Menu snapshots. `inputs/provenance.json` names their owners, dates and hashes. Preserve the original Elixir LICENSE and NOTICE. Do not call an adaptation date a new source review.

This website was prepared from the retained research in the local design checkout on 13 October 2026. The old visual attempts remain in that archive; they are not included in this website's served output. Future website presentation and agent routing changes belong here. Research corrections belong at the research owner, followed by explicit import using `scripts/import-inputs.py`; an ordinary build reads the checked-in snapshots without touching other projects.

`content/agent-entry.md` owns the agent workflow. `lib/router.js` owns the executable routing fields; `scripts/build-schema.mjs` derives `/context.schema.json` from those fields; `lib/selection-index.json` is generated from the same candidate records served as `/selection-index.json`. Root JSON, full records, Markdown and static guides derive from shared records. The browser is unnecessary for retrieval. Optional POST routing handles explicit fields; the visiting agent interprets prose and reasons about requirements.

Architecture/migration records retain the 11 October source date and not-run application checks. A shared capability or tool name does not establish source/target compatibility. Per-stack Markdown and JSON retain the full extended reference and transition research; HTML presents the same recommendations with direct complete-resource links.

`inputs/research/freshness.json` owns the imported check scope, core-guidance dates, corrections and source availability. The compiler exposes `/research-freshness.json` and each record’s `research_freshness`; original review dates are preserved. `/coverage.json`, the homepage directory and coverage page derive all use cases from those same records.


[Generator guidance](generators/README.md) is a first-party current layer, separate from the imported research snapshots. It owns creation/template choices and conditional follow-up generation for every curated profile; `content/generation-policy.json` owns the common requirement. The compiler merges it into every profile representation and publishes `/generators.json`. Its source-review dates do not update or imply execution of older setup recipes.
