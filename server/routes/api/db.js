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
var MarketController = require('./../../database/controllers/markets_controller');
var TxByDayController = require('./../../database/controllers/tx_by_day_controller');
var ClusterController = require('./../../database/controllers/cluster_controller');
var ClusterTxByDayController = require('./../../database/controllers/cluster_tx_by_day_controller');

// var wallet = process.argv[2];

router.get('/', (req, res) => {
    var string = "";
    var wallet = res.locals.wallet;
    var currentRoute;
    var symbol = settings[wallet].symbol;
    var txid = settings[wallet].example_txid;
    var hash = settings[wallet].example_hash;
    var dev_address = settings[wallet].dev_address;
    string += '<h2>' + wallet + ' api</h2>' + '<br>';
    for(var i in router.stack) {
        if(router.stack[i] && router.stack[i].route) {
            currentRoute = ('/api/db/' + wallet + router.stack[i].route.path
                .replace(':hash', hash)
                .replace(':number', 1)
                .replace(':address', dev_address)
                .replace(':coin', wallet)
                .replace(':limit', 10)
                .replace(':offset', 0)
                .replace(':symbol', symbol.toUpperCase() + '_BTC')
                .replace(':txid', txid));
            string += "<a href='" + currentRoute + "' target='_blank'>" + currentRoute + "</a>";
            string += '<br>';
        }
    }
    res.header("Content-Type",'text/html');
    res.send(string);
});
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
router.get('/getdifficulty', (req, res) => {
    var wallet = res.locals.wallet;
    StatsController.getOne(wallet, function(stats) {
        if(stats) {
            res.send(stats.difficulty);
        } else {
            res.send(' no stats found yet');
        }
    });
});
router.get('/getconnectioncount', (req, res) => {
    var wallet = res.locals.wallet;
    StatsController.getOne(wallet, function(stats) {
        if(stats) {
            res.json(stats.connections);
        } else {
            res.send(' no stats found yet');
        }
    });
});
router.get('/getblockcount', (req, res) => {
    var wallet = res.locals.wallet;
    StatsController.getOne(wallet, function(stats) {
        if(stats) {
            res.json(stats.blockcount);
        } else {
            res.send(' no stats found yet');
        }
    });
});

router.get('/getblockhash/:number', (req, res) => {
    if(isNaN(parseInt(req.params['number']))) {
        res.send('hash value have to be number');
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

router.get('/getblock/:hash', (req, res) => {
    wallet_commands.getBlock(res.locals.wallet, req.params['hash']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.send(JSON.stringify(JSON.parse(results), null, 2));
    }).catch(function(err) {
        res.send(err);
    })
})

router.get('/getrawtransaction/:txid', (req, res) => {
    // wallet_commands.getRawTransaction(res.locals.wallet, req.params['txid']).then(function(tx) {
    //     res.send(JSON.stringify(tx, null, 2));
    // });
    TxController.getTxBlockByTxid(req.params['txid'],function(tx) {
        res.send(JSON.stringify(tx, null, 2));
    })
});

router.get('/getnetworkhashps', (req, res) => {
    wallet_commands.getNetworkHashps(res.locals.wallet).then(function(tx) {
        res.send(JSON.stringify(tx, null, 2));
    });
});

router.get('/getmoneysupply', (req, res) => {
    var wallet = res.locals.wallet;
    StatsController.getOne(wallet, function(stats) {
        if(stats) {
            res.json(stats.moneysupply);
        } else {
            res.send(' no stats found yet');
        }
    });
});

router.get('/getdistribution', (req, res) => {
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
                var distribution = helpers.get_distribution({'received': received, 'balance': balance}, stats);
                res.send(JSON.stringify(distribution, null, 2));
            })
        } else {
            res.send('no stats found yet');
        }
    });
});

// router.get('/getAddress/:address', (req, res) => {
//     AddressToUpdateController.getOneJoin(req.params['address'], 100, 0, function(address) {
//         if(address) {
//             res.send(JSON.stringify(address, null, 2));
//         } else {
//             res.send('no address found');
//         }
//         // db.disconnect();
//     })
// })

router.get('/getAddress/:address', (req, res) => {
    AddressController.getAddressDetailsWithLastestTxs(req.params['address'], function(addressDetails) {
        if(addressDetails) {
            res.send(JSON.stringify(addressDetails, null, 2));
        } else {
            res.send('no address found');
        }
    });
})

