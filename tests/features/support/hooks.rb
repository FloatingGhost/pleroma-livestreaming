# frozen_string_literal: true

AfterConfiguration do
  $process = ProcessHelper::ProcessHelper.new(print_lines: true)
  $process.start(['node', "#{BASE_DIR}/src/index.js"],
                 /^Listening on port/, wait_timeout = 120)
  APIHelper.instance
end

at_exit do
  $process.kill
  $process.wait_for_exit
end
