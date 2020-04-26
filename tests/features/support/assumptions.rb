# frozen_string_literal: true

unless defined? SET_ASSUMPTIONS
  BASE_DIR = File.expand_path('../../..', File.dirname(__FILE__))
  ENV['PORT'] = '8000'
  ENV['CONFIG_PATH'] = CONFIG_PATH = "#{BASE_DIR}/config"
  BASE_URL = "http://127.0.0.1:#{ENV['PORT']}"
  SET_ASSUMPTIONS = true
end
