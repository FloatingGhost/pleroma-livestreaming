const fs = require('fs');
const { userConfigPath, userConfigDir, userDockerConfigPath, readUserConfig } = require('./user-config');
const crypto = require('crypto');
const freePort = require('find-free-port');
const rimraf = require('rimraf');
const path = require('path');

const findAFreePort = async (startAt=9000) => {
    return new Promise(resolve => {
        freePort(startAt, (err, freePort) => {
            resolve(freePort);
        });
    });
};

const baseConfig = {
    StreamStats: true,
    MaxMessageCount: 3000,
    TitleLength: 50,
    AdminPassword: '',
    StreamKey: '',
    RegenAdminPass: false,
    ListenAddress: ':8089',
    ApprovedEmotes: null,
    TwitchClientID: '',
    SessionKey: '',
    Bans: [],
    LogLevel: 'info',
    LogFile: 'thelog.log',
    RoomAccess: 'open',
    RoomAccessPin: '',
    NewPin: false,
    RateLimitChat: 1,
    RateLimitNick: 300,
    RateLimitColor: 60,
    RateLimitAuth: 5,
    RateLimitDuplicate: 30,
};

const randomString = (length) => {
    return crypto.randomBytes(length).toString('hex');
};

const newConfig = async (username) => {
    const config = {
        ...baseConfig,
        AdminPassword: randomString(16),
        StreamKey: randomString(16),
        SessionKey: randomString(32)
    };

    const portBase = Math.floor(10000 + (Math.random() * 10000));
    const movienightPort = await findAFreePort(portBase);
    const rtmpPort = await findAFreePort(movienightPort + 1);
    
    const dockerConfig = {
        movienightPort, rtmpPort
    };
       
    createUserConfigDir(username); 
    writeUserConfig(username, config);
    writeDockerConfig(username, dockerConfig);
    writeNginxConfig(username, config, dockerConfig);
};

const createUserConfigDir = (username) => {
    const path = userConfigDir(username);
    fs.mkdirSync(path, { recursive: true });
};
     
const writeUserConfig = (username, config) => {
    fs.writeFileSync(
        userConfigPath(username),
        JSON.stringify(config)
    );
};

const writeDockerConfig = (username, config) => {
    const path = userDockerConfigPath(username);
    fs.writeFileSync(                        
        path,            
        JSON.stringify(config)               
    ); 
};

const writeNginxConfig = (username, config, { movienightPort }) => {
    const baseConfig = fs.readFileSync(
        path.resolve(
            path.join(
                __dirname,
                '../nginx-template.conf'
            )
        )
    ).toString();

    const nginxConfigPath = path.resolve(path.join(process.env.CONFIG_PATH, 'nginx', `${username}.conf`));
    const conf = baseConfig
        .replace(/\$CHANNEL/g, username)
        .replace(/\$BASE_URL/g, process.env.BASE_URL)
        .replace(/\$SSL_CERT/g, process.env.SSL_CERT)
        .replace(/\$SSL_KEY/g, process.env.SSL_KEY)
        .replace(/\$PORT/g, movienightPort)
        .replace(/\$NGINX_PORT/g, process.env.NGINX_PORT)
        .replace(/\$HOST_IP/g, process.env.HOST_IP);
        
    fs.writeFileSync(nginxConfigPath, conf);
};

const deleteConfig = async (username) => {
    const nginxConfigPath = path.resolve(path.join(process.env.CONFIG_PATH, 'nginx', `${username}.conf`));
    await new Promise(resolve => {
        rimraf(userConfigDir(username), () => resolve());
    });
    fs.unlinkSync(nginxConfigPath);
} ;

const alterUserConfig = (username, patch) => {
    writeUserConfig(username, {
        ...readUserConfig(username),
        ...patch
    });
};

const resetPassword = (username) => {
    alterUserConfig(username, { AdminPassword: randomString(16) });
};

const resetStreamKey = (username) => {
    alterUserConfig(username, { StreamKey: randomString(16) });
};

module.exports = {
    writeUserConfig, newConfig, deleteConfig, writeNginxConfig, randomString,
    alterUserConfig, resetStreamKey, resetPassword
};
