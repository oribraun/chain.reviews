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
var cpuNumber = process.argv[5];
if(cpuNumber && parseInt(cpuNumber, 0)) {
    numCPUs = cpuNumber
}

var commands_require_db = [
    'save_tx',
    'save_blocks',
    'save_tx_vin_vout_and_addresses',
    'reindex_addresses',

    'update_tx',
    'fix_tx_from_to',
    'update_tx_vin_vout_and_addresses',
    'update_addresses_order_and_sum',

    'save_from_tx',
    'save_from_tx_vin_vout_and_addresses',
    'save_from_tx_vin_vout_and_addresses_cursor',
    'save_from_update_addresses_order_and_sum',
    'save_tx_vin_vout_and_addresses_based_on_latest',
	'save_one_block',

    'delete_from',

    'save_tx_linear',
    'reindex_block_only_from',
    'reindex_block_only_from_cursor',

    'update_address_type',
    'update_address_type_timestamp',
    'update_address_order',
    'update_address_balance',
    'update_address_balance_cursor',
    'update_address_balance_cursor_one_cpu',
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
    'test2',
    'fix_address_order',
    'fix_address_order2',
    'find_unconfirmed',
    'find_missing_blocks',
    'find_orphans_tx_in_address',
    'find_missing_txs',
    'fix_missing_genesis_block',

    'get_missing_tx_vinvout',
    'update_one_tx_to_vinvout'
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
                console.log('info', blockCount);
            }).catch(function(err) {
                console.log('error getting blockCount', err);
                process.exit();
            });
            break;
        case 'gettxoutsetinfo':
            wallet_commands.getTxoutsetInfo(wallet).then(function(blockCount){
                console.log('info', blockCount);
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
        case 'save_blocks': // 0:52:3.69 - block count 149482
            if (cluster.isMaster) {
                wallet_commands.getBlockCount(wallet).then(function (allBlocksCount) {
                    // allBlocksCount = 152939;
                    var startTime = new Date();
                    console.log(`Master ${process.pid} is running`);
                    if( !hash_number || isNaN(hash_number)) {
                        console.log('missing block number');
                        db.multipleDisconnect();
                        process.exit()
                        return;
                    }
                    console.log('hash_number', hash_number)
                    startReindex(function(){
                        BlockController.deleteAllWhereGte(hash_number, function (numberRemoved) {
                            startReIndexClusterLinerAll()
                        })
                    })
                    var currentBlock = hash_number;
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

                        globalStartGettingBlocks(msg.blockNum);
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
                        BlockController.getAll('blockindex', 'desc', 8, function (latestTx) {
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
        case 'fix_tx_from_to': // 0:52:3.69 - block count 268159
            if (cluster.isMaster) {
                wallet_commands.getBlockCount(wallet).then(function (allBlocksCount) {
                    // allBlocksCount = 152939;
                    var startTime = new Date();
                    // console.log(`Master ${process.pid} is running`);
                    // if(fileExist()) {
                    //     console.log('reindex is in progress');
                    //     db.multipleDisconnect();
                    //     process.exit(1)
                    //     return;
                    // }
                    // createFile();
                    if( !hash_number || isNaN(hash_number)) {
                        console.log('missing block number');
                        db.multipleDisconnect();
                        process.exit()
                        return;
                    }
                    var fromBlock = 112710;
                    var toBlock = 112715;
                    var currentBlock = fromBlock;
                    allBlocksCount = toBlock;
                    var exit_count = 0;
                    var cpuCount = numCPUs;
                    var walletDisconnected = false;
                    var mongoTimeout = false;
                    var blockNotFound = false;
                    var startedFromBlock = 0;
                    var startReIndexClusterLinerAll = function() {
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
                    }

                    //TODO
                    // check last 6 db blocks exist in wallet
                    var checkLatestBlocksInWallet = function() {
                        BlockController.getAll('blockindex', 'desc', 8, function (latestTx) {
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
                var cpuCount = 1;
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
                            console.log('val', val)
                            var diff = val.toString().length - Number.MAX_SAFE_INTEGER.toString().length;
                            if(diff > 0) {
                                val = Math.round(val / (diff * 10))
                                for(var i = 0; i < diff; i++) {
                                    val = val * 10;
                                }
                            }
                            // console.log('diff', diff)
                            // console.log('rounded val', val)
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
                                for(var i = 0; i < diff; i++) {
                                    val = val * 10;
                                }
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
                                    if(cluster.workers[clusterQ[0]]) {
                                        cluster.workers[clusterQ[0]].send({currentAddress: address});
                                        activeAddresses[clusterQ[0]] = address._id;
                                        countAddresses++;
                                        startedClusters++;
                                        gotNewData = true;
                                    }
                                    clusterQ.shift();
                                    // console.log('address._id', address._id);
                                } else {
                                    console.log('duplicate address - ', address._id)
                                }
                                if(clusterQ.length) {
                                    getNextForAllClusters();
                                }
                            }).catch(function(error){
                                gettingNextInProgress = false;
                                console.log('startedClusters', startedClusters);
                                console.log('error', error);
                                if((startedClusters && gotNewData) || error !== 'finished') {
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
                                        reject(error);
                                    }
                                    else if (nextAddress) {
                                        resolve(nextAddress);
                                    } else {
                                        reject('finished');
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
                            console.log('val', val)
                            var diff = val.toString().length - Number.MAX_SAFE_INTEGER.toString().length;
                            if(diff > 0) {
                                val = Math.round(val / (diff * 10))
                                for(var i = 0; i < diff; i++) {
                                    val = val * 10;
                                }
                            }
                            // console.log('diff', diff)
                            // console.log('rounded val', val)
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
                                    // console.log('process.memoryUsage()',process.memoryUsage());
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
        case 'update_address_balance_cursor_one_cpu':
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
                var cpuCount = 1;
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
                                    if(cluster.workers[clusterQ[0]]) {
                                        cluster.workers[clusterQ[0]].send({currentAddress: address});
                                        activeAddresses[clusterQ[0]] = address._id;
                                        countAddresses++;
                                        startedClusters++;
                                        gotNewData = true;
                                    }
                                    clusterQ.shift();
                                    // console.log('address._id', address._id);
                                } else {
                                    console.log('duplicate address - ', address._id)
                                }
                                if(clusterQ.length) {
                                    getNextForAllClusters();
                                }
                            }).catch(function(error){
                                gettingNextInProgress = false;
                                console.log('startedClusters', startedClusters);
                                console.log('error', error);
                                if((startedClusters && gotNewData) || error !== 'finished') {
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
                                        reject(error);
                                    }
                                    else if (nextAddress) {
                                        resolve(nextAddress);
                                    } else {
                                        reject('finished');
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
                            console.log('val', val)
                            var diff = val.toString().length - Number.MAX_SAFE_INTEGER.toString().length;
                            if(diff > 0) {
                                val = Math.round(val / (diff * 10))
                                for(var i = 0; i < diff; i++) {
                                    val = val * 10;
                                }
                            }
                            // console.log('diff', diff)
                            // console.log('rounded val', val)
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
                                    // console.log('process.memoryUsage()',process.memoryUsage());
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
                                        ClustersBlockController.updateOne({name:"reindex_block",block:currentBlock}, function() {
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
        case 'save_from_tx_vin_vout_and_addresses_cursor': // 12:47:25.775 - block count 268159
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
                var gettingNextInProgress = false;
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
                                gettingNextTxsCursor(limit, offset, currentBlockIndex, lastTx).then(function (cursor) {

                                    function getNext() {
                                        gettingNextInProgress = true;
                                        return new Promise(function(resolve, reject) {
                                            cursor.next(function (error, nextTx) {
                                                gettingNextInProgress = false;
                                                if (error) {
                                                    console.log('cursor error', error);
                                                    reject(error);
                                                }
                                                if (nextTx) {
                                                    resolve(nextTx);
                                                } else {
                                                    reject();
                                                }
                                            });
                                        });
                                    }
                                    for (let i = 0; i < cpuCount; i++) {
                                        var worker = cluster.fork();
                                        (function (w) {
                                            getNext().then(function (tx) {
                                                w.send({currentBlock: tx, order: lastOrder + countBlocks});
                                                countBlocks++;
                                                currentBlocks.shift();
                                            }).catch(function (err) {
                                                console.log('cursor err', err);
                                                w.send({kill: true});
                                            })
                                        })(worker);
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
                                            console.log('code', code);
                                            console.log('signal', signal);
                                        });
                                        worker.on('message', function (msg) {
                                            // if (msg.addreses_to_update) {
                                            //     startUpdatingAddresses(msg.addreses_to_update)
                                            // }
                                            if (msg.finished) {
                                                (function (id) {
                                                    clusterQ.push(id);
                                                    if(!gettingNextInProgress) {
                                                        function getNextForAllClusters() {
                                                            getNext().then(function (tx) {
                                                                cluster.workers[clusterQ[0]].send({currentBlock: tx, order: lastOrder + countBlocks});
                                                                clusterQ.shift();
                                                                countBlocks++;
                                                                currentBlocks.shift();
                                                                if(clusterQ.length) {
                                                                    getNextForAllClusters();
                                                                }
                                                            }).catch(function (err) {
                                                                cluster.workers[clusterQ[0]].send({kill: true});
                                                                clusterQ.shift();
                                                            })
                                                        }
                                                        getNextForAllClusters();
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
                                    };
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
                process.on('SIGTERM', function() {
                    console.log('*** GOT SIGTERM ***');
                })
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
                            console.log('val', val)
                            var diff = val.toString().length - Number.MAX_SAFE_INTEGER.toString().length;
                            if(diff > 0) {
                                val = Math.round(val / (diff * 10))
                                for(var i = 0; i < diff; i++) {
                                    val = val * 10;
                                }
                            }
                            // console.log('diff', diff)
                            // console.log('rounded val', val)
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
                        gettingNextBlocks(limit, currentBlockIndex).then(function (res) {
                            gettingNextTxsInProgress = false;
                            if (res && res.length) {
                                currentBlocks = currentBlocks.concat(res);
                                currentBlockIndex = currentBlocks[currentBlocks.length - 1];
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
                                                            gettingNextBlocks(limit, currentBlockIndex).then(function (res) {
                                                                if (res && res.length) {
                                                                    currentBlocks = currentBlocks.concat(res);
                                                                    currentBlockIndex = currentBlocks[currentBlocks.length - 1];
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
        case 'reindex_block_only_from_cursor':
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
                        gettingNextTxsCursor(limit, offset, currentBlockIndex, lastTx).then(function (cursor) {

                            function getNext() {
                                gettingNextInProgress = true;
                                return new Promise(function(resolve, reject) {
                                    cursor.next(function (error, nextTx) {
                                        gettingNextInProgress = false;
                                        if (error) {
                                            console.log('cursor error', error);
                                            reject(error);
                                        }
                                        if (nextTx) {
                                            resolve(nextTx);
                                        } else {
                                            reject();
                                        }
                                    });
                                });
                            }
                            for (let i = 0; i < cpuCount; i++) {
                                var worker = cluster.fork();
                                (function (w) {
                                    getNext().then(function (tx) {
                                        w.send({currentBlock: tx});
                                        countBlocks++;
                                        currentBlocks.shift();
                                    }).catch(function (err) {
                                        console.log('cursor err', err);
                                        w.send({kill: true});
                                    })
                                })(worker);
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
                                    console.log('code', code);
                                    console.log('signal', signal);
                                });
                                worker.on('message', function (msg) {
                                    // if (msg.addreses_to_update) {
                                    //     startUpdatingAddresses(msg.addreses_to_update)
                                    // }
                                    if (msg.finished) {
                                        (function (id) {
                                            clusterQ.push(id);
                                            if(!gettingNextInProgress) {
                                                function getNextForAllClusters() {
                                                    getNext().then(function (tx) {
                                                        cluster.workers[clusterQ[0]].send({currentBlock: tx});
                                                        clusterQ.shift();
                                                        countBlocks++;
                                                        currentBlocks.shift();
                                                        if(clusterQ.length) {
                                                            getNextForAllClusters();
                                                        }
                                                    }).catch(function (err) {
                                                        cluster.workers[clusterQ[0]].send({kill: true});
                                                        clusterQ.shift();
                                                    })
                                                }
                                                getNextForAllClusters();
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
                            };
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
		case 'save_one_block':
		if( !hash_number || isNaN(hash_number)) {
                console.log('missing block number');
                db.multipleDisconnect();
                process.exit()
                return;
            }
			setTimeout(function(){
				globalStartGettingTransactions(hash_number);
			})
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
            case 'fix_address_order2':
                const addressesToUpdate = [
                    "19cj2saZQ224xox5cowXkupdkY7VyYxHSk","1JxTtRdj51JhVV35FJF1EmR9TBWkirWutj","12NnaNga66HzQp2sBPRm3kkJvAeazJCKE9","1PemV2TWuvv8tcVD55AXwBESihty3CvL19","1Ksgxtuzf91NnZxHNstdwHBZ4Tf7GBKRCw","1CqK9B1k4vsanBRyXt5Hs53iE18t2tGtZY","1PmorchZH8xxKBtN8Ftyio2uiRQXtNU7iD","15ahqvLzhnrE6Q6Wxr7jWfE1KKN9DBBrP6","15r7Ca6Mgcm1WyS1B9N4zThY2XMfuWMeEn","1Ad9W95RSFJrz4esiXeAPGm4NdMtDMiHdm","19wga8uWc43LPSyqQuBMHFsWqLqCQFvnZs","1Ja8xD3Zqps9KrTGZK9GQTmc15UfpKs6Dc","1N566gD42mj9aaNSGSrgwrS6FwFr8Xfd6i","1Kewu7JsvGXWHs67r9BiqdSKhdyJ1ax42R","1M1HKMzejJVdwaisYgqHswDNK5WPkLBKS1","1DpjE9cJBSLTdM6AUBN2VQjsuknEVtwRhM","17MqKKgt4ySTr9gy9exQfDHQtB8Sgmm9WV","18H6D41fzK4JgfFkrqs3CDugBuT6tAfsFV","1KqzzKG1wbdvEn8ECghXTbh2WkHeQZLjZU","1GvvZDU18eYqXz6ZDHGyyMkNgHZCJ5jGrn","1PkejNAAzgj6v1UkkNxt5eJWTS4gcxyax4","1GgMhjayn8UwyhJcvRLiAg2ACadSjRrC3H","15L9GypRaXHCRwfJzmFnyntrXz3dxskXgw","1691tEVehuropvFf5EmLF6NQkvztSmf3n2","1NdJSQffbHANUdd25Rk4r29DovCrYkqEmc","1EJ1QtVdLuoJyJxi2b7YEfup7fryuxvkGF","19SKAT94oyf2STCCMNGrhYZchDMsSrKvWC","1F91uqjMWJsTgBvHbG6PZNd981bNzvufDV","12xx1XZtRDsCEJpLwSt6e32o3e62SARbkQ","123uA7RLnH7dKyHVmbivB2QeiZqUxjXkqa","13BnYeyqrBtUdqvn25ELXxW4JMy5tCFv7g","18kWwt2pUfc2zNJb2szXEP2mEKUxnX6dy9","12LMRqCUVb3SZsH2GTeErPhoMPWeZJm2tH","1JjUZRP3WH3opLsu9WgPDZcHLHmLbVXsoc","1BhWu3Nvptugqw5EJ53fh3trYBQa3mp6Wp","16U3Z5vg6ePYdpVaMXqSoa4tS3s6HhFspj","13Mzg8j34axTV6uEB2H7VQDhU6i3vheNtC","1FQ8Nu9hpXZR57AM5BuioJGw4xVTubuVbU","1B1t8VVTN19e7FaxWp9dS7FCqULx6xgVYQ","13Ubawg9bfVJLLsyVx5tMZDCTwsEEYdVB3","18bmcqTfTBLtE1AXKTap1yQNTtUJagcmbB","13UeHGh5q8Xj8VVALouiRW35tUY7h7oknA","13mEkiqgZhHoTTSJmBtgZHgmPyGzEBFtfY","15BjczTcFWHF9bMijg7HbDqQP4fomxkcmY","1L7myMFEKvZ1zK3KV5C3dsgTWt2MRERsBJ","1Nsg9CdECXf3VpJjxDABi6kTcVmnWYozvq","1GcTvkZuxdgJgYrUVFQmNh56snzhixyUaS","1PmDwniY79hWX7m41AgS8ZKZKVCQWXxPuP","1NYCH2UBHaDcoyNpFEeohCHEDWEeTQwdbv","1DTT7KvHq4q3vZZMdqw45BQWybuDJBH23Q","1BCje8TWL1DdVoFLn8DgYPS91nB7edma7W","1BgXTcKphV3cy71d2qo6pHo4dgRvXvmMpb","1GDfTLzHHftLJGRgaRQR7QM7GqUVPrvqr1","1QFx6XSRsPRpdiL4ZbK42DcXg3S9CurRho","19dyUvRaqFcKhziF9MHwa6F6egFrodAMfG","1FP9vctoPWJnrGAnwGYzyXaGDxhF9Q65JE","1LN2jBwoQeNoK3LQo6ErCTKP446ubJf1jT","145sQYy6Xm8aCf1Y9E45oE5JBmMvf5qYAp","1BJ6oQKvSjuaSywv8F84mPM4stpnakSTwQ","1JiUryVb5JXSxQJiUayV6g5t9G5VyXrWWi","1Jsvqm9DAiq3sRVzUgP5EjH9ESpXxLFkhd","1N6TZMW3tb6Ht9mpmB8w3mcdUtzhPFQVGM","134z2LEdBsNV5SVixVyoadPq8uSbbCKBsz","1H9mZm16HDSS6TS5zbHgSGJWmzjikatr9s","1G2NYswUCoMST5ShsM7x5NytvyAShK7TaE","1N4JM9J62zoiHtsyBGvfPt2t8VYSQwZfnb","1CzbWNfyjPNnvgTPqE17n8pXD66ze1rjtW","1Hau9WPumpNwyhZiSyg5LrLjkCeU7voaov",
                    "1B8q4vDx9AaZG8HikATGHRow8SRPN7qUP9","1636ThurgaEJs971NBJ1QQcb3QUEE8ew6p","1HooyZpx3V35GBHwbF7LcrDhFucM4QKtVe","1GHxHr2Vn7BYwzwFQY3yeuGCYDo4vnStAU","14xxiGDhckf2Kc6zxDQQ55CwT5sYN9CedZ","1CMZY34oRQr4aTMuuYJHiyZ27mqAvEL2WP","1FyCs7KzDUucBecf1Qg6LEXbVUSJZxNtsj","1yPXxdT6P9GqjkQVnWaqtexzDBpy8FdzY","16JSwszY2HApDbXmfgzN5CdaUvCc3ijpVb","13Zm7UAnfvK1LEcWED3vAzw5Tkf4aJrj6g","1abmAH8NaRf8FCg8iFT5aJQYd9jCFu75N","16dNRtcKu49iZKmcQdUFrQ2DAyHghRsZJh","1EHPn2nfAm2h1kiqRckhq5YcRSaRFoGLLa","141kBpBao8RkixzooGsj5L2w82ZzNUTnr6","1H7rjuiuagbKNiB55uLwXEdKFHmTsLGZRD","1JEyiEzHDLG2qZ1v3Auh9GpdzdiXaiAbfB","14TzzFPGDr6PV3zwmXjpWVQytPrvHXmhaz","1HQLxtACiyR61ecg8DQNEL2TjVhExsAtbG","13rg6TWaQhj4wTrw7dN3cWhrJDfcgExE5B","1BfzPRSPTd775Vt9KbtHpqXbxJFEd5fQkz","127pWUbGT9MpXKMezT3KBKbnHawPpcDt1X","1JsptsMi8mc3M2azmQDdcpuAaWLUmbzQcv","14Ezos8TABLoJhzGoYxrrcM5QYCobbFwiG","1Ne4HVj6QBTBthjC4ptLyQVC4ARTMDHvQq","1QBz65fJaPFLExFiJnAUm1pCqMLZM1bNMX","17WSNnmmiJzk2DRQYi8hksnNj2JPzp2yFg","16DXCxQDcK4V2nrxhaiWfQHwe9qX48RCpS","1MsuyRk9NfPFuL3aJUQziKScMkZgkLLHno","1GFthLzYcrpLpWMF2AWdcvtK5PkkGDAy64","1KiCQnuhn929XmfMPZ85zcPQWNp7Bh1cnQ","1H7BMG9wk2At3hwGGNavbeDj3rWijJVJz9","1M6zH1FcJn6eJZxY2aiTrPsVjTYDjMPALk","1PRXyNcyHQruuwG43Da8RjZ8dpRsQ5SwLp","14nnb4Hxc9DmkRimsRQ46Sh8jmgZNcsRAe","1NZ8qjspVPcPjHe2Y649QXWfFXFfo8jDt4","18WjfG9CVwYvCqctTrXYdHMkNkFDQQiQo","18M1MAWvXQTq61NAVL6ZwtKm5gNEsZ1EYb","1Ei8PNkWU135hqinpqCRP9ML5njHGAz8Hd","12GiNyDxXM7Qj36gmxDW3vhkPgQQbnJ3u7","122Unwy8Gpi8ZiqMjKDiqfvHjW9QRua55A","1NuxfYReCLEuut9ckMU36V198FNxFy3ACR","1MgSHFMMkGYhpMYStja7iVkCMRr1gq8enZ","1KJhaCsgVShSPPX5nktSAPaWWXmiM4ve1d","1Pc9rKAY3Cp7DFez3ZwSnWJZpR3DDxwkDy","1LthVKqey3MxpJFN9sxpeibVAZpd6EmkKD","1HfgfD4Bvbt3iynNY65nba26VzFao3SB11","1E9mZpDT4TRnmhEeN1RRo1GPuTHpPnQt53","1BMpzocmwQaV1PNoxN5EmA13q52a3dy7wb","17tFkx9ESCN8Z6JmYQMJuVC4rkY22LTkuf","14dsxq1pY2k8Q7dTyrKY6vj7pa7SA9xgb1","1BkCZ5yHDf5LehENEhiGskPRNVKnkuYA4v","1JrprX4Mvj2HnHWkkkFR8Kx2bv7BQUzgFf","1NUTCdeMuDDDPHYgVjtAnVCoimCp2xFSpF","13AWzfZQ3JoSyHyE3PL68YPgrM9yCpShgF","1Lxxp2yP7PMqMUnsNJPsYRFwcY3Q45Q8fF","13oTXxKtwoS3GjLXysTCy4EYq1pFuoLjhb","1AKdCkoj7DNGWrdcBg9rCM8aCJ8o9qnnhR","1AmKX4mcuqRWNpsajNZvNXNLmtBKr5mJL8","1AeRozUPavymU5nCPJePVZ2fdG7KPaC9Rv","1NsKsaJrcpUkdu6gcbyCEqRGao8h4b9WgF","1H69HnQMZovXBNH22NHR89FRE6bfALFk4J","1F9rL8v5f5eTirP3k4Rfpr8j8GNLje9HWy","16yACGPB7LHmnkCeQkD5AeYuVwG1Ku5xZu","14Ct41iybvG6vCztoBMWCFy5w2gMAGxBxG","1DbGCb5AFzY3UHF37ejRRXnW36xt3oTc9Q","1JbaQYzRr23nem3kpHDgHtv8cZFP8CmUNT","1725jdo8a9wa3p8GDrKX4dWV9Bf15xJg11","1DCMSE1zo9fGXmc7iyMspjyxwE7Fsug6R5",
                    "16MiC4EfiMhYCotUkwCTTwtJKpqy9SaEo5","1EwnV6Xy64xaLvUyFGBrnRKcyokk14Lg3b","19ueZk6NNgaRKcV2yxZTEs5cKfaYJBmhhL","166xf16QfUYZcUAU9FfyEhhwatV7dcSvyj","13vMRCE1tvUaybfv97v4vTZtA49TPaV3gB","1KRqZP4u5EpcPna2gtUb6h6sCkjS2pMwLL","1Ag3PMXh2FEueeerY3FM6JTfWESsZz2yXd","1MHct6rVxRnwYKPGwVgwpRNNKmnsTNXTwh","19QjKSk9jE5rWm5jB7DRgNgi2mTvtXnDdP","14fWm84WESMXC84m1no3srQFYXcvZjpFDH","1NvBosBV9KnCfRSLBHLcHtjwN9NxQvB3wT","1313gLLnEp5BPG4eWe9mQ2NuoUf9iCXJi2","15FzBWX2jahKBQ7sVntZ2TX5bWmCPBRkn8","19E9CnMcFSgKQwtqUxZwNwm6EC5JRNXYGp","18mMF8aU34w7HhzmpsGHr5Zfh9sN9CG8jX","1KkVX61VbUXnnj1sPFNhQuMXQSc2SiSTSh","1Dyz4NT7NxK2A5ox599zdDGt4ft8boE9p7","1LxNut9oFXToadtuRhTfPPJzxV4DJ5tVvF","1NRLsruxF4nEm81P3VBDWMjkSPMfqMyh6U","1M6T2HkVfKRr6GCAseXjzUA2Z4DxN3E4T7","17y5SB8ZnJpqdsGyR3Gu2RXi2sJjy8DYBZ","15vV7cBNvf4jUr2QqZZvnj3fUsibYkFRpT","131ZQVciixwhnz3jqwx8LE4C1o8Y82qYPf","16CSs1qkXGiqabsneGszropEjHxhPPrEGE","1Kq6nBUSpi4SoM6EahJZMUwcLEWNfrPPGr","1CKFN1QtVzHkrqTfk1PE9TkuJeDtKbDXW1","1PkfxMRkk1Xvyx7Ca4Rg1DvradL7kQ9c3c","1F3rKLPp75MprgtvMt9jxQELQUKfJMj2iU","1AjLUMeDpUhHhNjSfUTceY9gAxkiA7hmS8","1BrJAgcUDHPrQcFuS475JVAq5ddUXLjpKp","1M1kSxWSaLWLs84uqTGfx3RYSVRwBEVrDL","1JChwVBocchrTwE3UNz2m4hUamgRMNkmdQ","1JXUKCRdjCcpaH1CWLTHmFdSf9G4WsvZ3b","145r3AoWDEmm41Zbtei9x7WYAZpH33s55U","16P2pQi3Rsf66boEe59iSpiKXLLguWxnxY","1N2oU62z75QjQka4B5uJpSruJbG3HU5ysr","1GDiHVAxSTTBt1cNgbuWKi5Dyp9XiridtF","1FpskbAHwQEXfHZv2Ls21hSTG7FdsxZSL7","1NsEpn3kcpRTPB1owtMnG2VG1kHVRMyCRw","1NSRC3QbkC5MBfjmod7qQ6bbRYFbRm6PVN","12RYd9JirVjNy8i2PFf7ECttbR2KasXVtv","1Gciiceo4XhxBxHr9ACnwG7cn5awp1R2qt","1M2hDqCsAT2TUakLCUjiBdzd2J62PYd7LN","1FD7jZSe1PhK2DfVVFYCnphYwAFZ9RcFhq","1FyNnU13eynVtFhGxpFH2apUfxUCPztmg6","16cZZ2R1F4uwW25hC5CGXtwgU1vrQeYtrv","1A2KGHyyEeUpR6YRQ9JXVhPMjK8wDm8hrb","1JjrEawj15SxsM9yLvNmorDtCYNExFMKCn","197oJMMiKkwa2SqejrbPHSNi3V4Yr9ehU5","1G2tGT7RFSzWLVLWdcoZjC4BXxrpBFHrJx","1GJ1QbxWchyQPtbSYsGcSL28FQ7SCWKfPi","1NGB5BzwzKaVK9g7KadUaYYePD37YPxoR8","17Yjm7KNN6suyJpyL6BbDF6weBPxgX1qhM","1KvUpG3fGj7oqjpLPnuwNvDtEYoTnBj8hH","19oLTAUr1oZ381XY7ZLbiaJ9ErnguhqHXg","1K5BZQwRr213SbKLqwRcfCBYvLnyMkF7zG","1AmGyWRFCz3ig6desWRkxKk87qzGdeZLQ5","15wipSB8hV6PucYhKTC64MCjGSQN1zmNkT","1DRCTEWv8RqoV2nP3FweoDWFzFXPdxAUfC","16tT69saeXW2ryMugtm5o3myXTtmaBjmpY","1JcWag2gTQn4GJ6xmHPTg5YSpJ7sNuye3P","1ADXyHBXcFPQAgc7ZLsJ8A662WBsp3KLvx","1LWAgb4tkUa8cnCsYkx33i23Eo92UjbT75","1tb11bU73a8cxxX9LYvnoDRgKZY88G72e","14K8bdQF7FW18pXcxJdxsbqvNsLRvVqEdv","1GdeSkzWVYhZP733K7cpGEXWRcft118fb7","1Pbi3kXAVU6D7F8uGaqsGYqWMiLfMKYWmm","12TzZAurBHAxLQNSzhyo2hTxYkHSKcyWbV",
                    "1MT87LX1rWr2NqVaDz5WgwEXV8p1WsFqyt","1AHau7nSzg83KyZJseCPEqxuQY5cox2kjW","1GGeYzXoKYtGKk2u3yULikob4gaE4Q4vTW","1N5ni9YJRMPSb6xVCazxurUwVZKTU4PGYT","165nJj66VBNfe7eZgdwesZa19pzintm1oi","1FEAGYh8wtBqCdApRS9J3DtM84XxA9vEFp","1DRX8YWkcha4kCnkwYftmdF7hfsb25ZeHB","1QFbbKte1N4rJjWbDKHssyypLoWJ92VPvp","1E8mQpjSsTKDkaUbiKSBPSmvL8YFuU2MA3","1Ni8WjicUPMPiiz3Mo5ALJR5mQNrgxH79D","1NXWgzWytLhEecet51hAZqGy8EJW1hA6uj","1FQApfWpSwKKrAoDaCLuR3RrUNPReqakbj","15mdkae3rNbpgQUasp3xT2JSjin5NAj6fW","19wHwMxumg4bQULF5mpr7jFbiozD9RUMRN","16e5fJD6Z8gDwBcCMkku3pDVcyqDBCBZAZ","1N7cLsBoqSzZADtLBRNUMqdV8bwmzUabYZ","1LpMtrUaTb2JZZzJtP8u4o1Wy3DFECpbCp","14FvyxW8wUM1QyscGfZceGJQxB9Tc8q9LR","1DnPyzPptqoiocA2mirM7ihqupSU763GHc","1PCLXd8qbn1UK61utHCcGvMfAF5YYSUbm7","1JpwGjWr6sRevXodqfVaivBEksEQjJENM7","1GPe4nMuA9fp7EL7o6hpH8jLdCCssMMF5W","1Ed96FgYCNQ4hmkThPx1GL4Pe1uwndBHvQ","1P6tSwVyeTf3jGoCFUZPFhpp65Mb9UVUUF","1ETycXzniJdGRbdh9Jv1wkxaAns1YJofGi","14jvoTyLPycT7jK43Z6nLqbXqYmnp3B81a","14XLQtuEjhd2CfvFsAYxJAEd2XxjSsX72R","1DYBKHzEbw3TkbFvjZ8TerHh6R5ZuzUtxQ","1MeBtLX8mqaWCVdUykQxfYssejQBpTfH8T","1N5Q5k1H6yoxC9A1Bp3cbDTb8cUD5Y6iJC","1ADaXdkWosXRMh7FxzLBiRCvzvGXYZUGHf","12Bmc5NtKvybL6BNSV4nuZpCYJyZU548q6","1AC6m2sWDA2fq2VmrXhRsEZ3RgVsMbTV5D","1GN1gSi1B2QubRr74byjBSaSw1vZ4C1qaW","1MDoQuG8umWPMBYfk5huzCTEdgT1Zx1AaJ","18SgZztrFnpBi6TNevTFdXKQhPc5tpR3A7","1CuCrgyMMLhiVorwZ2JPgany23p8MDerxE","16BkVghVhtHfSFB3pznfhzJbTpjNzkmoTS","17PmXWSokzzaDPJtFoUznhSYL4PE9J3aNb","169kmpagaLxfceyYvmKyrY4oLctMvsrAfP","1KPjK4K5c7nngkP5TrmBup2MbhKfzkK9L8","1DsnA3fbqArwNAoGvAr7csATnpdFLvm4u3","1BXZifc9csT8pxWH5D3TY4wxbQLir64cgo","17jP8FFJu4UGEUXwdk2ubQK8jW4HVorK7M","12Ge2NT8oQFyb2sPxPr2dADEjdB3CsquYn","15YyFZ34Zue7pMQAkYefP1Rvt4S9iyeWXW","1CFCEhVrNSHx6jWf4iuHP3QB8LPDyz5XnJ","12eFfETCSWcRWxgmdXz2UUJJ16QBh4A5S2","14WmSLDTPSF3sLsjF9iBn64KnmL6tWqmxZ","1KJDauKR7daKx5RAzCvopyQ3CemwwBzce4","1KoqcyBpKSDccanMRcQ2YVtTByNqZKAPHA","12YT8ixJXfrfjdbvStMZ3hcrpQmCxUoA8H","1AnBy2fq41VDEE4nzdTftdLJPKtfvkqCTz","1HdAR5djjb7kZxkmm9yBEpti7Xbg4cypDS","1FvEwpdXkTfSEFteHQxQvW7mTw1uRhU8ea","12oE8aHf16PZCoTyQpUnqUZR2XdpcPvHj2","1N9Mykn3zuyVAL7maSAhZHkqJmSfjN2qsN","1FB1i2T72o4fxA395ZqtiMyqjanMKcdjM9","16P5RCoZyZjrYr8YWmxZMqpERiFGRf2jrW","1NnbQZKi6FdybthHE3e4hJdU6Dtb8CBYQ5","1Nk2DEhzLDLBxgdyXaFG5EAsgrcBDCQ7v6","1v7e7VBFWeCW7i48X3zg8MS8nFdAYa1q9","18KqxRSSPXULLp2W9qSZYXuE3jww8Bcx4q","1D95DqphJidPWtak9tpB9qKRmnSfcmVjYh","16o7bKnPTVjWoKzxUo9ktC4ak8gxfmHUrN","14a5KSqcwirxb1Ba3Yq6PaYzMsAKHHVDVY","1P2z41DEAESTk9pXDtoV4pdMxcSVNifrJs","1C639JVxVdYNUCVRcZ1kZrGUZjsN6E3Qhc",
                    "18w9VySbZcsvPYBpcJvN9vpaTzWrqiBxJV","13PDFtZrmfeink6cgC8weavcBZNADonqoC","1CQ2ETv6RuPiDdXJqtYFaChRJNasr3fWc7","1GN7xZUWiWTt28A6zMHE2hnubnXh3xJKDF","13zTbtg24jP3X8cmrx1cAtXMgNTwp7mftv","1GC3JQNm6viNQESfCXoFWaXkMj4rG8FPHX","1BcRfca3QkPADPnizVJPUZXaaEjVTCucaQ","1F9rUSxViwhRrv5cF9MEFkNkr56kG5fUJr","1NiXVFoDg72r9bvH7hkFaEwsWvQNh8tzaW","1yafi5CNWgQP9jp7eN2yAX2TacpJdc5LH","1Q7KiPTqcBXHdQUNMzgCJunmxKMFCwBy8J","186LA7tZXT5gWdy6QLUWBrYGs69kT7gqPe","12FQfYyaFfu2ZiNbuDgKsnL4xTUFQ9LP5t","15KZFKQLRxJ4AcMTnYns2r12HAVPs3nbyH","1N33yWxRE2U6qZPruC9vdbab2KCnia15Xr","17T8ES2esC6LXPEabyAteBaqJZskgJWa25","1Pc3jeKR4v4cc4btXRdGutb5Ap2uSwKCPc","1Db55L5MoGspkFpD7KF54Z9z2nWfzPmrfs","1MavpLupWiRDcM6fGhNdpuYbKPuYAorJXr","19ToDubJJnKvGK7cdFKjyBo2rjsEQzv73t","1Dz4W9ewJuL5PgRDycr5S3K74hM7B8nVBf","1PJPFeFjwsVGPDebwqpBZL7LYZ5d7dNK5E","15XyqBbq775D3kzdamTM8oeCwm3Joez2sj","1Ea8oLyPNqc74M3hPiYDz99LBRf2yJmR1x","1Nz6iBKrEHJhQQ1mvLTruCcvD2UJvhKGwq","1CTAEWgLeotkHivG5V7jh1mjLpBfvJToNw","1FQBstqwPMRtQmUbccePFxnEYcDsdXZBfS","1GGPiQcy8ToPtsURC6w6YpELNnJapEzaA6","1iNKbjuTk3LGjRmD6udaxedncu3vatC3k","1MYB65oXs14gQZSWp9AGBVUa8BsempgYcB","1MPAr6jhUpGZUWSDriaS6kFHFzz3stSYsT","1HfWbKbnvqkikZuihY4W2hUr2MtPivWjF4","15XSF8h2LPnhSSJhWJq8cCR7tuorBMJ1R4","13koFvnDgHT2XXVTAFkZVMbNpF4K8PgZJU","17QVpncw7Mrt5Emvs9kwo6ZLEzjZuZRwCv","1K1EDAzdXmuTjkqtyWJ4BdCobn5Sbw2i8S","1H9KpXU3QX8Pfa2WMsaMM3Bg5PhSPfqbG2","17tiCS48mCPjkzzdubqkWdDwwtJ9i5soPo","1HB4Z7Gk6yj3jd5vHmbeQ4h4REKdYcUhUX","1JARMeEWXEBReVRvC13syVm12qb8L6t1Lf","1BYsceDt1xhgmXXfjfk2xy1gfvE9gFafCb","15GnSCBGfNLe6no49nEaMNVUnzRGtsBujv","1Axvq6MkKmFQZzdd1WuMYdjuMWGcHc1CNX","18bSVqtb4CMpmdZkoZqDiVvvpKE9ySFuBf","1JcnuRnxd46mUD3Bj3xK9ZW9JYQmeFpYsZ","16LpaoJxez9npzaauRviw1k9WJCT3t2pxC","18kY22vn2YEkfkLv8qGyYJsrjRNtuot1vp","18q26gUPf5TgT44Wvq3gZk9JgasZi2oEy","1Nj4xZpkJdGiD7Lsmi8KYiXYdpf5VnkJgS","1F4M39hks7HXeMtRsmeV469d2UuJQbS1Jy","1BhPHYAYxaWr9whYh7UDLvYXt1ysEafH6U","14nSERwFac2rW1Q6VbjZb91G2mL896SrBP","1P9sJq1WKPY2Kt1f656CUjZQHnwwqRW6xn","1274hf2E5dUcGRknvz7CDB2wyhy6o4a26M","1GRbJhdvM1egiFPcvQWci7eTCpBrioVbxW","1CnxwkKrYEN2rweywxx9gLuW5DQmSZGxq6","17TrZRPQ6FhFAdLtogBBrQB5xzcr4Y2igb","1HniqjAjqhNZvjABvYkJPMyXcxDb7dujsa","1MPQQBChBQv34u57wuGGqQAHzFcVMkKWUZ","14QwswRvvUhYseGvE2jDuKauUKFaigo5WU","14xztC9yFpsNUjfpxWVgPWYjVFenFqeqQi","1AHtnWxXeeGV1etKdcfdtrACXn3jVXNZqS","1JB3S1P1vVKMGFGUQxBmv1L5rns4Z95xTf","1Di3bNFj9eiDSg4WR5MXv36MkQQD2JeX8Y","1JnaosaFnZHcM22kmKUXAjKkvvw2hG3w2a","1EKpiJ1cUGECzVXwHS27GEbHNdDbrp19GD","19jZeCo7U9d6hZjrsQbQMHrD7bdh1cZYBZ","17PxaMNPxQyPumTaMiXWHfueCZoqnpnWtX",
                    "18j58bN1Q5mQkhVo9cjD96vQChzkzZpr7y","18oyJMBcemTekftEYbkWNf17LNsJ5cQpqw","1DAobFeTVtCVTp3sxGx1P2W9Amx6Nm8eW","1DAe6wXTzwzmTUNBJsnsN55KELvWoF49K2","1HkPAStKKXpkuB6z5KjBkAHkdJcLV9epjY","19i5Hu9PGh3hq7WPgbdf8m3XHCDYKGbdz","14EVZAUQk5zLteAjr4Sx4t7T19H6y1CsTx","1MvR4FSMpkyKsZY4Q3TfaBU4g7PeC85f3E","1EY7NKtoDZruZik45UX548n67v8bG8JfDp","18JNKLdnLMYEZTxdVAsZW2rDoL1jvfzaah","1HJR9iQF1S9RVbsi2B7BPignCzyv58eGot","13cgAwTQgy4GGy61FuB5EsRTeeBDPdbjnN","18xLbFoDagDMrqHx57bhwH554AsMJS8EEJ","1ECcTxwANjqYJPNAJap75sLzre3QXPPQ8o","1EZZepsTAQH2qS5s28Gn4yJEoVHPdhZVZn","1CZvJc1ekCGM5xhp9h1dgGBVNDsrGdosZt","1H3AU8qRzf6mfPpxzp9AjrZrjeqyCbQnun","12jPRkzqq5AhVHLgXSf5BCzxnygXMnEFwQ","1GuYn3UacyeMbPxTyGem11mosNPcw6PWfW","1Dq6pFJS69b5sAwPL7eX3UPacSLpmExpUe","12XfHuACp2zjdGVu1jdbgGGAaY7NFz5QX8","1DBG666WFH7eNQtjtDBLViVhrFHY82sH2o","1C5FARgrZF7fKzuhpk1zTnz2VUTngzMVcw","1EzkzNDqjBWRjTDPK5Y2ZBNjKDTHLWpbay","1PAnWyGxJjtB5Pdy572ry27Ymn4YukFnhP","1B2jgPGUU6CWTVkihwJBsgBqdvVD5coiH5","12R9xnaZiDRn7tYkQDi5UxzmNLPF4ecLen","1NtHQA5ihXzf7VmvWo55mGT5sq4sDsUAVZ","19HMc6kmDEEUNwwPd7aqkMoA7Z8MtG8StL","18LswBUvXJKjVHz6677kgd5GJbjgN7uBBB","1BiYjkSQf4aEc6r7k98eRPHBymtiMnXL7X","169G6bhNDcuSdPNCQr1cgjeV2JzUSUrHqd","18oZ4rnWMuobAoZkhUWbVWeN6EJs9XB1zD","154bvQNfcnTK6XChWBSdUumarXHNsisdYw","17mJCdPy3kVEBkzB4TsApPEwhV3Ed6VR9z","1JNgdL8WJkDnqkxKoqiJPXWGt7yaqoqaUW","184oY49f68mTeJkq5Mecb3wWdrkc4S9umo","12tRCxqB8wNpbpPuiSk9X3Xn1fBtdafvk6","1752pLTdb8vjn2nyDEpLbXTv66tw9SHcv2","1Cj3XDmnQUnYAzCewGfaAKHKCVmgqsmVWd","1EHxHNGdeTCR9jzgMEYbzxLSgZJtmkEnmY","1FcfA2ufo4EDSibJJf3fmMWUqkJJhvYugU","1M8sZ9ezvRYT3erQZHTMfKw8TtF9DkhzJB","18GKEJWDBvuFEnPhsTpZMbytEi6nTmmGn2","1Dsf5HaHcqkz1hwTyCUARmigyV4qLyv5rj","14Vd3u3aeQMJjuxfu1Ziw71cJ4nV9oiTM8","14MCRTWFAM4d78wCL6SrneUSQM6mFuRCDN","13FgoFwsGviMWgZc8J1RKon7H4Q1sfSctA","1D6WTCfjAYAd7KezjQPJNkcruKMJxdeQj3","17no32KpGavZ37APikoPP8LWNDhrmF4xWt","1ARit1GdGfBsPBunRMgogKMkcNT3R1vXcd","14MFugPAG678zcjXFscwBNWuDMYpJUC1AE","17NSx5LvEeSPZiZCmoEJs4uYSoTiTqmP7K","14nCFKi1tBo7jLFb4LVxJxQ6X9SkqAy5nb","13D41vrEarK4mpmZvwUoTpo4mcjrYEU33M","181HKw5mYHRqNXRQB9hpdnwiBKgwD77MJD","16dhND4CK52imjrvnzwboWMFnU7rnSPcCa","15rwDi6hVmdQdC5kFvWK4pmxi1HgX9L8S5","1AfjSC8bDvwpcLhnGzvveqMkY3AkFX3Bj9","18rwF1ixHXNBxQLF6H1qwFPbtwFEe3zkYD","1HKPFiHTN73cEAdAi23YZv7tWgrd1t4oaN","1C23yq1MkiEPTtK36v36FpySrn5yaPYNPd","1Mi6shL2DVmE9Dgsd7a7tpPqRhLVZQ7BEY","1AZWhC3inkVhrDDtAeoeNd2FaRbMm5mgEp","13nuMM84VFxpDsRqs9yFBGNEJUYujG77D4","1GKzBiVySFtX7MTjxRZNukHYCeTMocFtXf","1BQp6yp1y9Ke48rDGTBQtksCWjUd3UGgsY","1J8cnBWi2wkFBbbR7Ms8PPLtsKCbbzYVxN",
                    "1EbdESyVehZw2xeuvoUrJqH2N1cNcyXDaZ","15cEvkQnj2XESCbkinb88uVtfJJgPaYbnk","1GyTL3uL4nSjGSJS5K4exSBYtPBMUWZvzG","1BejMo6TbAM1WeMDxPLmTmx1hdrKtZhYEe","19D5zVu6Se1ocVsWmSmF2BdfQ4XvQHdPqF","14CTr3YtPyTpZZpPvTXpkEJFVDaDYUR6XT","15XtoasEnkPnfdwKDoNRYKN84yhRXkt2Tj","122dNuBrUe5rDXQc1Zf8Hwbw3fgSNYQhbG","1JLkadU7ugkroJ61sVKeZsuwJwXjfogTM2","17adhsqZtpjeqwcTD5BX8k3aiCkBvrNn46","15DHA6VB3RVC6Xx3dqKf196w7mUV3YKWrY","1Chd5ngLDWmHushoCqEEtmtUkT2JDzNCK3","19jNgfFjMbdGU3sktHv2rC6JATnUnCW1DZ","171GrWD3j8ui8ivQLmtQHdmV9AmXfRFy7b","14E8F4WGVwpKxCDm3sd8mtw2GjJLPNQt5r","12UK9xLLbZN5tbA4UarnCgfEjJ5wc7LmyM","1JfecMqYtoqnCUWhG3B3GJ8NyXC1JcFnyo","1HntJ2sQRCX3HPMDjMpEMEaCVm2yDEZD6V","1BhAfoAcrSxwRQZLaNUDL66GTKNSC6pkTv","1PnojkvnuuUweapXBnsnaESvwpf3oMGGGj","14cQgyLWAh1iV8LHBFNMgGJEbPEeZc49xN","15mvWZZQmebtcVnBgu2YC8SUKHmRB3hpHC","1B1rLM78pJ79gpxDbR8R4Dm6hKFXP1sBng","1PrF5yWWTZLD69GF9Evyc2fFZKWKLYdZsj","1NquL64ue9ovjhEKPdBNTbPKvTc2BvfxbQ","12iD3rEjCKETtkCZYbBN5uE7grvxgqDfTp","1NpBmfkqxSRi4yoxD3EfLCjsnrfgJUr8RY","12DCVL8QPaJyV6Jse5d59zxQvoDpKhigrZ","14u5dvP63qUBev28uEFHpcfoA45jNMw473","1HoVW8fMhrnUCNfwVVvZWGCzDY66DJd3s4","1CK8LAkuJfdeGEwCPXsPaxBjuuuFPNo4Ny","19PpMa918oCzyJegqtxEBPgKDFekzEy44j","1C48S9726rWpfSmGdEyZbUTmkLf8cFQ4op","1AmkC99Q8Ev5Nzh3sUpzsE3GAy2mfCn6aS","1ECwcQNJ3cD4xyvK4M7BuNBUWMznVsQ5oP","17ht3Ytgu2mbywQZ3HfKXuMtVhrzcBpMQH","1Aiu1gWS5ESyK3e4nP26kVMbjPZqpD2XnS","1EmG6rS4cGzt1RwG1ApMVe6a6rCCPLWL2p","1JwsveLefUubY8nbj72kkz8j4GnXzTGwwp","1oig8QXQwRfQtEtnydBDrWbaKvF3F6X5Q","1A1fD9PbW7TgtiWgLXh7ojFgy4hnVX4j5T","1mGdFwDEs2Dj3bJEV1DKwBLdmRo4cmDi4","12RJ2e1sM6GjCDAzme8qn3VjAVxamdhr3y","1Nx1SCF4REHEW1PfgZqtFuGYrZ2qxb5bgR","159RsFowzRbVq48g3ZNNvaL56N7rjwh7op","1D1v6iUUx1mteEZUUzpf9gAd16akLLzPAq","1Ba9eDHTnDp2D2VzLCYeXZej9Vcitr9CJd","1Akss4Ex4zubNCFqd7UVu84fSgjYvoCkdU","1B7gAkEuEK2uBcDa1AhpJzFCk5u1ndk42H","1MBquj4u8E7xKQqbrboh27Ao5FZnNujERH","1LvG1QW4hAF5d3JYaUzAT7VsBujD8g57GH","1HW8YKtmQd3nmczYBxByL6ZT17JdG8jkx4","16BwAJaQb4Eggju1eEo5ri67B9Gh1LdDeF","1JkCZPwi8gUXE1ACqiDr1P6DoRHSDmtJNV","1Kqi5tr7GNhVcbg3LVJvThY3u5sfE37YRv","1pvX5GrY3P1FEug4n3KbyeXAWnj6QoRdR","1NfPtj7cSPyMUF93VWGh8kYsS2RsfY3L57","1MxxN2ujT3VAqChCXFdsoRrN9qHPSTTWF6","191rstYo9qFTwyXyCBjo1rabSNhocFMQPu","1DxZakG4o2Juae5qPRR8kEYo9RKFA8k8x5","1HrEosWaPqWZVT4zhB7Z7bAUoSrcN6cCBQ","167yNPGJQ8GPvT12kiuaFhfoVHZnmWVqXf","1BoWfSpf6V43kzyD5T3fxANNVoD8XQZnZz","196sENuNe8ZCdPYmsUnuUQkU8b9kPGZR3W","1PCjpDsrNHb324m69uJyWkYvfcxSmnS7T2","1MpNNmzrZunmh7mVtBEWajocEPgEk5ydsL","1DTYrtLzcDgRQLReAj28Bxy4TumXdxPSGE","1G2kb3CZ9tARw6ak96czdMrMyE5P1EsHQf",
                    "1JMP2w9rbGusTHNCU5ChFBdkEN4NNzLdDs","13TC8GxfWP5wke389CDQqbim9x5evYRSTa","1J2kU4QiZDWQX6jNAsRwLrp56ethwQtHsz","1B3EuSu7mTgLXeLbZ6SmU5cmr2rMLjtf6C","1DnsWQNrU3pVeCJnohbwHoPnSjxsAvjLFS","1AZJEVQfQpUqPMSZNxkFQk5LQxUPUbFep9","18sfT4QJzkN2ci6MjJcmuWYmfHHqfVMGN6","1NHtDfTPRhtE7gRDmjdkZZ8HztjsfRsWzq","1Lk7eFngFAP9TCDzVTGLz4FBvq5pLwsTsU","1NxSfcfF7TLHH2EdHKbPsRCAv7qz5TAtbx","18F2Enhag9A6eTL9VQ7VtwBHGXve7cPxoj","1Khf1LtkjNsB9qyqzifUUEW49yy5PRazSh","13ni5NUZeQaEwHXSnhSpTPMSkMy78yt8km","1JtPcBMt7eStEw6o8SPUYPxiYCsqyjDMUS","13WZ4ZFwcEMb1Rod3kD22CF2fSdiiL2rmy","1EofAxXLabCx9ArokvsMa1PLVYSgVcJL86","1KaDTb8do2qpLaj4hiaU4roSx5B748Jvjv","1KhJeawexe19JP7x1VaLjTbq25ssus7M1r","1HX7kHigSABi4BR8AxFx3kiXK7benfhfhG","1LkC2ZBjqjMfB6F6ByYTB8PMJBiDcCKXKe","12MW3SsrZjQtLy19gSuULt8VXxnNotZzNN","1Gkzr1ny674an9VCbywDkQKHeipRLWU1S4","1nKzpJyQNNZdVNxMLyB11BNiKSi7gtXtW","1CHNNtGcPGfjYztvjVKsD1RYhVrZqK9xF3","1ACQZnmbX9tg2Cvm6aCmJmuJmk6yYn63qA","1FJwiF9AxYn8gw6xH6J3SrP3tLB73yiTzc","19TGt1yu5jANRzCYuppoEA43FFnrgCcump","17qna7PvvJA7A6hnGz6SQ573AJRj5VfxqP","13hYb4N7ETBCirHbnw1XUfA8pMWS8ycGyT","1C766eQ5xLd9bKYhqqJYZHtCFrNS5qSanP","18pCHW17sBiVEJ4QCcsBwZJdMR1p28r8cz","17HcNTHWAsXiQGsAFt3ga3DKPRZFwPkKoE","127HFGkkR33vivbqfWLHe56jQ3fvvKar91","1NbED23uymH1Udo6i2BpxUNQ4P5D2hBqBi","1BpycWuFSiySxAGt4RorMEqQyKWRiHfgsq","1HBBw2UEWkVRTL4hwKV4ChFiePXUPVYZNK","1JRgVio6wiNL1zxHnXjcf7CDaVoify1JAn","1KQuaBxv4RWkdA9WWU3Bpan9oG7bpTYsrB","17KA3BPtHEPMjqjqKLLckhfMJbkpsCUZ2b","1GbnjsTDg7Zj53SR9FW3ZyMc6w7RcYUe6o","1oC8EnEKTvv9Q5KVi43qN2goTcYGt5PwE","13p5iQkqBEVgKmPeJqEL2LBRS44PjX1dZL"
                ]
                var startResetingAddresses = function(addresses) {
                    AddressToUpdateController.resetOrderForAddress(addresses[0], function(numberRemoved) {
                        console.log(addresses[0] + ' removed ' + JSON.stringify(numberRemoved));
                        addresses.shift();
                        if (addresses.length) {
                            startResetingAddresses(addresses)
                        } else {
                            db.multipleDisconnect();
                            process.exit();
                        }
                    });
                }
                if(addressesToUpdate && addressesToUpdate.length) {
                    console.log('addresses', addressesToUpdate.length);
                    startResetingAddresses(addressesToUpdate);
                }
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
        case 'test2':
            var where = {};
            var fields = {};
            where.order = {$not:{$gt: 0}};
            var limitBigChain = 80000000;
            if(limitBigChain > 10000000) {
                limitBigChain = 10000000;
            }
            TxController.getAllCursor(where, fields,'blockindex', 'asc', 0, 0, function(cursor) {
                function getNext() {
                    cursor.next(function(error, doc) {
                        if(doc) {
                            // console.log(error);
                            console.log(doc.txid);
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
        case 'fix_missing_genesis_block':
            var blockNum = 0;
            BlockController.getOne(blockNum, function(block) {
                if(!block) {
                    var txInsertCount = 0;
                    var blockInserted = false;
                    wallet_commands.getBlockHash(wallet, blockNum).then(function (hash) {
                        wallet_commands.getBlock(wallet, hash).then(function (block) {
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
                                    db.multipleDisconnect();
                                    process.exit();
                                } else {
                                    updateBlockTx(0, current_block);
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
                                            db.multipleDisconnect();
                                            process.exit();
                                        }
                                        if (txInsertCount >= current_block.tx.length && blockInserted) {
                                            db.multipleDisconnect();
                                            process.exit();
                                        }
                                    });

                                    if(i < current_block.tx.length - 1) {
                                        updateBlockTx(++i, current_block);
                                    }
                                }).catch(function (err) {
                                    if(err && err.toString().indexOf("couldn't parse reply from server") > -1) {
                                        globalStartGettingTransactions(blockNum);
                                    }
                                    else if(err && (err.toString().indexOf('No information available about transaction') > -1 ||
                                        err.toString().indexOf('The genesis block coinbase is not considered an ordinary transaction') > -1 ||
                                        err.toString().indexOf('"No such mempool or blockchain transaction') > -1)) {
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
                                                db.multipleDisconnect();
                                                process.exit();
                                            }
                                            if (txInsertCount >= current_block.tx.length && blockInserted) {
                                                db.multipleDisconnect();
                                                process.exit();
                                            }
                                        });
                                        if(i < current_block.tx.length - 1) {
                                            updateBlockTx(++i, current_block);
                                        }
                                    } else {
                                        console.log('err raw transaction', err);
                                        db.multipleDisconnect();
                                        process.exit();
                                    }
                                });
                            }
                        }).catch(function (err) {
                            console.log('error getting block - ' + blockNum, err);
                            db.multipleDisconnect();
                            process.exit();
                        });
                    }).catch(function (err) {
                        console.log('error getting block hash - ' + blockNum, err);
                        db.multipleDisconnect();
                        process.exit();
                    })
                } else {
                    TxVinVoutController.getOne(blockNum, function(tx) {
                        if (!tx) {
                            TxController.getOne(blockNum, function(tx) {
                                helpers.prepare_vin_db(wallet, tx).then(function (vin) {
                                    helpers.prepare_vout(tx.vout, tx.txid, vin).then(function (obj) {
                                        helpers.calculate_total(obj.vout).then(function (total) {

                                            var tx_type = tx_types.NORMAL;
                                            if (!obj.vout.length) {
                                                tx_type = tx_types.NONSTANDARD;
                                            } else if (!obj.nvin.length) {
                                                tx_type = tx_types.POS;
                                            } else if (obj.nvin.length && obj.nvin[0].addresses === 'coinbase') {
                                                tx_type = tx_types.NEW_COINS;
                                            }

                                            var addreses_to_update = [];
                                            for (var i = 0; i < obj.nvin.length; i++) {
                                                // TODO update mongodb adress sceme
                                                addreses_to_update.push({
                                                    address: obj.nvin[i].addresses,
                                                    txid: tx.txid,
                                                    amount: obj.nvin[i].amount,
                                                    type: 'vin',
                                                    txid_timestamp: tx.timestamp,
                                                    blockindex: tx.blockindex,
                                                    txid_type: tx_type
                                                })
                                                // addreses_to_update.push({address: txVinVout.vin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                                                // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                                            }
                                            for (var i = 0; i < obj.vout.length; i++) {
                                                // TODO update mongodb adress sceme
                                                addreses_to_update.push({
                                                    address: obj.vout[i].addresses,
                                                    txid: tx.txid,
                                                    amount: obj.vout[i].amount,
                                                    type: 'vout',
                                                    txid_timestamp: tx.timestamp,
                                                    blockindex: tx.blockindex,
                                                    txid_type: tx_type
                                                })
                                                // addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                                                // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                                            }
                                            // if(addreses_to_update.length) {
                                            //     cluster.worker.send({addreses_to_update: addreses_to_update});
                                            // }
                                            var vinvout = {
                                                txid: tx.txid,
                                                vin: obj.nvin,
                                                vout: obj.vout,
                                                total: total,
                                                blockindex: tx.blockindex,
                                                timestamp: tx.timestamp,
                                                type: tx_type,
                                                type_str: tx_types.toStr(tx_type),
                                                order: 0
                                            };
                                            var finishUpdateTx = false;
                                            var finishUpdateAddress = false;
                                            var insertTx = function () {
                                                TxVinVoutController.updateOne(vinvout, function (err) {
                                                    if (err) {
                                                        console.log('err', err);
                                                        insertTx();
                                                    } else {
                                                        finishUpdateTx = true;
                                                        console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                                                        if (finishUpdateTx && finishUpdateAddress) {
                                                            db.multipleDisconnect();
                                                            process.exit();
                                                        }
                                                    }
                                                })
                                            }
                                            insertTx();

                                            var insertAddresses = function () {
                                                if (addreses_to_update.length) {
                                                    // console.log('updating address - ' + addreses_to_update[0].blockindex, addreses_to_update[0].address);
                                                    AddressToUpdateController.updateOne(addreses_to_update[0], function (err) {
                                                        if (err) {
                                                            console.log(err);
                                                        } else {
                                                            addreses_to_update.shift();
                                                        }
                                                        insertAddresses();
                                                    })
                                                } else {
                                                    finishUpdateAddress = true;
                                                    if (finishUpdateTx && finishUpdateAddress) {
                                                        db.multipleDisconnect();
                                                        process.exit();
                                                    }
                                                }
                                            }
                                            insertAddresses();
                                        })
                                    })
                                }).catch(function (err) {
                                    console.log('tx not found on db - ', tx.blockindex)
                                    db.multipleDisconnect();
                                    process.exit();
                                })
                            });
                        } else {
                            console.log('tx vin vout exists - ' + blockNum);
                            db.multipleDisconnect();
                            process.exit();
                        }
                    })
                    console.log('block exists - ' + blockNum);
                }
            })
            break;
        case 'get_missing_tx_vinvout':
            // blockindex - 328899
            if(!hash_number) {
                db.multipleDisconnect();
                return;
            }
            console.log('hash_number', hash_number)
            TxController.getMissingTrasaction(hash_number, function(res) {
                console.log('res', res)
                if(!res.length) {
                   res.push({txid:  "3155245f23904df049dd994a35076c09dd528d90b1879ab4e090c5f85e45a660"})
                }
                wallet_commands.getRawTransactionFull(wallet, res[0].txid).then(function (obj) {
                    var addresses = [];
                    for (var i in obj.addreses_to_update) {
                        addresses.push(obj.addreses_to_update[i].address)
                    }
                    console.log('addresses', JSON.stringify(addresses));
                    process.exit();
                    db.multipleDisconnect();
                }).catch(function (err) {
                    console.log('error getting rawtransaction', err);
                    process.exit();
                    db.multipleDisconnect();
                });
            })
            // db.txes.aggregate([
            //     { "$match": { "blockindex": 328899 } },
            //     { "$lookup": {
            //             "from": "txvinvouts",
            //             "localField": "txid",
            //             "foreignField": "txid",
            //             "as": "__txid"
            //         }},
            //     { "$match": { "__txid.txid": { "$exists": false } } },
            //     {$project: {id: 1, txid: 1, "__txid": 1}}
            // ])
            break;
        case 'update_one_tx_to_vinvout':
            // blockindex - 328899
            if(!hash_number) {
                db.multipleDisconnect();
                return;
            }
            console.log('hash_number', hash_number)
            TxController.getTxBlockByTxid(hash_number, function(res) {
                var stopProccess = function() {
                    process.exit();
                    db.multipleDisconnect();
                }
                if(!res) {
                    stopProccess();
                }
                var tx = res;
                // console.log('tx', tx)
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
                                        console.log('vinvout', vinvout);
                                        console.log('err', err);
                                        if (err.stack.indexOf('Server selection timed out') > -1 ||
                                            err.stack.indexOf('interrupted at shutdown') > -1) {
                                            stopProccess();
                                        }
                                        insertTx();
                                    } else {
                                        finishUpdateTx = true;
                                        console.log('updated vin vout - ' + vinvout.blockindex, tx.txid);
                                        if (finishUpdateTx && finishUpdateAddress) {
                                            stopProccess();
                                        }
                                    }
                                })
                            }
                            insertTx();

                            var insertAddresses = function() {
                                if (addreses_to_update.length) {
                                    AddressToUpdateController.updateOne(addreses_to_update[0], function(err){
                                        if(err) {
                                            console.log(err);
                                            if(err.stack.indexOf('Server selection timed out') > -1 ||
                                                err.stack.indexOf('interrupted at shutdown') > -1) {
                                                stopProccess();
                                            }
                                        } else {
                                            addreses_to_update.shift();
                                        }
                                        insertAddresses();
                                    })
                                } else {
                                    finishUpdateAddress = true;
                                    if(finishUpdateTx && finishUpdateAddress) {
                                        stopProccess();
                                    }
                                }
                            }
                            insertAddresses();
                         })
                    })
                }).catch(function(err) {
                    console.log('tx not found on db - ', tx.blockindex)
                    stopProccess();
                })
            })
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
    beforeDeletingDb(function() {
        BlockController.deleteAll(function (numberRemoved) {
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
    }, function() {
        db.multipleDisconnect();
    })
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
            TxVinVoutController.getUsersTxsWeeklyChart(function (users_tx_chart) {
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
                                    var type = 'GETINFO';
                                    if(wallet === 'bitcoin') {
                                        type = 'TXOUTSET'
                                    }
                                    get_supply(type).then(function (supply) {
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
                                            walletversion: info.walletversion,
                                            protocol: info.protocolversion,
                                            users_tx_count_24_hours: users_tx_count_24_hours,
                                            users_tx_chart: users_tx_chart,
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
        if(!richlist) {
            richlist = {};
            richlist.coin = settings[wallet].coin;
        }
        // console.log('updating richlist');
        AddressController.getRichlistAndExtraStats2('received', 'desc', 100, settings[wallet].dev_address, function(results){
            var received = results.data;
            AddressController.getRichlistAndExtraStats2('balance', 'desc', 100, settings[wallet].dev_address, function(results){
                var active_wallets_count = results.countActive;
                var total_wallets_count = results.countUnique;
                var dev_wallet_balance = results.devAddressBalance;
                var balance = results.data;
                if(received && received.length) {
                    richlist.received = received.map(function (o) {return {received: o.received, a_id: o.a_id}});
                }
                if(balance && balance.length) {
                    richlist.balance = balance.map(function(o){ return {balance: o.balance, a_id: o.a_id}});
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

var gettingNextTxsCursor = function(limit, offset, blockindex, lastTx) {
    var promise = new Promise(function(resolve, reject) {
        var where = {};
        var fields = {}
        offset = offset * limit;
        if(blockindex) {
            blockindex = parseInt(blockindex);
            console.log('blockindex', blockindex);
            console.log('blockindex + limit', blockindex + limit);
            where = {$and: [{blockindex : {$gte : blockindex}}]};
        }
        if(lastTx) {
            console.log('lastTx.blockindex', lastTx.blockindex + 1);
            console.log('lastTx.blockindex + limit', lastTx.blockindex + 1 + limit);
            where = {$and: [{blockindex : {$gte : lastTx.blockindex + 1}}]};
        }
        TxController.getAllCursor(where, fields,'blockindex', 'asc', 0, 0, function(cursor) {
            resolve(cursor);
        })
    });
    return promise;

}

var gettingNextBlocks = function(limit, blockindex) {
    var promise = new Promise(function(resolve, reject) {
        TxController.getAllBlocksNew('blockindex', 'asc', limit, blockindex, function(cursor) {
            resolve(cursor);
        })
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
        // where.order = {$not:{$gt: 0}};
        where.order = {$eq: 0};
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
        if(limitBigChain > 500000) {
            limitBigChain = 500000;
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
        // where.order = {$not: {$gt: 0}};
        where.order = {$eq: 0};
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
            limitBigChain = 1000000;
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
                    else if(err && (err.toString().indexOf('No information available about transaction') > -1 || err.toString().indexOf('The genesis block coinbase is not considered an ordinary transaction') > -1)) {
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
var globalStartGettingBlocks = function(blockNum) {
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
                    cluster.worker.send({finished: true});
                }
            });
        }).catch(function (err) {
            if(err && err.toString().indexOf("couldn't parse reply from server") > -1) {
                globalStartGettingBlocks(blockNum);
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
            globalStartGettingBlocks(blockNum);
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
                            console.log('vinvout', vinvout);
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
            startUpdateTxByDay(lastDate);
        } else {
            console.log('no data yet');
            startUpdateTxByDay("");
            // db.multipleDisconnect()
        }
    })

    function startUpdateTxByDay(dateString) {
        if(wallet !== 'bitcoin') {
            TxVinVoutController.getTransactionsChart(dateString, function (txByDays) {
                if (txByDays && txByDays.length) {
                    updateTxByDayOneByOne(txByDays);
                } else {
                    console.log('no tx found');
                    deleteFile('txByDay');
                    db.multipleDisconnect();
                }
            })
        } else {
            TxVinVoutController.getTransactionsChartBitcoin(dateString, function (txByDays) {
                if (txByDays && txByDays.length) {
                    updateTxByDayOneByOne(txByDays);
                } else {
                    console.log('no tx found');
                    deleteFile('txByDay');
                    db.multipleDisconnect();
                }
            })
        }
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
    ClusterController.getAllChangedClustersIds(function(clusters) {
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
                            ClusterController.updateChanged(clusterId, false, function(err) {
                                startUpdateCluster(clusters);
                            });
                        }
                    })
                } else {
                    ClusterController.updateChanged(clusterId, false, function(err) {
                        startUpdateCluster(clusters);
                    })
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
                        ClusterController.updateChanged(clusterId, false, function(err) {
                            startUpdateCluster(clusters);
                            console.log('finish updating cluster chart - ' + clusterId)
                        });
                    }
                }
            })
        }
    }
}
function beforeDeletingDb(onYes, onNo) {
    console.log('are you sure you want to fully delete db?');
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


