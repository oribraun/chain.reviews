const express = require('express');
var router = express.Router();
const settings = require('./../../wallets/all_settings');
const db = require('./../../database/db');

const explorerRoute = require('./route');
router.use('/:wallet',function(req, res, next){
    if(!settings[req.params['wallet']]) {
        res.send('wallet not found');
        return;
    }
    // res.header("Content-Type",'application/json');
    // res.set('Content-Type', 'text/html');
    res.locals.wallet = req.params['wallet'];
    db.setCurrentConnection(req.params['wallet']);
    next();
}, explorerRoute);

router.get('/', (req, res) => {
    res.send('explorer route');
});
module.exports = router;
