const express = require('express');
var router = express.Router();

const db = require('./../../database/db');
const settings = require('./../../wallets/all_settings');

var TxController = require('./../../database/controllers/tx_controller');
var AdressController = require('./../../database/controllers/address_controller');
var StatsController = require('./../../database/controllers/stats_controller');
var RichlistController = require('./../../database/controllers/richlist_controller');
var MasternodeController = require('./../../database/controllers/masternode_controller');

var wallet = process.argv[2];

router.get('/', (req, res) => {
    res.json({item: wallet + ' db api'});
});

router.get('/getAllTx/:limit', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
        return;
    }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    TxController.getAll('blockindex', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(results);
    })
});

router.get('/getAllStats/:limit', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
        return;
    }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    StatsController.getAll('coin', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(results);
    })
})

router.get('/getStats/:coin', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
        return;
    }
    StatsController.getOne(req.params['coin'], function(results) {
        res.send(results);
    })
})

router.get('/getAllRichlist/:limit', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
        return;
    }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    RichlistController.getAll('coin', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(results);
    })
})

router.get('/getAllAddresses/:limit', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
        return;
    }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    // db.connect(settings[req.params['wallet']].dbSettings);
    AdressController.getAll('coin', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(results);
        // db.disconnect();
    })
})

router.get('/getAllMasternodes/:limit', (req, res) => {
    if(!db.isConnected()) {
        res.send('no database connected');
        return;
    }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    // db.connect(settings[req.params['wallet']].dbSettings);
    MasternodeController.getAll('rank', 'asc', parseInt(req.params['limit']), function(results) {
        res.send(results);
        // db.disconnect();
    })
})

module.exports = router;