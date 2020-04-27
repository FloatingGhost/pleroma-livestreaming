const { stopMovienight, stopIRC, reloadNginx } = require('./lib/docker');
const { deleteConfig } = require('./lib/config-writer');

require('dotenv').config();
console.log('Deprovision', process.argv[1]);
(async function() {
    const channel = process.argv[1];
    await stopMovienight(channel);
    await stopIRC(channel);
    await deleteConfig(channel);
    await reloadNginx();
})();
