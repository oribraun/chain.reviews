const express = require('express');
var router = express.Router();

const helpers = require('./../../helpers');
const markets_helper = require('./../../markets');
const db = require('./../../database/db');
var StatsController = require('./../../database/controllers/stats_controller');
var MarketsController = require('./../../database/controllers/markets_controller');
const settings = require('./../../wallets/all_settings');

router.get('/getUsersStats', (req, res) => {
    const response = helpers.getGeneralResponse();
    var array = [];
    var wallets = markets_helper.getAllWallets();
    var fullUrl = req.protocol + '://' + req.get('host');

    var promises = [];
    for (var i in wallets) {
        var promise = new Promise((resolve, reject) => {
            markets_helper.getStatsCoincodexPromise(wallets[i], fullUrl, function (stats) {
                array.push(stats);
                resolve();
            });
        });
        promises.push(promise)
    }
    Promise.all(promises).then((values) => {
        returnData();
    })
    function returnData() {
        response.data = array;
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(response, null, 2));
    }

    addingWalletsStats(wallets);
});

module.exports = router;
