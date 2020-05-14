const PleromaAuth = require('express-pleroma-authenticator');

const auth = new PleromaAuth(
    process.env.INSTANCE_URL,
    { redirectUris: `${process.env.EXTERNAL_URL}/callback` }
);
const login = async (req, res) => {
    if (process.env.NODE_ENV === 'TEST') return true;

    return await auth.login(req, res);

};

const oauthCallback = async (code) => {
    const { access_token } = await auth.oauthCallback(code);
    return access_token;
};

const authorize = async (req, res, next) => {
    const iam = await auth.checkCredentials(req.session.token);
    console.log(iam);
    if (iam.acct) {
        req.session.username = iam.acct.toLowerCase();
        next();
    } else {
        return res.status(403).render('login-fail');
    }
};

module.exports = { login, authorize, oauthCallback };
