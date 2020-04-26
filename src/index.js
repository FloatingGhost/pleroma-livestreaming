const express = require('express');
const { check, validationResult } = require('express-validator');
const session = require('express-session');
const { login, authorize } = require('./lib/pleroma-authenticator');
const { newConfig } = require('./lib/config-writer');
const fs = require('fs');
const { startMovienight, startIRC } = require('./lib/docker');
const { userConfigPath } = require('./lib/user-config');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'test',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
}));


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
        return res.status(200).json({ success: 1 });
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
    res.json({ ok: 1 });
});

const port = process.env.PORT || 8000;
fs.mkdirSync('config', { recursive: true });
app.listen(port, () => console.log(`Listening on port ${port}`));
