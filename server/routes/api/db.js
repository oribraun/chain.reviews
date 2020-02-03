const express = require('express');
var router = express.Router();

const db = require('./../../database/db');
const settings = require('./../../wallets/all_settings');
const wallet_commands = require('../../wallet_commands');

var TxController = require('./../../database/controllers/tx_controller');
var BlockController = require('./../../database/controllers/block_controller');
var TxVinVoutController = require('./../../database/controllers/tx_vin_vout_controller');
var AddressController = require('./../../database/controllers/address_controller');
var AddressToUpdateController = require('./../../database/controllers/address_to_update_controller');
var StatsController = require('./../../database/controllers/stats_controller');
var RichlistController = require('./../../database/controllers/richlist_controller');
var MasternodeController = require('./../../database/controllers/masternode_controller');
var PeersController = require('./../../database/controllers/peers_controller');

// var wallet = process.argv[2];

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
router.get('/getStats', (req, res) => {
    var wallet = res.locals.wallet;
    StatsController.getOne(wallet, function(stats) {
        if(stats) {
            res.send(JSON.stringify(stats, null, 2));
        } else {
            res.send(' no stats found yet');
        }
    });
});

router.get('/getAllBlocks/:limit/:offset', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if(isNaN(parseInt(req.params['offset']))) {
        res.send('limit value have to be number');
        return;
    }
    BlockController.getAll2({}, {blockindex: true, blockhash: true, timestamp: true},'blockindex', 'desc', parseInt(req.params['limit']), parseInt(req.params['offset']), function(results) {
        res.send(JSON.stringify(results, null, 2));
    })
    // BlockController.estimatedDocumentCount(function(count) {
    //     res.json(count);
    // })
});

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
// router.get('/getAllTxJoin/:limit', (req, res) => {
//     // if(!db.isConnected()) {
//     //     res.send('no database connected');
//     //     return;
//     // }
//     if(isNaN(parseInt(req.params['limit']))) {
//         res.send('limit value have to be number');
//         return;
//     }
//     TxController.getAll2Join({}, 'blockindex', 'desc', parseInt(req.params['limit']), 0, function(results) {
//         res.send(JSON.stringify(results, null, 2));
//     })
// });
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
// router.get('/getAllTxVinVoutByCreated/:limit/:offset', (req, res) => {
//     // if(!db.isConnected()) {
//     //     res.send('no database connected');
//     //     return;
//     // }
//     if(isNaN(parseInt(req.params['limit']))) {
//         res.send('limit value have to be number');
//         return;
//     }
//     TxVinVoutController.getAll1('_id', 'desc', parseInt(req.params['limit']), parseInt(req.params['offset']), function(results) {
//         var new_results = [];
//         for (var i in results) {
//             var c_r = JSON.parse(JSON.stringify(results[i]));
//             c_r.time = results[i]._id.getTimestamp().toString().replace('T', ' ').replace('Z', ' ');
//             new_results.push(c_r);
//         }
//         res.send(JSON.stringify(new_results, null, 2));
//     })
// });

// router.get('/getStats/:coin', (req, res) => {
//     // if(!db.isConnected()) {
//     //     res.send('no database connected');
//     //     return;
//     // }
//     StatsController.getOne(req.params['coin'], function(results) {
//         res.send(JSON.stringify(results, null, 2));
//     })
// })

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
    AddressToUpdateController.getAll('blockindex', 'desc', parseInt(req.params['limit']), function(results) {
        res.send(JSON.stringify(results, null, 2));
        // db.disconnect();
    })
})

// router.get('/getAllAddressByBalance', (req, res) => {
//     AddressController.getRichlist('balance', 'desc', 0, function(results) {
//         res.send(JSON.stringify(results, null, 2));
//     })
// });
//
// router.get('/getAllAddressByReceived', (req, res) => {
//     AddressController.getRichlist('received', 'desc', 0, function(results) {
//         res.send(JSON.stringify(results, null, 2));
//     })
// })

// router.get('/getAllAddressRichlist', (req, res) => {
//     var startDate = new Date();
//     AddressToUpdateController.getRichlistFaster('received', 'desc', 100, function(received){
//         var endDate = new Date();
//         res.send(JSON.stringify({received: received, startDate: startDate, endDate: endDate}, null, 2));
//     })
// })
router.get('/getAddressTxs/:address/:limit/:offset', (req, res) => {
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if(isNaN(parseInt(req.params['offset']))) {
        res.send('offset value have to be number');
        return;
    }
    AddressToUpdateController.getOneJoin(req.params['address'], req.params['limit'], req.params['offset'], function(address) {
        if(address) {
            // var txs = [];
            // var hashes = address.txs.reverse();
            // var limitTx = req.params['limit'];
            // if (!limitTx || address.txs.length < limitTx) {
            //     limitTx = address.txs.length;
            // }
            // for(var i = 0; i < limitTx; i++) {
            //     TxController.getTxBlockByTxid(hashes[i].addresses, function(tx) {
            //         if (tx) {
            //             txs.push(tx);
            //         }
            //     });
            // }
            res.send(JSON.stringify(address.txs, null, 2));
        } else {
            res.send('no address found');
        }
        // db.disconnect();
    })
})

