const path = require('path');

const configPath = (filename) => (
    path.resolve(path.join(process.env.CONFIG_PATH, filename))
);

module.exports = { configPath };
