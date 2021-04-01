const express = require('express');
var router = express.Router();

const db = require('./../../database/db');
const settings = require('./../../wallets/all_settings');
const wallet_commands = require('../../wallet_commands');
const helpers = require('../../helpers');
const tx_types = require('../../tx_types');

var TxController = require('./../../database/controllers/tx_controller');
var BlockController = require('./../../database/controllers/block_controller');
var TxVinVoutController = require('./../../database/controllers/tx_vin_vout_controller');
var AddressController = require('./../../database/controllers/address_controller');
var AddressToUpdateController = require('./../../database/controllers/address_to_update_controller');
var StatsController = require('./../../database/controllers/stats_controller');
var RichlistController = require('./../../database/controllers/richlist_controller');
var MasternodeController = require('./../../database/controllers/masternode_controller');
var PeersController = require('./../../database/controllers/peers_controller');
var MarketController = require('./../../database/controllers/markets_controller');
var CoinMarketCapController = require('./../../database/controllers/coin_market_cap_controller');
var TxByDayController = require('./../../database/controllers/tx_by_day_controller');
var ClusterController = require('./../../database/controllers/cluster_controller');
var ClusterTxByDayController = require('./../../database/controllers/cluster_tx_by_day_controller');

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
    const response = helpers.getGeneralResponse();
    StatsController.getOne(wallet, function(stats) {
        if(stats) {
            response.data = stats;
        } else {
            response.err = 1;
            response.errMessage = 'no stats found yet';
        }
        res.send(JSON.stringify(response, null, 2));
    });
});

