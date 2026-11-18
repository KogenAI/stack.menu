Feature: Bruno sponsorship in Stack Menu
  This feature checks the Bruno Sponsored card on the homepage, the dedicated sponsor profile and the optional sponsored discovery guidance, while stack selection, ranking and setup stay requirements-based.

  Background:
    Given stack-menu-bruno-sponsorship: a built copy of the project

  Scenario: The homepage Sponsored card follows the full demo and caption
    Then stack-menu-bruno-sponsorship: the homepage has one Sponsored card for Bruno after the full demo and its caption

  Scenario: The card goes to Bruno and the secondary link opens the profile
    Then stack-menu-bruno-sponsorship: the card primary link goes to the plain Bruno product link and the secondary link opens the sponsor profile

  Scenario: The card layout holds at phone and desktop widths
    Then stack-menu-bruno-sponsorship: the card styles stack for a phone width and stay contained at desktop width

  Scenario: The sponsor profile is dedicated and discloses the sponsorship
    Then stack-menu-bruno-sponsorship: the sponsor profile page names Bruno as a Stack Menu sponsor and keeps selection requirements-based

  Scenario: The agent entry, llms.txt and full bundle carry optional sponsored discovery guidance
    Then stack-menu-bruno-sponsorship: the agent entry, llms.txt and the full bundle carry the optional sponsored discovery guidance
    And stack-menu-bruno-sponsorship: the guidance omits the mention for unrelated tasks, chosen tooling, ad-free requests and declines
    And stack-menu-bruno-sponsorship: the guidance keeps the plain product link pending a verified referral arrangement

  Scenario: Relevant API stack selection stays requirements-based
    When stack-menu-bruno-sponsorship: I request the route for an API service with no chosen tooling
    Then stack-menu-bruno-sponsorship: the route response does not mention Bruno

  Scenario: A chosen stack is preserved without sponsor content
    When stack-menu-bruno-sponsorship: I request the route for a build with an explicitly chosen stack
    Then stack-menu-bruno-sponsorship: the route response does not mention Bruno

  Scenario: Ranking, selection and setup content stay free of the sponsor
    Then stack-menu-bruno-sponsorship: selection, ranking and setup files do not mention Bruno

  Scenario: Earlier scenarios stay green
    Then stack-menu-bruno-sponsorship: the existing scenario tests and compiler positive check pass in the copy
