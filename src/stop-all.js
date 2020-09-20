const { stopMovienight } = require('./lib/docker');
const { deleteConfig } = require('./lib/config-writer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async function() {
    await Promise.all(fs.readdirSync(path.resolve(process.env.CONFIG_PATH), { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(x => x !== 'nginx')
        .map(async channel => {    
            await stopMovienight(channel);
        }));
})();