router.get('/getTopAddresses', (req, res) => {
    AddressController.getRichlist('balance', 'desc', 100, function(topAddresses) {
        if(topAddresses) {
            const map = topAddresses.map((o) => {
                return {
                    address: o.a_id,
                    balance: o.balance,
                    sent: o.sent,
                    received: o.received,
                }
            })
            res.send(JSON.stringify(map, null, 2));
        } else {
            res.send('no address found');
        }
    });
})

router.get('/getstats', (req, res) => {
    var wallet = res.locals.wallet;
    var return_hash = { };
    StatsController.getOne(wallet, function(stats) {
        if(stats) {
            return_hash.version = stats.version;
            return_hash.protocol = stats.protocol;
            return_hash.walletversion = stats.walletversion;
            return_hash.total_wallets_count = stats.total_wallets_count;
            return_hash.active_wallets_count = stats.active_wallets_count;
            return_hash.money_supply = parseFloat(stats.moneysupply);
            return_hash.masternodesCount = stats.masternodesCount.total;
            // return_hash.masternodesCountByCollateral = stats.masternodesCountByCollateral;
            return_hash.block_count = stats.blockcount;
            return_hash.dev_wallet_balance = (stats.dev_wallet_balance / 100000000);
            var coinsLocked = stats.masternodesCountByCollateral * settings[wallet].masternode_required;
            var coinsLockedPercentage = coinsLocked / (stats.moneysupply/100);
            return_hash.coins_locked = coinsLockedPercentage.toFixed(2);
            return_hash[settings[wallet].coin + '_locked'] = coinsLockedPercentage.toFixed(2);
            TxVinVoutController.getLastTx(function(tx) {
                var time_from = tx.timestamp;
                BlockController.getOne(1, function(block) {
                    var time_to = block.timestamp;
                    return_hash.average_sec_per_block = (time_from - time_to) / stats.blockcount;
                    res.send(JSON.stringify(return_hash, null, 2));
                })
            })
        } else {
            res.send(' no stats found yet');
        }
    });
});

router.get('/listMasternodes', (req, res) => {
    const response = helpers.getGeneralResponse();
    MasternodeController.getAll('lastseen', 'desc', 0, function(results) {
        res.send(JSON.stringify(results, null, 2));
        // db.disconnect();
    })
})
router.get('/getUsersTxsWeeklyChart', (req, res) => {
    const response = helpers.getGeneralResponse();
    TxVinVoutController.getUsersTxsWeeklyChart(function(results) {
        res.send(JSON.stringify(results, null, 2));
        // db.disconnect();
    })
})

// router.get('/getstats', (req, res) => {
//     var wallet = res.locals.wallet;
//     var return_hash = { };
//     var promises = [];
//     var data = {};
//     promises.push(new Promise((resolve, reject) => {
//         StatsController.getOne(wallet, function(stats) {
//             console.log('stats')
//             data.stats = stats;
//             resolve();
//         })
//     }))
//     promises.push(new Promise((resolve, reject) => {
//         AddressToUpdateController.getAddressDetails(settings[wallet].dev_address, function(address) {
//             console.log('address')
//             data.address = address;
//             resolve();
//         })
//     }))
//     promises.push(new Promise((resolve, reject) => {
//         TxVinVoutController.getLastTx(function(tx) {
//             console.log('tx')
//             data.tx = tx;
//             resolve();
//         })
//     }))
//     promises.push(new Promise((resolve, reject) => {
//         BlockController.getOne(0, function(block) {
//             console.log('block')
//             data.block = block;
//             resolve();
//         })
//     }))
//     promises.push(new Promise((resolve, reject) => {
//         AddressToUpdateController.countUnique(function(total_wallets_count) {
//             console.log('total_wallets_count')
//             data.total_wallets_count = total_wallets_count;
//             resolve();
//         })
//     }))
//     promises.push(new Promise((resolve, reject) => {
//         // AddressToUpdateController.countActive(function(active_wallets_count) {
//             console.log('active_wallets_count')
//             data.active_wallets_count = 0;
//             resolve();
//         // })
//     }))
//     Promise.all(promises).then((response) => {
//         console.log('all')
//         if(data.stats) {
//             // AddressToUpdateController.countUnique(function(total_wallets_count) {
//             return_hash.total_wallets_count = data.total_wallets_count;
//             // AddressToUpdateController.countActive(function(active_wallets_count) {
//             return_hash.active_wallets_count = data.active_wallets_count;
//             return_hash.money_supply = parseFloat(data.stats.moneysupply);
//             return_hash.masternodesCount = data.stats.masternodesCount.total;
//             return_hash.block_count = data.stats.blockcount;
//             return_hash.dev_wallet_balance = (data.address.balance / 100000000);
//             var coinsLocked = data.stats.masternodesCount.total * settings[wallet].masternode_required;
//             var coinsLockedPercentage = coinsLocked / (data.stats.moneysupply/100);
//             return_hash.coins_locked = coinsLockedPercentage.toFixed(2);
//             return_hash[settings[wallet].coin + '_locked'] = coinsLockedPercentage.toFixed(2);
//             var time_from = data.tx.timestamp;
//             var tx_blockindex = data.tx.blockindex - data.stats.blockcount;
//             var time_to = data.block.timestamp;
//             return_hash.average_sec_per_block = (time_from - time_to) / data.stats.blockcount;
//             return_hash.address = data.address;
//             res.send(JSON.stringify(return_hash, null, 2));
//             // })
//             // })
//         } else {
//             res.send(' no stats found yet');
//         }
//     })
// });

