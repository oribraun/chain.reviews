var mongoose = require('mongoose')
var AddressToUpdate = require('../models/address_to_update');
const helpers = require('../../helpers');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    AddressToUpdate[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    AddressToUpdate[db.getCurrentConnection()].findOne({_id: obj._id}, function(err, address) {
        if(err) {
            return cb(err);
        }
        if(address) { // exist
            address.address = obj.address;
            address.txid = obj.txid;
            address.txid_timestamp = obj.txid_timestamp;
            address.amount = obj.amount;
            address.type = obj.type;
            address.blockindex = obj.blockindex;
            address.save(function (err, tx) {
                if (err) {
                    return cb(err);
                } else {
                    return cb();
                }
            });
        } else { // create new
            var newAddress = new AddressToUpdate[db.getCurrentConnection()]({
                address: obj.address,
                txid: obj.txid,
                txid_timestamp: obj.txid_timestamp,
                amount: obj.amount,
                type: obj.type,
                blockindex: obj.blockindex,
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

function getOne(address, cb) {
    AddressToUpdate[db.getCurrentConnection()].findOne({address: address}, function(err, address) {
        if(address) {
            return cb(address);
        } else {
            return cb();
        }
    });
}

function deleteOne(id, cb) {
    AddressToUpdate[db.getCurrentConnection()].deleteOne({_id: id}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    AddressToUpdate[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function count(cb) {
    AddressToUpdate[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function estimatedDocumentCount(cb) {
    AddressToUpdate[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function getMany(address, cb) {
    AddressToUpdate[db.getCurrentConnection()].find({address: address}, function(err, address) {
        if(address) {
            return cb(address);
        } else {
            return cb();
        }
    });
}

function getOneJoin(address, limit, offset, cb) {
    var aggregate = [];
    var objID = mongoose.Types.ObjectId("5e3eb7afca9bdb0e2adaf1c1");
    aggregate.push({ $match : { address : address } });
    // aggregate.push({ $match: { $and: [ { address: address }, { _id: { $gt: "5e3eb7afca9bdb0e2adaf1c1" } } ] } });
    // aggregate.push({$sort:{blockindex:-1}});
    aggregate.push({$sort:{blockindex:-1}});
    if(parseInt(offset)) {
        aggregate.push({$skip: parseInt(offset) * parseInt(limit)});
    }
    if(parseInt(limit)) {
        aggregate.push({$limit: parseInt(limit)});
    }
    // aggregate.push({ $match : { _id : mongoose.Types.ObjectId("5e3eb7afca9bdb0e2adaf1c1") } });
    // aggregate.push({ $match : { "_id" : { "$gt": objID} } });
    aggregate.push({
        "$unwind": {
            "path": "$_id",
            "preserveNullAndEmptyArrays": true
        }
    });
    // aggregate.push({$gt: ["_id", "5e3eb7afca9bdb0e2adaf1c1"]});
    aggregate.push({
        "$group": {
            "_id": "$address",
            // "txs" : { "$push": {"_id": "$_id", txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount", type: "$type", blockindex: "$blockindex"} },
            "txs" : { "$push": {txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount"} },
            // "received" : { "$first": "$received" },
            // "a_id" : { "$first": "$a_id" },
            // "txid": "4028d18fa7674318ca3b2f9aaf4594125346ffb8b42e2371ca41d0e5ab99c834",
            // "txid_timestamp": "1546794007",
            // "sent" : { "$sum":
            //         {$cond:
            //                 {if: { $eq: [ "$_id", "coinbase" ] },
            //                     then: "$amount",
            //                     else: {$cond:
            //                             {if: { $eq: [ "$type", "vin" ] },
            //                                 then: "$amount",
            //                                 else: 0 }} }}
            // },
            // "received" : { "$sum":
            //         {$cond:
            //                 {if: { $eq: [ "$_id", "coinbase" ] },
            //                     then: 0,
            //                     else: {$cond:
            //                             {if: { $eq: [ "$type", "vout" ] },
            //                                 then: "$amount",
            //                                 else: 0 }} }}
            // },
            // // "type": "vout",
            // // "blockindex": 5,
            // "createdAt" : { "$first": "$createdAt" },
            // "updatedAt" : { "$first": "$updatedAt" },
        }
    });
    aggregate.push({
        "$project": {
            "_id": "$_id",
            "txs": "$txs",
            // "sent": "$sent",
            // "received": "$received",
            // "balance": {"$subtract": ['$received', '$sent']},
        }
    });
    AddressToUpdate[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, address) {
        if(address && address.length) {
            return cb(address[0]);
        } else {
            return cb(null);
        }
    });
}

function getAddressTxs(address, limit, offset, cb) {
    countTx(address, function(count) {
        var aggregate = [];
        var objID = mongoose.Types.ObjectId("5e3eb7afca9bdb0e2adaf1c1");
        aggregate.push({$match: {address: address}});
        // aggregate.push({$limit: count});
        // aggregate.push({ $match: { $and: [ { address: address }, { _id: { $gt: "5e3eb7afca9bdb0e2adaf1c1" } } ] } });
        // aggregate.push({$sort:{blockindex:-1}});
        // aggregate.push({$sort: {blockindex: -1}});
        offset = parseInt(offset);
        limit = parseInt(limit);
        var skip;
        // if(offset * limit > count / 2) {
            // will get add addresses without sorting
            skip = count - parseInt(offset) * parseInt(limit) - parseInt(limit);
            if(skip < 0) {
                limit = parseInt(limit) + skip;
                skip = 0;
            }
        // } else {
        //     // will get add addresses with sorting
        //     aggregate.push({$sort: {blockindex: -1}});
        //     skip = parseInt(offset) * parseInt(limit);
        // }

        if (parseInt(skip) ) {
            aggregate.push({$skip: parseInt(skip)});
        }
        if (parseInt(limit)) {
            aggregate.push({$limit: parseInt(limit)});
        }
        // aggregate.push({ $match : { _id : mongoose.Types.ObjectId("5e3eb7afca9bdb0e2adaf1c1") } });
        // aggregate.push({ $match : { "_id" : { "$gt": objID} } });
        aggregate.push({
            "$unwind": {
                "path": "$_id",
                "preserveNullAndEmptyArrays": true
            }
        });
        // aggregate.push({$gt: ["_id", "5e3eb7afca9bdb0e2adaf1c1"]});
        aggregate.push({
            "$group": {
                "_id": "$address",
                "txs": {"$push": {txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount"}},
            }
        });
        // if(offset * limit > count / 2) {
            aggregate.push({
                "$project": {
                    "_id": "$_id",
                    // "txs": { "$slice": [ {$reverseArray: "$txs" }, (parseInt(offset) * parseInt(limit)),  parseInt(limit) ] },
                    "txs": {$reverseArray: "$txs"},
                    // "txs": {$reverseArray: { "$slice": [ "$txs", skip,  limit ] } },
                    // "txs": "$txs",
                }
            });
        // } else {
        //     aggregate.push({
        //         "$project": {
        //             "_id": "$_id",
        //             "txs": "$txs",
        //         }
        //     });
        // }
        AddressToUpdate[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function (err, address) {
            console.log('err', err)
            if (address && address.length) {
                return cb(address[0]);
            } else {
                return cb(null);
            }
        });
    });
}

function getAddressTxsPublic(address, limit, cb) {
    var aggregate = [];
    var objID = mongoose.Types.ObjectId("5e3eb7afca9bdb0e2adaf1c1");
    aggregate.push({ $match : { address : address } });
    // aggregate.push({ $match: { $and: [ { address: address }, { _id: { $gt: "5e3eb7afca9bdb0e2adaf1c1" } } ] } });
    // aggregate.push({$sort:{blockindex:-1}});
    // aggregate.push({$sort:{blockindex:-1}});
    // aggregate.push({ $match : { _id : mongoose.Types.ObjectId("5e3eb7afca9bdb0e2adaf1c1") } });
    // aggregate.push({ $match : { "_id" : { "$gt": objID} } });
    aggregate.push({
        "$unwind": {
            "path": "$_id",
            "preserveNullAndEmptyArrays": true
        }
    });
    // aggregate.push({$gt: ["_id", "5e3eb7afca9bdb0e2adaf1c1"]});
    aggregate.push({
        "$group": {
            "_id": "$address",
            "txs" : { "$push": {txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount"} },
        }
    });
    aggregate.push({
        "$project": {
            "_id": "$_id",
            "txs": { "$slice": [ "$txs", -parseInt(limit) ] },
        }
    });
    AddressToUpdate[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, address) {
        console.log('err', err)
        if(address && address.length) {
            return cb(address[0]);
        } else {
            return cb(null);
        }
    });
}
function getOneConcat(address, cb) {
    AddressToUpdate[db.getCurrentConnection()].find({address: address}).sort({blockindex: -1}).exec( function(err, address) {
        if(address && address.length) {
            var addr = address[0];
            var sent = 0;
            var received = 0;
            var txs = [];
            for(var i in address) {
                if(address[i].address === 'coinbase') {
                    sent += address[i].amount;
                }
                else if(address[i].type === 'vin') {
                    sent += address[i].amount;
                }
                else if(address[i].type === 'vout') {
                    received += address[i].amount;
                }
                // txs.push({txid: address[i].txid, type: address[i].type})
            }
            var data = {
                address: address[i].address,
                sent: sent,
                received: received,
                balance: received - sent,
                last_txs: txs,
            }
            return cb(data);
        } else {
            return cb();
        }
    });
}
function getRichlist(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order == 'desc' ? -1 : 1;
    AddressToUpdate[db.getCurrentConnection()].aggregate([
        // {
        //     "$unwind": {
        //         "path": "$_id",
        //         "preserveNullAndEmptyArrays": true
        //     }
        // },
        {
            "$group": {
                "_id": "$address",
                "txs" : { "$push": {txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount", type: "$type", blockindex: "$blockindex"} },
                // "received" : { "$first": "$received" },
                // "a_id" : { "$first": "$a_id" },
                // "txid": "4028d18fa7674318ca3b2f9aaf4594125346ffb8b42e2371ca41d0e5ab99c834",
                // "txid_timestamp": "1546794007",
                // "amount": 152207000000,
                // "type": "vout",
                "sent" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: "$amount",
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vin" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                "received" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: 0,
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vout" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                // "blockindex": 5,
                // "balance" : { "$sum": "$received" },
                // "received" : { "$sum": "$received" },
                // "sent" : { "$sum": "$sent" },
            },
        },
        {
            "$project": {
                "_id": "$_id",
                // "txs": "$txs",
                "sent": "$sent",
                "received": "$received",
                "balance": {"$subtract": ['$received', '$sent']},
            }
        },
        {$sort:sort},
        {$limit: parseInt(limit)},
    ]).allowDiskUse(true).exec(function(err, address) {
        if(address && address.length) {
            return cb(address);
        } else {
            return cb(err);
        }
    });
}

function countUnique(cb) {
    // AddressToUpdate[db.getCurrentConnection()].aggregate([
    //     {
    //         "$group": {
    //             "_id": "$address"
    //         }
    //     },
    // ]).allowDiskUse(true).exec(function(err, address) {
    //     if(address) {
    //         return cb(address.length);
    //     } else {
    //         return cb(null);
    //     }
    // });

    AddressToUpdate[db.getCurrentConnection()].distinct("address", function(err, results){
        return cb(results.length);
    });
}

function countUniqueTx(address, cb) {
    AddressToUpdate[db.getCurrentConnection()].distinct("txid", { address: address }).exec(function(err, results){
        return cb(results.length);
    });
}

function countTx(address, cb) {
    AddressToUpdate[db.getCurrentConnection()].find({address : {$eq : address}}).countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}
function getAddressDetails(address, cb) {
    AddressToUpdate[db.getCurrentConnection()].aggregate([
        { $match : { address : address } },
        {
            "$group": {
                "_id": "$address",
                "address": {"$first": "$address"},
                "sent" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: "$amount",
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vin" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                "received" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: 0,
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vout" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                "amount" : { "$sum": "$amount" },
                "count" : { $sum: 1 }
            }
        },
        {
            "$project": {
                "_id": "$_id",
                "address": "$address",
                "sent": "$sent",
                "received": "$received",
                "balance": {"$subtract": ['$received', '$sent']},
                "count": "$count",
            }
        },
    ]).allowDiskUse(true).exec(function(err, results) {
        if(results && results.length) {
            return cb(results[0]);
        } else {
            return cb(err);
        }
    });
    // AddressToUpdate[db.getCurrentConnection()].find({address : {$eq : address}}, {amount: true}).exec( function (err, results) {
    //     if(err) {
    //         cb()
    //     } else {
    //         cb(results);
    //     }
    // });
}

function getAddressDetailsWithLastestTxs(address, cb) {
    AddressToUpdate[db.getCurrentConnection()].aggregate([
        { $match : { address : address } },
        // {$sort:{createdAt:-1}},
        {
            "$unwind": {
                "path": "$_id",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$group": {
                "_id": "$address",
                "address": {"$first": "$address"},
                "last_txs" : { "$push": {txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount"} },
                "sent" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: "$amount",
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vin" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                "received" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: 0,
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vout" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                "amount" : { "$sum": "$amount" },
                "count" : { $sum: 1 }
            }
        },
        {
            "$project": {
                "_id": "$_id",
                "address": "$address",
                "sent": "$sent",
                "received": "$received",
                "balance": {"$subtract": ['$received', '$sent']},
                "last_txs": { "$slice": [ "$last_txs", -100, 100 ] },
                // "last_txs": { "$slice": [ "$last_txs", 100 ] },
                // "last_txs": { "$slice": [ {$reverseArray: "$last_txs"}, 100 ] },
                // "last_txs": {$reverseArray: { "$slice": [ {$reverseArray: "$last_txs"}, 100 ] }},
                // "last_txs": { $reverseArray:{ "$slice": [ "$last_txs", 100 ] } },
                "count": "$count",
            }
        },
    ]).allowDiskUse(true).exec(function(err, results) {
        if(results && results.length) {
            return cb(results[0]);
        } else {
            return cb(err);
        }
    });
    // AddressToUpdate[db.getCurrentConnection()].find({address : {$eq : address}}, {amount: true}).exec( function (err, results) {
    //     if(err) {
    //         cb()
    //     } else {
    //         cb(results);
    //     }
    // });
}

function deleteAllWhereGte(blockindex, cb) {
    AddressToUpdate[db.getCurrentConnection()].deleteMany({blockindex: { $gte: blockindex }}, function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function getRichlistFaster(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order == 'desc' ? -1 : 1;
    AddressToUpdate[db.getCurrentConnection()].aggregate([
        // {
        //     "$unwind": {
        //         "path": "$_id",
        //         "preserveNullAndEmptyArrays": true
        //     }
        // },
        {
            "$group": {
                "_id": "$address",
                // "txs" : { "$push": {txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount", type: "$type", blockindex: "$blockindex"} },
                // "received" : { "$first": "$received" },
                // "a_id" : { "$first": "$a_id" },
                // "txid": "4028d18fa7674318ca3b2f9aaf4594125346ffb8b42e2371ca41d0e5ab99c834",
                // "txid_timestamp": "1546794007",
                // "amount": 152207000000,
                // "type": "vout",
                "sent" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: "$amount",
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vin" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                "received" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: 0,
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vout" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                // "blockindex": 5,
                // "balance" : { "$sum": "$received" },
                // "received" : { "$sum": "$received" },
                // "sent" : { "$sum": "$sent" },
            },
        },
        {
            "$project": {
                "_id": "$_id",
                // "txs": "$txs",
                "sent": "$sent",
                "received": "$received",
                "balance": {"$subtract": ['$received', '$sent']},
            }
        },
        {$sort:sort},
        {$limit: parseInt(limit)},
    ]).allowDiskUse(true).exec(function(err, address) {
        if(address && address.length) {
            return cb(address);
        } else {
            return cb(err);
        }
    });
}

function getAllFotTx(txid, cb) {
    AddressToUpdate[db.getCurrentConnection()].find({txid: txid}).exec( function(err, addresses) {
        if(addresses) {
            return cb(addresses);
        } else {
            return cb(null);
        }
    });
}

function getCoinbaseSupply(cb) {
    // AddressToUpdate[db.getCurrentConnection()].findOne({a_id: 'coinbase'}, function(err, address) {
    //     if (address) {
    //         return cb(address.sent);
    //     } else {
    //         return cb();
    //     }
    // });
    AddressToUpdate[db.getCurrentConnection()].aggregate([
        { $match : { address : 'coinbase' } },
        {
            "$group": {
                "_id": "$address",
                "address": {"$first": "$address"},
                "sent" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: "$amount",
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vin" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
            }
        }
    ]).allowDiskUse(true).exec(function(err, results) {
        if(results && results.length) {
            return cb(results[0]);
        } else {
            return cb(err);
        }
    });
}
function getBalanceSupply(cb) {
    AddressToUpdate[db.getCurrentConnection()].aggregate([
        { $match : { amount: { $gt: 0 } } },
        {
            "$group": {
                "_id": "null",
                "address": {"$first": "$address"},
                "sent" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: "$amount",
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vin" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                "received" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: 0,
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vout" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
            }
        },
        {
            "$project": {
                "_id": "$_id",
                "balance": {"$subtract": ['$received', '$sent']},
            }
        },
    ]).allowDiskUse(true).exec(function(err, results) {
        if(results && results.length) {
            return cb(results[0]);
        } else {
            return cb(err);
        }
    });
}

function getAllDuplicate(cb) {
    AddressToUpdate[db.getCurrentConnection()].aggregate([
        {$match: {"txid": "fcce3953fc41a1e16cbf38680ee39c8d2e4035cf66566252dc902b82dc00e0b5"}}
        // {
        //     $group : {
        //         "_id": "$txid",
        //         "count": {$sum: 1}
        //     }
        // },
        // {"$match": {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} } },
    ]).exec(function(err, results) {
        cb(results);
    })
}

function getOneJoinTest(address, limit, offset, cb) {
    var aggregate = [];
    var objID = mongoose.Types.ObjectId("5e121463793f7704fed73042");
    aggregate.push({ $match : { address : address } });
    // aggregate.push({ $match: { $and: [ { address: address }, { _id: { $gt: "5e3eb7afca9bdb0e2adaf1c1" } } ] } });
    // aggregate.push({$sort:{blockindex:-1}});
    aggregate.push({$sort:{blockindex:-1}});
    if(parseInt(offset)) {
        aggregate.push({$skip: parseInt(offset) * parseInt(limit)});
    }
    if(parseInt(limit)) {
        aggregate.push({$limit: parseInt(limit)});
    }
    // aggregate.push({ $match : { _id : mongoose.Types.ObjectId("5e3eb7afca9bdb0e2adaf1c1") } });
    // aggregate.push({ $match : { "_id" : { "$gt": objID} } });
    aggregate.push({
        "$unwind": {
            "path": "$_id",
            "preserveNullAndEmptyArrays": true
        }
    });
    // aggregate.push({$gt: ["_id", "5e3eb7afca9bdb0e2adaf1c1"]});
    aggregate.push({
        "$group": {
            "_id": "$address",
            "txs" : { "$push": {"_id": "$_id", txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount", type: "$type", blockindex: "$blockindex"} },
            // "received" : { "$first": "$received" },
            // "a_id" : { "$first": "$a_id" },
            // "txid": "4028d18fa7674318ca3b2f9aaf4594125346ffb8b42e2371ca41d0e5ab99c834",
            // "txid_timestamp": "1546794007",
            "amount": {$sum: "$amount"},
            // "type": "vout",
            // "blockindex": 5,
            "createdAt" : { "$first": "$createdAt" },
            "updatedAt" : { "$first": "$updatedAt" },
        }
    });
    AddressToUpdate[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, address) {
        if(address && address.length) {
            return cb(address[0]);
        } else {
            return cb(null);
        }
    });
}
module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.count = count;
module.exports.estimatedDocumentCount = estimatedDocumentCount;
module.exports.getMany = getMany;
module.exports.getOneJoin = getOneJoin;
module.exports.getRichlist = getRichlist;
module.exports.countUnique = countUnique;
module.exports.deleteAllWhereGte = deleteAllWhereGte;
module.exports.getRichlistFaster = getRichlistFaster;
module.exports.getAllFotTx = getAllFotTx;
module.exports.countUniqueTx = countUniqueTx;
module.exports.countTx = countTx;
module.exports.getAddressDetails = getAddressDetails;
module.exports.getAddressDetailsWithLastestTxs = getAddressDetailsWithLastestTxs;
module.exports.getCoinbaseSupply = getCoinbaseSupply;
module.exports.getBalanceSupply = getBalanceSupply;
module.exports.getAllDuplicate = getAllDuplicate;
module.exports.getOneJoinTest = getOneJoinTest;
module.exports.getOneConcat = getOneConcat;
module.exports.getAddressTxs = getAddressTxs;
module.exports.getAddressTxsPublic = getAddressTxsPublic;
