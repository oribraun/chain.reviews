const express = require('express');
var router = express.Router();
const wallet_commands = require('../../wallet_commands');

router.get('/', (req, res) => {
    res.json({item: 'wallet api'});
});

router.get('/getBlockCount/:wallet', (req, res) => {
    wallet_commands.getBlockCount(req.params['wallet']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.send(results);
    }).catch(function(err) {
        res.send(err);
    })
});

router.get('/getBlock/:wallet/:hash', (req, res) => {
    wallet_commands.getBlock(req.params['wallet'], req.params['hash']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getBlockHash/:wallet/:number', (req, res) => {
    wallet_commands.getBlockHash(req.params['wallet'], req.params['number']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/listMasternodes/:wallet', (req, res) => {
    wallet_commands.getAllMasternodes(req.params['wallet']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getMasternodeCount/:wallet', (req, res) => {
    wallet_commands.getMasternodeCount(req.params['wallet']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getRawTransaction/:wallet/:txid', (req, res) => {
    wallet_commands.getRawTransaction(req.params['wallet'], req.params['txid']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});
router.get('/getRawTransactionFull/:wallet/:txid', (req, res) => {
    wallet_commands.getRawTransactionFull(req.params['wallet'], req.params['txid']).then(function(results) {
        // console.log('masternodes', masternodes);
        res.json(results);
    }).catch(function(err) {
        res.send(err);
    })
});

module.exports = router;