const { reloadNginx } = require('./lib/docker');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async function() {
    await reloadNginx();
})();
