var TxVinVout = require('../models/txVinVout');
var db = require('./../db');
var tx_types = require('./../../tx_types');

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
    if(sortBy) {
        sort[sortBy] = order == 'asc' ? 1 : -1;
    }
    TxVinVout[db.getCurrentConnection()].find(where, fields).lean().sort(sort).skip(parseInt(offset) * parseInt(limit)).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            if(err) {
                console.log('err', err)
            }
            return cb();
        }
    });
}

function getAll3(pageOrder, fields, sortBy, order, limit, cb) {
    var sort = {};
    var sortOposite = {};
    if(sortBy) {
        sort[sortBy] = order == 'asc' ? 1 : -1;
        sortOposite[sortBy] = order == 'desc' ? 1 : -1;
    }
    var where = {};
    var whereforLastPageId = {};
    where.total =  {$gt: 0};
    whereforLastPageId.total =  {$gt: 0};
    TxVinVout[db.getCurrentConnection()].find({}).lean().sort({order: -1}).limit(1).exec( function(err, lastOrder) {
        var currentOrderNumber = lastOrder[0].order;
        if (pageOrder) {
            var currentOrderNumber = pageOrder;
            // var objID = mongoose.Types.ObjectId(id);
        }
        where.order = {$lte: currentOrderNumber};
        whereforLastPageId.order = {$gt: currentOrderNumber};
        // {_id: {$gt: mongoose.Types.ObjectId("5ea6c33cbb8e5e68440f1d3a")}, total: {$gt: 0}}
        // getting data
        TxVinVout[db.getCurrentConnection()].find(where, fields).lean().sort(sort).limit(limit).exec(function (err, txs) {
            TxVinVout[db.getCurrentConnection()].find(where, fields).lean().sort(sort).skip(limit).limit(1).exec(function (err, nextPageDocument) {
                TxVinVout[db.getCurrentConnection()].find(whereforLastPageId, fields).lean().sort(sortOposite).skip(limit - 1).limit(1).exec(function (err, lastPageDocument) {
                    var results = {};
                    if (txs && txs.length) {
                        results.txs = txs;
                        // results.txs_count = txs.length;
                        results.nextPageOrder = "";
                        results.lastPageOrder = "";
                        results.currentPageOrder = currentOrderNumber;
                        if(nextPageDocument && nextPageDocument.length) {
                            results.nextPageOrder = nextPageDocument[0].order;
                        }
                        if (lastPageDocument && lastPageDocument.length) {
                            results.lastPageOrder = lastPageDocument[0].order;
                        }
                        return cb(results);
                    } else {
                        return cb();
                    }
                });
            })
        });
    })
}

function getAll4(fields, sortBy, order, limit, offset, cb) {
    this.estimatedDocumentCount(function(count) {
        var sort = {};
        var sortOposite = {};
        if (sortBy) {
            sort[sortBy] = order == 'asc' ? 1 : -1;
            sortOposite[sortBy] = order == 'desc' ? 1 : -1;
        }
        var aggregate = [];
        // aggregate.push({$match: {total:  {$gt: 0}}});
        aggregate.push({$sort: sort});
        if (offset) {
            // aggregate.push({$skip: offset*limit});
            aggregate.push({$match: {order: {$lte: count - offset * limit}}});
        }
        aggregate.push({$limit: limit});
        aggregate.push({$project: fields});
        TxVinVout[db.getCurrentConnection()].aggregate(aggregate).exec(function (err, results) {
            return cb(results);
        })
    })
}

