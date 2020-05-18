const express = require('express');
var router = express.Router();
const settings = require('./../../wallets/all_settings');
const db = require('./../../database/db');

const walletRoute = require('./wallet');
router.use('/wallet/:wallet',function(req, res, next){
    if(!settings[req.params['wallet']] || !settings[req.params['wallet']].active) {
        res.send('wallet not found');
        return;
    }
    res.header("Content-Type",'application/json');
    res.locals.wallet = req.params['wallet'];
    db.setCurrentConnection(req.params['wallet']);
    next();
}, walletRoute);

const dbRoute = require('./db');
router.use('/db/:wallet',function(req, res, next){
    if(!settings[req.params['wallet']] || !settings[req.params['wallet']].active) {
        res.send('wallet not found');
        return;
    }
    res.header("Content-Type",'application/json');
    res.locals.wallet = req.params['wallet'];
    db.setCurrentConnection(req.params['wallet']);
    next();
}, dbRoute);

var string = "";
for (var wallet in settings) {
    if(settings[wallet].active) {
        var symbol = settings[wallet].symbol;
        var txid = settings[wallet].example_txid;
        var hash = settings[wallet].example_hash;
        var dev_address = settings[wallet].dev_address;
        var currentRoute;
        string += '<h1>' + wallet + '</h1>' + '<br>';
        for (var i in walletRoute.stack) {
            if (walletRoute.stack[i] && walletRoute.stack[i].route) {
                currentRoute = ('/api/wallet/' + wallet + walletRoute.stack[i].route.path
                    .replace(':hash', hash)
                    .replace(':number', 1)
                    .replace(':txid', txid));
                addLinkToString(currentRoute);
            }
        }
        string += '<br>';
        string += '<h2>' + wallet + ' database</h2>' + '<br>';
        for (var i in dbRoute.stack) {
            if (dbRoute.stack[i] && dbRoute.stack[i].route) {
                currentRoute = ('/api/db/' + wallet + dbRoute.stack[i].route.path
                    .replace(':hash', hash)
                    .replace(':number', 1)
                    .replace(':address', dev_address)
                    .replace(':coin', wallet)
                    .replace(':limit', 10)
                    .replace(':symbol', symbol.toUpperCase() + '_' + 'BTC')
                    .replace(':offset', 0)
                    .replace(':txid', txid));
                addLinkToString(currentRoute);
            }
        }
    }
}

// string = "";
// for (var wallet in settings) {
//     var currentRoute;
//     string += '<h1>' + wallet + '</h1>' + '<br>';
//     currentRoute = ('/explorer/' + wallet);
//     addLinkToString(currentRoute);
//     currentRoute = ('/explorer/' + wallet + '#/richlist');
//     addLinkToString(currentRoute);
// }
function addLinkToString(route) {
    string += "<a href='" + route + "' target='_blank'>" + route + "</a>";
    string += '<br>';
}

router.get("/", function(req, res) {
    res.send(string);
});
module.exports = router;