// router.get('/countActive', (req, res) => {
//     AddressToUpdateController.countActive(function(active_wallets_count) {
//         res.send(JSON.stringify(active_wallets_count, null, 2));
//     })
// });

// router.get('/getAddressTxs/:address', (req, res) => {
//     AddressToUpdateController.getAddressTxsPublic(req.params['address'], 100, function(results) {
//         if(results) {
//             res.send(JSON.stringify(results, null, 2));
//         } else {
//             res.send('no address found');
//         }
//         // db.disconnect();
//     })
// })
// router.get('/getAddressTxs/:address/:limit/:offset', (req, res) => {
//     if(isNaN(parseInt(req.params['limit']))) {
//         res.send('limit value have to be number');
//         return;
//     }
//     if(isNaN(parseInt(req.params['offset']))) {
//         res.send('offset value have to be number');
//         return;
//     }
//     const response = helpers.getGeneralResponse();
//     AddressToUpdateController.getOneJoinTest(req.params['address'], req.params['limit'], req.params['offset'], function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no tx found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//         // db.disconnect();
//     })
// })

// router.get('/getAllDuplicate', (req, res) => {
//   AddressToUpdateController.getAllDuplicate(function(results) {
//       res.send(JSON.stringify(results, null, 2));
//   })
// })

// router.get('/getAvailableMarkets', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     MarketController.getAllJoin({},'symbol', 'desc', 0, 0, function(markets) {
//         if(markets) {
//             var results = [];
//             for(var i in markets) {
//                 results.push({
//                     symbol: markets[i].symbol,
//                     summary: markets[i].summary,
//                 })
//             }
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no market found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     });
// });
//
// router.get('/getMarket/:symbol', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     MarketController.getAllJoin({symbol: req.params['symbol']},'symbol', 'desc', 0, 0, function(markets) {
//         if(markets && markets.length) {
//             response.data = markets[0];
//         } else {
//             response.err = 1;
//             response.errMessage = 'no market found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     });
// });
//
// router.get('/getTransactionsChart', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     TxVinVoutController.getTransactionsChart(function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no txs found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     })
// });

// router.get('/getMarketsSummary', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     MarketController.getAllSummary('symbol', 'desc', 0, 0, function(markets) {
//         if(markets && markets.length) {
//             response.data = markets;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no market found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     });
// });

// router.get('/getMasternodesMap', function(req, res) {
//     const response = helpers.getGeneralResponse();
//     MasternodeController.getAll('lastseen', 'desc', 1, function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no masternodes found'
//         }
//         res.send(JSON.stringify(response, null, 2));
//         // db.disconnect();
//     })
//     // lib.get_listmasternodes(function(listmasternodes) {
//     //     if(listmasternodes && listmasternodes.length) {
//     //         var limit_activetime = 2500000;
//     //         var limit_percent = 0.3;
//     //         var data = [];
//     //         var mapdata = [];
//     //         data.push("1");
//     //         for(var i in listmasternodes)
//     //         {
//     //             var obj = listmasternodes[i];
//     //             var geo = geoip.lookup(obj.ipaddr.split(':')[0]);
//     //             if(geo && geo.ll && geo.ll.length > 1) {
//     //                 mapdata.push(geo.ll[0]);
//     //                 mapdata.push(geo.ll[1]);
//     //                 mapdata.push(obj.activetime >= limit_activetime ? limit_percent : (obj.activetime / limit_activetime * limit_percent).toFixed(3));
//     //             }
//     //         }
//     //         data.push(mapdata);
//     //         res.send([data]);
//     //     }
//     // })
// })

