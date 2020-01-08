const spawn = require('child_process').spawn;
const helpers = require('./helpers');
const settings = require('./wallets/all_settings');

const TEN_MEGABYTES = 1000 * 1000 * 10;
const options = {};
const execFileOpts = { encoding: 'utf8' ,maxBuffer: TEN_MEGABYTES };

var forceStop = false;

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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
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
        var start_wallet_command = settings[wallet]['commands']['startwallet'];
        var proc = spawn(wallet_daemon, [start_wallet_command], { execFileOpts, options }, function done(err, stdout, stderr) {
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            proc.stdin.end();
            proc.stdout.destroy();
            proc.stderr.destroy();
        });
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
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var stop_wallet_command = settings[wallet]['commands']['stopwallet'];
        var proc = spawn(wallet_cli, [stop_wallet_command], { execFileOpts, options }, function done(err, stdout, stderr) {
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
            // process.stdout.write(data);
        });
        proc.on('close', function(code, signal) {
            resolve(results);
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
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

var getBlockCount = function(wallet) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_count_command = settings[wallet]['commands']['getblockcount'];
        var proc = spawn(wallet_cli, [get_block_count_command], { execFileOpts, options }, function done(err, stdout, stderr) {
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
            resolve(results);
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
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

var getBlock = function(wallet, hash) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getblock'];
        var proc = spawn(wallet_cli, [get_block_command, hash.toString()], { execFileOpts, options }, function done(err, stdout, stderr) {
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}

var getBlockHash = function(wallet, index) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        if(isNaN(index)) {
            reject('index is not a number');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_hash_command = settings[wallet]['commands']['getblockhash'];
        var proc = spawn(wallet_cli, [get_block_hash_command, index.toString()], { execFileOpts, options }, function done(err, stdout, stderr) {
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
            }
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
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
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_allmasternodes_command = settings[wallet]['commands']['getallmasternodes'];
        var proc = spawn(wallet_cli, [get_allmasternodes_command], { execFileOpts, options }, function done(err, stdout, stderr) {
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}

var getMasternodeCount = function(wallet) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_allmasternodes_command = settings[wallet]['commands']['getmasternodecount'];
        var proc = spawn(wallet_cli, [get_allmasternodes_command], { execFileOpts, options }, function done(err, stdout, stderr) {
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}

var getRawTransaction = function(wallet, txid) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_rawtransaction_command = settings[wallet]['commands']['getrawtransaction'];
        var verbose = 1;
        var proc = spawn(wallet_cli, [get_rawtransaction_command, txid.toString(), verbose.toString()], { execFileOpts, options }, function done(err, stdout, stderr) {
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
                var tx = JSON.parse(results);
                resolve(tx);
            } else {
                reject('no tx found');
            }
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
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

var getRawTransactionFull = function(wallet, txid) {
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_rawtransaction_command = settings[wallet]['commands']['getrawtransaction'];
        var verbose = 1;
        var proc = spawn(wallet_cli, [get_rawtransaction_command, txid.toString(), verbose.toString()], { execFileOpts, options }, function done(err, stdout, stderr) {
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
            // process.stdout.write(data);
        });
        proc.on('close', function(code, signal) {
            if(results) {
                var tx = JSON.parse(results);
                var addreses_to_update = [];
                helpers.prepare_vin(wallet, tx).then(function (vin) {
                    helpers.prepare_vout(tx.vout, txid, vin).then(function (obj) {
                        for (var i = 0; i < vin.length; i++) {
                            // TODO update mongodb adress sceme
                            addreses_to_update.push({address: obj.nvin[i].addresses, txid: txid, amount: obj.nvin[i].amount, type: 'vin'})
                            // update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin')
                        }
                        for (var i = 0; i < obj.vout.length; i++) {
                            // TODO update mongodb adress sceme
                            addreses_to_update.push({address: obj.vout[i].addresses, txid: txid, amount: obj.vout[i].amount, type: 'vout'})
                            // update_address(vout[t].addresses, txid, vout[t].amount, 'vout')
                        }
                        helpers.calculate_total(obj.vout).then(function (total) {
                            // console.log(tx, nvin, vout, total, addreses_to_update)
                            resolve({tx: tx, nvin: obj.nvin, vout: obj.vout, total: total, addreses_to_update: addreses_to_update});
                        })
                    }).catch(function(err) {
                        console.log('error getting prepare_vout', err)
                    })
                })
            } else {
                reject('no tx found');
            }
            // console.log('code', code);
            // console.log('signal', signal);
            // console.log('spawn closed');
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

var getMaxMoney = function(wallet){
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getmaxmoney'];
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getMaxVote = function(wallet){
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getmaxvote'];
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getVote = function(wallet){
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getvote'];
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getPhase = function(wallet){
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getphase'];
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getReward = function(wallet){
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getreward'];
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getNextRewardEstimate = function(wallet){
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getnextrewardestimate'];
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getNextRewardWhenstr = function(wallet){
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getnextrewardwhenstr'];
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getConnectionCount = function(wallet){
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getconnectioncount'];
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getInfo = function(wallet){
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getinfo'];
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getPeerInfo = function(wallet){
    var results = "";
    var promise = new Promise(function(resolve, reject) {
        if(!settings[wallet]) {
            reject('this wallet do not exist in our system');
        }
        var wallet_cli = settings[wallet]['cli'];
        var get_block_command = settings[wallet]['commands']['getpeerinfo'];
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
        proc.on('exit', function (code) {
            // console.log('spawn exited with code ' + code);
            // proc.stdin.end();
            // proc.stdout.destroy();
            // proc.stderr.destroy();
        });
    });
    return promise;
}
var getDifficulty = function(wallet){
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




