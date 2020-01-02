const wallet_commands = require('./wallet_commands');
const helpers = require('./helpers');
const request = require('request');
const cluster = require('cluster');
const fs = require('fs-extra');
const exec = require('child_process').exec;
const numCPUs = require('os').cpus().length;

const db = require('./database/db');
const settings = require('./wallets/all_settings');

var wallet = process.argv[2];
var type = process.argv[3];
var hash_number = process.argv[4];

var commands_require_db = [
    'reindex',
    'update',
    'reindexcluster',
    'reindexclusterlinear',
    'calcvinvoutclusterlinear',
    'reindexAddressesclusterlinear',
    'reindexclusterlineartest',
    'calcvinvoutclusterlineartest',
    'reindexAddressesclusterlineartest',

    'reindexclusterlinearchunks',
    'calcvinvoutclusterlinearchunks',
    'reindexaddressesclusterlinearchunks',
    'updatecluster',
    'updateclusterlinear',
    'updatemasternodes',
    'count',
    'deletevinvout',
    'updatepeers',
]
if(settings[wallet]) {
    if(commands_require_db.indexOf(type) > -1) {
        db.connect2(wallet, settings[wallet].dbSettings);
        db.setCurrentConnection(wallet);
    }
} else {
    console.log('no wallet found');
    process.exit();
}

var Tx = require('./database/models/tx')[db.getCurrentConnection()];
var TxController = require('./database/controllers/tx_controller');
var Stats = require('./database/models/stats')[db.getCurrentConnection()];
var StatsController = require('./database/controllers/stats_controller');
var Richlist = require('./database/models/richlist')[db.getCurrentConnection()];
var RichlistController = require('./database/controllers/richlist_controller');
var Address = require('./database/models/address')[db.getCurrentConnection()];
var AddressController = require('./database/controllers/address_controller');
var Masternode = require('./database/models/masternode')[db.getCurrentConnection()];
var MasternodeController = require('./database/controllers/masternode_controller');
var AddressToUpdateController = require('./database/controllers/address_to_update_controller');
var TxVinVoutController = require('./database/controllers/tx_vin_vout_controller');
var PeerController = require('./database/controllers/peers_controller');

// console.log('wallet', wallet)
// console.log('type', type)
// console.log('hash_number', hash_number)

var path = __dirname + '/../' + wallet + 'InProgress.pid';
function fileExist() {
    // console.log(path)
    return fs.existsSync(path);
}
function createFile(pid) {
    fs.writeFileSync(path, process.pid);
}
function readFile() {
    return fs.readFileSync(path);
}
function killPidFromFile() {
    var pid = readFile();
    try {
        process.kill(pid);
    } catch(e) {
        console.log('no pid process found')
    }
}
function deleteFile() {
    console.log('trying to delete - ', path)
    if(fileExist(path)) {
        try {
            fs.unlinkSync(path);
            console.log('file deleted');
        } catch (err) {
            console.log('err deleting file', err);
        }
    }
}

process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    // if(!cluster.worker) {
    //     deleteFile(); // TODO you canot delete file when other process already running
    // }
    db.multipleDisconnect();
    process.exit();
});

process.on('SIGTERM', function () {
    console.log('*** GOT SIGTERM ***');
    // process.exit(0);
});

