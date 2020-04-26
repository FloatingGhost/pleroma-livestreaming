# frozen_string_literal: true

Given('there are no config files') do
  return unless Dir.exist? CONFIG_PATH

  FileUtils.rm_rf("#{CONFIG_PATH}/.")
end

Given('that the user {string} has logged in') do |username|
  @response = RestClient.post("#{BASE_URL}/login",
                              username: username, password: 'x')
  @cookies = @response.cookies
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
  @cookies = {}
end

When('a {string} request is made to {string}') do |method, path|
  url = "#{BASE_URL}#{path}"
  begin
    @response = RestClient::Request.execute(method: method.downcase.to_sym, url: url, cookies: @cookies)
  rescue RestClient::ExceptionWithResponse => e
    @response = e.response
  end
end

When('a {string} request is made to {string} with data:') do |path, data|
  url = "#{BASE_URL}#{path}"
  begin
    @response = RestClient::Request.execute(
      method: :post,
      url: url,
      payload: data.rows_hash.to_json,
      headers: @headers,
      cookies: @cookies
    )
  rescue RestClient::ExceptionWithResponse => e
    @response = e.response
  end
end

Then(/^the response should be (\d+)$/) do |response_code|
  expect(@response).not_to be_nil
  expect(@response.code).to eq(response_code.to_i)
end

Then('the docker container {string} should exist') do |name|
  matching_containers = Docker::Container.all.keep_if do |container|
    container.info['Names'].any? { |n| n == "/#{name}" }
  end
  expect(matching_containers.first).not_to be_nil
end

Then('the config file {string} should exist') do |name|
  expect(File).to exist "#{CONFIG_PATH}/#{name}"
end
