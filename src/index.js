const express = require('express');
const { check, validationResult } = require('express-validator');
const session = require('express-session');
const { login, authorize } = require('./lib/pleroma-authenticator');
const { newConfig, deleteConfig, writeNginxConfig } = require('./lib/config-writer');
const fs = require('fs');
const { startMovienight, startIRC, stopMovienight, stopIRC, startNginx, reloadNginx } = require('./lib/docker');
const { isProvisioned } = require('./lib/user');
const { userConfigPath } = require('./lib/user-config');
const { readUserDockerConfig, readUserConfig } = require('./lib/user-config');
const { configPath } = require('./lib/config');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'test',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
}));
app.set('view engine', 'pug');
app.set('views', './views');

app.get('/', async (req, res) => {
    res.render('index', { title: 'Hey', message: 'Hello there!' });
});

app.get('/me', authorize, async (req, res) => {
    const provisioned = isProvisioned(req.session.username);
    let dockerConfig, config;
    if (provisioned) {
        config = readUserConfig(req.session.username);
        dockerConfig = readUserDockerConfig(req.session.username);
    } 
    res.render('me', { session: req.session, provisioned: isProvisioned(req.session.username), dockerConfig, config });
});

app.post('/login', [
    check('username').exists(),
    check('password').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    console.log(`Authentication request from ${username}`);
    const resp = await login(username, password);
    if (resp) {
        console.log('Login successful');
        req.session.username = username;
        return res.redirect('/me');
    } else {
        return res.status(403).json({ error: 'could not authenticate' });
    }
});

app.post('/provision', authorize, async (req, res) => {
    if (fs.existsSync(userConfigPath(req.session.username))) {
        return res
            .status(500)
            .json({ error: 'this channel is already provisioned' });
    }

    await newConfig(req.session.username);
    await startMovienight(req.session.username);
    await startIRC(req.session.username);
    await reloadNginx();
    return res.redirect('/me');
});

app.post('/deprovision', authorize, async (req, res) => {
    if (!isProvisioned(req.session.username)) {
        return res.status(400).json({ error: 'not provisioned' });
    }
    await stopMovienight(req.session.username);
    await stopIRC(req.session.username);
    await deleteConfig(req.session.username);
    await reloadNginx();
    delete req.session.username;
    return res.redirect('/');
});

const port = process.env.PORT || 8000;
fs.mkdirSync(configPath('.'), { recursive: true });
fs.mkdirSync(configPath('nginx'), { recursive: true });
writeNginxConfig('provisioner', {}, { movienightPort: port });

(async function() {
    console.log(await startNginx());
}());

app.listen(port, () => console.log(`Listening on port ${port}`));
