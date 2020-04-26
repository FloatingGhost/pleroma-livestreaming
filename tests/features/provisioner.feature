Feature: Movienight provisioner
    Background:
        Given we have no cookies
        And there are no config files
        And there are no docker containers that match ".+-movienight"
        And there are no docker containers that match ".+-irc"

    Scenario: Unauthenticated
        When a "POST" request is made to "/provision"
        Then the response should be 403

    Scenario: Provision Channel
        Given that the user "test" has logged in
        When a "POST" request is made to "/provision"
        Then the response should be 200
        And the config file "test/config.json" should exist
        And the docker container "test-movienight" should exist
        And the docker container "test-irc" should exist
