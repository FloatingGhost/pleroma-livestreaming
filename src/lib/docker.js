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
        docker.container.list({ all: 1 }).then( 
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

const restartContainer = async (container) => {
    return new Promise(resolve => { 
        container.restart().then(resp => resolve(resp));
    });
};

const startMovienight = async (username) => {
    const { movienightPort, rtmpPort } = readUserDockerConfig(username);

    const container = await createContainer({
	    Image: 'floatingghost/movienight:0.0.18',
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

const startNginx = async () => {
    const nginxConfigPath = path.resolve(path.join(process.env.CONFIG_PATH, 'nginx'));
    const nginxContainer = await getContainerByName('nginx-router');
    if (nginxContainer === undefined) {
        const container = await createContainer({
            Image: 'nginx',
            name: 'nginx-router',
            PortBindings: { 
                '80/tcp': [{'HostPort': process.env.NGINX_PORT }],
            },
            Binds: [
                `${path.resolve('../nginx-conf')}:/etc/nginx/conf.d`,
                `${nginxConfigPath}:/etc/nginx/sites/`
            ]
        });
        await startContainer(container);
        return container;
    } else {
        nginxContainer.start();
    }
};

const reloadNginx = async () => {
    const container = await getContainerByName('nginx-router');
    return new Promise(resolve => {
        container.exec.create({
            Cmd: ['nginx', '-s', 'reload']
        }).then(exec => exec.start()).then(() => resolve());
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

const restartMovienight = async (username) => {
    const container = await getContainerByName(`${username}-movienight`);
    await restartContainer(container);
};

module.exports = { 
    startMovienight, stopMovienight, restartMovienight,
    startNginx, reloadNginx
};
