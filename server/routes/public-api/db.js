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

router.get('/', (req, res) => {
    var string = "";
    var wallet = res.locals.wallet;
    var currentRoute;
    var txid = settings[wallet].example_txid;
    var hash = settings[wallet].example_hash;
    var dev_address = settings[wallet].dev_address;
    string += '<h2>' + wallet + ' api</h2>' + '<br>';
    for(var i in router.stack) {
        if(router.stack[i] && router.stack[i].route) {
            currentRoute = ('/public-api/db/' + wallet + router.stack[i].route.path
                .replace(':hash', hash)
                .replace(':number', 1)
                .replace(':address', dev_address)
                .replace(':coin', wallet)
                .replace(':limit', 10)
                .replace(':offset', 0)
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

router.get('/getAddress/:address', (req, res) => {
    AddressToUpdateController.getOneJoin(req.params['address'], 100, 0, function(address) {
        if(address) {
            res.send(JSON.stringify(address, null, 2));
        } else {
            res.send('no address found');
        }
        // db.disconnect();
    })
})

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

module.exports = router;

