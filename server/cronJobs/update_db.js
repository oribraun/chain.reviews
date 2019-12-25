var CronJob = require('cron').CronJob;
var fs = require('fs-extra');
const wallet_commands = require('./../wallet_commands');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const db = require('./../database/db');
const settings = require('./../wallets/all_settings');

var Tx = require('./../database/models/tx');
var TxController = require('./../database/controllers/tx_controller');
var Stats = require('./../database/models/stats');
var StatsController = require('./../database/controllers/stats_controller');
var Richlist = require('./../database/models/richlist');
var RichlistController = require('./../database/controllers/richlist_controller');
var Address = require('./../database/models/address');
var AddressController = require('./../database/controllers/address_controller');

var wallet = process.argv[2];

var timeUnits = [
    'second',
    'minute',
    'hour',
    'dayOfMonth',
    'month',
    'dayOfWeek'
];

var cron;
// TODO create macanizem for update db only one process

if(settings[wallet]) {
    cron = new CronJob('* * * * * *', function() {
        if(fileExist()) {
            return;
        }
        console.log('updating cron');
        createFile();
        // db.connect(settings[wallet].dbSettings);

        function startUpdate() {
            TxController.getAll('blockindex', 'desc', 1, function (latestTx) {
                wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                    var allBlocksCount = blockCount;
                    var start = 0;
                    if (latestTx.length) {
                        start = latestTx[0].blockindex + 1;
                    }
                    var from = start;
                    var to = allBlocksCount;
                    var txInsertCount = 0;
                    var updateInProgress = false;
                    var addresses = [];
                    var countAddressUpdate = 0;

                    console.log('updating - ' + (to - from) + ' new tx');

                    function startUpdatingAddresses(addresses1) {
                        if (!updateInProgress) {
                            addresses = addresses.concat(addresses1);
                            updateInProgress = true;
                            updateAddresses()
                        } else {
                            addresses = addresses.concat(addresses1);
                        }

                    }

                    function updateAddresses() {
                        AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                            if (err) {
                                console.log('address err', err)
                            } else {
                                countAddressUpdate++;
                                addresses.shift();
                            }
                            if (addresses.length) {
                                updateAddresses()
                            } else {
                                updateInProgress = false;
                                console.log('countAddressUpdate', countAddressUpdate);
                                if (txInsertCount === to - from + 1 && !addresses.length) {
                                    endUpdate();
                                }
                            }
                        })
                    }

                    wallet_commands.getAllBlocksCluster(wallet, from, to, function (index, hash) {
                        wallet_commands.getBlock(wallet, hash).then(function (block) {
                            var current_block = JSON.parse(block);
                            wallet_commands.getRawTransactionFull(wallet, current_block.tx[0]).then(function (obj) {
                                var newTx = new Tx({
                                    txid: obj.tx.txid,
                                    vin: obj.nvin,
                                    vout: obj.vout,
                                    total: obj.total.toFixed(8),
                                    timestamp: obj.tx.time,
                                    blockhash: obj.tx.blockhash,
                                    blockindex: current_block.height,
                                });
                                TxController.updateOne(newTx, function (err) {
                                    txInsertCount++;
                                    if (err) {
                                        console.log('err', err);
                                    }
                                    if (txInsertCount === to - from + 1 && !addresses.length) {
                                        endUpdate();
                                    }
                                    // console.log('created')
                                });
                                console.log(newTx.blockindex, obj.tx.txid);
                                var addreses_to_update = obj.addreses_to_update;
                                // console.log('addreses_to_update.length', addreses_to_update.length)
                                // addr_count += addreses_to_update.length;
                                if (addreses_to_update.length) {
                                    startUpdatingAddresses(addreses_to_update);
                                }

                            }).catch(function (err) {
                                var newTx = new Tx({
                                    txid: current_block.tx[0],
                                    vin: [],
                                    vout: [],
                                    total: (0).toFixed(8),
                                    timestamp: current_block.time,
                                    blockhash: current_block.hash,
                                    blockindex: current_block.height,
                                });
                                // console.log('error getting rawtransaction - ' + current_block.tx[0], err);
                                console.log(current_block.height, current_block.tx[0]);
                                // console.log('newTx', newTx)
                                TxController.updateOne(newTx, function (err) {
                                    txInsertCount++;
                                    if (err) {
                                        console.log('err', err);
                                    }
                                    if (txInsertCount === to - from + 1 && !addresses.length) {
                                        endUpdate();
                                    }
                                    // console.log('created')
                                });
                            });
                        }).catch(function (err) {
                            txInsertCount++;
                            console.log('error getting block', err);
                            if (txInsertCount === to - from + 1) {
                                endUpdate();
                            }
                        });
                    }).then(function (time) {
                        console.log('finish getting blocks', time);
                    }).catch(function (err) {
                        console.log('error getting blocks', err);
                        db.disconnect();
                        process.exit();
                    })
                }).catch(function (err) {
                    console.log('error getting blockCount', err);
                })
            })
        }

        function endUpdate() {
            RichlistController.getOne(settings[wallet].coin, function (richlist) {
                AddressController.getRichlist('received', 'desc', 100, function (received) {
                    AddressController.getRichlist('balance', 'desc', 100, function (balance) {
                        richlist.received = received;
                        richlist.balance = balance;
                        RichlistController.updateOne(richlist, function (err) {
                            TxController.getAll('blockindex', 'desc', 1, function (latestTx) {
                                // console.log('latestTx', latestTx);
                                StatsController.update(settings[wallet].coin, {last: latestTx.blockindex}, function (err) {
                                    if (err) {
                                        console.log(err)
                                    }
                                    db.disconnect();
                                    deleteFile();
                                });

                            })
                        })
                    })
                })
            })
        }

        // startUpdate();
    }, null, true, 'America/Los_Angeles');
} else {
    console.log('no wallet found')
}

function stopCron() {
    if(fileExist()) {
        deleteFile();
        wallet_commands.setForceStop(true);
    }
    cron.stop();
}

function startCron() {
    cron.start();
}

var path = __dirname + './../InProgress.pid';
function fileExist() {
    return fs.existsSync(path);
}
function createFile() {
    fs.writeFile(path, {flag: 'wx'}, function (err, data) {})
}
function deleteFile() {
    fs.unlinkSync(path);
}
//
// setTimeout(function(){
//     stopCron();
// }, 1000);
//
// setTimeout(function(){
//     startCron();
// }, 3000);