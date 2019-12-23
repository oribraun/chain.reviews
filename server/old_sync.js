const wallet_commands = require('./wallet_commands');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

var Tx = require('./database/models/tx');
var Address = require('./database/models/address');

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
        // case 'getallblocks': // 0:17:2.910
        //     wallet_commands.getAllBlocks('fix-cli',function(index, hash){
        //         console.log('hash-' + index, hash);
        //     }).then(function(time){
        //         setTimeout(function(){
        //             console.log('finish getting blocks', time);
        //         },1000)
        //     }).catch(function(err) {
        //         console.log('error getting blocks', err);
        //     })
        //     break;
        case 'getallblockscluster': // 0:17:2.910
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                for (let i = 0; i < numCPUs; i++) {
                    cluster.fork();
                }

                cluster.on('exit', (worker, code, signal) => {
                    console.log(`worker ${worker.process.pid} died`);
                });
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server

                wallet_commands.getBlockCount(wallet).then(function(blockCount) {
                    var current_cluster_id = cluster.worker.id;
                    var allBlocksCount = 1000;
                    var offset = Math.ceil(allBlocksCount / numCPUs);
                    var from = (cluster.worker.id - 1) * offset;
                    var to = cluster.worker.id * offset;
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
        // case 'getallblocksdetails': // 0:30:50.786
        //     wallet_commands.getAllBlocks('fix-cli',function(index, hash){
        //         wallet_commands.getBlock(wallet, hash).then(function (block) {
        //             console.log('block', JSON.parse(block));
        //         }).catch(function (err) {
        //             console.log('error getting block', err);
        //         });
        //     }).then(function(time){
        //         setTimeout(function(){
        //             console.log('finish getting blocks', time);
        //         },1000)
        //     }).catch(function(err) {
        //         console.log('error getting blocks', err);
        //     })
        //     break;
        case 'getallblocksdetailscluster': // 0:17:2.910
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                for (let i = 0; i < numCPUs; i++) {
                    cluster.fork();
                }

                cluster.on('exit', (worker, code, signal) => {
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
                    var to = cluster.worker.id * offset;
                    if(cluster.worker.id === numCPUs) {
                        to = allBlocksCount;
                    }
                    wallet_commands.getAllBlocksCluster(wallet, from, to,function(index, hash){
                        wallet_commands.getBlock(wallet, hash).then(function (block) {
                            console.log('block', JSON.parse(block));
                        }).catch(function (err) {
                            console.log('error getting block', err);
                        });
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
        // case 'getalltxblocks': // 0:36:30.708
        //     wallet_commands.getAllBlocks('fix-cli',function(index, hash){
        //         wallet_commands.getBlock(wallet, hash).then(function (block) {
        //             var current_block = JSON.parse(block);
        //             wallet_commands.getRawTransaction(wallet, current_block.tx[0]).then(function (rawtransaction) {
        //                 console.log('rawtransaction', JSON.parse(rawtransaction));
        //             }).catch(function (err) {
        //                 console.log('error getting rawtransaction - ' + current_block.tx[0] , err);
        //             });
        //         }).catch(function (err) {
        //             console.log('error getting block', err);
        //         });
        //     }).then(function(time){
        //         setTimeout(function(){
        //             console.log('finish getting blocks', time);
        //         },1000)
        //     }).catch(function(err) {
        //         console.log('error getting blocks', err);
        //     })
        //     break;
        case 'getalltxblockscluster': // 0:17:2.910
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                for (let i = 0; i < numCPUs; i++) {
                    cluster.fork();
                }

                cluster.on('exit', (worker, code, signal) => {
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
                    var to = cluster.worker.id * offset;
                    if(cluster.worker.id === numCPUs) {
                        to = allBlocksCount;
                    }
                    wallet_commands.getAllBlocksCluster(wallet, from, to,function(index, hash){
                        wallet_commands.getBlock(wallet, hash).then(function (block) {
                            var current_block = JSON.parse(block);
                            wallet_commands.getRawTransaction(wallet, current_block.tx[0]).then(function (rawtransaction) {
                                console.log('rawtransaction', JSON.parse(rawtransaction));
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
                }).catch(function(err) {
                    console.log('error getting blockCount', err);
                })

            }
            break;
        case 'getalltxblocksfull': // 0:36:30.708
            wallet_commands.getAllBlocks(wallet,function(index, hash){
                wallet_commands.getBlock(wallet, hash).then(function (block) {
                    var current_block = JSON.parse(block);
                    wallet_commands.getRawTransactionFull(wallet, current_block.tx[0]).then(function (obj) {
                        console.log(obj)
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
        case 'getalltxblocksfullcluster': // 0:17:2.910
            if (cluster.isMaster) {
                console.log(`Master ${process.pid} is running`);

                // Fork workers.
                for (let i = 0; i < numCPUs; i++) {
                    cluster.fork();
                }

                cluster.on('exit', (worker, code, signal) => {
                    console.log(`worker ${worker.process.pid} died`);
                });
            } else {
                // Workers can share any TCP connection
                // In this case it is an HTTP server

                wallet_commands.getAllBlocks(wallet,function(index, hash){
                    wallet_commands.getBlock(wallet, hash).then(function (block) {
                        var current_block = JSON.parse(block);
                        wallet_commands.getRawTransactionFull(wallet, current_block.tx[0]).then(function (obj) {
                            console.log(obj)
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
        case 'reindex':
            wallet_commands.reindex(wallet,function(index, hash){
                console.log('hash-' + index, hash);
            }).then(function(time){
                console.log('finish getting blocks', time);
            }).catch(function(err) {
                console.log('error getting blocks', err);
            })
            break;
        default:
            console.log('command not allowed or not exist')
    }
}

// example commands

// node sync.js fix-cli startwallet

// node sync.js fix-cli stopwallet

// node sync.js fix-cli blockcount

// node sync.js fix-cli blockhash 0

// node sync.js fix-cli getallblocks

// node sync.js fix-cli listmasternodes

// node sync.js fix-cli reindex


