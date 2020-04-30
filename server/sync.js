const wallet_commands = require('./wallet_commands');
const helpers = require('./helpers');
const request = require('request');
const cluster = require('cluster');
const fs = require('fs-extra');
const exec = require('child_process').exec;
const numCPUs = require('os').cpus().length;
const tx_types = require('./tx_types');

const db = require('./database/db');
const settings = require('./wallets/all_settings');

var newCapitalMarket = require('./database/markets/new.capital');

var wallet = process.argv[2];
var type = process.argv[3];
var hash_number = process.argv[4];

var commands_require_db = [
    'save_tx',
    'save_tx_vin_vout_and_addresses',
    'reindex_addresses',

    'update_tx',
    'update_tx_vin_vout_and_addresses',

    'save_from_tx',
    'save_from_tx_vin_vout_and_addresses',
    'save_tx_vin_vout_and_addresses_based_on_latest',

    'delete_from',

    'save_tx_linear',
    'reindex_block_only_from',

    'update_address_type',
    'update_address_type_timestamp',
    'update_tx_vin_vout_type',
    'update_tx_vin_vout_order',
    'updatemasternodes',
    'updatepeers',

    'updatestats',
    'updateextrastats',
    'updaterichlist',
    'updaterichlistandextrastats',
    'updatemarket',
    'updatetxbyday',
    'test',
    'find_unconfirmed',
    'find_missing_blocks',
]
if(settings[wallet]) {
    if(commands_require_db.indexOf(type) > -1) {
        db.connect2(wallet, settings[wallet].dbSettings, function() {
            if(cluster.worker) {
                cluster.worker.send({mongoTimeout: true});
            }
            deleteFile();
            deleteFile('mn');
            deleteFile('peers');
            process.exit(1);
        });
        db.setCurrentConnection(wallet);
        var Tx = require('./database/models/tx')[db.getCurrentConnection()];
        var Block = require('./database/models/block')[db.getCurrentConnection()];
        var TxController = require('./database/controllers/tx_controller');
        var BlockController = require('./database/controllers/block_controller');
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
        var MarketController = require('./database/controllers/markets_controller');
        var CoinMarketCapController = require('./database/controllers/coin_market_cap_controller');
        var TxByDayController = require('./database/controllers/tx_by_day_controller');

    }
} else {
    if(type != 'killall') {
        console.log('no wallet found');
        process.exit();
    }
}

// console.log('wallet', wallet)
// console.log('type', type)
// console.log('hash_number', hash_number)

