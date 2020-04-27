const {Docker} = require('node-docker-api');
const { readUserDockerConfig, userConfigDir } = require('./user-config');

const docker = new Docker();
const path = require('path');

const createContainer = async (params) => {
    return new Promise(resolve => {
        docker.container.create(params).then(
            response => resolve(response)
        );
    });
};

const startContainer = async (container) => {
    return new Promise(resolve => {
        container.start().then(
            response => resolve(response)
        );                   
    });                      
};                           

const listContainers = async () => {
    return new Promise(resolve => {
        docker.container.list().then( 
            response => resolve(response)
        );                      
    });                         
};

const stopContainer = async (container) => {
    return new Promise(resolve => {
        container.stop().then(resp => resolve(resp));
    });
};

const deleteContainer = async (container) => {
    return new Promise(resolve => {       
        container.delete().then(resp => resolve(resp));
    });  
};

const startMovienight = async (username) => {
    const { movienightPort, rtmpPort } = readUserDockerConfig(username);

    const container = await createContainer({
        Image: 'floatingghost/movienight',
        name: `${username}-movienight`,
        PortBindings: {
            '8089/tcp': [{'HostPort': movienightPort.toString() }],
            '1935/tcp': [{'HostPort': rtmpPort.toString() }]
        },
        Binds: [
            `${userConfigDir(username)}:/config`
        ]
    });
    await startContainer(container);
    return container;
};

const startIRC = async (username) => {
    const { ircPort, movienightPort } = readUserDockerConfig(username);
    const container = await createContainer({
        Image: 'floatingghost/movie-night-chat',
        name: `${username}-irc`,
        Cmd: ['/bin/sh', '-c', `./main --url ws://${process.env.HOST_IP}:${movienightPort}/ws`],
        PortBindings: {
            '6667/tcp': [{'HostPort': ircPort.toString() }]
        }
    });                
    await startContainer(container);
    return container; 
};

const startNginx = async () => {
    const nginxConfigPath = path.resolve(path.join(process.env.CONFIG_PATH, 'nginx'));
    if (await getContainerByName('nginx-router') === undefined) {
        const container = await createContainer({
            Image: 'floatingghost/nginx',
            name: 'nginx-router',
            PortBindings: { 
                '80/tcp': [{'HostPort': '80' }],
                '443/tcp': [{'HostPort': '443' }]
            },
            Binds: [
                `${nginxConfigPath}:/etc/nginx/conf.d`
            ]
        });
        await startContainer(container);
        return container;
    } else {
        console.log('Already running');
    }
};

const reloadNginx = async () => {
    const container = await getContainerByName('nginx-router');
    return new Promise(resolve => {
        container.restart().then(() => resolve());
    });
};


const getContainerByName = async (name) => {
    const containers = await listContainers();
    return containers.filter(c => (
        c.data.Names.some(n => n === `/${name}`)
    ))[0];  
};


const stopMovienight = async (username) => {
    const container = await getContainerByName(`${username}-movienight`);
    await stopContainer(container);
    await deleteContainer(container);
};

const stopIRC = async (username) => { 
    const container = await getContainerByName(`${username}-irc`);
    await stopContainer(container);
    await deleteContainer(container);
};

module.exports = { 
    startMovienight, startIRC, stopMovienight,
    stopIRC, startNginx, reloadNginx
};
