const express = require('express');
var router = express.Router();

const db = require('./../../database/db');
const settings = require('./../../wallets/all_settings');
const wallet_commands = require('../../wallet_commands');
const helpers = require('../../helpers');

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
    const response = helpers.getGeneralResponse();
    BlockController.getAll2({}, {blockindex: true, blockhash: true, timestamp: true},'blockindex', 'desc', parseInt(req.params['limit']), parseInt(req.params['offset']), function(results) {
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
router.get('/getAllTxVinVout/:limit/:offset', (req, res) => {
    // if(!db.isConnected()) {
    //     res.send('no database connected');
    //     return;
    // }
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    const response = helpers.getGeneralResponse();
    TxVinVoutController.getAll2({total: {$gt: 0}}, {timestamp: true, txid: true, total: true, blockindex: true},'blockindex', 'desc', parseInt(req.params['limit']), parseInt(req.params['offset']), function(results) {
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
router.get('/getAddressTxs/:address/:limit/:offset', (req, res) => {
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if(isNaN(parseInt(req.params['offset']))) {
        res.send('offset value have to be number');
        return;
    }
    const response = helpers.getGeneralResponse();
    AddressToUpdateController.getOneJoin(req.params['address'], req.params['limit'], req.params['offset'], function(results) {
        if(results) {
            response.data = results.txs;
        } else {
            response.err = 1;
            response.errMessage = 'no tx found';
        }
        res.send(JSON.stringify(response, null, 2));
        // db.disconnect();
    })
})

router.get('/getAddressDetails/:address', (req, res) => {
    const response = helpers.getGeneralResponse();
    AddressToUpdateController.getAddressDetails(req.params['address'], function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no address found';
        }
        res.send(JSON.stringify(response, null, 2));
    });
})

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

router.get('/getBlockTxsByHash/:hash', (req, res) => {
    const response = helpers.getGeneralResponse();
    BlockController.getBlockByHash(req.params['hash'], function(block) {
        if(block) {
            wallet_commands.getBlock(res.locals.wallet, req.params['hash']).then(function (block) {
                TxController.getAllTxWithVinVoutByHash(req.params['hash'], 'blockindex', 'desc', function (txs) {
                    var data = {block: JSON.parse(block), txs: txs}
                    response.data = data;
                    res.send(JSON.stringify(response, null, 2));
                })
            }).catch(function(err) {
                response.err = 1;
                response.errMessage = err;
                res.send(JSON.stringify(response, null, 2));
            });
        } else {
            response.err = 1;
            response.errMessage = 'no block found';
            res.send(JSON.stringify(response, null, 2));
        }
    })
});

router.get('/getTxDetails/:txid', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxController.getTxBlockByTxid(req.params['txid'], function(tx) {
        if(tx) {
            wallet_commands.getRawTransaction(res.locals.wallet, req.params['txid']).then(function (tx) {
                TxVinVoutController.getTxBlockByTxid(req.params['txid'], function (txVinVout) {
                    tx.height = txVinVout.blockindex;
                    tx.vin = txVinVout.vin;
                    tx.vout = txVinVout.vout;
                    response.data = tx;
                    res.send(JSON.stringify(response, null, 2));
                })
            }).catch(function(err) {
                response.err = 1;
                response.errMessage = err;
                res.send(JSON.stringify(response, null, 2));
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

module.exports = router;

