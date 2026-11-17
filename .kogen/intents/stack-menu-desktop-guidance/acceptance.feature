Feature: Conditional desktop framework guidance
  This feature checks that desktop applications get an uncurated lead with conditional alternatives, no substituted profile, and the same content in every representation.

  Background:
    Given stack-menu-desktop-guidance: a built copy of the project

  Scenario: The policy defines an uncurated desktop lead
    Then stack-menu-desktop-guidance: the policy has the desktop-app task with curated false and a null-profile lead
    And stack-menu-desktop-guidance: the lead and task cite official https sources and the policy loader accepts the policy

  Scenario: No profile or generator is added for the desktop frameworks
    Then stack-menu-desktop-guidance: no profile or generator exists for the desktop frameworks

  Scenario: Desktop stack preparation stays a coverage gap
    Then stack-menu-desktop-guidance: desktop stack preparation stays a coverage gap

  Scenario: The alternatives carry their triggers and limits
    Then stack-menu-desktop-guidance: the lead names stable Tauri 2, the alpha 3.0 line and system webview differences
    And stack-menu-desktop-guidance: the alternatives cover Electron with its upgrade obligation, Compose Multiplatform, GPUI and single-OS native clients
    And stack-menu-desktop-guidance: the GPUI alternative requires pre-1.0 acceptance, an exact revision and per-OS qualification
    And stack-menu-desktop-guidance: Windows-native and dotnet stay an explicit coverage gap
    And stack-menu-desktop-guidance: the task states it is not universal Tauri superiority and that goal:build preserves a chosen stack

  Scenario: Component desktop returns the uncurated lead
    When stack-menu-desktop-guidance: I request the route for component desktop
    Then stack-menu-desktop-guidance: the route succeeds with an uncurated primary and no substitute
    And stack-menu-desktop-guidance: the route carries the coverage nudge and the consequential question

  Scenario: Use case desktop-app returns the uncurated lead
    When stack-menu-desktop-guidance: I request the route for use case desktop-app
    Then stack-menu-desktop-guidance: the route succeeds with an uncurated primary and no substitute
    And stack-menu-desktop-guidance: the route carries the coverage nudge and the consequential question
    And stack-menu-desktop-guidance: the route alternatives match the policy with feasible null

  Scenario: An existing unlisted desktop stack gets the research path
    When stack-menu-desktop-guidance: I request the build route for an unlisted desktop stack
    Then stack-menu-desktop-guidance: the route keeps the chosen stack and offers research without a substitute

  Scenario: The compiler rejects invalid desktop policies
    Then stack-menu-desktop-guidance: the compiler accepts the unchanged policy
    And stack-menu-desktop-guidance: the compiler rejects a curated task with a null primary
    And stack-menu-desktop-guidance: the compiler rejects an uncurated task without sources
    And stack-menu-desktop-guidance: the compiler rejects an uncurated task without why
    And stack-menu-desktop-guidance: the compiler rejects an uncurated task without tradeoff

  Scenario: Every representation shows the same lead, alternatives, triggers and sources
    Then stack-menu-desktop-guidance: recommendations.json carries the desktop task and alternatives unchanged from the policy
    And stack-menu-desktop-guidance: choose.md shows the lead, alternatives, triggers and sources
    And stack-menu-desktop-guidance: the chooser data resolves the same uncurated lead, question and alternatives
    And stack-menu-desktop-guidance: choose.md lists Desktop under target surfaces and the agent entry covers desktop

  Scenario: Earlier scenarios stay green
    Then stack-menu-desktop-guidance: the existing scenario tests and compiler positive check pass in the copy
