# Add Kotlin Multiplatform as a mobile reference

Slug: stack-menu-kotlin-multiplatform-reference
Model: not applicable — the change adds one static editorial record and its derived representations; it has no stateful behavior.
Acceptance:
- .kogen/intents/stack-menu-kotlin-multiplatform-reference/acceptance.feature
- features/steps/stack-menu-kotlin-multiplatform-reference__steps.js

This Intent adds one uncurated alternative, `kotlin-multiplatform-mobile` (label "Kotlin Multiplatform shared logic", `profile_id: null`, `use_cases: ["cross-platform-mobile"]`), to `menu/recommendations.json`. Kotlin Multiplatform shares business logic with native SwiftUI/Compose UIs and optionally uses Compose Multiplatform for shared UI. The `choose_when` trigger says the team is Kotlin/Android-led (for example an Android-first team that expects an iOS client) or wants shared domain/data logic while keeping platform-native UI. The caveat says there is no curated Stack Menu profile, iOS builds still need Xcode and Apple platform ownership, Compose Multiplatform on iOS is a further shared-UI decision, interop and libraries need qualification, stability is per target (Wasm web, watchOS and tvOS are Beta), and it does not replace an existing Expo or native project. Sources are official kotlinlang.org pages only: the supported-platform stability page, the Kotlin Multiplatform overview and the Compose Multiplatform page.

The id is added to the cross-platform-mobile task's `alternative_ids` (shared/undecided scope) and to the `android` override's `alternative_ids`; it is not added to the `ios` override. The only product file edited is `menu/recommendations.json`. No profile, generator record, rewrite source, task, lib, script, page or step change is made, and no candidate or target eligibility changes: Expo stays primary for shared/undecided, SwiftUI for `ios`, Compose for `android`. The existing builder owners render the record unchanged in `/recommendations.json`, `choose.md`, the chooser card (which renders `choose_when` and `caveat` from the fetched contract) and `/route` `recommendation.alternatives` (`feasible: null`). Existing scenario tests under `tests/scenarios/` are not edited. No sponsor content, deployment or push.

Prerequisite baseline this Intent builds on, preserved unchanged: the owner-signed configuration commit `d0f86897f5df43a5221a16fcc8165656af9b6845` (parent and item-1 baseline `5f5f235a8be2fe98a018f4865d30bb66ab8f3d07`) adds only `npm run check` to the configured checks; configuration SHA256 `7558b7fe422f083f49246e13650d8f7acb22311945159c22c3a61740f03e8e5a`. `.kogen/project.yaml` and every configured setup, check, acceptance and protection field stay as they are. Retained qualification receipts: configured-command receipt `aa830d9fde2a790e15174ccfb11b7762e94adb6844bb168ca4fc73a2616b2097`; pinned verifier integration receipt `bd97139a8d8ae94e2bdaf31955d0d5e99a151f208f13c27688fdd110b42bc065` at verifier revision `2033fb4e88179bd3983a28f8ceb5b3607339159a`. These receipts grant no waiver: the Build must run and record all configured checks on its own exact candidate.

