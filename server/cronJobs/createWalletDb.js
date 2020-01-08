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
        "startwallet": "",
        "stopwallet": "",
        "getblock": "",
        "getblockhash": "",
        "getallmasternodes": "",
        "getrawtransaction": "",
        "getblockcount": "",
        "getconnectioncount": "",
        "getinfo": "",
        "getpeerinfo": "",
        "getmasternodecount": "",
        "getdifficulty": "",
        "getnetworkhashps": "",
        "getmininginfo": ""
    },
    "dbSettings": {
        "user": "masternodefixuser",
        "password": "b9wh42mB$jLfi(#nYVMc",
        "database": "",
        "address" : "localhost",
        "port" : 27017
    }
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



const spawn = require('child_process').spawn;
const pipe = spawn('mongo');
pipe.stdout.on('data', function (data) {
    console.log((data.toString('utf8')));
});

pipe.stderr.on('data', (data) => {
    console.log(data.toString('utf8'));
    const pipe2 = spawn('use fixdb');
    pipe2.stdout.on('data', function (data) {
        console.log((data.toString('utf8')));
    });

    pipe2.stderr.on('data', (data) => {
        console.log(data.toString('utf8'));
        const pipe2 = spawn('use fixdb');
    });

    pipe2.on('close', (code) => {
        console.log('Process exited with code: '+ code);
    });
});

pipe.on('close', (code) => {
    console.log('Process exited with code: '+ code);
});