// router.get('/ext/get_masternodes_and_wallets_map', function(req, res) {
//     lib.get_listmasternodes(function(listmasternodes) {
//         if(listmasternodes && listmasternodes.length) {
//             var limit_activetime = 2500000;
//             var limit_percent = 0.3;
//             var data = [];
//             var mapdata = [];
//             data.push("1");
//             ipsModel.getAllIps(function(results){
//                 var ips = [];
//                 if(!results.err) {
//                     for (var i in results.entities) {
//                         ips.push({
//                             ipaddr: results.entities[i].ip.split(':')[0],
//                             activetime: results.entities[i].activetime || 20000
//                         }); // no activetime in mysql
//                     }
//                 }
//                 var masternodesIps = [];
//                 for(var i in listmasternodes)
//                 {
//                     var obj = listmasternodes[i];
//                     masternodesIps.push({ipaddr: obj.ipaddr.split(':')[0], activetime: obj.activetime});
//                 }
//                 console.log('mysql ips.length',ips.length);
//                 console.log('masternodesIps.length first',masternodesIps.length);
//                 var masternodesIpsMap = masternodesIps.map(function(obj) {return obj.ipaddr});
//                 console.log('masternodesIpsMap.length first',masternodesIpsMap.length);
//                 for(var i in ips) {
//                     if(masternodesIpsMap.indexOf(ips[i].ipaddr) === -1) {
//                         masternodesIps.push(ips[i]);
//                     }
//                 }
//                 console.log('masternodesIps.length concat',masternodesIps.length);
//                 for(var i in masternodesIps)
//                 {
//                     var obj = masternodesIps[i];
//                     var geo = geoip.lookup(obj.ipaddr);
//                     if(geo && geo.ll && geo.ll.length > 1) {
//                         mapdata.push(geo.ll[0]);
//                         mapdata.push(geo.ll[1]);
//                         mapdata.push(obj.activetime >= limit_activetime ? limit_percent : (obj.activetime / limit_activetime * limit_percent).toFixed(3));
//                     }
//                 }
//                 data.push(mapdata);
//                 res.send([data]);
//             });
//         }
//     })
// })
// router.get('/ext/get_wallets_map', function(req, res) {
//     lib.get_listmasternodes(function(listmasternodes) {
//         if(listmasternodes && listmasternodes.length) {
//             var limit_activetime = 2500000;
//             var limit_percent = 0.3;
//             var data = [];
//             var mapdata = [];
//             data.push("1");
//             ipsModel.getAllIps(function(results){
//                 var ips = [];
//                 if(!results.err) {
//                     for (var i in results.entities) {
//                         ips.push({
//                             ipaddr: results.entities[i].ip.split(':')[0],
//                             activetime: results.entities[i].activetime || 20000
//                         }); // no activetime in mysql
//                     }
//                 }
//                 for(var i in ips)
//                 {
//                     var obj = ips[i];
//                     var geo = geoip.lookup(obj.ipaddr);
//                     if(geo && geo.ll && geo.ll.length > 1) {
//                         mapdata.push(geo.ll[0]);
//                         mapdata.push(geo.ll[1]);
//                         mapdata.push(obj.activetime >= limit_activetime ? limit_percent : (obj.activetime / limit_activetime * limit_percent).toFixed(3));
//                     }
//                 }
//                 data.push(mapdata);
//                 res.send([data]);
//             });
//         }
//     })
// })

// router.get('/getAddressTxChart/:address', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     AddressToUpdateController.getAddressTxChart(req.params['address'], '', function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no address found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     });
// });
// router.get('/getAddressByTotalTest/:limit/:offset', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     AddressToUpdateController.getByTotalTest(req.params['limit'], req.params['offset'], function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no address found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     });
// });
// router.get('/getAllClustersCount', (req, res) => {
//     ClusterController.estimatedDocumentCount(function(count) {
//         res.send(JSON.stringify(count, null, 2));
//     })
// })
// router.get('/getAllClusters', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     ClusterController.getAllClustersWithAddressCount(null, function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no clusters found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     })
// })
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
// router.get('/getClusterDetails/:clusterId', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     ClusterController.getAllClustersWithAddressCount(req.params['clusterId'].toString(), function(results) {
//         if(results) {
//             response.data = results[0];
//         } else {
//             response.err = 1;
//             response.errMessage = 'no cluster found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     })
// })
// router.get('/getClusterTxs/:clusterId/:limit/:offset', (req, res) => {
//     const response = helpers.getGeneralResponse();
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
//         if(results) {
//             response.data = results.txs;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no txs found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     })
// })
// router.get('/getClusterTxCount/:clusterId', (req, res) => {
//     ClusterController.getClusterTxsCount2(req.params['clusterId'].toString(), function(count) {
//         res.send(JSON.stringify(count, null, 2));
//     })
// })
//
// router.get('/getUsersTxsCount', (req, res) => {
//     TxVinVoutController.getUsersTxsCount(function(count) {
//         res.send(JSON.stringify(count, null, 2));
//     })
// })
//
// router.get('/getUsersTxsCount24Hours', (req, res) => {
//     TxVinVoutController.getUsersTxsCount24Hours(function(count) {
//         res.send(JSON.stringify(count, null, 2));
//     })
// })

