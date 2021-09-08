const spawn = require('child_process').spawn;
const request = require('request');
const helpers = require('./helpers');
const settings = require('./wallets/all_settings');
const tx_types = require('./tx_types');

const TEN_MEGABYTES = 1000 * 1000 * 10;
const options = {};
const execFileOpts = { encoding: 'utf8' ,maxBuffer: TEN_MEGABYTES };

var forceStop = false;


const validation = require('../server/wallet_entities/entities_validations');
const Block = require('../server/wallet_entities/block');
const Info = require('../server/wallet_entities/info');
const MasternodeCount = require('../server/wallet_entities/masternode_count');
const MasternodesList = require('../server/wallet_entities/masternodes_list');
const MiningInfo = require('../server/wallet_entities/mininginfo');
const PeersList = require('../server/wallet_entities/peers_list');
const RawTx = require('../server/wallet_entities/raw_tx');
const TxOutsetInfo = require('../server/wallet_entities/txoutsetinfo');

var generalCommand = function(command, args, execFileOpts, options) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        var proc = spawn(command, args, {execFileOpts, options}, function done(err, stdout, stderr) {
            if (err) {
                // console.error('Error:', err.stack);
                reject(err.stack);
                try {
                    proc.kill('SIGINT');
                    // fs.removeSync(__dirname + sess.dir);
                    // delete sess.proc;
                    // delete sess.dir;
                } catch (e) {
                    // console.log('e', e);
                }
                // throw err;
            }
            // console.log('Success', stdout);
            // console.log('Err', stderr);
        });
        proc.stdout.setEncoding('utf8');
// sess.proc = proc;
// sess.dir = dir;
// console.log("sess.proc.pid before", sess.proc.pid)

        proc.stderr.on('data', function (data) {
            // console.log('err', data.toString('utf8'));
            reject(data.toString('utf8'));
            // process.stderr.write(data);
        });
        proc.stdout.on('data', function (data) {
            // var data = JSON.parse(data);
            // console.log('data', data);
            results += data;
            // process.stdout.write(data);
        });
        proc.on('close', function (code, signal) {
            resolve(results);
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
        });
        proc.on('error', function(code, signal) {
            reject(code);
        });
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}

var copy = function() {
    var wallet_cli = settings[wallet]['cli'];
    var get_block_count_command = settings[wallet]['commands']['getblockcount'];
    var commands = [];
    commands.push(get_block_count_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        getFromWallet(wallet_cli, commands).then(
            (results) => {
                //TODO make sure return type int
                resolve(results);
            },
            (error) => {
                reject(error);
            }
        )
    });
    return promise;
}

var startWallet = function(wallet) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }

        // -txindex
        var wallet_daemon = settings[wallet]['daemon'];
        var wallet_cli = settings[wallet]['cli'];
        var start_wallet_command = settings[wallet]['commands']['startwallet'];
        var commands = [];
        commands.push(start_wallet_command);
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_daemon, commands).then(
                (results) => {
                    try {
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            var proc = spawn(wallet_daemon, [start_wallet_command], {
                execFileOpts,
                options
            }, function done(err, stdout, stderr) {
                if (err) {
                    // console.error('Error:', err.stack);
                    reject(err.stack);
                    try {
                        proc.kill('SIGINT');
                        // fs.removeSync(__dirname + sess.dir);
                        // delete sess.proc;
                        // delete sess.dir;
                    } catch (e) {
                        // console.log('e', e);
                    }
                    // throw err;
                }
                // console.log('Success', stdout);
                // console.log('Err', stderr);
            });
            proc.stdout.setEncoding('utf8');
            // sess.proc = proc;
            // sess.dir = dir;
            // console.log("sess.proc.pid before", sess.proc.pid)

            proc.stderr.on('data', function (data) {
                // console.log('err', data.toString('utf8'));
                reject(data.toString('utf8'));
                // process.stderr.write(data);
            });
            proc.stdout.on('data', function (data) {
                // var data = JSON.parse(data);
                // console.log('data', data);
                results += data;
                resolve(results);
                // process.stdout.write(data);
            });
            proc.on('close', function (code, signal) {
                // console.log('code', code);
                // console.log('signal', signal);
                // console.log('spawn closed');
                if(!code) {
                    if(!results) {
                        results = settings[wallet]['coin'] + ' Core starting'
                    }
                    resolve(results);
                } else {
                    reject('empty results');
                }
            });
            proc.on('error', function (code, signal) {
                reject(code);
            });
            proc.on('exit', function (code) {
                // console.log('spawn exited with code ' + code);
                proc.stdin.end();
                proc.stdout.destroy();
                proc.stderr.destroy();
            });
        }
    });
    return promise;
}

