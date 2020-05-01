const { startMovienight, reloadNginx } = require('./lib/docker');
const { newConfig } = require('./lib/config-writer');

require('dotenv').config();
console.log('Provision', process.argv[2]);
(async function() {
    const channel = process.argv[2];
    await newConfig(channel);
    await startMovienight(channel);
    await reloadNginx();
})();
