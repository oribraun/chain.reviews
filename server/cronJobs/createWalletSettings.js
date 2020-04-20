const settings = require('./../wallets/all_settings');
const db = require('./../database/db');
const fs = require('fs-extra');

var wallet = process.argv[2];

if(!wallet) {
    console.log('please add wallet name');
    return;
}
var default_settings = {
    "coin": "",
    "cli": "path to cli",
    "daemon": "path to daemon",
    "example_txid": "txid for route examples",
    "example_hash": "hash for route examples",
    "dev_address": "address for route examples",
    "commands": {
        "startwallet": "-daemon",
        "stopwallet": "stop",
        "reindexWallet": "-daemon -txindex=1 -reindex=1",
        "rescanWallet": "-daemon -txindex=1 -rescan=1",
        "getblock": "getblock",
        "getblockhash": "getblockhash",
        "getallmasternodes": "listmasternodes",
        "getrawtransaction": "getrawtransaction",
        "getblockcount": "getblockcount",
        "getconnectioncount": "getconnectioncount",
        "getinfo": "getinfo",
        "gettxoutsetinfo": "gettxoutsetinfo",
        "getpeerinfo": "getpeerinfo",
        "getmasternodecount": "getmasternodecount",
        "getdifficulty": "getdifficulty",
        "getnetworkhashps": "getnetworkhashps",
        "getmininginfo": "getmininginfo"
    },
    "dbSettings": {
        "user": "masternodefixuser",
        "password": "b9wh42mB$jLfi(#nYVMc",
        "database": "",
        "address" : "localhost",
        "port" : 27017
    },
    "masternode_required": 0,
    "active": false
}

if(!settings[wallet]) {
    console.log(wallet)
    var current_settings = default_settings;
    current_settings.coin = wallet;
    current_settings.dbSettings.user = "masternode" + wallet + "user";
    current_settings.dbSettings.password = Array(20)
        .fill('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_-+')
        .map(function(x) { return x[Math.floor(Math.random() * x.length)] })
        .join('');
    current_settings.dbSettings.database = wallet + 'db';
    var path = __dirname + "/../wallets/" + wallet + "/settings.json";
    fs.outputFile(path , JSON.stringify(current_settings, null, 4), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
}
