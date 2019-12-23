const wallet_commands = require('./wallet_commands');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const db = require('./database/db');
const settings = require('./wallets/all_settings');

var Tx = require('./database/models/tx');
var TxController = require('./database/controllers/tx_controller');
var Stats = require('./database/models/stats');
var StatsController = require('./database/controllers/stats_controller');
var Richlist = require('./database/models/richlist');
var RichlistController = require('./database/controllers/richlist_controller');
var Address = require('./database/models/address');
var AddressController = require('./database/controllers/address_controller');

var wallet = process.argv[2];
var type = process.argv[3];
var hash_number = process.argv[4];
// console.log('wallet', wallet)
// console.log('type', type)
// console.log('hash_number', hash_number)

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

                db.connect(settings[wallet].dbsettings);
                var exit_count = 0;
                cluster.on('exit', (worker, code, signal) => {
                    exit_count++;
                    if(exit_count === numCPUs) {
                        db.disconnect();
                    }
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

                db.connect(settings[wallet].dbsettings);
                var exit_count = 0;
                cluster.on('exit', (worker, code, signal) => {
                    exit_count++;
                    if(exit_count === numCPUs) {
                        db.disconnect();
                    }
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
                    //     db.disconnect();
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

                db.connect(settings[wallet].dbsettings);
                var exit_count = 0;
                cluster.on('exit', (worker, code, signal) => {
                    exit_count++;
                    if(exit_count === numCPUs) {
                        db.disconnect();
                    }
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
            db.connect(settings[wallet].dbsettings);
            deleteDb(startReIndex);
            function startReIndex() {
                wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                    var allBlocksCount = 10;
                    var start = 0;
                    var from = start;
                    var to = allBlocksCount;
                    var txInsertCount = 0;
                    var updateInProgress = false;
                    var addresses = [];
                    var countAddressUpdate = 0;
                    function startUpdatingAddresses(addresses1) {
                        if(!updateInProgress) {
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
                                    endReIndex();
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
                                    // Tx.find({}).where('blockindex').lt(start + x).sort({timestamp: 'desc'}).limit(settings.index.last_txs).exec(function(err, txs){
                                    //     Stats.update({coin: coin}, {
                                    //         last: start + x - 1,
                                    //         last_txs: '' //not used anymore left to clear out existing objects
                                    //     }, function() {});
                                    // });
                                    if (txInsertCount === to - from + 1 && !addresses.length) {
                                        endReIndex();
                                    }
                                    // console.log('created')
                                });
                                console.log(newTx.blockindex, obj.tx.txid);
                                var addreses_to_update = obj.addreses_to_update;
                                // console.log('addreses_to_update.length', addreses_to_update.length)
                                // addr_count += addreses_to_update.length;
                                if(addreses_to_update.length) {
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
                                        endReIndex();
                                    }
                                    // console.log('created')
                                });
                            });
                        }).catch(function (err) {
                            txInsertCount++;
                            console.log('error getting block', err);
                            if (txInsertCount === to - from + 1) {
                                endReIndex();
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
            }
            function endReIndex() {
                RichlistController.getOne(settings[wallet].coin, function(richlist) {
                    AddressController.getRichlist('received', 'desc', 100, function(received){
                        AddressController.getRichlist('balance', 'desc', 100, function(balance){
                            richlist.received = received;
                            richlist.balance = balance;
                            RichlistController.updateOne(richlist, function(err) {
                                TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                                    console.log('latestTx', latestTx);
                                    StatsController.update(settings[wallet].coin, {last: latestTx.blockindex}, function(err) {
                                        if(err) {
                                            console.log(err)
                                        }
                                        console.log('reindex complete - ', latestTx.blockindex)
                                        db.disconnect();
                                        process.exit();
                                    });

                                })
                            })
                        })
                    })
                })
            }
            break;
        case 'update': // 0:27:35.915
            db.connect(settings[wallet].dbsettings);
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
                        var updateInProgress = false;
                        var addresses = [];
                        var countAddressUpdate = 0;

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
                RichlistController.getOne(settings[wallet].coin, function(richlist) {
                    AddressController.getRichlist('received', 'desc', 100, function(received){
                        AddressController.getRichlist('balance', 'desc', 100, function(balance){
                            richlist.received = received;
                            richlist.balance = balance;
                            RichlistController.updateOne(richlist, function(err) {
                                TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                                    console.log('latestTx', latestTx);
                                    StatsController.update(settings[wallet].coin, {last: latestTx.blockindex}, function(err) {
                                        if(err) {
                                            console.log(err)
                                        }
                                        db.disconnect();
                                        process.exit();
                                    });

                                })
                            })
                        })
                    })
                })
            }
            startUpdate();
            break;
        case 'reindexcluster': // 0:28:16.967
            db.connect(settings[wallet].dbsettings); // TODO - need to check if all db connection close
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);
                var addreses_to_update = [];
                // Fork workers.
                var updateAddressInProgress = false;

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
                                        StatsController.update(settings[wallet].coin, {last: latestTx.blockindex}, function(err) {
                                            if(err) {
                                                console.log(err)
                                            }
                                            console.log('reindex cluster complete - ', latestTx[0].blockindex)
                                            db.disconnect();
                                            process.exit();
                                        });

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
                                        if (txInsertCount === to - from + 1) {
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
                                        if (txInsertCount === to - from + 1) {
                                            endReIndexCluster();
                                        }
                                    });
                                });
                            }).catch(function (err) {
                                txInsertCount++;
                                console.log('error getting block', err);
                                if (txInsertCount === to - from + 1) {
                                    endReIndexCluster();
                                }
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
                    process.exit();
                }
                startReIndexCluster();
            }
            break;
        case 'reindexclusterlinear': // 0:33:23.548
            db.connect(settings[wallet].dbsettings); // TODO - need to check if all db connection close
            var startTime = new Date();
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);
                var addreses_to_update = [];
                // Fork workers.
                var updateAddressInProgress = false;

                deleteDb(startReIndexClusterLinerAll);

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
                                endReIndexClusterLinerAll();
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
                                    endReIndexClusterLinerAll();
                                }
                                console.log('countAddressUpdate', countAddressUpdate);
                            }
                        })
                    }
                }

                function endReIndexClusterLinerAll() {
                    RichlistController.getOne(settings[wallet].coin, function(richlist) {
                        AddressController.getRichlist('received', 'desc', 100, function(received){
                            AddressController.getRichlist('balance', 'desc', 100, function(balance){
                                richlist.received = received;
                                richlist.balance = balance;
                                RichlistController.updateOne(richlist, function(err) {
                                    TxController.getAll('blockindex', 'desc', 1, function(latestTx) {
                                        console.log('latestTx', latestTx);
                                        StatsController.update(settings[wallet].coin, {last: latestTx.blockindex}, function(err) {
                                            if(err) {
                                                console.log(err)
                                            }
                                            console.log('reindex cluster complete - ', latestTx[0].blockindex)
                                            var endTime = new Date();
                                            // console.log('startTime', startTime)
                                            // console.log('endTime', endTime)
                                            var diff = endTime - startTime;
                                            var msec = diff;
                                            var hh = Math.floor(msec / 1000 / 60 / 60);
                                            msec -= hh * 1000 * 60 * 60;
                                            var mm = Math.floor(msec / 1000 / 60);
                                            msec -= mm * 1000 * 60;
                                            var ss = Math.floor(msec / 1000);
                                            msec -= ss * 1000;
                                            // console.log('endTime - startTime', hh + ":" + mm + ":" + ss + "." + msec);
                                            // console.log('blocks.length', blocks.length);
                                            console.log('took - ', hh + ":" + mm + ":" + ss + "." + msec);
                                            db.disconnect();
                                            process.exit();
                                        });

                                    })
                                })
                            })
                        })
                    })
                }
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                function startReIndexClusterLiner() {
                    wallet_commands.getBlockCount(wallet).then(function (blockCount) {
                        var current_cluster_id = cluster.worker.id;
                        var allBlocksCount = blockCount;
                        var from = cluster.worker.id - 1;
                        var to = allBlocksCount;
                        var txInsertCount = 0;
                        var expectedSteps = Math.floor((to - from)/numCPUs + 1);
                        // console.log('from', from);
                        // console.log('to', to);
                        // console.log('expectedSteps', expectedSteps);
                        // return;
                        wallet_commands.getAllBlocksClusterLiner(wallet, from, to, numCPUs, function (index, hash) {
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
                                        // console.log('expectedSteps', expectedSteps)
                                        if (txInsertCount === expectedSteps) {
                                            endReIndexClusterLiner();
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
                                        if (txInsertCount === expectedSteps) {
                                            endReIndexClusterLiner();
                                        }
                                    });
                                });
                            }).catch(function (err) {
                                txInsertCount++;
                                console.log('error getting block', err);
                                if (txInsertCount === expectedSteps) {
                                    endReIndexClusterLiner();
                                }
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
                    process.exit();
                }
                startReIndexClusterLiner();
            }
            break;
        case 'updatecluster': // 0:28:16.967
            db.connect(settings[wallet].dbsettings); // TODO - need to check if all db connection close
            if (cluster.isMaster) {
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
                                        StatsController.update(settings[wallet].coin, {last: latestTx.blockindex}, function(err) {
                                            if(err) {
                                                console.log(err)
                                            }
                                            console.log('reindex cluster complete - ', latestTx[0].blockindex)
                                            db.disconnect();
                                            process.exit();
                                        });

                                    })
                                })
                            })
                        })
                    })
                }
                startUpdateClusterAll();
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                var blockindex;
                process.on('message', function(msg) {
                    blockindex = msg.blockindex;
                });
                function startUpdateCluster() {
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
                                        if (txInsertCount === to - from + 1) {
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
                                        if (txInsertCount === to - from + 1) {
                                            endUpdateCluster();
                                        }
                                    });
                                });
                            }).catch(function (err) {
                                txInsertCount++;
                                console.log('error getting block', err);
                                if (txInsertCount === to - from + 1) {
                                    endUpdateCluster();
                                }
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
                    process.exit();
                }
                startUpdateCluster();
            }
            break;
        case 'updateclusterlinear': // 0:28:16.967
            db.connect(settings[wallet].dbsettings); // TODO - need to check if all db connection close
            if (cluster.isMaster) {
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
                                        StatsController.update(settings[wallet].coin, {last: latestTx.blockindex}, function(err) {
                                            if(err) {
                                                console.log(err)
                                            }
                                            console.log('reindex cluster complete - ', latestTx[0].blockindex)
                                            db.disconnect();
                                            process.exit();
                                        });

                                    })
                                })
                            })
                        })
                    })
                }
                startUpdateClusterLinerAll();
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server
                var blockindex;
                process.on('message', function(msg) {
                    blockindex = msg.blockindex;
                });
                function startUpdateClusterLiner() {
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
                        var expectedSteps = Math.floor((to - from)/numCPUs + 1);

                        // console.log('from', from);
                        // console.log('to', to);
                        // console.log('blockindex', blockindex);
                        // return;

                        wallet_commands.getAllBlocksClusterLiner(wallet, from, to, numCPUs, function (index, hash) {
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
                                        if (txInsertCount === expectedSteps) {
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
                                        if (txInsertCount === expectedSteps) {
                                            endUpdateClusterLiner();
                                        }
                                    });
                                });
                            }).catch(function (err) {
                                txInsertCount++;
                                console.log('error getting block', err);
                                if (txInsertCount === expectedSteps) {
                                    endUpdateClusterLiner();
                                }
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
                    process.exit();
                }
                startUpdateClusterLiner();
            }
            break;
        case 'db':
            db.createDBAndUser(settings[wallet].dbsettings);
            break;
        default:
            console.log('command not allowed or not exist')
    }
}


function deleteDb(cb) {
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
                    cb();
                });
            })
        })
    });
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


