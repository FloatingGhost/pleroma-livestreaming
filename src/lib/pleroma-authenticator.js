const fetch = require('node-fetch');
const querystring = require('querystring');


const login = async (user, pass) => {
    if (process.env.NODE_ENV === 'TEST') return true;

    const queryString = querystring.stringify({
        user, pass
    });
    const resp = await fetch(`https://ihatebeinga.live/check_password?${queryString}`);
    const json = await resp.json();
    return json;
};

const authorize = async (req, res, next) => {
    if (req.session.username) {
        next();
    } else {
        res.status(403).json({error: 'user is not authorized'});
    }
};

module.exports = { login, authorize };
