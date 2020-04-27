const { startMovienight, startIRC, stopMovienight, stopIRC } = require('./lib/docker');
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
            await stopIRC(channel);
            await startMovienight(channel);
            await startIRC(channel);
        }));
})();
