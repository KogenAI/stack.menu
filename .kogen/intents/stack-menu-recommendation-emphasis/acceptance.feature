Feature: Recommendation emphasis
  This feature checks that route candidates distinguish the editorial recommendation from the feasible catalogue, and that generated guidance and the library describe guides as references.

  Scenario: Roles mark the feasible primary and only feasible alternatives with a profile ID
    When stack-menu-recommendation-emphasis: I route the choose goal for every task
    Then stack-menu-recommendation-emphasis: exactly one candidate is marked primary whenever the primary is feasible
    And stack-menu-recommendation-emphasis: each alternative marker is a feasible alternative with a profile ID

  Scenario: An infeasible primary is marked on no candidate
    When stack-menu-recommendation-emphasis: I route choose for task "live-web" with static_only true
    Then stack-menu-recommendation-emphasis: the primary is infeasible and no candidate is marked primary
    And stack-menu-recommendation-emphasis: each alternative marker is a feasible alternative with a profile ID

  Scenario: Roles do not reorder or drop candidates
    When stack-menu-recommendation-emphasis: I route the choose goal for every task
    Then stack-menu-recommendation-emphasis: candidates keep catalogue order and none is dropped

  Scenario: Build, migrate and untasked choose responses carry no recommendation roles
    When stack-menu-recommendation-emphasis: I route build, migrate and a choose without a task
    Then stack-menu-recommendation-emphasis: no response carries a recommendation or a candidate recommendation_role

  Scenario: Source-only entries are never candidates or targets
    When stack-menu-recommendation-emphasis: I route the choose goal for every task
    Then stack-menu-recommendation-emphasis: no candidate is a rewrite source
    And stack-menu-recommendation-emphasis: every rewrite source is rejected as a target_stack

  Scenario: The leading nudge separates the recommendation from the catalogue
    When stack-menu-recommendation-emphasis: I route the choose goal for every task
    Then stack-menu-recommendation-emphasis: the leading nudge points to recommendation.primary and calls candidates the feasible catalogue

  Scenario: The route schema version is unchanged
    When stack-menu-recommendation-emphasis: I route the choose goal for every task
    Then stack-menu-recommendation-emphasis: the schema version is still 1.1

  Scenario: The library and generated guidance describe guides as references
    Given stack-menu-recommendation-emphasis: a disposable built copy of the project
    Then stack-menu-recommendation-emphasis: the generated choose guide has no finalist wording
    And stack-menu-recommendation-emphasis: the library labels each per-guide task link related task and keeps its target
    And stack-menu-recommendation-emphasis: the routing contract and schema describe the roles
