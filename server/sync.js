const wallet_commands = require('./wallet_commands');
const helpers = require('./helpers');
const request = require('request');
const cluster = require('cluster');
const fs = require('fs-extra');
const exec = require('child_process').exec;
let numCPUs = require('os').cpus().length;
// if(numCPUs > 4) {
//     numCPUs = 4;
// }
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
    'update_addresses_order_and_sum',

    'save_from_tx',
    'save_from_tx_vin_vout_and_addresses',
    'save_from_update_addresses_order_and_sum',
    'save_tx_vin_vout_and_addresses_based_on_latest',

    'delete_from',

    'save_tx_linear',
    'reindex_block_only_from',

    'update_address_type',
    'update_address_type_timestamp',
    'update_address_order',
    'update_address_balance',
    'update_address_balance_cursor',
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
    'updateclusterstxbyday',
    'updateoneclusterstxbyday',
    'test',
    'fix_address_order',
    'find_unconfirmed',
    'find_missing_blocks',
    'find_orphans_tx_in_address',
    'find_missing_txs',
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
        var ClusterController = require('./database/controllers/cluster_controller');
        var ClusterTxByDayController = require('./database/controllers/cluster_tx_by_day_controller');
        var ClustersBlockController = require('./database/controllers/clusters_block_controller');

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
                    var blockNotFound = false;
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
                                    blockNotFound = msg.blockNumber;
                                    for(var id in cluster.workers) {
                                        cluster.workers[id].send({kill: true});
                                    }
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
                                    if(blockNotFound) {
                                        console.log('\n*******************************************************************');
                                        console.log('****** block not found, please reindex again from block - ' + blockNotFound + '******')
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
                var limit = 2000;
                var gotBlocks = 0;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextTxsInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                var lastOrder = 0;
                var blockindex = 0;
                var lastTx;
                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.deleteAll(function(numberRemoved) {
                        AddressController.deleteAll(function(numberRemoved) {
                            AddressToUpdateController.deleteAll(function (numberRemoved) {
                                gettingNextTxsInProgress = true;
                                gettingNextTxs(limit, offset, blockindex, lastTx).then(function (res) {
                                    gotBlocks++;
                                    gettingNextTxsInProgress = false;
                                    if (res && res.length) {
                                        lastTx = res[res.length - 1];
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
                                                                    gettingNextTxs(limit, offset, blockindex, lastTx).then(function (res) {
                                                                        gotBlocks++;
                                                                        if (res && res.length) {
                                                                            lastTx = res[res.length - 1];
                                                                            currentBlocks = currentBlocks.concat(res);
                                                                        }
                                                                        gettingNextTxsInProgress = false;
                                                                        if (currentBlocks.length) {
                                                                            console.log('clusterQ', clusterQ)
                                                                            while (clusterQ.length) {
                                                                                cluster.workers[clusterQ[0]].send({
                                                                                    currentBlock: currentBlocks[0],
                                                                                    order: lastOrder + countBlocks
                                                                                });
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
                                                            cluster.workers[clusterQ[0]].send({
                                                                currentBlock: currentBlocks[0],
                                                                order: lastOrder + countBlocks
                                                            });
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
                                                worker.send({
                                                    currentBlock: currentBlocks[0],
                                                    order: lastOrder + countBlocks
                                                });
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
                    // console.log(`Master ${process.pid} is running`);
                    if(fileExist()) {
                        // console.log('reindex is in progress');
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
                    var blockNotFound = false;
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
                                // console.log('no new blocks found');
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
                                        blockNotFound = msg.blockNotFound;
                                        for(var id in cluster.workers) {
                                            cluster.workers[id].send({kill: true});
                                        }
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
                                        if(blockNotFound) {
                                            console.log('\n*******************************************************************');
                                            console.log('****** block not found, please reindex again from block - ' + blockNotFound + '******')
                                            console.log('*******************************************************************\n');
                                            exit_code = 1;
                                        }
                                        // console.log('took - ', helpers.getFinishTime(startTime));
                                        deleteFile();
                                        db.multipleDisconnect();
                                        process.exit(exit_code);
                                    }
                                    // console.log(`worker ${worker.process.pid} died`);
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
                // console.log(`Master ${process.pid} is running`);
                if(fileExist()) {
                    // console.log('reindex is in progress');
                    db.multipleDisconnect();
                    process.exit(1)
                    return;
                }
                createFile();
                var currentBlocks = [];
                var limit = 2000;
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
                        var lastTx;
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
                                // console.log('tx vin vout', numberDeleted);
                                // console.log('address deleted', numberDeleted2);
                                gettingNextTxsInProgress = true;
                                gettingNextTxs(limit, offset, currentBlockIndex, lastTx).then(function (res) {
                                    gotBlocks++;
                                    gettingNextTxsInProgress = false;
                                    if (res && res.length) {
                                        lastTx = res[res.length -1];
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
                                                                    gettingNextTxs(limit, offset, currentBlockIndex, lastTx).then(function (res) {
                                                                        gotBlocks++;
                                                                        if (res && res.length) {
                                                                            lastTx = res[res.length -1];
                                                                            currentBlocks = currentBlocks.concat(res);
                                                                        }
                                                                        gettingNextTxsInProgress = false;
                                                                        if (currentBlocks.length) {
                                                                            console.log('clusterQ', clusterQ)
                                                                            while (clusterQ.length) {
                                                                                cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0], order: lastOrder + countBlocks});
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
                                                            cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0], order: lastOrder + countBlocks});
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
                                                // console.log(`worker ${worker.process.pid} died`);
                                            })
                                            if (currentBlocks.length) {
                                                worker.send({currentBlock: currentBlocks[0], order: lastOrder + countBlocks});
                                                countBlocks++;
                                                currentBlocks.shift();
                                            } else {
                                                worker.send({kill: true});
                                            }
                                        }
                                    } else {
                                        // console.log('no new blocks found');
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
        case 'update_addresses_order_and_sum': // 12:47:25.775 - block count 268159
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
                var currentAddresses = [];
                var limit = 20000;
                var countAddresses = 0;
                var offset = 0;
                var cpuCount = 1;
                var clusterQ = [];
                var gettingNextAddressInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                gettingNextAddressInProgress = true;
                var startAddressLinerAll = function() {
                    AddressToUpdateController.estimatedDocumentCount(function(count) {
                        console.log('count', count)
                        gettingNextUniqueAddresses(limit, offset, count).then(function (res) {
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
                                                // console.log('currentAddresses.length', currentAddresses.length);
                                                clusterQ.push(id);
                                                if (currentAddresses.length) {
                                                    cluster.workers[clusterQ[0]].send({currentAddress: currentAddresses[0]});
                                                    clusterQ.shift();
                                                    countAddresses++;
                                                    currentAddresses.shift();

                                                } else {
                                                    // console.log('clusterQ.length', clusterQ.length);
                                                    if (clusterQ.length === cpuCount) {
                                                        gettingNextAddressInProgress = true;
                                                        // offset++;
                                                        gettingNextUniqueAddresses(limit, offset, count).then(function (res) {
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
                                                                    console.log('kill');
                                                                    cluster.workers[clusterQ[0]].send({kill: true});
                                                                    clusterQ.shift();
                                                                }
                                                            }
                                                        });
                                                    }
                                                    // if (!gettingNextAddressInProgress) {
                                                    //     cluster.workers[clusterQ[0]].send({kill: true});
                                                    //     clusterQ.shift();
                                                    // }
                                                }
                                            })(this.id)
                                        }
                                        if (msg.mongoTimeout) {
                                            mongoTimeout = true;
                                            for(var id in cluster.workers) {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        }
                                        if (msg.stopAllProccess) {
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
                                deleteFile();
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
                        startUpdatingAddress(msg.currentAddress);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });

                var startUpdatingAddress = function(currentAddress) {
                    var address = currentAddress._id;
                    var lastSent = 0;
                    var lastReceived = 0;
                    var lastOrder = 0;
                    var lastBlockIndex = 0;
                    AddressController.getOne(address, function(lastAddress) {
                        AddressToUpdateController.getAll3({address: address, order: {$gt: 0}}, {}, {blockindex: -1,order:-1}, 1, 0, function (lastAddressOrder) {
                            if (lastAddressOrder && lastAddressOrder.length) {
                                lastOrder = lastAddressOrder[0].order;
                                lastSent = lastAddressOrder[0].sent;
                                lastReceived = lastAddressOrder[0].received;
                                lastBlockIndex = lastAddressOrder[0].blockindex;
                            }
                            updateAddresses(lastAddress);
                        })
                    });
                    function roundToMaxSafeInt(val) {
                        if(!Number.isSafeInteger(val)) {
                            var diff = val.toString().length - Number.MAX_SAFE_INTEGER.toString().length;
                            if(diff > 0) {
                                val = Math.round(val / (diff * 10))
                            }
                        }
                        return val;
                    }

                    function updateAddresses(lastAddress) {
                        AddressToUpdateController.getAll3({address: address, blockindex: {$gte: lastBlockIndex} , order: {$not:{$gt: 0}}}, {},{blockindex: 1}, 1, 0, function(addr) {
                            if(!addr.length) {
                                cluster.worker.send({finished: true, address: address});
                                return;
                            }
                            addr = addr[0];
                            addr.received = lastReceived;
                            addr.sent = lastSent;
                            var amount = roundToMaxSafeInt(addr.amount);
                            if(addr.address === 'coinbase') {
                                addr.sent += parseFloat(amount);
                            }
                            else if(addr.type === 'vin') {
                                addr.sent += parseFloat(amount);
                            }
                            else if(addr.type === 'vout') {
                                addr.received += parseFloat(amount);
                            }
                            addr.balance = addr.received - addr.sent;
                            lastOrder++;
                            addr.order = lastOrder;

                            if(!lastAddress) {
                                lastAddress = {};
                            }
                            lastAddress.a_id = address;
                            lastAddress.sent = addr.sent;
                            lastAddress.received = addr.received;
                            lastAddress.balance = addr.balance;
                            lastAddress.last_order = addr.order;
                            lastAddress.last_blockindex = addr.blockindex;
                            // console.log('addr', addr)
                            // console.log('lastAddress', lastAddress)
                            // console.log('lastOrder', lastOrder)
                            // console.log('lastSent', lastSent)
                            // console.log('lastReceived', lastReceived)
                            // console.log('lastOrder', lastOrder)
                            // console.log('lastAddress.last_blockindex - ' + lastAddress.last_blockindex + 'lastOrder ' + lastOrder)
                            // return;
                            AddressToUpdateController.updateOne(addr, function(err){
                                if(err) {
                                    console.log('err', err)
                                    console.log('addr', addr)
                                    if(err.stack.indexOf('Server selection timed out') > -1 ||
                                        err.stack.indexOf('interrupted at shutdown') > -1) {
                                        cluster.worker.send({mongoTimeout: true});
                                    }
                                    cluster.worker.send({stopAllProccess: true});
                                } else {
                                    // console.log('address updated - ' +  address + ' - block '  + lastAddress.last_blockindex + ' order ' + lastOrder + ' - ' + addr.txid_timestamp);

                                    AddressController.updateOne(lastAddress, function(err) {
                                        if(err) {
                                            console.log('err1', err);
                                            console.log('lastAddress', lastAddress);
                                            if(err.stack.indexOf('Server selection timed out') > -1 ||
                                                err.stack.indexOf('interrupted at shutdown') > -1) {
                                                cluster.worker.send({mongoTimeout: true});
                                            }
                                            cluster.worker.send({stopAllProccess: true});
                                        } else {
                                            // lastOrder = addr.order;
                                            lastSent = addr.sent;
                                            lastReceived = addr.received;
                                            lastBlockIndex = addr.blockindex;
                                            updateAddresses(lastAddress);
                                        }
                                    })
                                }

                            })
                        });
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
                    var blockNotFound = false;
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
                                    blockNotFound = msg.blockNumber;
                                    for(var id in cluster.workers) {
                                        cluster.workers[id].send({kill: true});
                                    }
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
                                    if(blockNotFound) {
                                        console.log('\n*******************************************************************');
                                        console.log('****** block not found, please reindex again from block - ' + blockNotFound + '******')
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
        case 'update_address_balance': // 12:47:25.775 - block count 268159
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
                    AddressToUpdateController.estimatedDocumentCount(function(count) {
                        console.log('count', count)
                        gettingNextUniqueAddresses(limit, offset, count).then(function (res) {
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
                                                // console.log('currentAddresses.length', currentAddresses.length);
                                                clusterQ.push(id);
                                                if (currentAddresses.length) {
                                                    cluster.workers[clusterQ[0]].send({currentAddress: currentAddresses[0]});
                                                    clusterQ.shift();
                                                    countAddresses++;
                                                    currentAddresses.shift();

                                                } else {
                                                    // console.log('clusterQ.length', clusterQ.length);
                                                    if (clusterQ.length === cpuCount) {
                                                        gettingNextAddressInProgress = true;
                                                        // offset++;
                                                        gettingNextUniqueAddresses(limit, offset, count).then(function (res) {
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
                                                                    console.log('kill');
                                                                    cluster.workers[clusterQ[0]].send({kill: true});
                                                                    clusterQ.shift();
                                                                }
                                                            }
                                                        });
                                                    }
                                                    // if (!gettingNextAddressInProgress) {
                                                    //     cluster.workers[clusterQ[0]].send({kill: true});
                                                    //     clusterQ.shift();
                                                    // }
                                                }
                                            })(this.id)
                                        }
                                        if (msg.mongoTimeout) {
                                            mongoTimeout = true;
                                            for(var id in cluster.workers) {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        }
                                        if (msg.stopAllProccess) {
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
                        startUpdatingAddress(msg.currentAddress);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });

                var startUpdatingAddress = function(currentAddress) {
                    var address = currentAddress._id;
                    var lastSent = 0;
                    var lastReceived = 0;
                    var lastOrder = 0;
                    var lastBlockIndex = 0;
                    AddressController.getOne(address, function(lastAddress) {
                        AddressToUpdateController.getAll3({address: address, order: {$gt: 0}}, {}, {blockindex: -1,order:-1}, 1, 0, function (lastAddressOrder) {
                            if (lastAddressOrder && lastAddressOrder.length) {
                                lastOrder = lastAddressOrder[0].order;
                                lastSent = lastAddressOrder[0].sent;
                                lastReceived = lastAddressOrder[0].received;
                                lastBlockIndex = lastAddressOrder[0].blockindex;
                            }
                            updateAddresses(lastAddress);
                        })
                    });
                    function roundToMaxSafeInt(val) {
                        if(!Number.isSafeInteger(val)) {
                            var diff = val.toString().length - Number.MAX_SAFE_INTEGER.toString().length;
                            if(diff > 0) {
                                val = Math.round(val / (diff * 10))
                            }
                        }
                        return val;
                    }

                    function updateAddresses(lastAddress) {
                        AddressToUpdateController.getAll3({address: address, blockindex: {$gte: lastBlockIndex} , order: {$not:{$gt: 0}}}, {},{blockindex: 1}, 1, 0, function(addr) {
                            if(!addr.length) {
                                cluster.worker.send({finished: true, address: address});
                                return;
                            }
                            addr = addr[0];
                            addr.received = lastReceived;
                            addr.sent = lastSent;
                            var amount = roundToMaxSafeInt(addr.amount);
                            if(addr.address === 'coinbase') {
                                addr.sent += parseFloat(amount);
                            }
                            else if(addr.type === 'vin') {
                                addr.sent += parseFloat(amount);
                            }
                            else if(addr.type === 'vout') {
                                addr.received += parseFloat(amount);
                            }
                            addr.balance = addr.received - addr.sent;
                            lastOrder++;
                            addr.order = lastOrder;

                            if(!lastAddress) {
                                lastAddress = {};
                            }
                            lastAddress.a_id = address;
                            lastAddress.sent = addr.sent;
                            lastAddress.received = addr.received;
                            lastAddress.balance = addr.balance;
                            lastAddress.last_order = addr.order;
                            lastAddress.last_blockindex = addr.blockindex;
                            // console.log('addr', addr)
                            // console.log('lastAddress', lastAddress)
                            // console.log('lastOrder', lastOrder)
                            // console.log('lastSent', lastSent)
                            // console.log('lastReceived', lastReceived)
                            // console.log('lastOrder', lastOrder)
                            // console.log('lastAddress.last_blockindex - ' + lastAddress.last_blockindex + 'lastOrder ' + lastOrder)
                            // return;
                            AddressToUpdateController.updateOne(addr, function(err){
                                if(err) {
                                    console.log('err', err)
                                    console.log('addr', addr)
                                    if(err.stack.indexOf('Server selection timed out') > -1 ||
                                        err.stack.indexOf('interrupted at shutdown') > -1) {
                                        cluster.worker.send({mongoTimeout: true});
                                    }
                                    cluster.worker.send({stopAllProccess: true});
                                } else {
                                    console.log('address updated - ' +  address + ' - block '  + lastAddress.last_blockindex + ' order ' + lastOrder + ' - ' + addr.txid_timestamp);

                                    AddressController.updateOne(lastAddress, function(err) {
                                        if(err) {
                                            console.log('err1', err);
                                            console.log('lastAddress', lastAddress);
                                            if(err.stack.indexOf('Server selection timed out') > -1 ||
                                                err.stack.indexOf('interrupted at shutdown') > -1) {
                                                cluster.worker.send({mongoTimeout: true});
                                            }
                                            cluster.worker.send({stopAllProccess: true});
                                        } else {
                                            // lastOrder = addr.order;
                                            lastSent = addr.sent;
                                            lastReceived = addr.received;
                                            lastBlockIndex = addr.blockindex;
                                            updateAddresses(lastAddress);
                                        }
                                    })
                                }

                            })
                        });
                    }
                }
            }
            break;
        case 'update_address_balance_cursor':
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
                var limit = 0;
                var countAddresses = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var activeAddresses = [];
                var main_cursor;
                var exit_count = 0;
                var mongoTimeout = false;
                var gettingNextInProgress = false;
                var gettingNextChunkInProgress = false;
                var startedClusters = 0;
                var gotNewData = false;
                var startAddressLinerAll = function() {
                    AddressToUpdateController.estimatedDocumentCount(function(count) {
                        console.log('count', count)
                        getNextChunk(0, count, activeAddresses).then(function () {
                                for (let i = 0; i < cpuCount; i++) {
                                    var worker = cluster.fork();
                                    worker.on('message', function (msg) {
                                        if (msg.finished) {
                                            (function (id) {
                                                // console.log('currentAddresses.length', currentAddresses.length);
                                                // console.log('countAddresses', countAddresses)
                                                clusterQ.push(id);
                                                startedClusters--;
                                                if(activeAddresses[id]) {
                                                    delete activeAddresses[id];
                                                }
                                                if(!gettingNextInProgress) {
                                                    getNextForAllClusters();
                                                }
                                            })(this.id)
                                        }
                                        if (msg.mongoTimeout) {
                                            mongoTimeout = true;
                                            for(var id in cluster.workers) {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        }
                                        if (msg.stopAllProccess) {
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
                                        console.log(`worker ${worker.process.pid} died - code ${code} , signal - ${signal}`);
                                    })
                                    clusterQ.push(worker.id);
                                    if(!gettingNextInProgress) {
                                        getNextForAllClusters();
                                    }
                                }
                        });

                        function getNextForAllClusters() {
                            gettingNextInProgress = true;
                            getNext().then(function(address) {
                                gettingNextInProgress = false;
                                if(activeAddresses.indexOf(address._id) === -1) {
                                    cluster.workers[clusterQ[0]].send({currentAddress: address});
                                    activeAddresses[clusterQ[0]] = address._id;
                                    clusterQ.shift();
                                    countAddresses++;
                                    startedClusters++;
                                    gotNewData = true;
                                    // console.log('address._id', address._id);
                                } else {
                                    console.log('duplicate address - ', address._id)
                                }
                                if(clusterQ.length) {
                                    getNextForAllClusters();
                                }
                            }).catch(function(){
                                gettingNextInProgress = false;
                                console.log('startedClusters', startedClusters);
                                if(startedClusters && gotNewData) {
                                    if(!gettingNextChunkInProgress) {
                                        gettingNextChunkInProgress = true;
                                        console.log('getting next chunk');
                                        getNextChunk(0, count).then(function () {
                                            gettingNextChunkInProgress = false;
                                            gotNewData = false;
                                            getNextForAllClusters();
                                        });
                                    }
                                } else {
                                    console.log('finish - ', clusterQ.length)
                                    var currentClustersToKill = [];
                                    for(var i = 0; i < clusterQ.length; i++) {
                                        if(!activeAddresses[clusterQ[i]]) {
                                            currentClustersToKill.push(clusterQ[i])
                                        }
                                    }
                                    while (currentClustersToKill.length) {
                                        if(cluster.workers[currentClustersToKill[0]]) {
                                            cluster.workers[currentClustersToKill[0]].send({kill: true});
                                        }
                                        currentClustersToKill.shift();
                                    }
                                    // if(clusterQ.length === cpuCount) {
                                    //     while (clusterQ.length) {
                                    //         cluster.workers[clusterQ[0]].send({kill: true});
                                    //         clusterQ.shift();
                                    //     }
                                    // }
                                }
                            })
                        }

                        function getNext() {
                            return new Promise(function(resolve, reject) {
                                main_cursor.next(function (error, nextAddress) {
                                    if (error) {
                                        // console.log('cursor error', error);
                                        reject();
                                    }
                                    if (nextAddress) {
                                        resolve(nextAddress);
                                    } else {
                                        reject();
                                    }
                                });
                            });
                        }
                        function getNextChunk(limit, count) {
                            return new Promise(function(resolve, reject){
                                gettingNextAddressesToOrderCursor(limit, count).then(function (cursor) {
                                    console.log('renew cursor')
                                    main_cursor = cursor;
                                    resolve();
                                });
                            })
                        }
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
                        startUpdatingAddress(msg.currentAddress);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });

                // process.on('SIGABRT', function () {
                //     process.stdout.write('GOT SIGABORT\n')
                //     process.exit(1)
                // })

                var startUpdatingAddress = function(currentAddress) {
                    var address = currentAddress._id;
                    // console.log('currentAddress', currentAddress);
                    // cluster.worker.send({finished: true});
                    // return;
                    var lastSent = 0;
                    var lastReceived = 0;
                    var lastOrder = 0;
                    var lastBlockIndex = 0;
                    AddressController.getOne(address, function(lastAddress) {
                        AddressToUpdateController.getAll3({address: address, order: {$gt: 0}}, {}, {blockindex: -1,order:-1}, 1, 0, function (lastAddressOrder) {
                            if (lastAddressOrder && lastAddressOrder.length) {
                                lastOrder = lastAddressOrder[0].order;
                                lastSent = lastAddressOrder[0].sent;
                                lastReceived = lastAddressOrder[0].received;
                                lastBlockIndex = lastAddressOrder[0].blockindex;
                            }
                            updateAddresses(lastAddress);
                        })
                    });
                    function roundToMaxSafeInt(val) {
                        if(!Number.isSafeInteger(val)) {
                            var diff = val.toString().length - Number.MAX_SAFE_INTEGER.toString().length;
                            if(diff > 0) {
                                val = Math.round(val / (diff * 10))
                            }
                        }
                        return val;
                    }

                    function updateAddresses(lastAddress) {
                        AddressToUpdateController.getAll3({address: address, blockindex: {$gte: lastBlockIndex} , order: {$not:{$gt: 0}}}, {},{blockindex: 1}, 1, 0, function(addr) {
                            if(!addr.length) {
                                cluster.worker.send({finished: true, address: address});
                                return;
                            }
                            addr = addr[0];
                            addr.received = lastReceived;
                            addr.sent = lastSent;
                            var amount = roundToMaxSafeInt(addr.amount);
                            if(addr.address === 'coinbase') {
                                addr.sent += parseFloat(amount);
                            }
                            else if(addr.type === 'vin') {
                                addr.sent += parseFloat(amount);
                            }
                            else if(addr.type === 'vout') {
                                addr.received += parseFloat(amount);
                            }
                            addr.balance = addr.received - addr.sent;
                            lastOrder++;
                            addr.order = lastOrder;

                            if(!lastAddress) {
                                lastAddress = {};
                            }
                            lastAddress.a_id = address;
                            lastAddress.sent = addr.sent;
                            lastAddress.received = addr.received;
                            lastAddress.balance = addr.balance;
                            lastAddress.last_order = addr.order;
                            lastAddress.last_blockindex = addr.blockindex;
                            // console.log('addr', addr)
                            // console.log('lastAddress', lastAddress)
                            // console.log('lastOrder', lastOrder)
                            // console.log('lastSent', lastSent)
                            // console.log('lastReceived', lastReceived)
                            // console.log('lastOrder', lastOrder)
                            // console.log('lastAddress.last_blockindex - ' + lastAddress.last_blockindex + 'lastOrder ' + lastOrder)
                            // return;
                            AddressToUpdateController.updateOne(addr, function(err){
                                if(err) {
                                    console.log('err', err)
                                    console.log('addr', addr)
                                    if(err.stack.indexOf('Server selection timed out') > -1 ||
                                        err.stack.indexOf('interrupted at shutdown') > -1) {
                                        cluster.worker.send({mongoTimeout: true});
                                    }
                                    cluster.worker.send({stopAllProccess: true});
                                } else {
                                    console.log('address updated - ' +  address + ' - block '  + lastAddress.last_blockindex + ' order ' + lastOrder + ' - ' + addr.txid_timestamp);

                                    AddressController.updateOne(lastAddress, function(err) {
                                        if(err) {
                                            console.log('err1', err);
                                            console.log('lastAddress', lastAddress);
                                            if(err.stack.indexOf('Server selection timed out') > -1 ||
                                                err.stack.indexOf('interrupted at shutdown') > -1) {
                                                cluster.worker.send({mongoTimeout: true});
                                            }
                                            cluster.worker.send({stopAllProccess: true});
                                        } else {
                                            // lastOrder = addr.order;
                                            lastSent = addr.sent;
                                            lastReceived = addr.received;
                                            lastBlockIndex = addr.blockindex;
                                            updateAddresses(lastAddress);
                                        }
                                    })
                                }

                            })
                        });
                    }
                }
            }
            break;
        case 'update_address_order': // 12:47:25.775 - block count 268159
            if (cluster.isMaster) {
                var startTime = new Date();
                // console.log(`Master ${process.pid} is running`);
                // if(fileExist()) {
                //     console.log('reindex is in progress');
                //     db.multipleDisconnect();
                //     process.exit(1)
                //     return;
                // }
                // createFile();
                var currentAddresses = [];
                var limit = 20000;
                var cpuCount = numCPUs;
                var gettingNextAddressInProgress = false;
                var mongoTimeout = false;
                gettingNextAddressInProgress = true;
                var startAddressLinerAll = function() {
                    var currentBlockIndex = 0; // 595079 blockindex for main chain.review
                    AddressToUpdateController.getAllUniqueAddresses(function(addresses) {
                        if(addresses && addresses.length) {
                            console.log('addresses', addresses.length);
                            function startGettingAddresses(addresses) {
                                var countAddresses = 1;
                                var exit_count = 0;
                                var offset = 0;
                                var clusterQ = [];
                                var address = addresses[0];
                                addresses.shift();
                                gettingNextAddressInProgress = true;
                                AddressToUpdateController.getAll2({address: address}, {}, 'blockindex', 'asc', limit, offset, function (results) {
                                    gettingNextAddressInProgress = false;
                                    if (results && results.length) {
                                        currentAddresses = currentAddresses.concat(results);
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
                                                                    offset++;
                                                                    AddressToUpdateController.getAll2({address: address}, {}, 'blockindex', 'asc', limit, offset, function (results) {
                                                                        console.log('res.length', results.length)
                                                                        if (results && results.length) {
                                                                            currentAddresses = currentAddresses.concat(results);
                                                                        }
                                                                        gettingNextAddressInProgress = false;
                                                                        if (currentAddresses.length) {
                                                                            console.log('clusterQ', clusterQ)
                                                                            while (clusterQ.length) {
                                                                                cluster.workers[clusterQ[0]].send({currentAddress: currentAddresses[0], address_count: countAddresses});
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
                                                            cluster.workers[clusterQ[0]].send({currentAddress: currentAddresses[0], address_count: countAddresses});
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
                                                        if(!addresses.length) {
                                                            if (mongoTimeout) {
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
                                                        } else {
                                                            startGettingAddresses(addresses);
                                                        }
                                                    }
                                                }
                                                // console.log(`worker ${worker.process.pid} died`);
                                            })
                                            if (currentAddresses.length) {
                                                worker.send({currentAddress: currentAddresses[0], address_count: countAddresses});
                                                countAddresses++;
                                                currentAddresses.shift();
                                            } else {
                                                worker.send({kill: true});
                                            }
                                        }
                                    } else {
                                        console.log('no new addresses found');
                                        // deleteFile();
                                        db.multipleDisconnect();
                                        process.exit();
                                    }

                                })
                            }
                            startGettingAddresses(addresses);
                        } else {
                            // deleteFile();
                            db.multipleDisconnect();
                            process.exit();
                        }
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
                        startAddressClusterLiner(msg.currentAddress, msg.address_count);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });
                var startAddressClusterLiner = function(currentAddress, address_count) {
                    var address = currentAddress;
                    address.address_count = address_count;
                    console.log('address updated - ' + address.address + ' - ' + address.blockindex + ' - ' + address.address_count);
                    cluster.worker.send({finished: true});
                    return;
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
                        var lastTx;
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
                        gettingNextTxs(limit, offset, currentBlockIndex, lastTx).then(function (res) {
                            gettingNextTxsInProgress = false;
                            if (res && res.length) {
                                lastTx = res[res.length -1];
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
                                                            gettingNextTxs(limit, offset, currentBlockIndex, lastTx).then(function (res) {
                                                                if (res && res.length) {
                                                                    lastTx = res[res.length -1];
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
                                                            gettingNextTxsByOrder(limit, offset, lastOrder).then(function (res) {
                                                                gotBlocks++;
                                                                if (res && res.length) {
                                                                    currentBlocks = currentBlocks.concat(res);
                                                                }
                                                                gettingNextTxsInProgress = false;
                                                                if (currentBlocks.length) {
                                                                    console.log('clusterQ', clusterQ)
                                                                    while (clusterQ.length) {
                                                                        cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0], order: lastOrder + countBlocks});
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
                                                    cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0], order: lastOrder + countBlocks});
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
                                    if (currentBlocks.length) {
                                        console.log('lastOrder + countBlocks', lastOrder + countBlocks)
                                        worker.send({currentBlock: currentBlocks[0], order: lastOrder + countBlocks});
                                        countBlocks++;
                                        currentBlocks.shift();
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
                var blockNotFound = false;
                var exit_count = 0;
                var startReIndexClusterLinerAll = function() {
                    wallet_commands.getBlockCount(wallet).then(function (allBlocksCount) {
                        // allBlocksCount = 152939;
                        BlockController.deleteAllWhereGte(currentBlock, function(numberRemoved) {
                            TxController.deleteAllWhereGte(currentBlock, function (numberRemoved) {
                                TxVinVoutController.deleteAllWhereGte(currentBlock, function(numberDeleted) {
                                    AddressToUpdateController.deleteAllWhereGte(currentBlock, function (numberDeleted2) {
                                        // ClustersBlockController.updateOne({name:"reindex_block",block:currentBlock}, function(){})
                                        console.log('blocks deleted', numberRemoved);
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
                                                    blockNotFound = msg.blockNumber;
                                                    for (var id in cluster.workers) {
                                                        cluster.workers[id].send({kill: true});
                                                    }
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
                                                    if (blockNotFound) {
                                                        console.log('\n*******************************************************************');
                                                        console.log('****** block not found, please reindex again from block - ' + blockNotFound + '******')
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
                var limit = 2000;
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
                    var lastTx;
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
                                gettingNextTxs(limit, offset, currentBlockIndex, lastTx).then(function (res) {
                                    gotBlocks++;
                                    gettingNextTxsInProgress = false;
                                    if (res && res.length) {
                                        lastTx = res[res.length -1];
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
                                                                    gettingNextTxs(limit, offset, currentBlockIndex, lastTx).then(function (res) {
                                                                        gotBlocks++;
                                                                        if (res && res.length) {
                                                                            lastTx = res[res.length -1];
                                                                            currentBlocks = currentBlocks.concat(res);
                                                                        }
                                                                        gettingNextTxsInProgress = false;
                                                                        if (currentBlocks.length) {
                                                                            console.log('clusterQ', clusterQ)
                                                                            while (clusterQ.length) {
                                                                                cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0], order: lastOrder + countBlocks});
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
                                                            cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0],order: lastOrder + countBlocks});
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
                                            if (currentBlocks.length) {
                                                worker.send({currentBlock: currentBlocks[0],order: lastOrder + countBlocks});
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
        case 'save_from_update_addresses_order_and_sum': // 12:47:25.775 - block count 268159
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
                    AddressToUpdateController.estimatedDocumentCount(function(count) {
                        console.log('count', count)
                        gettingNextUniqueAddresses(limit, offset, count).then(function (res) {
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
                                                // console.log('currentAddresses.length', currentAddresses.length);
                                                clusterQ.push(id);
                                                if (currentAddresses.length) {
                                                    cluster.workers[clusterQ[0]].send({currentAddress: currentAddresses[0]});
                                                    clusterQ.shift();
                                                    countAddresses++;
                                                    currentAddresses.shift();

                                                } else {
                                                    // console.log('clusterQ.length', clusterQ.length);
                                                    if (clusterQ.length === cpuCount) {
                                                        gettingNextAddressInProgress = true;
                                                        // offset++;
                                                        gettingNextUniqueAddresses(limit, offset, count).then(function (res) {
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
                                                                    console.log('kill');
                                                                    cluster.workers[clusterQ[0]].send({kill: true});
                                                                    clusterQ.shift();
                                                                }
                                                            }
                                                        });
                                                    }
                                                    // if (!gettingNextAddressInProgress) {
                                                    //     cluster.workers[clusterQ[0]].send({kill: true});
                                                    //     clusterQ.shift();
                                                    // }
                                                }
                                            })(this.id)
                                        }
                                        if (msg.mongoTimeout) {
                                            mongoTimeout = true;
                                            for(var id in cluster.workers) {
                                                cluster.workers[id].send({kill: true});
                                            }
                                        }
                                        if (msg.stopAllProccess) {
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
                                deleteFile();
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
                        startUpdatingAddress(msg.currentAddress);
                    }
                    if(msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });

                var startUpdatingAddress = function(currentAddress) {
                    var address = currentAddress._id;
                    var lastSent = 0;
                    var lastReceived = 0;
                    var lastOrder = 0;
                    var lastBlockIndex = 0;
                    AddressController.getOne(address, function(lastAddress) {
                        AddressToUpdateController.getAll3({address: address, order: {$gt: 0}}, {}, {blockindex: -1,order:-1}, 1, 0, function (lastAddressOrder) {
                            if (lastAddressOrder && lastAddressOrder.length) {
                                lastOrder = lastAddressOrder[0].order;
                                lastSent = lastAddressOrder[0].sent;
                                lastReceived = lastAddressOrder[0].received;
                                lastBlockIndex = lastAddressOrder[0].blockindex;
                            }
                            updateAddresses(lastAddress);
                        })
                    });
                    function roundToMaxSafeInt(val) {
                        if(!Number.isSafeInteger(val)) {
                            var diff = val.toString().length - Number.MAX_SAFE_INTEGER.toString().length;
                            if(diff > 0) {
                                val = Math.round(val / (diff * 10))
                            }
                        }
                        return val;
                    }

                    function updateAddresses(lastAddress) {
                        AddressToUpdateController.getAll3({address: address, blockindex: {$gte: lastBlockIndex} , order: {$not:{$gt: 0}}}, {},{blockindex: 1}, 1, 0, function(addr) {
                            if(!addr.length) {
                                cluster.worker.send({finished: true, address: address});
                                return;
                            }
                            addr = addr[0];
                            addr.received = lastReceived;
                            addr.sent = lastSent;
                            var amount = roundToMaxSafeInt(addr.amount);
                            if(addr.address === 'coinbase') {
                                addr.sent += parseFloat(amount);
                            }
                            else if(addr.type === 'vin') {
                                addr.sent += parseFloat(amount);
                            }
                            else if(addr.type === 'vout') {
                                addr.received += parseFloat(amount);
                            }
                            addr.balance = addr.received - addr.sent;
                            lastOrder++;
                            addr.order = lastOrder;

                            if(!lastAddress) {
                                lastAddress = {};
                            }
                            lastAddress.a_id = address;
                            lastAddress.sent = addr.sent;
                            lastAddress.received = addr.received;
                            lastAddress.balance = addr.balance;
                            lastAddress.last_order = addr.order;
                            lastAddress.last_blockindex = addr.blockindex;
                            // console.log('addr', addr)
                            // console.log('lastAddress', lastAddress)
                            // console.log('lastOrder', lastOrder)
                            // console.log('lastSent', lastSent)
                            // console.log('lastReceived', lastReceived)
                            // console.log('lastOrder', lastOrder)
                            // console.log('lastAddress.last_blockindex - ' + lastAddress.last_blockindex + 'lastOrder ' + lastOrder)
                            // return;
                            AddressToUpdateController.updateOne(addr, function(err){
                                if(err) {
                                    console.log('err', err)
                                    console.log('addr', addr)
                                    if(err.stack.indexOf('Server selection timed out') > -1 ||
                                        err.stack.indexOf('interrupted at shutdown') > -1) {
                                        cluster.worker.send({mongoTimeout: true});
                                    }
                                    cluster.worker.send({stopAllProccess: true});
                                } else {
                                    // console.log('address updated - ' +  address + ' - block '  + lastAddress.last_blockindex + ' order ' + lastOrder + ' - ' + addr.txid_timestamp);

                                    AddressController.updateOne(lastAddress, function(err) {
                                        if(err) {
                                            console.log('err1', err);
                                            console.log('lastAddress', lastAddress);
                                            if(err.stack.indexOf('Server selection timed out') > -1 ||
                                                err.stack.indexOf('interrupted at shutdown') > -1) {
                                                cluster.worker.send({mongoTimeout: true});
                                            }
                                            cluster.worker.send({stopAllProccess: true});
                                        } else {
                                            // lastOrder = addr.order;
                                            lastSent = addr.sent;
                                            lastReceived = addr.received;
                                            lastBlockIndex = addr.blockindex;
                                            updateAddresses(lastAddress);
                                        }
                                    })
                                }

                            })
                        });
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
                var limit = 2000;
                var countBlocks = 0;
                var offset = 0;
                var cpuCount = numCPUs;
                var clusterQ = [];
                var gettingNextTxsInProgress = false;
                var exit_count = 0;
                var mongoTimeout = false;
                var lastOrder = 0;
                var startVinVoutClusterLinerAll = function() {
                    TxVinVoutController.getAll('blockindex', 'desc', 1, function(latestTx) {
                        var currentBlockIndex = 0;
                        var lastTx;
                        if(latestTx.length) {
                            currentBlockIndex = latestTx[0].blockindex;
                            startedFromBlock = latestTx[0].blockindex;
                            lastOrder = latestTx[0].order;
                        }
                        gettingNextTxsInProgress = true;
                        gettingNextTxs(limit, offset, currentBlockIndex, lastTx).then(function (res) {
                            gettingNextTxsInProgress = false;
                            if (res && res.length) {
                                lastTx = res[res.length -1];
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
                                                            gettingNextTxs(limit, offset, currentBlockIndex, lastTx).then(function (res) {
                                                                if (res && res.length) {
                                                                    lastTx = res[res.length -1];
                                                                    currentBlocks = currentBlocks.concat(res);
                                                                }
                                                                gettingNextTxsInProgress = false;
                                                                if (currentBlocks.length) {
                                                                    console.log('clusterQ', clusterQ)
                                                                    while (clusterQ.length) {
                                                                        cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0], order: lastOrder + countBlocks});
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
                                                    cluster.workers[clusterQ[0]].send({currentBlock: currentBlocks[0], order: lastOrder + countBlocks});
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
                                        worker.send({currentBlock: currentBlocks[0], order: lastOrder + countBlocks});
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
                // console.log('masternodes update is in progress');
                db.multipleDisconnect();
                process.exit(1)
                return;
            }
            createFile('mn');
            // console.log('getting all masternodes from ' + wallet + ' wallet');
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
                                            // console.log('updating masternode count');
                                            wallet_commands.getMasternodeCount(wallet).then(function (masterNodesCount) {
                                                MasternodeController.getMasternodesCountByCollateral(settings[wallet].masternode_required, function(masternodesCountByCollateral) {
                                                    // console.log('masternodes updated');
                                                    stats.masternodesCount = JSON.parse(masterNodesCount);
                                                    stats.masternodesCountByCollateral = masternodesCountByCollateral;
                                                    StatsController.updateWalletStats(stats, function (err) {
                                                        if (err) {
                                                            console.log(err)
                                                        }
                                                        // console.log('finish updating masternode count');
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
                                // console.log('updating masternode count');
                                wallet_commands.getMasternodeCount(wallet).then(function (masterNodesCount) {
                                    // console.log('masternodes updated');
                                    stats.masternodesCount = JSON.parse(masterNodesCount);
                                    StatsController.updateWalletStats(stats, function (err) {
                                        if (err) {
                                            console.log(err)
                                        }
                                        // console.log('finish updating masternode count');
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
                        // console.log('no masternodes found');
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
                // console.log('peers update is in progress');
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
                            if(error) {
                                end();
                                return;
                            }
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
                // console.log('extra stats update is in progress');
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
                // console.log('richlist update is in progress');
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
                // console.log('market update is in progress');
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
                // console.log('txbyday update is in progress');
                db.multipleDisconnect();
                process.exit(1)
                return;
            }
            createFile('txByDay');
            updateTxByDay(wallet);
            break;
        }
        case 'updateclusterstxbyday': {
            if(fileExist('clustersTxByDay')) {
                console.log('clusters txbyday update is in progress');
                db.multipleDisconnect();
                process.exit(1)
                return;
            }
            createFile('clustersTxByDay');
            updateClusterTxByDay(wallet);
            break;
        }
        case 'updateoneclusterstxbyday': {
            if(hash_number != undefined && hash_number) {
                var clusterId = hash_number;
                ClusterTxByDayController.getAllForCluster(clusterId, 'd', 'desc', 1, function(data) {
                    var lastDate = '';
                    var currentDate = new Date(new Date().setHours(0,0,0,0));
                    var currentDateString = currentDate.getFullYear() + "-" + ("0"+(currentDate.getMonth()+1)).slice(-2) + "-" + ("0" + currentDate.getDate()).slice(-2);

                    var previousDate = new Date(new Date(currentDate.getTime() - 24*60*60*1000).setHours(0,0,0,0))
                    var previousDateString = previousDate.getFullYear() + "-" + ("0"+(previousDate.getMonth()+1)).slice(-2) + "-" + ("0" + previousDate.getDate()).slice(-2);

                    if(data.length) {
                        lastDate = data[0].d;
                        if(lastDate === currentDateString) {
                            lastDate = previousDateString;
                        }
                    }
                    console.log('lastDate', lastDate)
                    ClusterController.getClusterTxsCountFromDate(clusterId, lastDate, 1,function(count) {
                        if(count) {
                            console.log('count', count)
                            ClusterController.getTransactionsChart2(clusterId, lastDate, function (txByDays) {
                                if (txByDays && txByDays.length) {
                                    updateOneClusterTxByDayOneByOne(clusterId, txByDays);
                                } else {
                                    console.log('finish updating cluster chart - ' + clusterId)
                                    db.multipleDisconnect();
                                }
                            })
                        } else {
                            console.log('finish updating cluster chart - ' + clusterId)
                            db.multipleDisconnect();
                        }
                    });
                    function updateOneClusterTxByDayOneByOne(clusterId, txByDays) {
                        // console.log(txByDays[0])
                        ClusterTxByDayController.updateOne(txByDays[0], function(err) {
                            if(err) {
                                console.log('err', err);
                            } else {
                                txByDays.shift();
                                if(txByDays.length) {
                                    updateOneClusterTxByDayOneByOne(clusterId, txByDays)
                                } else {
                                    console.log('finish updating cluster chart - ' + clusterId)
                                    db.multipleDisconnect();
                                }
                            }
                        })
                    }
                })
            } else {
                console.log('please provide cluster id');
                db.multipleDisconnect();
            }
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
        case 'fix_address_order':
            AddressController.findAllWrongOrder(function (addresses) {
                var addressesToUpdate = []
                for(var i in addresses) {
                    // console.log('address', addresses[i].address);
                    addressesToUpdate.push(addresses[i].address)
                    // console.log('current_order', addresses[i].last_order);
                    // console.log('should_be', addresses[i].addr[0].order);
                }
                // var addressesToUpdate = ["F7fckugAq8pWKRy1yQk4D1yBwpx9jGm2aU", "FM72mobcFtBBDFim6NXqGc3gSUknHFmb2W", "FQuUaQTrFj1XyEQJ8H3SZxZeLM7e5fc7Dr","FUpwEoxFUGBJ5LwHLxCzG7hGn15Vrxtchi","FT3cyBneQxuSnEwCwtzaeTbuxRf4EuDcQy","FDhocA5LdL7s3XuQzMNU25XTkN95gfbCP5","FPyWH7NjCt7gn7BCeHZerACe33Z2eopa1o","F9miPwRPgxLXgYWgNNCZbXUhM2pZrd43PE","FLJtRAHqbKvMYx968B4ncuaBjZbdftBiAX","F8PtBK1Au5wdbJL595PbcFsB4DMUS5qede","FEzJ6USbWvQ4ZMH3B3qR9Kktti43gEo1UJ","FSCtedxmZihTck1qEpcrrzhhJsUQD8sdLH","FThHfAAyAVz1jBuZBseZb7EDs2ovRTTgcr","FPnqX85zXsJuN1WChPa8FbPF4XZZJQQ8pi","FQPMrVsr6Yg2D5yPe9jnhRvJ3nkfT1sZoq","FDWfhiTbaAP5z4GUaHhCcuyeN8GdrfLtDn","FGf1zMeqCeXwetdw3VCksvpDZGGoAMFKe7","FP1DpMJ73bogRtRbKbjCxWjTHgTCgfoBT3","FSpE7sNT1a6WHtU6oRYXZ3fQ89WRSL34D9","FGvxvfTFn2WwwqeymCghvVfQrvaLsre5sH","FR3MwHDLTy3Cuuqfq5aadk2VpAYHCQKTPo","FDacEdQAomMdQ9PaAVmdv5jhpqXFZgRiFm","F81gVZcYFuXBbHJ64333sv3BTLpff2JiXr","FES6wpjUn63GcSZ4ugAYxcsRx28HZzFYME","FPhcFTs3mwvrMLmWfHzrJFkBuehA9Qivz8","FPWoSV3EonUUyMfqpAhuZivAVuUDPvDQSp","F5x9keRpEKnp9MtzDLRFhzYC7Wddmy6r6d","FEaunYemm7nrsmKAwRf8Q2QebtzmuRVSjm","F96dCRA9RGyvQ7NNKao6PNdB2YshoCWzud","FTCks9nQUGCvRr1jo11jfzHZmmpki3Tj2k","FTwJvJXofYGszB2E3fJ8TjWeD5ciExkQRQ","FKh7NZ36oZ6hCPnHd9eMjjDL1n3bbMs3cS","FPjSUhoLfukxtfJwMzF9M8kCnB4jr8sWcb","FEwsrZdz23vywpwcgJrKXFuPJdNtFyc2RN","F82Fs1H7Vm3jbbYnRYPDsWq73uhWA1AF8j","FU1KkWFVWkCgPjB4Lg54nrRsPUpmGQTLSS","FCHebuVz4yp1jxfnsEWyxWfTm9EZfXz3D2","FN5kJH9qLgwWwuJX3184TttjK5LLrwfiDo","FMLuSU38QmzshQ1WG35a3ExH6Yzxj2uaZu","FKmB2JjXEfzZPCakSXyBPWgc97PnUSDbxD","FHV7uS2E7ht9yeBPgTGcDC5yFF49893LWx","FEcS2Ytks9uxNtNsa2srTn54vTjKacAmx3","FB82v5vbEzCDSdEn9RiTuJ4SPfksYG59tn","FTdismeXuLwyPbYkXxUDYPkTqHuc3uKTrr","FFAa2M8HWFFNJAujhHRQM3cMHBbUTT45Cq","FQsFCduJd5U7s8sDQiWZAGHuBwuFQyq8ah","F7M14wHaxy9k4yMMak7747cBmza7pPoZdm","FE13Q2w9bNdkod3D2Xh77CE4rcpXLMtUy2","FBzxXu27Q5XCHjur5mauhSEhDbk5LHUN12","FLcSdo1iH2UEq5wBDpm3zgCc4W1j8bJczU","FKJdM6AoHTRHXRSQStGd31oWTCzWUkZxKh","FQs4CTvkjmn9EeDzMmMha65XykJRTgiDvs","FB26wcTCe7ySGC5nwLGvCAiGsqmeptXzNX","FSuHzbhJoLPqNmWjJ49mX5iy4CnBYFitGR","FP6QfXvNNJGJWMrutf8QMm1m5uN1r37i2Z","FBJn6xDvRLtXpUZxxxn9Uvk2Bjs3pkKfGj","FCz6Z2tUuAgnaMsrQP2Mv1SrnehQhmm2NJ","FHhF6kpTX8pTPoPsTvQze5yag4tmTXcRoY","FPNWwZ2xLL461pDxyamvcLp9e2bbfGyVnF","FCcbjDHMJCSMHR5JAmbFPRFEmU6CEX1Fvw","F7N2vstV9QQuFNtG51VX9sJ4HAYHqtdgXd","F8unPkM4LQ39iBCk9v136CMsLnb8meMq6P","FSVrooyksHtFWEcrzv1qPzPvrCchTg8tJP","F7ZrBhGpd6jcWBeRMvBBatekTMTPZn8cQP","FMycXsgUHTiQPPfFxmCtxFfkBcrjna2S6B","FN8a11ogWtXKMhrB8vpRUfzy5icyNtphDJ","F73naf71udnXvJUjTppYg4LopfxQfBkbBn","FSzfNR2S5KF6wvjR63Pvc2nT4oWNXU5Pg7","FMC4RbjY5HPCVYKeW8BnUDczgaUb3fYCyL","FMmUbKf4SL8UN6MyVnngLsCfEzec5t1oRW","FAsPiv7rvGHKX46gjFJHACW29NZnQKoJ2w","FDLFtamcWrBwJZ1D5aAdVAJmjRbxe7bWLM","FJvKoiLJf8e4RYm7WAVojXiERpQru6EdMx","FHmBYwzkNHSzKDrRzc9J4723PQEZxHrtm7","F7nxhcGFP3EJiKFDxBaXK2DiaZg84gnV45","FR1szQECWv3zjJRmhXDkxW9MKngeGTNZrN","FAZfDhG2LADxZJ1gKLcUWAtA3MQwFnjwzx","FKyz2NvtavoBUscctN2GevG2rPfDT48aY8","FDQc9ziU6oZpzf9WWwf2tVmeBxtnPg5LUv","FEDXygEx5zc8BK1PC7R86DihJnHztjMFuY","FK1qTDQR9NfGxGLMRnNdJpWYDmVPfhdfnX","FV9F1Jw78HLqwMfMaR3DM7eyySWoAkC7oC","FDesb6bMfSYLxkgMj7t5fdyJdrcgycWevd","FJaS6pc7BbYx2HGDMse4Y48KbDCYHFbpeX","F6jw7sMACxTr9AcPze23grc2YL4hrgXZpn","FDFXJU4g7tsrgv2hvAAuMBbQpJisyKaEKv","FNUyu6TDZR5yW2GKeyBftdqmy5br5Ubjyy","F7U2TJiWjMmCbr8jRQN3Cfdveg6CkKDJTU","FDcgwuHp4hN7TBWAn7iVMQLDQ6Jz2c37HG","FD2cDiqEREAq1vYg4xeqUoLB77G7G2rrwL","FLwbFdC6iTXGp5o8RvuUP3kd7s2XaHy2u7","FEMYaRQXmbDJmpdmw5kNPdgCKq1ts1q2rA","FRDhSyAmFjBxFStn3WmupbnrZkCGyy1dhx","F9isyWXETtorkF2rU6oK91XL34zQALy6vj","FHaVy2F78iui74tifkbVEwr294WXVJSn4C","FH9qDM7aUJ64j5gkF2QCivjRxDb9BQXmTS","FGXGEHAAPfMp5xaH9zNTjm32UCxaekaBEu","FUZuCJEfLtoeh2vkTLC2caZGxUrHVQM62a","FJNCMWXKkVh4FbfeRzwUL5k5Fc8dip1KDr","FGYRXpEG8nJWEtSwvnEGvnYkGZpZwxpcMg","FU2kWWmcYKLFqDSoPSMfUeh86Q5Z6bsRXo","F8DGnR9Tcvg8FsyRRP6pW42yBvJjaKGrXv","F7ZNoFxRznjTM6LvVxB8T2rxVrXm14DMJt","F7JSxy54mZ3AkaM88xY5UQxzxkxgPcSais","FSgbSay213c4WBWomp99ABhrt7PfiieJHc","FF1bd2uL6FZnRCefHh94yZguvK3tsbbpAH","F8LLPJfcBjc1ThPxpE1RWo1MoEQrzPre5i","FBg9VZLU42yeKWRZhHoyhV4ZKoaC97XisF","FBWcGpyNkqvo6iH5LiCgLun42nRtJDDprq","FRaTc8QYn4FweXCf7DMRZdbsKqDBvimnFY","FGFqLRKScgVFPS29snMBrzPNP1xF4ecoQ8","FEM8okYd6Kiku3safdDKUENhNoj1jD6igz","F7L9gTfJA9ENjG3GFSNFGGa8cMM6bLyqeX","FM1E74KxjC9kLF6ACX99sHLbjU1nkWGAB6","FLLFRHrm5sRRaWpoUzRyJ47cU3XAJHbSYL","FGuU1e1LpESioSFhqVmm9jdeVEQJg1yftY","FCR1LDXZRU1ApbvwLDit81rKTNC2N7pAnK","F8DEwo44gCEdJur5StzUatyQFCYVMVH5gh","FPKBugFEe3e48t2wK9Vxk7HftustNgYa1H","F8EsKpVHBcVRo1Q2y8GSkgGUVzKHCeGiAK","FQLLRXaT3uuSL9MYjryFCTn7EGJL53ALCX","F7LjfYrJXmhGXfPA9bVbZK6Zyt2zdqyF4i","F7XoH2kG3ue6GAYKu88QaDydJj4zQYkTQG","FSRxaiWx3qB6PjTgYC3TYzLTvGcdxREozf","FBxkBFHs44dCvuACfjREPAeGYykR19CWZA","FRdmHFGez3EHZZwK4frzzDaRJDsEacbdZ1","FLwBe31FYgcKj3xfGp2rtfH1kjwHRdUYfw","F8aXPi5rus8V8mysf7Jjx1LP3djShtdk6K","FDq2PWx4VUtQFVXuagtQMms94UpmoBaqi5","F5yV7wt478CxEhpzZam9LYkk2ctGHpFeSy","FK9WYmKM4AEGpiCSp783wg1aj45Rpkmc63","FDijd9RDCvvamsXKi5kFBdFjkPfv56vqaG","FHYzvuj7SDGz2NGrXSMbkh8J1BQqvWhHwb","FEB3KF3h5q2m1UkaMbrDVsjea72oDdPH8J","FKZyVzCJTiWQoxFnnpu5owJHyD8w3VJPM3","FQoCgLgkR4oH5JNDHR3ZokrfsR1DSiJUL7","FAWDKJVvqNEbCmej2tarL9tgrD1QZA6N36","FUnmfHkrJwGBpEB28u6yvATAQLtT2XSyZ2","FLMujn2z8whBetnbQ52AAmdQ4Wn9NGvdrt","FMx5fXg7qF2tcRoJxHQN9SKF54qAMAR6ye","FCbTpUnSQCwrrnGvxpYoBqjFGx54Z4E6H6","FTLYKDHHhVfHTZ9MX8FPn6jDUYuHcheaMQ","FM1eBEdpeZTARi2Y7pvuiDsXBaYKLywTKk","FC2G8iaXSDkoQQD17xRw48o8fJXE4XdgmS","FCK7ULeGWpc8wznHPEgosGXUDAsiAyD6Xe","FP34edNH8AEJBUeUHqvN2Gcz7bKQspknXG","FPeKnsycSBiPESbzcv52UCwchzNn5g5qpd","FMnhs3JRUiNv9Q3JwFW95gPge9nwf512f8","F73LxmZpX1CbRoGg6HBcyHLRUEdmZsFVRu","F7JRtRC2QrHDGjDzXdg6zJbS2Um5CbFwjX","F6EU9gjCoGPPiCsh9GuxLdwJZh7qZZtnXT","FUuPoZSPfaWzB5ergjbfdBp5nJm7tiQYRn","FMYf8bAZkTMnfpLZvvCJfphC9urGwa1Gmt","FJgcmJ2B1FCWZPWyfF1iGBuRQ2iYDDnkdm","FUSx9mpB8rZJT1uWqsUGXT2mAWEvSVMQFk","FKPKWkR6cYwnfjxf3xstpmDzaA1AqmvMwk","F8ZKT6fAeT3ppMBqcsTxCKcoLs5vcLFrkx","FMVUvG1UnYxiGyJHjmfHtvziXDKmLDKa68","FJZpJJPrfXMiq9PJsddSpvHzNP1tV7aNJn","FE1Gg6apZnGd2aufkQNKEPrfskE41Xd4H7","FExuMCRgRAaP6SfnYcZeuq718RDRVgcNh8","FQFNeTaaihyy89aaPo83iQh5gSDorSzxaL","FAWZPasbf8wxjX29rKVRqYz4L5H8PwYccU","FQufhfox2rFFhevWYEwN3okqY3P5EtaCTc","FMQVAtdQMv7tX4uEkzqdBtxApNXfZHSucv","FNKy4tUfi9PohkLRCW6FU74vcDc3q4omW6","FFVjCFa9Du8WufMaMQ4u68xfMMvXEgKr7u","FMkBogbhqYz8yDYYxbVGAwyrXSQk3eYkZc","FGQbTcs6yhNhLrAR71ZjvVTskEYpPum2zv","FHKHWhV9n2adYA1S8FbAXDFTtEdYwcHiqG","FC7fxUKbV3MqJaof3hg1iDbUp7nVS32dkW","FG9XuvxrqRiT2hmLfQruFSDpRwDdfbjy2o","FGYe3Mvb14WvJECzXFu8C7jxrT5h1YYt61","FRRgSfrDd7rLffGRxfaRhrtAuTvo8qiZMJ","FTXVu2XNjAnwxEJp7V3defKNrM5joQBFbJ","FDTocQFuMygvE4RJTcd4dtgFQRA9BRopmz","FHA4kXheoS8ChrNUiKZZjhcniVZUPRt1Qm","FS2NF9dWavWghCMRBY7vgx2rrsYtbRpr72","FKxv9i7ZBhzWxd7BSJwPdpGvKbXVp1AMmo","F9vMfWuGb1c2u8A5geYcQ4hao2P9QoAm7z","FV3nbY5uxGkiUh2FVqtREdArXVPur6fWmw","F74HALDPfBKQvyCHZAXCW3YhxxMZLYobmz","FFHiPMea5p66JJj2juemYwrYznVD4md7Jx","FKSh9EgNAnWoQWBpbTDhT2gLRnwpyvLB4J","FQKKt16Fw4Hh6M7n7mBkxmoZqB689sW1AZ","FSbfshEQuEWyDDiSTRY91kbS9xX3EGWnjG","FLjziWA9u9rW4gjGLYV4c92pT2nxKrpsp8","FAtqXTT5v8YnQ7DMFqLu71hTrYCxY4hd39","FSjWJBB5WRdJSr3XrsLDenWgmdcfbLZTuk","FRsdGmMoqknY6opATvodWayzB2FYjbAcqx","FHdXD7H8sMb8PLcCj6TuACjQtsqCYLouMj","FDVLSJMy9dE6uG6jqRjWErCcKSKCWz39TD","F6zfC5x5c5WQpEW8ag32FBsHxnyrSJeqiT","FGiCgGVbQNyb5SjT1VZgKPiFyrvAHgfdnv","FANVLwECrHEdpFFx5PWVHfUuV6dsSHnvqo","FSSAv85xH7GssKzaTSqbQvruGMCL2PRUr5","FDRWUunLq1b6WLriVbwqc2JEcEGKk6MEBT","FSczbPFkparLJRVN7y1nwgBzwRwyhJ2xSp","FJC9rGvTW9ELQBBhxVG9dCFKeh43xvGjQw","FU63yZb3HkT9jixMvMH6P9FxdZuZTWUGi5","F9EPf79Q9PDQWSYKDUWsuAXZ5cixqRLSRp","F8EmB3n31Kxy6JxEmz4tsVehLUJzuAzMnu","FBDjPJE3Q9eU56dQ7a6Bdsc5kGmGwqR3Y8","FBHdSisN3cn1Gkd7eqKhqf4r2LXQ1Sp2Sr","FMAugb9C47rtPEsrsZKWqynB1K4ftLtFT6","FLwyK3y6p26dswHoURmp9L9BSk1PAuxD3R","FB7DdKEbaM8bnB4NH7aL3x8UWrKVMKFx63","F7GcbF44jc2TDp7EaZi1zGFtXrUbtgK788","FGSanARzybzaw2YexNxxBFNDiBxkFo2q9D","FMMsW3NEQUiz819nD61gE3BfkBdG5PuDAc","FCjb4t2uEbm7tMUP38BPMi5YLs4EuP6njs","F9Hw8CxEgDpT4LgKt7X5WJ4ofLfbQhsULU","FKRzAvAufuDGJ34cA3K7MWoQ6Ejz2vw25Y","FAchM3A178eTKzfMso9HPEJXVFvSnzrCQT","FG6fENHT9fHKsrGNPjA8QftoHnLzdzryHV","FDmxEHU1x1eBeFUxg2ZJQiW1xUL2WxFWdQ","FLwxzLVbJPsCBHEDcSDS7mhDsdvE1PFyQw","FFMcv6F9a1EqakZmeNCq9CSrankJHMDaVe","FKvAmbxqdBeSR2hJQ1q3aENd6fgegJ4SR5","FLHiFSowhvjV2HpcjMB2qS8aYGVB7NPUv6","FDfW5Br71d9FDVf1MGHERxMaEd8LwsDk3M","FJJc9f3F1yUxokS2FKMo5ELFkZFDPGrqk1","FTMJ27TnHChbMd5EC9bUCHqEy9nLF5r5mm","FLB5N2NpzHoLZpGCuwsSpJ6N585yVqy1Fj","F8oVdCTREvE4Cz9CjsEZUARHCeU7GmAVkW","FBJagTZResxitfYUhmQUFYstTSQuEygxWa","FE7Z7fpqF2vSzQTZRxcmLdaE9J1aHG9Kmg","F7y1cjPudKzQJHmVUnTziNyksmm74Tidw1","FSDDf8htgR7V8W3z8LTg9yyFUZzgb4Mncr","F6MSgFE91Za98PGwfetmMUZWYfnsWrh5pa","F9qreQR9aSW6QBvTaC17Zy3ava8DFp8xNy","FJEN7cwPgpDrZsoMxaSPBNfs2HUQU9cbAA","F88BLaENqwdBjwea81YDzsnsYgxPM7XFfj","FQcckfHJzjXKC4B69qyPWJPK4m9gwJKRhi","FReXp1iPERHi2hYSoU2RpnLbXuxzbfeMi2","FQYSp8ovP9HRoF4bzhjEtHUFDKYk8He6A2","FLrFsR9WDn84QMDwXaC1s8WH8omDCvt7Q7","F8Az11y4Cp3m9MHjExhadorddadG6SAdJX","F8s15DTybmUyRPHAot6oXnAXSwPXpvoZDr","FJMiozwSBxGFrA67eL65DpKbPZSfCoRhLT","FT94ZqxSY3XESPY6fhDvwmsz5Ww69g5unb","F76wsMdxcbjn6Vpy957NcuXbMQgznezXme","FP5e8hnVqDfauv4qyG359zEE72YKmw4S6D","F7vpWcR9QpwVGsQskQ2etSaqkgGPkMAWQZ","F8VeQSzEDpAWTpEsTkwiRBgYbDUK4DxDhx","FR8NAb3YmFFqzmuURFnHKvXg7c7F2kz3t3","F8YT78sXkxgnASQnxjjJS9gqQAnLHWdzJ5","FHAhDBxGGGZsNXn8mixn2SPCKTtSTQptPm","F9WiuFGmhRVed7VQqrHJKiMqkKv7HyutbE","FG8afuTTWbece1wgwPaEyS3XWqsg66ANHu","FKdqqYWU8ZVwpgLZXjgf1UWVKT7YiPJHH1","FNWChCDqPNDTcpuBfRFNWNg5Pnoga9rTtk","FE8kk2gkX1CNhFnYrY7WkkRzpn4jGwY7FV","FJh77UamgHw2t6yinSobcQJxdTKFPJ7jQ3","FDr4EqEdKYNq8uWKB6SzK7BMPiCX2cqR4V","F75Gc77nuQvY9uFwusk6SFwpsa9vH5nFTV","FNnqLYqpynMZs7Ukb5ADwt2BuJtgr3cUGC","FTNj1NbM3yoDLRheRwZMEbQfRFXECJEGVN","F6z3bEqrCJbKHVjyWmbb75js9dGWmpxrtt","F5wAYLcWbmqqmsj8rcFzkADZki4QQ1MKhW","FRZReUEagYi4reA6MZo52tz6fPfuoPb8cR","FRvCZnbewBsQNVaFBLyVrFc8Dinio1qwDt","FBpXtBMohv1RgtEbZrmaw64Hmwzbx7wAtL","FKrvYGkTTYCz2Ck29d4as72fLfRH1fkoJc","F6zSa9pHjS5sD42ppzSCVdxwT1TjzYseJ9","FA8EHwfJvi8c52oVsg2t3yZYQ6r9TP5SZk","FTxjGeFJgqQgf5J1mVZRJQ312GRsHCcssE","FS3d96pkKmdmFMdfd8oMNfbv4uPRtakgXy","F7NCREJmR4i8PzJrijH5VhSkeL3HH8Qc71","F8YMAmLMkZvCxVR7J6SSTGJMvGUUcDVWBZ","FFFaD6Jz9S8qybLoUNrfww7HrL15ZcDYe3","FBQHKiSjt3rPnXmmJ7T2n73em39VCHaPj8","FCuqeHseCzwnob2zS9Qet66VvrQVeaPK2B","F9FNcAD4WMHen96E8xbjqd91VGY9KCVRRC","FCt7REUTewiuHWbSACsLX8bG8AD1cXKbar","FTwSgvxo4jtMo11AqgmBDzQVzFdFQHekrh","FBve3NnGgwbDcAg3uqNkCtR14M1d4U554m","FTqhJomnr7ubtvbXvjQQ9ppuDBvhxHXkdA","FHvbqQUV6QtJMLUpa1BPATVEcNvABATmRV","FK1xxraB89v9odfv96tXdZ2cmMsq9kY88j","F9fURiHpsYAMbFeRcHdKj5evTCVgyGWuY9","FUPMyk6Uy4tdiAxkzsUMzqSU1msKLdfic4","FQeMy3VCHvTCoAtxNmkxvaMEs8ResYHHdP","FGEvBZETQr2QVHHRdhq2tq45rnGZZVzw9r","FTJnTFJMm4nSgGWMAx3XndGTrvQC5NevMY","FQ984xFGZ2Pw2T9aqukeFYHwh5ga6cmmUd","FQL9JkY6FDYpQsDPEs857ySxVxuzEzSmda","F8kTqb5nq8191iRYCNBYrcznhzzzgK4PXh","FJTBbUAEzWBQnEvubuKeZuPyG3kF2U22bd","FLH95nsKeTnouD11YVJsq9xCF1AEEz56zk","FDedncy1eFHYaGLkmxRi19jQ56RFsMRtx9","FHDaS25BkM8tUTPvtHsQGRKf6DqsdGBQ1m","F8739RfZ4SSyt8o9NR2htKivWWY2QtzVNJ","F9ZVQhQFBxNDNKU54B9KsirRC3uFjuShWX","FP8YPuJPZdWq9DJ6umEem6e6hid19jadJk","FLZQUkg7DnWjoG5daeP5YFjUgka1KMgvL2","FL86TM9221QP4QCXh3uXfX8TefeRm9hTQ9","FNipFXpXpL8TmkXv777VBD7XXE8yd3v99t","FDcsvGFUhhPjHPaRyZPd6X1uJkjFpxUTSp","FQjVsVoXWicZRwgL8wFud4v1HNYEdfuqrR","F7VAph7SqgpRAm6UxQp4aTR7dFtvqVKvZz","FMKsvpXbSG32JCph2pLdjB1yw9vG7C59tK","FFLjcMcuhPiRvjqQPVCBqx9wuZP54HinEi","FCknxhJHoZug8r5SUqrg1LpGF3DkfT3eAp","FGrM1TrtQCsKyLhkz59DYioruhQw25sPTd","F7PYxqCMfaA1i4RKQV3iYDwZhycccBF4En","FEpxR1yF7NnCfe8caWvupQtkxFUnyc3nh4","F8wdWomEvMWbz5U2bP11HaJfaS7XuBPRYj","FTCRq39XLnrebak96QDiEybKwDmW1UBof1","FEKXJSgkMXC1Ryd7fvqQAWqgXrGkKBEuCp","FCQFuHNyNtuPSFMHGTak6VFLN9KasD6KMM","FV7bibU66WrDdEwe1QorW3v9YzBygLEaFp","FDYeYRV698nUi2q7iLC3TmU7QYUdFtBcij","FUBnUjysDRQwi9ApzaqK1XeVUxufVLXRnT","FJZJvfcT6QKQ5aKsnfnNeB24MS9dd4HhP9","FGWRmFBhWAuUj5ZyBy1eQiV25Dbziw7cWJ","FUjqAC5Z6Eup3hHzen8hj9GVPYs5Fv7BYA","FT4F8KQNMzLd3et2ivnm8GXbKYTHNfZpnj","FTP4L8VaH5qcLnZ9gj7ipWNuXWTMWDTW7B","FKA7FND7Fy62qPdBR9GBmeHs8aGSuGdghY","FQ6AvdetY56yWcmk8URodHR4bJWyAxwJnx","F6pkfN4e4K5i8264xFR3212aKeE6AkjH68","FPihhjc6CYk7hehzF5zAEcGbxSHUFF7RQf","FTHVkC2CBYHYteKpZuhodNHTG4FFnfpjJ7","FUG5s3EuwaQ3iGX5F4ZEU3uho3WCgcYGig","FDeQfXthNwJfjN6janRdnEfG4iNRnYhcmh","FJw1LQyV9xmY4Df5Go29wL6zWyA78D2r2M","F82Tyw9ooy3cpZvH2qsfzpywrDpqRP7mSd","FSUkV5UcvSS113eH5REy2EaGD45QMwaMUf","FMuzprrRitx3D9GoBzmuZXCnDRKtbH4ciJ","FDVPAgupxfrkX4RD3CN9bZoJ1YKRMf72ru","FEeTuYiA4ARQZmL3BZsiCDjwNBnDw1DKZN","FCWQD3FUxnDEdepm2SnDoMQUrXC45evvK3","FL3zM76HUW9u7VLVb9BkvEcLLaNCPF8dBf","F93JfsTvjJ74cYnk6nmiXgphQRSYYtgHvx","FQwxshFJfJqk5KXJTJg3zmdUC9WVSdJnwu","FM3mjVhK5X2uV1t8Fy31SW17qch8oTgvZF","FLgcAuaqHyhuSpFLKQK92tDY6BgGcM928v","FSeitzuQz12R6FWQFC4DzdfuoqLVYF94FH","FG2mvMPUi8gXv9dVu7AAWkcCpcv1phnnWH","FMhYu6XNw9a9HBjVWxvVwZeae9z7yzwvjC","FHvSeoYyXVMKihw1AzrmZwDi8GFfwErHP2","FLLzDL5KN755RqvKPrA2QgkiBYmEHWAhdp","FS8UQvxWJGzgHk6mzibhE6dtZ43whf17xg","FJ1mUGSG99wF2xiuTxt5icdXCS4cCsMMh8","FA7NKJrWgcEvtnb9HgZoMqr7ya43kF4d51","FCArd8eJz9cCFwtZQT2z7XuNRwPaW4cnTr","FUEVkAscbqSRvc7EDF7bFcbPbLtPmeiYuz","FBFEM2uV9svdQBR1Gx1Rqufy4KPR2apwVr","F6zFjyeeBBc3cgRLmuNVAWgQFJS7HtiBNb","F7V5ciMg6hhbFDGqgAjdCKVbBHtCB5BqZB","FBcfvgnJy5BvVxQgV21Q3xEJ6FB9qG8Qo2","FJFwVpqmWxsi2Hmo1V1KKMPT38khtWcfEM","FGbjb7uCwuQJRyhNAFEvWuhdkY8BUhGMV3","FCAaKRFT9yetqAnichNC1yjBDsiAVzuJVP","FLXe9TX5Fqu3pwjJUXmcVng6hdjBKjEyLJ","F75Q931mj4bGD2Dtfqc1DNKRsQpg4pR7MY","FDTNpgtSFR8odx8peieBSfdEyqvXX5xDqn","FDtoX73i2Pp75udcJCEVBj1KiEf7arHuMG","FHksACUaxxbpnv9um5u1jBvcXzTrjMx8rx","FUKQgyhXNvHizfJaW9qDzPmBoKjkKUrpNf","FTqRcGWGT8meMRb7fTuCqGgyjDHafhAu1A","FG1RqgC8PSQ7vbmHuzruMDRiatJbCMuHDu","F8YYAecAYTZJ1tAfq8A9YCFRWQnkmDFpnY","FLQ2z8SrUEBipwsjSMrhA6anyKihsYcyV3","FKHkbjVnj77cjGAmhTEvcrTfFiguKnKJaS","FFpAtQJ6dyUP6j1hdkHwchj7MtLsTah1Pg","FRVanPehx8qFNXDWEt3vWaZFbMLuF1LPqC","FTHqXZzJBZNkuhJf9eszwcYBacdTDxQWDU","FP4V2qieSLVB4tZAy7z6JdFneHpPEemgBQ","FHBe8EUnfymFNM3coCExJnwW7rSe5LSvbB","FDZiUTLTBfADYCnwxJz7NRqUxQw6tGFSRH","FPeq5Zxvi5RdvDDaJFDZqH5LGBjtw6Xd17","FNafSrZZzT2y4MW1T2RkHWAqBZKqh2TNGo","FRj6VMapJtkxUUsNXaT7ED2VC55s4VBWzV","F9uUnDrNRiTgFFfWaKrfcG49C5DhmQbM6x","FB1z3TvMioMZWetH2Zu2CMNeqWZJGtMLCJ","FCXffnqJ6PfU5ZQHkibn6sd4xPMQPqwZkm","F85nNkiU2EcpdbQMNQrPRb4UCko6E1PAxj","F6DGtps6XJah8X2MaLGqMDHhdpRRV778wQ","FRQgyz5jbiUAYu5RqyaGPLWGJoH2S6mivd","FSqVz8adAcx8VuLY6hXRCXXd6RokNKb3p4","FDqnjmkxhoaj7iA8znBzzsyud1YgH7fvZp","FL5s8sGjWie6T6v3UpsCU1q8UvEJC5mSsi","FQd6hTaqCjrruTPK9dVuPTze9sqa8FESU7","FCFfJaVmfQWwxtezV1Xi97cfT2VCUi8Pjm","FREH7W5dAV5wctT6vap7QQFUSs2MsfDfB2","F6dMbhzhbgiR4DpFGrkfxZXWL7rJt7prX5","FJ91BP3a3f9VXdRUb6SGcgQPPHtWkUwKit","FQ78R9XRLSMHT7YpLNpN7bewhTPmTxKoHQ","FBbiEYCiDhYu7WFXHp7P9kU9kCfMziZDtC","F8hhdp9WdAYgBsicoJa8HZuvvWTWk33LeP","F9crP67aXjDore5iHxPgwaRd69MEKhmRS2","FT43KvKnVXH7PJQQUtYbJZPQxmptTgu2HX","FMTHDSobX5mX8KzYmLUmQ9dafMRpURuEQN","FPPigxQ4n2dd5waemG5gUKmB9z737pjVmC","FDvVynp6AeW5DSRDksPsK1NVwD5zfMwWjk","FF6n2LCZiCxocwf2iuyuJVwUhim3Fv1JLF","F7YYH579T9cRsAdzoQhajEGceowxXcaR87","FEKe9a5VMz7M8J9195643NSbnVfF8J7zcA","F7X6gtjQuRs8xoJjKHyULPH9zN6kSGcqz8","FL92eujUmMDEEh1Xv6J9jUGEg6p67Jz3WG","F7h37B5V6BHnysDG2KtaFoN98W29nSQQAc","FNt2wEQVotBBPjYf4UuPvgf75EaLYhyAzk","FD6TgdiHsx27vNQWj3Q83nDxSYngC6hvfE","FHP8MDcvboXkqVeznE7rGSttny2EVHbCFA","FGj2SV2wx31Wc6MitwrFgRvxGVgS9ghLNh","FSXngFWsgnFy8M7kVar8tEyLuVFmQAevPA","FDfk9ZYWidYT6NbyED42nqY6hLDHyxTdnJ","F6n6KzbFEAcfBzxHLtXUXhg3dK1gALdJ16","FTsmfAoj2MPDU2nXKH835Up1YUQxwetMRP","FHDU3z1HWZU7z3ammgN3BN2BnVfs55DG5X","FQfdGvZ6aw6UBwjF8DyMLHK6RZXAsTGtyX","FALoUG8PxGaD58PoFRX5YwqB2gd7R9pEQ4","FPYryHitND648TekuYAYmsoUo4o7odZLSp","FQjfVRLExA921H4HkavNhg5QRFcJVUvXRN","F9o68rUAE8JHWM2iE2hRHWKmf9xJ4XYhfm","FQszNb5NrPyS84SiuirXMnWJrSUigBpvNw","FPvkuJscwofD2kzh58TiS48iRgRexgwuxg","FAMLFsTuSYEdVFhvN68ZZxMkKnJgpiNaPX","FNhAuM1XTUGA5REiai1urALvoGaepDunEA","FT5VKevhzNw4Dn3YRscUep1497SNL7hyn8","FGziP1iuFyjEh6mdik9ucEey21FeqYwnHn","FNwowSrksK3SDsXwUthaacKakjr6PL1hPk","F9pytXNG9tJeTwWmuhrbsDssHr83frdBPE","FGytsiM9N447N2teaCyL9w91dw96ywv6dM","FNqTmjLkPqKTs2Ergz7ux8QshZxNUq5e4v","FCPqpV5qkhnAvDV8KMoZN7VxfFDwY9QL8h","FKtevrBXvTAd2LexzXsFEDZ38Dd2oUHJH9","FJNqVN7euD3ZDpoMnkHeNj16sSS6NMDU13","FU8ztnMZV1jMDqtZy3iHQySFuYiAmEy44E","FMAsnBZzVxqjdtdBdtWoyLbodijLJArVeF","FNa59cEnMVjNYVVXRcq5gZXH3P64tn5GSq","FNbFmtkNp92TjeerfjWeJq2qMvfJUWALKW","F8WDw1j4mcu4poiuTqxkgTAoAWoPehCfLw","FAupKEEidU8E4wXb6Fwt5dsHxnrfg6h9KE","FGhXNknTKenqbTmfBhNMdBxRQF3drT6XyK","FDbZYQX4AsfoXYUWBzvFgbBjtJxXayNHYj","F9tMw9Esc8aoUJjNHRELU1c7PFENUJ1Nbi","FJdb8RLC7a4s6TRJWGTjPCs16k3G62x4ZV","FDjmZApN59NYWku59iVS6RXCEDaHrSEkfs","FEWsf56B9PUrhm6UDwnG6uWG4T35j29Z9u","FKfHs6PD4M5sEteV2gQLGh55BkL4Q4m3WC","FLpYSGtP2WPLEzaMXhGuJyjRRppnDPEwTW","FC8b3rc2riBtx3wbBYv5P6fe6q964W3d7B","FFETujYspa56Ps7fd4rPU4cRjPBkcTgfcu","FCGRidBYeEFLP9u9VU6md1JE4ajY2YMHtu","FKrKvbut3aYNcT2dZDAGLg3AWE9RzUXu2Q","FCtVhBN3n8jTCYHcb4uooDcMCVdMQpYdCU","FR2z5N3h1cHAFboHbJbawcjvY8c8bciBPS","FUvaALoydbn9PrRGi4zD2n4TT4RaKWjcpV","FP2MbEcDNuWxZYVaNrwWdnFz33ELgB3cXx","FLvKapx7LGdLWs18aE8vjb4trQ7TFyLd83","FUaVLj4ByKumZqeKwvxDS41obJMoi4pzdm","FAMACCoe3fZFMqDXWMBM8q12of9WPdHza2","FL1MNcVobpitVpmVsXcWjhcTAS6wDJ6tS9","FHnbY7mrvcjoBgJgndkj5yDJYHU4s63mj5","FLrKXLSeQztX1Wt8hrZeVhMnnYbF7wR7Vu","FFvVKJkXVq33jz4ktGEWaKCGJ5NrRBXyZn","FU6v3Wvf9RqcaErMbsCexe6zwjhmdVNA5H","F7u4NqteF3br4gEJkGHxZvB9mHZK3jyVTy","FT8BAUKJqhFdoNxjKAfHCcENTTx8F8TuuM","FEhtSSvzash2H6xVexapLGKjx4D4wvBePn","FP6Lu9xisecx2aeXnEzy3gi4pjjbtNb7HC","FCMKmrkNgtZb49hbTKxNUvAa1YEk5EjV1H","FA4U9mwY1nwuxeRZxG4eLc67rYgHmt2w9q","FExv6uvSDtRz4eFEy3ti6D33bYGkUcbRgk","FK78zavjFuBX5R4ScKbJT8m976KG4mSwya","FP6MJjvBoDjdMiqMUv6tLwTV8MooNmFGtC","FQTzi6F8A74utcbWWRRc2xJZxGYVNVnFrJ","FUD4S2XARwLr8UAizZq6mAtxoGxrQGL4xn","FQrPQ1u6KAZS6xyKp3in1nt7qYkQth8A7m","FNXQRcaQ6dwXVeGTU1aUiDgtaF57dwtt3s","FEmW2dV44Y34i1V1nwQAikueskkBM4zLqJ","FJRGk6Ta66mVBRgdf7mycssWfM6u38QepB","FGsBEWr6fG3gEn3MXbr7iJLCJPRkk9s3ZR","FHiueiWKkLufXFw9n8P5jj58DXgzbQk9Ju","F9DG3HQuPrKCbbvmEyizWu9caUE8Bq6raq","FRmtY4MyJhhdK9vd8LMvejZXAxbFUfta9h","FUfymX6wq9u2stNWxndJCiwEjMXiseTjEQ","FFTqm8RH7b1QS6vTAJoHpj3iFpdKVZE92d","FBLjtLerw2w1aoMYaSjfidvF9ojqCYGjSp","FUUQbBet4vWsqLsZebPtLaHmSxhD59pYaE","F8srw8yFuAp26oHZPWqafeU8gkmKHC6dN2","FHg1qgaEixSEpkA9nPfqZx4U2EUZrgebLM","FAzNtFQUaX5zdPr7YbrosoCvR7oT4SAWHi","FADNP2SVnPQwwJtzRwR1CCPeDPqZrZv1pU","FLjRbQshm9jZtnRPU6xTT3f5PkcVqpZYNA","F66tA5cJ5FXXgza4Wy6HEuDw5NF5dCCBuf","F7vZkh5UFj6NU5p6uboE6JkZbDvwhvCxpQ","FSGBuZxWTHNGaVP7hLz2AmyFrLSaFZfdvg","FHRHcLaPT6gHzwhVS7Uev3HZsHFZBqczo2","FHphzGDaLHVMzYdxv84DbKsXvDch563sv2","FPGVktiCe8ofGTDjnf163Whx5XJd73YCAG","F87qeCkWEC1CpziF63kXLVChDUxT7PApRU","FFrKMLjcFKv9kxDjDVkVj7FSkQoVqGp3oq","FH6ZMAk5QLBXF6TrQoLwRF2bHUPTDLKNbj","FJUeWTHdm28zLr1YcDJT9Ugw9ADWWrEXuV","FHfcUKUvjCpUBCjZvffuCAekJpr5F6aVvd","FRcmtyn6SGdQP1EhWXGwhPBqifKsCBCYTV","FHUicpKp8YR6hRLx1CZP3RcHbPVQVphQ97","FPeE78qPP2h3VuDXHKhPA9jnxnXtaZKfzW","FRF9VoC4zTXQwwQbVnUJYBKn6XnqpqECRA","F7bnw9hw5i7STEfykPUzfACKWa452VQjWN","FML3iGzEf2gtRcVjh7XqjtyDL3Gq28GJHb","FMFR2iMPADrRnLbivytM68x4MuutWsBBWC","FRRahENHT1UCttCrwY9N2rPB1eHrbXnyDu","FPQNzxfTLTuL9W9GTSALaWBNjW1VQx3qbe","F91TJDUKEXBRpsLUoQjuA5zJTxoWS56ajg","FDS9vJsUvmMtpUsqFWLUvvBrYFMP5NG8Lj","FKATM2bYd64GWy7KvhaqC1US94BnWMaVDH","FDEDSatC5eJRN5e1uChQCaMEEg79YxwM7d","FJVpxQJvYusSr6nQ5DsUgCGzECFso6i5nG","FMgywtzhmhZQgc8sp8vsVHnxnu3AJWKsDC","FP8kx3LFvUHpC6LRW7i6uM8yGyhSEGLYRK","F7tRi6SaiKhFw9xSdTqfjKDczrmiDFSvvZ","FNzf3gC5bR6kWfxed2a1MwQyFRNTqBtD2G","FBRxqVUmLx4cRzeazYbQUtNJPy6qEz1uVL","F628f9VhjxWrdKtWySS61j6Utwx9NkhL1J","FNnc1dGCrjSgaDbSnd9D4vyJRcAJ4Rth9U","FBG1dKNSx9t5ERzp6Kvydav9RBpuVJYeio","FMiN7zLyUAPY5xrexA7pGGEFfPgNT5DFGo","FJUgHJ3oznvWZD33QJDzujPTRX14CQDX7x","FDrgcbDzcGtwaj9Mwqqd2MtUFs3R3ETMjW","FMR7N4aP4BvEjnVExZtSzBpGgPsWwWRuWk","FMjzpaeCjHS5mAeHMJzA493P2R2KkT8Ci3","FD5mzUL9rA3iTzf3YgaixefrswRbujBEpP","FDgHEQeJJhy7GpBKGpP2cJinkWJSaz8E6S","F9jhVYht2JbaEovpVKwqo3mr1YqxksgXx2","F7VziUGF9ACzmp4ydzuSkdBMhg3XeYsKrr","FV3t8TsJokoCsJqesbAoZwxKLG2qfQQmVQ","FGXRPdgGcDwxfs1JX6tsETrm4pT4AxXL2K","FRfoK2LiraNUudqVgDuBERXmYPdmR7JT8L","FGbGzcQSCYV8xkv31iJ5Gh3kCvc2xopvmD","FTeARn24nR2Hu5tQEW1qF38ZDrBL741cQW","FLMs4Zv4CDXcWMUoCJr51CL2cymsUCxBYv","FQPY3VHUpbikrG2A8Ti3HDUepN2pApzm5A","FTz7QR4qrWL2C7VQkJdwtfns8uZPXwfrVv","FGXa7Q2f1pY5fyp1bqvXzLt5MHAXex3vVM","FNjUwRLFxisCXEAgNaz1zbxjUkmwYp2yBV","FJrkHjMoA1EpXVWEz61vNBiFRuCDqWFzUF","FDyiTjdzm4ztLL8K7Xt6t265weAaME711Z","FETgLWTZnVvGZ1WNyyhVkRPxZFTCMNrsoh","FBdH694FThGtKf3LsfQJq1EcMhiiqTCpXd","FEh8LLvTQRSkS7w8V9SeMijtJaUTUdNvf1","FFcjgmWD4RXju3p1ZghEqPQQmufeiAsnxK","FQcAZrSbY5qtycVsm6rGN2fsVHdnj9Kd9L","FT7he6WdmLisVQZkGsbrtery17o1uazZJi","FUNqp3QMLBYZn7UoQbebCQz7jAhmub1AC4","FBZMBW1UQayPBYNBxfb9pWLjjjXFAjwUa7","FTJaTERvAHa5kZJeKDKAJWKscSjNQXxXFT","FG2XjHhVTPskqgjAbWRz82JJpLQ49tQ5Nd","FD1zZEmUT1mXtDrgCJ4bcedoqFpexPqayR","F8V4Rngdqwjpw57D9uzjFTKR3qKLgSD2Gf","FJC9rGvTW9ELQBBhxVG9dCFKeh43xvGjQw","FG6fENHT9fHKsrGNPjA8QftoHnLzdzryHV","FFFaD6Jz9S8qybLoUNrfww7HrL15ZcDYe3","F8WDw1j4mcu4poiuTqxkgTAoAWoPehCfLw"]
                console.log(addressesToUpdate);
                // AddressToUpdateController.resetOrder(addressesToUpdate, function(numberRemoved) {
                //     console.log('numberRemoved', numberRemoved)
                // });
            })
            break;
        case 'test':
            var where = {};
            var fields = {};
            where.order = {$not:{$gt: 0}};
            var limitBigChain = 80000000;
            if(limitBigChain > 10000000) {
                limitBigChain = 10000000;
            }
            AddressToUpdateController.getAllUniqueCursor(where, fields,{}, 0, offset, limitBigChain, function(cursor) {
                function getNext() {
                    cursor.next(function(error, doc) {
                        console.log(doc);
                        console.log(error);
                        if(doc) {
                            setTimeout(function(){
                                getNext();
                            })
                        }
                    });
                }
                getNext();
                // console.log(results);
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
        case 'find_orphans_tx_in_address':
            if(hash_number != undefined && isNaN(hash_number)) {
                var sent = 0;
                var received = 0;
                var total = 0;
                var cpuCount = numCPUs;
                var currentAddress = 0;
                if (cluster.isMaster) {
                    console.log(`Master ${process.pid} is running`);

                    // Fork workers.
                    AddressToUpdateController.getAllAddressUniqueTxs(hash_number, 1, 0,(txs) => {
                        for (let i = 0; i < cpuCount; i++) {
                            var worker = cluster.fork();
                            worker.on('message', function (msg) {
                                if (msg.killAll) {
                                    for (var id in cluster.workers) {
                                        cluster.workers[id].kill();
                                    }
                                }
                                if (msg.sent) {
                                    sent += parseFloat(msg.sent);

                                }
                                if (msg.received) {
                                    received += parseFloat(msg.received);
                                }
                                if (msg.total) {
                                    total += 1;
                                }
                                if(msg.finished) {
                                    if (txs && txs.length) {
                                        if (cluster.workers[this.id]) {
                                            cluster.workers[this.id].send({txid: txs[0]});
                                            currentAddress++;
                                            txs.shift();
                                        }
                                    } else {
                                        if (cluster.workers[this.id]) {
                                            cluster.workers[this.id].send({kill: true});
                                        }
                                    }
                                }
                            })

                            if(txs && txs.length) {

                            } else {

                            }
                            if (txs && txs.length) {
                                worker.send({txid: txs[0]});
                                currentAddress++;
                                txs.shift();
                            } else {
                                worker.send({kill: true});
                            }
                        }
                    });

                    var exit_count = 0;
                    cluster.on('exit', (worker, code, signal) => {
                        exit_count++;
                        if (exit_count === cpuCount) {
                            console.log('sent', sent)
                            console.log('received', received)
                            console.log('balance', received - sent)
                            console.log('total', total)
                            db.multipleDisconnect();
                            process.exit();
                        }
                        // db.multipleDisconnect();
                        // process.exit();
                        console.log(`worker ${worker.process.pid} died`);
                    });
                } else {
                    process.on('SIGTERM', function () {
                        // process.exit();
                    })
                    process.on('message', function(msg) {
                        if(msg.txid !== undefined) {
                            startTest(msg.txid);
                        }
                        if(msg.kill) {
                            db.multipleDisconnect();
                            process.exit();
                        }
                    });
                    function startTest(txid) {
                        wallet_commands.getRawTransactionFull(wallet, txid).then(function(res) {
                            if(res) {
                                // res = JSON.parse(res);
                                for(var j in res.addreses_to_update) {
                                    var amount = res.addreses_to_update[j].amount;
                                    var type = res.addreses_to_update[j].type;
                                    if(res.addreses_to_update[j].address === hash_number) {
                                        cluster.worker.send({total: true});
                                        if(type === 'vin') {
                                            cluster.worker.send({sent: amount});
                                        }
                                        else if(type === 'vout') {
                                            cluster.worker.send({received: amount});
                                        }
                                    }
                                }
                                cluster.worker.send({finished: true});
                            } else {
                                console.log('txid not found in wallet - ', txid);
                            }
                        }).catch(function(err) {
                            console.log('err', err)
                        })
                    }
                }
            } else {
                console.log('please provide an address');
            }
            break;
        case 'find_missing_txs':
            var total = 0;
            var cpuCount = numCPUs;
            var currentBlock = 1;
            var limit = 0;
            if(hash_number != undefined && !isNaN(hash_number)) {
                currentBlock = parseInt(hash_number)
            }
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                BlockController.estimatedDocumentCount(function (count) {
                    if(limit && currentBlock + limit < count) {
                        count = currentBlock + limit;
                    }
                    for (let i = 0; i < cpuCount; i++) {
                        var worker = cluster.fork();
                        worker.on('message', function (msg) {
                            if (msg.killAll) {
                                for (var id in cluster.workers) {
                                    cluster.workers[id].kill();
                                }
                            }
                            if (msg.total) {
                                total += msg.total;
                            }
                            if (msg.finished) {
                                if (currentBlock < count) {
                                    if (cluster.workers[this.id]) {
                                        cluster.workers[this.id].send({blockindex: currentBlock});
                                        currentBlock++;
                                    }
                                } else {
                                    if (cluster.workers[this.id]) {
                                        cluster.workers[this.id].send({kill: true});
                                    }
                                }
                            }
                            if(msg.killAll) {
                                for (var id in cluster.workers) {
                                    console.log('id', id)
                                    cluster.workers[id].kill();
                                }
                            }
                        })
                        if (currentBlock < count) {
                            worker.send({blockindex: currentBlock});
                            currentBlock++;
                        } else {
                            worker.send({kill: true});
                        }
                    }
                });

                var exit_count = 0;
                cluster.on('exit', (worker, code, signal) => {
                    exit_count++;
                    console.log('exit_count', exit_count)
                    if (exit_count === cpuCount) {
                        console.log('total', total)
                        db.multipleDisconnect();
                        process.exit();
                    }
                    // db.multipleDisconnect();
                    // process.exit();
                    console.log(`worker ${worker.process.pid} died`);
                });
            } else {
                process.on('SIGTERM', function () {
                    db.multipleDisconnect();
                    process.exit();
                })
                process.on('message', function (msg) {
                    if (msg.blockindex !== undefined) {
                        startTest(msg.blockindex);
                    }
                    if (msg.kill) {
                        db.multipleDisconnect();
                        process.exit();
                    }
                });

                function startTest(blockindex) {
                    console.log('blockindex', blockindex)
                    BlockController.getOne(blockindex, function (block) {
                        if(block) {
                            TxController.getAll2({blockindex: blockindex}, {}, '', '', 0, 0, function (txs) {
                                TxVinVoutController.getAll2({blockindex: blockindex}, {}, '', '', 0, 0, function (txsvinvout) {
                                    wallet_commands.getBlock(wallet, block.blockhash).then(function (res) {
                                        if (res) {
                                            res = JSON.parse(res);
                                            if (txs.length !== res.tx.length) {
                                                console.log('missing txs on db - ', blockindex);
                                                console.log('need node server/cronJobs/reindex_from_split.js ' + wallet + ' ' + blockindex);
                                                if (cluster.worker.isConnected()) {
                                                    cluster.worker.send({killAll: true});
                                                }
                                            } else if(txsvinvout.length !== res.tx.length) {
                                                console.log('missing txs vin vout on db - ', blockindex);
                                                console.log('need node server/sync.js ' + wallet + ' save_from_tx_vin_vout_and_addresses ' + blockindex);
                                                if (cluster.worker.isConnected()) {
                                                    cluster.worker.send({killAll: true});
                                                }
                                            } else {
                                                if (cluster.worker.isConnected()) {
                                                    cluster.worker.send({total: res.tx.length});
                                                    cluster.worker.send({finished: true});
                                                }
                                            }
                                        } else {
                                            console.log('block not found in wallet - ', block.blockhash);
                                            cluster.worker.send({killAll: true});
                                        }
                                    }).catch(function (err) {
                                        console.log('err', err)
                                    })
                                });
                            });
                        } else {
                            console.log('block not found in db - ', blockindex);
                            cluster.worker.send({killAll: true});
                        }
                    })
                }
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
            // console.log('stats')
            data.stats = stats;
            resolve();
        })
    }))
    promises.push(new Promise((resolve, reject) => {
        AddressToUpdateController.getAddressDetails(settings[wallet].dev_address, function(address) {
            // console.log('address')
            data.address = address;
            resolve();
        })
    }))
    promises.push(new Promise((resolve, reject) => {
        AddressToUpdateController.countUnique(function(total_wallets_count) {
            // console.log('total_wallets_count', total_wallets_count)
            data.total_wallets_count = total_wallets_count;
            resolve();
        })
    }))
    promises.push(new Promise((resolve, reject) => {
        AddressToUpdateController.countActive(function(active_wallets_count) {
        // console.log('active_wallets_count', active_wallets_count)
        data.active_wallets_count = active_wallets_count;
        resolve();
        })
    }))
    Promise.all(promises).then((response) => {
        // console.log('all')
        if(data.stats) {
            data.stats.total_wallets_count = data.total_wallets_count;
            data.stats.active_wallets_count = data.active_wallets_count;
            data.stats.dev_wallet_balance = data.address.balance;
            StatsController.updateWalletExtraStats(data.stats, function (err) {
                if (err) {
                    console.log(err)
                }
                // console.log('took - ', helpers.getFinishTime(startTime));
                deleteFile('extraStats');
                db.multipleDisconnect();
                process.exit();
            });
        } else {
            // console.log(' no stats found yet');
            // console.log('took - ', helpers.getFinishTime(startTime));
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
        // console.log('updating richlist');
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
                            // console.log('finish updating richlist');
                            // console.log('took - ', helpers.getFinishTime(startTime));
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


var gettingNextTxs = function(limit, offset, blockindex, lastTx) {
    var promise = new Promise(function(resolve, reject) {
        getNextTxs(blockindex, lastTx).then(function (res) {
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

var getNextTxs = function(blockindex, lastTx) {
    var promise = new Promise(function(resolve, reject) {
        var where = {};
        var fields = {}
        offset = offset * limit;
        if(blockindex) {
            blockindex = parseInt(blockindex);
            console.log('blockindex', blockindex);
            console.log('blockindex + limit', blockindex + limit);
            where = {$and: [{blockindex : {$gte : blockindex}}, {blockindex : {$lt : blockindex + limit}}]};
        }
        if(lastTx) {
            console.log('lastTx.blockindex', lastTx.blockindex + 1);
            console.log('lastTx.blockindex + limit', lastTx.blockindex + 1 + limit);
            where = {$and: [{blockindex : {$gte : lastTx.blockindex + 1}}, {blockindex : {$lt : lastTx.blockindex + 1 + limit}}]};
        }
        TxController.getAll2(where, fields,'blockindex', 'asc', 0, 0, function(results) {
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
        if(blockindex) {
            where = {$and: [{blockindex : {$gte : blockindex}}, {blockindex : {$lt : blockindex + limit}}]};
            offset = 0;
        }
        if(lastTx) {
            where = {$and: [{blockindex : {$gt : lastTx.blockindex}}, {blockindex : {$lt : blockindex + limit}}]};
            offset = 0;
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
        // where = {$or: [{txid_type: {$exists: false}}, {txid_type: {$eq: 0}}]};
        where = {$or: [{order: {$exists: false}}, {order: {$eq: 0}}]};
        if(blockindex) {
            where.blockindex = { $gte : blockindex};
        }
        // where.address = {$in: [
        //     "STQ9srMUDTcQ9vnHeM6zCnLLCnmDmLhZPi",
        //         "SYbbcLFWMQRvFbDvD16rSdMdS2i96gutc3",
        //         "SNmPWFJJVSCrBe4bqW7U1Smz4aEkWviGaR",
        //         "SjPcmzmARAB8wSdiHCrWqAopw1dtXdT8zC"
        //     ]};
        // where.txid_timestamp = {$type: 2};
        AddressToUpdateController.getAll3(where, fields,{address:1, blockindex: 1}, limit, offset, function(results) {
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

var gettingNextUniqueAddresses = function(limit, offset, total) {
    var promise = new Promise(function(resolve, reject) {
        getUniqueAddresses(limit, offset, total).then(function (res) {
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

var getUniqueAddresses = function(limit, offset, total) {
    var promise = new Promise(function(resolve, reject) {
        var where = {};
        var fields = {};
        // where = {$or: [{order: {$exists: false}}, {order: {$eq: 0}}]};
        where.order = {$not:{$gt: 0}};
        // where.address = "WUv8fyfuCWbTzmhvDaSGUfundZunnxGt12";
        // where.address = {$in: [
        //         "SRYkHm3QGCFyje2kP9sEC3wVb9gEA9voEG",
        //         "DMxqi2N2NvtR4scP6hJYjcXD8gPPccNyiz",
        //         "DCEoP1hSiGStSRe8LLpMncxhEiphrkG6ne",
        //         // "ST54anf1Y7Rin88QxB3sUX1vfPJHtDjgUP",
        //         // "DBGQq1FPyBMPw8iwEbfNuxi2yuaDW8s3Hv",
        //         // "DTWaFdwzz3zYPPinoZHw89ELTvHrmBDwyh",
        //         // "DKJrcTxQDQc9Q797dEnBes3XQETrcmRxeH",
        //         // "DSwGy32nTPm8nM5YfobvbvHryHiJSMtL9y",
        //     ]};
        var limitBigChain = total;
        if(limitBigChain > 1000000) {
            limitBigChain = 1000000;
        }
        AddressToUpdateController.getAllUnique(where, fields,{}, limit, offset, limitBigChain, function(results) {
            // console.log('results.length', results.length);
            resolve(results);
        });
    });
    return promise;
}

var gettingNextAddressesToOrderCursor = function(limit, total) {
    var promise = new Promise(function(resolve, reject) {
        var offset = 0;
        var where = {};
        var fields = {};
        // where.blockindex = {$not: {$gt: 100}};
        where.order = {$not: {$gt: 0}};
        // where.address = {$in: [
        //     "SNKH6MMiZahBVV5CkNvo6gW9iTZ38Rdg59",
        //     "SZC8B1scnzTeVk9bqGCJFhXEHH2sJpYK95",
        //     "Si2nrss96jc4aCevDUt6hdiu4mkVY8C1gD",
        //     "SbCuVbUjbVTfVZLU1ypAMTKCG86rQf5M1E",
        //     "Sj4CseBXnRd4kwF5HTp1gjknteY2hGXLpm",
        //     "SQHoUgXttAm6w877GZsbAvwQLEHwkMJNhn",
        //     "SaX5z3QJhDjUBNsYTkrh8wuDnieWWZHR1f",
        //     "SZgnRmQkH8xkBHNRHaiVAVo5YUaBHTa2tL",
        // ]};
        var limitBigChain = total;
        if (limitBigChain > 5000000) {
            limitBigChain = 5000000;
        }
        AddressToUpdateController.getAllUniqueCursor(where, fields, {}, limit, offset, limitBigChain, function (cursor) {
            resolve(cursor);
            // function getNext() {
            //     cursor.next(function (error, doc) {
            //         console.log(doc);
            //         console.log(error);
            //         if (doc) {
            //             setTimeout(function () {
            //                 getNext();
            //             })
            //         }
            //     });
            // }
            //
            // getNext();
            // console.log(results);
        });
    });
    return promise;
}

var gettingNextTxsByOrder = function(limit, offset, lastOrder) {
    var promise = new Promise(function(resolve, reject) {
        getNextTxsByOrder(limit, offset, lastOrder).then(function (res) {
            if (res && res.length) {
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
        TxVinVoutController.getAllAggregeate(where, fields,'blockindex', 'asc', limit, offset, function(results) {
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
                    cluster.worker.send({blockNotFound: blockNum});
                } else {
                    updateBlockTx(0, current_block);
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
                        cluster.worker.send({blockNotFound: blockNum});
                    }
                });
            }
        }).catch(function (err) {
            if(err && err.toString().indexOf("couldn't parse reply from server") > -1) {
                globalStartGettingTransactions(blockNum);
            } else {
                if(err && err.toString().indexOf("couldn't connect to server") > -1) {
                    cluster.worker.send({walletDisconnected: true});
                }
                console.log('error getting block - ' + blockNum, err);
                cluster.worker.send({blockNotFound: blockNum});
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
            cluster.worker.send({blockNotFound: blockNum});
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
                var insertTx = function() {
                    TxVinVoutController.updateOne(vinvout, function (err) {
                        if (err) {
                            console.log('err', err);
                            if (err.stack.indexOf('Server selection timed out') > -1 ||
                                err.stack.indexOf('interrupted at shutdown') > -1) {
                                cluster.worker.send({mongoTimeout: true});
                            }
                            insertTx();
                        } else {
                            finishUpdateTx = true;
                            console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                            if (finishUpdateTx && finishUpdateAddress) {
                                cluster.worker.send({finished: true});
                            }
                        }
                    })
                }
                insertTx();

                var insertAddresses = function() {
                    if (addreses_to_update.length) {
                        // console.log('updating address - ' + addreses_to_update[0].blockindex, addreses_to_update[0].address);
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
    }).catch(function(err) {
        console.log('tx not found on db - ', tx.blockindex)
        cluster.worker.send({mongoTimeout: true});
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
                        // console.log('market cap update success ', data.symbol)
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
                            // console.log('market update success ', market.symbol)
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
            // console.log('data',lastDate);
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

function updateClusterTxByDay(wallet) {
    ClusterController.getAllClustersIds(function(clusters) {
        startUpdateCluster(clusters);
    })

    function startUpdateCluster(clusters) {
        if(clusters && clusters.length) {
            var clusterId = clusters[0];
            // console.log('clusterId', clusterId)
            clusters.shift();
            ClusterTxByDayController.getAllForCluster(clusterId, 'd', 'desc', 1, function(data) {
                var currentDate = new Date(new Date().setHours(0,0,0,0));
                var currentDateString = currentDate.getFullYear() + "-" + ("0"+(currentDate.getMonth()+1)).slice(-2) + "-" + ("0" + currentDate.getDate()).slice(-2);

                var previousDate = new Date(new Date(currentDate.getTime() - 24*60*60*1000).setHours(0,0,0,0))
                var previousDateString = previousDate.getFullYear() + "-" + ("0"+(previousDate.getMonth()+1)).slice(-2) + "-" + ("0" + previousDate.getDate()).slice(-2);
                if(data.length) {
                    var lastDate = data[0].d;
                    if(lastDate === currentDateString) {
                        console.log('lastDate', lastDate)
                        lastDate = previousDateString;
                        console.log('previousDateString', previousDateString)
                    }
                    // console.log('data',lastDate);
                    updateClusterTxByDay(clusterId, lastDate);
                } else {
                    // console.log('no data yet');
                    updateClusterTxByDay(clusterId, "");
                    // db.multipleDisconnect()
                }
            })
        } else {
            console.log('finish updating all clusters');
            deleteFile('clustersTxByDay');
            db.multipleDisconnect();
        }

        function updateClusterTxByDay(clusterId, dateString) {
            ClusterController.getClusterTxsCountFromDate(clusterId, dateString, 1,function(count) {
                if(count) {
                    ClusterController.getTransactionsChart2(clusterId, dateString, function (txByDays) {
                        if (txByDays && txByDays.length) {
                            updateClusterTxByDayOneByOne(clusterId, txByDays);
                        } else {
                            // console.log('no tx found - ', clusterId);
                            startUpdateCluster(clusters);
                        }
                    })
                } else {
                    startUpdateCluster(clusters);
                    console.log('finish updating cluster chart - ' + clusterId)
                }
            });
        }

        function updateClusterTxByDayOneByOne(clusterId, txByDays) {
            // console.log(txByDays[0])
            ClusterTxByDayController.updateOne(txByDays[0], function(err) {
                if(err) {
                    console.log('err updateClusterTxByDayOneByOne', err);
                } else {
                    txByDays.shift();
                    if(txByDays.length) {
                        updateClusterTxByDayOneByOne(clusterId, txByDays)
                    } else {
                        startUpdateCluster(clusters);
                        console.log('finish updating cluster chart - ' + clusterId)
                    }
                }
            })
        }
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