router.post('/getAllBlocks', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    if(isNaN(parseInt(req.body['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if(isNaN(parseInt(req.body['offset']))) {
        res.send('limit value have to be number');
        return;
    }
    const response = helpers.getGeneralResponse();
    BlockController.getAll4({blockindex: true, blockhash: true, timestamp: true},'blockindex', 'desc', parseInt(req.body['limit']), parseInt(req.body['offset']), function(results) {
    // BlockController.getAll2({}, {blockindex: true, blockhash: true, timestamp: true},'blockindex', 'desc', parseInt(req.body['limit']), parseInt(req.body['offset']), function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no blocks found';
        }
        res.send(JSON.stringify(response, null, 2));
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
    const response = helpers.getGeneralResponse();
    TxController.getAll('blockindex', 'desc', parseInt(req.params['limit']), function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no tx found';
        }
        res.send(JSON.stringify(response, null, 2));
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
// router.post('/getAllTxVinVout', (req, res) => {
//     if(isNaN(parseInt(req.body['limit']))) {
//         res.send('limit value have to be number');
//         return;
//     }
//     if(isNaN(parseInt(req.body['offset']))) {
//         res.send('offset value have to be number');
//         return;
//     }
//     const response = helpers.getGeneralResponse();
//     var yearFromNowTimestamp = new Date(new Date().getTime() - 1000*60*60*24*365).getTime() / 1000;
//     // TxVinVoutController.getAll2({total: {$gt: 0}, timestamp: {$gte: yearFromNowTimestamp }}, {_id: false, timestamp: true, txid: true, total: true, blockindex: true, type: true},'blockindex', 'desc', parseInt(req.body['limit']), parseInt(req.body['offset']), function(results) {
//     TxVinVoutController.getAll2({total: {$gt: 0}}, {_id: true, timestamp: true, txid: true, total: true, blockindex: true, type: true},'blockindex', 'desc', parseInt(req.body['limit']), parseInt(req.body['offset']), function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no tx found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     })
// });
router.post('/getAllTxVinVout', (req, res) => {
    if(isNaN(parseInt(req.body['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if(isNaN(parseInt(req.body['offset']))) {
        res.send('offset value have to be number');
        return;
    }
    const response = helpers.getGeneralResponse();
    // TxVinVoutController.getAll2({total: {$gt: 0}},{order: true, timestamp: true, txid: true, total: true, blockindex: true, type: true},'blockindex', 'desc', parseInt(req.body['limit']), parseInt(req.body['offset']), function(results) {
    TxVinVoutController.getAll4({order: true, timestamp: true, txid: true, total: true, blockindex: true, type: true},'order', 'desc', parseInt(req.body['limit']), parseInt(req.body['offset']), function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no tx found';
        }
        res.send(JSON.stringify(response, null, 2));
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
    const response = helpers.getGeneralResponse();
    AddressToUpdateController.getAll('blockindex', 'desc', parseInt(req.params['limit']), function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no address found';
        }
        res.send(JSON.stringify(response, null, 2));
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
router.post('/getAddressTxs', (req, res) => {
    if(isNaN(parseInt(req.body['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if(isNaN(parseInt(req.body['offset']))) {
        res.send('offset value have to be number');
        return;
    }
    const response = helpers.getGeneralResponse();
    // AddressToUpdateController.getAddressTxs(req.body['address'], req.body['limit'], req.body['offset'], function(results) {
    //     if(results) {
    //         response.data = results.txs;
    //     } else {
    //         response.err = 1;
    //         response.errMessage = 'no tx found';
    //     }
    //     res.send(JSON.stringify(response, null, 2));
    //     // db.disconnect();
    // })
    AddressToUpdateController.getAddressTxsByOrder(req.body['address'],'order', 'desc', parseInt(req.body['limit']), parseInt(req.body['offset']), function(results) {
        if(results) {
            response.data = results.txs;
        } else {
            response.err = 1;
            response.errMessage = 'no tx found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})

router.post('/getAddressDetails', (req, res) => {
    const response = helpers.getGeneralResponse();
    AddressController.getOne(req.body['address'], function(results) {
        // AddressToUpdateController.getAddressDetails(req.body['address'], function (results) {
            ClusterController.getClusterByAddress(req.body['address'], function (clusters) {
                if (results) {
                    if (clusters) {
                        results.clusters = clusters;
                    }
                    results.count = results.last_order;
                    results.address = results.a_id;
                    // results.addressSum = results;
                    response.data = results;
                } else {
                    response.err = 1;
                    response.errMessage = 'no address found';
                }
                res.send(JSON.stringify(response, null, 2));
            });
        // });
    });
})

router.post('/getAddressTxChart', (req, res) => {
    const response = helpers.getGeneralResponse();
    AddressToUpdateController.getAddressTxChart(req.body['address'], '', function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no address found';
        }
        res.send(JSON.stringify(response, null, 2));
    });
});

router.get('/getRichlistBalance', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    const response = helpers.getGeneralResponse();
    RichlistController.getOne(settings[res.locals.wallet].coin, function(results) {
        if(results) {
            results.balance.sort(function(a,b) {
                return b.balance - a.balance;
            })

            var r = [];
            for(var i in results.balance) {
                r.push({balance: (results.balance[i].balance).toFixed(8), address: results.balance[i].a_id})
            }
            response.data = r;
        } else {
            response.err = 1;
            response.errMessage = 'no richlist found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})

router.get('/getRichlistReceived', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    const response = helpers.getGeneralResponse();
    RichlistController.getOne(settings[res.locals.wallet].coin, function(results) {
        if(results) {
            results.received.sort(function(a,b) {
                return b.received - a.received;
            })

            var r = [];
            for(var i in results.received) {
                r.push({received: (results.received[i].received).toFixed(8), address: results.received[i].a_id})
            }
            response.data = r;
        } else {
            response.err = 1;
            response.errMessage = 'no richlist found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})

router.get('/getRichlist', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    const response = helpers.getGeneralResponse();
    StatsController.getOne(res.locals.wallet, function(stats) {
        if(stats) {
            RichlistController.getOne(settings[res.locals.wallet].coin, function(results) {
                if(results) {
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
                    var distribution = helpers.get_distribution({'received': received, 'balance': balance}, stats);
                    var data = {
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
                    }
                    response.data = data;
                } else {
                    response.err = 1;
                    response.errMessage = 'no address found';
                }
                res.send(JSON.stringify(response, null, 2));
            })
        } else {
            res.send('no stats found yet');
        }
    });
})


router.get('/getTxCount', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxController.estimatedDocumentCount(function(count) {
        response.data = count;
        res.send(JSON.stringify(response, null, 2));
    })
});

router.get('/getBlockCount', (req, res) => {
    const response = helpers.getGeneralResponse();
    BlockController.estimatedDocumentCount(function(count) {
        response.data = count;
        res.send(JSON.stringify(response, null, 2));
    })
});

router.get('/getTxVinVoutCount', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxVinVoutController.estimatedDocumentCount(function(count) {
        response.data = count;
        res.send(JSON.stringify(response, null, 2));
    })
});

router.get('/getTxVinVoutCountWhereTotal', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxVinVoutController.countWhereTotal(function(count) {
        response.data = count;
        res.send(JSON.stringify(response, null, 2));
    })
});

router.get('/getAddressesCount', (req, res) => {
    const response = helpers.getGeneralResponse();
    AddressToUpdateController.estimatedDocumentCount(function(count) {
        response.data = count;
        res.send(JSON.stringify(response, null, 2));
    })
});
router.get('/getUniqueAddressesCount', (req, res) => {
    const response = helpers.getGeneralResponse();
    AddressToUpdateController.countUnique(function(count) {
        response.data = count;
        res.send(JSON.stringify(response, null, 2));
    })
});

router.get('/getLatestTxBlockIndex', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
        // console.log('latestTx', latestTx);
        if(latestTx.length) {
            response.data = latestTx[0].blockindex;
        } else {
            response.err = 1;
            response.errMessage = 'no tx found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
});

router.get('/getTxByTxid/:txid', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxController.getTxBlockByTxid(req.params['txid'],function(result) {
        if(result) {
            response.data = result;
        } else {
            response.err = 1;
            response.errMessage = 'no tx found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
});

router.get('/getTxByHash/:hash', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxController.getTxBlockByHash(req.params['hash'],function(result) {
        if(result) {
            response.data = result;
        } else {
            response.err = 1;
            response.errMessage = 'no tx found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
});

router.get('/getTxVinVoutByTxid/:txid', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxVinVoutController.getTxBlockByTxid(req.params['txid'],function(result) {
        if(result) {
            response.data = result;
        } else {
            response.err = 1;
            response.errMessage = 'no tx found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
});

router.get('/getBlockWithTxsByHash/:hash', (req, res) => {
    const response = helpers.getGeneralResponse();
    wallet_commands.getBlock(res.locals.wallet, req.params['hash']).then(function(result) {
        if(result) {
            result = JSON.parse(result);
            var txs = [];
            if(result.tx && result.tx.length) {
                function getTx(i) {
                    TxController.getTxBlockByTxid(result.tx[i],function(tx) {
                        txs.push(tx);
                        if(i < result.tx.length - 1) {
                            getTx(++i);
                        } else {
                            response.data = {
                                block: result,
                                txs: txs
                            };
                            sendResponse();
                        }
                    })
                }
                getTx(0);
            } else {
                response.data = {
                    block: result,
                    txs: txs
                };
                sendResponse();
            }
        } else {
            response.err = 1;
            response.errMessage = 'no block found';
            sendResponse();
        }
    }).catch(function(err) {
        response.err = 1;
        response.errMessage = err;
        sendResponse();
    })
    function sendResponse() {
        res.send(JSON.stringify(response, null, 2));
    }
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

router.get('/getBlockDetails/:hash', (req, res) => {
    const response = helpers.getGeneralResponse();
    BlockController.getBlockByHash(req.params['hash'], function(dbBlock) {
        if(dbBlock) {
            wallet_commands.getBlock(res.locals.wallet, req.params['hash']).then(function (block) {
                block = JSON.parse(block);
                send(block.confirmations);
            }).catch(function(err) {
                // response.err = 1;
                // response.errMessage = err;
                // res.send(JSON.stringify(response, null, 2));
                send(-1);
            });
        } else {
            response.err = 1;
            response.errMessage = 'no block found';
            res.send(JSON.stringify(response, null, 2));
        }
        function send(confirmations) {
            var block = {
                hash: dbBlock.blockhash,
                confirmations: confirmations,
                height: dbBlock.blockindex,
                time: dbBlock.timestamp,
            }
            var data = {block: block, txs: txs}
            response.data = data;
            res.send(JSON.stringify(response, null, 2));
        }
    })
});

router.get('/getBlockTxs/:hash/:limit/:offset', (req, res) => {
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if(isNaN(parseInt(req.params['offset']))) {
        res.send('offset value have to be number');
        return;
    }
    const response = helpers.getGeneralResponse();
    TxController.getBlockTxs(req.params['hash'], 'blockindex', 'desc', parseInt(req.params['limit']), parseInt(req.params['offset']), function (txs) {
        var data = {txs: txs}
        response.data = data;
        res.send(JSON.stringify(response, null, 2));
    })
})

router.get('/getBlockTxsByHash/:hash', (req, res) => {
    const response = helpers.getGeneralResponse();
    BlockController.getBlockByHash(req.params['hash'], function(dbBlock) {
        if(dbBlock) {
            wallet_commands.getBlock(res.locals.wallet, req.params['hash']).then(function (block) {
                block = JSON.parse(block);
                send(block.confirmations);
            }).catch(function(err) {
                // response.err = 1;
                // response.errMessage = err;
                // res.send(JSON.stringify(response, null, 2));
                send(-1);
            });
        } else {
            response.err = 1;
            response.errMessage = 'no block found';
            res.send(JSON.stringify(response, null, 2));
        }
        function send(confirmations) {
            TxController.getAllTxWithVinVoutByHash(req.params['hash'], 'blockindex', 'desc', function (txs) {
                var block = {
                    hash: dbBlock.blockhash,
                    confirmations: confirmations,
                    height: dbBlock.blockindex,
                    time: dbBlock.timestamp,
                    tx: txs
                }
                var data = {block: block, txs: txs}
                response.data = data;
                res.send(JSON.stringify(response, null, 2));
            })
        }
    })
});

router.get('/getTxDetails/:txid', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxController.getTxBlockByTxid(req.params['txid'], function(tx) {
        if(tx) {
            TxVinVoutController.getTxBlockByTxid(req.params['txid'], function (txVinVout) {
                BlockController.getOne(txVinVout.blockindex, function (block) {
                    var results = {
                        blockhash: block.blockhash,
                        txid: txVinVout.txid,
                        height: txVinVout.blockindex,
                        vin: txVinVout.vin,
                        vout: txVinVout.vout,
                        time: txVinVout.timestamp,
                        type: txVinVout.type,
                        type_str: tx_types.toStr(txVinVout.type),
                        confirmations: -1
                    }
                    wallet_commands.getRawTransaction(res.locals.wallet, req.params['txid']).then(function (tx) {
                        tx = JSON.parse(tx);
                        results.confirmations = tx.confirmations;
                        response.data = results;
                        res.send(JSON.stringify(response, null, 2));
                    }).catch(function (err) {
                        // response.err = 1;
                        // response.errMessage = err;
                        // res.send(JSON.stringify(response, null, 2));
                        wallet_commands.getBlock(res.locals.wallet, block.blockhash).then(function (block) {
                            var b = JSON.parse(block);
                            results.confirmations = b.confirmations;
                            response.data = results;
                            res.send(JSON.stringify(response, null, 2));
                        }).catch(function (err) {
                            // response.err = 1;
                            // response.errMessage = 'no block found';
                            // res.send(JSON.stringify(response, null, 2));
                            response.data = results;
                            res.send(JSON.stringify(response, null, 2));
                        });
                    });
                });
            });
        } else {
            response.err = 1;
            response.errMessage = 'no tx found';
            res.send(JSON.stringify(response, null, 2));
        }
    });
});

router.get('/getBlockHash/:number', (req, res) => {
    if(isNaN(parseInt(req.params['number']))) {
        res.send('limit value have to be number');
        return;
    }
    const response = helpers.getGeneralResponse();
    TxController.getOne(req.params['number'],function(result) {
        if(result) {
            response.data = result;
        } else {
            response.err = 1;
            response.errMessage = 'no block found';
        }
        res.send(JSON.stringify(response, null, 2));
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
    const response = helpers.getGeneralResponse();
    MasternodeController.getAll('lastseen', 'desc', parseInt(req.params['limit']), function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no masternodes found'
        }
        res.send(JSON.stringify(response, null, 2));
        // db.disconnect();
    })
})

router.get('/getMasternodeCount', (req, res) => {
    const response = helpers.getGeneralResponse();
    MasternodeController.estimatedDocumentCount(function(count) {
        response.data = count;
        res.send(JSON.stringify(response, null, 2));
    })
});

router.get('/masternodesCollateralCount', (req, res) => {
    const response = helpers.getGeneralResponse();
    var wallet = res.locals.wallet;
    MasternodeController.getCollateralCount(settings[wallet].masternode_required, function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no masternodes found'
        }
        res.send(JSON.stringify(response, null, 2));
    })
})

router.get('/getAllPeers/:limit', (req, res) => {
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    const response = helpers.getGeneralResponse();
    PeersController.getAll('lastactivity', 'desc', parseInt(req.params['limit']), function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no peers found'
        }
        res.send(JSON.stringify(response, null, 2));
        // db.disconnect();
    })
})

router.get('/search/:hash', (req, res) => {
    var result = {
        type: '',
        result: ''
    }
    var hash = req.params['hash'].trim();
    // var hash = req.params['hash'].replace(/ /g,'');
    var hashType = '';
    if(hash.length === 64) {
        hashType = 'block_tx';
    } else if(hash.length === 34) {
        hashType = 'address';
    } else if(/^\d+$/.test(hash)) {
        hashType = 'number';
    }
    const response = helpers.getGeneralResponse();
    if(hashType === 'block_tx') {
        BlockController.getBlockByHash(hash, function (block) {
            if (block) {
                result.type = 'block';
                result.result = hash;
                sendResult()
            } else {
                TxController.getTxBlockByTxid(hash, function (tx) {
                    if (tx) {
                        result.type = 'tx';
                        result.result = hash;
                    }
                    sendResult()
                })
            }
        });
    } else if(hashType === 'number') {
        BlockController.getOne(hash, function(block) {
            if (block) {
                result.type = 'block';
                result.result = block.blockhash;
            }
            sendResult()
        });
    } else if(hashType === 'address') {
        AddressToUpdateController.getOne(hash, function (address) {
            if (address) {
                result.type = 'address';
                result.result = hash;
            }
            sendResult()
        })
    } else {
        sendResult()
    }
    function sendResult() {
        response.data = result;
        res.send(JSON.stringify(response, null, 2));
    }
});

router.get('/getAvailableMarkets', (req, res) => {
    const response = helpers.getGeneralResponse();
    MarketController.getAllJoin({},'symbol', 'desc', 0, 0, function(markets) {
        if(markets) {
            var results = [];
            for(var i in markets) {
                results.push({
                    symbol: markets[i].symbol,
                    summary: markets[i].summary,
                })
            }
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no market found';
        }
        res.send(JSON.stringify(response, null, 2));
    });
});

router.get('/getMarket/:symbol', (req, res) => {
    const response = helpers.getGeneralResponse();
    MarketController.getAllJoin({symbol: req.params['symbol']},'symbol', 'desc', 0, 0, function(markets) {
        if(markets && markets.length) {
            response.data = markets[0];
        } else {
            response.err = 1;
            response.errMessage = 'no market found';
        }
        res.send(JSON.stringify(response, null, 2));
    });
});

// router.get('/search/:hash', (req, res) => {
//     var result = {
//         type: '',
//         result: ''
//     }
//     BlockController.getOne(req.params['hash'], function(block) {
//         if (block) {
//             result.type = 'block';
//             result.result = block.blockhash;
//             sendResult()
//         } else {
//             BlockController.getBlockByHash(req.params['hash'], function (block) {
//                 if (block) {
//                     result.type = 'block';
//                     result.result = req.params['hash'];
//                     sendResult()
//                 } else {
//                     TxController.getTxBlockByTxid(req.params['hash'], function (tx) {
//                         if (tx) {
//                             result.type = 'tx';
//                             result.result = req.params['hash'];
//                             sendResult()
//                         } else {
//                             AddressToUpdateController.getOne(req.params['hash'], function (address) {
//                                 if (address) {
//                                     result.type = 'address';
//                                     result.result = req.params['hash'];
//                                 }
//                                 sendResult()
//                             })
//                         }
//                     })
//                 }
//             })
//         }
//         function sendResult() {
//             res.send(JSON.stringify(result, null, 2));
//         }
//     });
// });


router.post('/getTransactionsChart', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxByDayController.getAllForChart("d", -1, 0, function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no txs found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
});

router.post('/getMarketsSummary', (req, res) => {
    const response = helpers.getGeneralResponse();
    MarketController.getAllSummary('symbol', 'desc', 0, 0, function(markets) {
        if(markets && markets.length) {
            response.data = markets;
        } else {
            response.err = 1;
            response.errMessage = 'no market found';
        }
        res.send(JSON.stringify(response, null, 2));
    });
});

router.post('/getAllClustersWithTxsCount', (req, res) => {
    const response = helpers.getGeneralResponse();
    ClusterController.getAllClustersWithTxsCount(null, function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no clusters found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})
router.post('/getAllClustersWithAddressCount', (req, res) => {
    const response = helpers.getGeneralResponse();
    ClusterController.getAllClustersWithAddressCount(null, function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no clusters found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})
router.post('/getAllClustersWithAddressAndTxsCount', (req, res) => {
    const response = helpers.getGeneralResponse();
    if(isNaN(parseInt(req.body['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if((parseInt(req.body['limit']) > 50)) {
        res.send('max limit value is 50');
        return;
    }
    if(isNaN(parseInt(req.body['offset']))) {
        res.send('offset value have to be number');
        return;
    }
    ClusterController.getAllClustersWithAddressAndTxsCount(null, req.body['limit'], req.body['offset'], function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no clusters found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})
router.post('/getClusterDetails', (req, res) => {
    const response = helpers.getGeneralResponse();
    ClusterController.getAllClustersWithAddressAndTxsCount(req.body['clusterId'].toString(), 1, 0, function(results) {
        if(results) {
            response.data = results[0];
        } else {
            response.err = 1;
            response.errMessage = 'no cluster found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})
router.post('/getClusterAddresses', (req, res) => {
    const response = helpers.getGeneralResponse();
    if(isNaN(parseInt(req.body['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if((parseInt(req.body['limit']) > 50)) {
        res.send('max limit value is 50');
        return;
    }
    if(isNaN(parseInt(req.body['offset']))) {
        res.send('offset value have to be number');
        return;
    }
    ClusterController.getClusterAddresses(req.body['clusterId'].toString(), req.body['limit'], req.body['offset'], function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no txs found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})
router.post('/getClusterTxs', (req, res) => {
    const response = helpers.getGeneralResponse();
    if(isNaN(parseInt(req.body['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if((parseInt(req.body['limit']) > 50)) {
        res.send('max limit value is 50');
        return;
    }
    if(isNaN(parseInt(req.body['offset']))) {
        res.send('offset value have to be number');
        return;
    }
    ClusterController.getClusterTxs(req.body['clusterId'].toString(), req.body['limit'], req.body['offset'], function(results) {
        if(results) {
            response.data = results.txs;
        } else {
            response.err = 1;
            response.errMessage = 'no txs found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})
router.post('/getClusterChart', (req, res) => {
    const response = helpers.getGeneralResponse();
    ClusterTxByDayController.getAllForChart(req.body['clusterId'].toString(), "d", -1, 0, function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no cluster found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})
// router.get('/getAllClusters/:limit/:offset', (req, res) => {
//     if(isNaN(parseInt(req.params['limit']))) {
//         res.send('limit value have to be number');
//         return;
//     }
//     if((parseInt(req.params['limit']) > 50)) {
//         res.send('max limit value is 50');
//         return;
//     }
//     if(isNaN(parseInt(req.params['offset']))) {
//         res.send('offset value have to be number');
//         return;
//     }
//     // ClusterController.getAll2('addresses','desc',parseInt(req.params['limit']), parseInt(req.params['offset']),function(results) {
//     //     res.send(JSON.stringify(results, null, 2));
//     // })
//     ClusterController.getAllClusters(parseInt(req.params['limit']), parseInt(req.params['offset']),function(results) {
//         res.send(JSON.stringify(results, null, 2));
//     })
// })
// router.get('/getCluster/:clusterId/:limit/:offset', (req, res) => {
//     if(isNaN(parseInt(req.params['limit']))) {
//         res.send('limit value have to be number');
//         return;
//     }
//     if((parseInt(req.params['limit']) > 50)) {
//         res.send('max limit value is 50');
//         return;
//     }
//     if(isNaN(parseInt(req.params['offset']))) {
//         res.send('offset value have to be number');
//         return;
//     }
//     ClusterController.getClusterTxs(req.params['clusterId'].toString(), req.params['limit'], req.params['offset'], function(results) {
//         res.send(JSON.stringify(results, null, 2));
//     })
// })
// router.get('/getClusterTxCount/:clusterId', (req, res) => {
//     ClusterController.getClusterTxsCount2(req.params['clusterId'].toString(), function(count) {
//         res.send(JSON.stringify(count, null, 2));
//     })
// })
module.exports = router;

