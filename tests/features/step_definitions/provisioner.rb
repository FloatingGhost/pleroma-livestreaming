# frozen_string_literal: true

Given('there are no config files for the user {string}') do |user|
  return unless Dir.exist? CONFIG_PATH

  FileUtils.rm_rf("#{CONFIG_PATH}/#{user}")
end

Given('that the user {string} has logged in') do |username|
  APIHelper.login(username)
end

Given('there are no docker containers that match {string}') do |pattern|
  Docker::Container.all(all: true).each do |container|
    if container.info['Names'].any? { |n| n.match? pattern }
      container.stop
      container.delete
    end
  end
end

Given('we have no cookies') do
  APIHelper.logout
end

Given('the following channels are provisioned:') do |table|
  table.rows.flatten.each do |channel|
    APIHelper.login(channel)
    APIHelper.post("#{BASE_URL}/provision", {})
  end
end

Given('that the {string} for channel {string} is set to {string}') do |key, channel, value|
  config = JSON.parse(IO.read(File.open(File.join(CONFIG_PATH, channel, 'settings.json'))))
  config[key] = value
  IO.write(File.join(CONFIG_PATH, channel, 'settings.json'), config.to_json)
end

Then('the {string} for channel {string} should not be {string}') do |key, channel, value|
  config = JSON.parse(IO.read(File.open(File.join(CONFIG_PATH, channel, 'settings.json')))) 
  expect(config[key]).to_not eq(value)
end

When('a {string} request is made to {string}') do |method, path|
  APIHelper.make_request(method.downcase.to_sym, "#{BASE_URL}#{path}", {})
end

Then(/^the response should be (\d+)$/) do |response_code|
  expect(APIHelper.response).not_to be_nil
  expect(APIHelper.response.code).to eq(response_code.to_i)
end

Then('the docker container {string} should exist') do |name|
  matching_containers = Docker::Container.all.keep_if do |container|
    container.info['Names'].any? { |n| n == "/#{name}" }
  end
  expect(matching_containers.first).not_to be_nil
end

Then('the docker container {string} should not exist') do |name|
  matching_containers = Docker::Container.all.keep_if do |container|
    container.info['Names'].any? { |n| n == "/#{name}" }
  end
  expect(matching_containers.first).to be_nil
end

Then('the config file {string} should exist') do |name|
  expect(File).to exist "#{CONFIG_PATH}/#{name}"
end

Then('the config file {string} should not exist') do |name|
  expect(File).not_to exist "#{CONFIG_PATH}/#{name}"
end
