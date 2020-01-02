const express = require('express');
var router = express.Router();

const db = require('./../../database/db');
const settings = require('./../../wallets/all_settings');
const wallet_commands = require('../../wallet_commands');

var TxController = require('./../../database/controllers/tx_controller');
var TxVinVoutController = require('./../../database/controllers/tx_vin_vout_controller');
var AddressController = require('./../../database/controllers/address_controller');
var StatsController = require('./../../database/controllers/stats_controller');
var RichlistController = require('./../../database/controllers/richlist_controller');
var MasternodeController = require('./../../database/controllers/masternode_controller');
var PeersController = require('./../../database/controllers/peers_controller');

var wallet = process.argv[2];

// router.get('/', (req, res) => {
//     res.json({item: res.locals.wallet + ' db api'});
// });
//
// router.get('/getAllBlocks/:limit', (req, res) => {
//     // if(!db.isConnected()) {
//     //     res.send('no database connected');
//     //     return;
//     // }
//     if(isNaN(parseInt(req.params['limit']))) {
//         res.send('limit value have to be number');
//         return;
//     }
//     TxController.getAll('blockindex', 'desc', parseInt(req.params['limit']), function(results) {
//         res.send(JSON.stringify(results, null, 2));
//     })
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
router.get('/getAllTxJoin/:limit', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    TxController.getAll2Join({}, 'blockindex', 'desc', parseInt(req.params['limit']), 0, function(results) {
        res.send(JSON.stringify(results, null, 2));
    })
});
router.get('/getAllTxVinVout/:limit', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    TxVinVoutController.getAll('blockindex', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(JSON.stringify(results, null, 2));
    })
});
router.get('/getAllTxVinVoutByCreated/:limit/:offset', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    TxVinVoutController.getAll1('_id', 'desc', parseInt(req.params['limit']), parseInt(req.params['offset']), function(results) {
        var new_results = [];
        for (var i in results) {
            var c_r = JSON.parse(JSON.stringify(results[i]));
            c_r.time = results[i]._id.getTimestamp().toString().replace('T', ' ').replace('Z', ' ');
            new_results.push(c_r);
        }
        res.send(JSON.stringify(new_results, null, 2));
    })
});

router.get('/getStats/:coin', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    StatsController.getOne(req.params['coin'], function(results) {
        res.send(JSON.stringify(results, null, 2));
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
    AddressController.getAll('updatedAt', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(JSON.stringify(results, null, 2));
        // db.disconnect();
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

router.get('/getAddress/:address/:limitTx?', (req, res) => {
    AddressController.getOne(req.params['address'], function(address) {
        if(address) {
            var txs = [];
            var hashes = address.txs.reverse();
            var limitTx = req.params['limitTx'];
            if (!limitTx || address.txs.length < limitTx) {
                limitTx = address.txs.length;
            }
            for(var i = 0; i < limitTx; i++) {
                TxController.getTxBlockByTxid(hashes[i].addresses, function(tx) {
                    if (tx) {
                        txs.push(tx);
                    }
                });
            }
            res.send(JSON.stringify({address: address, txs: txs}, null, 2));
        } else {
            res.send('no address found');
        }
        // db.disconnect();
    })
})

router.get('/getRichlistBalance', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    RichlistController.getOne(settings[res.locals.wallet].coin, function(results) {
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

router.get('/getRichlistReceived', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    RichlistController.getOne(settings[res.locals.wallet].coin, function(results) {
        results.received.sort(function(a,b) {
            return b.received - a.received;
        })

        var r = [];
        for(var i in results.received) {
            r.push({received: (results.received[i].received).toFixed(8), address: results.received[i].a_id})
        }
        res.send(JSON.stringify(r, null, 2));
    })
})


router.get('/getTxCount', (req, res) => {
    TxController.count(function(count) {
        res.json(count);
    })
});

router.get('/getTxVinVoutCount', (req, res) => {
    TxVinVoutController.count(function(count) {
        res.json(count);
    })
});

router.get('/getAddressesCount', (req, res) => {
    AddressController.count(function(count) {
        res.json(count);
    })
});

router.get('/getLatestBlockIndex', (req, res) => {
    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
        console.log('latestTx', latestTx);
        if(latestTx.length) {
            res.json(latestTx[0].blockindex);
        } else {
            res.json("no transactions in database");
        }
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

router.get('/getBlockWithTxsByHash/:hash', (req, res) => {
    wallet_commands.getBlock(res.locals.wallet, req.params['hash']).then(function(result) {
        if(result) {
            result = JSON.parse(result);
            if(result.tx && result.tx.length) {
                var txs = [];
                function getTx(i) {
                    TxController.getTxBlockByTxid(result.tx[i],function(tx) {
                        txs.push(tx);
                        if(i < result.tx.length) {
                            getTx(++i);
                        } else {
                            res.send(JSON.stringify({
                                block: result,
                                txs: txs
                            }, null, 2));
                        }
                    })
                }
                getTx(0);
            } else {
                res.send(JSON.stringify(result, null, 2));
            }
        } else {
            res.send('block not found');
        }
    }).catch(function(err) {

    })
    // TxController.getTxBlockByHash(req.params['hash'],function(result) {
    //     if(result) {
    //         if(result.txs && result.txs.length) {
    //             var txs = [];
    //             function getTx(i) {
    //                 TxController.getTxBlockByTxid(result.txs[i],function(tx) {
    //                     txs.push(tx);
    //                     if(i < result.txs.length) {
    //                         getTx(++i);
    //                     } else {
    //                         res.send(JSON.stringify({
    //                             block: result,
    //                             txs: txs
    //                         }, null, 2));
    //                     }
    //                 })
    //             }
    //             getTx(0);
    //         } else {
    //             res.send(JSON.stringify(result, null, 2));
    //         }
    //     } else {
    //         res.send('block not found');
    //     }
    // })
});

router.get('/getBlockHash/:number', (req, res) => {
    if(isNaN(parseInt(req.params['number']))) {
        res.send('limit value have to be number');
        return;
    }
    TxController.getOne(req.params['number'],function(result) {
        res.send(JSON.stringify(result.blockhash, null, 2));
    })
});

router.get('/getBlockHashJoin/:txid', (req, res) => {
    TxController.getBlockHashJoin(req.params['txid'],function(result) {
        res.send(JSON.stringify(result, null, 2));
    })
});
router.get('/getAllJoin', (req, res) => {
    TxController.getAll2Join({}, 'blockindex', 'desc', 10, 0,function(result) {
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

router.get('/getAllPeers/:limit', (req, res) => {
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    PeersController.getAll('lastactivity', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(JSON.stringify(results, null, 2));
        // db.disconnect();
    })
})

module.exports = router;