if (wallet) {
    switch(type)
    {
        case 'startwallet':
            wallet_commands.startWallet(wallet).then(function(results){
                console.log('results', results);
            }).catch(function(err) {
                console.log('error starting wallet', err);
            });
            break;
        case 'stopwallet':
            wallet_commands.stopWallet(wallet).then(function(results){
                console.log('results', results);
            }).catch(function(err) {
                console.log('error stopping wallet', err);
            });
            break;
        case 'getblockcount':
            wallet_commands.getBlockCount(wallet).then(function(blockCount){
                console.log('blockCount', blockCount);
            }).catch(function(err) {
                console.log('error getting blockCount', err);
            });
            break;
        case 'getblock':
            if(hash_number != undefined && hash_number) {
                wallet_commands.getBlock(wallet, hash_number).then(function (block) {
                    console.log('block', JSON.parse(block));
                }).catch(function (err) {
                    console.log('error getting block', err);
                });
            } else {
                console.log('hash must be number')
            }
            break;
        case 'getblockhash':
            if(hash_number != undefined && !isNaN(hash_number)) {
                wallet_commands.getBlockHash(wallet, hash_number).then(function (blockHash) {
                    console.log('blockHash', blockHash);
                }).catch(function (err) {
                    console.log('error getting blockHash', err);
                });
            } else {
                console.log('hash must be number')
            }
            break;
        case 'getallblockscluster': // 0:6:47.276 done
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                for (let i = 0; i < numCPUs; i++) {
                    cluster.fork();
                }

                // db.connect(settings[wallet].dbSettings);
                var exit_count = 0;
                cluster.on('exit', (worker, code, signal) => {
                    exit_count++;
                    // if(exit_count === numCPUs) {
                    //     db.multipleDisconnect();
                    // }
                    console.log(`worker ${worker.process.pid} died`);
                });
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server

                wallet_commands.getBlockCount(wallet).then(function(blockCount) {
                    var current_cluster_id = cluster.worker.id;
                    var allBlocksCount = blockCount;
                    var offset = Math.ceil(allBlocksCount / numCPUs);
                    var from = (cluster.worker.id - 1) * offset;
                    var to = cluster.worker.id * offset - 1;
                    if(cluster.worker.id === numCPUs) {
                        to = allBlocksCount;
                    }
                    wallet_commands.getAllBlocksCluster(wallet, from, to,function(index, hash){
                        console.log('hash-' + index, hash);
                    }).then(function(time){
                        console.log('finish getting blocks', time);
                        process.exit();
                    }).catch(function(err) {
                        console.log('error getting blocks', err);
                    })
                }).catch(function(err) {
                    console.log('error getting blockCount', err);
                })

            }
            break;
        case 'getallblocksdetailscluster': // 0:13:8.168 done
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                for (let i = 0; i < numCPUs; i++) {
                    cluster.fork();
                }

                // db.connect(settings[wallet].dbSettings);
                var exit_count = 0;
                cluster.on('exit', (worker, code, signal) => {
                    exit_count++;
                    // if(exit_count === numCPUs) {
                    //     db.multipleDisconnect();
                    // }
                    console.log(`worker ${worker.process.pid} died`);
                });
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server

                wallet_commands.getBlockCount(wallet).then(function(blockCount) {
                    var current_cluster_id = cluster.worker.id;
                    var allBlocksCount = blockCount;
                    var offset = Math.ceil(allBlocksCount / numCPUs);
                    var from = (cluster.worker.id - 1) * offset;
                    var to = cluster.worker.id * offset - 1;
                    if(cluster.worker.id === numCPUs) {
                        to = allBlocksCount;
                    }
                    var count = 0;
                    wallet_commands.getAllBlocksCluster(wallet, from, to,function(index, hash){
                        wallet_commands.getBlock(wallet, hash).then(function (block) {
                            count++;
                            console.log('block', JSON.parse(block));
                            if(count === to - from + 1) {
                                process.exit();
                            }
                        }).catch(function (err) {
                            count++;
                            console.log('error getting block', err);
                            if(count === to - from + 1) {
                                process.exit();
                            }

                        });
                    }).then(function(time){
                        console.log('finish getting blocks', time);
                    }).catch(function(err) {
                        console.log('error getting blocks', err);
                    })
                }).catch(function(err) {
                    console.log('error getting blockCount', err);
                })

            }
            break;
        case 'getalltxblockscluster': // 0:19:59.304
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                for (let i = 0; i < numCPUs; i++) {
                    cluster.fork();
                }

                var exit_count = 0;
                cluster.on('exit', (worker, code, signal) => {
                    exit_count++;
                    // if(exit_count === numCPUs) {
                    //     db.multipleDisconnect();
                    // }
                    console.log(`worker ${worker.process.pid} died`);
                });
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server

                wallet_commands.getBlockCount(wallet).then(function(blockCount) {
                    var current_cluster_id = cluster.worker.id;
                    var allBlocksCount = blockCount;
                    var offset = Math.ceil(allBlocksCount / numCPUs);
                    var from = (cluster.worker.id - 1) * offset;
                    var to = cluster.worker.id * offset - 1;
                    if(cluster.worker.id === numCPUs) {
                        to = allBlocksCount;
                    }
                    var count = 0;
                    wallet_commands.getAllBlocksCluster(wallet, from, to,function(index, hash){
                        wallet_commands.getBlock(wallet, hash).then(function (block) {
                            var current_block = JSON.parse(block);
                            wallet_commands.getRawTransaction(wallet, current_block.tx[0]).then(function (rawtransaction) {
                                count++;
                                console.log('rawtransaction', JSON.parse(rawtransaction));
                                if(count === to - from + 1) {
                                    process.exit();
                                }
                            }).catch(function (err) {
                                count++;
                                console.log('error getting rawtransaction - ' + current_block.tx[0] , err);
                                if(count === to - from + 1) {
                                    process.exit();
                                }
                            });
                        }).catch(function (err) {
                            console.log('error getting block', err);
                        });
                    }).then(function(time){
                        console.log('finish getting blocks', time);
                    }).catch(function(err) {
                        console.log('error getting blocks', err);
                    })
                }).catch(function(err) {
                    console.log('error getting blockCount', err);
                })

            }
            break;
        case 'getalltxblocksfull': // 0:36:30.708 done
            wallet_commands.getAllBlocks(wallet,function(index, hash){
                wallet_commands.getBlock(wallet, hash).then(function (block) {
                    var current_block = JSON.parse(block);
                    wallet_commands.getRawTransactionFull(wallet, current_block.tx[0]).then(function (obj) {
                        console.log(obj.tx.txid)
                        // var newTx = new Tx({
                        //     txid: tx.txid,
                        //     vin: nvin,
                        //     vout: vout,
                        //     total: total.toFixed(8),
                        //     timestamp: tx.time,
                        //     blockhash: tx.blockhash,
                        //     blockindex: block.height,
                        // });
                        // console.log('nvin', nvin)
                        // newTx.save(function(err) {
                        //     if (err) {
                        //         return cb(err);
                        //     } else {
                        //         //console.log('txid: ');
                        //         return cb();
                        //     }
                        // });
                        // console.log('tx', tx);
                    }).catch(function (err) {
                        console.log('error getting rawtransaction - ' + current_block.tx[0] , err);
                    });
                }).catch(function (err) {
                    console.log('error getting block', err);
                });
            }).then(function(time){
                console.log('finish getting blocks', time);
                process.exit();
            }).catch(function(err) {
                console.log('error getting blocks', err);
            })
            break;
        case 'getalltxblocksfullcluster': // 0:21:14.731
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                for (let i = 0; i < numCPUs; i++) {
                    cluster.fork();
                }

                // db.connect(settings[wallet].dbSettings);
                var exit_count = 0;
                cluster.on('exit', (worker, code, signal) => {
                    exit_count++;
                    // if(exit_count === numCPUs) {
                    //     db.multipleDisconnect();
                    // }
                    console.log(`worker ${worker.process.pid} died`);
                });
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server

                wallet_commands.getBlockCount(wallet).then(function(blockCount) {
                    var current_cluster_id = cluster.worker.id;
                    var allBlocksCount = blockCount;
                    var offset = Math.ceil(allBlocksCount / numCPUs);
                    var from = (cluster.worker.id - 1) * offset;
                    var to = cluster.worker.id * offset - 1;
                    if(cluster.worker.id === numCPUs) {
                        to = allBlocksCount;
                    }
                    var count = 0;
                    wallet_commands.getAllBlocksCluster(wallet, from, to,function(index, hash){
                        wallet_commands.getBlock(wallet, hash).then(function (block) {
                            var current_block = JSON.parse(block);
                            wallet_commands.getRawTransactionFull(wallet, current_block.tx[0]).then(function (obj) {
                                count++;
                                var newTx = new Tx({
                                    txid: obj.tx.txid,
                                    vin: obj.nvin,
                                    vout: obj.vout,
                                    total: obj.total.toFixed(8),
                                    timestamp: obj.tx.time,
                                    blockhash: obj.tx.blockhash,
                                    blockindex: block.height,
                                });
                                var addreses_to_update = obj.addreses_to_update;
                                console.log(obj.tx.txid)
                                // console.log('nvin', nvin)
                                // newTx.save(function(err) {
                                //     if (err) {
                                //         return cb(err);
                                //     } else {
                                //         //console.log('txid: ');
                                //         return cb();
                                //     }
                                // });
                                // console.log('tx', tx);
                                if(count === to - from + 1) {
                                    process.exit();
                                }
                            }).catch(function (err) {
                                count++;
                                console.log('error getting rawtransaction - ' + current_block.tx[0] , err);
                                if(count === to - from + 1) {
                                    process.exit();
                                }
                            });
                        }).catch(function (err) {
                            count++;
                            console.log('error getting block', err);
                            if(count === to - from + 1) {
                                process.exit();
                            }
                        });
                    }).then(function(time){
                        console.log('finish getting blocks', time);
                    }).catch(function(err) {
                        console.log('error getting blocks', err);
                    })
                }).catch(function(err) {
                    console.log('error getting blockCount', err);
                })
            }
            break;
        case 'getrawtransaction':
            if(hash_number != undefined && hash_number) {
                wallet_commands.getRawTransaction(wallet, hash_number).then(function (rawtransaction) {
                    console.log('rawtransaction', JSON.parse(rawtransaction));
                }).catch(function (err) {
                    console.log('error getting rawtransaction', err);
                });
            } else {
                console.log('hash must be number')
            }
            break;
        case 'getrawtransactionfull':
            if(hash_number != undefined && hash_number) {
                wallet_commands.getRawTransactionFull(wallet, hash_number).then(function (obj) {
                    console.log('obj', obj);
                }).catch(function (err) {
                    console.log('error getting rawtransaction', err);
                });
            } else {
                console.log('hash must be number')
            }
            break;
        case 'listmasternodes':
            wallet_commands.getAllMasternodes(wallet).then(function(masternodes) {
                console.log('masternodes', JSON.parse(masternodes));
            }).catch(function(err) {
                console.log('error getting masternodes', err);
            })
            break;
        case 'getmasternodecount':
            wallet_commands.getMasternodeCount(wallet).then(function(masternodecount) {
                console.log('masternode count', JSON.parse(masternodecount));
            }).catch(function(err) {
                console.log('error getting masternode count', err);
            })
            break;
        case 'reindex': // 0:27:35.915
            var startTime = new Date();
            startReindex(function(){
                deleteDb(function(){
                    wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                        var allBlocksCount = blockCount;
                        var start = 0;
                        var from = start;
                        var to = allBlocksCount;
                        var txInsertCount = 0;
                        var blockTxLength = 0;
                        var updateInProgress = false;
                        var addresses = [];
                        var local_addreses_before_save = [];
                        var startUpdatingAddresses = function(addresses1) {
                            if(!updateInProgress) {
                                addresses = addresses.concat(addresses1);
                                updateInProgress = true;
                                sumAddresses()
                            } else {
                                addresses = addresses.concat(addresses1);
                            }

                        }

                        var sumAddresses = function() {
                            if (addresses.length) {
                                var hashMap = local_addreses_before_save.map(function (o) {return o.a_id});
                                // console.log('hashMap', hashMap)
                                var i = hashMap.indexOf(addresses[0].address);
                                if (i > -1) {
                                    var address = local_addreses_before_save[i];
                                    if (addresses[0].address === 'coinbase') {
                                        address.sent = address.sent + addresses[0].amount;
                                        address.balance = 0;
                                        local_addreses_before_save[i] = address;
                                        addresses.shift();
                                        sumAddresses();
                                    } else {
                                        helpers.is_unique(address.txs, addresses[0].txid).then(function (obj) {
                                            var tx_array = address.txs;
                                            var received = address.received;
                                            var sent = address.sent;
                                            if (type == 'vin') {
                                                sent = sent + addresses[0].amount;
                                            } else {
                                                received = received + addresses[0].amount;
                                            }
                                            if (obj.unique == true) {
                                                tx_array.push({addresses: addresses[0].txid, type: addresses[0].type});
                                                address.txs = tx_array
                                                address.received = received;
                                                address.sent = sent;
                                                address.balance = received - sent;
                                                local_addreses_before_save[i] = address;
                                                addresses.shift();
                                                sumAddresses();

                                            } else {
                                                if (addresses[0].type !== tx_array[obj.index].type) {
                                                    address.txs = tx_array
                                                    address.received = received;
                                                    address.sent = sent;
                                                    address.balance = received - sent;
                                                    local_addreses_before_save[i] = address;
                                                }
                                                addresses.shift();
                                                sumAddresses();
                                            }
                                        })
                                    }
                                } else {
                                    var newAddress = {
                                        a_id: addresses[0].address,
                                        txs: [{addresses: addresses[0].txid, type: addresses[0].type}],
                                        balance: addresses[0].amount,
                                        sent:  0,
                                        received:  0,
                                    };
                                    if (addresses[0].type === 'vin') {
                                        newAddress.sent =  addresses[0].amount;
                                    } else {
                                        newAddress.received =  addresses[0].amount;
                                    }
                                    local_addreses_before_save.push(newAddress);
                                    addresses.shift();
                                    sumAddresses();
                                }
                            } else {
                                updateInProgress = false;
                                if (exit_count === numCPUs) {
                                    console.log('local_addreses_before_save', local_addreses_before_save.length);
                                    updateDbAddreess(local_addreses_before_save, function() {
                                        endReindex();
                                    });
                                }
                            }
                            // addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type
                            // AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                            //     if (err) {
                            //         console.log('address err', err)
                            //     } else {
                            //         countAddressUpdate++;
                            //         addresses.shift();
                            //     }
                            //     if (addresses.length) {
                            //         updateAddresses()
                            //     } else {
                            //         updateInProgress = false;
                            //         if (exit_count === numCPUs) {
                            //             endReIndexClusterLinerAll();
                            //         }
                            //         console.log('countAddressUpdate', countAddressUpdate);
                            //     }
                            // })
                        }

                        wallet_commands.getAllBlocksCluster(wallet, from, to, function (index, hash) {
                            wallet_commands.getBlock(wallet, hash).then(function (block) {
                                var current_block = JSON.parse(block);
                                var updateBlockTx = function(i, current_block) {
                                    blockTxLength++;
                                    wallet_commands.getRawTransactionFull(wallet, current_block.tx[i]).then(function (obj) {

                                        var newTx = new Tx({
                                            txid: obj.tx.txid,
                                            vin: obj.nvin,
                                            vout: obj.vout,
                                            total: obj.total.toFixed(8),
                                            timestamp: obj.tx.time,
                                            blockhash: obj.tx.blockhash,
                                            blockindex: current_block.height,
                                        });
                                        // var addreses_to_update = obj.addreses_to_update;
                                        console.log(current_block.height, obj.tx.txid);
                                        var addreses_to_update = obj.addreses_to_update;
                                        // addr_count += addreses_to_update.length;
                                        // if(addreses_to_update.length) {
                                        //     startUpdatingAddresses(addreses_to_update);
                                        // }
                                        if (addreses_to_update.length) {
                                            startUpdatingAddresses(addreses_to_update);
                                        }
                                        // addr_count += addreses_to_update.length;
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            // console.log('txInsertCount', txInsertCount)
                                            // console.log('blockTxLength', blockTxLength)
                                            if (txInsertCount >= blockTxLength && txInsertCount >= to - from + 1 && !addresses.length) {
                                                updateDbAddreess(local_addreses_before_save, function() {
                                                    endReindex();
                                                });
                                            }
                                            // console.log('created')
                                        });
                                        if(i < current_block.tx.length - 1) {
                                            updateBlockTx(++i, current_block);
                                        }
                                    }).catch(function (err) {
                                        var newTx = new Tx({
                                            txid: current_block.tx[i],
                                            vin: [],
                                            vout: [],
                                            total: (0).toFixed(8),
                                            timestamp: current_block.time,
                                            blockhash: current_block.hash,
                                            blockindex: current_block.height,
                                        });
                                        // console.log('error getting rawtransaction - ' + current_block.tx[0], err);
                                        console.log(current_block.height, current_block.tx[i]);
                                        // console.log('newTx', newTx)
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            if (txInsertCount >= blockTxLength && txInsertCount >= to - from + 1 && !addresses.length) {
                                                updateDbAddreess(local_addreses_before_save, function() {
                                                    endReindex();
                                                });
                                            }
                                        });
                                        if(i < current_block.tx.length - 1) {
                                            updateBlockTx(++i, current_block);
                                        }
                                    });
                                }
                                updateBlockTx(0, current_block);
                            }).catch(function (err) {
                                console.log('error getting block', err);
                                if (txInsertCount >= blockTxLength && txInsertCount >= to - from + 1) {
                                    updateDbAddreess(local_addreses_before_save, function() {
                                        endReindex();
                                    });
                                }
                                txInsertCount++;
                            });
                        }).then(function (time) {
                            console.log('finish getting blocks', time);
                        }).catch(function (err) {
                            console.log('error getting blocks', err);
                            db.multipleDisconnect();
                            process.exit();
                        })
                    }).catch(function (err) {
                        console.log('error getting blockCount', err);
                    })
                })
            })
            break;
        case 'update': // 0:27:35.915 // TODO need to finish update
            if(fileExist()) {
                console.log('reindex is in progress');
                db.multipleDisconnect();
                process.exit()
                return;
            }
            createFile();
            // db.connect(settings[wallet].dbSettings);
            var startTime = new Date();
            var startUpdate = function() {
                TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                    wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                        var allBlocksCount = blockCount;
                        var start = 0;
                        if(latestTx.length) {
                            start = latestTx[0].blockindex + 1;
                        }
                        var from = start;
                        var to = allBlocksCount;
                        var txInsertCount = 0;
                        var txVinVoutInsertCount = 0;
                        var blockTxLength = 0;
                        var updateInProgress = false;
                        var addresses = [];

                        var startUpdatingAddresses = function(addresses1) {
                            if (!updateInProgress) {
                                addresses = addresses.concat(addresses1);
                                updateInProgress = true;
                                updateAddresses()
                            } else {
                                addresses = addresses.concat(addresses1);
                            }

                        }

                        var updateAddresses = function() {
                            AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                                console.log('address updated - ', addresses[0].address);
                                if (err) {
                                    console.log('address err', err)
                                } else {
                                    addresses.shift();
                                }
                                if (addresses.length) {
                                    updateAddresses()
                                } else {
                                    updateInProgress = false;
                                    if (exit_count === numCPUs) {
                                        endReindex();
                                    }
                                }
                            })
                        }

                        wallet_commands.getAllBlocksCluster(wallet, from, to, function (index, hash) {
                            wallet_commands.getBlock(wallet, hash).then(function (block) {
                                var current_block = JSON.parse(block);
                                var updateBlockTx = function(i, current_block) {
                                    blockTxLength++;
                                    wallet_commands.getRawTransaction(wallet, current_block.tx[i]).then(function (obj) {

                                        var tx = new Tx({
                                            txid: obj.txid,
                                            vin: obj.vin,
                                            vout: obj.vout,
                                            timestamp: obj.time,
                                            blockhash: obj.blockhash,
                                            blockindex: current_block.height,
                                        });
                                        helpers.prepare_vin_db(wallet, tx).then(function (vin) {
                                            helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
                                                helpers.calculate_total(obj.vout).then(function (total) {
                                                    // console.log('results.length', results.length);
                                                    // return;
                                                    // console.log(tx, nvin, vout, total, addreses_to_update)
                                                    var vinvout = {txid: tx.txid, vin: obj.nvin, vout: obj.vout, total: total, blockindex: tx.blockindex};
                                                    TxVinVoutController.updateOne(vinvout, function(err) {
                                                        txVinVoutInsertCount++
                                                        if(err) {
                                                            console.log('err', err);
                                                        }
                                                        console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                                                        if (txInsertCount >= blockTxLength && txVinVoutInsertCount >= blockTxLength && txInsertCount >= to - from + 1 && !addresses.length) {
                                                            endReindex();
                                                        }
                                                    })
                                                    TxController.updateOne(tx, function (err) {
                                                        txInsertCount++;
                                                        if (err) {
                                                            console.log('err', err);
                                                        }
                                                        // console.log('txInsertCount', txInsertCount)
                                                        // console.log('blockTxLength', blockTxLength)
                                                        if (txInsertCount >= blockTxLength && txVinVoutInsertCount >= blockTxLength && txInsertCount >= to - from + 1 && !addresses.length) {
                                                            endReindex();
                                                        }
                                                        // console.log('created')
                                                    });
                                                    if(i < current_block.tx.length - 1) {
                                                        updateBlockTx(++i, current_block);
                                                    }
                                                    // resolve({tx: tx, nvin: obj.nvin, vout: obj.vout, total: total, addreses_to_update: addreses_to_update});
                                                })
                                            }).catch(function(err) {
                                                console.log('error getting prepare_vout', err)
                                            })
                                        })
                                        // var addreses_to_update = obj.addreses_to_update;
                                        console.log(current_block.height, obj.tx.txid);
                                        var addreses_to_update = obj.addreses_to_update;
                                        // addr_count += addreses_to_update.length;
                                        // if(addreses_to_update.length) {
                                        //     startUpdatingAddresses(addreses_to_update);
                                        // }
                                        if (addreses_to_update.length) {
                                            startUpdatingAddresses(addreses_to_update);
                                        }
                                        // addr_count += addreses_to_update.length;
                                    }).catch(function (err) {
                                        var tx = new Tx({
                                            txid: current_block.tx[i],
                                            vin: [],
                                            vout: [],
                                            timestamp: current_block.time,
                                            blockhash: current_block.hash,
                                            blockindex: current_block.height,
                                        });
                                        // console.log('error getting rawtransaction - ' + current_block.tx[0], err);
                                        helpers.prepare_vin_db(wallet, tx).then(function (vin) {
                                            helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
                                                helpers.calculate_total(obj.vout).then(function (total) {
                                                    // console.log('results.length', results.length);
                                                    // return;
                                                    // console.log(tx, nvin, vout, total, addreses_to_update)
                                                    var vinvout = {txid: tx.txid, vin: obj.nvin, vout: obj.vout, total: total, blockindex: tx.blockindex};
                                                    TxVinVoutController.updateOne(vinvout, function(err) {
                                                        txVinVoutInsertCount++
                                                        if(err) {
                                                            console.log('err', err);
                                                        }
                                                        console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                                                        if (txInsertCount >= blockTxLength && txVinVoutInsertCount >= blockTxLength && txInsertCount >= to - from + 1 && !addresses.length) {
                                                            endReindex();
                                                        }
                                                    })
                                                    TxController.updateOne(tx, function (err) {
                                                        txInsertCount++;
                                                        if (err) {
                                                            console.log('err', err);
                                                        }
                                                        // console.log('txInsertCount', txInsertCount)
                                                        // console.log('blockTxLength', blockTxLength)
                                                        if (txInsertCount >= blockTxLength && txVinVoutInsertCount >= blockTxLength && txInsertCount >= to - from + 1 && !addresses.length) {
                                                            endReindex();
                                                        }
                                                        // console.log('created')
                                                    });
                                                    if(i < current_block.tx.length - 1) {
                                                        updateBlockTx(++i, current_block);
                                                    }
                                                    // resolve({tx: tx, nvin: obj.nvin, vout: obj.vout, total: total, addreses_to_update: addreses_to_update});
                                                })
                                            }).catch(function(err) {
                                                console.log('error getting prepare_vout', err)
                                            })
                                        })
                                    });
                                }
                                updateBlockTx(0, current_block);
                            }).catch(function (err) {
                                console.log('error getting block', err);
                                if (txInsertCount >= blockTxLength && txInsertCount >= to - from + 1) {
                                    endReindex();
                                }
                                txInsertCount++;
                            });
                        }).then(function (time) {
                            console.log('finish getting blocks', time);
                        }).catch(function (err) {
                            console.log('error getting blocks', err);
                            deleteFile();
                            db.multipleDisconnect();
                            process.exit();
                        })
                    }).catch(function (err) {
                        console.log('error getting blockCount', err);
                    })
                })
            }
            startUpdate();
            break;

        case 'reindexclusterlinear': // 0:52:3.69 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                var addreses_to_update = [];
                startReindex(function(){
                    deleteDb(function(){
                        startReIndexClusterLinerAll()
                    })
                })

                var startReIndexClusterLinerAll = function() {
                    for (let i = 0; i < numCPUs; i++) {
                        var worker = cluster.fork();
                        worker.on('message', function (msg) {
                            if (msg.addreses_to_update) {
                                startUpdatingAddresses(msg.addreses_to_update)
                            }
                        })
                    }

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            if (!updateInProgress) {
                                console.log('local_addreses_before_save', local_addreses_before_save.length);
                                updateDbAddreess(local_addreses_before_save, function(){
                                    endReindex();
                                });
                            }
                            console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });

                    var updateInProgress = false;
                    var countAddressUpdate = 0;
                    var addresses = [];
                    var local_addreses_before_save = [];

                    var startUpdatingAddresses = function(addresses1) {
                        if (!updateInProgress) {
                            addresses = addresses.concat(addresses1);
                            updateInProgress = true;
                            startUpdatingAddresses()
                        } else {
                            addresses = addresses.concat(addresses1);
                        }

                    }

                    var startUpdatingAddresses = function(addresses1) {
                        if (!updateInProgress) {
                            addresses = addresses.concat(addresses1);
                            updateInProgress = true;
                            updateAddresses()
                        } else {
                            addresses = addresses.concat(addresses1);
                        }

                    }

                    var updateAddresses = function() {
                        AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                            console.log('address updated - ', addresses[0].address);
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
                                if (exit_count === numCPUs) {
                                    endReindex();
                                }
                                console.log('countAddressUpdate', countAddressUpdate);
                            }
                        })
                    }
                }
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                var startReIndexClusterLiner = function() {
                    // db.connect(settings[wallet].dbSettings);
                    wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                        var current_cluster_id = cluster.worker.id;
                        var allBlocksCount = blockCount;
                        var from = cluster.worker.id - 1;
                        var to = allBlocksCount;
                        var txInsertCount = 0;
                        var blockTxLength = 0;
                        // console.log('from', from);
                        // console.log('to', to);
                        // console.log('expectedSteps', expectedSteps);
                        // return;
                        wallet_commands.getAllBlocksClusterLiner(wallet, from, to, numCPUs, function (index, hash) {
                            wallet_commands.getBlock(wallet, hash).then(function (block) {
                                var current_block = JSON.parse(block);
                                var updateBlockTx = function(i, current_block) {
                                    blockTxLength++;
                                    wallet_commands.getRawTransaction(wallet, current_block.tx[i]).then(function (obj) {

                                        var newTx = new Tx({
                                            txid: obj.txid,
                                            vin: obj.vin,
                                            vout: obj.vout,
                                            timestamp: obj.time,
                                            blockhash: obj.blockhash,
                                            blockindex: current_block.height,
                                        });
                                        // var addreses_to_update = obj.addreses_to_update;
                                        console.log(current_block.height, obj.txid);
                                        // var addreses_to_update = obj.addreses_to_update;
                                        // addr_count += addreses_to_update.length;
                                        // if(addreses_to_update.length) {
                                        //     startUpdatingAddresses(addreses_to_update);
                                        // }
                                        // cluster.worker.send({addreses_to_update: addreses_to_update});
                                        // addr_count += addreses_to_update.length;
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            // console.log('txInsertCount', txInsertCount)
                                            // console.log('blockTxLength', blockTxLength)
                                            if (txInsertCount >= Math.floor((to - from)/numCPUs + 1) && txInsertCount >= blockTxLength) {
                                                endReIndexClusterLiner();
                                            }
                                            // console.log('created')
                                        });
                                        if(i < current_block.tx.length - 1) {
                                            updateBlockTx(++i, current_block);
                                        }
                                    }).catch(function (err) {
                                        var newTx = new Tx({
                                            txid: current_block.tx[i],
                                            vin: [],
                                            vout: [],
                                            timestamp: current_block.time,
                                            blockhash: current_block.hash,
                                            blockindex: current_block.height,
                                        });
                                        // console.log('error getting rawtransaction - ' + current_block.tx[0], err);
                                        console.log(current_block.height, current_block.tx[i]);
                                        // console.log('newTx', newTx)
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            if (txInsertCount >= Math.floor((to - from)/numCPUs + 1) && txInsertCount >= blockTxLength) {
                                                endReIndexClusterLiner();
                                            }
                                        });
                                        if(i < current_block.tx.length - 1) {
                                            updateBlockTx(++i, current_block);
                                        }
                                    });
                                }
                                updateBlockTx(0, current_block);
                            }).catch(function (err) {
                                console.log('error getting block', err);
                                if (txInsertCount >= Math.floor((to - from)/numCPUs + 1) && txInsertCount >= blockTxLength) {
                                    endReIndexClusterLiner();
                                }
                                txInsertCount++;
                            });
                        }).then(function (time) {
                            console.log('finish getting blocks', time);
                        }).catch(function (err) {
                            console.log('error getting blocks', err);
                            endReIndexClusterLiner();
                        })
                    }).catch(function (err) {
                        console.log('error getting blockCount', err);
                    })
                }
                var endReIndexClusterLiner = function() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startReIndexClusterLiner();
            }
            break;
        case 'calcvinvoutclusterlinear':  // 0:52:3.69 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit()
                    return;
                }
                createFile();

                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.deleteAll(function(err) {
                        for (let i = 0; i < numCPUs; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {
                                if (msg.addreses_to_update) {
                                    startUpdatingAddresses(msg.addreses_to_update)
                                }
                            })
                            // if(latestTx.length) {
                            //     worker.send({blockindex: latestTx[0].blockindex});
                            // }
                        }
                    });

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            // deleteFile();
                            console.log('took - ', helpers.getFinishTime(startTime));
                            db.multipleDisconnect();
                            process.exit();
                            // console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });
                }

                var addresses = [];
                var local_addreses_before_save = [];
                var updateInProgress = false;
                var startUpdatingAddresses = function(addresses1) {
                    if(!updateInProgress) {
                        addresses = addresses.concat(addresses1);
                        updateInProgress = true;
                        sumAddresses()
                    } else {
                        addresses = addresses.concat(addresses1);
                    }

                }

                var sumAddresses = function() {
                    if (addresses.length) {
                        var hashMap = local_addreses_before_save.map(function (o) {return o.a_id});
                        // console.log('hashMap', hashMap)
                        var i = hashMap.indexOf(addresses[0].address);
                        if (i > -1) {
                            var address = local_addreses_before_save[i];
                            if (addresses[0].address === 'coinbase') {
                                address.sent = address.sent + addresses[0].amount;
                                address.balance = 0;
                                local_addreses_before_save[i] = address;
                                addresses.shift();
                                sumAddresses();
                            } else {
                                helpers.is_unique(address.txs, addresses[0].txid).then(function (obj) {
                                    var tx_array = address.txs;
                                    var received = address.received;
                                    var sent = address.sent;
                                    if (addresses[0].type == 'vin') {
                                        sent = sent + addresses[0].amount;
                                    } else {
                                        received = received + addresses[0].amount;
                                    }
                                    if (obj.unique == true) {
                                        tx_array.push({addresses: addresses[0].txid, type: addresses[0].type});
                                        address.txs = tx_array
                                        address.received = received;
                                        address.sent = sent;
                                        address.balance = received - sent;
                                        local_addreses_before_save[i] = address;
                                        addresses.shift();
                                        sumAddresses();

                                    } else {
                                        if (addresses[0].type !== tx_array[obj.index].type) {
                                            address.txs = tx_array
                                            address.received = received;
                                            address.sent = sent;
                                            address.balance = received - sent;
                                            local_addreses_before_save[i] = address;
                                        }
                                        addresses.shift();
                                        sumAddresses();
                                    }
                                })
                            }
                        } else {
                            var newAddress = {
                                a_id: addresses[0].address,
                                txs: [{addresses: addresses[0].txid, type: addresses[0].type}],
                                balance: addresses[0].amount,
                                sent:  0,
                                received:  0,
                            };
                            if (addresses[0].type === 'vin') {
                                newAddress.sent =  addresses[0].amount;
                            } else {
                                newAddress.received =  addresses[0].amount;
                            }
                            local_addreses_before_save.push(newAddress);
                            addresses.shift();
                            sumAddresses();
                        }
                    } else {
                        updateInProgress = false;
                        if (exit_count === numCPUs) {
                            console.log('local_addreses_before_save', local_addreses_before_save.length);
                            updateDbAddreess(local_addreses_before_save, function() {
                                endReindex();
                            });
                        }
                    }
                    // addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type
                    // AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                    //     if (err) {
                    //         console.log('address err', err)
                    //     } else {
                    //         countAddressUpdate++;
                    //         addresses.shift();
                    //     }
                    //     if (addresses.length) {
                    //         updateAddresses()
                    //     } else {
                    //         updateInProgress = false;
                    //         if (exit_count === numCPUs) {
                    //             endReIndexClusterLinerAll();
                    //         }
                    //         console.log('countAddressUpdate', countAddressUpdate);
                    //     }
                    // })
                }
                startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                var blockindex;
                process.on('message', function(msg) {
                    blockindex = msg.blockindex;
                });
                var startVinVoutClusterLiner = function() {
                    // db.connect(settings[wallet].dbSettings);
                    TxController.count(function(allBlocksCount) {
                        var start = 0;
                        var offset = Math.ceil(allBlocksCount / numCPUs);
                        var from = start + ((cluster.worker.id - 1) * offset);
                        var to = start + (cluster.worker.id * offset - 1);
                        if (cluster.worker.id === numCPUs || to > allBlocksCount) {
                            to = allBlocksCount;
                        }
                        var limit = offset;
                        var offset = from;
                        if(offset + limit > allBlocksCount) {
                            limit = allBlocksCount - offset + 1;
                        }
                        // console.log('from', from);
                        // console.log('to', to);
                        // console.log('limit', limit);

                        // var allBlocksCount = allTxs.length;
                        // var from = cluster.worker.id - 1;
                        // var to = allBlocksCount;
                        // console.log('from', from);
                        // console.log('to', to);

                        TxController.getAll1('blockindex', 'asc', limit, offset, function(results) {
                            // console.log('results.length', results.length);
                            var checkVinVout = function(index) {
                                var tx = results[index];
                                helpers.prepare_vin(wallet, tx).then(function (vin) {
                                    helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
                                        helpers.calculate_total(obj.vout).then(function (total) {
                                            // console.log('results.length', results.length);
                                            // return;
                                            // console.log(tx, nvin, vout, total, addreses_to_update)
                                            var addreses_to_update = [];
                                            for (var i = 0; i < obj.nvin.length; i++) {
                                                // TODO update mongodb adress sceme
                                                addreses_to_update.push({address: obj.nvin[i].addresses, txid: tx.txid, amount: obj.nvin[i].amount, type: 'vin'})
                                                // addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                                                // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                                            }
                                            for (var i = 0; i < obj.vout.length; i++) {
                                                // TODO update mongodb adress sceme
                                                addreses_to_update.push({address: obj.vout[i].addresses, txid: tx.txid, amount: obj.vout[i].amount, type: 'vout'})
                                                // addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                                                // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                                            }
                                            if(addreses_to_update.length) {
                                                cluster.worker.send({addreses_to_update: addreses_to_update});
                                            }
                                            var vinvout = {txid: tx.txid, vin: obj.nvin, vout: obj.vout, total: total, blockindex: tx.blockindex};
                                            TxVinVoutController.updateOne(vinvout, function(err) {
                                                if(err) {
                                                    console.log('err', err);
                                                }
                                                console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                                                if(index >= results.length) {
                                                    // console.log('index', index);
                                                    endVinVoutClusterLiner();
                                                }
                                            })
                                            index += 1;
                                            if(index < results.length) {
                                                checkVinVout(index);
                                            }
                                            // resolve({tx: tx, nvin: obj.nvin, vout: obj.vout, total: total, addreses_to_update: addreses_to_update});
                                        })
                                    }).catch(function(err) {
                                        console.log('error getting prepare_vout', err)
                                    })
                                })
                            }
                            if(results.length) {
                                checkVinVout(0);
                            } else {
                                endVinVoutClusterLiner();
                            }
                        });
                    })
                }
                var endVinVoutClusterLiner = function() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startVinVoutClusterLiner();
            }
            break;
        case 'reindexAddressesclusterlinear': // 0:33:23.548
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit()
                    return;
                }
                createFile();
                var updateInProgress = false;
                var addresses = [];
                var startUpdateAddressesClusterLinerAll = function() {
                    AddressController.deleteAll(function(err) {
                        for (let i = 0; i < numCPUs; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {
                                if (msg.addreses_to_update) {
                                    // startUpdatingAddresses(msg.addreses_to_update)
                                }
                            })
                        }
                    })

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            if (!updateInProgress) {
                                endReindex();
                            }
                            // console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });

                    // var startUpdatingAddresses = function(addresses1) {
                    //     if (!updateInProgress) {
                    //         addresses = addresses.concat(addresses1);
                    //         updateInProgress = true;
                    //         updateAddresses()
                    //     } else {
                    //         addresses = addresses.concat(addresses1);
                    //     }
                    //
                    // }
                    //
                    // var updateAddresses = function() {
                    //     AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                    //         console.log('address updated - ', addresses[0].address);
                    //         if (err) {
                    //             console.log('address err', err)
                    //         } else {
                    //             addresses.shift();
                    //         }
                    //         if (addresses.length) {
                    //             updateAddresses()
                    //         } else {
                    //             updateInProgress = false;
                    //             if (exit_count === numCPUs) {
                    //                 endReindex();
                    //             }
                    //         }
                    //     })
                    // }
                }
                startUpdateAddressesClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                var addresses = [];
                var updateInProgress = false;
                var startedCluster = false;
                var startUpdatingAddresses = function(addresses1) {
                    if (!updateInProgress) {
                        addresses = addresses.concat(addresses1);
                        updateInProgress = true;
                        updateAddress()
                    } else {
                        addresses = addresses.concat(addresses1);
                    }

                }
                var updateAddress = function() {
                    AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                        console.log('address updated - ', addresses[0].address);
                        if (err) {
                            // console.log('address err', err)
                            // console.log('address repeat', addresses[0].address)
                        } else {
                            addresses.shift();
                        }
                        if (addresses.length) {
                            updateAddress(addresses)
                        } else {
                            updateInProgress = false;
                            if (!updateInProgress && !startedCluster) {
                                endUpdateAddressesClusterLiner();
                            }
                        }
                    })
                }
                var startUpdateAddressesClusterLiner = function() {
                    // db.connect(settings[wallet].dbSettings);
                    TxVinVoutController.count(function(allBlocksCount) {
                        var start = 0;
                        var offset = Math.ceil(allBlocksCount / numCPUs);
                        var from = start + ((cluster.worker.id - 1) * offset);
                        // var to = start + (cluster.worker.id * offset - 1);
                        // if (cluster.worker.id === 1 || to > allBlocksCount) {
                        //     to = allBlocksCount;
                        // }
                        var limit = offset;
                        var offset = from;
                        if(offset + limit > allBlocksCount) {
                            limit = allBlocksCount - offset + 1;
                        }
                        console.log('offset', offset);
                        console.log('limit', limit);
                        // return;
                        startedCluster = true;
                        TxVinVoutController.getAll1('blockindex', 'asc', limit, offset, function(results) {
                            console.log('results.length', results.length)
                            // var totalAddresses = 0;
                            // var updatedAddresses = 0;
                            var UpdateAddresses = function(index) {
                                var txVinVout = results[index];
                                // totalAddresses += txVinVout.vin.length;
                                // totalAddresses += txVinVout.vout.length;
                                // console.log('txVinVout', txVinVout)
                                var addreses_to_update = [];
                                for (var i = 0; i < txVinVout.vin.length; i++) {
                                    // TODO update mongodb adress sceme
                                    addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txVinVout.txid, amount: txVinVout.vin[i].amount, type: 'vin'})
                                    // addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                                    // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                                }
                                for (var i = 0; i < txVinVout.vout.length; i++) {
                                    // TODO update mongodb adress sceme
                                    addreses_to_update.push({address: txVinVout.vout[i].addresses, txid: txVinVout.txid, amount: txVinVout.vout[i].amount, type: 'vout'})
                                    // addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                                    // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                                }
                                if(addreses_to_update.length) {
                                    startUpdatingAddresses(addreses_to_update)
                                }
                                // if(addreses_to_update.length) {
                                //     cluster.worker.send({addreses_to_update: addreses_to_update});
                                // }
                                // console.log('txVinVout.txid', txVinVout.blockindex)
                                index += 1;
                                if(index < results.length) {
                                    setTimeout(function(){
                                        UpdateAddresses(index);
                                    })
                                } else {
                                    startedCluster = false;
                                    if (!updateInProgress && !startedCluster) {
                                        endUpdateAddressesClusterLiner();
                                    }
                                }
                            }
                            if(results.length) {
                                UpdateAddresses(0);
                            } else {
                                startedCluster = false;
                                if (!updateInProgress && !startedCluster) {
                                    endUpdateAddressesClusterLiner();
                                }
                            }
                        });
                    })
                }
                var endUpdateAddressesClusterLiner = function() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startUpdateAddressesClusterLiner();
            }
            break;
        case 'reindexclusterlineartest': // 0:52:3.69 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                startReindex(function(){
                    deleteDb(function(){
                        startReIndexClusterLinerAll()
                    })
                })
                var currentBlock = 0;
                var startReIndexClusterLinerAll = function() {
                    wallet_commands.getBlockCount(wallet).then(function (allBlocksCount) {
                        for (let i = 0; i < numCPUs; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {
                                if (msg.finished) {
                                    (function(id, block){
                                        if(block <= allBlocksCount ) {
                                            cluster.workers[id].send({blockNum: block});
                                        } else {
                                            cluster.workers[id].send({kill: true});
                                        }
                                    })(this.id, currentBlock++)
                                }
                            })
                            worker.send({blockNum: currentBlock});
                            currentBlock++;
                        }
                    });

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            console.log('took - ', helpers.getFinishTime(startTime));
                            deleteFile();
                            db.multipleDisconnect();
                            process.exit();
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });
                }
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.blockNum !== undefined) {
                        startReIndexClusterLiner(msg.blockNum);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startReIndexClusterLiner = function(blockNum) {
                    // db.connect(settings[wallet].dbSettings);
                    var txInsertCount = 0;
                    wallet_commands.getBlockHash(wallet, blockNum).then(function (hash) {
                        wallet_commands.getBlock(wallet, hash).then(function (block) {
                            var current_block = JSON.parse(block);
                            var updateBlockTx = function(i, current_block) {
                                wallet_commands.getRawTransaction(wallet, current_block.tx[i]).then(function (obj) {

                                    var newTx = new Tx({
                                        txid: obj.txid,
                                        vin: obj.vin,
                                        vout: obj.vout,
                                        timestamp: obj.time,
                                        blockhash: obj.blockhash,
                                        blockindex: current_block.height,
                                    });

                                    console.log(current_block.height, obj.txid);

                                    TxController.updateOne(newTx, function (err) {
                                        txInsertCount++;
                                        if (err) {
                                            console.log('err', err);
                                        }
                                        if (txInsertCount >= current_block.tx.length) {
                                            cluster.worker.send({finished: true});
                                        }
                                    });
                                    if(i < current_block.tx.length - 1) {
                                        updateBlockTx(++i, current_block);
                                    }
                                }).catch(function (err) {
                                    var newTx = new Tx({
                                        txid: current_block.tx[i],
                                        vin: [],
                                        vout: [],
                                        timestamp: current_block.time,
                                        blockhash: current_block.hash,
                                        blockindex: current_block.height,
                                    });

                                    console.log(current_block.height, current_block.tx[i]);

                                    TxController.updateOne(newTx, function (err) {
                                        txInsertCount++;
                                        if (err) {
                                            console.log('err', err);
                                        }
                                        if (txInsertCount >= current_block.tx.length) {
                                            cluster.worker.send({finished: true});
                                        }
                                    });
                                    txInsertCount++;
                                    if (txInsertCount >= current_block.tx.length) {
                                        cluster.worker.send({finished: true});
                                    }
                                    if(i < current_block.tx.length - 1) {
                                        updateBlockTx(++i, current_block);
                                    }
                                });
                            }
                            updateBlockTx(0, current_block);
                        }).catch(function (err) {
                            console.log('error getting block', err);
                            cluster.worker.send({finished: true});
                        });
                    }).catch(function (err) {
                        console.log('error getting block hash', err);
                    })
                }
            }
            break;
        case 'calcvinvoutclusterlineartest': // 12:47:25.775 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit()
                    return;
                }
                createFile();
                var currentBlock = 0;
                var cpuCount = numCPUs;
                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.deleteAll(function(err) {
                        TxController.count(function (allBlocksCount) {
                            for (let i = 0; i < cpuCount; i++) {
                                var worker = cluster.fork();
                                worker.on('message', function (msg) {
                                    if (msg.addreses_to_update) {
                                        startUpdatingAddresses(msg.addreses_to_update)
                                    }
                                    if (msg.finished) {
                                        (function (id, block) {
                                            if (block <= allBlocksCount) {
                                                cluster.workers[id].send({blockNum: block});
                                            } else {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        })(this.id, currentBlock++)
                                    }
                                })
                                worker.send({blockNum: currentBlock});
                                currentBlock++;
                            }
                        });
                    });

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === cpuCount) {
                            if (!updateInProgress) {
                                console.log('local_addreses_before_save', local_addreses_before_save.length);
                                updateDbAddreess(local_addreses_before_save, function() {
                                    endReindex();
                                });
                                // endReindex();
                            }
                            // console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });
                }

                var addresses = [];
                var local_addreses_before_save = [];
                var updateInProgress = false;
                var startUpdatingAddresses = function(addresses1) {
                    if(!updateInProgress) {
                        addresses = addresses.concat(addresses1);
                        updateInProgress = true;
                        sumAddresses()
                    } else {
                        addresses = addresses.concat(addresses1);
                    }

                }

                var sumAddresses = function() {
                    if (addresses.length) {
                        var hashMap = local_addreses_before_save.map(function (o) {return o.a_id});
                        // console.log('hashMap', hashMap)
                        var i = hashMap.indexOf(addresses[0].address);
                        if (i > -1) {
                            var address = local_addreses_before_save[i];
                            if (addresses[0].address === 'coinbase') {
                                address.sent = address.sent + addresses[0].amount;
                                address.balance = 0;
                                local_addreses_before_save[i] = address;
                                addresses.shift();
                                sumAddresses();
                            } else {
                                helpers.is_unique(address.txs, addresses[0].txid).then(function (obj) {
                                    var tx_array = address.txs;
                                    var received = address.received;
                                    var sent = address.sent;
                                    if (addresses[0].type == 'vin') {
                                        sent = sent + addresses[0].amount;
                                    } else {
                                        received = received + addresses[0].amount;
                                    }
                                    if (obj.unique == true) {
                                        tx_array.push({addresses: addresses[0].txid, type: addresses[0].type});
                                        address.txs = tx_array
                                        address.received = received;
                                        address.sent = sent;
                                        address.balance = received - sent;
                                        local_addreses_before_save[i] = address;
                                        addresses.shift();
                                        sumAddresses();

                                    } else {
                                        if (addresses[0].type !== tx_array[obj.index].type) {
                                            address.txs = tx_array
                                            address.received = received;
                                            address.sent = sent;
                                            address.balance = received - sent;
                                            local_addreses_before_save[i] = address;
                                        }
                                        addresses.shift();
                                        sumAddresses();
                                    }
                                })
                            }
                        } else {
                            var newAddress = {
                                a_id: addresses[0].address,
                                txs: [{addresses: addresses[0].txid, type: addresses[0].type}],
                                balance: addresses[0].amount,
                                sent:  0,
                                received:  0,
                            };
                            if (addresses[0].type === 'vin') {
                                newAddress.sent =  addresses[0].amount;
                            } else {
                                newAddress.received =  addresses[0].amount;
                            }
                            local_addreses_before_save.push(newAddress);
                            addresses.shift();
                            sumAddresses();
                        }
                    } else {
                        updateInProgress = false;
                        if (exit_count === numCPUs) {
                            console.log('local_addreses_before_save', local_addreses_before_save.length);
                            updateDbAddreess(local_addreses_before_save, function() {
                                endReindex();
                            });
                        }
                    }
                    // addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type
                    // AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                    //     if (err) {
                    //         console.log('address err', err)
                    //     } else {
                    //         countAddressUpdate++;
                    //         addresses.shift();
                    //     }
                    //     if (addresses.length) {
                    //         updateAddresses()
                    //     } else {
                    //         updateInProgress = false;
                    //         if (exit_count === numCPUs) {
                    //             endReIndexClusterLinerAll();
                    //         }
                    //         console.log('countAddressUpdate', countAddressUpdate);
                    //     }
                    // })
                }

                startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.blockNum !== undefined) {
                        startVinVoutClusterLiner(msg.blockNum);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startVinVoutClusterLiner = function(blockNum) {
                    TxController.getAll1('blockindex', 'asc', 1, blockNum, function(results) {
                        var tx = results[0];
                        var checkVinVout = function() {
                            helpers.prepare_vin(wallet, tx).then(function (vin) {
                                helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
                                    helpers.calculate_total(obj.vout).then(function (total) {
                                        // console.log('results.length', results.length);
                                        // return;
                                        // console.log(tx, nvin, vout, total, addreses_to_update)
                                        var addreses_to_update = [];
                                        for (var i = 0; i < obj.nvin.length; i++) {
                                            // TODO update mongodb adress sceme
                                            addreses_to_update.push({address: obj.nvin[i].addresses, txid: tx.txid, amount: obj.nvin[i].amount, type: 'vin'})
                                            // addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                                            // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                                        }
                                        for (var i = 0; i < obj.vout.length; i++) {
                                            // TODO update mongodb adress sceme
                                            addreses_to_update.push({address: obj.vout[i].addresses, txid: tx.txid, amount: obj.vout[i].amount, type: 'vout'})
                                            // addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                                            // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                                        }
                                        if(addreses_to_update.length) {
                                            cluster.worker.send({addreses_to_update: addreses_to_update});
                                        }
                                        var vinvout = {txid: tx.txid, vin: obj.nvin, vout: obj.vout, total: total, blockindex: tx.blockindex};
                                        TxVinVoutController.updateOne(vinvout, function(err) {
                                            if(err) {
                                                console.log('err', err);
                                            }
                                            console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                                            cluster.worker.send({finished: true});
                                        })
                                        // resolve({tx: tx, nvin: obj.nvin, vout: obj.vout, total: total, addreses_to_update: addreses_to_update});
                                    })
                                }).catch(function(err) {
                                    console.log('error getting prepare_vout', err)
                                })
                            })
                        }
                        if(tx) {
                            checkVinVout();
                        } else {
                            cluster.worker.send({finished: true});
                        }
                    });
                }
            }
            break;
        case 'reindexAddressesclusterlineartest': // 0:33:23.548
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit()
                    return;
                }
                createFile();
                var currentBlock = 0;
                var startUpdateAddressesClusterLinerAll = function() {
                    AddressController.deleteAll(function(err) {
                        TxVinVoutController.count(function(allBlocksCount) {
                            for (let i = 0; i < numCPUs; i++) {
                                var worker = cluster.fork();
                                worker.on('message', function (msg) {
                                    if (msg.finished) {
                                        (function (id, block) {
                                            if (block <= allBlocksCount) {
                                                cluster.workers[id].send({blockNum: block});
                                            } else {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        })(this.id, currentBlock++)
                                    }
                                })
                                worker.send({blockNum: currentBlock});
                                currentBlock++;
                            }
                        });
                    })

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            endReindex();
                            // console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });
                }
                startUpdateAddressesClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.blockNum !== undefined) {
                        startUpdateAddressesClusterLiner(msg.blockNum);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startUpdatingAddresses = function(addresses) {
                    updateAddress(addresses)

                }
                var updateAddress = function(addresses) {
                    AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                        // console.log('address updated - ', addresses[0].address);
                        if (err) {
                            // console.log('address err', err)
                            // console.log('address repeat', addresses[0].address)
                        } else {
                            addresses.shift();
                        }
                        if (addresses.length) {
                            updateAddress(addresses)
                        } else {
                            cluster.worker.send({finished: true});
                        }
                    })
                }
                var startUpdateAddressesClusterLiner = function(blockNum) {
                    TxVinVoutController.getAll1('blockindex', 'asc', 1, blockNum, function(results) {
                        var txVinVout = results[0];
                        console.log(txVinVout.blockindex, txVinVout.txid);
                            // var totalAddresses = 0;
                        // var updatedAddresses = 0;
                        var UpdateAddresses = function(index) {
                            var addreses_to_update = [];
                            for (var i = 0; i < txVinVout.vin.length; i++) {
                                // TODO update mongodb adress sceme
                                addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txVinVout.txid, amount: txVinVout.vin[i].amount, type: 'vin'})
                                // addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                                // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                            }
                            for (var i = 0; i < txVinVout.vout.length; i++) {
                                // TODO update mongodb adress sceme
                                addreses_to_update.push({address: txVinVout.vout[i].addresses, txid: txVinVout.txid, amount: txVinVout.vout[i].amount, type: 'vout'})
                                // addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                                // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                            }
                            if(addreses_to_update.length) {
                                startUpdatingAddresses(addreses_to_update)
                            } else {
                                cluster.worker.send({finished: true});
                            }
                        }
                        if(txVinVout) {
                            UpdateAddresses(0);
                        } else {
                            cluster.worker.send({finished: true});
                        }
                    });
                }
            }
            break;

        case 'reindexclusterlinearchunks': // 0:52:3.69 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                startReindex(function(){
                    deleteDb(function(){
                        startReIndexClusterLinerAll()
                    })
                })
                var currentBlock = 0;
                var startReIndexClusterLinerAll = function() {
                    wallet_commands.getBlockCount(wallet).then(function (allBlocksCount) {
                        for (let i = 0; i < numCPUs; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {
                                if (msg.finished) {
                                    (function(id, block){
                                        if(block <= allBlocksCount ) {
                                            cluster.workers[id].send({blockNum: block});
                                        } else {
                                            cluster.workers[id].send({kill: true});
                                        }
                                    })(this.id, currentBlock++)
                                }
                            })
                            worker.send({blockNum: currentBlock});
                            currentBlock++;
                        }
                    });

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            console.log('took - ', helpers.getFinishTime(startTime));
                            deleteFile();
                            db.multipleDisconnect();
                            process.exit();
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });
                }
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.blockNum !== undefined) {
                        startReIndexClusterLiner(msg.blockNum);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startReIndexClusterLiner = function(blockNum) {
                    // db.connect(settings[wallet].dbSettings);
                    var txInsertCount = 0;
                    wallet_commands.getBlockHash(wallet, blockNum).then(function (hash) {
                        wallet_commands.getBlock(wallet, hash).then(function (block) {
                            var current_block = JSON.parse(block);
                            var updateBlockTx = function(i, current_block) {
                                wallet_commands.getRawTransaction(wallet, current_block.tx[i]).then(function (obj) {

                                    var newTx = new Tx({
                                        txid: obj.txid,
                                        vin: obj.vin,
                                        vout: obj.vout,
                                        timestamp: obj.time,
                                        blockhash: obj.blockhash,
                                        blockindex: current_block.height,
                                    });

                                    console.log(current_block.height, obj.txid);

                                    TxController.updateOne(newTx, function (err) {
                                        txInsertCount++;
                                        if (err) {
                                            console.log('err', err);
                                        }
                                        if (txInsertCount >= current_block.tx.length) {
                                            cluster.worker.send({finished: true});
                                        }
                                    });
                                    if(i < current_block.tx.length - 1) {
                                        updateBlockTx(++i, current_block);
                                    }
                                }).catch(function (err) {
                                    var newTx = new Tx({
                                        txid: current_block.tx[i],
                                        vin: [],
                                        vout: [],
                                        timestamp: current_block.time,
                                        blockhash: current_block.hash,
                                        blockindex: current_block.height,
                                    });

                                    console.log(current_block.height, current_block.tx[i]);

                                    TxController.updateOne(newTx, function (err) {
                                        txInsertCount++;
                                        if (err) {
                                            console.log('err', err);
                                        }
                                        if (txInsertCount >= current_block.tx.length) {
                                            cluster.worker.send({finished: true});
                                        }
                                    });
                                    txInsertCount++;
                                    if (txInsertCount >= current_block.tx.length) {
                                        cluster.worker.send({finished: true});
                                    }
                                    if(i < current_block.tx.length - 1) {
                                        updateBlockTx(++i, current_block);
                                    }
                                });
                            }
                            updateBlockTx(0, current_block);
                        }).catch(function (err) {
                            console.log('error getting block', err);
                            cluster.worker.send({finished: true});
                        });
                    }).catch(function (err) {
                        console.log('error getting block hash', err);
                    })
                }
            }
            break;
        case 'calcvinvoutclusterlinearchunks': // 12:47:25.775 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit()
                    return;
                }
                createFile();
                var currentBlocks = [];
                var limit = 20000;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextBlocksInProgress = false;
                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.deleteAll(function(err) {
                        gettingNextBlocksInProgress = true;
                        gettingNextBlocks(limit, offset).then(function(res){
                        gettingNextBlocksInProgress = false;
                        if(res && res.length) {
                            currentBlocks = currentBlocks.concat(res);
                        }
                        if(currentBlocks.length) {
                            for (let i = 0; i < cpuCount; i++) {
                                var worker = cluster.fork();
                                worker.on('message', function (msg) {
                                    if (msg.addreses_to_update) {
                                        startUpdatingAddresses(msg.addreses_to_update)
                                    }
                                    if (msg.finished) {
                                        (function (id) {
                                            clusterQ.push(id);
                                            if (currentBlocks.length) {
                                                if(currentBlocks.length === limit - limit / 10) {
                                                    if(!gettingNextBlocksInProgress) {
                                                        gettingNextBlocksInProgress = true;
                                                        offset++;
                                                        gettingNextBlocks(limit, offset).then(function (res) {
                                                            if(res && res.length) {
                                                                currentBlocks = currentBlocks.concat(res);
                                                            }
                                                            gettingNextBlocksInProgress = false;
                                                            if (currentBlocks.length) {
                                                                console.log('clusterQ', clusterQ)
                                                                while (clusterQ.length) {
                                                                    cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0]});
                                                                    clusterQ.shift();
                                                                    countBlocks++;
                                                                    currentBlocks.shift();
                                                                }
                                                            } else {
                                                                while (clusterQ.length) {
                                                                    cluster.workers[clusterQ[0]].send({kill: true});
                                                                    clusterQ.shift();
                                                                }
                                                            }
                                                        });
                                                    }
                                                }
                                                cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0]});
                                                clusterQ.shift();
                                                countBlocks++;
                                                currentBlocks.shift();

                                            } else {
                                                if(!gettingNextBlocksInProgress) {
                                                    cluster.workers[clusterQ[0]].send({kill: true});
                                                    clusterQ.shift();
                                                }
                                            }
                                        })(this.id)
                                    }
                                })
                                worker.send({currentBlock: currentBlocks[0]});
                                countBlocks++;
                                currentBlocks.shift();
                            }
                        } else {
                            console.log('finish getting blocks')
                        }
                        });
                    });

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === cpuCount) {
                            if (!updateInProgress) {
                                console.log('local_addreses_before_save', local_addreses_before_save.length);
                                updateDbAddreess(local_addreses_before_save, function() {
                                    endReindex();
                                });
                                // endReindex();
                                // console.log('countBlocks', countBlocks)
                                // console.log('took ', helpers.getFinishTime(startTime));
                                // endReindex();
                            }
                            // console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });
                }

                var addresses = [];
                var local_addreses_before_save = [];
                var updateInProgress = false;
                var startUpdatingAddresses = function(addresses1) {
                    if(!updateInProgress) {
                        addresses = addresses.concat(addresses1);
                        updateInProgress = true;
                        sumAddresses()
                    } else {
                        addresses = addresses.concat(addresses1);
                    }

                }

                var sumAddresses = function() {
                    if (addresses.length) {
                        var hashMap = local_addreses_before_save.map(function (o) {return o.a_id});
                        // console.log('hashMap', hashMap)
                        var i = hashMap.indexOf(addresses[0].address);
                        if (i > -1) {
                            var address = local_addreses_before_save[i];
                            if (addresses[0].address === 'coinbase') {
                                address.sent = address.sent + addresses[0].amount;
                                address.balance = 0;
                                local_addreses_before_save[i] = address;
                                addresses.shift();
                                sumAddresses();
                            } else {
                                helpers.is_unique(address.txs, addresses[0].txid).then(function (obj) {
                                    var tx_array = address.txs;
                                    var received = address.received;
                                    var sent = address.sent;
                                    if (addresses[0].type == 'vin') {
                                        sent = sent + addresses[0].amount;
                                    } else {
                                        received = received + addresses[0].amount;
                                    }
                                    if (obj.unique == true) {
                                        tx_array.push({addresses: addresses[0].txid, type: addresses[0].type});
                                        address.txs = tx_array
                                        address.received = received;
                                        address.sent = sent;
                                        address.balance = received - sent;
                                        local_addreses_before_save[i] = address;
                                        addresses.shift();
                                        sumAddresses();

                                    } else {
                                        if (addresses[0].type !== tx_array[obj.index].type) {
                                            address.txs = tx_array
                                            address.received = received;
                                            address.sent = sent;
                                            address.balance = received - sent;
                                            local_addreses_before_save[i] = address;
                                        }
                                        addresses.shift();
                                        sumAddresses();
                                    }
                                })
                            }
                        } else {
                            var newAddress = {
                                a_id: addresses[0].address,
                                txs: [{addresses: addresses[0].txid, type: addresses[0].type}],
                                balance: addresses[0].amount,
                                sent:  0,
                                received:  0,
                            };
                            if (addresses[0].type === 'vin') {
                                newAddress.sent =  addresses[0].amount;
                            } else {
                                newAddress.received =  addresses[0].amount;
                            }
                            local_addreses_before_save.push(newAddress);
                            addresses.shift();
                            sumAddresses();
                        }
                    } else {
                        updateInProgress = false;
                        if (exit_count === numCPUs) {
                            console.log('local_addreses_before_save', local_addreses_before_save.length);
                            updateDbAddreess(local_addreses_before_save, function() {
                                endReindex();
                            });
                        }
                    }
                    // addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type
                    // AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                    //     if (err) {
                    //         console.log('address err', err)
                    //     } else {
                    //         countAddressUpdate++;
                    //         addresses.shift();
                    //     }
                    //     if (addresses.length) {
                    //         updateAddresses()
                    //     } else {
                    //         updateInProgress = false;
                    //         if (exit_count === numCPUs) {
                    //             endReIndexClusterLinerAll();
                    //         }
                    //         console.log('countAddressUpdate', countAddressUpdate);
                    //     }
                    // })
                }

                setTimeout(startVinVoutClusterLinerAll)
                // startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.currentBlock !== undefined) {
                        startVinVoutClusterLiner(msg.currentBlock);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startVinVoutClusterLiner = function(currentBlock) {
                    var tx = currentBlock;
                    var checkVinVout = function() {
                        helpers.prepare_vin_db(wallet, tx).then(function (vin) {
                            helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
                                helpers.calculate_total(obj.vout).then(function (total) {
                                    // console.log('results.length', results.length);
                                    // return;
                                    // console.log(tx, nvin, vout, total, addreses_to_update)
                                    var addreses_to_update = [];
                                    for (var i = 0; i < obj.nvin.length; i++) {
                                        // TODO update mongodb adress sceme
                                        addreses_to_update.push({address: obj.nvin[i].addresses, txid: tx.txid, amount: obj.nvin[i].amount, type: 'vin'})
                                        // addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                                        // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                                    }
                                    for (var i = 0; i < obj.vout.length; i++) {
                                        // TODO update mongodb adress sceme
                                        addreses_to_update.push({address: obj.vout[i].addresses, txid: tx.txid, amount: obj.vout[i].amount, type: 'vout'})
                                        // addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                                        // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                                    }
                                    if(addreses_to_update.length) {
                                        cluster.worker.send({addreses_to_update: addreses_to_update});
                                    }
                                    var vinvout = {txid: tx.txid, vin: obj.nvin, vout: obj.vout, total: total, blockindex: tx.blockindex};
                                    TxVinVoutController.updateOne(vinvout, function(err) {
                                        if(err) {
                                            console.log('err', err);
                                        }
                                        console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                                        cluster.worker.send({finished: true});
                                    })
                                    // console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                                    // cluster.worker.send({finished: true});
                                    // resolve({tx: tx, nvin: obj.nvin, vout: obj.vout, total: total, addreses_to_update: addreses_to_update});
                                })
                            }).catch(function(err) {
                                console.log('error getting prepare_vout', err)
                            })
                        })
                    }
                    if(tx) {
                        checkVinVout();
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;
        case 'reindexaddressesclusterlinearchunks': // 12:47:25.775 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit()
                    return;
                }
                createFile();
                var currentBlocks = [];
                var limit = 20000;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextBlocksInProgress = false;
                var startVinVoutClusterLinerAll = function() {
                    // TxVinVoutController.deleteAll(function(err) {
                    gettingNextBlocksInProgress = true;
                    gettingNextBlocksVinVout(limit, offset).then(function(res){
                        gettingNextBlocksInProgress = false;
                        if(res && res.length) {
                            currentBlocks = currentBlocks.concat(res);
                        }
                        if(currentBlocks.length) {
                            for (let i = 0; i < cpuCount; i++) {
                                var worker = cluster.fork();
                                worker.on('message', function (msg) {
                                    if (msg.addreses_to_update) {
                                        startUpdatingAddresses(msg.addreses_to_update)
                                    }
                                    if (msg.finished) {
                                        (function (id) {
                                            clusterQ.push(id);
                                            if (currentBlocks.length) {
                                                if(currentBlocks.length === limit - limit / 10) {
                                                    if(!gettingNextBlocksInProgress) {
                                                        gettingNextBlocksInProgress = true;
                                                        offset++;
                                                        gettingNextBlocksVinVout(limit, offset).then(function (res) {
                                                            if(res && res.length) {
                                                                currentBlocks = currentBlocks.concat(res);
                                                            }
                                                            gettingNextBlocksInProgress = false;
                                                            if (currentBlocks.length) {
                                                                console.log('clusterQ', clusterQ)
                                                                while (clusterQ.length) {
                                                                    cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0]});
                                                                    clusterQ.shift();
                                                                    countBlocks++;
                                                                    currentBlocks.shift();
                                                                }
                                                            } else {
                                                                while (clusterQ.length) {
                                                                    cluster.workers[clusterQ[0]].send({kill: true});
                                                                    clusterQ.shift();
                                                                }
                                                            }
                                                        });
                                                    }
                                                }
                                                cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0]});
                                                clusterQ.shift();
                                                countBlocks++;
                                                currentBlocks.shift();

                                            } else {
                                                if(!gettingNextBlocksInProgress) {
                                                    cluster.workers[clusterQ[0]].send({kill: true});
                                                    clusterQ.shift();
                                                }
                                            }
                                        })(this.id)
                                    }
                                })
                                worker.send({currentBlock: currentBlocks[0]});
                                countBlocks++;
                                currentBlocks.shift();
                            }
                        } else {
                            console.log('finish getting blocks')
                        }
                        });
                    // });

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === cpuCount) {
                            if (!updateInProgress) {
                                console.log('local_addreses_before_save', local_addreses_before_save.length);
                                // updateDbAddreess(local_addreses_before_save, function() {
                                //     endReindex();
                                // });
                                // endReindex();
                                console.log('countBlocks', countBlocks)
                                console.log('took ', helpers.getFinishTime(startTime));
                                endReindex();
                            }
                            // console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });
                }

                var addresses = [];
                var local_addreses_before_save = [];
                var updateInProgress = false;
                var startUpdatingAddresses = function(addresses1) {
                    if(!updateInProgress) {
                        addresses = addresses.concat(addresses1);
                        updateInProgress = true;
                        sumAddresses()
                    } else {
                        addresses = addresses.concat(addresses1);
                    }

                }

                var sumAddresses = function() {
                    if (addresses.length) {
                        // console.log('updating address', addresses[0].address);
                        var hashMap = local_addreses_before_save.map(function (o) {return o.a_id});
                        // console.log('hashMap', hashMap)
                        var i = hashMap.indexOf(addresses[0].address);
                        if (i > -1) {
                            var address = local_addreses_before_save[i];
                            if (addresses[0].address === 'coinbase') {
                                address.sent = address.sent + addresses[0].amount;
                                address.balance = 0;
                                local_addreses_before_save[i] = address;
                                addresses.shift();
                                sumAddresses();
                            } else {
                                helpers.is_unique(address.txs, addresses[0].txid).then(function (obj) {
                                    var tx_array = address.txs;
                                    var received = address.received;
                                    var sent = address.sent;
                                    if (addresses[0].type == 'vin') {
                                        sent = sent + addresses[0].amount;
                                    } else {
                                        received = received + addresses[0].amount;
                                    }
                                    if (obj.unique == true) {
                                        tx_array.push({addresses: addresses[0].txid, type: addresses[0].type});
                                        address.txs = tx_array
                                        address.received = received;
                                        address.sent = sent;
                                        address.balance = received - sent;
                                        local_addreses_before_save[i] = address;
                                        addresses.shift();
                                        sumAddresses();

                                    } else {
                                        if (addresses[0].type !== tx_array[obj.index].type) {
                                            address.txs = tx_array
                                            address.received = received;
                                            address.sent = sent;
                                            address.balance = received - sent;
                                            local_addreses_before_save[i] = address;
                                        }
                                        addresses.shift();
                                        sumAddresses();
                                    }
                                })
                            }
                        } else {
                            var newAddress = {
                                a_id: addresses[0].address,
                                txs: [{addresses: addresses[0].txid, type: addresses[0].type}],
                                balance: addresses[0].amount,
                                sent:  0,
                                received:  0,
                            };
                            if (addresses[0].type === 'vin') {
                                newAddress.sent =  addresses[0].amount;
                            } else {
                                newAddress.received =  addresses[0].amount;
                            }
                            local_addreses_before_save.push(newAddress);
                            addresses.shift();
                            sumAddresses();
                        }
                    } else {
                        updateInProgress = false;
                        if (exit_count === numCPUs) {
                            console.log('local_addreses_before_save', local_addreses_before_save.length);
                            updateDbAddreess(local_addreses_before_save, function() {
                                endReindex();
                            });
                        }
                    }
                }

                setTimeout(startVinVoutClusterLinerAll)
                // startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.currentBlock !== undefined) {
                        startUpdateAddressesClusterLiner(msg.currentBlock);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startUpdateAddressesClusterLiner = function(currentBlock) {
                    var txVinVout = currentBlock;
                    // console.log(txVinVout.blockindex, txVinVout.txid);
                    // var totalAddresses = 0;
                    // var updatedAddresses = 0;
                    var UpdateAddresses = function() {
                        var addreses_to_update = [];
                        for (var i = 0; i < txVinVout.vin.length; i++) {
                            // TODO update mongodb adress sceme
                            addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txVinVout.txid, amount: txVinVout.vin[i].amount, type: 'vin'})
                            // addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                            // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                        }
                        for (var i = 0; i < txVinVout.vout.length; i++) {
                            // TODO update mongodb adress sceme
                            addreses_to_update.push({address: txVinVout.vout[i].addresses, txid: txVinVout.txid, amount: txVinVout.vout[i].amount, type: 'vout'})
                            // addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                            // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                        }
                        if(addreses_to_update.length) {
                            cluster.worker.send({addreses_to_update: addreses_to_update});
                        }
                        cluster.worker.send({finished: true});
                    }
                    if(txVinVout) {
                        UpdateAddresses(0);
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;

        case 'updatelinear': // 0:27:35.915
            if(fileExist()) {
                console.log('reindex is in progress');
                db.multipleDisconnect();
                process.exit()
                return;
            }
            createFile();
            // db.connect(settings[wallet].dbSettings);
            var startTime = new Date();
            var startUpdate = function() {
                TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                    wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                        var allBlocksCount = blockCount;
                        var start = 0;
                        if(latestTx.length) {
                            start = latestTx[0].blockindex + 1;
                        }
                        var from = start;
                        // var to = allBlocksCount;
                        var to = start + 1;
                        var txInsertCount = 0;
                        var txVinVoutInsertCount = 0;
                        var blockTxLength = 0;
                        var updateInProgress = false;
                        var addresses = [];

                        var startUpdatingAddresses = function(addresses1) {
                            if (!updateInProgress) {
                                addresses = addresses.concat(addresses1);
                                updateInProgress = true;
                                updateAddresses()
                            } else {
                                addresses = addresses.concat(addresses1);
                            }

                        }

                        var updateAddresses = function() {
                            AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                                console.log('address updated - ', addresses[0].address);
                                if (err) {
                                    console.log('address err', err)
                                } else {
                                    addresses.shift();
                                }
                                if (addresses.length) {
                                    updateAddresses()
                                } else {
                                    updateInProgress = false;
                                    if (exit_count === numCPUs) {
                                        endReindex();
                                    }
                                }
                            })
                        }

                        wallet_commands.getAllBlocksCluster(wallet, from, to, function (index, hash) {
                            wallet_commands.getBlock(wallet, hash).then(function (block) {
                                var current_block = JSON.parse(block);
                                var updateBlockTx = function(i, current_block) {
                                    blockTxLength++;
                                    wallet_commands.getRawTransaction(wallet, current_block.tx[i]).then(function (obj) {

                                        var tx = new Tx({
                                            txid: obj.txid,
                                            vin: obj.vin,
                                            vout: obj.vout,
                                            timestamp: obj.time,
                                            blockhash: obj.blockhash,
                                            blockindex: current_block.height,
                                        });
                                        helpers.prepare_vin(wallet, tx).then(function (vin) {
                                            helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
                                                helpers.calculate_total(obj.vout).then(function (total) {
                                                    // console.log('results.length', results.length);
                                                    // return;
                                                    // console.log(tx, nvin, vout, total, addreses_to_update)
                                                    var txVinVout = {txid: tx.txid, vin: obj.nvin, vout: obj.vout, total: total, blockindex: tx.blockindex};

                                                    var addreses_to_update = [];
                                                    for (var i = 0; i < txVinVout.vin.length; i++) {
                                                        addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txVinVout.txid, amount: txVinVout.vin[i].amount, type: 'vin'})
                                                    }
                                                    for (var i = 0; i < txVinVout.vout.length; i++) {
                                                        addreses_to_update.push({address: txVinVout.vout[i].addresses, txid: txVinVout.txid, amount: txVinVout.vout[i].amount, type: 'vout'})
                                                    }
                                                    // if(addreses_to_update.length) {
                                                    //     startUpdatingAddresses(addreses_to_update);
                                                    // }
                                                    console.log(current_block.height, obj.tx.txid);
                                                    console.log('addreses_to_update.length', addreses_to_update.length);
                                                    // TxVinVoutController.updateOne(txVinVout, function(err) {
                                                    //     txVinVoutInsertCount++
                                                    //     if(err) {
                                                    //         console.log('err', err);
                                                    //     }
                                                    //     console.log('updated vin vout - ' + txVinVout.blockindex, tx.txid);
                                                    //     if (txInsertCount >= blockTxLength && txVinVoutInsertCount >= blockTxLength && txInsertCount >= to - from + 1 && !addresses.length) {
                                                    //         endReindex();
                                                    //     }
                                                    // })
                                                    // TxController.updateOne(tx, function (err) {
                                                    //     txInsertCount++;
                                                    //     if (err) {
                                                    //         console.log('err', err);
                                                    //     }
                                                    //     // console.log('txInsertCount', txInsertCount)
                                                    //     // console.log('blockTxLength', blockTxLength)
                                                    //     if (txInsertCount >= blockTxLength && txVinVoutInsertCount >= blockTxLength && txInsertCount >= to - from + 1 && !addresses.length) {
                                                    //         endReindex();
                                                    //     }
                                                    //     // console.log('created')
                                                    // });
                                                    // if(i < current_block.tx.length - 1) {
                                                    //     updateBlockTx(++i, current_block);
                                                    // }
                                                })
                                            }).catch(function(err) {
                                                console.log('error getting prepare_vout', err)
                                            })
                                        })
                                    }).catch(function (err) {
                                        var tx = new Tx({
                                            txid: current_block.tx[i],
                                            vin: [],
                                            vout: [],
                                            timestamp: current_block.time,
                                            blockhash: current_block.hash,
                                            blockindex: current_block.height,
                                        });
                                        // console.log('error getting rawtransaction - ' + current_block.tx[0], err);
                                        helpers.prepare_vin(wallet, tx).then(function (vin) {
                                            helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
                                                helpers.calculate_total(obj.vout).then(function (total) {
                                                    // console.log('results.length', results.length);
                                                    // return;
                                                    // console.log(tx, nvin, vout, total, addreses_to_update)
                                                    var txVinVout = {txid: tx.txid, vin: obj.nvin, vout: obj.vout, total: total, blockindex: tx.blockindex};
                                                    TxVinVoutController.updateOne(txVinVout, function(err) {
                                                        txVinVoutInsertCount++
                                                        if(err) {
                                                            console.log('err', err);
                                                        }
                                                        console.log('updated vin vout - ' + txVinVout.blockindex, tx.txid);
                                                        if (txInsertCount >= blockTxLength && txVinVoutInsertCount >= blockTxLength && txInsertCount >= to - from + 1 && !addresses.length) {
                                                            endReindex();
                                                        }
                                                    })
                                                    TxController.updateOne(tx, function (err) {
                                                        txInsertCount++;
                                                        if (err) {
                                                            console.log('err', err);
                                                        }
                                                        // console.log('txInsertCount', txInsertCount)
                                                        // console.log('blockTxLength', blockTxLength)
                                                        if (txInsertCount >= blockTxLength && txVinVoutInsertCount >= blockTxLength && txInsertCount >= to - from + 1 && !addresses.length) {
                                                            endReindex();
                                                        }
                                                        // console.log('created')
                                                    });
                                                    if(i < current_block.tx.length - 1) {
                                                        updateBlockTx(++i, current_block);
                                                    }
                                                    // resolve({tx: tx, nvin: obj.nvin, vout: obj.vout, total: total, addreses_to_update: addreses_to_update});
                                                })
                                            }).catch(function(err) {
                                                console.log('error getting prepare_vout', err)
                                            })
                                        })
                                    });
                                }
                                updateBlockTx(0, current_block);
                            }).catch(function (err) {
                                console.log('error getting block', err);
                                if (txInsertCount >= blockTxLength &&  txVinVoutInsertCount >= blockTxLength && txInsertCount >= to - from + 1) {
                                    endReindex();
                                }
                                txInsertCount++;
                                txVinVoutInsertCount++;
                            });
                        }).then(function (time) {
                            console.log('finish getting blocks', time);
                        }).catch(function (err) {
                            console.log('error getting blocks', err);
                            deleteFile();
                            db.multipleDisconnect();
                            process.exit();
                        })
                    }).catch(function (err) {
                        console.log('error getting blockCount', err);
                    })
                })
            }
            startUpdate();
            break;

        case 'updateclusterlinear_delete': // 0:52:3.69 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                var addreses_to_update = [];
                startReindex(function(){
                    deleteDb(function(){
                        startReIndexClusterLinerAll()
                    })
                })

                var startReIndexClusterLinerAll = function() {
                    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                        for (let i = 0; i < numCPUs; i++) {
                            var worker = cluster.fork();
                            if(latestTx.length) {
                                worker.send({blockindex: latestTx[0].blockindex});
                            }
                        }
                    })

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            if (!updateInProgress) {
                                console.log('local_addreses_before_save', local_addreses_before_save.length);
                                updateDbAddreess(local_addreses_before_save, function(){
                                    endReindex();
                                });
                            }
                            console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });

                    var updateInProgress = false;
                    var countAddressUpdate = 0;
                    var addresses = [];
                    var local_addreses_before_save = [];

                    var startUpdatingAddresses = function(addresses1) {
                        if (!updateInProgress) {
                            addresses = addresses.concat(addresses1);
                            updateInProgress = true;
                            startUpdatingAddresses()
                        } else {
                            addresses = addresses.concat(addresses1);
                        }

                    }

                    var startUpdatingAddresses = function(addresses1) {
                        if (!updateInProgress) {
                            addresses = addresses.concat(addresses1);
                            updateInProgress = true;
                            updateAddresses()
                        } else {
                            addresses = addresses.concat(addresses1);
                        }

                    }

                    var updateAddresses = function() {
                        AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                            console.log('address updated - ', addresses[0].address);
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
                                if (exit_count === numCPUs) {
                                    endReindex();
                                }
                                console.log('countAddressUpdate', countAddressUpdate);
                            }
                        })
                    }
                }
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                var blockindex;
                process.on('message', function(msg) {
                    blockindex = msg.blockindex;
                });
                var startReIndexClusterLiner = function() {
                    // db.connect(settings[wallet].dbSettings);
                    wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                        var start = 0;
                        if(blockindex) {
                            start = blockindex;
                        }
                        var current_cluster_id = cluster.worker.id;
                        var allBlocksCount = blockCount;
                        var from = start + cluster.worker.id - 1;
                        var to = allBlocksCount;
                        var txInsertCount = 0;
                        var blockTxLength = 0;
                        // console.log('from', from);
                        // console.log('to', to);
                        // console.log('expectedSteps', expectedSteps);
                        // return;
                        wallet_commands.getAllBlocksClusterLiner(wallet, from, to, numCPUs, function (index, hash) {
                            wallet_commands.getBlock(wallet, hash).then(function (block) {
                                var current_block = JSON.parse(block);
                                var updateBlockTx = function(i, current_block) {
                                    blockTxLength++;
                                    wallet_commands.getRawTransaction(wallet, current_block.tx[i]).then(function (obj) {

                                        var newTx = new Tx({
                                            txid: obj.txid,
                                            vin: obj.vin,
                                            vout: obj.vout,
                                            timestamp: obj.time,
                                            blockhash: obj.blockhash,
                                            blockindex: current_block.height,
                                        });
                                        // var addreses_to_update = obj.addreses_to_update;
                                        console.log(current_block.height, obj.txid);
                                        // var addreses_to_update = obj.addreses_to_update;
                                        // addr_count += addreses_to_update.length;
                                        // if(addreses_to_update.length) {
                                        //     startUpdatingAddresses(addreses_to_update);
                                        // }
                                        // cluster.worker.send({addreses_to_update: addreses_to_update});
                                        // addr_count += addreses_to_update.length;
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            // console.log('txInsertCount', txInsertCount)
                                            // console.log('blockTxLength', blockTxLength)
                                            if (txInsertCount >= Math.floor((to - from)/numCPUs + 1) && txInsertCount >= blockTxLength) {
                                                endReIndexClusterLiner();
                                            }
                                            // console.log('created')
                                        });
                                        if(i < current_block.tx.length - 1) {
                                            updateBlockTx(++i, current_block);
                                        }
                                    }).catch(function (err) {
                                        var newTx = new Tx({
                                            txid: current_block.tx[i],
                                            vin: [],
                                            vout: [],
                                            timestamp: current_block.time,
                                            blockhash: current_block.hash,
                                            blockindex: current_block.height,
                                        });
                                        // console.log('error getting rawtransaction - ' + current_block.tx[0], err);
                                        console.log(current_block.height, current_block.tx[i]);
                                        // console.log('newTx', newTx)
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            if (txInsertCount >= Math.floor((to - from)/numCPUs + 1) && txInsertCount >= blockTxLength) {
                                                endReIndexClusterLiner();
                                            }
                                        });
                                        if(i < current_block.tx.length - 1) {
                                            updateBlockTx(++i, current_block);
                                        }
                                    });
                                }
                                updateBlockTx(0, current_block);
                            }).catch(function (err) {
                                console.log('error getting block', err);
                                if (txInsertCount >= Math.floor((to - from)/numCPUs + 1) && txInsertCount >= blockTxLength) {
                                    endReIndexClusterLiner();
                                }
                                txInsertCount++;
                            });
                        }).then(function (time) {
                            console.log('finish getting blocks', time);
                        }).catch(function (err) {
                            console.log('error getting blocks', err);
                            endReIndexClusterLiner();
                        })
                    }).catch(function (err) {
                        console.log('error getting blockCount', err);
                    })
                }
                var endReIndexClusterLiner = function() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startReIndexClusterLiner();
            }
            break;
        case 'updatevinvoutclusterlinear_delete':  // 0:52:3.69 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit()
                    return;
                }
                createFile();

                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.getAll('blockindex', 'desc', 1, function(latestTx) {
                        for (let i = 0; i < numCPUs; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {})
                            if(latestTx.length) {
                                worker.send({blockindex: latestTx[0].blockindex});
                            }
                        }
                    })

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            // deleteFile();
                            console.log('took - ', helpers.getFinishTime(startTime));
                            db.multipleDisconnect();
                            process.exit();
                            // console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });
                }
                startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                var blockindex;
                process.on('message', function(msg) {
                    blockindex = msg.blockindex;
                });
                var startVinVoutClusterLiner = function() {
                    // db.connect(settings[wallet].dbSettings);
                    TxController.count(function(allBlocksCount) {
                        var start = 0;
                        if(blockindex) {
                            start = blockindex;
                        }
                        var offset = Math.ceil(allBlocksCount / numCPUs);
                        var from = start + ((cluster.worker.id - 1) * offset);
                        var to = start + (cluster.worker.id * offset - 1);
                        if (cluster.worker.id === numCPUs || to > allBlocksCount) {
                            to = allBlocksCount;
                        }
                        var limit = offset;
                        var offset = from;
                        if(offset + limit > allBlocksCount) {
                            limit = allBlocksCount - offset + 1;
                        }
                        // console.log('from', from);
                        // console.log('to', to);
                        // console.log('limit', limit);

                        // var allBlocksCount = allTxs.length;
                        // var from = cluster.worker.id - 1;
                        // var to = allBlocksCount;
                        // console.log('from', from);
                        // console.log('to', to);

                        TxController.getAll1('blockindex', 'asc', limit, offset, function(results) {
                            // console.log('results.length', results.length);
                            var checkVinVout = function(index) {
                                var tx = results[index];
                                helpers.prepare_vin_db(wallet, tx).then(function (vin) {
                                    helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
                                        helpers.calculate_total(obj.vout).then(function (total) {
                                            // console.log('results.length', results.length);
                                            // return;
                                            // console.log(tx, nvin, vout, total, addreses_to_update)
                                            var vinvout = {txid: tx.txid, vin: obj.nvin, vout: obj.vout, total: total, blockindex: tx.blockindex};
                                            TxVinVoutController.updateOne(vinvout, function(err) {
                                                if(err) {
                                                    console.log('err', err);
                                                }
                                                console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                                                if(index >= results.length) {
                                                    // console.log('index', index);
                                                    endVinVoutClusterLiner();
                                                }
                                            })
                                            index += 1;
                                            if(index < results.length) {
                                                checkVinVout(index);
                                            }
                                            // resolve({tx: tx, nvin: obj.nvin, vout: obj.vout, total: total, addreses_to_update: addreses_to_update});
                                        })
                                    }).catch(function(err) {
                                        console.log('error getting prepare_vout', err)
                                    })
                                })
                            }
                            if(results.length) {
                                checkVinVout(0);
                            } else {
                                endVinVoutClusterLiner();
                            }
                        });
                    })
                }
                var endVinVoutClusterLiner = function() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startVinVoutClusterLiner();
            }
            break;
        case 'updateAddressesclusterlinear_delete': // 0:33:23.548
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit()
                    return;
                }
                createFile();
                var updateInProgress = false;
                var addresses = [];
                var startUpdateAddressesClusterLinerAll = function() {
                    AddressController.deleteAll(function(err) {
                        for (let i = 0; i < numCPUs; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {
                                if (msg.addreses_to_update) {
                                    startUpdatingAddresses(msg.addreses_to_update)
                                }
                            })
                        }
                    })

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            if (!updateInProgress) {
                                endReindex();
                            }
                            // console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });

                    var startUpdatingAddresses = function(addresses1) {
                        if (!updateInProgress) {
                            addresses = addresses.concat(addresses1);
                            updateInProgress = true;
                            updateAddresses()
                        } else {
                            addresses = addresses.concat(addresses1);
                        }

                    }

                    var updateAddresses = function() {
                        AddressController.updateAddress(addresses[0].address, addresses[0].txid, addresses[0].amount, addresses[0].type, function (err) {
                            console.log('address updated - ', addresses[0].address);
                            if (err) {
                                console.log('address err', err)
                            } else {
                                addresses.shift();
                            }
                            if (addresses.length) {
                                updateAddresses()
                            } else {
                                updateInProgress = false;
                                if (exit_count === numCPUs) {
                                    endReindex();
                                }
                            }
                        })
                    }
                }
                startUpdateAddressesClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                var startUpdateAddressesClusterLiner = function() {
                    // db.connect(settings[wallet].dbSettings);
                    TxVinVoutController.count(function(allBlocksCount) {
                        var start = 0;
                        allBlocksCount = allBlocksCount;
                        var offset = Math.ceil(allBlocksCount / numCPUs);
                        var from = start + ((cluster.worker.id - 1) * offset);
                        // var to = start + (cluster.worker.id * offset - 1);
                        // if (cluster.worker.id === 1 || to > allBlocksCount) {
                        //     to = allBlocksCount;
                        // }
                        var limit = offset;
                        var offset = from;
                        if(offset + limit > allBlocksCount) {
                            limit = allBlocksCount - offset + 1;
                        }
                        console.log('offset', offset);
                        console.log('limit', limit);
                        // return;
                        var count = 0;
                        TxVinVoutController.getAll1('blockindex', 'asc', limit, offset, function(results) {
                            console.log('results.length', results.length)
                            // var totalAddresses = 0;
                            // var updatedAddresses = 0;
                            var UpdateAddresses = function(index) {
                                count++
                                var txVinVout = results[index];
                                // totalAddresses += txVinVout.vin.length;
                                // totalAddresses += txVinVout.vout.length;
                                // console.log('txVinVout', txVinVout)
                                var addreses_to_update = [];
                                for (var i = 0; i < txVinVout.vin.length; i++) {
                                    // TODO update mongodb adress sceme
                                    addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txVinVout.txid, amount: txVinVout.vin[i].amount, type: 'vin'})
                                    // addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                                    // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                                }
                                for (var i = 0; i < txVinVout.vout.length; i++) {
                                    // TODO update mongodb adress sceme
                                    addreses_to_update.push({address: txVinVout.vout[i].addresses, txid: txVinVout.txid, amount: txVinVout.vout[i].amount, type: 'vout'})
                                    // addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                                    // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                                }
                                if(addreses_to_update.length) {
                                    cluster.worker.send({addreses_to_update: addreses_to_update});
                                }
                                console.log('txVinVout.txid', txVinVout.blockindex)
                                index += 1;
                                if(index < results.length) {
                                    setTimeout(function(){
                                        UpdateAddresses(index);
                                    })
                                } else {
                                    console.log('count', count)
                                    endUpdateAddressesClusterLiner();
                                }
                            }
                            if(results.length) {
                                UpdateAddresses(0);
                            } else {
                                endUpdateAddressesClusterLiner();
                            }
                        });
                    })
                }
                var endUpdateAddressesClusterLiner = function() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startUpdateAddressesClusterLiner();
            }
            break;

        case 'reindexclusterlinearsaveaddresses': // 0:33:23.548
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                var addreses_to_update = [];
                startReindex(function(){
                    deleteDb(function(){
                        startReIndexSaveAddressesClusterLinerAll()
                    })
                })

                function startReIndexSaveAddressesClusterLinerAll() {
                    for (let i = 0; i < numCPUs; i++) {
                        var worker = cluster.fork();
                        worker.on('message', function (msg) {
                            if (msg.addreses_to_update) {
                                startUpdatingAddresses(msg.addreses_to_update)
                            }
                        })
                    }

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            if (!updateInProgress) {
                                console.log('local_addreses_before_save', local_addreses_before_save.length);
                                updateDbAddreess(local_addreses_before_save, function(){
                                    endReindex();
                                });
                            }
                            console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });

                    var updateInProgress = false;
                    var countAddressUpdate = 0;
                    var addresses = [];
                    var local_addreses_before_save = [];

                    function startUpdatingAddresses(addresses1) {
                        if (!updateInProgress) {
                            addresses = addresses.concat(addresses1);
                            updateInProgress = true;
                            updateSaveAddress()
                        } else {
                            addresses = addresses.concat(addresses1);
                        }

                    }

                    function updateSaveAddress() {
                        if (addresses.length) {
                            AddressToUpdateController.updateOne(addresses[0], function(err){
                                if(err) {
                                    console.log('err', err)
                                }
                                addresses.shift();
                                if (addresses.length) {
                                    updateSaveAddress();
                                }
                            })
                        } else {
                            updateInProgress = false;
                            if (exit_count === numCPUs) {
                                // TODO need to update address db

                                // updateDbAddreess(local_addreses_before_save, function(){
                                //     endReindex();
                                // });
                            }
                        }
                    }
                }
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                function startReIndexSaveAddressesClusterLiner() {
                    // db.connect(settings[wallet].dbSettings);
                    wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                        var current_cluster_id = cluster.worker.id;
                        var allBlocksCount = blockCount;
                        var from = cluster.worker.id - 1;
                        var to = allBlocksCount;
                        var txInsertCount = 0;
                        var blockTxLength = 0;
                        // console.log('from', from);
                        // console.log('to', to);
                        // console.log('expectedSteps', expectedSteps);
                        // return;
                        var hashes = [];
                        function updateHashSaveAddress(hash) {
                            wallet_commands.getBlock(wallet, hash).then(function (block) {
                                var current_block = JSON.parse(block);

                                function updateBlockTx(i, current_block) {
                                    blockTxLength++;
                                    wallet_commands.getRawTransactionFull(wallet, current_block.tx[i]).then(function (obj) {

                                        var newTx = new Tx({
                                            txid: obj.tx.txid,
                                            vin: obj.nvin,
                                            vout: obj.vout,
                                            total: obj.total.toFixed(8),
                                            timestamp: obj.tx.time,
                                            blockhash: obj.tx.blockhash,
                                            blockindex: current_block.height,
                                        });
                                        // var addreses_to_update = obj.addreses_to_update;
                                        console.log(current_block.height, obj.tx.txid);
                                        var addreses_to_update = obj.addreses_to_update;
                                        for(var i in addreses_to_update) {
                                            addreses_to_update[i].blockindex = current_block.height;
                                        }
                                        // addr_count += addreses_to_update.length;
                                        // if(addreses_to_update.length) {
                                        //     startUpdatingAddresses(addreses_to_update);
                                        // }
                                        cluster.worker.send({addreses_to_update: addreses_to_update});
                                        // addr_count += addreses_to_update.length;
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            // console.log('txInsertCount', txInsertCount)
                                            // console.log('blockTxLength', blockTxLength)
                                            if (i < current_block.tx.length - 1) {
                                                updateBlockTx(++i, current_block);
                                            } else {
                                                hashes.shift();
                                                if (hashes.length) {
                                                    updateHashSaveAddress(hashes[0]);
                                                } else {
                                                    updateHaseStarted = false;
                                                    if(finishGettingBlocks) {
                                                        endReIndexSaveAddressesClusterLiner()
                                                    }
                                                }
                                            }
                                            // console.log('created')
                                        });
                                    }).catch(function (err) {
                                        var newTx = new Tx({
                                            txid: current_block.tx[i],
                                            vin: [],
                                            vout: [],
                                            total: (0).toFixed(8),
                                            timestamp: current_block.time,
                                            blockhash: current_block.hash,
                                            blockindex: current_block.height,
                                        });
                                        // console.log('error getting rawtransaction - ' + current_block.tx[0], err);
                                        console.log(current_block.height, current_block.tx[i]);
                                        // console.log('newTx', newTx)
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            if (i < current_block.tx.length - 1) {
                                                updateBlockTx(++i, current_block);
                                            } else {
                                                hashes.shift();
                                                if (hashes.length) {
                                                    updateHashSaveAddress(hashes[0]);
                                                } else {
                                                    updateHaseStarted = false;
                                                    if(finishGettingBlocks) {
                                                        endReIndexSaveAddressesClusterLiner()
                                                    }
                                                }
                                            }
                                        });
                                    });
                                }

                                updateBlockTx(0, current_block);
                            }).catch(function (err) {
                                console.log('error getting block', err);
                                hashes.shift();
                                if (hashes.length) {
                                    updateHashSaveAddress(hashes[0]);
                                } else {
                                    updateHaseStarted = false;
                                    if(finishGettingBlocks) {
                                        endReIndexSaveAddressesClusterLiner()
                                    }
                                }
                                txInsertCount++;
                            });
                        }
                        var updateHaseStarted = false;
                        var finishGettingBlocks = false;
                        wallet_commands.getAllBlocksClusterLiner(wallet, from, to, numCPUs, function (index, hash) {
                            hashes.push(hash);
                            if(!updateHaseStarted) {
                                updateHaseStarted = true;
                                updateHashSaveAddress(hashes[0]);
                            }
                        }).then(function (time) {
                            finishGettingBlocks = true;
                            console.log('finish getting blocks', time);
                        }).catch(function (err) {
                            console.log('error getting blocks', err);
                            endReIndexSaveAddressesClusterLiner();
                        })
                    }).catch(function (err) {
                        console.log('error getting blockCount', err);
                    })
                }
                function endReIndexSaveAddressesClusterLiner() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startReIndexSaveAddressesClusterLiner();
            }
            break;
        case 'updatemasternodes':
            wallet_commands.getAllMasternodes(wallet).then(function(masternodes) {
                // db.connect(settings[wallet].dbSettings);
                var masternodes = JSON.parse(masternodes);
                console.log('got all masternodes', masternodes.length);
                MasternodeController.deleteAll(function () {
                    if(masternodes.length) {
                        console.log('deleted all');

                        function updateMasternode(i) {
                            MasternodeController.updateOne(masternodes[i], function () {
                                console.log('masernode ' + i + ' updated');
                                if (i < masternodes.length - 1) {
                                    updateMasternode(++i);
                                } else {
                                    db.multipleDisconnect();
                                    process.exit();
                                }
                            })
                        }

                        updateMasternode(0);
                    } else {
                        console.log('no masternodes found');
                        process.exit();
                    }
                })
            }).catch(function(err) {
                console.log('error getting masternodes', err);
            })
            break;
        case 'count': {
            TxController.getAll('blockindex', 'desc', 1000, function(res){
                console.log('res.length', res.length);
                db.multipleDisconnect();
                process.exit();
            })
            break;
        }
        case 'deletevinvout': {
            var startDate = new Date();
            // var fields = {txid: true};
            var fields = {};
            // txid: { type: String, lowercase: true, unique: true, index: true},
            // vin: { type: Array, default: [] },
            // vout: { type: Array, default: [] },
            // timestamp: { type: Number, default: 0 },
            // blockhash: { type: String },
            // blockindex: {type: Number, default: 0, index: true},
            // TxController.getAll2(fields,'blockindex', 'desc', 0, 0, function(results) {
            //     console.log(results[0]);
            //     console.log('took - ', helpers.getFinishTime(startDate))
            //     db.multipleDisconnect();
            //     process.exit();
            // });
            TxVinVoutController.deleteAll(function(numberRemoved) {
                console.log(numberRemoved);
                db.multipleDisconnect();
                process.exit();
            })
            break;
        }
        case 'updatepeers': {
            PeerController.deleteAll(function(numberRemoved) {
                wallet_commands.getPeerInfo(wallet).then(function(results){
                    var results = JSON.parse(results);
                    var updatePeer = function(i) {
                        var address = results[i].addr.split(':')[0];
                        request({uri: 'http://freegeoip.app/json/' + address, json: true}, function (error, response, geo) {
                            var peer = {
                                address: address,
                                protocol: results[i].version,
                                version: results[i].subver.replace('/', '').replace('/', ''),
                                country: geo.country_name,
                                lastactivity: Math.max(results[i].lastrecv, results[i].lastsend),
                                connectiontime: results[i].conntime,
                            }
                            PeerController.updateOne(peer, function(err) {
                                if(err) {
                                    console.log(err)
                                }
                                console.log('updated peer', peer.address);
                                i++;
                                if (i < results.length - 1) {
                                    updatePeer(i)
                                } else {
                                    end();
                                }
                            });
                        });
                    }

                    var end = function() {
                        db.multipleDisconnect();
                        process.exit()
                    }
                    if(results.length) {
                        updatePeer(0);
                    } else {
                        end();
                    }
                }).catch(function(err){
                    console.log(err);
                    end();
                });
            })
            break;
        }
        case 'killall': {
            findProccessCount().then(function(count){
                if(count) {
                    killAll();
                    deleteFile();
                    console.log('killed ' + count + ' process');
                }
            }).catch(function(err) {

            });
            break;
        }
        default:
            console.log('command not allowed or not exist')
    }
}