// var path = __dirname + '/../' + wallet + 'InProgress.pid';
// var mn_path = __dirname + '/../' + wallet + 'MasternodesInProgress.pid';
// var peers_path = __dirname + '/../' + wallet + 'PeersInProgress.pid';
// var address_path = __dirname + '/../' + wallet + 'AddressInProgress.pid';
// var txByDay_path = __dirname + '/../' + wallet + 'TxByDayInProgress.pid';
// var market_path = __dirname + '/../' + wallet + 'MarketInProgress.pid';
function ucFirst(string) {
    if(string && string.length) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    } else {
        return string;
    }
}
function fileExist(type) {
    // console.log(path)
    if(!type) {
        type = "";
    }
    var p = __dirname + '/../' + wallet +  ucFirst(type) + 'InProgress.pid';
    return fs.existsSync(p);
}
function createFile(type) {
    if(!type) {
        type = "";
    }
    var p = __dirname + '/../' + wallet +  ucFirst(type) + 'InProgress.pid';
    fs.writeFileSync(p, process.pid);
}
function readFile(type) {
    if(!type) {
        type = "";
    }
    var p = __dirname + '/../' + wallet +  ucFirst(type) + 'InProgress.pid';
    return fs.readFileSync(p);
}
function killPidFromFile() {
    var pid = readFile();
    try {
        process.kill(pid);
    } catch(e) {
        console.log('no pid process found')
    }
}
function deleteFile(type) {
    if(!type) {
        type = "";
    }
    var p = __dirname + '/../' + wallet +  ucFirst(type) + 'InProgress.pid';
    console.log('trying to delete - ', p)
    if(fileExist(type)) {
        try {
            fs.unlinkSync(p);
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
                process.exit();
            });
            break;
        case 'stopwallet':
            wallet_commands.stopWallet(wallet).then(function(results){
                console.log('results', results);
            }).catch(function(err) {
                console.log('error stopping wallet', err);
                process.exit();
            });
            break;
        case 'getblockcount':
            wallet_commands.getBlockCount(wallet).then(function(blockCount){
                console.log('blockCount', blockCount);
            }).catch(function(err) {
                console.log('error getting blockCount', err);
                process.exit();
            });
            break;
        case 'getinfo':
            wallet_commands.getInfo(wallet).then(function(blockCount){
                console.log('blockCount', blockCount);
            }).catch(function(err) {
                console.log('error getting blockCount', err);
                process.exit();
            });
            break;
        case 'getblock':
            if(hash_number != undefined && hash_number) {
                wallet_commands.getBlock(wallet, hash_number).then(function (block) {
                    console.log('block', JSON.parse(block));
                }).catch(function (err) {
                    console.log('error getting block', err);
                    process.exit();
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
                    process.exit();
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
                    process.exit();
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
                    process.exit();
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
                    process.exit();
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
                process.exit();
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
                    process.exit();
                })
            }
            break;
        case 'getrawtransaction':
            if(hash_number != undefined && hash_number) {
                wallet_commands.getRawTransaction(wallet, hash_number).then(function (rawtransaction) {
                    console.log('rawtransaction', JSON.parse(rawtransaction));
                }).catch(function (err) {
                    console.log('error getting rawtransaction', err);
                    process.exit();
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
                    process.exit();
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
                process.exit();
            })
            break;
        case 'getmasternodecount':
            wallet_commands.getMasternodeCount(wallet).then(function(masternodecount) {
                console.log('masternode count', JSON.parse(masternodecount));
            }).catch(function(err) {
                console.log('error getting masternode count', err);
                process.exit();
            })
            break;

        case 'save_tx': // 0:52:3.69 - block count 149482
            if (cluster.isMaster) {
                wallet_commands.getBlockCount(wallet).then(function (allBlocksCount) {
                    // allBlocksCount = 152939;
                    var startTime = new Date();
                    console.log(`Master ${process.pid} is running`);
                    startReindex(function(){
                        deleteDb(function(){
                            startReIndexClusterLinerAll()
                        })
                    })
                    var currentBlock = 0;
                    var walletDisconnected = false;
                    var mongoTimeout = false;
                    var workersBlocksMap = {};
                    var startReIndexClusterLinerAll = function() {
                        for (let i = 0; i < numCPUs; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {
                                if (msg.finished) {
                                    (function(id, block){
                                        if(block <= allBlocksCount ) {
                                            workersBlocksMap[id] = block;
                                            cluster.workers[id].send({blockNum: block});
                                        } else {
                                            cluster.workers[id].send({kill: true});
                                        }
                                    })(this.id, currentBlock++)
                                }
                                if (msg.blockNotFound) {
                                    cluster.workers[this.id].send({kill: true});
                                }
                                if (msg.walletDisconnected) {
                                    walletDisconnected = true;
                                    cluster.workers[this.id].send({kill: true});
                                }
                                if (msg.mongoTimeout) {
                                    mongoTimeout = true;
                                    for(var id in cluster.workers) {
                                        cluster.workers[id].send({kill: true});
                                    }
                                }
                            })
                            var exit_count = 0;
                            worker.on('exit', (code, signal) => {
                                exit_count++;
                                if (exit_count === numCPUs) {
                                    var exit_code = 0;
                                    if(walletDisconnected) {
                                        console.log('\n*******************************************************************');
                                        console.log('******wallet was disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                        console.log('*******************************************************************\n');
                                        exit_code = 1;
                                    }
                                    if(mongoTimeout) {
                                        console.log('\n*******************************************************************');
                                        console.log('******mongodb has disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                        console.log('*******************************************************************\n');
                                        exit_code = 1;
                                    }
                                    console.log('took - ', helpers.getFinishTime(startTime));
                                    deleteFile();
                                    db.multipleDisconnect();
                                    process.exit(exit_code);
                                }
                                // console.log(`workers.length`, cluster.workers.length);
                                console.log(`worker ${worker.process.pid} died`);
                            });
                            if(currentBlock <= allBlocksCount ) {
                                worker.send({blockNum: currentBlock});
                                currentBlock++;
                            } else {
                                worker.send({kill: true});
                            }
                        }
                    }
                }).catch(function(err) {
                    console.log('error getting block count', err);
                    if(err && err.toString().indexOf("couldn't connect to server") > -1) {
                        console.log('\n*******************************************************************');
                        console.log('******wallet disconnected please make sure wallet has started******');
                        console.log('*******************************************************************\n');
                    }
                    deleteFile();
                    db.multipleDisconnect();
                    process.exit(1);
                });
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.blockNum !== undefined) {
                        globalStartGettingTransactions(msg.blockNum);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
            }
            break;
        case 'save_tx_vin_vout_and_addresses': // 1:8:42.847 - block count 388282
            if (cluster.isMaster) {
                var startTime = new Date();
                var countAddress = 0;
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                }
                createFile();
                var currentBlocks = [];
                // var limit = 1;
                // var countBlocks = 0;
                // var offset = 150111;
                var limit = 20000;
                var gotBlocks = 0;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextTxsInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                var lastOrder = 0;
                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.deleteAll(function(err) {
                        AddressToUpdateController.deleteAll(function(err) {
                            gettingNextTxsInProgress = true;
                            gettingNextTxs(limit, offset).then(function (res) {
                                gotBlocks++;
                                gettingNextTxsInProgress = false;
                                if (res && res.length) {
                                    currentBlocks = currentBlocks.concat(res);
                                }
                                if (currentBlocks[countBlocks]) {
                                    for (let i = 0; i < cpuCount; i++) {
                                        var worker = cluster.fork();
                                        worker.on('message', function (msg) {
                                            if(msg.countAddress) {
                                                countAddress++;
                                            }
                                            if (msg.finished) {
                                                (function (id) {
                                                    clusterQ.push(id);
                                                    if (currentBlocks[countBlocks]) {
                                                        if (countBlocks === gotBlocks * limit - limit / 10) {
                                                            if (!gettingNextTxsInProgress) {
                                                                gettingNextTxsInProgress = true;
                                                                offset++;
                                                                gettingNextTxs(limit, offset).then(function (res) {
                                                                    gotBlocks++;
                                                                    if (res && res.length) {
                                                                        currentBlocks = currentBlocks.concat(res);
                                                                    }
                                                                    gettingNextTxsInProgress = false;
                                                                    if (currentBlocks[countBlocks]) {
                                                                        console.log('clusterQ', clusterQ)
                                                                        while (clusterQ.length) {
                                                                            cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[countBlocks], order: lastOrder + countBlocks});
                                                                            clusterQ.shift();
                                                                            countBlocks++;
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
                                                        cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[countBlocks], order: lastOrder + countBlocks});
                                                        clusterQ.shift();
                                                        countBlocks++;

                                                    } else {
                                                        if (!gettingNextTxsInProgress) {
                                                            cluster.workers[clusterQ[0]].send({kill: true});
                                                            clusterQ.shift();
                                                        }
                                                    }
                                                })(this.id)
                                            }
                                            if (msg.mongoTimeout) {
                                                mongoTimeout = true;
                                                for(var id in cluster.workers) {
                                                    cluster.workers[id].send({kill: true});
                                                }
                                            }
                                        })
                                        worker.on('exit', (code, signal) => {
                                            exit_count++;
                                            if (exit_count === cpuCount) {
                                                if (!updateInProgress) {
                                                    console.log('*************countAddress************', countAddress);
                                                    // updateDbAddreess(local_addreses_before_save, function() {
                                                    //     endReindex();
                                                    // });
                                                    if(mongoTimeout) {
                                                        console.log('\n*******************************************************************');
                                                        console.log('******mongodb has disconnected, please reindex again from block - ' + 0 + '******')
                                                        console.log('*******************************************************************\n');
                                                        deleteFile();
                                                        db.multipleDisconnect();
                                                        process.exit(1);
                                                    }
                                                    endReindexNew();
                                                    // console.log('countBlocks', countBlocks)
                                                    // console.log('took ', helpers.getFinishTime(startTime));
                                                    // endReindex();
                                                }
                                                // console.log('addreses_to_update', addreses_to_update.length)
                                            }
                                            console.log(`worker ${worker.process.pid} died`);
                                        });
                                        if(currentBlocks.length) {
                                            worker.send({currentBlock: currentBlocks[countBlocks], order: lastOrder + countBlocks});
                                            countBlocks++;
                                        } else {
                                            worker.send({kill: true});
                                        }
                                    }
                                } else {
                                    console.log('finish getting blocks')
                                }
                            });
                        });
                    });


                    // cluster.on('exit', (worker, code, signal) => {
                    //     exit_count++;
                    //     if (exit_count === cpuCount) {
                    //         if (!updateInProgress) {
                    //             console.log('local_addreses_before_save', local_addreses_before_save.length);
                    //             // updateDbAddreess(local_addreses_before_save, function() {
                    //             //     endReindex();
                    //             // });
                    //             endReindexNew();
                    //             // console.log('countBlocks', countBlocks)
                    //             // console.log('took ', helpers.getFinishTime(startTime));
                    //             // endReindex();
                    //         }
                    //         // console.log('addreses_to_update', addreses_to_update.length)
                    //     }
                    //     console.log(`worker ${worker.process.pid} died`);
                    // });
                }

                setTimeout(startVinVoutClusterLinerAll)
                // startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.currentBlock !== undefined) {
                        startVinVoutClusterLiner(msg.currentBlock, msg.order);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startVinVoutClusterLiner = function(currentBlock, order) {
                    var tx = currentBlock;
                    if(tx) {
                        tx.order = order + 1;
                        globalCheckVinVoutCluster(tx);
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;
        case 'reindex_addresses': //  -  0:21:33.160 - block count 149482
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                }
                createFile();
                var currentBlocks = [];
                var limit = 20000;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextTxsInProgress = false;
                var exit_count = 0;
                var startVinVoutClusterLinerAll = function() {
                    AddressToUpdateController.deleteAll(function(err) {
                        gettingNextTxsInProgress = true;
                        gettingNextTxsVinVout(limit, offset).then(function(res){
                            gettingNextTxsInProgress = false;
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
                                                        if(!gettingNextTxsInProgress) {
                                                            gettingNextTxsInProgress = true;
                                                            offset++;
                                                            gettingNextTxsVinVout(limit, offset).then(function (res) {
                                                                if(res && res.length) {
                                                                    currentBlocks = currentBlocks.concat(res);
                                                                }
                                                                gettingNextTxsInProgress = false;
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
                                                    if(!gettingNextTxsInProgress) {
                                                        cluster.workers[clusterQ[0]].send({kill: true});
                                                        clusterQ.shift();
                                                    }
                                                }
                                            })(this.id)
                                        }
                                    })
                                    worker.on('exit', (code, signal) => {
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
                                                endReindexNew();
                                            }
                                            // console.log('addreses_to_update', addreses_to_update.length)
                                        }
                                        console.log(`worker ${worker.process.pid} died`);
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

                    // var exit_count = 0;
                    // cluster.on('exit', (worker, code, signal) => {
                    //     exit_count++;
                    //     if (exit_count === cpuCount) {
                    //         if (!updateInProgress) {
                    //             console.log('local_addreses_before_save', local_addreses_before_save.length);
                    //             // updateDbAddreess(local_addreses_before_save, function() {
                    //             //     endReindex();
                    //             // });
                    //             // endReindex();
                    //             console.log('countBlocks', countBlocks)
                    //             console.log('took ', helpers.getFinishTime(startTime));
                    //             endReindexNew();
                    //         }
                    //         // console.log('addreses_to_update', addreses_to_update.length)
                    //     }
                    //     console.log(`worker ${worker.process.pid} died`);
                    // });
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
                            addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txVinVout.txid, amount: txVinVout.vin[i].amount, type: 'vin', txid_timestamp: txVinVout.timestamp, blockindex: txVinVout.blockindex })
                            // addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                            // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                        }
                        for (var i = 0; i < txVinVout.vout.length; i++) {
                            // TODO update mongodb adress sceme
                            addreses_to_update.push({address: txVinVout.vout[i].addresses, txid: txVinVout.txid, amount: txVinVout.vout[i].amount, type: 'vout', txid_timestamp: txVinVout.timestamp, blockindex: txVinVout.blockindex})
                            // addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                            // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                        }
                        // if(addreses_to_update.length) {
                        //     cluster.worker.send({addreses_to_update: addreses_to_update});
                        // }
                        var insertAddresses = function() {
                            if (addreses_to_update.length) {
                                console.log('updating address - ' + addreses_to_update[0].blockindex, addreses_to_update[0].address);
                                AddressToUpdateController.updateOne(addreses_to_update[0], function(err){
                                    if(err) {
                                        console.log(err);
                                    } else {
                                        addreses_to_update.shift();
                                        insertAddresses();
                                    }
                                })
                            } else {
                                cluster.worker.send({finished: true});
                            }
                        }
                        insertAddresses();
                    }
                    if(txVinVout) {
                        UpdateAddresses(0);
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;

        case 'update_tx': // 0:52:3.69 - block count 268159
            if (cluster.isMaster) {
                wallet_commands.getBlockCount(wallet).then(function (allBlocksCount) {
                    // allBlocksCount = 152939;
                    var startTime = new Date();
                    console.log(`Master ${process.pid} is running`);
                    if(fileExist()) {
                        console.log('reindex is in progress');
                        db.multipleDisconnect();
                        process.exit(1)
                        return;
                    }
                    createFile();
                    var currentBlock = 0;
                    var exit_count = 0;
                    var cpuCount = 1;
                    var walletDisconnected = false;
                    var mongoTimeout = false;
                    var startedFromBlock = 0;
                    var startReIndexClusterLinerAll = function() {
                        TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                            //TODO
                            // check last 6 db blocks exist in wallet
                            if(latestTx.length) {
                                currentBlock = latestTx[0].blockindex + 1;
                                startedFromBlock = currentBlock;
                            } else {
                                console.log('no blocks found - please run reindexclusterlinearchunks first');
                                deleteFile();
                                db.multipleDisconnect();
                                process.exit();
                                return;
                            }
                            if(currentBlock > allBlocksCount) {
                                console.log('no new blocks found');
                                deleteFile();
                                db.multipleDisconnect();
                                process.exit();
                                return;
                            }
                            for (let i = 0; i < cpuCount; i++) {
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
                                    if (msg.blockNotFound) {
                                        cluster.workers[this.id].send({kill: true});
                                    }
                                    if (msg.walletDisconnected) {
                                        walletDisconnected = true;
                                        cluster.workers[this.id].send({kill: true});
                                    }
                                    if (msg.mongoTimeout) {
                                        mongoTimeout = true;
                                        for(var id in cluster.workers) {
                                            cluster.workers[id].send({kill: true});
                                        }
                                    }
                                })
                                worker.on('exit', (code, signal) => {
                                    exit_count++;
                                    if (exit_count === cpuCount) {
                                        var exit_code = 0;
                                        if(walletDisconnected) {
                                            console.log('\n*******************************************************************');
                                            console.log('******wallet was disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                            console.log('*******************************************************************\n');
                                            exit_code = 1;
                                        }
                                        if(mongoTimeout) {
                                            console.log('\n*******************************************************************');
                                            console.log('******mongodb has disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                            console.log('*******************************************************************\n');
                                            exit_code = 1;
                                        }
                                        console.log('took - ', helpers.getFinishTime(startTime));
                                        deleteFile();
                                        db.multipleDisconnect();
                                        process.exit(exit_code);
                                    }
                                    console.log(`worker ${worker.process.pid} died`);
                                });
                                if(currentBlock <= allBlocksCount) {
                                    worker.send({blockNum: currentBlock});
                                    currentBlock++;
                                } else {
                                    worker.send({kill: true});
                                }
                            }
                        });
                    }

                    //TODO
                    // check last 6 db blocks exist in wallet
                    var checkLatestBlocksInWallet = function() {
                        BlockController.getAll('blockindex', 'desc', 6, function (latestTx) {
                            function startCheckingBlock(i) {
                                wallet_commands.getBlock(wallet, latestTx[i].blockhash).then((block) => {
                                    block = JSON.parse(block);
                                    // console.log(results.height);
                                    if(block.confirmations >= 0) {
                                        if (latestTx[i + 1] !== undefined) {
                                            startCheckingBlock(++i);
                                        } else {
                                            // console.log('finish checking all is ok');
                                            startReIndexClusterLinerAll();
                                        }
                                    } else {
                                        console.log('on update negative confirmation', block.confirmations);
                                        console.log('on update negative index', block.height);
                                        console.log('on update negative hash',  block.hash);
                                        var failedBlockIndex = latestTx[i].blockindex;
                                        // console.log('err', err);
                                        console.log('failedBlockIndex', failedBlockIndex);
                                        BlockController.deleteAllWhereGte(failedBlockIndex, function(numberRemoved) {
                                            TxController.deleteAllWhereGte(failedBlockIndex, function (numberRemoved) {
                                                TxVinVoutController.deleteAllWhereGte(failedBlockIndex, function(numberDeleted) {
                                                    AddressToUpdateController.deleteAllWhereGte(failedBlockIndex, function (numberDeleted2) {
                                                        startReIndexClusterLinerAll();
                                                        // console.log('deleted all before start update')
                                                    })
                                                });
                                            })
                                        })
                                    }
                                }).catch((err) => {
                                    // delete all blocks from current number and update again
                                    var failedBlockIndex = latestTx[i].blockindex;
                                    // console.log('err', err);
                                    console.log('failedBlockIndex', failedBlockIndex);
                                    BlockController.deleteAllWhereGte(failedBlockIndex, function(numberRemoved) {
                                        TxController.deleteAllWhereGte(failedBlockIndex, function (numberRemoved) {
                                            TxVinVoutController.deleteAllWhereGte(failedBlockIndex, function(numberDeleted) {
                                                AddressToUpdateController.deleteAllWhereGte(failedBlockIndex, function (numberDeleted2) {
                                                    startReIndexClusterLinerAll();
                                                    // console.log('deleted all before start update')
                                                })
                                            });
                                        })
                                    })
                                })
                            }
                            if(latestTx && latestTx.length) {
                                startCheckingBlock(0);
                            } else {
                                startReIndexClusterLinerAll();
                            }
                        })
                    }
                    setTimeout(checkLatestBlocksInWallet);
                }).catch(function(err) {
                    console.log('error getting block count', err);
                    if(err && err.toString().indexOf("couldn't connect to server") > -1) {
                        console.log('\n*******************************************************************');
                        console.log('******wallet disconnected please make sure wallet has started******');
                        console.log('*******************************************************************\n');
                    }
                    deleteFile();
                    db.multipleDisconnect();
                    process.exit(1);
                });;
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.blockNum !== undefined) {
                        globalStartGettingTransactions(msg.blockNum);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
            }
            break;
        case 'update_tx_vin_vout_and_addresses': // 12:47:25.775 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                }
                createFile();
                var currentBlocks = [];
                var limit = 20000;
                var gotBlocks = 0;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = 1;
                var clusterQ = [];
                var gettingNextTxsInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                var startedFromBlock;
                var lastOrder = 0;
                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.getAll('blockindex', 'desc', 1, function(latestTx) {
                        var currentBlockIndex = 0;
                        if(latestTx.length) {
                            currentBlockIndex = latestTx[0].blockindex + 1;
                            startedFromBlock = latestTx[0].blockindex;
                            lastOrder = latestTx[0].order;
                        } else {
                            console.log('no blocks found - please run calcvinvoutclusterlinearchunks first');
                            deleteFile();
                            db.multipleDisconnect();
                            process.exit();
                            return;
                        }
                        TxVinVoutController.deleteAllWhereGte(currentBlockIndex, function(numberDeleted) {
                            AddressToUpdateController.deleteAllWhereGte(currentBlockIndex, function(numberDeleted2) {
                                console.log('tx vin vout', numberDeleted);
                                console.log('address deleted', numberDeleted2);
                                gettingNextTxsInProgress = true;
                                gettingNextTxs(limit, offset, currentBlockIndex).then(function (res) {
                                    gotBlocks++;
                                    gettingNextTxsInProgress = false;
                                    if (res && res.length) {
                                        currentBlocks = currentBlocks.concat(res);
                                    }
                                    if (currentBlocks[countBlocks]) {
                                        for (let i = 0; i < cpuCount; i++) {
                                            var worker = cluster.fork();
                                            worker.on('message', function (msg) {
                                                // if (msg.addreses_to_update) {
                                                //     startUpdatingAddresses(msg.addreses_to_update)
                                                // }
                                                if (msg.finished) {
                                                    (function (id) {
                                                        clusterQ.push(id);
                                                        if (currentBlocks[countBlocks]) {
                                                            if (countBlocks === gotBlocks * limit - limit / 10) {
                                                                if (!gettingNextTxsInProgress) {
                                                                    gettingNextTxsInProgress = true;
                                                                    offset++;
                                                                    gettingNextTxs(limit, offset, currentBlockIndex).then(function (res) {
                                                                        gotBlocks++;
                                                                        if (res && res.length) {
                                                                            currentBlocks = currentBlocks.concat(res);
                                                                        }
                                                                        gettingNextTxsInProgress = false;
                                                                        if (currentBlocks[countBlocks]) {
                                                                            console.log('clusterQ', clusterQ)
                                                                            while (clusterQ.length) {
                                                                                cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[countBlocks], order: lastOrder + countBlocks});
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
                                                            cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[countBlocks], order: lastOrder + countBlocks});
                                                            clusterQ.shift();
                                                            countBlocks++;
                                                            currentBlocks.shift();

                                                        } else {
                                                            if (!gettingNextTxsInProgress) {
                                                                cluster.workers[clusterQ[0]].send({kill: true});
                                                                clusterQ.shift();
                                                            }
                                                        }
                                                    })(this.id)
                                                }
                                                if (msg.mongoTimeout) {
                                                    mongoTimeout = true;
                                                    for(var id in cluster.workers) {
                                                        cluster.workers[id].send({kill: true});
                                                    }
                                                }
                                            })
                                            worker.on('exit', (code, signal) => {
                                                exit_count++;
                                                if (exit_count === cpuCount) {
                                                    if (!updateInProgress) {
                                                        // console.log('local_addreses_before_save', local_addreses_before_save.length);
                                                        // updateDbAddreess(local_addreses_before_save, function() {
                                                        //     endReindex();
                                                        // });
                                                        if(mongoTimeout) {
                                                            console.log('\n*******************************************************************');
                                                            console.log('******mongodb has disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                                            console.log('*******************************************************************\n');
                                                            deleteFile();
                                                            db.multipleDisconnect();
                                                            process.exit(1);
                                                        }
                                                        endReindexNew();
                                                        // console.log('countBlocks', countBlocks)
                                                        // console.log('took ', helpers.getFinishTime(startTime));
                                                        // endReindex();
                                                    }
                                                    // console.log('addreses_to_update', addreses_to_update.length)
                                                }
                                                console.log(`worker ${worker.process.pid} died`);
                                            })
                                            if (currentBlocks[countBlocks]) {
                                                worker.send({currentBlock: currentBlocks[countBlocks], order: lastOrder + countBlocks});
                                                countBlocks++;
                                            } else {
                                                worker.send({kill: true});
                                            }
                                        }
                                    } else {
                                        console.log('no new blocks found');
                                        deleteFile();
                                        db.multipleDisconnect();
                                        process.exit();
                                        return;
                                    }
                                });
                            })
                        })
                    });

                    // var exit_count = 0;
                    // cluster.on('exit', (worker, code, signal) => {
                    //     exit_count++;
                    //     if (exit_count === cpuCount) {
                    //         if (!updateInProgress) {
                    //             // console.log('local_addreses_before_save', local_addreses_before_save.length);
                    //             // updateDbAddreess(local_addreses_before_save, function() {
                    //             //     endReindex();
                    //             // });
                    //             endReindexNew();
                    //             // console.log('countBlocks', countBlocks)
                    //             // console.log('took ', helpers.getFinishTime(startTime));
                    //             // endReindex();
                    //         }
                    //         // console.log('addreses_to_update', addreses_to_update.length)
                    //     }
                    //     console.log(`worker ${worker.process.pid} died`);
                    // });
                }

                // var addresses = [];
                // var local_addreses_before_save = [];
                var updateInProgress = false;


                setTimeout(startVinVoutClusterLinerAll)
                // startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.currentBlock !== undefined) {
                        startVinVoutClusterLiner(msg.currentBlock, msg.order);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startVinVoutClusterLiner = function(currentBlock, order) {
                    var tx = currentBlock;
                    if(tx) {
                        tx.order = order + 1;
                        globalCheckVinVoutCluster(tx);
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;

        case 'save_tx_linear': // 0:52:3.69 - block count 149482
            if (cluster.isMaster) {
                wallet_commands.getBlockCount(wallet).then(function (allBlocksCount) {
                    // allBlocksCount = 152939;
                    var startTime = new Date();
                    console.log(`Master ${process.pid} is running`);
                    startReindex(function(){
                        deleteDb(function(){
                            startReIndexClusterLinerAll()
                        })
                    })
                    var currentBlock = 263870;
                    var walletDisconnected = false;
                    var mongoTimeout = false;
                    var workersBlocksMap = {};
                    var cpuCount = 1;
                    var startReIndexClusterLinerAll = function() {
                        for (let i = 0; i < cpuCount; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {
                                if (msg.finished) {
                                    (function(id, block){
                                        if(block <= allBlocksCount ) {
                                            workersBlocksMap[id] = block;
                                            cluster.workers[id].send({blockNum: block});
                                        } else {
                                            cluster.workers[id].send({kill: true});
                                        }
                                    })(this.id, currentBlock++)
                                }
                                if (msg.blockNotFound) {
                                    cluster.workers[this.id].send({kill: true});
                                }
                                if (msg.walletDisconnected) {
                                    walletDisconnected = true;
                                    cluster.workers[this.id].send({kill: true});
                                }
                                if (msg.mongoTimeout) {
                                    mongoTimeout = true;
                                    for(var id in cluster.workers) {
                                        cluster.workers[id].send({kill: true});
                                    }
                                }
                            })
                            var exit_count = 0;
                            worker.on('exit', (code, signal) => {
                                exit_count++;
                                if (exit_count === cpuCount) {
                                    var exit_code = 0;
                                    if(walletDisconnected) {
                                        console.log('\n*******************************************************************');
                                        console.log('******wallet was disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                        console.log('*******************************************************************\n');
                                        exit_code = 1;
                                    }
                                    if(mongoTimeout) {
                                        console.log('\n*******************************************************************');
                                        console.log('******mongodb has disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                        console.log('*******************************************************************\n');
                                        exit_code = 1;
                                    }
                                    console.log('took - ', helpers.getFinishTime(startTime));
                                    deleteFile();
                                    db.multipleDisconnect();
                                    process.exit(exit_code);
                                }
                                // console.log(`workers.length`, cluster.workers.length);
                                console.log(`worker ${worker.process.pid} died`);
                            });
                            if(currentBlock <= allBlocksCount ) {
                                worker.send({blockNum: currentBlock});
                                currentBlock++;
                            } else {
                                worker.send({kill: true});
                            }
                        }
                    }
                }).catch(function(err) {
                    console.log('error getting block count', err);
                    if(err && err.toString().indexOf("couldn't connect to server") > -1) {
                        console.log('\n*******************************************************************');
                        console.log('******wallet disconnected please make sure wallet has started******');
                        console.log('*******************************************************************\n');
                    }
                    deleteFile();
                    db.multipleDisconnect();
                    process.exit(1);
                });
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.blockNum !== undefined) {
                        globalStartGettingTransactions(msg.blockNum);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
            }
            break;
        case 'update_address_type': // 12:47:25.775 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist('address')) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                }
                createFile('address');
                var currentAddresses = [];
                var limit = 20000;
                var countAddresses = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextAddressInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                gettingNextAddressInProgress = true;
                var startAddressLinerAll = function() {
                    var currentBlockIndex = 0; // 595079 blockindex for main chain.review
                    AddressToUpdateController.estimatedDocumentCount(function(count) {
                        console.log('count', count)
                        gettingNextAddresses(limit, offset, currentBlockIndex).then(function (res) {
                            gettingNextAddressInProgress = false;
                            if (res && res.length) {
                                currentAddresses = currentAddresses.concat(res);
                            }
                            if (currentAddresses.length) {
                                for (let i = 0; i < cpuCount; i++) {
                                    var worker = cluster.fork();
                                    worker.on('message', function (msg) {
                                        if (msg.finished) {
                                            (function (id) {
                                                clusterQ.push(id);
                                                if (currentAddresses.length) {
                                                    if (currentAddresses.length === limit - limit / 10) {
                                                        if (!gettingNextAddressInProgress) {
                                                            gettingNextAddressInProgress = true;
                                                            // offset++;
                                                            gettingNextAddresses(limit, offset, currentBlockIndex).then(function (res) {
                                                                // console.log('res.length', res.length)
                                                                if (res && res.length) {
                                                                    currentAddresses = currentAddresses.concat(res);
                                                                }
                                                                gettingNextAddressInProgress = false;
                                                                if (currentAddresses.length) {
                                                                    console.log('clusterQ', clusterQ)
                                                                    while (clusterQ.length) {
                                                                        cluster.workers[clusterQ[0]].send({currentAddress: currentAddresses[0]});
                                                                        clusterQ.shift();
                                                                        countAddresses++;
                                                                        currentAddresses.shift();
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
                                                    cluster.workers[clusterQ[0]].send({currentAddress: currentAddresses[0]});
                                                    clusterQ.shift();
                                                    countAddresses++;
                                                    currentAddresses.shift();

                                                } else {
                                                    if (!gettingNextTxsInProgress) {
                                                        cluster.workers[clusterQ[0]].send({kill: true});
                                                        clusterQ.shift();
                                                    }
                                                }
                                            })(this.id)
                                        }
                                        if (msg.mongoTimeout) {
                                            mongoTimeout = true;
                                            for(var id in cluster.workers) {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        }
                                    })
                                    worker.on('exit', (code, signal) => {
                                        exit_count++;
                                        if (exit_count === cpuCount) {
                                            if (!updateInProgress) {
                                                // console.log('local_addreses_before_save', local_addreses_before_save.length);
                                                // updateDbAddreess(local_addreses_before_save, function() {
                                                //     endReindex();
                                                // });
                                                if(mongoTimeout) {
                                                    console.log('\n*******************************************************************');
                                                    console.log('******mongodb has disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                                    console.log('*******************************************************************\n');
                                                    deleteFile('address');
                                                    db.multipleDisconnect();
                                                    process.exit(1);
                                                }
                                                console.log('took - ', helpers.getFinishTime(startTime));
                                                deleteFile('address');
                                                db.multipleDisconnect();
                                                process.exit(1);
                                                // console.log('countAddresses', countAddresses)
                                                // console.log('took ', helpers.getFinishTime(startTime));
                                                // endReindex();
                                            }
                                            // console.log('addreses_to_update', addreses_to_update.length)
                                        }
                                        console.log(`worker ${worker.process.pid} died`);
                                    })
                                    if (currentAddresses.length) {
                                        worker.send({currentAddress: currentAddresses[0]});
                                        countAddresses++;
                                        currentAddresses.shift();
                                    } else {
                                        worker.send({kill: true});
                                    }
                                }
                            } else {
                                console.log('no new blocks found');
                                deleteFile('address');
                                db.multipleDisconnect();
                                process.exit();
                                return;
                            }
                        });
                    })
                }

                // var addresses = [];
                // var local_addreses_before_save = [];
                var updateInProgress = false;


                setTimeout(startAddressLinerAll)
                // startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.currentAddress !== undefined) {
                        startAddressClusterLiner(msg.currentAddress);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startAddressClusterLiner = function(currentAddress) {
                    var address = currentAddress;
                    // address.txid_timestamp = parseInt(address.txid_timestamp);
                    var updateAddress = function(address) {
                        AddressToUpdateController.saveTxType(address, function(err){
                            if(err) {
                                console.log('err', err);
                                if(err.stack.indexOf('Server selection timed out') > -1 ||
                                    err.stack.indexOf('interrupted at shutdown') > -1) {
                                    cluster.worker.send({mongoTimeout: true});
                                }
                            } else {
                                console.log('address updated', address.address);
                                cluster.worker.send({finished: true});
                            }
                        })
                    }
                    if(address) {
                        TxVinVoutController.getTxBlockFieldsByTxid(address.txid, {type: 1}, function(tx){
                            // console.log('tx', tx);
                            address.txid_type = tx.type;
                            // console.log('address', address);
                            updateAddress(address);
                        })
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;
        case 'update_address_type_timestamp': // 12:47:25.775 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist('address')) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                }
                createFile('address');
                var currentAddresses = [];
                var limit = 20000;
                var countAddresses = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextAddressInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                gettingNextAddressInProgress = true;
                var startAddressLinerAll = function() {
                    var currentBlockIndex = 0; // 595079 blockindex for main chain.review
                    AddressToUpdateController.estimatedDocumentCount(function(count) {
                        console.log('count', count)
                        gettingNextAddresses(limit, offset, currentBlockIndex).then(function (res) {
                            gettingNextAddressInProgress = false;
                            if (res && res.length) {
                                currentAddresses = currentAddresses.concat(res);
                            }
                            if (currentAddresses.length) {
                                for (let i = 0; i < cpuCount; i++) {
                                    var worker = cluster.fork();
                                    worker.on('message', function (msg) {
                                        if (msg.finished) {
                                            (function (id) {
                                                clusterQ.push(id);
                                                if (currentAddresses.length) {
                                                    if (currentAddresses.length === limit - limit / 10) {
                                                        if (!gettingNextAddressInProgress) {
                                                            gettingNextAddressInProgress = true;
                                                            // offset++;
                                                            gettingNextAddresses(limit, offset, currentBlockIndex).then(function (res) {
                                                                // console.log('res.length', res.length)
                                                                if (res && res.length) {
                                                                    currentAddresses = currentAddresses.concat(res);
                                                                }
                                                                gettingNextAddressInProgress = false;
                                                                if (currentAddresses.length) {
                                                                    console.log('clusterQ', clusterQ)
                                                                    while (clusterQ.length) {
                                                                        cluster.workers[clusterQ[0]].send({currentAddress: currentAddresses[0]});
                                                                        clusterQ.shift();
                                                                        countAddresses++;
                                                                        currentAddresses.shift();
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
                                                    cluster.workers[clusterQ[0]].send({currentAddress: currentAddresses[0]});
                                                    clusterQ.shift();
                                                    countAddresses++;
                                                    currentAddresses.shift();

                                                } else {
                                                    if (!gettingNextTxsInProgress) {
                                                        cluster.workers[clusterQ[0]].send({kill: true});
                                                        clusterQ.shift();
                                                    }
                                                }
                                            })(this.id)
                                        }
                                        if (msg.mongoTimeout) {
                                            mongoTimeout = true;
                                            for(var id in cluster.workers) {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        }
                                    })
                                    worker.on('exit', (code, signal) => {
                                        exit_count++;
                                        if (exit_count === cpuCount) {
                                            if (!updateInProgress) {
                                                // console.log('local_addreses_before_save', local_addreses_before_save.length);
                                                // updateDbAddreess(local_addreses_before_save, function() {
                                                //     endReindex();
                                                // });
                                                if(mongoTimeout) {
                                                    console.log('\n*******************************************************************');
                                                    console.log('******mongodb has disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                                    console.log('*******************************************************************\n');
                                                    deleteFile('address');
                                                    db.multipleDisconnect();
                                                    process.exit(1);
                                                }
                                                console.log('took - ', helpers.getFinishTime(startTime));
                                                deleteFile('address');
                                                db.multipleDisconnect();
                                                process.exit(1);
                                                // console.log('countAddresses', countAddresses)
                                                // console.log('took ', helpers.getFinishTime(startTime));
                                                // endReindex();
                                            }
                                            // console.log('addreses_to_update', addreses_to_update.length)
                                        }
                                        console.log(`worker ${worker.process.pid} died`);
                                    })
                                    if (currentAddresses.length) {
                                        worker.send({currentAddress: currentAddresses[0]});
                                        countAddresses++;
                                        currentAddresses.shift();
                                    } else {
                                        worker.send({kill: true});
                                    }
                                }
                            } else {
                                console.log('no new blocks found');
                                deleteFile('address');
                                db.multipleDisconnect();
                                process.exit();
                                return;
                            }
                        });
                    })
                }

                // var addresses = [];
                // var local_addreses_before_save = [];
                var updateInProgress = false;


                setTimeout(startAddressLinerAll)
                // startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.currentAddress !== undefined) {
                        startAddressClusterLiner(msg.currentAddress);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startAddressClusterLiner = function(currentAddress) {
                    var address = currentAddress;
                    address.txid_timestamp = parseInt(address.txid_timestamp);
                    var updateAddress = function(address) {
                        AddressToUpdateController.save(address, function(err){
                            if(err) {
                                console.log('err', err);
                                if(err.stack.indexOf('Server selection timed out') > -1 ||
                                    err.stack.indexOf('interrupted at shutdown') > -1) {
                                    cluster.worker.send({mongoTimeout: true});
                                }
                            } else {
                                console.log('address updated', address);
                                cluster.worker.send({finished: true});
                            }
                        })
                    }
                    if(address) {
                        updateAddress(address);
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;
        case 'update_tx_vin_vout_type': // 1:8:42.847 - block count 388282
            if (cluster.isMaster) {
                var startTime = new Date();
                var countAddress = 0;
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                }
                createFile();
                var currentBlocks = [];
                var limit = 20000;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextTxsInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.getAll2(  { type: {$eq: 0 } }, {},'blockindex', 'asc', 1, 0, function(latestTx) {
                        // var currentBlockIndex = 0;
                        if (latestTx.length) {
                            var currentBlockIndex = latestTx[0].blockindex;
                        } else {
                            deleteFile();
                            db.multipleDisconnect();
                            process.exit(1);
                            return;
                        }
                        console.log('currentBlockIndex', currentBlockIndex)
                        console.log('latestTx', latestTx)
                        gettingNextTxsInProgress = true;
                        gettingNextTxs(limit, offset, currentBlockIndex).then(function (res) {
                            gettingNextTxsInProgress = false;
                            if (res && res.length) {
                                currentBlocks = currentBlocks.concat(res);
                            }
                            if (currentBlocks.length) {
                                for (let i = 0; i < cpuCount; i++) {
                                    var worker = cluster.fork();
                                    worker.on('message', function (msg) {
                                        if (msg.countAddress) {
                                            countAddress++;
                                        }
                                        if (msg.finished) {
                                            (function (id) {
                                                clusterQ.push(id);
                                                if (currentBlocks.length) {
                                                    if (currentBlocks.length === limit - limit / 10) {
                                                        if (!gettingNextTxsInProgress) {
                                                            gettingNextTxsInProgress = true;
                                                            offset++;
                                                            gettingNextTxs(limit, offset).then(function (res) {
                                                                if (res && res.length) {
                                                                    currentBlocks = currentBlocks.concat(res);
                                                                }
                                                                gettingNextTxsInProgress = false;
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
                                                    if (!gettingNextTxsInProgress) {
                                                        cluster.workers[clusterQ[0]].send({kill: true});
                                                        clusterQ.shift();
                                                    }
                                                }
                                            })(this.id)
                                        }
                                        if (msg.mongoTimeout) {
                                            mongoTimeout = true;
                                            for (var id in cluster.workers) {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        }
                                    })
                                    worker.on('exit', (code, signal) => {
                                        exit_count++;
                                        if (exit_count === cpuCount) {
                                            if (!updateInProgress) {
                                                console.log('*************countAddress************', countAddress);
                                                // updateDbAddreess(local_addreses_before_save, function() {
                                                //     endReindex();
                                                // });
                                                if (mongoTimeout) {
                                                    console.log('\n*******************************************************************');
                                                    console.log('******mongodb has disconnected, please reindex again from block - ' + 0 + '******')
                                                    console.log('*******************************************************************\n');
                                                    deleteFile();
                                                    db.multipleDisconnect();
                                                    process.exit(1);
                                                }
                                                deleteFile();
                                                db.multipleDisconnect();
                                                process.exit(1);
                                                // console.log('countBlocks', countBlocks)
                                                // console.log('took ', helpers.getFinishTime(startTime));
                                                // endReindex();
                                            }
                                            // console.log('addreses_to_update', addreses_to_update.length)
                                        }
                                        console.log(`worker ${worker.process.pid} died`);
                                    });
                                    if (currentBlocks.length) {
                                        worker.send({currentBlock: currentBlocks[0]});
                                        countBlocks++;
                                        currentBlocks.shift();
                                    } else {
                                        worker.send({kill: true});
                                    }
                                }
                            } else {
                                console.log('finish getting blocks')
                            }
                        });
                    });
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
                    if(tx) {
                        helpers.prepare_vin_db(wallet, tx).then(function (vin) {
                            helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
                                helpers.calculate_total(obj.vout).then(function (total) {

                                    var type = tx_types.NORMAL;
                                    if(!obj.vout.length) {
                                        type = tx_types.NONSTANDARD;
                                    } else if(!obj.nvin.length) {
                                        type = tx_types.POS;
                                    } else if(obj.nvin.length && obj.nvin[0].addresses === 'coinbase') {
                                        type = tx_types.NEW_COINS;
                                    }

                                    var vinvout = {_id: tx._id, txid: tx.txid, vin: obj.nvin, vout: obj.vout, total: total, blockindex: tx.blockindex, timestamp: tx.timestamp, type: type, type_str: tx_types.toStr(type)};
                                    var finishUpdateTx = false;
                                    // console.log('vinvout', vinvout);
                                    TxVinVoutController.updateOne(vinvout, function(err) {
                                        finishUpdateTx = true;
                                        if(err) {
                                            console.log('err', err);
                                            if(err.stack.indexOf('Server selection timed out') > -1 ||
                                                err.stack.indexOf('interrupted at shutdown') > -1) {
                                                cluster.worker.send({mongoTimeout: true});
                                            }
                                        }
                                        console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                                        if(finishUpdateTx) {
                                            cluster.worker.send({finished: true});
                                        }
                                    })
                                })
                            })
                        })
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;
        case 'update_tx_vin_vout_order': // 1:8:42.847 - block count 388282
            if (cluster.isMaster) {
                var startTime = new Date();
                var countAddress = 0;
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                }
                createFile();
                var currentBlocks = [];
                var limit = 20000;
                var gotBlocks = 0;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextTxsInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                var lastOrder = 0;
                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.getAll2(  {}, {order:1},'order', 'desc', 1, 0, function(latestTx) {
                        // var currentBlockIndex = 0;
                        if (latestTx.length && latestTx[0].order) {
                            lastOrder = latestTx[0].order;
                        }
                        console.log('latestTx', latestTx)
                        console.log('lastOrder', lastOrder);
                        // return;
                        gettingNextTxsInProgress = true;
                        gettingNextTxsByOrder(limit, offset, lastOrder).then(function (res) {
                            gotBlocks++;
                            gettingNextTxsInProgress = false;
                            if (res && res.length) {
                                currentBlocks = currentBlocks.concat(res);
                            }
                            if (currentBlocks[countBlocks]) {
                                for (let i = 0; i < cpuCount; i++) {
                                    var worker = cluster.fork();
                                    worker.on('message', function (msg) {
                                        if (msg.countAddress) {
                                            countAddress++;
                                        }
                                        if (msg.finished) {
                                            (function (id) {
                                                clusterQ.push(id);
                                                if (currentBlocks[countBlocks]) {
                                                    if (countBlocks === gotBlocks * limit - limit / 10) {
                                                        if (!gettingNextTxsInProgress) {
                                                            gettingNextTxsInProgress = true;
                                                            offset++;
                                                            gettingNextTxsByOrder(limit, offset, lastOrder).then(function (res) {
                                                                gotBlocks++;
                                                                if (res && res.length) {
                                                                    currentBlocks = currentBlocks.concat(res);
                                                                }
                                                                gettingNextTxsInProgress = false;
                                                                if (currentBlocks[countBlocks]) {
                                                                    console.log('clusterQ', clusterQ)
                                                                    while (clusterQ.length) {
                                                                        cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[countBlocks], order: lastOrder + countBlocks});
                                                                        clusterQ.shift();
                                                                        countBlocks++;
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
                                                    cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[countBlocks], order: lastOrder + countBlocks});
                                                    clusterQ.shift();
                                                    countBlocks++;

                                                } else {
                                                    if (!gettingNextTxsInProgress) {
                                                        cluster.workers[clusterQ[0]].send({kill: true});
                                                        clusterQ.shift();
                                                    }
                                                }
                                            })(this.id)
                                        }
                                        if (msg.mongoTimeout) {
                                            mongoTimeout = true;
                                            for (var id in cluster.workers) {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        }
                                    })
                                    worker.on('exit', (code, signal) => {
                                        exit_count++;
                                        if (exit_count === cpuCount) {
                                            if (!updateInProgress) {
                                                console.log('*************countAddress************', countAddress);
                                                // updateDbAddreess(local_addreses_before_save, function() {
                                                //     endReindex();
                                                // });
                                                if (mongoTimeout) {
                                                    console.log('\n*******************************************************************');
                                                    console.log('******mongodb has disconnected, please reindex again from block - ' + 0 + '******')
                                                    console.log('*******************************************************************\n');
                                                    deleteFile();
                                                    db.multipleDisconnect();
                                                    process.exit(1);
                                                }
                                                console.log('currentBlocks.length', currentBlocks.length);
                                                console.log('lastOrder + countBlocks', lastOrder + countBlocks);
                                                deleteFile();
                                                db.multipleDisconnect();
                                                process.exit(1);
                                                // console.log('countBlocks', countBlocks)
                                                // console.log('took ', helpers.getFinishTime(startTime));
                                                // endReindex();
                                            }
                                            // console.log('addreses_to_update', addreses_to_update.length)
                                        }
                                        console.log(`worker ${worker.process.pid} died`);
                                    });
                                    if (currentBlocks[countBlocks]) {
                                        console.log('lastOrder + countBlocks', lastOrder + countBlocks)
                                        worker.send({currentBlock: currentBlocks[countBlocks], order: lastOrder + countBlocks});
                                        countBlocks++;
                                    } else {
                                        worker.send({kill: true});
                                    }
                                }
                            } else {
                                console.log('finish getting blocks');
                                deleteFile();
                                db.multipleDisconnect();
                                process.exit(1);

                            }
                        });
                    });
                }

                setTimeout(startVinVoutClusterLinerAll)
                // startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.currentBlock !== undefined) {
                        startVinVoutClusterLiner(msg.currentBlock, msg.order);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startVinVoutClusterLiner = function(currentBlock, order) {
                    var tx = currentBlock;
                    if(tx) {
                        tx.order = order + 1;
                        TxVinVoutController.updateOne(tx, function(err) {
                            if(err) {
                                console.log('err', err);
                                if(err.stack.indexOf('Server selection timed out') > -1 ||
                                    err.stack.indexOf('interrupted at shutdown') > -1) {
                                    cluster.worker.send({mongoTimeout: true});
                                }
                            }
                            console.log('updated vin vout - ' + tx.blockindex, tx.order);
                            // console.log(tx);
                            cluster.worker.send({finished: true});
                        })
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;

        case 'save_from_tx': // 0:52:3.69 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                } else if( !hash_number || isNaN(hash_number)) {
                    console.log('missing block number');
                    db.multipleDisconnect();
                    process.exit()
                    return;
                } else {
                    forceReindexFrom(function () {
                        createFile();
                        // db.connect(settings[wallet].dbSettings);
                        startReIndexClusterLinerAll();
                    }, function () {
                        db.multipleDisconnect();
                    }, hash_number)
                };
                var currentBlock = hash_number;
                var startedFromBlock = currentBlock;
                var walletDisconnected = false;
                var mongoTimeout = false;
                var exit_count = 0;
                var startReIndexClusterLinerAll = function() {
                    wallet_commands.getBlockCount(wallet).then(function (allBlocksCount) {
                        // allBlocksCount = 152939;
                        BlockController.deleteAllWhereGte(currentBlock, function(numberRemoved) {
                            TxController.deleteAllWhereGte(currentBlock, function (numberRemoved) {
                                TxVinVoutController.deleteAllWhereGte(currentBlock, function(numberDeleted) {
                                    AddressToUpdateController.deleteAllWhereGte(currentBlock, function (numberDeleted2) {
                                        console.log('tx deleted', numberRemoved);
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
                                                if (msg.blockNotFound) {
                                                    cluster.workers[this.id].send({kill: true});
                                                }
                                                if (msg.walletDisconnected) {
                                                    walletDisconnected = true;
                                                    cluster.workers[this.id].send({kill: true});
                                                }
                                                if (msg.mongoTimeout) {
                                                    mongoTimeout = true;
                                                    for (var id in cluster.workers) {
                                                        cluster.workers[id].send({kill: true});
                                                    }
                                                }
                                            })
                                            worker.on('exit', (code, signal) => {
                                                exit_count++;
                                                if (exit_count === numCPUs) {
                                                    var exit_code = 0;
                                                    if (walletDisconnected) {
                                                        console.log('\n*******************************************************************');
                                                        console.log('******wallet was disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                                        console.log('*******************************************************************\n');
                                                        exit_code = 1;
                                                    }
                                                    if (mongoTimeout) {
                                                        console.log('\n*******************************************************************');
                                                        console.log('******mongodb has disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                                        console.log('*******************************************************************\n');
                                                        exit_code = 1;
                                                    }
                                                    console.log('took - ', helpers.getFinishTime(startTime));
                                                    deleteFile();
                                                    db.multipleDisconnect();
                                                    process.exit(exit_code);
                                                }
                                                console.log(`worker ${worker.process.pid} died`);
                                            })
                                            if (currentBlock <= allBlocksCount) {
                                                worker.send({blockNum: currentBlock});
                                                currentBlock++;
                                            } else {
                                                worker.send({kill: true});
                                            }
                                        }
                                    });
                                });
                            });
                        });
                    }).catch(function(err) {
                        console.log('error getting block count', err);
                        if(err && err.toString().indexOf("couldn't connect to server") > -1) {
                            console.log('\n*******************************************************************');
                            console.log('******wallet disconnected please make sure wallet has started******');
                            console.log('*******************************************************************\n');
                        }
                        deleteFile();
                        db.multipleDisconnect();
                        process.exit(1);
                    });

                    // var exit_count = 0;
                    // cluster.on('exit', (worker, code, signal) => {
                    //     exit_count++;
                    //     if (exit_count === numCPUs) {
                    //         console.log('took - ', helpers.getFinishTime(startTime));
                    //         deleteFile();
                    //         db.multipleDisconnect();
                    //         process.exit();
                    //     }
                    //     console.log(`worker ${worker.process.pid} died`);
                    // });
                }
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.blockNum !== undefined) {
                        globalStartGettingTransactions(msg.blockNum);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
            }
            break;
        case 'save_from_tx_vin_vout_and_addresses': // 12:47:25.775 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                } else if( !hash_number || isNaN(hash_number)) {
                    console.log('missing block number');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                };
                var currentBlock = hash_number;
                var startedFromBlock = currentBlock;
                createFile();
                var currentBlocks = [];
                var limit = 20000;
                var gotBlocks = 0;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextTxsInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                var lastOrder = 0;
                var startVinVoutClusterLinerAll = function() {
                    var currentBlockIndex = currentBlock;
                    TxVinVoutController.deleteAllWhereGte(currentBlockIndex, function(numberDeleted) {
                        AddressToUpdateController.deleteAllWhereGte(currentBlockIndex, function(numberDeleted2) {
                            console.log('tx vin vout deleted', numberDeleted);
                            console.log('address deleted', numberDeleted2);
                            TxVinVoutController.getAll('order', 'desc', 1, function(latestTx) {
                                if(latestTx.length) {
                                    lastOrder = latestTx[0].order;
                                }
                                console.log('lastOrder', lastOrder);
                                gettingNextTxsInProgress = true;
                                gettingNextTxs(limit, offset, currentBlockIndex).then(function (res) {
                                    gotBlocks++;
                                    gettingNextTxsInProgress = false;
                                    if (res && res.length) {
                                        currentBlocks = currentBlocks.concat(res);
                                    }
                                    if (currentBlocks[countBlocks]) {
                                        for (let i = 0; i < cpuCount; i++) {
                                            var worker = cluster.fork();
                                            worker.on('message', function (msg) {
                                                // if (msg.addreses_to_update) {
                                                //     startUpdatingAddresses(msg.addreses_to_update)
                                                // }
                                                if (msg.finished) {
                                                    (function (id) {
                                                        clusterQ.push(id);
                                                        if (currentBlocks[countBlocks]) {
                                                            if (countBlocks === gotBlocks * limit - limit / 10) {
                                                                if (!gettingNextTxsInProgress) {
                                                                    gettingNextTxsInProgress = true;
                                                                    offset++;
                                                                    gettingNextTxs(limit, offset, currentBlockIndex).then(function (res) {
                                                                        gotBlocks++;
                                                                        if (res && res.length) {
                                                                            currentBlocks = currentBlocks.concat(res);
                                                                        }
                                                                        gettingNextTxsInProgress = false;
                                                                        if (currentBlocks[countBlocks]) {
                                                                            console.log('clusterQ', clusterQ)
                                                                            while (clusterQ.length) {
                                                                                cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[countBlocks], order: lastOrder + countBlocks});
                                                                                clusterQ.shift();
                                                                                countBlocks++;
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
                                                            cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[countBlocks],order: lastOrder + countBlocks});
                                                            clusterQ.shift();
                                                            countBlocks++;

                                                        } else {
                                                            if (!gettingNextTxsInProgress) {
                                                                cluster.workers[clusterQ[0]].send({kill: true});
                                                                clusterQ.shift();
                                                            }
                                                        }
                                                    })(this.id)
                                                }
                                                if (msg.mongoTimeout) {
                                                    mongoTimeout = true;
                                                    for (var id in cluster.workers) {
                                                        cluster.workers[id].send({kill: true});
                                                    }
                                                }
                                            })
                                            worker.on('exit', (code, signal) => {
                                                exit_count++;
                                                if (exit_count === cpuCount) {
                                                    if (!updateInProgress) {
                                                        // console.log('local_addreses_before_save', local_addreses_before_save.length);
                                                        // updateDbAddreess(local_addreses_before_save, function() {
                                                        //     endReindex();
                                                        // });
                                                        if (mongoTimeout) {
                                                            console.log('\n*******************************************************************');
                                                            console.log('******mongodb has disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                                            console.log('*******************************************************************\n');
                                                            deleteFile();
                                                            db.multipleDisconnect();
                                                            process.exit(1);
                                                        }
                                                        endReindexNew();
                                                        // console.log('countBlocks', countBlocks)
                                                        // console.log('took ', helpers.getFinishTime(startTime));
                                                        // endReindex();
                                                    }
                                                    // console.log('addreses_to_update', addreses_to_update.length)
                                                }
                                                console.log(`worker ${worker.process.pid} died`);
                                            });
                                            if (currentBlocks[countBlocks]) {
                                                worker.send({currentBlock: currentBlocks[countBlocks],order: lastOrder + countBlocks});
                                                countBlocks++;
                                            } else {
                                                worker.send({kill: true});
                                            }
                                        }
                                    } else {
                                        console.log('no new blocks found');
                                        deleteFile();
                                        db.multipleDisconnect();
                                        process.exit();
                                    }
                                });
                            });
                        })
                    })

                    // var exit_count = 0;
                    // cluster.on('exit', (worker, code, signal) => {
                    //     exit_count++;
                    //     if (exit_count === cpuCount) {
                    //         if (!updateInProgress) {
                    //             // console.log('local_addreses_before_save', local_addreses_before_save.length);
                    //             // updateDbAddreess(local_addreses_before_save, function() {
                    //             //     endReindex();
                    //             // });
                    //             endReindexNew();
                    //             // console.log('countBlocks', countBlocks)
                    //             // console.log('took ', helpers.getFinishTime(startTime));
                    //             // endReindex();
                    //         }
                    //         // console.log('addreses_to_update', addreses_to_update.length)
                    //     }
                    //     console.log(`worker ${worker.process.pid} died`);
                    // });
                }

                // var addresses = [];
                // var local_addreses_before_save = [];
                var updateInProgress = false;


                setTimeout(startVinVoutClusterLinerAll)
                // startVinVoutClusterLinerAll()
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                process.on('message', function(msg) {
                    if(msg.currentBlock !== undefined) {
                        startVinVoutClusterLiner(msg.currentBlock, msg.order);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startVinVoutClusterLiner = function(currentBlock, order) {
                    var tx = currentBlock;
                    if(tx) {
                        tx.order = order + 1;
                        globalCheckVinVoutCluster(tx);
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;
        case 'save_tx_vin_vout_and_addresses_based_on_latest': // 12:47:25.775 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                };
                var currentBlock = 0;
                var startedFromBlock = currentBlock;
                createFile();
                var currentBlocks = [];
                var limit = 20000;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextTxsInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.getAll('blockindex', 'desc', 1, function(latestTx) {
                        var currentBlockIndex = 0;
                        if(latestTx.length) {
                            currentBlockIndex = latestTx[0].blockindex;
                            startedFromBlock = latestTx[0].blockindex;
                        }
                        gettingNextTxsInProgress = true;
                        gettingNextTxs(limit, offset, currentBlockIndex).then(function (res) {
                            gettingNextTxsInProgress = false;
                            if (res && res.length) {
                                currentBlocks = currentBlocks.concat(res);
                            }
                            if (currentBlocks.length) {
                                for (let i = 0; i < cpuCount; i++) {
                                    var worker = cluster.fork();
                                    worker.on('message', function (msg) {
                                        // if (msg.addreses_to_update) {
                                        //     startUpdatingAddresses(msg.addreses_to_update)
                                        // }
                                        if (msg.finished) {
                                            (function (id) {
                                                clusterQ.push(id);
                                                if (currentBlocks.length) {
                                                    if (currentBlocks.length === limit - limit / 10) {
                                                        if (!gettingNextTxsInProgress) {
                                                            gettingNextTxsInProgress = true;
                                                            offset++;
                                                            gettingNextTxs(limit, offset, currentBlockIndex).then(function (res) {
                                                                if (res && res.length) {
                                                                    currentBlocks = currentBlocks.concat(res);
                                                                }
                                                                gettingNextTxsInProgress = false;
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
                                                    if (!gettingNextTxsInProgress) {
                                                        cluster.workers[clusterQ[0]].send({kill: true});
                                                        clusterQ.shift();
                                                    }
                                                }
                                            })(this.id)
                                        }
                                        if (msg.mongoTimeout) {
                                            mongoTimeout = true;
                                            for(var id in cluster.workers) {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        }
                                    })
                                    worker.on('exit', (code, signal) => {
                                        exit_count++;
                                        if (exit_count === cpuCount) {
                                            if (!updateInProgress) {
                                                // console.log('local_addreses_before_save', local_addreses_before_save.length);
                                                // updateDbAddreess(local_addreses_before_save, function() {
                                                //     endReindex();
                                                // });
                                                if(mongoTimeout) {
                                                    console.log('\n*******************************************************************');
                                                    console.log('******mongodb has disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                                    console.log('*******************************************************************\n');
                                                    deleteFile();
                                                    db.multipleDisconnect();
                                                    process.exit(1);
                                                }
                                                endReindexNew();
                                                // console.log('countBlocks', countBlocks)
                                                // console.log('took ', helpers.getFinishTime(startTime));
                                                // endReindex();
                                            }
                                            // console.log('addreses_to_update', addreses_to_update.length)
                                        }
                                        console.log(`worker ${worker.process.pid} died`);
                                    });
                                    if (currentBlocks.length) {
                                        worker.send({currentBlock: currentBlocks[0]});
                                        countBlocks++;
                                        currentBlocks.shift();
                                    } else {
                                        worker.send({kill: true});
                                    }
                                }
                            } else {
                                console.log('no new blocks found');
                                deleteFile();
                                db.multipleDisconnect();
                                process.exit();
                            }
                        });
                    })

                    // var exit_count = 0;
                    // cluster.on('exit', (worker, code, signal) => {
                    //     exit_count++;
                    //     if (exit_count === cpuCount) {
                    //         if (!updateInProgress) {
                    //             // console.log('local_addreses_before_save', local_addreses_before_save.length);
                    //             // updateDbAddreess(local_addreses_before_save, function() {
                    //             //     endReindex();
                    //             // });
                    //             endReindexNew();
                    //             // console.log('countBlocks', countBlocks)
                    //             // console.log('took ', helpers.getFinishTime(startTime));
                    //             // endReindex();
                    //         }
                    //         // console.log('addreses_to_update', addreses_to_update.length)
                    //     }
                    //     console.log(`worker ${worker.process.pid} died`);
                    // });
                }

                // var addresses = [];
                // var local_addreses_before_save = [];
                var updateInProgress = false;


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
                    if(tx) {
                        globalCheckVinVoutCluster(tx);
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;

        case 'delete_from':
            if( !hash_number || isNaN(hash_number)) {
                console.log('missing block number');
                db.multipleDisconnect();
                process.exit()
                return;
            }
            BlockController.deleteAllWhereGte(hash_number, function(blocksDeleted) {
                TxController.deleteAllWhereGte(hash_number, function (txsDeleted) {
                    TxVinVoutController.deleteAllWhereGte(hash_number, function(txVinVoutsDeleted) {
                        AddressToUpdateController.deleteAllWhereGte(hash_number, function (addressDeleted) {
                            // console.log('deleted all before start update')
                            console.log('blocksDeleted', blocksDeleted)
                            console.log('txsDeleted', txsDeleted)
                            console.log('txVinVoutsDeleted', txVinVoutsDeleted)
                            console.log('addressDeleted', addressDeleted)
                            db.multipleDisconnect();
                            process.exit()
                        })
                    });
                })
            })
            break;

        case 'reindex_block_only_from':
            if (cluster.isMaster) {
                var startTime = new Date();
                console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                } else if( !hash_number || isNaN(hash_number)) {
                    console.log('missing block number');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                };
                var currentBlock = hash_number;
                var startedFromBlock = currentBlock;
                createFile();
                var currentBlocks = [];
                var limit = 20000;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextTxsInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                var startGettingNextBlocks = function() {
                    var currentBlockIndex = currentBlock;
                    BlockController.deleteAllWhereGte(currentBlockIndex, function(numberDeleted2) {
                        console.log('blocks deleted', numberDeleted2);
                        gettingNextTxsInProgress = true;
                        gettingNextTxs(limit, offset, currentBlockIndex).then(function (res) {
                            gettingNextTxsInProgress = false;
                            if (res && res.length) {
                                currentBlocks = currentBlocks.concat(res);
                            }
                            if (currentBlocks.length) {
                                for (let i = 0; i < cpuCount; i++) {
                                    var worker = cluster.fork();
                                    worker.on('message', function (msg) {
                                        // if (msg.addreses_to_update) {
                                        //     startUpdatingAddresses(msg.addreses_to_update)
                                        // }
                                        if (msg.finished) {
                                            (function (id) {
                                                clusterQ.push(id);
                                                if (currentBlocks.length) {
                                                    if (currentBlocks.length === limit - limit / 10) {
                                                        if (!gettingNextTxsInProgress) {
                                                            gettingNextTxsInProgress = true;
                                                            offset++;
                                                            gettingNextTxs(limit, offset, currentBlockIndex).then(function (res) {
                                                                if (res && res.length) {
                                                                    currentBlocks = currentBlocks.concat(res);
                                                                }
                                                                gettingNextTxsInProgress = false;
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
                                                    if (!gettingNextTxsInProgress) {
                                                        cluster.workers[clusterQ[0]].send({kill: true});
                                                        clusterQ.shift();
                                                    }
                                                }
                                            })(this.id)
                                        }
                                        if (msg.mongoTimeout) {
                                            mongoTimeout = true;
                                            for(var id in cluster.workers) {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        }
                                    })
                                    worker.on('exit', (code, signal) => {
                                        exit_count++;
                                        if (exit_count === cpuCount) {
                                            if (!updateInProgress) {
                                                // console.log('local_addreses_before_save', local_addreses_before_save.length);
                                                // updateDbAddreess(local_addreses_before_save, function() {
                                                //     endReindex();
                                                // });
                                                if(mongoTimeout) {
                                                    console.log('\n*******************************************************************');
                                                    console.log('******mongodb has disconnected, please reindex again from block - ' + startedFromBlock + '******')
                                                    console.log('*******************************************************************\n');
                                                    deleteFile();
                                                    db.multipleDisconnect();
                                                    process.exit(1);
                                                }
                                                console.log('took - ', helpers.getFinishTime(startTime));
                                                deleteFile();
                                                db.multipleDisconnect();
                                                process.exit();
                                                // console.log('countBlocks', countBlocks)
                                                // console.log('took ', helpers.getFinishTime(startTime));
                                                // endReindex();
                                            }
                                            // console.log('addreses_to_update', addreses_to_update.length)
                                        }
                                        console.log(`worker ${worker.process.pid} died`);
                                    });
                                    if (currentBlocks.length) {
                                        worker.send({currentBlock: currentBlocks[0]});
                                        countBlocks++;
                                        currentBlocks.shift();
                                    } else {
                                        worker.send({kill: true});
                                    }
                                }
                            } else {
                                console.log('no new blocks found');
                                deleteFile();
                                db.multipleDisconnect();
                                process.exit();
                            }
                        });
                    })
                }

                // var addresses = [];
                // var local_addreses_before_save = [];
                var updateInProgress = false;


                setTimeout(startGettingNextBlocks)
                // startVinVoutClusterLinerAll()
            } else {
                process.on('message', function(msg) {
                    if(msg.currentBlock !== undefined) {
                        startUpdateBlock(msg.currentBlock);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startUpdateBlock = function(currentTx) {
                    var tx = currentTx;
                    var newBlock = new Block({
                        timestamp: tx.timestamp,
                        blockhash: tx.blockhash,
                        blockindex: tx.blockindex,
                    });
                    var checkBlock = function() {
                        BlockController.updateOne(newBlock,  function(err) {
                            if(err) {
                                // console.log('err', err);
                                if(err.stack.indexOf('Server selection timed out') > -1 ||
                                    err.stack.indexOf('interrupted at shutdown') > -1) {
                                    cluster.worker.send({mongoTimeout: true});
                                }
                            } else {
                                console.log('updated block - ' + newBlock.blockindex, tx.txid);
                            }
                            cluster.worker.send({finished: true});
                        });
                    }
                    if(tx) {
                        checkBlock();
                    } else {
                        cluster.worker.send({finished: true});
                    }
                }
            }
            break;
        case 'updatemasternodes':
            if(fileExist('mn')) {
                console.log('masternodes update is in progress');
                db.multipleDisconnect();
                process.exit(1)
                return;
            }
            createFile('mn');
            console.log('getting all masternodes from ' + wallet + ' wallet');
            wallet_commands.getAllMasternodes(wallet).then(function(masternodes) {
                // db.connect(settings[wallet].dbSettings);
                var masternodes = JSON.parse(masternodes);
                // console.log('got all masternodes', masternodes.length);
                MasternodeController.deleteAll(function () {
                    if(masternodes.length) {
                        // console.log('deleted all');

                        function updateMasternode(i) {
                            MasternodeController.updateOne(masternodes[i], function () {
                                // console.log('masernode ' + i + ' updated');
                                if (i < masternodes.length - 1) {
                                    updateMasternode(++i);
                                } else {
                                    StatsController.getOne(settings[wallet].coin, function(stats){
                                        if(stats) {
                                            console.log('updating masternode count');
                                            wallet_commands.getMasternodeCount(wallet).then(function (masterNodesCount) {
                                                MasternodeController.getMasternodesCountByCollateral(settings[wallet].masternode_required, function(masternodesCountByCollateral) {
                                                    // console.log('masternodes updated');
                                                    stats.masternodesCount = JSON.parse(masterNodesCount);
                                                    stats.masternodesCountByCollateral = masternodesCountByCollateral;
                                                    StatsController.updateWalletStats(stats, function (err) {
                                                        if (err) {
                                                            console.log(err)
                                                        }
                                                        console.log('finish updating masternode count');
                                                        db.multipleDisconnect();
                                                        deleteFile('mn');
                                                        process.exit();
                                                    });
                                                });
                                            }).catch(function (err) {
                                                console.log(err)
                                                if (err && err.toString().indexOf("couldn't connect to server") > -1) {
                                                    console.log('\n*******************************************************************');
                                                    console.log('******wallet disconnected please make sure wallet has started******');
                                                    console.log('*******************************************************************\n');
                                                }
                                                db.multipleDisconnect();
                                                deleteFile('mn');
                                                process.exit();
                                            })
                                        } else {
                                            db.multipleDisconnect();
                                            deleteFile('mn');
                                            process.exit();
                                        }
                                    })
                                }
                            })
                        }

                        updateMasternode(0);
                    } else {
                        StatsController.getOne(settings[wallet].coin, function(stats){
                            if(stats) {
                                console.log('updating masternode count');
                                wallet_commands.getMasternodeCount(wallet).then(function (masterNodesCount) {
                                    // console.log('masternodes updated');
                                    stats.masternodesCount = JSON.parse(masterNodesCount);
                                    StatsController.updateWalletStats(stats, function (err) {
                                        if (err) {
                                            console.log(err)
                                        }
                                        console.log('finish updating masternode count');
                                        db.multipleDisconnect();
                                        deleteFile('mn');
                                        process.exit();
                                    });
                                }).catch(function (err) {
                                    console.log(err)
                                    if (err && err.toString().indexOf("couldn't connect to server") > -1) {
                                        console.log('\n*******************************************************************');
                                        console.log('******wallet disconnected please make sure wallet has started******');
                                        console.log('*******************************************************************\n');
                                    }
                                    db.multipleDisconnect();
                                    deleteFile('mn');
                                    process.exit();
                                })
                            } else {
                                db.multipleDisconnect();
                                deleteFile('mn');
                                process.exit();
                            }
                        })
                        console.log('no masternodes found');
                        // db.multipleDisconnect();
                        // deleteFile('mn');
                        // process.exit();
                    }
                })
            }).catch(function(err) {
                console.log('error getting masternodes', err);
                db.multipleDisconnect();
                deleteFile('mn');
                process.exit()
            })
            break;
        case 'updatepeers': {
            if(fileExist('peers')) {
                console.log('peers update is in progress');
                db.multipleDisconnect();
                process.exit(1)
                return;
            }
            createFile('peers');
            wallet_commands.getPeerInfo(wallet).then(function(results){
                PeerController.deleteAll(function(numberRemoved) {
                    results = JSON.parse(results);
                    var updatePeer = function(i) {
                        var address = results[i].addr.split(':')[0];
                        request({uri: 'http://freegeoip.app/json/' + address, json: true}, function (error, response, geo) {
                            // console.log('address', address);
                            // console.log('error', error);
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
                                // console.log('updated peer', peer.address);
                                i++;
                                if (i < results.length - 1) {
                                    updatePeer(i)
                                } else {
                                    // console.log('peers updated');
                                    end();
                                }
                            });
                        });
                    }

                    var end = function() {
                        db.multipleDisconnect();
                        deleteFile('peers');
                        process.exit()
                    }
                    if(results.length) {
                        updatePeer(0);
                    } else {
                        end();
                    }
                })
            }).catch(function(err){
                console.log(err);
                db.multipleDisconnect();
                deleteFile('peers');
                process.exit()
            });
            break;
        }
        case 'updatestats': {
            var startTime = new Date();
            updateStats();
            break;
        }
        case 'updateextrastats': {
            var startTime = new Date();
            if(fileExist('extraStats')) {
                console.log('extra stats update is in progress');
                db.multipleDisconnect();
                process.exit(1)
                return;
            }
            createFile('extraStats');
            updateExtraStats();
            break;
        }
        case 'updaterichlist': {
            updateRichlist();
            break;
        }
        case 'updaterichlistandextrastats': {
            if(fileExist('richlist')) {
                console.log('richlist update is in progress');
                db.multipleDisconnect();
                process.exit(1)
                return;
            }
            createFile('richlist');
            updateRichlistAndExtraStats();
            break;
        }
        case 'updatemarket': {
            if(fileExist('market')) {
                console.log('market update is in progress');
                db.multipleDisconnect();
                process.exit(1)
                return;
            }
            createFile('market');
            updateMarket(wallet);
            break;
        }
        case 'updatetxbyday': {
            if(fileExist('txByDay')) {
                console.log('txbyday update is in progress');
                db.multipleDisconnect();
                process.exit(1)
                return;
            }
            createFile('txByDay');
            updateTxByDay(wallet);
            break;
        }
        case 'reindexwallet': {
            wallet_commands.stopWallet(wallet).then(function(res){
                console.log(res)
                reindex();
            }).catch(function(err){
                if(err.toString().indexOf('couldn\'t connect to server') > -1) {
                    reindex();
                }
            })
            var reindex = function() {
                wallet_commands.rescanWallet(wallet).then(function(res){
                    console.log(res)
                }).catch(function(err){
                    console.log('err', err)
                })
            }
            break;
        }
        case 'resyncwallet': {
            wallet_commands.stopWallet(wallet).then(function(res){
                console.log(res)
                rescan();
            }).catch(function(err){
                if(err.toString().indexOf('couldn\'t connect to server') > -1) {
                    rescan();
                }
            })
            var rescan = function() {
                wallet_commands.rescanWallet(wallet).then(function(res){
                    console.log(res)
                }).catch(function(err){
                    console.log('err', err)
                })
            }
            break;
        }
        case 'test':
            var startTime = new Date();
            TxVinVoutController.getAll3("5e9175eb0864d23fd7e09690", {_id: true, blockindex: true},'blockindex', 'desc', 25, function(results) {
                console.log('results', results);
                console.log('took - ', helpers.getFinishTime(startTime));
                process.exit();
            });
            break;
        case 'killall': {
            findProccessCount().then(function(count){
                if(count) {
                    killAll(wallet);
                    deleteFile();
                    console.log('killed ' + count + ' process');
                }
                process.exit();
            }).catch(function(err) {
                process.exit();
            });
            break;
        }
        case 'find_unconfirmed':
            // 27675 stream block
            var cpuCount = numCPUs;
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                for (let i = 0; i < cpuCount; i++) {
                    var worker = cluster.fork();
                    worker.on('message', function (msg) {
                        if(msg.killAll) {
                            for (var id in cluster.workers) {
                                cluster.workers[id].kill();
                            }
                        }
                    })
                }

                var exit_count = 0;
                cluster.on('exit', (worker, code, signal) => {
                    exit_count++;
                    // if(exit_count === numCPUs) {
                    //     db.multipleDisconnect();
                    // }
                    db.multipleDisconnect();
                    process.exit();
                    console.log(`worker ${worker.process.pid} died`);
                });
            } else {
                process.on('SIGTERM', function() {
                    process.exit();
                })
                var worker_number = cluster.worker.id;
                // console.log('start i', parseInt(hash_number) + worker_number)
                BlockController.estimatedDocumentCount((count) => {
                    function startTest(i) {
                        console.log('blockindex', i)
                        BlockController.getOne(i, (block) => {
                            if(!block) {
                                console.log('block is null ', i);
                                if (cluster.worker.isConnected()) {
                                    cluster.worker.send({killAll: true});
                                }
                            } else {
                                wallet_commands.getBlock(wallet, block.blockhash).then((res) => {
                                    res = JSON.parse(res);
                                    i = i + cpuCount;
                                    // console.log('next i', i);
                                    console.log('res.confirmations', res.confirmations);
                                    if(res.confirmations >= 0) {
                                        if (i < count) {
                                            if (cluster.worker.isConnected()) {
                                                startTest(i);
                                            }
                                        } else {
                                            cluster.worker.kill();
                                        }
                                    } else {
                                        console.log('negative confirmation');
                                        console.log('negative index', block.blockindex)
                                        console.log('negative hash',  block.blockhash)
                                        if (cluster.worker.isConnected()) {
                                            cluster.worker.send({killAll: true});
                                        }
                                    }
                                }).catch((err) => {
                                    console.log('err', err)
                                    console.log('err index', block.blockindex)
                                    console.log('err hash',  block.blockhash)
                                    if (cluster.worker.isConnected()) {
                                        cluster.worker.send({killAll: true});
                                    }
                                })
                            }
                        })
                    }
                    if(count) {
                        if(hash_number) {
                            startTest(parseInt(hash_number) + worker_number)
                        } else {
                            startTest(worker_number)
                        }
                    }
                })
            }
            break;
        case 'find_missing_blocks':
            var cpuCount = numCPUs;
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                for (let i = 0; i < cpuCount; i++) {
                    var worker = cluster.fork();
                    worker.on('message', function (msg) {
                        if(msg.killAll) {
                            for (var id in cluster.workers) {
                                cluster.workers[id].kill();
                            }
                        }
                    })
                }

                var exit_count = 0;
                cluster.on('exit', (worker, code, signal) => {
                    exit_count++;
                    if(exit_count === numCPUs) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                    // db.multipleDisconnect();
                    // process.exit();
                    console.log(`worker ${worker.process.pid} died`);
                });
            } else {
                process.on('SIGTERM', function() {
                    // process.exit();
                })
                var worker_number = cluster.worker.id;
                var count = 0;
                // console.log('start i', parseInt(hash_number) + worker_number)
                BlockController.getAll('blockindex', 'desc', 1, (res) => {
                    console.log('max blockindex - ', res[0].blockindex);
                    function startTest(i) {
                        count++;
                        BlockController.getOne(i, (block) => {
                            if(!block) {
                                console.log('block is null ', i);
                                if (cluster.worker.isConnected()) {
                                    cluster.worker.send({killAll: true});
                                }
                            } else {
                                i = i + cpuCount;
                                if (i < res[0].blockindex) {
                                    if (cluster.worker.isConnected()) {
                                        startTest(i);
                                    }
                                } else {
                                    console.log('count', count);
                                    cluster.worker.kill();
                                }
                            }
                        })
                    }
                    if(res && res.length) {
                        if(hash_number) {
                            startTest(parseInt(hash_number) + worker_number)
                        } else {
                            startTest(worker_number)
                        }
                    }
                })
            }
            break;
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
    BlockController.deleteAll(function(numberRemoved) {
        TxController.deleteAll(function (numberRemoved) {
            console.log(numberRemoved);
            TxVinVoutController.deleteAll(function (numberRemoved) {
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
                        StatsController.update(settings[wallet].coin, {last_block: 0}, function (err) {
                            if (err) {
                                console.log(err)
                            }
                            onEnd();
                        });
                    })
                })
            });
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
                    StatsController.update(settings[wallet].coin, {last_block: 0}, function (err) {
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
            sent: addresses[0].sent,
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
                    updateStats();
                })
            })
        })
    })
}

function endReindexNew() {
    updateStats();
    // RichlistController.getOne(settings[wallet].coin, function(richlist) {
    //     console.log('updating richlist');
    //     AddressToUpdateController.getRichlistFaster('received', 'desc', 100, function(received){
    //         AddressToUpdateController.getRichlistFaster('balance', 'desc', 100, function(balance){
    //             if(received && received.length) {
    //                 richlist.received = received.map(function (o) {return {received: o.received, a_id: o._id}});
    //             }
    //             if(balance && balance.length) {
    //                 richlist.balance = balance.map(function(o){ return {balance: o.balance, a_id: o._id}});
    //             }
    //             RichlistController.updateOne(richlist, function(err) {
    //                 console.log('finish updating richlist');
    //                 updateStats();
    //             })
    //         })
    //     })
    // })
}

function updateStats() {
    // BlockController.getAll('blockindex', 'desc', 1, function(latestTx) {
    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
        // console.log('latestTx', latestTx);
        // console.log('settings[wallet].coin', settings[wallet].coin);
        TxVinVoutController.getUsersTxsCount24Hours(function(users_tx_count_24_hours) {
            if (latestTx && latestTx.length) {
                wallet_commands.getInfo(wallet).then(function (info) {
                    info = JSON.parse(info);
                    // console.log('updating masternode count');
                    // wallet_commands.getMasternodeCount(wallet).then(function(masterNodesCount) {
                    //     console.log('finish updating masternode count');
                    wallet_commands.getNetworkHashps(wallet).then(function (networkhashps) {
                        var hashrate = (networkhashps / 1000000000).toFixed(4);
                        wallet_commands.getConnectionCount(wallet).then(function (connections) {
                            wallet_commands.getBlockCount(wallet).then(function (blockcount) {
                                get_supply('GETINFO').then(function (supply) {
                                    var stats = {
                                        coin: settings[wallet].coin,
                                        difficulty: info.difficulty,
                                        moneysupply: info.moneysupply,
                                        hashrate: hashrate,
                                        // masternodesCount: JSON.parse(masterNodesCount),
                                        connections: parseInt(connections),
                                        blockcount: parseInt(blockcount),
                                        last_block: latestTx[0].blockindex,
                                        supply: supply,
                                        version: info.version,
                                        protocol: info.protocolversion,
                                        users_tx_count_24_hours: users_tx_count_24_hours,
                                        // last_price: stats.last_price,
                                    };
                                    console.log(stats)
                                    StatsController.updateWalletStats(stats, function (err) {
                                        if (err) {
                                            console.log(err)
                                        }
                                        console.log('reindex cluster complete - ', latestTx[0].blockindex);
                                        console.log('took - ', helpers.getFinishTime(startTime));
                                        deleteFile();
                                        db.multipleDisconnect();
                                        process.exit();
                                    });
                                });
                            }).catch(function (err) {
                                console.log(err)
                                if (err && err.toString().indexOf("couldn't connect to server") > -1) {
                                    console.log('\n*******************************************************************');
                                    console.log('******wallet disconnected please make sure wallet has started******');
                                    console.log('*******************************************************************\n');
                                    deleteFile();
                                    db.multipleDisconnect();
                                    process.exit(1);
                                }
                            })
                        }).catch(function (err) {
                            console.log(err)
                            if (err && err.toString().indexOf("couldn't connect to server") > -1) {
                                console.log('\n*******************************************************************');
                                console.log('******wallet disconnected please make sure wallet has started******');
                                console.log('*******************************************************************\n');
                                deleteFile();
                                db.multipleDisconnect();
                                process.exit(1);
                            }
                        })
                    }).catch(function (err) {
                        console.log(err)
                        if (err && err.toString().indexOf("couldn't connect to server") > -1) {
                            console.log('\n*******************************************************************');
                            console.log('******wallet disconnected please make sure wallet has started******');
                            console.log('*******************************************************************\n');
                            deleteFile();
                            db.multipleDisconnect();
                            process.exit(1);
                        }
                    })
                    // }).catch(function(err) {
                    //     console.log(err)
                    //     if(err && err.toString().indexOf("couldn't connect to server") > -1) {
                    //         console.log('\n*******************************************************************');
                    //         console.log('******wallet disconnected please make sure wallet has started******');
                    //         console.log('*******************************************************************\n');
                    //         deleteFile();
                    //         db.multipleDisconnect();
                    //         process.exit(1);
                    //     }
                    // })
                }).catch(function (err) {
                    console.log(err)
                    if (err && err.toString().indexOf("couldn't connect to server") > -1) {
                        console.log('\n*******************************************************************');
                        console.log('******wallet disconnected please make sure wallet has started******');
                        console.log('*******************************************************************\n');
                        deleteFile();
                        db.multipleDisconnect();
                        process.exit(1);
                    }
                })
            } else {
                console.log('reindex no blocks found');
                deleteFile();
                db.multipleDisconnect();
                process.exit();
            }
        });

    })
}

function updateExtraStats() {
    var promises = [];
    var data = {};
    promises.push(new Promise((resolve, reject) => {
        StatsController.getOne(wallet, function(stats) {
            console.log('stats')
            data.stats = stats;
            resolve();
        })
    }))
    promises.push(new Promise((resolve, reject) => {
        AddressToUpdateController.getAddressDetails(settings[wallet].dev_address, function(address) {
            console.log('address')
            data.address = address;
            resolve();
        })
    }))
    promises.push(new Promise((resolve, reject) => {
        AddressToUpdateController.countUnique(function(total_wallets_count) {
            console.log('total_wallets_count', total_wallets_count)
            data.total_wallets_count = total_wallets_count;
            resolve();
        })
    }))
    promises.push(new Promise((resolve, reject) => {
        AddressToUpdateController.countActive(function(active_wallets_count) {
        console.log('active_wallets_count', active_wallets_count)
        data.active_wallets_count = active_wallets_count;
        resolve();
        })
    }))
    Promise.all(promises).then((response) => {
        console.log('all')
        if(data.stats) {
            data.stats.total_wallets_count = data.total_wallets_count;
            data.stats.active_wallets_count = data.active_wallets_count;
            data.stats.dev_wallet_balance = data.address.balance;
            StatsController.updateWalletExtraStats(data.stats, function (err) {
                if (err) {
                    console.log(err)
                }
                console.log('took - ', helpers.getFinishTime(startTime));
                deleteFile('extraStats');
                db.multipleDisconnect();
                process.exit();
            });
        } else {
            console.log(' no stats found yet');
            console.log('took - ', helpers.getFinishTime(startTime));
            deleteFile('extraStats');
            db.multipleDisconnect();
            process.exit();
        }
    });
}

function updateRichlist() {
    RichlistController.getOne(settings[wallet].coin, function(richlist) {
        console.log('updating richlist');
        AddressToUpdateController.getRichlistFaster('received', 'desc', 100, function(received){
            AddressToUpdateController.getRichlistFaster('balance', 'desc', 100, function(balance){
                if(received && received.length) {
                    richlist.received = received.map(function (o) {return {received: o.received, a_id: o._id}});
                }
                if(balance && balance.length) {
                    richlist.balance = balance.map(function(o){ return {balance: o.balance, a_id: o._id}});
                }
                RichlistController.updateOne(richlist, function(err) {
                    console.log('finish updating richlist');
                    db.multipleDisconnect();
                    process.exit();
                })
            })
        })
    })
}
function updateRichlistAndExtraStats() {
    var startTime = new Date();
    RichlistController.getOne(settings[wallet].coin, function(richlist) {
        console.log('updating richlist');
        AddressToUpdateController.getRichlistAndExtraStats('received', 'desc', 100, settings[wallet].dev_address, function(results){
            var received = results.data;
            AddressToUpdateController.getRichlistAndExtraStats('balance', 'desc', 100, settings[wallet].dev_address, function(results){
                var active_wallets_count = results.countActive;
                var total_wallets_count = results.countUnique;
                var dev_wallet_balance = results.devAddressBalance;
                var balance = results.data;
                if(received && received.length) {
                    richlist.received = received.map(function (o) {return {received: o.received, a_id: o._id}});
                }
                if(balance && balance.length) {
                    richlist.balance = balance.map(function(o){ return {balance: o.balance, a_id: o._id}});
                }
                StatsController.getOne(settings[wallet].coin, function(stats) {
                    stats.active_wallets_count = active_wallets_count;
                    stats.total_wallets_count = total_wallets_count;
                    stats.dev_wallet_balance = dev_wallet_balance;
                    StatsController.updateWalletExtraStats(stats, function (err) {
                        console.log(stats)
                        if (err) {
                            console.log(err)
                        }
                        RichlistController.updateOne(richlist, function (err) {
                            console.log('finish updating richlist');
                            console.log('took - ', helpers.getFinishTime(startTime));
                            deleteFile('richlist');
                            db.multipleDisconnect();
                            process.exit();
                        })
                    });
                });
            })
        })
    })
}


var gettingNextTxs = function(limit, offset, blockindex) {
    var promise = new Promise(function(resolve, reject) {
        getNextTxs(limit, offset, blockindex).then(function (res) {
            if (res.length) {
                console.log('got chunks', (offset * limit) + ' - ' + (offset * limit + limit));
                // currentBlocks = currentBlocks.concat(res);
                resolve(res);
                // gettingNextTxs();
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

var getNextTxs = function(limit, offset, blockindex) {
    var promise = new Promise(function(resolve, reject) {
        var where = {};
        var fields = {}
        if(blockindex) {
            where = {blockindex : {$gte : blockindex}};
        }
        TxController.getAll2(where, fields,'blockindex', 'asc', limit, offset * limit, function(results) {
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
var gettingNextTxsVinVout = function(limit, offset, blockindex) {
    var promise = new Promise(function(resolve, reject) {
        getNextTxsVinVout(limit, offset, blockindex).then(function (res) {
            if (res.length) {
                console.log('got chunks', (offset * limit) + ' - ' + (offset * limit + limit));
                // currentBlocks = currentBlocks.concat(res);
                resolve(res);
                // gettingNextTxs();
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

var getNextTxsVinVout = function(limit, offset, blockindex) {
    var promise = new Promise(function(resolve, reject) {
        var where = {};
        var fields = {}
        if(blockindex) {
            where = {blockindex : {$gte : blockindex}};
        }
        TxVinVoutController.getAll2(where, fields, 'blockindex', 'asc', limit, offset, function(results) {
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

var gettingNextAddresses = function(limit, offset, blockindex) {
    var promise = new Promise(function(resolve, reject) {
        getAddresses(limit, offset, blockindex).then(function (res) {
            if (res.length) {
                console.log('got chunks', (offset * limit) + ' - ' + (offset * limit + limit));
                // currentBlocks = currentBlocks.concat(res);
                resolve(res);
                // gettingNextTxs();
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

var getAddresses = function(limit, offset, blockindex) {
    var promise = new Promise(function(resolve, reject) {
        var where = {};
        var fields = {}
        where = {$or: [{txid_type: {$exists: false}}, {txid_type: {$eq: 0}}]};
        if(blockindex) {
            where.blockindex = { $gte : blockindex};
        }
        // where.txid_timestamp = {$type: 2};
        AddressToUpdateController.getAll2(where, fields,'', '', limit, offset, function(results) {
            // if(startCount < 1) {
            //     startCount++;
            //     resolve(results);
            // } else {
            //     resolve([]);
            // }
            console.log('results.length', results.length);
            resolve(results);
        });
    });
    return promise;
}

var gettingNextTxsByOrder = function(limit, offset, lastOrder) {
    var promise = new Promise(function(resolve, reject) {
        getNextTxsByOrder(limit, offset, lastOrder).then(function (res) {
            if (res.length) {
                // console.log('got chunks', (offset * limit) + ' - ' + (offset * limit + limit));
                // currentBlocks = currentBlocks.concat(res);
                resolve(res);
                // gettingNextTxs();
            } else {
                console.log('finish getting chunks');
            }
            resolve();
        });
    });
    return promise;
}

var getNextTxsByOrder = function(limit, offset, lastOrder) {
    var promise = new Promise(function(resolve, reject) {
        var where = {};
        var fields = {}
        if(lastOrder) {
            // where = {order: {$gt: lastOrder}};
            where = {$or: [{order: {$exists: false}}, {order: {$gt: lastOrder}}, {order: {$eq: 0}}]};
        }
        TxVinVoutController.getAll2(where, fields,'blockindex', 'asc', limit, offset, function(results) {
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

function get_supply(type) {
    var promise = new Promise(function(resolve, reject) {
        if (type == 'GETINFO') {
            wallet_commands.getInfo(wallet).then(function(results){
                resolve(JSON.parse(results).moneysupply)
            })
        } else if (type == 'BALANCES') {
            AddressToUpdateController.getBalanceSupply(function(supply) {
                resolve(supply.balance/100000000)
            });
        } else if (type == 'TXOUTSET') {
            wallet_commands.getTxoutsetInfo(wallet).then(function(results){
                resolve(JSON.parse(results).total_amount)
            })
        } else {
            AddressToUpdateController.getCoinbaseSupply(function(coinbase) {
                resolve(coinbase.sent/100000000)
            });
        }
    })
    return promise;
};
var globalStartGettingTransactions = function(blockNum) {
    var txInsertCount = 0;
    var blockInserted = false;
    wallet_commands.getBlockHash(wallet, blockNum).then(function (hash) {
        wallet_commands.getBlock(wallet, hash).then(function (block) {
            // TODO
            // check if block confirmation not -1
            var current_block = JSON.parse(block);
            var newBlock = new Block({
                timestamp: current_block.time,
                blockhash: current_block.hash,
                blockindex: current_block.height,
            });
            BlockController.updateOne(newBlock, function(err) {
                blockInserted = true;
                if(err) {
                    console.log('create block err ', err);
                }
                if (txInsertCount >= current_block.tx.length && blockInserted) {
                    cluster.worker.send({finished: true});
                }
            });
            var updateBlockTx = function(i, current_block) {
                wallet_commands.getRawTransaction(wallet, current_block.tx[i]).then(function (obj) {
                    obj = JSON.parse(obj);
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
                            console.log('err', err.stack);
                            if(err.stack.indexOf('Server selection timed out') > -1 ||
                                err.stack.indexOf('interrupted at shutdown') > -1) {
                                cluster.worker.send({mongoTimeout: true});
                            }
                        }
                        if (txInsertCount >= current_block.tx.length && blockInserted) {
                            cluster.worker.send({finished: true});
                        }
                    });

                    if(i < current_block.tx.length - 1) {
                        updateBlockTx(++i, current_block);
                    }
                }).catch(function (err) {
                    if(err && err.toString().indexOf("couldn't parse reply from server") > -1) {
                        globalStartGettingTransactions(blockNum);
                    }
                    else if(err && err.toString().indexOf('No information available about transaction') > -1) {
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
                                console.log('err', err.stack);
                                if(err.stack.indexOf('Server selection timed out') > -1 ||
                                    err.stack.indexOf('interrupted at shutdown') > -1) {
                                    cluster.worker.send({mongoTimeout: true});
                                }
                            }
                            if (txInsertCount >= current_block.tx.length && blockInserted) {
                                cluster.worker.send({finished: true});
                            }
                        });
                        if(i < current_block.tx.length - 1) {
                            updateBlockTx(++i, current_block);
                        }
                    } else {
                        if(err && err.toString().indexOf("couldn't connect to server") > -1) {
                            cluster.worker.send({walletDisconnected: true});
                        }
                        console.log('err raw transaction', err);
                        cluster.worker.send({blockNotFound: true});
                    }
                });
            }
            updateBlockTx(0, current_block);
        }).catch(function (err) {
            if(err && err.toString().indexOf("couldn't parse reply from server") > -1) {
                globalStartGettingTransactions(blockNum);
            } else {
                if(err && err.toString().indexOf("couldn't connect to server") > -1) {
                    cluster.worker.send({walletDisconnected: true});
                }
                console.log('error getting block - ' + blockNum, err);
                cluster.worker.send({blockNotFound: true});
            }
        });
    }).catch(function (err) {
        if(err && err.toString().indexOf("couldn't parse reply from server") > -1) {
            globalStartGettingTransactions(blockNum);
        } else {
            if(err && err.toString().indexOf("couldn't connect to server") > -1) {
                cluster.worker.send({walletDisconnected: true});
            }
            console.log('error getting block hash - ' + blockNum, err);
            cluster.worker.send({blockNotFound: true});
        }
    })
}
var globalCheckVinVoutCluster = function(tx) {
    helpers.prepare_vin_db(wallet, tx).then(function (vin) {
        helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
            helpers.calculate_total(obj.vout).then(function (total) {

                var tx_type = tx_types.NORMAL;
                if(!obj.vout.length) {
                    tx_type = tx_types.NONSTANDARD;
                } else if(!obj.nvin.length) {
                    tx_type = tx_types.POS;
                } else if(obj.nvin.length && obj.nvin[0].addresses === 'coinbase') {
                    tx_type = tx_types.NEW_COINS;
                }

                var addreses_to_update = [];
                for (var i = 0; i < obj.nvin.length; i++) {
                    // TODO update mongodb adress sceme
                    addreses_to_update.push({address: obj.nvin[i].addresses, txid: tx.txid, amount: obj.nvin[i].amount, type: 'vin', txid_timestamp: tx.timestamp, blockindex: tx.blockindex, txid_type: tx_type})
                    // addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                    // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                }
                for (var i = 0; i < obj.vout.length; i++) {
                    // TODO update mongodb adress sceme
                    addreses_to_update.push({address: obj.vout[i].addresses, txid: tx.txid, amount: obj.vout[i].amount, type: 'vout', txid_timestamp: tx.timestamp, blockindex: tx.blockindex, txid_type: tx_type})
                    // addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                    // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                }
                // if(addreses_to_update.length) {
                //     cluster.worker.send({addreses_to_update: addreses_to_update});
                // }
                var vinvout = {txid: tx.txid, vin: obj.nvin, vout: obj.vout, total: total, blockindex: tx.blockindex, timestamp: tx.timestamp, type: tx_type, type_str: tx_types.toStr(tx_type), order: tx.order};
                var finishUpdateTx = false;
                var finishUpdateAddress = false;
                TxVinVoutController.updateOne(vinvout, function(err) {
                    finishUpdateTx = true;
                    if(err) {
                        console.log('err', err);
                        if(err.stack.indexOf('Server selection timed out') > -1 ||
                            err.stack.indexOf('interrupted at shutdown') > -1) {
                            cluster.worker.send({mongoTimeout: true});
                        }
                    }
                    console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                    if(finishUpdateTx && finishUpdateAddress) {
                        cluster.worker.send({finished: true});
                    }
                })

                var insertAddresses = function() {
                    if (addreses_to_update.length) {
                        console.log('updating address - ' + addreses_to_update[0].blockindex, addreses_to_update[0].address);
                        AddressToUpdateController.updateOne(addreses_to_update[0], function(err){
                            if(err) {
                                console.log(err);
                                if(err.stack.indexOf('Server selection timed out') > -1 ||
                                    err.stack.indexOf('interrupted at shutdown') > -1) {
                                    cluster.worker.send({mongoTimeout: true});
                                }
                            } else {
                                cluster.worker.send({countAddress: true});
                                addreses_to_update.shift();
                            }
                            insertAddresses();
                        })
                    } else {
                        finishUpdateAddress = true;
                        if(finishUpdateTx && finishUpdateAddress) {
                            cluster.worker.send({finished: true});
                        }
                    }
                }
                insertAddresses();
                // console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                // cluster.worker.send({finished: true});
                // resolve({tx: tx, nvin: obj.nvin, vout: obj.vout, total: total, addreses_to_update: addreses_to_update});
            })
        })
    })
}

function updateMarket(wallet) {
    newCapitalMarket.getExchangeInfo().then(function(data) {
        var symbols = data.symbols;
        var volume = data['24h_volume'];
        var usd_price = data.usd_price;
        var symbolsToUpdate = [];
        for(var i in symbols) {
            var symbol = symbols[i].symbol;
            var baseAsset = symbols[i].baseAsset; // from coin
            var baseAssetName = symbols[i].baseAssetName; // from coin real name
            var quoteAsset = symbols[i].quoteAsset; // to coin
            var quoteAssetName = symbols[i].quoteAssetName; // to coin real name
            if(wallet.toLowerCase() === baseAsset.toLowerCase() ||
                wallet.toLowerCase() === baseAssetName.toLowerCase() ||
                wallet.toLowerCase() === quoteAsset.toLowerCase() ||
                wallet.toLowerCase() === quoteAssetName.toLowerCase()) {
                var splitSymbol = symbol.split('_')
                symbolsToUpdate.push({from: splitSymbol[0], to: splitSymbol[1]});
            }
        }
        var finishUpdateMarketCap = false;
        var finishUpdateMarket = false;
        function updateCoinMarketCap(i) {
            newCapitalMarket.getTicker(symbolsToUpdate[i].from, symbolsToUpdate[i].to).then(function (data) {
                CoinMarketCapController.updateOne(data, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('market cap update success ', data.symbol)
                    }
                    i++;
                    if(i < symbolsToUpdate.length) {
                        updateCoinMarketCap(i);
                    } else {
                        finishUpdateMarketCap = true;
                        finishUpdateMarkets();
                    }
                });
                // console.log('data', data);
            }).catch(function (err) {
                console.log('err', err)
                deleteFile('market');
                db.multipleDisconnect()
                process.exit();
            })
        }

        function updateMarket(i) {
            newCapitalMarket.getTrades(symbolsToUpdate[i].from, symbolsToUpdate[i].to).then(function (history) {
                newCapitalMarket.getDepth(symbolsToUpdate[i].from, symbolsToUpdate[i].to).then(function (asksAndBids) {
                    var market = {
                        market_name: 'New Capital',
                        symbol: symbolsToUpdate[i].from + '_' + symbolsToUpdate[i].to,
                        summary: {
                            '24h_volume': volume,
                            usd_price: usd_price,
                        },
                        bids: asksAndBids.bids,
                        asks: asksAndBids.asks,
                        history: history,
                    }
                    MarketController.updateOne(market, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('market update success ', market.symbol)
                        }
                        i++;
                        if (i < symbolsToUpdate.length) {
                            updateMarket(i);
                        } else {
                            finishUpdateMarket = true;
                            finishUpdateMarkets();
                        }
                    });
                }).catch(function (err) {
                    console.log('err', err)
                    deleteFile('market');
                    db.multipleDisconnect()
                    process.exit();
                })
                // console.log('data', data);
            }).catch(function (err) {
                console.log('err', err)
                deleteFile('market');
                db.multipleDisconnect()
                process.exit();
            })
        }

        function finishUpdateMarkets() {
            if(finishUpdateMarketCap && finishUpdateMarket) {
                deleteFile('market');
                db.multipleDisconnect()
                process.exit();
            }
        }
        if(symbolsToUpdate.length) {
            updateCoinMarketCap(0);
            updateMarket(0);
        } else {
            finishUpdateMarketCap = true;
            finishUpdateMarket = true;
            finishUpdateMarkets()
        }
        // console.log(symbolsToUpdate)
        // console.log('data', data);
    }).catch(function(err) {
        console.log('err', err);
        deleteFile('market');
        db.multipleDisconnect()
        process.exit();
    });
}

function updateTxByDay(wallet) {
    TxByDayController.getAll('d', 'desc', 2, function(data) {
        if(data.length) {
            var lastDate = data[0].d
            if(data.length > 1) {
                lastDate = data[1].d
            }
            console.log('data',lastDate);
            updateTxByDay(lastDate);
        } else {
            console.log('no data yet');
            updateTxByDay("");
            // db.multipleDisconnect()
        }
    })

    function updateTxByDay(dateString) {
        TxVinVoutController.getTransactionsChart(dateString, function(txByDays) {
            if(txByDays && txByDays.length) {
                updateTxByDayOneByOne(txByDays);
            } else {
                console.log('no tx found');
                deleteFile('txByDay');
                db.multipleDisconnect();
            }
        })
    }

    function updateTxByDayOneByOne(txByDays) {
        console.log(txByDays[0])
        TxByDayController.updateOne(txByDays[0], function(err) {
            if(err) {
                console.log('err', err);
            } else {
                txByDays = txByDays.slice(1);
                if(txByDays.length) {
                    updateTxByDayOneByOne(txByDays)
                } else {
                    deleteFile('txByDay');
                    db.multipleDisconnect();
                }
            }
        })
    }
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
function forceReindexFrom(onYes, onNo, from) {
    console.log('would you like to force reindex from block num - ' + from);
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

function killAll(wallet) {
    exec('ps -ef | grep "sync.js ' + wallet + '" | grep -v grep | awk \'{print $2}\' | xargs -r kill -9');
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


