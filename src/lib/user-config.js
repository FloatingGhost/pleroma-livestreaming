const path = require('path');
const fs = require('fs');

const userConfigDir = (username) => (
    path.resolve(path.join(process.env.CONFIG_PATH, username))
);

const userDockerConfigPath = (username) => (
    path.join(userConfigDir(username), 'docker.json')
);

const userConfigPath = (username) => (
    path.join(userConfigDir(username), 'config.json')
);

const readUserDockerConfig = (username) => (
    JSON.parse(fs.readFileSync(userDockerConfigPath(username)).toString())
);

const readUserConfig = (username) => (
    JSON.parse(fs.readFileSync(userConfigPath(username)).toString())
);

module.exports = {
    userConfigPath, userConfigDir, userDockerConfigPath, readUserDockerConfig,
    readUserConfig
};
