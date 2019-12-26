var Stats = require('../models/stats');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Stats[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
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
            stats.count = obj.count;
            stats.last = obj.last;
            stats.supply = obj.supply;
            stats.connections = obj.connections;
            stats.last_price = obj.last_price;
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
                count: obj.count,
                last: obj.last,
                supply: obj.supply,
                connections: obj.connections,
                last_price: obj.last_price,
            });

            newStats.save(function(err) {
                if (err) {
                    console.log(err);
                    return cb();
                } else {
                    console.log("initial stats entry created for %s", obj.coin);
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
    Stats[db.getCurrentConnection()].deleteOne({coin: coin}, function(err, tx) {
        if(tx) {
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
            console.log("initial stats entry created for %s", coin);
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

module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.update = update;
module.exports.count = count;
