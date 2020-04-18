const express = require('express');
const app = express();
const explorer_api = require('./explorer-api');
const api = require('./api');
const explorer = require('./explorer');
const main = require('./main');
const helpers = require('./../helpers');
const path = require('path');

const db = require('./../database/db');
var StatsController = require('./../database/controllers/stats_controller');
const settings = require('./../wallets/all_settings');

app.get('/', function(req, res) {
    var array = [];
    var wallets = [];
    for (var wallet in settings) {
        if(settings[wallet].active) {
            wallets.push(wallet);
        }
    }
    var fullUrl = req.protocol + '://' + req.get('host');
    addingWalletsStats(wallets);
    function sendFile() {
        res.render(path.resolve(__dirname + "/../../chain.review.clients/main/chain.review.ejs"), {
            data: array,
        });
    }
    function addStats(wallet,cb) {
        db.setCurrentConnection(wallet);
        StatsController.getOne(wallet, function(stats) {
            console.log('stats', stats)
            array.push({
                wallet: helpers.ucfirst(wallet),
                explorer: fullUrl + '/explorer/' + wallet,
                api: fullUrl + '/public-api/db/' + wallet,
                stats: stats
            })
            cb();
        });
    }
    function addingWalletsStats(wallets) {
        if(!wallets.length) {
            sendFile();
        } else {
            addStats(wallets[0], function () {
                wallets.shift();
                addingWalletsStats(wallets);
            })
        }
    }
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
        "https://chain.review/explorer",
        "http://134.122.85.174/explorer", // dev site
        "https://sandbox.chain.review/explorer",  // dev site
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
app.use("/explorer-api", allowOnlyForExplorer, explorer_api);
app.use("/api", api);
app.use("/explorer", explorer);
app.use("/main", main);
module.exports = app;
