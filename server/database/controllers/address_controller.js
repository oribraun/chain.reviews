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
    Address[db.getCurrentConnection()].findOne({a_id: hash}, function(err, address) {
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
    Address[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec(function(err, addresses){
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
