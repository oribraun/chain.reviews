const express = require('express');
var router = express.Router();

const db = require('./../../database/db');
const settings = require('./../../wallets/all_settings');

var TxController = require('./../../database/controllers/tx_controller');
var AddressController = require('./../../database/controllers/address_controller');
var StatsController = require('./../../database/controllers/stats_controller');
var RichlistController = require('./../../database/controllers/richlist_controller');
var MasternodeController = require('./../../database/controllers/masternode_controller');

var wallet = process.argv[2];

// router.get('/', (req, res) => {
//     res.json({item: res.locals.wallet + ' db api'});
// });

router.get('/getAllTx/:limit', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    TxController.getAll('blockindex', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(JSON.stringify(results, null, 2));
    })
});

// router.get('/getAllStats/:limit', (req, res) => {
//     // if(!db.isConnected()) {
//     //     res.send('no database connected');
//     //     return;
//     // }
//     if(isNaN(parseInt(req.params['limit']))) {
//         res.send('limit value have to be number');
//         return;
//     }
//     StatsController.getAll('coin', 'desc', parseInt(req.params['limit']), function(results) {
//         res.send(results);
//     })
// })

router.get('/getStats/:coin', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    StatsController.getOne(req.params['coin'], function(results) {
        res.send(JSON.stringify(results, null, 2));
    })
})

router.get('/getAllRichlist/:limit', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    RichlistController.getAll('coin', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(JSON.stringify(results, null, 2));
    })
})

router.get('/getAllAddressByBalance', (req, res) => {
    AddressController.getRichlist('balance', 'desc', 0, function(results) {
        res.send(JSON.stringify(results, null, 2));
    })
});

router.get('/getAllAddressByReceived', (req, res) => {
    AddressController.getRichlist('received', 'desc', 0, function(results) {
        res.send(JSON.stringify(results, null, 2));
    })
})

router.get('/getRichlistBalance', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    RichlistController.getOne(res.locals.wallet, function(results) {
        results.balance.sort(function(a,b) {
            return b.balance - a.balance;
        })

        var r = [];
        for(var i in results.balance) {
            r.push({balance: (results.balance[i].balance).toFixed(8), address: results.balance[i].a_id})
        }
        res.send(JSON.stringify(r, null, 2));
    })
})

router.get('/getAllAddresses/:limit', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    // db.connect(settings[req.params['wallet']].dbSettings);
    AddressController.getAll('coin', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(JSON.stringify(results, null, 2));
        // db.disconnect();
    })
})

router.get('/getBlockCount', (req, res) => {
    TxController.count(function(count) {
        res.json(count);
    })
});

router.get('/getBlockByTxid/:txid', (req, res) => {
    TxController.getTxBlockByTxid(req.params['txid'],function(result) {
        res.send(JSON.stringify(result, null, 2));
    })
});

router.get('/getBlockByHash/:hash', (req, res) => {
    TxController.getTxBlockByHash(req.params['hash'],function(result) {
        res.send(JSON.stringify(result, null, 2));
    })
});

router.get('/getBlockHash/:number', (req, res) => {
    if(isNaN(parseInt(req.params['number']))) {
        res.send('limit value have to be number');
        return;
    }
    TxController.getOne(req.params['number'],function(result) {
        res.send(JSON.stringify(result, null, 2));
    })
});

router.get('/listMasternodes/:limit', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    // db.connect(settings[req.params['wallet']].dbSettings);
    MasternodeController.getAll('rank', 'asc', parseInt(req.params['limit']), function(results) {
        res.send(JSON.stringify(results, null, 2));
        // db.disconnect();
    })
})
router.get('/getMasternodeCount', (req, res) => {
    MasternodeController.count(function(count) {
        res.json(count);
    })
});

module.exports = router;
