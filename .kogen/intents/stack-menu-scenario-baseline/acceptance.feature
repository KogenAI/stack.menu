Feature: Offline scenario baseline command
  This feature checks that the kept constraints hold on the unchanged tree, then the offline npm run check command, its named scenarios, mutation sensitivity and the project records.

  Scenario: Kept constraints hold with no new dependency and no product repair
    Then stack-menu-scenario-baseline: the package dependencies and build script are the kept ones
    And stack-menu-scenario-baseline: the lockfile is unchanged from the committed tree
    And stack-menu-scenario-baseline: product files under lib, functions and menu are unchanged from the committed tree

  Scenario: The check command passes and names every scenario
    Given stack-menu-scenario-baseline: a disposable copy of the project
    When stack-menu-scenario-baseline: I run the check script in the copy
    Then stack-menu-scenario-baseline: the command succeeds
    And stack-menu-scenario-baseline: the output names scenarios 1 to 8

  Scenario: Changing the explicit-stack behavior is rejected by scenario 2
    Given stack-menu-scenario-baseline: a disposable copy of the project
    And stack-menu-scenario-baseline: the copy has the mutation "build returns all candidates"
    When stack-menu-scenario-baseline: I run the check script in the copy
    Then stack-menu-scenario-baseline: the command fails
    And stack-menu-scenario-baseline: the output reports scenario 2 as failed

  Scenario: Changing one primary is rejected by scenario 1
    Given stack-menu-scenario-baseline: a disposable copy of the project
    And stack-menu-scenario-baseline: the copy has the mutation "content-site primary changed"
    When stack-menu-scenario-baseline: I run the check script in the copy
    Then stack-menu-scenario-baseline: the command fails
    And stack-menu-scenario-baseline: the output reports scenario 1 as failed

  Scenario: The check script builds first and runs the Python step
    Then stack-menu-scenario-baseline: the check script builds before node --test and runs python3

  Scenario: The workflow and current-state records are present
    Then stack-menu-scenario-baseline: workflow step 5 mentions the check command
    And stack-menu-scenario-baseline: current-state records the check scope and a baseline on an existing commit
