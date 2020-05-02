Feature: Movienight provisioner
    Background:
        Given we have no cookies
        And there are no config files for the user "test"
        And there are no docker containers that match ".+-movienight"

    Scenario: Unauthenticated
        When a "POST" request is made to "/provision"
        Then the response should be 403

    Scenario: Provision Channel
        Given that the user "test" has logged in
        When a "POST" request is made to "/provision"
        Then the response should be 302
        And the config file "test/settings.json" should exist
        And the config file "test/docker.json" should exist
        And the config file "nginx/test.conf" should exist
        And the docker container "test-movienight" should exist

    Scenario: Deprovision channel
        Given the following channels are provisioned:
        | channel_name |
        | test         |
        And that the user "test" has logged in
        When a "POST" request is made to "/deprovision"
        Then the response should be 302
        And the config file "test/settings.json" should not exist
        And the config file "test/docker.json" should not exist
        And the config file "nginx/test.conf" should not exist
        And the docker container "test-movienight" should not exist

    Scenario: Reset stream key
        Given the following channels are provisioned:
        | channel_name |
        | test         |
        And that the user "test" has logged in
        And that the "StreamKey" for channel "test" is set to "somekey"
        When a "POST" request is made to "/streamkey"
        Then the response should be 302
        And the "StreamKey" for channel "test" should not be "somekey"

    Scenario: Reset admin password
        Given the following channels are provisioned:
        | channel_name |
        | test         |
        And that the user "test" has logged in
        And that the "AdminPassword" for channel "test" is set to "somepass"
        When a "POST" request is made to "/password"        
        Then the response should be 302
        And the "AdminPassword" for channel "test" should not be "somepass"

    Scenario: List channels
        Given the following channels are provisioned:
        | channel_name |
        | test         |
        | othertest    |
        When a "GET" request is made to "/list"
        Then the response should be 200
        And the response should contain "test" 
        And the response should contains "othetest"
