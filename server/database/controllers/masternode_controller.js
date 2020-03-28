var Masternode = require('../models/masternode');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order == 'asc' ? 1 : -1;;
    Masternode[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function updateOne(obj, cb) { // update or create
    Masternode[db.getCurrentConnection()].findOne({addr: obj.addr}, function(err, masternode) {
        if(err) {
            return cb(err);
        }
        if(masternode) { // exist
            masternode.rank = obj.rank,
            masternode.network = obj.network,
            masternode.txhash = obj.txhash,
            masternode.outidx = obj.outidx,
            masternode.pubkey = obj.pubkey,
            masternode.collateral = obj.collateral,
            masternode.status = obj.status,
            masternode.addr = obj.addr,
            masternode.version = obj.version,
            masternode.lastseen = obj.lastseen,
            masternode.activetime = obj.activetime,
            masternode.lastpaid = obj.lastpaid
            masternode.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else { // create new
            // console.log('new')
            var newMasternode = new Masternode[db.getCurrentConnection()]({
                rank: obj.rank,
                network: obj.network,
                txhash: obj.txhash,
                outidx: obj.outidx,
                pubkey: obj.pubkey,
                collateral: obj.collateral,
                status: obj.status,
                addr: obj.addr,
                version: obj.version,
                lastseen: obj.lastseen,
                activetime: obj.activetime,
                lastpaid: obj.lastpaid
            });
            newMasternode.save(function(err) {
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

function getOne(addr, cb) {
    Masternode[db.getCurrentConnection()].findOne({addr: addr}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(addr, cb) {
    Masternode[db.getCurrentConnection()].deleteOne({addr: addr}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Masternode[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function count(cb) {
    Masternode[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function estimatedDocumentCount(cb) {
    Masternode[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function getCollateralCount(cb) {
    var aggregate = [];
    aggregate.push({
        "$match": {
            "collateral": {
                "$exists": true,
                "$ne": null
            }
        }
    });
    aggregate.push({$group: {
        _id: "$collateral",
        collateral: {$first: "$collateral"},
        count: { $sum: 1 },
    }});
    aggregate.push({$project : {
        _id : 0 ,
        collateral : 1 ,
        count : 1,
        originalMasternodes : {"$divide": ['$collateral', 1000000]},
        total : {"$multiply": ['$count', {"$divide": ['$collateral', 1000000]}]}
    }});
    aggregate.push({$sort: {collateral: 1}});
    Masternode[db.getCurrentConnection()].aggregate(aggregate).exec( function(err, masternodes) {
        // Tx[db.getCurrentConnection()].find({}).distinct('blockhash').exec( function(err, tx) {
        if(masternodes) {
            return cb(masternodes);
        } else {
            return cb();
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
module.exports.getCollateralCount = getCollateralCount;
