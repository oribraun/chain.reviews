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
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});

router.get('/getBlock/:hash', (req, res) => {
    wallet_commands.getBlock(res.locals.wallet, req.params['hash']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
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
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getMasternodeCount', (req, res) => {
    wallet_commands.getMasternodeCount(res.locals.wallet).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getRawTransaction/:txid', (req, res) => {
    wallet_commands.getRawTransaction(res.locals.wallet, req.params['txid']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getRawTransactionFull/:txid', (req, res) => {
    wallet_commands.getRawTransactionFull(res.locals.wallet, req.params['txid']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});

module.exports = router;
