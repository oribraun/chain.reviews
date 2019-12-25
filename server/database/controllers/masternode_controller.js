var Masternode = require('../models/masternode');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Masternode.find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function updateOne(obj, cb) { // update or create
    Masternode.findOne({addr: obj.addr}, function(err, masternode) {
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
            var newMasternode = new Masternode({
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
    Masternode.findOne({addr: addr}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(addr, cb) {
    Masternode.deleteOne({addr: addr}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Masternode.deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
