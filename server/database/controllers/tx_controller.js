var Tx = require('../models/tx');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Tx[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function updateOne(obj, cb) { // update or create
    Tx[db.getCurrentConnection()].findOne({txid: obj.txid}, function(err, tx) {
        if(err) {
            return cb(err);
        }
        if(tx) { // exist
            // console.log('exist', tx._id)
            // tx.txid = obj.txid;
            tx.vin = obj.vin;
            tx.vout = obj.vout;
            tx.total = obj.total.toFixed(8);
            tx.timestamp = obj.timestamp;
            tx.blockhash = obj.blockhash;
            tx.blockindex = obj.blockindex;
            tx.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
            // Tx.replaceOne({ _id: tx._id}, {
            //     vin: obj.vin,
            //     vout: obj.vout,
            //     total: obj.total.toFixed(8),
            //     timestamp: tx.time,
            //     blockhash: tx.blockhash,
            //     blockindex: tx.height,
            // }, function (err, tx) {
            //     if (err) {
            //         return cb(err);
            //     } else {
            //         return cb();
            //     }
            // });
        } else { // create new
            // console.log('new')
            var newTx = new Tx[db.getCurrentConnection()]({
                txid: obj.txid,
                vin: obj.vin,
                vout: obj.vout,
                total: obj.total.toFixed(8),
                timestamp: obj.timestamp,
                blockhash: obj.blockhash,
                blockindex: obj.blockindex,
            });
            newTx.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            });
        }
    });
}

function getOne(blockindex, cb) {
    Tx[db.getCurrentConnection()].findOne({blockindex: blockindex}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(txid, cb) {
    Tx[db.getCurrentConnection()].deleteOne({txid: txid}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Tx[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function getTxBlockByTxid(txid, cb) {
    Tx[db.getCurrentConnection()].findOne({txid: txid}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function getTxBlockByHash(blockhash, cb) {
    Tx[db.getCurrentConnection()].findOne({blockhash: blockhash}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function update(coin, options, cb) {
    Tx[db.getCurrentConnection()].updateOne({coin: coin}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}

function count(cb) {
    Tx[db.getCurrentConnection()].countDocuments({}, function (err, count) {
       if(err) {
           cb()
       } else {
           cb(count);
       }
    });
}

module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.getTxBlockByTxid = getTxBlockByTxid;
module.exports.getTxBlockByHash = getTxBlockByHash;
module.exports.update = update;
module.exports.count = count;