function getAll5(pageOrder, fields, sortBy, order, limit, offset, cb) {
    var sort = {};
    var sortOposite = {};
    if(sortBy) {
        sort[sortBy] = order == 'asc' ? 1 : -1;
        sortOposite[sortBy] = order == 'desc' ? 1 : -1;
    }
    var where = {};
    var whereforLastPageId = {};
    where.total =  {$gt: 0};
    whereforLastPageId.total =  {$gt: 0};
    var numberOfPagesToFetch = 10;
    TxVinVout[db.getCurrentConnection()].find({}).lean().sort({order: -1}).limit(1).exec( function(err, lastOrder) {
        var currentOrderNumber = lastOrder[0].order;
        if (pageOrder) {
            currentOrderNumber = pageOrder;
            // var objID = mongoose.Types.ObjectId(id);
        }
        where.order = {$lte: currentOrderNumber};
        whereforLastPageId.order = {$gt: currentOrderNumber};
        // {_id: {$gt: mongoose.Types.ObjectId("5ea6c33cbb8e5e68440f1d3a")}, total: {$gt: 0}}
        // getting data
        TxVinVout[db.getCurrentConnection()].find(where, fields).lean().sort(sort).limit(limit).exec(function (err, txs) {
            TxVinVout[db.getCurrentConnection()].find(where, fields).lean().sort(sort).skip(limit).limit(limit*numberOfPagesToFetch).exec(function (err, nextPageDocument) {
                TxVinVout[db.getCurrentConnection()].find(whereforLastPageId, fields).lean().sort(sortOposite).skip(limit - 1).limit(limit*numberOfPagesToFetch).exec(function (err, lastPageDocument) {
                    var results = {};
                    if (txs && txs.length) {
                        results.txs = txs;
                        // results.txs_count = txs.length;
                        // results.nextPageOrder = "";
                        // results.lastPageOrder = "";
                        results.currentPageOrder = currentOrderNumber;
                        // if(nextPageDocument && nextPageDocument.length) {
                        //     results.nextPageOrder = nextPageDocument[0].order;
                        // }
                        // if (lastPageDocument && lastPageDocument.length) {
                        //     results.lastPageOrder = lastPageDocument[0].order;
                        // }
                        // results.nextPageDocumentLength = nextPageDocument.length;
                        // results.lastPageDocumentLength = lastPageDocument.length;
                        results.nextPages = {};
                        results.lastPages = {};
                        // results.offset = offset;
                        var count = 1, i = 0;
                        for(i = 0; i < nextPageDocument.length; i += limit) {
                            count++;
                            results.nextPages[offset + count] = nextPageDocument[i].order;
                        }
                        count = 1, i = 0;
                        var lastPageOffset = 0;
                        var currentOffset = offset - numberOfPagesToFetch;
                        if(currentOffset > 0) {
                            lastPageOffset = currentOffset;
                        }
                        for(i = 0; i < lastPageDocument.length; i += limit) {
                            results.lastPages[lastPageOffset + count] = lastPageDocument[lastPageDocument.length - i - 1].order;
                            count++;
                        }
                        return cb(results);
                    } else {
                        return cb();
                    }
                });
            })
        });
    })
}

