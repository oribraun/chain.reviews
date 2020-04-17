var TxVinVout = require('../models/txVinVout');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    TxVinVout[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, tx) {
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
    TxVinVout[db.getCurrentConnection()].find({}).sort(sort).limit(limit).skip(offset).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function getAll2(where, fields, sortBy, order, limit, offset, cb) {
    var sort = {};
    sort[sortBy] = order == 'asc' ? 1 : -1;
    TxVinVout[db.getCurrentConnection()].find(where, fields).sort(sort).skip(parseInt(offset) * parseInt(limit)).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function updateOne(obj, cb) { // update or create
    TxVinVout[db.getCurrentConnection()].findOne({txid: obj.txid}, function(err, tx) {
        if(err) {
            return cb(err);
        }
        if(tx) { // exist
            // tx.txid = obj.txid;
            tx.vin = obj.vin;
            tx.vout = obj.vout;
            tx.type = obj.type;
            tx.timestamp = obj.timestamp;
            tx.total = obj.total.toFixed(8);
            tx.blockindex = obj.blockindex;
            tx.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else { // create new
            // console.log('new')
            var newTxVinVout = new TxVinVout[db.getCurrentConnection()]({
                txid: obj.txid,
                vin: obj.vin,
                vout: obj.vout,
                type: obj.type,
                timestamp : obj.timestamp,
                total: obj.total.toFixed(8),
                blockindex: obj.blockindex,
            });
            newTxVinVout.save(function(err) {
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

function saveType(obj, cb) {
    // db.txvinvouts.update(   {},   { $set: {type: 0} },   false,   true )
    TxVinVout[db.getCurrentConnection()].updateOne({_id: obj._id},{$set: {type: obj.type}}, function(err){
        if(err) {
            cb(err)
        } else {
            cb();
        }
    })
}
function getOne(blockindex, cb) {
    TxVinVout[db.getCurrentConnection()].findOne({blockindex: blockindex}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(txid, cb) {
    TxVinVout[db.getCurrentConnection()].deleteOne({txid: txid}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    TxVinVout[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function deleteAllWhereGte(blockindex, cb) {
    TxVinVout[db.getCurrentConnection()].deleteMany({blockindex: { $gte: blockindex }}, function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function getTxBlockByTxid(txid, cb) {
    TxVinVout[db.getCurrentConnection()].findOne({txid: txid}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function getTxBlockFieldsByTxid(txid, fields, cb) {
    TxVinVout[db.getCurrentConnection()].findOne({txid: txid}, fields, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function update(coin, options, cb) {
    TxVinVout[db.getCurrentConnection()].updateOne({coin: coin}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}

function count(cb) {
    TxVinVout[db.getCurrentConnection()].countDocuments({}, function (err, count) {
       if(err) {
           cb()
       } else {
           cb(count);
       }
    });
}

function estimatedDocumentCount(cb) {
    TxVinVout[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function countWhereTotal(cb) {
    TxVinVout[db.getCurrentConnection()].find({total: {$gt: 0}}).countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function countByBlockIndex(cb) {
    TxVinVout[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function getAllDuplicate(cb) {
    TxVinVout[db.getCurrentConnection()].aggregate([
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

function getTransactionsChart2(date, cb) {
    // var sort = {};
    // sort[sortBy] = order == 'asc' ? 1 : -1;
    // TxVinVout[db.getCurrentConnection()].find({total: {$gt: 0}, timestamp: {$gt: 1585515306}}).sort({blockindex:-1}).exec( function(err, tx) {
    //     if(tx) {
    //         return cb(tx.length);
    //     } else {
    //         return cb();
    //     }
    // });
    TxVinVout[db.getCurrentConnection()].aggregate([
        {$match: {total: {$gt: 0}}},
        {$project: {
                "_id": "_id",
                "total": "$total",
                "blockindex": "$blockindex",
                "date1": {
                    $dateToParts: { date: {
                            "$add": [
                                new Date(new Date(0).getTime() + new Date().getTimezoneOffset()*60*1000),
                                {"$multiply": ["$timestamp", 1000]}
                            ]
                        }
                    }
                },
                "date2": {
                    $dateToParts: { date: {
                            "$add": [
                                new Date(0), // GTM+2
                                {"$multiply": ["$timestamp", 1000]}
                            ]
                        }
                    }
                },
                "date": {
                    $dateToString: {
                        date: {
                            "$add": [
                                new Date(0), // GTM+2
                                {"$multiply": ["$timestamp", 1000]}
                            ]
                        },
                        format: "%Y-%m-%d"
                    }
                },
                "year": {
                    "$year": {
                        "$add": [
                            new Date(0),
                            {"$multiply": ["$timestamp", 1000]}
                        ]
                    }
                },
                "month": {
                    "$month": {
                        "$add": [
                            new Date(0),
                            {"$multiply": ["$timestamp", 1000]}
                        ]
                    }
                },
                "day": {
                    "$dayOfMonth": {
                        "$add": [
                            new Date(0),
                            {"$multiply": ["$timestamp", 1000]}
                        ]
                    }
                },
                "week": {
                    "$isoWeek": {
                        "$add": [
                            new Date(0),
                            {"$multiply": ["$timestamp", 1000]}
                        ]
                    }
                },
                "timestamp": "$timestamp"
            }},
        {$match: {year: {$gt: 1970}}},
        {$group: {
                "_id": {
                    "year": "$year",
                    "month": "$month",
                    "day": "$day"
                    // "week": "$week"
                },
                "week": {$first: "$week"},
                "date": {$first: "$date"},
                "timestamp": {$first: "$timestamp"},
                "count" : { "$sum" : 1 },
                "totalAmountADay" : { "$sum" : "$total" }
            }},
        {$sort:{timestamp:-1}},
        // // {$limit: 1},
        {$project: {
                "_id": 0,
                "date": "$date",
                "week": "$week",
                "count": "$count",
                "totalAmountADay": "$totalAmountADay",
            }}
    ]).allowDiskUse(true).exec( function(err, txs) {
        // Tx[db.getCurrentConnection()].find({}).distinct('blockhash').exec( function(err, tx) {
        console.log('err', err)
        if(txs) {
            return cb(txs);
        } else {
            return cb();
        }
    });
}

function getTransactionsChart(date, cb) {
    var aggregate = [];
    aggregate.push({$match: {total: {$gt: 0}}});
    if(date) {
        var timestamp = new Date(date).getTime() / 1000;
        aggregate.push({$match: {timestamp: {$gte: timestamp }}});
    }
    aggregate.push({$project: {
            "_id": "_id",
            "total": "$total",
            "blockindex": "$blockindex",
            "date1": {
                $dateToParts: { date: {
                        "$add": [
                            new Date(new Date(0).getTime() + new Date().getTimezoneOffset()*60*1000),
                            {"$multiply": ["$timestamp", 1000]}
                        ]
                    }
                }
            },
            "date2": {
                $dateToParts: { date: {
                        "$add": [
                            new Date(0), // GTM+2
                            {"$multiply": ["$timestamp", 1000]}
                        ]
                    }
                }
            },
            "date": {
                $dateToString: {
                    date: {
                        "$add": [
                            new Date(0), // GTM+2
                            {"$multiply": ["$timestamp", 1000]}
                        ]
                    },
                    format: "%Y-%m-%d"
                }
            },
            "year": {
                "$year": {
                    "$add": [
                        new Date(0),
                        {"$multiply": ["$timestamp", 1000]}
                    ]
                }
            },
            "month": {
                "$month": {
                    "$add": [
                        new Date(0),
                        {"$multiply": ["$timestamp", 1000]}
                    ]
                }
            },
            "day": {
                "$dayOfMonth": {
                    "$add": [
                        new Date(0),
                        {"$multiply": ["$timestamp", 1000]}
                    ]
                }
            },
            "week": {
                "$isoWeek": {
                    "$add": [
                        new Date(0),
                        {"$multiply": ["$timestamp", 1000]}
                    ]
                }
            },
            "timestamp": "$timestamp"
        }});
    aggregate.push({$match: {year: {$gt: 1970}}});
    aggregate.push({$group: {
            "_id": {
                "year": "$year",
                "month": "$month",
                "day": "$day"
                // "week": "$week"
            },
            "week": {$first: "$week"},
            "date": {$first: "$date"},
            "timestamp": {$first: "$timestamp"},
            "count" : { "$sum" : 1 },
            "totalAmountADay" : { "$sum" : "$total" }
        }});
    aggregate.push({$sort:{timestamp:1}});
    aggregate.push({$project: {
            "_id": 0,
            "date": "$date",
            "week": "$week",
            "count": "$count",
            "totalAmountADay": "$totalAmountADay",
        }});
    TxVinVout[db.getCurrentConnection()].aggregate(
        aggregate
    ).allowDiskUse(true).exec( function(err, txs) {
        if(txs) {
            return cb(txs);
        } else {
            return cb();
        }
    });
}

module.exports.getAll = getAll;
module.exports.getAll1 = getAll1;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.deleteAllWhereGte = deleteAllWhereGte;
module.exports.getTxBlockByTxid = getTxBlockByTxid;
module.exports.update = update;
module.exports.count = count;
module.exports.estimatedDocumentCount = estimatedDocumentCount;
module.exports.countWhereTotal = countWhereTotal;
module.exports.countByBlockIndex = countByBlockIndex;
module.exports.getAll2 = getAll2;
module.exports.getAllDuplicate = getAllDuplicate;
module.exports.getTransactionsChart = getTransactionsChart;
module.exports.saveType = saveType;
module.exports.getTxBlockFieldsByTxid = getTxBlockFieldsByTxid;
