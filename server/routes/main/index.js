const express = require('express');
var router = express.Router();

const helpers = require('./../../helpers');
const db = require('./../../database/db');
var StatsController = require('./../../database/controllers/stats_controller');
const settings = require('./../../wallets/all_settings');

router.get('/getUsersStats', (req, res) => {
    const response = helpers.getGeneralResponse();
    var array = [];
    var wallets = [];
    for (var wallet in settings) {
        if(settings[wallet].active) {
            wallets.push(wallet);
        }
    }
    var fullUrl = req.protocol + '://' + req.get('host');
    addingWalletsStats(wallets);
    function returnData() {
        response.data = array;
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(response, null, 2));
    }
    function addStats(wallet,cb) {
        db.setCurrentConnection(wallet);
        StatsController.getOne(wallet, function(stats) {
            console.log('stats', stats)
            array.push({
                wallet: helpers.ucfirst(wallet),
                symbol: settings[wallet].symbol,
                explorer: fullUrl + '/explorer/' + wallet,
                api: fullUrl + '/public-api/db/' + wallet,
                stats: stats
            })
            cb();
        });
    }
    function addingWalletsStats(wallets) {
        if(!wallets.length) {
            returnData();
        } else {
            addStats(wallets[0], function () {
                wallets.shift();
                addingWalletsStats(wallets);
            })
        }
    }
});

module.exports = router;
