const express = require('express');
const app = express();
const api = require('./api');

const db = require('./../database/db');
const settings = require('./../wallets/all_settings');

app.get('/', function(req, res) {
    res.send('nodejs server is working')
});

// app.use("/:wallet/api", function(req, res, next) {
//     var wallet = req.params['wallet'];
//     db.connect(settings[wallet].dbSettings);
//     process.on('SIGINT', function() {
//         console.log("Caught interrupt signal");
//         db.disconnect();
//         process.exit();
//     });
//     next();
// }, api);

app.use("/api", api);
module.exports = app;