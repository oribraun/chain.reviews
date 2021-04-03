var Address = require('../models/address');
var AddressToUpdate = require('../models/address_to_update');
var TxVinVout = require('../models/txVinVout');
const helpers = require('../../helpers');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    if(sortBy) {
        sort[sortBy] = order;
    }
    Address[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    Address[db.getCurrentConnection()].findOne({a_id: obj.a_id}, function(err, address) {
        if(err) {
            return cb(err);
        }
        if(address) { // exist
            address.received = obj.received;
            address.sent = obj.sent;
            address.balance = obj.balance;
            address.last_order = obj.last_order;
            address.last_blockindex = obj.last_blockindex;
            address.save(function (err, tx) {
                if (err) {
                    return cb(err);
                } else {
                    return cb();
                }
            });
        } else { // create new
            var newAddress = new Address[db.getCurrentConnection()]({
                a_id: obj.a_id,
                received: obj.received,
                sent: obj.sent,
                balance: obj.balance,
                last_order: obj.last_order,
                last_blockindex: obj.last_blockindex
            });
            newAddress.save(function(err) {
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

function getOne(hash, cb) {
    Address[db.getCurrentConnection()].findOne({a_id: hash}).lean().exec(function(err, address) {
        if(address) {
            return cb(address);
        } else {
            return cb();
        }
    });
}

function deleteOne(a_id, cb) {
    Address[db.getCurrentConnection()].deleteOne({a_id: a_id}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Address[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function updateAllWhereGte(blockindex, cb) {
    var __this = this;
    Address[db.getCurrentConnection()].find({last_blockindex: { $gte: blockindex }}, function(err, addresses){
        if(addresses && addresses.length) {
            var list = [];
            for (var i in addresses) {
                list.push(addresses[i].a_id)
            }
            console.log('list', list)
            // AddressToUpdate[db.getCurrentConnection()].find({address: {$in: list}}).sort({order: -1}).limit(list.length).exec(function(err, results) {
            AddressToUpdate[db.getCurrentConnection()].aggregate(
                [
                    {$match: {address: {$in: list}}},
                    {$match: {blockindex: {$lt: blockindex}}},
                    {$sort: {order: -1}},
                    {$group: {
                        "_id": "$address",
                        // "a_id": "$address",
                        "received": {"$first": "$received"},
                        "sent": {"$first": "$sent"},
                        "balance": {"$first": "$balance"},
                        "last_order": {"$first": "$order"},
                        "last_blockindex": {"$first": "$blockindex"},
                    }},
                    {$project: {
                        "_id": 0,
                        "a_id": "$_id",
                        "received": 1,
                        "sent": 1,
                        "balance": 1,
                        "last_order": 1,
                        "last_blockindex": 1,
                    }}
                ]
            ).allowDiskUse(true).exec(function(err, results) {
                var length = results.length;
                function update() {
                    if(results && results.length) {
                        __this.updateOne(results[0], function () {
                            results.shift();
                            update()
                        })
                    } else {
                        return cb(length);
                    }
                }
                if(results && results.length) {
                    update()
                } else {
                    return cb(length);
                }
            })
        } else {
            return cb()
        }
    })
}

function updateAddress(hash, txid, amount, type, cb) {
    // Check if address exists
    getOne(hash, function(address) {
        if (address) {
            // if coinbase (new coins PoW), update sent only and return cb.
            if ( hash == 'coinbase' ) {
                address.sent = address.sent + amount
                address.balance = 0;
                // console.log('exist coinbase', address.sent)
                address.save(function(err) {
                    if (err) {
                        return cb(err);
                    } else {
                        //console.log('txid: ');
                        return cb();
                    }
                })
            } else {
                // ensure tx doesnt already exist in address.txs
                helpers.is_unique(address.txs, txid).then(function(obj){
                    var tx_array = address.txs;
                    var received = address.received;
                    var sent = address.sent;
                    if (type == 'vin') {
                        sent = sent + amount;
                    } else {
                        received = received + amount;
                    }
                    if (obj.unique == true) {
                        tx_array.push({addresses: txid, type: type});
                        // if ( tx_array.length > settings.txcount ) {
                        //   tx_array.shift();
                        // }
                        Address[db.getCurrentConnection()].updateOne({a_id:hash}, {
                            txs: tx_array,
                            received: received,
                            sent: sent,
                            balance: received - sent
                        }, function() {
                            return cb();
                        });
                    } else {
                        if (type == tx_array[obj.index].type) {
                            return cb(); //duplicate
                        } else {
                            Address[db.getCurrentConnection()].updateOne({a_id:hash}, {
                                txs: tx_array,
                                received: received,
                                sent: sent,
                                balance: received - sent
                            }, function() {
                                return cb();
                            });
                        }
                    }
                })
            }
        } else {
            //new address
            if (type == 'vin') {
                // console.log('new vin', amount);
                var newAddress = new Address[db.getCurrentConnection()]({
                    a_id: hash,
                    txs: [ {addresses: txid, type: 'vin'} ],
                    sent: amount,
                    balance: amount,
                });
            } else {
                // console.log('new vout', amount);
                var newAddress = new Address[db.getCurrentConnection()]({
                    a_id: hash,
                    txs: [ {addresses: txid, type: 'vout'} ],
                    received: amount,
                    balance: amount,
                });
            }

            newAddress.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('address saved: %s', hash);
                    //console.log(newAddress);
                    return cb();
                }
            });
        }
    });
}

function bulkUpdateAddress(hash, txid, amount, type, cb) {
    // Check if address exists
    getOne(hash, function(address) {
        if (address) {
            // if coinbase (new coins PoW), update sent only and return cb.
            if ( hash == 'coinbase' ) {
                address.sent = address.sent + amount
                address.balance = 0;
                console.log('exist coinbase', address.sent)
                address.save(function(err) {
                    if (err) {
                        return cb(err);
                    } else {
                        //console.log('txid: ');
                        return cb();
                    }
                })
            } else {
                // ensure tx doesnt already exist in address.txs
                helpers.is_unique(address.txs, txid).then(function(obj){
                    var tx_array = address.txs;
                    var received = address.received;
                    var sent = address.sent;
                    if (type == 'vin') {
                        sent = sent + amount;
                    } else {
                        received = received + amount;
                    }
                    if (obj.unique == true) {
                        tx_array.push({addresses: txid, type: type});
                        // if ( tx_array.length > settings.txcount ) {
                        //   tx_array.shift();
                        // }
                        Address[db.getCurrentConnection()].updateOne({a_id:hash}, {
                            txs: tx_array,
                            received: received,
                            sent: sent,
                            balance: received - sent
                        }, function() {
                            return cb();
                        });
                    } else {
                        if (type == tx_array[obj.index].type) {
                            return cb(); //duplicate
                        } else {
                            Address[db.getCurrentConnection()].updateOne({a_id:hash}, {
                                txs: tx_array,
                                received: received,
                                sent: sent,
                                balance: received - sent
                            }, function() {
                                return cb();
                            });
                        }
                    }
                })
            }
        } else {
            //new address
            if (type == 'vin') {
                console.log('new vin', amount);
                try {
                    var newAddress = new Address[db.getCurrentConnection()]({
                        a_id: hash,
                        txs: [{addresses: txid, type: 'vin'}],
                        sent: amount,
                        balance: amount,
                    });
                } catch(e) {
                    // TODO bulk update
                    console.log(e);
                    // bulkUpdateAddress(hash, txid, amount, type, cb);
                }
            } else {
                console.log('new vout', amount);
                try {
                    var newAddress = new Address[db.getCurrentConnection()]({
                        a_id: hash,
                        txs: [{addresses: txid, type: 'vout'}],
                        received: amount,
                        balance: amount,
                    });
                } catch(e) {
                    // TODO bulk update
                    console.log(e);
                    // bulkUpdateAddress(hash, txid, amount, type, cb);
                }
            }

            newAddress.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('address saved: %s', hash);
                    //console.log(newAddress);
                    return cb();
                }
            });
        }
    });
}

function getRichlist(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    var get = {}
    get._id = 0;
    get.a_id = 1;
    get[sortBy] = 1;
    Address[db.getCurrentConnection()].find({}, get).sort(sort).limit(limit).exec(function(err, addresses){
        if(err) {
            return cb(err);
        }
        return cb(addresses);
    });
}

function update(coin, options, cb) {
    Address[db.getCurrentConnection()].updateOne({coin: coin}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}
function updateAddress1(address, hash, txid, amount, type, cb) {
    // Check if address exists
    if (address) {
        // if coinbase (new coins PoW), update sent only and return cb.
        if ( hash == 'coinbase' ) {
            Address[db.getCurrentConnection()].updateOne({a_id:hash}, {
                sent: address.sent + amount,
                balance: 0,
            }, function() {
                return cb();
            });
        } else {
            // ensure tx doesnt already exist in address.txs
            helpers.is_unique(address.txs, txid).then(function(obj){
                var tx_array = address.txs;
                var received = address.received;
                var sent = address.sent;
                if (type == 'vin') {
                    sent = sent + amount;
                } else {
                    received = received + amount;
                }
                if (obj.unique == true) {
                    tx_array.push({addresses: txid, type: type});
                    // if ( tx_array.length > settings.txcount ) {
                    //   tx_array.shift();
                    // }
                    Address[db.getCurrentConnection()].updateOne({a_id:hash}, {
                        txs: tx_array,
                        received: received,
                        sent: sent,
                        balance: received - sent
                    }, function() {
                        return cb();
                    });
                } else {
                    if (type == tx_array[obj.index].type) {
                        return cb(); //duplicate
                    } else {
                        Address[db.getCurrentConnection()].updateOne({a_id:hash}, {
                            txs: tx_array,
                            received: received,
                            sent: sent,
                            balance: received - sent
                        }, function() {
                            return cb();
                        });
                    }
                }
            })
        }
    }
}
function createAddress1(hash, txid, amount, type, cb) {
    //new address
    if (type == 'vin') {
        var newAddress = new Address[db.getCurrentConnection()]({
            a_id: hash,
            txs: [ {addresses: txid, type: 'vin'} ],
            sent: amount,
            balance: amount,
        });
    } else {
        var newAddress = new Address[db.getCurrentConnection()]({
            a_id: hash,
            txs: [ {addresses: txid, type: 'vout'} ],
            received: amount,
            balance: amount,
        });
    }

    newAddress.save(function(err) {
        if (err) {
            return cb(err);
        } else {
            //console.log('address saved: %s', hash);
            //console.log(newAddress);
            return cb();
        }
    });
}

function count(cb) {
    Address[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function estimatedDocumentCount(cb) {
    Address[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function getOneWithTx(hash, cb) {
    Address[db.getCurrentConnection()].aggregate([
        { $match : { a_id : hash } },
        {
            "$unwind": {
                "path": "$txs",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": TxVinVout[db.getCurrentConnection()].collection.name,
                "localField": "txs.addresses",
                "foreignField": "txid",
                // "pipeline":[
                // {"$unwind":"$vout"},
                // {"$match":{"$expr":{"$eq":["$$vin.vout","$vout.n"]}}}
                // ],
                "as": "txs.tx"
                // where vin.vout = vout[0].n
            }
        },
        {
            "$unwind": {
                "path": "$txs",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$group": {
                "_id": "$_id",
                "txs" : { "$push": {txid: "$txs.addresses", type: "$txs.type", vin: "$txs.tx.vin", vout: "$txs.tx.vout", timestamp: "$txs.tx.timestamp"} },
                "received" : { "$first": "$received" },
                "a_id" : { "$first": "$a_id" },
                "sent" : { "$first": "$sent" },
                "balance" : { "$first": "$balance" },
            }
        }
    ]).allowDiskUse(true).exec(function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function getAllDuplicate(cb) {
    Address[db.getCurrentConnection()].aggregate([
        {
            $group : {
                "_id": "$blockhash",
                "count": {$sum: 1}
            }
        },
        {"$match": {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} } },
    ]).exec(function(err, results) {
        cb(results);
    })
}

function getClusterDetails(addresses, cb) {
    var aggregate = [];
    // var twoYearsFromNowTimestamp = new Date(new Date().getTime() - 1000*60*60*24*365*2).getTime() / 1000;
    // aggregate.push({$match: {txid_timestamp: {$gte: twoYearsFromNowTimestamp }}}); // limit to year a head
    aggregate.push({ $match : { a_id : {$in : addresses} } });
    aggregate.push({
        "$group": {
            "_id": null,
            "sent" : { $sum: "$sent"},
            "received" : { $sum: "$received"},
            "balance" : { $sum: "$balance"},
            "count" : { $sum: "$last_order"},
        }
    })
    aggregate.push({
        "$project": {
            "sent": "$sent",
            "received": "$received",
            "balance": "$balance",
            "count": "$count",
        }
    })
    Address[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, results) {
        if(results && results.length) {
            return cb(results[0]);
        } else {
            return cb(err);
        }
    });
}

function getGroupCountForAddresses(addresses, limit, offset, cb) {
    var aggregate = [];
    aggregate.push({ $match : {a_id : {$in : addresses}} });
    aggregate.push({"$group": {
            "_id": "$a_id",
            "tx_count": {"$first": "$last_order"},
            "sent": {"$first": "$sent"},
            "received": {"$first": "$received"},
            "balance": {"$first": "$balance"},
        }
    });
    aggregate.push({"$project": {
            "_id": 0,
            "address": "$_id",
            "tx_count": 1,
            "sent": 1,
            "received": 1,
            "balance": 1,
        }
    });
    aggregate.push({$sort:{balance:-1}});
    if(parseInt(offset)) {
        aggregate.push({$skip: parseInt(offset) * parseInt(limit)});
    }
    if(parseInt(limit)) {
        aggregate.push({$limit: parseInt(limit)});
    }
    Address[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, addresses) {
        if(addresses) {
            return cb(addresses);
        } else {
            return cb(null);
        }
    });
}

function findAllWrongOrder(cb) {
    var aggregate = [];
    aggregate.push({
        "$lookup": {
            "from": AddressToUpdate[db.getCurrentConnection()].collection.name,
            "let": { "address": "$a_id",  "order": "$last_order" },
            "pipeline": [
                { "$match": { "$expr": { "$eq": [ "$address", "$$address" ] } }},
                { "$match": { "$expr": { "$gt": [ "$order", "$$order" ] } }},
                // { "$match": { "$expr": { "$gt": [ "$total", 0 ] } }},
            ],
            "as": "addr"
        }});
    aggregate.push({$match: {addr: {$not: {$size: 0}}}})
    aggregate.push({"$project": {
            "_id": 0,
            "address": "$a_id",
            "last_blockindex": 1,
            "last_order": 1,
            "sent": 1,
            "received": 1,
            "balance": 1,
            "addr": 1,
        }
    });
    Address[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, addresses) {
        if(addresses) {
            return cb(addresses);
        } else {
            return cb(null);
        }
    });
}

function getRichlistAndExtraStats(sortBy, order, limit, dev_address, cb) {
    var sort = {};
    sort[sortBy] = order == 'desc' ? -1 : 1;
    var aggregate = [];
    aggregate.push({$match: {a_id: {$ne: "coinbase"}}});
    // var twoYearsFromNowTimestamp = new Date(new Date().getTime() - 1000*60*60*24*365*2).getTime() / 1000;
    // aggregate.push({$match: {txid_timestamp: {$gte: twoYearsFromNowTimestamp }}}); // limit to year a head
    aggregate.push({
        "$project": {
            "_id": "$a_id",
            // "sent": "$sent",
            "received": "$received",
            "balance": "$balance",
        }
    })
    aggregate.push({$sort:sort});
    aggregate.push({
        "$group": {
            "_id": null,
            "countUnique": {$sum: 1},
            "countActive": {$sum: {$cond: { if: { $gt: [ "$balance", 0 ] }, then: 1, else: 0}}},
            "devAddressBalance": {$sum: {$cond: { if: { $eq: [ "$_id", dev_address ] }, then: "$balance", else: 0}}},
            "received_data": {$push: {"_id": "$_id", "received": "$received"}},
            "balance_data": {$push: {"_id": "$_id", "balance": "$balance"}},
        }
    });
    if(sortBy === 'received') {
        aggregate.push({
            "$project": {
                "_id": 0,
                "countActive": "$countActive",
                "data": {"$slice": ["$received_data", 0, parseInt(limit)]},
            }
        });
    }
    if(sortBy === 'balance') {
        aggregate.push({
            "$project": {
                "_id": 0,
                "countActive": "$countActive",
                "countUnique": "$countUnique",
                "devAddressBalance": "$devAddressBalance",
                "data": {"$slice": ["$balance_data", 0, parseInt(limit)]},
            }
        });
    }
    Address[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, address) {
        if(address && address.length) {
            return cb(address[0]);
        } else {
            return cb(err);
        }
    });
}

function getRichlistAndExtraStats2(sortBy, order, limit, dev_address, cb) {
    var sort = {};
    sort[sortBy] = order == 'desc' ? -1 : 1;
    var promises = [];
    var data = {};
    promises.push(new Promise((resolve, reject) => {
        Address[db.getCurrentConnection()].countDocuments({}, function (err, countUnique) {
            if(err) {
                reject()
            } else {
                data.countUnique = countUnique;
                console.log('got countUnique', countUnique)
                resolve();
            }
        });
    }))
    promises.push(new Promise((resolve, reject) => {
        Address[db.getCurrentConnection()].find({balance: {$gt: 0}}).countDocuments({}, function (err, countActive) {
            if(err) {
                reject()
            } else {
                data.countActive = countActive;
                console.log('got countActive', countActive)
                resolve();
            }
        });
    }))
    promises.push(new Promise((resolve, reject) => {
        Address[db.getCurrentConnection()].find({a_id: {$eq: dev_address}}).exec({}, function (err, address) {
            if(err) {
                reject()
            } else {
                if(address && address[0]) {
                    data.devAddressBalance = address[0].balance;
                } else {
                    data.devAddressBalance = 0;
                }
                console.log('got devAddressBalance', data.devAddressBalance)
                resolve();
            }
        });
    }))
    promises.push(new Promise((resolve, reject) => {
        var get = {}
        get._id = 0;
        get.a_id = 1;
        get[sortBy] = 1;
        Address[db.getCurrentConnection()].find({},get).sort(sort).limit(limit).exec({}, function (err, results) {
            if (err) {
                reject()
            } else {
                data.data = results;
                resolve();
            }
        });
    }))
    Promise.all(promises).then((response) => {
        cb(data);
    });
}

function getAddressDetailsWithLastestTxs(address, cb) {
    getOne(address, function(addr) {
        const obj = {
            "address": addr["a_id"],
            "sent": addr["sent"],
            "received": addr["received"],
            "balance": addr["balance"],
            "last_txs": []
        }
        AddressToUpdate[db.getCurrentConnection()].aggregate([
            { $match : { address : address } },
            // {$sort:{createdAt:-1}},
            {"$sort": {timestamp: -1}},
            {"$limit": 100},
            {
                "$unwind": {
                    "path": "$_id",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$group": {
                    "_id": "$address",
                    "last_txs" : { "$push": {txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount",
                            "date": {
                                $dateToString: {
                                    date: {
                                        "$add": [
                                            new Date(0), // GTM+2
                                            {"$multiply": ["$txid_timestamp", 1000]}
                                        ]
                                    },
                                    format: "%d-%m-%Y"
                                }
                            }
                        }
                    }
                }
            },
            {
                "$project": {
                    "last_txs": "$last_txs",
                }
            },
        ]).allowDiskUse(true).exec(function(err, results) {
            if(results && results.length) {
                obj.last_txs = results[0].last_txs;
                return cb(obj);
            } else {
                return cb(err);
            }
        });
        // return cb(obj);
    });
    // AddressToUpdate[db.getCurrentConnection()].find({address : {$eq : address}}, {amount: true}).exec( function (err, results) {
    //     if(err) {
    //         cb()
    //     } else {
    //         cb(results);
    //     }
    // });
}


module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.updateAddress = updateAddress;
module.exports.getRichlist = getRichlist;
module.exports.update = update;
module.exports.count = count;
module.exports.estimatedDocumentCount = estimatedDocumentCount;

module.exports.updateAddress1 = updateAddress1;
module.exports.createAddress1 = createAddress1;
module.exports.getOneWithTx = getOneWithTx;
module.exports.getAllDuplicate = getAllDuplicate;
module.exports.updateAllWhereGte = updateAllWhereGte;
module.exports.getClusterDetails = getClusterDetails;
module.exports.getGroupCountForAddresses = getGroupCountForAddresses;
module.exports.findAllWrongOrder = findAllWrongOrder;
module.exports.getRichlistAndExtraStats = getRichlistAndExtraStats;
module.exports.getRichlistAndExtraStats2 = getRichlistAndExtraStats2;
module.exports.getAddressDetailsWithLastestTxs = getAddressDetailsWithLastestTxs;