## Decisions
- The alternative id is `kotlin-multiplatform-mobile`, with a null profile and a single task, so the compiler and router need no change. (evidence: menu/recommendations.json; scripts/recommendation_content.py; lib/recommendation-policy.js) (source: request)
- The "Android-first team that expects an iOS client" rationale is folded into the one `choose_when` text, so the trigger is identical everywhere. (evidence: menu/recommendations.json; lib/router.js) (source: request)
- The alternative is added to the default and `android` override lists and not to `ios`, because the existing `ios` override already lists separately owned alternatives and the request names only shared/undecided and android. (evidence: menu/recommendations.json; lib/recommendation-policy.js) (source: request)
- Sources are the Kotlin stability page, overview and Compose Multiplatform page on kotlinlang.org; the stability page lists Android and iOS as Stable and Web on Kotlin/Wasm, watchOS and tvOS as Beta. (evidence: menu/recommendations.json) (assumption: kotlinlang.org pages were fetched with curl in this session, returning HTTP 200 and the stability table; the pages may change later.) (source: request)
- Acceptance builds a disposable copy once with the package.json build script, then reads the policy, the route handler, `dist/recommendations.json`, `dist/choose.md` and the built `dist/design/recommendation-policy.js`; chooser-card agreement is checked through its data owner, not a browser, because the request forbids new browser dependencies. (evidence: package.json; scripts/design_interactive.py; public/design/interactive.js; tests/scenarios/8-representations.test.js) (assumption: desktop and phone rendered review of the chooser card still needs a human through the maintained preview route.) (source: request)
- Eligibility is checked by comparing route output against the same policy with the new alternative removed in a temporary copy of lib and menu, so no commit history or literal counts are used. (evidence: lib/router.js; tests/scenarios/1-task-baselines.test.js) (source: request)
- The existing configured `npm run check` scenarios are run in the copy to show Item 1 stays green; no existing test, check or configuration is edited. (evidence: package.json; tests/scenarios/8-representations.test.js; .kogen/project.yaml) (source: request)
- The alternative id is kotlin-multiplatform-mobile, null profile, single task cross-platform-mobile; no compiler or router change. (decision: D1, round 1) (evidence: menu/recommendations.json; scripts/recommendation_content.py; lib/recommendation-policy.js) (source: request)
- The Android-first rationale is folded into the single choose_when text so the trigger is identical everywhere. (decision: D2, round 1) (evidence: menu/recommendations.json; lib/router.js) (source: request)
- Added to the default and android override alternative_ids, not the ios override. (decision: D3, round 1) (evidence: menu/recommendations.json; lib/recommendation-policy.js) (source: request)
- Sources are kotlinlang.org pages only; stability page lists Android/iOS Stable and Wasm web, watchOS, tvOS Beta. (decision: D4, round 1) (evidence: menu/recommendations.json) (assumption: Fetched with curl in this session (HTTP 200 and the stability table); pages may change.) (source: request)
- Acceptance builds one disposable copy and checks policy, /route handler, dist/recommendations.json, dist/choose.md and the built chooser resolver; chooser card is checked through its data owner, not a browser. (decision: D5, round 1) (evidence: package.json; scripts/design_interactive.py; public/design/interactive.js; tests/scenarios/8-representations.test.js) (assumption: Desktop and phone rendered review of the chooser card still needs a human.) (source: request)
- Eligibility is checked by comparing route output with the same policy minus the new alternative in a temporary copy. (decision: D6, round 1) (evidence: lib/router.js; tests/scenarios/1-task-baselines.test.js) (source: request)
- Existing tests/scenarios are run in the copy to show Item 1 stays green; no existing test or configuration is edited. (decision: D7, round 1) (evidence: package.json; tests/scenarios/8-representations.test.js; .kogen/project.yaml) (source: request)

## Source comparison
- Add one uncurated Kotlin Multiplatform alternative with `profile_id: null` to cross-platform-mobile: addressed in `menu/recommendations.json` (request Item 4 brief).
- Include it in shared/undecided `alternative_ids` and the android override list: addressed; the proposed android rationale is folded into `choose_when`.
- Identical trigger and caveat in `/recommendations.json`, `choose.md`, chooser card and `/route` with `feasible:null`: addressed in acceptance (chooser card through its data owner).
- No candidate or target eligibility change; Expo, SwiftUI and Compose primaries unchanged: addressed.
- Per-target stability (Wasm web and watchOS/tvOS Beta), no "stable for everything", no replacement of an existing project: addressed in the caveat and acceptance.
- Official Kotlin sources only; no profile, generator record or task: addressed.
- Item 1 scenarios unchanged and green: addressed by running the existing scenario tests.
- Required-gates prerequisite: configuration commit `d0f86897f5df43a5221a16fcc8165656af9b6845`, baseline `5f5f235a8be2fe98a018f4865d30bb66ab8f3d07`, configuration SHA256 `7558b7fe422f083f49246e13650d8f7acb22311945159c22c3a61740f03e8e5a`, receipts `aa830d9fde2a790e15174ccfb11b7762e94adb6844bb168ca4fc73a2616b2097` and `bd97139a8d8ae94e2bdaf31955d0d5e99a151f208f13c27688fdd110b42bc065`, verifier revision `2033fb4e88179bd3983a28f8ceb5b3607339159a`: addressed as preserved context; the protected configuration is not edited and no check is waived.
- Sponsorship, deployment, push, new dependencies and browser tests: omitted by request.
- Desktop and phone rendered review of the chooser card: not executable here; an external review handoff remains.

## Tests
- Record loads with null profile, official sources and loader acceptance: features/steps/stack-menu-kotlin-multiplatform-reference__steps.js (scenario)
- Trigger and caveat content with per-target Beta stability: features/steps/stack-menu-kotlin-multiplatform-reference__steps.js (scenario)
- Presence for undecided, shared and android and absence for ios in /route with Expo, Compose and SwiftUI primaries unchanged: features/steps/stack-menu-kotlin-multiplatform-reference__steps.js (scenario)
- Identical trigger and caveat in recommendations.json, choose.md and chooser data: features/steps/stack-menu-kotlin-multiplatform-reference__steps.js (scenario)
- No eligibility change: features/steps/stack-menu-kotlin-multiplatform-reference__steps.js (scenario)
- Item 1 scenarios stay green: tests/scenarios (existing)

## Feasibility
- none
