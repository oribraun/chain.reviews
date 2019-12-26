const express = require('express');
var router = express.Router();
const settings = require('./../../wallets/all_settings');

const walletRoute = require('./wallet');
router.use('/wallet', walletRoute);
const db = require('./db');
const database = require('./../../database/db');
router.use('/db/:wallet',function(req, res, next){
    if(!settings[req.params['wallet']]) {
        res.send('wallet not found');
        return;
    }
    res.locals.wallet = req.params['wallet'];
    database.setCurrentConnection(req.params['wallet']);
    next();
}, db);

var string = "";
for (var wallet in settings) {
    var txid = settings[wallet].example_txid;
    var hash = settings[wallet].example_hash;
    var currentRoute;
    string += '<h1>' + wallet + '</h1>' + '<br>';
    for(var i in walletRoute.stack) {
        if(walletRoute.stack[i] && walletRoute.stack[i].route) {
            currentRoute = ('/api/wallet' + walletRoute.stack[i].route.path
                .replace(':wallet', wallet)
                .replace(':hash', hash)
                .replace(':number', 0)
                .replace(':txid', txid));
            addLinkToString(currentRoute);
        }
    }
    string += '<br>';
    string += '<h2>' + wallet + ' database</h2>' + '<br>';
    for(var i in db.stack) {
        if(db.stack[i] && db.stack[i].route) {
            currentRoute = ('/api/db/' + wallet + db.stack[i].route.path
                .replace(':hash', hash)
                .replace(':number', 0)
                .replace(':coin', wallet)
                .replace(':limit', 10)
                .replace(':txid', txid));
            addLinkToString(currentRoute);
        }
    }
}

function addLinkToString(route) {
    string += "<a href='" + route + "' target='_blank'>" + route + "</a>";
    string += '<br>';
}

router.get("/", function(req, res) {
    res.send(string);
});
module.exports = router;
