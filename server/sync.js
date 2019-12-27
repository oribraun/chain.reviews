const wallet_commands = require('./wallet_commands');
const helpers = require('./helpers');
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
    'updatecluster',
    'updateclusterlinear',
    'updatemasternodes',
    'count',
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
                        function startUpdatingAddresses(addresses1) {
                            if(!updateInProgress) {
                                addresses = addresses.concat(addresses1);
                                updateInProgress = true;
                                sumAddresses()
                            } else {
                                addresses = addresses.concat(addresses1);
                            }

                        }

                        function sumAddresses() {
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
                                        helpers.is_unique(address.txs, addresses[0].txid).then(function (unique, index) {
                                            var tx_array = address.txs;
                                            var received = address.received;
                                            var sent = address.sent;
                                            if (type == 'vin') {
                                                sent = sent + addresses[0].amount;
                                            } else {
                                                received = received + addresses[0].amount;
                                            }
                                            if (unique == true) {
                                                tx_array.push({addresses: addresses[0].txid, type: addresses[0].type});
                                                address.txs = tx_array
                                                address.received = received;
                                                address.sent = sent;
                                                address.balance = received - sent;
                                                local_addreses_before_save[i] = address;
                                                addresses.shift();
                                                sumAddresses();

                                            } else {
                                                if (addresses[0].type !== tx_array[index].type) {
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
        case 'update': // 0:27:35.915
            if(fileExist()) {
                console.log('reindex is in progress');
                process.exit()
                return;
            }
            createFile();
            // db.connect(settings[wallet].dbSettings);
            var startTime = new Date();
            function startUpdate() {
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
                        var blockTxLength = 0;
                        var updateInProgress = false;
                        var addresses = [];
                        var local_addreses_before_save = [];

                        function startUpdatingAddresses(addresses1) {
                            if(!updateInProgress) {
                                addresses = addresses.concat(addresses1);
                                updateInProgress = true;
                                sumAddresses()
                            } else {
                                addresses = addresses.concat(addresses1);
                            }

                        }

                        function sumAddresses() {
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
                                        helpers.is_unique(address.txs, addresses[0].txid).then(function (unique, index) {
                                            var tx_array = address.txs;
                                            var received = address.received;
                                            var sent = address.sent;
                                            if (type == 'vin') {
                                                sent = sent + addresses[0].amount;
                                            } else {
                                                received = received + addresses[0].amount;
                                            }
                                            if (unique == true) {
                                                tx_array.push({addresses: addresses[0].txid, type: addresses[0].type});
                                                address.txs = tx_array
                                                address.received = received;
                                                address.sent = sent;
                                                address.balance = received - sent;
                                                local_addreses_before_save[i] = address;
                                                addresses.shift();
                                                sumAddresses();

                                            } else {
                                                if (addresses[0].type !== tx_array[index].type) {
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
        case 'reindexcluster_old': // 0:28:16.967
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                var addreses_to_update = [];
                if(fileExist()) {
                    console.log('update in progress');
                    forceProcess(function(){
                        killPidFromFile();
                        deleteFile();
                        createFile();
                        // db.connect(settings[wallet].dbSettings);
                        deleteDb(startReIndexClusterAll);
                    }, function(){
                        db.multipleDisconnect();
                    })
                    return;
                }
                createFile();

                // Fork workers.
                // db.connect(settings[wallet].dbSettings);
                deleteDb(startReIndexClusterAll);

                function startReIndexClusterAll() {
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
                                endReIndexClusterAll();
                            }
                            console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });

                    var updateInProgress = false;
                    var countAddressUpdate = 0;
                    var addresses = [];

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
                                if (exit_count === numCPUs) {
                                    endReIndexClusterAll();
                                }
                                console.log('countAddressUpdate', countAddressUpdate);
                            }
                        })
                    }
                }

                function endReIndexClusterAll() {
                    RichlistController.getOne(settings[wallet].coin, function(richlist) {
                        AddressController.getRichlist('received', 'desc', 100, function(received){
                            AddressController.getRichlist('balance', 'desc', 100, function(balance){
                                richlist.received = received;
                                richlist.balance = balance;
                                RichlistController.updateOne(richlist, function(err) {
                                    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                                        console.log('latestTx', latestTx);
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
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                function startReIndexCluster() {
                    // db.connect(settings[wallet].dbSettings);
                    wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                        var current_cluster_id = cluster.worker.id;
                        var allBlocksCount = blockCount;
                        var offset = Math.ceil(allBlocksCount / numCPUs);
                        var from = (cluster.worker.id - 1) * offset;
                        var to = cluster.worker.id * offset - 1;
                        if (cluster.worker.id === numCPUs || to > allBlocksCount) {
                            to = allBlocksCount;
                        }
                        var txInsertCount = 0;
                        var blockTxLength = 0;

                        wallet_commands.getAllBlocksCluster(wallet, from, to, function (index, hash) {
                            wallet_commands.getBlock(wallet, hash).then(function (block) {
                                var current_block = JSON.parse(block);
                                for(var i = 0; i < current_block.tx.length; i++) {
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
                                        cluster.worker.send({addreses_to_update: addreses_to_update});
                                        // addr_count += addreses_to_update.length;
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            // for(var i = 0; i < addreses_to_update.length; i++) {
                                            //     (function(i){
                                            //         setTimeout(function(){
                                            //             AddressController.updateAddress1(addreses_to_update[i].address, addreses_to_update[i].txid, addreses_to_update[i].amount, addreses_to_update[i].type, function (err) {
                                            //                 if(err) {
                                            //                     console.log('address err', err)
                                            //                 }
                                            //                 addr_count--;
                                            //                 if(tx_count === to - from + 1 && !addr_count) {
                                            //                     // TODO update richlist
                                            //                     process.exit();
                                            //                 }
                                            //             })
                                            //         });
                                            //     })(i)
                                            // }
                                            if (txInsertCount >= blockTxLength && txInsertCount >= to - from + 1) {
                                                endReIndexCluster();
                                            }
                                            // console.log('created')
                                        });
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
                                            if (txInsertCount >= blockTxLength && txInsertCount >= to - from + 1) {
                                                endReIndexCluster();
                                            }
                                        });
                                    });
                                }
                            }).catch(function (err) {
                                console.log('error getting block', err);
                                if (txInsertCount >= blockTxLength && txInsertCount >= to - from + 1) {
                                    endReIndexCluster();
                                }
                                txInsertCount++;
                            });
                        }).then(function (time) {
                            console.log('finish getting blocks', time);
                        }).catch(function (err) {
                            console.log('error getting blocks', err);
                            endReIndexCluster();
                        })
                    }).catch(function (err) {
                        console.log('error getting blockCount', err);
                    })
                }
                function endReIndexCluster() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startReIndexCluster();
            }
            break;
        case 'reindexclusterlinear': // 0:33:23.548
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                var addreses_to_update = [];
                startReindex(function(){
                    deleteDb(function(){
                        startReIndexClusterLinerAll()
                    })
                })

                function startReIndexClusterLinerAll() {
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
                            sumClusterAddresses()
                        } else {
                            addresses = addresses.concat(addresses1);
                        }

                    }

                    function sumClusterAddresses() {
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
                                    sumClusterAddresses();
                                } else {
                                    helpers.is_unique(address.txs, addresses[0].txid).then(function (unique, index) {
                                        var tx_array = address.txs;
                                        var received = address.received;
                                        var sent = address.sent;
                                        if (type == 'vin') {
                                            sent = sent + addresses[0].amount;
                                        } else {
                                            received = received + addresses[0].amount;
                                        }
                                        if (unique == true) {
                                            tx_array.push({addresses: addresses[0].txid, type: addresses[0].type});
                                            address.txs = tx_array
                                            address.received = received;
                                            address.sent = sent;
                                            address.balance = received - sent;
                                            local_addreses_before_save[i] = address;
                                            addresses.shift();
                                            sumClusterAddresses();

                                        } else {
                                            if (addresses[0].type !== tx_array[index].type) {
                                                address.txs = tx_array
                                                address.received = received;
                                                address.sent = sent;
                                                address.balance = received - sent;
                                                local_addreses_before_save[i] = address;
                                            }
                                            addresses.shift();
                                            sumClusterAddresses();
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
                                sumClusterAddresses();
                            }
                        } else {
                            updateInProgress = false;
                            if (exit_count === numCPUs) {
                                console.log('local_addreses_before_save', local_addreses_before_save.length);
                                updateDbAddreess(local_addreses_before_save, function(){
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
                        //             endReindex();
                        //         }
                        //         console.log('countAddressUpdate', countAddressUpdate);
                        //     }
                        // })
                    }
                }
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                function startReIndexClusterLiner() {
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
                function endReIndexClusterLiner() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startReIndexClusterLiner();
            }
            break;
        case 'updatecluster_old': // 0:28:16.967
            if (cluster.isMaster) {
                var startTime = new Date();
                if(fileExist()) {
                    console.log('reindex is in progress');
                    process.exit()
                    return;
                }
                createFile();
                console.log(`Master ${process.pid} is running`);
                var addreses_to_update = [];
                // Fork workers.
                var updateAddressInProgress = false;

                function startUpdateClusterAll() {
                    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                        for (let i = 0; i < numCPUs; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {
                                if (msg.addreses_to_update) {
                                    startUpdatingAddresses(msg.addreses_to_update)
                                }
                            })
                            if(latestTx.length) {
                                worker.send({blockindex: latestTx[0].blockindex});
                            }
                        }
                    });

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            if (!updateInProgress) {
                                endUpdateClusterAll();
                            }
                            console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });

                    var updateInProgress = false;
                    var countAddressUpdate = 0;
                    var addresses = [];

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
                                if (exit_count === numCPUs) {
                                    endUpdateClusterAll();
                                }
                                console.log('countAddressUpdate', countAddressUpdate);
                            }
                        })
                    }
                }

                function endUpdateClusterAll() {
                    RichlistController.getOne(settings[wallet].coin, function(richlist) {
                        AddressController.getRichlist('received', 'desc', 100, function(received){
                            AddressController.getRichlist('balance', 'desc', 100, function(balance){
                                richlist.received = received;
                                richlist.balance = balance;
                                RichlistController.updateOne(richlist, function(err) {
                                    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                                        console.log('latestTx', latestTx);
                                        if(latestTx.length) {
                                            StatsController.update(settings[wallet].coin, {last: latestTx[0].blockindex}, function (err) {
                                                if (err) {
                                                    console.log(err)
                                                }
                                                console.log('update cluster complete - ', latestTx[0].blockindex);
                                                console.log('took - ', helpers.getFinishTime(startTime));
                                                deleteFile();
                                                db.multipleDisconnect();
                                                process.exit();
                                            });
                                        } else {
                                            console.log('update no blocks found');
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
                // db.connect(settings[wallet].dbSettings);
                startUpdateClusterAll();
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                var blockindex;
                process.on('message', function(msg) {
                    blockindex = msg.blockindex;
                });
                function startUpdateCluster() {
                    // db.connect(settings[wallet].dbSettings);
                    wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                        var current_cluster_id = cluster.worker.id;
                        var allBlocksCount = blockCount;
                        var start = 0;
                        if(blockindex) {
                            start = blockindex + 1;
                        }
                        var offset = Math.ceil(allBlocksCount / numCPUs);
                        var from = start + ((cluster.worker.id - 1) * offset);
                        var to = start + (cluster.worker.id * offset - 1);
                        if (cluster.worker.id === numCPUs || to > allBlocksCount) {
                            to = allBlocksCount;
                        }
                        var txInsertCount = 0;
                        var blockTxLength = 0;

                        wallet_commands.getAllBlocksCluster(wallet, from, to, function (index, hash) {
                            wallet_commands.getBlock(wallet, hash).then(function (block) {
                                var current_block = JSON.parse(block);
                                for(var i = 0; i < current_block.tx.length; i++) {
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
                                        cluster.worker.send({addreses_to_update: addreses_to_update});
                                        // addr_count += addreses_to_update.length;
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            // for(var i = 0; i < addreses_to_update.length; i++) {
                                            //     (function(i){
                                            //         setTimeout(function(){
                                            //             AddressController.updateAddress1(addreses_to_update[i].address, addreses_to_update[i].txid, addreses_to_update[i].amount, addreses_to_update[i].type, function (err) {
                                            //                 if(err) {
                                            //                     console.log('address err', err)
                                            //                 }
                                            //                 addr_count--;
                                            //                 if(tx_count === to - from + 1 && !addr_count) {
                                            //                     // TODO update richlist
                                            //                     process.exit();
                                            //                 }
                                            //             })
                                            //         });
                                            //     })(i)
                                            // }
                                            if (txInsertCount >= blockTxLength && txInsertCount >= to - from + 1) {
                                                endUpdateCluster();
                                            }
                                            // console.log('created')
                                        });
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
                                            if (txInsertCount >= blockTxLength && txInsertCount >= to - from + 1) {
                                                endUpdateCluster();
                                            }
                                        });
                                    });
                                }
                            }).catch(function (err) {
                                console.log('error getting block', err);
                                if (txInsertCount >= blockTxLength && txInsertCount >= to - from + 1) {
                                    endUpdateCluster();
                                }
                                txInsertCount++;
                            });
                        }).then(function (time) {
                            console.log('finish getting blocks', time);
                        }).catch(function (err) {
                            console.log('error getting blocks', err);
                            endUpdateCluster();
                        })
                    }).catch(function (err) {
                        console.log('error getting blockCount', err);
                    })
                }
                function endUpdateCluster() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startUpdateCluster();
            }
            break;
        case 'updateclusterlinear_old': // 0:28:16.967
            if (cluster.isMaster) {
                var startTime = new Date();
                if(fileExist()) {
                    console.log('reindex is in progress');
                    process.exit()
                    // forceProcess(function(){
                    //     killPidFromFile();
                    //     deleteFile();
                    //     createFile();
                    //     db.connect(settings[wallet].dbSettings);
                    //     startUpdateClusterLinerAll();
                    // })
                    return;
                }
                createFile();
                console.log(`Master ${process.pid} is running`);
                var addreses_to_update = [];
                // Fork workers.
                var updateAddressInProgress = false;
                function startUpdateClusterLinerAll() {
                    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                        for (let i = 0; i < numCPUs; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {
                                if (msg.addreses_to_update) {
                                    startUpdatingAddresses(msg.addreses_to_update)
                                }
                            })
                            if(latestTx.length) {
                                worker.send({blockindex: latestTx[0].blockindex});
                            }
                        }
                    });

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === numCPUs) {
                            if (!updateInProgress) {
                                endUpdateClusterLinerAll();
                            }
                            console.log('addreses_to_update', addreses_to_update.length)
                        }
                        console.log(`worker ${worker.process.pid} died`);
                    });

                    var updateInProgress = false;
                    var countAddressUpdate = 0;
                    var addresses = [];

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
                                if (exit_count === numCPUs) {
                                    endUpdateClusterLinerAll();
                                }
                                console.log('countAddressUpdate', countAddressUpdate);
                            }
                        })
                    }
                }

                function endUpdateClusterLinerAll() {
                    RichlistController.getOne(settings[wallet].coin, function(richlist) {
                        AddressController.getRichlist('received', 'desc', 100, function(received){
                            AddressController.getRichlist('balance', 'desc', 100, function(balance){
                                richlist.received = received;
                                richlist.balance = balance;
                                RichlistController.updateOne(richlist, function(err) {
                                    TxController.getAll('blockindex', 'desc', 10, function(latestTx) {
                                        // console.log('latestTx', latestTx);
                                        if(latestTx.length) {
                                            StatsController.update(settings[wallet].coin, {last: latestTx[0].blockindex}, function (err) {
                                                if (err) {
                                                    console.log(err)
                                                }
                                                console.log('update cluster complete - ', latestTx[0].blockindex);
                                                console.log('took - ', helpers.getFinishTime(startTime));
                                                deleteFile();
                                                db.multipleDisconnect();
                                                process.exit();
                                            });
                                        } else {
                                            console.log('update no blocks found');
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
                // db.connect(settings[wallet].dbSettings);
                startUpdateClusterLinerAll();
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                var blockindex;
                process.on('message', function(msg) {
                    blockindex = msg.blockindex;
                });
                function startUpdateClusterLiner() {
                    // db.connect(settings[wallet].dbSettings);
                    wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                        var current_cluster_id = cluster.worker.id;
                        var allBlocksCount = blockCount;
                        var start = 0;
                        if(blockindex) {
                            start = blockindex + 1;
                        }
                        var from = start + cluster.worker.id - 1;
                        var to = allBlocksCount;
                        var txInsertCount = 0;
                        var blockTxLength = 0;

                        // console.log('from', from);
                        // console.log('to', to);
                        // console.log('blockindex', blockindex);
                        // return;

                        wallet_commands.getAllBlocksClusterLiner(wallet, from, to, numCPUs, function (index, hash) {
                            wallet_commands.getBlock(wallet, hash).then(function (block) {
                                var current_block = JSON.parse(block);
                                for(var i = 0; i < current_block.tx.length; i++) {
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
                                        cluster.worker.send({addreses_to_update: addreses_to_update});
                                        // addr_count += addreses_to_update.length;
                                        TxController.updateOne(newTx, function (err) {
                                            txInsertCount++;
                                            if (err) {
                                                console.log('err', err);
                                            }
                                            if (txInsertCount >= Math.floor((to - from)/numCPUs + 1) && txInsertCount >= blockTxLength) {
                                                endUpdateClusterLiner();
                                            }
                                            // console.log('created')
                                        });
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
                                            if (txInsertCount >= Math.floor((to - from)/numCPUs + 1) && txInsertCount >= blockTxLength) {
                                                endUpdateClusterLiner();
                                            }
                                        });
                                    });
                                }
                            }).catch(function (err) {
                                console.log('error getting block', err);
                                if (txInsertCount >= Math.floor((to - from)/numCPUs + 1) && txInsertCount >= blockTxLength) {
                                    endUpdateClusterLiner();
                                }
                                txInsertCount++;
                            });
                        }).then(function (time) {
                            console.log('finish getting blocks', time);
                        }).catch(function (err) {
                            console.log('error getting blocks', err);
                            endUpdateClusterLiner();
                        })
                    }).catch(function (err) {
                        console.log('error getting blockCount', err);
                    })
                }
                function endUpdateClusterLiner() {
                    db.multipleDisconnect();
                    process.exit();
                }
                startUpdateClusterLiner();
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
            deleteDb(onEnd);
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
        AddressController.deleteAll(function(numberRemoved) {
            console.log(numberRemoved);
            var obj = {
                coin: settings[wallet].coin,
                received: [],
                balance: [],
            }
            RichlistController.updateOne(obj, function(err, obj) {
                if(err) {
                    console.log(err);
                }
                StatsController.update(settings[wallet].coin, {last: 0}, function(err) {
                    if(err) {
                        console.log(err)
                    }
                    onEnd();
                });
            })
        })
    });
}

function updateDbAddreess(addresses, onEnd) {
    AddressController.updateOne({a_id: addresses[0].a_id, txs: addresses[0].txs, received: addresses[0].received, balance: addresses[0].balance}, function (err) {
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
}

function endCluster() {
    db.multipleDisconnect();
    process.exit();
}

function endReindex() {
    RichlistController.getOne(settings[wallet].coin, function(richlist) {
        AddressController.getRichlist('received', 'desc', 100, function(received){
            AddressController.getRichlist('balance', 'desc', 100, function(balance){
                richlist.received = received;
                richlist.balance = balance;
                RichlistController.updateOne(richlist, function(err) {
                    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                        console.log('latestTx', latestTx);
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


