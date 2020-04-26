const {Docker} = require('node-docker-api');
const { readUserDockerConfig, readUserConfig, userConfigDir } = require('./user-config');

const docker = new Docker();

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
    const { StreamKey } = readUserConfig(username);

    console.log(readUserDockerConfig(username));
    const container = await createContainer({
        Image: 'floatingghost/movienight',
        name: `${username}-movienight`,
        Cmd: ['/bin/sh', '-c', `./MovieNight -k ${StreamKey}`],
        PortBindings: {
            '8089/tcp': [{'HostPort': movienightPort.toString() }],
            '1935/tcp': [{'HostPort': rtmpPort.toString() }]
        },
        Binds: [
            `${userConfigDir(username)}:/config`
        ]
    });
    console.log(container);
    await startContainer(container);
    return container;
};

const startIRC = async (username) => {
    const container = await createContainer({
        Image: 'floatingghost/movie-night-chat',
        name: `${username}-irc`,
        Cmd: ['/bin/sh', '-c', `./main --url ws://${username}-movienight:8000`],
        Ports: ['6667']
    });                
    await startContainer(container);
    return container; 
};

const stopMovienight = async (username) => {
    const containers = await listContainers();
    const container = containers.filter(c => (
        c.data.Names.some(n => n === `/${username}-movienight`)
    ))[0];
    await stopContainer(container);
    await deleteContainer(container);
};

const stopIRC = async (username) => { 
    const containers = await listContainers();
    const container = containers.filter(c => ( 
        c.data.Names.some(n => n === `/${username}-irc`)
    ))[0];
    await stopContainer(container);
    await deleteContainer(container);
};

module.exports = { startMovienight, startIRC, stopMovienight, stopIRC };
