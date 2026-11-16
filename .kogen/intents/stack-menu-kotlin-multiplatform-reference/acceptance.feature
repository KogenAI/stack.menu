Feature: Kotlin Multiplatform as a mobile reference
  This feature checks that one uncurated Kotlin Multiplatform alternative is added to the cross-platform mobile task, appears with the same trigger and caveat in every representation, and changes no primary or eligibility.

  Background:
    Given stack-menu-kotlin-multiplatform-reference: a built copy of the project

  Scenario: The record loads as an uncurated alternative
    Then stack-menu-kotlin-multiplatform-reference: the policy has the alternative kotlin-multiplatform-mobile for the cross-platform-mobile task with a null profile
    And stack-menu-kotlin-multiplatform-reference: the policy loader accepts the policy
    And stack-menu-kotlin-multiplatform-reference: the alternative cites only official Kotlin pages

  Scenario: The trigger and caveat are specific and do not overclaim
    Then stack-menu-kotlin-multiplatform-reference: the trigger names Kotlin or Android-led teams and shared domain and data logic with native UI
    And stack-menu-kotlin-multiplatform-reference: the caveat states the missing profile, Xcode and Apple ownership, the Compose Multiplatform decision and interop qualification

  Scenario: The caveat states ownership limits and per-target stability
    Then stack-menu-kotlin-multiplatform-reference: the caveat names Wasm web, watchOS and tvOS as Beta
    And stack-menu-kotlin-multiplatform-reference: the caveat does not claim stability for everything and says it does not replace an existing project

  Scenario: Undecided routes list the alternative and keep Expo primary
    When stack-menu-kotlin-multiplatform-reference: I request the choose route for an undecided mobile platform
    Then stack-menu-kotlin-multiplatform-reference: the route primary is "expo-react-native"
    And stack-menu-kotlin-multiplatform-reference: the route alternatives include the Kotlin Multiplatform alternative with feasible null

  Scenario: Shared routes list the alternative
    When stack-menu-kotlin-multiplatform-reference: I request the choose route for the shared platform
    Then stack-menu-kotlin-multiplatform-reference: the route primary is "expo-react-native"
    And stack-menu-kotlin-multiplatform-reference: the route alternatives include the Kotlin Multiplatform alternative with feasible null

  Scenario: Android routes list the alternative
    When stack-menu-kotlin-multiplatform-reference: I request the choose route for the android platform
    Then stack-menu-kotlin-multiplatform-reference: the route primary is "kotlin-compose-android"
    And stack-menu-kotlin-multiplatform-reference: the route alternatives include the Kotlin Multiplatform alternative with feasible null

  Scenario: iOS routes omit the alternative
    When stack-menu-kotlin-multiplatform-reference: I request the choose route for the ios platform
    Then stack-menu-kotlin-multiplatform-reference: the route primary is "swift-swiftui-ios"
    And stack-menu-kotlin-multiplatform-reference: the route alternatives omit the Kotlin Multiplatform alternative

  Scenario: The built representations agree on the trigger and caveat
    Then stack-menu-kotlin-multiplatform-reference: recommendations.json carries the alternative unchanged from the policy
    And stack-menu-kotlin-multiplatform-reference: choose.md lists the alternative under shared or undecided scope and the android choice but not the ios choice
    And stack-menu-kotlin-multiplatform-reference: the chooser data resolves the same trigger and caveat for undecided, shared and android and omits it for ios

  Scenario: No candidate, target or primary changes
    Then stack-menu-kotlin-multiplatform-reference: the route output otherwise matches the policy without the alternative

  Scenario: The existing scenario baseline stays green
    Then stack-menu-kotlin-multiplatform-reference: the existing scenario tests pass in the copy
