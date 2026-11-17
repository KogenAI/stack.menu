# List applicable ecosystem override alternatives in

Slug: choose-guide-lists-ecosystem-override-alts
Model: not applicable — the change is a pure rendering of a static policy into Markdown, with no state or interacting rules
Acceptance:
- .kogen/intents/choose-guide-lists-ecosystem-override-alts/acceptance.feature
- features/steps/choose-guide-lists-ecosystem-override-alts__steps.js
- features/steps/choose-guide-lists-ecosystem-override-alts__before/recommendation_content_before.py

The generated Markdown guide (`dist/choose.md`, rendered by `markdown()` in `scripts/recommendation_content.py`) must list, under every task override, the same applicable alternatives that the shared resolver (`resolveRecommendation` in `lib/recommendation-policy.js`) returns for that override's conditions, whether or not the override declares its own `alternative_ids`. Today an override without `alternative_ids` renders only its primary, tradeoff and sources, so for `api-service` with `ecosystem=python` or `ecosystem=rust` the guide omits the Go service alternative `go-api` that the route and chooser return.

The fix renders, for each override, the alternatives selected by the generator's existing `_alternatives(policy, {**use_case, **override})` (same selection rule, same text via `_alternative_markdown`, same order) under the existing heading `Alternatives for this platform choice:`. An override that declares `alternative_ids` keeps rendering that heading exactly as before. An override that does not declare `alternative_ids` and has no applicable alternatives renders nothing new. Any other override whose resolver alternatives are missing from the guide is the same defect and is repaired by the same rule. Output for default primaries, for overrides that already declare `alternative_ids` and for every other line stays byte-identical. `menu/recommendations.json`, the router, the resolver, task defaults and guide URLs are not changed.

The scenario 8 test in `tests/scenarios/8-representations.test.js` loses `KNOWN_MISSING_ALTERNATIVES`, `isKnown` and the strict expected-failure test. Its representation check walks, from the policy, every task default and every override, and requires the guide section of that task default or of that override to carry exactly the resolver's applicable alternatives (rendered lines, in order, no extras, no heading when none apply and none are declared). `docs/current-state.md` keeps its baseline record but says the go-api failure was repaired and names scenario 8 of `npm run check` as what now guards it; the record must no longer list it as an open pre-existing failure.

## Decisions
- Every override of every task renders the same applicable alternatives the shared resolver returns, under the existing heading `Alternatives for this platform choice:`; any other mismatch between the resolver and the guide is the same defect and in scope, found by walking all overrides from the policy rather than a hard-coded list. (decision: D1, round 1) (evidence: scripts/recommendation_content.py; lib/recommendation-policy.js; menu/recommendations.json) (source: request)
- An override without its own `alternative_ids` renders the heading only when it has at least one applicable alternative, because nothing that is not an applicable alternative may start appearing; overrides with `alternative_ids` keep today's unconditional heading for byte-identity. (decision: D2, round 1) (evidence: scripts/recommendation_content.py) (source: request)
- Scenario 8 scopes its alternative check to the override's own guide section and the default's alternatives block, because a global substring search already passes today for overrides whose alternatives appear under the default. (decision: D3, round 1) (evidence: tests/scenarios/8-representations.test.js; scripts/recommendation_content.py) (source: request)
- Acceptance compares the new renderer's Markdown with a verbatim copy of the renderer functions as they were before this change, kept as a Python fixture owned by this Intent (the acceptance copy has no Git history), and requires the only differences to be inserted blocks for the overrides expected to gain one. (decision: D4, round 1) (evidence: scripts/recommendation_content.py) (source: request)
- Acceptance builds a disposable copy with the package.json build script text and runs only the scenario 8 test file there, to stay within the per-step time limit; `npm run check` remains the project's own check. (decision: D5, round 1) (evidence: package.json; tests/scenarios/8-representations.test.js) (assumption: running the scenario 8 test file on a built copy is an acceptable stand-in for the full `npm run check` inside acceptance) (source: request)

## Source comparison
- go-api absent from the guide for api-service python and rust overrides: addressed by the override rendering fix; acceptance scenario 1 and the resolver walk in scenario 2.
- Other overrides whose resolver alternatives are missing under the override: addressed under the same rendering rule; scenario 2 walks all policy overrides rather than a hard-coded list.
- Byte-identical output for default primaries, overrides with `alternative_ids` and all other text: addressed by scenario 3 comparing against the pre-change renderer fixture; the only allowed differences are the added override blocks.
- Strict expected-failure test, `KNOWN_MISSING_ALTERNATIVES` and its baseline record: removed and re-recorded as repaired, guarded by scenario 8; scenarios 4 and 5.
- Policy file, router, resolver, task defaults, guide URLs: not changed. Counts and prose are not frozen. Deployment and browser claims: omitted by request.

## Tests
- Override sections carry the resolver's applicable alternatives, including go-api for api-service python and rust: scenario 8 walk in tests/scenarios/8-representations.test.js and features/steps/choose-guide-lists-ecosystem-override-alts__steps.js (scenario)
- Existing rendering is unchanged apart from added override blocks: byte comparison with the pre-change renderer fixture in the Intent's step file (scenario)
- Scenario 8 has no exemptions, the expected-failure test is gone and the baseline record says repaired: scenario 8 test and the Intent's step file (scenario)

## Feasibility
- none
