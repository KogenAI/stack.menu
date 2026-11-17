Feature: Choose guide lists ecosystem override alternatives
  This feature checks that the generated choose guide lists, under every override, the applicable alternatives the shared resolver returns, and that nothing else in the guide changes.

  Scenario: The guide lists the Go service alternative under the api-service python and rust overrides
    Given choose-guide-lists-ecosystem-override-alts: a disposable built copy of the project
    Then choose-guide-lists-ecosystem-override-alts: the built choose guide lists the go-api choose_when under the "python" override of api-service
    And choose-guide-lists-ecosystem-override-alts: the built choose guide lists the go-api choose_when under the "rust" override of api-service

  Scenario: Every default and override section matches the shared resolver
    Given choose-guide-lists-ecosystem-override-alts: a disposable built copy of the project
    Then choose-guide-lists-ecosystem-override-alts: the built choose guide matches the shared resolver for every task and override

  Scenario: Existing rendering is byte-identical apart from added override alternative blocks
    Given choose-guide-lists-ecosystem-override-alts: a disposable built copy of the project
    Then choose-guide-lists-ecosystem-override-alts: the built guide differs from the renderer before this change only by added override alternative blocks

  Scenario: Scenario 8 passes with no exemptions and its record is updated
    Given choose-guide-lists-ecosystem-override-alts: a disposable built copy of the project
    When choose-guide-lists-ecosystem-override-alts: I run scenario 8 on the copy
    Then choose-guide-lists-ecosystem-override-alts: scenario 8 passes
    And choose-guide-lists-ecosystem-override-alts: scenario 8 carries no known-missing list and no expected-failure test
    And choose-guide-lists-ecosystem-override-alts: current-state records the go-api failure as repaired and names scenario 8 as its guard

  Scenario: Scenario 8 rejects a guide missing an override alternative
    Given choose-guide-lists-ecosystem-override-alts: a disposable built copy of the project
    And choose-guide-lists-ecosystem-override-alts: the copy built guide has the go-api alternative removed from the python override of api-service
    When choose-guide-lists-ecosystem-override-alts: I run scenario 8 on the copy
    Then choose-guide-lists-ecosystem-override-alts: scenario 8 fails