// router.get('/getAllClustersWithTxsCount', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     ClusterController.getAllClustersWithTxsCount(null, function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no clusters found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     })
// })
// router.get('/getAllClustersWithAddressCount', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     ClusterController.getAllClustersWithAddressCount(null, function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no clusters found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     })
// })
// router.get('/getAllBlocks/:limit/:offset', (req, res) => {
//     if(isNaN(parseInt(req.params['limit']))) {
//         res.send('limit value have to be number');
//         return;
//     }
//     if(isNaN(parseInt(req.params['offset']))) {
//         res.send('offset value have to be number');
//         return;
//     }
//     const response = helpers.getGeneralResponse();
//     BlockController.getAll4({blockindex: true},'blockindex', 'desc', parseInt(req.params['limit']), parseInt(req.params['offset']), function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no tx found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     })
// });
router.get('/getAllClustersWithAddressAndTxsCount/:limit/:offset', (req, res) => {
    const response = helpers.getGeneralResponse();
    if(isNaN(parseInt(req.params['limit']))) {
        res.send('limit value have to be number');
        return;
    }
    if((parseInt(req.params['limit']) > 50)) {
        res.send('max limit value is 50');
        return;
    }
    if(isNaN(parseInt(req.params['offset']))) {
        res.send('offset value have to be number');
        return;
    }
    ClusterController.getAllClustersWithAddressAndTxsCount(null, req.params['limit'], req.params['offset'], function(results) {
        if(results) {
            response.data = results;
        } else {
            response.err = 1;
            response.errMessage = 'no clusters found';
        }
        res.send(JSON.stringify(response, null, 2));
    })
})
// router.get('/getClusterChart/:clusterId', (req, res) => {
//     const response = helpers.getGeneralResponse();
//     ClusterTxByDayController.getAllForChart(req.params['clusterId'].toString(), "d", -1, 0, function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no cluster found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     })
// })
// router.get('/getClusterAddresses/:clusterId/:limit/:offset', (req, res) => {
//     const response = helpers.getGeneralResponse();
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
//     ClusterController.getClusterAddresses(req.params['clusterId'].toString(), req.params['limit'], req.params['offset'], function(results) {
//         if(results) {
//             response.data = results;
//         } else {
//             response.err = 1;
//             response.errMessage = 'no txs found';
//         }
//         res.send(JSON.stringify(response, null, 2));
//     })
// })

router.get('/getAddressByTx/:tx', (req, res) => {
    var where = {};
    where.txid = req.params['tx'];
    var fields = {_id:0, address: 1, type: 1};
    var results = [];
    AddressToUpdateController.getAll2(where, fields, "", "", 0, 0, function(addresses) {
        if(addresses && addresses.length) {
            function findAddressCluster(i) {
                results[i] = {};
                results[i].address = addresses[i].address;
                results[i].type = addresses[i].type;
                ClusterController.getClusterByAddress(addresses[i].address, function(clusters){
                    results[i].clusters = [];
                    if(clusters) {
                        results[i].clusters = clusters;
                    }
                    i++
                    if(i < addresses.length) {
                        findAddressCluster(i);
                    } else {
                        results[0].test = 'asdfasdf'
                        console.log('results', results)
                        res.send(JSON.stringify(results, null, 2));
                    }
                })
            }
            findAddressCluster(0);
        } else {
            res.send('no address found');
        }
    });
})

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
    TxVinVoutController.getBlockTxs(req.params['hash'], 'blockindex', 'desc', parseInt(req.params['limit']), parseInt(req.params['offset']), function (txs) {
        var data = {txs: txs}
        response.data = data;
        res.send(JSON.stringify(response, null, 2));
    })
})
module.exports = router;

