const express = require('express');
var router = express.Router();

const db = require('./../../database/db');
const settings = require('./../../wallets/all_settings');

var TxController = require('./../../database/controllers/tx_controller');
var AdressController = require('./../../database/controllers/address_controller');
var StatsController = require('./../../database/controllers/stats_controller');
var RichlistController = require('./../../database/controllers/richlist_controller');

var wallet = process.argv[2];

router.get('/', (req, res) => {
    res.json({item: wallet + ' db api'});
});

router.get('/getAllTx', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
    }
    TxController.getAll('blockindex', 'desc', 10, function(results) {
        res.send(results);
    })
});

router.get('/getAllStats', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
    }
    StatsController.getAll('coin', 'desc', 10, function(results) {
        res.send(results);
    })
})

router.get('/getStats/:coin', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
    }
    StatsController.getOne(req.params['coin'], function(results) {
        res.send(results);
    })
})

router.get('/getAllRichlist', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
    }
    RichlistController.getAll('coin', 'desc', 10, function(results) {
        res.send(results);
    })
})

router.get('/getAllAddresses', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
    }
    // db.connect(settings[req.params['wallet']].dbsettings);
    AdressController.getAll('coin', 'desc', 10, function(results) {
        res.send(results);
        // db.disconnect();
    })
})

module.exports = router;