router.get('/getAddressDetails/:address', (req, res) => {
    AddressToUpdateController.getAddressDetails(req.params['address'], function(details) {
        res.send(JSON.stringify(details, null, 2));
    });
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

router.get('/getRichlist', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    StatsController.getOne(res.locals.wallet, function(stats) {
        if(stats) {
            RichlistController.getOne(settings[res.locals.wallet].coin, function(results) {
                results.received.sort(function(a,b) {
                    return b.received - a.received;
                })

                var received = [];
                for(var i in results.received) {
                    received.push({received: (results.received[i].received).toFixed(8), address: results.received[i].a_id})
                }

                results.balance.sort(function(a,b) {
                    return b.balance - a.balance;
                })

                var balance = [];
                for(var i in results.balance) {
                    balance.push({balance: (results.balance[i].balance).toFixed(8), address: results.balance[i].a_id})
                }
                 var distribution = get_distribution({'received': received, 'balance': balance}, stats);
                res.send(JSON.stringify({
                    active: 'richlist',
                    balance: balance,
                    received: received,
                    stats: stats,
                    dista: distribution.t_1_25,
                    distb: distribution.t_26_50,
                    distc: distribution.t_51_75,
                    distd: distribution.t_76_100,
                    diste: distribution.t_101plus,
                    distTotal: (100 - parseFloat(distribution.t_76_100.percent)).toFixed(2),
                    // show_dist: settings.richlist.distribution,
                    // show_received: settings.richlist.received,
                    // show_balance: settings.richlist.balance,
                }, null, 2));
            })
        } else {
            res.send('no stats found yet');
        }
    });
})


router.get('/getTxCount', (req, res) => {
    TxController.estimatedDocumentCount(function(count) {
        res.json(count);
    })
});

router.get('/getBlockCount', (req, res) => {
    BlockController.estimatedDocumentCount(function(count) {
        res.json(count);
    })
});

router.get('/getTxVinVoutCount', (req, res) => {
    TxVinVoutController.estimatedDocumentCount(function(count) {
        res.json(count);
    })
});

router.get('/getAddressesCount', (req, res) => {
    AddressToUpdateController.estimatedDocumentCount(function(count) {
        res.json(count);
    })
});
router.get('/getUniqueAddressesCount', (req, res) => {
    AddressToUpdateController.countUnique(function(count) {
        res.json(count);
    })
});

router.get('/getLatestTxBlockIndex', (req, res) => {
    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
        // console.log('latestTx', latestTx);
        if(latestTx.length) {
            res.json(latestTx[0].blockindex);
        } else {
            res.json("no transactions in database");
        }
    })
});

router.get('/getTxByTxid/:txid', (req, res) => {
    TxController.getTxBlockByTxid(req.params['txid'],function(result) {
        res.send(JSON.stringify(result, null, 2));
    })
});

