const { userConfigPath } = require('./user-config');
const fs = require('fs');

const isProvisioned = (username) => {
    return fs.existsSync(userConfigPath(username));
};

module.exports = { isProvisioned };
