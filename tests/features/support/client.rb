# frozen_string_literal: true

require 'singleton'

class APIHelper
  include Singleton


  @cookies = {}

  def self.logout
    @cookies = {}
  end
  
  def self.response
    @response
  end

  def self.login(username)
    @response = RestClient.post("#{BASE_URL}/login",
                                username: username, password: 'x')
  rescue RestClient::ExceptionWithResponse => e
    if e.is_a?(RestClient::Found)
      @response = e.response
      @cookies = @response.cookies
    else
      throw e
    end
  end

  def self.post(url, data)
    make_request(:post, url, data)
  end

  def self.make_request(method, url, data)
    @response = RestClient::Request.execute(
      method: method.to_sym,
      url: url,
      payload: data.to_json,
      headers: { 'Content-Type' => 'Appliation/json' },
      cookies: @cookies
    )
  rescue RestClient::ExceptionWithResponse => e
    if e.is_a?(RestClient::Found)
      @response = e.response
      @cookies = @response.cookies
    elsif e.is_a?(RestClient::Forbidden)
      @response = e.response
    else
      throw e
    end
  end
end
