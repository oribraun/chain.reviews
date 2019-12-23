var fs = require('fs-extra');
const path = require("path");

require('fs').readdirSync(path.resolve(__dirname, "./"), { withFileTypes: true}).forEach(function(file) {
    if(file.isDirectory()) {
        var settings = require('./' + file.name + '/settings');
        exports[file.name] = settings;
    }
});
