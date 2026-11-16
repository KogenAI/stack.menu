# Distinguish recommendations from references

Slug: stack-menu-recommendation-emphasis
Model: not applicable — the change adds a derived response field and relabels or rewords text; it has no state transitions.
Acceptance:
- .kogen/intents/stack-menu-recommendation-emphasis/acceptance.feature
- features/steps/stack-menu-recommendation-emphasis__steps.js

For `goal:choose` with a task, every `/route` candidate gains an additive `recommendation_role: "primary" | "alternative" | null`, so the editorial recommendation is unmistakable relative to the feasible catalogue. Candidates are never reordered or dropped, and the catalogue stays visible. `goal:build` and `goal:migrate` responses carry no recommendation roles and no task defaults. The leading choose nudge, the generated `choose.md`, the human library link label (currently at `design_site.py:15`, in `scripts/design_site.py`) and the routing contract stop treating catalogue entries or library guides as recommendations or finalists. This replaces the old nudge wording "Read feasible finalists", the `choose.md` phrase "the finalist's complete guide" and the library file label "recommendation". No ranking, scoring, sponsor field, new source/profile or compatibility alias is added, and the route `schema_version` stays `1.1` because the change is additive.

## Decisions
- `recommendation_role` is present on each candidate only when the response carries `recommendation` (goal choose with a resolved task); it is `primary` for the candidate whose id equals `recommendation.primary.id`, `alternative` for a candidate whose id is the `profile_id` of a `recommendation.alternatives` entry, otherwise `null`. `goal:build`, `goal:migrate` and choose without a task omit the field. (evidence: lib/router.js; content/routing.md) (source: request)
- An infeasible primary or alternative is not a candidate, so no candidate carries its role; alternatives without a profile ID are never marked. (evidence: lib/router.js; menu/recommendations.json) (source: request)
- `schema_version` stays `1.1` because the field is additive and consumers may ignore it.  (evidence: content/routing.md) (assumption: the documented contract does not require a bump for an additive field) (source: request)
- The leading choose nudge with a task says: start with `recommendation.primary` (and its conflict, if any); use `recommendation.alternatives` only when their trigger applies; `candidates` are the feasible catalogue for deliberate comparison, not finalists. Without a task the same catalogue sentence is kept without the primary instruction. (evidence: lib/router.js) (source: request)
- `scripts/build-menu.py` choose guide text replaces "finalist" with the primary and describes the catalogue as feasible entries for deliberate comparison. (evidence: scripts/build-menu.py) (source: request)
- The library per-guide file labelled "recommendation" in `scripts/design_site.py` (`design_site.py:15`) is relabelled `related task`, keeping its `/choose/?stack=<id>` target. (evidence: scripts/design_site.py) (source: request)
- Routing contract `content/routing.md` documents the roles and `scripts/build-schema.mjs` publishes them under an `x-response-fields` key of `context.schema.json` (input validation is unchanged). Audit of agent entry, llms discovery and rewrite-source pages found no other place calling a guide or source a recommendation, so none is changed. (evidence: content/routing.md; scripts/build-schema.mjs; content/agent-entry.md; scripts/rewrite_sources.py) (source: request)
- Desktop and phone browser inspection of the chooser and library needs human evaluation: no automatic acceptance step observes it and no scenario claims it. The Build records the pages and viewports actually inspected through `npm run preview` in the delivery notes, adds no browser dependency, and the reviewer treats missing inspection as an open handoff rather than a pass. (evidence: README.md; docs/website-workflow.md) (source: request)

## Source comparison
- Per-candidate `recommendation_role: "primary" | "alternative" | null`, nudge rewrite, no reorder/drop, `goal:build`/`goal:migrate` without roles: addressed by `lib/router.js` and `content/routing.md`. (source: request)
- `choose.md` finalist wording and the library label at `design_site.py:15`: addressed in `scripts/build-menu.py` and `scripts/design_site.py`. (source: request)
- Item 1 expectations stay unchanged; `tests/scenarios/1-task-baselines.test.js` and the others are not edited. (source: request)
- Sponsorship, ranking, new sources/profiles and deployment are out of scope. (source: request)

## Tests
- Exactly one primary role when the primary is feasible, none when infeasible; alternatives only when feasible with a profile ID: scenario steps route every task through lib/router.js (scenario)
- Candidates keep catalogue order and none is dropped: ordered comparison with the profile index (scenario)
- Build, migrate and untasked choose carry no roles; source-only entries are never candidates or targets: routeContext responses (scenario)
- Leading nudge, generated choose guide, library label, routing contract and schema agree: generated output in a built disposable copy (scenario)
- schema_version stays 1.1: routeContext responses (scenario)
- Existing item 1 behavior unchanged: tests/scenarios/*.test.js via npm run check (existing)

## Feasibility
- none
