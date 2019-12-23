var Tx = require('../models/tx');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Tx.find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function updateOne(obj, cb) { // update or create
    Tx.findOne({txid: obj.txid}, function(err, tx) {
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
            var newTx = new Tx({
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

function getOne(txid, cb) {
    Tx.findOne({txid: txid}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(txid, cb) {
    Tx.deleteOne({txid: txid}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Tx.deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function getTxBlockindex(blockindex, cb) {
    Tx.findOne({blockindex: blockindex}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function update(coin, options, cb) {
    Tx.updateOne({coin: coin}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}

module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.getTxBlockindex = getTxBlockindex;
module.exports.update = update;