function startReindex(onEnd) { // creating file to block other process and reseting database
    if(fileExist()) {
        console.log('update in progress');
        forceProcess(function(){
            killPidFromFile();
            deleteFile();
            createFile();
            // db.connect(settings[wallet].dbSettings);
            onEnd();
        }, function(){
            db.multipleDisconnect();
        })
    } else {
        createFile();
        // db.connect(settings[wallet].dbSettings);
        onEnd()
    }
}

function deleteDb(onEnd) {
    TxController.deleteAll(function(numberRemoved) {
        console.log(numberRemoved);
        TxVinVoutController.deleteAll(function(numberRemoved) {
            AddressController.deleteAll(function (numberRemoved) {
                console.log(numberRemoved);
                var obj = {
                    coin: settings[wallet].coin,
                    received: [],
                    balance: [],
                }
                RichlistController.updateOne(obj, function (err, obj) {
                    if (err) {
                        console.log(err);
                    }
                    StatsController.update(settings[wallet].coin, {last: 0}, function (err) {
                        if (err) {
                            console.log(err)
                        }
                        onEnd();
                    });
                })
            })
        });
    });
}

function deleteDbFrom(blockindex, onEnd) {
    TxController.deleteAllWhereGte(blockindex, function(numberRemoved) {
        console.log(numberRemoved);
        TxVinVoutController.deleteAllWhereGte(blockindex, function(numberRemoved) {
            AddressController.deleteAll(function (numberRemoved) {
                console.log(numberRemoved);
                var obj = {
                    coin: settings[wallet].coin,
                    received: [],
                    balance: [],
                }
                RichlistController.updateOne(obj, function (err, obj) {
                    if (err) {
                        console.log(err);
                    }
                    StatsController.update(settings[wallet].coin, {last: 0}, function (err) {
                        if (err) {
                            console.log(err)
                        }
                        onEnd();
                    });
                })
            })
        });
    });
}