router.get('/getTxByHash/:hash', (req, res) => {
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
                        if(i < result.tx.length - 1) {
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

router.get('/getBlockTxsByHash/:hash', (req, res) => {
    wallet_commands.getBlock(res.locals.wallet, req.params['hash']).then(function(block) {
        TxController.getAllTxWithVinVoutByHash(req.params['hash'], 'blockindex', 'desc', function (txs) {
            var data = {block: JSON.parse(block), txs: txs}
            res.send(JSON.stringify(data, null, 2));
        })
    });
});

router.get('/getTxDetails/:txid', (req, res) => {
    wallet_commands.getRawTransaction(res.locals.wallet, req.params['txid']).then(function(tx) {
        TxVinVoutController.getTxBlockByTxid(req.params['txid'], function (txVinVout) {
            tx.height = txVinVout.blockindex;
            tx.vin = txVinVout.vin;
            tx.vout = txVinVout.vout;
            res.send(JSON.stringify(tx, null, 2));
        })
    });
});

router.get('/getBlockHash/:number', (req, res) => {
    if(isNaN(parseInt(req.params['number']))) {
        res.send('limit value have to be number');
        return;
    }
    TxController.getOne(req.params['number'],function(result) {
        if(result) {
            res.send(JSON.stringify(result.blockhash, null, 2));
        } else {
            res.send('block not found');
        }
    })
});

// router.get('/getBlockHashJoin/:txid', (req, res) => {
//     TxController.getBlockHashJoin(req.params['txid'],function(result) {
//         res.send(JSON.stringify(result, null, 2));
//     })
// });
// router.get('/getAllJoin', (req, res) => {
//     TxController.getAll2Join({}, 'blockindex', 'desc', 10, 0,function(result) {
//         res.send(JSON.stringify(result, null, 2));
//     })
// });

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
    MasternodeController.estimatedDocumentCount(function(count) {
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

router.get('/search/:hash', (req, res) => {
    var result = {
        type: '',
        result: ''
    }
    BlockController.getBlockByHash(req.params['hash'], function(block) {
        if(block) {
            result.type = 'block';
            result.result = req.params['hash'];
            sendResult()
        } else {
            TxController.getTxBlockByTxid(req.params['hash'], function (tx) {
                if(tx) {
                    result.type = 'tx';
                    result.result = req.params['hash'];
                    sendResult()
                } else {
                    AddressToUpdateController.getOne(req.params['hash'], function (address) {
                        if(address) {
                            result.type = 'address';
                            result.result = req.params['hash'];
                        }
                        sendResult()
                    })
                }
            })
        }
        function sendResult() {
            res.send(JSON.stringify(result, null, 2));
        }
    })
});

module.exports = router;


// router.get('/richlist', function(req, res) {
//     if (settings.display.richlist == true ) {
//         db.get_stats(settings.coin, function (stats) {
//             db.get_richlist(settings.coin, function(richlist){
//                 //console.log(richlist);
//                 if (richlist) {
//                     db.get_distribution(richlist, stats, function(distribution) {
//                         //console.log(distribution);
//                         res.render('richlist', {
//                             active: 'richlist',
//                             balance: richlist.balance,
//                             received: richlist.received,
//                             stats: stats,
//                             dista: distribution.t_1_25,
//                             distb: distribution.t_26_50,
//                             distc: distribution.t_51_75,
//                             distd: distribution.t_76_100,
//                             diste: distribution.t_101plus,
//                             show_dist: settings.richlist.distribution,
//                             show_received: settings.richlist.received,
//                             show_balance: settings.richlist.balance,
//                         });
//                     });
//                 } else {
//                     route_get_index(res, null);
//                 }
//             });
//         });
//     } else {
//         route_get_index(res, null);
//     }
// });

var get_distribution = function(richlist, stats){
    var distribution = {
        supply: stats.supply,
        t_1_25: {percent: 0, total: 0 },
        t_26_50: {percent: 0, total: 0 },
        t_51_75: {percent: 0, total: 0 },
        t_76_100: {percent: 0, total: 0 },
        t_101plus: {percent: 0, total: 0 }
    };
    for(var i = 0; i < richlist.balance.length; i++) {
        var count = i + 1;
        var percentage = ((richlist.balance[i].balance / 100000000) / stats.supply) * 100;
        if (count <= 25) {
            distribution.t_1_25.percent = distribution.t_1_25.percent + percentage;
            distribution.t_1_25.total = distribution.t_1_25.total + (richlist.balance[i].balance / 100000000);
        }
        if (count <= 50 && count > 25) {
            distribution.t_26_50.percent = distribution.t_26_50.percent + percentage;
            distribution.t_26_50.total = distribution.t_26_50.total + (richlist.balance[i].balance / 100000000);
        }
        if (count <= 75 && count > 50) {
            distribution.t_51_75.percent = distribution.t_51_75.percent + percentage;
            distribution.t_51_75.total = distribution.t_51_75.total + (richlist.balance[i].balance / 100000000);
        }
        if (count <= 100 && count > 75) {
            distribution.t_76_100.percent = distribution.t_76_100.percent + percentage;
            distribution.t_76_100.total = distribution.t_76_100.total + (richlist.balance[i].balance / 100000000);
        }
    }
    distribution.t_101plus.percent = parseFloat(100 - distribution.t_76_100.percent - distribution.t_51_75.percent - distribution.t_26_50.percent - distribution.t_1_25.percent).toFixed(2);
    distribution.t_101plus.total = parseFloat(distribution.supply - distribution.t_76_100.total - distribution.t_51_75.total - distribution.t_26_50.total - distribution.t_1_25.total).toFixed(8);
    distribution.t_1_25.percent = parseFloat(distribution.t_1_25.percent).toFixed(2);
    distribution.t_1_25.total = parseFloat(distribution.t_1_25.total).toFixed(8);
    distribution.t_26_50.percent = parseFloat(distribution.t_26_50.percent).toFixed(2);
    distribution.t_26_50.total = parseFloat(distribution.t_26_50.total).toFixed(8);
    distribution.t_51_75.percent = parseFloat(distribution.t_51_75.percent).toFixed(2);
    distribution.t_51_75.total = parseFloat(distribution.t_51_75.total).toFixed(8);
    distribution.t_76_100.percent = parseFloat(distribution.t_76_100.percent).toFixed(2);
    distribution.t_76_100.total = parseFloat(distribution.t_76_100.total).toFixed(8);
    return distribution;
}

