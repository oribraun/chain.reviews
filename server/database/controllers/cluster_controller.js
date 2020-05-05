var mongoose = require('mongoose');
var Cluster = require('../models/cluster');
var AddressToUpdate = require('../models/address_to_update');
var AddressToUpdateController = require('../controllers/address_to_update_controller');
var TxVinVout = require('../models/txVinVout');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    if(sortBy) {
        sort[sortBy] = order == 'desc' ? -1 : 1;
    }
    Cluster[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, clusters) {
        if(clusters) {
            return cb(clusters);
        } else {
            return cb(null);
        }
    });
}

function getAll2(sortBy, order, limit, offset, cb) {
    var sort = {};
    if(sortBy) {
        sort[sortBy] = order == 'desc' ? -1 : 1;
    }
    Cluster[db.getCurrentConnection()].find({}).sort(sort).skip(parseInt(offset) * parseInt(limit)).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function getAllForCluster(sortBy, order, limit, cb) {
    var sort = {};
    if(sortBy) {
        sort[sortBy] = order == 'desc' ? -1 : 1;
    }
    Cluster[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, clusters) {
        if(clusters) {
            return cb(clusters);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    Cluster[db.getCurrentConnection()].findOne({_id: obj._id}, function(err, cluster) {
        if(err) {
            return cb(err);
        }
        if(address) { // exist
            cluster.addresses = obj.addresses;
            cluster.update = obj.update;
            cluster.tags = obj.tags;
            cluster.save(function (err, tx) {
                if (err) {
                    return cb(err);
                } else {
                    return cb();
                }
            });
        } else { // create new
            var newCluster = new Cluster[db.getCurrentConnection()]({
                addresses: obj.addresses,
                update: obj.update,
                tags: obj.tags,
            });
            newCluster.save(function(err) {
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

function getOne(id, cb) {
    Cluster[db.getCurrentConnection()].findOne({_id: id}, function(err, address) {
        if(address) {
            return cb(address);
        } else {
            return cb();
        }
    });
}

function deleteOne(id, cb) {
    Cluster[db.getCurrentConnection()].deleteOne({_id: id}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Cluster[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function count(cb) {
    Cluster[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function estimatedDocumentCount(cb) {
    Cluster[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function getOneJoin(id, cb) {
    var aggregate = [];
    var objID = mongoose.Types.ObjectId(id);

    aggregate.push({ $match : { _id : objID } });
    aggregate.push({
        "$unwind": {
            "path": "$addresses",
            "preserveNullAndEmptyArrays": true
        }
    });
    // aggregate.push({
    //     "$lookup": {
    //         "from": AddressToUpdate[db.getCurrentConnection()].collection.name,
    //         "localField": "addresses",
    //         "foreignField": "address",
    //         "as": "txs"
    //     }
    // })
    aggregate.push({
        "$lookup": {
            "from": AddressToUpdate[db.getCurrentConnection()].collection.name,
            "let": { "address": "$addresses" },
            "pipeline": [
                { "$match": { "$expr": { "$eq": [ "$address", "$$address" ] } }},
                { "$project": {
                        "_id": 0,
                        "txid": 1,
                        "txid_timestamp": 1,
                        "amount": 1,
                    }}
            ],
            "as": "txs"
        }})
    // aggregate.push({$gt: ["_id", "5e3eb7afca9bdb0e2adaf1c1"]});
    aggregate.push({
        "$group": {
            "_id": "$_id",
            "addresses" : { "$push": {"address": "$addresses", "txs": "$txs"} },
            "tags" : { "$first": "$tags" },
        }
    });
    Cluster[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, cluster) {
        if(cluster && cluster.length) {
            return cb(cluster[0]);
        } else {
            return cb(null);
        }
    });
}


function getClusterTxs(id, limit, offset, cb) {
    var aggregate = [];
    var objID = mongoose.Types.ObjectId(id);

    limit = parseInt(limit);
    offset = parseInt(offset);
    aggregate.push({ $match : { _id : objID } });
    aggregate.push({
        "$unwind": {
            "path": "$addresses",
            "preserveNullAndEmptyArrays": true
        }
    });
    aggregate.push({
        "$lookup": {
            "from": AddressToUpdate[db.getCurrentConnection()].collection.name,
            "let": { "address": "$addresses" },
            "pipeline": [
                { "$match": { "$expr": { "$eq": [ "$address", "$$address" ] } }},
                { "$project": {
                        "_id": 0,
                        "txid": 1,
                        "address": 1,
                        "txid_timestamp": 1,
                        "amount": 1,
                    }
                }
            ],
            "as": "txs"
        }
    })

    // aggregate.push({
    //     "$lookup": {
    //         "from": AddressToUpdate[db.getCurrentConnection()].collection.name,
    //         "localField": "addresses",
    //         "foreignField": "address",
    //         "as": "txs"
    //     }
    // })
    aggregate.push({
        "$unwind": {
            "path": "$txs",
            "preserveNullAndEmptyArrays": true
        }
    });
    if(offset) {
        aggregate.push({$skip: offset * limit});
    }
    if(limit) {
        aggregate.push({$limit: limit});
    }
    aggregate.push({
        "$group": {
            "_id": "$_id",
            "tags" : { "$first": "$tags" },
            "txs" : { "$push": "$txs" },
        }
    });
    aggregate.push({
        "$project": {
            "_id": "$_id",
            "tags" : { "$ifNull" : [ "$tags", [ ] ] },
            "txs" : "$txs",
        }
    });
    Cluster[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, cluster) {
        if(cluster && cluster.length) {
            return cb(cluster[0]);
        } else {
            return cb(null);
        }
    });
}

function getClusterTxsCount(id, cb) {
    var aggregate = [];
    var objID = mongoose.Types.ObjectId(id);

    aggregate.push({ $match : { _id : objID } });
    aggregate.push({
        "$unwind": {
            "path": "$addresses",
            "preserveNullAndEmptyArrays": true
        }
    });
    aggregate.push({
        "$lookup": {
            "from": AddressToUpdate[db.getCurrentConnection()].collection.name,
            "let": { "addr": "$addresses" },
            "pipeline": [
                { "$match": { "$expr": { "$eq": [ "$address", "$$addr" ] } }},
                // {
                //     "$group": {
                //         "_id": "$address",
                //         "sum" : {$sum: 1},
                //     }
                // },
                // { "$project": {
                //         "_id": 0,
                //         // "sum": "$sum",
                //         "amount": 1,
                //     }
                // }
            ],
            "as": "txs"
        }
    })
    aggregate.push({
        "$unwind": {
            "path": "$txs",
            "preserveNullAndEmptyArrays": true
        }
    });
    // aggregate.push({$limit: 10});
    aggregate.push({
        "$group": {
            "_id": "$_id",
            // "txs" : {$sum: "$txs.sum"},
            "sum" : {$sum: 1},
        }
    });
    Cluster[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, cluster) {
        if(cluster && cluster.length) {
            return cb(cluster[0]);
        } else {
            return cb(null);
        }
    });
}

function getClusterTxsCount2(id, cb) {
    var objID = mongoose.Types.ObjectId(id);
    Cluster[db.getCurrentConnection()].find({_id: objID}, {addresses: 1}).exec(function(err, cluster) {
        if(cluster) {
            var addresses = cluster[0].addresses;
            AddressToUpdate[db.getCurrentConnection()].find({address: {$in: addresses}}, {}).countDocuments().exec(function (err, count) {
                if (count) {
                    return cb(count);
                } else {
                    return cb(null);
                }

            });
        } else {
            return cb(null);
        }
    })
    // aggregate.push({ $match : { _id : objID } });
    // aggregate.push({
    //     "$unwind": {
    //         "path": "$addresses",
    //         "preserveNullAndEmptyArrays": true
    //     }
    // });
    // aggregate.push({
    //     "$lookup": {
    //         "from": AddressToUpdate[db.getCurrentConnection()].collection.name,
    //         "let": { "addr": "$addresses" },
    //         "pipeline": [
    //             { "$match": { "$expr": { "$eq": [ "$address", "$$addr" ] } }},
    //             // {
    //             //     "$group": {
    //             //         "_id": "$address",
    //             //         "sum" : {$sum: 1},
    //             //     }
    //             // },
    //             // { "$project": {
    //             //         "_id": 0,
    //             //         // "sum": "$sum",
    //             //         "amount": 1,
    //             //     }
    //             // }
    //         ],
    //         "as": "txs"
    //     }
    // })
    // aggregate.push({
    //     "$unwind": {
    //         "path": "$txs",
    //         "preserveNullAndEmptyArrays": true
    //     }
    // });
    // // aggregate.push({$limit: 10});
    // aggregate.push({
    //     "$group": {
    //         "_id": "$_id",
    //         // "txs" : {$sum: "$txs.sum"},
    //         "sum" : {$sum: 1},
    //     }
    // });
    // Cluster[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, cluster) {
    //     if(cluster && cluster.length) {
    //         return cb(cluster[0]);
    //     } else {
    //         return cb(null);
    //     }
    // });
}

function getAllClusters(limit, offset, cb) {
    var aggregate = [];

    limit = parseInt(limit);
    offset = parseInt(offset);
    aggregate.push({
        "$unwind": {
            "path": "$addresses",
            "preserveNullAndEmptyArrays": true
        }
    });
    aggregate.push({
        "$group": {
            "_id": "$_id",
            "tags" : { "$first": "$tags" },
            "address_count" : { "$sum": 1 },
            // "addresses" : { "$push": "$addresses" },
        }
    });
    aggregate.push({
        $sort:{address_count:-1}
    })
    if(offset) {
        aggregate.push({$skip: offset * limit});
    }
    if(limit) {
        aggregate.push({$limit: limit});
    }
    Cluster[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, cluster) {
        if(cluster) {
            return cb(cluster);
        } else {
            return cb(null);
        }
    });
}

function getAllClustersIds(cb) {
    Cluster[db.getCurrentConnection()].find({}).distinct('_id').exec( function(err, clusters) {
        if(clusters) {
            return cb(clusters);
        } else {
            return cb(null);
        }
    });
}

function getAllClustersWithAddressCount(id,  cb) {
    var aggregate = [];

    if(id) {
        var objID = mongoose.Types.ObjectId(id);
        aggregate.push({ $match : { _id : objID } });
    }
    aggregate.push({
        "$unwind": {
            "path": "$addresses",
            "preserveNullAndEmptyArrays": true
        }
    });
    aggregate.push({
        "$group": {
            "_id": "$_id",
            "tags" : { "$first": "$tags" },
            "address_count" : { "$sum": 1 },
        }
    });
    aggregate.push({
        $sort:{count:-1}
    })
    Cluster[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, cluster) {
        if(cluster) {
            return cb(cluster);
        } else {
            return cb(null);
        }
    });
}

function getAllClustersWithTxsCount(id,  cb) {
    var aggregate = [];

    if(id) {
        var objID = mongoose.Types.ObjectId(id);
        aggregate.push({ $match : { _id : objID } });
    }
    aggregate.push({
        "$unwind": {
            "path": "$addresses",
            "preserveNullAndEmptyArrays": true
        }
    });
    aggregate.push({
        "$group": {
            "_id": "$_id",
            "tags" : { "$first": "$tags" },
            "address_count" : { "$sum": 1 },
            "addresses" : { "$push": "$addresses" },
        }
    });
    aggregate.push({
        $sort:{address_count:-1}
    })
    Cluster[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, clusters) {
        if(clusters) {
            var promises = [];
            for(var i = 0; i < clusters.length; i++) {
                (function(i){
                    promises.push(new Promise(function(resolve, reject) {
                        AddressToUpdateController.countTxInArray(clusters[i].addresses, function (tx_count) {
                            clusters[i].tx_count = tx_count;
                            delete clusters[i].addresses;
                            resolve();
                        })
                    }))
                })(i)
            }
            Promise.all(promises).then(function(response) {
                return cb(clusters);
            })
        } else {
            return cb(null);
        }
    });
}

function getAllClustersWithAddressAndTxsCount(id, limit, offset,  cb) {
    limit = parseInt(limit);
    offset = parseInt(offset);
    var aggregate = [];
    if(id) {
        var objID = mongoose.Types.ObjectId(id);
        aggregate.push({ $match : { _id : objID } });
    }
    aggregate.push({
        "$unwind": {
            "path": "$addresses",
            "preserveNullAndEmptyArrays": true
        }
    });
    aggregate.push({
        "$group": {
            "_id": "$_id",
            "tags" : { "$first": "$tags" },
            "address_count" : { "$sum": 1 },
            "addresses" : { "$push": "$addresses" },
        }
    });
    aggregate.push({
        $sort:{address_count:-1}
    })
    if(offset) {
        aggregate.push({$skip: offset * limit});
    }
    if(limit) {
        aggregate.push({$limit: limit});
    }
    Cluster[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, clusters) {
        if(clusters) {
            var promises = [];
            for(var i = 0; i < clusters.length; i++) {
                (function(i){
                    promises.push(new Promise(function(resolve, reject) {
                        AddressToUpdateController.countTxInArray(clusters[i].addresses, function (tx_count) {
                            clusters[i].tx_count = tx_count;
                            delete clusters[i].addresses;
                            resolve();
                        })
                    }))
                })(i)
            }
            Promise.all(promises).then(function(response) {
                return cb(clusters);
            })
        } else {
            return cb(err);
        }
    });
}

function getClusterAddresses(id, limit, offset, cb) {
    var aggregate = [];
    var objID = mongoose.Types.ObjectId(id);

    // limit = parseInt(limit);
    // offset = parseInt(offset);
    // aggregate.push({ $match : { _id : objID } });
    // aggregate.push({
    //     "$unwind": {
    //         "path": "$addresses",
    //         "preserveNullAndEmptyArrays": true
    //     }
    // });
    // aggregate.push({
    //     "$lookup": {
    //         "from": AddressToUpdate[db.getCurrentConnection()].collection.name,
    //         "let": { "address": "$addresses" },
    //         "pipeline": [
    //             { "$match": { "$expr": { "$eq": [ "$address", "$$address" ] } }},
    //             { "$project": {
    //                     "_id": 0,
    //                     "amount": "1",
    //                 }
    //             }
    //         ],
    //         "as": "txs"
    //     }
    // });
    // aggregate.push({
    //     "$project": {
    //         "_id": 0,
    //         "address": "$addresses",
    //         "tx_count": {"$size": "$txs"},
    //         // "tags" : { "$ifNull" : [ "$tags", [ ] ] },
    //         // "tx_count" : "$tx_count",
    //     }
    // });
    // aggregate.push({
    //     $sort:{tx_count:-1}
    // })
    // if(offset) {
    //     aggregate.push({$skip: offset * limit});
    // }
    // if(limit) {
    //     aggregate.push({$limit: limit});
    // }
    // // aggregate.push({
    // //     "$unwind": {
    // //         "path": "$txs",
    // //         "preserveNullAndEmptyArrays": true
    // //     }
    // // });
    // // aggregate.push({
    // //     "$group": {
    // //         "_id": "$addresses",
    // //         // "tags" : { "$first": "$tags" },
    // //         "txs" : { "$push": "$txs" },
    // //         "addresses" : { "$first": "$addresses" },
    // //         // "tx_count" : { "$size": "$txs" },
    // //     }
    // // });
    // // aggregate.push({
    // //     "$project": {
    // //         "_id": 0,
    // //         "addresses": "$addresses",
    // //         "txs_count": {"$size": "$txs"},
    // //         // "tags" : { "$ifNull" : [ "$tags", [ ] ] },
    // //         // "tx_count" : "$tx_count",
    // //     }
    // // });
    // // aggregate.push({
    // //     $sort:{tx_count:-1}
    // // })
    // Cluster[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, clusters) {
    //     if(clusters && clusters.length) {
    //         return cb(clusters);
    //     } else {
    //         return cb(err);
    //     }
    // });

    var objID = mongoose.Types.ObjectId(id);

    limit = parseInt(limit);
    offset = parseInt(offset);

    Cluster[db.getCurrentConnection()].findOne({ _id : objID }, function(err, results) {
        if(results) {
            AddressToUpdateController.getGroupCountForAddresses(results.addresses, limit, offset, function(res) {
                return cb(res);
            })
        } else {
            return cb();
        }
    });
}

function getClusterByAddress(address, cb) {

    Cluster[db.getCurrentConnection()].find({addresses:{$elemMatch:{$eq: address}}}, {_id: 1}).exec( function(err, clusters) {
        if(clusters) {
            return cb(clusters);
        } else {
            return cb(null);
        }
    });
}

function getTransactionsChart(id, date, cb) {

    var objID = mongoose.Types.ObjectId(id);
    Cluster[db.getCurrentConnection()].find({_id: objID}, {addresses: 1}).exec(function(err, cluster) {
        if(cluster) {
            var addresses = cluster[0].addresses;
            // AddressToUpdate[db.getCurrentConnection()].find({address: {$in: addresses}}, {_id:0, txid: 1}).exec(function (err, txs) {
            //     txs = txs.map((o) => (o.txid));
            //     if (txs) {
                    // TxVinVout[db.getCurrentConnection()].find({txid: {$in: txs}}).countDocuments().exec(function (err, count) {
                    //     return cb(count);
                    // })
                    var yearFromNowTimestamp = new Date(new Date().getTime() - 1000*60*60*24*365).getTime() / 1000;
                    var aggregate = [];
                    aggregate.push({$match: {address: {$in: addresses}}});
                    aggregate.push({$project: {_id:0, txid: 1}});
                    aggregate.push({
                        "$lookup": {
                            "from": TxVinVout[db.getCurrentConnection()].collection.name,
                            "let": { "txid": "$txid" },
                            "pipeline": [
                                { "$match": { "$expr": { "$eq": [ "$txid", "$$txid" ] } }},
                                // { "$match": { "$expr": { "$gt": [ "$total", 0 ] } }},
                                { "$project": {
                                        "_id": 0,
                                        "txid": 1,
                                        "timestamp": 1,
                                        "total": 1,
                                        "blockindex": 1,
                                    }}
                            ],
                            "as": "txs"
                        }}
                    );
                    aggregate.push({
                        "$unwind": {
                            "path": "$txs",
                            "preserveNullAndEmptyArrays": true
                        }
                    });
                    aggregate.push({$match: {"txs.total": {$gt: 0}}});
                    var yearFromNowTimestamp = new Date(new Date().getTime() - 1000*60*60*24*365).getTime() / 1000;
                    aggregate.push({$match: {"txs.timestamp": {$gte: yearFromNowTimestamp }}}); // limit to year a head
                    if(date) {
                        var timestamp = new Date(date).getTime() / 1000;
                        aggregate.push({$match: {"txs.timestamp": {$gte: timestamp }}});
                    }
                    aggregate.push({$project: {
                            "_id": "_id",
                            "total": "$txs.total",
                            "blockindex": "$txs.blockindex",
                            "date1": {
                                $dateToParts: { date: {
                                        "$add": [
                                            new Date(new Date(0).getTime() + new Date().getTimezoneOffset()*60*1000),
                                            {"$multiply": ["$txs.timestamp", 1000]}
                                        ]
                                    }
                                }
                            },
                            "date2": {
                                $dateToParts: { date: {
                                        "$add": [
                                            new Date(0), // GTM+2
                                            {"$multiply": ["$txs.timestamp", 1000]}
                                        ]
                                    }
                                }
                            },
                            "date": {
                                $dateToString: {
                                    date: {
                                        "$add": [
                                            new Date(0), // GTM+2
                                            {"$multiply": ["$txs.timestamp", 1000]}
                                        ]
                                    },
                                    format: "%Y-%m-%d"
                                }
                            },
                            "year": {
                                "$year": {
                                    "$add": [
                                        new Date(0),
                                        {"$multiply": ["$txs.timestamp", 1000]}
                                    ]
                                }
                            },
                            "month": {
                                "$month": {
                                    "$add": [
                                        new Date(0),
                                        {"$multiply": ["$txs.timestamp", 1000]}
                                    ]
                                }
                            },
                            "day": {
                                "$dayOfMonth": {
                                    "$add": [
                                        new Date(0),
                                        {"$multiply": ["$txs.timestamp", 1000]}
                                    ]
                                }
                            },
                            "week": {
                                "$isoWeek": {
                                    "$add": [
                                        new Date(0),
                                        {"$multiply": ["$txs.timestamp", 1000]}
                                    ]
                                }
                            },
                            "timestamp": "$txs.timestamp"
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
                            "cid": id,
                            "date": "$date",
                            "week": "$week",
                            "count": "$count",
                            "totalAmountADay": "$totalAmountADay",
                        }});
                    AddressToUpdate[db.getCurrentConnection()].aggregate(
                        aggregate
                    ).allowDiskUse(true).exec( function(err, txs) {
                        if(txs) {
                            return cb(txs);
                        } else {
                            if(err) {
                                console.log('err', err);
                            }
                            return cb();
                        }
                    });
                // } else {
                //     return cb(null);
                // }

            // });
        } else {
            return cb(null);
        }
    })
}

module.exports.getAll = getAll;
module.exports.getAll2 = getAll2;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.count = count;
module.exports.estimatedDocumentCount = estimatedDocumentCount;
module.exports.getOneJoin = getOneJoin;
module.exports.getClusterTxs = getClusterTxs;
module.exports.getClusterAddresses = getClusterAddresses;
module.exports.getClusterTxsCount = getClusterTxsCount;
module.exports.getClusterTxsCount2 = getClusterTxsCount2;
module.exports.getAllClusters = getAllClusters;
module.exports.getAllClustersWithAddressCount = getAllClustersWithAddressCount;
module.exports.getAllClustersWithTxsCount = getAllClustersWithTxsCount;
module.exports.getAllClustersWithAddressAndTxsCount = getAllClustersWithAddressAndTxsCount;
module.exports.getClusterByAddress = getClusterByAddress;
module.exports.getTransactionsChart = getTransactionsChart;
module.exports.getAllForCluster = getAllForCluster;
module.exports.getAllClustersIds = getAllClustersIds;
