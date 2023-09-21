Feature: Some Feature

Scenario: Feature exists
    Given Some feature exists
    When I interact with a feature
    Then Something should have happen

Scenario: Feature doesn't exists
    # Given Some feature exists
    When I interact with a feature
    Then Something should not have happen

Scenario: Some thing is done
    When I do "some thing"
    Then "some thing" should have been done
    Then "some other thing" should not have been done
