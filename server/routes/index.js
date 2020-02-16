const express = require('express');
const app = express();
const api = require('./api');
const public_api = require('./public-api');
const explorer = require('./explorer');

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

var allowOnlyForExplorer = function (req, res, next) {
    // res.header('Content-Type', 'application/json');
    console.log("add to header called ... " + req.url + " origin - " + req.headers.referer);
    // // res.header("charset", "utf-8")
    var allowedOrigins = [
        "http://139.59.131.210/explorer",
        "https://139.59.131.210/explorer",
        "http://dev.masternode.review/explorer",
        "https://dev.masternode.review/explorer",
        "http://chain.review/explorer",
        "https://chain.review/explorer"
    ];
    var referer = req.headers.referer;
    var allowed = false;
    for(var i = 0;i < allowedOrigins.length && !allowed; i++) {
        if(referer && referer.indexOf(allowedOrigins[i]) > -1) {
            allowed = true;
        }
    }
    if(allowed) {
        next();
    } else {
        res.send('<html lang="en"><head>\n' +
            '<meta charset="utf-8">\n' +
            '<title>Error</title>\n' +
            '</head>' +
            '<body>' +
            '<pre>Cannot GET /api/' + req.url + '</pre>' +
            '</body>' +
            '</html>')
    }
};
app.use("/api", allowOnlyForExplorer, api);
app.use("/public-api", public_api);
app.use("/explorer", explorer);
module.exports = app;