function updateDbAddreess(addresses, onEnd) {
    if(addresses.length) {
        // console.log('addresses[0]', addresses[0]);
        AddressController.updateOne({
            a_id: addresses[0].a_id,
            txs: addresses[0].txs,
            received: addresses[0].received,
            balance: addresses[0].balance
        }, function (err) {
            if (err) {
                console.log('address err', err)
            } else {
                console.log('updated address', addresses[0].a_id);
                addresses.shift();
            }
            if (addresses.length) {
                updateDbAddreess(addresses, onEnd)
            } else {
                onEnd();
            }
        })
    } else {
        onEnd();
    }
}

function endCluster() {
    db.multipleDisconnect();
    process.exit();
}

function endReindex() {
    RichlistController.getOne(settings[wallet].coin, function(richlist) {
        AddressController.getRichlist('received', 'desc', 100, function(received){
            AddressController.getRichlist('balance', 'desc', 100, function(balance){
                richlist.received = received.map(function(o){ return {received: o.received, a_id: o.a_id}});
                richlist.balance = balance.map(function(o){ return {balance: o.balance, a_id: o.a_id}});
                RichlistController.updateOne(richlist, function(err) {
                    console.log(err)
                    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                        // console.log('latestTx', latestTx);
                        console.log('settings[wallet].coin', settings[wallet].coin);
                        if(latestTx.length) {
                            StatsController.update(settings[wallet].coin, {last: latestTx[0].blockindex}, function (err) {
                                if (err) {
                                    console.log(err)
                                }
                                console.log('reindex cluster complete - ', latestTx[0].blockindex);
                                console.log('took - ', helpers.getFinishTime(startTime));
                                deleteFile();
                                db.multipleDisconnect();
                                process.exit();
                            });
                        } else {
                            console.log('reindex no blocks found');
                            deleteFile();
                            db.multipleDisconnect();
                            process.exit();
                        }

                    })
                })
            })
        })
    })
}


