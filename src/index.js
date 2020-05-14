require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { oauthCallback, login, authorize } = require('./lib/pleroma-authenticator');
const { newConfig, deleteConfig, resetPassword, resetStreamKey } = require('./lib/config-writer');
const fs = require('fs');
const { startMovienight, stopMovienight, startNginx, reloadNginx } = require('./lib/docker');
const { isProvisioned } = require('./lib/user');
const { userConfigPath } = require('./lib/user-config');
const { readUserDockerConfig, readUserConfig } = require('./lib/user-config');
const { configPath } = require('./lib/config');
const path = require('path');
const fetch = require('node-fetch');
const sassMiddleware = require('node-sass-middleware');


const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
}));
app.set('view engine', 'pug');
app.set('views', path.resolve(__dirname, './views'));

app.use(
    sassMiddleware({
        src: path.join(__dirname, 'sass'),
        dest: path.join(__dirname, 'public'), 
        debug: true,
        prefix: '/public'
    })
);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.get('/', async (req, res) => {
    res.render('index', { session: req.session, instanceUrl: process.env.INSTANCE_URL });
});

app.get('/me', authorize, async (req, res) => {
    const provisioned = isProvisioned(req.session.username);
    let dockerConfig, config;
    if (provisioned) {
        config = readUserConfig(req.session.username);
        dockerConfig = readUserDockerConfig(req.session.username);
    } 
    res.render('me', { session: req.session, provisioned: isProvisioned(req.session.username), dockerConfig, config, env: process.env });
});

app.get('/list', async (req, res) => {
    const live = await Promise.all(fs.readdirSync(path.resolve(process.env.CONFIG_PATH), { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(x => x !== 'nginx')
        .map(async channel => {
            const resp = await fetch(`http://127.0.0.1:${process.env.NGINX_PORT}/channels/${channel}/live`, { method: 'HEAD' });
            return [channel, resp.status == 200];
        }));
    res.render('channels', { channels: live });
});

app.post('/login', async (req, res) => {
    return await login(req, res);
});

app.get('/callback', async (req, res) => {
    const { code } = req.query;
    req.session.token = `Bearer ${await oauthCallback(code)}`;
    return res.redirect('/me');
});

app.post('/provision', authorize, async (req, res) => {
    if (fs.existsSync(userConfigPath(req.session.username))) {
        return res
            .status(500)
            .json({ error: 'this channel is already provisioned' });
    }

    await newConfig(req.session.username);
    await startMovienight(req.session.username);
    await reloadNginx();
    return res.redirect('/me');
});

app.post('/deprovision', authorize, async (req, res) => {
    if (!isProvisioned(req.session.username)) {
        return res.status(400).json({ error: 'not provisioned' });
    }
    await stopMovienight(req.session.username);
    await deleteConfig(req.session.username);
    await reloadNginx();
    delete req.session.username;
    return res.redirect('/');
});

app.post('/streamkey', authorize, async (req, res) => {
    if (!isProvisioned(req.session.username)) {
        return res.status(400).json({ error: 'not provisioned' });
    } 
    await stopMovienight(req.session.username);
    resetStreamKey(req.session.username);
    await startMovienight(req.session.username);
    return res.redirect('/me');
}); 

app.post('/password', authorize, async (req, res) => { 
    if (!isProvisioned(req.session.username)) { 
        return res.status(400).json({ error: 'not provisioned' });
    } 
    await stopMovienight(req.session.username);
    resetPassword(req.session.username);
    await startMovienight(req.session.username);
    return res.redirect('/me');
}); 


const port = process.env.PORT || 8000;
fs.mkdirSync(configPath('.'), { recursive: true });
fs.mkdirSync(path.resolve(path.join(process.env.CONFIG_PATH, '/nginx')), { recursive: true });

(async function() {
    await startNginx();
}());

app.listen(port, () => console.log(`Listening on port ${port}`));
