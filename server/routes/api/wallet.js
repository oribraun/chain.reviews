const express = require('express');
var router = express.Router();
const wallet_commands = require('../../wallet_commands');

// router.get('/', (req, res) => {
//     res.locals.wallet
//     res.json({item: 'wallet api'});
// });

router.get('/getBlockCount', (req, res) => {
    wallet_commands.getBlockCount(res.locals.wallet).then(function(results) {
        // console.log('masternodes', masternodes);
        res.send(JSON.stringify(JSON.parse(results), null, 2));
    }).catch(function(err) {
        res.send(err);
    })
});

router.get('/getBlock/:hash', (req, res) => {
    wallet_commands.getBlock(res.locals.wallet, req.params['hash']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.send(JSON.stringify(JSON.parse(results), null, 2));
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getBlockHash/:number', (req, res) => {
    wallet_commands.getBlockHash(res.locals.wallet, req.params['number']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/listMasternodes', (req, res) => {
    wallet_commands.getAllMasternodes(res.locals.wallet).then(function(results) {
        // console.log('masternodes', masternodes);
        res.send(JSON.stringify(JSON.parse(results), null, 2));
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getMasternodeCount', (req, res) => {
    wallet_commands.getMasternodeCount(res.locals.wallet).then(function(results) {
        // console.log('masternodes', masternodes);
        res.send(JSON.stringify(JSON.parse(results), null, 2));
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getRawTransaction/:txid', (req, res) => {
    wallet_commands.getRawTransaction(res.locals.wallet, req.params['txid']).then(function(results) {
        // console.log('masternodes', masternodes);
        // res.send(results);
        results = JSON.parse(results);
        res.send(JSON.stringify(results, null, 2));
        // res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getRawTransactionFull/:txid', (req, res) => {
    wallet_commands.getRawTransactionFull(res.locals.wallet, req.params['txid']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.send(JSON.stringify(results, null, 2));
        // res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
//
// router.get('/getMaxMoney', (req, res) => {
//     wallet_commands.getMaxMoney(res.locals.wallet).then(function(results) {
//         // console.log('masternodes', masternodes);
//         res.json(results);
//     }).catch(function(err) {
//         res.send(err);
//     })
// });
// router.get('/getMaxVote', (req, res) => {
//     wallet_commands.getMaxVote(res.locals.wallet).then(function(results) {
//         // console.log('masternodes', masternodes);
//         res.json(results);
//     }).catch(function(err) {
//         res.send(err);
//     })
// });
// router.get('/getVote', (req, res) => {
//     wallet_commands.getVote(res.locals.wallet).then(function(results) {
//         // console.log('masternodes', masternodes);
//         res.json(results);
//     }).catch(function(err) {
//         res.send(err);
//     })
// });
// router.get('/getPhase', (req, res) => {
//     wallet_commands.getPhase(res.locals.wallet).then(function(results) {
//         // console.log('masternodes', masternodes);
//         res.json(results);
//     }).catch(function(err) {
//         res.send(err);
//     })
// });
// router.get('/getReward', (req, res) => {
//     wallet_commands.getReward(res.locals.wallet).then(function(results) {
//         // console.log('masternodes', masternodes);
//         res.json(results);
//     }).catch(function(err) {
//         res.send(err);
//     })
// });
// router.get('/getNextRewardEstimate', (req, res) => {
//     wallet_commands.getNextRewardEstimate(res.locals.wallet).then(function(results) {
//         // console.log('masternodes', masternodes);
//         res.json(results);
//     }).catch(function(err) {
//         res.send(err);
//     })
// });
// router.get('/getNextRewardWhenstr', (req, res) => {
//     wallet_commands.getNextRewardWhenstr(res.locals.wallet).then(function(results) {
//         // console.log('masternodes', masternodes);
//         res.json(results);
//     }).catch(function(err) {
//         res.send(err);
//     })
// });
router.get('/getConnectionCount', (req, res) => {
    wallet_commands.getConnectionCount(res.locals.wallet).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getPeerInfo', (req, res) => {
    wallet_commands.getPeerInfo(res.locals.wallet).then(function(results) {
        // console.log('masternodes', masternodes);
        res.send(JSON.stringify(JSON.parse(results), null, 2));
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getDifficulty', (req, res) => {
    wallet_commands.getDifficulty(res.locals.wallet).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getNetworkHashps', (req, res) => {
    wallet_commands.getNetworkHashps(res.locals.wallet).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getMiningInfo', (req, res) => {
    wallet_commands.getMiningInfo(res.locals.wallet).then(function(results) {
        // console.log('masternodes', masternodes);
        res.send(JSON.stringify(JSON.parse(results), null, 2));
    }).catch(function(err) {
        res.send(err);
    })
});

module.exports = router;