var gettingNextBlocks = function(limit, offset) {
    var promise = new Promise(function(resolve, reject) {
        getNextBlocks(limit, offset).then(function (res) {
            if (res.length) {
                console.log('got chunks', (offset * limit) + ' - ' + (offset * limit + limit));
                // currentBlocks = currentBlocks.concat(res);
                resolve(res);
                // gettingNextBlocks();
            } else {
                console.log('finish getting chunks', offset);
            }
            resolve();
        });
    });
    return promise;
}

var startCount = 0;

// countBlocks 388143
// took  0:5:54.26

var getNextBlocks = function(limit, offset) {
    var promise = new Promise(function(resolve, reject) {
        TxController.getAll2({},'blockindex', 'asc', limit, offset * limit, function(results) {
            // if(startCount < 1) {
            //     startCount++;
            //     resolve(results);
            // } else {
            //     resolve([]);
            // }
            resolve(results);
        });
    });
    return promise;
}
var gettingNextBlocksVinVout = function(limit, offset) {
    var promise = new Promise(function(resolve, reject) {
        getNextBlocksVinVout(limit, offset).then(function (res) {
            if (res.length) {
                console.log('got chunks', (offset * limit) + ' - ' + (offset * limit + limit));
                // currentBlocks = currentBlocks.concat(res);
                resolve(res);
                // gettingNextBlocks();
            } else {
                console.log('finish getting chunks', offset);
            }
            resolve();
        });
    });
    return promise;
}

