var Tx = require('../models/tx');
var TxVinVout = require('../models/txVinVout');
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

function getAll1(sortBy, order, limit, offset, cb) {
    var sort = {};
    sort[sortBy] = order;
    Tx[db.getCurrentConnection()].find({}).sort(sort).limit(limit).skip(offset).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function getAll2(where, fields, sortBy, order, limit, offset, cb) {
    var sort = {};
    if(sortBy) {
        sort[sortBy] = order == 'asc' ? 1 : -1;
    }
    Tx[db.getCurrentConnection()].find(where, fields).sort(sort).limit(limit).skip(offset).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}
function getAllCursor(where, fields, sortBy, order, limit, offset, cb) {
    var sort = {};
    if(sortBy) {
        sort[sortBy] = order == 'asc' ? 1 : -1;
    }
    var cursor = Tx[db.getCurrentConnection()].find(where, fields).sort(sort).limit(limit).skip(offset).cursor().addCursorFlag('noCursorTimeout', true);
    return cb(cursor);
}

function getAllJoin(fields, sortBy, order, limit, offset, cb) {
    var sort = {};
    sort[sortBy] = order;
    Tx[db.getCurrentConnection()].find({}, fields).sort(sort).limit(limit).skip(offset).exec( function(err, tx) {
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
            // tx.total = obj.total.toFixed(8);
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
                // total: obj.total.toFixed(8),
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

function deleteAllWhereGte(blockindex, cb) {
    Tx[db.getCurrentConnection()].deleteMany({blockindex: { $gte: blockindex }}, function(err, numberRemoved){
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

function estimatedDocumentCount(cb) {
    Tx[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function countByBlockIndex(cb) {
    Tx[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function getAllBlocks(sortBy, order, limit, offset, cb) {
    var sort = {};
    sort[sortBy] = order == 'asc' ? 1 : -1;
    Tx[db.getCurrentConnection()].aggregate([
        // { $limit : limit},
        // {$limit: limit },
        {
            $group:{
                _id:"$blockhash",
                blockindex: {"$first": "$blockindex"},
                timestamp: {"$first": "$timestamp"},
                // vout: {"$first": {$size: "$vout"}},
                // countTxs:{$sum:1}
            }
        },
        {$sort:sort},
        {$skip:offset},
        {$limit: limit }
        // {$group:{_id : "$blockindex", "blockhash": { "$first": "$blockhash" }, doc: { "$first": "$$ROOT" }}},
        // {$group:{_id:"$blockhash",items:{$push:{blockhash:"$blockhash"}}}},
        // {$project:{items:{$slice:["$items", 2]}}}
    ]).exec( function(err, tx) {
        // Tx[db.getCurrentConnection()].find({}).distinct('blockhash').exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function getAllTxWithVinVoutByHash(hash, sortBy, order, cb) {
    var sort = {};
    sort[sortBy] = order == 'asc' ? 1 : -1;
    Tx[db.getCurrentConnection()].aggregate([
        { $match : { blockhash : hash } },
        {
            "$lookup": {
                "from": TxVinVout[db.getCurrentConnection()].collection.name,
                "localField": "txid",
                "foreignField": "txid",
                // "pipeline":[
                // {"$unwind":"$vout"},
                // {"$match":{"$expr":{"$eq":["$$vin.vout","$vout.n"]}}}
                // ],
                "as": "vintx"
                // where vin.vout = vout[0].n
            }
        },
        {
            "$unwind": {
                "path": "$vintx",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "vout": { "$ifNull" : [ "$vintx.vout", [ ] ] },
                "vin": { "$ifNull" : [ "$vintx.vin", [ ] ] },
                "timestamp": "$vintx.timestamp",
                "blockindex": "$vintx.blockindex",
                "txid": "$vintx.txid",
                "type": "$vintx.type",
                "blockhash": "$vintx.blockhash",
                "createdAt": "$vintx.createdAt",
                "updatedAt": "$vintx.updatedAt",
            }
        },
        {
            "$unwind": {
                "path": "$vout",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $group: {
                _id: "$txid",
                totalAmount: { $sum: "$vout.amount" },
                "vout" : { "$push": "$vout" },
                "vin" : { "$first": "$vin" },
                "timestamp" : { "$first": "$timestamp" },
                "blockindex" : { "$first": "$blockindex" },
                "txid" : { "$first": "$txid" },
                "type" : { "$first": "$type" },
                "blockhash" : { "$first": "$blockhash" },
            }
        },
        {$sort:sort},
        // {$group:{_id : "$blockindex", "blockhash": { "$first": "$blockhash" }, doc: { "$first": "$$ROOT" }}},
        // {$group:{_id:"$blockhash",items:{$push:{blockhash:"$blockhash"}}}},
        // {$project:{items:{$slice:["$items", 2]}}}
    ]).exec( function(err, tx) {
        // Tx[db.getCurrentConnection()].find({}).distinct('blockhash').exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
    // Tx[db.getCurrentConnection()].find(where, fields).sort(sort).limit(limit).skip(offset).exec( function(err, tx) {
    //     if(tx) {
    //         return cb(tx);
    //     } else {
    //         return cb();
    //     }
    // });
}

function getBlockHashJoin(txid, cb) {
    Tx[db.getCurrentConnection()].aggregate([
        { $match : { txid : txid } },
        {
            "$project": {
                "vout": { "$ifNull" : [ "$vout", [ ] ] },
                "vin": { "$ifNull" : [ "$vin", [ ] ] },
                "timestamp": 1,
                "blockindex": 1,
                "txid": 1,
                "blockhash": 1,
                "createdAt": 1,
                "updatedAt": 1
            }
        },
        {
            "$unwind": {
                "path": "$vin",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": Tx[db.getCurrentConnection()].collection.name,
                "localField": "vin.txid",
                "foreignField": "txid",
                // "pipeline":[
                    // {"$unwind":"$vout"},
                    // {"$match":{"$expr":{"$eq":["$$vin.vout","$vout.n"]}}}
                // ],
                "as": "vin.tx"
                // where vin.vout = vout[0].n
            }
        },
        {
            "$unwind": {
                "path": "$vin.tx",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$group": {
                "_id": "$_id",
                "vout" : { "$first": "$vout" },
                "vin" : { "$push": { txs: {txid: "$vin.tx.txid", vout: "$vin.tx.vout"}, vout: "$vin.vout", txid: "$vin.txid", blockindex: "$blockindex", coinbase: "coinbase", sequence: "sequence"} },
                "timestamp" : { "$first": "$timestamp" },
                "blockindex" : { "$first": "$blockindex" },
                "txid" : { "$first": "$txid" },
                "blockhash" : { "$first": "$blockhash" },
                "createdAt": { "$first": "$createdAt" },
                "updatedAt": { "$first": "$updatedAt" }
            }
        }
    ]).allowDiskUse(true).exec(function(err, tx) {
        if(tx && tx.length) {
            return cb(tx[0]);
        } else {
            return cb(null);
        }
    });
}

function getAll2Join(fields, sortBy, order, limit, offset, cb) {
    var sort = {};
    sort[sortBy] = order == 'asc' ? 1 : -1;
    Tx[db.getCurrentConnection()].aggregate([
        {$sort:sort},
        {$skip:offset},
        { $limit : limit },
        {
            "$project": {
                "vout": { "$ifNull" : [ "$vout", [ ] ] },
                "vin": { "$ifNull" : [ "$vin", [ ] ] },
                "timestamp": 1,
                "blockindex": 1,
                "txid": 1,
                "blockhash": 1,
                "createdAt": 1,
                "updatedAt": 1
            }
        },
        {
            "$unwind": {
                "path": "$vin",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": Tx[db.getCurrentConnection()].collection.name,
                "localField": "vin.txid",
                "foreignField": "txid",
                // "pipeline":[
                // {"$unwind":"$vout"},
                // {"$match":{"$expr":{"$eq":["$$vin.vout","$vout.n"]}}}
                // ],
                "as": "vin.tx"
                // where vin.vout = vout[0].n
            }
        },
        {
            "$unwind": {
                "path": "$vin.tx",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$unwind": {
                "path": "$vout",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$group": {
                "_id": "$_id",
                "vout" : { "$push":{
                        value: "$vout.value",
                        n: "$vout.n",
                        scriptPubKey: {
                            addresses: "$vout.scriptPubKey.addresses",
                            type: "$vout.scriptPubKey.type"
                        }
                    }
                },
                "vin" : { "$push": {
                        txs: {txid: "$vin.tx.txid", vout: "$vin.tx.vout"},
                        vout: "$vin.vout",
                        txid: "$vin.txid",
                        blockindex: "$blockindex",
                        coinbase: "coinbase",
                        sequence: "sequence"
                    }
                },
                // "vin" : { "$push": { txs: {txid: "$vin.tx.txid", vout: { "$push":{ value: "$vin.tx.vout.value", n: "$vin.tx.vout.n", scriptPubKey: {addresses: "$vin.vout.tx.scriptPubKey.addresses", type: "$vin.vout.tx.scriptPubKey.type"} }}}, vout: "$vin.vout", txid: "$vin.txid", blockindex: "$blockindex", coinbase: "coinbase", sequence: "sequence"} },
                "timestamp" : { "$first": "$timestamp" },
                "blockindex" : { "$first": "$blockindex" },
                "txid" : { "$first": "$txid" },
                "blockhash" : { "$first": "$blockhash" },
                "createdAt": { "$first": "$createdAt" },
                "updatedAt": { "$first": "$updatedAt" }
            }
        },
        {$sort:sort},
    ]).allowDiskUse(true).exec(function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            console.log(err)
            return cb(null);
        }
    });
}

function getAllDuplicate(cb) {
    Tx[db.getCurrentConnection()].aggregate([
        {
            $group : {
                "_id": "$txid",
                "count": {$sum: 1}
            }
        },
        {"$match": {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} } },
    ]).exec(function(err, results) {
        cb(results);
    })
}

module.exports.getAll = getAll;
module.exports.getAll1 = getAll1;
module.exports.getAll2 = getAll2;
module.exports.getAllCursor = getAllCursor;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.deleteAllWhereGte = deleteAllWhereGte;
module.exports.getTxBlockByTxid = getTxBlockByTxid;
module.exports.getTxBlockByHash = getTxBlockByHash;
module.exports.update = update;
module.exports.count = count;
module.exports.estimatedDocumentCount = estimatedDocumentCount;
module.exports.countByBlockIndex = countByBlockIndex;
module.exports.getBlockHashJoin = getBlockHashJoin;
module.exports.getAll2Join = getAll2Join;
module.exports.getAllBlocks = getAllBlocks;
module.exports.getAllTxWithVinVoutByHash = getAllTxWithVinVoutByHash;
module.exports.getAllDuplicate = getAllDuplicate;