var reindexWallet = function(wallet) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }

        // -txindex
        var wallet_daemon = settings[wallet]['daemon'];
        var start_wallet_command = settings[wallet]['commands']['reindexWallet'];
        var proc = spawn(wallet_daemon, start_wallet_command.split(' '), { execFileOpts, options }, function done(err, stdout, stderr) {
            if (err) {
                // console.error('Error:', err.stack);
                reject(err.stack);
                try {
                    proc.kill('SIGINT');
                    // fs.removeSync(__dirname + sess.dir);
                    // delete sess.proc;
                    // delete sess.dir;
                } catch(e) {
                    // console.log('e', e);
                }
                // throw err;
            }
            // console.log('Success', stdout);
            // console.log('Err', stderr);
        });
        proc.stdout.setEncoding('utf8');
        // sess.proc = proc;
        // sess.dir = dir;
        // console.log("sess.proc.pid before", sess.proc.pid)

        proc.stderr.on('data', function(data) {
            // console.log('err', data.toString('utf8'));
            reject(data.toString('utf8'));
            // process.stderr.write(data);
        });
        proc.stdout.on('data', function(data) {
            // var data = JSON.parse(data);
            // console.log('data', data);
            results += data;
            resolve(results);
            // process.stdout.write(data);
        });
        proc.on('close', function(code, signal) {
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
        });
        proc.on('error', function(code, signal) {
            reject(code);
        });
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            proc.stdin.end();
            proc.stdout.destroy();
            proc.stderr.destroy();
        });
    });
    return promise;
}

var rescanWallet = function(wallet) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }

        // -txindex
        var wallet_daemon = settings[wallet]['daemon'];
        var start_wallet_command = settings[wallet]['commands']['rescanWallet'];
        var proc = spawn(wallet_daemon, start_wallet_command.split(' '), { execFileOpts, options }, function done(err, stdout, stderr) {
            if (err) {
                // console.error('Error:', err.stack);
                reject(err.stack);
                try {
                    proc.kill('SIGINT');
                    // fs.removeSync(__dirname + sess.dir);
                    // delete sess.proc;
                    // delete sess.dir;
                } catch(e) {
                    // console.log('e', e);
                }
                // throw err;
            }
            // console.log('Success', stdout);
            // console.log('Err', stderr);
        });
        proc.stdout.setEncoding('utf8');
        // sess.proc = proc;
        // sess.dir = dir;
        // console.log("sess.proc.pid before", sess.proc.pid)

        proc.stderr.on('data', function(data) {
            // console.log('err', data.toString('utf8'));
            reject(data.toString('utf8'));
            // process.stderr.write(data);
        });
        proc.stdout.on('data', function(data) {
            // var data = JSON.parse(data);
            // console.log('data', data);
            results += data;
            resolve(results);
            // process.stdout.write(data);
        });
        proc.on('close', function(code, signal) {
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
        });
        proc.on('error', function(code, signal) {
            reject(code);
        });
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            proc.stdin.end();
            proc.stdout.destroy();
            proc.stderr.destroy();
        });
    });
    return promise;
}