var startCount = 0;

// countBlocks 388143
// took  0:5:54.26

var getNextBlocksVinVout = function(limit, offset) {
    var promise = new Promise(function(resolve, reject) {
        TxVinVoutController.getAll2({},'blockindex', 'asc', limit, offset * limit, function(results) {
            // if(startCount < 1) {
            //     startCount++;
            //     resolve(results);
            // } else {
            //     resolve([]);
            // }
            resolve(results);
        });
    });
    return promise;
}
function forceProcess(onYes, onNo) {
    console.log('would you like to force reindex');
    console.log('Y/N');
    process.stdin.on("data", function(d) {
        if(d.toString().trim().toLowerCase() === 'y') {
            process.stdin.pause();
            if(typeof onYes === 'function') {
                onYes()
            }
        }
        else if(d.toString().trim().toLowerCase() === 'n') {
            process.stdin.pause();
            if(typeof onNo === 'function') {
                onNo()
            }
        } else {
            console.log('please write Y or N')
        }
    });
}

function killAll() {
    exec('ps -ef | grep \'sync.js\' | grep -v grep | awk \'{print $2}\' | xargs -r kill -9');
}
function findProccessCount() {
    var promise = new Promise(function(resolve, reject) {
        exec('ps aux | grep -i "sync.js ' + wallet + '" |  wc -l',(err, stdout, stderr) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(stdout - 3)
        });
    });
    return promise;
}
// example commands

// node /var/www/html/server/sync.js fix startwallet

// node /var/www/html/server/sync.js fix getblockcount

// node /var/www/html/server/sync.js fix getblock 000000428366d3a156c38c5061d74317d201781f539460aeeeaae1091de6e4cc

// node /var/www/html/server/sync.js fix getblockhash 0

// node /var/www/html/server/sync.js fix getallblockscluster

// node /var/www/html/server/sync.js fix getallblocksdetailscluster

// node /var/www/html/server/sync.js fix getalltxblockscluster

// node /var/www/html/server/sync.js fix getalltxblocksfullcluster

// node /var/www/html/server/sync.js fix getrawtransaction 8b74395a7c2f4036e4eaba8d84388d5fbc9435b87aea3e89ae3529e4bfeb5a5e

// node /var/www/html/server/sync.js fix listmasternodes

// node /var/www/html/server/sync.js fix getmasternodecount

// node /var/www/html/server/sync.js fix reindexcluster


