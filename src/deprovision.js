const { stopMovienight, reloadNginx } = require('./lib/docker');
const { deleteConfig } = require('./lib/config-writer');

require('dotenv').config();
console.log('Deprovision', process.argv[2]);
(async function() {
    const channel = process.argv[2];
    await stopMovienight(channel);
    await deleteConfig(channel);
    await reloadNginx();
})();