var stopWallet = function(wallet) {
    var wallet_cli = settings[wallet]['cli'];
    var stop_wallet_command = settings[wallet]['commands']['stopwallet'];
    var commands = [];
    commands.push(stop_wallet_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    try {
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    resolve(results);
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}

var getBlockCount = function(wallet) {
    var wallet_cli = settings[wallet]['cli'];
    var get_block_count_command = settings[wallet]['commands']['getblockcount'];
    var commands = [];
    commands.push(get_block_count_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type int
                    results = parseInt(results);
                    if(!isNaN(results)) {
                        resolve(results);
                    } else {
                        reject('result is not a number');
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type int
                    results = parseInt(results);
                    if(!isNaN(results)) {
                        resolve(results);
                    } else {
                        reject('result is not a number');
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}

var getBlock = function(wallet, hash) {
    var wallet_cli = settings[wallet]['cli'];
    var get_block_command = settings[wallet]['commands']['getblock'];
    var commands = [];
    commands.push(get_block_command);
    commands.push(hash.toString());
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    try {
                        new Block(JSON.parse(results));
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    try {
                        new Block(JSON.parse(results));
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}

var getBlockHash = function(wallet, index) {
    var wallet_cli = settings[wallet]['cli'];
    var get_block_hash_command = settings[wallet]['commands']['getblockhash'];
    var commands = [];
    commands.push(get_block_hash_command);
    commands.push(index.toString());
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type hash
                    try {
                        results = results.toString();
                        if(results.length === 64) {
                            resolve(results);
                        } else {
                            reject('not a valid hash');
                        }
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type hash
                    resolve(results);
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}

var getAllBlocks = function(wallet, callback) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        getBlockCount(wallet).then(function (blockCount) {
            var split_proccess = 4;
            var blockCount = blockCount;
            // console.log('getBlockCount', blockCount);
            var startTime = new Date();
            var endTime = 0;
            var i = 0;
            function getBlocksHash(index) {
                getBlockHash(wallet, index).then(function (hash) {
                    callback(index, hash);
                    if (index >= blockCount) {
                        endTime = new Date();
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
                        resolve(hh + ":" + mm + ":" + ss + "." + msec);
                    } else {
                        // console.log('getBlockHash - ' + index, hash);
                        // blocks.push(hash);
                        index += split_proccess;
                        if(index <= blockCount) {
                            getBlocksHash(index)
                        }
                    }
                }).catch(function (err) {
                    // console.log('getBlockHash err', err)
                    reject(err);
                })
            }
            for(var j = 0; j < split_proccess; j++) {
                getBlocksHash(j);
            }
        }).catch(function (err) {
            // console.log('getBlockCount err', err)
            reject(err);
        });
    });
    return promise;
}

var reindex = function(wallet, callback) {
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        getBlockCount(wallet).then(function (blockCount) {
            var blockCount = blockCount;
            // console.log('getBlockCount', blockCount);
            var startTime = new Date();
            var endTime = 0;
            var i = 0;
            // TODO remove db blocks
            function getBlocksHash(index) {
                getBlockHash(wallet, index).then(function (hash) {
                    callback(index, hash);
                    if (index >= blockCount) {
                        endTime = new Date();
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
                        resolve(hh + ":" + mm + ":" + ss + "." + msec);
                    } else {
                        // console.log('getBlockHash - ' + index, hash);
                        // blocks.push(hash);
                        getBlocksHash(++index)
                    }
                }).catch(function (err) {
                    // console.log('getBlockHash err', err)
                    reject(err);
                })
            }
            getBlocksHash(i);
        }).catch(function (err) {
            // console.log('getBlockCount err', err)
            reject(err);
        });
    });
    return promise;
}

var getNewBlocks = function(wallet, callback) {
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        getBlockCount(wallet).then(function (blockCount) {
            var blockCount = blockCount;
            // console.log('getBlockCount', blockCount);
            var startTime = new Date();
            var endTime = 0;
            var i = 0;
            // TODO get db latest blocks
            function getBlocksHash(index) {
                getBlockHash(wallet, index).then(function (hash) {
                    callback(index, hash);
                    if (index >= blockCount) {
                        endTime = new Date();
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
                        resolve(hh + ":" + mm + ":" + ss + "." + msec);
                    } else {
                        // console.log('getBlockHash - ' + index, hash);
                        // blocks.push(hash);
                        getBlocksHash(++index)
                    }
                }).catch(function (err) {
                    // console.log('getBlockHash err', err)
                    reject(err);
                })
            }
            getBlocksHash(i);
        }).catch(function (err) {
            // console.log('getBlockCount err', err)
            reject(err);
        });
    });
    return promise;
}

var getAllMasternodes = function(wallet) {
    var wallet_cli = settings[wallet]['cli'];
    var get_allmasternodes_command = settings[wallet]['commands']['getallmasternodes'];
    var commands = [];
    commands.push(get_allmasternodes_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    try {
                        new MasternodesList(JSON.parse(results));
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    try {
                        new MasternodesList(JSON.parse(results));
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}

var getMasternodeCount = function(wallet) {
    var wallet_cli = settings[wallet]['cli'];
    var get_allmasternodes_command = settings[wallet]['commands']['getmasternodecount'];
    var commands = [];
    commands.push(get_allmasternodes_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    try {
                        new MasternodeCount(JSON.parse(results));
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    try {
                        new MasternodeCount(JSON.parse(results));
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}

var getRawTransaction = function(wallet, txid) {
    var wallet_cli = settings[wallet]['cli'];
    var get_rawtransaction_command = settings[wallet]['commands']['getrawtransaction'];
    var verbose = 1;
    var commands = [];
    commands.push(get_rawtransaction_command);
    commands.push(txid.toString());
    commands.push(verbose.toString());
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    try {
                        new RawTx(JSON.parse(results));
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    try {
                        new RawTx(JSON.parse(results));
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}

var getRawTransactionFull = function(wallet, txid) {
    var wallet_cli = settings[wallet]['cli'];
    var get_rawtransaction_command = settings[wallet]['commands']['getrawtransaction'];
    var verbose = 1;
    var commands = [];
    commands.push(get_rawtransaction_command);
    commands.push(txid.toString());
    commands.push(verbose.toString());
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    try {
                        new RawTx(JSON.parse(results));
                        calcVinVout(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    try {
                        new RawTx(JSON.parse(results));
                        calcVinVout(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        }

        function calcVinVout(results) {
            var tx = JSON.parse(results);
            var addreses_to_update = [];
            helpers.prepare_vin(wallet, tx).then(function (vin) {
                helpers.prepare_vout(tx.vout, txid, vin).then(function (obj) {
                    for (var i = 0; i < vin.length; i++) {
                        // TODO update mongodb adress sceme
                        addreses_to_update.push({
                            address: obj.nvin[i].addresses,
                            txid: txid,
                            amount: obj.nvin[i].amount,
                            type: 'vin'
                        })
                        // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                    }
                    for (var i = 0; i < obj.vout.length; i++) {
                        // TODO update mongodb adress sceme
                        addreses_to_update.push({
                            address: obj.vout[i].addresses,
                            txid: txid,
                            amount: obj.vout[i].amount,
                            type: 'vout'
                        })
                        // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                    }
                    helpers.calculate_total(obj.vout).then(function (total) {
                        var type = tx_types.NORMAL;
                        if(!obj.vout.length) {
                            type = tx_types.NONSTANDARD;
                        } else if(!obj.nvin.length) {
                            type = tx_types.POS;
                        } else if(obj.nvin.length && obj.nvin[0].addresses === 'coinbase') {
                            type = tx_types.NEW_COINS;
                        }
                        resolve({
                            tx: tx,
                            nvin: obj.nvin,
                            vout: obj.vout,
                            total: total,
                            addreses_to_update: addreses_to_update,
                            type: type,
                            type_str: tx_types.toStr(type)
                        });
                    })
                }).catch(function (err) {
                    console.log('error getting prepare_vout', err)
                })
            })
        }
    });
    return promise;
}

var getConnectionCount = function(wallet){
    var wallet_cli = settings[wallet]['cli'];
    var get_connection_count_command = settings[wallet]['commands']['getconnectioncount'];
    var commands = [];
    commands.push(get_connection_count_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type hash
                    try {
                        results = parseInt(results);
                        resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type int
                    results = parseInt(results);
                    if(!isNaN(results)) {
                        resolve(results);
                    } else {
                        reject('result is not a number');
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}
var getInfo = function(wallet){
    var wallet_cli = settings[wallet]['cli'];
    var get_info_command = settings[wallet]['commands']['getinfo'];
    var commands = [];
    commands.push(get_info_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    try {
                        new Info(JSON.parse(results));
                        resolve(results);
                    }
                    catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    try {
                        new Info(JSON.parse(results));
                        resolve(results);
                    }
                    catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}
var getTxoutsetInfo = function(wallet){
    var wallet_cli = settings[wallet]['cli'];
    var get_txoutset_info_command = settings[wallet]['commands']['gettxoutsetinfo'];
    var commands = [];
    commands.push(get_txoutset_info_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type hash
                    resolve(results);
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type object
                    // {
                    //     "height": 215366,
                    //     "bestblock": "74033aa064e95344493e5a0affcab2fb2a4f53e217513084e6c702617b594fc4",
                    //     "transactions": 435162,
                    //     "txouts": 622565,
                    //     "bytes_serialized": 22709231,
                    //     "hash_serialized": "85c44e98a3c25b334dc8d2110dc4b9d578819ad8f76d8a19a2b092cce73c58b4",
                    //     "total_amount": 3473681471.34521756
                    // }

                    resolve(results);
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}
var getPeerInfo = function(wallet){
    var wallet_cli = settings[wallet]['cli'];
    var get_peer_info_command = settings[wallet]['commands']['getpeerinfo'];
    var commands = [];
    commands.push(get_peer_info_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    try {
                        new PeersList(JSON.parse(results));
                        resolve(results);
                    }
                    catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    try {
                        new PeersList(JSON.parse(results));
                        resolve(results);
                    }
                    catch (e) {
                        reject(e);
                    }
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
}
var getDifficulty = function(wallet){
    var wallet_cli = settings[wallet]['cli'];
    var get_difficulty_command = settings[wallet]['commands']['getdifficulty'];
    var commands = [];
    commands.push(get_difficulty_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type hash
                    resolve(results);
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type number/double
                    resolve(results);
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getdifficulty'];
        var proc = spawn(wallet_cli, [get_block_command], { execFileOpts, options }, function done(err, stdout, stderr) {
            if (err) {
                // console.error('Error:', err.stack);
                reject(err.stack);
                try {
                    proc.kill('SIGINT');
                    // fs.removeSync(__dirname + sess.dir);
                    // delete sess.proc;
                    // delete sess.dir;
                } catch(e) {
                    // console.log('e', e);
                }
                // throw err;
            }
            // console.log('Success', stdout);
            // console.log('Err', stderr);
        });
        proc.stdout.setEncoding('utf8');
        // sess.proc = proc;
        // sess.dir = dir;
        // console.log("sess.proc.pid before", sess.proc.pid)

        proc.stderr.on('data', function(data) {
            // console.log('err', data.toString('utf8'));
            reject(data.toString('utf8'));
            // process.stderr.write(data);
        });
        proc.stdout.on('data', function(data) {
            // var data = JSON.parse(data);
            // console.log('data', data);
            results += data.replace(/\n|\r/g, "");
            // process.stdout.write(data);
        });
        proc.on('close', function(code, signal) {
            if(results) {
                resolve(results);
            } else {
                reject('empty');
            }
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
        });
        proc.on('error', function(code, signal) {
            reject(code);
        });
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getNetworkHashps = function(wallet){
    var wallet_cli = settings[wallet]['cli'];
    var get_network_hashps_command = settings[wallet]['commands']['getnetworkhashps'];
    var commands = [];
    commands.push(get_network_hashps_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type int
                    results = parseFloat(results);
                    if(!isNaN(results)) {
                        resolve(results);
                    } else {
                        reject('result is not a number');
                    }
                },
                (error) => {
                    // reject(error);
                    resolve(0);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type int
                    results = parseInt(results);
                    if(!isNaN(results)) {
                        resolve(results);
                    } else {
                        reject('result is not a number');
                    }
                },
                (error) => {
                    // reject(error);
                    resolve(0);
                }
            )
        }
    });
    return promise;
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getnetworkhashps'];
        var proc = spawn(wallet_cli, [get_block_command], { execFileOpts, options }, function done(err, stdout, stderr) {
            if (err) {
                // console.error('Error:', err.stack);
                reject(err.stack);
                try {
                    proc.kill('SIGINT');
                    // fs.removeSync(__dirname + sess.dir);
                    // delete sess.proc;
                    // delete sess.dir;
                } catch(e) {
                    // console.log('e', e);
                }
                // throw err;
            }
            // console.log('Success', stdout);
            // console.log('Err', stderr);
        });
        proc.stdout.setEncoding('utf8');
        // sess.proc = proc;
        // sess.dir = dir;
        // console.log("sess.proc.pid before", sess.proc.pid)

        proc.stderr.on('data', function(data) {
            // console.log('err', data.toString('utf8'));
            reject(data.toString('utf8'));
            // process.stderr.write(data);
        });
        proc.stdout.on('data', function(data) {
            // var data = JSON.parse(data);
            // console.log('data', data);
            results += data.replace(/\n|\r/g, "");
            // process.stdout.write(data);
        });
        proc.on('close', function(code, signal) {
            if(results) {
                resolve(results);
            } else {
                reject('empty');
            }
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
        });
        proc.on('error', function(code, signal) {
            reject(code);
        });
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getMiningInfo = function(wallet){
    var wallet_cli = settings[wallet]['cli'];
    var get_mining_info_command = settings[wallet]['commands']['getmininginfo'];
    var commands = [];
    commands.push(get_mining_info_command);
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(wallet_cli.indexOf('http') > -1) {
            getFromUrl(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type hash
                    resolve(results);
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            getFromWallet(wallet_cli, commands).then(
                (results) => {
                    //TODO make sure return type object
                    // {
                    //     "blocks": 215366,
                    //     "currentblocksize": 0,
                    //     "currentblocktx": 0,
                    //     "difficulty": 6555342.677358772,
                    //     "errors": "",
                    //     "genproclimit": -1,
                    //     "networkhashps": 324977233923772,
                    //     "pooledtx": 0,
                    //     "testnet": false,
                    //     "chain": "main",
                    //     "generate": false,
                    //     "hashespersec": 0
                    // }

                    resolve(results);
                },
                (error) => {
                    reject(error);
                }
            )
        }
    });
    return promise;
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getmininginfo'];
        var proc = spawn(wallet_cli, [get_block_command], { execFileOpts, options }, function done(err, stdout, stderr) {
            if (err) {
                // console.error('Error:', err.stack);
                reject(err.stack);
                try {
                    proc.kill('SIGINT');
                    // fs.removeSync(__dirname + sess.dir);
                    // delete sess.proc;
                    // delete sess.dir;
                } catch(e) {
                    // console.log('e', e);
                }
                // throw err;
            }
            // console.log('Success', stdout);
            // console.log('Err', stderr);
        });
        proc.stdout.setEncoding('utf8');
        // sess.proc = proc;
        // sess.dir = dir;
        // console.log("sess.proc.pid before", sess.proc.pid)

        proc.stderr.on('data', function(data) {
            // console.log('err', data.toString('utf8'));
            reject(data.toString('utf8'));
            // process.stderr.write(data);
        });
        proc.stdout.on('data', function(data) {
            // var data = JSON.parse(data);
            // console.log('data', data);
            results += data.replace(/\n|\r/g, "");
            // process.stdout.write(data);
        });
        proc.on('close', function(code, signal) {
            if(results) {
                resolve(results);
            } else {
                reject('empty');
            }
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
        });
        proc.on('error', function(code, signal) {
            reject(code);
        });
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}

var getAllBlocksCluster = function(wallet, from, to, callback) {
    var promise = new Promise(function(resolve, reject) {
        var startTime = new Date();
        var endTime = 0;
        var i = from;
        function getBlocksHash(index) {
            getBlockHash(wallet, index).then(function (hash) {
                callback(index, hash);
                if (index >= to) {
                    resolve(helpers.getFinishTime(startTime));
                } else {
                    // console.log('getBlockHash - ' + index, hash);
                    // blocks.push(hash);
                    if(!forceStop) {
                        getBlocksHash(++index)
                    } else {
                        resolve(helpers.getFinishTime(startTime));
                        resetForceStop();
                    }
                }
            }).catch(function (err) {
                // console.log('getBlockHash err', err)
                reject(err);
            })
        }
        if (from <= to) {
            getBlocksHash(from);
        } else {
            reject('no blocks to get');
        }
    });
    return promise;
}

var getAllBlocksClusterLiner = function(wallet, from, to, jump, callback) {
    var promise = new Promise(function(resolve, reject) {
        var startTime = new Date();
        var endTime = 0;
        var i = from;
        function getBlocksHash(index) {
            getBlockHash(wallet, index).then(function (hash) {
                callback(index, hash);
                if (index > to) {
                    resolve(helpers.getFinishTime(startTime));
                } else {
                    // console.log('getBlockHash - ' + index, hash);
                    // blocks.push(hash);
                    index += jump;
                    if(!forceStop && index <= to) {
                        getBlocksHash(index)
                    } else {
                        resolve(helpers.getFinishTime(startTime));
                        resetForceStop();
                    }
                }
            }).catch(function (err) {
                // console.log('getBlockHash err', err)
                reject(err);
            })
        }
        if (from <= to) {
            getBlocksHash(from);
        } else {
            reject('no blocks to get');
        }
    });
    return promise;
}


var getFromWallet = function(wallet_cli, commands) {
    var results = '';
    var promise = new Promise(function(resolve, reject) {
        var proc = spawn(wallet_cli, commands, { execFileOpts, options }, function done(err, stdout, stderr) {
            if (err) {
                // console.error('Error:', err.stack);
                reject(err.stack);
                try {
                    // proc.kill('SIGINT');
                    // fs.removeSync(__dirname + sess.dir);
                    // delete sess.proc;
                    // delete sess.dir;
                } catch(e) {
                    // console.log('e', e);
                }
                // throw err;
            }
            // console.log('Success', stdout);
            // console.log('Err', stderr);
        });
        proc.stdout.setEncoding('utf8');
        // sess.proc = proc;
        // sess.dir = dir;
        // console.log("sess.proc.pid before", sess.proc.pid)

        proc.stderr.on('data', function(data) {
            // console.log('err', data.toString('utf8'));
            reject(data.toString('utf8'));
            // process.stderr.write(data);
        });
        proc.stdout.on('data', function(data) {
            // var data = JSON.parse(data);
            // console.log('data', data);
            results += data.replace(/\n|\r/g, "");
            // process.stdout.write(data);
        });
        proc.on('close', function(code, signal) {
            if(results) {
                resolve(results);
            } else {
                reject('empty results');
            }
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
        });
        proc.on('error', function(code, signal) {
            reject(code);
        });
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}

var getFromUrl = function(wallet_cli, commands) {
    var results = '';
    var promise = new Promise(function(resolve, reject) {
        var url = wallet_cli + '/' + commands.join('/');
        request({uri: url, method :"POST", json: true}, function (error, response, body) {
            if(error) {
                console.log('error', error)
                reject(error);
            } else {
                if(!body.err) {
                    resolve(body.results);
                } else {
                    reject(body.errMessage);
                }
            }
        });
    });
    return promise;
}
// var get_input_addresses = function(wallet, vin, vout) {
//     var promise = new Promise(function(resolve, reject) {
//         var addresses = [];
//         if (vin.coinbase) {
//             var amount = 0;
//             for (var i in vout) {
//                 amount = amount + parseFloat(vout[i].value);
//             }
//             addresses.push({hash: 'coinbase', amount: amount});
//             resolve(addresses);
//         } else {
//             getRawTransaction(wallet, vin.txid).then(function(tx){
//                 if (tx && tx.vout) {
//                     var loop = true;
//                     for(var j = 0; j < tx.vout.length && loop; j++) {
//                         if (tx.vout[i].n == vin.vout) {
//                             if (tx.vout[i].scriptPubKey.addresses && tx.vout[i].scriptPubKey.addresses.length) {
//                                 addresses.push({hash: tx.vout[i].scriptPubKey.addresses[0], amount: tx.vout[i].value});
//                             }
//                             loop = false;
//                         }
//                     }
//                     resolve(addresses);
//                 } else {
//                     resolve();
//                 }
//             }).catch(function(err) {
//                 resolve(addresses);
//             })
//         }
//     })
//     return promise;
// };
// var convert_to_satoshi = function(amount) {
//     var promise = new Promise(function(resolve, reject) {
//         // fix to 8dp & convert to string
//         var fixed = amount.toFixed(8).toString();
//         // remove decimal (.) and return integer
//         resolve(parseInt(fixed.replace('.', '')));
//     });
//     return promise;
// };
// var is_unique = function(array, object) {
//     var promise = new Promise(function(resolve, reject) {
//         var unique = true;
//         var index = null;
//         var loop = true;
//         for(var i = 0; i < array.length && loop; i++) {
//             if (array[i].addresses == object) {
//                 unique = false;
//                 index = i;
//                 loop = false;
//             }
//         }
//         resolve(unique, index);
//     });
//     return promise;
// };
// var prepare_vin =  function(tx) {
//     var promise = new Promise(function(resolve, reject) {
//         var arr_vin = [];
//         for (var i in tx.vin) {
//             get_input_addresses(tx.vin[i], tx.vout).then(function (addresses) {
//                 is_unique(arr_vin, addresses[0].hash).then(function(unique, index){
//                     if (unique == true) {
//                         convert_to_satoshi(parseFloat(addresses[0].amount).then(function(amount_sat){
//                             arr_vin.push({addresses: addresses[0].hash, amount: amount_sat});
//                         }));
//                     } else {
//                         convert_to_satoshi(parseFloat(addresses[0].amount).then(function(amount_sat){
//                             arr_vin[index].amount = arr_vin[index].amount + amount_sat;
//                         }));
//                     }
//                 }).catch(function (err) {
//
//                 })
//             }).catch(function (err) {
//
//             })
//         }
//         resolve(arr_vin)
//     });
//     return promise;
// };
// var prepare_vout = function(vout, txid, vin) {
//     var promise = new Promise(function(resolve, reject) {
//         var arr_vout = [];
//         var arr_vin = [];
//         arr_vin = vin;
//         for (var i in vout.length) {
//             if (vout[i].scriptPubKey.type != 'nonstandard' && vout[i].scriptPubKey.type != 'nulldata' && vout[i].scriptPubKey.addresses && vout[i].scriptPubKey.addresses.length) {
//                 is_unique(arr_vout, vout[i].scriptPubKey.addresses[0]).then(function (unique, index) {
//                     if (unique == true) {
//                         // unique vout
//                         convert_to_satoshi(parseFloat(vout[i].value).then(function (amount_sat) {
//                             arr_vout.push({addresses: vout[i].scriptPubKey.addresses[0], amount: amount_sat});
//                         }));
//                     } else {
//                         // already exists
//                         convert_to_satoshi(parseFloat(vout[i].value).then(function (amount_sat) {
//                             arr_vout[index].amount = arr_vout[index].amount + amount_sat;
//                         }));
//                     }
//                 })
//             }
//         }
//         if (vout[0].scriptPubKey.type == 'nonstandard') {
//             if (arr_vin.length > 0 && arr_vout.length > 0) {
//                 if (arr_vin[0].addresses == arr_vout[0].addresses) {
//                     //PoS
//                     arr_vout[0].amount = arr_vout[0].amount - arr_vin[0].amount;
//                     arr_vin.shift();
//                     resolve(arr_vout, arr_vin);
//                 } else {
//                     resolve(arr_vout, arr_vin);
//                 }
//             } else {
//                 resolve(arr_vout, arr_vin);
//             }
//         } else {
//             resolve(arr_vout, arr_vin);
//         }
//     });
//     return promise;
// };
// var calculate_total = function(vout) {
//     var promise = new Promise(function(resolve, reject) {
//         var total = 0;
//         for (var i in vout) {
//             total = total + vout[i].amount;
//         }
//         resolve(total);
//     });
//     return promise;
// };

var setForceStop = function(_forceStop) {
    forceStop = _forceStop;
}

var resetForceStop = function() {
    forceStop = false;
}

module.exports.startWallet = startWallet; // starting wallet
module.exports.stopWallet = stopWallet; // stopping wallet
module.exports.reindexWallet = reindexWallet; // stopping wallet
module.exports.rescanWallet = rescanWallet; // stopping wallet
module.exports.getBlockCount = getBlockCount; // returning current block count
module.exports.getBlock = getBlock; // returning block details
module.exports.getBlockHash = getBlockHash; // returning specific block hash by index position
module.exports.getAllBlocks = getAllBlocks; // getting all blocks hash
module.exports.reindex = reindex; // TODO
module.exports.getNewBlocks = getNewBlocks;  // TODO
module.exports.getAllMasternodes = getAllMasternodes; // getting all masternodes
module.exports.getMasternodeCount = getMasternodeCount; // getting masternode count
module.exports.getRawTransaction = getRawTransaction; // getting transaction details
module.exports.getRawTransactionFull = getRawTransactionFull; // getting transaction details with vin and vout


// module.exports.getMaxMoney = getMaxMoney;
// module.exports.getMaxVote = getMaxVote;
// module.exports.getVote = getVote;
// module.exports.getPhase = getPhase;
// module.exports.getReward = getReward;
// module.exports.getNextRewardEstimate = getNextRewardEstimate;
// module.exports.getNextRewardWhenstr = getNextRewardWhenstr;
module.exports.getConnectionCount = getConnectionCount;
module.exports.getInfo = getInfo;
module.exports.getTxoutsetInfo = getTxoutsetInfo;
module.exports.getPeerInfo = getPeerInfo;
module.exports.getDifficulty = getDifficulty;
module.exports.getNetworkHashps = getNetworkHashps;
module.exports.getMiningInfo = getMiningInfo;


module.exports.getAllBlocksCluster = getAllBlocksCluster;
module.exports.getAllBlocksClusterLiner = getAllBlocksClusterLiner;

module.exports.setForceStop = setForceStop;


// const TEN_MEGABYTES = 1000 * 1000 * 10;
// const options = {};
// const execFileOpts = { encoding: 'utf8' ,maxBuffer: TEN_MEGABYTES };
// startProc('fixd', ['-daemon'], execFileOpts, options);
// startProc('fix-cli', ['getinfo'], execFileOpts, options);
// startProc('fix-cli', ['getblockcount'], execFileOpts, options);
// startProc('fix-cli', ['getblockhash', '0'], execFileOpts, options);

// find all sync process
// ps aux | grep -i sync.js
// pkill -f sync.js

//  (echo y | nohup node /var/www/html/server/sync.js twins reindexclusterlinear)

// ps -ef | grep 'sync.js' | grep -v grep | awk '{print $2}' | xargs -r kill -9

// node /var/www/html/server/sync.js fix reindexclusterlinear | tee temp.log

//  node --max_old_space_size=4096 /var/www/html/server/sync.js fix calcvinvoutclusterlinear2




