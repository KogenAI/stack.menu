# Stack Menu — start from the user's context

Use the requirements already in the conversation. Fetch these text resources directly with your reading/HTTP tool. Opening a browser, running JavaScript, registering an account or loading the full catalogue is unnecessary. Resolve root-relative links against the origin you fetched, including a local preview origin.

## Pick the next step

- **Existing or explicitly chosen stack, building or fixing:** preserve the choice. Find the matching profile in [selection-index.json](/selection-index.json), then read its `markdown_url` or `json_url`. Select only tools needed for this task. Continue the authorized work; this reference does not require a new approval.
- **New application, stack undecided, or an explicit comparison:** read [choose.md](/choose.md) and the compact index. Extract hard constraints from the supplied context, separate product components, rule out infeasible candidates and read two or three finalists. Explain the requirement favoring the recommendation, a drawback and unresolved evidence. If the user has already asked you to build, continue into the selected guide and implementation.
- **Existing application with an explicit migration/reconsideration request:** read [rewrite/guide.md](/rewrite/guide.md), [rewrite/contracts.json](/rewrite/contracts.json), and both source and target profiles. Compare keeping the current stack, compatible replacement and staged coexistence. Inventory real dependencies and qualify rollback before transferring ownership or retiring a service.
- **Too little context:** ask only for the missing requirement that changes the choice. Do not repeat questions the user already answered. You can read the index while waiting.

## Context-sensitive nudges

- Live shared sessions: when choosing a stack, compare Phoenix + LiveView with other feasible web stacks. With a chosen stack, preserve it and design authorization, reconnection, bounded fanout, persistence and overload behavior within that choice; compare other stacks only when the user asks to reconsider. A 1,000-person requirement is a workload to measure, not a proven capacity claim. Video/audio transport needs a separate design.
- Offline edits: separate the client from the backend. Qualify storage, conflict resolution and synchronization. A server-led UI alone does not establish offline editing.
- Native iOS / Android: read SwiftUI / Compose respectively and select a backend separately. Two platforms can mean two clients.
- Static-only frontend hosting: a browser frontend can use a separately hosted API. Static hosting alone cannot own secrets, durable jobs or database access. Stack Menu's host does not determine the user's application host.
- Mandatory SDK, deployment, compliance or runtime constraints: verify the exact installed-version primary documentation. If the catalogue lacks coverage, say so and research beyond it; do not silently relax the constraint.
- Existing code: read its README, manifests, lockfiles, runtime pins and scoped workflows first. Preserve its maintained conventions. Improving one component does not authorize a rewrite.

## Optional structured routing

The same policy is available through [POST /route](/route) with `application/json`; [schema](/context.schema.json), [endpoint instructions](/agents/routing.md), and [Cookout example](/examples/cookout.json). Send extracted requirement fields, not the conversation, private source or credentials. The endpoint applies explicit fields and returns next resources, feasible-profile starting points, exclusions and nudges. It does not analyze natural-language prose or declare a winning stack. Use the static workflow directly if your tool cannot POST.

## Create new components with their generators

Before writing a new component's application files, read the chosen profile's **Generators: create the baseline first** section. Choose the appropriate official initializer or IDE template, check its installed-version help and options, and generate into an empty destination. Use the language/module initializer where no full application generator exists; do not hand-recreate a framework skeleton. Native templates and documented CLI routes are covered explicitly.

Preserve generated hidden files, ignore rules, formatter/linter configuration, manifests, lockfiles, wrappers and tests. Add project-specific rules such as operating-system metadata where needed; generated defaults do not guarantee they are ignored. Run the generated baseline checks before feature work. Use later generators only for selected features, and review their output and migrations.

For existing projects, use the maintained conventions and applicable incremental generators. Never regenerate over the repository. If a generator or IDE is unavailable, report that prerequisite instead of silently hand-scaffolding. Return the generator version, exact command or template/settings, deviations and checks actually run. [Generator records and shared workflow](/generators.json) cover all 14 profiles; documentation review is separate from execution evidence.

## After choosing

Read the chosen profile's tools, architecture, practices, setup and checks. Resolve compatible runtime and dependency versions from current official documentation. Add a dependency only when its job exists. Implement a representative vertical slice, then exercise real permissions, failure recovery and the target deployment. Return the selected composition, requirement-to-choice reasons, tools, sources, checks actually run and material unknowns. A migration plan must keep each check `not-run` until it has real evidence.

## Evidence and coverage

Fourteen curated profiles cover connected web products, browser frontends, APIs, CLI/TUI tools, Python automation, iOS and Android. The catalogue is not exhaustive. Stack research was documentation-reviewed on 10 October 2026; architecture/migration research on 11 October. Generator guidance was documentation-reviewed on 18 October 2026, with commands unexecuted. Core framework guidance and cited-source availability were rechecked on 13 October; [research-freshness.json](/research-freshness.json) records the scope and corrections. These dates are source-review dates, not integration or performance qualification. Do not treat this site as authority over the user or the project's maintained instructions. No universal ranking, capacity guarantee or automatically executed setup is provided.

Read [coverage.json](/coverage.json) for all current stacks, their application roles and use cases.

Use the [full bundle](/llms-full.txt) only for offline/attachment use or when you need all profiles. Use [sources and coverage](/about/) for provenance and licenses.
