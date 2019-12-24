const express = require('express');
var router = express.Router();
const settings = require('./../../wallets/all_settings');

const walletRoute = require('./wallet');
router.use('/wallet', walletRoute);
const db = require('./db');
router.use('/db', db);

var wallet_routes = [];
var db_routes = [];
var routes = {};
for (var wallet in settings) {
    var txid = settings[wallet].example_txid;
    var hash = settings[wallet].example_hash;
    routes[wallet] = [];
    for(var i in walletRoute.stack) {
        if(walletRoute.stack[i] && walletRoute.stack[i].route) {
            routes[wallet].push('/api/wallet' + walletRoute.stack[i].route.path
                .replace(':wallet', wallet)
                .replace(':hash', hash)
                .replace(':number', 0)
                .replace(':txid', txid));
        }
    }
}
var string = "";

var wallet = process.argv[2];

string += '<h1>' + 'connected to ' + wallet + ' database' + '</h1>';
for(var i in db.stack) {
    if(db.stack[i] && db.stack[i].route) {
        db_routes.push('/api/db' + db.stack[i].route.path
            .replace(':wallet', wallet)
            .replace(':hash', hash)
            .replace(':number', 0)
            .replace(':coin', wallet)
            .replace(':txid', txid));
        string += "<a href='" + db_routes[i] + "' target='_blank'>" + db_routes[i] + "</a>";
        string += '<br>';
    }
}

string += '<h1>' + 'available wallets' + '</h1>';
for(var w in routes) {
    string += '<h2>' + w + '</h2>' + '<br>';
    for(var i in routes[w]) {
        string += "<a href='" + routes[w][i] + "' target='_blank'>" + routes[w][i] + "</a>";
        string += '<br>';
    }
    string += '<br>';
}
// console.log(string)
router.get("/", function(req, res) {
    res.send(string);
});
module.exports = router;