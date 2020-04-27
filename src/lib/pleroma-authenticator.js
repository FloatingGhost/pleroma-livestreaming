const fetch = require('node-fetch');
const querystring = require('querystring');


const login = async (user, pass) => {
    if (process.env.NODE_ENV === 'TEST') return true;

    const queryString = querystring.stringify({
        user, pass
    });
    const resp = await fetch(`${process.env.INSTANCE_URL}/check_password?${queryString}`);
    const json = await resp.json();
    return json;
};

const authorize = async (req, res, next) => {
    if (req.session.username) {
        next();
    } else {
        return res.status(403).render('login-fail');
    }
};

module.exports = { login, authorize };
