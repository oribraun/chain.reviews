var Stats = require('../models/stats');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Stats[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, stats) {
        if(stats) {
            return cb(stats);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    Stats[db.getCurrentConnection()].findOne({coin: obj.coin}, function(err, stats) {
        if(err) {
            return cb(err);
        }
        if(stats) { // exist
            // console.log('exist', tx._id)
            // tx.txid = obj.txid;
            stats.last_block = obj.last_block;
            stats.difficulty = obj.difficulty;
            stats.moneysupply = obj.moneysupply;
            stats.hashrate = obj.hashrate;
            stats.supply = obj.supply;
            stats.blockcount = obj.blockcount;
            stats.connections = obj.connections;
            stats.masternodesCount = obj.masternodesCount;
            stats.last_price = obj.last_price;
            stats.users_tx_count = obj.users_tx_count;
            stats.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else { // create new
            // console.log('new')
            var newStats = new Stats[db.getCurrentConnection()]({
                coin: obj.coin,
                last_block: obj.last_block,
                difficulty: obj.difficulty,
                moneysupply: obj.moneysupply,
                hashrate: obj.hashrate,
                supply: obj.supply,
                blockcount: obj.blockcount,
                connections: obj.connections,
                masternodesCount: obj.masternodesCount,
                last_price: obj.last_price,
                users_tx_count: obj.users_tx_count,
            });

            newStats.save(function(err) {
                if (err) {
                    console.log(err);
                    return cb();
                } else {
                    // console.log("initial stats entry created for %s", obj.coin);
                    //console.log(newStats);
                    return cb();
                }
            });
        }
    });
}

function getOne(coin, cb) {
    Stats[db.getCurrentConnection()].findOne({coin: coin}, function(err, stats) {
        if(stats) {
            return cb(stats);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(coin, cb) {
    Stats[db.getCurrentConnection()].deleteOne({coin: coin}, function(err, stats) {
        if(stats) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Stats[db.getCurrentConnection()].remove({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function update(coin, options, cb) {
    Stats[db.getCurrentConnection()].updateOne({coin: coin}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}

function count(cb) {
    Stats[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function estimatedDocumentCount(cb) {
    Stats[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function checkStats(coin, cb) {
    Stats[db.getCurrentConnection()].findOne({coin: coin}, function(err, stats) {
        if(stats) {
            return cb(true);
        } else {
            return cb(false);
        }
    });
}
function getStats(coin, cb) {
    Stats[db.getCurrentConnection()].findOne({coin: coin}, function(err, stats) {
        if(stats) {
            return cb(stats);
        } else {
            return cb(null);
        }
    });
}
function createStats(coin, cb) {
    var newStats = new Stats[db.getCurrentConnection()]({
        coin: coin,
    });

    newStats.save(function(err) {
        if (err) {
            console.log(err);
            return cb();
        } else {
            // console.log("initial stats entry created for %s", coin);
            //console.log(newStats);
            return cb();
        }
    });
}
function emptyStats(cb) {
    Stats[db.getCurrentConnection()].remove({}, function(err) {
        if(err) console.log(err);
    });
}

function updateWalletStats(obj, cb) { // update or create
    Stats[db.getCurrentConnection()].findOne({coin: obj.coin}, function(err, stats) {
        if(err) {
            return cb(err);
        }
        if(stats) { // exist
            stats.last_block = obj.last_block;
            stats.difficulty = obj.difficulty;
            stats.moneysupply = obj.moneysupply;
            stats.hashrate = obj.hashrate;
            stats.blockcount = obj.blockcount;
            stats.connections = obj.connections;
            if(obj.masternodesCount) {
                stats.masternodesCount = obj.masternodesCount;
            }
            if(obj.masternodesCountByCollateral) {
                stats.masternodesCountByCollateral = obj.masternodesCountByCollateral;
            }
            stats.supply = obj.supply;
            stats.version = obj.version;
            stats.protocol = obj.protocol;
            stats.users_tx_count_24_hours = obj.users_tx_count_24_hours;
            stats.users_tx_chart = obj.users_tx_chart;
            stats.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else { // create new
            // console.log('new')
            var newStats = new Stats[db.getCurrentConnection()]({
                coin: obj.coin,
                last_block: obj.last_block,
                difficulty: obj.difficulty,
                moneysupply: obj.moneysupply,
                hashrate: obj.hashrate,
                blockcount: obj.blockcount,
                connections: obj.connections,
                masternodesCount: obj.masternodesCount,
                masternodesCountByCollateral: obj.masternodesCountByCollateral,
                supply: obj.supply,
                version: obj.version,
                protocol: obj.protocol,
                users_tx_count_24_hours: obj.users_tx_count_24_hours,
                users_tx_chart: obj.users_tx_chart,
            });

            newStats.save(function(err) {
                if (err) {
                    console.log(err);
                    return cb();
                } else {
                    // console.log("initial stats entry created for %s", obj.coin);
                    //console.log(newStats);
                    return cb();
                }
            });
        }
    });
}

function updateWalletExtraStats(obj, cb) { // update or create
    Stats[db.getCurrentConnection()].findOne({coin: obj.coin}, function(err, stats) {
        if(err) {
            return cb(err);
        }
        if(stats) { // exist
            stats.total_wallets_count = obj.total_wallets_count;
            stats.active_wallets_count = obj.active_wallets_count;
            stats.dev_wallet_balance = obj.dev_wallet_balance;
            stats.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else {
            return cb();
        }
    });
}

module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.update = update;
module.exports.count = count;
module.exports.estimatedDocumentCount = estimatedDocumentCount;
module.exports.updateWalletStats = updateWalletStats;
module.exports.updateWalletExtraStats = updateWalletExtraStats;