function getAllAggregeate(where, fields, sortBy, order, limit, offset, cb) {
    var sort = {};
    if(sortBy) {
        sort[sortBy] = order == 'asc' ? 1 : -1;
    }
    var aggregate = [];
    aggregate.push({$match: where});
    if(Object.keys(fields).length) {
        aggregate.push({$project: fields});
    }
    aggregate.push({$sort: sort});
    aggregate.push({$skip: parseInt(offset) * parseInt(limit)});
    aggregate.push({$limit: limit});
    TxVinVout[db.getCurrentConnection()].aggregate(
        aggregate
    ).allowDiskUse(true).exec( function(err, txs) {
        if(txs) {
            return cb(txs);
        } else {
            if(err) {
                console.log('err', err)
            }
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
            tx.order = obj.order;
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
                order: obj.order,
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
    var yearFromNowTimestamp = new Date(new Date().getTime() - 1000*60*60*24*365).getTime() / 1000;
    // TxVinVout[db.getCurrentConnection()].find({total: {$gt: 0}, timestamp: {$gte: yearFromNowTimestamp }}, {}).lean().countDocuments({}, function (err, count) {
    TxVinVout[db.getCurrentConnection()].find({total: {$gt: 0}}, {}).lean().countDocuments({}, function (err, count) {
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
    var yearFromNowTimestamp = new Date(new Date().getTime() - 1000*60*60*24*365).getTime() / 1000;
    aggregate.push({$match: {timestamp: {$gte: yearFromNowTimestamp }}}); // limit to year a head
    if(date) {
        var d = new Date(date);
        var timestamp = d.getTime() / 1000;
        var tenDaysFromNow = timestamp +(10*24*60*60*1000);
        aggregate.push({$match: {timestamp: {$gte: timestamp, $lt: tenDaysFromNow }}});
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

function getUsersTxsCount(cb) {
    TxVinVout[db.getCurrentConnection()].find({type: {$eq: tx_types.NORMAL}}, {}).countDocuments(function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function getUsersTxsCount24Hours(cb) {
    // TxVinVout[db.getCurrentConnection()].find({type: {$eq: tx_types.NORMAL}, timestamp: {$gte : Date.now() / 1000 - 24*60*60}}, {_id: 0}).countDocuments(function(err, tx) {
    //     if(tx) {
    //         return cb(tx);
    //     } else {
    //         return cb();
    //     }
    // });
    TxVinVout[db.getCurrentConnection()].aggregate([
        {$sort: {"blockindex": -1}},
        {$limit: 100000},
        {"$match" : {timestamp:{$gte: Date.now() / 1000 - 24*60*60}}},
        {"$match" : {type: {$eq: tx_types.NORMAL}}},
        {$group: {_id: 0, count: {$sum: 1}}}
    ]).exec(function(err, tx) {
        if(err) {
            console.log(err);
        }
        if(tx) {
            if(tx.length) {
                return cb(tx[0].count);
            } else {
                return cb(0);
            }
        } else {
            return cb();
        }
    })
}

function getUsersTxsWeeklyChart(cb) {
    // TxVinVout[db.getCurrentConnection()].find({type: {$eq: tx_types.NORMAL}, timestamp: {$gte : Date.now() / 1000 - 24*60*60}}, {_id: 0}).countDocuments(function(err, tx) {
    //     if(tx) {
    //         return cb(tx);
    //     } else {
    //         return cb();
    //     }
    // });
    TxVinVout[db.getCurrentConnection()].aggregate([
        {$sort:{timestamp:-1}},
        // {$limit: 100000},
        {"$match" : {timestamp:{$gte: Date.now() / 1000 - 7*24*60*60}}},
        {"$match" : {type: {$eq: tx_types.NORMAL}}},
        {$project: {
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
                "hour": {
                    "$hour": {
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
                "total": "$total",
                "timestamp": "$timestamp"
            }
        },
        {$group: {
                "_id": {
                    "year": "$year",
                    "month": "$month",
                    "day": "$day",
                    "hour": "$hour"
                    // "week": "$week"
                },
                "week": {$first: "$week"},
                "date": {$first: "$date"},
                "hour": {$first: "$hour"},
                "timestamp": {$first: "$timestamp"},
                "count" : { "$sum" : 1 },
                "totalAmountADay" : { "$sum" : "$total" }
            }},
        {$sort:{_id:1}},
        {$project: {
                "_id": 0,
                "date": 1,
                "hour": 1,
                "count": 1,
            }
        },
    ]).allowDiskUse(true).exec(function(err, txs) {
        if(err) {
            console.log(err);
        }
        if(txs) {
            return cb(txs);
        } else {
            return cb();
        }
    })
}


function getLastTx(cb) {
    TxVinVout[db.getCurrentConnection()].find({'total': {$gt: 0}}).sort({_id: 'desc'}).limit(1).exec(function(err, txs){
        if(txs) {
            return cb(txs[0]);
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
module.exports.getAll3 = getAll3;
module.exports.getAll4 = getAll4;
module.exports.getAll5 = getAll5;
module.exports.getAllAggregeate = getAllAggregeate;
module.exports.getAllDuplicate = getAllDuplicate;
module.exports.getTransactionsChart = getTransactionsChart;
module.exports.saveType = saveType;
module.exports.getTxBlockFieldsByTxid = getTxBlockFieldsByTxid;
module.exports.getUsersTxsCount = getUsersTxsCount;
module.exports.getUsersTxsCount24Hours = getUsersTxsCount24Hours;
module.exports.getUsersTxsWeeklyChart = getUsersTxsWeeklyChart;
module.exports.getLastTx = getLastTx;
